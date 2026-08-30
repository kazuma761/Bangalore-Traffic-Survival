import * as THREE from 'three';
import { Entity } from './Entity.ts';
import { CONFIG } from '../core/GameConfig.ts';
import { clamp } from '../utils/math.ts';

/**
 * The player: a blue fellow with a tiny dark-blue backpack, trying to get home.
 * Owns his own mesh, his own movement, and his own status effects.
 */
export class Nitesh extends Entity {
  health: number = CONFIG.nitesh.maxHealth;
  sanity: number = CONFIG.nitesh.maxSanity;
  wallet: number = CONFIG.nitesh.startingWallet;

  /** Sprint state machine. */
  private sprintTimer = 0;
  private cooldownTimer = 0;
  /** Food-poisoning timer from bad street food. */
  private poisonTimer = 0;
  /** Knockback impulse left over from a cab hit. */
  private knockTimer = 0;
  private knockDirX = 0;
  private knockDirZ = 0;
  private invulnTimer = 0;

  private body!: THREE.Mesh;
  private bobPhase = 0;

  constructor(x: number, z: number) {
    super(x, z);
    this.halfWidth = CONFIG.nitesh.radius;
    this.halfLength = CONFIG.nitesh.radius;
    this.build();
  }

  protected build(): void {
    const r = CONFIG.nitesh.radius;

    // Body - a rounded blue capsule reads clearly from directly overhead.
    this.body = new THREE.Mesh(
      new THREE.CapsuleGeometry(r * 0.62, r * 1.1, 4, 12),
      new THREE.MeshStandardMaterial({ color: 0x2979ff, roughness: 0.6, flatShading: true })
    );
    this.body.position.y = r * 1.25;
    this.mesh.add(this.body);

    // Head, so the top-down silhouette is not a featureless blob.
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(r * 0.45, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0xffcc80, roughness: 0.8, flatShading: true })
    );
    head.position.y = r * 2.15;
    this.mesh.add(head);

    // The tiny dark-blue backpack.
    const pack = new THREE.Mesh(
      new THREE.BoxGeometry(r * 0.95, r * 1.0, r * 0.5),
      new THREE.MeshStandardMaterial({ color: 0x0d1b4c, roughness: 0.9, flatShading: true })
    );
    pack.position.set(0, r * 1.35, r * 0.72);
    this.mesh.add(pack);

    // Ground shadow blob, sells the top-down perspective.
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(r * 1.05, 16),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22, depthWrite: false })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.03;
    this.mesh.add(shadow);
  }

  // ===== Status queries used by the HUD and systems =====

  get isSprinting(): boolean {
    return this.sprintTimer > 0;
  }
  get sprintReady(): boolean {
    return this.sprintTimer <= 0 && this.cooldownTimer <= 0;
  }
  get hasFoodPoisoning(): boolean {
    return this.poisonTimer > 0;
  }
  get isInvulnerable(): boolean {
    return this.invulnTimer > 0;
  }
  get isDown(): boolean {
    return this.health <= 0 || this.sanity <= 0;
  }

  /** 0..1 fill for the HUD Sprint Energy Bar: drains while sprinting, refills on cooldown. */
  get sprintEnergy(): number {
    if (this.sprintTimer > 0) return this.sprintTimer / CONFIG.nitesh.sprintDuration;
    if (this.cooldownTimer > 0) return 1 - this.cooldownTimer / CONFIG.nitesh.sprintCooldown;
    return 1;
  }

  /** Attempt a Panicked Sprint. Returns true if it actually started. */
  trySprint(): boolean {
    if (!this.sprintReady) return false;
    this.sprintTimer = CONFIG.nitesh.sprintDuration;
    return true;
  }

  // ===== Effects applied by the collision / food systems =====

  damage(amount: number): void {
    this.health = Math.max(0, this.health - amount);
    this.invulnTimer = CONFIG.nitesh.invulnerability;
  }

  /** Starts the immunity window without dealing damage (an auto's shove). */
  graze(): void {
    this.invulnTimer = CONFIG.nitesh.invulnerability;
  }

  heal(amount: number): void {
    this.health = Math.min(CONFIG.nitesh.maxHealth, this.health + amount);
  }

  drainSanity(amount: number): void {
    this.sanity = Math.max(0, this.sanity - amount);
  }

  /** Gradual regen while he is away from the honking. */
  recoverSanity(amount: number): void {
    this.sanity = Math.min(CONFIG.nitesh.maxSanity, this.sanity + amount);
  }

  restoreSanity(): void {
    this.sanity = CONFIG.nitesh.maxSanity;
  }

  /** Auto-rickshaws lift cash on contact; he cannot go below zero. */
  stealMoney(amount: number): number {
    const taken = Math.min(this.wallet, amount);
    this.wallet -= taken;
    return taken;
  }

  applyFoodPoisoning(): void {
    this.poisonTimer = CONFIG.nitesh.poisonDuration;
  }

  knockBack(fromX: number, fromZ: number): void {
    const dx = this.x - fromX;
    const dz = this.z - fromZ;
    const len = Math.hypot(dx, dz) || 1;
    this.knockDirX = dx / len;
    this.knockDirZ = dz / len;
    this.knockTimer = CONFIG.nitesh.knockbackDuration;
  }

  // ===== Per-tick movement =====

  /**
   * `moveX`/`moveZ` is the normalised 8-way stick from InputManager.
   * The road bounds keep him on the tarmac.
   */
  move(dt: number, moveX: number, moveZ: number, roadHalfWidth: number, minZ: number, maxZ: number): void {
    let speed = CONFIG.nitesh.baseSpeed;
    if (this.sprintTimer > 0) speed *= CONFIG.nitesh.sprintMultiplier;
    if (this.poisonTimer > 0) speed *= CONFIG.nitesh.poisonMultiplier;

    let vx = moveX * speed;
    let vz = moveZ * speed;

    // Knockback overrides steering for its brief duration.
    if (this.knockTimer > 0) {
      const k = CONFIG.nitesh.knockbackSpeed * (this.knockTimer / CONFIG.nitesh.knockbackDuration);
      vx += this.knockDirX * k;
      vz += this.knockDirZ * k;
    }

    this.x = clamp(this.x + vx * dt, -roadHalfWidth, roadHalfWidth);
    this.z = clamp(this.z + vz * dt, minZ, maxZ);

    // Face the direction of travel.
    if (Math.abs(vx) > 0.01 || Math.abs(vz) > 0.01) {
      this.mesh.rotation.y = Math.atan2(vx, vz);
      this.bobPhase += dt * (this.sprintTimer > 0 ? 18 : 10);
    }
    this.body.position.y = CONFIG.nitesh.radius * 1.25 + Math.abs(Math.sin(this.bobPhase)) * 0.08;
  }

  update(dt: number): void {
    if (this.sprintTimer > 0) {
      this.sprintTimer -= dt;
      // Sprint just ended -> start the strict cooldown.
      if (this.sprintTimer <= 0) this.cooldownTimer = CONFIG.nitesh.sprintCooldown;
    } else if (this.cooldownTimer > 0) {
      this.cooldownTimer -= dt;
    }

    if (this.poisonTimer > 0) this.poisonTimer -= dt;
    if (this.knockTimer > 0) this.knockTimer -= dt;
    if (this.invulnTimer > 0) this.invulnTimer -= dt;

    // Flash while briefly immune so hits read clearly.
    const mat = this.body.material as THREE.MeshStandardMaterial;
    if (this.invulnTimer > 0) {
      mat.color.setHex(Math.floor(this.invulnTimer * 20) % 2 === 0 ? 0xff5252 : 0x2979ff);
    } else if (this.poisonTimer > 0) {
      mat.color.setHex(0x66bb6a);
    } else {
      mat.color.setHex(0x2979ff);
    }
  }

  reset(x: number, z: number): void {
    this.mesh.position.set(x, 0, z);
    this.health = CONFIG.nitesh.maxHealth;
    this.sanity = CONFIG.nitesh.maxSanity;
    this.wallet = CONFIG.nitesh.startingWallet;
    this.sprintTimer = 0;
    this.cooldownTimer = 0;
    this.poisonTimer = 0;
    this.knockTimer = 0;
    this.invulnTimer = 0;
  }
}
