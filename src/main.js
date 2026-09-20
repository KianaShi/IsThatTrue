import * as THREE from 'three';
import { createStage } from './scene/stage.js';
import { createLighting } from './scene/lighting.js';
import { createSky } from './world/sky.js';
import { createGround } from './world/ground.js';
import { createForest } from './world/forest.js';
import { createSnowfall } from './world/snowfall.js';
import { createProps } from './world/props.js';
import { createBoard, worldToSquare } from './game/board.js';
import { createEvidencePieces, MAX_TIER } from './game/evidencePieces.js';
import { createBursts } from './game/fx.js';
import { STORIES, LEVELS, fmt, buildDeck } from './game/cases.js';
import { evaluate } from './game/evaluation.js';
import { createHud } from './ui/hud.js';
import { createMenu, loadSettings } from './ui/menu.js';
import { createAudio } from './core/audio.js';

const settings = loadSettings();
const audio = createAudio();
audio.enabled = settings.sound === 'on';
audio.musicEnabled = settings.music === 'on';
// Audio contexts need a gesture; the first tap anywhere wakes the score.
addEventListener('pointerdown', () => audio.unlock(), { once: true });

const boot = document.getElementById('boot');
const bootMsg = document.querySelector('[data-slot="boot"]');
const canvas = document.getElementById('stage');

const stage = createStage(canvas, settings.quality);
const { scene, camera, renderer } = stage;

bootMsg.textContent = 'Raising the wood…';

const lighting = createLighting(scene, stage.state.cfg);
const sky = createSky(scene, lighting.sunDir);
const ground = createGround(scene);
const forest = createForest(scene, stage.state.cfg);
const snowfall = createSnowfall(scene, stage.state.cfg);
const props = createProps(scene);
const bursts = createBursts(scene);

// One-off irradiance probe baked from the sky dome alone — cheap, and it is
// what gives the snow and the stone their sense of a cold open night.
{
	const envScene = new THREE.Scene();
	envScene.add(new THREE.Mesh(new THREE.SphereGeometry(20, 32, 24), sky.dome.material));
	const pmrem = new THREE.PMREMGenerator(renderer);
	scene.environment = pmrem.fromScene(envScene, 0, 0.5, 60).texture;
	scene.environmentIntensity = 0.9;
	pmrem.dispose();
}

await Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 2500))]);

const board = createBoard(scene);
const evidencePieces = createEvidencePieces(scene);

const SUSPECTS = [
	{ key: 'ethan', role: 'Research Scientist', name: 'Ethan Cole', img: './assets/ethan-cole.jpg' },
	{ key: 'avery', role: 'Security Engineer', name: 'Avery Chen', img: './assets/avery-chen.jpg' },
	{ key: 'olivia', role: 'Product Manager', name: 'Olivia Grant', img: './assets/olivia-grant.jpg' },
	{ key: 'noah', role: 'Temporary Contractor', name: 'Noah Reed', img: './assets/noah-reed.jpg' }
];
const SLOTS_PER_SUSPECT = 6;

// The real answer lives here, not on the thinking board — it's asked as two
// direct questions on the accusation screen.
const QUESTIONS = [
	{ key: 'leaker', text: 'Who leaked the original video?', answer: 'noah' },
	{ key: 'editor', text: 'Who altered the second video?', answer: 'olivia' }
];
const accuseAnswers = { leaker: null, editor: null };

snowfall.setDensity(settings.snow === 'heavy' ? 1 : settings.snow === 'light' ? 0.45 : 0);

// ── state ────────────────────────────────────────────────────────

let playing = false;
let needed = 0;
let timeLeft = 0;
let elapsed = 0;
// The dealt board: 0x88 square -> tile from the story's deck.
const tiles = new Map();
let currentSq = -1;
let dugCount = 0, discardedCount = 0;
// Every tile dealt this game, discarded ones included, for the end-of-case evaluation.
let fullDeck = [];
// Assignments are the only place evidence actually "moves" — Hold just
// flags a tile as kept; the piece stays exactly where it was dealt.
const assignments = { ethan: [], avery: [], olivia: [], noah: [] };

