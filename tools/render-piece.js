// Dev-only: render the game's own procedural chess pieces to transparent PNGs.
// Nothing here ships with the game; the game just uses the exported images.
import * as THREE from 'three';
import { pieceGeometries } from '../src/game/pieces.js';
import { pieceMaterial } from '../src/game/materials.js';
import { TIERS } from '../src/game/evidencePieces.js';

// ── tweak these (or override with ?rx=&ry=&rz=&zoom=&scale=&light= in the URL) ──
const SIZE = 1024;          // exported square size in px
const WEB_SIZE = 256;       // small copies the game UI actually loads (assets/chess/web/)
const rotationX = 14;       // tilt toward the camera, degrees (shows a bit of the top)
const rotationY = 32;       // turn around the vertical axis, degrees (the 3/4 view)
const rotationZ = -16;      // lean in the picture plane, degrees: negative leans the top to the upper right
const cameraZoom = 1;       // >1 zooms in (piece fills more of the canvas)
const modelScale = 1;       // scale of the model; only matters when AUTO_FIT is false
const lightIntensity = 1;   // multiplies every light and the environment
// Fraction of the canvas each piece fills when AUTO_FIT is on. The king is the reference and the
// others are only a little smaller, roughly the way real chess sets step down in height.
const FILL = { pawn: 0.80, knight: 0.86, bishop: 0.90, king: 0.94 };
const AUTO_FIT = true;      // centre the piece and size the camera to hit FILL

const q = new URLSearchParams(location.search);
const num = (key, fallback) => (q.has(key) ? Number(q.get(key)) : fallback);
const CFG = {
	rx: num('rx', rotationX), ry: num('ry', rotationY), rz: num('rz', rotationZ),
	zoom: num('zoom', cameraZoom), scale: num('scale', modelScale), light: num('light', lightIntensity)
};

const PIECES = ['pawn', 'knight', 'bishop', 'king'];   // same order as TIERS
const rad = d => (d * Math.PI) / 180;

const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(SIZE, SIZE, false);
renderer.setClearColor(0x000000, 0);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
camera.position.set(0, 0, 20);

/**
 * Build a soft studio environment (a dim room with a few bright softboxes) so
 * the glossy materials have something to reflect. No floor or backdrop is
 * ever drawn into the image; this only lights the piece.
 * @returns {import('three').Texture} A prefiltered environment map.
 */
function studioEnvironment() {
	const env = new THREE.Scene();
	env.add(new THREE.Mesh(new THREE.SphereGeometry(30, 32, 16), new THREE.MeshBasicMaterial({ color: 0x2b303c, side: THREE.BackSide })));
	const box = (w, h, x, y, z, v) => {
		const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(v, v, v), side: THREE.DoubleSide }));
		m.position.set(x, y, z);
		m.lookAt(0, 0, 0);
		env.add(m);
	};
	box(14, 10, -12, 12, 14, 7);   // key softbox: upper left, front
	box(8, 14, 16, 3, 9, 2.6);     // fill: right
	box(18, 4, 0, 16, -10, 3.4);   // rim: above and behind
	const pmrem = new THREE.PMREMGenerator(renderer);
	const tex = pmrem.fromScene(env, 0.04).texture;
	pmrem.dispose();
	return tex;
}
scene.environment = studioEnvironment();
scene.environmentIntensity = 0.9 * CFG.light;

const ambient = new THREE.AmbientLight(0xffffff, 0.3 * CFG.light);
const key = new THREE.DirectionalLight(0xfff1de, 2.1 * CFG.light);
key.position.set(-5, 7, 9);
const fillLight = new THREE.DirectionalLight(0xa9bcff, 0.55 * CFG.light);
fillLight.position.set(7, 1, 5);
scene.add(ambient, key, fillLight);

let mesh = null;

/**
 * Render one piece into the canvas.
 * @param {string} piece - 'pawn' | 'knight' | 'bishop' | 'king'.
 * @param {'white'|'black'} side - White uses the ivory material, black the obsidian one.
 * @param {''|'critical'} variant - 'critical' adds a subtle dark-red emissive and rim glow.
 * @returns {void}
 */
