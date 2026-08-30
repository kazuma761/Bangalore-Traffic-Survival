import { CONFIG } from '../core/GameConfig.ts';
import type { RoadWorld } from '../world/RoadWorld.ts';
import { clamp } from '../utils/math.ts';

/**
 * Tracks how far Nitesh still has to go. Distance counts down from 1,500 m
 * and only ever ratchets forward, so backtracking around a barricade does not
 * inflate the number he already earned.
 */
export class ProgressSystem {
  private world: RoadWorld;
  private best = 0;
  private elapsed = 0;
  finished = false;

  constructor(world: RoadWorld) {
    this.world = world;
  }

  update(dt: number, playerZ: number): void {
    if (this.finished) return;
    this.elapsed += dt;
    const raw = (this.world.startZ - playerZ) / (this.world.startZ - this.world.goalZ);
    this.best = Math.max(this.best, clamp(raw, 0, 1));
    if (playerZ <= this.world.goalZ) this.finished = true;
  }

  /** 0 at the tech park, 1 at the gate. */
  get progress(): number {
    return this.best;
  }

  /** Metres still to cover, for the HUD. */
  get metresRemaining(): number {
    return Math.max(0, Math.round(CONFIG.TOTAL_DISTANCE_M * (1 - this.best)));
  }

  get metresCovered(): number {
    return CONFIG.TOTAL_DISTANCE_M - this.metresRemaining;
  }

  get time(): number {
    return this.elapsed;
  }

  reset(): void {
    this.best = 0;
    this.elapsed = 0;
    this.finished = false;
  }
}
