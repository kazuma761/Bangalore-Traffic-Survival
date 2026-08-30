import * as THREE from 'three';
import { Vehicle } from './Vehicle.ts';
import type { EntityContext } from './Entity.ts';
import { clamp, randomChoice } from '../utils/math.ts';

/**
 * Auto Anna — the green-and-yellow auto-rickshaw, and the single most
 * Bangalore thing on this road. He does not want to take you anywhere; he
 * wants to appear beside you, quote a number, and refuse the meter. He
 * actively veers across lanes to cut Nitesh off.
 */
export class AutoAnna extends Vehicle {
  readonly kind = 'auto' as const;
  /** How hard he swerves toward the player, units/sec of lateral speed. */
  private veerSpeed = 7 + Math.random() * 4;
  private wobblePhase = Math.random() * Math.PI * 2;
  private tiltTarget = 0;
  /** Anna himself, visible at the handlebars. */
  private driver!: THREE.Mesh;
  private bobPhase = 0;

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

    // Yellow lower body, green canopy — the classic Bangalore auto livery.
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

    // Anna at the handlebars — khaki shirt, head visible under the canopy.
    this.driver = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.28, 0.34, 4, 8),
      new THREE.MeshStandardMaterial({ color: 0x9e8b6a, roughness: 0.9, flatShading: true })
    );
    this.driver.position.set(0, 1.28, 0.55);
    this.mesh.add(this.driver);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.9, flatShading: true })
    );
    head.position.set(0, 1.72, 0.55);
    this.mesh.add(head);

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

    // Rear panel slogan board, the way every auto carries one.
    this.addSloganBoard();
  }

  private addSloganBoard(): void {
    const slogans = ['ಅಮ್ಮ', 'JAI BHUVANESHWARI', 'ANNA', 'HOSA BALU', 'ಶ್ರೀ'];
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#1b5e20';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffeb3b';
    ctx.font = 'bold 34px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(randomChoice(slogans), canvas.width / 2, canvas.height / 2 + 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const board = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, 0.38),
      new THREE.MeshBasicMaterial({ map: texture })
    );
    board.position.set(0, 1.5, -1.27);
    board.rotation.y = Math.PI;
    this.mesh.add(board);
  }

  protected drive(dt: number, ctx: EntityContext): void {
    // He only hunts while he can still get in front of Nitesh. Which side
    // counts as "in front" depends on which way he is driving.
    const approaching =
      this.direction === 1 ? this.z < ctx.playerZ - 2 : this.z > ctx.playerZ + 2;
    let lateral = 0;

    if (approaching) {
      const dx = ctx.playerX - this.x;
      lateral = clamp(dx, -1, 1) * this.veerSpeed;
    }

    // A permanent lane-weave on top, so autos never travel straight.
    this.wobblePhase += dt * 2.4;
    lateral += Math.sin(this.wobblePhase) * 2.2;

    this.x = clamp(this.x + lateral * dt, -ctx.roadHalfWidth + this.halfWidth, ctx.roadHalfWidth - this.halfWidth);

    // Lean into the swerve, on top of whichever way he is facing.
    this.tiltTarget = clamp(-lateral * 0.02, -0.22, 0.22);
    this.mesh.rotation.z += (this.tiltTarget - this.mesh.rotation.z) * Math.min(1, dt * 6);
    const facing = this.direction === 1 ? 0 : Math.PI;
    this.mesh.rotation.y = facing - clamp(lateral * 0.03, -0.35, 0.35) * this.direction;

    // Anna bounces over every pothole on this road.
    this.bobPhase += dt * 9;
    this.driver.position.y = 1.28 + Math.sin(this.bobPhase) * 0.05;
  }
}
