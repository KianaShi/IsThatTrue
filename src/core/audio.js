// Synthesised effects and ambience, plus Leo's recorded investigation loop.
// Two independent channels: SFX (the `enabled` flag) and an ambient score
// (the `musicEnabled` flag) so the settings toggles stay honest.
export function createAudio() {
	let ctx = null;
	let on = true;
	let musicOn = true;
	let music = null;

	const ac = () => {
		if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
		if (ctx.state === 'suspended') ctx.resume();
		return ctx;
	};
	const ready = () => (on ? ac() : null);

	function tone(freq, { dur = 0.08, gain = 0.04, type = 'sine', slide = 0, delay = 0 } = {}) {
		const c = ready();
		if (!c) return;
		const t0 = c.currentTime + delay;
		const osc = c.createOscillator();
		const amp = c.createGain();
		osc.type = type;
		osc.frequency.setValueAtTime(freq, t0);
		if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t0 + dur);
		amp.gain.setValueAtTime(0.0001, t0);
		amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.008);
		amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
		osc.connect(amp).connect(c.destination);
		osc.start(t0);
		osc.stop(t0 + dur + 0.02);
	}

	// ── ambient score ─────────────────────────────────────────────
	// A low winter drone, looped wind through a wandering bandpass, and a
	// sparse bell tolling somewhere far off in the trees.
	function buildMusic() {
		const c = ac();

		const master = c.createGain();
		master.gain.setValueAtTime(0.0001, c.currentTime);
		master.gain.exponentialRampToValueAtTime(0.15, c.currentTime + 3.5);
		master.connect(c.destination);
		const sources = []; // every long-running source, so stopMusic() can end them

		// Drone: root, a detuned twin for slow beating, and a hollow fifth.
		const filter = c.createBiquadFilter();
		filter.type = 'lowpass';
		filter.frequency.value = 260;
		const droneGain = c.createGain();
		droneGain.gain.value = 0.5;
		[[55, 0.55], [55.4, 0.55], [82.4, 0.3]].forEach(([f, g]) => {
			const o = c.createOscillator();
			o.type = 'sine';
			o.frequency.value = f;
			const og = c.createGain();
			og.gain.value = g;
			o.connect(og).connect(filter);
			o.start();
			sources.push(o);
		});
		filter.connect(droneGain).connect(master);
		const swell = c.createOscillator();
		swell.frequency.value = 0.05;
		const swellGain = c.createGain();
		swellGain.gain.value = 0.16;
		swell.connect(swellGain).connect(droneGain.gain);
		swell.start();
		sources.push(swell);

		// Wind.
		const frames = c.sampleRate * 4;
		const buf = c.createBuffer(1, frames, c.sampleRate);
		const data = buf.getChannelData(0);
		for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
		const src = c.createBufferSource();
		src.buffer = buf;
		src.loop = true;
		const bp = c.createBiquadFilter();
		bp.type = 'bandpass';
		bp.frequency.value = 420;
		bp.Q.value = 0.55;
		const windGain = c.createGain();
		windGain.gain.value = 0.05;
		const gust = c.createOscillator();
		gust.frequency.value = 0.07;
		const gustGain = c.createGain();
		gustGain.gain.value = 240;
		gust.connect(gustGain).connect(bp.frequency);
		gust.start();
		src.connect(bp).connect(windGain).connect(master);
		src.start();
		sources.push(gust, src);

		// A distant bell every few seconds, sometimes.
		const bellTimer = setInterval(() => {
			if (!music || Math.random() < 0.55) return;
			const t0 = c.currentTime + 0.05;
			[[196, 0.045], [392.5, 0.02], [588, 0.011]].forEach(([f, g]) => {
				const o = c.createOscillator();
				o.type = 'sine';
				o.frequency.value = f;
				const amp = c.createGain();
				amp.gain.setValueAtTime(0.0001, t0);
				amp.gain.exponentialRampToValueAtTime(g, t0 + 0.02);
				amp.gain.exponentialRampToValueAtTime(0.0001, t0 + 4.2);
				o.connect(amp).connect(master);
				o.start(t0);
				o.stop(t0 + 4.4);
			});
		}, 9000);

		return { master, bellTimer, sources };
	}

	function startMusic() {
		if (music || !musicOn) return;
		try { music = buildMusic(); } catch { /* no audio device — stay silent */ }
	}

	function stopMusic() {
		if (!music) return;
		const m = music;
		music = null;
		clearInterval(m.bellTimer);
		const release = () => {
			m.sources.forEach((s) => { try { s.stop(); } catch { /* already stopped */ } });
			try { m.master.disconnect(); } catch { /* already gone */ }
		};
		try {
			const t = ac().currentTime;
			m.master.gain.cancelScheduledValues(t);
			m.master.gain.setTargetAtTime(0.0001, t, 0.4);
			setTimeout(release, 1800);
		} catch { release(); }
	}

	// The recorded loop takes over during an investigation. A generation token
	// prevents an old play promise or fade from affecting a newer session.
	const TRACK_SRC = new URL('../../odyssey_60s_loop.wav', import.meta.url).href;
	const TRACK_VOLUME = 0.55;
	let track = null;
	let trackWanted = false;
	let trackStarting = false;
	let trackGeneration = 0;
	let fadeTimer = 0;

	function cancelTrackTransition() {
		clearInterval(fadeTimer);
		trackStarting = false;
		return ++trackGeneration;
	}

	function fadeTrack(target, ms, generation, done = () => {}) {
		clearInterval(fadeTimer);
		const from = track.volume;
		const started = performance.now();
		fadeTimer = setInterval(() => {
			if (generation !== trackGeneration) return;
			const k = Math.min(1, (performance.now() - started) / ms);
			track.volume = Math.max(0, Math.min(1, from + (target - from) * k));
			if (k === 1) { clearInterval(fadeTimer); done(); }
		}, 40);
	}

	function playTrack() {
		if (!musicOn || !trackWanted || trackStarting) return;
		const generation = cancelTrackTransition();
		stopMusic();
		if (!track) { track = new Audio(TRACK_SRC); track.loop = true; }
		track.currentTime = 0;
		track.volume = 0;
		trackStarting = true;
		track.play().then(() => {
			if (generation !== trackGeneration) return;
			trackStarting = false;
			fadeTrack(TRACK_VOLUME, 1200, generation);
		}).catch(() => {
			if (generation !== trackGeneration) return;
			trackStarting = false;
			startMusic(); // Keep ambience if the file cannot play.
		});
	}

	function haltTrack(immediate = false) {
		const generation = cancelTrackTransition();
		if (!track) return;
		if (immediate) { track.pause(); track.volume = 0; return; }
		fadeTrack(0, 900, generation, () => track.pause());
	}

	return {
		set enabled(v) { on = v; },
		get enabled() { return on; },
		set musicEnabled(v) {
			if (musicOn === v) return;
			musicOn = v;
			if (!v) { stopMusic(); haltTrack(true); return; }
			if (trackWanted) playTrack(); else startMusic();
		},
		get musicEnabled() { return musicOn; },
		// Audio contexts need a user gesture; call once on the first tap.
		unlock() {
			if (!musicOn) return;
			if (trackWanted) { if (!track || track.paused) playTrack(); }
			else startMusic();
		},
		startTrack() {
			if (trackWanted && (trackStarting || (track && !track.paused))) return;
			trackWanted = true;
			playTrack();
		},
		stopTrack() {
			if (!trackWanted) return;
			trackWanted = false;
			haltTrack();
			if (musicOn) startMusic();
		},

		tick() { tone(2100, { dur: 0.05, gain: 0.03 }); },
		confirm() { tone(680, { dur: 0.07, gain: 0.045 }); tone(1020, { dur: 0.09, gain: 0.04, delay: 0.06 }); },
		back() { tone(520, { dur: 0.08, gain: 0.035, slide: -180 }); },
		deny() { tone(160, { dur: 0.1, gain: 0.045, type: 'sawtooth' }); },
		clue() { tone(1318, { dur: 0.1, gain: 0.05 }); tone(1975, { dur: 0.18, gain: 0.04, delay: 0.08 }); },
		solve() { tone(523, { dur: 0.22, gain: 0.05 }); tone(659, { dur: 0.28, gain: 0.05, delay: 0.16 }); tone(880, { dur: 0.5, gain: 0.05, delay: 0.34 }); },
		fail() { tone(220, { dur: 0.3, gain: 0.055, type: 'triangle' }); tone(146.8, { dur: 0.65, gain: 0.055, type: 'triangle', delay: 0.26 }); }
	};
}