const hud = createHud({ onTool: tool => {
	if (tool === 'abandon') toTitle();
	else if (tool === 'close-tile') closeTile();
	else if (tool === 'dig') doDig();
	else if (tool === 'hold') doHold();
	else if (tool === 'discard') doDiscard();
	else if (tool === 'submit') doSubmit();
	else if (tool === 'suspects') openSuspectboard();
	else if (tool === 'close-suspects') closeSuspectboard();
	else if (tool === 'accuse') openAccuseScreen();
	else if (tool === 'close-accuse') closeAccuseScreen();
} });

// ── evidence actions ────────────────────────────────────────────

// Piece for each tier, indexed by a tile's `dugLevel`.
const PIECE_NAMES = ['pawn', 'knight', 'bishop', 'king'];

/**
 * Path of the pre-rendered icon for a tile's current piece. Icons are static
 * PNGs (see tools/render-piece.html), so no card ever renders 3D at runtime.
 * The pawn's files carry no piece name (chess-white.png).
 * @param {{dugLevel: number, side?: string}} t - A deck tile.
 * @returns {string} Image URL.
 */
const pieceIcon = t => `./assets/chess/web/chess-${t.dugLevel ? PIECE_NAMES[t.dugLevel] + '-' : ''}${t.side === 'obsidian' ? 'black' : 'white'}.png`;

/**
 * Spend one Dig In on the piece whose card is open: reveal its next level of
 * detail and promote the piece one tier (pawn, knight, bishop, king).
 * `tile.dugLevel` counts how many levels are open; the button locks once every
 * level (up to MAX_TIER) has been dug. Does nothing if no card is open.
 * @returns {void}
 */
function doDig() {
	const tile = tiles.get(currentSq);
	if (!tile) return;
	const levels = tile.digLevels || [];
	const max = Math.min(levels.length, MAX_TIER);
	if (tile.dugLevel >= max) return;
	if (tile.dugLevel === 0) { dugCount++; hud.setClues(dugCount, needed); }
	hud.revealDig(levels[tile.dugLevel] || 'Nothing further surfaces.');
	tile.dugLevel++;
	hud.setDigEnabled(tile.dugLevel < max);
	tile.side = evidencePieces.upgrade(currentSq, tile.dugLevel);
	audio.clue();
	renderBasketBar();
}

// How many held-but-unplaced pieces the basket can carry at once.
const BASKET_SIZE = 4;

// Hold: the piece stays exactly where it is on the board. It just gets
// flagged as worth revisiting, so it shows up in the suspect board's
// "held" tray — placing it against a suspect is a separate decision.
function doHold() {
	const tile = tiles.get(currentSq);
	if (!tile || tile.held) return;
	if ([...tiles.values()].filter(t => t.held && !t.placedTo).length >= BASKET_SIZE) {
		hud.toast(`The basket holds ${BASKET_SIZE} pieces. Place one under a suspect first.`);
		return;
	}
	tile.held = true;
	audio.confirm();
	renderCaseboard();
	closeTile();
}

function doDiscard() {
	const tile = tiles.get(currentSq);
	if (!tile) return;
	if (tile.placedTo) assignments[tile.placedTo] = assignments[tile.placedTo].filter(i => i.sq !== currentSq);
	tiles.delete(currentSq);
	discardedCount++;
	evidencePieces.hide(currentSq);
	audio.deny();
	renderCaseboard();
	closeTile();
}

function placeEvidence(sq, key) {
	const tile = tiles.get(sq);
	if (!tile || tile.placedTo || assignments[key].length >= SLOTS_PER_SUSPECT) return;
	tile.placedTo = key;
	assignments[key].push({ sq, label: tile.label });
	renderCaseboard();
}

function unassign(key, sq) {
	const idx = assignments[key].findIndex(i => i.sq === sq);
	if (idx < 0) return;
	assignments[key].splice(idx, 1);
	const tile = tiles.get(sq);
	if (tile) tile.placedTo = null;
	renderCaseboard();
}

