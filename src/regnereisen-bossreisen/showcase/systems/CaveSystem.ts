import Phaser from 'phaser';
import { REGIONS, contains } from '../mapRegions';
import { QUALITY_PROFILES, type ShowcaseState } from '../types';
import {
  isNearCamera,
  setEmitterRunning,
  type ShowcaseSystem,
  type WorldInteraction
} from './ShowcaseSystem';

const CAVE_X = 2380;
const CAVE_Y = 285;

export class CaveSystem implements ShowcaseSystem {
  private readonly glow: Phaser.GameObjects.Image;
  private readonly mist: Phaser.GameObjects.Image;
  private readonly emitter: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly discharge: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly coneLight: Phaser.GameObjects.Light;
  private state: ShowcaseState;
  private nearCamera = true;
  private reaction = 0;
  private nextDischarge = 9000;

  constructor(private readonly scene: Phaser.Scene, initialState: ShowcaseState) {
    this.state = initialState;
    this.glow = scene.add
      .image(CAVE_X, CAVE_Y + 16, 'fx-glow')
      .setDisplaySize(520, 360)
      .setAlpha(0.22)
      .setTint(0x4169ff)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.mist = scene.add
      .image(CAVE_X, CAVE_Y + 130, 'fx-mist')
      .setDisplaySize(500, 210)
      .setAlpha(0.13)
      .setTint(0x6d7ed8)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    this.emitter = scene.add.particles(CAVE_X, CAVE_Y + 60, 'fx-spark', {
      x: { min: -210, max: 210 },
      y: { min: -110, max: 120 },
      speedX: { min: -18, max: 18 },
      speedY: { min: 8, max: 30 },
      lifespan: { min: 1300, max: 2600 },
      scale: { start: 0.38, end: 0 },
      alpha: { start: 0.8, end: 0 },
      tint: [0x4875ff, 0x66c8ff, 0x936eff],
      frequency: 150,
      maxAliveParticles: 28,
      blendMode: Phaser.BlendModes.ADD
    });
    this.discharge = scene.add.particles(CAVE_X, CAVE_Y + 45, 'fx-spark', {
      speed: { min: 80, max: 220 },
      angle: { min: 25, max: 155 },
      lifespan: { min: 280, max: 620 },
      scale: { start: 0.64, end: 0 },
      alpha: { start: 1, end: 0 },
      emitting: false,
      maxParticles: 90,
      blendMode: Phaser.BlendModes.ADD
    });
    this.coneLight = scene.lights
      .addConeLight(CAVE_X, CAVE_Y + 15, 520, 0x406cff, 0.62, Math.PI / 2, Math.PI / 3.2, Math.PI / 1.7)
      .setZNormal(0.3);
    this.nextDischarge = scene.time.now + Phaser.Math.Between(9000, 16000);
    this.applyState(initialState);
  }

  applyState(state: ShowcaseState): void {
    this.state = state;
    const enabled = state.effects.cave;
    const profile = QUALITY_PROFILES[state.quality];
    this.glow.setVisible(enabled);
    this.mist.setVisible(enabled && state.effects.atmosphere);
    this.coneLight.setVisible(enabled && state.effects.lighting && profile.lightCount >= 3);
    this.emitter.setFrequency(Math.round(190 / profile.particleMultiplier));
    this.emitter.maxAliveParticles = Math.round(28 * profile.particleMultiplier);
    setEmitterRunning(this.emitter, enabled && state.effects.particles && this.nearCamera);
  }

  update(time: number, delta: number, camera: Phaser.Cameras.Scene2D.Camera): void {
    if (!this.state.effects.cave) return;
    this.nearCamera = isNearCamera(camera, CAVE_X, CAVE_Y, 520);
    setEmitterRunning(this.emitter, this.nearCamera && this.state.effects.particles);
    this.reaction = Math.max(0, this.reaction - delta * 0.0009);
    const pulse = 0.5 + 0.5 * Math.sin(time * 0.00105);
    const glowScale = 0.98 + pulse * 0.035;
    this.glow
      .setAlpha(0.14 + pulse * 0.16 + this.reaction * 0.24)
      .setDisplaySize(520 * glowScale, 360 * glowScale);
    this.mist.x = CAVE_X + Math.sin(time * 0.00035) * 34;
    this.coneLight.intensity = (0.5 + pulse * 0.12 + this.reaction * 0.34)
      * QUALITY_PROFILES[this.state.quality].shaderIntensity;
    this.coneLight.setConeRotation(Math.PI / 2 + Math.sin(time * 0.00028) * 0.08);
    if (
      time >= this.nextDischarge &&
      this.nearCamera &&
      this.state.effects.particles &&
      QUALITY_PROFILES[this.state.quality].rareEvents
    ) {
      this.discharge.explode(18, 0, 0);
      this.reaction = Math.max(this.reaction, 0.72);
      this.nextDischarge = time + Phaser.Math.Between(12000, 22000);
    }
  }

  interact(point: WorldInteraction): boolean {
    if (!this.state.effects.cave || !this.state.effects.interactions) return false;
    if (!contains(REGIONS.cave, point.x, point.y)) return false;
    this.reaction = 1;
    if (this.state.effects.particles) this.discharge.explode(24, 0, 0);
    return true;
  }

  getEmitters(): Phaser.GameObjects.Particles.ParticleEmitter[] {
    return [this.emitter, this.discharge];
  }

  getVisibleLightCount(): number {
    return this.coneLight.visible ? 1 : 0;
  }

  destroy(): void {
    this.scene.lights.removeLight(this.coneLight);
    this.glow.destroy();
    this.mist.destroy();
    this.emitter.destroy();
    this.discharge.destroy();
  }
}
