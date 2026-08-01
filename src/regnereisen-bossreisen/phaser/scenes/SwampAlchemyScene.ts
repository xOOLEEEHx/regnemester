import Phaser from 'phaser';
import {
  SWAMP_ALCHEMIST_ASSET_PATH,
  SWAMP_ALCHEMIST_TEXTURE_KEY,
  SWAMP_ALCHEMY_BACKGROUND_ASSET_PATH,
  SWAMP_ALCHEMY_BACKGROUND_TEXTURE_KEY,
  SWAMP_ALCHEMY_CAULDRON_ASSET_PATH,
  SWAMP_ALCHEMY_CAULDRON_TEXTURE_KEY,
  SWAMP_ALCHEMY_INGREDIENTS,
  SWAMP_ALCHEMY_SPOON_ASSET_PATH,
  SWAMP_ALCHEMY_SPOON_TEXTURE_KEY,
  SWAMP_ALCHEMY_WORKBENCH_ASSET_PATH,
  SWAMP_ALCHEMY_WORKBENCH_TEXTURE_KEY,
  getSwampAlchemyIngredientTextureKey
} from '../../game/content/swampAlchemy';
import { getStoredTallvokterFxLevel } from '../../game/content/tallvokterFx';
import {
  createCircularStirState,
  getCircularStirProgress,
  pauseCircularStirState,
  reframeCircularStirState,
  updateCircularStirState,
  type CircularStirState
} from '../../game/simulation/circularStir';
import type { ProgressStore } from '../../game/simulation/progress';
import {
  acceptSwampIngredient,
  answerSwampAlchemyQuestion,
  completeSwampStirring,
  createSwampAlchemyQuest,
  getCurrentSwampIngredient,
  startSwampAlchemyQuest,
  type SwampAlchemyQuestState
} from '../../game/simulation/swampAlchemyQuest';
import type { HudController, SwampAlchemyHudView } from '../../ui/hud';

type WorldSceneSwampBridge = Phaser.Scene & {
  resumeFromSwampAlchemy: (resetToProgress?: boolean) => void;
};

const FX_COUNTS = {
  off: { motes: 0, steam: 0 },
  low: { motes: 5, steam: 3 },
  standard: { motes: 10, steam: 5 },
  high: { motes: 16, steam: 8 },
  ultra: { motes: 24, steam: 12 }
} as const;

export class SwampAlchemyScene extends Phaser.Scene {
  private run?: SwampAlchemyQuestState;
  private background?: Phaser.GameObjects.Image;
  private shade?: Phaser.GameObjects.Graphics;
  private alchemist?: Phaser.GameObjects.Image;
  private workbench?: Phaser.GameObjects.Image;
  private cauldron?: Phaser.GameObjects.Image;
  private cauldronGlow?: Phaser.GameObjects.Arc;
  private liquid?: Phaser.GameObjects.Ellipse;
  private liquidHighlight?: Phaser.GameObjects.Ellipse;
  private ingredient?: Phaser.GameObjects.Image;
  private spoon?: Phaser.GameObjects.Image;
  private stirGuide?: Phaser.GameObjects.Graphics;
  private stirProgress?: CircularStirState;
  private ambientMotes: Phaser.GameObjects.Arc[] = [];
  private steamWisps: Phaser.GameObjects.Arc[] = [];
  private cauldronX = 0;
  private cauldronY = 0;
  private cauldronRadius = 120;
  private ingredientHomeX = 0;
  private ingredientHomeY = 0;
  private inputLocked = true;
  private stirringActive = false;
  private leaving = false;
  private readonly nativeTouchDrag = window.matchMedia('(pointer: coarse)').matches
    || navigator.maxTouchPoints > 1;
  private touchInputCanvas?: HTMLCanvasElement;
  private activeIngredientTouchId?: number;
  private activeStirringTouchId?: number;
  private ingredientTouchOffsetX = 0;
  private ingredientTouchOffsetY = 0;
  private readonly touchListenerOptions: AddEventListenerOptions = {
    capture: true,
    passive: false
  };

