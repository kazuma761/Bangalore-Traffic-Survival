import * as THREE from 'three';
import { MetroBarricade } from '../entities/MetroBarricade.ts';
import type { Nitesh } from '../entities/Nitesh.ts';
import type { RoadWorld } from '../world/RoadWorld.ts';
import { randomInt, randomRange } from '../utils/math.ts';

/**
 * Places the Namma Metro construction barricades along the corridor and keeps
 * Nitesh out of them. They are laid out once per run so each attempt has a
 * fixed set of dead ends to route around.
 */
export class BarricadeSystem {
  readonly barricades: MetroBarricade[] = [];
  private world: RoadWorld;

  constructor(scene: THREE.Scene, world: RoadWorld) {
    this.world = world;
    this.layout(scene);
  }

  private layout(scene: THREE.Scene): void {
    const laneWidth = (this.world.halfWidth * 2) / this.world.laneCount;

    // One barricade cluster every ~70 units, never spanning the whole road.
    for (let z = this.world.startZ - 70; z > this.world.goalZ + 30; z -= randomRange(60, 90)) {
      const blockedLanes = randomInt(2, Math.max(2, this.world.laneCount - 3));
      const firstLane = randomInt(0, this.world.laneCount - blockedLanes);
      const centerX =
        this.world.laneCenter(firstLane) + (laneWidth * (blockedLanes - 1)) / 2;

      const barricade = new MetroBarricade(centerX, z, laneWidth * blockedLanes - 0.4);
      scene.add(barricade.mesh);
      this.barricades.push(barricade);
    }
  }

  update(dt: number, nitesh: Nitesh): void {
    for (const b of this.barricades) {
      b.update(dt);
      const fixed = b.resolve(nitesh.x, nitesh.z, nitesh.halfWidth);
      if (fixed) {
        nitesh.x = fixed.x;
        nitesh.z = fixed.z;
      }
    }
  }

  clear(): void {
    for (const b of this.barricades) b.dispose();
    this.barricades.length = 0;
  }
}
