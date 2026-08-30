export const SizeTier = {
  XS: 0,
  S: 1,
  M: 2,
  L: 3,
  XL: 4,
} as const;

export type SizeTier = (typeof SizeTier)[keyof typeof SizeTier];

export const TIER_NAMES = ['XS', 'S', 'M', 'L', 'XL'];

// Minimum hole radius required to eat objects in each tier
export const TIER_MIN_RADIUS: Record<SizeTier, number> = {
  [SizeTier.XS]: 1.0,
  [SizeTier.S]: 2.0,
  [SizeTier.M]: 4.0,
  [SizeTier.L]: 7.0,
  [SizeTier.XL]: 12.0,
};

// Volume each tier adds when consumed (affects hole growth)
export const TIER_VOLUME: Record<SizeTier, number> = {
  [SizeTier.XS]: 1,
  [SizeTier.S]: 4,
  [SizeTier.M]: 15,
  [SizeTier.L]: 50,
  [SizeTier.XL]: 200,
};

// Points per tier
export const TIER_POINTS: Record<SizeTier, number> = {
  [SizeTier.XS]: 10,
  [SizeTier.S]: 25,
  [SizeTier.M]: 50,
  [SizeTier.L]: 100,
  [SizeTier.XL]: 500,
};

export function getCurrentTier(radius: number): SizeTier {
  if (radius >= TIER_MIN_RADIUS[SizeTier.XL]) return SizeTier.XL;
  if (radius >= TIER_MIN_RADIUS[SizeTier.L]) return SizeTier.L;
  if (radius >= TIER_MIN_RADIUS[SizeTier.M]) return SizeTier.M;
  if (radius >= TIER_MIN_RADIUS[SizeTier.S]) return SizeTier.S;
  return SizeTier.XS;
}

// Radius needed to eat a specific size tier object
export function canEat(holeRadius: number, objectTier: SizeTier): boolean {
  return holeRadius >= TIER_MIN_RADIUS[objectTier];
}
