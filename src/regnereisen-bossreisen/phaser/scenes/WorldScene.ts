import Phaser from 'phaser';
import { LOCATIONS, type LocationNode, WORLD_SIZE } from '../../game/content/locations';
import {
  getRewardCoinOffset,
  isMapBossMarkerLocation,
  isRewardLocation,
  RED_COLLISION_MASK_PATH,
  RED_COLLISION_MASK_TEST
} from '../../game/content/mapExperiment';
import { MEDALS, type MedalId } from '../../game/content/medals';
import { getTokenById, PLAYER_TOKENS } from '../../game/content/playerTokens';
import { FINAL_REWARD_POSITION, type ProgressStore } from '../../game/simulation/progress';
import type { HudController } from '../../ui/hud';

type NodeView = {
  location: LocationNode;
  ring: Phaser.GameObjects.Arc;
  core: Phaser.GameObjects.Arc;
  label: Phaser.GameObjects.Text;
  state: Phaser.GameObjects.Text;
  bossSprite?: Phaser.GameObjects.Image;
  bossShadow?: Phaser.GameObjects.Ellipse;
  rewardCoin?: Phaser.GameObjects.Container;
};

const INTERACT_DISTANCE = 115;
const COIN_PICKUP_DISTANCE = 76;
const FINAL_REWARD_PICKUP_DISTANCE = 92;
const MAP_BOSS_TEXTURE_SIZE = 144;
const MAP_BOSS_VISUAL_SIZE = 118;
const MAP_BOSS_RING_RADIUS = 76;
const MAP_BOSS_ALPHA_THRESHOLD = 48;
const PLAYER_TOKEN_TEXTURE_SIZE = 512;
const PLAYER_TOKEN_VISUAL_SIZE = 448;
const PLAYER_TOKEN_ALPHA_THRESHOLD = 24;
const COLLISION_EDGE_PADDING = 56;
const RED_COLLISION_THRESHOLD = 160;
const KEYBOARD_MOVE_SPEED = 0.34;
const POINTER_TARGET_MOVE_SPEED = 0.29;
const TOUCH_JOYSTICK_MOVE_SPEED = 0.32;
const TOUCH_JOYSTICK_DEAD_ZONE = 10;
const TOUCH_JOYSTICK_MAX_DISTANCE = 84;
const DESKTOP_CAMERA_ZOOM = 0.82;
const MOBILE_CAMERA_ZOOM = 0.62;
const MOBILE_CAMERA_MEDIA_QUERY = '(max-width: 600px)';
const RED_COLLISION_SAMPLE_OFFSETS = [
  { x: 0, y: 0 },
  { x: 0, y: 16 },
  { x: -12, y: 10 },
  { x: 12, y: 10 },
  { x: -18, y: 0 },
  { x: 18, y: 0 },
  { x: 0, y: -10 }
] as const;

function getMapBossTextureKey(location: LocationNode, mood: 'idle' | 'defeated'): string {
  return `map-boss-${location.id}-${mood}`;
}

function getMapBossSourceTextureKey(location: LocationNode, mood: 'idle' | 'defeated'): string {
  return `${getMapBossTextureKey(location, mood)}-source`;
}

function getMedalTextureKey(id: MedalId): string {
  return `medal-${id}`;
}

function getPlayerTokenTextureKey(tokenId: string): string {
  return `token-${tokenId}`;
}

function getPlayerTokenSourceTextureKey(tokenId: string): string {
  return `${getPlayerTokenTextureKey(tokenId)}-source`;
}

export class WorldScene extends Phaser.Scene {
  private player?: Phaser.GameObjects.Image;
  private marker?: Phaser.GameObjects.Arc;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd?: Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;
  private interactKey?: Phaser.Input.Keyboard.Key;
  private nodeViews: NodeView[] = [];
  private nearby?: LocationNode;
  private moveTarget?: Phaser.Math.Vector2;
  private saveTimer = 0;
  private collisionMaskPixels?: Uint8ClampedArray;
  private collisionMaskWidth = 0;
  private collisionMaskHeight = 0;
  private lastCollisionBlockToast = 0;
  private finalReward?: Phaser.GameObjects.Container;
  private finalRewardMedal?: Phaser.GameObjects.Image;
  private heldPointer?: Phaser.Input.Pointer;
  private heldPointerUsesJoystick = false;
  private joystickOrigin?: Phaser.Math.Vector2;
  private joystickDirection = new Phaser.Math.Vector2(0, 0);
  private touchInputCanvas?: HTMLCanvasElement;
  private activeTouchId?: number;
  private readonly touchListenerOptions: AddEventListenerOptions = { passive: false };
  private readonly handleCanvasTouchStart = (event: TouchEvent): void => {
    if (this.hud.isWorldBlocked() || event.changedTouches.length === 0) {
      return;
    }

    const touch = event.changedTouches[0];
    const point = this.getCanvasPointFromClient(touch.clientX, touch.clientY);
    if (!point) {
      return;
    }

    event.preventDefault();
    this.activeTouchId = touch.identifier;
    this.heldPointer = undefined;
    this.startJoystickAt(point.x, point.y);
  };
  private readonly handleCanvasTouchMove = (event: TouchEvent): void => {
    if (this.hud.isWorldBlocked() || this.activeTouchId === undefined) {
      return;
    }

    const touch = this.findTouchById(event.changedTouches, this.activeTouchId)
      || this.findTouchById(event.touches, this.activeTouchId);
    if (!touch) {
      return;
    }

    const point = this.getCanvasPointFromClient(touch.clientX, touch.clientY);
    if (!point) {
      return;
    }

    event.preventDefault();
    this.updateJoystickAt(point.x, point.y);
  };
  private readonly handleCanvasTouchEnd = (event: TouchEvent): void => {
    if (this.activeTouchId === undefined || !this.findTouchById(event.changedTouches, this.activeTouchId)) {
      return;
    }

    event.preventDefault();
    this.clearPointerMoveTarget();
  };

