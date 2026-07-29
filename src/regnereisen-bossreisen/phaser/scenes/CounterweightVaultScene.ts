import Phaser from 'phaser';
import {
  COUNTERWEIGHT_VAULT_LOCK_COUNT,
  VAULT_BALANCE_BASE_ASSET_PATH,
  VAULT_BALANCE_BASE_TEXTURE_KEY,
  VAULT_BALANCE_BEAM_ASSET_PATH,
  VAULT_BALANCE_BEAM_TEXTURE_KEY,
  VAULT_BACKGROUND_ASSET_PATH,
  VAULT_BACKGROUND_TEXTURE_KEY,
  VAULT_LEVER_50_ASSET_PATH,
  VAULT_LEVER_50_TEXTURE_KEY,
  VAULT_LEVER_60_ASSET_PATH,
  VAULT_LEVER_60_TEXTURE_KEY,
  VAULT_LEVER_70_ASSET_PATH,
  VAULT_LEVER_70_TEXTURE_KEY,
  VAULT_LEVER_80_ASSET_PATH,
  VAULT_LEVER_80_TEXTURE_KEY,
  VAULT_LEVER_ASSET_PATH,
  VAULT_LEVER_TEXTURE_KEY,
  VAULT_RUNE_STONE_ASSET_PATH,
  VAULT_RUNE_STONE_TEXTURE_KEY
} from '../../game/content/counterweightVault';
import type { ProgressStore } from '../../game/simulation/progress';
import {
  answerCounterweightQuestion,
  checkCounterweightBalance,
  continueCounterweightQuestion,
  continueCounterweightVault,
  createCounterweightVault,
  getPlacedCounterweightSum,
  setCounterweightStonePlaced,
  startCounterweightVault,
  type CounterweightStone,
  type CounterweightVaultState
} from '../../game/simulation/counterweightVaultQuest';
import type { HudController } from '../../ui/hud';

type WorldSceneVaultBridge = Phaser.Scene & {
  confirmCounterweightVaultReady: () => void;
  resumeFromCounterweightVault: (resetToProgress?: boolean) => void;
};

type AnswerView = {
  container: Phaser.GameObjects.Container;
  stone: Phaser.GameObjects.Image;
  label: Phaser.GameObjects.Text;
  answer?: number;
};

type StoneView = {
  container: Phaser.GameObjects.Container;
  stone: Phaser.GameObjects.Image;
  label: Phaser.GameObjects.Text;
  definition?: CounterweightStone;
  shelfX: number;
  shelfY: number;
};

const BLUE = 0x4bc9ff;
const SUCCESS = 0x72ffb5;
const DANGER = 0xff536b;

