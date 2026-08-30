# Optional sound files

The game ships with **no audio files**. Every horn, hit and jingle is synthesised
at runtime in `src/core/AudioManager.ts`, so it works offline and adds nothing to
the bundle.

If you want real recordings, drop them in this folder using these exact names.
Anything present is loaded on boot and replaces the synth for that cue; anything
missing silently falls back. Partial sets are fine — add just `auto-horn.mp3` if
that is all you want.

| Filename | Used for |
|----------|----------|
| `auto-horn.mp3` | Auto Anna's squeeze-bulb horn |
| `car-horn.mp3` | Cabs and SUVs |
| `bus-horn.mp3` | BMTC bus air horn |
| `hit.mp3` | Any vehicle collision |
| `sprint.mp3` | Panicked Sprint activation |
| `blessing.mp3` | Good street food |
| `curse.mp3` | Food poisoning |
| `coin-loss.mp3` | Auto Anna taking your ₹300 |
| `victory.mp3` | Reaching the HSR gate |
| `defeat.mp3` | Health or sanity hitting zero |

Keep clips short — horns under a second, jingles under two. Mono MP3 or OGG at
a modest bitrate is plenty; these play often and should stay small.

## Licensing

Only add files you have the right to redistribute, and record the source. This
repo is public, so anything you commit here is republished to everyone who
clones it. Good sources for permissively licensed audio:

- **freesound.org** — filter by Creative Commons 0 (public domain).
- **pixabay.com/sound-effects** — Pixabay Content License, no attribution needed.
- **opengameart.org** — check each entry's licence individually.

Search terms that work well: `indian auto rickshaw horn`, `tuk tuk horn`,
`bus air horn`, `traffic ambience india`.

If a clip requires attribution, add the credit to the repository README.
