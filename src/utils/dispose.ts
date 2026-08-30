import * as THREE from 'three';

/** Recursively free geometries and materials owned by an object3D subtree. */
export function disposeObject(root: THREE.Object3D): void {
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry?.dispose();
    const mat = mesh.material;
    if (Array.isArray(mat)) {
      mat.forEach((m) => m.dispose());
    } else {
      mat?.dispose();
    }
  });
  root.parent?.remove(root);
}
