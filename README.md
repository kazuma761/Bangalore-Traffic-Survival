# Nitesh's Commute — Bangalore Traffic Survival

A top-down 3D survival game about the worst part of a Bangalore weekday: getting home.

You are **Nitesh**, an office worker with a dark-blue backpack. You have **1,500 metres**
between your Tech Park and the **HSR Layout Entry Gate**, and eight lanes of gridlock in
between. Cabs will flatten you, auto-rickshaws will swerve into you and lift your wallet,
BMTC buses will not brake for anyone, and the honking alone can break your mind.

Built with Three.js + TypeScript + Vite. No asset files — every model and every sound is
generated procedurally in code.

## Controls

| Input | Action |
|-------|--------|
| `W` `A` `S` `D` / arrow keys | 8-way movement |
| `Spacebar` | **Panicked Sprint** — 2x speed for 1.5 s, then a 4 s cooldown |
| Drag left side (mobile) | Move |
| Tap right side (mobile) | Sprint |

## The road

- 🚕 **White cabs & SUVs** — stop-and-go gridlock. A hit costs **40 health** and shoves you back.
- 🛺 **Auto-rickshaws** — actively veer across lanes to cut you off. **−20 sanity, −₹300**.
- 🚌 **BMTC buses** — pick a lane, hold it at speed, never brake. **−90 health.**
- 🚧 **Metro barricades** — seal off whole lanes. No damage, but no way through either.
- 📢 **Ambient Noise Stress** — fills whenever vehicles crowd you. Pinned at 100%, it drains
  **15 sanity per second** until you get clear.
- 🍛 **Street food** — a hidden coin flip. Filter coffee restores 25 health and your full
  sanity; food poisoning costs 30 health and halves your speed for 5 seconds.

Reach the gate to win. Health or sanity hitting zero ends the commute.

## Running it locally

```bash
npm install
npm run dev
```

Then open the URL Vite prints (http://localhost:5173/).

## Building

```bash
npm run build      # production build to dist/
npm run preview    # serve the built output
```

## Deploying

**Vercel** — import the repo and accept the detected Vite preset:

| Setting | Value |
|---------|-------|
| Framework | Vite |
| Build command | `npm run build` |
| Output directory | `dist` |

`vite.config.ts` uses `base: '/'`, which is what a root-domain host like Vercel needs.

**GitHub Pages** — needs a nested base path instead:

```bash
npm run build:pages
npx gh-pages -d dist
```

## Project layout

Every entity renders itself; every rule lives in its own system.

```
src/
  core/        Game orchestrator, config, loop, input, audio
  entities/    Nitesh, cabs, autos, buses, barricades, food — each owns its mesh
  systems/     Traffic, honking, collisions, barricades, food, progress
  rendering/   Camera, HUD, floating text, goal arrow
  world/       The road stage and procedural scenery
```

Tuning lives in one place: [`src/core/GameConfig.ts`](src/core/GameConfig.ts).

## License

MIT