function doSubmit() {
	const resultEl = document.querySelector('[data-slot="cb-result"]');
	if (QUESTIONS.some(q => !accuseAnswers[q.key])) {
		resultEl.textContent = 'Answer both questions before you call it.';
		return;
	}
	const results = QUESTIONS.map(q => accuseAnswers[q.key] === q.answer);
	const allRight = results.every(Boolean);
	resultEl.textContent = '';
	endCase(allRight);
}

/**
 * Open the suspect board on whichever suspect was last shown, with the basket
 * drawer closed so the player always lands on the slots first.
 * @returns {void}
 */
function openSuspectboard() {
	sbBasketOpen = false;
	renderCaseboard();
	document.querySelector('[data-slot="suspectboard"]').hidden = false;
	audio.confirm();
}

/**
 * Hide the suspect board (the basket drawer state is reset on the next open).
 * @returns {void}
 */
function closeSuspectboard() {
	document.querySelector('[data-slot="suspectboard"]').hidden = true;
	audio.back();
}

// The accusation screen: a separate, deliberate "answer for real" step —
// the suspect board above it is scratch space and is never scored.
function openAccuseScreen() {
	closeSuspectboard();
	document.querySelector('[data-slot="cb-result"]').textContent = '';
	renderAccuseScreen();
	document.querySelector('[data-slot="accusescreen"]').hidden = false;
	audio.confirm();
}

function closeAccuseScreen() {
	document.querySelector('[data-slot="accusescreen"]').hidden = true;
	audio.back();
}

function renderAccuseScreen() {
	const el = document.querySelector('[data-slot="ac-questions"]');
	el.innerHTML = QUESTIONS.map(q => `
		<div class="ac-q">
			<p class="ac-q-text">${q.text}</p>
			<div class="ac-choices">${SUSPECTS.map(s => `
				<button class="ac-choice ${accuseAnswers[q.key] === s.key ? 'selected' : ''}" data-choose="${q.key}:${s.key}">${s.name}</button>`).join('')}</div>
		</div>`).join('');
}

document.querySelector('[data-slot="accusescreen"]').addEventListener('click', event => {
	const choice = event.target.closest('[data-choose]');
	if (!choice) return;
	const [key, suspect] = choice.dataset.choose.split(':');
	accuseAnswers[key] = suspect;
	renderAccuseScreen();
});


// Which suspect the board is showing, and whether the basket drawer is up.
let sbIndex = 0;
let sbBasketOpen = false;

/**
 * Markup for one tile in the suspect board: the piece as it currently stands
 * (its rendered icon, black or white) over the evidence's name. Used for filled slots
 * and for the basket drawer alike.
 * @param {number} sq - 0x88 board square of the evidence.
 * @param {object} t - The deck tile.
 * @param {string} attr - Attributes for the button (e.g. a data-place or data-unassign hook).
 * @param {string} [badge] - Extra markup appended inside the button.
 * @returns {string} HTML for the tile.
 */
function pieceTile(sq, t, attr, badge = '') {
	return `<button type="button" class="sb-slot filled" ${attr}>
		<span class="pc"><img src="${pieceIcon(t)}" alt="${PIECE_NAMES[t.dugLevel]}" draggable="false"></span>
		<span class="sb-slot-label"><span class="lbl">${t.label}</span></span>${badge}
	</button>`;
}

/**
 * Keep every suspect-board label on one line. A label that fits is left alone;
 * one that overflows gets the `marquee` class and the distance it has to slide,
 * so long evidence names scroll left and right instead of wrapping or clipping.
 * Must run after layout, so callers schedule it with requestAnimationFrame.
 * @returns {void}
 */
function fitLabels() {
	document.querySelectorAll('.sb-slot-label').forEach(el => {
		const text = el.firstElementChild;
		const overflow = text ? Math.ceil(text.scrollWidth - el.clientWidth) : 0;
		el.classList.toggle('marquee', overflow > 1);
		if (overflow > 1) {
			el.style.setProperty('--shift', `-${overflow + 2}px`);
			el.style.setProperty('--dur', `${Math.max(3, overflow / 22 + 2.5).toFixed(1)}s`);
		}
	});
}

