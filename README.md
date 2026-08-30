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

## The story

Nitesh works at **Mayta**, in the tech park off Sarjapur Road. Eight years, same desk,
same 9 PM logout. Today he resigned — laptop handed over, badge dropped at reception.

His flat is in **HSR Layout**, 1,500 metres away. On a normal day, a fifteen minute walk.
But it is 6:40 PM on a weekday, and this is Bangalore.

*Nadi, Nitesh. Mane seri.*

## The road

The road runs **both ways**. Traffic comes at you head-on in the left lanes and
overtakes you from behind in the right ones — and a decent minority of it ignores
the lane markings entirely.

- 🛺 **Auto Anna** — the green-and-yellow auto-rickshaw, and the most Bangalore thing
  on this road. He veers across lanes to cut you off, quotes a number, and refuses the
  meter. **−20 sanity, −₹300.** *"Swalpa adjust maadi!"*
- 🚕 **White cabs & SUVs** — stop-and-go gridlock. A hit costs **40 health** and shoves you back.
- 🚌 **BMTC buses** — pick a lane, hold it at speed, never brake. **−90 health.**
  Some of them come up the **wrong side** of the road. Those strobe red — respect it.
- 🚧 **Metro barricades** — seal off whole lanes. No damage, but no way through either.
- 📢 **Ambient Noise Stress** — fills whenever vehicles crowd you. Pinned at 100%, it drains
  **15 sanity per second** until you get clear.
- 🍛 **Street food** — a hidden coin flip. Filter coffee restores 25 health and your full
  sanity; **food poisoning** costs 30 health and halves your speed for 5 seconds.

Reach the gate to win. Health or sanity hitting zero ends the commute.

## Sound

All audio is synthesised in the browser — no files ship with the repo, so it works
offline and costs nothing in bundle size. Auto Anna's horn, a car horn and a BMTC air
horn are each built from different harmonic stacks, and a low traffic rumble swells as
the road crowds around you.

Want real recordings instead? Drop them into
[`public/assets/audio/`](public/assets/audio/README.md) — that folder lists the exact
filenames and where to find permissively licensed clips. Anything you add replaces the
synth for that cue; anything missing falls back automatically.

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
