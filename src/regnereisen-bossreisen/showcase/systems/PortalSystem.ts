import Phaser from 'phaser';
import { REGIONS, contains } from '../mapRegions';
import { QUALITY_PROFILES, type ShowcaseState } from '../types';
import {
  isNearCamera,
  setEmitterRunning,
  type ShowcaseSystem,
  type WorldInteraction
} from './ShowcaseSystem';

const PORTAL_X = 365;
const PORTAL_Y = 2075;
const PORTAL_SURFACE_Y = PORTAL_Y - 12;
const PORTAL_SURFACE_WIDTH = 174;
const PORTAL_SURFACE_HEIGHT = 300;

const PORTAL_FRAGMENT_SHADER = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

varying vec2 outTexCoord;
uniform float uTime;
uniform float uIntensity;
uniform float uActivation;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}

void main() {
  vec2 uv = outTexCoord - 0.5;
  uv.x *= 1.7;
  float radius = length(uv);
  if (radius > 0.52) discard;

  float angle = atan(uv.y, uv.x);
  float spiral = sin(angle * 5.0 - uTime * 1.35 + radius * 20.0);
  float wisps = noise(uv * 7.0 + vec2(uTime * 0.18, -uTime * 0.12));
  float core = smoothstep(0.54, 0.02, radius);
  float rim = smoothstep(0.52, 0.39, radius) - smoothstep(0.4, 0.28, radius);
  float pulse = 0.86 + sin(uTime * 1.7) * 0.08 + uActivation * 0.26;

  vec3 deepBlue = vec3(0.05, 0.16, 0.72);
  vec3 cyan = vec3(0.22, 0.82, 1.0);
  vec3 violet = vec3(0.52, 0.24, 1.0);
  vec3 color = mix(deepBlue, cyan, core * 0.7 + wisps * 0.25);
  color = mix(color, violet, spiral * 0.16 + 0.15);
  color += rim * vec3(0.45, 0.78, 1.2);
  color *= pulse * uIntensity;

  float alpha = smoothstep(0.53, 0.47, radius) * (0.7 + core * 0.24);
  gl_FragColor = vec4(color, alpha);
}
`;

type UniformSetter = (name: string, value: unknown) => void;

function createMeshGeometry(columns: number, rows: number, width: number, height: number) {
  const vertices: number[] = [];
  const indices: number[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const u = column / (columns - 1);
      const v = row / (rows - 1);
      vertices.push(u * width, v * height, u, v);
    }
  }
  for (let row = 0; row < rows - 1; row += 1) {
    for (let column = 0; column < columns - 1; column += 1) {
      const topLeft = row * columns + column;
      const topRight = topLeft + 1;
      const bottomLeft = topLeft + columns;
      const bottomRight = bottomLeft + 1;
      indices.push(topLeft, bottomLeft, topRight, 0);
      indices.push(topRight, bottomLeft, bottomRight, 0);
    }
  }
  return { vertices, indices };
}

export class PortalSystem implements ShowcaseSystem {
  private readonly shader: Phaser.GameObjects.Shader;
  private readonly stencil: Phaser.GameObjects.Stencil;
  private readonly stencilClear: Phaser.GameObjects.StencilReference;
  private readonly rings: Phaser.GameObjects.Image[];
  private readonly glow: Phaser.GameObjects.Image;
  private readonly emitter: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly fragments: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly light: Phaser.GameObjects.Light;
  private readonly mesh: Phaser.GameObjects.Mesh2D;
  private readonly meshBaseVertices: number[];
  private readonly vignette: Phaser.Filters.Vignette;
  private state: ShowcaseState;
  private activation = 0;
  private hover = 0;
  private lastNearCamera = true;

  constructor(private readonly scene: Phaser.Scene, initialState: ShowcaseState) {
    this.state = initialState;

    const maskShape = scene.add.ellipse(PORTAL_X, PORTAL_SURFACE_Y, 160, 286, 0xffffff, 1);
    this.stencil = scene.add.stencil(0, 0, maskShape, {
      stencilAlphaStrategy: 0.01,
      stencilInvert: true,
      stencilLayerMode: 'addLayer',
      stencilValueWrap: false
    });

    const shaderConfig: Phaser.Types.GameObjects.Shader.ShaderQuadConfig = {
      name: 'TallvokterPortalSurfaceV1',
      fragmentSource: PORTAL_FRAGMENT_SHADER,
      setupUniforms: (setUniform: UniformSetter) => {
        setUniform('uTime', this.scene.time.now * 0.001);
        setUniform('uIntensity', QUALITY_PROFILES[this.state.quality].shaderIntensity * (1 + this.hover * 0.24));
        setUniform('uActivation', this.activation);
      }
    };
    this.shader = scene.add
      .shader(shaderConfig, PORTAL_X, PORTAL_SURFACE_Y, PORTAL_SURFACE_WIDTH, PORTAL_SURFACE_HEIGHT)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.stencilClear = scene.add.stencilreference(this.stencil, {
      stencilAlphaStrategy: 0.01,
      stencilClearValue: 0,
      stencilLayerMode: 'clear'
    });

    this.glow = scene.add
      .image(PORTAL_X, PORTAL_SURFACE_Y + 2, 'fx-glow')
      .setDisplaySize(340, 430)
      .setAlpha(0.24)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.rings = [0, 1, 2].map((index) =>
      scene.add
        .image(PORTAL_X, PORTAL_SURFACE_Y + 4, 'fx-ring')
        .setDisplaySize(176 + index * 36, 286 + index * 50)
        .setAlpha(0.52 - index * 0.12)
        .setBlendMode(Phaser.BlendModes.ADD)
    );

    this.rings[0].enableFilters();
    this.rings[0].filters?.internal.addGlow(0x62b8ff, 3.2, 0.7, 1, false, 6, 14);

    this.emitter = scene.add.particles(PORTAL_X, PORTAL_SURFACE_Y, 'fx-spark', {
      x: { min: -96, max: 96 },
      y: { min: -148, max: 148 },
      speed: { min: 10, max: 42 },
      angle: { min: 0, max: 360 },
      lifespan: { min: 850, max: 1700 },
      scale: { start: 0.42, end: 0 },
      alpha: { start: 0.8, end: 0 },
      frequency: 95,
      maxAliveParticles: 38,
      blendMode: Phaser.BlendModes.ADD
    });

    this.fragments = scene.add.particles(PORTAL_X, PORTAL_SURFACE_Y + 2, 'fx-spark', {
      speed: { min: 70, max: 180 },
      angle: { min: 0, max: 360 },
      lifespan: { min: 420, max: 820 },
      scale: { start: 0.68, end: 0 },
      alpha: { start: 1, end: 0 },
      emitting: false,
      maxParticles: 80,
      blendMode: Phaser.BlendModes.ADD
    });

    this.light = scene.lights
      .addLight(PORTAL_X, PORTAL_SURFACE_Y - 6, 360, 0x557dff, 0.68)
      .setZNormal(0.24);

    const meshWidth = 176;
    const meshHeight = 286;
    const meshGeometry = createMeshGeometry(7, 5, meshWidth, meshHeight);
    this.meshBaseVertices = [...meshGeometry.vertices];
    this.mesh = scene.add
      .mesh2d(PORTAL_X - meshWidth / 2, PORTAL_SURFACE_Y - meshHeight / 2, 'fx-banner', meshGeometry.vertices, meshGeometry.indices)
      .setAlpha(0.24)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setRenderAsTriangles(false)
      .buildOrderedIndices(2, true);
    this.mesh.setSize(meshWidth, meshHeight).setOrigin(0, 0);

    this.vignette = scene.cameras.main.filters.internal.addVignette(0.5, 0.5, 0.72, 0, 0x071129);
    this.vignette.active = false;

    this.applyState(initialState);
  }

  applyState(state: ShowcaseState): void {
    this.state = state;
    const enabled = state.effects.portal;
    const particles = enabled && state.effects.particles;
    const quality = QUALITY_PROFILES[state.quality];
    this.shader.setVisible(enabled);
    this.stencil.setVisible(enabled);
    this.stencilClear.setVisible(enabled);
    this.glow.setVisible(enabled);
    this.rings.forEach((ring) => {
      ring.setVisible(enabled);
      ring.renderFilters = enabled && state.effects.filters;
    });
    this.mesh.setVisible(enabled && state.effects.mesh);
    this.light.setVisible(enabled && state.effects.lighting && quality.lightCount >= 1);
    this.emitter.setFrequency(Math.round(130 / quality.particleMultiplier));
    this.emitter.maxAliveParticles = Math.round(38 * quality.particleMultiplier);
    setEmitterRunning(this.emitter, particles && this.lastNearCamera);
    if (!enabled) this.vignette.active = false;
  }

  update(time: number, delta: number, camera: Phaser.Cameras.Scene2D.Camera): void {
    const enabled = this.state.effects.portal;
    if (!enabled) return;
    const nearCamera = isNearCamera(camera, PORTAL_X, PORTAL_Y, 520);
    this.lastNearCamera = nearCamera;
    setEmitterRunning(this.emitter, nearCamera && this.state.effects.particles);

    const pointer = this.scene.input.activePointer;
    const world = camera.getWorldPoint(pointer.x, pointer.y);
    const nearPointer = this.state.effects.interactions && Phaser.Math.Distance.Between(world.x, world.y, PORTAL_X, PORTAL_Y) < 330;
    const hoverTarget = nearPointer ? 1 : 0;
    this.hover = Phaser.Math.Linear(this.hover, hoverTarget, Math.min(1, delta * 0.004));
    this.activation = Math.max(0, this.activation - delta * 0.00075);

    const pulse = 1 + Math.sin(time * 0.0018) * 0.035 + this.hover * 0.06 + this.activation * 0.12;
    this.glow
      .setDisplaySize(340 * pulse, 430 * pulse)
      .setAlpha(0.24 + this.hover * 0.12 + this.activation * 0.16);
    this.rings.forEach((ring, index) => {
      const wave = Math.sin(time * (0.0012 + index * 0.00018) + index * 2.1);
      const ringScale = 1 + wave * 0.025 + this.activation * 0.08;
      ring.setRotation(time * 0.00008 * (index % 2 === 0 ? 1 : -1));
      ring.setAlpha(0.34 - index * 0.07 + wave * 0.07 + this.hover * 0.1);
      ring.setDisplaySize((176 + index * 36) * ringScale, (286 + index * 50) * ringScale);
    });

    this.light.intensity = (0.62 + Math.sin(time * 0.002) * 0.08 + this.hover * 0.24 + this.activation * 0.42)
      * QUALITY_PROFILES[this.state.quality].shaderIntensity;

    const columns = 7;
    for (let i = 0; i < this.mesh.vertices.length; i += 4) {
      const vertex = i / 4;
      const column = vertex % columns;
      const row = Math.floor(vertex / columns);
      this.mesh.vertices[i] = this.meshBaseVertices[i] + Math.sin(time * 0.0017 + row * 0.55) * (4 + row * 0.8);
      this.mesh.vertices[i + 1] = this.meshBaseVertices[i + 1]
        + Math.sin(time * 0.0021 + column * 0.72 + row * 0.36) * (6 + this.hover * 5);
    }
  }

  interact(point: WorldInteraction): boolean {
    if (!this.state.effects.portal || !this.state.effects.interactions) return false;
    if (!contains(REGIONS.portal, point.x, point.y)) return false;
    this.activate();
    return true;
  }

  activate(): void {
    this.activation = 1;
    if (this.state.effects.particles) this.fragments.explode(34, 0, 0);
    if (this.state.effects.camera) this.scene.cameras.main.shake(340, 0.0032, true);
    if (this.state.effects.filters) {
      this.vignette.active = true;
      this.vignette.strength = 0;
      this.scene.tweens.killTweensOf(this.vignette);
      this.scene.tweens.add({
        targets: this.vignette,
        strength: 0.46,
        duration: 260,
        yoyo: true,
        hold: 120,
        ease: 'Sine.easeOut',
        onComplete: () => {
          this.vignette.active = false;
          this.vignette.strength = 0;
        }
      });
    }
  }

  runFilterDemo(): void {
    if (!this.state.effects.filters) return;
    this.vignette.active = true;
    this.scene.tweens.killTweensOf(this.vignette);
    this.scene.tweens.add({
      targets: this.vignette,
      strength: 0.34,
      duration: 550,
      yoyo: true,
      hold: 260,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.vignette.active = false;
        this.vignette.strength = 0;
      }
    });
  }

  getEmitters(): Phaser.GameObjects.Particles.ParticleEmitter[] {
    return [this.emitter, this.fragments];
  }

  getVisibleLightCount(): number {
    return this.light.visible ? 1 : 0;
  }

  destroy(): void {
    this.scene.lights.removeLight(this.light);
    this.stencil.destroy(true);
    this.stencilClear.destroy();
    this.shader.destroy();
    this.glow.destroy();
    this.rings.forEach((ring) => ring.destroy());
    this.emitter.destroy();
    this.fragments.destroy();
    this.mesh.destroy();
    this.vignette.destroy();
  }
}