  private readonly handleResize = (): void => this.layoutScene();
  private readonly handleDrag = (
    _pointer: Phaser.Input.Pointer,
    gameObject: Phaser.GameObjects.GameObject,
    dragX: number,
    dragY: number
  ): void => {
    if (gameObject !== this.ingredient || this.inputLocked || this.run?.phase !== 'ingredient') return;
    this.ingredient.setPosition(dragX, dragY);
  };
  private readonly handleDragEnd = (
    _pointer: Phaser.Input.Pointer,
    gameObject: Phaser.GameObjects.GameObject
  ): void => {
    if (gameObject !== this.ingredient || this.inputLocked || this.run?.phase !== 'ingredient') return;
    this.finishIngredientDrop();
  };
  private readonly handleIngredientTouchStart = (event: TouchEvent): void => {
    if (
      this.activeIngredientTouchId !== undefined
      || this.activeStirringTouchId !== undefined
      || this.inputLocked
    ) return;
    const touch = event.changedTouches.item(0);
    if (!touch) return;
    const point = this.getCanvasPoint(touch.clientX, touch.clientY);
    if (!point) return;

    if (
      this.run?.phase === 'ingredient'
      && this.ingredient
      && this.ingredient.getBounds().contains(point.x, point.y)
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
      this.activeIngredientTouchId = touch.identifier;
      this.ingredientTouchOffsetX = point.x - this.ingredient.x;
      this.ingredientTouchOffsetY = point.y - this.ingredient.y;
      this.ingredient.setDepth(30);
      return;
    }

    if (
      this.run?.phase === 'stirring'
      && this.spoon
      && this.stirProgress
      && this.spoon.getBounds().contains(point.x, point.y)
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
      this.activeStirringTouchId = touch.identifier;
      this.stirringActive = true;
      this.stirProgress = pauseCircularStirState(this.stirProgress);
      this.spoon.setPosition(point.x, point.y);
    }
  };
  private readonly handleIngredientTouchMove = (event: TouchEvent): void => {
    const activeTouchId = this.activeIngredientTouchId ?? this.activeStirringTouchId;
    if (activeTouchId === undefined) return;
    const touch = this.findTouchById(event.touches, activeTouchId)
      ?? this.findTouchById(event.changedTouches, activeTouchId);
    if (!touch) return;
    const point = this.getCanvasPoint(touch.clientX, touch.clientY);
    if (!point) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    if (this.activeIngredientTouchId !== undefined && this.ingredient) {
      this.ingredient.setPosition(
        point.x - this.ingredientTouchOffsetX,
        point.y - this.ingredientTouchOffsetY
      );
    } else if (this.activeStirringTouchId !== undefined) {
      this.updateStirringAt(point.x, point.y);
    }
  };
  private readonly handleIngredientTouchEnd = (event: TouchEvent): void => {
    const activeTouchId = this.activeIngredientTouchId ?? this.activeStirringTouchId;
    if (activeTouchId === undefined || !this.findTouchById(event.changedTouches, activeTouchId)) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    if (this.activeIngredientTouchId !== undefined) {
      this.activeIngredientTouchId = undefined;
      this.ingredient?.setDepth(18);
      this.finishIngredientDrop();
    } else {
      this.activeStirringTouchId = undefined;
      this.stopStirringGesture();
    }
  };
  private readonly handleIngredientTouchCancel = (event: TouchEvent): void => {
    const activeTouchId = this.activeIngredientTouchId ?? this.activeStirringTouchId;
    if (activeTouchId === undefined || !this.findTouchById(event.changedTouches, activeTouchId)) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    if (this.activeIngredientTouchId !== undefined) {
      this.activeIngredientTouchId = undefined;
      this.ingredient?.setDepth(18);
      if (!this.inputLocked && this.run?.phase === 'ingredient') {
        this.returnIngredientHome();
      }
    } else {
      this.activeStirringTouchId = undefined;
      this.stopStirringGesture();
    }
  };
  private readonly handlePointerMove = (pointer: Phaser.Input.Pointer): void => {
    if (this.activeStirringTouchId !== undefined) return;
    this.updateStirringAt(pointer.worldX, pointer.worldY);
  };
  private readonly handlePointerUp = (): void => {
    if (this.activeStirringTouchId !== undefined) return;
    this.stopStirringGesture();
  };

  private updateStirringAt(x: number, y: number): void {
    if (!this.stirringActive || this.inputLocked || this.run?.phase !== 'stirring' || !this.stirProgress) return;
    const update = updateCircularStirState(this.stirProgress, x, y);
    this.stirProgress = update.state;
    if (update.accepted) {
      const angle = Phaser.Math.Angle.Between(this.cauldronX, this.cauldronY, x, y);
      this.spoon?.setPosition(x, y).setRotation(angle + Math.PI / 2);
      this.drawStirProgress(update.progress);
      this.liquid?.setRotation(angle * 0.16);
      this.liquidHighlight?.setRotation(-angle * 0.22);
    }
    if (update.completed) this.finishStirring();
  }

