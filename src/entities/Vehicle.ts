import { Entity } from './Entity.ts';
import { CONFIG } from '../core/GameConfig.ts';

export type VehicleKind = 'cab' | 'auto' | 'bus';

/**
 * Shared behaviour for anything that drives down the road at Nitesh.
 * Subclasses supply the mesh and their own steering in `drive()`.
 */
export abstract class Vehicle extends Entity {
  abstract readonly kind: VehicleKind;
  /** Units per second travelled toward +Z (down the screen, into Nitesh). */
  speed = 10;
  /** Throttles HONK! pop-ups so a stuck car does not spam the screen. */
  private honkTimer = 0;

  /** True once per honk cooldown while this vehicle is crowding Nitesh. */
  tryHonk(): boolean {
    if (this.honkTimer > 0) return false;
    this.honkTimer = CONFIG.honking.honkCooldown;
    return true;
  }

  update(dt: number, ctx: import('./Entity.ts').EntityContext): void {
    if (this.honkTimer > 0) this.honkTimer -= dt;
    this.drive(dt, ctx);
    this.z += this.speed * dt;

    // Retire once well past Nitesh; TrafficSystem recycles the slot.
    if (this.z > ctx.playerZ + CONFIG.traffic.despawnBehind) {
      this.alive = false;
    }
  }

  /** Per-kind steering, run before the forward motion is applied. */
  protected abstract drive(dt: number, ctx: import('./Entity.ts').EntityContext): void;
}
