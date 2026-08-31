import * as THREE from 'three';
import { CONFIG } from '../core/GameConfig.ts';
import { Vehicle } from '../entities/Vehicle.ts';
import { Cab } from '../entities/Cab.ts';
import { AutoAnna } from '../entities/AutoAnna.ts';
import { BMTCBus } from '../entities/BMTCBus.ts';
import type { EntityContext } from '../entities/Entity.ts';
import type { RoadWorld } from '../world/RoadWorld.ts';
import { randomInt, randomRange, lerp } from '../utils/math.ts';

/**
 * Spawns and retires traffic on a two-way road. Left lanes run at Nitesh,
 * right lanes run with him and overtake from behind, and a healthy minority
 * of vehicles ignore all of that and drive up the wrong side.
 */
export class TrafficSystem {
  readonly vehicles: Vehicle[] = [];
  private scene: THREE.Scene;
  private world: RoadWorld;
  private waveTimer = 0.6;
  /** Set for one frame when a wrong-way bus spawns, so Game can warn. */
  wrongWayAlert: { x: number; z: number } | null = null;

  constructor(scene: THREE.Scene, world: RoadWorld) {
    this.scene = scene;
    this.world = world;
  }

  /** `progress` is 0 at the tech park, 1 at the gate. */
  update(dt: number, ctx: EntityContext, progress: number): void {
    this.wrongWayAlert = null;

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

  /**
   * Where a vehicle enters from, given the way it is heading: traffic moving
   * at Nitesh (+1) appears up-screen, traffic moving with him (-1) appears
   * behind and overtakes.
   */
  private entryZ(playerZ: number, direction: 1 | -1): number {
    return direction === 1
      ? playerZ - CONFIG.traffic.spawnAhead - randomRange(0, 16)
      : playerZ + CONFIG.traffic.despawnBehind - randomRange(0, 16);
  }

  private spawnWave(playerZ: number, progress: number): void {
    const lanes = this.shuffledLanes();
    const [minCabs, maxCabs] = CONFIG.traffic.cabsPerWave;
    const cabCount = randomInt(
      minCabs,
      Math.min(maxCabs + Math.floor(progress * 2), this.world.laneCount - 1)
    );

    for (let i = 0; i < cabCount; i++) {
      const lane = lanes[i];
      const flow = this.world.laneDirection(lane);
      // Most cabs respect the lane; a few genuinely do not.
      const wrong = Math.random() < CONFIG.traffic.wrongWayCabChance;
      const dir = (wrong ? -flow : flow) as 1 | -1;

      const cab = new Cab(this.world.laneCenter(lane), this.entryZ(playerZ, dir));
      cab.direction = dir;
      cab.wrongWay = wrong;
      // Traffic heading out of the city is the free-flowing side, so it
      // overtakes Nitesh briskly instead of loitering next to him all run.
      cab.speed = (dir === 1 ? randomRange(9, 14) : randomRange(17, 23)) + progress * 3;
      cab.applyHeading();
      this.add(cab);
    }

    if (Math.random() < CONFIG.traffic.autoChance) {
      const lane = lanes[cabCount % lanes.length];
      // Auto Anna goes wherever the fare is. Direction is a coin flip.
      const dir: 1 | -1 = Math.random() < 0.65 ? 1 : -1;
      const auto = new AutoAnna(this.world.laneCenter(lane), this.entryZ(playerZ, dir));
      auto.direction = dir;
      auto.wrongWay = dir !== this.world.laneDirection(lane);
      auto.speed = (dir === 1 ? randomRange(12, 17) : randomRange(19, 25)) + progress * 4;
      auto.applyHeading();
      this.add(auto);
    }

    // A short grace period off the start line, then buses are a constant threat.
    if (progress > CONFIG.traffic.busAfterProgress &&
        Math.random() < CONFIG.traffic.busChance + progress * 0.2) {
      const lane = randomInt(0, this.world.laneCount - 1);
      const flow = this.world.laneDirection(lane);
      const wrong = Math.random() < CONFIG.traffic.wrongWayBusChance;
      const dir = (wrong ? -flow : flow) as 1 | -1;

      const bus = new BMTCBus(this.world.laneCenter(lane), this.entryZ(playerZ, dir));
      bus.direction = dir;
      bus.wrongWay = wrong;
      bus.speed = dir === 1 ? randomRange(20, 25) : randomRange(26, 32);
      bus.applyHeading();
      this.add(bus);

      if (wrong) this.wrongWayAlert = { x: bus.x, z: bus.z };
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
    this.wrongWayAlert = null;
  }
}
