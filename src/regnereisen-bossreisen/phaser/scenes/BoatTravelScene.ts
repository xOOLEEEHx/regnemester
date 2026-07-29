import Phaser from 'phaser';
import {
  BOAT_SHIP_LEFT_ASSET_PATH,
  BOAT_SHIP_LEFT_TEXTURE_KEY,
  BOAT_SHIP_RIGHT_ASSET_PATH,
  BOAT_SHIP_RIGHT_TEXTURE_KEY,
  type BoatTravelPointId
} from '../../game/content/boatTravel';

type BoatTravelDirection = 'west-to-east' | 'east-to-west';

type BoatTravelSceneData = {
  direction: BoatTravelDirection;
  destinationId: BoatTravelPointId;
};

type WorldSceneBoatTravelBridge = Phaser.Scene & {
  completeBoatTravel: (destinationId: BoatTravelPointId) => void;
};

export class BoatTravelScene extends Phaser.Scene {
  private background?: Phaser.GameObjects.Graphics;
  private waterLines?: Phaser.GameObjects.Graphics;
  private ship?: Phaser.GameObjects.Image;
  private shipContainer?: Phaser.GameObjects.Container;
  private titleText?: Phaser.GameObjects.Text;
  private subtitleText?: Phaser.GameObjects.Text;
  private skipButton?: Phaser.GameObjects.Container;
  private elapsedMs = 0;
  private lastWaterDrawAt = -Infinity;
  private leaving = false;
  private direction: BoatTravelDirection = 'west-to-east';
  private destinationId: BoatTravelPointId = 'boatEast';

  private readonly handleResize = (): void => {
    this.layoutScene();
  };

  constructor(private readonly renderScale: number) {
    super({ key: 'BoatTravelScene' });
  }

  preload(): void {
    if (!this.textures.exists(BOAT_SHIP_RIGHT_TEXTURE_KEY)) {
      this.load.image(BOAT_SHIP_RIGHT_TEXTURE_KEY, BOAT_SHIP_RIGHT_ASSET_PATH);
    }
    if (!this.textures.exists(BOAT_SHIP_LEFT_TEXTURE_KEY)) {
      this.load.image(BOAT_SHIP_LEFT_TEXTURE_KEY, BOAT_SHIP_LEFT_ASSET_PATH);
    }
  }

  create(data: BoatTravelSceneData): void {
    this.elapsedMs = 0;
    this.lastWaterDrawAt = -Infinity;
    this.leaving = false;
    this.direction = data.direction;
    this.destinationId = data.destinationId;

    this.cameras.main.setBackgroundColor('#062f49');
    this.background = this.add.graphics().setDepth(-20);
    this.waterLines = this.add.graphics().setDepth(-10);

    this.titleText = this.add.text(0, 0, 'Båtreise', this.textStyle(30, '#fff6bd'))
      .setOrigin(0.5)
      .setDepth(40);
    this.subtitleText = this.add.text(0, 0, 'På vei over havet ...', this.textStyle(18, '#d7f5ff'))
      .setOrigin(0.5)
      .setDepth(40);

    const skipButtonBackground = this.add.rectangle(
      0,
      0,
      120 * this.renderScale,
      46 * this.renderScale,
      0x126f99,
      0.98
    )
      .setStrokeStyle(3 * this.renderScale, 0xb9f1ff, 1)
      .setInteractive({ useHandCursor: true });
    const skipButtonText = this.add.text(0, 0, 'Skip', this.textStyle(18, '#ffffff'))
      .setOrigin(0.5);
    skipButtonBackground.on('pointerup', () => this.finishTravel());
    this.skipButton = this.add.container(0, 0, [skipButtonBackground, skipButtonText]).setDepth(50);

    const textureKey = this.direction === 'west-to-east'
      ? BOAT_SHIP_RIGHT_TEXTURE_KEY
      : BOAT_SHIP_LEFT_TEXTURE_KEY;
    this.ship = this.add.image(0, 0, textureKey).setOrigin(0.5).setDepth(10);
    this.shipContainer = this.add.container(0, 0, [this.ship]).setDepth(10);

    this.scale.on('resize', this.handleResize);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanup());
    this.layoutScene();
    this.startCrossingAnimation();
    this.cameras.main.fadeIn(180, 5, 24, 40);
  }

  update(_: number, delta: number): void {
    this.elapsedMs += delta;
    if (this.elapsedMs - this.lastWaterDrawAt >= 66) {
      this.lastWaterDrawAt = this.elapsedMs;
      this.drawWaterLines(this.elapsedMs);
    }
  }

  private startCrossingAnimation(): void {
    if (!this.ship || !this.shipContainer) {
      return;
    }
    const width = this.scale.width;
    const height = this.scale.height;
    const shipWidth = Math.min(width * 0.62, 560 * this.renderScale);
    const source = this.textures.get(this.ship.texture.key).getSourceImage() as HTMLImageElement;
    const shipHeight = shipWidth * (source.height / source.width);
    this.ship.setDisplaySize(shipWidth, shipHeight);

    const padding = 70 * this.renderScale;
    const startX = this.direction === 'west-to-east'
      ? -shipWidth / 2 - padding
      : width + shipWidth / 2 + padding;
    const endX = this.direction === 'west-to-east'
      ? width + shipWidth / 2 + padding
      : -shipWidth / 2 - padding;
    const travelY = Math.max(175 * this.renderScale, height * 0.59);
    this.shipContainer.setPosition(startX, travelY);

    this.tweens.add({
      targets: this.ship,
      y: 7 * this.renderScale,
      angle: this.direction === 'west-to-east' ? 1.2 : -1.2,
      duration: 620,
      ease: 'Sine.inOut',
      yoyo: true,
      repeat: -1
    });
    this.tweens.add({
      targets: this.shipContainer,
      x: endX,
      duration: 5500,
      ease: 'Sine.inOut',
      onComplete: () => this.finishTravel()
    });
  }

  private finishTravel(): void {
    if (this.leaving) {
      return;
    }
    this.leaving = true;
    this.skipButton?.setVisible(false);
    const worldScene = this.scene.get('WorldScene') as WorldSceneBoatTravelBridge;
    worldScene.completeBoatTravel(this.destinationId);
    this.scene.resume('WorldScene');
    this.scene.stop();
  }

  private layoutScene(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    this.background?.clear();
    this.background?.fillStyle(0x062f49, 1).fillRect(0, 0, width, height);
    this.background?.fillStyle(0x0a5270, 0.72).fillRect(0, height * 0.18, width, height * 0.34);
    this.background?.fillStyle(0x087c94, 0.36).fillRect(0, height * 0.52, width, height * 0.48);
    this.background?.fillStyle(0x031d31, 0.83).fillRect(0, 0, width, 96 * this.renderScale);
    this.titleText?.setPosition(width / 2, 34 * this.renderScale);
    this.subtitleText?.setPosition(width / 2, 73 * this.renderScale);
    this.skipButton?.setPosition(width - 82 * this.renderScale, 48 * this.renderScale);
    this.drawWaterLines(this.elapsedMs);
  }

  private drawWaterLines(time: number): void {
    const graphics = this.waterLines;
    if (!graphics) {
      return;
    }
    const width = this.scale.width;
    const height = this.scale.height;
    graphics.clear();
    for (let row = 0; row < 10; row += 1) {
      const y = 120 * this.renderScale + row * ((height - 150 * this.renderScale) / 10);
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

  private cleanup(): void {
    this.scale.off('resize', this.handleResize);
    this.tweens.killAll();
  }
}
