import { CONFIG } from '../core/GameConfig.ts';
import type { Vehicle, VehicleKind } from '../entities/Vehicle.ts';
import type { Nitesh } from '../entities/Nitesh.ts';
import { clamp, distance2D } from '../utils/math.ts';

export interface HonkEvent {
  x: number;
  z: number;
  /** Which horn to play — an auto sounds nothing like a BMTC bus. */
  kind: VehicleKind;
}

/**
 * The Honking Sense. Tracks an invisible proximity circle around Nitesh,
 * pops HONK! text off vehicles inside it, and drives the Ambient Noise Stress
 * meter. Pinned at 100%, it bleeds sanity until he gets clear of the cluster.
 */
export class HonkingSystem {
  /** 0..100 for the HUD bar. */
  stress = 0;
  /** Vehicles currently inside the radius, exposed for HUD feedback. */
  crowding = 0;

  /**
   * Returns positions where a HONK! pop-up should be drawn this tick.
   * The caller decides how to render it; this system only decides when.
   */
  update(dt: number, nitesh: Nitesh, vehicles: Vehicle[]): HonkEvent[] {
    const honks: HonkEvent[] = [];
    let inRadius = 0;

    for (const v of vehicles) {
      if (distance2D(nitesh.x, nitesh.z, v.x, v.z) > CONFIG.honking.radius) continue;
      inRadius++;
      if (v.tryHonk()) honks.push({ x: v.x, z: v.z, kind: v.kind });
    }

    this.crowding = inRadius;

    if (inRadius > 0) {
      this.stress += CONFIG.honking.fillPerVehicle * inRadius * dt;
    } else {
      this.stress -= CONFIG.honking.decayPerSecond * dt;
    }
    this.stress = clamp(this.stress, 0, 100);

    // Penalty: pinned meter drains sanity for as long as he stays in the noise.
    if (this.stress >= 100) {
      nitesh.drainSanity(CONFIG.honking.sanityDrainPerSecond * dt);
    } else if (this.stress < CONFIG.honking.calmThreshold) {
      // Out of the cluster he composes himself again, which is the only way a
      // 1,500 m run stays survivable against this many autos.
      nitesh.recoverSanity(CONFIG.honking.sanityRecoveryPerSecond * dt);
    }

    return honks;
  }

  get maxed(): boolean {
    return this.stress >= 100;
  }

  reset(): void {
    this.stress = 0;
    this.crowding = 0;
  }
}
