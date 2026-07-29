import Phaser from 'phaser';
import { SHOWCASE_ASSETS } from '../assets';
import { createManualWaterMask, type ManualWaterMask } from '../manualWaterMask';
import { MAP_HEIGHT, MAP_WIDTH } from '../mapRegions';
import { QUALITY_PROFILES, type ShowcaseState } from '../types';
import { isNearCamera, type ShowcaseSystem, type WorldInteraction } from './ShowcaseSystem';

const WATER_FRAGMENT_SHADER = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

varying vec2 outTexCoord;
uniform sampler2D uMap;
uniform sampler2D uMask;
uniform float uTime;
uniform float uIntensity;
uniform vec2 uRippleOrigin;
uniform float uRippleAge;
uniform float uRippleStrength;

void main() {
  vec2 uv = outTexCoord;
  float mask = texture2D(uMask, uv).a;
  if (mask < 0.01) discard;

  vec2 broadFlow = vec2(
    sin(uv.y * 42.0 + uTime * 0.52) + sin((uv.x + uv.y) * 25.0 - uTime * 0.36),
    cos(uv.x * 38.0 - uTime * 0.44) + sin((uv.x - uv.y) * 31.0 + uTime * 0.3)
  );
  vec2 fineFlow = vec2(
    sin(uv.y * 118.0 - uTime * 0.78),
    cos(uv.x * 106.0 + uTime * 0.7)
  );
  float motionStrength = 0.55 + uIntensity * 1.1;
  vec2 displacement = (broadFlow * 0.00072 + fineFlow * 0.00021) * motionStrength;
  vec2 movedUv = clamp(uv + displacement * mask, vec2(0.001), vec2(0.999));

  vec3 original = texture2D(uMap, uv).rgb;
  vec3 moved = texture2D(uMap, movedUv).rgb;
  float fineShimmer = pow(0.5 + 0.5 * sin(
    uv.x * 226.0 + uv.y * 149.0 + uTime * 1.08
    + sin(uv.x * 47.0 - uv.y * 61.0 - uTime * 0.42) * 1.7
  ), 15.0);
  float shimmerBreakup = 0.25 + 0.75 * (0.5 + 0.5 * sin(
    uv.x * 173.0 - uv.y * 207.0 - uTime * 0.73
  ));
  float shimmer = fineShimmer * shimmerBreakup * 0.58;

  vec2 rippleDelta = uv - uRippleOrigin;
  rippleDelta.x *= 1.5;
  float rippleDistance = length(rippleDelta);
  float rippleRadius = 0.004 + uRippleAge * 0.082;
  float primaryRing = 1.0 - smoothstep(0.00035, 0.00125, abs(rippleDistance - rippleRadius));
  float secondaryRing = 1.0 - smoothstep(0.0003, 0.00095, abs(rippleDistance - rippleRadius * 0.72));
  float rippleRing = (primaryRing * 0.46 + secondaryRing * 0.14);
  rippleRing *= uRippleStrength * max(0.0, 1.0 - uRippleAge * 0.82);

  vec3 color = mix(original, moved, 0.9);
  vec3 coolerWater = color * vec3(0.88, 1.04, 1.12) + vec3(0.0, 0.022, 0.05);
  color = mix(color, coolerWater, clamp(0.18 + uIntensity * 0.16, 0.0, 0.38));
  color += vec3(0.09, 0.24, 0.32) * shimmer * (0.18 + uIntensity * 0.13);
  color += vec3(0.07, 0.24, 0.32) * rippleRing;
  float alpha = mask * (0.64 + shimmer * 0.08 + rippleRing * 0.08);
  gl_FragColor = vec4(color, clamp(alpha, 0.0, 0.96));
}
`;

type UniformSetter = (name: string, value: unknown) => void;

type WaterPoint = {
  x: number;
  y: number;
};

function makeWaterPoints(mask: ManualWaterMask, count: number): WaterPoint[] {
  const random = new Phaser.Math.RandomDataGenerator(['tallvokter-manual-water-v1']);
  const points: WaterPoint[] = [];
  let attempts = 0;
  while (points.length < count && attempts < count * 500) {
    attempts += 1;
    const x = random.integerInRange(8, mask.width - 9);
    const y = random.integerInRange(8, mask.height - 9);
    const index = y * mask.width + x;
    if (mask.coverage[index] < 250) continue;
    if (mask.coverage[index - 6] < 200 || mask.coverage[index + 6] < 200) continue;
    if (mask.coverage[index - mask.width * 6] < 200 || mask.coverage[index + mask.width * 6] < 200) continue;
    points.push({
      x: ((x + 0.5) / mask.width) * MAP_WIDTH,
      y: ((y + 0.5) / mask.height) * MAP_HEIGHT
    });
  }
  return points;
}

export class WaterSystem implements ShowcaseSystem {
  private readonly manualMask: ManualWaterMask;
  private readonly shader: Phaser.GameObjects.Shader;
  private readonly glints: Phaser.GameObjects.Image[];
  private state: ShowcaseState;
  private rippleOrigin = new Phaser.Math.Vector2(-10, -10);
  private rippleAge = 99;
  private rippleStrength = 0;

  constructor(private readonly scene: Phaser.Scene, initialState: ShowcaseState) {
    this.state = initialState;
    this.manualMask = createManualWaterMask(scene);

    const shaderConfig: Phaser.Types.GameObjects.Shader.ShaderQuadConfig = {
      name: 'TallvokterManualWaterSurfaceV1',
      fragmentSource: WATER_FRAGMENT_SHADER,
      setupUniforms: (setUniform: UniformSetter) => {
        setUniform('uMap', 0);
        setUniform('uMask', 1);
        setUniform('uTime', this.scene.time.now * 0.001);
        setUniform('uIntensity', QUALITY_PROFILES[this.state.quality].shaderIntensity);
        setUniform('uRippleOrigin', [this.rippleOrigin.x, this.rippleOrigin.y]);
        setUniform('uRippleAge', this.rippleAge);
        setUniform('uRippleStrength', this.rippleStrength);
      }
    };

    this.shader = scene.add
      .shader(
        shaderConfig,
        MAP_WIDTH / 2,
        MAP_HEIGHT / 2,
        MAP_WIDTH,
        MAP_HEIGHT,
        [SHOWCASE_ASSETS.map.key, this.manualMask.textureKey]
      )
      .setBlendMode(Phaser.BlendModes.NORMAL);

    this.glints = makeWaterPoints(this.manualMask, 48).map((point, index) =>
      scene.add
        .image(point.x, point.y, 'fx-spark')
        .setDisplaySize(26 + (index % 4) * 8, 7 + (index % 3) * 2)
        .setAlpha(0)
        .setRotation((index * 1.77) % Math.PI)
        .setBlendMode(Phaser.BlendModes.ADD)
    );

    this.applyState(initialState);
  }

  applyState(state: ShowcaseState): void {
    this.state = state;
    const enabled = state.effects.ocean;
    this.shader.setVisible(enabled);
    if (!enabled) {
      this.glints.forEach((glint) => glint.setVisible(false));
      this.rippleStrength = 0;
    }
  }

  update(time: number, delta: number, camera: Phaser.Cameras.Scene2D.Camera): void {
    this.rippleAge += delta * 0.001;
    this.rippleStrength = Math.max(0, 1 - this.rippleAge / 1.35);

    const enabled = this.state.effects.ocean && this.state.effects.particles;
    const quality = QUALITY_PROFILES[this.state.quality];
    const visibleCount = Math.min(
      this.glints.length,
      Math.max(5, Math.round(this.glints.length * quality.particleMultiplier * 0.82))
    );
    this.glints.forEach((glint, index) => {
      const visible = enabled && index < visibleCount && isNearCamera(camera, glint.x, glint.y, 130);
      glint.setVisible(visible);
      if (!visible) return;
      const wave = Math.max(0, Math.sin(time * (0.00062 + (index % 5) * 0.00007) + index * 2.19));
      const baseWidth = 26 + (index % 4) * 8;
      const baseHeight = 7 + (index % 3) * 2;
      glint
        .setAlpha(wave * wave * (0.27 + quality.shaderIntensity * 0.17))
        .setDisplaySize(baseWidth * (0.8 + wave * 0.58), baseHeight * (0.72 + wave * 0.26));
    });

  }

  interact(point: WorldInteraction): boolean {
    if (!this.state.effects.ocean || !this.state.effects.interactions) return false;
    if (!this.isWater(point.x, point.y)) return false;
    // Phaser Shader uses WebGL texture coordinates: y=1 at the top and y=0 at
    // the bottom. World coordinates use the opposite direction, so Y must be
    // inverted before it is compared with outTexCoord in the fragment shader.
    this.rippleOrigin.set(point.x / MAP_WIDTH, 1 - point.y / MAP_HEIGHT);
    this.rippleAge = 0;
    this.rippleStrength = 1;
    return true;
  }

  getEmitters(): Phaser.GameObjects.Particles.ParticleEmitter[] {
    return [];
  }

  getVisibleLightCount(): number {
    return 0;
  }

  destroy(): void {
    this.shader.destroy();
    this.glints.forEach((glint) => glint.destroy());
    if (this.scene.textures.exists(this.manualMask.textureKey)) {
      this.scene.textures.remove(this.manualMask.textureKey);
    }
  }

  private isWater(x: number, y: number): boolean {
    if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return false;
    const maskX = Math.min(this.manualMask.width - 1, Math.floor((x / MAP_WIDTH) * this.manualMask.width));
    const maskY = Math.min(this.manualMask.height - 1, Math.floor((y / MAP_HEIGHT) * this.manualMask.height));
    return this.manualMask.coverage[maskY * this.manualMask.width + maskX] >= 128;
  }

}
