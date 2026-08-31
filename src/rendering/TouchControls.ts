import type { InputManager } from '../core/InputManager.ts';

/**
 * On-screen controls for touch devices: a floating thumbstick on the left half
 * and a sprint pad on the right.
 *
 * The stick is *dynamic* — its base is placed wherever the thumb lands rather
 * than pinned to a fixed spot, which is what makes a phone game playable
 * without looking down. Both pads track their own `pointerId`, so steering and
 * sprinting at the same time works; a single shared handler would drop one.
 *
 * Each pad is a real element with `pointer-events`, so presses on the menu, the
 * story screen and the sound button are never swallowed — the pads only exist
 * while a run is on screen.
 */

/** Thumb travel, in CSS px, that counts as full deflection. */
const STICK_RADIUS = 58;
/** Below this fraction of the radius we read it as "not moving". */
const DEAD_ZONE = 0.16;

export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    (window.matchMedia?.('(pointer: coarse)').matches ?? false) ||
    navigator.maxTouchPoints > 0
  );
}

export class TouchControls {
  private input: InputManager;
  private root: HTMLDivElement;
  private stickZone: HTMLDivElement;
  private base: HTMLDivElement;
  private knob: HTMLDivElement;
  private sprintPad: HTMLButtonElement;

  private stickPointer: number | null = null;
  private originX = 0;
  private originY = 0;

  constructor(container: HTMLElement, input: InputManager) {
    this.input = input;

    this.root = document.createElement('div');
    this.root.style.cssText =
      'position:absolute;inset:0;z-index:14;display:none;pointer-events:none;' +
      'touch-action:none;user-select:none;-webkit-user-select:none;';
    container.appendChild(this.root);

    // --- Left half: steering ---
    this.stickZone = document.createElement('div');
    this.stickZone.style.cssText =
      'position:absolute;left:0;top:0;width:55%;height:100%;pointer-events:auto;' +
      'touch-action:none;';
    this.root.appendChild(this.stickZone);

    this.base = document.createElement('div');
    this.base.style.cssText =
      `position:absolute;width:${STICK_RADIUS * 2}px;height:${STICK_RADIUS * 2}px;` +
      'border-radius:50%;border:2px solid rgba(255,255,255,0.28);' +
      'background:rgba(0,0,0,0.22);transform:translate(-50%,-50%);' +
      'pointer-events:none;opacity:0;transition:opacity 0.12s;will-change:transform,opacity;';
    this.root.appendChild(this.base);

    this.knob = document.createElement('div');
    this.knob.style.cssText =
      'position:absolute;width:60px;height:60px;border-radius:50%;' +
      'background:rgba(255,255,255,0.42);border:2px solid rgba(255,255,255,0.75);' +
      'box-shadow:0 3px 12px rgba(0,0,0,0.45);transform:translate(-50%,-50%);' +
      'pointer-events:none;opacity:0;transition:opacity 0.12s;will-change:transform,opacity;';
    this.root.appendChild(this.knob);

    // --- Right: sprint ---
    this.sprintPad = document.createElement('button');
    this.sprintPad.type = 'button';
    this.sprintPad.setAttribute('aria-label', 'Panicked sprint');
    this.sprintPad.innerHTML =
      '<span style="font-size:26px;line-height:1">💨</span>' +
      '<span style="font-size:10px;font-weight:800;letter-spacing:0.8px">SPRINT</span>';
    this.sprintPad.style.cssText =
      'position:absolute;right:calc(18px + env(safe-area-inset-right));' +
      'bottom:calc(22px + env(safe-area-inset-bottom));' +
      'width:96px;height:96px;border-radius:50%;pointer-events:auto;touch-action:none;' +
      'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;' +
      'border:2px solid rgba(255,255,255,0.5);color:#fff;font-family:inherit;' +
      'background:radial-gradient(circle at 35% 30%,rgba(64,196,255,0.55),rgba(2,72,105,0.6));' +
      'box-shadow:0 4px 18px rgba(0,0,0,0.4);cursor:pointer;' +
      '-webkit-tap-highlight-color:transparent;transition:transform 0.08s,filter 0.08s;';
    this.root.appendChild(this.sprintPad);

    this.bind();
  }

  private bind(): void {
    this.stickZone.addEventListener('pointerdown', (e) => {
      if (this.stickPointer !== null) return;
      this.stickPointer = e.pointerId;
      this.stickZone.setPointerCapture(e.pointerId);
      this.originX = e.clientX;
      this.originY = e.clientY;
      this.base.style.opacity = '1';
      this.knob.style.opacity = '1';
      this.moveKnob(0, 0);
      this.base.style.transform = `translate(${this.originX}px,${this.originY}px) translate(-50%,-50%)`;
      e.preventDefault();
    });

    this.stickZone.addEventListener('pointermove', (e) => {
      if (e.pointerId !== this.stickPointer) return;
      const dx = e.clientX - this.originX;
      const dy = e.clientY - this.originY;
      const dist = Math.hypot(dx, dy);
      const clamped = Math.min(dist, STICK_RADIUS);
      // Unit direction, or zero inside the dead zone.
      const ratio = clamped / STICK_RADIUS;
      const ux = dist > 0 ? dx / dist : 0;
      const uy = dist > 0 ? dy / dist : 0;

      this.moveKnob(ux * clamped, uy * clamped);
      if (ratio < DEAD_ZONE) this.input.setTouchVector(0, 0);
      else this.input.setTouchVector(ux * ratio, uy * ratio);
      e.preventDefault();
    });

    const release = (e: PointerEvent): void => {
      if (e.pointerId !== this.stickPointer) return;
      this.stickPointer = null;
      this.base.style.opacity = '0';
      this.knob.style.opacity = '0';
      this.input.clearTouch();
    };
    this.stickZone.addEventListener('pointerup', release);
    this.stickZone.addEventListener('pointercancel', release);

    this.sprintPad.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.input.queueSprint();
      this.sprintPad.style.transform = 'scale(0.92)';
      this.sprintPad.style.filter = 'brightness(1.35)';
    });
    const springBack = (): void => {
      this.sprintPad.style.transform = 'scale(1)';
      this.sprintPad.style.filter = 'none';
    };
    this.sprintPad.addEventListener('pointerup', springBack);
    this.sprintPad.addEventListener('pointercancel', springBack);
    this.sprintPad.addEventListener('pointerleave', springBack);
  }

  private moveKnob(dx: number, dy: number): void {
    this.knob.style.transform =
      `translate(${this.originX + dx}px,${this.originY + dy}px) translate(-50%,-50%)`;
  }

  show(visible: boolean): void {
    this.root.style.display = visible ? 'block' : 'none';
    if (!visible) {
      this.stickPointer = null;
      this.base.style.opacity = '0';
      this.knob.style.opacity = '0';
      this.input.clearTouch();
    }
  }
}
