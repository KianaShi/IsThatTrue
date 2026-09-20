// JS mirror of the ground shader's terrainH. The GPU displaces the snow in
// the vertex shader, so anything placed on the surface (evidence markers)
// needs the same maths on the CPU. GLSL hashes are float32 and these are
// float64 — the drift between the two is a couple of centimetres, far below
// the height of a marker's ring.

const fract = x => x - Math.floor(x);
const mix = (a, b, t) => a + (b - a) * t;
const smoothstep = (a, b, x) => {
	const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
	return t * t * (3 - 2 * t);
};

function hash21(x, y) {
	let px = fract(x * 0.1031);
	let py = fract(y * 0.1031);
	let pz = fract(x * 0.1031);
	const d = px * (py + 33.33) + py * (pz + 33.33) + pz * (px + 33.33);
	px += d; py += d; pz += d;
	return fract((px + py) * pz);
}

function vnoise(x, y) {
	const ix = Math.floor(x), iy = Math.floor(y);
	const fx = fract(x), fy = fract(y);
	const ux = fx * fx * (3 - 2 * fx);
	const uy = fy * fy * (3 - 2 * fy);
	return mix(
		mix(hash21(ix, iy), hash21(ix + 1, iy), ux),
		mix(hash21(ix, iy + 1), hash21(ix + 1, iy + 1), ux), uy);
}

function fbm(x, y) {
	let v = 0, a = 0.5;
	for (let i = 0; i < 5; i++) {
		v += a * vnoise(x, y);
		const nx = (0.86 * x - 0.51 * y) * 2.03;
		const ny = (0.51 * x + 0.86 * y) * 2.03;
		x = nx; y = ny; a *= 0.5;
	}
	return v;
}

function ridged(x, y) {
	let v = 0, a = 0.5;
	for (let i = 0; i < 4; i++) {
		v += a * (1 - Math.abs(vnoise(x, y) * 2 - 1));
		x *= 2.11; y *= 2.11; a *= 0.5;
	}
	return v;
}

export function terrainHeight(x, z) {
	const clearing = smoothstep(5.6, 14.0, Math.hypot(x, z));
	const h = fbm(x * 0.048, z * 0.048) * 3.1
		+ fbm(x * 0.17, z * 0.17) * 0.46
		+ ridged(x * 0.09, z * 0.09) * 0.55;
	// The ground mesh itself rests at y = -0.02.
	return (h - 1.35) * clearing - 0.06 - 0.02;
}