  private stopStirringGesture(): void {
    if (!this.stirringActive || this.run?.phase !== 'stirring') return;
    this.stirringActive = false;
    if (this.stirProgress) {
      this.stirProgress = pauseCircularStirState(this.stirProgress);
      this.drawStirProgress(getCircularStirProgress(this.stirProgress));
    }
    this.returnSpoonHome();
  }

  private finishIngredientDrop(): void {
    if (!this.ingredient || this.inputLocked || this.run?.phase !== 'ingredient') return;
    const distance = Phaser.Math.Distance.Between(
      this.ingredient.x,
      this.ingredient.y,
      this.cauldronX,
      this.cauldronY
    );
    if (distance <= this.cauldronRadius * 1.1) {
      this.acceptIngredient();
      return;
    }
    this.returnIngredientHome();
  }

  constructor(
    private readonly progress: ProgressStore,
    private readonly hud: HudController,
    private readonly renderScale: number
  ) {
    super({ key: 'SwampAlchemyScene' });
  }

  preload(): void {
    const assets = [
      [SWAMP_ALCHEMY_BACKGROUND_TEXTURE_KEY, SWAMP_ALCHEMY_BACKGROUND_ASSET_PATH],
      [SWAMP_ALCHEMIST_TEXTURE_KEY, SWAMP_ALCHEMIST_ASSET_PATH],
      [SWAMP_ALCHEMY_CAULDRON_TEXTURE_KEY, SWAMP_ALCHEMY_CAULDRON_ASSET_PATH],
      [SWAMP_ALCHEMY_WORKBENCH_TEXTURE_KEY, SWAMP_ALCHEMY_WORKBENCH_ASSET_PATH],
      [SWAMP_ALCHEMY_SPOON_TEXTURE_KEY, SWAMP_ALCHEMY_SPOON_ASSET_PATH]
    ] as const;
    for (const [key, path] of assets) {
      if (!this.textures.exists(key)) this.load.image(key, path);
    }
    for (const ingredient of SWAMP_ALCHEMY_INGREDIENTS) {
      const key = getSwampAlchemyIngredientTextureKey(ingredient.id);
      if (!this.textures.exists(key)) this.load.image(key, ingredient.assetPath);
    }
  }

  create(): void {
    this.input.enabled = true;
    this.input.resetPointers();
    this.scale.updateBounds();
    window.requestAnimationFrame(() => {
      if (this.sys.isActive()) this.scale.updateBounds();
    });
    this.leaving = false;
    this.inputLocked = false;
    this.stirringActive = false;
    this.run = startSwampAlchemyQuest(createSwampAlchemyQuest(
      this.progress.getSettings(),
      this.progress.getBattleHearts()
    ));

    this.cameras.main.setBackgroundColor('#06100f');
    this.background = this.add.image(0, 0, SWAMP_ALCHEMY_BACKGROUND_TEXTURE_KEY).setDepth(-30);
    this.shade = this.add.graphics().setDepth(-20);
    this.cauldronGlow = this.add.circle(0, 0, 120, 0x5beed0, 0.1)
      .setStrokeStyle(5, 0xb8fff0, 0.45)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(5)
      .setVisible(false);
    this.alchemist = this.add.image(0, 0, SWAMP_ALCHEMIST_TEXTURE_KEY).setDepth(7).setOrigin(0.5, 0.62);
    this.workbench = this.add.image(0, 0, SWAMP_ALCHEMY_WORKBENCH_TEXTURE_KEY).setDepth(8).setOrigin(0.5, 0.62);
    this.liquid = this.add.ellipse(0, 0, 210, 78, 0x39d9e6, 0.92)
      .setStrokeStyle(5, 0xc9ffff, 0.8)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(10);
    this.liquidHighlight = this.add.ellipse(0, 0, 120, 24, 0xffffff, 0.24)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(11);
    this.cauldron = this.add.image(0, 0, SWAMP_ALCHEMY_CAULDRON_TEXTURE_KEY).setDepth(12).setOrigin(0.5, 0.56);
    this.ingredient = this.add.image(0, 0, getSwampAlchemyIngredientTextureKey(getCurrentSwampIngredient(this.run).id))
      .setDepth(18)
      .setInteractive({ cursor: 'grab' });
    if (!this.nativeTouchDrag) {
      this.input.setDraggable(this.ingredient);
    }
    this.spoon = this.add.image(0, 0, SWAMP_ALCHEMY_SPOON_TEXTURE_KEY)
      .setDepth(19)
      .setInteractive({ cursor: 'grab' })
      .setVisible(false);
    this.stirGuide = this.add.graphics().setDepth(17).setVisible(false);

    this.spoon.on('pointerdown', (pointer: Phaser.Input.Pointer) => this.beginStirring(pointer));
    this.input.on('drag', this.handleDrag);
    this.input.on('dragend', this.handleDragEnd);
    this.input.on('pointermove', this.handlePointerMove);
    this.input.on('pointerup', this.handlePointerUp);
    this.scale.on('resize', this.handleResize);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanup());

