import * as THREE from 'three';
import { NOISE } from '../scene/glsl.js';

// Dome shader: a late-night gradient, a cold full moon behind snow haze,
// stars that only survive the upper third, and a faint whisper of aurora.
export function createSky(scene, sunDir) {
	const uniforms = {
		uTime: { value: 0 },
		uSun: { value: sunDir.clone() },
		uHorizon: { value: new THREE.Color(0x22314f) },
		uZenith: { value: new THREE.Color(0x020409) },
		uHaze: { value: new THREE.Color(0x0d1526) },
		uAurora: { value: 0.32 }
	};

	const material = new THREE.ShaderMaterial({
		side: THREE.BackSide,
		depthWrite: false,
		fog: false,
		uniforms,
		vertexShader: /* glsl */`
			varying vec3 vDir;
			void main(){
				vDir = normalize(position);
				gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
			}
		`,
		fragmentShader: /* glsl */`
			uniform float uTime;
			uniform vec3 uSun, uHorizon, uZenith, uHaze;
			uniform float uAurora;
			varying vec3 vDir;
			${NOISE}

			void main(){
				vec3 dir = normalize(vDir);
				float up = clamp(dir.y, -1.0, 1.0);

				vec3 col = mix(uHorizon, uZenith, pow(clamp(up * 1.18 + 0.06, 0.0, 1.0), 0.62));
				col = mix(col, uHaze, smoothstep(0.30, -0.06, up) * 0.72);

				// Broken cloud deck, flattened towards the horizon.
				vec2 cp = dir.xz / max(abs(up) + 0.16, 0.16);
				float deck = fbm(cp * 0.85 + vec2(uTime * 0.004, uTime * 0.0016));
				deck = smoothstep(0.42, 0.86, deck) * smoothstep(-0.02, 0.34, up);
				col = mix(col, vec3(0.10, 0.13, 0.21), deck * 0.66);

				// Aurora: two vertical ribbons folded by noise, only in the north.
				float north = smoothstep(0.1, 0.9, -dir.z) * smoothstep(-0.02, 0.42, up);
				float band = 0.0;
				for (int i = 0; i < 2; i++){
					float k = float(i);
					float wob = fbm(vec2(dir.x * 2.4 + k * 5.0, uTime * 0.045 + k)) * 0.42;
					float centre = 0.30 + k * 0.16 + wob;
					band += exp(-pow((up - centre) * 7.5, 2.0)) * (0.65 - k * 0.22);
				}
				float curtain = band * north * uAurora * (0.55 + 0.45 * fbm(vec2(dir.x * 6.0, uTime * 0.11)));
				col += curtain * vec3(0.16, 0.62, 0.44) + curtain * curtain * vec3(0.24, 0.16, 0.42);

				// Stars, thinned by the cloud deck and the glow near the ground.
				vec3 grid = floor(dir * 190.0);
				float star = hash31(grid);
				float twinkle = 0.55 + 0.45 * sin(uTime * 2.1 + star * 42.0);
				float mag = smoothstep(0.9975, 1.0, star) * smoothstep(0.06, 0.55, up);
				col += mag * twinkle * (1.0 - deck) * vec3(0.85, 0.91, 1.0) * 1.6;

				// Moon disc plus its bloom through the haze.
				float sd = max(dot(dir, normalize(uSun)), 0.0);
				col += vec3(0.93, 0.96, 1.00) * pow(sd, 1400.0) * 4.2;
				col += vec3(0.55, 0.66, 0.88) * pow(sd, 8.0) * 0.22;
				col += vec3(0.38, 0.48, 0.68) * pow(sd, 2.2) * 0.10;

				gl_FragColor = vec4(col, 1.0);
			}
		`
	});

	const dome = new THREE.Mesh(new THREE.SphereGeometry(180, 48, 32), material);
	dome.frustumCulled = false;
	scene.add(dome);

	return {
		dome,
		uniforms,
		update(_dt, time) { uniforms.uTime.value = time; }
	};
}
