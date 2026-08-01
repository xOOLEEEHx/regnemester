import Phaser from 'phaser';
import {
  createEmptyFishInventory,
  FISH_TYPES,
  FISHING_CONFIG,
  getFishInventoryCount,
  getFishInventoryValue,
  rollFish,
  type FishDefinition,
  type FishInventory
} from '../../game/content/fishing';
import type { ProgressStore } from '../../game/simulation/progress';

type ActiveFish = {
  definition: FishDefinition;
  sprite: Phaser.GameObjects.Image;
  glow?: Phaser.GameObjects.Ellipse;
  tween: Phaser.Tweens.Tween;
  baseY: number;
  phase: number;
  direction: 1 | -1;
  spawnedAt: number;
  motionAmplitude: number;
  motionFrequency: number;
  horizontalAmplitude: number;
  motionVariant: number;
  lastOffsetX: number;
  positionHistory: FishPositionSample[];
  lastHistoryAt: number;
  caught: boolean;
};

type FishPositionSample = {
  x: number;
  y: number;
  angle: number;
  time: number;
};

type PendingTap = {
  pointerId: number;
  startX: number;
  startY: number;
  moved: boolean;
};

type WorldSceneFishingBridge = Phaser.Scene & {
  resumeFromFishing: () => void;
};

const COMPACT_MEDIA_QUERY = '(max-width: 720px), (pointer: coarse)';
const FISH_SWIM_TOP = 188;
const FISH_SWIM_BOTTOM = 64;
const MAX_HIT_HISTORY_MS = 180;

export class FishingScene extends Phaser.Scene {
  private readonly touchOptimized = window.matchMedia('(pointer: coarse)').matches
    || navigator.maxTouchPoints > 1;
  private readonly catches: FishInventory = createEmptyFishInventory();
  private readonly activeFish = new Set<ActiveFish>();
  private roundElapsedMs = 0;
  private roundFinished = false;
  private catchSaved = false;
  private leaving = false;
  private readonly pendingTaps = new Map<number, PendingTap>();
  private spawnTimer?: Phaser.Time.TimerEvent;
  private background?: Phaser.GameObjects.Graphics;
  private waterLines?: Phaser.GameObjects.Graphics;
  private timerText?: Phaser.GameObjects.Text;
  private caughtText?: Phaser.GameObjects.Text;
  private instructionText?: Phaser.GameObjects.Text;
  private exitButton?: Phaser.GameObjects.Container;
  private summaryContainer?: Phaser.GameObjects.Container;
  private lastDisplayedSecond = -1;
  private lastWaterDrawAt = -Infinity;
  private touchInputCanvas?: HTMLCanvasElement;
  private previousCanvasTouchAction = '';
  private readonly nativeTouchOptions: AddEventListenerOptions = {
    capture: true,
    passive: false
  };
  private readonly handleNativeTouchStart = (event: TouchEvent): void => {
    if (this.roundFinished) return;

    if (event.cancelable) event.preventDefault();
    event.stopImmediatePropagation();
    this.pendingTaps.clear();
    if (event.touches.length !== 1) {
      return;
    }
    const touch = event.changedTouches.item(0);
    if (!touch) return;
    const point = this.getCanvasPoint(touch.clientX, touch.clientY);
    if (!point) return;

    if (this.exitButton?.getBounds().contains(point.x, point.y)) {
      this.finishRound();
      return;
    }
    const fish = this.findFishAtPoint(point.x, point.y);
    if (fish) this.catchFish(fish);
  };
  private readonly handleNativeTouchMove = (event: TouchEvent): void => {
    if (this.roundFinished) return;
    if (event.cancelable) event.preventDefault();
    event.stopImmediatePropagation();
  };
  private readonly handleNativeTouchEnd = (event: TouchEvent): void => {
    if (this.roundFinished) return;
    if (event.cancelable) event.preventDefault();
    event.stopImmediatePropagation();
    this.pendingTaps.clear();
  };
  private readonly handleNativeGesture = (event: Event): void => {
    if (this.roundFinished) return;
    if (event.cancelable) event.preventDefault();
    event.stopImmediatePropagation();
  };

  private readonly handlePointerDown = (pointer: Phaser.Input.Pointer): void => {
    if (this.roundFinished) {
      return;
    }

    this.pendingTaps.set(pointer.id, {
      pointerId: pointer.id,
      startX: pointer.x,
      startY: pointer.y,
      moved: false
    });

    // Register the catch on pointerdown. Waiting for pointerup made fast fish
    // move far away between the two events, especially during rapid clicking.
    const fish = this.findFishAtPoint(pointer.x, pointer.y);
    if (fish) {
      this.pendingTaps.delete(pointer.id);
      this.catchFish(fish);
    }
  };

