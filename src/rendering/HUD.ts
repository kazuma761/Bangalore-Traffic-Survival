import { CONFIG } from '../core/GameConfig.ts';
import { clamp } from '../utils/math.ts';

interface Bar {
  fill: HTMLDivElement;
  value: HTMLDivElement;
  wrap: HTMLDivElement;
}

export interface HUDState {
  health: number;
  sanity: number;
  stress: number;
  sprintEnergy: number;
  sprintReady: boolean;
  wallet: number;
  metresRemaining: number;
  elapsed: number;
  poisoned: boolean;
  staggered: boolean;
}

/**
 * The HUD builds and owns every one of its own elements, including its
 * stylesheet. Nothing else in the game touches its DOM — callers just hand it a
 * snapshot of the run each frame.
 *
 * Layout is class-driven rather than inline so a media query can shrink it: at
 * the desktop sizes the two columns needed ~380 px, which overlapped into an
 * unreadable mess on a 360 px phone. The narrow rules thin the bars, drop the
 * label text down a size, and lift the status line clear of the thumbstick.
 */

const CSS = `
.hud-root { position:absolute; inset:0; pointer-events:none; z-index:13; display:none;
  font-family:system-ui,-apple-system,sans-serif; color:#fff; }
.hud-left { position:absolute; top:calc(14px + env(safe-area-inset-top));
  left:calc(16px + env(safe-area-inset-left)); width:230px; }
.hud-right { position:absolute; top:calc(14px + env(safe-area-inset-top));
  right:calc(16px + env(safe-area-inset-right)); text-align:right;
  text-shadow:0 2px 6px rgba(0,0,0,0.75); }
.hud-distance { font-size:30px; font-weight:900; letter-spacing:-0.5px; }
.hud-goal { font-size:12px; opacity:0.75; margin-bottom:8px; }
.hud-wallet { font-size:19px; font-weight:700; color:#ffd54f; }
.hud-timer { font-size:14px; opacity:0.8; margin-top:4px; }
.hud-bar-wrap { margin-bottom:9px; }
.hud-bar-head { display:flex; justify-content:space-between; font-size:11px; font-weight:700;
  letter-spacing:0.6px; text-transform:uppercase; opacity:0.9; margin-bottom:3px;
  text-shadow:0 1px 3px rgba(0,0,0,0.9); }
.hud-bar-track { height:11px; border-radius:6px; overflow:hidden;
  box-shadow:inset 0 1px 3px rgba(0,0,0,0.6),0 0 0 1px rgba(255,255,255,0.12); }
.hud-bar-fill { height:100%; width:100%; border-radius:6px; transition:width 0.08s linear; }
.hud-status { position:absolute; bottom:calc(86px + env(safe-area-inset-bottom)); left:50%;
  transform:translateX(-50%); font-size:16px; font-weight:800; text-align:center;
  line-height:1.5; text-shadow:0 2px 6px rgba(0,0,0,0.85); width:min(92vw,560px); }

@media (max-width: 620px), (pointer: coarse) {
  .hud-left { width:min(46vw,190px); top:calc(10px + env(safe-area-inset-top));
    left:calc(10px + env(safe-area-inset-left)); }
  .hud-right { top:calc(10px + env(safe-area-inset-top));
    right:calc(10px + env(safe-area-inset-right)); }
  .hud-distance { font-size:22px; }
  .hud-goal { font-size:10px; margin-bottom:5px; max-width:38vw; margin-left:auto; }
  .hud-wallet { font-size:15px; }
  .hud-timer { font-size:12px; margin-top:2px; }
  .hud-bar-wrap { margin-bottom:6px; }
  .hud-bar-head { font-size:9px; letter-spacing:0.3px; margin-bottom:2px; }
  .hud-bar-track { height:8px; border-radius:4px; }
  .hud-bar-fill { border-radius:4px; }
  /* Clear of the sprint pad and the thumbstick. */
  .hud-status { bottom:calc(136px + env(safe-area-inset-bottom)); font-size:13px; }
}
`;

export class HUD {
  private root: HTMLDivElement;
  private health: Bar;
  private sanity: Bar;
  private stress: Bar;
  private sprint: Bar;
  private distanceEl: HTMLDivElement;
  private walletEl: HTMLDivElement;
  private timerEl: HTMLDivElement;
  private statusEl: HTMLDivElement;

