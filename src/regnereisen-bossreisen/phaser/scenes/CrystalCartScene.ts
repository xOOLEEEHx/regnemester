import Phaser from 'phaser';
import {
  CRYSTAL_CART_BARRIER_ASSET_PATH,
  CRYSTAL_CART_BARRIER_TEXTURE_KEY,
  CRYSTAL_CART_JUNCTION_BACKGROUNDS,
  CRYSTAL_CART_REAR_ASSET_PATH,
  CRYSTAL_CART_REAR_TEXTURE_KEY,
  CRYSTAL_CART_ROUTE_BEACON_ASSET_PATH,
  CRYSTAL_CART_ROUTE_BEACON_TEXTURE_KEY
} from '../../game/content/crystalCart';
import { getTokenById } from '../../game/content/playerTokens';
import {
  answerCrystalCartQuestion,
  createCrystalCartRun,
  type CrystalCartRunState
} from '../../game/simulation/crystalCartRun';
import type { ProgressStore } from '../../game/simulation/progress';
import type { CrystalCartRideView, HudController } from '../../ui/hud';

type WorldSceneCrystalCartBridge = Phaser.Scene & {
  resumeFromCrystalCart: (resetToProgress?: boolean) => void;
};

type RouteMarker = {
  container: Phaser.GameObjects.Container;
  glow: Phaser.GameObjects.Arc;
  beacon: Phaser.GameObjects.Image;
  answerText: Phaser.GameObjects.Text;
  answer?: number;
};

type ScenePhase = 'approach' | 'choice' | 'route' | 'transition' | 'finished';

type NormalizedPoint = readonly [x: number, y: number];

const ROUTE_COLORS = [0x55e8ff, 0xa879ff, 0xffd25f, 0x65f0c4] as const;

const ENTRY_PATH: readonly NormalizedPoint[] = [
  [0.5, 1.03],
  [0.5, 0.87],
  [0.5, 0.72],
  [0.5, 0.59]
];

// These paths are invisible. They follow the four rails that are rendered into
// the approved junction illustrations, so the cart can never drift away from a track.
const ROUTE_PATHS: readonly (readonly NormalizedPoint[])[] = [
  [[0.5, 0.59], [0.44, 0.56], [0.36, 0.50], [0.28, 0.41], [0.20, 0.29], [0.14, 0.17]],
  [[0.5, 0.59], [0.47, 0.55], [0.43, 0.48], [0.39, 0.39], [0.36, 0.27], [0.36, 0.17]],
  [[0.5, 0.59], [0.53, 0.55], [0.57, 0.48], [0.61, 0.39], [0.64, 0.27], [0.66, 0.17]],
  [[0.5, 0.59], [0.56, 0.56], [0.64, 0.50], [0.72, 0.41], [0.80, 0.29], [0.87, 0.17]]
];

// Exact centers of the four tunnel openings in the junction artwork. Keeping
// these independent of the rail splines prevents markers from drifting above
// or beside an entrance when the viewport is cropped responsively.
const TUNNEL_CENTERS: readonly NormalizedPoint[] = [
  [0.14, 0.17],
  [0.36, 0.17],
  [0.66, 0.17],
  [0.87, 0.17]
];

const DANGER_IMPACT_PROGRESS = 0.9;
const DANGER_RECOIL_PROGRESS = 0.75;

export class CrystalCartScene extends Phaser.Scene {
  private backgrounds: Phaser.GameObjects.Image[] = [];
  private activeBackgroundIndex = 0;
  private shade?: Phaser.GameObjects.Graphics;
  private switchGlow?: Phaser.GameObjects.Arc;
  private cart?: Phaser.GameObjects.Container;
  private cartVisual?: Phaser.GameObjects.Container;
  private cartBody?: Phaser.GameObjects.Image;
  private playerToken?: Phaser.GameObjects.Image;
  private barrier?: Phaser.GameObjects.Image;
  private routeMarkers: RouteMarker[] = [];
  private run?: CrystalCartRunState;
  private phase: ScenePhase = 'approach';
  private inputLocked = true;
  private leaving = false;
  private elapsedMs = 0;
  private artScale = 1;
  private artOffsetX = 0;
  private artOffsetY = 0;
  private cartEntryScale = 1;
  private cartSwitchScale = 0.68;
  private cartTunnelScale = 0.29;
  private activeMoveTween?: Phaser.Tweens.Tween;