  private readonly handlePointerMove = (pointer: Phaser.Input.Pointer): void => {
    const tap = this.pendingTaps.get(pointer.id);
    if (!tap) {
      return;
    }

    const maxMovement = this.getTapMovementLimit();
    if (Phaser.Math.Distance.Between(
      pointer.x,
      pointer.y,
      tap.startX,
      tap.startY
    ) > maxMovement) {
      tap.moved = true;
    }
  };

  private readonly handlePointerUp = (pointer: Phaser.Input.Pointer): void => {
    const tap = this.pendingTaps.get(pointer.id);
    if (!tap) {
      return;
    }

    this.pendingTaps.delete(pointer.id);
    if (tap.moved || this.roundFinished) {
      return;
    }

    const maxMovement = this.getTapMovementLimit();
    if (Phaser.Math.Distance.Between(pointer.x, pointer.y, tap.startX, tap.startY) <= maxMovement) {
      // A second sample on pointerup catches a fish that crossed the original
      // click point between frames without allowing a drag to count as a catch.
      const fish = this.findFishAtPoint(tap.startX, tap.startY)
        ?? this.findFishAtPoint(pointer.x, pointer.y);
      if (fish) {
        this.catchFish(fish);
      }
    }
  };

  private readonly handlePointerCancel = (pointer?: Phaser.Input.Pointer): void => {
    if (pointer && Number.isFinite(pointer.id)) {
      this.pendingTaps.delete(pointer.id);
    } else {
      this.pendingTaps.clear();
    }
  };

  private readonly handleResize = (): void => {
    this.layoutScene();
  };

  constructor(
    private readonly progress: ProgressStore,
    private readonly renderScale: number
  ) {
    super({ key: 'FishingScene' });
  }

  preload(): void {
    for (const fish of FISH_TYPES) {
      if (!this.textures.exists(fish.textureKey)) {
        this.load.image(fish.textureKey, fish.assetPath);
      }
    }
  }

  create(): void {
    this.input.enabled = true;
    this.input.resetPointers();
    this.scale.updateBounds();
    window.requestAnimationFrame(() => {
      if (this.sys.isActive()) this.scale.updateBounds();
    });
    for (const fish of FISH_TYPES) {
      this.catches[fish.id] = 0;
    }

    this.activeFish.clear();
    this.roundElapsedMs = 0;
    this.roundFinished = false;
    this.catchSaved = false;
    this.leaving = false;
    this.pendingTaps.clear();
    this.lastDisplayedSecond = -1;
    this.lastWaterDrawAt = -Infinity;

    this.cameras.main.setBackgroundColor('#062f49');
    this.background = this.add.graphics().setDepth(-20);
    this.waterLines = this.add.graphics().setDepth(-10);

    this.timerText = this.add.text(0, 0, 'Tid: 30', this.textStyle(28, '#fff6bd'))
      .setOrigin(0, 0.5)
      .setDepth(40);
    this.caughtText = this.add.text(0, 0, 'Fanget: 0', this.textStyle(24, '#ffffff'))
      .setOrigin(1, 0.5)
      .setDepth(40);
    this.instructionText = this.add.text(
      0,
      0,
      'Trykk for å fange fiskene',
      this.textStyle(18, '#d7f5ff')
    )
      .setOrigin(0.5)
      .setDepth(40);

    const exitButtonBackground = this.add.rectangle(
      0,
      0,
      144 * this.renderScale,
      48 * this.renderScale,
      0x8b3042,
      0.96
    )
      .setStrokeStyle(3 * this.renderScale, 0xffc7cf, 1)
      .setInteractive({ useHandCursor: true });
    const exitButtonText = this.add.text(0, 0, 'Avslutt', this.textStyle(18, '#ffffff'))
      .setOrigin(0.5);
    exitButtonBackground.on('pointerup', () => this.finishRound());
    this.exitButton = this.add.container(0, 0, [exitButtonBackground, exitButtonText]).setDepth(50);

    this.input.on('pointerdown', this.handlePointerDown);
    this.input.on('pointermove', this.handlePointerMove);
    this.input.on('pointerup', this.handlePointerUp);
    this.input.on('pointerupoutside', this.handlePointerCancel);
    this.input.on('gameout', this.handlePointerCancel);
    this.scale.on('resize', this.handleResize);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanup());

    this.layoutScene();
    this.attachNativeTouchInput();

    const initialFish = this.getConcurrentLimit();
    for (let index = 0; index < initialFish; index += 1) {
      this.time.delayedCall(index * 135, () => {
        if (!this.roundFinished) {
          this.spawnFish();
        }
      });
    }

