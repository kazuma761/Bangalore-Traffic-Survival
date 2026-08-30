import type { TopDownCamera } from './TopDownCamera.ts';

interface FloatItem {
  el: HTMLDivElement;
  x: number;
  y: number;
  z: number;
  life: number;
  maxLife: number;
  rise: number;
}

export type FloatStyle = 'honk' | 'damage' | 'blessing' | 'curse' | 'money';

const STYLES: Record<FloatStyle, { color: string; size: number; weight: number }> = {
  honk: { color: '#ffd54f', size: 20, weight: 900 },
  damage: { color: '#ff5252', size: 24, weight: 900 },
  blessing: { color: '#69f0ae', size: 22, weight: 800 },
  curse: { color: '#b388ff', size: 22, weight: 800 },
  money: { color: '#ffab40', size: 20, weight: 800 },
};

/**
 * World-anchored DOM pop-ups: HONK!, damage numbers, food outcome text.
 * Kept as HTML rather than sprites so the text stays crisp at any zoom.
 */
export class FloatingText {
  private items: FloatItem[] = [];
  private layer: HTMLDivElement;
  private cam: TopDownCamera;

  constructor(container: HTMLElement, cam: TopDownCamera) {
    this.cam = cam;
    this.layer = document.createElement('div');
    this.layer.style.cssText =
      'position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:12;';
    container.appendChild(this.layer);
  }

  spawn(text: string, x: number, z: number, style: FloatStyle, life = 1.1): void {
    const s = STYLES[style];
    const el = document.createElement('div');
    el.textContent = text;
    el.style.cssText =
      `position:absolute;transform:translate(-50%,-50%);white-space:nowrap;` +
      `font-family:system-ui,sans-serif;font-weight:${s.weight};font-size:${s.size}px;` +
      `color:${s.color};text-shadow:0 2px 6px rgba(0,0,0,0.85);will-change:transform,opacity;`;
    this.layer.appendChild(el);
    this.items.push({ el, x, y: 2.4, z, life, maxLife: life, rise: 0 });
  }

  update(dt: number): void {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      it.life -= dt;
      it.rise += dt * 26;

      if (it.life <= 0) {
        it.el.remove();
        this.items.splice(i, 1);
        continue;
      }

      const p = this.cam.project(it.x, it.y, it.z);
      if (p.behind) {
        it.el.style.opacity = '0';
        continue;
      }
      const t = it.life / it.maxLife;
      it.el.style.left = `${p.sx}px`;
      it.el.style.top = `${p.sy - it.rise}px`;
      it.el.style.opacity = String(Math.min(1, t * 1.8));
      it.el.style.transform = `translate(-50%,-50%) scale(${0.85 + (1 - t) * 0.25})`;
    }
  }

  clear(): void {
    for (const it of this.items) it.el.remove();
    this.items.length = 0;
  }
}
