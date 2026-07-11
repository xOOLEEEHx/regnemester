import Phaser from 'phaser';
import { LOCATIONS, type LocationNode } from '../../game/content/locations';
import {
  BOSS_COLLISION_MASK_PATH,
  getRewardCoinOffset,
  isMapBossMarkerLocation,
  isRewardLocation,
  REGNERIKET_COLLISION_MASK_PATH,
  RED_COLLISION_MASK_TEST
} from '../../game/content/mapExperiment';
import { getGameMap, REGNERIKET_MAP_ID, type GameMapConfig } from '../../game/content/maps';
import { MEDALS, type MedalId } from '../../game/content/medals';
import { getTokenById, PLAYER_TOKENS } from '../../game/content/playerTokens';
import {
  getRegneriketPickupQuest,
  getRegneriketPickupQuestForItem,
  REGNERIKET_FINAL_STOP_ID,
  REGNERIKET_PICKUP_ITEMS,
  REGNERIKET_STOPS,
  TIMED_TARGET,
  type RegneriketMapItem,
  type RegneriketStop
} from '../../game/content/regneriket';
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

type RegneriketNodeView = {
  stop: RegneriketStop;
  ring: Phaser.GameObjects.Arc;
  core: Phaser.GameObjects.Arc;
  icon: Phaser.GameObjects.Image;
  label: Phaser.GameObjects.Text;
  state: Phaser.GameObjects.Text;
  rewardCoin: Phaser.GameObjects.Container;
};

type RegneriketPortal = {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  title: string;
  description: string;
};

type RegneriketPortalView = {
  portal: RegneriketPortal;
  ring: Phaser.GameObjects.Arc;
  core: Phaser.GameObjects.Arc;
  label: Phaser.GameObjects.Text;
};

type MapItemView = {
  item: RegneriketMapItem;
  sprite: Phaser.GameObjects.Image;
  ring: Phaser.GameObjects.Arc;
};

const INTERACT_DISTANCE = 115;
const COIN_PICKUP_DISTANCE = 76;
const FINAL_REWARD_PICKUP_DISTANCE = 92;
const REGNERIKET_PORTAL_DISTANCE = 115;
const MAP_BOSS_TEXTURE_SIZE = 144;
const MAP_BOSS_VISUAL_SIZE = 118;
const MAP_BOSS_RING_RADIUS = 76;
const MAP_BOSS_ALPHA_THRESHOLD = 48;
const MAP_ITEM_TEXTURE_SIZE = 128;
const MAP_ITEM_VISUAL_SIZE = 108;
const MAP_ITEM_DISPLAY_SIZE = 112;
const MAP_ITEM_RING_RADIUS = 59;
const QUEST_ICON_TEXTURE_SIZE = 256;
// Matches Soppbiblioteket's visible icon footprint inside the shared 112px ring.
const QUEST_ICON_VISUAL_SIZE = 224;
const NORMALIZED_QUEST_ICON_IDS = new Set(['utforskningsrunden', 'tidslopet']);
const COLLISION_EDGE_PADDING = 56;
const RED_COLLISION_THRESHOLD = 160;
const KEYBOARD_MOVE_SPEED = 0.34;
const POINTER_TARGET_MOVE_SPEED = 0.29;
const TOUCH_JOYSTICK_MOVE_SPEED = 0.32;
const TOUCH_JOYSTICK_DEAD_ZONE = 6;
const TOUCH_JOYSTICK_MAX_DISTANCE = 68;
const MOBILE_CAMERA_MEDIA_QUERY = '(max-width: 600px)';
const MOBILE_CAMERA_ZOOM_FACTOR = 0.84;
const RED_COLLISION_SAMPLE_OFFSETS = [
  { x: 0, y: 0 },
  { x: 0, y: 16 },
  { x: -12, y: 10 },
  { x: 12, y: 10 },
  { x: -18, y: 0 },
  { x: 18, y: 0 },
  { x: 0, y: -10 }
] as const;

const REGNERIKET_PORTALS: RegneriketPortal[] = [
  {
    id: 'portalarkivet-til-skyhaven',
    x: 3700,
    y: 1510,
    targetX: 3330,
    targetY: 720,
    title: 'Skyportalen',
    description: 'Ta portalen opp til Skyhaven-området.'
  },
  {
    id: 'skyhaven-til-portalarkivet',
    x: 3460,
    y: 720,
    targetX: 3535,
    targetY: 1450,
    title: 'Skyportalen',
    description: 'Ta portalen tilbake til Portalarkivet.'
  }
];

const REGNERIKET_REWARD_COIN_OFFSETS: Record<string, { x: number; y: number }> = {
  talltreportalen: { x: 252, y: 341 },
  regneenga: { x: 317, y: 208 },
  krystallporten: { x: -194, y: 318 },
  klokkebyen: { x: 268, y: 210 },
  frostpasset: { x: -78, y: 250 },
  skyhaven: { x: -94, y: 417 },
  soppbiblioteket: { x: 295, y: 286 },
  havneverkstedet: { x: 364, y: 120 },
  lavaakademiet: { x: -283, y: 211 },
  portalarkivet: { x: -203, y: 208 },
  utforskningsrunden: { x: 348, y: 73 },
  tidslopet: { x: -354, y: 253 }
};

