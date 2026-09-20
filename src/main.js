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
	{ key: 'ethan', name: 'Ethan Cole', img: './assets/ethan-cole.jpg' },
	{ key: 'avery', name: 'Avery Chen', img: './assets/avery-chen.jpg' },
	{ key: 'olivia', name: 'Olivia Grant', img: './assets/olivia-grant.jpg' },
	{ key: 'noah', name: 'Noah Reed', img: './assets/noah-reed.jpg' }
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

// Glyph for each tier, indexed by a tile's `dugLevel`.
const TIER_GLYPH = ['♟', '♞', '♝', '♚'];

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
	evidencePieces.upgrade(currentSq, tile.dugLevel);
	audio.clue();
	renderBasketBar();
}

// Hold: the piece stays exactly where it is on the board. It just gets
// flagged as worth revisiting, so it shows up in the suspect board's
// "held" tray — placing it against a suspect is a separate decision.
function doHold() {
	const tile = tiles.get(currentSq);
	if (!tile || tile.held) return;
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
	resultEl.textContent = allRight
		? '✓ CHECKMATE — Noah leaked it, Olivia altered it. Case closed.'
		: `Not quite — ${results.filter(Boolean).length} / ${QUESTIONS.length} correct. The trail's still open.`;
	audio[allRight ? 'solve' : 'fail']?.();
}

function openSuspectboard() {
	renderCaseboard();
	document.querySelector('[data-slot="suspectboard"]').hidden = false;
	audio.confirm();
}

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

/**
 * Redraw the always-visible basket strip: every held-but-unplaced piece gets a
 * chip showing its current tier glyph, board square and name.
 * @returns {void}
 */
function renderBasketBar() {
	const held = [...tiles.entries()].filter(([, t]) => t.held && !t.placedTo);
	const slots = document.querySelector('[data-slot="basketbar-slots"]');
	slots.innerHTML = held.length ? held.map(([sq, t]) => `
		<div class="basket-chip"><span class="glyph">${TIER_GLYPH[t.dugLevel]}</span><span class="chip-sq">${squareName(sq)}</span>${t.label}</div>`).join('')
		: '<span class="basketbar-empty">Add evidence to fill it.</span>';
}

// Held-but-unplaced evidence: the tray the player picks from to decide
// whether (and to whom) a piece of evidence gets placed.
function renderCaseboard() {
	renderBasketBar();
	const held = [...tiles.entries()].filter(([, t]) => t.held && !t.placedTo);
	const basketEl = document.querySelector('[data-slot="cb-basket"]');
	document.querySelector('[data-slot="cb-count"]').textContent = `(${held.length})`;
	basketEl.innerHTML = held.length ? held.map(([sq, t]) => `
		<div class="cb-item" data-sq="${sq}">
			<span class="cb-label">${squareName(sq)} — ${t.label}</span>
			<div class="cb-assign">${SUSPECTS.map(s => `<button data-assign="${sq}:${s.key}" ${assignments[s.key].length >= SLOTS_PER_SUSPECT ? 'disabled' : ''}>${s.name.split(' ')[0]}</button>`).join('')}</div>
		</div>`).join('') : '<p class="cb-empty">Hold a piece of evidence to add it here.</p>';

	const suspectsEl = document.querySelector('[data-slot="cb-suspects"]');
	suspectsEl.innerHTML = SUSPECTS.map(s => `
		<div class="sb-suspect">
			<img src="${s.img}" alt="${s.name}" loading="lazy">
			<span class="cb-sname">${s.name}</span>
			<div class="sb-slots">${Array.from({ length: SLOTS_PER_SUSPECT }, (_, i) => {
				const item = assignments[s.key][i];
				return item
					? `<button type="button" class="sb-slot filled" data-unassign="${s.key}:${item.sq}" title="Move back to the basket">
						<span class="sb-slot-label">${item.label}</span><span class="sb-slot-x">×</span>
					</button>`
					: '<div class="sb-slot">—</div>';
			}).join('')}</div>
		</div>`).join('');
}

document.querySelector('[data-slot="suspectboard"]').addEventListener('click', event => {
	const assign = event.target.closest('[data-assign]');
	if (assign && !assign.disabled) { const [sq, key] = assign.dataset.assign.split(':'); placeEvidence(Number(sq), key); return; }
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

function endCase(solved) {
	playing = false;
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
			if (timeLeft <= 0) { endCase(false); return; }
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
