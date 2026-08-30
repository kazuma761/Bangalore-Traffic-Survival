import { Entity } from './Entity.ts';
import type { EntityContext } from './Entity.ts';
import { CONFIG } from '../core/GameConfig.ts';

export type VehicleKind = 'cab' | 'auto' | 'bus';

/**
 * Shared behaviour for anything driving on the road.
 *
 * `direction` is +1 for traffic moving down-screen (toward Nitesh, who walks
 * up-screen) and -1 for traffic moving away from him. The road is two-way, so
 * both exist; a vehicle driving against its own lane's flow is `wrongWay`,
 * which is a normal Tuesday here.
 */
export abstract class Vehicle extends Entity {
  abstract readonly kind: VehicleKind;
  /** Units per second along the vehicle's own heading. Always positive. */
  speed = 10;
  /** +1 = travelling toward +Z (at Nitesh), -1 = travelling toward -Z. */
  direction: 1 | -1 = 1;
  /** True when this vehicle is driving against its lane's designated flow. */
  wrongWay = false;
  /** Throttles HONK! pop-ups so a stuck car does not spam the screen. */
  private honkTimer = 0;

  /** Faces the mesh along its heading. Call after setting `direction`. */
  applyHeading(): void {
    // Meshes are authored nose-toward-+Z, so -1 vehicles turn around.
    this.mesh.rotation.y = this.direction === 1 ? 0 : Math.PI;
  }

  /** True once per honk cooldown while this vehicle is crowding Nitesh. */
  tryHonk(): boolean {
    if (this.honkTimer > 0) return false;
    this.honkTimer = CONFIG.honking.honkCooldown;
    return true;
  }

  update(dt: number, ctx: EntityContext): void {
    if (this.honkTimer > 0) this.honkTimer -= dt;
    this.drive(dt, ctx);
    this.z += this.speed * this.direction * dt;

    // Retire once well clear of Nitesh, on whichever side it left by.
    const behind = this.z > ctx.playerZ + CONFIG.traffic.despawnBehind;
    const ahead = this.z < ctx.playerZ - CONFIG.traffic.spawnAhead - 40;
    if (behind || ahead) this.alive = false;
  }

  /** Per-kind steering, run before the forward motion is applied. */
  protected abstract drive(dt: number, ctx: EntityContext): void;
}
