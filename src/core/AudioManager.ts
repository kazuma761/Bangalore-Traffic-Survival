/**
 * Procedural Web Audio effects - no asset files. Every sound in the commute
 * is synthesised here so the build stays a single JS bundle.
 */
export class AudioManager {
  private ctx: AudioContext | null = null;
  private enabled = true;

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  /** Shared helper: one oscillator with an attack/decay envelope. */
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

    osc.connect(amp).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + duration + 0.05);
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
    src.connect(filter).connect(amp).connect(ctx.destination);
    src.start();
  }

  /** Short two-tone car horn. */
  playHonk(): void {
    this.tone('square', 420, 400, 0.16, 0.05);
    this.tone('square', 530, 505, 0.16, 0.04, 0.02);
  }

  /** Deeper, longer air horn for the BMTC bus. */
  playBusHorn(): void {
    this.tone('sawtooth', 165, 150, 0.75, 0.09);
    this.tone('sawtooth', 110, 100, 0.75, 0.07, 0.01);
  }

  /** Auto-rickshaw's reedy squeak. */
  playAutoHorn(): void {
    this.tone('sawtooth', 780, 900, 0.12, 0.045);
    this.tone('sawtooth', 900, 700, 0.12, 0.035, 0.09);
  }

  playHit(): void {
    this.noise(0.28, 0.35, 900);
    this.tone('triangle', 180, 60, 0.3, 0.14);
  }

  playSprint(): void {
    this.tone('sine', 300, 720, 0.22, 0.05);
  }

  playBlessing(): void {
    this.tone('sine', 520, 520, 0.12, 0.07);
    this.tone('sine', 660, 660, 0.12, 0.07, 0.1);
    this.tone('sine', 880, 880, 0.24, 0.07, 0.2);
  }

  playCurse(): void {
    this.tone('sawtooth', 300, 90, 0.5, 0.1);
    this.noise(0.4, 0.2, 500);
  }

  playCoinLoss(): void {
    this.tone('square', 900, 300, 0.22, 0.05);
  }

  playVictory(): void {
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => this.tone('triangle', f, f, 0.3, 0.08, i * 0.14));
  }

  playDefeat(): void {
    const notes = [440, 370, 294, 220];
    notes.forEach((f, i) => this.tone('sawtooth', f, f * 0.98, 0.4, 0.09, i * 0.18));
  }

  toggle(): boolean {
    this.enabled = !this.enabled;
    return this.enabled;
  }
}
