import Phaser from 'phaser';
import { readManualWaterfallRegions, type WaterfallRegion } from '../manualWaterfalls';
import { QUALITY_PROFILES, type ShowcaseState } from '../types';
import {
  isNearCamera,
  setEmitterRunning,
  type ShowcaseSystem,
  type WorldInteraction
} from './ShowcaseSystem';

export class WaterfallSystem implements ShowcaseSystem {
  private readonly streams: Phaser.GameObjects.Image[];
  private readonly flow: Phaser.GameObjects.Particles.ParticleEmitter[];
  private readonly mist: Phaser.GameObjects.Particles.ParticleEmitter[];
  private readonly points: readonly WaterfallRegion[];
  private state: ShowcaseState;
  private nearFlags: boolean[];

  constructor(private readonly scene: Phaser.Scene, initialState: ShowcaseState) {
    this.state = initialState;
    this.points = readManualWaterfallRegions(scene);
    this.nearFlags = this.points.map(() => true);
    this.streams = this.points.map((point) =>
      scene.add
        .image(point.x, point.y, 'fx-waterfall')
        .setDisplaySize(point.width, point.height)
        .setOrigin(0.5, 0)
        .setAlpha(0.2)
        .setBlendMode(Phaser.BlendModes.SCREEN)
    );
    this.flow = this.points.map((point) => {
      const streakLength = Math.min(54, Math.max(8, point.height * 0.34));
      const travelDistance = Math.max(2, point.height - streakLength);
      const duration = Phaser.Math.Clamp(point.height * 5.2, 240, 1050);
      return scene.add.particles(point.x, point.y + streakLength / 2, 'fx-waterfall-streak', {
        x: { min: -point.width * 0.42, max: point.width * 0.42 },
        y: { min: -2, max: 2 },
        speedX: { min: -1.4, max: 1.4 },
        speedY: (travelDistance / duration) * 1000,
        lifespan: duration,
        scaleX: { start: 0.34, end: 0.2 },
        scaleY: { start: streakLength / 64, end: (streakLength / 64) * 1.08 },
        alpha: { start: 0.56, end: 0.09 },
        tint: [0xb4deea, 0x86c5dc, 0x67adcc],
        frequency: 72,
        maxAliveParticles: 16,
        blendMode: Phaser.BlendModes.ADD
      });
    });
    this.mist = this.points.map((point) =>
      scene.add.particles(point.x, point.y + point.height, 'fx-mist', {
        x: { min: -point.width * 1.2, max: point.width * 1.2 },
        y: { min: -12, max: 12 },
        speedX: { min: -18, max: 18 },
        speedY: { min: -14, max: -3 },
        lifespan: { min: 750, max: 1400 },
        scale: { start: 0.16, end: 0.42 },
        alpha: { start: 0.18, end: 0 },
        frequency: 180,
        maxAliveParticles: 12,
        blendMode: Phaser.BlendModes.SCREEN
      })
    );
    this.applyState(initialState);
  }

  applyState(state: ShowcaseState): void {
    this.state = state;
    const enabled = state.effects.waterfalls;
    const profile = QUALITY_PROFILES[state.quality];
    this.streams.forEach((stream) => stream.setVisible(enabled));
    this.flow.forEach((emitter, index) => {
      emitter.setFrequency(Math.round(82 / profile.particleMultiplier));
      const baseLimit = Phaser.Math.Clamp(Math.ceil(this.points[index].width / 3), 5, 18);
      emitter.maxAliveParticles = Math.max(3, Math.round(baseLimit * profile.particleMultiplier));
      setEmitterRunning(emitter, enabled && state.effects.particles && this.nearFlags[index]);
    });
    this.mist.forEach((emitter, index) => {
      emitter.setFrequency(Math.round(240 / profile.particleMultiplier));
      emitter.maxAliveParticles = Math.max(4, Math.round(12 * profile.particleMultiplier));
      setEmitterRunning(emitter, enabled && state.effects.particles && this.nearFlags[index]);
    });
  }

  update(time: number, _delta: number, camera: Phaser.Cameras.Scene2D.Camera): void {
    if (!this.state.effects.waterfalls) return;
    const intensity = QUALITY_PROFILES[this.state.quality].shaderIntensity;
    this.points.forEach((point, index) => {
      this.nearFlags[index] = isNearCamera(camera, point.x, point.y + point.height / 2, 300);
      setEmitterRunning(this.flow[index], this.nearFlags[index] && this.state.effects.particles);
      setEmitterRunning(this.mist[index], this.nearFlags[index] && this.state.effects.particles);
      const pulse = 0.5 + 0.5 * Math.sin(time * (0.0024 + index * 0.00017) + index);
      this.streams[index]
        .setAlpha((0.2 + pulse * 0.22) * (0.72 + intensity * 0.32))
        .setDisplaySize(point.width * (1.02 + pulse * 0.025), point.height);
    });
  }

  interact(_point: WorldInteraction): boolean {
    return false;
  }

  getEmitters(): Phaser.GameObjects.Particles.ParticleEmitter[] {
    return [...this.flow, ...this.mist];
  }

  getVisibleLightCount(): number {
    return 0;
  }

  destroy(): void {
    this.streams.forEach((stream) => stream.destroy());
    this.flow.forEach((emitter) => emitter.destroy());
    this.mist.forEach((emitter) => emitter.destroy());
  }
}
