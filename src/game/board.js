import * as THREE from 'three';
import { NOISE } from '../scene/glsl.js';

const HALF = 4;

// 0x88 square -> world centre. Rank 8 sits at -z, rank 1 (white's home) at +z.
export function squareToWorld(sq, out = new THREE.Vector3()) {
	return out.set((sq & 15) - 3.5, 0, (sq >> 4) - 3.5);
}

export function worldToSquare(point) {
	const f = Math.floor(point.x + HALF);
	const r = Math.floor(point.z + HALF);
	if (f < 0 || f > 7 || r < 0 || r > 7) return -1;
	return r * 16 + f;
}

function frameTexture() {
	const S = 1024;
	const canvas = document.createElement('canvas');
	canvas.width = canvas.height = S;
	const ctx = canvas.getContext('2d');

	ctx.fillStyle = '#191d26';
	ctx.fillRect(0, 0, S, S);

	const grad = ctx.createLinearGradient(0, 0, S, S);
	grad.addColorStop(0, '#2a3040');
	grad.addColorStop(0.5, '#141821');
	grad.addColorStop(1, '#252b39');
	ctx.fillStyle = grad;
	ctx.fillRect(0, 0, S, S);

	for (let i = 0; i < 2600; i++) {
		ctx.fillStyle = `rgba(${190 + Math.random() * 60 | 0},${200 + Math.random() * 50 | 0},255,${Math.random() * 0.05})`;
		ctx.fillRect(Math.random() * S, Math.random() * S, Math.random() * 40 + 2, 1);
	}

	// The playing field is inset 0.8 units inside a 9.6 unit frame.
	const inset = (0.8 / 9.6) * S;
	ctx.strokeStyle = 'rgba(198,220,240,.34)';
	ctx.lineWidth = 2;
	ctx.strokeRect(inset, inset, S - inset * 2, S - inset * 2);

	// No coordinates: this slab is the clearing's old stone table — the scene
	// of the crime — not a playing field.

	const texture = new THREE.CanvasTexture(canvas);
	texture.colorSpace = THREE.SRGBColorSpace;
	texture.anisotropy = 8;
	return texture;
}

