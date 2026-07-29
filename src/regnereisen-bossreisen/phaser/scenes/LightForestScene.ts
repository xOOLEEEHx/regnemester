import Phaser from 'phaser';
import {
  LIGHT_FOREST_AREAS,
  LIGHT_FOREST_NETWORK_ASSET_PATH,
  LIGHT_FOREST_NETWORK_TEXTURE_KEY,
  LIGHT_FOREST_ROOT_KNOT_ASSET_PATH,
  LIGHT_FOREST_ROOT_KNOT_TEXTURE_KEY,
  LIGHT_SPIRIT_ASSET_PATH,
  LIGHT_SPIRIT_TEXTURE_KEY,
  getLightForestArea
} from '../../game/content/lightForest';
import { getStoredTallvokterFxLevel } from '../../game/content/tallvokterFx';
import type { ProgressStore } from '../../game/simulation/progress';
import {
  answerLightForestQuestion,
  completeLightForestRootPath,
  continueLightForestJourney,
  createLightForestQuest,
  startLightForestQuest,
  type LightForestQuestState
} from '../../game/simulation/lightForestQuest';
import type { HudController, LightForestHudView } from '../../ui/hud';
import {
  createLightForestNetworkLayout,
  type LightForestNetworkLayout,
  type LightForestPoint
} from '../layout/lightForestLayout';

type WorldSceneLightForestBridge = Phaser.Scene & {
  confirmLightForestReady: () => void;
  resumeFromLightForest: (resetToProgress?: boolean) => void;
};

type AnswerMote = {
  container: Phaser.GameObjects.Container;
  halo: Phaser.GameObjects.Arc;
  core: Phaser.GameObjects.Arc;
  answerText: Phaser.GameObjects.Text;
  answer?: number;
};

type RootJunction = {
  container: Phaser.GameObjects.Container;
  focusGlow: Phaser.GameObjects.Arc;
  root: Phaser.GameObjects.Image;
  hitZone: Phaser.GameObjects.Zone;
  currentAngle: number;
  targetAngle: number;
};

type RootRouteView = {
  shadow: Phaser.GameObjects.Graphics;
  glow: Phaser.GameObjects.Graphics;
};

type TreeView = {
  container: Phaser.GameObjects.Container;
  halo: Phaser.GameObjects.Arc;
  core: Phaser.GameObjects.Arc;
  label: Phaser.GameObjects.Text;
  motes: Phaser.GameObjects.Arc[];
};

const FX_MULTIPLIER = {
  off: 0,
  low: 0.45,
  standard: 0.72,
  high: 1,
  ultra: 1.35
} as const;

const SUCCESS_COLOR = 0x76ffbd;
const WRONG_COLOR = 0xff536b;
const ROOT_SHADOW_COLOR = 0x050b0b;
const ROOT_BARK_COLOR = 0x18201a;
const SPIRIT_GLOW_ALPHA = 0.3;
const JUNCTION_STEP = 45;

