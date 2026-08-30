# Nitesh's Commute — Bangalore Traffic Survival

## Overview
A top-down 3D survival game set on a jammed Bangalore arterial road. The player
controls **Nitesh**, an office worker with a dark-blue backpack, trying to get
from his Tech Park to the **HSR Layout Entry Gate** — 1,500 m up an 8-lane road
choked with cabs, swerving auto-rickshaws, BMTC buses and metro barricades.

He has three resources: **Health**, **Sanity** and a **wallet**. Traffic takes
health, autos take sanity and cash, and the ambient honking takes sanity just by
standing too close to it. Reaching the gate wins; either bar hitting zero loses.

> Historical note: this repo previously held a Hole.io-style city-eating game.
> That mechanic (the hole, chunk streaming, size tiers, AI bots) was removed
> wholesale. Only `ProceduralAssets.ts` survives, reused as a roadside scenery
> library.

## Tech Stack
- **Rendering:** Three.js (WebGL), overhead chase camera
- **Build:** Vite 6 + TypeScript (strict, `erasableSyntaxOnly`, `useDefineForClassFields`)
- **Audio:** Web Audio API — every sound synthesised, no asset files
- **Deploy:** Vercel (root base path); GitHub Pages via `npm run build:pages`

## Project Structure
Every entity and every rule is its own component. Entities build and own their
own meshes; systems never reach inside an entity to draw it.

```
src/
  main.ts                     - Entry point
  core/
    Game.ts                   - Orchestrator: wires systems, owns run phase
    GameConfig.ts             - ★ ALL tuning constants live here
    GameLoop.ts               - Fixed-timestep loop (60Hz update, display-rate render)
    InputManager.ts           - WASD/arrows + edge-triggered Spacebar sprint + touch
    AudioManager.ts           - Procedural horns/ambience + optional sample loading
    Dialogue.ts               - ★ All Kannada slang and story text in one place
    EventBus.ts               - Typed pub/sub
  entities/                   - Self-rendering world objects
    Entity.ts                 - Base: mesh, AABB footprint, overlapsCircle()
    Nitesh.ts                 - Player: movement, sprint, debuffs, stats
    Vehicle.ts                - Base for traffic: forward motion, honk throttle
    Cab.ts                    - White cabs & SUVs, stop-and-go gridlock
    AutoAnna.ts               - Auto-rickshaw that veers to cut the player off
    BMTCBus.ts                - Boss bus: straight, fast, never brakes
    MetroBarricade.ts         - Static striped lane blocker with push-out resolve()
    FoodPlate.ts              - Biryani / filter coffee, resolves the 50/50
  systems/                    - Rules, one concern each
    TrafficSystem.ts          - Spawn waves, difficulty ramp, retire vehicles
    HonkingSystem.ts          - Proximity radius, HONK! events, stress meter
    CollisionSystem.ts        - Player-vs-traffic penalties per vehicle kind
    BarricadeSystem.ts        - Barricade layout + collision push-out
    FoodSystem.ts             - Plate scatter + blessing/curse effects
    ProgressSystem.ts         - Ratcheting distance tracking, win detection
  rendering/                  - One class per visual concern
    TopDownCamera.ts          - Overhead chase cam + world→screen projection
    HUD.ts                    - Builds & owns all four meter bars + readouts
    FloatingText.ts           - World-anchored DOM pop-ups (HONK!, damage, food)
    GoalArrow.ts              - Persistent on-screen navigation arrow
    StoryScreen.ts            - Beat-by-beat intro shown before the first run
  world/
    RoadWorld.ts              - The stage: road, lanes, sidewalks, skyline, gate
    ProceduralAssets.ts       - Roadside scenery factories (reused from old game)
    SizeTier.ts               - Only a dependency of ProceduralAssets
  utils/
    math.ts, dispose.ts
```

## Key Technical Details

### ⚠ Entity construction order
`tsconfig` sets `useDefineForClassFields: true`, so a subclass's field
initializers run **after** `super()` returns. `Entity`'s constructor therefore
does **not** call `build()` — it would be undone. **Every concrete entity must
call `this.build()` at the end of its own constructor.** Getting this wrong
produces `Cannot read properties of undefined` on mesh refs at runtime.

Also note: `as const` on `CONFIG` makes numbers literal types, so mutable fields
seeded from it need explicit annotations (`health: number = CONFIG...`).

### Movement & Sprint
- 8-way normalised movement, base speed 7 u/s.
- **Spacebar** → 2x speed for 1.5 s, then a strict 4 s cooldown.
- Sprint is edge-triggered in `InputManager.consumeSprint()` so holding Space
  does not re-fire it. `Nitesh.sprintEnergy` drives the HUD bar (drains while
  sprinting, refills across the cooldown).

