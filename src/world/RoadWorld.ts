import * as THREE from 'three';
import { CONFIG, GOAL_LABEL } from '../core/GameConfig.ts';
import { randomChoice, randomRange } from '../utils/math.ts';
import { disposeObject } from '../utils/dispose.ts';
import {
  createSmallBuilding,
  createITPark,
  createBanyanTree,
  createSmallTree,
  createLampPost,
  createCoffeeShop,
} from './ProceduralAssets.ts';

/**
 * The static stage: one long jammed multi-lane road running from a tech park
 * at Z=0 up to the HSR Layout Entry Gate at Z=goalZ, with buildings either side.
 * Built once per run; it owns and disposes all of its own meshes.
 */
export class RoadWorld {
  readonly group = new THREE.Group();
  readonly halfWidth = CONFIG.world.roadHalfWidth;
  readonly startZ = CONFIG.world.startZ;
  readonly goalZ = CONFIG.world.goalZ;
  /** Z bounds Nitesh may occupy. */
  readonly minZ = CONFIG.world.goalZ - 6;
  readonly maxZ = CONFIG.world.startZ + 10;

  private laneWidth = (CONFIG.world.roadHalfWidth * 2) / CONFIG.world.laneCount;

  constructor(scene: THREE.Scene) {
    this.buildGround();
    this.buildRoad();
    this.buildLaneMarkings();
    this.buildSidewalks();
    this.buildSkyline();
    this.buildTechPark();
    this.buildGate();
    scene.add(this.group);
  }

  /** Centre X of lane `i` (0 = leftmost). */
  laneCenter(i: number): number {
    return -this.halfWidth + this.laneWidth * (i + 0.5);
  }

  get laneCount(): number {
    return CONFIG.world.laneCount;
  }

  private get length(): number {
    return this.startZ - this.goalZ + CONFIG.world.margin * 2;
  }

  private get midZ(): number {
    return (this.startZ + this.goalZ) / 2;
  }

  private buildGround(): void {
    const dirt = new THREE.Mesh(
      new THREE.PlaneGeometry(this.halfWidth * 8, this.length + 200),
      new THREE.MeshStandardMaterial({ color: 0x6d5c4a, roughness: 1 })
    );
    dirt.rotation.x = -Math.PI / 2;
    dirt.position.set(0, -0.05, this.midZ);
    this.group.add(dirt);
  }