    this.layoutScene();
    this.attachNativeTouchDrag();
    this.createAmbientEffects();
    this.prepareCurrentIngredient();
    this.renderHud();
    this.cameras.main.fadeIn(420, 3, 13, 12);
  }

  private chooseAnswer(choice: number): void {
    if (!this.run || this.run.phase !== 'quiz' || this.inputLocked) return;
    this.inputLocked = true;
    const previousHp = this.run.roundChallenge.playerHp;
    this.run = answerSwampAlchemyQuestion(this.run, choice);
    const correct = this.run.roundChallenge.lastAnswerCorrect === true;

    if (!correct && this.run.roundChallenge.playerHp < previousHp) {
      this.progress.recordDamageTaken();
      if (this.run.settings.playMode === 'story') {
        if (this.run.phase === 'lost') this.hud.restartStoryModeAfterFailure();
        else this.progress.setStoryLives(this.run.roundChallenge.playerHp);
      }
      this.hud.flashSwampAlchemyHit();
      this.playWrongAnswerEffect();
    } else {
      this.playCorrectAnswerEffect();
    }

    this.renderHud();
    this.time.delayedCall(correct ? 520 : 680, () => {
      if (!this.run) return;
      if (this.run.phase === 'lost') {
        this.openFailure();
        return;
      }
      this.inputLocked = false;
      if (this.run.phase === 'ingredient') this.prepareCurrentIngredient(true);
      this.renderHud();
    });
  }

  private prepareCurrentIngredient(announce = false): void {
    if (!this.run || !this.ingredient) return;
    const definition = getCurrentSwampIngredient(this.run);
    const texture = getSwampAlchemyIngredientTextureKey(definition.id);
    this.ingredient
      .setTexture(texture)
      .setPosition(this.ingredientHomeX, this.ingredientHomeY)
      .setAlpha(1)
      .setAngle(0)
      .setVisible(true);
    this.setImageHeight(this.ingredient, this.getIngredientDisplayHeight(definition.id));
    if (this.ingredient.input) this.ingredient.input.enabled = this.run.phase === 'ingredient';
    this.spoon?.setVisible(false);
    this.stirGuide?.setVisible(false);
    this.setLiquidColor(definition.liquidColor, definition.accentColor);
    if (announce) {
      this.emitMagicBurst(this.ingredientHomeX, this.ingredientHomeY, definition.accentColor, 24);
      this.tweens.add({
        targets: this.ingredient,
        scale: this.ingredient.scaleX * 1.18,
        duration: 230,
        ease: 'Back.easeOut',
        yoyo: true
      });
    }
  }

  private acceptIngredient(): void {
    if (!this.run || this.run.phase !== 'ingredient' || !this.ingredient) return;
    this.inputLocked = true;
    if (this.ingredient.input) this.ingredient.input.enabled = false;
    const ingredient = getCurrentSwampIngredient(this.run);
    this.tweens.add({
      targets: this.ingredient,
      x: this.cauldronX,
      y: this.cauldronY - this.cauldronRadius * 0.12,
      scale: this.ingredient.scaleX * 0.34,
      angle: 28,
      alpha: 0.3,
      duration: 620,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        if (!this.run) return;
        this.ingredient?.setVisible(false);
        this.run = acceptSwampIngredient(this.run);
        this.emitMagicBurst(this.cauldronX, this.cauldronY, ingredient.accentColor, 42);
        this.cameras.main.flash(160, 82, 242, 186, false);
        this.inputLocked = false;
        this.prepareStirring();
        this.renderHud();
      }
    });
  }

  private returnIngredientHome(): void {
    if (!this.ingredient) return;
    this.inputLocked = true;
    this.tweens.add({
      targets: this.ingredient,
      x: this.ingredientHomeX,
      y: this.ingredientHomeY,
      angle: 0,
      duration: 320,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.inputLocked = false;
        this.renderHud('Ingrediensen må slippes midt i den lysende gryten.');
      }
    });
  }

  private prepareStirring(): void {
    this.spoon?.setVisible(true).setAlpha(1);
    this.stirGuide?.setVisible(true);
    this.stirProgress = createCircularStirState(
      this.cauldronX,
      this.cauldronY,
      this.cauldronRadius * 0.24,
      this.cauldronRadius * 1.22
    );
    this.drawStirProgress(0);
    this.returnSpoonHome(false);
  }

  private beginStirring(pointer: Phaser.Input.Pointer): void {
    if (this.inputLocked || this.run?.phase !== 'stirring' || !this.stirProgress) return;
    this.stirringActive = true;
    this.stirProgress = pauseCircularStirState(this.stirProgress);
    this.spoon?.setPosition(pointer.worldX, pointer.worldY);
  }

  private finishStirring(): void {
    if (!this.run || this.run.phase !== 'stirring') return;
    this.stirringActive = false;
    this.inputLocked = true;
    const ingredient = getCurrentSwampIngredient(this.run);
    this.stirGuide?.setVisible(false);
    this.emitMagicBurst(this.cauldronX, this.cauldronY, ingredient.accentColor, 58);
    this.emitSteamBurst(ingredient.accentColor);
    this.tweens.add({
      targets: [this.liquid, this.liquidHighlight],
      scaleX: 1.18,
      scaleY: 1.12,
      duration: 230,
      ease: 'Sine.easeOut',
      yoyo: true
    });
    this.cameras.main.flash(250, 82, 226, 170, false);
    this.run = completeSwampStirring(this.run);
    this.renderHud();
    this.time.delayedCall(760, () => {
      if (!this.run) return;
      if (this.run.phase === 'reward') {
        this.openReward();
        return;
      }
      this.inputLocked = false;
      this.prepareCurrentIngredient();
      this.renderHud();
    });
  }

  private drawStirProgress(progress: number): void {
    if (!this.stirGuide) return;
    this.stirGuide.clear();
    this.stirGuide.lineStyle(8 * this.renderScale, 0x0a1718, 0.72);
    this.stirGuide.strokeCircle(this.cauldronX, this.cauldronY, this.cauldronRadius * 0.86);
    this.stirGuide.lineStyle(8 * this.renderScale, 0x8effda, 0.92);
    this.stirGuide.beginPath();
    this.stirGuide.arc(
      this.cauldronX,
      this.cauldronY,
      this.cauldronRadius * 0.86,
      -Math.PI / 2,
      -Math.PI / 2 + Math.PI * 2 * progress
    );
    this.stirGuide.strokePath();
  }

  private returnSpoonHome(animate = true): void {
    if (!this.spoon) return;
    const targetX = this.cauldronX + this.cauldronRadius * 0.84;
    const targetY = this.cauldronY - this.cauldronRadius * 0.72;
    const apply = () => this.spoon?.setPosition(targetX, targetY).setAngle(35);
    if (!animate) {
      apply();
      return;
    }
    this.tweens.add({
      targets: this.spoon,
      x: targetX,
      y: targetY,
      angle: 35,
      duration: 260,
      ease: 'Quad.easeOut'
    });
  }

  private renderHud(messageOverride?: string): void {
    if (!this.run || this.run.phase === 'intro' || this.run.phase === 'reward' || this.run.phase === 'paid' || this.run.phase === 'lost') return;
    const challenge = this.run.roundChallenge;
    const ingredient = getCurrentSwampIngredient(this.run);
    const view: SwampAlchemyHudView = {
      phase: this.run.phase,
      roundIndex: this.run.roundIndex,
      roundCount: SWAMP_ALCHEMY_INGREDIENTS.length,
      completedIngredients: [...this.run.completedIngredients],
      playerHp: challenge.playerHp,
      maxPlayerHp: challenge.maxPlayerHp,
      ingredientId: ingredient.id,
      ingredientName: ingredient.displayName,
      ingredientAssetPath: ingredient.assetPath,
      roundCorrect: challenge.correct,
      requiredCorrect: challenge.requiredCorrect,
      prompt: challenge.question.prompt,
      choices: [...challenge.question.choices],
      message: messageOverride ?? this.run.message,
      inputLocked: this.inputLocked
    };
    this.hud.openSwampAlchemyHud(
      view,
      (answer) => this.chooseAnswer(answer),
      () => this.exitToMap(),
      () => this.completeQuizForDev()
    );
  }

  private completeQuizForDev(): void {
    if (!this.run || this.run.phase !== 'quiz' || this.inputLocked) return;
    let next = this.run;
    while (next.phase === 'quiz') {
      next = answerSwampAlchemyQuestion(next, next.roundChallenge.question.answer);
    }
    this.run = next;
    this.inputLocked = false;
    this.playCorrectAnswerEffect(true);
    this.prepareCurrentIngredient(true);
    this.renderHud();
  }

  private openReward(): void {
    if (!this.run) return;
    this.inputLocked = true;
    // The backpack icon is the destination for the shared Regnecoin flight.
    // It must be measurable while the reward overlay is open.
    this.hud.setWorldHudVisible(true);
    this.hud.openSwampAlchemyReward(this.run.rewardValue, () => this.exitToMap());
  }

  private openFailure(): void {
    const storyFailed = this.run?.settings.playMode === 'story';
    this.inputLocked = true;
    this.hud.openSwampAlchemyFailure(storyFailed, () => this.exitToMap(storyFailed));
  }

  private playCorrectAnswerEffect(strong = false): void {
    if (!this.ingredient || !this.run) return;
    const definition = getCurrentSwampIngredient(this.run);
    this.emitMagicBurst(this.ingredientHomeX, this.ingredientHomeY, definition.accentColor, strong ? 34 : 14);
    this.tweens.add({
      targets: this.ingredient,
      angle: { from: -4, to: 4 },
      duration: 90,
      yoyo: true,
      repeat: strong ? 3 : 1,
      onComplete: () => this.ingredient?.setAngle(0)
    });
  }

  private playWrongAnswerEffect(): void {
    this.cameras.main.shake(240, 0.006, true);
    this.cameras.main.flash(120, 120, 15, 22, false);
    if (this.alchemist) {
      this.tweens.add({
        targets: this.alchemist,
        x: this.alchemist.x - 8 * this.renderScale,
        duration: 75,
        yoyo: true,
        repeat: 2
      });
    }
  }

  private setLiquidColor(color: number, accent: number): void {
    this.liquid?.setFillStyle(color, 0.88).setStrokeStyle(5 * this.renderScale, accent, 0.82);
    this.cauldronGlow?.setFillStyle(color, 0.11).setStrokeStyle(5 * this.renderScale, accent, 0.38);
  }

  private createAmbientEffects(): void {
    const counts = FX_COUNTS[getStoredTallvokterFxLevel()];
    for (let index = 0; index < counts.motes; index += 1) {
      const mote = this.add.circle(0, 0, Phaser.Math.Between(2, 5) * this.renderScale, index % 3 === 0 ? 0xffe680 : 0x71f6c7, 0.34)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(3);
      mote.setPosition(
        this.scale.width * (0.1 + ((index * 0.173) % 0.8)),
        this.scale.height * (0.22 + ((index * 0.127) % 0.62))
      );
      this.ambientMotes.push(mote);
      this.tweens.add({
        targets: mote,
        y: `-=${Phaser.Math.Between(80, 190) * this.renderScale}`,
        x: `+=${Phaser.Math.Between(-50, 50) * this.renderScale}`,
        alpha: { from: 0.08, to: 0.62 },
        duration: Phaser.Math.Between(2600, 5200),
        delay: Phaser.Math.Between(0, 2200),
        ease: 'Sine.inOut',
        yoyo: true,
        repeat: -1
      });
    }
    for (let index = 0; index < counts.steam; index += 1) {
      const wisp = this.add.circle(0, 0, Phaser.Math.Between(13, 28) * this.renderScale, 0xb9ffe9, 0.1)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(14);
      wisp.setPosition(
        this.cauldronX + ((index % 4) - 1.5) * 28 * this.renderScale,
        this.cauldronY - (index % 3) * 12 * this.renderScale
      );
      this.steamWisps.push(wisp);
      this.tweens.add({
        targets: wisp,
        y: `-=${Phaser.Math.Between(90, 170) * this.renderScale}`,
        x: `+=${Phaser.Math.Between(-45, 45) * this.renderScale}`,
        scale: { from: 0.4, to: 1.7 },
        alpha: { from: 0.16, to: 0 },
        duration: Phaser.Math.Between(1800, 3200),
        delay: Phaser.Math.Between(0, 1800),
        repeat: -1
      });
    }
  }

  private emitMagicBurst(x: number, y: number, color: number, requestedCount: number): void {
    const level = getStoredTallvokterFxLevel();
    if (level === 'off') return;
    const multiplier = level === 'low' ? 0.45 : level === 'standard' ? 0.7 : level === 'high' ? 1 : 1.35;
    const count = Math.max(4, Math.round(requestedCount * multiplier));
    for (let index = 0; index < count; index += 1) {
      const spark = this.add.circle(x, y, Phaser.Math.Between(2, 6) * this.renderScale, index % 5 === 0 ? 0xffffff : color, 0.95)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(30);
      const angle = Phaser.Math.FloatBetween(-Math.PI, Math.PI);
      const distance = Phaser.Math.Between(55, 185) * this.renderScale;
      this.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        scale: 0.1,
        alpha: 0,
        duration: Phaser.Math.Between(480, 920),
        ease: 'Cubic.easeOut',
        onComplete: () => spark.destroy()
      });
    }
  }

  private emitSteamBurst(color: number): void {
    if (getStoredTallvokterFxLevel() === 'off') return;
    for (let index = 0; index < 10; index += 1) {
      const steam = this.add.circle(
        this.cauldronX + Phaser.Math.Between(-65, 65) * this.renderScale,
        this.cauldronY,
        Phaser.Math.Between(18, 38) * this.renderScale,
        color,
        0.2
      ).setBlendMode(Phaser.BlendModes.ADD).setDepth(22);
      this.tweens.add({
        targets: steam,
        x: steam.x + Phaser.Math.Between(-65, 65) * this.renderScale,
        y: steam.y - Phaser.Math.Between(120, 240) * this.renderScale,
        scale: Phaser.Math.FloatBetween(1.4, 2.4),
        alpha: 0,
        duration: Phaser.Math.Between(900, 1550),
        ease: 'Sine.easeOut',
        onComplete: () => steam.destroy()
      });
    }
  }

  private layoutScene(): void {
    if (
      !this.run || !this.background || !this.cauldron || !this.workbench || !this.alchemist
      || !this.ingredient || !this.spoon || !this.cauldronGlow || !this.liquid
      || !this.liquidHighlight
    ) return;
    const width = this.scale.width;
    const height = this.scale.height;
    const backgroundSource = this.textures.get(SWAMP_ALCHEMY_BACKGROUND_TEXTURE_KEY).getSourceImage() as HTMLImageElement;
    const coverScale = Math.max(width / backgroundSource.width, height / backgroundSource.height);
    this.background.setPosition(width / 2, height / 2).setDisplaySize(
      backgroundSource.width * coverScale,
      backgroundSource.height * coverScale
    );

    this.shade?.clear();
    this.shade?.fillGradientStyle(0x03100f, 0x03100f, 0x071616, 0x071616, 0.55, 0.55, 0.18, 0.18);
    this.shade?.fillRect(0, 0, width, height);
    this.shade?.fillStyle(0x020607, 0.46);
    this.shade?.fillRect(0, 0, width, Math.min(height * 0.16, 130 * this.renderScale));

    const compact = width / height < 1.35;
    this.cauldronX = width * (compact ? 0.52 : 0.51);
    this.cauldronY = height * (compact ? 0.59 : 0.62);
    this.cauldronRadius = Math.min(height * 0.16, width * 0.105, 155 * this.renderScale);
    this.ingredientHomeX = width * (compact ? 0.78 : 0.80);
    this.ingredientHomeY = height * (compact ? 0.50 : 0.56);

    this.setImageHeight(this.alchemist, Math.min(height * 0.58, 610 * this.renderScale));
    this.alchemist.setPosition(width * (compact ? 0.18 : 0.20), height * 0.58);
    this.setImageHeight(this.workbench, Math.min(height * 0.33, 320 * this.renderScale));
    this.workbench.setPosition(width * (compact ? 0.80 : 0.81), height * 0.67);
    this.setImageHeight(this.cauldron, this.cauldronRadius * 2.5);
    this.cauldron.setPosition(this.cauldronX, this.cauldronY + this.cauldronRadius * 0.22);
    this.cauldronGlow.setPosition(this.cauldronX, this.cauldronY).setRadius(this.cauldronRadius * 1.08)
      .setStrokeStyle(5 * this.renderScale, getCurrentSwampIngredient(this.run!).accentColor, 0.38);
    this.liquid.setPosition(this.cauldronX, this.cauldronY - this.cauldronRadius * 0.08)
      .setSize(this.cauldronRadius * 1.54, this.cauldronRadius * 0.48)
      .setDisplaySize(this.cauldronRadius * 1.54, this.cauldronRadius * 0.48);
    this.liquidHighlight.setPosition(this.cauldronX, this.cauldronY - this.cauldronRadius * 0.14)
      .setSize(this.cauldronRadius * 0.82, this.cauldronRadius * 0.16)
      .setDisplaySize(this.cauldronRadius * 0.82, this.cauldronRadius * 0.16);
    this.setImageHeight(
      this.ingredient,
      this.getIngredientDisplayHeight(getCurrentSwampIngredient(this.run).id)
    );
    if (this.run?.phase !== 'ingredient' || !this.input.activePointer.isDown) {
      this.ingredient.setPosition(this.ingredientHomeX, this.ingredientHomeY);
    }
    this.setImageHeight(this.spoon, Math.min(170 * this.renderScale, height * 0.19));
    this.stirProgress = this.stirProgress
      ? reframeCircularStirState(
          this.stirProgress,
          this.cauldronX,
          this.cauldronY,
          this.cauldronRadius * 0.24,
          this.cauldronRadius * 1.22
        )
      : createCircularStirState(
          this.cauldronX,
          this.cauldronY,
          this.cauldronRadius * 0.24,
          this.cauldronRadius * 1.22
        );
    if (this.run?.phase === 'stirring') {
      if (!this.stirringActive) {
        this.returnSpoonHome(false);
      }
      this.drawStirProgress(getCircularStirProgress(this.stirProgress));
    }

    this.ambientMotes.forEach((mote, index) => {
      mote.setPosition(
        width * (0.1 + ((index * 0.173) % 0.8)),
        height * (0.22 + ((index * 0.127) % 0.62))
      );
    });
    this.steamWisps.forEach((wisp, index) => {
      wisp.setPosition(
        this.cauldronX + ((index % 4) - 1.5) * 28 * this.renderScale,
        this.cauldronY - (index % 3) * 12 * this.renderScale
      );
    });
  }

  private setImageHeight(image: Phaser.GameObjects.Image, height: number): void {
    const source = this.textures.get(image.texture.key).getSourceImage() as HTMLImageElement;
    image.setDisplaySize(height * (source.width / source.height), height);
  }

  private getIngredientDisplayHeight(id: string): number {
    void id;
    return Math.min(148 * this.renderScale, this.scale.height * 0.17);
  }

  private attachNativeTouchDrag(): void {
    if (!this.nativeTouchDrag || !this.game.canvas) return;
    this.touchInputCanvas = this.game.canvas;
    this.touchInputCanvas.addEventListener(
      'touchstart',
      this.handleIngredientTouchStart,
      this.touchListenerOptions
    );
    window.addEventListener('touchmove', this.handleIngredientTouchMove, this.touchListenerOptions);
    window.addEventListener('touchend', this.handleIngredientTouchEnd, this.touchListenerOptions);
    window.addEventListener('touchcancel', this.handleIngredientTouchCancel, this.touchListenerOptions);
  }

  private detachNativeTouchDrag(): void {
    this.touchInputCanvas?.removeEventListener(
      'touchstart',
      this.handleIngredientTouchStart,
      this.touchListenerOptions
    );
    window.removeEventListener('touchmove', this.handleIngredientTouchMove, this.touchListenerOptions);
    window.removeEventListener('touchend', this.handleIngredientTouchEnd, this.touchListenerOptions);
    window.removeEventListener('touchcancel', this.handleIngredientTouchCancel, this.touchListenerOptions);
    this.touchInputCanvas = undefined;
    this.activeIngredientTouchId = undefined;
    this.activeStirringTouchId = undefined;
  }

  private findTouchById(touches: TouchList, id: number): Touch | undefined {
    for (let index = 0; index < touches.length; index += 1) {
      const touch = touches.item(index);
      if (touch?.identifier === id) return touch;
    }
    return undefined;
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

  private exitToMap(resetToProgress = false): void {
    if (this.leaving) return;
    this.leaving = true;
    this.hud.closeSwampAlchemyUi();
    const worldScene = this.scene.get('WorldScene') as WorldSceneSwampBridge;
    worldScene.resumeFromSwampAlchemy(resetToProgress);
    this.scene.resume('WorldScene');
    if (resetToProgress) {
      this.hud.completeStoryModeRestartAfterReturn();
    }
    this.scene.stop();
  }

  private cleanup(): void {
    this.detachNativeTouchDrag();
    this.scale.off('resize', this.handleResize);
    this.input.off('drag', this.handleDrag);
    this.input.off('dragend', this.handleDragEnd);
    this.input.off('pointermove', this.handlePointerMove);
    this.input.off('pointerup', this.handlePointerUp);
    this.tweens.killAll();
    this.hud.hideSwampAlchemyHud();
  }
}
