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
    this.running = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.rafId = requestAnimationFrame((t) => this.tick(t));
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
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