  private readonly handleResize = (): void => this.layoutScene();
  private readonly handleNumberKey = (event: KeyboardEvent): void => {
    if (event.key < '1' || event.key > '4' || this.inputLocked || !this.run) {
      return;
    }
    const choice = this.run.challenge.question.choices[Number(event.key) - 1];
    if (choice !== undefined) {
      event.preventDefault();
      this.chooseAnswer(choice);
    }
  };

  constructor(
    private readonly progress: ProgressStore,
    private readonly hud: HudController,
    private readonly renderScale: number
  ) {
    super({ key: 'CrystalCartScene' });
  }

  preload(): void {
    for (const background of CRYSTAL_CART_JUNCTION_BACKGROUNDS) {
      if (!this.textures.exists(background.key)) {
        this.load.image(background.key, background.path);
      }
    }
    const assets = [
      [CRYSTAL_CART_REAR_TEXTURE_KEY, CRYSTAL_CART_REAR_ASSET_PATH],
      [CRYSTAL_CART_ROUTE_BEACON_TEXTURE_KEY, CRYSTAL_CART_ROUTE_BEACON_ASSET_PATH],
      [CRYSTAL_CART_BARRIER_TEXTURE_KEY, CRYSTAL_CART_BARRIER_ASSET_PATH]
    ] as const;
    for (const [key, path] of assets) {
      if (!this.textures.exists(key)) {
        this.load.image(key, path);
      }
    }

    const token = getTokenById(this.progress.getSettings().tokenId);
    const tokenKey = `token-${token.id}`;
    if (!this.textures.exists(tokenKey)) {
      this.load.image(tokenKey, token.src);
    }
  }

  create(): void {
    this.leaving = false;
    this.inputLocked = true;
    this.elapsedMs = 0;
    this.phase = 'approach';
    this.routeMarkers = [];
    this.run = createCrystalCartRun(
      this.progress.getSettings(),
      this.progress.getBattleHearts()
    );

    this.cameras.main.setBackgroundColor('#01050d');
    this.backgrounds = CRYSTAL_CART_JUNCTION_BACKGROUNDS.map((background, index) => (
      this.add.image(0, 0, background.key)
        .setOrigin(0.5)
        .setDepth(-30 + index)
        .setAlpha(index === 0 ? 1 : 0)
    ));
    this.shade = this.add.graphics().setDepth(2);
    this.switchGlow = this.add.circle(0, 0, 56 * this.renderScale, 0x54dcff, 0.08)
      .setStrokeStyle(4 * this.renderScale, 0x8cecff, 0.34)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(4)
      .setVisible(false);

    this.createRouteMarkers();
    this.createBarrier();
    this.createCart();

    this.scale.on('resize', this.handleResize);
    window.addEventListener('keydown', this.handleNumberKey);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanup());

