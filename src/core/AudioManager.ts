/**
 * Sound for the commute.
 *
 * Two layers:
 *  1. Procedural Web Audio synthesis — always available, no downloads, works
 *     offline. Every horn here is hand-tuned rather than a generic beep.
 *  2. Optional real recordings. Drop files into `public/assets/audio/` using
 *     the names in SAMPLE_FILES and they transparently replace the synth for
 *     those cues. Missing files are ignored, so the game always has sound.
 *
 * No audio is bundled with the repo — see README for where to source clips and
 * what licence you need.
 */

export type Cue =
  | 'autoHorn'
  | 'carHorn'
  | 'busHorn'
  | 'hit'
  | 'sprint'
  | 'blessing'
  | 'curse'
  | 'coinLoss'
  | 'victory'
  | 'defeat';

/** Filenames looked for under `public/assets/audio/`. */
const SAMPLE_FILES: Record<Cue, string> = {
  autoHorn: 'auto-horn.mp3',
  carHorn: 'car-horn.mp3',
  busHorn: 'bus-horn.mp3',
  hit: 'hit.mp3',
  sprint: 'sprint.mp3',
  blessing: 'blessing.mp3',
  curse: 'curse.mp3',
  coinLoss: 'coin-loss.mp3',
  victory: 'victory.mp3',
  defeat: 'defeat.mp3',
};

export class AudioManager {
  private ctx: AudioContext | null = null;
  private enabled = true;
  private master: GainNode | null = null;
  private samples = new Map<Cue, AudioBuffer>();
  /** Low rumble of the road, started with the first run. */
  private ambience: { source: AudioBufferSourceNode; gain: GainNode } | null = null;

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.9;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  private get out(): AudioNode {
    this.ensureContext();
    return this.master!;
  }

  /**
   * Loads any real recordings the project ships with. Safe to call before the
   * user has interacted: it only decodes, it does not play.
   */
  async loadSamples(baseUrl: string): Promise<void> {
    const ctx = this.ensureContext();
    await Promise.all(
      (Object.keys(SAMPLE_FILES) as Cue[]).map(async (cue) => {
        try {
          const res = await fetch(`${baseUrl}assets/audio/${SAMPLE_FILES[cue]}`);
          if (!res.ok) return;
          const type = res.headers.get('content-type') ?? '';
          // A dev server returns index.html for missing files; skip those.
          if (type.includes('text/html')) return;
          this.samples.set(cue, await ctx.decodeAudioData(await res.arrayBuffer()));
        } catch {
          // No file, bad file, or offline — the synth covers this cue.
        }
      })
    );
  }

  /** Plays a recorded sample if one was loaded. Returns false if there is none. */
  private playSample(cue: Cue, volume = 1, rate = 1): boolean {
    const buffer = this.samples.get(cue);
    if (!buffer || !this.enabled) return false;
    const ctx = this.ensureContext();
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = rate;
    const gain = ctx.createGain();
    gain.gain.value = volume;
    src.connect(gain).connect(this.out);
    src.start();
    return true;
  }

  // ===== Synthesis primitives =====

  /** One oscillator with an attack/decay envelope. */
  private tone(
    type: OscillatorType,
    freqStart: number,
    freqEnd: number,
    duration: number,
    gain: number,
    delay = 0
  ): void {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    const t = ctx.currentTime + delay;

    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t + duration);

    amp.gain.setValueAtTime(0, t);
    amp.gain.linearRampToValueAtTime(gain, t + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    osc.connect(amp).connect(this.out);
    osc.start(t);
    osc.stop(t + duration + 0.05);
  }

  /**
   * A reedy horn: a detuned stack of harmonics through a bandpass, which is
   * what makes a squeeze-bulb auto horn sound different from a car's.
   */
  private reedHorn(
    root: number,
    duration: number,
    gain: number,
    delay = 0,
    harmonics: readonly number[] = [1, 2, 3, 4.2],
    q = 6
  ): void {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    const t = ctx.currentTime + delay;

    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = root * 2.4;
    band.Q.value = q;

    const amp = ctx.createGain();
    amp.gain.setValueAtTime(0, t);
    amp.gain.linearRampToValueAtTime(gain, t + 0.03);
    amp.gain.setValueAtTime(gain, t + duration * 0.7);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    band.connect(amp).connect(this.out);

    harmonics.forEach((mult, i) => {
      const osc = ctx.createOscillator();
      osc.type = i === 0 ? 'sawtooth' : 'square';
      // Slight detune per partial gives the horn its buzz.
      osc.frequency.setValueAtTime(root * mult * (1 + (i % 2 ? 0.006 : -0.004)), t);
      const partial = ctx.createGain();
      partial.gain.value = 1 / (i + 1.6);
      osc.connect(partial).connect(band);
      osc.start(t);
      osc.stop(t + duration + 0.05);
    });
  }

