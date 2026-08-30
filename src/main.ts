import { Game } from './core/Game.ts';

const game = new Game();
game.init().catch(console.error);
