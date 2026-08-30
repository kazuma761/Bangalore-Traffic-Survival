import * as THREE from 'three';
import { CONFIG } from '../core/GameConfig.ts';
import { Vehicle } from '../entities/Vehicle.ts';
import { Cab } from '../entities/Cab.ts';
import { AggressiveAuto } from '../entities/AggressiveAuto.ts';
import { BMTCBus } from '../entities/BMTCBus.ts';
import type { EntityContext } from '../entities/Entity.ts';
import type { RoadWorld } from '../world/RoadWorld.ts';
import { randomInt, randomRange, lerp } from '../utils/math.ts';

/**
 * Spawns and retires the traffic. Waves get denser as Nitesh nears HSR,
 * and cabs come in clusters so the gaps between bumpers stay tight.
 */
export class TrafficSystem {
  readonly vehicles: Vehicle[] = [];
  private scene: THREE.Scene;
  private world: RoadWorld;
  private waveTimer = 0.6;

  constructor(scene: THREE.Scene, world: RoadWorld) {
    this.scene = scene;
    this.world = world;
  }

  /** `progress` is 0 at the tech park, 1 at the gate. */
  update(dt: number, ctx: EntityContext, progress: number): void {
    this.waveTimer -= dt;
    if (this.waveTimer <= 0) {
      this.spawnWave(ctx.playerZ, progress);
      this.waveTimer = lerp(
        CONFIG.traffic.waveIntervalStart,
        CONFIG.traffic.waveIntervalEnd,
        progress
      ) * randomRange(0.8, 1.2);
    }

    for (let i = this.vehicles.length - 1; i >= 0; i--) {
      const v = this.vehicles[i];
      v.update(dt, ctx);
      if (!v.alive) {
        v.dispose();
        this.vehicles.splice(i, 1);
      }
    }
  }

  private spawnWave(playerZ: number, progress: number): void {
    const spawnZ = playerZ - CONFIG.traffic.spawnAhead;
    const lanes = this.shuffledLanes();
    const [minCabs, maxCabs] = CONFIG.traffic.cabsPerWave;
    const cabCount = randomInt(minCabs, Math.min(maxCabs + Math.floor(progress * 2), this.world.laneCount - 1));

    // Cabs and SUVs fill most lanes, leaving a shrinking number of gaps.
    for (let i = 0; i < cabCount; i++) {
      const cab = new Cab(this.world.laneCenter(lanes[i]), spawnZ - randomRange(0, 14));
      cab.speed = randomRange(9, 14) + progress * 3;
      this.add(cab);
    }

    if (Math.random() < CONFIG.traffic.autoChance) {
      const auto = new AggressiveAuto(
        this.world.laneCenter(lanes[cabCount % lanes.length]),
        spawnZ - randomRange(4, 20)
      );
      auto.speed = randomRange(12, 17) + progress * 4;
      this.add(auto);
    }

    // The bus only shows up once the run is properly under way.
    if (progress > 0.12 && Math.random() < CONFIG.traffic.busChance + progress * 0.12) {
      const bus = new BMTCBus(this.world.laneCenter(randomInt(0, this.world.laneCount - 1)), spawnZ - 26);
      bus.speed = randomRange(20, 25);
      this.add(bus);
    }
  }

  private shuffledLanes(): number[] {
    const lanes = Array.from({ length: this.world.laneCount }, (_, i) => i);
    for (let i = lanes.length - 1; i > 0; i--) {
      const j = randomInt(0, i);
      [lanes[i], lanes[j]] = [lanes[j], lanes[i]];
    }
    return lanes;
  }

  private add(v: Vehicle): void {
    this.scene.add(v.mesh);
    this.vehicles.push(v);
  }

  clear(): void {
    for (const v of this.vehicles) v.dispose();
    this.vehicles.length = 0;
    this.waveTimer = 0.6;
  }
}
