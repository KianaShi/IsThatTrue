import * as THREE from 'three';

// Deep-night winter light: one cold moon through the trunks, a warm lantern
// pair at the scene of the crime, and a thin sky bounce off the snow.
export function createLighting(scene, cfg) {
	const sunDir = new THREE.Vector3(-0.42, 0.34, -0.82).normalize();

	const sun = new THREE.DirectionalLight(0xb9d0f2, 1.05);
	sun.position.copy(sunDir).multiplyScalar(46);
	sun.castShadow = cfg.shadow > 0;
	if (cfg.shadow > 0) {
		sun.shadow.mapSize.set(cfg.shadow, cfg.shadow);
		sun.shadow.camera.near = 8;
		sun.shadow.camera.far = 96;
		sun.shadow.camera.left = -16;
		sun.shadow.camera.right = 16;
		sun.shadow.camera.top = 16;
		sun.shadow.camera.bottom = -16;
		sun.shadow.bias = -0.0006;
		sun.shadow.normalBias = 0.028;
		sun.shadow.radius = 2.4;
	}
	scene.add(sun);
	scene.add(sun.target);

	const sky = new THREE.HemisphereLight(0x33477a, 0x0a1020, 0.42);
	scene.add(sky);

	const fill = new THREE.DirectionalLight(0x7d9fd6, 0.22);
	fill.position.set(9.0, 6.5, 7.0);
	scene.add(fill);

	// Soft moonlight straight down the stone table so the scene stays readable.
	const table = new THREE.SpotLight(0xcfe0ff, 20, 22, 0.70, 0.92, 1.3);
	table.position.set(1.4, 9.8, 2.6);
	table.target.position.set(0, 0, 0);
	scene.add(table, table.target);

	const lanterns = [];
	for (const [x, z] of [[-6.4, 5.1], [6.4, -5.1]]) {
		const light = new THREE.PointLight(0xffa54e, 12.5, 26, 1.85);
		light.position.set(x, 2.55, z);
		scene.add(light);
		lanterns.push({ light, base: 12.5, seed: Math.random() * 10 });
	}

	return {
		sun, sky, fill, table, sunDir,
		lanterns: lanterns.map(l => l.light),
		update(_dt, time) {
			for (const l of lanterns) {
				const flicker = 0.82 + 0.18 * (Math.sin(time * 7.3 + l.seed) * 0.5 + Math.sin(time * 2.7 + l.seed * 3) * 0.5);
				l.light.intensity = l.base * flicker;
			}
		},
		setQuality(next) {
			sun.castShadow = next.shadow > 0;
			if (next.shadow > 0) sun.shadow.mapSize.set(next.shadow, next.shadow);
		}
	};
}
