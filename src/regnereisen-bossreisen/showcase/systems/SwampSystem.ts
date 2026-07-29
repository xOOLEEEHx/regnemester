import Phaser from 'phaser';
import { REGIONS, contains } from '../mapRegions';
import { QUALITY_PROFILES, type ShowcaseState } from '../types';
import {
  isNearCamera,
  setEmitterRunning,
  type ShowcaseSystem,
  type WorldInteraction
} from './ShowcaseSystem';

const SWAMP_X = 3290;
const SWAMP_Y = 485;

const FOG_PATCHES = [
  { x: 3030, y: 330, scale: 1.2, tint: 0x78b9ae },
  { x: 3260, y: 280, scale: 1.35, tint: 0x6bb6a5 },
  { x: 3500, y: 350, scale: 1.15, tint: 0x7dbeb5 },
  { x: 3100, y: 520, scale: 1.4, tint: 0x67aa9e },
  { x: 3380, y: 520, scale: 1.5, tint: 0x72b7aa },
  { x: 3590, y: 585, scale: 1.15, tint: 0x79b7a8 }
] as const;

const BUBBLE_VENTS = [
  { x: 3180, y: 245, radius: 42, scale: 0.72, phase: 0.2 },
  { x: 3400, y: 250, radius: 38, scale: 0.62, phase: 1.7 },
  { x: 3590, y: 430, radius: 44, scale: 0.78, phase: 3.1 },
  { x: 3100, y: 520, radius: 46, scale: 0.68, phase: 4.4 },
  { x: 3350, y: 550, radius: 45, scale: 0.82, phase: 2.5 },
  { x: 3550, y: 720, radius: 50, scale: 0.74, phase: 5.3 },
  { x: 3220, y: 780, radius: 40, scale: 0.66, phase: 3.8 }
] as const;

const GAS_VENTS = [
  { x: 3225, y: 735, spread: 26, drift: -3 },
  { x: 3590, y: 430, spread: 28, drift: 7 },
  { x: 3100, y: 520, spread: 24, drift: -8 },
  { x: 3550, y: 720, spread: 26, drift: 6 }
] as const;

export class SwampSystem implements ShowcaseSystem {
  private readonly fog: Phaser.GameObjects.Image[];
  private readonly bubbleGlows: Phaser.GameObjects.Image[];
  private readonly bubbles: Phaser.GameObjects.Particles.ParticleEmitter[];
  private readonly gasPlumes: Phaser.GameObjects.Particles.ParticleEmitter[];
  private readonly bubbleBurst: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly insects: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly light: Phaser.GameObjects.Light;
  private state: ShowcaseState;
  private nearCamera = true;
  private reveal = { x: SWAMP_X, y: SWAMP_Y, strength: 0 };
  private bubbleReaction = 0;
  private nextAutoBubble = 0;

