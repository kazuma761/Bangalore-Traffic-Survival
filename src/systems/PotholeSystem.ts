import * as THREE from 'three';
import { CONFIG } from '../core/GameConfig.ts';
import { Pothole } from '../entities/Pothole.ts';
import type { Nitesh } from '../entities/Nitesh.ts';
import type { RoadWorld } from '../world/RoadWorld.ts';
import { randomRange } from '../utils/math.ts';

export interface PotholeTrip {
  x: number;
  z: number;
  damage: number;
}

/**
 * Scatters potholes down the road and reports when Nitesh puts a foot in one.
 * They are laid out once per run, so the route you learn stays the route.
 */
export class PotholeSystem {
  readonly potholes: Pothole[] = [];

  constructor(scene: THREE.Scene, world: RoadWorld, density = 1) {
    const [minR, maxR] = CONFIG.pothole.radius;
    const spacing = CONFIG.pothole.spacingZ / Math.max(0.2, density);

    for (let z = world.startZ - 12; z > world.goalZ + 10; z -= randomRange(spacing * 0.55, spacing * 1.45)) {
      // Cluster two or three together now and then; damage is never isolated.
      const cluster = Math.random() < 0.3 ? 3 : 1;
      for (let i = 0; i < cluster; i++) {
        const hole = new Pothole(
          randomRange(-world.halfWidth + 1.5, world.halfWidth - 1.5),
          z - randomRange(0, 6),
          randomRange(minR, maxR)
        );
        scene.add(hole.mesh);
        this.potholes.push(hole);
      }
    }
  }

  /** Applies the stagger to Nitesh and reports the trip for feedback. */
  update(nitesh: Nitesh): PotholeTrip | null {
    for (const hole of this.potholes) {
      if (hole.isSpent) continue;
      if (!hole.trip(nitesh.x, nitesh.z, nitesh.halfWidth)) continue;

      nitesh.damage(hole.damage);
      nitesh.stagger();
      return { x: hole.x, z: hole.z, damage: hole.damage };
    }
    return null;
  }

  clear(): void {
    for (const h of this.potholes) h.dispose();
    this.potholes.length = 0;
  }
}
