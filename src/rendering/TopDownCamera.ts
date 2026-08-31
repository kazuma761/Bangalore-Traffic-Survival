import * as THREE from 'three';
import { lerp } from '../utils/math.ts';
import { QUALITY } from '../core/Quality.ts';

/**
 * Overhead chase camera. It sits high above Nitesh and leads slightly up-screen
 * so oncoming traffic is visible in time to weave around it.
 */
export class TopDownCamera {
  readonly camera: THREE.PerspectiveCamera;
  private height = 43;
  private trail = 22;
  private lead = 12;

  constructor() {
    this.camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.5,
      QUALITY.drawDistance
    );
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    });
  }

  /** Snap straight to the target, used when a run starts. */
  snapTo(x: number, z: number): void {
    this.camera.position.set(x * 0.35, this.height, z + this.trail);
    this.camera.lookAt(x * 0.35, 0, z - this.lead);
  }

  follow(dt: number, x: number, z: number): void {
    // Damp the X so weaving does not make the whole world slide about.
    const targetX = x * 0.35;
    const k = Math.min(1, dt * 6);
    this.camera.position.x = lerp(this.camera.position.x, targetX, k);
    this.camera.position.y = this.height;
    this.camera.position.z = lerp(this.camera.position.z, z + this.trail, Math.min(1, dt * 9));
    this.camera.lookAt(this.camera.position.x, 0, this.camera.position.z - this.trail - this.lead);
  }

  /** Projects a world point to CSS pixels; `behind` flags points off-camera. */
  project(x: number, y: number, z: number): { sx: number; sy: number; behind: boolean } {
    const v = new THREE.Vector3(x, y, z).project(this.camera);
    return {
      sx: (v.x * 0.5 + 0.5) * window.innerWidth,
      sy: (-v.y * 0.5 + 0.5) * window.innerHeight,
      behind: v.z > 1,
    };
  }
}
