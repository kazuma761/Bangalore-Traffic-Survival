import * as THREE from 'three';
import { GameLoop } from './GameLoop.ts';
import { InputManager } from './InputManager.ts';
import { AudioManager } from './AudioManager.ts';
import { CONFIG, GOAL_LABEL } from './GameConfig.ts';
import { eventBus } from './EventBus.ts';

import { Nitesh } from '../entities/Nitesh.ts';
import type { EntityContext } from '../entities/Entity.ts';

import { RoadWorld } from '../world/RoadWorld.ts';
import { TrafficSystem } from '../systems/TrafficSystem.ts';
import { HonkingSystem } from '../systems/HonkingSystem.ts';
import { CollisionSystem } from '../systems/CollisionSystem.ts';
import { BarricadeSystem } from '../systems/BarricadeSystem.ts';
import { FoodSystem } from '../systems/FoodSystem.ts';
import { ProgressSystem } from '../systems/ProgressSystem.ts';

import { TopDownCamera } from '../rendering/TopDownCamera.ts';
import { FloatingText } from '../rendering/FloatingText.ts';
import { GoalArrow } from '../rendering/GoalArrow.ts';
import { HUD } from '../rendering/HUD.ts';

type Phase = 'menu' | 'running' | 'over';

/**
 * Orchestrator. It wires the systems together and owns the run's phase;
 * every piece of rendering and every rule lives in its own component.
 */
export class Game {
  private container!: HTMLElement;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private cam!: TopDownCamera;
  private loop!: GameLoop;

  private input = new InputManager();
  private audio = new AudioManager();

  private world!: RoadWorld;
  private nitesh!: Nitesh;
  private traffic!: TrafficSystem;
  private honking = new HonkingSystem();
  private collisions = new CollisionSystem();
  private barricades!: BarricadeSystem;
  private food!: FoodSystem;
  private progress!: ProgressSystem;

  private hud!: HUD;
  private floaters!: FloatingText;
  private arrow!: GoalArrow;

  private phase: Phase = 'menu';

  async init(): Promise<void> {
    this.container = document.getElementById('game-container')!;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x9db8c9);
    this.container.insertBefore(this.renderer.domElement, this.container.firstChild);
    window.addEventListener('resize', () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    this.cam = new TopDownCamera();
    this.scene = this.buildScene();

    const overlay = document.getElementById('ui-overlay') as HTMLElement;
    this.hud = new HUD(overlay);
    this.floaters = new FloatingText(overlay, this.cam);
    this.arrow = new GoalArrow(overlay, this.cam);

    this.bindUI();

    this.loop = new GameLoop(
      (dt) => this.update(dt),
      () => this.render()
    );
    this.loop.start();
  }

  private buildScene(): THREE.Scene {
    const scene = new THREE.Scene();
    // Hazy Bangalore afternoon.
    scene.fog = new THREE.Fog(0x9db8c9, 90, 190);
    scene.add(new THREE.AmbientLight(0xfff3e0, 0.75));

    const sun = new THREE.DirectionalLight(0xfff3e0, 0.85);
    sun.position.set(40, 90, 20);
    scene.add(sun);

    scene.add(new THREE.HemisphereLight(0xbcd4e6, 0x4a4038, 0.45));
    return scene;
  }

  private bindUI(): void {
    document.getElementById('play-btn')!.addEventListener('click', () => this.startRun());
    document.getElementById('restart-btn')!.addEventListener('click', () => this.startRun());
    document.getElementById('sound-btn')!.addEventListener('click', (e) => {
      const on = this.audio.toggle();
      (e.currentTarget as HTMLElement).textContent = on ? '🔊' : '🔇';
    });
  }

  // ===== Run lifecycle =====

  private startRun(): void {
    this.teardownRun();

    this.world = new RoadWorld(this.scene);
    this.nitesh = new Nitesh(0, this.world.startZ);
    this.scene.add(this.nitesh.mesh);

    this.traffic = new TrafficSystem(this.scene, this.world);
    this.barricades = new BarricadeSystem(this.scene, this.world);
    this.food = new FoodSystem(this.scene, this.world);
    this.progress = new ProgressSystem(this.world);
    this.honking.reset();
    this.input.reset();

    this.cam.snapTo(this.nitesh.x, this.nitesh.z);
    this.floaters.clear();
    this.floaters.spawn('Get home, Nitesh!', 0, this.world.startZ - 4, 'blessing', 2.2);

    document.getElementById('main-menu')!.style.display = 'none';
    document.getElementById('game-over')!.style.display = 'none';
    this.hud.show(true);
    this.arrow.show(true);

    this.phase = 'running';
    // Handy for debugging a run from the devtools console.
    (window as unknown as { game: Game }).game = this;
    eventBus.emit('run:start');
  }

  /** Read-only snapshot used by tests and the console. */
  debugState(): Record<string, number | string> {
    return {
      phase: this.phase,
      x: Number(this.nitesh?.x.toFixed(2) ?? 0),
      z: Number(this.nitesh?.z.toFixed(2) ?? 0),
      health: Math.round(this.nitesh?.health ?? 0),
      sanity: Math.round(this.nitesh?.sanity ?? 0),
      stress: Math.round(this.honking.stress),
      crowding: this.honking.crowding,
      vehicles: this.traffic?.vehicles.length ?? 0,
      metres: this.progress?.metresRemaining ?? 0,
    };
  }