export function createBoard(scene) {
	const group = new THREE.Group();

	// Per-square state: r select, g legal, b threat, a last move.
	const data = new Uint8Array(64 * 4);
	const marks = new THREE.DataTexture(data, 8, 8, THREE.RGBAFormat);
	marks.magFilter = THREE.NearestFilter;
	marks.minFilter = THREE.NearestFilter;
	marks.needsUpdate = true;

	const uniforms = {
		uTime: { value: 0 },
		uMarks: { value: marks },
		uHover: { value: -1 },
		uHints: { value: 1 }
	};

	const surface = new THREE.MeshPhysicalMaterial({
		color: 0xffffff,
		roughness: 0.26,
		metalness: 0.0,
		clearcoat: 0.42,
		clearcoatRoughness: 0.30,
		envMapIntensity: 0.75
	});

	surface.onBeforeCompile = shader => {
		Object.assign(shader.uniforms, uniforms);

		shader.vertexShader = shader.vertexShader
			.replace('#include <common>', `#include <common>
				varying vec3 vWorld;`)
			.replace('#include <begin_vertex>', `#include <begin_vertex>
				vWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;`);

		shader.fragmentShader = shader.fragmentShader
			.replace('#include <common>', `#include <common>
				uniform float uTime;
				uniform float uHover;
				uniform float uHints;
				uniform sampler2D uMarks;
				varying vec3 vWorld;
				${NOISE}`)
			.replace('#include <color_fragment>', `#include <color_fragment>
				vec2 local = vWorld.xz + 4.0;
				vec2 cell = clamp(floor(local), 0.0, 7.0);
				vec2 f = fract(local);
				float dark = mod(cell.x + cell.y, 2.0);

				// Ice over slate: the pale squares are frozen, the dark ones are stone.
				float vein = ridged(vWorld.xz * 2.6 + vec2(0.0, dark * 11.0));
				float grain = fbm(vWorld.xz * 9.0);
				// Classic black-and-white chessboard: frosted ivory squares
				// against near-black marble, full-strength alternation.
				vec3 ice = mix(vec3(0.90, 0.92, 0.95), vec3(0.98, 0.99, 1.00), vein * 0.8);
				ice = mix(ice, vec3(0.78, 0.83, 0.90), grain * 0.35);
				vec3 slate = mix(vec3(0.020, 0.024, 0.032), vec3(0.085, 0.10, 0.13), pow(vein, 1.7));
				slate = mix(slate, vec3(0.14, 0.16, 0.20), grain * 0.3);
				diffuseColor.rgb *= mix(ice, slate, dark);

				// A crisp groove between the squares.
				vec2 edge = min(f, 1.0 - f);
				float seam = 1.0 - smoothstep(0.0, 0.022, min(edge.x, edge.y));
				diffuseColor.rgb *= 1.0 - seam * 0.5;`)
			.replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
				{
					vec2 lp = vWorld.xz + 4.0;
					float dk = mod(floor(lp.x) + floor(lp.y), 2.0);
					roughnessFactor = mix(0.22, 0.46, dk) + fbm(vWorld.xz * 14.0) * 0.12;
				}`)
			.replace('#include <opaque_fragment>', `
				{
					vec4 mk = texture2D(uMarks, (cell + 0.5) / 8.0);
					float idx = cell.y * 8.0 + cell.x;
					vec2 c = f - 0.5;
					float d = length(c);
					float pulse = 0.5 + 0.5 * sin(uTime * 2.6);

					vec3 glow = vec3(0.0);

					// Last move: a neutral wash across both squares.
					glow += mk.a * vec3(0.24, 0.28, 0.34) * (0.40 + 0.22 * pulse);

					// Legal destination: a soft disc with a crisp rim.
					float disc = smoothstep(0.19, 0.11, d);
					float rim = smoothstep(0.215, 0.185, d) - smoothstep(0.185, 0.155, d);
					glow += mk.g * uHints * (disc * 0.5 + rim * 1.35) * vec3(0.52, 0.79, 1.00);

					// Capture or check: a ring that hugs the square.
					float ring = smoothstep(0.46, 0.42, max(abs(c.x), abs(c.y))) - smoothstep(0.42, 0.37, max(abs(c.x), abs(c.y)));
					glow += mk.b * uHints * ring * (0.9 + 0.5 * pulse) * vec3(1.00, 0.48, 0.40);

					// Lifted piece: the whole square breathes.
					glow += mk.r * (0.30 + 0.18 * pulse) * vec3(0.88, 0.94, 1.00);

					if (abs(idx - uHover) < 0.5) {
						float hoverRing = smoothstep(0.48, 0.44, max(abs(c.x), abs(c.y)));
						glow += hoverRing * 0.16 * vec3(0.86, 0.93, 1.0);
					}

					outgoingLight += glow;
				}
				#include <opaque_fragment>`);
	};

	const field = new THREE.Mesh(new THREE.PlaneGeometry(8, 8, 1, 1), surface);
	field.geometry.rotateX(-Math.PI / 2);
	field.position.y = 0.012;
	field.receiveShadow = true;
	group.add(field);

	// Frame carrying the file letters and rank numbers.
	const outer = 4.8, inner = 4.0;
	const shape = new THREE.Shape()
		.moveTo(-outer, -outer).lineTo(outer, -outer).lineTo(outer, outer).lineTo(-outer, outer).lineTo(-outer, -outer);
	const hole = new THREE.Path()
		.moveTo(-inner, -inner).lineTo(-inner, inner).lineTo(inner, inner).lineTo(inner, -inner).lineTo(-inner, -inner);
	shape.holes.push(hole);

	const frameGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.34, bevelEnabled: true, bevelSize: 0.035, bevelThickness: 0.035, bevelSegments: 2 });
	frameGeo.rotateX(-Math.PI / 2);
	const pos = frameGeo.attributes.position;
	const uv = new Float32Array(pos.count * 2);
	for (let i = 0; i < pos.count; i++) {
		uv[i * 2] = (pos.getX(i) + outer) / (outer * 2);
		uv[i * 2 + 1] = (pos.getZ(i) + outer) / (outer * 2);
	}
	frameGeo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));

	const frame = new THREE.Mesh(frameGeo, new THREE.MeshStandardMaterial({
		map: frameTexture(),
		roughness: 0.52,
		metalness: 0.22
	}));
	frame.position.y = 0.005;
	frame.castShadow = true;
	frame.receiveShadow = true;
	group.add(frame);

	// Slab underneath, so the board reads as cut stone rather than a floating plane.
	const slab = new THREE.Mesh(
		new THREE.BoxGeometry(9.68, 0.5, 9.68),
		new THREE.MeshStandardMaterial({ color: 0x30364a, roughness: 0.88 })
	);
	slab.position.y = -0.26;
	slab.castShadow = true;
	slab.receiveShadow = true;
	group.add(slab);

	scene.add(group);

	function setMark(sq, channel, value) {
		const f = sq & 15, r = sq >> 4;
		data[(r * 8 + f) * 4 + channel] = Math.round(value * 255);
		marks.needsUpdate = true;
	}

	function clearMarks(channels = [0, 1, 2, 3]) {
		for (let i = 0; i < 64; i++) for (const c of channels) data[i * 4 + c] = 0;
		marks.needsUpdate = true;
	}

	return {
		group, field, uniforms,
		setMark, clearMarks,
		setHover(sq) { uniforms.uHover.value = sq < 0 ? -1 : (sq >> 4) * 8 + (sq & 15); },
		setHints(on) { uniforms.uHints.value = on ? 1 : 0; },
		update(_dt, time) { uniforms.uTime.value = time; }
	};
}
