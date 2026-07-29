import Phaser from 'phaser';
import { REGIONS, contains } from '../mapRegions';
import { QUALITY_PROFILES, type ShowcaseState } from '../types';
import {
  isNearCamera,
  setEmitterRunning,
  type ShowcaseSystem,
  type WorldInteraction
} from './ShowcaseSystem';

const CRYSTALS = [
  { x: 720, y: 1170, scale: 0.46 },
  { x: 825, y: 1080, scale: 0.58 },
  { x: 920, y: 1015, scale: 0.52 },
  { x: 1035, y: 1055, scale: 0.62 },
  { x: 1150, y: 1040, scale: 0.55 },
  { x: 1240, y: 1150, scale: 0.57 },
  { x: 1220, y: 1300, scale: 0.52 },
  { x: 1090, y: 1380, scale: 0.64 },
  { x: 930, y: 1360, scale: 0.48 },
  { x: 790, y: 1305, scale: 0.44 }
] as const;

export class CrystalSystem implements ShowcaseSystem {
  private readonly glows: Phaser.GameObjects.Image[];
  private readonly phases: number[];
  private readonly emitter: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly burst: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly reactionRing: Phaser.GameObjects.Image;
  private readonly light: Phaser.GameObjects.Light;
  private state: ShowcaseState;
  private nearCamera = true;

  constructor(private readonly scene: Phaser.Scene, initialState: ShowcaseState) {
    this.state = initialState;
    this.phases = CRYSTALS.map((_, index) => index * 1.87 + Math.random() * 1.2);
    this.glows = CRYSTALS.map((crystal) =>
      scene.add
        .image(crystal.x, crystal.y, 'fx-glow')
        .setScale(crystal.scale)
        .setAlpha(0.12)
        .setBlendMode(Phaser.BlendModes.ADD)
    );
    this.glows[3].enableFilters();
    this.glows[3].filters?.internal.addGlow(0x79a7ff, 2.4, 0.25, 1, false, 5, 10);

    this.emitter = scene.add.particles(980, 1200, 'fx-spark', {
      x: { min: -350, max: 350 },
      y: { min: -245, max: 245 },
      speedY: { min: -24, max: -8 },
      speedX: { min: -10, max: 10 },
      lifespan: { min: 1000, max: 2200 },
      scale: { start: 0.32, end: 0 },
      alpha: { start: 0.7, end: 0 },
      frequency: 170,
      maxAliveParticles: 30,
      blendMode: Phaser.BlendModes.ADD
    });

    this.burst = scene.add.particles(0, 0, 'fx-spark', {
      speed: { min: 45, max: 150 },
      angle: { min: 0, max: 360 },
      lifespan: { min: 350, max: 760 },
      scale: { start: 0.52, end: 0 },
      alpha: { start: 1, end: 0 },
      emitting: false,
      maxParticles: 90,
      blendMode: Phaser.BlendModes.ADD
    });

    this.reactionRing = scene.add
      .image(980, 1200, 'fx-ring')
      .setScale(0.08)
      .setAlpha(0)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.light = scene.lights.addLight(990, 1190, 500, 0x795dff, 0.5).setZNormal(0.22);
    this.applyState(initialState);
  }

  applyState(state: ShowcaseState): void {
    this.state = state;
    const enabled = state.effects.crystals;
    const quality = QUALITY_PROFILES[state.quality];
    this.glows.forEach((glow, index) => {
      glow.setVisible(enabled);
      if (index === 3) glow.renderFilters = enabled && state.effects.filters;
    });
    this.reactionRing.setVisible(enabled);
    this.light.setVisible(enabled && state.effects.lighting && quality.lightCount >= 4);
    this.emitter.setFrequency(Math.round(210 / quality.particleMultiplier));
    this.emitter.maxAliveParticles = Math.round(30 * quality.particleMultiplier);
    setEmitterRunning(this.emitter, enabled && state.effects.particles && this.nearCamera);
  }

  update(time: number, _delta: number, camera: Phaser.Cameras.Scene2D.Camera): void {
    if (!this.state.effects.crystals) return;
    this.nearCamera = isNearCamera(camera, 980, 1200, 570);
    setEmitterRunning(this.emitter, this.nearCamera && this.state.effects.particles);
    this.glows.forEach((glow, index) => {
      const asynchronousPulse = Math.max(0, Math.sin(time * (0.00072 + (index % 3) * 0.00008) + this.phases[index]));
      const rareGlint = Math.pow(Math.max(0, Math.sin(time * 0.00031 + this.phases[index] * 2.7)), 18);
      glow.setAlpha(0.09 + asynchronousPulse * 0.13 + rareGlint * 0.56);
      glow.setScale(CRYSTALS[index].scale * (1 + asynchronousPulse * 0.035 + rareGlint * 0.08));
    });
    this.light.intensity = (0.42 + Math.sin(time * 0.0011) * 0.07)
      * QUALITY_PROFILES[this.state.quality].shaderIntensity;
  }

  interact(point: WorldInteraction): boolean {
    if (!this.state.effects.crystals || !this.state.effects.interactions) return false;
    if (!contains(REGIONS.crystals, point.x, point.y)) return false;
    this.reactionRing.setPosition(point.x, point.y).setScale(0.08).setAlpha(0.9);
    this.scene.tweens.killTweensOf(this.reactionRing);
    this.scene.tweens.add({
      targets: this.reactionRing,
      scaleX: 1.25,
      scaleY: 1.25,
      alpha: 0,
      duration: 700,
      ease: 'Sine.easeOut'
    });
    if (this.state.effects.particles) {
      this.burst.setPosition(point.x, point.y);
      this.burst.explode(18, 0, 0);
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
    this.glows.forEach((glow) => glow.destroy());
    this.emitter.destroy();
    this.burst.destroy();
    this.reactionRing.destroy();
  }
}
