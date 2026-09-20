import * as THREE from 'three';
import { PAWN, KNIGHT, BISHOP, KING } from '../chess/engine.js';
import { pieceGeometries } from './pieces.js';
import { pieceMaterial } from './materials.js';
import { squareToWorld } from './board.js';

// Piece layer for the evidence board: one ivory pawn per dealt square.
// Each Dig In is a real upgrade — pawn, then knight, bishop, king — and each
// step stands a little bigger than the last, so how far a piece has been dug
// reads at a glance. Colour alternates with every player interaction, like
// turns in a game: the first Dig In on the board comes out black, the next
// white, and so on, whichever piece it lands on.
// `stretch` lengthens a piece vertically only, without making it wider.
const TIERS = [
	{ type: PAWN, scale: 1, stretch: 1.2 },
	{ type: KNIGHT, scale: 1.25 },
	{ type: BISHOP, scale: 1.4 },
	{ type: KING, scale: 1.45, stretch: 1.2 }
];
export const MAX_TIER = TIERS.length - 1;

/**
 * Build the piece layer for the evidence board.
 * @param {import('three').Scene} scene - Scene the piece group is added to.
 * @returns {{spawn: function, upgrade: function, hide: function, reset: function, meshes: Array}}
 *   Handles to spawn, upgrade, hide and reset pieces by 0x88 square.
 */
export function createEvidencePieces(scene) {
	const group = new THREE.Group();
	scene.add(group);

	const geometries = pieceGeometries();
	const bySquare = new Map();
	let nextSide = 'obsidian';

	/**
	 * Put a starting pawn on a square (stretched slightly taller than the mesh).
	 * @param {number} sq - 0x88 board square.
	 * @returns {import('three').Mesh} The new piece's mesh.
	 */
	function spawn(sq) {
		const mesh = new THREE.Mesh(geometries[PAWN], pieceMaterial('ivory'));
		mesh.scale.set(TIERS[0].scale, TIERS[0].scale * TIERS[0].stretch, TIERS[0].scale);
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		squareToWorld(sq, mesh.position);
		mesh.rotation.y = Math.random() * Math.PI * 2;
		group.add(mesh);
		bySquare.set(sq, mesh);
		return mesh;
	}

	/**
	 * Move a piece up to the given tier: new shape and scale, and whichever
	 * colour the board's turn is on, which then flips for the next interaction.
	 * @param {number} sq - 0x88 board square of the piece.
	 * @param {number} tier - 0 (pawn) to MAX_TIER (king); out-of-range values clamp.
	 * @returns {'ivory'|'obsidian'} The side the piece came out as ('ivory' if there is no piece).
	 */
	function upgrade(sq, tier) {
		const mesh = bySquare.get(sq);
		if (!mesh) return;
		const t = TIERS[Math.min(Math.max(tier, 0), MAX_TIER)];
		mesh.geometry = geometries[t.type];
		mesh.scale.set(t.scale, t.scale * (t.stretch || 1), t.scale);
		mesh.material.dispose();
		mesh.material = pieceMaterial(nextSide);
		nextSide = nextSide === 'obsidian' ? 'ivory' : 'obsidian';
	}

	/**
	 * Remove the piece on a square and free its material.
	 * @param {number} sq - 0x88 board square; a no-op if empty.
	 * @returns {void}
	 */
	function hide(sq) {
		const mesh = bySquare.get(sq);
		if (!mesh) return;
		group.remove(mesh);
		mesh.material.dispose();
		bySquare.delete(sq);
	}

	/**
	 * Remove every piece and restart the colour turn on black.
	 * @returns {void}
	 */
	function reset() {
		for (const mesh of bySquare.values()) { group.remove(mesh); mesh.material.dispose(); }
		bySquare.clear();
		nextSide = 'obsidian';
	}

	return { spawn, upgrade, hide, reset, get meshes() { return [...bySquare.values()]; } };
}
