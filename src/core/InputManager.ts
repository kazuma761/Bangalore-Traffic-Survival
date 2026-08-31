/**
 * Keyboard input for Nitesh, plus the channel that `TouchControls` pushes into.
 *
 * Movement is 8-way and normalised; the sprint is edge-triggered so holding
 * Spacebar does not re-fire it. Touch is deliberately NOT read from window
 * events here — an invisible whole-screen drag handler steals presses meant for
 * the menu, the sound button and the story screen. `TouchControls` owns its own
 * elements and calls `setTouchVector()` / `queueSprint()`.
 */
export class InputManager {
  private keys = new Set<string>();
  private touch = { x: 0, z: 0, active: false };
  /** Set on keydown or a sprint tap, cleared by consumeSprint(). */
  private sprintQueued = false;

  constructor() {
    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      if (key === ' ' || key === 'spacebar') {
        e.preventDefault();
        if (!this.keys.has(' ')) this.sprintQueued = true;
        this.keys.add(' ');
        return;
      }
      this.keys.add(key);
    });

    window.addEventListener('keyup', (e) => {
      const key = e.key.toLowerCase();
      this.keys.delete(key === 'spacebar' ? ' ' : key);
    });

    // A phone that scrolls away mid-run leaves keys stuck down otherwise.
    window.addEventListener('blur', () => this.reset());
  }

  /** Called by TouchControls. `x`/`z` are already clamped to a unit circle. */
  setTouchVector(x: number, z: number): void {
    this.touch.x = x;
    this.touch.z = z;
    this.touch.active = x !== 0 || z !== 0;
  }

  clearTouch(): void {
    this.touch.x = 0;
    this.touch.z = 0;
    this.touch.active = false;
  }

  /** Called by TouchControls when the sprint pad is tapped. */
  queueSprint(): void {
    this.sprintQueued = true;
  }

  /** True once per Spacebar press / sprint tap. */
  consumeSprint(): boolean {
    const queued = this.sprintQueued;
    this.sprintQueued = false;
    return queued;
  }

  getMovement(): { x: number; z: number } {
    if (this.touch.active) return { x: this.touch.x, z: this.touch.z };

    let kx = 0;
    let kz = 0;
    if (this.keys.has('w') || this.keys.has('arrowup')) kz -= 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) kz += 1;
    if (this.keys.has('a') || this.keys.has('arrowleft')) kx -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) kx += 1;

    if (kx !== 0 && kz !== 0) {
      const inv = 1 / Math.SQRT2;
      kx *= inv;
      kz *= inv;
    }
    return { x: kx, z: kz };
  }

  reset(): void {
    this.keys.clear();
    this.sprintQueued = false;
    this.clearTouch();
  }
}