  constructor(
    private readonly progress: ProgressStore,
    private readonly hud: HudController
  ) {
    super('WorldScene');
  }

  preload(): void {
    this.load.image('world-map-v2', '/regnemester/maps/world-map-v2.png');
    if (RED_COLLISION_MASK_TEST) {
      this.load.image('world-collision-mask', RED_COLLISION_MASK_PATH);
    }
    PLAYER_TOKENS.forEach((token) => this.load.image(getPlayerTokenSourceTextureKey(token.id), token.src));
    this.load.image('portal-token', '/regnemester/Spillbrikkene/portalbrikke.png');
    this.load.image('reward-coin', '/regnemester/ui/regnereisen-coin.png');
    MEDALS.forEach((medal) => this.load.image(getMedalTextureKey(medal.id), medal.src));

    LOCATIONS.filter((location) => isMapBossMarkerLocation(location.id)).forEach((location) => {
      this.load.image(getMapBossSourceTextureKey(location, 'idle'), location.boss.idle);
      this.load.image(getMapBossSourceTextureKey(location, 'defeated'), location.boss.defeated);
    });
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#08384f');
    this.physics.world.setBounds(0, 0, WORLD_SIZE.width, WORLD_SIZE.height);
    this.cameras.main.setBounds(0, 0, WORLD_SIZE.width, WORLD_SIZE.height);

    this.add.image(0, 0, 'world-map-v2').setOrigin(0).setDisplaySize(WORLD_SIZE.width, WORLD_SIZE.height).setDepth(0);
    this.add.rectangle(WORLD_SIZE.width / 2, WORLD_SIZE.height / 2, WORLD_SIZE.width, WORLD_SIZE.height, 0x06182a, 0.08).setDepth(1);
    this.createNormalizedMapBossTextures();
    this.createNormalizedPlayerTokenTextures();
    this.createCollisionMask();
    this.createNodeViews();
    this.finalReward = this.createFinalReward(FINAL_REWARD_POSITION.x, FINAL_REWARD_POSITION.y);
    this.createPlayer();
    this.createInputs();

    this.hud.bindWorld({
      startBattle: () => this.tryStartNearbyBattle(),
      resetProgress: () => this.resetWorldProgress(),
      resetPlayerToProgress: () => this.movePlayerToSavedPosition()
    });
    this.hud.renderProgress();
    this.refreshNodeViews();

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.hud.isWorldBlocked()) {
        return;
      }
      this.preventPointerBrowserGestures(pointer);
      this.heldPointer = pointer;
      if (this.shouldUseJoystickPointer(pointer)) {
        this.startJoystickPointer(pointer);
      } else {
        this.updatePointerMoveTarget(pointer);
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.hud.isWorldBlocked() || this.heldPointer?.id !== pointer.id || !pointer.isDown) {
        return;
      }
      this.preventPointerBrowserGestures(pointer);
      if (this.heldPointerUsesJoystick) {
        this.updateJoystickPointer(pointer);
      } else {
        this.updatePointerMoveTarget(pointer);
      }
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (this.heldPointer?.id === pointer.id) {
        this.clearPointerMoveTarget();
      }
    });

    this.progress.addEventListener('change', () => {
      this.updatePlayerToken();
      this.refreshNodeViews();
      this.hud.renderProgress();
    });

    this.scale.on('resize', this.applyCameraZoom, this);
    this.attachNativeTouchInput();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.applyCameraZoom, this);
      this.detachNativeTouchInput();
    });
  }

  update(_: number, delta: number): void {
    if (!this.player || this.hud.isWorldBlocked()) {
      this.clearPointerMoveTarget();
      return;
    }

    const velocity = new Phaser.Math.Vector2(0, 0);
    if (this.cursors?.left.isDown || this.wasd?.A.isDown) {
      velocity.x -= 1;
    }
    if (this.cursors?.right.isDown || this.wasd?.D.isDown) {
      velocity.x += 1;
    }
    if (this.cursors?.up.isDown || this.wasd?.W.isDown) {
      velocity.y -= 1;
    }
    if (this.cursors?.down.isDown || this.wasd?.S.isDown) {
      velocity.y += 1;
    }

    const keyboardMoving = velocity.lengthSq() > 0;
    if (!keyboardMoving && this.heldPointer?.isDown) {
      if (this.heldPointerUsesJoystick) {
        this.updateJoystickPointer(this.heldPointer);
      } else {
        this.updatePointerMoveTarget(this.heldPointer);
      }
    }

    if (keyboardMoving) {
      this.clearPointerMoveTarget();
      velocity.normalize().scale(KEYBOARD_MOVE_SPEED * delta);
      this.movePlayerBy(velocity.x, velocity.y);
    } else if (this.heldPointerUsesJoystick && this.joystickDirection.lengthSq() > 0) {
      const joystickVelocity = this.joystickDirection.clone().scale(TOUCH_JOYSTICK_MOVE_SPEED * delta);
      this.movePlayerBy(joystickVelocity.x, joystickVelocity.y);
    } else if (this.moveTarget) {
      const toTarget = this.moveTarget.clone().subtract(new Phaser.Math.Vector2(this.player.x, this.player.y));
      if (toTarget.length() < 8) {
        this.moveTarget = undefined;
      } else {
        toTarget.normalize().scale(POINTER_TARGET_MOVE_SPEED * delta);
        this.movePlayerBy(toTarget.x, toTarget.y);
      }
    }

    if (this.interactKey && Phaser.Input.Keyboard.JustDown(this.interactKey)) {
      this.tryStartNearbyBattle();
    }

    this.updateRewardCoinPickup();
    this.updateFinalRewardPickup();
    this.updateNearbyLocation();
    this.saveTimer += delta;
    if (this.saveTimer > 1200) {
      this.saveTimer = 0;
      this.progress.savePlayerPosition(this.player.x, this.player.y);
    }
  }

  private createPlayer(): void {
    const start = this.getSafePlayerPosition(this.progress.getPlayerPosition());
    this.marker = this.add.circle(start.x, start.y + 16, 50, 0x07213a, 0.36).setDepth(18);
    this.player = this.add.image(start.x, start.y, this.getPlayerTextureKey()).setDepth(20);
    this.player.setDisplaySize(132, 132);
    this.player.setOrigin(0.5, 0.58);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.applyCameraZoom();
  }

  private createInputs(): void {
    this.cursors = this.input.keyboard?.createCursorKeys();
    this.wasd = this.input.keyboard?.addKeys('W,A,S,D') as Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;
    this.interactKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER).on('down', () => this.tryStartNearbyBattle());
    this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE).on('down', () => this.tryStartNearbyBattle());
  }

  private updatePointerMoveTarget(pointer: Phaser.Input.Pointer): void {
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    this.moveTarget = new Phaser.Math.Vector2(worldPoint.x, worldPoint.y);
    this.heldPointerUsesJoystick = false;
    this.joystickOrigin = undefined;
    this.joystickDirection.set(0, 0);
  }

  private startJoystickPointer(pointer: Phaser.Input.Pointer): void {
    this.startJoystickAt(pointer.x, pointer.y);
  }

  private updateJoystickPointer(pointer: Phaser.Input.Pointer): void {
    this.updateJoystickAt(pointer.x, pointer.y);
  }

  private startJoystickAt(screenX: number, screenY: number): void {
    this.heldPointerUsesJoystick = true;
    this.joystickOrigin = new Phaser.Math.Vector2(screenX, screenY);
    this.moveTarget = undefined;
    this.updateJoystickAt(screenX, screenY);
  }

  private updateJoystickAt(screenX: number, screenY: number): void {
    if (!this.joystickOrigin) {
      this.joystickOrigin = new Phaser.Math.Vector2(screenX, screenY);
    }

    const drag = new Phaser.Math.Vector2(screenX - this.joystickOrigin.x, screenY - this.joystickOrigin.y);
    const distance = drag.length();
    if (distance < TOUCH_JOYSTICK_DEAD_ZONE) {
      this.joystickDirection.set(0, 0);
      return;
    }

    this.joystickDirection.copy(drag.normalize().scale(Math.min(1, distance / TOUCH_JOYSTICK_MAX_DISTANCE)));
  }

  private shouldUseJoystickPointer(pointer: Phaser.Input.Pointer): boolean {
    const event = pointer.event as ({ pointerType?: string; type?: string; touches?: unknown[] } | undefined);
    const pointerType = event?.pointerType ?? (pointer as unknown as { pointerType?: string }).pointerType;
    return pointerType === 'touch'
      || pointerType === 'pen'
      || event?.type?.startsWith('touch') === true
      || Boolean(event?.touches);
  }

  private preventPointerBrowserGestures(pointer: Phaser.Input.Pointer): void {
    pointer.event?.preventDefault?.();
  }

  private attachNativeTouchInput(): void {
    const canvas = this.game.canvas;
    if (!canvas) {
      return;
    }

    this.touchInputCanvas = canvas;
    canvas.addEventListener('touchstart', this.handleCanvasTouchStart, this.touchListenerOptions);
    canvas.addEventListener('touchmove', this.handleCanvasTouchMove, this.touchListenerOptions);
    canvas.addEventListener('touchend', this.handleCanvasTouchEnd, this.touchListenerOptions);
    canvas.addEventListener('touchcancel', this.handleCanvasTouchEnd, this.touchListenerOptions);
  }

  private detachNativeTouchInput(): void {
    if (!this.touchInputCanvas) {
      return;
    }

    this.touchInputCanvas.removeEventListener('touchstart', this.handleCanvasTouchStart, this.touchListenerOptions);
    this.touchInputCanvas.removeEventListener('touchmove', this.handleCanvasTouchMove, this.touchListenerOptions);
    this.touchInputCanvas.removeEventListener('touchend', this.handleCanvasTouchEnd, this.touchListenerOptions);
    this.touchInputCanvas.removeEventListener('touchcancel', this.handleCanvasTouchEnd, this.touchListenerOptions);
    this.touchInputCanvas = undefined;
  }

  private findTouchById(touches: TouchList, id: number): Touch | undefined {
    for (let index = 0; index < touches.length; index += 1) {
      const touch = touches.item(index);
      if (touch?.identifier === id) {
        return touch;
      }
    }

    return undefined;
  }

  private getCanvasPointFromClient(clientX: number, clientY: number): Phaser.Math.Vector2 | undefined {
    const canvas = this.touchInputCanvas ?? this.game.canvas;
    if (!canvas) {
      return undefined;
    }

    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return undefined;
    }

    const x = Phaser.Math.Clamp((clientX - rect.left) * (this.scale.width / rect.width), 0, this.scale.width);
    const y = Phaser.Math.Clamp((clientY - rect.top) * (this.scale.height / rect.height), 0, this.scale.height);
    return new Phaser.Math.Vector2(x, y);
  }

  private applyCameraZoom(): void {
    const mobileViewport = typeof window !== 'undefined' && window.matchMedia(MOBILE_CAMERA_MEDIA_QUERY).matches;
    this.cameras.main.setZoom(mobileViewport ? MOBILE_CAMERA_ZOOM : DESKTOP_CAMERA_ZOOM);
  }

  private clearPointerMoveTarget(): void {
    this.heldPointer = undefined;
    this.heldPointerUsesJoystick = false;
    this.joystickOrigin = undefined;
    this.joystickDirection.set(0, 0);
    this.activeTouchId = undefined;
    this.moveTarget = undefined;
  }

  private createNodeViews(): void {
    this.nodeViews = LOCATIONS.map((location) => {
      const mapBossMarker = this.usesMapBossMarker(location);
      const ringRadius = mapBossMarker ? MAP_BOSS_RING_RADIUS : 62;
      const ring = this.add.circle(location.x, location.y, ringRadius, location.color, mapBossMarker ? 0.16 : 0.24).setDepth(9);
      ring.setStrokeStyle(mapBossMarker ? 4 : 5, location.color, mapBossMarker ? 0.64 : 0.85);
      const core = this.add.circle(location.x, location.y, 30, 0xfff3b5, 1).setDepth(10);
      core.setStrokeStyle(4, 0xffffff, 0.9);
      const label = this.add
        .text(location.x, location.y + (mapBossMarker ? MAP_BOSS_RING_RADIUS + 22 : 70), location.place, {
          fontFamily: 'Arial, sans-serif',
          fontSize: '26px',
          fontStyle: '700',
          color: '#fff8d7',
          stroke: '#10253a',
          strokeThickness: 7
        })
        .setOrigin(0.5)
        .setDepth(12);
      const state = this.add
        .text(location.x, location.y - 4, '', {
          fontFamily: 'Arial, sans-serif',
          fontSize: '28px',
          fontStyle: '700',
          color: '#163044'
        })
        .setOrigin(0.5)
        .setDepth(13);

      let bossSprite: Phaser.GameObjects.Image | undefined;
      let bossShadow: Phaser.GameObjects.Ellipse | undefined;
      if (mapBossMarker) {
        bossShadow = this.add.ellipse(location.x, location.y + 38, 88, 24, 0x06182a, 0.26).setDepth(8).setVisible(false);
        bossSprite = this.add.image(location.x, location.y, getMapBossTextureKey(location, 'idle')).setDepth(13).setVisible(false);
        bossSprite.setOrigin(0.5);
        this.fitBossMarker(bossSprite);
      }

      let rewardCoin: Phaser.GameObjects.Container | undefined;
      if (isRewardLocation(location.id)) {
        const offset = getRewardCoinOffset(location.id);
        rewardCoin = this.createRewardCoin(location.x + offset.x, location.y + offset.y);
      }

      return { location, ring, core, label, state, bossSprite, bossShadow, rewardCoin };
    });
  }

  private createRewardCoin(x: number, y: number): Phaser.GameObjects.Container {
    const coin = this.add.container(x, y).setDepth(15).setVisible(false);
    const aura = this.add.circle(0, 0, 54, 0xfff3a6, 0.24);
    aura.setStrokeStyle(2, 0xffffff, 0.32);
    const starburst = this.add.star(0, 0, 14, 34, 51, 0xfff0a3, 0.26);
    starburst.setStrokeStyle(2, 0xffd45f, 0.36);
    const coinArt = this.add.image(0, 0, 'reward-coin').setDisplaySize(88, 88);
    const sparkle = this.add.star(27, -28, 5, 5, 12, 0xffffff, 0.9);
    sparkle.setStrokeStyle(2, 0xffd45f, 0.65);
    coin.add([aura, starburst, coinArt, sparkle]);
    return coin;
  }

  private createFinalReward(x: number, y: number): Phaser.GameObjects.Container {
    const reward = this.add.container(x, y).setDepth(16).setVisible(false);
    const portalGlow = this.add.circle(0, 0, 88, 0xfacc15, 0.2);
    portalGlow.setStrokeStyle(4, 0xfff3b5, 0.48);
    const starburst = this.add.star(0, 0, 16, 48, 80, 0xfff3b5, 0.24);
    starburst.setStrokeStyle(3, 0xfacc15, 0.42);
    this.finalRewardMedal = this.add
      .image(0, 0, getMedalTextureKey(this.progress.getActiveMedalId()))
      .setDisplaySize(112, 112);
    const label = this.add
      .text(0, 82, 'MEDALJE', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '21px',
        fontStyle: '900',
        color: '#fff8d7',
        stroke: '#10253a',
        strokeThickness: 6
      })
      .setOrigin(0.5);
    reward.add([portalGlow, starburst, this.finalRewardMedal, label]);
    return reward;
  }

  private createNormalizedMapBossTextures(): void {
    LOCATIONS.filter((location) => this.usesMapBossMarker(location)).forEach((location) => {
      this.createNormalizedMapBossTexture(location, 'idle');
      this.createNormalizedMapBossTexture(location, 'defeated');
    });
  }

  private createNormalizedPlayerTokenTextures(): void {
    PLAYER_TOKENS.forEach((token) => this.createNormalizedPlayerTokenTexture(token.id));
  }

  private createNormalizedPlayerTokenTexture(tokenId: string): void {
    const sourceKey = getPlayerTokenSourceTextureKey(tokenId);
    const targetKey = getPlayerTokenTextureKey(tokenId);
    const source = this.textures.get(sourceKey).getSourceImage() as CanvasImageSource & {
      naturalHeight?: number;
      naturalWidth?: number;
      height?: number;
      width?: number;
    };
    const sourceWidth = Math.round(source.naturalWidth ?? source.width ?? 0);
    const sourceHeight = Math.round(source.naturalHeight ?? source.height ?? 0);
    if (sourceWidth <= 0 || sourceHeight <= 0) {
      return;
    }

    const bounds = this.getOpaqueBounds(source, sourceWidth, sourceHeight, PLAYER_TOKEN_ALPHA_THRESHOLD);
    const canvas = document.createElement('canvas');
    canvas.width = PLAYER_TOKEN_TEXTURE_SIZE;
    canvas.height = PLAYER_TOKEN_TEXTURE_SIZE;
    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    const scale = Math.min(PLAYER_TOKEN_VISUAL_SIZE / bounds.width, PLAYER_TOKEN_VISUAL_SIZE / bounds.height);
    const drawWidth = Math.round(bounds.width * scale);
    const drawHeight = Math.round(bounds.height * scale);
    const drawX = Math.round((PLAYER_TOKEN_TEXTURE_SIZE - drawWidth) / 2);
    const drawY = Math.round((PLAYER_TOKEN_TEXTURE_SIZE - drawHeight) / 2);

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.clearRect(0, 0, PLAYER_TOKEN_TEXTURE_SIZE, PLAYER_TOKEN_TEXTURE_SIZE);
    context.drawImage(source, bounds.x, bounds.y, bounds.width, bounds.height, drawX, drawY, drawWidth, drawHeight);

    if (this.textures.exists(targetKey)) {
      this.textures.remove(targetKey);
    }
    this.textures.addCanvas(targetKey, canvas);
  }

  private createNormalizedMapBossTexture(location: LocationNode, mood: 'idle' | 'defeated'): void {
    const sourceKey = getMapBossSourceTextureKey(location, mood);
    const targetKey = getMapBossTextureKey(location, mood);
    const source = this.textures.get(sourceKey).getSourceImage() as CanvasImageSource & {
      naturalHeight?: number;
      naturalWidth?: number;
      height?: number;
      width?: number;
    };
    const sourceWidth = Math.round(source.naturalWidth ?? source.width ?? 0);
    const sourceHeight = Math.round(source.naturalHeight ?? source.height ?? 0);
    if (sourceWidth <= 0 || sourceHeight <= 0) {
      return;
    }

    const bounds = this.getOpaqueBounds(source, sourceWidth, sourceHeight, MAP_BOSS_ALPHA_THRESHOLD);
    const canvas = document.createElement('canvas');
    canvas.width = MAP_BOSS_TEXTURE_SIZE;
    canvas.height = MAP_BOSS_TEXTURE_SIZE;
    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    const scale = Math.min(MAP_BOSS_VISUAL_SIZE / bounds.width, MAP_BOSS_VISUAL_SIZE / bounds.height);
    const drawWidth = Math.round(bounds.width * scale);
    const drawHeight = Math.round(bounds.height * scale);
    const drawX = Math.round((MAP_BOSS_TEXTURE_SIZE - drawWidth) / 2);
    const drawY = Math.round((MAP_BOSS_TEXTURE_SIZE - drawHeight) / 2);

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.clearRect(0, 0, MAP_BOSS_TEXTURE_SIZE, MAP_BOSS_TEXTURE_SIZE);
    context.drawImage(source, bounds.x, bounds.y, bounds.width, bounds.height, drawX, drawY, drawWidth, drawHeight);

    if (this.textures.exists(targetKey)) {
      this.textures.remove(targetKey);
    }
    this.textures.addCanvas(targetKey, canvas);
  }

  private getOpaqueBounds(
    source: CanvasImageSource,
    width: number,
    height: number,
    alphaThreshold: number
  ): Phaser.Geom.Rectangle {
    const scratch = document.createElement('canvas');
    scratch.width = width;
    scratch.height = height;
    const context = scratch.getContext('2d', { willReadFrequently: true });
    if (!context) {
      return new Phaser.Geom.Rectangle(0, 0, width, height);
    }

    context.drawImage(source, 0, 0);
    const pixels = context.getImageData(0, 0, width, height).data;
    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const alpha = pixels[(y * width + x) * 4 + 3];
        if (alpha <= alphaThreshold) {
          continue;
        }
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }

    if (maxX < minX || maxY < minY) {
      return new Phaser.Geom.Rectangle(0, 0, width, height);
    }

    return new Phaser.Geom.Rectangle(minX, minY, maxX - minX + 1, maxY - minY + 1);
  }

  private createCollisionMask(): void {
    if (!RED_COLLISION_MASK_TEST) {
      return;
    }

    const source = this.textures.get('world-collision-mask').getSourceImage() as CanvasImageSource;
    const canvas = document.createElement('canvas');
    canvas.width = WORLD_SIZE.width;
    canvas.height = WORLD_SIZE.height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) {
      return;
    }

    try {
      context.drawImage(source, 0, 0, WORLD_SIZE.width, WORLD_SIZE.height);
      const imageData = context.getImageData(0, 0, WORLD_SIZE.width, WORLD_SIZE.height);
      this.collisionMaskPixels = imageData.data;
      this.collisionMaskWidth = imageData.width;
      this.collisionMaskHeight = imageData.height;
    } catch {
      this.collisionMaskPixels = undefined;
      this.collisionMaskWidth = 0;
      this.collisionMaskHeight = 0;
    }
  }

  private getSafePlayerPosition(position: { x: number; y: number }): { x: number; y: number } {
    if (this.isPositionWalkable(position.x, position.y)) {
      return position;
    }

    for (let radius = 24; radius <= 260; radius += 24) {
      for (let angle = 0; angle < 360; angle += 18) {
        const candidateX = Phaser.Math.Clamp(
          position.x + Math.cos(Phaser.Math.DegToRad(angle)) * radius,
          COLLISION_EDGE_PADDING,
          WORLD_SIZE.width - COLLISION_EDGE_PADDING
        );
        const candidateY = Phaser.Math.Clamp(
          position.y + Math.sin(Phaser.Math.DegToRad(angle)) * radius,
          COLLISION_EDGE_PADDING,
          WORLD_SIZE.height - COLLISION_EDGE_PADDING
        );
        if (this.isPositionWalkable(candidateX, candidateY)) {
          return { x: Math.round(candidateX), y: Math.round(candidateY) };
        }
      }
    }

    return { x: WORLD_SIZE.startX, y: WORLD_SIZE.startY };
  }

  private isPositionWalkable(x: number, y: number): boolean {
    if (!RED_COLLISION_MASK_TEST || !this.collisionMaskPixels) {
      return true;
    }

    return !RED_COLLISION_SAMPLE_OFFSETS.some((offset) => this.isCollisionBlockedAt(x + offset.x, y + offset.y));
  }

  private isCollisionBlockedAt(x: number, y: number): boolean {
    if (!this.collisionMaskPixels || this.collisionMaskWidth <= 0 || this.collisionMaskHeight <= 0) {
      return false;
    }

    const sampleX = Phaser.Math.Clamp(Math.round(x), 0, this.collisionMaskWidth - 1);
    const sampleY = Phaser.Math.Clamp(Math.round(y), 0, this.collisionMaskHeight - 1);
    const index = (sampleY * this.collisionMaskWidth + sampleX) * 4;
    const red = this.collisionMaskPixels[index];
    const green = this.collisionMaskPixels[index + 1];
    const blue = this.collisionMaskPixels[index + 2];
    const alpha = this.collisionMaskPixels[index + 3];

    return alpha > 90
      && red >= RED_COLLISION_THRESHOLD
      && red > green + 80
      && red > blue + 80;
  }

  private showCollisionBlockToast(): void {
    if (!RED_COLLISION_MASK_TEST || this.time.now - this.lastCollisionBlockToast < 1400) {
      return;
    }

    this.lastCollisionBlockToast = this.time.now;
    this.hud.showToast('Vannet kan ikke krysses, bruk veiene.');
  }

  private movePlayerBy(dx: number, dy: number): void {
    if (!this.player || !this.marker) {
      return;
    }

    const nextX = Phaser.Math.Clamp(this.player.x + dx, 65, WORLD_SIZE.width - 65);
    const nextY = Phaser.Math.Clamp(this.player.y + dy, 75, WORLD_SIZE.height - 75);
    let finalX = nextX;
    let finalY = nextY;

    if (!this.isPositionWalkable(finalX, finalY)) {
      const xOnly = Phaser.Math.Clamp(this.player.x + dx, 65, WORLD_SIZE.width - 65);
      const yOnly = Phaser.Math.Clamp(this.player.y + dy, 75, WORLD_SIZE.height - 75);
      const preferX = Math.abs(dx) >= Math.abs(dy);
      const first = preferX
        ? { x: xOnly, y: this.player.y }
        : { x: this.player.x, y: yOnly };
      const second = preferX
        ? { x: this.player.x, y: yOnly }
        : { x: xOnly, y: this.player.y };

      if (this.isPositionWalkable(first.x, first.y)) {
        finalX = first.x;
        finalY = first.y;
      } else if (this.isPositionWalkable(second.x, second.y)) {
        finalX = second.x;
        finalY = second.y;
      } else {
        this.moveTarget = undefined;
        this.showCollisionBlockToast();
        return;
      }
    }

    this.player.setPosition(finalX, finalY);
    this.marker.setPosition(finalX, finalY + 18);

    if (Math.abs(dx) > 0.1) {
      this.player.setFlipX(dx < 0);
    }
  }

  private updateNearbyLocation(): void {
    if (!this.player) {
      return;
    }

    let nearest: LocationNode | undefined;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (const location of LOCATIONS) {
      if (!this.isLocationVisible(location)) {
        continue;
      }
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, location.x, location.y);
      if (distance < nearestDistance) {
        nearest = location;
        nearestDistance = distance;
      }
    }

    const activeNearby = nearest && nearestDistance <= INTERACT_DISTANCE ? nearest : undefined;
    if (activeNearby?.id !== this.nearby?.id) {
      this.nearby = activeNearby;
      this.hud.setNearby(activeNearby);
    }

    this.nodeViews.forEach((view) => {
      const near = activeNearby?.id === view.location.id;
      view.ring.setScale(near ? 1.18 : 1);
      view.label.setScale(near ? 1.08 : 1);
    });
  }

  private tryStartNearbyBattle(): void {
    if (!this.nearby || this.hud.isWorldBlocked()) {
      return;
    }

    if (!this.progress.isUnlocked(this.nearby.id)) {
      if (this.progress.canUnlock(this.nearby.id)) {
        const location = this.nearby;
        this.hud.openUnlockConfirm(location, () => {
          if (!this.progress.unlockLocation(location.id)) {
            this.hud.showToast('Du trenger en ubrukt mynt for å låse opp denne bossen.');
            return;
          }
          this.hud.showToast(`${location.place} er låst opp!`);
          this.refreshNodeViews();
          this.updateNearbyLocation();
        });
        return;
      }

      if (this.nearby.id === 'siste-arenaen'
        && !LOCATIONS.filter((location) => location.order < 10).every((location) => this.progress.isCompleted(location.id))) {
        this.hud.showToast('Alle bossene før Regnemesteren må slås først.');
        return;
      }

      this.hud.showToast('Du trenger en ubrukt mynt for å låse opp denne bossen.');
      return;
    }

    if (this.progress.hasPendingReward(this.nearby.id)) {
      this.hud.showToast(`Hent mynten ved ${this.nearby.place} først.`);
      return;
    }

    this.hud.openBattle(this.nearby, () => {
      this.progress.completeLocation(this.nearby!.id);
      this.refreshNodeViews();
    });
  }

  private resetWorldProgress(): void {
    this.progress.reset();
    this.movePlayerToSavedPosition();
    this.nearby = undefined;
    this.refreshNodeViews();
    this.hud.setNearby(undefined);
    this.updateNearbyLocation();
  }

  private movePlayerToSavedPosition(): void {
    const start = this.getSafePlayerPosition(this.progress.getPlayerPosition());
    this.player?.setPosition(start.x, start.y);
    this.marker?.setPosition(start.x, start.y + 18);
    this.cameras.main.centerOn(start.x, start.y);
  }

  private refreshNodeViews(): void {
    this.nodeViews.forEach((view) => {
      const unlocked = this.progress.isUnlocked(view.location.id);
      const completed = this.progress.isCompleted(view.location.id);
      const visible = this.isLocationVisible(view.location);
      const hiddenSecret = Boolean(view.location.secret && !completed);
      const mapBossMarker = this.usesMapBossMarker(view.location);
      view.ring.setVisible(visible);
      view.ring.setFillStyle(view.location.color, mapBossMarker ? 0.16 : 0.24);
      view.ring.setAlpha(mapBossMarker ? (completed || unlocked ? 0.78 : 0.28) : completed || unlocked ? 1 : 0.22);
      view.core.setVisible(visible && (!mapBossMarker || hiddenSecret));
      view.label.setVisible(visible);
      view.state.setVisible(visible && (!mapBossMarker || hiddenSecret));
      view.rewardCoin?.setVisible(visible && this.progress.hasPendingReward(view.location.id));
      view.core.setFillStyle(completed ? 0xf6d158 : hiddenSecret ? 0xfff3b5 : unlocked ? 0xfff3b5 : 0x7b8794, unlocked ? 1 : 0.86);
      view.label.setText(hiddenSecret ? '???' : view.location.place);
      view.label.setAlpha(hiddenSecret ? 0.86 : completed || unlocked ? 1 : 0.72);
      view.state.setText(completed ? 'OK' : unlocked ? '!' : 'LÅS');
      if (hiddenSecret) {
        view.state.setText('?');
      }
      view.state.setColor(completed ? '#1d5d36' : unlocked ? '#18344a' : '#24313f');

      if (view.bossSprite) {
        const textureKey = getMapBossTextureKey(view.location, completed ? 'defeated' : 'idle');
        if (view.bossSprite.texture.key !== textureKey) {
          view.bossSprite.setTexture(textureKey);
          this.fitBossMarker(view.bossSprite);
        }
        view.bossSprite.setVisible(visible && mapBossMarker && !hiddenSecret);
        view.bossSprite.setAlpha(completed ? 0.94 : unlocked ? 1 : 0.48);
      }
      view.bossShadow?.setVisible(visible && mapBossMarker && !hiddenSecret);
      view.bossShadow?.setAlpha(completed ? 0.2 : unlocked ? 0.32 : 0.16);
    });
    if (this.finalRewardMedal) {
      this.finalRewardMedal.setTexture(getMedalTextureKey(this.progress.getActiveMedalId()));
    }
    this.finalReward?.setVisible(this.progress.hasFinalRewardPending());
  }

  private updateRewardCoinPickup(): void {
    if (!this.player) {
      return;
    }

    for (const view of this.nodeViews) {
      const rewardCoin = view.rewardCoin;
      if (!rewardCoin?.visible || !this.progress.hasPendingReward(view.location.id)) {
        continue;
      }

      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, rewardCoin.x, rewardCoin.y);
      if (distance > COIN_PICKUP_DISTANCE) {
        continue;
      }

      this.progress.collectReward(view.location.id);
      this.hud.showToast(this.getCoinPickupMessage(view.location));
      this.refreshNodeViews();
      this.updateNearbyLocation();
      return;
    }
  }

  private updateFinalRewardPickup(): void {
    if (!this.player || !this.finalReward?.visible || !this.progress.hasFinalRewardPending()) {
      return;
    }

    const distance = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      this.finalReward.x,
      this.finalReward.y
    );
    if (distance > FINAL_REWARD_PICKUP_DISTANCE) {
      return;
    }

    this.progress.collectFinalReward();
    this.hud.openJourneyReward();
    this.refreshNodeViews();
    this.updateNearbyLocation();
  }

  private getCoinPickupMessage(location: LocationNode): string {
    if (location.id === 'siste-arenaen') {
      return 'Regnemester-mynten er hentet! Mega Regnemesteren har dukket opp.';
    }
    if (location.id === 'mega-regnemesteren') {
      return 'Mega-mynten er hentet! Medaljen venter ved portalen.';
    }
    if (LOCATIONS.filter((candidate) => candidate.order < 10).every((candidate) => this.progress.isCompleted(candidate.id))) {
      return `${location.place}-mynten er hentet! Lås opp Den siste arenaen når du er klar.`;
    }
    return `${location.place}-mynten er hentet! Bruk mynten til å låse opp en boss du velger.`;
  }

  private usesMapBossMarker(location: LocationNode): boolean {
    return isMapBossMarkerLocation(location.id);
  }

  private fitBossMarker(sprite: Phaser.GameObjects.Image): void {
    sprite.setDisplaySize(MAP_BOSS_TEXTURE_SIZE, MAP_BOSS_TEXTURE_SIZE);
  }

  private isLocationVisible(location: LocationNode): boolean {
    return !location.hiddenUntilUnlocked || this.progress.isUnlocked(location.id) || this.progress.isCompleted(location.id);
  }

  private updatePlayerToken(): void {
    if (!this.player) {
      return;
    }
    this.player.setTexture(this.getPlayerTextureKey());
  }

  private getPlayerTextureKey(): string {
    return `token-${getTokenById(this.progress.getSettings().tokenId).id}`;
  }
}