  constructor(private readonly scene: Phaser.Scene, initialState: ShowcaseState) {
    this.state = initialState;
    this.fog = FOG_PATCHES.map((patch) =>
      scene.add
        .image(patch.x, patch.y, 'fx-mist')
        .setScale(patch.scale)
        .setTint(patch.tint)
        .setAlpha(0.16)
        .setBlendMode(Phaser.BlendModes.SCREEN)
    );
    this.bubbleGlows = BUBBLE_VENTS.map((vent) =>
      scene.add
        .image(vent.x, vent.y + 3, 'fx-glow')
        .setDisplaySize(vent.radius * 2.25, vent.radius * 0.88)
        .setTint(0x57d7aa)
        .setAlpha(0.075)
        .setBlendMode(Phaser.BlendModes.SCREEN)
    );
    this.bubbles = BUBBLE_VENTS.map((vent, index) =>
      scene.add.particles(vent.x, vent.y, 'fx-bubble', {
        x: { min: -vent.radius, max: vent.radius },
        y: { min: -vent.radius * 0.28, max: vent.radius * 0.28 },
        speedX: { min: -6, max: 6 },
        speedY: { min: -24, max: -8 },
        lifespan: { min: 800, max: 1450 },
        scale: { start: 0.16 * vent.scale, end: 0.7 * vent.scale },
        alpha: { start: 0.84, end: 0 },
        tint: index % 2 === 0 ? [0x9fffd0, 0x66e7cf] : [0x83f1c1, 0x72ddea],
        frequency: 360 + index * 34,
        maxAliveParticles: 5,
        blendMode: Phaser.BlendModes.SCREEN
      })
    );
    this.gasPlumes = GAS_VENTS.map((vent, index) =>
      scene.add.particles(vent.x, vent.y, 'fx-smoke', {
        x: { min: -vent.spread, max: vent.spread },
        y: { min: -8, max: 5 },
        speedX: { min: vent.drift - 7, max: vent.drift + 7 },
        speedY: { min: -46, max: -28 },
        lifespan: { min: 2800, max: 4400 },
        scale: { start: 0.38, end: 0.95 },
        alpha: { start: 0.96, end: 0 },
        rotate: { min: -14, max: 14 },
        tint: index % 2 === 0 ? [0x4fbd68, 0x3c9454] : [0x65cc79, 0x47a85f],
        frequency: 260 + index * 55,
        maxAliveParticles: 12,
        blendMode: Phaser.BlendModes.SCREEN
      })
    );
    this.bubbleBurst = scene.add.particles(0, 0, 'fx-bubble', {
      speed: { min: 18, max: 64 },
      angle: { min: 0, max: 360 },
      lifespan: { min: 560, max: 1050 },
      scale: { start: 0.12, end: 0.72 },
      alpha: { start: 0.78, end: 0 },
      tint: [0xa6ffd2, 0x70e8d3, 0x80dfff],
      emitting: false,
      maxAliveParticles: 60,
      blendMode: Phaser.BlendModes.SCREEN
    });
    this.insects = scene.add.particles(SWAMP_X, SWAMP_Y, 'fx-spark', {
      x: { min: -360, max: 360 },
      y: { min: -260, max: 260 },
      speedX: { min: -8, max: 8 },
      speedY: { min: -6, max: 6 },
      lifespan: { min: 1500, max: 3200 },
      scale: { start: 0.23, end: 0 },
      alpha: { start: 0.7, end: 0 },
      tint: [0x67ffaf, 0x58d9d5, 0x9eff6c],
      frequency: 240,
      maxAliveParticles: 24,
      blendMode: Phaser.BlendModes.ADD
    });
    this.light = scene.lights.addLight(SWAMP_X, SWAMP_Y, 430, 0x4ccaa5, 0.32).setZNormal(0.16);
    this.nextAutoBubble = scene.time.now + Phaser.Math.Between(700, 1400);
    this.applyState(initialState);
  }

  applyState(state: ShowcaseState): void {
    this.state = state;
    const enabled = state.effects.swamp;
    const profile = QUALITY_PROFILES[state.quality];
    const visibleFogCount = Math.min(this.fog.length, profile.fogLayers + 2);
    const visibleBubbleCount = Math.min(
      this.bubbles.length,
      state.quality === 'low' ? 3 : state.quality === 'standard' ? 5 : this.bubbles.length
    );
    this.fog.forEach((fog, index) => fog.setVisible(enabled && state.effects.atmosphere && index < visibleFogCount));
    this.bubbleGlows.forEach((glow, index) => glow.setVisible(enabled && index < visibleBubbleCount));
    this.bubbles.forEach((emitter, index) => {
      emitter.setFrequency(Math.round((235 + index * 24) / profile.particleMultiplier));
      emitter.maxAliveParticles = Math.max(2, Math.round(5 * profile.particleMultiplier));
      setEmitterRunning(
        emitter,
        enabled && state.effects.particles && this.nearCamera && index < visibleBubbleCount
      );
    });
    const visibleGasCount = state.quality === 'low' ? 2 : state.quality === 'standard' ? 3 : this.gasPlumes.length;
    this.gasPlumes.forEach((emitter, index) => {
      emitter.setFrequency(Math.round((295 + index * 50) / profile.particleMultiplier));
      emitter.maxAliveParticles = Math.max(6, Math.round(12 * profile.particleMultiplier));
      setEmitterRunning(
        emitter,
        enabled && state.effects.particles && state.effects.atmosphere && this.nearCamera && index < visibleGasCount
      );
    });
    this.bubbleBurst.setActive(enabled && state.effects.particles).setVisible(enabled && state.effects.particles);
    if (!enabled || !state.effects.particles) this.bubbleBurst.killAll();
    this.light.setVisible(enabled && state.effects.lighting && profile.lightCount >= 6);
    this.insects.setFrequency(Math.round(310 / profile.particleMultiplier));
    this.insects.maxAliveParticles = Math.round(24 * profile.particleMultiplier);
    setEmitterRunning(this.insects, enabled && state.effects.particles && this.nearCamera);
  }

