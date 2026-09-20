const $ = name => document.querySelector(`[data-slot="${name}"]`);

export function createHud({ onTool }) {
	const root = document.getElementById('hud');
	const toastBox = $('toast');
	const hint = $('hint');
	const timerEl = $('hud-timer');
	const fuse = $('hud-fuse');
	const fuseLine = $('hud-fuse-line');

	let toastTimer = 0;
	let hintTimer = 0;

	root.addEventListener('click', event => {
		const tool = event.target.closest('[data-tool]');
		if (tool) { onTool(tool.dataset.tool); tool.blur(); }
	});

	return {
		show() { root.hidden = false; },
		hide() { root.hidden = true; },

		setCase(storyName) {
			$('hud-story').textContent = storyName;
		},

		/**
		 * Show the countdown: the time as text and a fuse under it that burns down
		 * from full to nothing. A null time hides both (Timer: off in settings).
		 * @param {number|null} seconds - Time left, or null to hide the timer.
		 * @param {number} [limit] - The full time allowed, for the fuse length.
		 * @returns {void}
		 */
		setTimer(seconds, limit = 0) {
			if (seconds === null) {
				timerEl.parentElement.classList.add('no-timer');
				return;
			}
			timerEl.parentElement.classList.remove('no-timer');
			const total = Math.max(0, Math.ceil(seconds));
			timerEl.textContent = `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
			timerEl.classList.toggle('low', total <= 30);
			fuse.classList.toggle('low', total <= 30);
			fuseLine.style.width = `${limit ? Math.min(100, Math.max(0, seconds / limit * 100)) : 100}%`;
		},

		/**
		 * Show how many pieces of evidence are on the board.
		 * @param {number} total - Pieces of evidence dealt.
		 * @returns {void}
		 */
		setClues(total) {
			$('hud-clues').textContent = `Clues: ${total}`;
		},

		toast(text, ms = 3400) {
			toastBox.textContent = text;
			toastBox.classList.toggle('over-card', !$('tile').hidden);
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

		/**
		 * Append one level of Dig In detail beneath the card's base text, after
		 * any levels already shown, so they read in the order they were dug.
		 * @param {string} text - The detail to reveal.
		 * @returns {void}
		 */
		revealDig(text) {
			const p = document.createElement('p');
			p.className = 'tile-text tile-dig-reveal';
			p.textContent = text;
			const shown = document.querySelectorAll('.tile-dig-reveal');
			(shown.length ? shown[shown.length - 1] : $('tile-text')).after(p);
		},

		/**
		 * Enable or lock the card's Dig In button.
		 * @param {boolean} on - True while the piece still has levels left to dig.
		 * @returns {void}
		 */
		setDigEnabled(on) {
			const btn = document.querySelector('[data-tool="dig"]');
			if (btn) btn.disabled = !on;
		},

		/**
		 * Show whether the open card's evidence is starred.
		 * @param {boolean} on - True when it is starred.
		 * @returns {void}
		 */
		setStarred(on) {
			const btn = document.querySelector('[data-tool="star"]');
			if (!btn) return;
			btn.classList.toggle('on', on);
			btn.setAttribute('aria-pressed', String(on));
			btn.setAttribute('aria-label', on ? 'Remove the star' : 'Star this evidence');
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
