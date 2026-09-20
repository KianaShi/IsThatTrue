import * as THREE from 'three';
import { PAWN, KNIGHT, BISHOP, ROOK } from '../chess/engine.js';
import { pieceGeometries } from './pieces.js';
import { pieceMaterial } from './materials.js';
import { squareToWorld } from './board.js';

// Piece layer for the evidence board: one ivory pawn per dealt square.
// Each Dig In is a real upgrade — pawn, then knight, bishop, rook — and each
// step stands a little bigger than the last, so how far a piece has been dug
// reads at a glance. Colour alternates with every step: white pawn, black
// knight, white bishop, black rook.
const TIERS = [
	{ type: PAWN, scale: 1 },
	{ type: KNIGHT, scale: 1.25 },
	{ type: BISHOP, scale: 1.4 },
	{ type: ROOK, scale: 1.55 }
];
export const MAX_TIER = TIERS.length - 1;

export function createEvidencePieces(scene) {
	const group = new THREE.Group();
	scene.add(group);

	const geometries = pieceGeometries();
	const bySquare = new Map();

	function spawn(sq) {
		const mesh = new THREE.Mesh(geometries[PAWN], pieceMaterial('ivory'));
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		squareToWorld(sq, mesh.position);
		mesh.rotation.y = Math.random() * Math.PI * 2;
		group.add(mesh);
		bySquare.set(sq, mesh);
		return mesh;
	}

	// Move a piece up to the given tier: new shape, larger, and the other side's
	// colour from the tier before (odd tiers black, even tiers white).
	function upgrade(sq, tier) {
		const mesh = bySquare.get(sq);
		if (!mesh) return;
		const t = TIERS[Math.min(Math.max(tier, 0), MAX_TIER)];
		mesh.geometry = geometries[t.type];
		mesh.scale.setScalar(t.scale);
		const side = tier % 2 === 1 ? 'obsidian' : 'ivory';
		if (mesh.userData.side !== side) {
			mesh.material.dispose();
			mesh.material = pieceMaterial(side);
			mesh.userData.side = side;
		}
	}

	function hide(sq) {
		const mesh = bySquare.get(sq);
		if (!mesh) return;
		group.remove(mesh);
		mesh.material.dispose();
		bySquare.delete(sq);
	}

	function reset() {
		for (const mesh of bySquare.values()) { group.remove(mesh); mesh.material.dispose(); }
		bySquare.clear();
	}

	return { spawn, upgrade, hide, reset, get meshes() { return [...bySquare.values()]; } };
}
