import * as THREE from 'three';
import { Vehicle } from './Vehicle.ts';
import type { EntityContext } from './Entity.ts';
import { clamp } from '../utils/math.ts';

/**
 * Green-and-yellow auto-rickshaw that actively veers across lanes to cut
 * Nitesh off. It only hunts while it is still up-screen of him.
 */
export class AggressiveAuto extends Vehicle {
  readonly kind = 'auto' as const;
  /** How hard it swerves toward the player, units/sec of lateral speed. */
  private veerSpeed = 7 + Math.random() * 4;
  private wobblePhase = Math.random() * Math.PI * 2;
  private tiltTarget = 0;

  constructor(x: number, z: number) {
    super(x, z);
    this.build();
  }

  protected build(): void {
    this.halfWidth = 0.85;
    this.halfLength = 1.6;

    const green = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.65, flatShading: true });
    const yellow = new THREE.MeshStandardMaterial({ color: 0xffc107, roughness: 0.6, flatShading: true });
    const black = new THREE.MeshStandardMaterial({ color: 0x212121, roughness: 0.8, flatShading: true });

    // Yellow lower body, green canopy - the classic Bangalore auto livery.
    const lower = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.75, 2.7), yellow);
    lower.position.y = 0.72;
    this.mesh.add(lower);

    const canopy = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.85, 2.0), green);
    canopy.position.set(0, 1.5, -0.25);
    this.mesh.add(canopy);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.66, 0.12, 2.1), black);
    roof.position.set(0, 1.98, -0.25);
    this.mesh.add(roof);

    // Tapered nose facing down-screen.
    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.8), yellow);
    nose.position.set(0, 0.85, 1.5);
    this.mesh.add(nose);

    const lamp = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0xfff176 })
    );
    lamp.position.set(0, 1.05, 1.85);
    this.mesh.add(lamp);

    // Three wheels: one at the nose, two at the back.
    const wheelGeom = new THREE.CylinderGeometry(0.34, 0.34, 0.2, 8);
    const front = new THREE.Mesh(wheelGeom, black);
    front.rotation.z = Math.PI / 2;
    front.position.set(0, 0.34, 1.5);
    this.mesh.add(front);
    for (const x of [-0.75, 0.75]) {
      const w = new THREE.Mesh(wheelGeom, black);
      w.rotation.z = Math.PI / 2;
      w.position.set(x, 0.34, -0.8);
      this.mesh.add(w);
    }
  }

  protected drive(dt: number, ctx: EntityContext): void {
    // Only cuts him off while approaching; once past, it stops caring.
    const approaching = this.z < ctx.playerZ - 2;
    let lateral = 0;

    if (approaching) {
      const dx = ctx.playerX - this.x;
      lateral = clamp(dx, -1, 1) * this.veerSpeed;
    }

    // A permanent lane-weave on top, so autos never travel straight.
    this.wobblePhase += dt * 2.4;
    lateral += Math.sin(this.wobblePhase) * 2.2;

    this.x = clamp(this.x + lateral * dt, -ctx.roadHalfWidth + this.halfWidth, ctx.roadHalfWidth - this.halfWidth);

    // Lean into the swerve.
    this.tiltTarget = clamp(-lateral * 0.02, -0.22, 0.22);
    this.mesh.rotation.z += (this.tiltTarget - this.mesh.rotation.z) * Math.min(1, dt * 6);
    this.mesh.rotation.y = -clamp(lateral * 0.03, -0.35, 0.35);
  }
}
