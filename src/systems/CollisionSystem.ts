import { CONFIG } from '../core/GameConfig.ts';
import {
  AUTO_ANNA_LINES,
  BUS_LINES,
  CAB_HIT_LINES,
  WRONG_WAY_LINES,
  randomLine,
} from '../core/Dialogue.ts';
import type { Vehicle } from '../entities/Vehicle.ts';
import type { Nitesh } from '../entities/Nitesh.ts';

export interface HitReport {
  kind: 'cab' | 'auto' | 'bus';
  label: string;
  healthLost: number;
  sanityLost: number;
  moneyLost: number;
  x: number;
  z: number;
}

/**
 * Resolves Nitesh against traffic and applies each vehicle type's penalty.
 * Autos hurt the wallet and the mind; cabs hurt and shove; buses end runs.
 */
export class CollisionSystem {
  /** Set when a vehicle tore past without connecting; Game plays a whoosh. */
  nearMiss = false;
  private nearMissCooldown = 0;

  update(dt: number, nitesh: Nitesh, vehicles: Vehicle[]): HitReport[] {
    const hits: HitReport[] = [];
    this.nearMiss = false;
    if (this.nearMissCooldown > 0) this.nearMissCooldown -= dt;

    // A close pass is anything sweeping just outside his own footprint.
    if (this.nearMissCooldown <= 0) {
      for (const v of vehicles) {
        if (Math.abs(v.speed) < 8) continue;
        if (v.overlapsCircle(nitesh.x, nitesh.z, nitesh.halfWidth + 2.2)) {
          this.nearMiss = true;
          this.nearMissCooldown = 1.1;
          break;
        }
      }
    }

    if (nitesh.isInvulnerable) return hits;

    for (const v of vehicles) {
      if (!v.overlapsCircle(nitesh.x, nitesh.z, nitesh.halfWidth)) continue;

      if (v.kind === 'bus') {
        nitesh.damage(CONFIG.damage.busHealth);
        nitesh.knockBack(v.x, v.z);
        hits.push({
          kind: 'bus',
          label: randomLine(v.wrongWay ? WRONG_WAY_LINES : BUS_LINES),
          healthLost: CONFIG.damage.busHealth,
          sanityLost: 0,
          moneyLost: 0,
          x: v.x,
          z: v.z,
        });
      } else if (v.kind === 'auto') {
        nitesh.drainSanity(CONFIG.damage.autoSanity);
        const stolen = nitesh.stealMoney(CONFIG.damage.autoWalletTheft);
        // Autos do not deal damage, but they still knock him off his line -
        // graze() opens the immunity window so one auto cannot drain him dry.
        nitesh.graze();
        nitesh.knockBack(v.x, v.z);
        hits.push({
          kind: 'auto',
          label: randomLine(AUTO_ANNA_LINES),
          healthLost: 0,
          sanityLost: CONFIG.damage.autoSanity,
          moneyLost: stolen,
          x: v.x,
          z: v.z,
        });
      } else {
        nitesh.damage(CONFIG.damage.cabHealth);
        nitesh.knockBack(v.x, v.z);
        hits.push({
          kind: 'cab',
          label: randomLine(CAB_HIT_LINES),
          healthLost: CONFIG.damage.cabHealth,
          sanityLost: 0,
          moneyLost: 0,
          x: v.x,
          z: v.z,
        });
      }

      // One hit per tick; the immunity window covers the rest of the cluster.
      break;
    }

    return hits;
  }
}
