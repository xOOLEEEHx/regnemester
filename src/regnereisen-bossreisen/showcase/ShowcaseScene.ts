import Phaser from 'phaser';
import { SHOWCASE_ASSETS } from './assets';
import { createShowcaseTextures } from './fxTextures';
import { ShowcaseCameraController } from './input/ShowcaseCameraController';
import { MAP_HEIGHT, MAP_WIDTH } from './mapRegions';
import { showcaseStore } from './showcaseStore';
import type { ShowcaseAction, ShowcaseState, ShowcaseTelemetry } from './types';
import { CaveSystem } from './systems/CaveSystem';
import { CrystalSystem } from './systems/CrystalSystem';
import { ForestSystem } from './systems/ForestSystem';
import { FountainSystem } from './systems/FountainSystem';
import { PortalSystem } from './systems/PortalSystem';
import type { ShowcaseSystem } from './systems/ShowcaseSystem';
import { SwampSystem } from './systems/SwampSystem';
import { WaterSystem } from './systems/WaterSystem';
import { WaterfallSystem } from './systems/WaterfallSystem';
import { WorldDetailsSystem } from './systems/WorldDetailsSystem';

export class ShowcaseScene extends Phaser.Scene {
  private systems: ShowcaseSystem[] = [];
  private portalSystem?: PortalSystem;
  private worldDetailsSystem?: WorldDetailsSystem;
  private cameraController?: ShowcaseCameraController;
  private mapImage?: Phaser.GameObjects.Image;
  private unsubscribeState?: () => void;
  private unsubscribeActions?: () => void;
  private frameSamples: number[] = [];
  private telemetryElapsed = 0;

  constructor(private readonly renderScale: number) {
    super({ key: 'TallvokterShowcaseScene' });
  }

  preload(): void {
    this.load.on(Phaser.Loader.Events.PROGRESS, (progress: number) => {
      this.dispatchLoading(progress, 'Laster Tallvokterens verden …');
    });
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, () => {
      this.dispatchLoading(0, 'Kartlastingen feilet.');
    });
    this.load.image(SHOWCASE_ASSETS.map.key, SHOWCASE_ASSETS.map.path);
    if (SHOWCASE_ASSETS.waterMask.available) {
      this.load.image(SHOWCASE_ASSETS.waterMask.sourceKey, SHOWCASE_ASSETS.waterMask.sourcePath);
    }
  }

  create(): void {
    createShowcaseTextures(this);
    this.lights.enable().setAmbientColor(0xe2ebff);

    this.mapImage = this.add
      .image(0, 0, SHOWCASE_ASSETS.map.key)
      .setOrigin(0, 0)
      .setDisplaySize(MAP_WIDTH, MAP_HEIGHT)
      .setLighting(true);

    const state = showcaseStore.getSnapshot();
    this.portalSystem = new PortalSystem(this, state);
    this.worldDetailsSystem = new WorldDetailsSystem(this, state);
    this.systems = [
      ...(SHOWCASE_ASSETS.waterMask.available ? [new WaterSystem(this, state)] : []),
      this.portalSystem,
      new CrystalSystem(this, state),
      new ForestSystem(this, state),
      new CaveSystem(this, state),
      new SwampSystem(this, state),
      new FountainSystem(this, state),
      new WaterfallSystem(this, state),
      this.worldDetailsSystem
    ];

    this.cameraController = new ShowcaseCameraController(
      this,
      (x, y) => this.handleWorldTap(x, y),
      this.renderScale
    );
    this.unsubscribeState = showcaseStore.subscribe((nextState) => this.applyState(nextState));
    this.unsubscribeActions = showcaseStore.subscribeActions((action) => this.handleAction(action));
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);

    this.dispatchLoading(1, 'Kart og effektmoduler er klare.');
  }

  update(time: number, delta: number): void {
    this.cameraController?.update(delta);
    const camera = this.cameras.main;
    this.systems.forEach((system) => system.update(time, delta, camera));
    this.frameSamples.push(delta);
    if (this.frameSamples.length > 120) this.frameSamples.shift();
    this.telemetryElapsed += delta;
    if (this.telemetryElapsed >= 400) {
      this.telemetryElapsed = 0;
      showcaseStore.updateTelemetry(this.measureTelemetry());
    }
  }

  private applyState(state: ShowcaseState): void {
    this.mapImage?.setLighting(state.effects.lighting);
    this.systems.forEach((system) => system.applyState(state));
  }

  private handleWorldTap(x: number, y: number): void {
    const state = showcaseStore.getSnapshot();
    if (!state.effects.interactions) return;
    for (const system of this.systems) {
      if (system.interact({ x, y })) return;
    }
  }

  private handleAction(action: ShowcaseAction): void {
    switch (action) {
      case 'tour-start':
        this.cameraController?.startTour();
        break;
      case 'tour-stop':
        this.cameraController?.stopTour();
        break;
      case 'overview':
        this.cameraController?.stopTour();
        this.cameraController?.fitOverview(true);
        break;
      case 'portal-demo':
        this.cameraController?.stopTour();
        this.cameraController?.focusOn(365, 2075, 1.08, 850);
        this.time.delayedCall(820, () => this.portalSystem?.activate());
        break;
      case 'event-demo':
        this.cameraController?.stopTour();
        this.worldDetailsSystem?.triggerRareEvent(this.cameras.main);
        break;
      case 'filter-demo':
        this.portalSystem?.runFilterDemo();
        break;
    }
  }

  private handleResize(): void {
    this.cameraController?.onResize();
  }

  private measureTelemetry(): ShowcaseTelemetry {
    const samples = this.frameSamples.length > 0 ? this.frameSamples : [16.67];
    const frameMs = samples.reduce((sum, value) => sum + value, 0) / samples.length;
    const emitters = this.systems.flatMap((system) => system.getEmitters());
    const activeEmitters = emitters.filter((emitter) => emitter.active && emitter.visible && emitter.emitting).length;
    const aliveParticles = emitters
      .filter((emitter) => emitter.active && emitter.visible)
      .reduce((sum, emitter) => sum + emitter.getAliveParticleCount(), 0);
    const visibleLights = this.systems.reduce((sum, system) => sum + system.getVisibleLightCount(), 0);
    const camera = this.cameras.main;
    const rendererName = this.game.renderer.type === Phaser.WEBGL ? `WebGL · Phaser ${Phaser.VERSION}` : `Canvas · Phaser ${Phaser.VERSION}`;
    return {
      fps: 1000 / Math.max(frameMs, 0.01),
      frameMs,
      activeEmitters,
      aliveParticles,
      visibleLights,
      cameraX: camera.midPoint.x,
      cameraY: camera.midPoint.y,
      zoom: camera.zoom / this.renderScale,
      renderer: rendererName
    };
  }

  private dispatchLoading(progress: number, message: string): void {
    document.dispatchEvent(
      new CustomEvent('showcase-loading', {
        detail: { progress, message }
      })
    );
  }

  private shutdown(): void {
    this.unsubscribeState?.();
    this.unsubscribeActions?.();
    this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    this.cameraController?.destroy();
    this.systems.forEach((system) => system.destroy());
    this.systems = [];
  }
}
