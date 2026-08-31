import * as THREE from 'three';
import { GameLoop } from './GameLoop.ts';
import { InputManager } from './InputManager.ts';
import { AudioManager } from './AudioManager.ts';
import { CONFIG } from './GameConfig.ts';
import { QUALITY } from './Quality.ts';
import { eventBus } from './EventBus.ts';
import {
  HONK_SOUNDS,
  LOSE_LINES,
  POTHOLE_LINES,
  STRESS_LINES,
  WIN_LINES,
  randomLine,
} from './Dialogue.ts';

import { Nitesh } from '../entities/Nitesh.ts';
import type { EntityContext } from '../entities/Entity.ts';

import { RoadWorld } from '../world/RoadWorld.ts';
import { TrafficSystem } from '../systems/TrafficSystem.ts';
import { HonkingSystem } from '../systems/HonkingSystem.ts';
import { CollisionSystem } from '../systems/CollisionSystem.ts';
import { BarricadeSystem } from '../systems/BarricadeSystem.ts';
import { FoodSystem } from '../systems/FoodSystem.ts';
import { PotholeSystem } from '../systems/PotholeSystem.ts';
import { ProgressSystem } from '../systems/ProgressSystem.ts';

import { TopDownCamera } from '../rendering/TopDownCamera.ts';
import { FloatingText } from '../rendering/FloatingText.ts';
import { GoalArrow } from '../rendering/GoalArrow.ts';
import { HUD } from '../rendering/HUD.ts';
import { StoryScreen } from '../rendering/StoryScreen.ts';

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
  private potholes!: PotholeSystem;
  private progress!: ProgressSystem;

  private hud!: HUD;
  private floaters!: FloatingText;
  private arrow!: GoalArrow;
  private story!: StoryScreen;
  /** Throttles the on-screen stress warning so it does not flicker. */
  private stressWarnTimer = 0;

  private phase: Phase = 'menu';

  async init(): Promise<void> {
    this.container = document.getElementById('game-container')!;

    this.renderer = new THREE.WebGLRenderer({
      antialias: QUALITY.antialias,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, QUALITY.maxPixelRatio));
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
    this.story = new StoryScreen(overlay);

    // Bytes download now; decoding waits for the first gesture (mobile policy).
    void this.audio.prefetch(import.meta.env.BASE_URL);
    for (const ev of ['pointerdown', 'keydown', 'touchstart']) {
      window.addEventListener(ev, () => this.audio.unlock(), { once: true, passive: true });
    }

    this.bindUI();

    this.loop = new GameLoop(
      (dt) => this.update(dt),
      () => this.render()
    );
    this.loop.start();

    this.dismissBootScreen();
  }

  /** Fades out the static boot overlay once the engine is actually live. */
  private dismissBootScreen(): void {
    const boot = document.getElementById('boot-screen');
    if (!boot) return;
    boot.classList.add('done');
    boot.addEventListener('transitionend', () => boot.remove(), { once: true });
    // Belt and braces if the transition never fires (reduced motion, etc).
    window.setTimeout(() => boot.remove(), 800);
  }

  private buildScene(): THREE.Scene {
    const scene = new THREE.Scene();
    // Hazy Bangalore afternoon.
    scene.fog = new THREE.Fog(0x9db8c9, QUALITY.fogNear, QUALITY.fogFar);
    scene.add(new THREE.AmbientLight(0xfff3e0, 0.75));

    const sun = new THREE.DirectionalLight(0xfff3e0, 0.85);
    sun.position.set(40, 90, 20);
    scene.add(sun);

    scene.add(new THREE.HemisphereLight(0xbcd4e6, 0x4a4038, 0.45));
    return scene;
  }

  private bindUI(): void {
    document.getElementById('play-btn')!.addEventListener('click', () => {
      document.getElementById('main-menu')!.style.display = 'none';
      this.story.show(() => this.startRun());
    });
    // Retries skip the intro — you already know why he is out here.
    document.getElementById('restart-btn')!.addEventListener('click', () => this.startRun());
    document.getElementById('sound-btn')!.addEventListener('click', (e) => {
      const on = this.audio.toggle();
      (e.currentTarget as HTMLElement).textContent = on ? '🔊' : '🔇';
    });
  }

  // ===== Run lifecycle =====

  /**
   * Building the road allocates several hundred meshes, which is a visible
   * freeze on a phone. Show the overlay, let the browser paint two frames, then
   * do the heavy work — so the tap always feels acknowledged.
   */
  private startRun(): void {
    document.getElementById('main-menu')!.style.display = 'none';
    document.getElementById('game-over')!.style.display = 'none';
    this.showBuilding(true);

    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        this.buildRun();
        this.showBuilding(false);
      })
    );
  }

  private showBuilding(visible: boolean): void {
    let el = document.getElementById('building-overlay');
    if (!el) {
      el = document.createElement('div');
      el.id = 'building-overlay';
      el.className = 'screen';
      el.style.cssText =
        'position:absolute;inset:0;z-index:120;display:flex;flex-direction:column;' +
        'align-items:center;justify-content:center;gap:12px;' +
        'font-family:system-ui,sans-serif;color:#fff;text-align:center;' +
        'background:linear-gradient(150deg,#1b2735,#0f3460);';
      el.innerHTML =
        '<div style="font-size:20px;font-weight:800">Sarjapur Road, 6:40 PM</div>' +
        '<div class="boot-track"><div class="boot-bar"></div></div>';
      document.getElementById('ui-overlay')!.appendChild(el);
    }
    el.style.display = visible ? 'flex' : 'none';
  }

  private buildRun(): void {
    this.teardownRun();

    this.world = new RoadWorld(this.scene);
    this.nitesh = new Nitesh(0, this.world.startZ);
    this.scene.add(this.nitesh.mesh);

    this.traffic = new TrafficSystem(this.scene, this.world);
    this.barricades = new BarricadeSystem(this.scene, this.world);
    this.food = new FoodSystem(this.scene, this.world);
    this.potholes = new PotholeSystem(this.scene, this.world, QUALITY.potholeDensity);
    this.progress = new ProgressSystem(this.world);
    this.honking.reset();
    this.input.reset();

    this.cam.snapTo(this.nitesh.x, this.nitesh.z);
    this.floaters.clear();
    this.floaters.spawn('Get home, Nitesh!', 0, this.world.startZ - 4, 'blessing', 2.2);

    this.hud.show(true);
    this.arrow.show(true);

    this.stressWarnTimer = 0;
    this.audio.startAmbience();

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
    this.potholes?.clear();
    this.nitesh?.dispose();
    this.world?.dispose();
  }

  private endRun(won: boolean, title: string, cause: string): void {
    this.phase = 'over';
    this.hud.show(false);
    this.arrow.show(false);

    if (won) this.audio.playVictory();
    else this.audio.playDefeat();

    const panel = document.getElementById('game-over')!;
    panel.style.display = 'flex';
    document.getElementById('go-title')!.textContent = title;
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
      this.floaters.spawn(randomLine(HONK_SOUNDS), honk.x, honk.z, 'honk', 0.75);
      if (honk.kind === 'auto') this.audio.playAutoHorn();
      else if (honk.kind === 'bus') this.audio.playBusHorn();
      else this.audio.playHonk();
    }

    // Road noise swells with the size of the cluster around him.
    this.audio.setAmbienceIntensity(Math.min(1, this.honking.crowding / 5));

    // A wrong-way bus deserves a shout before it arrives.
    if (this.traffic.wrongWayAlert) {
      const a = this.traffic.wrongWayAlert;
      this.floaters.spawn('⚠ WRONG SIDE BUS!', a.x, a.z, 'damage', 2);
      this.audio.playBusHorn();
    }

    // Standing warning while the meter is pinned.
    this.stressWarnTimer -= dt;
    if (this.honking.maxed && this.stressWarnTimer <= 0) {
      this.stressWarnTimer = 2.4;
      this.floaters.spawn(randomLine(STRESS_LINES), this.nitesh.x, this.nitesh.z - 4, 'curse', 1.6);
    }

    // 4. Traffic collisions.
    for (const hit of this.collisions.update(dt, this.nitesh, this.traffic.vehicles)) {
      this.floaters.spawn(hit.label, hit.x, hit.z, 'damage', 1.3);
      if (hit.healthLost > 0) {
        this.floaters.spawn(`-${hit.healthLost} HP`, this.nitesh.x, this.nitesh.z, 'damage', 1.1);
      }
      // Offset in both axes so the two numbers never sit on top of each other.
      if (hit.sanityLost > 0) {
        this.floaters.spawn(`-${hit.sanityLost} Sanity`, this.nitesh.x - 5, this.nitesh.z - 1.5, 'curse', 1.1);
      }
      if (hit.moneyLost > 0) {
        this.floaters.spawn(`-₹${hit.moneyLost}`, this.nitesh.x + 5, this.nitesh.z + 1.5, 'money', 1.2);
        this.audio.playCoinLoss();
      }
      if (hit.kind === 'bus') this.audio.playBusHorn();
      else if (hit.kind === 'auto') this.audio.playAutoHorn();
      this.audio.playHit();
    }

    if (this.collisions.nearMiss) this.audio.playCarPass();

    // 5. Potholes — cheap damage that punishes sprinting blind.
    const trip = this.potholes.update(this.nitesh);
    if (trip) {
      this.floaters.spawn(randomLine(POTHOLE_LINES), trip.x, trip.z, 'damage', 1.5);
      this.floaters.spawn(`-${trip.damage} HP`, this.nitesh.x + 3, this.nitesh.z, 'damage', 1);
      this.audio.playHit();
    }

    // 6. Street food gamble.
    const pickup = this.food.update(dt, this.nitesh);
    if (pickup) {
      this.floaters.spawn(pickup.message, pickup.x, pickup.z, pickup.blessing ? 'blessing' : 'curse', 2);
      if (pickup.blessing) {
        this.floaters.spawn(`+${CONFIG.food.blessingHealth} HP · Sanity restored`, pickup.x, pickup.z - 3, 'blessing', 1.8);
        this.audio.playBlessing(pickup.kind);
      } else {
        this.floaters.spawn(`-${CONFIG.food.curseHealth} HP · Gastro Debuff`, pickup.x, pickup.z - 3, 'curse', 1.8);
        this.audio.playCurse();
      }
    }

    // 7. HUD + navigation.
    this.hud.update({
      health: this.nitesh.health,
      sanity: this.nitesh.sanity,
      stress: this.honking.stress,
      sprintEnergy: this.nitesh.sprintEnergy,
      sprintReady: this.nitesh.sprintReady,
      wallet: this.nitesh.wallet,
      metresRemaining: this.progress.metresRemaining,
      elapsed: this.progress.time,
      poisoned: this.nitesh.hasFoodPoisoning,
      staggered: this.nitesh.isStaggered,
    });
    this.arrow.update(this.nitesh.x, this.nitesh.z, 0, this.world.goalZ, this.progress.metresRemaining);

    this.cam.follow(dt, this.nitesh.x, this.nitesh.z);

    // 8. Win / lose.
    if (this.progress.finished) {
      this.endRun(true, WIN_LINES.title, WIN_LINES.sub);
    } else if (this.nitesh.health <= 0) {
      this.endRun(false, LOSE_LINES.health.title, LOSE_LINES.health.sub);
    } else if (this.nitesh.sanity <= 0) {
      this.endRun(false, LOSE_LINES.sanity.title, LOSE_LINES.sanity.sub);
    }
  }

  private render(): void {
    // Floating text follows the camera, so it updates on the render tick.
    this.floaters.update(1 / 60);
    this.renderer.render(this.scene, this.cam.camera);
  }
}
