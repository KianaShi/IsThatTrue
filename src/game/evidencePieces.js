import * as THREE from 'three';
import { PAWN, KNIGHT } from '../chess/engine.js';
import { pieceGeometries } from './pieces.js';
import { pieceMaterial } from './materials.js';
import { squareToWorld } from './board.js';

// Piece layer for the evidence board: one ivory pawn per dealt square.
// Digging in is a real upgrade — the pawn becomes a knight, cut in obsidian
// instead of bone, not just a recolour of the same shape.

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

	// Pawn -> knight, ivory -> obsidian. A real change of piece, not a tint.
	function upgrade(sq) {
		const mesh = bySquare.get(sq);
		if (!mesh) return;
		mesh.geometry = geometries[KNIGHT];
		mesh.material.dispose();
		mesh.material = pieceMaterial('obsidian');
	}

	function tint(sq, color) {
		const mesh = bySquare.get(sq);
		if (mesh) mesh.material.color.set(color);
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

	return { spawn, upgrade, tint, hide, reset, get meshes() { return [...bySquare.values()]; } };
}