/**
 * Redraw the always-visible basket strip: every held-but-unplaced piece gets a
 * chip showing its current piece icon, board square and name.
 * @returns {void}
 */
function renderBasketBar() {
	const held = [...tiles.entries()].filter(([, t]) => t.held && !t.placedTo);
	const count = document.querySelector('[data-slot="basketbar-count"]');
	count.textContent = `${held.length}/${BASKET_SIZE}`;
	count.classList.toggle('full', held.length >= BASKET_SIZE);
	const slots = document.querySelector('[data-slot="basketbar-slots"]');
	slots.innerHTML = held.length ? held.map(([sq, t]) => `
		<div class="basket-chip"><img class="chip-icon" src="${pieceIcon(t)}" alt="${PIECE_NAMES[t.dugLevel]}" draggable="false"><span class="chip-sq">${squareName(sq)}</span>${t.label}</div>`).join('')
		: '<span class="basketbar-empty">Add evidence to fill it.</span>';
}

/**
 * Redraw the basket strip and the suspect board. The board shows one suspect
 * at a time; held-but-unplaced evidence lives in the basket drawer, where
 * tapping a piece places it under whoever is on screen, and tapping a placed
 * piece sends it back to the basket.
 * @returns {void}
 */
function renderCaseboard() {
	renderBasketBar();
	const s = SUSPECTS[sbIndex];
	const held = [...tiles.entries()].filter(([, t]) => t.held && !t.placedTo);
	const full = assignments[s.key].length >= SLOTS_PER_SUSPECT;

	document.querySelector('[data-slot="sb-suspect"]').innerHTML = `
		<img src="${s.img}" alt="${s.name}">
		<span class="cb-sname">${s.name}</span>
		<p class="sb-role">${s.role}</p>
		<div class="sb-slots">${Array.from({ length: SLOTS_PER_SUSPECT }, (_, i) => {
			const item = assignments[s.key][i];
			const t = item && tiles.get(item.sq);
			return t
				? pieceTile(item.sq, t, `data-unassign="${s.key}:${item.sq}" title="Move back to the basket"`, '<span class="sb-slot-x">×</span>')
				: '<button type="button" class="sb-slot" data-sb="basket" aria-label="Open the basket"></button>';
		}).join('')}</div>`;

	document.querySelector('[data-slot="sb-dots"]').innerHTML = SUSPECTS.map((x, i) =>
		`<button type="button" class="${i === sbIndex ? 'on' : ''}" data-sb-go="${i}" aria-label="${x.name}"${i === sbIndex ? ' aria-current="true"' : ''}></button>`).join('');

	document.querySelector('[data-slot="cb-count"]').textContent = held.length;
	document.querySelector('[data-slot="sb-drawer"]').hidden = !sbBasketOpen;
	const basketBtn = document.querySelector('.sb-basket-btn');
	basketBtn.setAttribute('aria-expanded', String(sbBasketOpen));
	basketBtn.setAttribute('aria-label', `${sbBasketOpen ? 'Close' : 'Open'} the basket (${held.length})`);
	document.querySelector('[data-slot="sb-drawer-title"]').textContent =
		held.length ? `Basket · tap a piece to place it under ${s.name.split(' ')[0]}` : 'Basket';
	document.querySelector('[data-slot="cb-basket"]').innerHTML = held.length
		? held.map(([sq, t]) => pieceTile(sq, t, `data-place="${sq}" ${full ? 'disabled' : ''}`)).join('')
		: '<p class="cb-empty">Nothing held yet. Add evidence to the basket from the board.</p>';
	requestAnimationFrame(fitLabels);
}

