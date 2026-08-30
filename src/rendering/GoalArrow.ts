import type { TopDownCamera } from './TopDownCamera.ts';

/**
 * Persistent on-screen navigation arrow pointing at the HSR Layout gate.
 * It orbits the centre of the screen so it is readable however far off the
 * goal is, and reports the remaining distance underneath itself.
 */
export class GoalArrow {
  private el: HTMLDivElement;
  private label: HTMLDivElement;
  private cam: TopDownCamera;

  constructor(container: HTMLElement, cam: TopDownCamera) {
    this.cam = cam;

    this.el = document.createElement('div');
    this.el.style.cssText =
      'position:absolute;left:50%;top:50%;pointer-events:none;z-index:11;display:none;' +
      'transform-origin:center;will-change:transform;';
    this.el.innerHTML =
      '<svg width="46" height="46" viewBox="0 0 46 46">' +
      '<path d="M23 3 L38 34 L23 26 L8 34 Z" fill="#4caf50" stroke="#0b3d0b" stroke-width="2.5" ' +
      'stroke-linejoin="round" opacity="0.95"/></svg>';

    this.label = document.createElement('div');
    this.label.style.cssText =
      'position:absolute;pointer-events:none;z-index:11;display:none;transform:translate(-50%,0);' +
      'font-family:system-ui,sans-serif;font-size:13px;font-weight:700;color:#c8e6c9;' +
      'text-shadow:0 2px 5px rgba(0,0,0,0.8);white-space:nowrap;';

    container.appendChild(this.el);
    container.appendChild(this.label);
  }

  show(visible: boolean): void {
    this.el.style.display = visible ? 'block' : 'none';
    this.label.style.display = visible ? 'block' : 'none';
  }

  /** `metres` is what the HUD shows; the arrow repeats it near the pointer. */
  update(playerX: number, playerZ: number, goalX: number, goalZ: number, metres: number): void {
    const player = this.cam.project(playerX, 1.5, playerZ);
    const goal = this.cam.project(goalX, 1.5, goalZ);

    // Screen-space heading from Nitesh to the gate.
    const dx = goal.sx - player.sx;
    const dy = goal.sy - player.sy;
    // The SVG arrow points up at 0 rad, so rotate from -Y.
    const angle = Math.atan2(dx, -dy);

    const radius = Math.min(window.innerWidth, window.innerHeight) * 0.22;
    const ox = Math.sin(angle) * radius;
    const oy = -Math.cos(angle) * radius;

    this.el.style.transform =
      `translate(calc(-50% + ${ox}px), calc(-50% + ${oy}px)) rotate(${angle}rad)`;
    this.label.style.left = `${window.innerWidth / 2 + ox}px`;
    this.label.style.top = `${window.innerHeight / 2 + oy + 30}px`;
    this.label.textContent = `${metres} m`;
  }
}
