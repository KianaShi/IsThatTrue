const $ = name => document.querySelector(`[data-slot="${name}"]`);

export function createHud({ onTool }) {
	const root = document.getElementById('hud');
	const toastBox = $('toast');
	const hint = $('hint');
	const timerEl = $('hud-timer');
	const pips = $('hud-pips');

	let toastTimer = 0;
	let hintTimer = 0;

	root.addEventListener('click', event => {
		const tool = event.target.closest('[data-tool]');
		if (tool) { onTool(tool.dataset.tool); tool.blur(); }
	});

	return {
		show() { root.hidden = false; },
		hide() { root.hidden = true; },

		setCase(storyName, diffLabel) {
			$('hud-story').textContent = storyName;
			$('hud-diff').textContent = diffLabel;
		},

		// null hides the timer entirely (Timer: off in settings).
		setTimer(seconds) {
			if (seconds === null) {
				timerEl.parentElement.classList.add('no-timer');
				return;
			}
			timerEl.parentElement.classList.remove('no-timer');
			const total = Math.max(0, Math.ceil(seconds));
			timerEl.textContent = `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
			timerEl.classList.toggle('low', total <= 30);
		},

		setClues(found, total) {
			pips.innerHTML = Array.from({ length: total }, (_, i) =>
				`<i class="${i < found ? 'got' : ''}"></i>`).join('');
			$('hud-clues').textContent = `Clues ${found} / ${total}`;
		},

		toast(text, ms = 3400) {
			toastBox.textContent = text;
			toastBox.classList.add('on');
			clearTimeout(toastTimer);
			toastTimer = setTimeout(() => toastBox.classList.remove('on'), ms);
		},

		setHint(text) {
			hint.textContent = text;
			hint.classList.remove('gone');
			clearTimeout(hintTimer);
			hintTimer = setTimeout(() => hint.classList.add('gone'), 9000);
		},

		// Turn a square over: show its tile card. The close button carries
		// data-tool="close-tile" and is routed back through onTool.
		showTile(tile, squareName) {
			const KINDS = { clue: 'Clue', photo: 'Photograph', footage: 'Footage', false: 'False Lead' };
			const kind = $('tile-kind');
			kind.textContent = KINDS[tile.kind] || 'Evidence';
			kind.dataset.kind = tile.kind;
			$('tile-sq').textContent = squareName;
			$('tile-label').textContent = tile.label || 'Evidence';
			$('tile-text').textContent = tile.text || '';
			document.querySelectorAll('.tile-dig-reveal').forEach(n => n.remove());
			const media = $('tile-media');
			media.innerHTML = '';
			media.hidden = !tile.media;
			if (tile.media && tile.kind === 'footage') {
				const video = document.createElement('video');
				video.src = tile.media;
				video.autoplay = true;
				video.loop = true;
				video.muted = true;
				video.playsInline = true;
				video.setAttribute('playsinline', '');
				video.controls = true;
				media.appendChild(video);
			} else if (tile.media) {
				const img = document.createElement('img');
				img.src = tile.media;
				img.alt = tile.label || 'Evidence photo';
				media.appendChild(img);
			}
			$('tile').hidden = false;
		},

		// Append the Dig In payoff beneath the base description.
		revealDig(text) {
			const p = document.createElement('p');
			p.className = 'tile-text tile-dig-reveal';
			p.textContent = text;
			const shown = document.querySelectorAll('.tile-dig-reveal');
			(shown.length ? shown[shown.length - 1] : $('tile-text')).after(p);
		},

		setDigEnabled(on) {
			const btn = document.querySelector('[data-tool="dig"]');
			if (btn) btn.disabled = !on;
		},

		hideTile() {
			const media = $('tile-media');
			const video = media.querySelector('video');
			if (video) video.pause();
			media.innerHTML = '';
			$('tile').hidden = true;
		},

		get tileOpen() { return !$('tile').hidden; }
	};
}