  private noise(duration: number, gain: number, filterHz: number): void {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    const frames = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterHz;
    const amp = ctx.createGain();
    amp.gain.value = gain;
    src.connect(filter).connect(amp).connect(this.out);
    src.start();
  }

  // ===== Cues =====

  /**
   * Auto Anna's horn: the short, nasal, insistent double-parp of a squeeze
   * bulb horn. Higher and reedier than a car, and always twice.
   */
  playAutoHorn(): void {
    if (this.playSample('autoHorn', 0.9, 0.95 + Math.random() * 0.12)) return;
    this.reedHorn(392, 0.13, 0.055, 0, [1, 2, 3, 4.2, 5.4], 7);
    this.reedHorn(370, 0.17, 0.05, 0.15, [1, 2, 3, 4.2, 5.4], 7);
  }

  /** Ordinary car/cab horn: fuller, two-tone, less nasal. */
  playHonk(): void {
    if (this.playSample('carHorn', 0.75, 0.92 + Math.random() * 0.16)) return;
    this.reedHorn(310, 0.22, 0.042, 0, [1, 2, 3], 3.5);
    this.reedHorn(392, 0.22, 0.036, 0.015, [1, 2, 3], 3.5);
  }

  /** BMTC air horn: low, loud, and utterly uninterested in you. */
  playBusHorn(): void {
    if (this.playSample('busHorn', 1, 0.98)) return;
    this.reedHorn(120, 0.8, 0.075, 0, [1, 1.5, 2, 3, 4], 2.2);
    this.reedHorn(90, 0.85, 0.06, 0.02, [1, 2, 3], 2);
    this.noise(0.5, 0.045, 320);
  }

  playHit(): void {
    if (this.playSample('hit', 0.9)) return;
    this.noise(0.28, 0.35, 900);
    this.tone('triangle', 180, 60, 0.3, 0.14);
  }

  playSprint(): void {
    if (this.playSample('sprint', 0.7)) return;
    this.tone('sine', 300, 720, 0.22, 0.05);
    this.noise(0.3, 0.05, 1800);
  }

  playBlessing(): void {
    if (this.playSample('blessing', 0.8)) return;
    // A little four-note lift, roughly a shehnai-ish flourish.
    [523, 622, 784, 1047].forEach((f, i) => this.tone('triangle', f, f, 0.26, 0.06, i * 0.09));
  }

  playCurse(): void {
    if (this.playSample('curse', 0.85)) return;
    this.tone('sawtooth', 300, 90, 0.5, 0.1);
    this.noise(0.45, 0.22, 420);
  }

  playCoinLoss(): void {
    if (this.playSample('coinLoss', 0.7)) return;
    this.tone('square', 1100, 420, 0.14, 0.045);
    this.tone('square', 820, 300, 0.2, 0.04, 0.08);
  }

  playVictory(): void {
    this.stopAmbience();
    if (this.playSample('victory', 0.9)) return;
    [523, 659, 784, 1047, 1319].forEach((f, i) =>
      this.tone('triangle', f, f, 0.32, 0.075, i * 0.13)
    );
  }

  playDefeat(): void {
    this.stopAmbience();
    if (this.playSample('defeat', 0.9)) return;
    [440, 370, 294, 220].forEach((f, i) => this.tone('sawtooth', f, f * 0.97, 0.42, 0.085, i * 0.18));
  }

  // ===== Ambience =====

  /** Continuous filtered-noise traffic rumble under everything else. */
  startAmbience(): void {
    if (!this.enabled || this.ambience) return;
    const ctx = this.ensureContext();

    const seconds = 4;
    const frames = ctx.sampleRate * seconds;
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    // Brown-ish noise: smoother and more "distant road" than white.
    let last = 0;
    for (let i = 0; i < frames; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 420;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 1.5);

    source.connect(filter).connect(gain).connect(this.out);
    source.start();
    this.ambience = { source, gain };
  }

  stopAmbience(): void {
    if (!this.ambience || !this.ctx) return;
    const { source, gain } = this.ambience;
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.4);
    setTimeout(() => source.stop(), 500);
    this.ambience = null;
  }

  /** Ambience swells while Nitesh is buried in traffic. `intensity` is 0..1. */
  setAmbienceIntensity(intensity: number): void {
    if (!this.ambience || !this.ctx) return;
    const target = 0.04 + intensity * 0.09;
    this.ambience.gain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.4);
  }

  toggle(): boolean {
    this.enabled = !this.enabled;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(this.enabled ? 0.9 : 0, this.ctx.currentTime, 0.05);
    }
    return this.enabled;
  }
}