  update(time: number, delta: number, camera: Phaser.Cameras.Scene2D.Camera): void {
    if (!this.state.effects.swamp) return;
    this.nearCamera = isNearCamera(camera, SWAMP_X, SWAMP_Y, 610);
    const visibleBubbleCount = Math.min(
      this.bubbles.length,
      this.state.quality === 'low' ? 3 : this.state.quality === 'standard' ? 5 : this.bubbles.length
    );
    this.bubbles.forEach((emitter, index) => {
      setEmitterRunning(
        emitter,
        this.nearCamera && this.state.effects.particles && index < visibleBubbleCount
      );
    });
    const visibleGasCount = this.state.quality === 'low' ? 2 : this.state.quality === 'standard' ? 3 : this.gasPlumes.length;
    this.gasPlumes.forEach((emitter, index) => {
      setEmitterRunning(
        emitter,
        this.nearCamera && this.state.effects.particles && this.state.effects.atmosphere && index < visibleGasCount
      );
    });
    setEmitterRunning(this.insects, this.nearCamera && this.state.effects.particles);
    this.reveal.strength = Math.max(0, this.reveal.strength - delta * 0.00042);
    this.bubbleReaction = Math.max(0, this.bubbleReaction - delta * 0.00115);
    this.fog.forEach((fog, index) => {
      const base = FOG_PATCHES[index];
      const driftX = Math.sin(time * (0.00016 + index * 0.000009) + index * 1.3) * (28 + index * 3);
      const driftY = Math.cos(time * 0.00013 + index * 2.05) * 12;
      const dx = base.x + driftX - this.reveal.x;
      const dy = base.y + driftY - this.reveal.y;
      const distance = Math.max(1, Math.hypot(dx, dy));
      const repel = Math.max(0, 1 - distance / 330) * this.reveal.strength * 135;
      fog.setPosition(base.x + driftX + (dx / distance) * repel, base.y + driftY + (dy / distance) * repel);
      fog.setAlpha(0.11 + (0.5 + 0.5 * Math.sin(time * 0.00038 + index)) * 0.08);
    });
    this.bubbleGlows.forEach((glow, index) => {
      const vent = BUBBLE_VENTS[index];
      const pulse = 0.5 + 0.5 * Math.sin(time * (0.00135 + index * 0.00008) + vent.phase);
      glow.setPosition(
        vent.x + Math.sin(time * 0.00082 + vent.phase) * 3.5,
        vent.y + 3 + Math.cos(time * 0.00105 + vent.phase) * 2
      );
      glow.setAlpha(0.045 + pulse * 0.085 + this.bubbleReaction * 0.1);
      glow.setDisplaySize(
        vent.radius * 2.25 * (0.94 + pulse * 0.12),
        vent.radius * 0.88 * (0.92 + pulse * 0.15)
      );
    });
    if (
      time >= this.nextAutoBubble &&
      this.nearCamera &&
      this.state.effects.particles
    ) {
      const vent = BUBBLE_VENTS[Phaser.Math.Between(0, BUBBLE_VENTS.length - 1)];
      this.bubbleBurst.setPosition(vent.x, vent.y);
      this.bubbleBurst.explode(Phaser.Math.Between(4, 7), 0, 0);
      this.bubbleReaction = Math.max(this.bubbleReaction, 0.34);
      this.nextAutoBubble = time + Phaser.Math.Between(1100, 2300);
    }
    this.light.intensity = 0.26 + Math.sin(time * 0.00074) * 0.045;
  }

  interact(point: WorldInteraction): boolean {
    if (!this.state.effects.swamp || !this.state.effects.interactions) return false;
    if (!contains(REGIONS.swamp, point.x, point.y)) return false;
    this.reveal = { x: point.x, y: point.y, strength: 1 };
    this.bubbleReaction = 1;
    if (this.state.effects.particles) {
      this.bubbleBurst.setPosition(point.x, point.y);
      this.bubbleBurst.explode(14, 0, 0);
    }
    return true;
  }

  getEmitters(): Phaser.GameObjects.Particles.ParticleEmitter[] {
    return [...this.bubbles, ...this.gasPlumes, this.bubbleBurst, this.insects];
  }

  getVisibleLightCount(): number {
    return this.light.visible ? 1 : 0;
  }

  destroy(): void {
    this.scene.lights.removeLight(this.light);
    this.fog.forEach((fog) => fog.destroy());
    this.bubbleGlows.forEach((glow) => glow.destroy());
    this.bubbles.forEach((emitter) => emitter.destroy());
    this.gasPlumes.forEach((emitter) => emitter.destroy());
    this.bubbleBurst.destroy();
    this.insects.destroy();
  }
}
