import * as THREE from 'three';
import { clamp, lerp } from '../utils/math.ts';
import { QUALITY } from '../core/Quality.ts';

/**
 * Overhead chase camera. It sits high above Nitesh and leads slightly up-screen
 * so oncoming traffic is visible in time to weave around it.
 *
 * The rig is designed for a landscape screen. On a portrait phone the same rig
 * shows barely 24 world units across — the road is 36 wide, so the outer lanes
 * fall off both edges and traffic arrives with no warning. `applyViewport()`
 * therefore re-frames from the aspect ratio: it works out how much ground the
 * base rig would actually show and, if that is under `TARGET_VIEW_WIDTH`, makes
 * up the shortfall by pulling the camera back and widening the lens in equal
 * measure. Splitting it keeps the camera from going absurdly high *and* keeps
 * the lens off the fisheye end. Landscape lands above the target already, so
 * desktop framing is untouched.
 */

/** World units that must stay visible across the screen. Road is 36 wide. */
const TARGET_VIEW_WIDTH = 46;
/** Ceilings so an extreme aspect ratio cannot produce a silly camera. */
const MAX_RIG_SCALE = 1.6;
const MAX_FOV = 72;

export class TopDownCamera {
  readonly camera: THREE.PerspectiveCamera;

  private readonly baseHeight = 43;
  private readonly baseTrail = 22;
  private readonly baseLead = 12;
  private readonly baseFov = 50;

  private height = this.baseHeight;
  private trail = this.baseTrail;
  private lead = this.baseLead;

  /** Cached viewport, so projection does not read layout every frame. */
  private viewW = 1;
  private viewH = 1;

  constructor() {
    this.camera = new THREE.PerspectiveCamera(this.baseFov, 1, 0.5, QUALITY.drawDistance);
    this.applyViewport(window.innerWidth, window.innerHeight);
  }

  /**
   * Re-frames for a viewport size. Called by Game on resize and orientation
   * change; the camera does not listen for those itself so that the renderer
   * and the camera can never disagree about the current size.
   */
  applyViewport(width: number, height: number): void {
    this.viewW = Math.max(1, width);
    this.viewH = Math.max(1, height);
    const aspect = this.viewW / this.viewH;

    // Ground width the untouched rig would show at the point it is looking at.
    const focusDist = Math.hypot(this.baseHeight, this.baseTrail + this.baseLead);
    const baseTan = Math.tan((this.baseFov * Math.PI) / 360);
    const baseWidth = 2 * focusDist * aspect * baseTan;

    // Below 1 the rig already frames more than we need — leave it alone.
    const shortfall = Math.max(1, TARGET_VIEW_WIDTH / baseWidth);
    // Half the correction each, in tangent space, so both stay moderate.
    const rigScale = clamp(Math.sqrt(shortfall), 1, MAX_RIG_SCALE);
    const fovTan = baseTan * (shortfall / rigScale);

    this.height = this.baseHeight * rigScale;
    this.trail = this.baseTrail * rigScale;
    this.lead = this.baseLead * rigScale;

    this.camera.fov = Math.min(MAX_FOV, (Math.atan(fovTan) * 360) / Math.PI);
    this.camera.aspect = aspect;
    // Pulling the rig back moves the far scenery further away too.
    this.camera.far = QUALITY.drawDistance * rigScale;
    this.camera.updateProjectionMatrix();
  }

  /** Snap straight to the target, used when a run starts. */
  snapTo(x: number, z: number): void {
    this.camera.position.set(x * 0.35, this.height, z + this.trail);
    this.camera.lookAt(x * 0.35, 0, z - this.lead);
  }

  follow(dt: number, x: number, z: number): void {
    // Damp the X so weaving does not make the whole world slide about.
    const targetX = x * 0.35;
    const k = Math.min(1, dt * 6);
    this.camera.position.x = lerp(this.camera.position.x, targetX, k);
    this.camera.position.y = this.height;
    this.camera.position.z = lerp(this.camera.position.z, z + this.trail, Math.min(1, dt * 9));
    this.camera.lookAt(this.camera.position.x, 0, this.camera.position.z - this.trail - this.lead);
  }

  /** Projects a world point to CSS pixels; `behind` flags points off-camera. */
  project(x: number, y: number, z: number): { sx: number; sy: number; behind: boolean } {
    const v = new THREE.Vector3(x, y, z).project(this.camera);
    return {
      sx: (v.x * 0.5 + 0.5) * this.viewW,
      sy: (-v.y * 0.5 + 0.5) * this.viewH,
      behind: v.z > 1,
    };
  }
}