function isLocalDev(): boolean {
  return import.meta.env.DEV
    && (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost');
}

export class CounterweightVaultScene extends Phaser.Scene {
  private run?: CounterweightVaultState;
  private background?: Phaser.GameObjects.Image;
  private shade?: Phaser.GameObjects.Rectangle;
  private topPanel?: Phaser.GameObjects.Graphics;
  private lockLabel?: Phaser.GameObjects.Text;
  private prompt?: Phaser.GameObjects.Text;
  private message?: Phaser.GameObjects.Text;
  private hearts?: Phaser.GameObjects.Container;
  private heartIcons: Phaser.GameObjects.Text[] = [];
  private lockSeals: Phaser.GameObjects.Arc[] = [];
  private answerViews: AnswerView[] = [];
  private stoneViews: StoneView[] = [];
  private scaleGraphics?: Phaser.GameObjects.Graphics;
  private balanceBase?: Phaser.GameObjects.Image;
  private balanceBeam?: Phaser.GameObjects.Image;
  private targetCrystal?: Phaser.GameObjects.Container;
  private targetWeightImage?: Phaser.GameObjects.Image;
  private targetText?: Phaser.GameObjects.Text;
  private lever?: Phaser.GameObjects.Container;
  private leverImage?: Phaser.GameObjects.Image;
  private leverDisplayWidth = 0;
  private leverDisplayHeight = 0;
  private leverAnimationToken = 0;
  private panZone?: Phaser.GameObjects.Zone;
  private exitButton?: Phaser.GameObjects.Container;
  private devButton?: Phaser.GameObjects.Container;
  private inputLocked = true;
  private leaving = false;
  private animationEpoch = 0;
  private readonly resizeHandler = (): void => this.layoutScene();

  constructor(
    private readonly progress: ProgressStore,
    private readonly hud: HudController,
    private readonly renderScale: number
  ) {
    super({ key: 'CounterweightVaultScene' });
  }

  preload(): void {
    if (!this.textures.exists(VAULT_BACKGROUND_TEXTURE_KEY)) {
      this.load.image(VAULT_BACKGROUND_TEXTURE_KEY, VAULT_BACKGROUND_ASSET_PATH);
    }
    if (!this.textures.exists(VAULT_RUNE_STONE_TEXTURE_KEY)) {
      this.load.image(VAULT_RUNE_STONE_TEXTURE_KEY, VAULT_RUNE_STONE_ASSET_PATH);
    }
    if (!this.textures.exists(VAULT_BALANCE_BASE_TEXTURE_KEY)) {
      this.load.image(VAULT_BALANCE_BASE_TEXTURE_KEY, VAULT_BALANCE_BASE_ASSET_PATH);
    }
    if (!this.textures.exists(VAULT_BALANCE_BEAM_TEXTURE_KEY)) {
      this.load.image(VAULT_BALANCE_BEAM_TEXTURE_KEY, VAULT_BALANCE_BEAM_ASSET_PATH);
    }
    if (!this.textures.exists(VAULT_LEVER_TEXTURE_KEY)) {
      this.load.image(VAULT_LEVER_TEXTURE_KEY, VAULT_LEVER_ASSET_PATH);
    }
    if (!this.textures.exists(VAULT_LEVER_80_TEXTURE_KEY)) {
      this.load.image(VAULT_LEVER_80_TEXTURE_KEY, VAULT_LEVER_80_ASSET_PATH);
    }
    if (!this.textures.exists(VAULT_LEVER_70_TEXTURE_KEY)) {
      this.load.image(VAULT_LEVER_70_TEXTURE_KEY, VAULT_LEVER_70_ASSET_PATH);
    }
    if (!this.textures.exists(VAULT_LEVER_60_TEXTURE_KEY)) {
      this.load.image(VAULT_LEVER_60_TEXTURE_KEY, VAULT_LEVER_60_ASSET_PATH);
    }
    if (!this.textures.exists(VAULT_LEVER_50_TEXTURE_KEY)) {
      this.load.image(VAULT_LEVER_50_TEXTURE_KEY, VAULT_LEVER_50_ASSET_PATH);
    }
  }

  create(): void {
    this.leaving = false;
    this.inputLocked = true;
    this.input.enabled = true;
    this.animationEpoch = 0;
    this.lockSeals = [];
    this.answerViews = [];
    this.stoneViews = [];
    this.heartIcons = [];
    this.run = startCounterweightVault(createCounterweightVault(
      this.progress.getSettings(),
      this.progress.getBattleHearts()
    ));

    this.cameras.main.setBackgroundColor('#020610');
    this.background = this.add.image(0, 0, VAULT_BACKGROUND_TEXTURE_KEY).setDepth(-20);
    this.shade = this.add.rectangle(0, 0, 10, 10, 0x020715, 0.12).setOrigin(0).setDepth(-15);
    this.topPanel = this.add.graphics().setDepth(50);
    this.scaleGraphics = this.add.graphics().setDepth(8);
    this.balanceBase = this.add.image(0, 0, VAULT_BALANCE_BASE_TEXTURE_KEY)
      .setOrigin(0.5, 0.145)
      .setDepth(10);
    this.balanceBeam = this.add.image(0, 0, VAULT_BALANCE_BEAM_TEXTURE_KEY)
      .setOrigin(0.5, 0.2)
      .setDepth(12);

    this.lockLabel = this.add.text(0, 0, '', this.textStyle(16, '#76ddff'))
      .setOrigin(0, 0.5).setDepth(55);
    this.prompt = this.add.text(0, 0, '', this.textStyle(31, '#fff5cf'))
      .setOrigin(0.5).setDepth(55).setAlign('center');
    this.message = this.add.text(0, 0, '', this.textStyle(15, '#d8e8f4'))
      .setOrigin(0.5).setDepth(55).setAlign('center');
    this.hearts = this.add.container(0, 0).setDepth(55);
    for (let index = 0; index < this.run.challenge.maxPlayerHp; index += 1) {
      const heart = this.add.text(
        index * 26 * this.renderScale,
        0,
        '❤️',
        this.textStyle(20, '#ff4f70')
      ).setOrigin(0.5);
      this.hearts.add(heart);
      this.heartIcons.push(heart);
    }

    for (let index = 0; index < COUNTERWEIGHT_VAULT_LOCK_COUNT; index += 1) {
      const seal = this.add.circle(0, 0, 13 * this.renderScale, 0x10283d, 0.92)
        .setStrokeStyle(3 * this.renderScale, BLUE, 0.72)
        .setDepth(56);
      this.lockSeals.push(seal);
    }

    this.createAnswerViews();
    this.createStoneViews();
    this.createTargetCrystal();
    this.createLever();
    this.exitButton = this.createButton('Avslutt', () => this.exitToMap(), 100);
    if (isLocalDev()) {
      this.devButton = this.createButton('Test seier', () => this.completeForDev(), 100);
    }

    this.scale.on('resize', this.resizeHandler);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanup());
    this.layoutScene();
    this.renderPhase();
    this.cameras.main.fadeIn(360, 2, 6, 14);

    const world = this.scene.get('WorldScene') as WorldSceneVaultBridge;
    world.confirmCounterweightVaultReady();
  }

  private createAnswerViews(): void {
    for (let index = 0; index < 4; index += 1) {
      const stone = this.add.image(0, 0, VAULT_RUNE_STONE_TEXTURE_KEY).setOrigin(0.5);
      const label = this.add.text(0, 4 * this.renderScale, '', this.textStyle(34, '#ffffff'))
        .setOrigin(0.5)
        .setStroke('#07101b', 8 * this.renderScale);
      const container = this.add.container(0, 0, [stone, label])
        .setDepth(20)
        .setSize(150 * this.renderScale, 125 * this.renderScale)
        .setInteractive({ useHandCursor: true });
      container.on('pointerover', () => {
        if (!this.inputLocked) container.setScale(1.06);
      });
      container.on('pointerout', () => container.setScale(1));
      container.on('pointerdown', () => this.chooseAnswer(index));
      this.answerViews.push({ container, stone, label });
    }
  }

  private createStoneViews(): void {
    for (let index = 0; index < 6; index += 1) {
      const stone = this.add.image(0, 0, VAULT_RUNE_STONE_TEXTURE_KEY).setOrigin(0.5);
      const label = this.add.text(0, 2 * this.renderScale, '', this.textStyle(25, '#ffffff'))
        .setOrigin(0.5)
        .setStroke('#07101b', 6 * this.renderScale);
      const container = this.add.container(0, 0, [stone, label])
        .setDepth(24)
        .setSize(88 * this.renderScale, 82 * this.renderScale)
        .setInteractive({ useHandCursor: true });
      this.input.setDraggable(container);
      container.on('dragstart', () => {
        if (this.inputLocked || !this.run || this.run.phase !== 'balance') return;
        container.setDepth(60).setScale(1.08);
      });
      container.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
        if (this.inputLocked || !this.run || this.run.phase !== 'balance') return;
        container.setPosition(dragX, dragY);
      });
      container.on('dragend', () => this.finishStoneDrag(index));
      this.stoneViews.push({
        container,
        stone,
        label,
        shelfX: 0,
        shelfY: 0
      });
    }
  }

  private createTargetCrystal(): void {
    this.targetWeightImage = this.add.image(0, 0, VAULT_RUNE_STONE_TEXTURE_KEY)
      .setOrigin(0.5);
    this.targetText = this.add.text(0, 2 * this.renderScale, '', this.textStyle(25, '#ffffff'))
      .setOrigin(0.5)
      .setStroke('#07101b', 6 * this.renderScale);
    this.targetCrystal = this.add.container(
      0,
      0,
      [this.targetWeightImage, this.targetText]
    ).setDepth(18);
  }

  private createLever(): void {
    const hitWidth = 210 * this.renderScale;
    const hitHeight = 270 * this.renderScale;
    this.leverImage = this.add.image(0, 0, VAULT_LEVER_TEXTURE_KEY).setOrigin(0.5);
    this.lever = this.add.container(0, 0, [this.leverImage])
      .setDepth(30)
      .setSize(hitWidth, hitHeight)
      .setInteractive(
        new Phaser.Geom.Rectangle(-hitWidth / 2, -hitHeight / 2, hitWidth, hitHeight),
        Phaser.Geom.Rectangle.Contains
      );
    if (this.lever.input) this.lever.input.cursor = 'pointer';
    this.lever.on('pointerover', () => {
      if (!this.inputLocked) this.lever?.setScale(1.05);
    });
    this.lever.on('pointerout', () => this.lever?.setScale(1));
    this.lever.on('pointerdown', () => this.pullLever());
    this.drawLever(-28);
  }

  private createButton(
    label: string,
    onClick: () => void,
    depth: number
  ): Phaser.GameObjects.Container {
    const buttonWidth = label === 'Test seier' ? 124 : 112;
    const buttonHeight = 44 * this.renderScale;
    const scaledWidth = buttonWidth * this.renderScale;
    const background = this.add.graphics();
    background.fillStyle(0xf7f3e8, 0.97);
    background.fillRoundedRect(
      -scaledWidth / 2,
      -buttonHeight / 2,
      scaledWidth,
      buttonHeight,
      12 * this.renderScale
    );
    background.lineStyle(2 * this.renderScale, 0xffffff, 0.92);
    background.strokeRoundedRect(
      -scaledWidth / 2,
      -buttonHeight / 2,
      scaledWidth,
      buttonHeight,
      12 * this.renderScale
    );
    const text = this.add.text(0, 0, label, this.textStyle(15, '#102037')).setOrigin(0.5);
    const button = this.add.container(0, 0, [background, text])
      .setDepth(depth)
      .setSize(scaledWidth, buttonHeight)
      .setInteractive({ useHandCursor: true });
    button.on('pointerover', () => button.setScale(1.04));
    button.on('pointerout', () => button.setScale(1));
    button.on('pointerdown', onClick);
    return button;
  }

  private textStyle(size: number, color: string): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: `${size * this.renderScale}px`,
      color
    };
  }

  private chooseAnswer(index: number): void {
    if (this.inputLocked || !this.run || this.run.phase !== 'question') return;
    const answer = this.answerViews[index]?.answer;
    if (answer === undefined) return;
    this.inputLocked = true;
    const previousHp = this.run.challenge.playerHp;
    this.run = answerCounterweightQuestion(this.run, answer);
    if (this.run.settings.playMode === 'story' && this.run.challenge.playerHp !== previousHp) {
      this.progress.setStoryLives(this.run.challenge.playerHp);
    }
    const correct = this.run.challenge.lastAnswerCorrect === true;
    this.animateAnswer(this.answerViews[index], correct);
    if (!correct) this.playHitEffect();
    this.renderHeader();
    const epoch = ++this.animationEpoch;
    this.time.delayedCall(correct ? 520 : 620, () => {
      if (this.leaving || epoch !== this.animationEpoch || !this.run) return;
      if (this.run.phase === 'lost') {
        if (this.run.settings.playMode === 'story') {
          this.hud.restartStoryModeAfterFailure();
        }
        this.openFailure();
        return;
      }
      if (this.run.phase === 'correct' || this.run.phase === 'wrong') {
        this.run = continueCounterweightQuestion(this.run);
      }
      this.inputLocked = false;
      this.renderPhase();
    });
  }

  private animateAnswer(view: AnswerView, correct: boolean): void {
    view.stone.setTint(correct ? SUCCESS : DANGER);
    this.tweens.add({
      targets: view.container,
      scale: correct ? 1.14 : 0.94,
      angle: correct ? 0 : { from: -5, to: 5 },
      duration: correct ? 240 : 65,
      yoyo: true,
      repeat: correct ? 0 : 4,
      ease: 'Sine.inOut',
      onComplete: () => {
        view.container.setScale(1).setAngle(0);
        view.stone.clearTint();
      }
    });
    this.emitBurst(view.container.x, view.container.y, correct ? SUCCESS : DANGER, correct ? 22 : 12);
  }

  private finishStoneDrag(index: number): void {
    const view = this.stoneViews[index];
    if (!this.run || !view.definition) return;
    const overPan = this.panZone
      ? Phaser.Geom.Rectangle.Contains(
          this.panZone.getBounds(),
          view.container.x,
          view.container.y
        )
      : false;
    this.run = setCounterweightStonePlaced(this.run, view.definition.id, overPan);
    view.container.setDepth(24).setScale(1);
    this.layoutStones(true);
    this.drawScale();
    this.renderHeader();
  }

  private pullLever(): void {
    if (this.inputLocked || !this.run || this.run.phase !== 'balance') return;
    this.inputLocked = true;
    this.playLeverPullAnimation();
    const previousHp = this.run.challenge.playerHp;
    this.run = checkCounterweightBalance(this.run);
    if (this.run.settings.playMode === 'story' && this.run.challenge.playerHp !== previousHp) {
      this.progress.setStoryLives(this.run.challenge.playerHp);
    }
    this.drawScale();
    this.renderHeader();
    const success = this.run.phase === 'unlocking';
    if (success) {
      this.playUnlockAnimation();
    } else {
      this.playHitEffect();
      this.layoutStones(true);
      const epoch = ++this.animationEpoch;
      this.time.delayedCall(720, () => {
        if (this.leaving || epoch !== this.animationEpoch || !this.run) return;
        this.drawLever(-28);
        if (this.run.phase === 'lost') {
          if (this.run.settings.playMode === 'story') {
            this.hud.restartStoryModeAfterFailure();
          }
          this.openFailure();
          return;
        }
        this.run = { ...this.run, phase: 'balance' };
        this.inputLocked = false;
        this.renderPhase();
      });
    }
  }

  private playUnlockAnimation(): void {
    if (!this.run) return;
    const epoch = ++this.animationEpoch;
    const seal = this.lockSeals[this.run.lockIndex];
    seal.setFillStyle(SUCCESS, 0.92).setStrokeStyle(5 * this.renderScale, 0xffffff, 1);
    this.emitBurst(seal.x, seal.y, SUCCESS, 36);
    this.cameras.main.flash(160, 100, 220, 255, false);
    this.tweens.add({
      targets: [seal, this.balanceBeam],
      alpha: { from: 0.7, to: 1 },
      duration: 180,
      yoyo: true,
      repeat: 2
    });
    this.time.delayedCall(900, () => {
      if (this.leaving || epoch !== this.animationEpoch || !this.run) return;
      this.run = continueCounterweightVault(this.run);
      this.drawLever(-28);
      if (this.run.phase === 'reward') {
        this.openReward();
        return;
      }
      this.inputLocked = false;
      this.renderPhase();
    });
  }

  private renderPhase(): void {
    if (!this.run) return;
    const questionVisible = this.run.phase === 'question';
    const balanceVisible = this.run.phase === 'balance' || this.run.phase === 'balance-wrong';
    this.answerViews.forEach((view) => view.container.setVisible(questionVisible));
    this.stoneViews.forEach((view) => view.container.setVisible(balanceVisible && Boolean(view.definition)));
    this.scaleGraphics?.setVisible(balanceVisible);
    this.balanceBase?.setVisible(balanceVisible);
    this.balanceBeam?.setVisible(balanceVisible);
    this.targetCrystal?.setVisible(balanceVisible);
    this.lever?.setVisible(balanceVisible);
    this.panZone?.setActive(balanceVisible);

    if (questionVisible) {
      const choices = this.run.challenge.question.choices;
      this.answerViews.forEach((view, index) => {
        view.answer = choices[index];
        view.label.setText(String(choices[index]));
      });
      this.inputLocked = false;
    }
    if (balanceVisible) {
      this.assignStoneDefinitions();
      this.layoutStones(false);
      this.drawScale();
      this.inputLocked = false;
    }
    this.renderHeader();
  }

  private assignStoneDefinitions(): void {
    if (!this.run) return;
    this.stoneViews.forEach((view, index) => {
      view.definition = this.run!.stones[index];
      view.container.setVisible(Boolean(view.definition));
      view.label.setText(view.definition ? String(view.definition.value) : '');
    });
  }

  private renderHeader(): void {
    if (!this.run) return;
    const current = this.run.lockIndex + 1;
    this.lockLabel?.setText(`MOTVEKTHVELVET · LÅS ${current} AV ${COUNTERWEIGHT_VAULT_LOCK_COUNT}`);
    this.heartIcons.forEach((heart, index) => {
      const live = index < this.run!.challenge.playerHp;
      heart.setText(live ? '❤️' : '♡').setAlpha(live ? 1 : 0.3);
      if (!live) heart.setColor('#778694');
    });
    if (this.run.phase === 'question') {
      this.prompt?.setText(this.run.challenge.question.prompt);
    } else if (this.run.phase === 'balance' || this.run.phase === 'balance-wrong') {
      this.prompt?.setText(`Balanser motvekten til ${this.run.challenge.stop.targetWeight}`);
    } else if (this.run.phase === 'unlocking') {
      this.prompt?.setText(`Lås ${current} åpnes`);
    }
    this.message?.setText(this.run.message);
    this.lockSeals.forEach((seal, index) => {
      const unlocked = index < this.run!.unlockedLocks || this.run!.phase === 'reward';
      seal.setFillStyle(unlocked ? SUCCESS : index === this.run!.lockIndex ? BLUE : 0x10283d, unlocked ? 0.9 : 0.72);
      seal.setStrokeStyle(
        (unlocked ? 4 : 2.5) * this.renderScale,
        unlocked ? 0xffffff : index === this.run!.lockIndex ? 0xc8f4ff : 0x4f687a,
        unlocked ? 0.94 : 0.72
      );
    });
  }

  private drawScale(): void {
    if (!this.scaleGraphics || !this.balanceBase || !this.balanceBeam || !this.run) return;
    const width = this.scale.width;
    const height = this.scale.height;
    const panelBottom = 142 * this.renderScale;
    const usableHeight = Math.max(360 * this.renderScale, height - panelBottom - 98 * this.renderScale);
    const cx = width * 0.48;
    const beamY = panelBottom + usableHeight * 0.39;
    const sum = getPlacedCounterweightSum(this.run);
    const target = this.run.challenge.stop.targetWeight;
    const tiltDegrees = Phaser.Math.Clamp(
      ((target - sum) / Math.max(target, 1)) * 13,
      -7,
      7
    );
    const angle = Phaser.Math.DegToRad(tiltDegrees);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const beamWidth = Math.min(width * 0.64, 940 * this.renderScale);
    const beamHeight = beamWidth * (724 / 2172);
    const baseWidth = Math.min(width * 0.34, 510 * this.renderScale);
    const baseHeight = baseWidth * (941 / 1672);
    const localPanX = beamWidth * 0.34;
    const localPanY = beamHeight * 0.57;
    const leftX = cx + (-localPanX * cos - localPanY * sin);
    const leftY = beamY + (-localPanX * sin + localPanY * cos);
    const rightX = cx + (localPanX * cos - localPanY * sin);
    const rightY = beamY + (localPanX * sin + localPanY * cos);

    this.scaleGraphics.clear();
    this.scaleGraphics.fillStyle(0x061222, 0.55);
    this.scaleGraphics.fillEllipse(
      cx,
      beamY + baseHeight * 0.78,
      baseWidth * 1.12,
      baseHeight * 0.28
    );
    this.scaleGraphics.fillStyle(BLUE, 0.12);
    this.scaleGraphics.fillEllipse(
      cx,
      beamY + baseHeight * 0.7,
      baseWidth * 0.72,
      baseHeight * 0.2
    );

    this.balanceBase
      .setPosition(cx, beamY)
      .setDisplaySize(baseWidth, baseHeight);
    this.balanceBeam
      .setPosition(cx, beamY)
      .setDisplaySize(beamWidth, beamHeight)
      .setAngle(tiltDegrees);

    const targetSize = Phaser.Math.Clamp(
      beamWidth * 0.086,
      72 * this.renderScale,
      92 * this.renderScale
    );
    this.targetWeightImage?.setDisplaySize(targetSize, targetSize);
    this.targetText
      ?.setText(String(target))
      .setFontSize(targetSize * 0.32);
    this.targetCrystal
      ?.setPosition(rightX, rightY - 28 * this.renderScale)
      .setScale(1);
    if (!this.panZone) {
      this.panZone = this.add.zone(leftX, leftY, 190 * this.renderScale, 118 * this.renderScale)
        .setDepth(5);
    }
    this.panZone
      .setPosition(leftX, leftY - 20 * this.renderScale)
      .setSize(beamWidth * 0.24, beamHeight * 0.44);
    this.layoutPlacedStones(leftX, leftY - 18 * this.renderScale);
  }

  private layoutStones(animated: boolean): void {
    if (!this.run) return;
    const width = this.scale.width;
    const height = this.scale.height;
    const shelfY = height - 58 * this.renderScale;
    const visible = this.stoneViews.filter((view) => Boolean(view.definition));
    const gap = Math.min(108 * this.renderScale, width * 0.09);
    const startX = width * 0.46 - ((visible.length - 1) * gap) / 2;
    visible.forEach((view, index) => {
      view.shelfX = startX + index * gap;
      view.shelfY = shelfY;
      const placed = this.run!.placedStoneIds.includes(view.definition!.id);
      if (!placed) {
        if (animated) {
          this.tweens.add({
            targets: view.container,
            x: view.shelfX,
            y: view.shelfY,
            duration: 220,
            ease: 'Back.easeOut'
          });
        } else {
          view.container.setPosition(view.shelfX, view.shelfY);
        }
      }
      const size = 88 * this.renderScale;
      view.stone.setDisplaySize(size, size);
      view.container.setSize(size * 1.12, size * 1.12);
      view.label.setFontSize(27 * this.renderScale);
    });
  }

  private layoutPlacedStones(panX: number, panY: number): void {
    if (!this.run) return;
    const placedViews = this.stoneViews.filter(
      (view) => view.definition && this.run!.placedStoneIds.includes(view.definition.id)
    );
    placedViews.forEach((view, index) => {
      const columns = Math.min(3, placedViews.length);
      const row = Math.floor(index / columns);
      const column = index % columns;
      const x = panX + (column - (columns - 1) / 2) * 54 * this.renderScale;
      const y = panY - row * 40 * this.renderScale;
      view.container.setPosition(x, y).setDepth(26);
      view.stone.setDisplaySize(68 * this.renderScale, 68 * this.renderScale);
      view.label.setFontSize(22 * this.renderScale);
    });
  }

  private drawLever(angle: number): void {
    this.leverAnimationToken += 1;
    this.setLeverFrame(angle > 0 ? VAULT_LEVER_50_TEXTURE_KEY : VAULT_LEVER_TEXTURE_KEY);
  }

  private setLeverFrame(textureKey: string): void {
    if (!this.leverImage) return;
    this.leverImage.setTexture(textureKey);
    if (this.leverDisplayWidth > 0 && this.leverDisplayHeight > 0) {
      this.leverImage.setDisplaySize(this.leverDisplayWidth, this.leverDisplayHeight);
    }
    this.lever?.setAngle(0);
  }

  private playLeverPullAnimation(): void {
    const token = ++this.leverAnimationToken;
    const frames = [
      { delay: 0, texture: VAULT_LEVER_TEXTURE_KEY },
      { delay: 80, texture: VAULT_LEVER_80_TEXTURE_KEY },
      { delay: 160, texture: VAULT_LEVER_70_TEXTURE_KEY },
      { delay: 240, texture: VAULT_LEVER_60_TEXTURE_KEY },
      { delay: 320, texture: VAULT_LEVER_50_TEXTURE_KEY },
      { delay: 500, texture: VAULT_LEVER_60_TEXTURE_KEY },
      { delay: 570, texture: VAULT_LEVER_70_TEXTURE_KEY },
      { delay: 640, texture: VAULT_LEVER_80_TEXTURE_KEY },
      { delay: 710, texture: VAULT_LEVER_TEXTURE_KEY }
    ];
    frames.forEach(({ delay, texture }) => {
      this.time.delayedCall(delay, () => {
        if (this.leaving || token !== this.leverAnimationToken) return;
        this.setLeverFrame(texture);
      });
    });
  }

  private layoutScene(): void {
    if (!this.background || !this.shade || !this.topPanel) return;
    const width = this.scale.width;
    const height = this.scale.height;
    const source = this.textures.get(VAULT_BACKGROUND_TEXTURE_KEY).getSourceImage() as HTMLImageElement;
    const scale = Math.max(width / source.width, height / source.height);
    this.background.setPosition(width / 2, height / 2)
      .setDisplaySize(source.width * scale, source.height * scale);
    this.shade.setPosition(0, 0).setDisplaySize(width, height);

    const panelX = 16 * this.renderScale;
    const panelY = 18 * this.renderScale;
    const panelHeight = 140 * this.renderScale;
    this.topPanel.clear();
    this.topPanel.fillStyle(0x041324, 0.92);
    this.topPanel.fillRoundedRect(
      panelX,
      panelY,
      width - panelX * 2,
      panelHeight,
      22 * this.renderScale
    );
    this.topPanel.lineStyle(3 * this.renderScale, BLUE, 0.58);
    this.topPanel.strokeRoundedRect(
      panelX,
      panelY,
      width - panelX * 2,
      panelHeight,
      22 * this.renderScale
    );
    this.lockLabel?.setPosition(38 * this.renderScale, 47 * this.renderScale);
    this.prompt
      ?.setPosition(width / 2, 84 * this.renderScale)
      .setWordWrapWidth(Math.max(420 * this.renderScale, width - 450 * this.renderScale));
    this.message
      ?.setPosition(width / 2, 130 * this.renderScale)
      .setWordWrapWidth(Math.max(440 * this.renderScale, width - 380 * this.renderScale));
    const heartRowWidth = Math.max(0, this.heartIcons.length - 1) * 26 * this.renderScale;
    this.hearts?.setPosition(
      width - 148 * this.renderScale - heartRowWidth,
      47 * this.renderScale
    );

    const sealsStartX = width * 0.5 - 57 * this.renderScale;
    this.lockSeals.forEach((seal, index) => seal.setPosition(
      sealsStartX + index * 38 * this.renderScale,
      43 * this.renderScale
    ));
    this.exitButton?.setPosition(width - 78 * this.renderScale, 116 * this.renderScale);
    this.devButton?.setPosition(88 * this.renderScale, height - 42 * this.renderScale);

    const contentTop = panelY + panelHeight + 28 * this.renderScale;
    const contentBottom = height - 34 * this.renderScale;
    const compactGrid = width < 920 * this.renderScale || height < 610 * this.renderScale;
    const answerSize = Math.min(
      136 * this.renderScale,
      width * (compactGrid ? 0.18 : 0.115),
      (contentBottom - contentTop) * (compactGrid ? 0.28 : 0.34)
    );
    this.answerViews.forEach((view, index) => {
      if (compactGrid) {
        const column = index % 2;
        const row = Math.floor(index / 2);
        view.container.setPosition(
          width / 2 + (column === 0 ? -1 : 1) * answerSize * 0.72,
          contentTop + (row + 0.65) * answerSize * 1.05
        );
      } else {
        const answerGap = Math.min(215 * this.renderScale, width * 0.18);
        view.container.setPosition(
          width / 2 + (index - 1.5) * answerGap,
          contentTop + (contentBottom - contentTop) * 0.48
        );
      }
      view.stone.setDisplaySize(answerSize, answerSize);
      view.container.setSize(answerSize, answerSize);
    });

    const leverWidth = Math.min(176 * this.renderScale, width * 0.125);
    const leverHeight = leverWidth * (1800 / 1400);
    const leverHitWidth = leverWidth * 1.35;
    const leverHitHeight = leverHeight * 1.3;
    this.leverDisplayWidth = leverWidth;
    this.leverDisplayHeight = leverHeight;
    this.leverImage?.setDisplaySize(this.leverDisplayWidth, this.leverDisplayHeight);
    this.lever
      ?.setPosition(width * 0.86, contentTop + (contentBottom - contentTop) * 0.58)
      .setSize(leverHitWidth, leverHitHeight);
    const leverHitArea = this.lever?.input?.hitArea;
    if (leverHitArea instanceof Phaser.Geom.Rectangle) {
      leverHitArea.setTo(
        -leverHitWidth / 2,
        -leverHitHeight / 2,
        leverHitWidth,
        leverHitHeight
      );
    }
    this.drawScale();
    this.layoutStones(false);
  }

  private playHitEffect(): void {
    this.cameras.main.shake(280, 0.008);
    this.cameras.main.flash(120, 180, 18, 45, false);
    this.emitBurst(this.scale.width / 2, this.scale.height * 0.48, DANGER, 18);
  }

  private emitBurst(x: number, y: number, color: number, count: number): void {
    for (let index = 0; index < count; index += 1) {
      const spark = this.add.circle(x, y, Phaser.Math.Between(2, 6) * this.renderScale, color, 0.92)
        .setDepth(80)
        .setBlendMode(Phaser.BlendModes.ADD);
      const angle = Phaser.Math.FloatBetween(-Math.PI, Math.PI);
      const distance = Phaser.Math.Between(35, 145) * this.renderScale;
      this.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0.1,
        duration: Phaser.Math.Between(360, 720),
        ease: 'Cubic.easeOut',
        onComplete: () => spark.destroy()
      });
    }
  }

  private completeForDev(): void {
    if (!this.run || this.leaving) return;
    let next = this.run;
    let guard = 0;
    while (next.phase !== 'reward' && next.phase !== 'lost' && guard < 80) {
      guard += 1;
      if (next.phase === 'question') {
        next = answerCounterweightQuestion(next, next.challenge.question.answer);
      } else if (next.phase === 'correct' || next.phase === 'wrong') {
        next = continueCounterweightQuestion(next);
      } else if (next.phase === 'balance' || next.phase === 'balance-wrong') {
        const target = next.challenge.stop.targetWeight;
        const solution: string[] = [];
        const search = (index: number, sum: number): boolean => {
          if (sum === target) return true;
          if (sum > target || index >= next.stones.length) return false;
          solution.push(next.stones[index].id);
          if (search(index + 1, sum + next.stones[index].value)) return true;
          solution.pop();
          return search(index + 1, sum);
        };
        search(0, 0);
        next = { ...next, phase: 'balance', placedStoneIds: solution };
        next = checkCounterweightBalance(next);
      } else if (next.phase === 'unlocking') {
        next = continueCounterweightVault(next);
      } else {
        break;
      }
    }
    this.run = next;
    if (this.run.phase === 'reward') this.openReward();
  }

  private openReward(): void {
    if (!this.run || this.run.phase !== 'reward' || this.leaving) return;
    this.inputLocked = true;
    this.hud.setWorldHudVisible(true);
    this.hud.openCounterweightVaultReward(this.run.rewardValue, () => this.exitToMap());
  }

  private openFailure(): void {
    if (!this.run || this.leaving) return;
    this.inputLocked = true;
    const storyFailed = this.run.settings.playMode === 'story';
    this.hud.setWorldHudVisible(true);
    this.hud.openCounterweightVaultFailure(storyFailed, () => this.exitToMap(storyFailed));
  }

  private exitToMap(resetToProgress = false): void {
    if (this.leaving) return;
    this.leaving = true;
    this.inputLocked = true;
    this.animationEpoch += 1;
    this.input.enabled = false;
    this.tweens.killAll();
    this.time.removeAllEvents();
    this.hud.closeCounterweightVaultUi();
    const world = this.scene.get('WorldScene') as WorldSceneVaultBridge;
    this.scene.resume('WorldScene');
    world.resumeFromCounterweightVault(resetToProgress);
    if (resetToProgress) {
      this.hud.completeStoryModeRestartAfterReturn();
    }
    this.scene.stop();
  }

  private cleanup(): void {
    this.scale.off('resize', this.resizeHandler);
    this.tweens.killAll();
    this.hud.closeCounterweightVaultUi();
  }
}