    this.layoutScene();
    this.renderHud();
    this.cameras.main.fadeIn(420, 1, 5, 13);
    this.time.delayedCall(460, () => this.startApproach());
  }

  update(_: number, delta: number): void {
    this.elapsedMs += delta;
    if (!this.cartVisual) {
      return;
    }
    const speed = this.phase === 'route' ? 0.018 : 0.009;
    const strength = this.phase === 'route' ? 2.2 : 0.9;
    this.cartVisual.y = Math.sin(this.elapsedMs * speed) * strength * this.renderScale;
    this.cartVisual.angle = Math.sin(this.elapsedMs * speed * 0.62) * (this.phase === 'route' ? 1.35 : 0.42);
  }

  private createCart(): void {
    const token = getTokenById(this.progress.getSettings().tokenId);
    const tokenKey = `token-${token.id}`;
    this.cartBody = this.add.image(0, 0, CRYSTAL_CART_REAR_TEXTURE_KEY).setOrigin(0.5);
    this.playerToken = this.add.image(0, 0, tokenKey).setOrigin(0.5);
    this.cartVisual = this.add.container(0, 0, [this.cartBody, this.playerToken]);
    this.cart = this.add.container(0, 0, [this.cartVisual]).setDepth(20);
  }

  private createBarrier(): void {
    this.barrier = this.add.image(0, 0, CRYSTAL_CART_BARRIER_TEXTURE_KEY)
      .setOrigin(0.5, 0.78)
      .setDepth(22)
      .setVisible(false);
  }

  private createRouteMarkers(): void {
    ROUTE_COLORS.forEach((color, index) => {
      const glow = this.add.circle(0, 0, 43 * this.renderScale, color, 0.1)
        .setStrokeStyle(3 * this.renderScale, color, 0.58)
        .setBlendMode(Phaser.BlendModes.ADD);
      const beacon = this.add.image(0, 0, CRYSTAL_CART_ROUTE_BEACON_TEXTURE_KEY).setOrigin(0.5);
      const answerText = this.add.text(0, 0, '?', {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: `${27 * this.renderScale}px`,
        color: '#ffffff',
        stroke: '#031027',
        strokeThickness: 7 * this.renderScale,
        shadow: {
          color: '#000000',
          blur: 6 * this.renderScale,
          offsetX: 0,
          offsetY: 2 * this.renderScale,
          fill: true
        }
      }).setOrigin(0.5);
      const container = this.add.container(0, 0, [glow, beacon, answerText])
        .setDepth(24)
        .setAlpha(0)
        .setScale(0.7)
        .setSize(100 * this.renderScale, 112 * this.renderScale)
        .setInteractive({ cursor: 'pointer' });
      const marker: RouteMarker = { container, glow, beacon, answerText };

      container.on('pointerover', () => {
        if (!this.inputLocked && this.phase === 'choice') {
          this.tweens.add({ targets: container, scale: 1.09, duration: 130, ease: 'Quad.easeOut' });
          glow.setAlpha(0.3);
        }
      });
      container.on('pointerout', () => {
        if (this.phase === 'choice') {
          this.tweens.add({ targets: container, scale: 1, duration: 130, ease: 'Quad.easeOut' });
          glow.setAlpha(0.14);
        }
      });
      container.on('pointerdown', () => {
        if (!this.inputLocked && this.phase === 'choice' && marker.answer !== undefined) {
          this.chooseAnswer(marker.answer);
        }
      });

      this.tweens.add({
        targets: glow,
        scale: 1.16,
        alpha: 0.04,
        duration: 820 + index * 95,
        ease: 'Sine.inOut',
        yoyo: true,
        repeat: -1
      });
      this.routeMarkers.push(marker);
    });
  }

  private startApproach(): void {
    if (!this.run || !this.sys.isActive() || this.run.challenge.status !== 'active') {
      return;
    }
    this.phase = 'approach';
    this.inputLocked = true;
    this.hideRouteMarkers();
    this.barrier?.setVisible(false);
    this.renderHud();

    const path = this.createSpline(ENTRY_PATH);
    this.moveCartAlong(
      path,
      0,
      1,
      this.cartEntryScale,
      this.cartSwitchScale,
      1550,
      'Sine.easeOut',
      () => {
        if (!this.run || !this.sys.isActive()) {
          return;
        }
        this.phase = 'choice';
        this.revealRouteMarkers();
      }
    );
  }

  private revealRouteMarkers(): void {
    this.updateRouteMarkers();
    this.routeMarkers.forEach((marker, index) => {
      marker.container.setAlpha(0).setScale(0.62).setAngle(index % 2 === 0 ? -4 : 4);
      this.tweens.add({
        targets: marker.container,
        alpha: 1,
        scale: 1,
        angle: 0,
        duration: 300,
        delay: index * 80,
        ease: 'Back.easeOut'
      });
    });
    this.time.delayedCall(300, () => {
      if (this.phase !== 'choice' || !this.run) {
        return;
      }
      this.inputLocked = false;
      this.updateRouteMarkers();
      this.renderHud();
    });
  }

  private chooseAnswer(choice: number): void {
    if (!this.run || this.run.challenge.status !== 'active' || this.inputLocked || this.phase !== 'choice') {
      return;
    }

    this.inputLocked = true;
    this.phase = 'route';
    const previous = this.run;
    const next = answerCrystalCartQuestion(previous, choice);
    const correct = next.challenge.lastAnswerCorrect === true;
    const routeIndex = Math.max(0, previous.challenge.question.choices.indexOf(choice));
    this.run = next;

    if (!correct) {
      this.progress.recordDamageTaken();
      if (next.challenge.settings.playMode === 'story') {
        if (next.challenge.status === 'lost') {
          this.hud.restartStoryModeAfterFailure();
        } else {
          this.progress.setStoryLives(next.challenge.playerHp);
        }
      }
    }

    this.renderAnsweredHud(previous);
    this.showSelectedRoute(routeIndex, correct);
    if (correct) {
      this.animateCorrectRoute(routeIndex);
    } else {
      this.animateDangerRoute(routeIndex);
    }
  }

  private animateCorrectRoute(routeIndex: number): void {
    const path = this.createRouteSpline(routeIndex);
    const routeColor = ROUTE_COLORS[routeIndex];
    this.cameras.main.zoomTo(1.055, 900, 'Sine.easeInOut');
    this.time.delayedCall(560, () => this.emitCrystalBurst(routeColor, 24));
    this.moveCartAlong(
      path,
      0,
      1,
      this.cartSwitchScale,
      this.cartTunnelScale,
      1500,
      'Sine.easeIn',
      () => {
        this.emitCrystalBurst(0xb6f6ff, 34);
        this.cameras.main.flash(260, 91, 219, 255, false);
        this.time.delayedCall(180, () => this.finishRouteAnimation());
      }
    );
  }

  private animateDangerRoute(routeIndex: number): void {
    const path = this.createRouteSpline(routeIndex);
    this.slamBarrier(routeIndex);
    this.cameras.main.zoomTo(1.04, 700, 'Sine.easeInOut');
    this.time.delayedCall(170, () => {
      this.moveCartAlong(
        path,
        0,
        DANGER_IMPACT_PROGRESS,
        this.cartSwitchScale,
        this.cartTunnelScale * 1.16,
        1240,
        'Cubic.easeIn',
        () => {
          this.cameras.main.flash(330, 184, 19, 45, false);
          this.cameras.main.shake(520, 0.017, true);
          this.emitBrakeSparks();
          this.tweens.add({
            targets: this.cartVisual,
            x: { from: -7 * this.renderScale, to: 7 * this.renderScale },
            duration: 54,
            yoyo: true,
            repeat: 5,
            onComplete: () => this.cartVisual?.setX(0)
          });
          this.time.delayedCall(500, () => {
            this.moveCartAlong(
              path,
              DANGER_IMPACT_PROGRESS,
              DANGER_RECOIL_PROGRESS,
              this.cartTunnelScale * 1.16,
              0.46,
              420,
              'Quad.easeOut',
              () => this.finishRouteAnimation()
            );
          });
        }
      );
    });
  }

  private slamBarrier(routeIndex: number): void {
    if (!this.barrier) {
      return;
    }
    const tunnelCenter = TUNNEL_CENTERS[routeIndex] ?? TUNNEL_CENTERS[0];
    const point = this.toWorld(...tunnelCenter);
    const height = 104 * this.renderScale;
    const source = this.textures.get(CRYSTAL_CART_BARRIER_TEXTURE_KEY).getSourceImage() as HTMLImageElement;
    const width = height * (source.width / source.height);
    const finalY = point.y + height * 0.28;
    this.barrier
      .setDisplaySize(width, height)
      .setPosition(point.x, finalY - 68 * this.renderScale)
      .setAlpha(0)
      .setVisible(true);
    this.tweens.add({
      targets: this.barrier,
      y: finalY,
      alpha: 1,
      duration: 350,
      ease: 'Bounce.easeOut',
      onComplete: () => {
        this.cameras.main.shake(210, 0.008, true);
        this.emitRockDust(point.x, point.y + 30 * this.renderScale);
      }
    });
  }

  private finishRouteAnimation(): void {
    if (!this.run || !this.sys.isActive()) {
      return;
    }
    this.phase = 'transition';
    this.inputLocked = true;
    this.cameras.main.fadeOut(360, 1, 5, 13);
    this.time.delayedCall(390, () => {
      if (!this.run || !this.sys.isActive()) {
        return;
      }
      if (this.run.challenge.status === 'won') {
        this.phase = 'finished';
        this.hud.hideCrystalCartRide();
        this.hud.setWorldHudVisible(true);
        this.hud.openCrystalCartReward(this.run.rewardValue, () => this.exitToMap());
        return;
      }
      if (this.run.challenge.status === 'lost') {
        this.phase = 'finished';
        this.hud.hideCrystalCartRide();
        const storyFailed = this.run.challenge.settings.playMode === 'story';
        this.hud.openCrystalCartFailure(storyFailed, () => this.exitToMap(storyFailed));
        return;
      }

      this.prepareNextJunction();
      this.cameras.main.fadeIn(390, 1, 5, 13);
      this.time.delayedCall(300, () => this.startApproach());
    });
  }

  private prepareNextJunction(): void {
    if (!this.run) {
      return;
    }
    this.phase = 'approach';
    this.inputLocked = true;
    this.cameras.main.setZoom(1);
    this.cameras.main.setScroll(0, 0);
    this.setBackgroundForProgress();
    this.hideRouteMarkers();
    this.barrier?.setVisible(false);
    const start = this.createSpline(ENTRY_PATH).getPoint(0);
    this.cart?.setPosition(start.x, start.y).setScale(this.cartEntryScale).setAngle(0).setAlpha(1);
    this.run = {
      ...this.run,
      message: `Veikryss ${Math.min(this.run.challenge.correct + 1, this.run.challenge.requiredCorrect)} nærmer seg.`
    };
    this.renderHud();
  }

  private setBackgroundForProgress(): void {
    if (!this.run) {
      return;
    }
    const ratio = this.run.challenge.correct / Math.max(1, this.run.challenge.requiredCorrect);
    const nextIndex = Math.min(
      this.backgrounds.length - 1,
      Math.floor(ratio * this.backgrounds.length)
    );
    this.activeBackgroundIndex = nextIndex;
    this.backgrounds.forEach((background, index) => background.setAlpha(index === nextIndex ? 1 : 0));
  }

  private showSelectedRoute(routeIndex: number, correct: boolean): void {
    this.routeMarkers.forEach((marker, index) => {
      if (index !== routeIndex) {
        this.tweens.add({ targets: marker.container, alpha: 0.12, scale: 0.82, duration: 220 });
        return;
      }
      const resultColor = correct ? 0x7dffd8 : 0xff526d;
      marker.answerText.setText(correct ? '✓' : '!');
      marker.glow.setFillStyle(resultColor, 0.38).setStrokeStyle(7 * this.renderScale, resultColor, 1);
      this.tweens.add({
        targets: marker.container,
        scale: correct ? 1.24 : 1.16,
        angle: correct ? 0 : routeIndex % 2 === 0 ? -5 : 5,
        duration: 170,
        ease: 'Back.easeOut',
        yoyo: true,
        repeat: correct ? 0 : 2
      });
      this.time.delayedCall(correct ? 520 : 360, () => {
        this.tweens.add({ targets: marker.container, alpha: 0, duration: 260 });
      });
    });
  }

  private moveCartAlong(
    path: Phaser.Curves.Spline,
    from: number,
    to: number,
    fromScale: number,
    toScale: number,
    duration: number,
    ease: string,
    onComplete: () => void
  ): void {
    if (!this.cart) {
      onComplete();
      return;
    }
    this.activeMoveTween?.stop();
    const tracker = { value: from };
    const applyPosition = (): void => {
      if (!this.cart) {
        return;
      }
      const point = path.getPoint(tracker.value);
      const tangent = path.getTangent(tracker.value);
      const progress = Math.abs(to - from) < 0.0001
        ? 1
        : Math.abs((tracker.value - from) / (to - from));
      const tangentAngle = Phaser.Math.RadToDeg(Math.atan2(tangent.y, tangent.x));
      this.cart
        .setPosition(point.x, point.y)
        .setScale(Phaser.Math.Linear(fromScale, toScale, progress))
        .setAngle(Phaser.Math.Clamp(tangentAngle + 90, -29, 29));
    };
    applyPosition();
    this.activeMoveTween = this.tweens.add({
      targets: tracker,
      value: to,
      duration,
      ease,
      onUpdate: applyPosition,
      onComplete
    });
  }

  private emitBrakeSparks(): void {
    if (!this.cart) {
      return;
    }
    for (let index = 0; index < 38; index += 1) {
      const spark = this.add.rectangle(
        this.cart.x + Phaser.Math.Between(-40, 40) * this.renderScale,
        this.cart.y + Phaser.Math.Between(25, 54) * this.renderScale,
        Phaser.Math.Between(3, 7) * this.renderScale,
        Phaser.Math.Between(10, 24) * this.renderScale,
        index % 3 === 0 ? 0xffffff : index % 2 === 0 ? 0xffda58 : 0xff6d2f,
        1
      ).setDepth(31).setAngle(Phaser.Math.Between(-70, 70)).setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({
        targets: spark,
        x: spark.x + Phaser.Math.Between(-150, 150) * this.renderScale,
        y: spark.y + Phaser.Math.Between(35, 120) * this.renderScale,
        alpha: 0,
        scaleY: 0.2,
        angle: spark.angle + Phaser.Math.Between(-180, 180),
        duration: Phaser.Math.Between(380, 760),
        ease: 'Quad.easeOut',
        onComplete: () => spark.destroy()
      });
    }
    this.emitRockDust(this.cart.x, this.cart.y + 42 * this.renderScale);
  }

  private emitRockDust(x: number, y: number): void {
    for (let index = 0; index < 16; index += 1) {
      const dust = this.add.circle(
        x + Phaser.Math.Between(-65, 65) * this.renderScale,
        y + Phaser.Math.Between(-5, 25) * this.renderScale,
        Phaser.Math.Between(10, 24) * this.renderScale,
        index % 2 === 0 ? 0x746859 : 0x302d31,
        0.68
      ).setDepth(30);
      this.tweens.add({
        targets: dust,
        x: dust.x + Phaser.Math.Between(-80, 80) * this.renderScale,
        y: dust.y - Phaser.Math.Between(25, 95) * this.renderScale,
        scale: Phaser.Math.FloatBetween(1.4, 2.5),
        alpha: 0,
        duration: Phaser.Math.Between(620, 1050),
        ease: 'Sine.easeOut',
        onComplete: () => dust.destroy()
      });
    }
  }

  private emitCrystalBurst(color: number, count: number): void {
    if (!this.cart) {
      return;
    }
    for (let index = 0; index < count; index += 1) {
      const shard = this.add.triangle(
        this.cart.x,
        this.cart.y,
        0,
        -9 * this.renderScale,
        5 * this.renderScale,
        7 * this.renderScale,
        -5 * this.renderScale,
        7 * this.renderScale,
        index % 4 === 0 ? 0xffffff : color,
        0.96
      ).setDepth(32).setBlendMode(Phaser.BlendModes.ADD);
      const angle = Phaser.Math.FloatBetween(-Math.PI, Math.PI);
      const distance = Phaser.Math.Between(55, 185) * this.renderScale;
      this.tweens.add({
        targets: shard,
        x: shard.x + Math.cos(angle) * distance,
        y: shard.y + Math.sin(angle) * distance,
        angle: Phaser.Math.Between(-220, 220),
        scale: 0.12,
        alpha: 0,
        duration: Phaser.Math.Between(520, 940),
        ease: 'Cubic.easeOut',
        onComplete: () => shard.destroy()
      });
    }
  }

  private renderHud(): void {
    if (!this.run) {
      return;
    }
    this.updateRouteMarkers();
    this.hud.openCrystalCartRide(
      this.toRideView(),
      (answer) => this.chooseAnswer(answer),
      () => this.exitToMap(),
      () => this.completeForDev()
    );
  }

  private renderAnsweredHud(previous: CrystalCartRunState): void {
    if (!this.run) {
      return;
    }
    this.hud.renderCrystalCartRide(
      {
        ...this.toRideView(),
        prompt: previous.challenge.question.prompt,
        choices: [...previous.challenge.question.choices]
      },
      (answer) => this.chooseAnswer(answer),
      () => this.exitToMap(),
      () => this.completeForDev()
    );
  }

  private toRideView(): CrystalCartRideView {
    const challenge = this.run!.challenge;
    return {
      checkpoint: Math.min(challenge.correct + 1, challenge.requiredCorrect),
      completedCheckpoints: challenge.correct,
      checkpointCount: challenge.requiredCorrect,
      playerHp: challenge.playerHp,
      maxPlayerHp: challenge.maxPlayerHp,
      prompt: challenge.question.prompt,
      choices: [...challenge.question.choices],
      message: this.run!.message,
      inputLocked: this.inputLocked
    };
  }

  private completeForDev(): void {
    if (!this.run || this.inputLocked || this.run.challenge.status !== 'active') {
      return;
    }
    let next = this.run;
    while (next.challenge.status === 'active') {
      next = answerCrystalCartQuestion(next, next.challenge.question.answer);
    }
    this.run = next;
    this.inputLocked = true;
    this.phase = 'finished';
    this.hideRouteMarkers();
    this.emitCrystalBurst(0xffdc6a, 46);
    this.cameras.main.flash(420, 76, 205, 255, false);
    this.time.delayedCall(430, () => {
      if (!this.run) {
        return;
      }
      this.hud.hideCrystalCartRide();
      this.hud.setWorldHudVisible(true);
      this.hud.openCrystalCartReward(this.run.rewardValue, () => this.exitToMap());
    });
  }

  private layoutScene(): void {
    if (this.backgrounds.length === 0) {
      return;
    }
    const width = this.scale.width;
    const height = this.scale.height;
    const source = this.textures.get(CRYSTAL_CART_JUNCTION_BACKGROUNDS[0].key).getSourceImage() as HTMLImageElement;
    this.artScale = Math.max(width / source.width, height / source.height);
    const displayWidth = source.width * this.artScale;
    const displayHeight = source.height * this.artScale;
    this.artOffsetX = (width - displayWidth) / 2;
    this.artOffsetY = (height - displayHeight) / 2;
    this.backgrounds.forEach((background) => {
      background.setPosition(width / 2, height / 2).setDisplaySize(displayWidth, displayHeight);
    });

    this.shade?.clear();
    this.shade?.fillGradientStyle(0x01040b, 0x01040b, 0x020813, 0x020813, 0.48, 0.48, 0.02, 0.02);
    this.shade?.fillRect(0, 0, width, Math.min(height * 0.3, 245 * this.renderScale));
    this.shade?.fillGradientStyle(0x01040a, 0x01040a, 0x01040a, 0x01040a, 0, 0, 0.38, 0.38);
    this.shade?.fillRect(0, height * 0.72, width, height * 0.28);

    const switchPoint = this.toWorld(0.5, 0.59);
    this.switchGlow?.setPosition(switchPoint.x, switchPoint.y);

    const cartSource = this.textures.get(CRYSTAL_CART_REAR_TEXTURE_KEY).getSourceImage() as HTMLImageElement;
    const cartHeight = Math.min(height * 0.34, 300 * this.renderScale);
    const cartWidth = cartHeight * (cartSource.width / cartSource.height);
    this.cartBody?.setDisplaySize(cartWidth, cartHeight);
    this.playerToken?.setDisplaySize(cartWidth * 0.52, cartWidth * 0.52)
      .setPosition(0, -cartHeight * 0.22);

    this.layoutRouteMarkers();
    if (this.phase === 'choice') {
      this.cart?.setPosition(switchPoint.x, switchPoint.y).setScale(this.cartSwitchScale).setAngle(0);
    } else if (this.phase === 'approach') {
      const entry = this.createSpline(ENTRY_PATH).getPoint(0);
      this.cart?.setPosition(entry.x, entry.y).setScale(this.cartEntryScale).setAngle(0);
    }
  }

  private layoutRouteMarkers(): void {
    const source = this.textures.get(CRYSTAL_CART_ROUTE_BEACON_TEXTURE_KEY).getSourceImage() as HTMLImageElement;
    const beaconHeight = 104 * this.renderScale;
    const beaconWidth = beaconHeight * (source.width / source.height);
    this.routeMarkers.forEach((marker, index) => {
      const tunnelCenter = TUNNEL_CENTERS[index] ?? TUNNEL_CENTERS[0];
      const point = this.toWorld(...tunnelCenter);
      marker.container.setPosition(point.x, point.y);
      marker.beacon.setDisplaySize(beaconWidth, beaconHeight);
      marker.container.setSize(100 * this.renderScale, 112 * this.renderScale);
    });
  }

  private updateRouteMarkers(choices = this.run?.challenge.question.choices): void {
    this.routeMarkers.forEach((marker, index) => {
      marker.answer = choices?.[index];
      marker.answerText.setText(marker.answer === undefined ? '?' : String(marker.answer));
      marker.glow
        .setFillStyle(ROUTE_COLORS[index], 0.14)
        .setStrokeStyle(4 * this.renderScale, ROUTE_COLORS[index], 0.7);
      if (marker.container.input) {
        marker.container.input.enabled = !this.inputLocked && this.phase === 'choice';
      }
    });
  }

  private hideRouteMarkers(): void {
    this.routeMarkers.forEach((marker) => {
      marker.container.setAlpha(0).setScale(0.7).setAngle(0);
      if (marker.container.input) {
        marker.container.input.enabled = false;
      }
    });
  }

  private createRouteSpline(routeIndex: number): Phaser.Curves.Spline {
    return this.createSpline(ROUTE_PATHS[routeIndex] ?? ROUTE_PATHS[0]);
  }

  private createSpline(points: readonly NormalizedPoint[]): Phaser.Curves.Spline {
    return new Phaser.Curves.Spline(points.map(([x, y]) => this.toWorld(x, y)));
  }

  private toWorld(normalizedX: number, normalizedY: number): Phaser.Math.Vector2 {
    const source = this.textures.get(CRYSTAL_CART_JUNCTION_BACKGROUNDS[0].key).getSourceImage() as HTMLImageElement;
    return new Phaser.Math.Vector2(
      this.artOffsetX + source.width * normalizedX * this.artScale,
      this.artOffsetY + source.height * normalizedY * this.artScale
    );
  }

  private exitToMap(resetToProgress = false): void {
    if (this.leaving) {
      return;
    }
    this.leaving = true;
    this.hud.closeCrystalCartUi();
    const worldScene = this.scene.get('WorldScene') as WorldSceneCrystalCartBridge;
    worldScene.resumeFromCrystalCart(resetToProgress);
    this.scene.resume('WorldScene');
    if (resetToProgress) {
      this.hud.completeStoryModeRestartAfterReturn();
    }
    this.scene.stop();
  }

  private cleanup(): void {
    this.scale.off('resize', this.handleResize);
    window.removeEventListener('keydown', this.handleNumberKey);
    this.activeMoveTween?.stop();
    this.tweens.killAll();
    this.hud.hideCrystalCartRide();
  }
}
