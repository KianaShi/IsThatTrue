import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createPost } from './post.js';

export const QUALITY = {
	ultra: { pixel: 2, shadow: 2560, snow: 9000, trees: 420, bloom: true, grade: true },
	high: { pixel: 1.75, shadow: 1792, snow: 5200, trees: 300, bloom: true, grade: true },
	low: { pixel: 1.15, shadow: 0, snow: 2200, trees: 170, bloom: false, grade: true }
};

const VIEWS = {
	seat: { radius: 17, polar: 0.95, yaw: 0.30, label: 'Survey' },
	high: { radius: 19, polar: 0.68, yaw: 0.16, label: 'High' },
	over: { radius: 15, polar: 0.16, yaw: 0, label: 'Overhead' }
};

// Portrait screens get a much narrower horizontal field of view, so open the
// lens up to keep the whole clearing in frame.
const fovFor = () => (innerWidth / Math.max(1, innerHeight)) < 0.75 ? 65 : 42;

/**
 * Create the renderer, camera, orbit controls and frame loop for the scene.
 * The play view is framed by the 'seat' preset and zoom is locked so
 * scroll/pinch can't drift it; rotating still works.
 * @param {HTMLCanvasElement} canvas - Canvas to render into.
 * @param {'ultra'|'high'|'low'} [quality='high'] - Starting quality tier.
 * @returns {object} The stage: scene, camera, renderer, state and frame hooks.
 */
export function createStage(canvas, quality = 'high') {
	const cfg = QUALITY[quality] || QUALITY.high;

	// A hidden or not-yet-laid-out page can report a zero viewport, which would
	// leave every render target incomplete.
	const viewport = () => [Math.max(1, innerWidth), Math.max(1, innerHeight)];

	const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', stencil: false });
	renderer.setPixelRatio(Math.min(devicePixelRatio, cfg.pixel));
	renderer.setSize(...viewport());
	renderer.outputColorSpace = THREE.SRGBColorSpace;
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.toneMappingExposure = 0.94;
	renderer.shadowMap.enabled = cfg.shadow > 0;
	renderer.shadowMap.type = THREE.PCFShadowMap;

	const scene = new THREE.Scene();
	scene.fog = new THREE.FogExp2(0x0a1226, 0.024);

	const camera = new THREE.PerspectiveCamera(fovFor(), viewport()[0] / viewport()[1], 0.1, 400);
	camera.position.set(0, 7.4, 10.6);

	const controls = new OrbitControls(camera, canvas);
	controls.target.set(0, 0.55, 0);
	controls.enableDamping = true;
	controls.dampingFactor = 0.07;
	controls.rotateSpeed = 0.62;
	controls.zoomSpeed = 0.7;
	controls.enablePan = false;
	// The play view is framed on purpose; scroll/pinch shouldn't drift it.
	controls.enableZoom = false;
	controls.minDistance = 6.4;
	controls.maxDistance = 32;
	controls.minPolarAngle = 0.1;
	controls.maxPolarAngle = 1.32;
	controls.enabled = false;

	const post = createPost(renderer, scene, camera, cfg);
	const updates = [];
	const listeners = { quality: [] };

	const state = {
		quality,
		cfg,
		attract: true,
		azimuth: 0,
		view: 'seat',
		flipped: false,
		frames: [],
		measured: false
	};

	function resize() {
		const [w, h] = viewport();
		camera.aspect = w / h;
		camera.fov = fovFor();
		camera.updateProjectionMatrix();
		renderer.setSize(w, h);
		post.setSize(w, h);
	}
	addEventListener('resize', resize);

	// Ease the camera onto a named preset without fighting OrbitControls afterwards.
	let glide = null;
	function moveTo(view, { instant = false } = {}) {
		state.view = view;
		const preset = VIEWS[view] || VIEWS.seat;
		const azimuth = (preset.yaw || 0) + (state.flipped ? Math.PI : 0);
		const target = new THREE.Vector3(
			Math.sin(azimuth) * Math.sin(preset.polar),
			Math.cos(preset.polar),
			Math.cos(azimuth) * Math.sin(preset.polar)
		).multiplyScalar(preset.radius).add(controls.target);
		if (instant) { glide = null; camera.position.copy(target); controls.update(); return; }
		glide = { from: camera.position.clone(), to: target, t: 0, dur: 1.05 };
	}

	function step(dt) {
		if (glide) {
			glide.t = Math.min(1, glide.t + dt / glide.dur);
			const e = glide.t < 0.5 ? 4 * glide.t ** 3 : 1 - (-2 * glide.t + 2) ** 3 / 2;
			camera.position.lerpVectors(glide.from, glide.to, e);
			if (glide.t >= 1) glide = null;
			controls.update();
			return;
		}

		if (state.attract) {
			state.azimuth += dt * 0.032;
			const r = 15.6 + Math.sin(state.azimuth * 0.6) * 1.8;
			camera.position.set(
				Math.sin(state.azimuth) * r,
				5.2 + Math.sin(state.azimuth * 0.43) * 1.6,
				Math.cos(state.azimuth) * r
			);
		}

		controls.update();

		// The menu is a centred column, so the clearing stays centred too — just
		// aimed a little high, leaving the stone table low in the frame behind
		// the buttons. This has to happen after controls.update(), which always
		// re-aims the camera at its target.
		if (state.attract) {
			camera.lookAt(controls.target.clone().add(new THREE.Vector3(0, 1.35, 0)));
		}
	}

	function measure(ms) {
		if (state.measured || state.quality === 'low') return;
		state.frames.push(ms);
		if (state.frames.length < 100) return;
		state.measured = true;
		const median = state.frames.slice(20).sort((a, b) => a - b)[Math.floor((state.frames.length - 20) / 2)];
		if (median > 27) setQuality(state.quality === 'ultra' ? 'high' : 'low', true);
	}

	function setQuality(next, automatic = false) {
		if (next === state.quality) return;
		state.quality = next;
		state.cfg = QUALITY[next];
		state.frames = [];
		state.measured = automatic ? false : state.measured;
		renderer.setPixelRatio(Math.min(devicePixelRatio, state.cfg.pixel));
		renderer.shadowMap.enabled = state.cfg.shadow > 0;
		post.setQuality(state.cfg);
		listeners.quality.forEach(fn => fn(next, automatic));
	}

	let last = performance.now();
	let time = 0;

	function frame(dt) {
		time += dt;
		step(dt);
		for (const fn of updates) fn(dt, time);
		post.render(dt);
	}

	renderer.setAnimationLoop(() => {
		const now = performance.now();
		frame(Math.min((now - last) / 1000, 0.05));
		measure(now - last);
		last = now;
	});

	return {
		renderer, scene, camera, controls, post, state,
		onUpdate: fn => updates.push(fn),
		onQuality: fn => listeners.quality.push(fn),
		setQuality,
		moveTo,
		setAttract(on) {
			state.attract = on;
			controls.enabled = !on;
			if (!on) moveTo(state.view);
		},
		flip() {
			state.flipped = !state.flipped;
			moveTo(state.view);
			return state.flipped;
		},
		cycleView() {
			const order = Object.keys(VIEWS);
			const next = order[(order.indexOf(state.view) + 1) % order.length];
			moveTo(next);
			return VIEWS[next].label;
		}
	};
}
