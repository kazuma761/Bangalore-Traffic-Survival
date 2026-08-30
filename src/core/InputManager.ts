/**
 * Keyboard + touch input for Nitesh. Movement is 8-way and normalised;
 * the sprint is edge-triggered so holding Spacebar does not re-fire it.
 */
export class InputManager {
  private keys = new Set<string>();
  private moveVector = { x: 0, z: 0 };
  private touchActive = false;
  private touchStartX = 0;
  private touchStartY = 0;
  private joystickSensitivity = 0.014;
  /** Set on keydown, cleared by consumeSprint(). */
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

    window.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    window.addEventListener('pointermove', (e) => this.onPointerMove(e));
    window.addEventListener('pointerup', () => this.onPointerUp());
    window.addEventListener('pointercancel', () => this.onPointerUp());
  }

  private onPointerDown(e: PointerEvent): void {
    if (e.pointerType === 'touch' && e.clientX > window.innerWidth * 0.65) {
      // Right side of a touchscreen is the sprint button.
      this.sprintQueued = true;
      return;
    }
    this.touchActive = true;
    this.touchStartX = e.clientX;
    this.touchStartY = e.clientY;
  }

  private onPointerMove(e: PointerEvent): void {
    if (!this.touchActive) return;
    const dx = (e.clientX - this.touchStartX) * this.joystickSensitivity;
    const dy = (e.clientY - this.touchStartY) * this.joystickSensitivity;
    const magnitude = Math.hypot(dx, dy);
    if (magnitude > 1) {
      this.moveVector.x = dx / magnitude;
      this.moveVector.z = dy / magnitude;
    } else if (magnitude > 0.12) {
      this.moveVector.x = dx;
      this.moveVector.z = dy;
    } else {
      this.moveVector.x = 0;
      this.moveVector.z = 0;
    }
  }

  private onPointerUp(): void {
    this.touchActive = false;
    this.moveVector.x = 0;
    this.moveVector.z = 0;
  }

  /** True once per Spacebar press / sprint tap. */
  consumeSprint(): boolean {
    const queued = this.sprintQueued;
    this.sprintQueued = false;
    return queued;
  }

  getMovement(): { x: number; z: number } {
    if (this.touchActive) return { x: this.moveVector.x, z: this.moveVector.z };

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
    this.onPointerUp();
  }
}
