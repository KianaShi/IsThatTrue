import * as THREE from 'three';
import { terrainHeight } from '../world/terrain.js';

// Evidence beacons: a crimson ring on the snow, a small ember of a core, and a
// faint shaft of red light so the clue reads from across the clearing. The
// ring/shaft language matches evidence markers — the one colour the snow
// scene never uses anywhere else.

const SPOTS = [
	{ x: -6.0, z: 4.6 },   // by the west lantern
	{ x: 6.0, z: -4.5 },   // by the east lantern
	{ x: -8.2, z: -5.0 },  // west fallen timber
	{ x: 7.2, z: 6.4 },    // east fallen timber
	{ x: 6.4, z: 1.4 },    // east of the stone table
	{ x: -2.2, z: 8.4 }    // the gap in the boulders
];

let ringMap = null;
function ringTexture() {
	if (ringMap) return ringMap;
	const S = 256;
	const canvas = document.createElement('canvas');
	canvas.width = canvas.height = S;
	const ctx = canvas.getContext('2d');
	ctx.strokeStyle = 'rgba(255,64,96,1)';
	ctx.lineWidth = 10;
	ctx.beginPath();
	ctx.arc(S / 2, S / 2, S * 0.40, 0, Math.PI * 2);
	ctx.stroke();
	const grad = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
	grad.addColorStop(0, 'rgba(212,0,39,.30)');
	grad.addColorStop(0.55, 'rgba(212,0,39,.10)');
	grad.addColorStop(1, 'rgba(212,0,39,0)');
	ctx.fillStyle = grad;
	ctx.fillRect(0, 0, S, S);
	ringMap = new THREE.CanvasTexture(canvas);
	ringMap.colorSpace = THREE.SRGBColorSpace;
	return ringMap;
}

let shaftMap = null;
function shaftTexture() {
	if (shaftMap) return shaftMap;
	const canvas = document.createElement('canvas');
	canvas.width = 64;
	canvas.height = 256;
	const ctx = canvas.getContext('2d');
	const grad = ctx.createLinearGradient(0, 256, 0, 0);
	grad.addColorStop(0, 'rgba(255,70,100,.85)');
	grad.addColorStop(0.4, 'rgba(212,0,39,.30)');
	grad.addColorStop(1, 'rgba(212,0,39,0)');
	ctx.fillStyle = grad;
	ctx.fillRect(0, 0, 64, 256);
	// Feather the sides.
	const side = ctx.createLinearGradient(0, 0, 64, 0);
	side.addColorStop(0, 'rgba(0,0,0,1)');
	side.addColorStop(0.5, 'rgba(0,0,0,0)');
	side.addColorStop(1, 'rgba(0,0,0,1)');
	ctx.globalCompositeOperation = 'destination-out';
	ctx.fillStyle = side;
	ctx.fillRect(0, 0, 64, 256);
	shaftMap = new THREE.CanvasTexture(canvas);
	shaftMap.colorSpace = THREE.SRGBColorSpace;
	return shaftMap;
}

export function createEvidence(scene, bursts) {
	const group = new THREE.Group();
	scene.add(group);

	let markers = [];
	let hover = null;

	function makeMarker(index, subtle) {
		const g = new THREE.Group();

		const core = new THREE.Mesh(
			new THREE.SphereGeometry(0.14, 12, 10),
			new THREE.MeshBasicMaterial({ color: 0xff5070 })
		);
		core.position.y = 0.18;

		const ring = new THREE.Mesh(
			new THREE.CircleGeometry(0.52, 40),
			new THREE.MeshBasicMaterial({
				map: ringTexture(),
				color: 0xff4d6a,
				transparent: true,
				depthWrite: false,
				blending: THREE.AdditiveBlending
			})
		);
		ring.rotation.x = -Math.PI / 2;
		ring.position.y = 0.04;

		const shaft = new THREE.Sprite(new THREE.SpriteMaterial({
			map: shaftTexture(),
			color: 0xff2d55,
			transparent: true,
			opacity: subtle ? 0.6 : 1.0,
			blending: THREE.AdditiveBlending,
			depthWrite: false
		}));
		shaft.scale.set(subtle ? 0.6 : 0.9, subtle ? 2.0 : 2.8, 1);
		shaft.position.y = (subtle ? 2.0 : 2.8) / 2;

		// Invisible fat hit-proxy so a fingertip lands it without pixel-hunting.
		const hit = new THREE.Mesh(
			new THREE.SphereGeometry(0.62, 8, 6),
			new THREE.MeshBasicMaterial({ visible: false })
		);
		hit.position.y = 0.5;

		g.add(core, ring, shaft, hit);
		// Sit on the drifted snow, with a small lift so the ring never clips.
		g.position.set(SPOTS[index].x, terrainHeight(SPOTS[index].x, SPOTS[index].z) + 0.06, SPOTS[index].z);
		group.add(g);
		return { group: g, core, ring, shaft, hit, index, taken: false, seed: Math.random() * 10 };
	}

	return {
		get meshes() { return markers.filter(m => !m.taken).map(m => m.hit); },
		get remaining() { return markers.filter(m => !m.taken).length; },

		place(count, { subtle = false } = {}) {
			this.reset();
			for (let i = 0; i < count; i++) markers.push(makeMarker(i, subtle));
		},

		reset() {
			for (const m of markers) {
				group.remove(m.group);
				m.core.geometry.dispose();
				m.core.material.dispose();
				m.ring.material.dispose();
				m.shaft.material.dispose();
			}
			markers = [];
			hover = null;
		},

		collect(mesh) {
			const m = markers.find(x => x.hit === mesh);
			if (!m || m.taken) return -1;
			m.taken = true;
			bursts.emit(m.group.position.clone().setY(0.4), 90, {
				color: new THREE.Color(0xff4d6a),
				spread: 2.2,
				rise: 2.6,
				size: 6,
				life: 1.1
			});
			group.remove(m.group);
			return m.index;
		},

		setHover(mesh) { hover = mesh; },

		update(_dt, time) {
			for (const m of markers) {
				if (m.taken) continue;
				const p = 0.72 + 0.28 * Math.sin(time * 2.6 + m.seed);
				const hot = m.hit === hover ? 1.35 : 1;
				m.ring.scale.setScalar((1 + 0.12 * Math.sin(time * 2.6 + m.seed)) * hot);
				m.ring.material.opacity = 0.75 * p * hot;
				m.shaft.material.opacity = (m.shaft.scale.y > 2.4 ? 1.0 : 0.6) * p * hot;
				m.core.scale.setScalar((1 + 0.25 * (1 - p)) * hot);
				m.group.position.y = 0.03 * Math.sin(time * 1.8 + m.seed);
			}
		}
	};
}