document.querySelector('[data-slot="suspectboard"]').addEventListener('click', event => {
	const nav = event.target.closest('[data-sb]');
	if (nav) {
		const act = nav.dataset.sb;
		if (act === 'prev' || act === 'next') sbIndex = (sbIndex + (act === 'next' ? 1 : -1) + SUSPECTS.length) % SUSPECTS.length;
		else if (act === 'basket') sbBasketOpen = !sbBasketOpen;
		renderCaseboard();
		return;
	}
	const go = event.target.closest('[data-sb-go]');
	if (go) { sbIndex = Number(go.dataset.sbGo); renderCaseboard(); return; }
	const place = event.target.closest('[data-place]');
	if (place && !place.disabled) { placeEvidence(Number(place.dataset.place), SUSPECTS[sbIndex].key); return; }
	const un = event.target.closest('[data-unassign]');
	if (un) { const [key, sq] = un.dataset.unassign.split(':'); unassign(key, Number(sq)); }
});

const story = () => STORIES[settings.story] || STORIES.s1;
const level = () => LEVELS[settings.level] || LEVELS.easy;
const timerOn = () => settings.timer === 'on';

// ── menu ─────────────────────────────────────────────────────────

const menu = createMenu({
	settings,
	audio,
	onSetting: applySetting,
	onPaint: paintDynamic,
	onAction: (act, el) => {
		if (act === 'stories') menu.show('story', { push: true });
		else if (act === 'start') menu.show('difficulty', { push: true });
		else if (act === 'story') pickStory(el.dataset.id);
		else if (act === 'level') pickLevel(el.dataset.id);
		else if (act === 'settings') menu.show('settings', { push: true });
		else if (act === 'continue') menu.show('difficulty', { push: true });
		else if (act === 'begin') { clearInterval(countdownTimer); beginTravel(); }
		else if (act === 'retry') startGame();
		else if (act === 'quit') toTitle();
		else if (act === 'close') menu.show('title');
	}
});

function paintDynamic() {
	document.querySelectorAll('[data-act="story"]').forEach(el =>
		el.classList.toggle('picked', el.dataset.id === settings.story));
}

function pickStory(id) {
	settings.story = id;
	menu.save();
	menu.paint();
	const s = story();
	if (s.brief) { fillCasefile(s); menu.show('casefile', { push: true }); }
	else hud.toast(`${s.label} selected — ${s.name}`);
}

// ── case file data screen ──────────────────────────────────────

function fillCasefile(s) {
	const b = s.brief;
	menu.slot('cf-title', s.name.toUpperCase());
	menu.slot('cf-over', `Case Briefing · ${s.label}`);
	document.querySelector('[data-slot="cf-info"]').innerHTML = [
		['Where', b.where],
		['When', b.when]
	].map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join('');
	document.querySelector('[data-slot="cf-body"]').innerHTML =
		b.paragraphs.map(p => `<p>${p}</p>`).join('');
	document.querySelector('[data-slot="cf-suspects"]').innerHTML = b.suspects.map(p => `
		<div class="suspect">
			<img src="${p.img}" alt="Portrait of ${p.name}" loading="lazy">
			<div class="s-body">
				<div class="s-name">${p.name}</div>
				<div class="s-role">${p.role}</div>
				<p class="s-note">${p.note}</p>
			</div>
		</div>`).join('');
	document.querySelector('[data-slot="cf-suspects-note"]').textContent = b.suspectsNote;
	document.querySelector('[data-slot="cf-mission"]').innerHTML =
		b.mission.map(m => `<p class="mission-line">${m}</p>`).join('');
	document.querySelector('[data-slot="cf-mechanics"]').innerHTML =
		b.mechanics.replace(/(Dig In|Hold|Discard|5 minutes)/g, '<b>$1</b>');
}

// ── launch countdown ───────────────────────────────────────────

let countdownTimer = null;

function fillIntro() {
	const s = story();
	const l = level();
	menu.slot('intro-over', `Case File · ${s.label}`);
	menu.slot('intro-title', s.name);
	document.querySelector('[data-slot="intro-meta"]').innerHTML = [
		['Case', s.name],
		['Difficulty', l.label],
		['Evidence', `${l.clues} clues hidden at the scene`],
		['Time', timerOn() ? `${fmt(l.time)} — every piece of information costs attention` : 'No time limit']
	].map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join('');
}

