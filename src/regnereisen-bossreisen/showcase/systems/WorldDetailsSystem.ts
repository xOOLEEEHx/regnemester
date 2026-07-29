import Phaser from 'phaser';
import { QUALITY_PROFILES, type ShowcaseState } from '../types';
import type { ShowcaseSystem, WorldInteraction } from './ShowcaseSystem';

const RARE_WORLD_EVENT_INTERVAL_MS = 120000;

export class WorldDetailsSystem implements ShowcaseSystem {
  private readonly stars: Phaser.GameObjects.Image[];
  private state: ShowcaseState;
  private nextEvent = 0;
  private eventActive = false;
  private eventTimer?: Phaser.Time.TimerEvent;

  constructor(private readonly scene: Phaser.Scene, initialState: ShowcaseState) {
    this.state = initialState;
    this.stars = Array.from({ length: 3 }, () =>
      scene.add
        .image(-500, -500, 'fx-spark')
        .setVisible(false)
        .setTint(0xc6edff)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(40)
    );
    this.nextEvent = scene.time.now + RARE_WORLD_EVENT_INTERVAL_MS;
    this.applyState(initialState);
  }

  applyState(state: ShowcaseState): void {
    this.state = state;
    if (!state.effects.events) this.stopStarfall();
  }

  update(time: number, _delta: number, camera: Phaser.Cameras.Scene2D.Camera): void {
    if (
      !this.eventActive
      && time >= this.nextEvent
      && this.state.effects.events
      && QUALITY_PROFILES[this.state.quality].rareEvents
    ) {
      this.runStarfall(camera);
    }
  }

  interact(_point: WorldInteraction): boolean {
    return false;
  }

  triggerRareEvent(camera: Phaser.Cameras.Scene2D.Camera): boolean {
    if (!this.state.effects.events) return false;
    this.stopStarfall(false);
    this.runStarfall(camera);
    return true;
  }

  getEmitters(): Phaser.GameObjects.Particles.ParticleEmitter[] {
    return [];
  }

  getVisibleLightCount(): number {
    return 0;
  }

  destroy(): void {
    this.stopStarfall(false);
    this.stars.forEach((star) => star.destroy());
  }

  private runStarfall(camera: Phaser.Cameras.Scene2D.Camera): void {
    this.eventActive = true;
    document.dispatchEvent(
      new CustomEvent('showcase-world-event', { detail: { name: 'Stjerneregn over riket' } })
    );

    const view = camera.worldView;
    const scale = Phaser.Math.Clamp(1 / camera.zoom, 1, 4);
    this.stars.forEach((star, index) => {
      const startX = view.left - (260 + index * 90) * scale;
      const startY = view.top + view.height * (0.1 + index * 0.08);
      star
        .setPosition(startX, startY)
        .setDisplaySize(220 * scale, 28 * scale)
        .setRotation(0.28)
        .setAlpha(0)
        .setVisible(false);
      this.scene.tweens.add({
        targets: star,
        x: view.right + (300 + index * 70) * scale,
        y: startY + view.height * 0.34,
        alpha: 0,
        delay: index * 260,
        duration: 1250 + index * 120,
        ease: 'Quad.easeIn',
        onStart: () => star.setVisible(true).setAlpha(0.88 - index * 0.1)
      });
    });

    this.eventTimer?.remove(false);
    this.eventTimer = this.scene.time.delayedCall(2400, () => this.finishStarfall());
  }

  private finishStarfall(): void {
    this.eventActive = false;
    this.stars.forEach((star) => star.setVisible(false));
    this.nextEvent = this.scene.time.now + RARE_WORLD_EVENT_INTERVAL_MS;
    document.dispatchEvent(
      new CustomEvent('showcase-world-event', { detail: { name: 'Verden er rolig' } })
    );
  }

  private stopStarfall(resetCooldown = true): void {
    this.eventTimer?.remove(false);
    this.eventTimer = undefined;
    this.eventActive = false;
    this.stars.forEach((star) => {
      this.scene.tweens.killTweensOf(star);
      star.setVisible(false);
    });
    if (resetCooldown) this.nextEvent = this.scene.time.now + RARE_WORLD_EVENT_INTERVAL_MS;
    document.dispatchEvent(
      new CustomEvent('showcase-world-event', { detail: { name: 'Verden er rolig' } })
    );
  }
}
