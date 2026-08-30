import * as THREE from 'three';
import { CONFIG } from '../core/GameConfig.ts';
import { FoodPlate } from '../entities/FoodPlate.ts';
import type { Nitesh } from '../entities/Nitesh.ts';
import type { RoadWorld } from '../world/RoadWorld.ts';
import { randomRange } from '../utils/math.ts';

export interface FoodPickup {
  blessing: boolean;
  message: string;
  x: number;
  z: number;
}

/**
 * Risk-reward street food. Plates are scattered along the corridor; walking
 * over one resolves a hidden 50/50 that either saves the run or wrecks it.
 */
export class FoodSystem {
  readonly plates: FoodPlate[] = [];
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene, world: RoadWorld) {
    this.scene = scene;
    this.scatter(world);
  }

  private scatter(world: RoadWorld): void {
    for (let z = world.startZ - 25; z > world.goalZ + 20; z -= randomRange(
      CONFIG.food.spawnIntervalZ * 0.6,
      CONFIG.food.spawnIntervalZ * 1.4
    )) {
      const plate = new FoodPlate(
        randomRange(-world.halfWidth + 2, world.halfWidth - 2),
        z,
        Math.random() < 0.5 ? 'biryani' : 'coffee'
      );
      this.scene.add(plate.mesh);
      this.plates.push(plate);
    }
  }

  /** Applies any pickup effects to Nitesh and reports what happened. */
  update(dt: number, nitesh: Nitesh): FoodPickup | null {
    let pickup: FoodPickup | null = null;

    for (let i = this.plates.length - 1; i >= 0; i--) {
      const plate = this.plates[i];
      plate.update(dt);

      if (!pickup && plate.overlapsCircle(nitesh.x, nitesh.z, nitesh.halfWidth)) {
        const outcome = plate.consume();
        pickup = { ...outcome, x: plate.x, z: plate.z };

        if (outcome.blessing) {
          nitesh.heal(CONFIG.food.blessingHealth);
          nitesh.restoreSanity();
        } else {
          nitesh.damage(CONFIG.food.curseHealth);
          nitesh.applyGastro();
        }
      }

      if (!plate.alive) {
        plate.dispose();
        this.plates.splice(i, 1);
      }
    }

    return pickup;
  }

  clear(): void {
    for (const p of this.plates) p.dispose();
    this.plates.length = 0;
  }
}