function draw(piece, side, variant) {
	if (mesh) { scene.remove(mesh); mesh.material.dispose(); }
	const tier = TIERS[PIECES.indexOf(piece)];
	const mat = pieceMaterial(side === 'white' ? 'ivory' : 'obsidian');
	mat.userData.uniforms.uDust.value = 0.05;   // barely any snow on an icon
	if (variant === 'critical') {
		// A whisper of red in the body plus a rim glow, not a recolour.
		mat.emissive.set(0x2a0003);
		mat.emissiveIntensity = 0.28;
		mat.userData.uniforms.uLift.value = 0.3;
		mat.userData.uniforms.uAccent.value.set(0x8f0d16);
	}
	mesh = new THREE.Mesh(pieceGeometries()[tier.type], mat);
	// The game stretches some tiers taller; keep the icon the same shape as the board piece.
	mesh.scale.set(CFG.scale, CFG.scale * (tier.stretch || 1), CFG.scale);
	// The knight model faces -z, away from this camera. Turning it 120 degrees (on top of
	// rotationY) brings the head round to a 3/4 view facing the viewer's left.
	const yaw = CFG.ry + (piece === 'knight' ? 120 : 0);
	// 'ZXY': turn about Y first, then tilt about X, then roll in the picture plane,
	// so rotationZ always leans toward the same screen corner whatever the turn.
	mesh.rotation.set(rad(CFG.rx), rad(yaw), rad(CFG.rz), 'ZXY');
	mesh.position.set(0, 0, 0);
	scene.add(mesh);
	mesh.updateMatrixWorld(true);

	let half = 1 / CFG.zoom;
	if (AUTO_FIT) {
		const box = new THREE.Box3().setFromObject(mesh, true);
		const size = box.getSize(new THREE.Vector3());
		mesh.position.sub(box.getCenter(new THREE.Vector3()));
		half = Math.max(size.x, size.y) / 2 / FILL[piece] / CFG.zoom;
	}
	camera.left = -half; camera.right = half; camera.top = half; camera.bottom = -half;
	camera.updateProjectionMatrix();
	renderer.render(scene, camera);
}

/**
 * File name for an export. The pawn keeps the plain names asked for
 * (chess-white.png); other pieces carry their name.
 * @param {string} piece
 * @param {string} side
 * @param {string} variant
 * @returns {string}
 */
function fileName(piece, side, variant) {
	return ['chess', piece === 'pawn' ? '' : piece, side, variant].filter(Boolean).join('-') + '.png';
}

/**
 * Shrink the rendered canvas to a small square, halving step by step so the
 * edges stay smooth instead of aliasing.
 * @param {number} size - Target width/height in px.
 * @returns {Promise<Blob>} A transparent PNG.
 */
async function downscaled(size) {
	let src = canvas;
	for (let s = SIZE / 2; s >= size; s /= 2) {
		const c = document.createElement('canvas');
		c.width = c.height = s;
		const ctx = c.getContext('2d');
		ctx.imageSmoothingQuality = 'high';
		ctx.drawImage(src, 0, 0, s, s);
		src = c;
	}
	return new Promise(res => src.toBlob(res, 'image/png'));
}

const $ = id => document.getElementById(id);
const log = msg => { $('log').textContent = msg; };
const toBlob = () => new Promise(res => canvas.toBlob(res, 'image/png'));
$('piece').innerHTML = PIECES.map(p => `<option>${p}</option>`).join('');

const current = () => [$('piece').value, $('side').value, $('variant').value];
const redraw = () => draw(...current());
['piece', 'side', 'variant'].forEach(id => $(id).addEventListener('change', redraw));

$('download').addEventListener('click', async () => {
	redraw();
	const a = document.createElement('a');
	a.href = URL.createObjectURL(await toBlob());
	a.download = fileName(...current());
	a.click();
});

$('saveAll').addEventListener('click', async () => {
	const done = [];
	for (const piece of PIECES) for (const side of ['white', 'black']) for (const variant of ['', 'critical']) {
		draw(piece, side, variant);
		const name = fileName(piece, side, variant);
		const r = await fetch('/save?name=' + name, { method: 'POST', body: await toBlob() });
		if (!r.ok) { log(`Could not save ${name} (${r.status}). Run "npm run render" and open this page from that server.`); redraw(); return; }
		const w = await fetch('/save?name=web/' + name, { method: 'POST', body: await downscaled(WEB_SIZE) });
		if (!w.ok) { log(`Could not save web/${name} (${w.status}).`); redraw(); return; }
		done.push(name);
	}
	log(`Saved ${done.length} pieces to assets/chess/ (${SIZE}px) and assets/chess/web/ (${WEB_SIZE}px):\n` + done.join('\n'));
	redraw();
});

redraw();
