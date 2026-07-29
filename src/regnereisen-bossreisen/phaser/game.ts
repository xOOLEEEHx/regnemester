import Phaser from 'phaser';
import type { ProgressStore } from '../game/simulation/progress';
import type { HudController } from '../ui/hud';
import { BoatTravelScene } from './scenes/BoatTravelScene';
import { CrystalCartScene } from './scenes/CrystalCartScene';
import { CounterweightVaultScene } from './scenes/CounterweightVaultScene';
import { FishingScene } from './scenes/FishingScene';
import { LightForestScene } from './scenes/LightForestScene';
import { SwampAlchemyScene } from './scenes/SwampAlchemyScene';
import { WorldScene } from './scenes/WorldScene';

export function createGame(
  progress: ProgressStore,
  hud: HudController,
  parent: string | HTMLElement = 'game'
): Phaser.Game {
  const renderScale = Math.min(window.devicePixelRatio || 1, 2);
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.WEBGL,
    parent,
    backgroundColor: '#08384f',
    scale: {
      mode: Phaser.Scale.NONE,
      width: Math.round(window.innerWidth * renderScale),
      height: Math.round(window.innerHeight * renderScale),
      zoom: 1 / renderScale,
      autoRound: true
    },
    physics: {
      default: 'arcade'
    },
    render: {
      antialias: true,
      antialiasGL: true,
      pixelArt: false,
      stencil: true,
      stencilAlphaStrategy: 'dither',
      powerPreference: 'high-performance'
    },
    scene: [
      new WorldScene(progress, hud, renderScale),
      new FishingScene(progress, renderScale),
      new BoatTravelScene(renderScale),
      new CrystalCartScene(progress, hud, renderScale),
      new SwampAlchemyScene(progress, hud, renderScale),
      new LightForestScene(progress, hud, renderScale),
      new CounterweightVaultScene(progress, hud, renderScale)
    ]
  };

  const game = new Phaser.Game(config);
  const resize = () => {
    game.scale.resize(
      Math.round(window.innerWidth * renderScale),
      Math.round(window.innerHeight * renderScale)
    );
  };

  window.addEventListener('resize', resize);
  game.events.once('destroy', () => window.removeEventListener('resize', resize));

  return game;
}
