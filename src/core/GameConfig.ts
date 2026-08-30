/**
 * Central tuning for the "Nitesh's Commute" run.
 * One world unit ~= 2.5 in-fiction metres (see METRES_PER_UNIT).
 */
export const CONFIG = {
  /** Displayed distance is world units scaled up to feel like a real Bangalore commute. */
  METRES_PER_UNIT: 2.5,
  /** Total run length in metres, shown on the HUD. */
  TOTAL_DISTANCE_M: 1500,

  world: {
    /** Drivable road half-width; Nitesh is clamped just outside this. */
    roadHalfWidth: 18,
    laneCount: 8,
    /** Nitesh starts here (tech park) and runs toward negative Z (HSR gate). */
    startZ: 0,
    goalZ: -600,
    /** Extra road drawn past the goal so the gate is not on the edge of the world. */
    margin: 40,
  },

  nitesh: {
    radius: 0.9,
    baseSpeed: 7,
    /** Multiplier applied by the Panicked Sprint. */
    sprintMultiplier: 2,
    sprintDuration: 1.5,
    sprintCooldown: 4,
    /** Gastro debuff halves speed for this long. */
    gastroDuration: 5,
    gastroMultiplier: 0.5,
    maxHealth: 100,
    maxSanity: 100,
    startingWallet: 2000,
    /** Impulse speed applied when a cab knocks him back. */
    knockbackSpeed: 22,
    knockbackDuration: 0.35,
    /** Seconds of damage immunity after any vehicle hit. */
    invulnerability: 0.8,
  },

  honking: {
    /** 120px on screen ~= 15 world units at the game's top-down zoom. */
    radius: 15,
    /** Stress percent gained per second, per vehicle inside the radius. */
    fillPerVehicle: 7,
    /** Stress percent lost per second when the road around him is clear. */
    decayPerSecond: 55,
    /** Sanity lost per second while the meter is pinned at 100%. */
    sanityDrainPerSecond: 15,
    /** Below this stress level Nitesh calms down and slowly recovers sanity. */
    calmThreshold: 25,
    sanityRecoveryPerSecond: 2.5,
    /** Minimum gap between HONK! pop-ups from the same vehicle. */
    honkCooldown: 1.6,
  },

  traffic: {
    /** Seconds between spawn waves, tightening as Nitesh nears the goal. */
    waveIntervalStart: 2.4,
    waveIntervalEnd: 1.1,
    cabsPerWave: [2, 4] as const,
    autoChance: 0.4,
    busChance: 0.18,
    /** Vehicles spawn this far ahead of Nitesh and despawn this far behind. */
    spawnAhead: 90,
    despawnBehind: 45,
  },

  damage: {
    cabHealth: 40,
    autoSanity: 20,
    autoWalletTheft: 300,
    busHealth: 90,
  },

  food: {
    /** Plates live along the corridor at roughly this spacing in Z. */
    spawnIntervalZ: 55,
    plateRadius: 1.4,
    blessingHealth: 25,
    curseHealth: 30,
  },
} as const;

export const GOAL_LABEL = 'HSR Layout Entry Gate';
