import Phaser from 'phaser';
import { REGIONS, contains } from '../mapRegions';
import { QUALITY_PROFILES, type ShowcaseState } from '../types';
import {
  isNearCamera,
  setEmitterRunning,
  type ShowcaseSystem,
  type WorldInteraction
} from './ShowcaseSystem';

const FOUNTAIN_X = 2725;
const FOUNTAIN_Y = 1830;

export class FountainSystem implements ShowcaseSystem {
  private readonly beam: Phaser.GameObjects.Image;
  private readonly glow: Phaser.GameObjects.Image;
  private readonly emitter: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly burst: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly light: Phaser.GameObjects.Light;
  private state: ShowcaseState;
  private nearCamera = true;
  private activation = 0;

  constructor(private readonly scene: Phaser.Scene, initialState: ShowcaseState) {
    this.state = initialState;
    this.beam = scene.add
      .image(FOUNTAIN_X, FOUNTAIN_Y - 180, 'fx-beam')
      .setDisplaySize(116, 390)
      .setAlpha(0.36)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.glow = scene.add
      .image(FOUNTAIN_X, FOUNTAIN_Y - 10, 'fx-glow')
      .setDisplaySize(360, 280)
      .setAlpha(0.2)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.emitter = scene.add.particles(FOUNTAIN_X, FOUNTAIN_Y - 15, 'fx-spark', {
      x: { min: -54, max: 54 },
      y: { min: -35, max: 22 },
      speedX: { min: -7, max: 7 },
      speedY: { min: -78, max: -28 },
      lifespan: { min: 950, max: 1900 },
      scale: { start: 0.36, end: 0 },
      alpha: { start: 0.82, end: 0 },
      frequency: 105,
      maxAliveParticles: 34,
      blendMode: Phaser.BlendModes.ADD
    });

    this.burst = scene.add.particles(0, 0, 'fx-spark', {
      speed: { min: 70, max: 190 },
      angle: { min: 205, max: 335 },
      gravityY: 42,
      lifespan: { min: 520, max: 1050 },
      scale: { start: 0.65, end: 0 },
      alpha: { start: 1, end: 0 },
      emitting: false,
      maxParticles: 100,
      blendMode: Phaser.BlendModes.ADD
    });

    this.light = scene.lights.addLight(FOUNTAIN_X, FOUNTAIN_Y - 40, 380, 0x52ddff, 0.62).setZNormal(0.28);
    this.applyState(initialState);
  }

  applyState(state: ShowcaseState): void {
    this.state = state;
    const enabled = state.effects.fountain;
    const quality = QUALITY_PROFILES[state.quality];
    this.beam.setVisible(enabled);
    this.glow.setVisible(enabled);
    this.light.setVisible(enabled && state.effects.lighting && quality.lightCount >= 2);
    this.emitter.setFrequency(Math.round(145 / quality.particleMultiplier));
    this.emitter.maxAliveParticles = Math.round(34 * quality.particleMultiplier);
    setEmitterRunning(this.emitter, enabled && state.effects.particles && this.nearCamera);
  }

  update(time: number, delta: number, camera: Phaser.Cameras.Scene2D.Camera): void {
    if (!this.state.effects.fountain) return;
    this.nearCamera = isNearCamera(camera, FOUNTAIN_X, FOUNTAIN_Y, 430);
    setEmitterRunning(this.emitter, this.nearCamera && this.state.effects.particles);
    this.activation = Math.max(0, this.activation - delta * 0.001);
    const pulse = 0.5 + 0.5 * Math.sin(time * 0.0021);
    this.beam.setAlpha(0.24 + pulse * 0.16 + this.activation * 0.28);
    this.beam.setDisplaySize(
      116 * (1 + Math.sin(time * 0.0014) * 0.025),
      390 * (1 + this.activation * 0.12)
    );
    this.glow.setAlpha(0.14 + pulse * 0.11 + this.activation * 0.18);
    this.light.intensity = (0.5 + pulse * 0.14 + this.activation * 0.35)
      * QUALITY_PROFILES[this.state.quality].shaderIntensity;
  }

  interact(point: WorldInteraction): boolean {
    if (!this.state.effects.fountain || !this.state.effects.interactions) return false;
    if (!contains(REGIONS.fountain, point.x, point.y)) return false;
    this.activation = 1;
    if (this.state.effects.particles) {
      this.burst.setPosition(FOUNTAIN_X, FOUNTAIN_Y - 25);
      this.burst.explode(28, 0, 0);
    }
    return true;
  }

  getEmitters(): Phaser.GameObjects.Particles.ParticleEmitter[] {
    return [this.emitter, this.burst];
  }

  getVisibleLightCount(): number {
    return this.light.visible ? 1 : 0;
  }

  destroy(): void {
    this.scene.lights.removeLight(this.light);
    this.beam.destroy();
    this.glow.destroy();
    this.emitter.destroy();
    this.burst.destroy();
  }
}