function normalizeTurn(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

function angleDistance(a: number, b: number): number {
  const delta = Math.abs(normalizeTurn(a) - normalizeTurn(b));
  return Math.min(delta, 360 - delta);
}

function isRootJunctionAligned(currentAngle: number, targetAngle: number): boolean {
  return Math.min(
    angleDistance(currentAngle, targetAngle),
    angleDistance(currentAngle, targetAngle + 180)
  ) < 0.1;
}

export class LightForestScene extends Phaser.Scene {
  private run?: LightForestQuestState;
  private layout?: LightForestNetworkLayout;
  private background?: Phaser.GameObjects.Image;
  private shade?: Phaser.GameObjects.Rectangle;
  private boardFrame?: Phaser.GameObjects.Graphics;
  private rootRoutes: RootRouteView[] = [];
  private answerMotes: AnswerMote[] = [];
  private junctions: RootJunction[] = [];
  private treeViews: TreeView[] = [];
  private spirit?: Phaser.GameObjects.Image;
  private spiritGlow?: Phaser.GameObjects.Arc;
  private ambientLights: Phaser.GameObjects.Arc[] = [];
  private shadowTendrils?: Phaser.GameObjects.Graphics;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private moveKeys?: Record<'W' | 'A' | 'D', Phaser.Input.Keyboard.Key>;
  private enterKey?: Phaser.Input.Keyboard.Key;
  private spaceKey?: Phaser.Input.Keyboard.Key;
  private selectedAnswer = 0;
  private selectedJunction = 0;
  private activeJunctionCount = 0;
  private inputLocked = true;
  private leaving = false;
  private animationEpoch = 0;
  private statusMessage = '';

  private readonly handleResize = (): void => this.layoutScene();

  constructor(
    private readonly progress: ProgressStore,
    private readonly hud: HudController,
    private readonly renderScale: number
  ) {
    super({ key: 'LightForestScene' });
  }

  preload(): void {
    if (!this.textures.exists(LIGHT_FOREST_NETWORK_TEXTURE_KEY)) {
      this.load.image(LIGHT_FOREST_NETWORK_TEXTURE_KEY, LIGHT_FOREST_NETWORK_ASSET_PATH);
    }
    if (!this.textures.exists(LIGHT_SPIRIT_TEXTURE_KEY)) {
      this.load.image(LIGHT_SPIRIT_TEXTURE_KEY, LIGHT_SPIRIT_ASSET_PATH);
    }
    if (!this.textures.exists(LIGHT_FOREST_ROOT_KNOT_TEXTURE_KEY)) {
      this.load.image(LIGHT_FOREST_ROOT_KNOT_TEXTURE_KEY, LIGHT_FOREST_ROOT_KNOT_ASSET_PATH);
    }
  }

  create(): void {
    this.rootRoutes = [];
    this.answerMotes = [];
    this.junctions = [];
    this.treeViews = [];
    this.ambientLights = [];
    this.leaving = false;
    this.inputLocked = true;
    this.input.enabled = true;
    this.animationEpoch = 0;
    this.selectedAnswer = 0;
    this.selectedJunction = 0;
    this.activeJunctionCount = 0;
    this.run = startLightForestQuest(createLightForestQuest(
      this.progress.getSettings(),
      this.progress.getBattleHearts()
    ));

    this.cameras.main.setBackgroundColor('#010708');
    this.background = this.add.image(0, 0, LIGHT_FOREST_NETWORK_TEXTURE_KEY)
      .setOrigin(0.5)
      .setDepth(-40);
    this.shade = this.add.rectangle(0, 0, 10, 10, 0x01090b, 0.2)
      .setOrigin(0)
      .setDepth(-30);
    this.boardFrame = this.add.graphics().setDepth(-20);
    this.shadowTendrils = this.add.graphics().setDepth(36);

    this.createRootRoutes();
    this.createTreeViews();
    this.createAnswerMotes();
    this.createJunctions();

    this.spiritGlow = this.add.circle(0, 0, 60 * this.renderScale, 0x72ffe6, SPIRIT_GLOW_ALPHA)
      .setStrokeStyle(4 * this.renderScale, 0xd5fff6, 0.56)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(24);
    this.spirit = this.add.image(0, 0, LIGHT_SPIRIT_TEXTURE_KEY)
      .setOrigin(0.5)
      .setDepth(26);

    this.cursors = this.input.keyboard?.createCursorKeys();
    this.moveKeys = this.input.keyboard?.addKeys('W,A,D') as Record<'W' | 'A' | 'D', Phaser.Input.Keyboard.Key>;
    this.enterKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.spaceKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.scale.on('resize', this.handleResize);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanup());

    this.layoutScene();
    this.createAmbientLights();
    this.showQuestion(false);
    this.tweens.add({
      targets: this.spiritGlow,
      alpha: { from: 0.16, to: SPIRIT_GLOW_ALPHA },
      scale: { from: 0.92, to: 1.08 },
      duration: 960,
      ease: 'Sine.inOut',
      yoyo: true,
      repeat: -1
    });
    this.cameras.main.fadeIn(440, 1, 7, 9);
    const worldScene = this.scene.get('WorldScene') as WorldSceneLightForestBridge;
    worldScene.confirmLightForestReady();
  }

  update(): void {
    if (!this.spirit || !this.spiritGlow) return;
    this.spiritGlow.setPosition(this.spirit.x, this.spirit.y + 4 * this.renderScale);
    if (this.leaving || this.inputLocked || !this.run) return;

    const leftPressed = Boolean(
      (this.cursors?.left && Phaser.Input.Keyboard.JustDown(this.cursors.left))
      || (this.moveKeys?.A && Phaser.Input.Keyboard.JustDown(this.moveKeys.A))
    );
    const rightPressed = Boolean(
      (this.cursors?.right && Phaser.Input.Keyboard.JustDown(this.cursors.right))
      || (this.moveKeys?.D && Phaser.Input.Keyboard.JustDown(this.moveKeys.D))
    );
    const confirmPressed = Boolean(
      (this.cursors?.up && Phaser.Input.Keyboard.JustDown(this.cursors.up))
      || (this.moveKeys?.W && Phaser.Input.Keyboard.JustDown(this.moveKeys.W))
      || (this.enterKey && Phaser.Input.Keyboard.JustDown(this.enterKey))
      || (this.spaceKey && Phaser.Input.Keyboard.JustDown(this.spaceKey))
    );

    if (this.run.phase === 'question') {
      if (leftPressed) this.selectAnswer(this.selectedAnswer - 1);
      if (rightPressed) this.selectAnswer(this.selectedAnswer + 1);
      if (confirmPressed) this.chooseAnswer(this.selectedAnswer);
      return;
    }

    if (this.run.phase === 'network') {
      if (leftPressed) this.selectJunction(this.selectedJunction - 1);
      if (rightPressed) this.selectJunction(this.selectedJunction + 1);
      if (confirmPressed) this.rotateJunction(this.selectedJunction);
    }
  }

  private createRootRoutes(): void {
    for (let index = 0; index < LIGHT_FOREST_AREAS.length; index += 1) {
      this.rootRoutes.push({
        shadow: this.add.graphics().setDepth(-8),
        glow: this.add.graphics().setDepth(4).setBlendMode(Phaser.BlendModes.ADD)
      });
    }
  }

  private createTreeViews(): void {
    LIGHT_FOREST_AREAS.forEach((area, treeIndex) => {
      const halo = this.add.circle(0, 0, 32 * this.renderScale, area.glowColor, 0.035)
        .setStrokeStyle(1.5 * this.renderScale, area.accentColor, 0.12)
        .setBlendMode(Phaser.BlendModes.ADD);
      const core = this.add.circle(0, 0, 13 * this.renderScale, area.glowColor, 0.12)
        .setBlendMode(Phaser.BlendModes.ADD);
      const label = this.add.text(0, 52 * this.renderScale, area.place, {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: `${13 * this.renderScale}px`,
        color: '#d9eee6',
        stroke: '#021013',
        strokeThickness: 5 * this.renderScale
      }).setOrigin(0.5);
      const motes = Array.from({ length: 12 }, (_, moteIndex) => {
        const mote = this.add.circle(
          0,
          0,
          (2 + (moteIndex % 3)) * this.renderScale,
          moteIndex % 4 === 0 ? 0xffffff : area.glowColor,
          0
        ).setBlendMode(Phaser.BlendModes.ADD);
        mote.setData('angle', (Math.PI * 2 * moteIndex) / 12);
        mote.setData('radius', 34 + (moteIndex % 4) * 9);
        return mote;
      });
      const container = this.add.container(0, 0, [halo, core, ...motes, label])
        .setDepth(12);
      container.setData('treeIndex', treeIndex);
      this.treeViews.push({ container, halo, core, label, motes });
    });
  }

  private createAnswerMotes(): void {
    for (let index = 0; index < 4; index += 1) {
      const halo = this.add.circle(0, 0, 34 * this.renderScale, 0x62ffe0, 0.055)
        .setStrokeStyle(1.5 * this.renderScale, 0xc9fff2, 0.36)
        .setBlendMode(Phaser.BlendModes.ADD);
      const core = this.add.circle(0, 0, 28 * this.renderScale, 0x123f43, 0.94)
        .setStrokeStyle(2 * this.renderScale, 0x5effd4, 0.72);
      const inner = this.add.circle(0, 0, 20 * this.renderScale, 0x45d9be, 0.11)
        .setBlendMode(Phaser.BlendModes.ADD);
      const answerText = this.add.text(0, 0, '?', {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: `${25 * this.renderScale}px`,
        color: '#fff8d4',
        stroke: '#031117',
        strokeThickness: 7 * this.renderScale,
        shadow: {
          color: '#000000',
          blur: 5 * this.renderScale,
          offsetX: 0,
          offsetY: 3 * this.renderScale,
          fill: true
        }
      }).setOrigin(0.5);
      const hitZone = this.add.zone(0, 0, 86 * this.renderScale, 86 * this.renderScale)
        .setInteractive({ cursor: 'pointer' });
      const container = this.add.container(0, 0, [halo, core, inner, answerText, hitZone])
        .setDepth(30)
        .setVisible(false);
      const mote: AnswerMote = { container, halo, core, answerText };
      hitZone.on('pointerover', () => this.selectAnswer(index));
      hitZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        pointer.event?.preventDefault();
        this.chooseAnswer(index);
      });
      this.answerMotes.push(mote);
    }
  }

  private createJunctions(): void {
    for (let index = 0; index < 3; index += 1) {
      const focusGlow = this.add.circle(0, 0, 38 * this.renderScale, 0x7effdc, 0.08)
        .setBlendMode(Phaser.BlendModes.ADD);
      const root = this.add.image(0, 0, LIGHT_FOREST_ROOT_KNOT_TEXTURE_KEY)
        .setOrigin(0.5)
        .setDisplaySize(96 * this.renderScale, 58 * this.renderScale);
      const hitZone = this.add.zone(0, 0, 92 * this.renderScale, 72 * this.renderScale)
        .setInteractive({ cursor: 'pointer' });
      const container = this.add.container(0, 0, [focusGlow, root, hitZone])
        .setDepth(31)
        .setVisible(false);
      const junction: RootJunction = {
        container,
        focusGlow,
        root,
        hitZone,
        currentAngle: 0,
        targetAngle: 0
      };
      hitZone.on('pointerover', () => this.selectJunction(index));
      hitZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        pointer.event?.preventDefault();
        this.rotateJunction(index);
      });
      this.junctions.push(junction);
    }
  }

  private layoutJunctions(points: LightForestPoint[]): void {
    if (!this.layout || points.length === 0) return;
    this.activeJunctionCount = points.length;
    const spacings = points.slice(1).map((point, index) => (
      Phaser.Math.Distance.Between(
        points[index].x,
        points[index].y,
        point.x,
        point.y
      )
    ));
    const maxRootWidth = (points.length >= 3 ? 90 : points.length === 2 ? 94 : 76)
      * this.renderScale;
    const rootWidth = spacings.length > 0
      ? Math.min(maxRootWidth, Math.min(...spacings) * 0.94)
      : maxRootWidth;

    points.forEach((point, index) => {
      const junction = this.junctions[index];
      junction.container.setPosition(point.x, point.y);
      junction.root.setDisplaySize(rootWidth, rootWidth * 0.61);
      junction.focusGlow.setDisplaySize(rootWidth * 0.78, rootWidth * 0.78);
      junction.hitZone.setSize(rootWidth, rootWidth * 0.72);
    });
    this.junctions.slice(points.length).forEach((junction) => {
      junction.container.setVisible(false);
    });
  }

  private showQuestion(animate: boolean): void {
    if (!this.run || this.run.phase !== 'question' || !this.layout || !this.spirit || !this.spiritGlow) return;
    const area = getLightForestArea(this.run.areaIndex);
    this.inputLocked = true;
    this.selectedAnswer = 0;
    this.statusMessage = this.run.message;
    this.shadowTendrils?.clear();
    this.junctions.forEach((junction) => junction.container.setVisible(false));
    this.spirit.setPosition(this.layout.heart.x, this.layout.heart.y).setAlpha(1).setAngle(0);
    this.spiritGlow.setPosition(this.spirit.x, this.spirit.y + 4 * this.renderScale).setAlpha(SPIRIT_GLOW_ALPHA);

    this.run.challenge.question.choices.forEach((answer, index) => {
      const mote = this.answerMotes[index];
      mote.answer = answer;
      mote.answerText.setText(String(answer)).setColor('#fff8d4');
      mote.core.setFillStyle(0x123f43, 0.92).setStrokeStyle(2 * this.renderScale, area.glowColor, 0.72);
      mote.halo.setFillStyle(area.glowColor, 0.055).setStrokeStyle(1.5 * this.renderScale, area.accentColor, 0.34);
      mote.container
        .setPosition(this.layout!.answerMotes[index].x, this.layout!.answerMotes[index].y)
        .setVisible(true)
        .setAlpha(animate ? 0 : 1)
        .setScale(animate ? 0.76 : 1);
    });
    this.refreshTreeViews();
    this.drawNetwork();
    this.updateAnswerSelection();
    this.renderHud();

    const epoch = this.animationEpoch;
    if (!animate) {
      this.inputLocked = false;
      this.renderHud();
      return;
    }
    this.answerMotes.forEach((mote, index) => {
      this.tweens.add({
        targets: mote.container,
        alpha: 1,
        scale: 1,
        duration: 250,
        delay: index * 45,
        ease: 'Back.easeOut'
      });
    });
    this.time.delayedCall(390, () => {
      if (this.leaving || epoch !== this.animationEpoch || this.run?.phase !== 'question') return;
      this.inputLocked = false;
      this.renderHud();
    });
  }

  private selectAnswer(index: number): void {
    if (this.inputLocked || this.run?.phase !== 'question') return;
    const count = this.answerMotes.length;
    this.selectedAnswer = ((index % count) + count) % count;
    this.updateAnswerSelection();
  }

  private updateAnswerSelection(): void {
    this.answerMotes.forEach((mote, index) => {
      const selected = index === this.selectedAnswer && this.run?.phase === 'question';
      mote.container.setScale(selected ? 1.1 : 1);
      mote.halo.setAlpha(selected ? 0.78 : 0.38);
    });
  }

  private chooseAnswer(index: number): void {
    if (this.inputLocked || !this.run || this.run.phase !== 'question' || !this.layout) return;
    const mote = this.answerMotes[index];
    if (mote.answer === undefined) return;

    this.selectedAnswer = index;
    this.inputLocked = true;
    const previousHp = this.run.challenge.playerHp;
    this.run = answerLightForestQuestion(this.run, mote.answer);
    const correct = Boolean(this.run.challenge.lastAnswerCorrect);
    const epoch = ++this.animationEpoch;
    this.answerMotes.forEach((other, moteIndex) => {
      if (moteIndex !== index) other.container.setAlpha(0.28);
    });

    if (correct) {
      const area = getLightForestArea(this.run.areaIndex);
      mote.core.setFillStyle(SUCCESS_COLOR, 0.92);
      mote.halo.setFillStyle(area.glowColor, 0.34).setStrokeStyle(5 * this.renderScale, 0xffffff, 0.9);
      this.statusMessage = this.run.message;
      this.emitBurst(mote.container.x, mote.container.y, area.glowColor, 24);
      this.tweens.add({
        targets: mote.container,
        x: this.layout.heart.x,
        y: this.layout.heart.y,
        scale: 0.24,
        alpha: 0,
        duration: 430,
        ease: 'Cubic.easeIn',
        onComplete: () => {
          if (this.leaving || epoch !== this.animationEpoch || !this.run) return;
          this.emitBurst(this.layout!.heart.x, this.layout!.heart.y, area.glowColor, 30);
          if (this.run.phase === 'network') {
            this.showRootPuzzle();
            return;
          }
          this.run = continueLightForestJourney(this.run);
          this.showQuestion(true);
        }
      });
      this.renderHud();
      return;
    }

    const lostHeart = this.run.challenge.playerHp < previousHp;
    if (lostHeart) {
      this.progress.recordDamageTaken();
      if (this.run.settings.playMode === 'story') {
        if (this.run.phase === 'lost') this.hud.restartStoryModeAfterFailure();
        else this.progress.setStoryLives(this.run.challenge.playerHp);
      }
      this.hud.flashLightForestHit();
    }
    mote.core.setFillStyle(WRONG_COLOR, 0.9);
    mote.halo.setFillStyle(WRONG_COLOR, 0.28).setStrokeStyle(5 * this.renderScale, 0xffd5dc, 0.92);
    this.statusMessage = this.run.message;
    this.drawShadowTendrils(this.layout.heart, mote.container);
    this.cameras.main.shake(170, 0.0032, true);
    this.emitBurst(mote.container.x, mote.container.y, WRONG_COLOR, 18);
    this.renderHud();
    this.time.delayedCall(590, () => {
      if (this.leaving || epoch !== this.animationEpoch || !this.run) return;
      if (this.run.phase === 'lost') {
        this.openFailure();
        return;
      }
      this.run = continueLightForestJourney(this.run);
      this.showQuestion(true);
    });
  }

  private showRootPuzzle(): void {
    if (!this.run || this.run.phase !== 'network' || !this.layout) return;
    const area = getLightForestArea(this.run.areaIndex);
    const route = this.layout.routes[this.run.areaIndex];
    const points = this.layout.junctions[this.run.areaIndex];
    this.inputLocked = true;
    this.selectedJunction = 0;
    this.activeJunctionCount = points.length;
    this.statusMessage = 'Trykk på rotknutene og roter dem til de følger den svake lyslinjen.';
    this.answerMotes.forEach((mote) => mote.container.setVisible(false));
    this.junctions.forEach((junction) => junction.container.setVisible(false));
    this.shadowTendrils?.clear();
    this.layoutJunctions(points);

    points.forEach((point, index) => {
      const routeIndex = route.reduce((bestIndex, routePoint, currentIndex) => {
        const best = route[bestIndex];
        const currentDistance = Phaser.Math.Distance.Between(point.x, point.y, routePoint.x, routePoint.y);
        const bestDistance = Phaser.Math.Distance.Between(point.x, point.y, best.x, best.y);
        return currentDistance < bestDistance ? currentIndex : bestIndex;
      }, 0);
      const before = route[Math.max(0, routeIndex - 2)];
      const after = route[Math.min(route.length - 1, routeIndex + 2)];
      const targetAngle = Phaser.Math.RadToDeg(Math.atan2(
        after.y - before.y,
        after.x - before.x
      ));
      const offsetSteps = 1 + ((this.run!.areaIndex + index) % 3);
      const junction = this.junctions[index];
      junction.targetAngle = targetAngle;
      junction.currentAngle = targetAngle - offsetSteps * JUNCTION_STEP;
      junction.container.setPosition(point.x, point.y).setVisible(true).setAlpha(0).setScale(0.76);
      junction.root.setAngle(junction.currentAngle);
      junction.root.clearTint().setAlpha(0.92);
      junction.focusGlow.setFillStyle(area.glowColor, 0.08).setAlpha(0.08);
    });
    this.drawNetwork();
    this.updateJunctionSelection();
    this.renderHud();

    const epoch = this.animationEpoch;
    this.junctions.slice(0, this.activeJunctionCount).forEach((junction, index) => {
      this.tweens.add({
        targets: junction.container,
        alpha: 1,
        scale: 1,
        duration: 280,
        delay: index * 70,
        ease: 'Back.easeOut'
      });
    });
    this.time.delayedCall(420, () => {
      if (this.leaving || epoch !== this.animationEpoch || this.run?.phase !== 'network') return;
      this.inputLocked = false;
      this.renderHud();
    });
  }

  private selectJunction(index: number): void {
    if (this.inputLocked || this.run?.phase !== 'network') return;
    const count = this.activeJunctionCount;
    if (count <= 0) return;
    this.selectedJunction = ((index % count) + count) % count;
    this.updateJunctionSelection();
  }

  private updateJunctionSelection(): void {
    this.junctions.forEach((junction, index) => {
      const active = index < this.activeJunctionCount;
      const selected = active && index === this.selectedJunction && this.run?.phase === 'network';
      const aligned = isRootJunctionAligned(junction.currentAngle, junction.targetAngle);
      if (!active) {
        junction.container.setVisible(false);
        return;
      }
      junction.container.setScale(selected ? 1.025 : 1);
      junction.focusGlow.setAlpha(selected ? 0.14 : aligned ? 0.1 : 0.035);
      if (aligned) {
        junction.focusGlow.setFillStyle(SUCCESS_COLOR, 0.2);
        junction.root.setAlpha(1).setTint(0xeafff4);
      } else {
        junction.root.clearTint().setAlpha(0.92);
      }
    });
  }

  private rotateJunction(index: number): void {
    if (
      this.inputLocked
      || this.run?.phase !== 'network'
      || index < 0
      || index >= this.activeJunctionCount
    ) return;
    const junction = this.junctions[index];
    this.selectedJunction = index;
    junction.currentAngle += JUNCTION_STEP;
    this.tweens.killTweensOf(junction.root);
    this.tweens.add({
      targets: junction.root,
      angle: junction.currentAngle,
      duration: 180,
      ease: 'Back.easeOut',
      onComplete: () => {
        if (this.leaving || this.run?.phase !== 'network') return;
        this.updateJunctionSelection();
        if (
          this.junctions
            .slice(0, this.activeJunctionCount)
            .every((item) => isRootJunctionAligned(item.currentAngle, item.targetAngle))
        ) {
          this.finishRootPuzzle();
        }
      }
    });
    this.emitBurst(junction.container.x, junction.container.y, getLightForestArea(this.run.areaIndex).glowColor, 7);
  }

  private finishRootPuzzle(): void {
    if (!this.run || this.run.phase !== 'network' || !this.layout) return;
    this.inputLocked = true;
    this.statusMessage = 'Forbindelsen er hel. Lysgnisten strømmer mot treet!';
    this.run = completeLightForestRootPath(this.run);
    const epoch = ++this.animationEpoch;
    const area = getLightForestArea(this.run.areaIndex);
    this.junctions.slice(0, this.activeJunctionCount).forEach((junction) => {
      junction.focusGlow.setFillStyle(area.glowColor, 0.24).setAlpha(0.2);
      junction.root.setTint(0xffffff).setAlpha(1);
    });
    this.drawNetwork();
    this.renderHud();
    this.emitBurst(this.layout.heart.x, this.layout.heart.y, area.glowColor, 34);
    this.animateSpiritAlong(this.layout.routes[this.run.areaIndex], 920, epoch, () => {
      if (this.leaving || epoch !== this.animationEpoch || !this.run) return;
      this.playTreeAwakening(epoch);
    });
  }

  private animateSpiritAlong(
    points: LightForestPoint[],
    duration: number,
    epoch: number,
    onComplete: () => void
  ): void {
    if (!this.spirit || points.length < 2) return;
    const tracker = { progress: 0 };
    let lastSparkSegment = -1;
    this.tweens.add({
      targets: tracker,
      progress: 1,
      duration,
      ease: 'Sine.inOut',
      onUpdate: () => {
        if (this.leaving || epoch !== this.animationEpoch || !this.spirit) return;
        const scaled = tracker.progress * (points.length - 1);
        const segment = Math.min(points.length - 2, Math.floor(scaled));
        const local = scaled - segment;
        const from = points[segment];
        const to = points[segment + 1];
        this.spirit.setPosition(
          Phaser.Math.Linear(from.x, to.x, local),
          Phaser.Math.Linear(from.y, to.y, local)
        );
        this.spirit.setAngle(Phaser.Math.Clamp((to.x - from.x) * 0.045, -12, 12));
        if (segment !== lastSparkSegment && segment % 2 === 0) {
          lastSparkSegment = segment;
          this.emitTrail();
        }
      },
      onComplete: () => {
        if (this.leaving || epoch !== this.animationEpoch || !this.spirit) return;
        const end = points[points.length - 1];
        this.spirit.setPosition(end.x, end.y).setAngle(0);
        onComplete();
      }
    });
  }

  private playTreeAwakening(epoch: number): void {
    if (!this.run || !this.layout || this.run.phase !== 'tree-awakening') return;
    const treeIndex = this.run.areaIndex;
    const area = getLightForestArea(treeIndex);
    const tree = this.treeViews[treeIndex];
    const target = this.layout.trees[treeIndex];
    this.statusMessage = this.run.message;
    this.junctions.forEach((junction) => junction.container.setVisible(false));
    tree.halo.setFillStyle(area.glowColor, 0.38).setStrokeStyle(6 * this.renderScale, 0xffffff, 0.96);
    tree.core.setFillStyle(area.accentColor, 0.94);
    tree.label.setColor('#fff5ba');
    tree.motes.forEach((mote, moteIndex) => {
      mote.setAlpha(0);
      this.tweens.add({
        targets: mote,
        alpha: { from: 0, to: 0.88 },
        scale: { from: 0.3, to: 1 },
        duration: 430,
        delay: moteIndex * 28,
        ease: 'Back.easeOut'
      });
    });
    this.tweens.add({
      targets: [tree.halo, tree.core],
      scale: { from: 0.8, to: 1.18 },
      duration: 520,
      yoyo: true,
      ease: 'Sine.inOut'
    });
    this.emitBurst(target.x, target.y, area.glowColor, 58);
    this.cameras.main.flash(190, 105, 255, 214, false);
    this.drawNetwork();
    this.renderHud();

    this.time.delayedCall(980, () => {
      if (this.leaving || epoch !== this.animationEpoch || !this.run) return;
      this.run = continueLightForestJourney(this.run);
      if (this.run.phase === 'reward') {
        this.openReward();
        return;
      }
      this.spirit?.setAlpha(0);
      this.spiritGlow?.setAlpha(0);
      this.time.delayedCall(160, () => {
        if (this.leaving || epoch !== this.animationEpoch || !this.run || !this.layout) return;
        this.spirit?.setPosition(this.layout.heart.x, this.layout.heart.y).setAlpha(1);
        this.spiritGlow?.setPosition(this.layout.heart.x, this.layout.heart.y).setAlpha(SPIRIT_GLOW_ALPHA);
        this.showQuestion(true);
      });
    });
  }

  private drawNetwork(): void {
    if (!this.layout || !this.run) return;
    const layout = this.layout;
    const run = this.run;
    this.rootRoutes.forEach((view, index) => {
      const vectors = layout.routes[index].map((point) => new Phaser.Math.Vector2(point.x, point.y));
      const area = getLightForestArea(index);
      const awakened = index < run.awakenedAreas.length
        || (index === run.areaIndex && run.phase === 'tree-awakening')
        || run.phase === 'reward'
        || run.phase === 'paid';
      const active = index === run.areaIndex
        && (run.phase === 'question'
          || run.phase === 'correct'
          || run.phase === 'wrong'
          || run.phase === 'network');
      view.shadow.clear();
      if (active) {
        view.shadow.lineStyle(10 * this.renderScale, ROOT_SHADOW_COLOR, 0.28);
        view.shadow.strokePoints(vectors, false, false);
        view.shadow.lineStyle(5 * this.renderScale, ROOT_BARK_COLOR, 0.26);
        view.shadow.strokePoints(vectors, false, false);
      }
      view.glow.clear();
      if (awakened) {
        view.glow.lineStyle(7 * this.renderScale, area.glowColor, 0.56);
        view.glow.strokePoints(vectors, false, false);
        view.glow.lineStyle(2 * this.renderScale, 0xf4fff8, 0.68);
        view.glow.strokePoints(vectors, false, false);
        for (let pointIndex = 3; pointIndex < vectors.length; pointIndex += 5) {
          view.glow.fillStyle(pointIndex % 10 === 3 ? 0xffffff : area.glowColor, 0.92);
          view.glow.fillCircle(vectors[pointIndex].x, vectors[pointIndex].y, 3.5 * this.renderScale);
        }
      } else if (active) {
        view.glow.lineStyle(3 * this.renderScale, area.glowColor, run.phase === 'network' ? 0.3 : 0.11);
        view.glow.strokePoints(vectors, false, false);
      }
    });
  }

  private refreshTreeViews(): void {
    if (!this.run) return;
    this.treeViews.forEach((tree, index) => {
      const area = getLightForestArea(index);
      const awakened = index < this.run!.awakenedAreas.length
        || (index === this.run!.areaIndex && this.run!.phase === 'tree-awakening')
        || this.run!.phase === 'reward'
        || this.run!.phase === 'paid';
      const active = index === this.run!.areaIndex && !awakened;
      tree.halo.setFillStyle(area.glowColor, awakened ? 0.14 : active ? 0.045 : 0.012);
      tree.halo.setStrokeStyle(
        (awakened ? 2.5 : 1.5) * this.renderScale,
        area.accentColor,
        awakened ? 0.42 : active ? 0.2 : 0.07
      );
      tree.core.setFillStyle(area.glowColor, awakened ? 0.62 : active ? 0.13 : 0.045);
      tree.label.setColor(awakened ? '#fff5ba' : active ? '#e9fff8' : '#9ebbb1');
      tree.motes.forEach((mote) => mote.setAlpha(awakened ? 0.72 : 0));
    });
  }

  private drawShadowTendrils(from: LightForestPoint, to: { x: number; y: number }): void {
    if (!this.shadowTendrils) return;
    this.shadowTendrils.clear();
    for (let index = -2; index <= 2; index += 1) {
      const offset = index * 8 * this.renderScale;
      this.shadowTendrils.lineStyle(
        (10 - Math.abs(index)) * this.renderScale,
        index === 0 ? WRONG_COLOR : 0x170715,
        index === 0 ? 0.38 : 0.72
      );
      const curve = new Phaser.Curves.CubicBezier(
        new Phaser.Math.Vector2(from.x, from.y),
        new Phaser.Math.Vector2(
          Phaser.Math.Linear(from.x, to.x, 0.35) + offset,
          from.y - 34 * this.renderScale
        ),
        new Phaser.Math.Vector2(
          Phaser.Math.Linear(from.x, to.x, 0.68) - offset,
          to.y + 26 * this.renderScale
        ),
        new Phaser.Math.Vector2(to.x, to.y)
      );
      this.shadowTendrils.strokePoints(curve.getPoints(28), false, false);
    }
  }

  private renderHud(): void {
    if (!this.run || this.leaving) return;
    const phase = this.run.phase;
    if (
      phase !== 'question'
      && phase !== 'correct'
      && phase !== 'wrong'
      && phase !== 'network'
      && phase !== 'tree-awakening'
    ) return;
    const area = getLightForestArea(this.run.areaIndex);
    const prompt = phase === 'question'
      ? this.run.challenge.question.prompt
      : phase === 'network'
        ? 'Reparer lysroten'
        : phase === 'tree-awakening'
          ? `${area.place} våkner`
          : phase === 'wrong'
            ? 'Skyggerøttene tok ett hjerte'
            : 'Lysgnisten blir sterkere';
    const view: LightForestHudView = {
      phase,
      areaName: area.place,
      areaIndex: this.run.areaIndex,
      totalCorrect: this.run.totalCorrect,
      playerHp: this.run.challenge.playerHp,
      maxPlayerHp: this.run.challenge.maxPlayerHp,
      prompt,
      message: this.statusMessage || this.run.message,
      inputLocked: this.inputLocked
    };
    this.hud.openLightForestHud(
      view,
      () => this.exitToMap(),
      () => this.completeQuestForDev()
    );
  }

  private completeQuestForDev(): void {
    if (!this.run || this.inputLocked || this.leaving) return;
    let next = this.run;
    let guard = 0;
    while (next.phase !== 'reward' && next.phase !== 'lost' && guard < 80) {
      guard += 1;
      if (next.phase === 'question') {
        next = answerLightForestQuestion(next, next.challenge.question.answer);
      } else if (next.phase === 'correct' || next.phase === 'wrong' || next.phase === 'tree-awakening') {
        next = continueLightForestJourney(next);
      } else if (next.phase === 'network') {
        next = completeLightForestRootPath(next);
      } else {
        break;
      }
    }
    this.run = next;
    this.inputLocked = true;
    this.animationEpoch += 1;
    this.answerMotes.forEach((mote) => mote.container.setVisible(false));
    this.junctions.forEach((junction) => junction.container.setVisible(false));
    this.refreshTreeViews();
    this.drawNetwork();
    if (this.layout) {
      this.emitBurst(this.layout.heart.x, this.layout.heart.y, 0x7effdd, 70);
    }
    this.time.delayedCall(280, () => {
      if (!this.leaving) this.openReward();
    });
  }

  private openReward(): void {
    if (!this.run || this.run.phase !== 'reward' || this.leaving) return;
    this.inputLocked = true;
    this.hud.setWorldHudVisible(true);
    this.hud.openLightForestReward(this.run.rewardValue, () => this.exitToMap());
  }

  private openFailure(): void {
    if (!this.run || this.leaving) return;
    this.inputLocked = true;
    const storyFailed = this.run.settings.playMode === 'story';
    this.hud.openLightForestFailure(storyFailed, () => this.exitToMap(storyFailed));
  }

  private emitTrail(): void {
    if (!this.spirit || !this.run) return;
    const multiplier = FX_MULTIPLIER[getStoredTallvokterFxLevel()];
    if (multiplier <= 0 || Math.random() > multiplier) return;
    const area = getLightForestArea(this.run.areaIndex);
    const mote = this.add.circle(
      this.spirit.x + Phaser.Math.Between(-9, 9) * this.renderScale,
      this.spirit.y + 14 * this.renderScale,
      Phaser.Math.Between(2, 5) * this.renderScale,
      area.glowColor,
      0.76
    ).setBlendMode(Phaser.BlendModes.ADD).setDepth(23);
    this.tweens.add({
      targets: mote,
      y: mote.y + Phaser.Math.Between(18, 42) * this.renderScale,
      x: mote.x + Phaser.Math.Between(-16, 16) * this.renderScale,
      scale: 0.1,
      alpha: 0,
      duration: Phaser.Math.Between(420, 670),
      ease: 'Sine.easeOut',
      onComplete: () => mote.destroy()
    });
  }

  private emitBurst(x: number, y: number, color: number, requestedCount: number): void {
    const multiplier = FX_MULTIPLIER[getStoredTallvokterFxLevel()];
    if (multiplier <= 0) return;
    const count = Math.max(4, Math.round(requestedCount * multiplier));
    for (let index = 0; index < count; index += 1) {
      const spark = this.add.circle(
        x,
        y,
        Phaser.Math.Between(2, 6) * this.renderScale,
        index % 6 === 0 ? 0xffffff : color,
        0.92
      ).setBlendMode(Phaser.BlendModes.ADD).setDepth(45);
      const angle = Phaser.Math.FloatBetween(-Math.PI, Math.PI);
      const distance = Phaser.Math.Between(40, 150) * this.renderScale;
      this.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        scale: 0.08,
        alpha: 0,
        duration: Phaser.Math.Between(430, 820),
        ease: 'Cubic.easeOut',
        onComplete: () => spark.destroy()
      });
    }
  }

  private createAmbientLights(): void {
    if (!this.layout) return;
    const multiplier = FX_MULTIPLIER[getStoredTallvokterFxLevel()];
    const count = Math.round(8 * multiplier);
    for (let index = 0; index < count; index += 1) {
      const xRatio = 0.08 + ((index * 0.193) % 0.84);
      const yRatio = 0.1 + ((index * 0.147) % 0.78);
      const light = this.add.circle(
        this.layout.board.x + this.layout.board.width * xRatio,
        this.layout.board.y + this.layout.board.height * yRatio,
        Phaser.Math.Between(2, 4) * this.renderScale,
        index % 3 === 0 ? 0xffe887 : 0x6effd8,
        0.18
      ).setBlendMode(Phaser.BlendModes.ADD).setDepth(8);
      light.setData('xRatio', xRatio).setData('yRatio', yRatio);
      this.ambientLights.push(light);
      this.tweens.add({
        targets: light,
        y: light.y - Phaser.Math.Between(18, 46) * this.renderScale,
        alpha: { from: 0.06, to: 0.32 },
        duration: Phaser.Math.Between(2800, 4600),
        delay: Phaser.Math.Between(0, 1200),
        ease: 'Sine.inOut',
        yoyo: true,
        repeat: -1
      });
    }
  }

  private layoutScene(): void {
    if (!this.background || !this.shade || !this.boardFrame) return;
    const width = this.scale.width;
    const height = this.scale.height;
    this.layout = createLightForestNetworkLayout(width, height, this.renderScale);
    const board = this.layout.board;
    this.background
      .setPosition(board.x + board.width / 2, board.y + board.height / 2)
      .setDisplaySize(board.width, board.height);
    this.shade.setPosition(0, 0).setDisplaySize(width, height);
    this.boardFrame.clear();
    this.boardFrame.lineStyle(4 * this.renderScale, 0x72ffe0, 0.54);
    this.boardFrame.strokeRoundedRect(
      board.x - 5 * this.renderScale,
      board.y - 5 * this.renderScale,
      board.width + 10 * this.renderScale,
      board.height + 10 * this.renderScale,
      20 * this.renderScale
    );

    this.treeViews.forEach((tree, index) => {
      tree.container.setPosition(this.layout!.trees[index].x, this.layout!.trees[index].y);
      const haloSize = Math.max(48, Math.min(74, board.width * 0.05)) * this.renderScale;
      tree.halo.setDisplaySize(haloSize, haloSize);
      tree.core.setDisplaySize(haloSize * 0.32, haloSize * 0.32);
      tree.label
        .setFontSize(Math.max(10, Math.min(15, board.width * 0.009)) * this.renderScale)
        .setY(haloSize * 0.58);
      tree.motes.forEach((mote) => {
        const angle = Number(mote.getData('angle'));
        const radius = Number(mote.getData('radius')) * this.renderScale * Math.max(0.72, board.width / 1450);
        mote.setPosition(Math.cos(angle) * radius, Math.sin(angle) * radius);
      });
    });

    this.answerMotes.forEach((mote, index) => {
      mote.container.setPosition(this.layout!.answerMotes[index].x, this.layout!.answerMotes[index].y);
    });
    if (this.run?.phase === 'network') {
      const points = this.layout.junctions[this.run.areaIndex];
      this.layoutJunctions(points);
    }
    if (this.spirit && this.spiritGlow) {
      const spiritHeight = Math.max(66, Math.min(104, board.height * 0.13)) * this.renderScale;
      this.setImageHeight(this.spirit, spiritHeight);
      this.spiritGlow.setDisplaySize(spiritHeight * 1.36, spiritHeight * 1.36);
      if (!this.inputLocked || this.run?.phase === 'question') {
        this.spirit.setPosition(this.layout.heart.x, this.layout.heart.y);
      }
      this.spiritGlow.setPosition(this.spirit.x, this.spirit.y + 4 * this.renderScale);
    }
    this.ambientLights.forEach((light) => {
      light.setPosition(
        board.x + board.width * Number(light.getData('xRatio')),
        board.y + board.height * Number(light.getData('yRatio'))
      );
    });
    this.refreshTreeViews();
    this.drawNetwork();
    this.cameras.main.stopFollow();
    this.cameras.main.setBounds(0, 0, width, height);
    this.cameras.main.setScroll(0, 0);
    this.physics.world.setBounds(0, 0, width, height);
  }

  private setImageHeight(image: Phaser.GameObjects.Image, height: number): void {
    const source = this.textures.get(image.texture.key).getSourceImage() as HTMLImageElement;
    image.setDisplaySize(height * (source.width / source.height), height);
  }

  private exitToMap(resetToProgress = false): void {
    if (this.leaving) return;
    this.leaving = true;
    this.inputLocked = true;
    this.animationEpoch += 1;
    this.input.enabled = false;
    this.tweens.killAll();
    this.time.removeAllEvents();
    this.hud.closeLightForestUi();
    const worldScene = this.scene.get('WorldScene') as WorldSceneLightForestBridge;
    this.scene.resume('WorldScene');
    worldScene.resumeFromLightForest(resetToProgress);
    if (resetToProgress) {
      this.hud.completeStoryModeRestartAfterReturn();
    }
    this.scene.stop();
  }

  private cleanup(): void {
    this.animationEpoch += 1;
    this.scale.off('resize', this.handleResize);
    this.input.keyboard?.resetKeys();
    this.tweens.killAll();
    this.hud.hideLightForestHud();
  }
}