### The Honking Sense
- Invisible 15-unit radius (~120 px at the game's zoom) around Nitesh.
- Any vehicle inside triggers a throttled `HONK!` pop-up (1.6 s per vehicle).
- Stress fills at **7%/sec per vehicle** inside, decays at **55%/sec** when clear.
- At 100% it drains **15 sanity/sec**; below 25% he recovers **2.5 sanity/sec**.
  The recovery is not in the original spec but the 1,500 m run is unwinnable
  without it — remove it in `GameConfig` if you want a brutal version.

### Two-way traffic
`RoadWorld.laneDirection(i)` gives each lane a designated flow: the left half
runs **+1** (down-screen, head-on at Nitesh), the right half runs **-1** (with
him, overtaking from behind). `Vehicle.direction` carries this, `applyHeading()`
turns the mesh around, and `TrafficSystem.entryZ()` picks the correct spawn edge.

Vehicles heading **-1 are given noticeably higher speeds** (17–23 vs 9–14 for
cabs). Without that they travel at nearly Nitesh's own pace and loiter beside
him for the whole run, which doubles honking pressure and makes the game
unwinnable. If you retune speeds, keep that gap.

A fraction of every kind drives against its lane (`wrongWayCabChance`,
`wrongWayBusChance`) and is flagged `wrongWay`. A wrong-way BMTC bus strobes red
on its stripe and roof beacon, and `TrafficSystem.wrongWayAlert` fires a one-shot
on-screen warning when one spawns.

### Kannada dialogue
Everything the game says in Kannada lives in `core/Dialogue.ts` — Auto Anna's
lines, cab and bus shouts, honk onomatopoeia, food outcomes, stress warnings,
the story beats, and win/lose copy. It is transliterated Roman, the way the city
actually types it, not formal script. Add lines there, never inline at the call
site.

### Audio
`AudioManager` synthesises everything by default. `reedHorn()` builds a horn from
a detuned harmonic stack through a bandpass — that is what separates Auto Anna's
nasal double-parp (root 392 Hz, high harmonics, Q 7) from a car (310 Hz, Q 3.5)
and a BMTC air horn (120 Hz, Q 2.2). A brown-noise ambience loops under the run
and swells with `setAmbienceIntensity()` as the cluster around Nitesh grows.

`loadSamples()` optionally fetches real recordings from `public/assets/audio/`
and transparently overrides individual cues. No audio files ship with the repo;
see that folder's README for filenames and licensing.

### Damage Table
| Source | Effect |
|--------|--------|
| Cab / SUV | −40 health, knockback |
| Auto Anna | −20 sanity, −₹300, knockback (no health damage) |
| BMTC Bus | −90 health, knockback |
| Metro Barricade | No damage — solid, pushes the player out |
| Honking at 100% | −15 sanity/sec |
| Food (blessing) | +25 health, sanity restored to full |
| Food (curse) | −30 health, **food poisoning**: half speed for 5 s |

A 0.8 s immunity window opens after any hit (`damage()` for damaging hits,
`graze()` for the auto's non-damaging shove) so one vehicle cannot drain a bar
in a single tick.

### World & Distance
- Road runs from `startZ = 0` to `goalZ = -600`; 8 lanes across a 36-unit width.
- 600 world units are displayed as 1,500 m (`METRES_PER_UNIT`).
- `ProgressSystem` **ratchets**: backtracking around a barricade never inflates
  distance already earned.

### Difficulty Ramp
`TrafficSystem` takes `progress` (0 at the park, 1 at the gate) and tightens
wave interval 2.4 s → 1.1 s, adds cabs per wave, and raises vehicle speeds. The
BMTC bus only starts spawning after 12% progress.

## Commands
```bash
npm install          # Install dependencies
npm run dev          # Dev server (Vite HMR) → http://localhost:5173/
npm run build        # Production build to dist/ (root base, for Vercel)
npm run build:pages  # Build with BASE_PATH=/Banglore-traffic/ for GitHub Pages
npm run preview      # Preview the production build
```

## Deployment
- **Vercel:** framework preset Vite, build `npm run build`, output `dist`.
  `vite.config.ts` uses `base: '/'` by default, which is what Vercel needs.
- **GitHub Pages:** `npm run build:pages && npx gh-pages -d dist`
- **Repo:** https://github.com/kazuma761/Banglore-traffic

## Debugging
`window.game` is assigned when a run starts. `window.game.debugState()` returns
position, health, sanity, stress, crowding, live vehicle count and metres left —
useful for scripted balance tests in the browser console.

## Ideas / Next Steps
- InstancedMesh for repeated scenery (trees, lamp posts) to cut draw calls
- More hazards: potholes, stray dogs, sudden rain reducing traction
- Pedestrian crossings as safe zones where honking stress decays faster
- Sound: continuous traffic ambience layered under the discrete horns
- Score/leaderboard on time and wallet remaining