    this.spawnTimer = this.time.addEvent({
      delay: FISHING_CONFIG.spawnIntervalMs,
      loop: true,
      callback: () => this.spawnFishWave()
    });
  }

  update(_: number, delta: number): void {
    if (this.roundFinished) {
      return;
    }

    this.roundElapsedMs += delta;
    const remainingMs = Math.max(0, FISHING_CONFIG.roundDurationMs - this.roundElapsedMs);
    const remainingSeconds = Math.ceil(remainingMs / 1000);
    if (remainingSeconds !== this.lastDisplayedSecond) {
      this.lastDisplayedSecond = remainingSeconds;
      this.timerText?.setText(`Tid: ${remainingSeconds}`);
    }

    this.updateFishMotion(this.roundElapsedMs);
    const waterFrameInterval = this.touchOptimized ? 150 : 66;
    if (this.roundElapsedMs - this.lastWaterDrawAt >= waterFrameInterval) {
      this.lastWaterDrawAt = this.roundElapsedMs;
      this.drawWaterLines(this.roundElapsedMs);
    }

    if (this.roundElapsedMs >= FISHING_CONFIG.roundDurationMs) {
      this.finishRound();
    }
  }

  private spawnFish(): void {
    if (this.roundFinished || this.activeFish.size >= this.getConcurrentLimit()) {
      return;
    }

    const definition = rollFish();
    const width = this.scale.width;
    const height = this.scale.height;
    const safeTop = FISH_SWIM_TOP * this.renderScale;
    const safeBottom = FISH_SWIM_BOTTOM * this.renderScale;
    const edge = 110 * this.renderScale;
    const direction: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
    const startX = direction === 1 ? -edge : width + edge;
    const endX = direction === 1 ? width + edge : -edge;
    const baseY = Phaser.Math.Between(
      Math.round(safeTop),
      Math.max(Math.round(safeTop + 1), Math.round(height - safeBottom))
    );
    const jitter = 0.9 + Math.random() * 0.2;
    const durationFromSpeed = Math.abs(endX - startX) / (definition.baseSpeed * this.renderScale * jitter) * 1000;
    const duration = Math.min(definition.visibilityMs, durationFromSpeed);
    const displayScale = definition.scale * this.renderScale;
    const sprite = this.add.image(startX, baseY, definition.textureKey)
      .setScale(displayScale)
      .setFlipX(direction === -1)
      .setDepth(10);

    let glow: Phaser.GameObjects.Ellipse | undefined;
    if (definition.probability < 2) {
      glow = this.add.ellipse(
        startX,
        baseY,
        definition.hitboxWidth * this.renderScale * 1.14,
        definition.hitboxHeight * this.renderScale * 0.82,
        definition.accentColor,
        definition.id === 'eternityFish' ? 0.3 : 0.2
      )
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(7);
      this.tweens.add({
        targets: glow,
        alpha: definition.id === 'eternityFish' ? 0.58 : 0.4,
        scaleX: 1.14,
        scaleY: 1.14,
        duration: definition.id === 'regneFish' ? 260 : 440,
        yoyo: true,
        repeat: -1
      });
    }

    const fish = {} as ActiveFish;
    const tween = this.tweens.add({
      targets: sprite,
      x: endX,
      duration,
      ease: 'Linear',
      onComplete: () => this.removeFish(fish)
    });

    const isCommonFish = definition.id === 'smallFish' || definition.id === 'gukkFish';
    Object.assign(fish, {
      definition,
      sprite,
      glow,
      tween,
      baseY,
      phase: Math.random() * Math.PI * 2,
      direction,
      spawnedAt: this.roundElapsedMs,
      motionAmplitude: isCommonFish
        ? 0.78 + Math.random() * 0.86
        : 0.72 + Math.random() * 0.72,
      motionFrequency: isCommonFish
        ? 0.68 + Math.random() * 0.94
        : 0.78 + Math.random() * 0.58,
      horizontalAmplitude: (isCommonFish ? 10 + Math.random() * 28 : 6 + Math.random() * 18) * this.renderScale,
      motionVariant: Phaser.Math.Between(0, isCommonFish ? 5 : 3),
      lastOffsetX: 0,
      positionHistory: [{ x: startX, y: baseY, angle: 0, time: this.roundElapsedMs }],
      lastHistoryAt: this.roundElapsedMs,
      caught: false
    } satisfies ActiveFish);

    this.activeFish.add(fish);
  }

  private spawnFishWave(): void {
    if (this.roundFinished) return;
    const availableSlots = this.getConcurrentLimit() - this.activeFish.size;
    if (availableSlots <= 0) return;

    const roll = Math.random();
    const desiredCount = this.roundElapsedMs < 2800
      ? 1
      : roll < 0.14
        ? 3
        : roll < 0.52
          ? 2
          : 1;
    const waveSize = Math.min(availableSlots, desiredCount);
    for (let index = 0; index < waveSize; index += 1) {
      this.time.delayedCall(index * 90, () => {
        if (!this.roundFinished) this.spawnFish();
      });
    }
  }

  private updateFishMotion(time: number): void {
    for (const fish of this.activeFish) {
      const age = (time - fish.spawnedAt) / 1000;
      const phase = fish.phase;
      const amplitude = fish.motionAmplitude;
      const frequency = fish.motionFrequency;
      const variant = fish.motionVariant;
      let offsetY = 0;
      let offsetX = 0;
      let angle = 0;

      switch (fish.definition.movement) {
        case 'gentle': {
          switch (variant) {
            case 0:
              offsetY = (
                Math.sin(age * 1.25 * frequency + phase) * 10
                + Math.sin(age * 0.48 + phase * 0.4) * 4
              ) * amplitude * this.renderScale;
              offsetX = Math.sin(age * 0.9 + phase) * fish.horizontalAmplitude * 0.08;
              angle = Math.cos(age * 1.25 * frequency + phase) * 2;
              break;
            case 1:
              offsetY = (
                Math.sin(age * 2.25 * frequency + phase) * 12
                + Math.sin(age * 0.7 + phase * 1.4) * 7
              ) * amplitude * this.renderScale;
              offsetX = Math.cos(age * 1.55 * frequency + phase) * fish.horizontalAmplitude * 0.24;
              angle = Math.cos(age * 2.25 * frequency + phase) * 4;
              break;
            case 2: {
              const softTriangle = Math.asin(Math.sin(age * 1.65 * frequency + phase)) * (2 / Math.PI);
              offsetY = (
                softTriangle * 18
                + Math.sin(age * 3.8 * frequency + phase) * 4
              ) * amplitude * this.renderScale;
              offsetX = Math.sin(age * 1.45 * frequency + phase) * fish.horizontalAmplitude * 0.35;
              angle = Math.cos(age * 1.65 * frequency + phase) * 5.5;
              break;
            }
            case 3:
              offsetY = (
                Math.sin(age * 0.82 * frequency + phase) * 22
                + Math.sin(age * 3.2 * frequency + phase * 0.5) * 5
              ) * amplitude * this.renderScale;
              offsetX = Math.cos(age * 1.7 * frequency + phase) * fish.horizontalAmplitude * 0.28;
              angle = Math.cos(age * 0.82 * frequency + phase) * 5;
              break;
            case 4:
              offsetY = (
                Math.sin(age * 2.9 * frequency + phase) * 9
                + Math.sin(age * 5.7 * frequency + phase * 1.6) * 6
                + Math.sin(age * 0.55 + phase) * 8
              ) * amplitude * this.renderScale;
              offsetX = Math.sin(age * 4.2 * frequency + phase) * fish.horizontalAmplitude * 0.38;
              angle = Math.cos(age * 3.7 * frequency + phase) * 7;
              break;
            default:
              offsetY = (
                Math.sin(age * 1.75 * frequency + phase) * 17
                + Math.cos(age * 0.55 + phase) * 5
              ) * amplitude * this.renderScale;
              offsetX = Math.cos(age * 1.75 * frequency + phase) * fish.horizontalAmplitude * 0.52;
              angle = Math.cos(age * 1.75 * frequency + phase) * 6.5;
              break;
          }
          break;
        }
        case 'wave': {
          switch (variant) {
            case 0:
              offsetY = (
                Math.sin(age * 2.7 * frequency + phase) * 20
                + Math.sin(age * 5.2 * frequency + phase * 1.7) * 5
              ) * amplitude * this.renderScale;
              offsetX = Math.cos(age * 2.4 * frequency + phase) * fish.horizontalAmplitude * 0.32;
              angle = Math.cos(age * 2.7 * frequency + phase) * 6;
              break;
            case 1:
              offsetY = (
                Math.sin(age * 1.18 * frequency + phase) * 31
                + Math.sin(age * 4.6 * frequency + phase * 0.6) * 7
              ) * amplitude * this.renderScale;
              offsetX = Math.sin(age * 1.8 * frequency + phase) * fish.horizontalAmplitude * 0.44;
              angle = Math.cos(age * 1.18 * frequency + phase) * 8;
              break;
            case 2: {
              const rollingTriangle = Math.asin(Math.sin(age * 2.25 * frequency + phase)) * (2 / Math.PI);
              offsetY = (
                rollingTriangle * 25
                + Math.sin(age * 1.1 * frequency + phase) * 9
              ) * amplitude * this.renderScale;
              offsetX = Math.sin(age * 3.6 * frequency + phase) * fish.horizontalAmplitude * 0.5;
              angle = Math.cos(age * 2.25 * frequency + phase) * 9;
              break;
            }
            case 3:
              offsetY = (
                Math.sin(age * 2.05 * frequency + phase) * 24
                + Math.sin(age * 0.7 + phase * 0.8) * 8
              ) * amplitude * this.renderScale;
              offsetX = Math.cos(age * 2.05 * frequency + phase) * fish.horizontalAmplitude * 0.65;
              angle = Math.cos(age * 2.05 * frequency + phase) * 8;
              break;
            case 4:
              offsetY = (
                Math.sin(age * 3.5 * frequency + phase) * 14
                + Math.sin(age * 1.25 * frequency + phase * 1.3) * 20
              ) * amplitude * this.renderScale;
              offsetX = Math.cos(age * 2.75 * frequency + phase) * fish.horizontalAmplitude * 0.48;
              angle = Math.cos(age * 3.5 * frequency + phase) * 10;
              break;
            default:
              offsetY = (
                Math.sin(age * 5.6 * frequency + phase) * 10
                + Math.sin(age * 2.1 * frequency + phase * 0.7) * 18
                + Math.cos(age * 0.62 + phase) * 7
              ) * amplitude * this.renderScale;
              offsetX = Math.sin(age * 4.8 * frequency + phase) * fish.horizontalAmplitude * 0.72;
              angle = Math.cos(age * 4.6 * frequency + phase) * 12;
              break;
          }
          break;
        }
        case 'sine':
          offsetY = (
            Math.sin(age * (3.5 + variant * 0.46) * frequency + phase) * (25 + variant * 5)
            + Math.sin(age * 1.35 + phase) * 8
          ) * amplitude * this.renderScale;
          offsetX = Math.sin(age * 5.8 * frequency + phase) * fish.horizontalAmplitude * 0.34;
          angle = Math.cos(age * 4.1 * frequency + phase) * (7 + variant * 1.2);
          break;
        case 'zigzag': {
          const triangle = Math.asin(Math.sin(age * (4.6 + variant * 0.7) * frequency + phase)) * (2 / Math.PI);
          offsetY = (
            triangle * (34 + variant * 6)
            + Math.sin(age * 1.7 + phase) * 11
          ) * amplitude * this.renderScale;
          offsetX = Math.sin(age * 8.2 * frequency + phase) * fish.horizontalAmplitude * 0.58;
          angle = Math.cos(age * 5.8 * frequency + phase) * (10 + variant * 1.4);
          break;
        }
        case 'erratic': {
          const sharpTurn = Math.asin(Math.sin(age * (7.2 + variant) * frequency + phase)) * (2 / Math.PI);
          offsetY = (
            sharpTurn * (35 + variant * 5)
            + Math.sin(age * 2.15 * frequency + phase * 0.6) * 21
            + Math.sin(age * 11.4 + phase) * 7
          ) * amplitude * this.renderScale;
          offsetX = (
            Math.sin(age * 9.6 * frequency + phase) * 0.72
            + Math.sin(age * 3.1 + phase) * 0.35
          ) * fish.horizontalAmplitude;
          angle = Math.cos(age * 8.4 * frequency + phase) * (13 + variant * 1.8);
          break;
        }
        case 'cosmic':
          offsetY = (
            Math.sin(age * (5.5 + variant * 0.55) * frequency + phase) * (39 + variant * 4)
            + Math.sin(age * 2.65 * frequency + phase) * 19
            + Math.cos(age * 10.5 + phase) * 6
          ) * amplitude * this.renderScale;
          offsetX = (
            Math.cos(age * 3.25 * frequency + phase) * 0.9
            + Math.sin(age * 8.8 + phase) * 0.35
          ) * fish.horizontalAmplitude;
          angle = Math.cos(age * 6.3 * frequency + phase) * (15 + variant * 2);
          break;
      }

      const tweenX = fish.sprite.x - fish.lastOffsetX;
      fish.sprite.x = tweenX + offsetX;
      fish.lastOffsetX = offsetX;
      fish.sprite.y = Phaser.Math.Clamp(
        fish.baseY + offsetY,
        FISH_SWIM_TOP * this.renderScale,
        this.scale.height - FISH_SWIM_BOTTOM * this.renderScale
      );
      fish.sprite.setAngle(angle * fish.direction);
      if (fish.glow) {
        fish.glow.setPosition(fish.sprite.x, fish.sprite.y);
        fish.glow.setAngle(fish.sprite.angle);
      }
      this.recordFishPosition(fish, time);
    }
  }

  private getTapMovementLimit(): number {
    return (window.matchMedia(COMPACT_MEDIA_QUERY).matches ? 22 : 16) * this.renderScale;
  }

  private findFishAtPoint(pointerX: number, pointerY: number): ActiveFish | undefined {
    const compactInput = window.matchMedia(COMPACT_MEDIA_QUERY).matches;
    const historyWindowMs = compactInput ? 150 : 110;
    const cutoff = this.roundElapsedMs - historyWindowMs;
    let bestFish: ActiveFish | undefined;
    let bestScore = Number.POSITIVE_INFINITY;

    for (const fish of this.activeFish) {
      if (fish.caught) {
        continue;
      }

      const visibleWidth = Math.max(
        fish.definition.hitboxWidth * this.renderScale,
        fish.sprite.displayWidth * 0.92
      );
      const rearReach = visibleWidth * (compactInput ? 0.78 : 0.7);
      const frontReach = visibleWidth * (compactInput ? 0.52 : 0.46);
      const halfHeight = Math.max(
        fish.definition.hitboxHeight * this.renderScale * (compactInput ? 0.76 : 0.68),
        fish.sprite.displayHeight * (compactInput ? 0.42 : 0.36)
      );
      const samples: FishPositionSample[] = [
        { x: fish.sprite.x, y: fish.sprite.y, angle: fish.sprite.angle, time: this.roundElapsedMs },
        ...fish.positionHistory.filter((sample) => sample.time >= cutoff)
      ];

      for (const sample of samples) {
        const angle = Phaser.Math.DegToRad(sample.angle);
        const cosine = Math.cos(angle);
        const sine = Math.sin(angle);
        const deltaX = pointerX - sample.x;
        const deltaY = pointerY - sample.y;
        const forward = (deltaX * cosine + deltaY * sine) * fish.direction;
        const vertical = -deltaX * sine + deltaY * cosine;
        if (forward < -rearReach || forward > frontReach || Math.abs(vertical) > halfHeight) {
          continue;
        }

        const normalizedX = forward >= 0 ? forward / frontReach : -forward / rearReach;
        const normalizedY = Math.abs(vertical) / halfHeight;
        const agePenalty = Math.max(0, this.roundElapsedMs - sample.time) / historyWindowMs * 0.26;
        const score = normalizedX * normalizedX * 0.55 + normalizedY * normalizedY * 0.45 + agePenalty;
        if (score < bestScore) {
          bestScore = score;
          bestFish = fish;
        }
      }
    }

    return bestFish;
  }

  private recordFishPosition(fish: ActiveFish, time: number): void {
    const sampleInterval = this.touchOptimized ? 40 : 20;
    if (time - fish.lastHistoryAt < sampleInterval) {
      return;
    }

    fish.lastHistoryAt = time;
    fish.positionHistory.push({ x: fish.sprite.x, y: fish.sprite.y, angle: fish.sprite.angle, time });
    const cutoff = time - MAX_HIT_HISTORY_MS;
    while (fish.positionHistory.length > 0 && fish.positionHistory[0].time < cutoff) {
      fish.positionHistory.shift();
    }
  }

  private catchFish(fish: ActiveFish): void {
    if (fish.caught || !this.activeFish.has(fish)) {
      return;
    }

    fish.caught = true;
    this.catches[fish.definition.id] += 1;
    this.caughtText?.setText(`Fanget: ${getFishInventoryCount(this.catches)}`);
    const x = fish.sprite.x;
    const y = fish.sprite.y;
    const accent = `#${fish.definition.accentColor.toString(16).padStart(6, '0')}`;
    const ring = this.add.circle(x, y, 28 * this.renderScale)
      .setStrokeStyle(4 * this.renderScale, fish.definition.accentColor, 0.96)
      .setDepth(30);
    const label = this.add.text(
      x,
      y - 22 * this.renderScale,
      `+ ${fish.definition.displayName}`,
      this.textStyle(16, accent)
    )
      .setOrigin(0.5)
      .setStroke('#06263d', 4 * this.renderScale)
      .setDepth(31);

    this.removeFish(fish);
    this.tweens.add({
      targets: ring,
      radius: 58 * this.renderScale,
      alpha: 0,
      duration: 360,
      onComplete: () => ring.destroy()
    });
    this.tweens.add({
      targets: label,
      y: y - 64 * this.renderScale,
      alpha: 0,
      duration: 620,
      ease: 'Cubic.easeOut',
      onComplete: () => label.destroy()
    });
  }

  private removeFish(fish: ActiveFish): void {
    if (!this.activeFish.delete(fish)) {
      return;
    }

    fish.tween.stop();
    this.tweens.killTweensOf(fish.sprite);
    fish.sprite.removeAllListeners();
    fish.sprite.destroy();
    if (fish.glow) {
      this.tweens.killTweensOf(fish.glow);
      fish.glow.destroy();
    }
  }

  private finishRound(): void {
    if (this.roundFinished) {
      return;
    }

    this.roundFinished = true;
    this.timerText?.setText('Tid: 0');
    this.exitButton?.destroy(true);
    this.exitButton = undefined;
    this.spawnTimer?.remove(false);
    this.spawnTimer = undefined;
    this.pendingTaps.clear();
    for (const fish of [...this.activeFish]) {
      this.removeFish(fish);
    }

    if (!this.catchSaved) {
      this.catchSaved = true;
      this.progress.addFishingCatch(this.catches);
    }

    this.showSummary();
  }

  private showSummary(): void {
    this.summaryContainer?.destroy(true);
    const width = this.scale.width;
    const height = this.scale.height;
    const panelWidth = Math.min(width - 32 * this.renderScale, 610 * this.renderScale);
    const panelHeight = Math.min(height - 28 * this.renderScale, 650 * this.renderScale);
    const container = this.add.container(width / 2, height / 2).setDepth(100);
    const shade = this.add.rectangle(0, 0, width, height, 0x031827, 0.72);
    const panel = this.add.rectangle(0, 0, panelWidth, panelHeight, 0xf6fbff, 0.98)
      .setStrokeStyle(4 * this.renderScale, 0x79d9ef, 1);
    const title = this.add.text(0, -panelHeight / 2 + 46 * this.renderScale, 'Fangsten din', this.textStyle(31, '#12324b'))
      .setOrigin(0.5);

    const caughtRows = FISH_TYPES
      .filter((fish) => this.catches[fish.id] > 0)
      .map((fish) => `${fish.displayName} × ${this.catches[fish.id]}  —  ${this.catches[fish.id] * fish.value} Regnecoins`);
    const rowsText = caughtRows.length > 0 ? caughtRows.join('\n') : 'Ingen fisk denne gangen – prøv igjen på neste reise.';
    const list = this.add.text(
      -panelWidth / 2 + 34 * this.renderScale,
      -panelHeight / 2 + 104 * this.renderScale,
      rowsText,
      {
        ...this.textStyle(18, '#24465f'),
        lineSpacing: 8 * this.renderScale,
        wordWrap: { width: panelWidth - 68 * this.renderScale }
      }
    ).setOrigin(0, 0);
    const total = getFishInventoryValue(this.catches);
    const totalText = this.add.text(
      0,
      panelHeight / 2 - 196 * this.renderScale,
      `Foreløpig salgsverdi: ${total} Regnecoins`,
      this.textStyle(21, '#163b59')
    ).setOrigin(0.5);
    const help = this.add.text(
      0,
      panelHeight / 2 - 143 * this.renderScale,
      'Fangsten er lagt i fiskebøtten.\nGå til fiskeren på kartet for å selge den.',
      {
        ...this.textStyle(17, '#4c6173'),
        align: 'center',
        lineSpacing: 4 * this.renderScale,
        wordWrap: { width: panelWidth - 56 * this.renderScale }
      }
    ).setOrigin(0.5);

    const buttonWidth = Math.min(260 * this.renderScale, panelWidth - 48 * this.renderScale);
    const button = this.add.rectangle(
      0,
      panelHeight / 2 - 66 * this.renderScale,
      buttonWidth,
      62 * this.renderScale,
      0x126f99,
      1
    )
      .setStrokeStyle(3 * this.renderScale, 0xb9f1ff, 1)
      .setInteractive({ useHandCursor: true });
    const buttonText = this.add.text(
      0,
      panelHeight / 2 - 66 * this.renderScale,
      'Til kartet',
      this.textStyle(21, '#ffffff')
    ).setOrigin(0.5);
    button.on('pointerup', () => this.returnToWorld());

    container.add([shade, panel, title, list, totalText, help, button, buttonText]);
    this.summaryContainer = container;
  }

  private returnToWorld(): void {
    if (this.leaving) {
      return;
    }
    this.leaving = true;
    const worldScene = this.scene.get('WorldScene') as WorldSceneFishingBridge;
    worldScene.resumeFromFishing();
    this.scene.resume('WorldScene');
    this.scene.stop();
  }

  private getConcurrentLimit(): number {
    return window.matchMedia(COMPACT_MEDIA_QUERY).matches
      ? FISHING_CONFIG.concurrentFish.compact
      : FISHING_CONFIG.concurrentFish.default;
  }

  private layoutScene(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    this.background?.clear();
    this.background?.fillStyle(0x062f49, 1).fillRect(0, 0, width, height);
    this.background?.fillStyle(0x0a5270, 0.72).fillRect(0, height * 0.18, width, height * 0.34);
    this.background?.fillStyle(0x087c94, 0.36).fillRect(0, height * 0.52, width, height * 0.48);
    this.background?.fillStyle(0x031d31, 0.83).fillRect(0, 0, width, 96 * this.renderScale);

    this.timerText?.setPosition(22 * this.renderScale, 48 * this.renderScale);
    this.caughtText?.setPosition(width - 22 * this.renderScale, 48 * this.renderScale);
    this.instructionText?.setPosition(width / 2, 87 * this.renderScale);
    this.exitButton?.setPosition(width / 2, 34 * this.renderScale);

    if (this.roundFinished) {
      this.showSummary();
    } else {
      this.drawWaterLines(this.roundElapsedMs);
    }
  }

  private drawWaterLines(time: number): void {
    const graphics = this.waterLines;
    if (!graphics) {
      return;
    }

    const width = this.scale.width;
    const height = this.scale.height;
    graphics.clear();
    const rowCount = this.touchOptimized ? 6 : 10;
    for (let row = 0; row < rowCount; row += 1) {
      const y = 120 * this.renderScale + row * ((height - 150 * this.renderScale) / rowCount);
      const phase = time * 0.0012 + row * 0.72;
      graphics.lineStyle(2 * this.renderScale, row % 2 === 0 ? 0x7ee8f2 : 0x42b7cd, 0.16);
      graphics.beginPath();
      for (let x = -40 * this.renderScale; x <= width + 40 * this.renderScale; x += 34 * this.renderScale) {
        const waveY = y + Math.sin(x / (70 * this.renderScale) + phase) * 8 * this.renderScale;
        if (x <= -40 * this.renderScale) {
          graphics.moveTo(x, waveY);
        } else {
          graphics.lineTo(x, waveY);
        }
      }
      graphics.strokePath();
    }
  }

  private textStyle(size: number, color: string): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      color,
      fontFamily: 'Trebuchet MS, Arial, sans-serif',
      fontSize: `${Math.round(size * this.renderScale)}px`,
      fontStyle: 'bold'
    };
  }

  private attachNativeTouchInput(): void {
    if (!this.touchOptimized || !this.game.canvas) return;
    this.touchInputCanvas = this.game.canvas;
    this.previousCanvasTouchAction = this.touchInputCanvas.style.touchAction;
    this.touchInputCanvas.style.touchAction = 'none';
    this.touchInputCanvas.addEventListener(
      'touchstart',
      this.handleNativeTouchStart,
      this.nativeTouchOptions
    );
    window.addEventListener('touchmove', this.handleNativeTouchMove, this.nativeTouchOptions);
    window.addEventListener('touchend', this.handleNativeTouchEnd, this.nativeTouchOptions);
    window.addEventListener('touchcancel', this.handleNativeTouchEnd, this.nativeTouchOptions);
    window.addEventListener('gesturestart', this.handleNativeGesture, this.nativeTouchOptions);
    window.addEventListener('gesturechange', this.handleNativeGesture, this.nativeTouchOptions);
    window.addEventListener('gestureend', this.handleNativeGesture, this.nativeTouchOptions);
  }

  private detachNativeTouchInput(): void {
    this.touchInputCanvas?.removeEventListener(
      'touchstart',
      this.handleNativeTouchStart,
      this.nativeTouchOptions
    );
    window.removeEventListener('touchmove', this.handleNativeTouchMove, this.nativeTouchOptions);
    window.removeEventListener('touchend', this.handleNativeTouchEnd, this.nativeTouchOptions);
    window.removeEventListener('touchcancel', this.handleNativeTouchEnd, this.nativeTouchOptions);
    window.removeEventListener('gesturestart', this.handleNativeGesture, this.nativeTouchOptions);
    window.removeEventListener('gesturechange', this.handleNativeGesture, this.nativeTouchOptions);
    window.removeEventListener('gestureend', this.handleNativeGesture, this.nativeTouchOptions);
    if (this.touchInputCanvas) {
      this.touchInputCanvas.style.touchAction = this.previousCanvasTouchAction;
    }
    this.touchInputCanvas = undefined;
    this.previousCanvasTouchAction = '';
  }

  private getCanvasPoint(clientX: number, clientY: number): Phaser.Math.Vector2 | undefined {
    const canvas = this.touchInputCanvas ?? this.game.canvas;
    if (!canvas) return undefined;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return undefined;
    return new Phaser.Math.Vector2(
      Phaser.Math.Clamp((clientX - rect.left) * (this.scale.width / rect.width), 0, this.scale.width),
      Phaser.Math.Clamp((clientY - rect.top) * (this.scale.height / rect.height), 0, this.scale.height)
    );
  }

  private cleanup(): void {
    this.detachNativeTouchInput();
    this.spawnTimer?.remove(false);
    this.spawnTimer = undefined;
    this.pendingTaps.clear();
    this.input.off('pointerdown', this.handlePointerDown);
    this.input.off('pointermove', this.handlePointerMove);
    this.input.off('pointerup', this.handlePointerUp);
    this.input.off('pointerupoutside', this.handlePointerCancel);
    this.input.off('gameout', this.handlePointerCancel);
    this.scale.off('resize', this.handleResize);
    for (const fish of [...this.activeFish]) {
      this.removeFish(fish);
    }
    this.tweens.killAll();
  }
}