const TALLTREE_LANTERN_POSITIONS = [
  { x: 150, y: 150, angle: -8, scale: 0.92 },
  { x: 250, y: 95, angle: 5, scale: 0.82 },
  { x: 350, y: 115, angle: -4, scale: 0.9 },
  { x: 455, y: 145, angle: 7, scale: 0.84 },
  { x: 535, y: 215, angle: -6, scale: 0.78 }
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

function getRegneriketTextureKey(id: string): string {
  return `regneriket-stop-${id}`;
}

function getRegneriketSourceTextureKey(id: string): string {
  return `${getRegneriketTextureKey(id)}-source`;
}

function getMapItemTextureKey(id: string): string {
  return `regneriket-item-${id}`;
}

function getMapItemSourceTextureKey(id: string): string {
  return `${getMapItemTextureKey(id)}-source`;
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
  private activeMap: GameMapConfig = getGameMap();
  private mapImage?: Phaser.GameObjects.Image;
  private mapShade?: Phaser.GameObjects.Rectangle;
  private regneriketViews: RegneriketNodeView[] = [];
  private nearbyRegneriket?: RegneriketStop;
  private regneriketPortalViews: RegneriketPortalView[] = [];
  private nearbyRegneriketPortal?: RegneriketPortal;
  private mapItemViews: MapItemView[] = [];
  private nearbyMapItem?: RegneriketMapItem;
  private timedTargetActive = false;
  private timedStartedAt = 0;
  private timedDeadline = 0;
  private timedText?: Phaser.GameObjects.Text;
  private talltreeLanterns: Phaser.GameObjects.Image[] = [];
  private loadingFailed = false;
  private pendingMapLoadId?: string;
  private readonly handleProgressChange = (): void => {
    this.syncActiveMap();
    this.updatePlayerToken();
    this.refreshNodeViews();
    this.refreshMapItemViews();
    this.refreshRegneriketPortalViews();
    this.hud.renderProgress();
  };

  constructor(
    private readonly progress: ProgressStore,
    private readonly hud: HudController,
    private readonly renderScale: number
  ) {
    super('WorldScene');
  }

  preload(): void {
    this.activeMap = getGameMap(this.progress.getSettings().mapId);
    this.hud.setLoadingProgress(0);
    this.load.on('progress', (progress: number) => this.hud.setLoadingProgress(progress));
    this.load.on('loaderror', () => {
      this.loadingFailed = true;
      this.hud.setLoadingError();
    });
    this.queueMapAssets(this.activeMap);
    PLAYER_TOKENS.forEach((token) => this.load.image(`token-${token.id}`, token.src));
    this.load.image('reward-coin', '/regnemester/ui/regnecoin.png');
    MEDALS.forEach((medal) => this.load.image(getMedalTextureKey(medal.id), medal.src));
    REGNERIKET_STOPS.forEach((stop) => this.load.image(
      NORMALIZED_QUEST_ICON_IDS.has(stop.id) ? getRegneriketSourceTextureKey(stop.id) : getRegneriketTextureKey(stop.id),
      stop.iconSrc
    ));
    [...REGNERIKET_PICKUP_ITEMS, TIMED_TARGET].forEach((item) => this.load.image(getMapItemSourceTextureKey(item.id), item.src));
    this.load.image('talltree-lantern', '/regnemester/quest-items/talltre-lykt.png');

    LOCATIONS.filter((location) => isMapBossMarkerLocation(location.id)).forEach((location) => {
      this.load.image(getMapBossSourceTextureKey(location, 'idle'), location.boss.idle);
      this.load.image(getMapBossSourceTextureKey(location, 'defeated'), location.boss.defeated);
    });
  }

  create(): void {
    this.activeMap = getGameMap(this.progress.getSettings().mapId);
    this.cameras.main.setBackgroundColor('#08384f');

    this.mapImage = this.add.image(0, 0, this.activeMap.textureKey).setOrigin(0).setDepth(0);
    this.mapShade = this.add.rectangle(0, 0, 1, 1, 0x06182a, 0.08).setDepth(1);
    this.applyActiveMap();
    this.createNormalizedMapBossTextures();
    this.createNormalizedMapItemTextures();
    this.createNormalizedQuestIconTextures();
    this.createCollisionMask();
    this.createNodeViews();
    this.createRegneriketNodeViews();
    this.createTalltreeLanterns();
    this.createRegneriketPortalViews();
    this.createMapItemViews();
    this.finalReward = this.createFinalReward(FINAL_REWARD_POSITION.x, FINAL_REWARD_POSITION.y);
    this.createPlayer();
    this.createInputs();

    this.hud.bindWorld({
      startBattle: () => this.tryStartNearbyBattle(true),
      resetProgress: () => this.resetWorldProgress(),
      resetPlayerToProgress: () => this.movePlayerToSavedPosition(),
      resetInput: () => this.clearPointerMoveTarget()
    });
    this.hud.renderProgress();
    this.refreshNodeViews();
    this.refreshRegneriketViews();
    this.refreshRegneriketPortalViews();
    this.refreshMapItemViews();

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

    this.progress.addEventListener('change', this.handleProgressChange);

    this.attachNativeTouchInput();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.progress.removeEventListener('change', this.handleProgressChange);
      this.detachNativeTouchInput();
    });
    if (!this.loadingFailed) {
      this.hud.setWorldReady();
    }
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
    this.updateRegneriketRewardPickup();
    this.updateFinalRewardPickup();
    this.updateTimedRun();
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
    this.cameras.main.setZoom(this.getMapCameraZoom());
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

    let drag = new Phaser.Math.Vector2(screenX - this.joystickOrigin.x, screenY - this.joystickOrigin.y);
    let distance = drag.length();
    const deadZone = TOUCH_JOYSTICK_DEAD_ZONE * this.renderScale;
    if (distance < deadZone) {
      this.joystickDirection.set(0, 0);
      return;
    }

    const maxDistance = TOUCH_JOYSTICK_MAX_DISTANCE * this.renderScale;
    if (distance > maxDistance) {
      const overflow = drag.clone().normalize().scale(distance - maxDistance);
      this.joystickOrigin.add(overflow);
      drag = new Phaser.Math.Vector2(screenX - this.joystickOrigin.x, screenY - this.joystickOrigin.y);
      distance = drag.length();
    }

    this.joystickDirection.copy(drag.normalize().scale(Math.min(1, distance / maxDistance)));
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

  private clearPointerMoveTarget(): void {
    this.heldPointer = undefined;
    this.heldPointerUsesJoystick = false;
    this.joystickOrigin = undefined;
    this.joystickDirection.set(0, 0);
    this.activeTouchId = undefined;
    this.moveTarget = undefined;
  }

  private syncActiveMap(): void {
    const nextMap = getGameMap(this.progress.getSettings().mapId);
    if (nextMap.id === this.activeMap.id || nextMap.id === this.pendingMapLoadId) {
      return;
    }

    if (!this.hasMapAssets(nextMap)) {
      this.loadMapAssets(nextMap);
      return;
    }

    this.activateMap(nextMap);
  }

  private activateMap(nextMap: GameMapConfig): void {
    const previousMap = this.activeMap;
    this.activeMap = nextMap;
    this.stopTimedRun();
    this.applyActiveMap();
    this.createCollisionMask();
    if (previousMap.textureKey !== nextMap.textureKey && this.textures.exists(previousMap.textureKey)) {
      this.textures.remove(previousMap.textureKey);
    }
    this.nearby = undefined;
    this.nearbyRegneriket = undefined;
    this.nearbyRegneriketPortal = undefined;
    this.hud.setNearby(undefined);
    this.hud.setNearbyRegneriket(undefined);
    this.hud.setNearbyPortal(undefined);
    this.movePlayerToSavedPosition();
    this.refreshNodeViews();
    this.refreshRegneriketViews();
    this.refreshRegneriketPortalViews();
  }

  private loadMapAssets(nextMap: GameMapConfig): void {
    this.pendingMapLoadId = nextMap.id;
    this.loadingFailed = false;
    this.hud.beginWorldLoading();
    this.queueMapAssets(nextMap);
    this.load.once('complete', () => {
      if (this.pendingMapLoadId !== nextMap.id) {
        return;
      }

      this.pendingMapLoadId = undefined;
      if (this.loadingFailed || !this.hasMapAssets(nextMap)) {
        this.hud.setLoadingError();
        return;
      }

      this.activateMap(nextMap);
      this.hud.setWorldReady();
    });
    this.load.start();
  }

  private queueMapAssets(map: GameMapConfig): void {
    if (!this.textures.exists(map.textureKey)) {
      this.load.image(map.textureKey, map.image);
    }

    if (RED_COLLISION_MASK_TEST && map.hasCollisionMask) {
      const collisionTextureKey = this.getCollisionTextureKey(map);
      if (!this.textures.exists(collisionTextureKey)) {
        this.load.image(collisionTextureKey, this.getCollisionMaskPath(map));
      }
    }
  }

  private hasMapAssets(map: GameMapConfig): boolean {
    return this.textures.exists(map.textureKey)
      && (!RED_COLLISION_MASK_TEST
        || !map.hasCollisionMask
        || this.textures.exists(this.getCollisionTextureKey(map)));
  }

  private applyActiveMap(): void {
    this.physics.world.setBounds(0, 0, this.activeMap.width, this.activeMap.height);
    this.cameras.main.setBounds(0, 0, this.activeMap.width, this.activeMap.height);
    this.cameras.main.setZoom(this.getMapCameraZoom());
    this.mapImage?.setTexture(this.activeMap.textureKey);
    this.mapImage?.setDisplaySize(this.activeMap.width, this.activeMap.height);
    this.mapShade?.setPosition(this.activeMap.width / 2, this.activeMap.height / 2);
    this.mapShade?.setSize(this.activeMap.width, this.activeMap.height);
  }

  private getMapCameraZoom(): number {
    const mapZoom = this.activeMap.showBossJourney ? 0.82 : 0.68;
    const mobileZoomFactor = window.matchMedia(MOBILE_CAMERA_MEDIA_QUERY).matches
      ? MOBILE_CAMERA_ZOOM_FACTOR
      : 1;
    return mapZoom * mobileZoomFactor * this.renderScale;
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
    const aura = this.add.circle(0, 0, 68, 0xfff3a6, 0.24);
    aura.setStrokeStyle(2, 0xffffff, 0.32);
    const starburst = this.add.star(0, 0, 14, 42, 64, 0xfff0a3, 0.26);
    starburst.setStrokeStyle(2, 0xffd45f, 0.36);
    const coinArt = this.add.image(0, 0, 'reward-coin').setDisplaySize(112, 112);
    const sparkle = this.add.star(34, -36, 5, 5, 12, 0xffffff, 0.9);
    sparkle.setStrokeStyle(2, 0xffd45f, 0.65);
    coin.add([aura, starburst, coinArt, sparkle]);
    return coin;
  }

  private createRegneriketNodeViews(): void {
    this.regneriketViews = REGNERIKET_STOPS.map((stop) => {
      const ring = this.add.circle(stop.x, stop.y, 112, stop.color, 0.12).setDepth(9);
      ring.setStrokeStyle(4, stop.color, 0.62);
      const core = this.add.circle(stop.x, stop.y, 10, 0xfff3b5, 1).setDepth(10);
      core.setStrokeStyle(4, 0xffffff, 0.9);
      const icon = this.add
        .image(stop.x, stop.y, getRegneriketTextureKey(stop.id))
        .setOrigin(0.5)
        .setDepth(12);
      icon.setDisplaySize(198, 198);
      const label = this.add
        .text(stop.x, stop.y + 126, stop.place, {
          fontFamily: 'Arial, sans-serif',
          fontSize: '22px',
          fontStyle: '900',
          color: '#fff8d7',
          stroke: '#10253a',
          strokeThickness: 6
        })
        .setOrigin(0.5)
        .setDepth(12);
      const state = this.add
        .text(stop.x, stop.y + 145, '', {
          fontFamily: 'Verdana, Arial, sans-serif',
          fontSize: '16px',
          fontStyle: '900',
          color: '#dbe8f5',
          stroke: '#10253a',
          strokeThickness: 5
        })
        .setOrigin(0.5)
        .setDepth(12);
      const offset = REGNERIKET_REWARD_COIN_OFFSETS[stop.id] ?? { x: 122, y: 96 };
      const rewardCoin = this.createRewardCoin(stop.x + offset.x, stop.y + offset.y);
      return { stop, ring, core, icon, label, state, rewardCoin };
    });
  }

  private createRegneriketPortalViews(): void {
    this.regneriketPortalViews = REGNERIKET_PORTALS.map((portal) => {
      const ring = this.add.circle(portal.x, portal.y, 48, 0x7dd3fc, 0.16).setDepth(11).setVisible(false);
      ring.setStrokeStyle(4, 0xfacc15, 0.72);
      const core = this.add.circle(portal.x, portal.y, 24, 0xe0f2fe, 0.92).setDepth(12).setVisible(false);
      core.setStrokeStyle(3, 0x38bdf8, 0.85);
      const label = this.add
        .text(portal.x, portal.y + 64, 'PORTAL', {
          fontFamily: 'Arial, sans-serif',
          fontSize: '18px',
          fontStyle: '900',
          color: '#fff8d7',
          stroke: '#10253a',
          strokeThickness: 5
        })
        .setOrigin(0.5)
        .setDepth(13)
        .setVisible(false);
      return { portal, ring, core, label };
    });
  }

  private createTalltreeLanterns(): void {
    this.talltreeLanterns = TALLTREE_LANTERN_POSITIONS.map((position) => (
      this.add.image(position.x, position.y, 'talltree-lantern')
        .setDisplaySize(54 * position.scale, 78 * position.scale)
        .setAngle(position.angle)
        .setDepth(8)
        .setVisible(false)
    ));
  }

  private createMapItemViews(): void {
    this.mapItemViews = [...REGNERIKET_PICKUP_ITEMS, TIMED_TARGET].map((item) => {
      const ring = this.add.circle(item.x, item.y, MAP_ITEM_RING_RADIUS, item.ringColor, 0.14).setDepth(14).setVisible(false);
      ring.setStrokeStyle(3, 0xffffff, 0.54);
      const sprite = this.add.image(item.x, item.y, getMapItemTextureKey(item.id))
        .setDisplaySize(MAP_ITEM_DISPLAY_SIZE, MAP_ITEM_DISPLAY_SIZE)
        .setDepth(15)
        .setVisible(false);
      return { item, sprite, ring };
    });
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

  private createNormalizedMapItemTextures(): void {
    [...REGNERIKET_PICKUP_ITEMS, TIMED_TARGET].forEach((item) => {
      const sourceKey = getMapItemSourceTextureKey(item.id);
      const targetKey = getMapItemTextureKey(item.id);
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

      const bounds = this.getOpaqueBounds(source, sourceWidth, sourceHeight);
      const canvas = document.createElement('canvas');
      canvas.width = MAP_ITEM_TEXTURE_SIZE;
      canvas.height = MAP_ITEM_TEXTURE_SIZE;
      const context = canvas.getContext('2d');
      if (!context) {
        return;
      }

      const scale = Math.min(MAP_ITEM_VISUAL_SIZE / bounds.width, MAP_ITEM_VISUAL_SIZE / bounds.height);
      const drawWidth = Math.max(1, Math.round(bounds.width * scale));
      const drawHeight = Math.max(1, Math.round(bounds.height * scale));
      const drawX = Math.round((MAP_ITEM_TEXTURE_SIZE - drawWidth) / 2);
      const drawY = Math.round((MAP_ITEM_TEXTURE_SIZE - drawHeight) / 2);
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      context.clearRect(0, 0, MAP_ITEM_TEXTURE_SIZE, MAP_ITEM_TEXTURE_SIZE);
      context.drawImage(source, bounds.x, bounds.y, bounds.width, bounds.height, drawX, drawY, drawWidth, drawHeight);

      if (this.textures.exists(targetKey)) {
        this.textures.remove(targetKey);
      }
      this.textures.addCanvas(targetKey, canvas);
      this.textures.remove(sourceKey);
    });
  }

  private createNormalizedQuestIconTextures(): void {
    REGNERIKET_STOPS.filter((stop) => NORMALIZED_QUEST_ICON_IDS.has(stop.id)).forEach((stop) => {
      const sourceKey = getRegneriketSourceTextureKey(stop.id);
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

      const bounds = this.getOpaqueBounds(source, sourceWidth, sourceHeight);
      const canvas = document.createElement('canvas');
      canvas.width = QUEST_ICON_TEXTURE_SIZE;
      canvas.height = QUEST_ICON_TEXTURE_SIZE;
      const context = canvas.getContext('2d');
      if (!context) {
        return;
      }

      const scale = Math.min(QUEST_ICON_VISUAL_SIZE / bounds.width, QUEST_ICON_VISUAL_SIZE / bounds.height);
      const drawWidth = Math.max(1, Math.round(bounds.width * scale));
      const drawHeight = Math.max(1, Math.round(bounds.height * scale));
      const drawX = Math.round((QUEST_ICON_TEXTURE_SIZE - drawWidth) / 2);
      const drawY = Math.round((QUEST_ICON_TEXTURE_SIZE - drawHeight) / 2);
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      context.clearRect(0, 0, QUEST_ICON_TEXTURE_SIZE, QUEST_ICON_TEXTURE_SIZE);
      context.drawImage(source, bounds.x, bounds.y, bounds.width, bounds.height, drawX, drawY, drawWidth, drawHeight);

      const targetKey = getRegneriketTextureKey(stop.id);
      if (this.textures.exists(targetKey)) {
        this.textures.remove(targetKey);
      }
      this.textures.addCanvas(targetKey, canvas);
      this.textures.remove(sourceKey);
    });
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

    const bounds = this.getOpaqueBounds(source, sourceWidth, sourceHeight);
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
    this.textures.remove(sourceKey);
  }

  private getOpaqueBounds(source: CanvasImageSource, width: number, height: number): Phaser.Geom.Rectangle {
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
        if (alpha <= MAP_BOSS_ALPHA_THRESHOLD) {
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
    this.collisionMaskPixels = undefined;
    this.collisionMaskWidth = 0;
    this.collisionMaskHeight = 0;

    const collisionTextureKey = this.getCollisionTextureKey();
    if (!RED_COLLISION_MASK_TEST || !this.activeMap.hasCollisionMask || !this.textures.exists(collisionTextureKey)) {
      return;
    }

    const source = this.textures.get(collisionTextureKey).getSourceImage() as CanvasImageSource;
    const canvas = document.createElement('canvas');
    canvas.width = this.activeMap.width;
    canvas.height = this.activeMap.height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) {
      this.textures.remove(collisionTextureKey);
      return;
    }

    try {
      context.drawImage(source, 0, 0, this.activeMap.width, this.activeMap.height);
      const imageData = context.getImageData(0, 0, this.activeMap.width, this.activeMap.height);
      this.collisionMaskPixels = imageData.data;
      this.collisionMaskWidth = imageData.width;
      this.collisionMaskHeight = imageData.height;
    } catch {
      this.collisionMaskPixels = undefined;
      this.collisionMaskWidth = 0;
      this.collisionMaskHeight = 0;
    }
    this.textures.remove(collisionTextureKey);
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
          this.activeMap.width - COLLISION_EDGE_PADDING
        );
        const candidateY = Phaser.Math.Clamp(
          position.y + Math.sin(Phaser.Math.DegToRad(angle)) * radius,
          COLLISION_EDGE_PADDING,
          this.activeMap.height - COLLISION_EDGE_PADDING
        );
        if (this.isPositionWalkable(candidateX, candidateY)) {
          return { x: Math.round(candidateX), y: Math.round(candidateY) };
        }
      }
    }

    return { x: this.activeMap.startX, y: this.activeMap.startY };
  }

  private isPositionWalkable(x: number, y: number): boolean {
    if (!this.activeMap.hasCollisionMask || !RED_COLLISION_MASK_TEST || !this.collisionMaskPixels) {
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
    if (!this.activeMap.hasCollisionMask || !RED_COLLISION_MASK_TEST || this.time.now - this.lastCollisionBlockToast < 1400) {
      return;
    }

    this.lastCollisionBlockToast = this.time.now;
    this.hud.showToast('Her kan du ikke gå, bruk veien.');
  }

  private getCollisionTextureKey(map: GameMapConfig = this.activeMap): string {
    return map.id === REGNERIKET_MAP_ID
      ? 'world-collision-mask-regneriket'
      : 'world-collision-mask-bossreisen';
  }

  private getCollisionMaskPath(map: GameMapConfig): string {
    return map.id === REGNERIKET_MAP_ID
      ? REGNERIKET_COLLISION_MASK_PATH
      : BOSS_COLLISION_MASK_PATH;
  }

  private movePlayerBy(dx: number, dy: number): void {
    if (!this.player || !this.marker) {
      return;
    }

    const nextX = Phaser.Math.Clamp(this.player.x + dx, 65, this.activeMap.width - 65);
    const nextY = Phaser.Math.Clamp(this.player.y + dy, 75, this.activeMap.height - 75);
    let finalX = nextX;
    let finalY = nextY;

    if (!this.isPositionWalkable(finalX, finalY)) {
      const xOnly = Phaser.Math.Clamp(this.player.x + dx, 65, this.activeMap.width - 65);
      const yOnly = Phaser.Math.Clamp(this.player.y + dy, 75, this.activeMap.height - 75);
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

    if (!this.activeMap.showBossJourney) {
      if (this.nearby) {
        this.nearby = undefined;
        this.hud.setNearby(undefined);
      }
      this.updateNearbyMapItem();
      if (this.nearbyMapItem) {
        if (this.nearbyRegneriket) {
          this.nearbyRegneriket = undefined;
          this.hud.setNearbyRegneriket(undefined);
        }
        return;
      }
      this.updateNearbyRegneriketPortal();
      if (this.nearbyRegneriketPortal) {
        if (this.nearbyRegneriket) {
          this.nearbyRegneriket = undefined;
          this.hud.setNearbyRegneriket(undefined);
        }
        return;
      }
      this.updateNearbyRegneriketStop();
      return;
    }

    if (this.nearbyRegneriket) {
      this.nearbyRegneriket = undefined;
      this.hud.setNearbyRegneriket(undefined);
    }
    if (this.nearbyRegneriketPortal) {
      this.nearbyRegneriketPortal = undefined;
      this.hud.setNearbyPortal(undefined);
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

  private tryStartNearbyBattle(fromHud = false): void {
    if (!fromHud && this.hud.isWorldBlocked()) {
      return;
    }

    if (!this.activeMap.showBossJourney) {
      if (this.tryPickNearbyMapItem()) {
        return;
      }
      if (this.tryUseNearbyRegneriketPortal()) {
        return;
      }
      this.tryStartNearbyRegneriketQuest();
      return;
    }

    if (!this.nearby) {
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
      this.hud.showToast(`Hent mynten til ${this.nearby.place} først.`);
      return;
    }

    this.hud.openBattle(this.nearby, () => {
      this.progress.completeLocation(this.nearby!.id);
      this.refreshNodeViews();
    });
  }

  private resetWorldProgress(): void {
    this.stopTimedRun();
    this.progress.reset();
    this.movePlayerToSavedPosition();
    this.nearby = undefined;
    this.nearbyRegneriket = undefined;
    this.nearbyRegneriketPortal = undefined;
    this.refreshNodeViews();
    this.refreshRegneriketViews();
    this.refreshRegneriketPortalViews();
    this.refreshMapItemViews();
    this.hud.setNearby(undefined);
    this.hud.setNearbyRegneriket(undefined);
    this.hud.setNearbyPortal(undefined);
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
    this.finalReward?.setVisible(this.activeMap.showBossJourney && this.progress.hasFinalRewardPending());
    this.refreshRegneriketViews();
  }

  private refreshRegneriketViews(): void {
    const isRegneriket = this.activeMap.id === REGNERIKET_MAP_ID;
    this.regneriketViews.forEach((view) => {
      const unlocked = this.progress.isRegneriketUnlocked(view.stop.id);
      const completed = this.progress.isRegneriketCompleted(view.stop.id);
      const pendingReward = this.progress.hasPendingRegneriketReward(view.stop.id);
      const collected = this.progress.getRegneriketCoinStatus(view.stop.id) === 'collected';
      const visible = isRegneriket;
      view.ring.setVisible(visible);
      view.core.setVisible(false);
      view.icon.setVisible(visible);
      view.label.setVisible(visible);
      view.state.setVisible(visible);
      view.rewardCoin.setVisible(visible && pendingReward);

      view.ring.setFillStyle(view.stop.color, completed ? 0.12 : unlocked ? 0.18 : 0.06);
      view.ring.setStrokeStyle(2, view.stop.color, completed ? 0.58 : unlocked ? 0.82 : 0.28);
      view.ring.setAlpha(completed ? 0.74 : unlocked ? 1 : 0.46);
      view.icon.setAlpha(collected ? 0.94 : completed || unlocked ? 1 : 0.34);
      view.icon.setDisplaySize(collected ? 184 : 198, collected ? 184 : 198);
      view.label.setAlpha(completed || unlocked ? 1 : 0.7);
      const stateText = collected ? 'HENTET' : pendingReward ? 'MYNT' : unlocked ? 'OPPDRAG' : 'Lukket';
      view.state.setText(stateText);
      view.state.setColor(collected ? '#b8ffd0' : pendingReward ? '#fff1a6' : unlocked ? '#dbe8f5' : '#c3ccd6');
    });

    const showTalltreeLanterns = isRegneriket && this.progress.isRegneriketCompleted('talltreportalen');
    this.talltreeLanterns.forEach((lantern) => lantern.setVisible(showTalltreeLanterns));
  }

  private refreshRegneriketPortalViews(): void {
    const visible = this.activeMap.id === REGNERIKET_MAP_ID && this.progress.isRegneriketCompleted(REGNERIKET_FINAL_STOP_ID);
    this.regneriketPortalViews.forEach((view) => {
      view.ring.setVisible(visible);
      view.core.setVisible(visible);
      view.label.setVisible(visible);
      view.ring.setAlpha(visible ? 0.92 : 0);
      view.core.setAlpha(visible ? 0.96 : 0);
    });
  }

  private refreshMapItemViews(): void {
    const visibleMap = this.activeMap.id === REGNERIKET_MAP_ID;
    this.mapItemViews.forEach((view) => {
      let visible = false;
      if (visibleMap && view.item.id !== TIMED_TARGET.id) {
        visible = this.isPickupItemVisible(view.item);
      }
      if (visibleMap && view.item.id === TIMED_TARGET.id) {
        visible = this.timedTargetActive;
      }
      view.ring.setVisible(visible);
      view.sprite.setVisible(visible);
    });
  }

  private isPickupItemVisible(item: RegneriketMapItem): boolean {
    const quest = getRegneriketPickupQuest(item.questId);
    if (!quest
      || !this.progress.isRegneriketPickupQuestActive(quest.stopId)
      || this.progress.isRegneriketCompleted(quest.stopId)
      || this.progress.isRegneriketPickupItemCollected(quest.stopId, item.id)) {
      return false;
    }

    if (quest.mode === 'simultaneous') {
      return true;
    }

    return quest.items.find((candidate) => (
      !this.progress.isRegneriketPickupItemCollected(quest.stopId, candidate.id)
    ))?.id === item.id;
  }

  private updateTimedRun(): void {
    if (!this.timedTargetActive) {
      this.timedText?.setVisible(false);
      return;
    }
    const seconds = Math.max(0, Math.ceil((this.timedDeadline - this.time.now) / 1000));
    if (!this.timedText) {
      this.timedText = this.add.text(0, 0, '', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '36px',
        fontStyle: '900',
        color: '#fff8d7',
        stroke: '#10253a',
        strokeThickness: 7,
        backgroundColor: 'rgba(8, 25, 44, 0.88)'
      })
        .setPadding(16, 9, 16, 9)
        .setOrigin(0.5, 0)
        .setShadow(0, 4, '#000000', 0.42, true, true)
        .setScrollFactor(1)
        .setDepth(200);
    }
    const timerPosition = this.cameras.main.getWorldPoint(
      this.scale.width - 150 * this.renderScale,
      108 * this.renderScale
    );
    this.timedText
      .setPosition(timerPosition.x, timerPosition.y)
      .setColor(seconds <= 10 ? '#fff0f0' : '#fff8d7')
      .setBackgroundColor(seconds <= 10 ? 'rgba(131, 35, 47, 0.92)' : 'rgba(8, 25, 44, 0.88)')
      .setText(`TID: ${seconds}s`)
      .setVisible(true);
    if (seconds <= 0) {
      this.stopTimedRun();
      this.hud.showToast('Tiden er ute. Start Tidsløpet på nytt.');
      this.refreshMapItemViews();
      this.updateNearbyLocation();
    }
  }

  private stopTimedRun(): void {
    this.timedTargetActive = false;
    this.timedStartedAt = 0;
    this.timedDeadline = 0;
    this.timedText?.setVisible(false);
  }

  private updateRewardCoinPickup(): void {
    if (!this.player || !this.activeMap.showBossJourney) {
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

      const result = this.progress.collectReward(view.location.id);
      const regnecoins = result?.regnecoins ?? 0;
      this.hud.showToast(`${this.getCoinPickupMessage(view.location)}${regnecoins > 0 ? ` +${regnecoins} Regnecoins.` : ''}`);
      this.refreshNodeViews();
      this.updateNearbyLocation();
      return;
    }
  }

  private updateRegneriketRewardPickup(): void {
    if (!this.player || this.activeMap.id !== REGNERIKET_MAP_ID) {
      return;
    }

    for (const view of this.regneriketViews) {
      if (!view.rewardCoin.visible || !this.progress.hasPendingRegneriketReward(view.stop.id)) {
        continue;
      }

      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, view.rewardCoin.x, view.rewardCoin.y);
      if (distance > COIN_PICKUP_DISTANCE) {
        continue;
      }

      const result = this.progress.collectRegneriketReward(view.stop.id);
      this.hud.openMedalReward(result?.medalIds ?? [], result?.regnecoins ?? 0);
      if (!result?.medalIds.length) {
        this.hud.showToast(`${view.stop.place}-mynten er hentet! +${result?.regnecoins ?? this.progress.getRegneriketRewardCoins(view.stop.id)} Regnecoins.`);
      }
      this.refreshRegneriketViews();
      this.updateNearbyLocation();
      return;
    }
  }

  private updateFinalRewardPickup(): void {
    if (!this.player || !this.activeMap.showBossJourney || !this.finalReward?.visible || !this.progress.hasFinalRewardPending()) {
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

    const result = this.progress.collectFinalReward();
    this.hud.openJourneyReward(result);
    this.refreshNodeViews();
    this.updateNearbyLocation();
  }

  private updateNearbyRegneriketPortal(): void {
    if (!this.player || this.activeMap.id !== REGNERIKET_MAP_ID || !this.progress.isRegneriketCompleted(REGNERIKET_FINAL_STOP_ID)) {
      if (this.nearbyRegneriketPortal) {
        this.nearbyRegneriketPortal = undefined;
        this.hud.setNearbyPortal(undefined);
      }
      return;
    }

    let nearest: RegneriketPortal | undefined;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (const portal of REGNERIKET_PORTALS) {
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, portal.x, portal.y);
      if (distance < nearestDistance) {
        nearest = portal;
        nearestDistance = distance;
      }
    }

    const activeNearby = nearest && nearestDistance <= REGNERIKET_PORTAL_DISTANCE ? nearest : undefined;
    if (activeNearby?.id !== this.nearbyRegneriketPortal?.id) {
      this.nearbyRegneriketPortal = activeNearby;
      this.hud.setNearbyPortal(activeNearby);
    }

    this.regneriketPortalViews.forEach((view) => {
      const near = activeNearby?.id === view.portal.id;
      view.ring.setScale(near ? 1.16 : 1);
      view.core.setScale(near ? 1.12 : 1);
      view.label.setScale(near ? 1.08 : 1);
    });
  }

  private updateNearbyRegneriketStop(): void {
    if (!this.player) {
      return;
    }

    let nearest: RegneriketStop | undefined;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (const stop of REGNERIKET_STOPS) {
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, stop.x, stop.y);
      if (distance < nearestDistance) {
        nearest = stop;
        nearestDistance = distance;
      }
    }

    const activeNearby = nearest && nearestDistance <= INTERACT_DISTANCE ? nearest : undefined;
    this.nearbyRegneriket = activeNearby;
    this.hud.setNearbyRegneriket(activeNearby);

    this.regneriketViews.forEach((view) => {
      const near = activeNearby?.id === view.stop.id;
      view.ring.setScale(near ? 1.18 : 1);
      view.label.setScale(near ? 1.08 : 1);
    });
  }

  private updateNearbyMapItem(): void {
    if (!this.player || this.activeMap.id !== REGNERIKET_MAP_ID) {
      if (this.nearbyMapItem) {
        this.nearbyMapItem = undefined;
        this.hud.setNearbyPortal(undefined);
      }
      return;
    }
    let nearest: RegneriketMapItem | undefined;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (const view of this.mapItemViews) {
      if (!view.sprite.visible) {
        continue;
      }
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, view.item.x, view.item.y);
      if (distance < nearestDistance) {
        nearest = view.item;
        nearestDistance = distance;
      }
    }
    const activeNearby = nearest && nearestDistance <= INTERACT_DISTANCE ? nearest : undefined;
    const previousNearby = this.nearbyMapItem;
    this.nearbyMapItem = activeNearby;
    if (activeNearby) {
      const pickupQuest = getRegneriketPickupQuestForItem(activeNearby.id);
      const taskCount = pickupQuest?.itemRequiredCorrect ?? 0;
      this.hud.setNearbyPortal({
        title: activeNearby.label,
        description: activeNearby.id === TIMED_TARGET.id
          ? 'Plukk opp timeglasset før tiden er ute.'
          : `Plukk opp gjenstanden og løs ${taskCount} oppgaver.`,
        actionLabel: 'Plukk opp'
      });
    } else if (previousNearby) {
      this.hud.setNearbyPortal(undefined);
    }
  }

  private tryUseNearbyRegneriketPortal(): boolean {
    if (!this.nearbyRegneriketPortal || !this.player || !this.marker) {
      return false;
    }

    const portal = this.nearbyRegneriketPortal;
    const target = this.getSafePlayerPosition({ x: portal.targetX, y: portal.targetY });
    this.player.setPosition(target.x, target.y);
    this.marker.setPosition(target.x, target.y + 18);
    this.cameras.main.centerOn(target.x, target.y);
    this.progress.savePlayerPosition(target.x, target.y);
    this.clearPointerMoveTarget();
    this.hud.showToast(portal.id === 'portalarkivet-til-skyhaven'
      ? 'Portalen sender deg opp til Skyhaven.'
      : 'Portalen sender deg tilbake til Portalarkivet.');
    this.nearbyRegneriketPortal = undefined;
    this.hud.setNearbyPortal(undefined);
    this.updateNearbyLocation();
    return true;
  }

  private tryPickNearbyMapItem(): boolean {
    if (!this.nearbyMapItem) {
      return false;
    }

    if (this.nearbyMapItem.id === TIMED_TARGET.id) {
      const timedStop = REGNERIKET_STOPS.find((stop) => stop.id === 'tidslopet');
      if (!timedStop || !this.timedTargetActive) {
        return false;
      }

      const elapsedSeconds = Math.max(0, (this.time.now - this.timedStartedAt) / 1000);
      this.stopTimedRun();
      this.progress.completeRegneriketStop(timedStop.id);
      const medalReward = this.progress.awardTimedRegneriketMedal(elapsedSeconds);
      this.refreshRegneriketViews();
      this.refreshMapItemViews();
      this.hud.showToast('Timeglasset er hentet! Tidsmynten venter på kartet.');
      if (medalReward.medalIds.length > 0) {
        this.hud.openMedalReward(medalReward.medalIds, medalReward.regnecoins);
      }
      this.updateNearbyLocation();
      return true;
    }

    const pickupQuest = getRegneriketPickupQuestForItem(this.nearbyMapItem.id);
    const pickupStop = pickupQuest ? REGNERIKET_STOPS.find((stop) => stop.id === pickupQuest.stopId) : undefined;
    if (!pickupQuest
      || !pickupStop
      || !this.progress.isRegneriketPickupQuestActive(pickupQuest.stopId)
      || this.progress.isRegneriketPickupItemCollected(pickupQuest.stopId, this.nearbyMapItem.id)
      || !this.isPickupItemVisible(this.nearbyMapItem)) {
      return false;
    }

    const item = this.nearbyMapItem;
    this.hud.openRegneriketQuest(
      {
        ...pickupStop,
        place: item.label,
        title: `Plukk opp ${item.label}`,
        description: `Løs ${pickupQuest.itemRequiredCorrect} oppgaver for å sikre ${item.label.toLowerCase()}.`,
        successText: `${item.label} er hentet.`,
        iconSrc: item.src,
        requiredCorrect: pickupQuest.itemRequiredCorrect,
        medalReward: undefined
      },
      () => {
        this.progress.collectRegneriketPickupItem(pickupQuest.stopId, item.id);
        const collectedCount = this.progress.getRegneriketPickupItems(pickupQuest.stopId).length;
        if (collectedCount >= pickupQuest.items.length) {
          this.progress.completeRegneriketStop(pickupQuest.stopId);
          this.hud.showToast(`${pickupStop.place} er fullført! Hent mynten på kartet.`);
        } else if (pickupQuest.mode === 'sequential') {
          const nextItem = pickupQuest.items.find((candidate) => (
            !this.progress.isRegneriketPickupItemCollected(pickupQuest.stopId, candidate.id)
          ));
          if (nextItem) {
            this.hud.openInfoConfirm(
              'Neste gjenstand',
              `Neste gjenstand er ${nextItem.label}. Finn den på kartet og plukk den opp.`,
              'Neste',
              () => {
                this.refreshMapItemViews();
                this.updateNearbyLocation();
              }
            );
          }
        } else {
          this.hud.showToast(`${collectedCount} av ${pickupQuest.items.length} gjenstander er hentet.`);
        }
        this.refreshRegneriketViews();
        this.refreshMapItemViews();
        this.updateNearbyLocation();
      },
      false
    );
    return true;
  }

  private tryStartNearbyRegneriketQuest(): void {
    if (!this.nearbyRegneriket) {
      return;
    }

    const stop = this.nearbyRegneriket;
    if (this.progress.hasPendingRegneriketReward(stop.id)) {
      this.hud.showToast(`Hent mynten til ${stop.place} først.`);
      return;
    }

    if (this.progress.isRegneriketCompleted(stop.id)) {
      this.hud.showToast(`${stop.place} er allerede fullført.`);
      return;
    }

    if (!this.progress.isRegneriketUnlocked(stop.id)) {
      if (this.progress.canUnlockRegneriketStop(stop.id)) {
        this.hud.openRegneriketUnlockConfirm(stop, () => {
          if (!this.progress.unlockRegneriketStop(stop.id)) {
            this.hud.showToast('Du trenger en ubrukt mynt for å låse opp dette stedet.');
            return;
          }
          this.hud.showToast(`${stop.place} er låst opp!`);
          this.refreshRegneriketViews();
          this.updateNearbyLocation();
        });
        return;
      }

      this.hud.showToast('Du trenger en ubrukt mynt for å låse opp dette stedet.');
      return;
    }

    if (stop.questType === 'pickup') {
      this.startPickupQuest(stop);
      return;
    }

    if (stop.questType === 'timed') {
      this.startTimedQuest(stop);
      return;
    }

    this.hud.openRegneriketQuest(stop, () => {
      this.progress.completeRegneriketStop(stop.id);
      this.refreshRegneriketViews();
      this.refreshRegneriketPortalViews();
    });
  }

  private startPickupQuest(stop: RegneriketStop): void {
    const pickupQuest = getRegneriketPickupQuest(stop.id);
    if (!pickupQuest) {
      return;
    }

    if (this.progress.isRegneriketPickupQuestActive(stop.id)) {
      const remainingItems = pickupQuest.items.filter((item) => (
        !this.progress.isRegneriketPickupItemCollected(stop.id, item.id)
      ));
      const objective = pickupQuest.mode === 'sequential'
        ? `Finn ${remainingItems[0]?.label ?? 'den neste gjenstanden'} på kartet og plukk den opp.`
        : `Finn de ${remainingItems.length} gjenstandene som fortsatt mangler.`;
      this.hud.showToast(objective);
      return;
    }

    this.hud.openInfoConfirm(
      pickupQuest.introTitle,
      pickupQuest.introText,
      'Neste',
      () => {
        this.progress.startRegneriketPickupQuest(stop.id);
        this.refreshMapItemViews();
        this.updateNearbyLocation();
        const firstItem = pickupQuest.items[0];
        this.hud.showToast(pickupQuest.mode === 'sequential'
          ? `Finn ${firstItem.label} på kartet.`
          : `${pickupQuest.items.length} gjenstander er nå synlige rundt ${stop.place}.`);
      }
    );
  }

  private startTimedQuest(stop: RegneriketStop): void {
    if (this.timedTargetActive) {
      this.hud.showToast('Finn timeglasset før tiden renner ut.');
      return;
    }

    this.hud.openRegneriketQuest(
      stop,
      () => {
        this.hud.openInfoConfirm(
          'Tidsløpet starter',
          'Du har 25 sekunder på deg til å finne «Timeglasset». Hvis du ikke klarer dette må du starte oppdraget på nytt. Et hint er at du finner Timeglasset mellom lilla krystaller og stort tre!',
          'Start',
          () => {
            this.timedTargetActive = true;
            this.timedStartedAt = this.time.now;
            this.timedDeadline = this.time.now + 25000;
            this.refreshMapItemViews();
            this.updateNearbyLocation();
          }
        );
      },
      false
    );
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
    return this.activeMap.showBossJourney
      && (!location.hiddenUntilUnlocked || this.progress.isUnlocked(location.id) || this.progress.isCompleted(location.id));
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

  private getRegneriketGlyph(kind: RegneriketStop['kind']): string {
    const glyphs: Record<RegneriketStop['kind'], string> = {
      lys: '*',
      hent: '+',
      reparer: '=',
      lever: '>',
      portal: '?',
      utforsk: '!',
      tid: '#'
    };
    return glyphs[kind];
  }
}
