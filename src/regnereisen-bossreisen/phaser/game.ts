import Phaser from 'phaser';
import type { ProgressStore } from '../game/simulation/progress';
import type { HudController } from '../ui/hud';
import { WorldScene } from './scenes/WorldScene';

export function createGame(progress: ProgressStore, hud: HudController, parent: string | HTMLElement = 'game'): Phaser.Game {
  const config = {
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#08384f',
    scale: {
      mode: Phaser.Scale.RESIZE,
      width: window.innerWidth,
      height: window.innerHeight
    },
    physics: {
      default: 'arcade'
    },
    render: {
      antialias: true,
      antialiasGL: true,
      pixelArt: false
    },
    resolution: Math.min(window.devicePixelRatio || 1, 3),
    scene: [new WorldScene(progress, hud)]
  };

  return new Phaser.Game(config);
}