  private buildRoad(): void {
    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(this.halfWidth * 2, this.length),
      new THREE.MeshStandardMaterial({ color: 0x33383d, roughness: 0.95 })
    );
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0, this.midZ);
    this.group.add(road);

    // Scattered patches of worse tarmac, because this is a Bangalore road.
    const patchMat = new THREE.MeshStandardMaterial({ color: 0x2a2e32, roughness: 1 });
    for (let i = 0; i < 60; i++) {
      const patch = new THREE.Mesh(new THREE.CircleGeometry(randomRange(0.8, 2.6), 8), patchMat);
      patch.rotation.x = -Math.PI / 2;
      patch.position.set(
        randomRange(-this.halfWidth, this.halfWidth),
        0.01,
        randomRange(this.goalZ - CONFIG.world.margin, this.startZ + CONFIG.world.margin)
      );
      this.group.add(patch);
    }
  }

  private buildLaneMarkings(): void {
    const mat = new THREE.MeshBasicMaterial({ color: 0xe0e0e0, transparent: true, opacity: 0.55 });
    const dashGeom = new THREE.PlaneGeometry(0.22, 2.6);
    const from = this.goalZ - CONFIG.world.margin;
    const to = this.startZ + CONFIG.world.margin;

    for (let lane = 1; lane < CONFIG.world.laneCount; lane++) {
      const x = -this.halfWidth + this.laneWidth * lane;
      for (let z = from; z < to; z += 6) {
        const dash = new THREE.Mesh(dashGeom, mat);
        dash.rotation.x = -Math.PI / 2;
        dash.position.set(x, 0.02, z);
        this.group.add(dash);
      }
    }

    // Solid edge lines.
    for (const x of [-this.halfWidth + 0.15, this.halfWidth - 0.15]) {
      const edge = new THREE.Mesh(new THREE.PlaneGeometry(0.3, this.length), mat);
      edge.rotation.x = -Math.PI / 2;
      edge.position.set(x, 0.02, this.midZ);
      this.group.add(edge);
    }
  }

  private buildSidewalks(): void {
    const mat = new THREE.MeshStandardMaterial({ color: 0x9e9e9e, roughness: 0.9 });
    for (const side of [-1, 1]) {
      const walk = new THREE.Mesh(new THREE.BoxGeometry(5, 0.5, this.length), mat);
      walk.position.set(side * (this.halfWidth + 2.5), 0.25, this.midZ);
      this.group.add(walk);
    }
  }

  /** Buildings, trees and lamp posts flanking the corridor. */
  private buildSkyline(): void {
    const factories = [createSmallBuilding, createITPark, createCoffeeShop];
    const from = this.goalZ - CONFIG.world.margin;
    const to = this.startZ + CONFIG.world.margin;

    for (let z = from; z < to; z += randomRange(11, 18)) {
      for (const side of [-1, 1]) {
        const obj = randomChoice(factories)();
        // Assets were authored at hole-game scale; the commute is a person's scale.
        obj.mesh.scale.setScalar(3.2);
        obj.mesh.position.set(side * randomRange(this.halfWidth + 9, this.halfWidth + 22), 0.5, z);
        obj.mesh.rotation.y = randomRange(0, Math.PI * 2);
        this.group.add(obj.mesh);
      }
    }

    for (let z = from; z < to; z += randomRange(14, 26)) {
      for (const side of [-1, 1]) {
        const tree = (Math.random() < 0.35 ? createBanyanTree : createSmallTree)();
        tree.mesh.scale.setScalar(2.4);
        tree.mesh.position.set(side * (this.halfWidth + randomRange(3, 4.6)), 0.5, z);
        this.group.add(tree.mesh);
      }
    }

    for (let z = from; z < to; z += 20) {
      for (const side of [-1, 1]) {
        const lamp = createLampPost();
        lamp.mesh.scale.setScalar(3);
        lamp.mesh.position.set(side * (this.halfWidth + 1.2), 0.5, z);
        this.group.add(lamp.mesh);
      }
    }
  }

  /** The office Nitesh is escaping, sitting behind the start line. */
  private buildTechPark(): void {
    const park = createITPark();
    park.mesh.scale.setScalar(6);
    park.mesh.position.set(0, 0, this.startZ + 34);
    this.group.add(park.mesh);

    const sign = this.makeSignBoard('TECH PARK', 0x1565c0, 14);
    sign.position.set(0, 5.4, this.startZ + 16);
    this.group.add(sign);
  }

  /** The finish line arch. */
  private buildGate(): void {
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0xf9a825, roughness: 0.7, flatShading: true });
    for (const side of [-1, 1]) {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(2.4, 11, 2.4), pillarMat);
      pillar.position.set(side * (this.halfWidth + 1), 5.5, this.goalZ);
      this.group.add(pillar);
    }

    const beam = new THREE.Mesh(
      new THREE.BoxGeometry(this.halfWidth * 2 + 6, 2.6, 2.4),
      new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.7, flatShading: true })
    );
    beam.position.set(0, 10.5, this.goalZ);
    this.group.add(beam);

    // Sits clearly in front of the beam so the overhead camera never clips it.
    const sign = this.makeSignBoard(GOAL_LABEL, 0x2e7d32, this.halfWidth * 2);
    sign.position.set(0, 9.6, this.goalZ + 3.2);
    this.group.add(sign);

    // Chequered finish strip on the tarmac.
    const light = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const dark = new THREE.MeshBasicMaterial({ color: 0x212121 });
    const cell = this.halfWidth * 2 / 12;
    for (let i = 0; i < 12; i++) {
      for (let j = 0; j < 3; j++) {
        const tile = new THREE.Mesh(
          new THREE.PlaneGeometry(cell, cell),
          (i + j) % 2 === 0 ? light : dark
        );
        tile.rotation.x = -Math.PI / 2;
        tile.position.set(-this.halfWidth + cell * (i + 0.5), 0.03, this.goalZ + cell * (j - 1));
        this.group.add(tile);
      }
    }
  }

  /** Canvas-textured board so landmarks are labelled in-world. */
  private makeSignBoard(text: string, bg: number, width: number): THREE.Mesh {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 160;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = `#${bg.toString(16).padStart(6, '0')}`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 84px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text.toUpperCase(), canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const board = new THREE.Mesh(
      new THREE.PlaneGeometry(width, width * 0.156),
      new THREE.MeshBasicMaterial({ map: texture, transparent: true })
    );
    // Tilted toward the overhead camera so it stays readable from above.
    board.rotation.x = -Math.PI / 3;
    return board;
  }

  dispose(): void {
    disposeObject(this.group);
  }
}
