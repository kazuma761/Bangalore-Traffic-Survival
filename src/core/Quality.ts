/**
 * Device-aware quality tier, resolved once at boot.
 *
 * The heavy cost on this game is draw calls: the roadside skyline, trees and
 * lamp posts are individual Groups, and a phone GPU chokes on the desktop
 * count long before it chokes on the shaders. So the mobile tier mainly thins
 * the scenery and pulls the fog in, rather than lowering visual fidelity.
 */

function detectMobile(): boolean {
  if (typeof navigator === 'undefined') return false;
  // Coarse pointer is the reliable signal; UA is the fallback for odd browsers.
  const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  const smallish = Math.min(window.innerWidth, window.innerHeight) < 820;
  const ua = /Android|iPhone|iPad|iPod|Mobile|Silk/i.test(navigator.userAgent);
  return (coarse && smallish) || ua;
}

/** Rough proxy for a weak GPU: few cores or little memory. */
function detectLowEnd(): boolean {
  const cores = navigator.hardwareConcurrency ?? 4;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  return cores <= 4 || mem <= 4;
}

export interface QualityTier {
  readonly isMobile: boolean;
  /** Cap on devicePixelRatio. Phones are dense; rendering 3x is wasted work. */
  readonly maxPixelRatio: number;
  /** Multiplier on roadside building/tree/lamp counts. */
  readonly sceneryDensity: number;
  /** Multiplier on pothole count. */
  readonly potholeDensity: number;
  /** Fog distances — pulling the far plane in culls a lot of scenery. */
  readonly fogNear: number;
  readonly fogFar: number;
  /** Camera far plane. */
  readonly drawDistance: number;
  /** Antialiasing costs real fill rate on mobile. */
  readonly antialias: boolean;
}

const mobile = detectMobile();
const lowEnd = mobile && detectLowEnd();

export const QUALITY: QualityTier = mobile
  ? {
      isMobile: true,
      maxPixelRatio: lowEnd ? 1 : 1.5,
      sceneryDensity: lowEnd ? 0.4 : 0.55,
      potholeDensity: 0.7,
      fogNear: 55,
      fogFar: 125,
      drawDistance: 240,
      antialias: false,
    }
  : {
      isMobile: false,
      maxPixelRatio: 2,
      sceneryDensity: 1,
      potholeDensity: 1,
      fogNear: 90,
      fogFar: 190,
      drawDistance: 400,
      antialias: true,
    };
