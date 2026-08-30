import * as THREE from 'three';
import { disposeObject } from '../utils/dispose.ts';

/**
 * Everything in the world is an Entity: it builds and owns its own mesh,
 * updates itself, and reports an axis-aligned footprint for collisions.
 * Systems never reach inside an entity to draw it.
 */
export abstract class Entity {
  readonly mesh = new THREE.Group();
  /** Half-extent along X (across the road). */
  halfWidth = 1;
  /** Half-extent along Z (along the road). */
  halfLength = 1;
  alive = true;

  constructor(x: number, z: number) {
    this.mesh.position.set(x, 0, z);
  }

  /**
   * Subclasses assemble their own geometry here. It is deliberately NOT called
   * from this constructor: with `useDefineForClassFields`, a subclass's own
   * field initializers run after `super()` and would overwrite anything build()
   * assigned. Every concrete entity calls `this.build()` at the end of its own
   * constructor instead.
   */
  protected abstract build(): void;

  /** Advance one fixed timestep. */
  abstract update(dt: number, ctx: EntityContext): void;

  get x(): number {
    return this.mesh.position.x;
  }
  set x(v: number) {
    this.mesh.position.x = v;
  }
  get z(): number {
    return this.mesh.position.z;
  }
  set z(v: number) {
    this.mesh.position.z = v;
  }

  /** True when a circle of `radius` at (px, pz) overlaps this entity's footprint. */
  overlapsCircle(px: number, pz: number, radius: number): boolean {
    const dx = Math.abs(px - this.x) - this.halfWidth;
    const dz = Math.abs(pz - this.z) - this.halfLength;
    if (dx <= 0 && dz <= 0) return true;
    const cx = Math.max(dx, 0);
    const cz = Math.max(dz, 0);
    return cx * cx + cz * cz <= radius * radius;
  }

  dispose(): void {
    disposeObject(this.mesh);
  }
}

/** Read-only view of the run that entities need while updating. */
export interface EntityContext {
  /** Where Nitesh currently is, so traffic can react to him. */
  playerX: number;
  playerZ: number;
  /** Road half-width, for lane clamping. */
  roadHalfWidth: number;
}
