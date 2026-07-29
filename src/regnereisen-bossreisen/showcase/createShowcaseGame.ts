import Phaser from 'phaser';
import { ShowcaseScene } from './ShowcaseScene';

export function createShowcaseGame(parent: string | HTMLElement = 'game'): Phaser.Game {
  const renderScale = Math.min(window.devicePixelRatio || 1, 2);
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.WEBGL,
    parent,
    backgroundColor: '#063e61',
    scale: {
      mode: Phaser.Scale.NONE,
      width: Math.max(1, Math.round(window.innerWidth * renderScale)),
      height: Math.max(1, Math.round(window.innerHeight * renderScale)),
      zoom: 1 / renderScale,
      autoRound: true
    },
    input: {
      activePointers: 3
    },
    render: {
      antialias: true,
      antialiasGL: true,
      pixelArt: false,
      stencil: true,
      stencilAlphaStrategy: 'dither',
      powerPreference: 'high-performance'
    },
    scene: [new ShowcaseScene(renderScale)]
  };

  const game = new Phaser.Game(config);
  const resize = () => {
    game.scale.resize(
      Math.max(1, Math.round(window.innerWidth * renderScale)),
      Math.max(1, Math.round(window.innerHeight * renderScale))
    );
  };
  window.addEventListener('resize', resize);
  game.events.once('destroy', () => window.removeEventListener('resize', resize));
  return game;
}