function startCountdown() {
	clearInterval(countdownTimer);
	const el = document.querySelector('[data-slot="countdown"]');
	el.classList.remove('go');
	let n = 3;
	el.textContent = n;
	el.classList.remove('tick');
	void el.offsetWidth;
	el.classList.add('tick');
	countdownTimer = setInterval(() => {
		n--;
		if (n > 0) {
			el.textContent = n;
		} else {
			clearInterval(countdownTimer);
			el.textContent = 'GO';
			el.classList.add('go');
		}
		el.classList.remove('tick');
		void el.offsetWidth;
		el.classList.add('tick');
	}, 1000);
}

function pickLevel(id) {
	settings.level = id;
	menu.save();
	fillIntro();
	menu.show('intro', { push: true });
	startCountdown();
}

function applySetting(key, value) {
	if (key === 'quality') stage.setQuality(value);
	else if (key === 'sound') audio.enabled = value === 'on';
	else if (key === 'music') audio.musicEnabled = value === 'on';
	else if (key === 'snow') snowfall.setDensity(value === 'heavy' ? 1 : value === 'light' ? 0.45 : 0);
}

stage.onQuality((next, automatic) => {
	lighting.setQuality(stage.state.cfg);
	snowfall.setQuality(stage.state.cfg);
	ground.setQuality(stage.state.cfg);
	bursts.setQuality(stage.state.cfg);
	menu.set('quality', next);
	if (automatic) hud.toast(`Graphics stepped down to ${next} to hold a smooth frame rate`, 4200);
});

// The gear lives outside the screen stack so it can float over every menu.
document.getElementById('gear').addEventListener('click', () => {
	if (!menu.current || menu.current === 'settings') return;
	audio.confirm();
	menu.show('settings', { push: true });
});

// ── flow ─────────────────────────────────────────────────────────

/**
 * Deal a story's deck onto the board and spawn one evidence pawn per tile.
 * A tile's id is its square ("B7" = file B, rank 7); a missing, malformed or
 * already-taken id falls back to the opening-position layout by index. Also
 * clears every per-game piece of state (assignments, answers, dig levels).
 * @param {Array<object>} deck - Tiles from `buildDeck`; only the first 32 are placed.
 * @returns {void}
 */
function dealTiles(deck) {
	tiles.clear();
	board.clearMarks();
	evidencePieces.reset();
	for (const key of Object.keys(assignments)) assignments[key] = [];
	for (const q of QUESTIONS) accuseAnswers[q.key] = null;
	deck.forEach((tile, i) => {
		if (i >= 32) return;
		// A tile's id is its square ("B7" = file B, rank 7), which is also what
		// connectsTo refers to, so place by id. Ids that are missing, malformed
		// or already taken fall back to the index-based opening-position shape:
		// two ranks at the top (rows 0-1), two at the bottom (rows 6-7).
		const m = /^([A-H])([1-8])$/.exec(tile.id || '');
		let sq = m ? (Number(m[2]) - 1) * 16 + 'ABCDEFGH'.indexOf(m[1]) : -1;
		if (sq < 0 || tiles.has(sq)) {
			const row = i < 16 ? Math.floor(i / 8) : 6 + Math.floor((i - 16) / 8);
			sq = row * 16 + (i % 8);
		}
		tile.revealed = false;
		tile.dugLevel = 0;
		tile.side = 'ivory';
		tile.held = false;
		tile.placedTo = null;
		tiles.set(sq, tile);
		evidencePieces.spawn(sq);
	});
	renderCaseboard();
}

// ── travel: five quiet seconds between the briefing and the scene ──

let travelTimer = 0;

function beginTravel() {
	menu.hide();
	document.getElementById('travel').hidden = false;
	clearTimeout(travelTimer);
	travelTimer = setTimeout(() => {
		document.getElementById('travel').hidden = true;
		startGame();
	}, 5000);
}

