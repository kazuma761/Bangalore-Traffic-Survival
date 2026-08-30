import * as THREE from 'three';
import { Vehicle } from './Vehicle.ts';
import type { EntityContext } from './Entity.ts';
import { randomChoice, randomRange } from '../utils/math.ts';

const CAB_WHITE = 0xf5f5f5;
const SUV_GREYS = [0xe0e0e0, 0xcfd8dc, 0xfafafa, 0xb0bec5] as const;

/**
 * The white cabs and SUVs that form the gridlock. They hold their lane but
 * bunch up: TrafficSystem spawns them in tight clusters so gaps are narrow.
 */
export class Cab extends Vehicle {
  readonly kind = 'cab' as const;
  private isSUV = Math.random() < 0.4;
  private brakeLights: THREE.Mesh[] = [];
  /** Cabs randomly stop dead in traffic, which is what makes gridlock. */
  private jamTimer = randomRange(1.5, 5);
  private jammed = false;
  private cruiseSpeed = 0;

  constructor(x: number, z: number) {
    super(x, z);
    this.build();
  }

  protected build(): void {
    const suv = this.isSUV;
    const len = suv ? 5.2 : 4.4;
    const wid = suv ? 2.2 : 1.95;
    const bodyH = suv ? 1.3 : 1.0;
    this.halfWidth = wid / 2;
    this.halfLength = len / 2;

    const paint = suv ? randomChoice(SUV_GREYS) : CAB_WHITE;
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(wid, bodyH, len),
      new THREE.MeshStandardMaterial({ color: paint, roughness: 0.55, flatShading: true })
    );
    body.position.y = bodyH / 2 + 0.35;
    this.mesh.add(body);

    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(wid * 0.88, 0.6, len * 0.45),
      new THREE.MeshStandardMaterial({ color: 0x37474f, roughness: 0.3, flatShading: true })
    );
    cabin.position.set(0, bodyH + 0.6, suv ? 0.1 : -0.15);
    this.mesh.add(cabin);

    // Yellow "TAXI" roof sign on plain white cabs only.
    if (!suv) {
      const sign = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 0.22, 0.3),
        new THREE.MeshStandardMaterial({ color: 0xffc107, flatShading: true })
      );
      sign.position.set(0, bodyH + 1.0, -0.15);
      this.mesh.add(sign);
    }

    // Headlights point down-screen, toward the player.
    const lightMat = new THREE.MeshBasicMaterial({ color: 0xfff59d });
    for (const x of [-wid * 0.32, wid * 0.32]) {
      const l = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.2, 0.12), lightMat);
      l.position.set(x, 0.85, len / 2);
      this.mesh.add(l);
    }

    // Brake lights brighten when the vehicle is stuck.
    const brakeMat = new THREE.MeshBasicMaterial({ color: 0x8e2020 });
    for (const x of [-wid * 0.32, wid * 0.32]) {
      const l = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.18, 0.12), brakeMat.clone());
      l.position.set(x, 0.85, -len / 2);
      this.mesh.add(l);
      this.brakeLights.push(l);
    }

    for (const x of [-wid / 2, wid / 2]) {
      for (const z of [-len * 0.3, len * 0.3]) {
        const wheel = new THREE.Mesh(
          new THREE.CylinderGeometry(0.36, 0.36, 0.22, 8),
          new THREE.MeshStandardMaterial({ color: 0x212121, flatShading: true })
        );
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(x, 0.36, z);
        this.mesh.add(wheel);
      }
    }
  }

  protected drive(dt: number, _ctx: EntityContext): void {
    if (this.cruiseSpeed === 0) this.cruiseSpeed = this.speed;

    // Stop-and-go: the defining feature of this road.
    this.jamTimer -= dt;
    if (this.jamTimer <= 0) {
      this.jammed = !this.jammed;
      this.jamTimer = this.jammed ? randomRange(0.8, 2.6) : randomRange(1.5, 4);
    }
    const target = this.jammed ? this.cruiseSpeed * 0.12 : this.cruiseSpeed;
    this.speed += (target - this.speed) * Math.min(1, dt * 3.5);

    const braking = this.speed < this.cruiseSpeed * 0.55;
    for (const light of this.brakeLights) {
      (light.material as THREE.MeshBasicMaterial).color.setHex(braking ? 0xff1744 : 0x8e2020);
    }
  }
}
