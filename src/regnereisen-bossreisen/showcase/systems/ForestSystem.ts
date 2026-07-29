import Phaser from 'phaser';
import { REGIONS, contains } from '../mapRegions';
import { QUALITY_PROFILES, type ShowcaseState } from '../types';
import {
  isNearCamera,
  setEmitterRunning,
  type ShowcaseSystem,
  type WorldInteraction
} from './ShowcaseSystem';

const FOREST_X = 420;
const FOREST_Y = 825;

export class ForestSystem implements ShowcaseSystem {
  private readonly mist: Phaser.GameObjects.Image[];
  private readonly fireflies: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly leaves: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly gather: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly light: Phaser.GameObjects.Light;
  private state: ShowcaseState;
  private nearCamera = true;

  constructor(private readonly scene: Phaser.Scene, initialState: ShowcaseState) {
    this.state = initialState;
    this.mist = [
      { x: 250, y: 785, scale: 1.05, tint: 0x7faed8 },
      { x: 445, y: 880, scale: 1.25, tint: 0x6da8d5 },
      { x: 610, y: 720, scale: 0.95, tint: 0x7a96d8 }
    ].map((item) =>
      scene.add
        .image(item.x, item.y, 'fx-mist')
        .setScale(item.scale)
        .setTint(item.tint)
        .setAlpha(0.1)
        .setBlendMode(Phaser.BlendModes.SCREEN)
    );

    this.fireflies = scene.add.particles(FOREST_X, FOREST_Y, 'fx-spark', {
      x: { min: -330, max: 330 },
      y: { min: -245, max: 245 },
      speedX: { min: -18, max: 18 },
      speedY: { min: -17, max: 10 },
      lifespan: { min: 1900, max: 4200 },
      scale: { start: 0.34, end: 0.04 },
      alpha: { start: 0.96, end: 0 },
      tint: [0x45a9ff, 0x78e8ff, 0x7f76ff, 0xb1f4ff],
      frequency: 100,
      maxAliveParticles: 72,
      blendMode: Phaser.BlendModes.ADD
    });

    this.leaves = scene.add.particles(FOREST_X, FOREST_Y - 210, 'fx-leaf', {
      x: { min: -330, max: 330 },
      speedX: { min: -24, max: 32 },
      speedY: { min: 9, max: 30 },
      rotate: { min: -180, max: 180 },
      lifespan: { min: 2200, max: 4200 },
      scale: { start: 0.55, end: 0.22 },
      alpha: { start: 0.38, end: 0 },
      frequency: 460,
      maxAliveParticles: 18
    });

    this.gather = scene.add.particles(0, 0, 'fx-spark', {
      speed: { min: 18, max: 75 },
      angle: { min: 0, max: 360 },
      lifespan: { min: 520, max: 1000 },
      scale: { start: 0.34, end: 0 },
      alpha: { start: 0.95, end: 0 },
      tint: [0x6ec5ff, 0xa58cff],
      emitting: false,
      maxParticles: 80,
      blendMode: Phaser.BlendModes.ADD
    });

    this.light = scene.lights.addLight(FOREST_X, FOREST_Y, 390, 0x4b8bff, 0.34).setZNormal(0.18);
    this.applyState(initialState);
  }

  applyState(state: ShowcaseState): void {
    this.state = state;
    const enabled = state.effects.forest;
    const profile = QUALITY_PROFILES[state.quality];
    this.mist.forEach((mist, index) => mist.setVisible(enabled && state.effects.atmosphere && index < profile.fogLayers));
    this.light.setVisible(enabled && state.effects.lighting && profile.lightCount >= 5);
    this.fireflies.setFrequency(Math.round(115 / profile.particleMultiplier));
    this.leaves.setFrequency(Math.round(540 / profile.particleMultiplier));
    this.fireflies.maxAliveParticles = Math.round(72 * profile.particleMultiplier);
    this.leaves.maxAliveParticles = Math.max(5, Math.round(18 * profile.particleMultiplier));
    setEmitterRunning(this.fireflies, enabled && state.effects.particles && this.nearCamera);
    setEmitterRunning(this.leaves, enabled && state.effects.particles && state.effects.atmosphere && this.nearCamera);
  }

  update(time: number, _delta: number, camera: Phaser.Cameras.Scene2D.Camera): void {
    if (!this.state.effects.forest) return;
    this.nearCamera = isNearCamera(camera, FOREST_X, FOREST_Y, 560);
    setEmitterRunning(this.fireflies, this.nearCamera && this.state.effects.particles);
    setEmitterRunning(this.leaves, this.nearCamera && this.state.effects.particles && this.state.effects.atmosphere);
    this.mist.forEach((mist, index) => {
      mist.x += Math.sin(time * 0.00022 + index * 2.1) * 0.08;
      mist.setAlpha(0.07 + (0.5 + 0.5 * Math.sin(time * 0.0005 + index)) * 0.06);
    });
    this.light.intensity = 0.28 + Math.sin(time * 0.0009) * 0.05;
  }

  interact(point: WorldInteraction): boolean {
    if (!this.state.effects.forest || !this.state.effects.interactions) return false;
    if (!contains(REGIONS.forest, point.x, point.y)) return false;
    if (this.state.effects.particles) {
      this.gather.setPosition(point.x, point.y);
      this.gather.explode(34, 0, 0);
    }
    return true;
  }

  getEmitters(): Phaser.GameObjects.Particles.ParticleEmitter[] {
    return [this.fireflies, this.leaves, this.gather];
  }

  getVisibleLightCount(): number {
    return this.light.visible ? 1 : 0;
  }

  destroy(): void {
    this.scene.lights.removeLight(this.light);
    this.mist.forEach((mist) => mist.destroy());
    this.fireflies.destroy();
    this.leaves.destroy();
    this.gather.destroy();
  }
}
