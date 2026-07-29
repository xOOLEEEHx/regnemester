import Phaser from 'phaser';
import type { ShowcaseState } from '../types';

export type WorldInteraction = {
  x: number;
  y: number;
};

export interface ShowcaseSystem {
  applyState(state: ShowcaseState): void;
  update(time: number, delta: number, camera: Phaser.Cameras.Scene2D.Camera): void;
  interact(point: WorldInteraction): boolean;
  getEmitters(): Phaser.GameObjects.Particles.ParticleEmitter[];
  getVisibleLightCount(): number;
  destroy(): void;
}

export function isNearCamera(
  camera: Phaser.Cameras.Scene2D.Camera,
  x: number,
  y: number,
  radius: number
): boolean {
  const view = camera.worldView;
  return !(
    x + radius < view.left ||
    x - radius > view.right ||
    y + radius < view.top ||
    y - radius > view.bottom
  );
}

export function setEmitterRunning(
  emitter: Phaser.GameObjects.Particles.ParticleEmitter,
  enabled: boolean
): void {
  if (enabled) {
    emitter.setVisible(true).setActive(true);
    if (!emitter.emitting) emitter.start();
    return;
  }

  if (emitter.emitting) emitter.stop();
  emitter.killAll().setVisible(false).setActive(false);
}