function startGame() {
	const s = story();
	const l = level();
	const deck = buildDeck(s);
	needed = deck.length;
	fullDeck = deck;
	dugCount = 0;
	discardedCount = 0;
	elapsed = 0;
	timeLeft = l.time;
	dealTiles(deck);
	playing = true;
	menu.hide();
	hud.show();
	hud.setCase(s.name, l.label);
	hud.setClues(0, needed);
	hud.setTimer(timerOn() ? timeLeft : null);
	hud.setHint('Drag to look around · Tap a piece to examine it');
	stage.setAttract(false);
}

function toTitle() {
	playing = false;
	clearTimeout(travelTimer);
	document.getElementById('travel').hidden = true;
	tiles.clear();
	board.clearMarks();
	evidencePieces.reset();
	hud.hideTile();
	hud.hide();
	document.querySelector('[data-slot="suspectboard"]').hidden = true;
	document.querySelector('[data-slot="accusescreen"]').hidden = true;
	stage.setAttract(true);
	menu.show('title');
}

/**
 * Finish the case: score the run, fill the result screen and show it.
 * @param {boolean} solved - True if every accusation answer was right.
 * @param {boolean} [timedOut] - True if the clock ran out first.
 * @returns {void}
 */
function endCase(solved, timedOut = false) {
	if (!playing) return;
	playing = false;
	const report = evaluate({
		questions: QUESTIONS,
		answers: accuseAnswers,
		assignments,
		deck: fullDeck,
		chosen: Object.values(assignments).flat().map(i => tiles.get(i.sq)).filter(Boolean),
		elapsed,
		limit: timerOn() ? level().time : null,
		timedOut
	});
	document.querySelector('[data-slot="result-eval"]').innerHTML = `
		<p class="eval-profile">${report.profile.title}</p>
		<p class="eval-text">${report.profile.text}</p>
		<div class="eval-measures">${report.measures.map(m => `
			<div class="eval-row"><div><b>${m.name}</b><small>${m.question}</small></div><div class="eval-grade"><b>${m.label}</b><small>${m.note}</small></div></div>`).join('')}
		</div>`;
	if (solved) audio.solve(); else audio.fail();

	const titleEl = document.querySelector('[data-slot="result-title"]');
	titleEl.textContent = solved ? 'CASE SOLVED' : 'CASE COLD';
	titleEl.classList.toggle('cold', !solved);
	menu.slot('result-over', solved
		? 'The snow gives up its secret'
		: 'The trail went cold · the snow covered the rest');

	const l = level();
	document.querySelector('[data-slot="result-stats"]').innerHTML = [
		['Case', story().name],
		['Evidence dug', `${dugCount} / ${needed}`],
		['Discarded', discardedCount],
		['Time in the snow', fmt(elapsed)]
	].map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join('');

	setTimeout(() => {
		hud.hide();
		hud.hideTile();
		document.querySelector('[data-slot="suspectboard"]').hidden = true;
		document.querySelector('[data-slot="accusescreen"]').hidden = true;
		tiles.clear();
		board.clearMarks();
		evidencePieces.reset();
		stage.setAttract(true);
		menu.show('result');
	}, 1100);
}

// ── pointer ──────────────────────────────────────────────────────

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let downAt = null;

// Cast through the board surface and return the 0x88 square under the
// pointer, or -1 when the ray misses the field entirely.
function pickSquare(event) {
	pointer.set((event.clientX / innerWidth) * 2 - 1, -(event.clientY / innerHeight) * 2 + 1);
	raycaster.setFromCamera(pointer, camera);
	const hit = raycaster.intersectObject(board.field, false)[0];
	return hit ? worldToSquare(hit.point) : -1;
}

const squareName = sq => 'ABCDEFGH'[sq & 15] + ((sq >> 4) + 1);

