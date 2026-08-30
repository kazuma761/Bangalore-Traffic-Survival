import * as THREE from 'three';
import { Vehicle } from './Vehicle.ts';
import { randomChoice } from '../utils/math.ts';

const LIVERIES = [0x1b5e20, 0x0d47a1] as const;

/**
 * The boss. A full-length BMTC bus that picks one lane and holds it at speed,
 * for anybody, ever. Getting caught by one is effectively a run-ender.
 */
export class BMTCBus extends Vehicle {
  readonly kind = 'bus' as const;
  private stripe!: THREE.Mesh;
  private flashPhase = 0;

  constructor(x: number, z: number) {
    super(x, z);
    this.build();
  }

  protected build(): void {
    this.halfWidth = 1.45;
    this.halfLength = 6.2;

    const livery = randomChoice(LIVERIES);
    const bodyMat = new THREE.MeshStandardMaterial({ color: livery, roughness: 0.6, flatShading: true });

    const body = new THREE.Mesh(new THREE.BoxGeometry(2.9, 2.9, 12.4), bodyMat);
    body.position.y = 1.9;
    this.mesh.add(body);

    // Warning stripe that pulses, so players read it as lethal at a glance.
    this.stripe = new THREE.Mesh(
      new THREE.BoxGeometry(2.94, 0.5, 12.44),
      new THREE.MeshBasicMaterial({ color: 0xffd600 })
    );
    this.stripe.position.y = 1.2;
    this.mesh.add(this.stripe);

    const glass = new THREE.MeshStandardMaterial({ color: 0x90caf9, roughness: 0.2, flatShading: true });
    for (let z = -5.2; z <= 4.2; z += 1.6) {
      for (const x of [-1.46, 1.46]) {
        const win = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.9, 1.15), glass);
        win.position.set(x, 2.5, z);
        this.mesh.add(win);
      }
    }

    // Windscreen and headlights at the leading (down-screen) end.
    const screen = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.2, 0.08), glass);
    screen.position.set(0, 2.6, 6.22);
    this.mesh.add(screen);

    const lampMat = new THREE.MeshBasicMaterial({ color: 0xffffe0 });
    for (const x of [-1.0, 1.0]) {
      const l = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.15), lampMat);
      l.position.set(x, 1.0, 6.25);
      this.mesh.add(l);
    }

    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, flatShading: true });
    const wheelGeom = new THREE.CylinderGeometry(0.62, 0.62, 0.34, 10);
    for (const x of [-1.45, 1.45]) {
      for (const z of [-4.4, 3.4, 4.6]) {
        const w = new THREE.Mesh(wheelGeom, wheelMat);
        w.rotation.z = Math.PI / 2;
        w.position.set(x, 0.62, z);
        this.mesh.add(w);
      }
    }
  }

  /** Never brakes, never swerves. That is the whole character. */
  protected drive(dt: number): void {
    this.flashPhase += dt * 5;
    (this.stripe.material as THREE.MeshBasicMaterial).color.setHex(
      Math.sin(this.flashPhase) > 0 ? 0xffd600 : 0xff6f00
    );
  }
}
