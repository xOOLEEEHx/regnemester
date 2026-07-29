import Phaser from 'phaser';
import type { TallvokterFxLevel } from '../../game/content/tallvokterFx';
import { SHOWCASE_ASSETS } from '../../showcase/assets';
import { createShowcaseTextures } from '../../showcase/fxTextures';
import { CaveSystem } from '../../showcase/systems/CaveSystem';
import { CrystalSystem } from '../../showcase/systems/CrystalSystem';
import { ForestSystem } from '../../showcase/systems/ForestSystem';
import { FountainSystem } from '../../showcase/systems/FountainSystem';
import { PortalSystem } from '../../showcase/systems/PortalSystem';
import type { ShowcaseSystem } from '../../showcase/systems/ShowcaseSystem';
import { SwampSystem } from '../../showcase/systems/SwampSystem';
import { WaterfallSystem } from '../../showcase/systems/WaterfallSystem';
import { WaterSystem } from '../../showcase/systems/WaterSystem';
import { WorldDetailsSystem } from '../../showcase/systems/WorldDetailsSystem';
import { EFFECT_KEYS, type ShowcaseState } from '../../showcase/types';

const enabledEffects = Object.fromEntries(
  EFFECT_KEYS.map((key) => [key, true])
) as ShowcaseState['effects'];

const disabledEffects = Object.fromEntries(
  EFFECT_KEYS.map((key) => [key, false])
) as ShowcaseState['effects'];

const DISABLED_STATE: ShowcaseState = {
  quality: 'standard',
  effects: disabledEffects
};

export function queueTallvokterEffectAssets(scene: Phaser.Scene): void {
  if (!scene.textures.exists(SHOWCASE_ASSETS.waterMask.sourceKey)) {
    scene.load.image(SHOWCASE_ASSETS.waterMask.sourceKey, SHOWCASE_ASSETS.waterMask.sourcePath);
  }
  if (!scene.textures.exists(SHOWCASE_ASSETS.waterfallMask.sourceKey)) {
    scene.load.image(SHOWCASE_ASSETS.waterfallMask.sourceKey, SHOWCASE_ASSETS.waterfallMask.sourcePath);
  }
}

export function hasTallvokterEffectAssets(scene: Phaser.Scene): boolean {
  return scene.textures.exists(SHOWCASE_ASSETS.waterMask.sourceKey)
    && scene.textures.exists(SHOWCASE_ASSETS.waterfallMask.sourceKey);
}

export class TallvokterEffects {
  private readonly systems: ShowcaseSystem[];
  private active = false;
  private level: TallvokterFxLevel = 'standard';

  constructor(private readonly scene: Phaser.Scene) {
    createShowcaseTextures(scene);
    scene.lights.enable().setAmbientColor(0xe2ebff);
    this.systems = [
      new WaterSystem(scene, DISABLED_STATE),
      new PortalSystem(scene, DISABLED_STATE),
      new CrystalSystem(scene, DISABLED_STATE),
      new ForestSystem(scene, DISABLED_STATE),
      new CaveSystem(scene, DISABLED_STATE),
      new SwampSystem(scene, DISABLED_STATE),
      new FountainSystem(scene, DISABLED_STATE),
      new WaterfallSystem(scene, DISABLED_STATE),
      new WorldDetailsSystem(scene, DISABLED_STATE)
    ];
  }

  setActive(active: boolean): void {
    if (this.active === active) {
      return;
    }

    this.active = active;
    const state = active ? this.getEnabledState() : DISABLED_STATE;
    this.systems.forEach((system) => system.applyState(state));
  }

  setLevel(level: TallvokterFxLevel): void {
    if (this.level === level) {
      return;
    }

    this.level = level;
    if (this.active) {
      this.systems.forEach((system) => system.applyState(this.getEnabledState()));
    }
  }

  update(time: number, delta: number, camera: Phaser.Cameras.Scene2D.Camera): void {
    if (!this.active) {
      return;
    }

    this.systems.forEach((system) => system.update(time, delta, camera));
  }

  interact(x: number, y: number): void {
    if (!this.active) {
      return;
    }

    for (const system of this.systems) {
      if (system.interact({ x, y })) {
        return;
      }
    }
  }

  destroy(): void {
    this.systems.forEach((system) => system.destroy());
    this.systems.length = 0;
    this.active = false;
  }

  private getEnabledState(): ShowcaseState {
    if (this.level === 'off') {
      return DISABLED_STATE;
    }

    return {
      quality: this.level,
      effects: enabledEffects
    };
  }
}
