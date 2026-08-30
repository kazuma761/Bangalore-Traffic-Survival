import * as THREE from 'three';
import { Entity } from './Entity.ts';

/**
 * Namma Metro construction barricade: a solid yellow-and-black striped block
 * that seals off whole lanes. It never moves - it just has to be walked around.
 */
export class MetroBarricade extends Entity {
  private width = 0;
  private lamps: THREE.Mesh[] = [];
  private phase = 0;

  constructor(x: number, z: number, width: number) {
    super(x, z);
    this.width = width;
    this.build();
  }

  protected build(): void {
    const width = this.width;
    this.halfWidth = width / 2;
    this.halfLength = 1.1;

    const depth = this.halfLength * 2;
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(width, 1.8, depth),
      new THREE.MeshStandardMaterial({ color: 0x212121, roughness: 0.85, flatShading: true })
    );
    base.position.y = 0.9;
    this.mesh.add(base);

    // Diagonal hazard stripes, faked with alternating angled slabs on the face.
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0xffd600, roughness: 0.7, flatShading: true });
    const stripeW = 0.75;
    const count = Math.floor(width / (stripeW * 2));
    for (let i = 0; i < count; i++) {
      const slab = new THREE.Mesh(new THREE.BoxGeometry(stripeW, 2.4, 0.14), stripeMat);
      slab.position.set(-width / 2 + stripeW + i * stripeW * 2, 0.9, depth / 2 + 0.01);
      slab.rotation.z = Math.PI / 5;
      this.mesh.add(slab);

      const back = slab.clone();
      back.position.z = -depth / 2 - 0.01;
      this.mesh.add(back);
    }

    // Blinking amber lamps on the corners.
    for (const x of [-width / 2 + 0.4, width / 2 - 0.4]) {
      const lamp = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 8, 6),
        new THREE.MeshBasicMaterial({ color: 0xff9100 })
      );
      lamp.position.set(x, 2.0, 0);
      this.mesh.add(lamp);
      this.lamps.push(lamp);
    }
  }

  update(dt: number): void {
    this.phase += dt * 3;
    const on = Math.sin(this.phase) > 0;
    for (const lamp of this.lamps) {
      (lamp.material as THREE.MeshBasicMaterial).color.setHex(on ? 0xff9100 : 0x5d3a00);
    }
  }

  /**
   * Pushes a circle out of the barricade along the shallowest axis.
   * Returns the corrected position, or null when there was no overlap.
   */
  resolve(px: number, pz: number, radius: number): { x: number; z: number } | null {
    const overlapX = this.halfWidth + radius - Math.abs(px - this.x);
    const overlapZ = this.halfLength + radius - Math.abs(pz - this.z);
    if (overlapX <= 0 || overlapZ <= 0) return null;

    if (overlapX < overlapZ) {
      return { x: this.x + Math.sign(px - this.x || 1) * (this.halfWidth + radius), z: pz };
    }
    return { x: px, z: this.z + Math.sign(pz - this.z || 1) * (this.halfLength + radius) };
  }
}
