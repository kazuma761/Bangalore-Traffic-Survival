import * as THREE from 'three';
import { Entity } from './Entity.ts';
import { CONFIG } from '../core/GameConfig.ts';
import { randomRange } from '../utils/math.ts';

/**
 * A pothole. Not a vehicle, not a wall — just a hole in a road nobody has
 * resurfaced since the last monsoon. Step in one and Nitesh turns his ankle:
 * a little damage and a stagger that leaves him slow in the middle of traffic.
 */
export class Pothole extends Entity {
  /** Cleared once stepped in, so a single hole cannot drain him. */
  private spent = false;
  private radius: number;
  private rim!: THREE.Mesh;

  constructor(x: number, z: number, radius: number) {
    super(x, z);
    this.radius = radius;
    this.build();
  }

  protected build(): void {
    const r = this.radius;
    this.halfWidth = r;
    this.halfLength = r * 0.8;

    // The hole: a dark irregular disc sunk just below the tarmac.
    const hole = new THREE.Mesh(
      new THREE.CircleGeometry(r, 9),
      new THREE.MeshBasicMaterial({ color: 0x0a0a0c })
    );
    hole.rotation.x = -Math.PI / 2;
    hole.position.y = 0.035;
    hole.scale.set(1, 0.82, 1);
    this.mesh.add(hole);

    // Broken asphalt rim, so it reads as a hazard and not a shadow.
    this.rim = new THREE.Mesh(
      new THREE.RingGeometry(r * 0.92, r * 1.22, 9),
      new THREE.MeshBasicMaterial({ color: 0x6b6257, transparent: true, opacity: 0.85 })
    );
    this.rim.rotation.x = -Math.PI / 2;
    this.rim.position.y = 0.03;
    this.rim.scale.set(1, 0.82, 1);
    this.mesh.add(this.rim);

    // A little standing water, because of course there is.
    if (Math.random() < 0.45) {
      const water = new THREE.Mesh(
        new THREE.CircleGeometry(r * 0.66, 8),
        new THREE.MeshStandardMaterial({
          color: 0x35506b,
          roughness: 0.15,
          metalness: 0.5,
          transparent: true,
          opacity: 0.8,
        })
      );
      water.rotation.x = -Math.PI / 2;
      water.position.y = 0.04;
      water.scale.set(1, 0.82, 1);
      this.mesh.add(water);
    }

    this.mesh.rotation.y = randomRange(0, Math.PI * 2);
  }

  update(): void {
    // Static hazard; nothing to animate.
  }

  get isSpent(): boolean {
    return this.spent;
  }

  /** True on the tick Nitesh first steps in it. */
  trip(px: number, pz: number, pr: number): boolean {
    if (this.spent) return false;
    // Needs a real step in, not a clip of the rim.
    if (!this.overlapsCircle(px, pz, pr * 0.3)) return false;
    this.spent = true;
    (this.rim.material as THREE.MeshBasicMaterial).color.setHex(0x8d6e63);
    return true;
  }

  get damage(): number {
    return CONFIG.pothole.health;
  }
}