  private teardownRun(): void {
    this.traffic?.clear();
    this.barricades?.clear();
    this.food?.clear();
    this.nitesh?.dispose();
    this.world?.dispose();
  }

  private endRun(won: boolean, cause: string): void {
    this.phase = 'over';
    this.hud.show(false);
    this.arrow.show(false);

    if (won) this.audio.playVictory();
    else this.audio.playDefeat();

    const panel = document.getElementById('game-over')!;
    panel.style.display = 'flex';
    document.getElementById('go-title')!.textContent = won ? 'You made it home!' : 'Commute failed';
    document.getElementById('go-title')!.style.color = won ? '#69f0ae' : '#ff5252';
    document.getElementById('go-cause')!.textContent = cause;

    const mins = Math.floor(this.progress.time / 60);
    const secs = Math.floor(this.progress.time % 60);
    document.getElementById('go-stats')!.innerHTML =
      `Distance covered: <b>${this.progress.metresCovered} m</b> of ${CONFIG.TOTAL_DISTANCE_M} m<br>` +
      `Time on the road: <b>${mins}:${secs.toString().padStart(2, '0')}</b><br>` +
      `Wallet remaining: <b>₹${this.nitesh.wallet.toLocaleString('en-IN')}</b>`;

    eventBus.emit('run:end', won);
  }

  // ===== Per-tick =====

  private update(dt: number): void {
    if (this.phase !== 'running') return;

    // 1. Player intent.
    if (this.input.consumeSprint() && this.nitesh.trySprint()) {
      this.audio.playSprint();
    }
    const move = this.input.getMovement();
    this.nitesh.move(dt, move.x, move.z, this.world.halfWidth, this.world.minZ, this.world.maxZ);
    this.nitesh.update(dt);

    const ctx: EntityContext = {
      playerX: this.nitesh.x,
      playerZ: this.nitesh.z,
      roadHalfWidth: this.world.halfWidth,
    };

    // 2. World reacts.
    this.progress.update(dt, this.nitesh.z);
    this.traffic.update(dt, ctx, this.progress.progress);
    this.barricades.update(dt, this.nitesh);

    // 3. The honking sense.
    for (const honk of this.honking.update(dt, this.nitesh, this.traffic.vehicles)) {
      this.floaters.spawn('HONK!', honk.x, honk.z, 'honk', 0.75);
      this.audio.playHonk();
    }

    // 4. Traffic collisions.
    for (const hit of this.collisions.update(this.nitesh, this.traffic.vehicles)) {
      this.floaters.spawn(hit.label, hit.x, hit.z, 'damage', 1.3);
      if (hit.healthLost > 0) {
        this.floaters.spawn(`-${hit.healthLost} HP`, this.nitesh.x, this.nitesh.z, 'damage', 1.1);
      }
      if (hit.sanityLost > 0) {
        this.floaters.spawn(`-${hit.sanityLost} Sanity`, this.nitesh.x - 2, this.nitesh.z, 'curse', 1.1);
      }
      if (hit.moneyLost > 0) {
        this.floaters.spawn(`-₹${hit.moneyLost}`, this.nitesh.x + 2, this.nitesh.z, 'money', 1.2);
        this.audio.playCoinLoss();
      }
      if (hit.kind === 'bus') this.audio.playBusHorn();
      else if (hit.kind === 'auto') this.audio.playAutoHorn();
      this.audio.playHit();
    }

    // 5. Street food gamble.
    const pickup = this.food.update(dt, this.nitesh);
    if (pickup) {
      this.floaters.spawn(pickup.message, pickup.x, pickup.z, pickup.blessing ? 'blessing' : 'curse', 2);
      if (pickup.blessing) {
        this.floaters.spawn(`+${CONFIG.food.blessingHealth} HP · Sanity restored`, pickup.x, pickup.z - 3, 'blessing', 1.8);
        this.audio.playBlessing();
      } else {
        this.floaters.spawn(`-${CONFIG.food.curseHealth} HP · Gastro Debuff`, pickup.x, pickup.z - 3, 'curse', 1.8);
        this.audio.playCurse();
      }
    }

    // 6. HUD + navigation.
    this.hud.update({
      health: this.nitesh.health,
      sanity: this.nitesh.sanity,
      stress: this.honking.stress,
      sprintEnergy: this.nitesh.sprintEnergy,
      sprintReady: this.nitesh.sprintReady,
      wallet: this.nitesh.wallet,
      metresRemaining: this.progress.metresRemaining,
      elapsed: this.progress.time,
      gastro: this.nitesh.hasGastro,
    });
    this.arrow.update(this.nitesh.x, this.nitesh.z, 0, this.world.goalZ, this.progress.metresRemaining);

    this.cam.follow(dt, this.nitesh.x, this.nitesh.z);

    // 7. Win / lose.
    if (this.progress.finished) {
      this.endRun(true, `You reached the ${GOAL_LABEL}.`);
    } else if (this.nitesh.health <= 0) {
      this.endRun(false, 'Health hit zero somewhere in the gridlock.');
    } else if (this.nitesh.sanity <= 0) {
      this.endRun(false, 'The honking broke him. Sanity hit zero.');
    }
  }

  private render(): void {
    // Floating text follows the camera, so it updates on the render tick.
    this.floaters.update(1 / 60);
    this.renderer.render(this.scene, this.cam.camera);
  }
}
