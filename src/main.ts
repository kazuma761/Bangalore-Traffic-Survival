import { Game } from './core/Game.ts';

// Reaching this line means the bundle has downloaded, parsed and evaluated —
// on a phone that is by far the longest part of the wait, so credit it before
// anything else runs.
window.__boot?.set(0.55, 'Engine loaded…');

const game = new Game();
game.init().catch((err) => {
  console.error(err);
  window.__boot?.set(1, 'Could not start. Please reload.');
});