/**
 * Open a piece's card. Replays every level already dug out of it and locks the
 * Dig button if none remain; Dig / Hold / Discard (routed through the hud's
 * onTool) decide what happens next.
 * @param {number} sq - 0x88 board square of the piece.
 * @param {object} tile - The deck tile dealt onto that square.
 * @returns {void}
 */
function revealTile(sq, tile) {
	currentSq = sq;
	hud.showTile(tile, squareName(sq));
	// Reopening a piece shows everything already dug out of it.
	for (let l = 0; l < tile.dugLevel; l++) hud.revealDig(tile.digLevels[l]);
	hud.setDigEnabled(tile.dugLevel < Math.min((tile.digLevels || []).length, MAX_TIER));
	audio.confirm();
}

function closeTile() {
	hud.hideTile();
	audio.back();
}

canvas.addEventListener('pointermove', event => {
	if (!playing || hud.tileOpen) { canvas.style.cursor = ''; board.setHover(-1); return; }
	const sq = pickSquare(event);
	board.setHover(sq);
	canvas.style.cursor = sq >= 0 ? 'pointer' : '';
});

canvas.addEventListener('pointerdown', event => {
	downAt = { x: event.clientX, y: event.clientY };
});

canvas.addEventListener('pointerup', event => {
	if (!playing || !downAt || hud.tileOpen) return;
	const dragged = Math.hypot(event.clientX - downAt.x, event.clientY - downAt.y) > 8;
	downAt = null;
	if (dragged) return;

	const sq = pickSquare(event);
	if (sq < 0) return;
	const tile = tiles.get(sq);
	if (!tile) {
		audio.deny();
		hud.toast('Nothing here but snow.');
		return;
	}
	revealTile(sq, tile);
});

// ── keys ─────────────────────────────────────────────────────────

addEventListener('keydown', event => {
	if (menu.current) return;
	if (event.key === 'Escape') toTitle();
});

// ── loop ─────────────────────────────────────────────────────────

let timerPaint = 0;

stage.onUpdate((dt, time) => {
	lighting.update(dt, time);
	sky.update(dt, time);
	ground.update(dt, time);
	forest.update(dt, time);
	snowfall.update(dt, time, camera);
	props.update(dt, time);
	board.update(dt, time);
	bursts.update(dt, time);

	if (playing) {
		elapsed += dt;
		if (timerOn()) {
			timeLeft -= dt;
			if (timeLeft <= 0) { endCase(false, true); return; }
		}
		timerPaint += dt;
		if (timerPaint > 0.2) {
			timerPaint = 0;
			if (timerOn()) hud.setTimer(timeLeft);
		}
	}
});

// ── boot ─────────────────────────────────────────────────────────

// Deep links for testing: ?screen=story|difficulty|settings|intro|casefile, ?play=1
const params = new URLSearchParams(location.search);
if (params.get('level') && LEVELS[params.get('level')]) settings.level = params.get('level');
if (params.get('play')) {
	fillIntro();
	startGame();
	// Headless test renders too few frames for the camera glide — snap it.
	stage.moveTo('seat', { instant: true });
	// Test hook: ?tile=real|false|photo|footage opens a card without a click.
	const probe = params.get('tile');
	if (probe) {
		const entry = [...tiles.entries()].find(([, t]) =>
			probe === 'real' ? t.real : probe === 'false' ? !t.real : t.kind === probe);
		if (entry) revealTile(entry[0], entry[1]);
	}
}
else if (params.get('screen') === 'intro') {
	fillIntro();
	menu.show('intro');
	if (params.get('travel')) beginTravel(); // test hook: skip the button tap
}
else if (params.get('screen') === 'casefile') {
	const s = story();
	if (s.brief) fillCasefile(s);
	menu.show('casefile');
}
else menu.show(params.get('screen') || 'title');

// Two frames if the tab is visible, a timer if it is not — either way the
// curtain comes down.
let curtain = false;
const raise = () => {
	if (curtain) return;
	curtain = true;
	boot.classList.add('gone');
	setTimeout(() => boot.remove(), 800);
};
requestAnimationFrame(() => requestAnimationFrame(raise));
setTimeout(raise, 1200);