  constructor(container: HTMLElement) {
    if (!document.getElementById('hud-styles')) {
      const style = document.createElement('style');
      style.id = 'hud-styles';
      style.textContent = CSS;
      document.head.appendChild(style);
    }

    this.root = document.createElement('div');
    this.root.className = 'hud-root';
    container.appendChild(this.root);

    // Left column: the four meters.
    const left = document.createElement('div');
    left.className = 'hud-left';
    this.root.appendChild(left);

    this.health = this.makeBar(left, 'Health', '#ff5252', '#5d1414');
    this.sanity = this.makeBar(left, 'Sanity', '#ba68c8', '#3b1a44');
    this.stress = this.makeBar(left, 'Noise Stress', '#ffa726', '#4d2d00');
    this.sprint = this.makeBar(left, 'Sprint', '#40c4ff', '#0d3548');

    // Right column: distance, wallet, timer.
    const right = document.createElement('div');
    right.className = 'hud-right';
    this.root.appendChild(right);

    this.distanceEl = document.createElement('div');
    this.distanceEl.className = 'hud-distance';
    right.appendChild(this.distanceEl);

    const goalNote = document.createElement('div');
    goalNote.textContent = 'to HSR Layout Entry Gate';
    goalNote.className = 'hud-goal';
    right.appendChild(goalNote);

    this.walletEl = document.createElement('div');
    this.walletEl.className = 'hud-wallet';
    right.appendChild(this.walletEl);

    this.timerEl = document.createElement('div');
    this.timerEl.className = 'hud-timer';
    right.appendChild(this.timerEl);

    // Centre-bottom status line for debuffs and warnings.
    this.statusEl = document.createElement('div');
    this.statusEl.className = 'hud-status';
    this.root.appendChild(this.statusEl);
  }

  private makeBar(parent: HTMLElement, label: string, color: string, track: string): Bar {
    const wrap = document.createElement('div');
    wrap.className = 'hud-bar-wrap';

    const head = document.createElement('div');
    head.className = 'hud-bar-head';

    const name = document.createElement('span');
    name.textContent = label;
    const value = document.createElement('div');
    head.append(name, value);

    const bar = document.createElement('div');
    bar.className = 'hud-bar-track';
    bar.style.background = track;

    const fill = document.createElement('div');
    fill.className = 'hud-bar-fill';
    fill.style.background = color;
    bar.appendChild(fill);

    wrap.append(head, bar);
    parent.appendChild(wrap);
    return { fill, value, wrap };
  }

  private setBar(bar: Bar, ratio: number, text: string): void {
    bar.fill.style.width = `${clamp(ratio, 0, 1) * 100}%`;
    bar.value.textContent = text;
  }

  show(visible: boolean): void {
    this.root.style.display = visible ? 'block' : 'none';
  }

  update(s: HUDState): void {
    this.setBar(this.health, s.health / CONFIG.nitesh.maxHealth, `${Math.ceil(s.health)}`);
    this.setBar(this.sanity, s.sanity / CONFIG.nitesh.maxSanity, `${Math.ceil(s.sanity)}`);
    this.setBar(this.stress, s.stress / 100, `${Math.round(s.stress)}%`);
    this.setBar(this.sprint, s.sprintEnergy, s.sprintReady ? 'READY' : '...');

    // The stress bar goes red and pulses once it is doing damage.
    const maxed = s.stress >= 100;
    this.stress.fill.style.background = maxed ? '#ff1744' : '#ffa726';
    this.stress.wrap.style.animation = maxed ? 'hud-pulse 0.45s infinite' : 'none';

    this.sprint.fill.style.background = s.sprintReady ? '#40c4ff' : '#546e7a';

    this.distanceEl.textContent = `${s.metresRemaining} m`;
    this.walletEl.textContent = `₹${s.wallet.toLocaleString('en-IN')}`;
    const mins = Math.floor(s.elapsed / 60);
    const secs = Math.floor(s.elapsed % 60);
    this.timerEl.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;

    const lines: string[] = [];
    if (maxed) lines.push('<span style="color:#ff1744">TOO MUCH HONKING — GET OUT OF THE TRAFFIC!</span>');
    if (s.staggered) lines.push('<span style="color:#ffab40">🕳️ Twisted ankle — gundi!</span>');
    if (s.poisoned) lines.push('<span style="color:#66bb6a">🤢 FOOD POISONING — hotte kettoytu, half speed</span>');
    this.statusEl.innerHTML = lines.join('<br>');
  }
}
