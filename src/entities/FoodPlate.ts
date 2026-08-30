import * as THREE from 'three';
import { Entity } from './Entity.ts';
import { CONFIG } from '../core/GameConfig.ts';
import { coinFlip } from '../utils/math.ts';

export type FoodKind = 'biryani' | 'coffee';

export interface FoodOutcome {
  blessing: boolean;
  message: string;
}

/**
 * A plate of street food on the tarmac. Picking it up is a coin flip:
 * either it fixes the commute or it ruins the next five seconds.
 */
export class FoodPlate extends Entity {
  readonly kind: FoodKind;
  private bobPhase = Math.random() * Math.PI * 2;
  private baseY = 0;

  constructor(x: number, z: number, kind: FoodKind) {
    super(x, z);
    this.kind = kind;
    this.halfWidth = CONFIG.food.plateRadius;
    this.halfLength = CONFIG.food.plateRadius;
    this.build();
  }

  protected build(): void {
    if (this.kind === 'biryani') {
      const plate = new THREE.Mesh(
        new THREE.CylinderGeometry(1.0, 0.85, 0.16, 14),
        new THREE.MeshStandardMaterial({ color: 0xeceff1, roughness: 0.5, flatShading: true })
      );
      plate.position.y = 0.4;
      this.mesh.add(plate);

      const rice = new THREE.Mesh(
        new THREE.SphereGeometry(0.72, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshStandardMaterial({ color: 0xffb74d, roughness: 0.9, flatShading: true })
      );
      rice.position.y = 0.48;
      this.mesh.add(rice);

      // A couple of masala flecks so it reads as biryani, not plain rice.
      const chunkMat = new THREE.MeshStandardMaterial({ color: 0x8d4a2f, flatShading: true });
      for (const [cx, cz] of [[0.25, 0.15], [-0.2, -0.28], [0.05, -0.35]] as const) {
        const chunk = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.2, 0.24), chunkMat);
        chunk.position.set(cx, 0.82, cz);
        this.mesh.add(chunk);
      }
    } else {
      // Filter coffee: steel tumbler in its davara.
      const davara = new THREE.Mesh(
        new THREE.CylinderGeometry(0.85, 0.6, 0.42, 14),
        new THREE.MeshStandardMaterial({ color: 0xb0bec5, roughness: 0.25, metalness: 0.6, flatShading: true })
      );
      davara.position.y = 0.42;
      this.mesh.add(davara);

      const tumbler = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.32, 0.85, 12),
        new THREE.MeshStandardMaterial({ color: 0xcfd8dc, roughness: 0.2, metalness: 0.7, flatShading: true })
      );
      tumbler.position.y = 0.95;
      this.mesh.add(tumbler);

      const brew = new THREE.Mesh(
        new THREE.CylinderGeometry(0.36, 0.36, 0.06, 12),
        new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.6 })
      );
      brew.position.y = 1.36;
      this.mesh.add(brew);
    }

    // Glow disc marking the pickup footprint.
    const halo = new THREE.Mesh(
      new THREE.RingGeometry(CONFIG.food.plateRadius * 0.75, CONFIG.food.plateRadius, 20),
      new THREE.MeshBasicMaterial({ color: 0xffee58, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false })
    );
    halo.rotation.x = -Math.PI / 2;
    halo.position.y = 0.06;
    this.mesh.add(halo);

    this.baseY = this.mesh.position.y;
  }

  update(dt: number): void {
    this.bobPhase += dt * 2.5;
    this.mesh.position.y = this.baseY + Math.sin(this.bobPhase) * 0.12;
    this.mesh.rotation.y += dt * 0.8;
  }

  /** Resolves the hidden 50/50 and consumes the plate. */
  consume(): FoodOutcome {
    this.alive = false;
    if (coinFlip()) {
      return {
        blessing: true,
        message: this.kind === 'coffee'
          ? 'Perfectly spiced filter coffee!'
          : 'Perfectly spiced biryani!',
      };
    }
    return { blessing: false, message: '🤢 Food Poisoning! Extreme Gut Damage!' };
  }
}
