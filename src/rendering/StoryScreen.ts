import { STORY_BEATS, STORY_TITLE } from '../core/Dialogue.ts';

/**
 * The intro. Walks Nitesh's situation one beat at a time before the run
 * starts. Builds and owns every element it needs.
 */
export class StoryScreen {
  private root: HTMLDivElement;
  private textEl: HTMLDivElement;
  private noteEl: HTMLDivElement;
  private dotsEl: HTMLDivElement;
  private nextBtn: HTMLButtonElement;
  private index = 0;
  private onDone: (() => void) | null = null;

  constructor(container: HTMLElement) {
    this.root = document.createElement('div');
    this.root.className = 'screen';
    this.root.style.cssText =
      'position:absolute;inset:0;display:none;flex-direction:column;align-items:center;' +
      'justify-content:center;z-index:110;padding:28px;text-align:center;' +
      'font-family:system-ui,-apple-system,sans-serif;' +
      'background:linear-gradient(160deg,#12100c 0%,#241c14 45%,#3a2a18 100%);';
    container.appendChild(this.root);

    const title = document.createElement('div');
    title.textContent = STORY_TITLE;
    title.style.cssText =
      'font-size:clamp(15px,3.4vw,20px);font-weight:800;color:#ffb300;' +
      'letter-spacing:0.4px;margin-bottom:34px;';
    this.root.appendChild(title);

    this.textEl = document.createElement('div');
    this.textEl.style.cssText =
      'max-width:640px;min-height:96px;font-size:clamp(19px,4.2vw,27px);font-weight:700;' +
      'color:#fff;line-height:1.5;transition:opacity 0.25s;';
    this.root.appendChild(this.textEl);

    this.noteEl = document.createElement('div');
    this.noteEl.style.cssText =
      'max-width:560px;min-height:44px;margin-top:14px;font-size:clamp(13px,2.8vw,15.5px);' +
      'color:#bcaaa4;font-style:italic;line-height:1.7;transition:opacity 0.25s;';
    this.root.appendChild(this.noteEl);

    this.dotsEl = document.createElement('div');
    this.dotsEl.style.cssText = 'display:flex;gap:7px;margin:30px 0 24px;';
    this.root.appendChild(this.dotsEl);
    for (let i = 0; i < STORY_BEATS.length; i++) {
      const dot = document.createElement('span');
      dot.style.cssText = 'width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,0.22);';
      this.dotsEl.appendChild(dot);
    }

    this.nextBtn = document.createElement('button');
    this.nextBtn.className = 'primary';
    this.nextBtn.style.cssText =
      'padding:13px 46px;font-size:18px;font-weight:800;border:none;border-radius:50px;' +
      'background:linear-gradient(135deg,#f57c00,#e64a19);color:#fff;cursor:pointer;' +
      'font-family:inherit;box-shadow:0 6px 22px rgba(230,74,25,0.38);';
    this.nextBtn.addEventListener('click', () => this.advance());
    this.root.appendChild(this.nextBtn);

    const skip = document.createElement('button');
    skip.textContent = 'Skip — bega hogona';
    skip.style.cssText =
      'margin-top:18px;background:none;border:none;color:rgba(255,255,255,0.42);' +
      'font-family:inherit;font-size:13px;cursor:pointer;text-decoration:underline;';
    skip.addEventListener('click', () => this.finish());
    this.root.appendChild(skip);
  }

  show(onDone: () => void): void {
    this.onDone = onDone;
    this.index = 0;
    this.root.style.display = 'flex';
    this.render();
  }

  private advance(): void {
    if (this.index >= STORY_BEATS.length - 1) {
      this.finish();
      return;
    }
    this.index++;
    this.render();
  }

  private render(): void {
    const beat = STORY_BEATS[this.index];
    // Brief fade so beats do not snap between each other.
    this.textEl.style.opacity = '0';
    this.noteEl.style.opacity = '0';
    window.setTimeout(() => {
      this.textEl.textContent = beat.text;
      this.noteEl.textContent = beat.note ?? '';
      this.textEl.style.opacity = '1';
      this.noteEl.style.opacity = '1';
    }, 160);

    Array.from(this.dotsEl.children).forEach((dot, i) => {
      (dot as HTMLElement).style.background =
        i === this.index ? '#ffb300' : i < this.index ? 'rgba(255,179,0,0.4)' : 'rgba(255,255,255,0.22)';
    });

    const last = this.index === STORY_BEATS.length - 1;
    this.nextBtn.textContent = last ? 'NADI, GURU →' : 'Next';
  }

  private finish(): void {
    this.root.style.display = 'none';
    const done = this.onDone;
    this.onDone = null;
    done?.();
  }
}
