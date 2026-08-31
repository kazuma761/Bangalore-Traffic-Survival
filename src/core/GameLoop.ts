export type UpdateFn = (dt: number) => void;
export type RenderFn = (alpha: number) => void;

export class GameLoop {
  private fixedStep = 1 / 60; // 60Hz physics
  private accumulator = 0;
  private lastTime = 0;
  private running = false;
  private rafId = 0;
  private updateFn: UpdateFn;
  private renderFn: RenderFn;

  constructor(updateFn: UpdateFn, renderFn: RenderFn) {
    this.updateFn = updateFn;
    this.renderFn = renderFn;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.rafId = requestAnimationFrame((t) => this.tick(t));
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  get isRunning(): boolean {
    return this.running;
  }

  /**
   * Restarts after a stop without replaying the gap. Backgrounding a tab on a
   * phone stops rAF entirely; without resetting `lastTime` the first frame back
   * carries the whole away-time, and the 100 ms frame cap then spends dozens of
   * catch-up steps — Nitesh reappears several metres into traffic.
   */
  resume(): void {
    if (this.running) return;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.running = true;
    this.rafId = requestAnimationFrame((t) => this.tick(t));
  }

  private tick(now: number): void {
    if (!this.running) return;

    const frameTime = Math.min((now - this.lastTime) / 1000, 0.1); // Cap at 100ms
    this.lastTime = now;
    this.accumulator += frameTime;

    // Fixed timestep updates
    while (this.accumulator >= this.fixedStep) {
      this.updateFn(this.fixedStep);
      this.accumulator -= this.fixedStep;
    }

    // Render with interpolation alpha
    const alpha = this.accumulator / this.fixedStep;
    this.renderFn(alpha);

    this.rafId = requestAnimationFrame((t) => this.tick(t));
  }
}
