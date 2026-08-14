import Phaser from 'phaser';
import {
  CAMP_CONFIG,
  CAMP_HUB_ASSET_PATH,
  CAMP_HUB_TEXTURE_KEY,
  CAMP_PART_MASK_PATH,
  CAMP_PART_MASK_SCALE,
  CAMP_PART_MASK_TEXTURE_KEY,
  CAMP_PARTS,
  CAMP_QUEST_ID,
  CAMP_RESIDENT_OBJECT_ID,
  CAMP_RESIDENT_WAGON_ASSET_PATH,
  CAMP_RESIDENT_WAGON_TEXTURE_KEY,
  CAMP_RETURN_MESSAGE,
  CAMP_RIM_ASSET_PATH,
  CAMP_RIM_TEXTURE_KEY,
  CAMP_SPOKE_ASSET_PATH,
  CAMP_SPOKE_TEXTURE_KEY,
  createCampPartQuest,
  getCampPart,
  type CampPartPlacement
} from '../../game/content/campQuest';
import {
  BOAT_SHIP_LEFT_ASSET_PATH,
  BOAT_SHIP_LEFT_TEXTURE_KEY,
  BOAT_SHIP_RIGHT_ASSET_PATH,
  BOAT_SHIP_RIGHT_TEXTURE_KEY,
  BOAT_TRAVEL_INTERACTION_DISTANCE,
  BOAT_TRAVEL_POINTS,
  BOAT_WHEEL_ASSET_PATH,
  BOAT_WHEEL_TEXTURE_KEY,
  getBoatTravelPoint,
  type BoatTravelPoint
} from '../../game/content/boatTravel';
import {
  CRYSTAL_CART_CONFIG,
  CRYSTAL_CART_QUEST_ID,
  CRYSTAL_CONDUCTOR_ASSET_PATH,
  CRYSTAL_CONDUCTOR_TEXTURE_KEY
} from '../../game/content/crystalCart';
import {
  FISHERMAN_ASSET_PATH,
  FISHERMAN_TEXTURE_KEY,
  FISHING_ROD_ASSET_PATH,
  FISHING_ROD_TEXTURE_KEY,
  FISHING_CONFIG,
  getFishInventoryCount,
  getFishingLockMessage,
  isFishingUnlocked
} from '../../game/content/fishing';
import {
  GLADIATOR_ARENA_CONFIG,
  GLADIATOR_ARENA_QUEST_ID,
  LANISTA_ASSET_PATH,
  LANISTA_TEXTURE_KEY
} from '../../game/content/gladiatorArena';
import { LOCATIONS, type LocationNode } from '../../game/content/locations';
import {
  BUTLER_ASSET_PATH,
  BUTLER_TEXTURE_KEY,
  MANOR_CONFIG,
  MANOR_QUEST_ID
} from '../../game/content/manorQuest';
import {
  ARCHIVE_CONFIG,
  ARCHIVE_QUEST_ID,
  ARCHIVIST_ASSET_PATH,
  ARCHIVIST_TEXTURE_KEY
} from '../../game/content/archiveQuest';
import {
  CRYSTAL_BRIDGE_CONFIG,
  CRYSTAL_BRIDGE_GUARDIAN_ASSET_PATH,
  CRYSTAL_BRIDGE_GUARDIAN_TEXTURE_KEY,
  CRYSTAL_BRIDGE_QUEST_ID
} from '../../game/content/crystalBridgeQuest';
import { MAZE_GUARDIAN_ASSET_PATH, MAZE_GUARDIAN_TEXTURE_KEY, MAZE_QUEST_CONFIG, MAZE_QUEST_ID } from '../../game/content/mazeQuest';
import {
  BOSS_COLLISION_MASK_PATH,
  getRewardCoinOffset,
  isMapBossMarkerLocation,
  isRewardLocation,
  REGNERIKET_COLLISION_MASK_PATH,
  RED_COLLISION_MASK_TEST,
  TALLVOKTER_COLLISION_MASK_PATH
} from '../../game/content/mapExperiment';
import {
  getGameMap,
  REGNEMONSTER_MAP_ID,
  REGNERIKET_MAP_ID,
  TALLVOKTER_MAP_ID,
  type GameMapConfig
} from '../../game/content/maps';
import { getMapObjectPosition, getMapObjectPositions } from '../../game/content/mapObjectPositions';
import {
  REGNEMONSTER_OBJECT_CATALOG,
  getRegnemonsterCatalogAssetPath
} from '../../game/content/regnemonsterObjectCatalog';
import { MEDALS, type MedalId } from '../../game/content/medals';
import {
  MINE_BOSS_ASSET_PATH,
  MINE_BOSS_TEXTURE_KEY,
  MINING_CONFIG,
  MINING_QUEST_ID
} from '../../game/content/mining';
import { getTokenById, getTokenMapScale } from '../../game/content/playerTokens';
import {
  PUZZLE_MASTER_ASSET_PATH,
  PUZZLE_MASTER_TEXTURE_KEY,
  PUZZLE_QUEST_CONFIG,
  PUZZLE_QUEST_ID
} from '../../game/content/puzzleQuest';
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
import {
  getStoredTallvokterFxLevel,
  saveTallvokterFxLevel,
  type TallvokterFxLevel
} from '../../game/content/tallvokterFx';
import {
  TALLVOKTER_FINALE_ASSETS,
  TALLVOKTER_FINALE_CONFIG,
  TALLVOKTER_FINALE_MAP_TEXTURE_KEY,
  TALLVOKTER_FINALE_OBJECT_ID
} from '../../game/content/tallvokterFinale';
import {
  SWAMP_ALCHEMIST_MAP_ASSET_PATH,
  SWAMP_ALCHEMIST_MAP_TEXTURE_KEY,
  SWAMP_ALCHEMY_CONFIG,
  SWAMP_ALCHEMY_QUEST_ID
} from '../../game/content/swampAlchemy';
import {
  LIGHT_FOREST_CONFIG,
  LIGHT_FOREST_QUEST_ID,
  LIGHT_WEAVER_MAP_ASSET_PATH,
  LIGHT_WEAVER_MAP_TEXTURE_KEY
} from '../../game/content/lightForest';
import {
  COUNTERWEIGHT_VAULT_CONFIG,
  COUNTERWEIGHT_VAULT_QUEST_ID,
  VAULT_GUARDIAN_MAP_ASSET_PATH,
  VAULT_GUARDIAN_MAP_TEXTURE_KEY
} from '../../game/content/counterweightVault';
import {
  TALLVOKTER_THIEF_ASSET_PATH,
  TALLVOKTER_THIEF_MASK_PATH,
  TALLVOKTER_THIEF_MASK_SCALE,
  TALLVOKTER_THIEF_MASK_TEXTURE_KEY,
  TALLVOKTER_THIEF_ROBBERY_AMOUNT,
  TALLVOKTER_THIEF_TEXTURE_KEY,
  TALLVOKTER_THIEF_VICTORY_REWARD
} from '../../game/content/tallvokterThiefEncounter';
import {
  FINAL_REWARD_POSITION,
  type ProgressStore,
  type TallvokterCampPartPlacement
} from '../../game/simulation/progress';
import {
  findRegnemonsterRoomTransition,
  getRegnemonsterInteractionAt,
  getRegnemonsterRoomZoneIdAt,
  type RegnemonsterRoomId
} from '../../game/simulation/regnemonsterRooms';
import {
  WORLD_MARKER_TEXTURE_SIZE,
  getContainedTextureRect,
  getTextureSyncAction
} from '../../game/simulation/worldTextureOptimization';
import type { HudController } from '../../ui/hud';
import type {
  MapEditorObjectBinding,
  TallvokterMapEditor
} from '../../dev/TallvokterMapEditor';
import { registerSceneCleanup } from '../sceneCleanup';
import {
  hasTallvokterEffectAssets,
  queueTallvokterEffectAssets,
  TallvokterEffects
} from '../tallvokter/TallvokterEffects';
import {
  hasRegnemonsterPrototypeAssets,
  queueRegnemonsterPrototypeAssets,
  RegnemonsterPrototypeView
} from '../view/RegnemonsterPrototypeView';

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

type TallvokterActivity = 'fishing-spot' | 'fisherman' | 'mine-boss' | 'lanista' | 'maze-guardian' | 'butler' | 'archivist' | 'crystal-bridge-guardian' | 'crystal-conductor' | 'puzzle-master' | 'swamp-alchemist' | 'light-weaver' | 'vault-guardian' | 'tallvokter-finale' | 'camp-resident' | 'camp-part' | 'boat-west' | 'boat-east';

type FishingSpotView = {
  ring: Phaser.GameObjects.Arc;
  icon: Phaser.GameObjects.Image;
  label: Phaser.GameObjects.Text;
};

type FishermanView = {
  ring: Phaser.GameObjects.Arc;
  sprite: Phaser.GameObjects.Image;
  label: Phaser.GameObjects.Text;
};

type MineBossView = {
  ring: Phaser.GameObjects.Arc;
  sprite: Phaser.GameObjects.Image;
  label: Phaser.GameObjects.Text;
};

type LanistaView = {
  ring: Phaser.GameObjects.Arc;
  sprite: Phaser.GameObjects.Image;
  label: Phaser.GameObjects.Text;
};
type MazeGuardianView = LanistaView;
type ButlerView = LanistaView;
type ArchivistView = LanistaView;
type CrystalBridgeGuardianView = LanistaView;
type CrystalConductorView = LanistaView;
type PuzzleMasterView = LanistaView;
type SwampAlchemistView = LanistaView;
type LightWeaverView = LanistaView;
type VaultGuardianView = LanistaView;
type CampResidentView = LanistaView;
type TallvokterFinaleView = LanistaView;

type CampPartView = {
  part: CampPartPlacement;
  ring: Phaser.GameObjects.Arc;
  sprite: Phaser.GameObjects.Image;
  label: Phaser.GameObjects.Text;
};

type BoatTravelView = {
  point: BoatTravelPoint;
  ring: Phaser.GameObjects.Arc;
  icon: Phaser.GameObjects.Image;
  label: Phaser.GameObjects.Text;
};

type TallvokterThiefView = {
  ring: Phaser.GameObjects.Arc;
  sprite: Phaser.GameObjects.Image;
  label: Phaser.GameObjects.Text;
};

const INTERACT_DISTANCE = 115;
const TALLVOKTER_THIEF_INTERACT_DISTANCE = INTERACT_DISTANCE * 0.8;
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
    x: getMapObjectPosition(REGNERIKET_MAP_ID, 'portalarkivet-til-skyhaven').x,
    y: getMapObjectPosition(REGNERIKET_MAP_ID, 'portalarkivet-til-skyhaven').y,
    targetX: 3330,
    targetY: 720,
    title: 'Skyportalen',
    description: 'Ta portalen opp til Skyhaven-området.'
  },
  {
    id: 'skyhaven-til-portalarkivet',
    x: getMapObjectPosition(REGNERIKET_MAP_ID, 'skyhaven-til-portalarkivet').x,
    y: getMapObjectPosition(REGNERIKET_MAP_ID, 'skyhaven-til-portalarkivet').y,
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

function getMedalSourceTextureKey(id: MedalId): string {
  return `${getMedalTextureKey(id)}-source`;
}

function getPlayerTokenTextureKey(id: string): string {
  return `token-${id}`;
}

function getPlayerTokenSourceTextureKey(id: string): string {
  return `${getPlayerTokenTextureKey(id)}-source`;
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
  private worldInputEnabled = true;
  private readonly touchListenerOptions: AddEventListenerOptions = { passive: false };
  private readonly handleCanvasTouchStart = (event: TouchEvent): void => {
    if (!this.worldInputEnabled || this.hud.isWorldBlocked() || event.changedTouches.length === 0) {
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
    if (!this.worldInputEnabled || this.hud.isWorldBlocked() || this.activeTouchId === undefined) {
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
  private readonly handlePageInputReset = (): void => {
    this.resetWorldInputState();
    this.input.resetPointers();
    this.scale.updateBounds();
  };
  private readonly handleVisibilityChange = (): void => {
    if (document.hidden) {
      this.handlePageInputReset();
    }
  };
  private activeMap: GameMapConfig = getGameMap();
  private mapImage?: Phaser.GameObjects.Image;
  private mapShade?: Phaser.GameObjects.Rectangle;
  private regnemonsterPrototypeView?: RegnemonsterPrototypeView;
  private regnemonsterRoom: RegnemonsterRoomId = 'town';
  private regnemonsterDoorZoneId?: string;
  private regnemonsterTransitionPending = false;
  private regnemonsterTransitionLockedUntil = 0;
  private nearbyRegnemonsterInteraction?: 'binder' | 'game-console';
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
  private tallvokterEffects?: TallvokterEffects;
  private tallvokterFxLevel = getStoredTallvokterFxLevel();
  private fishingSpotView?: FishingSpotView;
  private fishermanView?: FishermanView;
  private mineBossView?: MineBossView;
  private lanistaView?: LanistaView;
  private mazeGuardianView?: MazeGuardianView;
  private butlerView?: ButlerView;
  private archivistView?: ArchivistView;
  private crystalBridgeGuardianView?: CrystalBridgeGuardianView;
  private crystalConductorView?: CrystalConductorView;
  private puzzleMasterView?: PuzzleMasterView;
  private swampAlchemistView?: SwampAlchemistView;
  private lightWeaverView?: LightWeaverView;
  private vaultGuardianView?: VaultGuardianView;
  private tallvokterFinaleView?: TallvokterFinaleView;
  private campResidentView?: CampResidentView;
  private campPartViews: CampPartView[] = [];
  private campPartSpawnCandidates: Array<{ x: number; y: number }> = [];
  private nearbyCampPartId?: string;
  private fishingSpotRingTween?: Phaser.Tweens.Tween;
  private fishingSpotIconTween?: Phaser.Tweens.Tween;
  private boatTravelViews: BoatTravelView[] = [];
  private tallvokterThiefView?: TallvokterThiefView;
  private tallvokterThiefSpawnCandidates: Array<{ x: number; y: number }> = [];
  private tallvokterThiefSpawnDeck: Array<{ x: number; y: number }> = [];
  private tallvokterThiefTriggered = false;
  private tallvokterThiefRevealed = false;
  private tallvokterThiefPlayMode?: string;
  private tallvokterThiefEncounterKey?: string;
  private mapEditor?: TallvokterMapEditor;
  private nearbyTallvokterActivity?: TallvokterActivity;
  private nearbyTallvokterStatus = '';
  private loadingFailed = false;
  private pendingMapLoadId?: string;
  private lightForestLaunchPending = false;
  private counterweightVaultLaunchPending = false;
  private tallvokterFinaleArrivalPending = false;
  private tallvokterFinaleArrivalPlaying = false;
  private readonly handleProgressChange = (): void => {
    const playMode = this.progress.getSettings().playMode;
    if (this.tallvokterThiefPlayMode !== playMode) {
      this.tallvokterThiefPlayMode = playMode;
      this.tallvokterThiefTriggered = false;
      this.tallvokterThiefRevealed = false;
    }
    this.syncActiveMap();
    this.ensureSelectedPlayerToken();
    this.ensureActiveMedalTexture();
    if (this.activeMap.showBossJourney) {
      LOCATIONS.filter((location) => (
        this.usesMapBossMarker(location) && this.progress.isCompleted(location.id)
      )).forEach((location) => this.ensureMapBossTexture(location, 'defeated'));
    }
    this.refreshNodeViews();
    this.refreshMapItemViews();
    this.refreshRegneriketPortalViews();
    this.refreshFishingStationViews();
    this.refreshMineBossView();
    this.refreshLanistaView();
    this.refreshMazeGuardianView();
    this.refreshButlerView();
    this.refreshArchivistView();
    this.refreshCrystalConductorView();
    this.refreshPuzzleMasterView();
    this.refreshSwampAlchemistView();
    this.refreshLightWeaverView();
    this.refreshVaultGuardianView();
    this.ensureTallvokterFinaleView();
    this.refreshTallvokterFinaleView();
    this.ensureCampQuestViews();
    this.refreshBoatTravelViews();
    this.ensureTallvokterThiefEncounter();
    this.refreshTallvokterThiefView();
    const finale = this.progress.getTallvokterFinaleProgress();
    if (this.activeMap.id === TALLVOKTER_MAP_ID && finale.unlocked && !finale.eventSeen) {
      this.tallvokterFinaleArrivalPending = true;
    }
    this.updateNearbyLocation();
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
    this.load.image('reward-coin', '/regnemester/ui/regnecoin.png');
  }

  create(): void {
    this.activeMap = getGameMap(this.progress.getSettings().mapId);
    this.cameras.main.setBackgroundColor('#08384f');

    this.mapImage = this.add.image(0, 0, this.activeMap.textureKey).setOrigin(0).setDepth(0);
    this.mapShade = this.add.rectangle(0, 0, 1, 1, 0x06182a, 0.08).setDepth(1);
    this.finalizeLoadedMapAssets(this.activeMap);
    if (this.activeMap.id === REGNEMONSTER_MAP_ID) {
      this.createRegnemonsterPrototypeView();
    }
    this.applyActiveMap();
    this.createCollisionMask();
    this.createNodeViews();
    this.createRegneriketNodeViews();
    this.createTalltreeLanterns();
    this.createRegneriketPortalViews();
    this.createMapItemViews();
    this.ensureFishingStationViews();
    this.ensureMineBossView();
    this.ensureLanistaView();
    this.ensureMazeGuardianView();
    this.ensureButlerView();
    this.ensureArchivistView();
    this.ensureCrystalBridgeGuardianView();
    this.ensureCrystalConductorView();
    this.ensurePuzzleMasterView();
    this.ensureSwampAlchemistView();
    this.ensureLightWeaverView();
    this.ensureVaultGuardianView();
    this.ensureTallvokterFinaleView();
    this.ensureCampQuestViews();
    this.ensureBoatTravelViews();
    this.ensureTallvokterThiefEncounter();
    this.finalReward = this.createFinalReward(FINAL_REWARD_POSITION.x, FINAL_REWARD_POSITION.y);
    this.syncTallvokterEffects();
    this.createPlayer();
    this.elevateTallvokterLocationViews();
    this.createInputs();
    this.initializeLocalMapEditor();

    this.hud.bindWorld({
      startBattle: () => this.tryStartNearbyBattle(true),
      resetProgress: () => this.resetWorldProgress(),
      resetPlayerToProgress: () => this.movePlayerToSavedPosition(),
      resetInput: () => this.resetWorldInputState(),
      setTallvokterFxLevel: (level) => this.setTallvokterFxLevel(level)
    });
    this.hud.setTallvokterFxLevel(this.tallvokterFxLevel);
    this.hud.renderProgress();
    this.refreshNodeViews();
    this.refreshRegneriketViews();
    this.refreshRegneriketPortalViews();
    this.refreshMapItemViews();

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.worldInputEnabled || this.hud.isWorldBlocked()) {
        return;
      }
      this.preventPointerBrowserGestures(pointer);
      this.heldPointer = pointer;
      if (this.shouldUseJoystickPointer(pointer)) {
        this.startJoystickPointer(pointer);
      } else {
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        this.tallvokterEffects?.interact(worldPoint.x, worldPoint.y);
        this.updatePointerMoveTarget(pointer);
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.worldInputEnabled || this.hud.isWorldBlocked() || this.heldPointer?.id !== pointer.id || !pointer.isDown) {
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
    window.addEventListener('blur', this.handlePageInputReset);
    window.addEventListener('pageshow', this.handlePageInputReset);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    registerSceneCleanup(this.events, () => {
      this.progress.removeEventListener('change', this.handleProgressChange);
      this.detachNativeTouchInput();
      window.removeEventListener('blur', this.handlePageInputReset);
      window.removeEventListener('pageshow', this.handlePageInputReset);
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
      this.mapEditor?.destroy();
      this.mapEditor = undefined;
      this.tallvokterEffects?.destroy();
      this.tallvokterEffects = undefined;
    });
    if (!this.loadingFailed) {
      this.hud.setWorldReady();
      const finale = this.progress.getTallvokterFinaleProgress();
      this.tallvokterFinaleArrivalPending =
        this.activeMap.id === TALLVOKTER_MAP_ID && finale.unlocked && !finale.eventSeen;
    }
  }

  update(_: number, delta: number): void {
    this.tallvokterEffects?.update(this.time.now, delta, this.cameras.main);
    this.regnemonsterPrototypeView?.update(this.time.now);
    this.tryStartTallvokterFinaleArrival();
    const worldBlocked = this.hud.isWorldBlocked();
    if (!this.worldInputEnabled || !this.player || worldBlocked || this.regnemonsterTransitionPending) {
      this.clearPointerMoveTarget();
      if (worldBlocked) this.input.keyboard?.resetKeys();
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

    this.updateRegnemonsterRoomDoorState();

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
      if (this.activeMap.id !== REGNEMONSTER_MAP_ID || this.regnemonsterRoom === 'town') {
        this.progress.savePlayerPosition(this.player.x, this.player.y);
      }
    }
  }

  private createPlayer(): void {
    const start = this.getSafePlayerPosition(this.progress.getPlayerPosition());
    this.marker = this.add.circle(start.x, start.y + 16, 50, 0x07213a, 0.36).setDepth(18).setVisible(false);
    this.player = this.add.image(start.x, start.y, this.getPlayerTextureKey()).setDepth(40);
    const tokenScale = getTokenMapScale(this.progress.getSettings().tokenId);
    const baseSize = this.activeMap.id === REGNEMONSTER_MAP_ID ? 84 : 132;
    this.player.setDisplaySize(baseSize * tokenScale, baseSize * tokenScale);
    this.player.setOrigin(0.5, 0.58);
    this.player.setDepth(40);
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

  private initializeLocalMapEditor(): void {
    const localHosts = new Set(['localhost', '127.0.0.1', '::1']);
    if (!import.meta.env.DEV || !localHosts.has(window.location.hostname)) {
      return;
    }

    void import('../../dev/TallvokterMapEditor').then(({ TallvokterMapEditor: Editor }) => {
      if (!this.sys.isActive() || this.mapEditor) {
        return;
      }
      const objects = this.getMapEditorBindings();
      if (objects.length === 0) {
        return;
      }
      this.mapEditor = new Editor({
        scene: this,
        objects,
        getActiveMapId: () => (
          this.activeMap.id === REGNEMONSTER_MAP_ID
            ? this.regnemonsterPrototypeView?.getEditorMapId() ?? REGNEMONSTER_MAP_ID
            : this.activeMap.id
        ),
        onEditingChange: (active) => this.setMapEditorActive(active),
        focusObject: (position) => this.cameras.main.centerOn(position.x - 260, position.y),
        catalogItems: REGNEMONSTER_OBJECT_CATALOG.map((item) => ({
          id: item.id,
          label: item.label,
          category: item.category,
          assetPath: getRegnemonsterCatalogAssetPath(item),
          mapId: REGNEMONSTER_MAP_ID
        })),
        addCatalogObject: (catalogId, position) => {
          if (this.activeMap.id !== REGNEMONSTER_MAP_ID || !this.regnemonsterPrototypeView) {
            throw new Error('Objektbiblioteket er bare tilgjengelig i Regnemonster.');
          }
          return this.regnemonsterPrototypeView.addLibraryObject(catalogId, position);
        },
        duplicateObject: (binding) => {
          if (this.activeMap.id !== REGNEMONSTER_MAP_ID || !this.regnemonsterPrototypeView) {
            throw new Error('Objektet kan ikke dupliseres på dette kartet.');
          }
          return this.regnemonsterPrototypeView.duplicateLibraryObject(binding.id);
        },
        deleteObject: (binding) => {
          if (this.activeMap.id !== REGNEMONSTER_MAP_ID || !this.regnemonsterPrototypeView) {
            throw new Error('Objektet kan ikke slettes på dette kartet.');
          }
          this.regnemonsterPrototypeView.deleteEditableObject(binding.id);
        }
      });
      this.mapEditor.setAvailable(
        this.isActiveMapEditable()
      );
    });
  }

  private getMapEditorBindings(): MapEditorObjectBinding[] {
    const tallvokterCommon = {
      mapId: TALLVOKTER_MAP_ID,
      maxX: 3840,
      maxY: 2560
    };
    const runtimeBindings = new Map<string, Pick<
      MapEditorObjectBinding,
      'target' | 'interactionRadius' | 'applyPosition'
    >>();

    if (this.fishingSpotView) {
      runtimeBindings.set('fishingSpot', {
        target: this.fishingSpotView.icon,
        interactionRadius: FISHING_CONFIG.interactionDistance,
        applyPosition: () => this.applyFishingStationPositions()
      });
    }
    if (this.fishermanView) {
      runtimeBindings.set('fisherman', {
        target: this.fishermanView.sprite,
        interactionRadius: FISHING_CONFIG.interactionDistance,
        applyPosition: () => this.applyFishingStationPositions()
      });
    }
    if (this.mineBossView) {
      runtimeBindings.set('mineBoss', {
        target: this.mineBossView.sprite,
        interactionRadius: MINING_CONFIG.interactionDistance,
        applyPosition: () => this.applyMineBossPosition()
      });
    }
    if (this.lanistaView) {
      runtimeBindings.set('lanista', {
        target: this.lanistaView.sprite,
        interactionRadius: GLADIATOR_ARENA_CONFIG.interactionDistance,
        applyPosition: () => this.applyLanistaPosition()
      });
    }
    if (this.mazeGuardianView) {
      runtimeBindings.set('mazeGuardian', {
        target: this.mazeGuardianView.sprite,
        interactionRadius: MAZE_QUEST_CONFIG.interactionDistance,
        applyPosition: () => this.applyMazeGuardianPosition()
      });
    }
    if (this.butlerView) {
      runtimeBindings.set('butler', {
        target: this.butlerView.sprite,
        interactionRadius: MANOR_CONFIG.interactionDistance,
        applyPosition: () => this.applyButlerPosition()
      });
    }
    if (this.archivistView) {
      runtimeBindings.set('archivist', {
        target: this.archivistView.sprite,
        interactionRadius: ARCHIVE_CONFIG.interactionDistance,
        applyPosition: () => this.applyArchivistPosition()
      });
    }
    if (this.crystalBridgeGuardianView) {
      runtimeBindings.set('crystalBridgeGuardian', {
        target: this.crystalBridgeGuardianView.sprite,
        interactionRadius: CRYSTAL_BRIDGE_CONFIG.interactionDistance,
        applyPosition: () => this.applyCrystalBridgeGuardianPosition()
      });
    }
    if (this.crystalConductorView) {
      runtimeBindings.set('crystalConductor', {
        target: this.crystalConductorView.sprite,
        interactionRadius: CRYSTAL_CART_CONFIG.interactionDistance,
        applyPosition: () => this.applyCrystalConductorPosition()
      });
    }
    if (this.puzzleMasterView) {
      runtimeBindings.set('puzzleMaster', {
        target: this.puzzleMasterView.sprite,
        interactionRadius: PUZZLE_QUEST_CONFIG.interactionDistance,
        applyPosition: () => this.applyPuzzleMasterPosition()
      });
    }
    if (this.swampAlchemistView) {
      runtimeBindings.set('swampAlchemist', {
        target: this.swampAlchemistView.sprite,
        interactionRadius: SWAMP_ALCHEMY_CONFIG.interactionDistance,
        applyPosition: () => this.applySwampAlchemistPosition()
      });
    }
    if (this.lightWeaverView) {
      runtimeBindings.set('lightWeaver', {
        target: this.lightWeaverView.sprite,
        interactionRadius: LIGHT_FOREST_CONFIG.interactionDistance,
        applyPosition: () => this.applyLightWeaverPosition()
      });
    }
    if (this.vaultGuardianView) {
      runtimeBindings.set('vaultGuardian', {
        target: this.vaultGuardianView.sprite,
        interactionRadius: COUNTERWEIGHT_VAULT_CONFIG.interactionDistance,
        applyPosition: () => this.applyVaultGuardianPosition()
      });
    }
    if (this.tallvokterFinaleView) {
      runtimeBindings.set(TALLVOKTER_FINALE_OBJECT_ID, {
        target: this.tallvokterFinaleView.sprite,
        interactionRadius: TALLVOKTER_FINALE_CONFIG.interactionDistance,
        applyPosition: () => this.applyTallvokterFinalePosition()
      });
    }
    if (this.campResidentView) {
      runtimeBindings.set(CAMP_RESIDENT_OBJECT_ID, {
        target: this.campResidentView.sprite,
        interactionRadius: CAMP_CONFIG.interactionDistance,
        applyPosition: () => this.applyCampResidentPosition()
      });
    }
    for (const view of this.boatTravelViews) {
      runtimeBindings.set(view.point.id, {
        target: view.icon,
        interactionRadius: BOAT_TRAVEL_INTERACTION_DISTANCE,
        applyPosition: () => this.applyBoatTravelPositions()
      });
    }

    const tallvokterBindings = getMapObjectPositions(TALLVOKTER_MAP_ID).map(({ id, position }) => {
      const runtimeBinding = runtimeBindings.get(id);
      return {
        ...tallvokterCommon,
        id,
        label: position.label,
        position,
        target: runtimeBinding?.target,
        interactionRadius: runtimeBinding?.interactionRadius ?? INTERACT_DISTANCE,
        applyPosition: runtimeBinding?.applyPosition ?? (() => undefined)
      };
    });

    const regneriketBindings = getMapObjectPositions(REGNERIKET_MAP_ID).map(({ id, position }) => {
      const stopView = this.regneriketViews.find((view) => view.stop.id === id);
      const itemView = this.mapItemViews.find((view) => view.item.id === id);
      const portalView = this.regneriketPortalViews.find((view) => view.portal.id === id);
      return {
        mapId: REGNERIKET_MAP_ID,
        maxX: 3840,
        maxY: 2560,
        id,
        label: position.label,
        position,
        target: stopView?.icon ?? itemView?.sprite,
        interactionRadius: portalView ? REGNERIKET_PORTAL_DISTANCE : INTERACT_DISTANCE,
        applyPosition: () => {
          if (stopView) {
            stopView.stop.x = position.x;
            stopView.stop.y = position.y;
            this.applyRegneriketStopPosition(stopView);
          }
          if (itemView) {
            itemView.item.x = position.x;
            itemView.item.y = position.y;
            itemView.sprite.setPosition(position.x, position.y);
            itemView.ring.setPosition(position.x, position.y);
          }
          if (portalView) {
            portalView.portal.x = position.x;
            portalView.portal.y = position.y;
            this.applyRegneriketPortalPosition(portalView);
          }
        }
      };
    });

    const regnemonsterBindings = this.regnemonsterPrototypeView?.getEditorBindings() ?? [];

    return [...tallvokterBindings, ...regneriketBindings, ...regnemonsterBindings];
  }

  private isActiveMapEditable(): boolean {
    return this.activeMap.id === TALLVOKTER_MAP_ID
      || this.activeMap.id === REGNERIKET_MAP_ID
      || this.activeMap.id === REGNEMONSTER_MAP_ID;
  }

  private applyRegneriketStopPosition(view: RegneriketNodeView): void {
    const { stop } = view;
    view.ring.setPosition(stop.x, stop.y);
    view.core.setPosition(stop.x, stop.y);
    view.icon.setPosition(stop.x, stop.y);
    view.label.setPosition(stop.x, stop.y + 126);
    view.state.setPosition(stop.x, stop.y + 145);
    const offset = REGNERIKET_REWARD_COIN_OFFSETS[stop.id] ?? { x: 122, y: 96 };
    view.rewardCoin.setPosition(stop.x + offset.x, stop.y + offset.y);
  }

  private applyRegneriketPortalPosition(view: RegneriketPortalView): void {
    const { portal } = view;
    view.ring.setPosition(portal.x, portal.y);
    view.core.setPosition(portal.x, portal.y);
    view.label.setPosition(portal.x, portal.y + 64);
    const lowerPortal = REGNERIKET_PORTALS.find((candidate) => candidate.id === 'portalarkivet-til-skyhaven');
    const upperPortal = REGNERIKET_PORTALS.find((candidate) => candidate.id === 'skyhaven-til-portalarkivet');
    if (lowerPortal && upperPortal) {
      lowerPortal.targetX = upperPortal.x - 130;
      lowerPortal.targetY = upperPortal.y;
      upperPortal.targetX = lowerPortal.x - 165;
      upperPortal.targetY = lowerPortal.y - 60;
    }
  }

  private setMapEditorActive(active: boolean): void {
    this.clearPointerMoveTarget();
    this.input.keyboard?.resetKeys();
    this.worldInputEnabled = !active;
    this.regnemonsterPrototypeView?.setEditing(active);
    if (active) {
      this.stopFishingStationTweens();
      this.cameras.main.stopFollow();
      this.nearbyTallvokterActivity = undefined;
      this.nearbyTallvokterStatus = '';
      this.hud.setNearby(undefined);
      this.hud.setNearbyRegneriket(undefined);
      this.hud.setNearbyPortal(undefined);
      return;
    }

    this.startFishingStationTweens();
    if (this.player) {
      this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    }
    this.updateNearbyLocation();
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

  private resetWorldInputState(): void {
    this.clearPointerMoveTarget();
    this.input.keyboard?.resetKeys();
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
    if (nextMap.id === REGNEMONSTER_MAP_ID) {
      this.createRegnemonsterPrototypeView();
    }
    if (previousMap.id === REGNEMONSTER_MAP_ID || nextMap.id === REGNEMONSTER_MAP_ID) {
      this.regnemonsterRoom = 'town';
      this.regnemonsterDoorZoneId = undefined;
      this.regnemonsterTransitionPending = false;
      this.nearbyRegnemonsterInteraction = undefined;
      this.regnemonsterPrototypeView?.setRoom('town');
    }
    this.stopTimedRun();
    this.applyActiveMap();
    this.player?.setAngle(0);
    this.mapEditor?.refreshForActiveMap();
    this.createCollisionMask();
    this.syncTallvokterEffects();
    this.ensureFishingStationViews();
    this.ensureMineBossView();
    this.ensureLanistaView();
    this.ensureMazeGuardianView();
    this.ensureButlerView();
    this.ensureArchivistView();
    this.ensureCrystalBridgeGuardianView();
    this.ensureCrystalConductorView();
    this.ensurePuzzleMasterView();
    this.ensureSwampAlchemistView();
    this.ensureLightWeaverView();
    this.ensureVaultGuardianView();
    this.ensureTallvokterFinaleView();
    this.ensureCampQuestViews();
    this.ensureBoatTravelViews();
    this.ensureTallvokterThiefEncounter();
    this.elevateTallvokterLocationViews();
    if (
      previousMap.id !== TALLVOKTER_MAP_ID
      && previousMap.textureKey !== nextMap.textureKey
      && this.textures.exists(previousMap.textureKey)
    ) {
      this.textures.remove(previousMap.textureKey);
    }
    this.nearby = undefined;
    this.nearbyRegneriket = undefined;
    this.nearbyRegneriketPortal = undefined;
    this.nearbyMapItem = undefined;
    this.nearbyTallvokterActivity = undefined;
    this.nearbyTallvokterStatus = '';
    this.hud.setNearby(undefined);
    this.hud.setNearbyRegneriket(undefined);
    this.hud.setNearbyPortal(undefined);
    this.movePlayerToSavedPosition();
    this.refreshNodeViews();
    this.refreshRegneriketViews();
    this.refreshRegneriketPortalViews();
    this.refreshMapItemViews();
    this.refreshFishingStationViews();
    this.refreshMineBossView();
    this.refreshLanistaView();
    this.refreshMazeGuardianView();
    this.refreshButlerView();
    this.refreshArchivistView();
    this.refreshCrystalConductorView();
    this.refreshPuzzleMasterView();
    this.refreshSwampAlchemistView();
    this.refreshLightWeaverView();
    this.refreshVaultGuardianView();
    this.refreshTallvokterFinaleView();
    this.refreshCampQuestViews();
    this.refreshBoatTravelViews();
    this.refreshTallvokterThiefView();
    const finale = this.progress.getTallvokterFinaleProgress();
    this.tallvokterFinaleArrivalPending =
      nextMap.id === TALLVOKTER_MAP_ID && finale.unlocked && !finale.eventSeen;
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
      this.finalizeLoadedMapAssets(nextMap);
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

    const selectedToken = getTokenById(this.progress.getSettings().tokenId);
    const selectedTokenSourceKey = getPlayerTokenSourceTextureKey(selectedToken.id);
    const selectedTokenKey = getPlayerTokenTextureKey(selectedToken.id);
    if (!this.textures.exists(selectedTokenSourceKey) && !this.textures.exists(selectedTokenKey)) {
      this.load.image(selectedTokenSourceKey, selectedToken.src);
    }

    if (map.id === REGNEMONSTER_MAP_ID) {
      queueRegnemonsterPrototypeAssets(this);
    }

    if (map.showBossJourney) {
      const activeMedal = MEDALS.find((medal) => medal.id === this.progress.getActiveMedalId());
      if (activeMedal) {
        const medalSourceKey = getMedalSourceTextureKey(activeMedal.id);
        const medalKey = getMedalTextureKey(activeMedal.id);
        if (!this.textures.exists(medalSourceKey) && !this.textures.exists(medalKey)) {
          this.load.image(medalSourceKey, activeMedal.src);
        }
      }
      LOCATIONS.filter((location) => isMapBossMarkerLocation(location.id)).forEach((location) => {
        const moods: Array<'idle' | 'defeated'> = ['idle'];
        if (this.progress.isCompleted(location.id)) {
          moods.push('defeated');
        }
        for (const mood of moods) {
          const sourceKey = getMapBossSourceTextureKey(location, mood);
          const textureKey = getMapBossTextureKey(location, mood);
          if (!this.textures.exists(sourceKey) && !this.textures.exists(textureKey)) {
            this.load.image(sourceKey, location.boss[mood]);
          }
        }
      });
    }

    if (map.id === REGNERIKET_MAP_ID) {
      REGNERIKET_STOPS.forEach((stop) => {
        const sourceKey = NORMALIZED_QUEST_ICON_IDS.has(stop.id)
          ? getRegneriketSourceTextureKey(stop.id)
          : getRegneriketTextureKey(stop.id);
        const textureKey = getRegneriketTextureKey(stop.id);
        if (!this.textures.exists(sourceKey) && !this.textures.exists(textureKey)) {
          this.load.image(sourceKey, stop.iconSrc);
        }
      });
      [...REGNERIKET_PICKUP_ITEMS, TIMED_TARGET].forEach((item) => {
        const sourceKey = getMapItemSourceTextureKey(item.id);
        const textureKey = getMapItemTextureKey(item.id);
        if (!this.textures.exists(sourceKey) && !this.textures.exists(textureKey)) {
          this.load.image(sourceKey, item.src);
        }
      });
      if (!this.textures.exists('talltree-lantern')) {
        this.load.image('talltree-lantern', '/regnemester/quest-items/talltre-lykt.png');
      }
    }

    if (map.id === TALLVOKTER_MAP_ID && !this.tallvokterEffects) {
      queueTallvokterEffectAssets(this);
    }

    if (map.id === TALLVOKTER_MAP_ID) {
      if (!this.textures.exists(FISHERMAN_TEXTURE_KEY)) {
        this.load.image(FISHERMAN_TEXTURE_KEY, FISHERMAN_ASSET_PATH);
      }
      if (!this.textures.exists(FISHING_ROD_TEXTURE_KEY)) {
        this.load.image(FISHING_ROD_TEXTURE_KEY, FISHING_ROD_ASSET_PATH);
      }
      if (!this.textures.exists(MINE_BOSS_TEXTURE_KEY)) {
        this.load.image(MINE_BOSS_TEXTURE_KEY, MINE_BOSS_ASSET_PATH);
      }
      if (!this.textures.exists(LANISTA_TEXTURE_KEY)) {
        this.load.image(LANISTA_TEXTURE_KEY, LANISTA_ASSET_PATH);
      }
      if (!this.textures.exists(MAZE_GUARDIAN_TEXTURE_KEY)) {
        this.load.image(MAZE_GUARDIAN_TEXTURE_KEY, MAZE_GUARDIAN_ASSET_PATH);
      }
      if (!this.textures.exists(BUTLER_TEXTURE_KEY)) {
        this.load.image(BUTLER_TEXTURE_KEY, BUTLER_ASSET_PATH);
      }
      if (!this.textures.exists(ARCHIVIST_TEXTURE_KEY)) {
        this.load.image(ARCHIVIST_TEXTURE_KEY, ARCHIVIST_ASSET_PATH);
      }
      if (!this.textures.exists(CRYSTAL_BRIDGE_GUARDIAN_TEXTURE_KEY)) {
        this.load.image(
          CRYSTAL_BRIDGE_GUARDIAN_TEXTURE_KEY,
          CRYSTAL_BRIDGE_GUARDIAN_ASSET_PATH
        );
      }
      if (!this.textures.exists(CRYSTAL_CONDUCTOR_TEXTURE_KEY)) {
        this.load.image(CRYSTAL_CONDUCTOR_TEXTURE_KEY, CRYSTAL_CONDUCTOR_ASSET_PATH);
      }
      if (!this.textures.exists(PUZZLE_MASTER_TEXTURE_KEY)) {
        this.load.image(PUZZLE_MASTER_TEXTURE_KEY, PUZZLE_MASTER_ASSET_PATH);
      }
      if (!this.textures.exists(SWAMP_ALCHEMIST_MAP_TEXTURE_KEY)) {
        this.load.image(SWAMP_ALCHEMIST_MAP_TEXTURE_KEY, SWAMP_ALCHEMIST_MAP_ASSET_PATH);
      }
      if (!this.textures.exists(LIGHT_WEAVER_MAP_TEXTURE_KEY)) {
        this.load.image(LIGHT_WEAVER_MAP_TEXTURE_KEY, LIGHT_WEAVER_MAP_ASSET_PATH);
      }
      if (!this.textures.exists(VAULT_GUARDIAN_MAP_TEXTURE_KEY)) {
        this.load.image(VAULT_GUARDIAN_MAP_TEXTURE_KEY, VAULT_GUARDIAN_MAP_ASSET_PATH);
      }
      if (!this.textures.exists(TALLVOKTER_FINALE_MAP_TEXTURE_KEY)) {
        this.load.image(TALLVOKTER_FINALE_MAP_TEXTURE_KEY, TALLVOKTER_FINALE_ASSETS.map);
      }
      if (!this.textures.exists(CAMP_RESIDENT_WAGON_TEXTURE_KEY)) {
        this.load.image(CAMP_RESIDENT_WAGON_TEXTURE_KEY, CAMP_RESIDENT_WAGON_ASSET_PATH);
      }
      if (!this.textures.exists(CAMP_SPOKE_TEXTURE_KEY)) {
        this.load.image(CAMP_SPOKE_TEXTURE_KEY, CAMP_SPOKE_ASSET_PATH);
      }
      if (!this.textures.exists(CAMP_RIM_TEXTURE_KEY)) {
        this.load.image(CAMP_RIM_TEXTURE_KEY, CAMP_RIM_ASSET_PATH);
      }
      if (!this.textures.exists(CAMP_HUB_TEXTURE_KEY)) {
        this.load.image(CAMP_HUB_TEXTURE_KEY, CAMP_HUB_ASSET_PATH);
      }
      if (!this.textures.exists(CAMP_PART_MASK_TEXTURE_KEY)) {
        this.load.image(CAMP_PART_MASK_TEXTURE_KEY, CAMP_PART_MASK_PATH);
      }
      if (!this.textures.exists(BOAT_WHEEL_TEXTURE_KEY)) {
        this.load.image(BOAT_WHEEL_TEXTURE_KEY, BOAT_WHEEL_ASSET_PATH);
      }
      if (!this.textures.exists(BOAT_SHIP_RIGHT_TEXTURE_KEY)) {
        this.load.image(BOAT_SHIP_RIGHT_TEXTURE_KEY, BOAT_SHIP_RIGHT_ASSET_PATH);
      }
      if (!this.textures.exists(BOAT_SHIP_LEFT_TEXTURE_KEY)) {
        this.load.image(BOAT_SHIP_LEFT_TEXTURE_KEY, BOAT_SHIP_LEFT_ASSET_PATH);
      }
      if (!this.textures.exists(TALLVOKTER_THIEF_TEXTURE_KEY)) {
        this.load.image(TALLVOKTER_THIEF_TEXTURE_KEY, TALLVOKTER_THIEF_ASSET_PATH);
      }
      if (!this.textures.exists(TALLVOKTER_THIEF_MASK_TEXTURE_KEY)) {
        this.load.image(TALLVOKTER_THIEF_MASK_TEXTURE_KEY, TALLVOKTER_THIEF_MASK_PATH);
      }
    }
  }

  private hasMapAssets(map: GameMapConfig): boolean {
    const selectedTokenId = this.progress.getSettings().tokenId;
    return this.textures.exists(map.textureKey)
      && this.textures.exists(getPlayerTokenTextureKey(selectedTokenId))
      && (map.id !== REGNEMONSTER_MAP_ID || hasRegnemonsterPrototypeAssets(this))
      && (!RED_COLLISION_MASK_TEST
        || !map.hasCollisionMask
        || this.textures.exists(this.getCollisionTextureKey(map)))
      && (map.id !== TALLVOKTER_MAP_ID
        || Boolean(this.tallvokterEffects)
        || hasTallvokterEffectAssets(this))
      && (map.id !== TALLVOKTER_MAP_ID
         || (this.textures.exists(FISHERMAN_TEXTURE_KEY)
          && this.textures.exists(FISHING_ROD_TEXTURE_KEY)
          && this.textures.exists(MINE_BOSS_TEXTURE_KEY)
          && this.textures.exists(LANISTA_TEXTURE_KEY)
          && this.textures.exists(MAZE_GUARDIAN_TEXTURE_KEY)
          && this.textures.exists(BUTLER_TEXTURE_KEY)
          && this.textures.exists(ARCHIVIST_TEXTURE_KEY)
          && this.textures.exists(CRYSTAL_BRIDGE_GUARDIAN_TEXTURE_KEY)
          && this.textures.exists(CRYSTAL_CONDUCTOR_TEXTURE_KEY)
           && this.textures.exists(PUZZLE_MASTER_TEXTURE_KEY)
           && this.textures.exists(SWAMP_ALCHEMIST_MAP_TEXTURE_KEY)
          && this.textures.exists(LIGHT_WEAVER_MAP_TEXTURE_KEY)
          && this.textures.exists(VAULT_GUARDIAN_MAP_TEXTURE_KEY)
          && this.textures.exists(TALLVOKTER_FINALE_MAP_TEXTURE_KEY)
          && this.textures.exists(CAMP_RESIDENT_WAGON_TEXTURE_KEY)
          && this.textures.exists(CAMP_SPOKE_TEXTURE_KEY)
          && this.textures.exists(CAMP_RIM_TEXTURE_KEY)
          && this.textures.exists(CAMP_HUB_TEXTURE_KEY)
          && this.textures.exists(CAMP_PART_MASK_TEXTURE_KEY)
          && this.textures.exists(BOAT_WHEEL_TEXTURE_KEY)
          && this.textures.exists(BOAT_SHIP_RIGHT_TEXTURE_KEY)
          && this.textures.exists(BOAT_SHIP_LEFT_TEXTURE_KEY)
          && this.textures.exists(TALLVOKTER_THIEF_TEXTURE_KEY)
          && this.textures.exists(TALLVOKTER_THIEF_MASK_TEXTURE_KEY)));
  }

  private finalizeLoadedMapAssets(map: GameMapConfig): void {
    this.createNormalizedPlayerTokenTextures();
    if (map.showBossJourney) {
      this.createNormalizedMapBossTextures();
      this.createNormalizedMedalTextures();
    }
    if (map.id === REGNERIKET_MAP_ID) {
      this.createNormalizedMapItemTextures();
      this.createNormalizedQuestIconTextures();
      this.regneriketViews.forEach((view) => {
        view.icon
          .setTexture(getRegneriketTextureKey(view.stop.id))
          .setDisplaySize(198, 198);
      });
      this.mapItemViews.forEach((view) => {
        view.sprite
          .setTexture(getMapItemTextureKey(view.item.id))
          .setDisplaySize(MAP_ITEM_DISPLAY_SIZE, MAP_ITEM_DISPLAY_SIZE);
      });
      this.talltreeLanterns.forEach((lantern, index) => {
        const position = TALLTREE_LANTERN_POSITIONS[index];
        if (!position) {
          return;
        }
        lantern
          .setTexture('talltree-lantern')
          .setDisplaySize(54 * position.scale, 78 * position.scale);
      });
    }
  }

  private createRegnemonsterPrototypeView(): void {
    if (this.regnemonsterPrototypeView || !hasRegnemonsterPrototypeAssets(this)) {
      return;
    }
    this.regnemonsterPrototypeView = new RegnemonsterPrototypeView(this);
    this.regnemonsterPrototypeView.setRoom(this.regnemonsterRoom);
  }

  private applyActiveMap(): void {
    const isRegnemonster = this.activeMap.id === REGNEMONSTER_MAP_ID;
    this.physics.world.setBounds(0, 0, this.activeMap.width, this.activeMap.height);
    this.cameras.main.setBounds(0, 0, this.activeMap.width, this.activeMap.height);
    this.cameras.main.setZoom(this.getMapCameraZoom());
    this.mapImage?.setTexture(this.activeMap.textureKey);
    this.mapImage?.setDisplaySize(this.activeMap.width, this.activeMap.height);
    this.mapImage?.setVisible(!isRegnemonster);
    this.mapImage?.setLighting(this.activeMap.id === TALLVOKTER_MAP_ID && this.tallvokterFxLevel !== 'off');
    this.mapShade?.setPosition(this.activeMap.width / 2, this.activeMap.height / 2);
    this.mapShade?.setSize(this.activeMap.width, this.activeMap.height);
    this.mapShade?.setVisible(!isRegnemonster);
    this.regnemonsterPrototypeView?.setActive(isRegnemonster);
    if (isRegnemonster) {
      this.regnemonsterPrototypeView?.setRoom(this.regnemonsterRoom);
    }
    this.mapEditor?.setAvailable(this.isActiveMapEditable());
  }

  private syncTallvokterEffects(): void {
    const enabled = this.activeMap.id === TALLVOKTER_MAP_ID;
    if (enabled && !this.tallvokterEffects) {
      this.tallvokterEffects = new TallvokterEffects(this);
    }
    this.tallvokterEffects?.setLevel(this.tallvokterFxLevel);
    this.tallvokterEffects?.setActive(enabled);
  }

  private setTallvokterFxLevel(level: TallvokterFxLevel): void {
    this.tallvokterFxLevel = level;
    saveTallvokterFxLevel(level);
    this.tallvokterEffects?.setLevel(level);
    this.mapImage?.setLighting(this.activeMap.id === TALLVOKTER_MAP_ID && level !== 'off');
  }

  private getMapCameraZoom(): number {
    const mapZoom = this.activeMap.id === REGNEMONSTER_MAP_ID
      ? 0.92
      : this.activeMap.showBossJourney
        ? 0.82
        : 0.68;
    const mobileZoomFactor = window.matchMedia(MOBILE_CAMERA_MEDIA_QUERY).matches
      ? MOBILE_CAMERA_ZOOM_FACTOR
      : 1;
    return mapZoom * mobileZoomFactor * this.renderScale;
  }

  private ensureFishingStationViews(): void {
    if (
      this.fishingSpotView
      || !this.textures.exists(FISHERMAN_TEXTURE_KEY)
      || !this.textures.exists(FISHING_ROD_TEXTURE_KEY)
    ) {
      this.refreshFishingStationViews();
      return;
    }

    const fishingPosition = FISHING_CONFIG.fishingSpotPosition;
    const fishingRing = this.add.circle(fishingPosition.x, fishingPosition.y, 50, 0x45d9ec, 0.13)
      .setStrokeStyle(4, 0x9af5ff, 0.92)
      .setDepth(13);
    const fishingIcon = this.add.image(
      fishingPosition.x,
      fishingPosition.y - 4,
      FISHING_ROD_TEXTURE_KEY
    )
      .setDisplaySize(104, 104)
      .setDepth(15);
    const fishingLabel = this.add.text(fishingPosition.x, fishingPosition.y + 64, 'Fiskested', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '23px',
      fontStyle: '700',
      color: '#e6fcff',
      stroke: '#102a3d',
      strokeThickness: 7
    }).setOrigin(0.5).setDepth(15);
    this.fishingSpotView = {
      ring: fishingRing,
      icon: fishingIcon,
      label: fishingLabel
    };

    const fishermanPosition = FISHING_CONFIG.fishermanPosition;
    const fishermanRing = this.add.circle(fishermanPosition.x, fishermanPosition.y + 10, 45, 0xffd46a, 0)
      .setStrokeStyle(4, 0xffeeb0, 0)
      .setDepth(13);
    const fishermanSprite = this.add.image(fishermanPosition.x, fishermanPosition.y, FISHERMAN_TEXTURE_KEY)
      .setDisplaySize(172, 172)
      .setOrigin(0.5, 0.84)
      .setDepth(15);
    const fishermanLabel = this.add.text(fishermanPosition.x, fishermanPosition.y + 66, 'Fiskeren', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '23px',
      fontStyle: '700',
      color: '#fff3c7',
      stroke: '#102a3d',
      strokeThickness: 7
    }).setOrigin(0.5).setDepth(16);
    this.fishermanView = {
      ring: fishermanRing,
      sprite: fishermanSprite,
      label: fishermanLabel
    };

    this.startFishingStationTweens();
    this.refreshFishingStationViews();
  }

  private applyFishingStationPositions(): void {
    const fishingPosition = FISHING_CONFIG.fishingSpotPosition;
    this.fishingSpotView?.ring.setPosition(fishingPosition.x, fishingPosition.y);
    this.fishingSpotView?.icon.setPosition(fishingPosition.x, fishingPosition.y - 4);
    this.fishingSpotView?.label.setPosition(fishingPosition.x, fishingPosition.y + 64);

    const fishermanPosition = FISHING_CONFIG.fishermanPosition;
    this.fishermanView?.ring.setPosition(fishermanPosition.x, fishermanPosition.y + 10);
    this.fishermanView?.sprite.setPosition(fishermanPosition.x, fishermanPosition.y);
    this.fishermanView?.label.setPosition(fishermanPosition.x, fishermanPosition.y + 66);
    this.nearbyTallvokterStatus = '';
  }

  private startFishingStationTweens(): void {
    this.stopFishingStationTweens();
    if (!this.fishingSpotView || !this.fishermanView) {
      return;
    }
    this.applyFishingStationPositions();
    this.fishingSpotView.ring.setAlpha(1);
    this.fishermanView.ring.setAlpha(0);
    this.fishingSpotRingTween = this.tweens.add({
      targets: this.fishingSpotView.ring,
      alpha: 0.58,
      duration: 950,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    this.fishingSpotIconTween = this.tweens.add({
      targets: this.fishingSpotView.icon,
      y: FISHING_CONFIG.fishingSpotPosition.y - 9,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private stopFishingStationTweens(): void {
    this.fishingSpotRingTween?.destroy();
    this.fishingSpotIconTween?.destroy();
    this.fishingSpotRingTween = undefined;
    this.fishingSpotIconTween = undefined;
  }

  private refreshFishingStationViews(): void {
    const visible = this.activeMap.id === TALLVOKTER_MAP_ID;
    const fishingNear = this.nearbyTallvokterActivity === 'fishing-spot';
    const fishermanNear = this.nearbyTallvokterActivity === 'fisherman';

    if (this.fishingSpotView) {
      this.fishingSpotView.ring.setVisible(visible).setScale(fishingNear ? 1.18 : 1);
      this.fishingSpotView.icon
        .setVisible(visible)
        .setDisplaySize(fishingNear ? 112 : 104, fishingNear ? 112 : 104);
      this.fishingSpotView.label.setVisible(visible).setScale(fishingNear ? 1.08 : 1);
    }

    if (this.fishermanView) {
      this.fishermanView.ring.setVisible(visible).setScale(fishermanNear ? 1.18 : 1);
      this.fishermanView.sprite
        .setVisible(visible)
        .setDisplaySize(fishermanNear ? 180 : 172, fishermanNear ? 180 : 172);
      this.fishermanView.label.setVisible(visible).setScale(fishermanNear ? 1.08 : 1);
    }
  }

  private ensureMineBossView(): void {
    if (this.mineBossView || !this.textures.exists(MINE_BOSS_TEXTURE_KEY)) {
      this.refreshMineBossView();
      return;
    }

    const position = MINING_CONFIG.mineBossPosition;
    const ring = this.add.circle(position.x, position.y + 8, 42, 0xffd46a, 0)
      .setStrokeStyle(4, 0xffeeb0, 0)
      .setAlpha(0)
      .setDepth(13);
    const sprite = this.add.image(position.x, position.y, MINE_BOSS_TEXTURE_KEY)
      .setDisplaySize(162, 162)
      .setOrigin(0.5, 0.84)
      .setDepth(15);
    const label = this.add.text(position.x, position.y + 64, 'Gruvesjefen', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '23px',
      fontStyle: '700',
      color: '#fff0b8',
      stroke: '#102a3d',
      strokeThickness: 7
    }).setOrigin(0.5).setDepth(16);

    this.mineBossView = { ring, sprite, label };
    this.refreshMineBossView();
  }

  private applyMineBossPosition(): void {
    const position = MINING_CONFIG.mineBossPosition;
    this.mineBossView?.ring.setPosition(position.x, position.y + 8);
    this.mineBossView?.sprite.setPosition(position.x, position.y);
    this.mineBossView?.label.setPosition(position.x, position.y + 64);
    this.nearbyTallvokterStatus = '';
  }

  private refreshMineBossView(): void {
    const visible = this.activeMap.id === TALLVOKTER_MAP_ID;
    const near = this.nearbyTallvokterActivity === 'mine-boss';
    if (!this.mineBossView) {
      return;
    }

    // Treffområdet skal virke som før, men selve ringen skal være helt usynlig.
    this.mineBossView.ring.setVisible(visible).setAlpha(0).setScale(near ? 1.18 : 1);
    this.mineBossView.sprite
      .setVisible(visible)
      .setDisplaySize(near ? 170 : 162, near ? 170 : 162);
    this.mineBossView.label.setVisible(visible).setScale(near ? 1.08 : 1);
  }

  private ensureLanistaView(): void {
    if (this.lanistaView || !this.textures.exists(LANISTA_TEXTURE_KEY)) {
      this.refreshLanistaView();
      return;
    }

    const position = GLADIATOR_ARENA_CONFIG.lanistaPosition;
    const ring = this.add.circle(position.x, position.y + 8, 42, 0xffd46a, 0)
      .setStrokeStyle(4, 0xffeeb0, 0)
      .setAlpha(0)
      .setDepth(13);
    const sprite = this.add.image(position.x, position.y, LANISTA_TEXTURE_KEY)
      .setDisplaySize(142, 142)
      .setOrigin(0.5, 0.86)
      .setDepth(15);
    const label = this.add.text(position.x, position.y + 48, 'Lanistaen', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '23px',
      fontStyle: '700',
      color: '#fff0b8',
      stroke: '#102a3d',
      strokeThickness: 7
    }).setOrigin(0.5).setDepth(16);

    this.lanistaView = { ring, sprite, label };
    this.refreshLanistaView();
  }

  private applyLanistaPosition(): void {
    const position = GLADIATOR_ARENA_CONFIG.lanistaPosition;
    this.lanistaView?.ring.setPosition(position.x, position.y + 8);
    this.lanistaView?.sprite.setPosition(position.x, position.y);
    this.lanistaView?.label.setPosition(position.x, position.y + 48);
    this.nearbyTallvokterStatus = '';
  }

  private refreshLanistaView(): void {
    const visible = this.activeMap.id === TALLVOKTER_MAP_ID;
    const near = this.nearbyTallvokterActivity === 'lanista';
    if (!this.lanistaView) {
      return;
    }

    this.lanistaView.ring.setVisible(visible).setAlpha(0).setScale(near ? 1.18 : 1);
    this.lanistaView.sprite
      .setVisible(visible)
      .setDisplaySize(near ? 150 : 142, near ? 150 : 142);
    this.lanistaView.label.setVisible(visible).setScale(near ? 1.08 : 1);
  }

  private ensureMazeGuardianView(): void {
    if (this.mazeGuardianView || !this.textures.exists(MAZE_GUARDIAN_TEXTURE_KEY)) { this.refreshMazeGuardianView(); return; }
    const position = MAZE_QUEST_CONFIG.guardianPosition;
    const ring = this.add.circle(position.x, position.y + 8, 42, 0x5cebd5, 0).setAlpha(0).setDepth(13);
    const sprite = this.add.image(position.x, position.y, MAZE_GUARDIAN_TEXTURE_KEY)
      // Originalillustrasjonen er i stÃ¥ende 2:3-format. Bevar sideforholdet pÃ¥ kartet.
      .setDisplaySize(112, 168)
      .setOrigin(0.5, 0.86)
      .setDepth(15);
    const label = this.add.text(position.x, position.y + 64, 'Labyrintens vokter', { fontFamily: 'Arial, sans-serif', fontSize: '22px', fontStyle: '700', color: '#bfffee', stroke: '#102a3d', strokeThickness: 7 }).setOrigin(0.5).setDepth(16);
    this.mazeGuardianView = { ring, sprite, label };
    this.refreshMazeGuardianView();
  }

  private applyMazeGuardianPosition(): void {
    const position = MAZE_QUEST_CONFIG.guardianPosition;
    this.mazeGuardianView?.ring.setPosition(position.x, position.y + 8);
    this.mazeGuardianView?.sprite.setPosition(position.x, position.y);
    this.mazeGuardianView?.label.setPosition(position.x, position.y + 64);
    this.nearbyTallvokterStatus = '';
  }

  private refreshMazeGuardianView(): void {
    const visible = this.activeMap.id === TALLVOKTER_MAP_ID;
    const near = this.nearbyTallvokterActivity === 'maze-guardian';
    if (!this.mazeGuardianView) return;
    this.mazeGuardianView.ring.setVisible(visible).setAlpha(0).setScale(near ? 1.18 : 1);
    this.mazeGuardianView.sprite
      .setVisible(visible)
      .setDisplaySize(near ? 118 : 112, near ? 177 : 168);
    this.mazeGuardianView.label.setVisible(visible).setScale(near ? 1.08 : 1);
  }

  private ensureButlerView(): void {
    if (this.butlerView || !this.textures.exists(BUTLER_TEXTURE_KEY)) {
      this.refreshButlerView();
      return;
    }

    const position = MANOR_CONFIG.butlerPosition;
    const ring = this.add.circle(position.x, position.y + 8, 42, 0xffd98a, 0)
      .setAlpha(0)
      .setDepth(13);
    const sprite = this.add.image(position.x, position.y, BUTLER_TEXTURE_KEY)
      .setDisplaySize(112, 168)
      .setOrigin(0.5, 0.86)
      .setDepth(15);
    const label = this.add.text(position.x, position.y + 64, 'Butleren', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '22px',
      fontStyle: '700',
      color: '#fff1c8',
      stroke: '#102a3d',
      strokeThickness: 7
    }).setOrigin(0.5).setDepth(16);
    this.butlerView = { ring, sprite, label };
    this.refreshButlerView();
  }

  private applyButlerPosition(): void {
    const position = MANOR_CONFIG.butlerPosition;
    this.butlerView?.ring.setPosition(position.x, position.y + 8);
    this.butlerView?.sprite.setPosition(position.x, position.y);
    this.butlerView?.label.setPosition(position.x, position.y + 64);
    this.nearbyTallvokterStatus = '';
  }

  private refreshButlerView(): void {
    const visible = this.activeMap.id === TALLVOKTER_MAP_ID;
    const near = this.nearbyTallvokterActivity === 'butler';
    if (!this.butlerView) {
      return;
    }

    this.butlerView.ring.setVisible(visible).setAlpha(0).setScale(near ? 1.18 : 1);
    this.butlerView.sprite
      .setVisible(visible)
      .setDisplaySize(near ? 118 : 112, near ? 177 : 168);
    this.butlerView.label.setVisible(visible).setScale(near ? 1.08 : 1);
  }

  private ensureArchivistView(): void {
    if (this.archivistView || !this.textures.exists(ARCHIVIST_TEXTURE_KEY)) {
      this.refreshArchivistView();
      return;
    }

    const position = ARCHIVE_CONFIG.archivistPosition;
    const ring = this.add.circle(position.x, position.y + 8, 47, 0x6be8ff, 0)
      .setAlpha(0)
      .setDepth(13);
    const sprite = this.add.image(position.x, position.y, ARCHIVIST_TEXTURE_KEY)
      .setDisplaySize(118, 177)
      .setOrigin(0.5, 0.86)
      .setDepth(15);
    const label = this.add.text(position.x, position.y + 68, 'Riksarkivaren', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '22px',
      fontStyle: '700',
      color: '#e4fbff',
      stroke: '#102a3d',
      strokeThickness: 7
    }).setOrigin(0.5).setDepth(16);
    this.archivistView = { ring, sprite, label };
    this.refreshArchivistView();
  }

  private applyArchivistPosition(): void {
    const position = ARCHIVE_CONFIG.archivistPosition;
    this.archivistView?.ring.setPosition(position.x, position.y + 8);
    this.archivistView?.sprite.setPosition(position.x, position.y);
    this.archivistView?.label.setPosition(position.x, position.y + 68);
    this.nearbyTallvokterStatus = '';
  }

  private refreshArchivistView(): void {
    const visible = this.activeMap.id === TALLVOKTER_MAP_ID;
    const near = this.nearbyTallvokterActivity === 'archivist';
    if (!this.archivistView) return;
    this.archivistView.ring.setVisible(visible).setAlpha(0).setScale(near ? 1.18 : 1);
    this.archivistView.sprite
      .setVisible(visible)
      .setDisplaySize(near ? 124 : 118, near ? 186 : 177);
    this.archivistView.label.setVisible(visible).setScale(near ? 1.08 : 1);
  }

  private ensureCrystalBridgeGuardianView(): void {
    if (
      this.crystalBridgeGuardianView
      || !this.textures.exists(CRYSTAL_BRIDGE_GUARDIAN_TEXTURE_KEY)
    ) {
      this.refreshCrystalBridgeGuardianView();
      return;
    }

    const position = CRYSTAL_BRIDGE_CONFIG.guardianPosition;
    const ring = this.add.circle(position.x, position.y + 8, 50, 0x69efff, 0)
      .setAlpha(0)
      .setDepth(13);
    const sprite = this.add.image(
      position.x,
      position.y,
      CRYSTAL_BRIDGE_GUARDIAN_TEXTURE_KEY
    )
      .setDisplaySize(116, 174)
      .setOrigin(0.5, 0.86)
      .setDepth(15);
    const label = this.add.text(position.x, position.y + 67, 'Krystallbrovokteren', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '21px',
      fontStyle: '700',
      color: '#e4fbff',
      stroke: '#102a3d',
      strokeThickness: 7
    }).setOrigin(0.5).setDepth(16);
    this.crystalBridgeGuardianView = { ring, sprite, label };
    this.refreshCrystalBridgeGuardianView();
  }

  private applyCrystalBridgeGuardianPosition(): void {
    const position = CRYSTAL_BRIDGE_CONFIG.guardianPosition;
    this.crystalBridgeGuardianView?.ring.setPosition(position.x, position.y + 8);
    this.crystalBridgeGuardianView?.sprite.setPosition(position.x, position.y);
    this.crystalBridgeGuardianView?.label.setPosition(position.x, position.y + 67);
    this.nearbyTallvokterStatus = '';
  }

  private refreshCrystalBridgeGuardianView(): void {
    const visible = this.activeMap.id === TALLVOKTER_MAP_ID;
    const near = this.nearbyTallvokterActivity === 'crystal-bridge-guardian';
    if (!this.crystalBridgeGuardianView) return;
    this.crystalBridgeGuardianView.ring
      .setVisible(visible)
      .setAlpha(0)
      .setScale(near ? 1.18 : 1);
    this.crystalBridgeGuardianView.sprite
      .setVisible(visible)
      .setDisplaySize(near ? 122 : 116, near ? 183 : 174);
    this.crystalBridgeGuardianView.label.setVisible(visible).setScale(near ? 1.06 : 1);
  }

  private ensureCrystalConductorView(): void {
    if (this.crystalConductorView || !this.textures.exists(CRYSTAL_CONDUCTOR_TEXTURE_KEY)) {
      this.refreshCrystalConductorView();
      return;
    }

    const position = CRYSTAL_CART_CONFIG.conductorPosition;
    const ring = this.add.circle(position.x, position.y + 8, 46, 0x5cecff, 0)
      .setAlpha(0)
      .setDepth(13);
    const sprite = this.add.image(position.x, position.y, CRYSTAL_CONDUCTOR_TEXTURE_KEY)
      .setDisplaySize(96, 178)
      .setOrigin(0.5, 0.88)
      .setDepth(15);
    const label = this.add.text(position.x, position.y + 67, 'Krystallføreren', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '22px',
      fontStyle: '700',
      color: '#bff7ff',
      stroke: '#102a3d',
      strokeThickness: 7
    }).setOrigin(0.5).setDepth(16);

    this.crystalConductorView = { ring, sprite, label };
    this.refreshCrystalConductorView();
  }

  private applyCrystalConductorPosition(): void {
    const position = CRYSTAL_CART_CONFIG.conductorPosition;
    this.crystalConductorView?.ring.setPosition(position.x, position.y + 8);
    this.crystalConductorView?.sprite.setPosition(position.x, position.y);
    this.crystalConductorView?.label.setPosition(position.x, position.y + 67);
    this.nearbyTallvokterStatus = '';
  }

  private refreshCrystalConductorView(): void {
    const visible = this.activeMap.id === TALLVOKTER_MAP_ID;
    const near = this.nearbyTallvokterActivity === 'crystal-conductor';
    if (!this.crystalConductorView) {
      return;
    }

    this.crystalConductorView.ring.setVisible(visible).setAlpha(0).setScale(near ? 1.18 : 1);
    this.crystalConductorView.sprite
      .setVisible(visible)
      .setDisplaySize(near ? 102 : 96, near ? 189 : 178);
    this.crystalConductorView.label.setVisible(visible).setScale(near ? 1.08 : 1);
  }

  private ensurePuzzleMasterView(): void {
    if (this.puzzleMasterView || !this.textures.exists(PUZZLE_MASTER_TEXTURE_KEY)) {
      this.refreshPuzzleMasterView();
      return;
    }

    const position = PUZZLE_QUEST_CONFIG.masterPosition;
    const ring = this.add.circle(position.x, position.y + 8, 44, 0xb788ff, 0)
      .setAlpha(0)
      .setDepth(13);
    const sprite = this.add.image(position.x, position.y, PUZZLE_MASTER_TEXTURE_KEY)
      .setDisplaySize(116, 178)
      .setOrigin(0.5, 0.88)
      .setDepth(15);
    const label = this.add.text(position.x, position.y + 67, 'Puslespill-mesteren', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '22px',
      fontStyle: '700',
      color: '#e9d7ff',
      stroke: '#102a3d',
      strokeThickness: 7
    }).setOrigin(0.5).setDepth(16);

    this.puzzleMasterView = { ring, sprite, label };
    this.refreshPuzzleMasterView();
  }

  private applyPuzzleMasterPosition(): void {
    const position = PUZZLE_QUEST_CONFIG.masterPosition;
    this.puzzleMasterView?.ring.setPosition(position.x, position.y + 8);
    this.puzzleMasterView?.sprite.setPosition(position.x, position.y);
    this.puzzleMasterView?.label.setPosition(position.x, position.y + 67);
    this.nearbyTallvokterStatus = '';
  }

  private refreshPuzzleMasterView(): void {
    const visible = this.activeMap.id === TALLVOKTER_MAP_ID;
    const near = this.nearbyTallvokterActivity === 'puzzle-master';
    if (!this.puzzleMasterView) {
      return;
    }

    this.puzzleMasterView.ring.setVisible(visible).setAlpha(0).setScale(near ? 1.18 : 1);
    this.puzzleMasterView.sprite
      .setVisible(visible)
      .setDisplaySize(near ? 122 : 116, near ? 187 : 178);
    this.puzzleMasterView.label.setVisible(visible).setScale(near ? 1.08 : 1);
  }

  private ensureSwampAlchemistView(): void {
    if (this.swampAlchemistView || !this.textures.exists(SWAMP_ALCHEMIST_MAP_TEXTURE_KEY)) {
      this.refreshSwampAlchemistView();
      return;
    }

    const position = SWAMP_ALCHEMY_CONFIG.alchemistPosition;
    const ring = this.add.circle(
      position.x,
      position.y,
      SWAMP_ALCHEMY_CONFIG.interactionDistance,
      0x69f0b5,
      0
    ).setAlpha(0).setDepth(13);
    const sprite = this.add.image(position.x, position.y, SWAMP_ALCHEMIST_MAP_TEXTURE_KEY)
      .setDisplaySize(190, 190)
      .setOrigin(0.5)
      .setDepth(15);
    const label = this.add.text(position.x, position.y + 105, 'Sumpalkymisten', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '22px',
      fontStyle: '700',
      color: '#c9ffe5',
      stroke: '#102a3d',
      strokeThickness: 7
    }).setOrigin(0.5).setDepth(16);

    this.swampAlchemistView = { ring, sprite, label };
    this.refreshSwampAlchemistView();
  }

  private applySwampAlchemistPosition(): void {
    const position = SWAMP_ALCHEMY_CONFIG.alchemistPosition;
    this.swampAlchemistView?.ring.setPosition(position.x, position.y);
    this.swampAlchemistView?.sprite.setPosition(position.x, position.y);
    this.swampAlchemistView?.label.setPosition(position.x, position.y + 105);
    this.nearbyTallvokterStatus = '';
  }

  private refreshSwampAlchemistView(): void {
    const visible = this.activeMap.id === TALLVOKTER_MAP_ID;
    const near = this.nearbyTallvokterActivity === 'swamp-alchemist';
    if (!this.swampAlchemistView) return;
    this.swampAlchemistView.ring.setVisible(visible).setAlpha(0).setScale(near ? 1.08 : 1);
    this.swampAlchemistView.sprite
      .setVisible(visible)
      .setDisplaySize(near ? 201 : 190, near ? 201 : 190);
    this.swampAlchemistView.label.setVisible(visible).setScale(near ? 1.08 : 1);
  }

  private ensureLightWeaverView(): void {
    if (this.lightWeaverView || !this.textures.exists(LIGHT_WEAVER_MAP_TEXTURE_KEY)) {
      this.refreshLightWeaverView();
      return;
    }

    const position = LIGHT_FOREST_CONFIG.guardianPosition;
    const ring = this.add.circle(
      position.x,
      position.y,
      LIGHT_FOREST_CONFIG.interactionDistance,
      0x66f4ca,
      0
    ).setAlpha(0).setDepth(13);
    const sprite = this.add.image(position.x, position.y, LIGHT_WEAVER_MAP_TEXTURE_KEY)
      .setDisplaySize(122, 183)
      .setOrigin(0.5, 0.62)
      .setDepth(15);
    const label = this.add.text(position.x, position.y + 111, 'Lysveveren', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '22px',
      fontStyle: '700',
      color: '#caffea',
      stroke: '#102a3d',
      strokeThickness: 7
    }).setOrigin(0.5).setDepth(16);

    this.lightWeaverView = { ring, sprite, label };
    this.refreshLightWeaverView();
  }

  private applyLightWeaverPosition(): void {
    const position = LIGHT_FOREST_CONFIG.guardianPosition;
    this.lightWeaverView?.ring.setPosition(position.x, position.y);
    this.lightWeaverView?.sprite.setPosition(position.x, position.y);
    this.lightWeaverView?.label.setPosition(position.x, position.y + 111);
    this.nearbyTallvokterStatus = '';
  }

  private refreshLightWeaverView(): void {
    const visible = this.activeMap.id === TALLVOKTER_MAP_ID;
    const near = this.nearbyTallvokterActivity === 'light-weaver';
    if (!this.lightWeaverView) return;
    this.lightWeaverView.ring.setVisible(visible).setAlpha(0).setScale(near ? 1.08 : 1);
    this.lightWeaverView.sprite
      .setVisible(visible)
      .setDisplaySize(near ? 130 : 122, near ? 195 : 183);
    this.lightWeaverView.label.setVisible(visible).setScale(near ? 1.08 : 1);
  }

  private ensureVaultGuardianView(): void {
    if (this.vaultGuardianView || !this.textures.exists(VAULT_GUARDIAN_MAP_TEXTURE_KEY)) {
      this.refreshVaultGuardianView();
      return;
    }

    const position = COUNTERWEIGHT_VAULT_CONFIG.guardianPosition;
    const ring = this.add.circle(
      position.x,
      position.y,
      COUNTERWEIGHT_VAULT_CONFIG.interactionDistance,
      0x62d7ff,
      0
    ).setAlpha(0).setDepth(13);
    const sprite = this.add.image(position.x, position.y, VAULT_GUARDIAN_MAP_TEXTURE_KEY)
      .setDisplaySize(142, 213)
      .setOrigin(0.5, 0.62)
      .setDepth(15);
    const label = this.add.text(position.x, position.y + 126, 'Hvelvvokteren', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '22px',
      fontStyle: '700',
      color: '#d6f5ff',
      stroke: '#102a3d',
      strokeThickness: 7
    }).setOrigin(0.5).setDepth(16);

    this.vaultGuardianView = { ring, sprite, label };
    this.refreshVaultGuardianView();
  }

  private applyVaultGuardianPosition(): void {
    const position = COUNTERWEIGHT_VAULT_CONFIG.guardianPosition;
    this.vaultGuardianView?.ring.setPosition(position.x, position.y);
    this.vaultGuardianView?.sprite.setPosition(position.x, position.y);
    this.vaultGuardianView?.label.setPosition(position.x, position.y + 126);
    this.nearbyTallvokterStatus = '';
  }

  private refreshVaultGuardianView(): void {
    const visible = this.activeMap.id === TALLVOKTER_MAP_ID;
    const near = this.nearbyTallvokterActivity === 'vault-guardian';
    if (!this.vaultGuardianView) return;
    this.vaultGuardianView.ring.setVisible(visible).setAlpha(0).setScale(near ? 1.08 : 1);
    this.vaultGuardianView.sprite
      .setVisible(visible)
      .setDisplaySize(near ? 151 : 142, near ? 226 : 213);
    this.vaultGuardianView.label.setVisible(visible).setScale(near ? 1.08 : 1);
  }

  private ensureTallvokterFinaleView(): void {
    if (this.tallvokterFinaleView || !this.textures.exists(TALLVOKTER_FINALE_MAP_TEXTURE_KEY)) {
      this.refreshTallvokterFinaleView();
      return;
    }

    const position = TALLVOKTER_FINALE_CONFIG.position;
    const ring = this.add.circle(
      position.x,
      position.y,
      TALLVOKTER_FINALE_CONFIG.interactionDistance,
      0x72e5ff,
      0
    ).setAlpha(0).setDepth(13);
    const sprite = this.add.image(position.x, position.y, TALLVOKTER_FINALE_MAP_TEXTURE_KEY)
      .setDisplaySize(156, 234)
      .setOrigin(0.5, 0.72)
      .setDepth(17);
    const label = this.add.text(position.x, position.y + 82, 'Tallvokteren', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '23px',
      fontStyle: '700',
      color: '#fff1b1',
      stroke: '#09243c',
      strokeThickness: 7
    }).setOrigin(0.5).setDepth(18);

    this.tallvokterFinaleView = { ring, sprite, label };
    this.refreshTallvokterFinaleView();
  }

  private applyTallvokterFinalePosition(): void {
    const position = TALLVOKTER_FINALE_CONFIG.position;
    this.tallvokterFinaleView?.ring.setPosition(position.x, position.y);
    this.tallvokterFinaleView?.sprite.setPosition(position.x, position.y);
    this.tallvokterFinaleView?.label.setPosition(position.x, position.y + 82);
    this.nearbyTallvokterStatus = '';
  }

  private refreshTallvokterFinaleView(): void {
    if (!this.tallvokterFinaleView) return;
    const finale = this.progress.getTallvokterFinaleProgress();
    const visible = this.activeMap.id === TALLVOKTER_MAP_ID && finale.unlocked && finale.eventSeen;
    const near = this.nearbyTallvokterActivity === 'tallvokter-finale';
    this.tallvokterFinaleView.ring.setVisible(visible).setAlpha(0).setScale(near ? 1.08 : 1);
    this.tallvokterFinaleView.sprite
      .setVisible(visible)
      .setDisplaySize(near ? 168 : 156, near ? 252 : 234);
    this.tallvokterFinaleView.label.setVisible(visible).setScale(near ? 1.08 : 1);
  }

  private tryStartTallvokterFinaleArrival(): void {
    if (
      !this.tallvokterFinaleArrivalPending
      || this.tallvokterFinaleArrivalPlaying
      || this.activeMap.id !== TALLVOKTER_MAP_ID
      || !this.player
      || this.hud.isWorldBlocked()
    ) return;

    const finale = this.progress.getTallvokterFinaleProgress();
    if (!finale.unlocked || finale.eventSeen) {
      this.tallvokterFinaleArrivalPending = false;
      return;
    }
    this.playTallvokterFinaleArrival();
  }

  private playTallvokterFinaleArrival(): void {
    if (!this.player || !this.progress.markTallvokterFinaleEventSeen()) return;
    const position = TALLVOKTER_FINALE_CONFIG.position;
    const view = this.tallvokterFinaleView;
    this.tallvokterFinaleArrivalPending = false;
    this.tallvokterFinaleArrivalPlaying = true;
    this.worldInputEnabled = false;
    this.clearPointerMoveTarget();
    this.hud.setNearbyPortal(undefined);

    const targetSpriteScale = view
      ? { x: view.sprite.scaleX, y: view.sprite.scaleY }
      : undefined;
    if (view && targetSpriteScale) {
      view.sprite
        .setVisible(true)
        .setAlpha(0)
        .setScale(targetSpriteScale.x * 0.72, targetSpriteScale.y * 0.72);
      view.label.setVisible(true).setAlpha(0);
    }

    this.cameras.main.stopFollow();
    this.cameras.main.pan(position.x, position.y, 820, 'Sine.easeInOut');

    const pulse = (index: number): void => {
      if (!this.sys.isActive()) return;
      const ring = this.add.circle(position.x, position.y + 6, 72, 0x02040d, 0.62)
        .setStrokeStyle(12, index === 3 ? 0xd0a247 : 0x1b2b53, 1)
        .setDepth(32)
        .setScale(0.14);
      this.cameras.main.shake(150, index === 3 ? 0.0028 : 0.0019, true);
      this.tweens.add({
        targets: ring,
        scale: 5.35,
        alpha: 0,
        duration: 900,
        ease: 'Cubic.easeOut',
        onComplete: () => ring.destroy()
      });
      if (index < 3) {
        this.time.delayedCall(1000, () => pulse(index + 1));
        return;
      }

      if (view && targetSpriteScale) {
        this.tweens.add({
          targets: view.sprite,
          alpha: 1,
          scaleX: targetSpriteScale.x,
          scaleY: targetSpriteScale.y,
          duration: 620,
          ease: 'Back.easeOut'
        });
        this.tweens.add({
          targets: view.label,
          alpha: 1,
          duration: 420,
          delay: 220
        });
      }
      this.time.delayedCall(720, () => {
        if (!this.player) return;
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        this.worldInputEnabled = true;
        this.tallvokterFinaleArrivalPlaying = false;
        this.hud.openMandatoryInfo(
          'Tallvokteren har kommet!',
          'Fire mørke kraftpulser går gjennom verdenen. Ved statuen venter Tallvokteren – han har fulgt reisen din og kaller deg inn til én siste duell.',
          'Finn Tallvokteren',
          () => undefined
        );
      });
    };

    this.time.delayedCall(260, () => pulse(0));
  }

  private ensureCampQuestViews(): void {
    this.ensureCampResidentView();
    this.syncCampPartViews();
    this.refreshCampQuestViews();
  }

  private ensureCampResidentView(): void {
    if (this.campResidentView || !this.textures.exists(CAMP_RESIDENT_WAGON_TEXTURE_KEY)) {
      return;
    }

    const position = CAMP_CONFIG.residentPosition;
    const ring = this.add.circle(position.x, position.y, CAMP_CONFIG.interactionDistance, 0xffd56f, 0)
      .setAlpha(0)
      .setDepth(13);
    const sprite = this.add.image(position.x, position.y, CAMP_RESIDENT_WAGON_TEXTURE_KEY)
      .setDisplaySize(320, 213)
      .setOrigin(0.5, 0.5)
      .setDepth(15);
    const label = this.add.text(position.x, position.y + 125, 'Leirstedet', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '22px',
      fontStyle: '700',
      color: '#fff0b8',
      stroke: '#102a3d',
      strokeThickness: 7
    }).setOrigin(0.5).setDepth(16);
    this.campResidentView = { ring, sprite, label };
  }

  private applyCampResidentPosition(): void {
    const position = CAMP_CONFIG.residentPosition;
    this.campResidentView?.ring.setPosition(position.x, position.y);
    this.campResidentView?.sprite.setPosition(position.x, position.y);
    this.campResidentView?.label.setPosition(position.x, position.y + 125);
    this.nearbyTallvokterStatus = '';
  }

  private syncCampPartViews(): void {
    const quest = this.progress.getTallvokterCampQuest();
    const collected = new Set(quest?.collected ?? []);
    const desired = (quest?.placements ?? [])
      .filter((placement) => !collected.has(placement.id))
      .flatMap((placement): CampPartPlacement[] => {
        const part = getCampPart(placement.id);
        return part ? [{ ...part, x: placement.x, y: placement.y }] : [];
      });
    const desiredIds = new Set(desired.map((part) => part.id));

    for (const view of this.campPartViews) {
      if (desiredIds.has(view.part.id)) {
        continue;
      }
      view.ring.destroy();
      view.sprite.destroy();
      view.label.destroy();
    }
    this.campPartViews = this.campPartViews.filter((view) => desiredIds.has(view.part.id));

    for (const part of desired) {
      const existing = this.campPartViews.find((view) => view.part.id === part.id);
      const textureAction = getTextureSyncAction(
        existing?.sprite.texture.key,
        part.textureKey,
        this.textures.exists(part.textureKey)
      );
      if (textureAction === 'defer') {
        continue;
      }
      if (existing) {
        existing.part = part;
        existing.ring.setPosition(part.x, part.y);
        existing.sprite.setPosition(part.x, part.y);
        if (textureAction === 'replace') {
          existing.sprite.setTexture(part.textureKey);
        }
        existing.label.setPosition(part.x, part.y + 48);
        continue;
      }

      const ring = this.add.circle(part.x, part.y, 48, 0xffd66d, 0.12)
        .setStrokeStyle(3, 0xffe9a2, 0.72)
        .setDepth(14);
      const sprite = this.add.image(part.x, part.y, part.textureKey)
        .setDisplaySize(part.kind === 'spoke' ? 77 : part.kind === 'rim' ? 86 : 82, part.kind === 'spoke' ? 77 : part.kind === 'rim' ? 86 : 82)
        .setDepth(15);
      const label = this.add.text(part.x, part.y + 48, part.displayName, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '19px',
        fontStyle: '700',
        color: '#fff0b8',
        stroke: '#102a3d',
        strokeThickness: 6
      }).setOrigin(0.5).setDepth(16);
      this.campPartViews.push({ part, ring, sprite, label });
    }
  }

  private refreshCampQuestViews(): void {
    const visible = this.activeMap.id === TALLVOKTER_MAP_ID;
    const residentNear = this.nearbyTallvokterActivity === 'camp-resident';
    if (this.campResidentView) {
      this.campResidentView.ring.setVisible(visible).setAlpha(0).setScale(residentNear ? 1.18 : 1);
      this.campResidentView.sprite
        .setVisible(visible)
        .setDisplaySize(residentNear ? 340 : 320, residentNear ? 226 : 213);
      this.campResidentView.label.setVisible(visible).setScale(residentNear ? 1.08 : 1);
    }

    for (const view of this.campPartViews) {
      const near = this.nearbyTallvokterActivity === 'camp-part' && this.nearbyCampPartId === view.part.id;
      const baseSize = view.part.kind === 'spoke' ? 77 : view.part.kind === 'rim' ? 86 : 82;
      view.ring.setVisible(visible).setAlpha(near ? 0.28 : 0.16).setScale(near ? 1.12 : 1);
      view.sprite.setVisible(visible).setDisplaySize(near ? baseSize * 1.12 : baseSize, near ? baseSize * 1.12 : baseSize);
      view.label.setVisible(visible && near);
    }
  }

  private ensureBoatTravelViews(): void {
    if (this.boatTravelViews.length > 0 || !this.textures.exists(BOAT_WHEEL_TEXTURE_KEY)) {
      this.refreshBoatTravelViews();
      return;
    }

    this.boatTravelViews = BOAT_TRAVEL_POINTS.map((point) => {
      const ring = this.add.circle(point.position.x, point.position.y, 52, 0x38c8e8, 0.13)
        .setStrokeStyle(4, 0xffe38a, 0.9)
        .setDepth(13);
      const icon = this.add.image(point.position.x, point.position.y - 4, BOAT_WHEEL_TEXTURE_KEY)
        .setDisplaySize(100, 100)
        .setDepth(15);
      const label = this.add.text(point.position.x, point.position.y + 64, 'Båtrute', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '23px',
        fontStyle: '700',
        color: '#fff2bd',
        stroke: '#102a3d',
        strokeThickness: 7
      }).setOrigin(0.5).setDepth(16);

      this.tweens.add({
        targets: ring,
        alpha: 0.52,
        duration: 1050,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      this.tweens.add({
        targets: icon,
        angle: { from: -3, to: 3 },
        duration: 1450,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      return { point, ring, icon, label };
    });
    this.refreshBoatTravelViews();
  }

  private applyBoatTravelPositions(): void {
    for (const view of this.boatTravelViews) {
      view.ring.setPosition(view.point.position.x, view.point.position.y);
      view.icon.setPosition(view.point.position.x, view.point.position.y - 4);
      view.label.setPosition(view.point.position.x, view.point.position.y + 64);
    }
    this.nearbyTallvokterStatus = '';
  }

  private refreshBoatTravelViews(): void {
    const visible = this.activeMap.id === TALLVOKTER_MAP_ID;
    for (const view of this.boatTravelViews) {
      const near = this.nearbyTallvokterActivity === view.point.activityId;
      view.ring.setVisible(visible).setScale(near ? 1.18 : 1);
      view.icon
        .setVisible(visible)
        .setDisplaySize(near ? 108 : 100, near ? 108 : 100);
      view.label.setVisible(visible).setScale(near ? 1.08 : 1);
    }
  }

  private ensureTallvokterThiefEncounter(): void {
    if (
      this.activeMap.id !== TALLVOKTER_MAP_ID
      || !this.textures.exists(TALLVOKTER_THIEF_TEXTURE_KEY)
      || !this.textures.exists(TALLVOKTER_THIEF_MASK_TEXTURE_KEY)
    ) {
      this.refreshTallvokterThiefView();
      return;
    }

    let encounter = this.progress.getTallvokterThiefEncounter();
    if (!encounter) {
      if (this.tallvokterThiefSpawnCandidates.length === 0) {
        this.tallvokterThiefSpawnCandidates = this.readTallvokterThiefSpawnCandidates();
      }
      const spawn = this.drawTallvokterThiefSpawn();
      if (!spawn) {
        return;
      }
      encounter = this.progress.initializeTallvokterThiefEncounter(spawn.x, spawn.y);
    }

    if (!encounter) {
      return;
    }

    const encounterKey = `${encounter.x}:${encounter.y}:${encounter.resolved ? 'resolved' : 'active'}`;
    if (this.tallvokterThiefEncounterKey !== encounterKey) {
      this.tallvokterThiefEncounterKey = encounterKey;
      this.tallvokterThiefTriggered = false;
      this.tallvokterThiefRevealed = false;
    }

    if (!this.tallvokterThiefView) {
      const ring = this.add.circle(encounter.x, encounter.y, TALLVOKTER_THIEF_INTERACT_DISTANCE, 0xff3155, 0.12)
        .setStrokeStyle(5, 0xffdf72, 0.92)
        .setDepth(13);
      const sprite = this.add.image(encounter.x, encounter.y, TALLVOKTER_THIEF_TEXTURE_KEY)
        .setDisplaySize(168, 132)
        .setOrigin(0.5, 0.5)
        .setDepth(15);
      const label = this.add.text(encounter.x, encounter.y + TALLVOKTER_THIEF_INTERACT_DISTANCE + 18, 'TEST: Regnetyvene', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '21px',
        fontStyle: '700',
        color: '#ffe8a3',
        stroke: '#35101c',
        strokeThickness: 7
      }).setOrigin(0.5).setDepth(16);
      this.tallvokterThiefView = { ring, sprite, label };
    }

    this.tallvokterThiefView.ring.setPosition(encounter.x, encounter.y);
    this.tallvokterThiefView.sprite.setPosition(encounter.x, encounter.y);
    this.tallvokterThiefView.label.setPosition(
      encounter.x,
      encounter.y + TALLVOKTER_THIEF_INTERACT_DISTANCE + 18
    );
    this.refreshTallvokterThiefView();
  }

  private readTallvokterThiefSpawnCandidates(): Array<{ x: number; y: number }> {
    const source = this.textures.get(TALLVOKTER_THIEF_MASK_TEXTURE_KEY).getSourceImage() as HTMLImageElement;
    const width = source.naturalWidth || source.width;
    const height = source.naturalHeight || source.height;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context || width <= 0 || height <= 0) {
      return [];
    }

    context.drawImage(source, 0, 0, width, height);
    const pixels = context.getImageData(0, 0, width, height).data;
    const isCyanSpawnPixel = (pixelIndex: number): boolean => (
      pixels[pixelIndex] <= 24
      && pixels[pixelIndex + 1] >= 240
      && pixels[pixelIndex + 2] >= 240
      && pixels[pixelIndex + 3] >= 200
    );
    const visited = new Uint8Array(width * height);
    const candidates: Array<{ x: number; y: number }> = [];
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const start = y * width + x;
        if (visited[start] || !isCyanSpawnPixel(start * 4)) {
          continue;
        }

        const stack = [start];
        visited[start] = 1;
        let pixelCount = 0;
        let totalX = 0;
        let totalY = 0;
        while (stack.length > 0) {
          const current = stack.pop()!;
          const currentX = current % width;
          const currentY = Math.floor(current / width);
          pixelCount += 1;
          totalX += currentX;
          totalY += currentY;

          for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
            for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
              if (offsetX === 0 && offsetY === 0) {
                continue;
              }
              const neighborX = currentX + offsetX;
              const neighborY = currentY + offsetY;
              if (neighborX < 0 || neighborX >= width || neighborY < 0 || neighborY >= height) {
                continue;
              }
              const neighbor = neighborY * width + neighborX;
              if (visited[neighbor] || !isCyanSpawnPixel(neighbor * 4)) {
                continue;
              }
              visited[neighbor] = 1;
              stack.push(neighbor);
            }
          }
        }

        if (pixelCount > 0) {
          candidates.push({
            x: (totalX / pixelCount) * TALLVOKTER_THIEF_MASK_SCALE + TALLVOKTER_THIEF_MASK_SCALE / 2,
            y: (totalY / pixelCount) * TALLVOKTER_THIEF_MASK_SCALE + TALLVOKTER_THIEF_MASK_SCALE / 2
          });
        }
      }
    }
    return candidates;
  }

  private drawTallvokterThiefSpawn(): { x: number; y: number } | undefined {
    if (this.tallvokterThiefSpawnDeck.length === 0) {
      this.tallvokterThiefSpawnDeck = Phaser.Utils.Array.Shuffle([...this.tallvokterThiefSpawnCandidates]);
    }
    return this.tallvokterThiefSpawnDeck.pop();
  }

  private readCampPartSpawnCandidates(): Array<{ x: number; y: number }> {
    if (!this.textures.exists(CAMP_PART_MASK_TEXTURE_KEY)) {
      return [];
    }

    const source = this.textures.get(CAMP_PART_MASK_TEXTURE_KEY).getSourceImage() as HTMLImageElement;
    const width = source.naturalWidth || source.width;
    const height = source.naturalHeight || source.height;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context || width <= 0 || height <= 0) {
      return [];
    }

    context.drawImage(source, 0, 0, width, height);
    const pixels = context.getImageData(0, 0, width, height).data;
    const isMagentaSpawnPixel = (pixelIndex: number): boolean => (
      pixels[pixelIndex] >= 240
      && pixels[pixelIndex + 1] <= 24
      && pixels[pixelIndex + 2] >= 240
      && pixels[pixelIndex + 3] >= 200
    );
    const visited = new Uint8Array(width * height);
    const candidates: Array<{ x: number; y: number }> = [];
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const start = y * width + x;
        if (visited[start] || !isMagentaSpawnPixel(start * 4)) {
          continue;
        }

        const stack = [start];
        visited[start] = 1;
        let pixelCount = 0;
        let totalX = 0;
        let totalY = 0;
        while (stack.length > 0) {
          const current = stack.pop()!;
          const currentX = current % width;
          const currentY = Math.floor(current / width);
          pixelCount += 1;
          totalX += currentX;
          totalY += currentY;

          for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
            for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
              if (offsetX === 0 && offsetY === 0) {
                continue;
              }
              const neighborX = currentX + offsetX;
              const neighborY = currentY + offsetY;
              if (neighborX < 0 || neighborX >= width || neighborY < 0 || neighborY >= height) {
                continue;
              }
              const neighbor = neighborY * width + neighborX;
              if (visited[neighbor] || !isMagentaSpawnPixel(neighbor * 4)) {
                continue;
              }
              visited[neighbor] = 1;
              stack.push(neighbor);
            }
          }
        }

        if (pixelCount > 0) {
          candidates.push({
            x: (totalX / pixelCount) * CAMP_PART_MASK_SCALE + CAMP_PART_MASK_SCALE / 2,
            y: (totalY / pixelCount) * CAMP_PART_MASK_SCALE + CAMP_PART_MASK_SCALE / 2
          });
        }
      }
    }
    return candidates;
  }

  private createCampPartPlacements(): TallvokterCampPartPlacement[] | undefined {
    if (this.campPartSpawnCandidates.length === 0) {
      this.campPartSpawnCandidates = this.readCampPartSpawnCandidates();
    }
    if (this.campPartSpawnCandidates.length < CAMP_PARTS.length) {
      return undefined;
    }

    const spawnPoints = Phaser.Utils.Array.Shuffle([...this.campPartSpawnCandidates])
      .slice(0, CAMP_PARTS.length);
    return CAMP_PARTS.map((part, index) => ({
      id: part.id,
      x: spawnPoints[index].x,
      y: spawnPoints[index].y
    }));
  }

  private startCampQuest(): void {
    const placements = this.createCampPartPlacements();
    if (!placements || !this.progress.startTallvokterCampQuest(placements)) {
      this.hud.showToast('Leirstedet kunne ikke plassere alle hjuldelene.');
      return;
    }

    this.nearbyTallvokterStatus = '';
    this.hud.showToast('Sju hjuldeler er nå spredt rundt i Tallvokterens verden.');
    this.ensureCampQuestViews();
    this.updateNearbyLocation();
  }

  private refreshTallvokterThiefView(): void {
    if (!this.tallvokterThiefView) {
      return;
    }

    const encounter = this.progress.getTallvokterThiefEncounter();
    const active = this.activeMap.id === TALLVOKTER_MAP_ID && Boolean(encounter && !encounter.resolved);
    const testVisible = this.isLocalTallvokterThiefTest();
    this.tallvokterThiefView.sprite.setVisible(active && (testVisible || this.tallvokterThiefRevealed));
    this.tallvokterThiefView.ring.setVisible(active && testVisible);
    this.tallvokterThiefView.label.setVisible(active && testVisible);
  }

  private isLocalTallvokterThiefTest(): boolean {
    return import.meta.env.DEV && new Set(['localhost', '127.0.0.1', '::1']).has(window.location.hostname);
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

  private elevateTallvokterLocationViews(): void {
    const locationViews = [
      this.fishermanView,
      this.mineBossView,
      this.lanistaView,
      this.mazeGuardianView,
      this.butlerView,
      this.archivistView,
      this.crystalBridgeGuardianView,
      this.crystalConductorView,
      this.puzzleMasterView,
      this.swampAlchemistView,
      this.lightWeaverView,
      this.vaultGuardianView,
      this.tallvokterFinaleView,
      this.campResidentView
    ];
    locationViews.forEach((view) => {
      if (!view) {
        return;
      }
      view.sprite.setDepth(21);
      view.label.setDepth(22);
      this.children.bringToTop(view.sprite);
      this.children.bringToTop(view.label);
    });
    if (this.fishingSpotView) {
      this.fishingSpotView.icon.setDepth(21);
      this.fishingSpotView.label.setDepth(22);
      this.children.bringToTop(this.fishingSpotView.icon);
      this.children.bringToTop(this.fishingSpotView.label);
    }
    this.boatTravelViews.forEach((view) => {
      view.icon.setDepth(21);
      view.label.setDepth(22);
      this.children.bringToTop(view.icon);
      this.children.bringToTop(view.label);
    });
    if (this.tallvokterThiefView) {
      this.tallvokterThiefView.sprite.setDepth(21);
      this.tallvokterThiefView.label.setDepth(22);
      this.children.bringToTop(this.tallvokterThiefView.sprite);
      this.children.bringToTop(this.tallvokterThiefView.label);
    }
    if (this.player) {
      this.player.setVisible(true).setDepth(40);
      this.children.bringToTop(this.player);
    }
  }

  private createNormalizedPlayerTokenTextures(): void {
    const token = getTokenById(this.progress.getSettings().tokenId);
    this.createNormalizedWorldMarkerTexture(
      getPlayerTokenSourceTextureKey(token.id),
      getPlayerTokenTextureKey(token.id)
    );
  }

  private createNormalizedMedalTextures(): void {
    const medalId = this.progress.getActiveMedalId();
    this.createNormalizedWorldMarkerTexture(
      getMedalSourceTextureKey(medalId),
      getMedalTextureKey(medalId)
    );
  }

  private createNormalizedWorldMarkerTexture(sourceKey: string, targetKey: string): void {
    if (!this.textures.exists(sourceKey)) {
      return;
    }
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
    const drawRect = getContainedTextureRect(
      bounds.width,
      bounds.height,
      WORLD_MARKER_TEXTURE_SIZE
    );
    if (!drawRect) {
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = WORLD_MARKER_TEXTURE_SIZE;
    canvas.height = WORLD_MARKER_TEXTURE_SIZE;
    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.clearRect(0, 0, WORLD_MARKER_TEXTURE_SIZE, WORLD_MARKER_TEXTURE_SIZE);
    context.drawImage(
      source,
      bounds.x,
      bounds.y,
      bounds.width,
      bounds.height,
      drawRect.x,
      drawRect.y,
      drawRect.width,
      drawRect.height
    );

    if (this.textures.exists(targetKey)) {
      this.textures.remove(targetKey);
    }
    this.textures.addCanvas(targetKey, canvas);
    this.textures.remove(sourceKey);
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
      if (!this.textures.exists(sourceKey)) {
        return;
      }
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
      if (!this.textures.exists(sourceKey)) {
        return;
      }
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
    if (!this.textures.exists(sourceKey)) {
      return;
    }
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
    if (this.activeMap.id === REGNEMONSTER_MAP_ID) {
      return this.regnemonsterPrototypeView?.isPositionWalkable(x, y) ?? true;
    }
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
    this.hud.showToast('Du kan ikke gå her');
  }

  private getCollisionTextureKey(map: GameMapConfig = this.activeMap): string {
    if (map.id === REGNERIKET_MAP_ID) return 'world-collision-mask-regneriket';
    if (map.id === TALLVOKTER_MAP_ID) return 'world-collision-mask-tallvokter';
    return 'world-collision-mask-bossreisen';
  }

  private getCollisionMaskPath(map: GameMapConfig): string {
    if (map.id === REGNERIKET_MAP_ID) return REGNERIKET_COLLISION_MASK_PATH;
    if (map.id === TALLVOKTER_MAP_ID) return TALLVOKTER_COLLISION_MASK_PATH;
    return BOSS_COLLISION_MASK_PATH;
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
      if (this.activeMap.id === TALLVOKTER_MAP_ID) {
        this.nearbyRegneriket = undefined;
        this.nearbyRegneriketPortal = undefined;
        this.nearbyMapItem = undefined;
        this.updateNearbyTallvokterActivity();
        return;
      }
      if (this.activeMap.id === REGNEMONSTER_MAP_ID) {
        this.nearbyRegneriket = undefined;
        this.nearbyRegneriketPortal = undefined;
        this.nearbyMapItem = undefined;
        this.updateNearbyRegnemonsterInteraction();
        return;
      }
      if (this.nearbyRegnemonsterInteraction) {
        this.nearbyRegnemonsterInteraction = undefined;
        this.hud.setNearbyPortal(undefined);
      }
      if (this.nearbyTallvokterActivity) {
        this.nearbyTallvokterActivity = undefined;
        this.nearbyTallvokterStatus = '';
        this.refreshFishingStationViews();
        this.refreshBoatTravelViews();
      }
      if (this.activeMap.id !== REGNERIKET_MAP_ID) {
        this.nearbyRegneriket = undefined;
        this.nearbyRegneriketPortal = undefined;
        this.nearbyMapItem = undefined;
        this.hud.setNearbyRegneriket(undefined);
        this.hud.setNearbyPortal(undefined);
        return;
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

  private updateRegnemonsterRoomDoorState(): void {
    if (
      this.activeMap.id !== REGNEMONSTER_MAP_ID
      || !this.player
      || !this.regnemonsterPrototypeView
      || this.regnemonsterTransitionPending
    ) {
      this.regnemonsterDoorZoneId = undefined;
      return;
    }

    const townObjectPositions = this.regnemonsterPrototypeView.getPositions();
    const interiorObjectPositions = this.regnemonsterPrototypeView.getInteriorPositions();
    const transition = findRegnemonsterRoomTransition({
      room: this.regnemonsterRoom,
      x: this.player.x,
      y: this.player.y,
      previousZoneId: this.regnemonsterDoorZoneId,
      transitionLocked: this.time.now < this.regnemonsterTransitionLockedUntil,
      townObjectPositions,
      interiorObjectPositions
    });
    this.regnemonsterDoorZoneId = getRegnemonsterRoomZoneIdAt(
      this.regnemonsterRoom,
      this.player.x,
      this.player.y,
      townObjectPositions,
      interiorObjectPositions
    );
    if (transition) {
      this.beginRegnemonsterRoomTransition(transition.targetRoom, transition.spawn);
    }
  }

  private beginRegnemonsterRoomTransition(
    targetRoom: RegnemonsterRoomId,
    spawn: { x: number; y: number }
  ): void {
    if (!this.player || !this.marker || !this.regnemonsterPrototypeView) {
      return;
    }
    this.regnemonsterTransitionPending = true;
    this.clearPointerMoveTarget();
    this.input.keyboard?.resetKeys();
    this.hud.setNearbyPortal(undefined);
    this.nearbyRegnemonsterInteraction = undefined;
    this.cameras.main.fadeOut(120, 8, 18, 28);

    this.time.delayedCall(135, () => {
      if (!this.sys.isActive() || !this.player || !this.marker || !this.regnemonsterPrototypeView) {
        return;
      }
      this.regnemonsterRoom = targetRoom;
      this.regnemonsterPrototypeView.setRoom(targetRoom);
      this.player.setPosition(spawn.x, spawn.y);
      this.marker.setPosition(spawn.x, spawn.y + 18);
      this.cameras.main.centerOn(spawn.x, spawn.y);
      this.regnemonsterTransitionLockedUntil = this.time.now + 500;
      this.regnemonsterDoorZoneId = getRegnemonsterRoomZoneIdAt(
        targetRoom,
        spawn.x,
        spawn.y,
        this.regnemonsterPrototypeView.getPositions(),
        this.regnemonsterPrototypeView.getInteriorPositions()
      );
      this.regnemonsterTransitionPending = false;
      this.mapEditor?.refreshForActiveMap();
      if (targetRoom === 'town') {
        this.progress.savePlayerPosition(spawn.x, spawn.y);
      }
      this.updateNearbyLocation();
      this.cameras.main.fadeIn(160, 8, 18, 28);
      this.hud.showToast(
        targetRoom === 'collector-house'
          ? 'Du gikk inn i Samlerhuset.'
          : targetRoom === 'game-house'
            ? 'Du gikk inn i Spillhuset.'
            : 'Du gikk ut til Regnemonsterbyen.'
      );
    });
  }

  private updateNearbyRegnemonsterInteraction(): void {
    if (!this.player || this.activeMap.id !== REGNEMONSTER_MAP_ID) {
      return;
    }
    const nearby = getRegnemonsterInteractionAt(
      this.regnemonsterRoom,
      this.player.x,
      this.player.y,
      this.regnemonsterPrototypeView?.getInteriorPositions()
    );
    if (nearby === this.nearbyRegnemonsterInteraction) {
      return;
    }
    this.nearbyRegnemonsterInteraction = nearby;
    if (nearby === 'binder') {
      this.hud.setNearbyPortal({
        title: 'Samlepermen',
        description: 'Her kan du se Regnemonster-kortene du har samlet.',
        actionLabel: 'Åpne permen'
      });
    } else if (nearby === 'game-console') {
      this.hud.setNearbyPortal({
        title: 'Spillmaskinen',
        description: 'Her starter du en ny runde med ti matteoppgaver.',
        actionLabel: 'Bruk maskinen'
      });
    } else {
      this.hud.setNearbyPortal(undefined);
    }
  }

  private tryUseNearbyRegnemonsterInteraction(): void {
    if (this.nearbyRegnemonsterInteraction === 'binder') {
      this.clearPointerMoveTarget();
      this.hud.openRegnemonsterBinder();
    } else if (this.nearbyRegnemonsterInteraction === 'game-console') {
      this.clearPointerMoveTarget();
      this.hud.openRegnemonsterGame();
    }
  }

  private updateNearbyTallvokterActivity(): void {
    if (!this.player) {
      return;
    }

    if (this.tryTriggerTallvokterThiefEncounter()) {
      return;
    }

    const campQuest = this.progress.getTallvokterCampQuest();
    const collectedCampParts = new Set(campQuest?.collected ?? []);
    const candidates: Array<{
      id: TallvokterActivity;
      x: number;
      y: number;
      interactionDistance: number;
      partId?: string;
    }> = [
      {
        id: 'fishing-spot',
        ...FISHING_CONFIG.fishingSpotPosition,
        interactionDistance: FISHING_CONFIG.interactionDistance
      },
      {
        id: 'fisherman',
        ...FISHING_CONFIG.fishermanPosition,
        interactionDistance: FISHING_CONFIG.interactionDistance
      },
      {
        id: 'mine-boss',
        ...MINING_CONFIG.mineBossPosition,
        interactionDistance: MINING_CONFIG.interactionDistance
      },
      {
        id: 'lanista',
        ...GLADIATOR_ARENA_CONFIG.lanistaPosition,
        interactionDistance: GLADIATOR_ARENA_CONFIG.interactionDistance
      },
      {
        id: 'maze-guardian',
        ...MAZE_QUEST_CONFIG.guardianPosition,
        interactionDistance: MAZE_QUEST_CONFIG.interactionDistance
      },
      {
        id: 'butler',
        ...MANOR_CONFIG.butlerPosition,
        interactionDistance: MANOR_CONFIG.interactionDistance
      },
      {
        id: 'archivist',
        ...ARCHIVE_CONFIG.archivistPosition,
        interactionDistance: ARCHIVE_CONFIG.interactionDistance
      },
      {
        id: 'crystal-bridge-guardian',
        ...CRYSTAL_BRIDGE_CONFIG.guardianPosition,
        interactionDistance: CRYSTAL_BRIDGE_CONFIG.interactionDistance
      },
      {
        id: 'crystal-conductor',
        ...CRYSTAL_CART_CONFIG.conductorPosition,
        interactionDistance: CRYSTAL_CART_CONFIG.interactionDistance
      },
      {
        id: 'puzzle-master',
        ...PUZZLE_QUEST_CONFIG.masterPosition,
        interactionDistance: PUZZLE_QUEST_CONFIG.interactionDistance
      },
      {
        id: 'swamp-alchemist',
        ...SWAMP_ALCHEMY_CONFIG.alchemistPosition,
        interactionDistance: SWAMP_ALCHEMY_CONFIG.interactionDistance
      },
      {
        id: 'light-weaver',
        ...LIGHT_FOREST_CONFIG.guardianPosition,
        interactionDistance: LIGHT_FOREST_CONFIG.interactionDistance
      },
      {
        id: 'vault-guardian',
        ...COUNTERWEIGHT_VAULT_CONFIG.guardianPosition,
        interactionDistance: COUNTERWEIGHT_VAULT_CONFIG.interactionDistance
      },
      ...(this.progress.getTallvokterFinaleProgress().unlocked
        ? [{
            id: 'tallvokter-finale' as const,
            ...TALLVOKTER_FINALE_CONFIG.position,
            interactionDistance: TALLVOKTER_FINALE_CONFIG.interactionDistance
          }]
        : []),
      {
        id: 'camp-resident',
        ...CAMP_CONFIG.residentPosition,
        interactionDistance: CAMP_CONFIG.interactionDistance
      },
      ...(campQuest?.placements ?? [])
        .filter((placement) => !collectedCampParts.has(placement.id))
        .map((placement) => ({
          id: 'camp-part' as const,
          x: placement.x,
          y: placement.y,
          interactionDistance: CAMP_CONFIG.partInteractionDistance,
          partId: placement.id
        })),
      ...BOAT_TRAVEL_POINTS.map((point) => ({
        id: point.activityId,
        x: point.position.x,
        y: point.position.y,
        interactionDistance: BOAT_TRAVEL_INTERACTION_DISTANCE
      }))
    ];
    let nearest: TallvokterActivity | undefined;
    let nearestPartId: string | undefined;
    let nearestDistance = Number.POSITIVE_INFINITY;
    let nearestInteractionDistance = 0;
    for (const candidate of candidates) {
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, candidate.x, candidate.y);
      if (distance < nearestDistance) {
        nearest = candidate.id;
        nearestPartId = candidate.partId;
        nearestDistance = distance;
        nearestInteractionDistance = candidate.interactionDistance;
      }
    }

    const active = nearestDistance <= nearestInteractionDistance ? nearest : undefined;
    this.nearbyCampPartId = active === 'camp-part' ? nearestPartId : undefined;
    const unlocked = isFishingUnlocked(this.progress.getCompleted().length);
    const used = this.progress.hasUsedFishingRound();
    const fishCount = getFishInventoryCount(this.progress.getFishInventory());
    const miningCompleted = this.progress.getCompleted().includes(MINING_QUEST_ID);
    const gladiatorArenaCompleted = this.progress.getCompleted().includes(GLADIATOR_ARENA_QUEST_ID);
    const mazeCompleted = this.progress.getCompleted().includes(MAZE_QUEST_ID);
    const manorCompleted = this.progress.getCompleted().includes(MANOR_QUEST_ID);
    const archiveCompleted = this.progress.getCompleted().includes(ARCHIVE_QUEST_ID);
    const crystalBridgeCompleted =
      this.progress.getCompleted().includes(CRYSTAL_BRIDGE_QUEST_ID);
    const crystalCartCompleted = this.progress.getCompleted().includes(CRYSTAL_CART_QUEST_ID);
    const puzzleCompleted = this.progress.getCompleted().includes(PUZZLE_QUEST_ID);
    const swampAlchemyCompleted = this.progress.getCompleted().includes(SWAMP_ALCHEMY_QUEST_ID);
    const lightForestCompleted = this.progress.getCompleted().includes(LIGHT_FOREST_QUEST_ID);
    const counterweightVaultCompleted = this.progress.getCompleted().includes(COUNTERWEIGHT_VAULT_QUEST_ID);
    const campCompleted = this.progress.getCompleted().includes(CAMP_QUEST_ID);
    const campCollectedCount = campQuest?.collected.length ?? 0;
    const finaleProgress = this.progress.getTallvokterFinaleProgress();
    const status = `${active ?? 'none'}:${this.nearbyCampPartId ?? 'none'}:${unlocked}:${used}:${fishCount}:${miningCompleted}:${gladiatorArenaCompleted}:${mazeCompleted}:${manorCompleted}:${archiveCompleted}:${crystalBridgeCompleted}:${crystalCartCompleted}:${puzzleCompleted}:${swampAlchemyCompleted}:${lightForestCompleted}:${counterweightVaultCompleted}:${campCompleted}:${campCollectedCount}:${finaleProgress.unlocked}:${finaleProgress.won}:${finaleProgress.rewardClaimed}`;
    if (status === this.nearbyTallvokterStatus) {
      return;
    }

    this.nearbyTallvokterStatus = status;
    this.nearbyTallvokterActivity = active;
    this.refreshFishingStationViews();
    this.refreshMineBossView();
    this.refreshLanistaView();
    this.refreshMazeGuardianView();
    this.refreshButlerView();
    this.refreshArchivistView();
    this.refreshCrystalBridgeGuardianView();
    this.refreshCrystalConductorView();
    this.refreshPuzzleMasterView();
    this.refreshSwampAlchemistView();
    this.refreshLightWeaverView();
    this.refreshVaultGuardianView();
    this.refreshTallvokterFinaleView();
    this.refreshCampQuestViews();
    this.refreshBoatTravelViews();

    if (!active) {
      this.hud.setNearbyPortal(undefined);
      return;
    }

    if (active === 'tallvokter-finale') {
      const finale = this.progress.getTallvokterFinaleProgress();
      this.hud.setNearbyPortal({
        title: 'Tallvokteren',
        description: finale.rewardClaimed
          ? 'Den siste duellen er vunnet. Tallvokteren anerkjenner deg som rikets Regnemester.'
          : finale.won
            ? 'Tallvokteren venter med belønningen for den siste duellen.'
            : 'Bestå tre prøver og 15 matematikkoppgaver i rikets siste duell.',
        actionLabel: finale.rewardClaimed
          ? 'Se avslutningen'
          : finale.won
            ? 'Hent belønningen'
            : 'Start siste duell'
      });
      return;
    }

    if (active === 'fisherman') {
      this.hud.setNearbyPortal({
        title: 'Fiskeren',
        description: fishCount > 0
          ? `${fishCount} fisk venter i fiskebøtten din.`
          : 'Her kan du selge fisk fra fiskebøtten.',
        actionLabel: 'Selg fisk'
      });
      return;
    }

    if (active === 'mine-boss') {
      this.hud.setNearbyPortal({
        title: 'Gruvesjefen',
        description: miningCompleted
          ? 'Gruveekspedisjonen er fullført.'
          : 'Svar på 10 matteoppgaver, tjen bor og let etter verdifulle funn.',
        actionLabel: miningCompleted ? 'Fullført' : 'Start gruveekspedisjonen'
      });
      return;
    }

    if (active === 'lanista') {
      this.hud.setNearbyPortal({
        title: 'Lanistaen',
        description: gladiatorArenaCompleted
          ? 'Du har beseiret alle fire gladiatorene og blitt arenaens mester.'
          : 'Beseir fire gladiatorer i fire matematiske kamper.',
        actionLabel: gladiatorArenaCompleted ? 'Fullført' : 'Start gladiatorkampene'
      });
      return;
    }

    if (active === 'maze-guardian') {
      this.hud.setNearbyPortal({
        title: 'Labyrintens vokter',
        description: mazeCompleted
          ? 'Du har brutt alle fire seglene og funnet veien ut av labyrinten.'
          : 'Finn fire seglporter. Hver port åpnes med fem riktige svar.',
        actionLabel: mazeCompleted ? 'Fullført' : 'Start labyrinten'
      });
      return;
    }

    if (active === 'butler') {
      this.hud.setNearbyPortal({
        title: 'Butleren',
        description: manorCompleted
          ? 'Herskapshuset er ryddet for edderkopper.'
          : 'Finn fem edderkopper og løs fire matteoppgaver for hver av dem.',
        actionLabel: manorCompleted ? 'Fullført' : 'Hjelp Butleren'
      });
      return;
    }

    if (active === 'archivist') {
      this.hud.setNearbyPortal({
        title: 'Riksarkivaren',
        description: archiveCompleted
          ? 'Alle skriftrullene står igjen på riktig plass i Tallarkivet.'
          : 'Sorter ti skriftruller ved å dra dem til hyllen med riktig svar.',
        actionLabel: archiveCompleted ? 'Fullført' : 'Hjelp Riksarkivaren'
      });
      return;
    }

    if (active === 'crystal-bridge-guardian') {
      this.hud.setNearbyPortal({
        title: 'Krystallbrovokteren',
        description: crystalBridgeCompleted
          ? 'Alle åtte lysleddene gløder, og porten over Krystallbroen står åpen.'
          : 'Løs åtte regnestykker og før riktige svar-krystaller inn i broens sokler.',
        actionLabel: crystalBridgeCompleted ? 'Fullført' : 'Reparer Krystallbroen'
      });
      return;
    }

    if (active === 'crystal-conductor') {
      this.hud.setNearbyPortal({
        title: 'Krystallføreren',
        description: crystalCartCompleted
          ? 'Du har ført Krystallvognen trygt helt frem til krystallkjernen.'
          : 'Velg riktig svarspor gjennom ti magiske veikryss i Krystallgruven.',
        actionLabel: crystalCartCompleted ? 'Fullført' : 'Kjør Krystallvognen'
      });
      return;
    }

    if (active === 'puzzle-master') {
      this.hud.setNearbyPortal({
        title: 'Puslespill-mesteren',
        description: puzzleCompleted
          ? 'Den magiske mosaikken er gjenreist.'
          : 'Vekk tolv brikker med matematikk og sett den knuste mosaikken sammen.',
        actionLabel: puzzleCompleted ? 'Fullført' : 'Start puslespillet'
      });
      return;
    }

    if (active === 'swamp-alchemist') {
      this.hud.setNearbyPortal({
        title: 'Sumpalkymisten',
        description: swampAlchemyCompleted
          ? 'Motgiften er ferdig, og den giftige sumptåken er under kontroll.'
          : 'Vekk fire ingredienser med matematikk, før dem til gryten og rør motgiften ferdig.',
        actionLabel: swampAlchemyCompleted ? 'Fullført' : 'Brygg motgiften'
      });
      return;
    }

    if (active === 'light-weaver') {
      this.hud.setNearbyPortal({
        title: 'Lysveveren',
        description: lightForestCompleted
          ? 'Alle fem lystrærne er koblet til rothjertet, og Lysskogen stråler igjen.'
          : 'Lad lysgnister med matematikk og reparer røttene mellom skogens fem lystrær.',
        actionLabel: lightForestCompleted ? 'Fullført' : 'Bygg nettverket'
      });
      return;
    }

    if (active === 'vault-guardian') {
      this.hud.setNearbyPortal({
        title: 'Hvelvvokteren',
        description: counterweightVaultCompleted
          ? 'Motvekthvelvets fire låser er åpnet, og porten står i balanse.'
          : 'Løs matematikk, balanser runesteinene og åpne hvelvets fire låser.',
        actionLabel: counterweightVaultCompleted ? 'Fullført' : 'Undersøk porten'
      });
      return;
    }

    if (active === 'camp-part' && this.nearbyCampPartId) {
      const part = getCampPart(this.nearbyCampPartId);
      if (part) {
        this.hud.setNearbyPortal({
          title: part.displayName,
          description: `Svar riktig på to matematikkoppgaver for å sikre ${part.displayName.toLowerCase()}.`,
          actionLabel: 'Plukk opp'
        });
        return;
      }
    }

    if (active === 'camp-resident') {
      const allCollected = campCollectedCount === CAMP_PARTS.length;
      this.hud.setNearbyPortal({
        title: 'Mannen ved Leirstedet',
        description: campCompleted
          ? 'Vognhjulet er reparert, og vognen kan rulle igjen.'
          : !campQuest
            ? 'Et knust vognhjul har spredt sju deler rundt i riket.'
            : allCollected
              ? 'Du har funnet alle hjuldelene. Lever dem tilbake for å reparere vognen.'
              : `${campCollectedCount} av ${CAMP_PARTS.length} hjuldeler er funnet.`,
        actionLabel: campCompleted
          ? 'Fullført'
          : !campQuest
            ? 'Tilby hjelp'
            : allCollected
              ? 'Lever hjuldelene'
              : 'Se fremdrift'
      });
      return;
    }

    const boatPoint = BOAT_TRAVEL_POINTS.find((point) => point.activityId === active);
    if (boatPoint) {
      this.hud.setNearbyPortal({
        title: boatPoint.title,
        description: 'Ta båten over havet til den andre siden.',
        actionLabel: 'Dra med båten'
      });
      return;
    }

    this.hud.setNearbyPortal({
      title: 'Fiskested',
      description: !unlocked
        ? getFishingLockMessage()
        : used
          ? 'Du har allerede fisket denne reisen.'
          : 'Start en fiskerunde på 30 sekunder.',
      actionLabel: !unlocked ? 'Låst' : used ? 'Fisket' : 'Start fisking'
    });
  }

  private tryTriggerTallvokterThiefEncounter(): boolean {
    const encounter = this.progress.getTallvokterThiefEncounter();
    if (
      !this.player
      || !encounter
      || encounter.resolved
      || this.tallvokterThiefTriggered
      || Phaser.Math.Distance.Between(this.player.x, this.player.y, encounter.x, encounter.y) > TALLVOKTER_THIEF_INTERACT_DISTANCE
    ) {
      return false;
    }

    this.tallvokterThiefTriggered = true;
    this.nearbyTallvokterActivity = undefined;
    this.nearbyTallvokterStatus = 'regnetyvene';
    this.clearPointerMoveTarget();
    this.hud.setNearbyPortal(undefined);
    this.worldInputEnabled = false;
    this.playTallvokterThiefAmbushEffect(encounter.x, encounter.y, () => {
      this.worldInputEnabled = true;
      this.openTallvokterThiefIntro();
    });
    return true;
  }

  private playTallvokterThiefAmbushEffect(x: number, y: number, onComplete: () => void): void {
    const camera = this.cameras.main;
    camera.flash(220, 150, 20, 55, true);
    camera.shake(620, 0.012, true);

    const overlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x120615, 0.72)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(300)
      .setAlpha(0);
    this.tweens.add({
      targets: overlay,
      alpha: 0.72,
      duration: 170,
      yoyo: true,
      hold: 270,
      ease: 'Sine.easeInOut',
      onComplete: () => overlay.destroy()
    });

    const effects: Phaser.GameObjects.GameObject[] = [];
    [
      { delay: 0, color: 0xff3155, radius: 44 },
      { delay: 120, color: 0xffd66b, radius: 58 },
      { delay: 230, color: 0x9b5cff, radius: 70 }
    ].forEach(({ delay, color, radius }) => {
      const ring = this.add.circle(x, y, radius, color, 0)
        .setStrokeStyle(8, color, 1)
        .setScale(0.18)
        .setDepth(302);
      effects.push(ring);
      this.tweens.add({
        targets: ring,
        scale: 2.15,
        alpha: 0,
        duration: 620,
        delay,
        ease: 'Cubic.easeOut',
        onComplete: () => ring.destroy()
      });
    });

    for (let index = 0; index < 14; index += 1) {
      const angle = (Math.PI * 2 * index) / 14;
      const spark = this.add.circle(x, y, index % 2 === 0 ? 7 : 5, index % 3 === 0 ? 0xffd66b : 0xff3155, 1)
        .setDepth(303);
      effects.push(spark);
      const distance = 105 + (index % 4) * 22;
      this.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        scale: 0.15,
        alpha: 0,
        duration: 520 + (index % 3) * 70,
        delay: 80,
        ease: 'Quad.easeOut',
        onComplete: () => spark.destroy()
      });
    }

    const ambushText = this.add.text(x, y - 104, 'BAKHOLD!', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '58px',
      fontStyle: '900',
      color: '#fff0a8',
      stroke: '#8f102f',
      strokeThickness: 12,
      shadow: { color: '#000000', blur: 14, offsetX: 0, offsetY: 8, fill: true }
    }).setOrigin(0.5).setDepth(304).setScale(0.28).setAlpha(0);
    effects.push(ambushText);
    this.tweens.add({
      targets: ambushText,
      scale: 1.08,
      alpha: 1,
      duration: 250,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: ambushText,
          y: y - 146,
          alpha: 0,
          duration: 360,
          delay: 230,
          ease: 'Cubic.easeIn',
          onComplete: () => ambushText.destroy()
        });
      }
    });

    this.time.delayedCall(900, () => {
      effects.forEach((effect) => {
        if (effect.active) {
          effect.destroy();
        }
      });
      if (this.sys.isActive()) {
        onComplete();
      }
    });
  }

  private openTallvokterThiefIntro(): void {
    this.hud.openMandatoryInfo(
      'Stans der, regnereisende!',
      'Skyggene samler seg rundt deg. «Myntposen – nå! Eller bevis at du er smartere enn Regnetyvene. Ti oppgaver. Én mattekamp. Vinner du, beholder du alt og får 50 Regnecoins. Taper du, tar vi 100 Regnecoins!»',
      'Neste',
      () => {
        this.tallvokterThiefRevealed = true;
        this.refreshTallvokterThiefView();
        this.hud.openTallvokterThiefEncounter(
          () => {
            this.progress.resolveTallvokterThiefEncounter(0, TALLVOKTER_THIEF_VICTORY_REWARD);
            this.refreshTallvokterThiefView();
            this.hud.showToast('Regnetyvene flykter tomhendte. +50 Regnecoins!');
          },
          () => {
            this.hud.openTallvokterThiefLossEnding(() => {
              const amountToSteal = Math.min(
                this.progress.getRegnecoins(),
                TALLVOKTER_THIEF_ROBBERY_AMOUNT
              );
              this.hud.playRegnecoinLossAnimation(amountToSteal, () => {
                const result = this.progress.resolveTallvokterThiefEncounter(TALLVOKTER_THIEF_ROBBERY_AMOUNT);
                this.hud.finishTallvokterThiefLossEnding();
                this.refreshTallvokterThiefView();
                this.hud.showToast(result.lostRegnecoins > 0
                  ? `Regnetyvene stakk av med ${result.lostRegnecoins} Regnecoins.`
                  : 'Regnetyvene fant ingen Regnecoins å stjele.');
              });
            });
          }
        );
      }
    );
  }

  private tryStartNearbyBattle(fromHud = false): void {
    if (!this.worldInputEnabled || (!fromHud && this.hud.isWorldBlocked())) {
      return;
    }

    if (!this.activeMap.showBossJourney) {
      if (this.activeMap.id === TALLVOKTER_MAP_ID) {
        this.tryUseNearbyTallvokterActivity();
        return;
      }
      if (this.activeMap.id === REGNEMONSTER_MAP_ID) {
        this.tryUseNearbyRegnemonsterInteraction();
        return;
      }
      if (this.activeMap.id !== REGNERIKET_MAP_ID) {
        return;
      }
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

    this.ensureMapBossTexture(this.nearby, 'defeated');
    this.hud.openBattle(this.nearby, () => {
      this.progress.completeLocation(this.nearby!.id);
      this.refreshNodeViews();
    });
  }

  private tryUseNearbyTallvokterActivity(): void {
    if (!this.nearbyTallvokterActivity) {
      return;
    }

    if (this.nearbyTallvokterActivity === 'tallvokter-finale') {
      this.clearPointerMoveTarget();
      if (this.player) this.progress.savePlayerPosition(this.player.x, this.player.y);
      this.hud.setNearbyPortal(undefined);
      this.hud.openTallvokterFinale();
      return;
    }

    if (this.nearbyTallvokterActivity === 'fisherman') {
      this.clearPointerMoveTarget();
      this.hud.openFishingSale();
      return;
    }


    if (this.nearbyTallvokterActivity === 'mine-boss') {
      if (this.progress.getCompleted().includes(MINING_QUEST_ID)) {
        this.hud.showToast('Gruveekspedisjonen er allerede fullført.');
        return;
      }
      this.clearPointerMoveTarget();
      if (this.player) {
        this.progress.savePlayerPosition(this.player.x, this.player.y);
      }
      this.hud.setNearbyPortal(undefined);
      this.hud.openMiningExpeditionIntro(
        () => this.hud.openMiningExpedition(),
        () => this.hud.showToast('Gruveekspedisjonen kan startes når du er klar.')
      );
      return;
    }

    if (this.nearbyTallvokterActivity === 'lanista') {
      if (this.progress.getCompleted().includes(GLADIATOR_ARENA_QUEST_ID)) {
        this.hud.showToast('Gladiatorarenaen er allerede fullført.');
        return;
      }
      this.clearPointerMoveTarget();
      if (this.player) {
        this.progress.savePlayerPosition(this.player.x, this.player.y);
      }
      this.hud.setNearbyPortal(undefined);
      this.hud.openGladiatorArena();
      return;
    }

    if (this.nearbyTallvokterActivity === 'maze-guardian') {
      if (this.progress.getCompleted().includes(MAZE_QUEST_ID)) {
        this.hud.showToast('Labyrintens fire segl er allerede fullført.');
        return;
      }
      this.clearPointerMoveTarget();
      if (this.player) {
        this.progress.savePlayerPosition(this.player.x, this.player.y);
      }
      this.hud.setNearbyPortal(undefined);
      this.hud.openMazeQuest();
      return;
    }

    if (this.nearbyTallvokterActivity === 'butler') {
      if (this.progress.getCompleted().includes(MANOR_QUEST_ID)) {
        this.hud.showToast('Herskapshuset er allerede ryddet for edderkopper.');
        return;
      }
      this.clearPointerMoveTarget();
      if (this.player) {
        this.progress.savePlayerPosition(this.player.x, this.player.y);
      }
      this.hud.setNearbyPortal(undefined);
      this.hud.openManorQuest();
      return;
    }

    if (this.nearbyTallvokterActivity === 'archivist') {
      if (this.progress.getCompleted().includes(ARCHIVE_QUEST_ID)) {
        this.hud.showToast('Tallarkivets skriftruller er allerede sortert.');
        return;
      }
      this.clearPointerMoveTarget();
      if (this.player) {
        this.progress.savePlayerPosition(this.player.x, this.player.y);
      }
      this.hud.setNearbyPortal(undefined);
      this.hud.openArchiveQuest();
      return;
    }

    if (this.nearbyTallvokterActivity === 'crystal-bridge-guardian') {
      if (this.progress.getCompleted().includes(CRYSTAL_BRIDGE_QUEST_ID)) {
        this.hud.showToast('Krystallbroens åtte lysledd er allerede reparert.');
        return;
      }
      this.clearPointerMoveTarget();
      if (this.player) {
        this.progress.savePlayerPosition(this.player.x, this.player.y);
      }
      this.hud.setNearbyPortal(undefined);
      this.hud.openCrystalBridgeQuest();
      return;
    }

    if (this.nearbyTallvokterActivity === 'crystal-conductor') {
      if (this.progress.getCompleted().includes(CRYSTAL_CART_QUEST_ID)) {
        this.hud.showToast('Krystallvognen er allerede ført frem til krystallkjernen.');
        return;
      }
      this.clearPointerMoveTarget();
      if (this.player) {
        this.progress.savePlayerPosition(this.player.x, this.player.y);
      }
      this.hud.setNearbyPortal(undefined);
      this.hud.openCrystalCartIntro(() => this.startCrystalCartRide());
      return;
    }

    if (this.nearbyTallvokterActivity === 'puzzle-master') {
      if (this.progress.getCompleted().includes(PUZZLE_QUEST_ID)) {
        this.hud.showToast('Den magiske mosaikken er allerede gjenreist.');
        return;
      }
      this.clearPointerMoveTarget();
      if (this.player) {
        this.progress.savePlayerPosition(this.player.x, this.player.y);
      }
      this.hud.setNearbyPortal(undefined);
      this.hud.openPuzzleQuest();
      return;
    }

    if (this.nearbyTallvokterActivity === 'swamp-alchemist') {
      if (this.progress.getCompleted().includes(SWAMP_ALCHEMY_QUEST_ID)) {
        this.hud.showToast('Sumpalkymistens motgift er allerede ferdig brygget.');
        return;
      }
      this.clearPointerMoveTarget();
      if (this.player) {
        this.progress.savePlayerPosition(this.player.x, this.player.y);
      }
      this.hud.setNearbyPortal(undefined);
      this.hud.openSwampAlchemyIntro(
        () => this.startSwampAlchemy(),
        () => {
          this.nearbyTallvokterStatus = '';
          this.updateNearbyLocation();
        }
      );
      return;
    }

    if (this.nearbyTallvokterActivity === 'light-weaver') {
      if (this.progress.getCompleted().includes(LIGHT_FOREST_QUEST_ID)) {
        this.hud.showToast('Lysskogen er allerede vekket.');
        return;
      }
      this.clearPointerMoveTarget();
      if (this.player) {
        this.progress.savePlayerPosition(this.player.x, this.player.y);
      }
      this.hud.setNearbyPortal(undefined);
      this.hud.openLightForestIntro(
        () => this.startLightForest(),
        () => {
          this.nearbyTallvokterStatus = '';
          this.updateNearbyLocation();
        }
      );
      return;
    }

    if (this.nearbyTallvokterActivity === 'vault-guardian') {
      if (this.progress.getCompleted().includes(COUNTERWEIGHT_VAULT_QUEST_ID)) {
        this.hud.showToast('Motvekthvelvet er allerede åpnet.');
        return;
      }
      this.clearPointerMoveTarget();
      if (this.player) {
        this.progress.savePlayerPosition(this.player.x, this.player.y);
      }
      this.hud.setNearbyPortal(undefined);
      this.hud.openCounterweightVaultIntro(
        () => this.startCounterweightVault(),
        () => {
          this.nearbyTallvokterStatus = '';
          this.updateNearbyLocation();
        }
      );
      return;
    }

    if (this.nearbyTallvokterActivity === 'camp-part' && this.nearbyCampPartId) {
      const partId = this.nearbyCampPartId;
      const part = getCampPart(partId);
      if (!part) {
        return;
      }

      this.clearPointerMoveTarget();
      if (this.player) {
        this.progress.savePlayerPosition(this.player.x, this.player.y);
      }
      this.hud.setNearbyPortal(undefined);
      this.hud.openMathQuest(createCampPartQuest(partId), {
        mapLabel: 'Tallvokterens verden',
        kindLabel: 'Let-og-samle',
        onWin: () => this.collectCampPart(partId),
        successToast: false,
        allowRetry: true
      });
      return;
    }

    if (this.nearbyTallvokterActivity === 'camp-resident') {
      if (this.progress.getCompleted().includes(CAMP_QUEST_ID)) {
        this.hud.showToast('Leirstedet er allerede fullført.');
        return;
      }

      this.clearPointerMoveTarget();
      if (this.player) {
        this.progress.savePlayerPosition(this.player.x, this.player.y);
      }
      this.hud.setNearbyPortal(undefined);
      const campQuest = this.progress.getTallvokterCampQuest();
      if (!campQuest) {
        this.hud.openCampQuestIntro(() => this.startCampQuest());
        return;
      }
      if (campQuest.collected.length === CAMP_PARTS.length) {
        this.hud.openCampQuestReward();
        return;
      }
      this.hud.openCampQuestProgress(campQuest.collected.length);
      return;
    }

    const boatPoint = BOAT_TRAVEL_POINTS.find((point) => point.activityId === this.nearbyTallvokterActivity);
    if (boatPoint) {
      this.travelWithBoat(boatPoint);
      return;
    }

    if (!isFishingUnlocked(this.progress.getCompleted().length)) {
      this.hud.showToast(getFishingLockMessage());
      return;
    }

    if (this.progress.hasUsedFishingRound()) {
      this.hud.showToast('Du har allerede fisket denne reisen.');
      return;
    }

    if (!this.player || this.scene.isActive('FishingScene')) {
      return;
    }

    this.progress.savePlayerPosition(this.player.x, this.player.y);
    if (!this.progress.beginFishingRound()) {
      this.hud.showToast('Fiskerunden kunne ikke startes.');
      this.nearbyTallvokterStatus = '';
      this.updateNearbyLocation();
      return;
    }

    this.worldInputEnabled = false;
    this.clearPointerMoveTarget();
    this.input.enabled = false;
    this.hud.setNearbyPortal(undefined);
    this.hud.setWorldHudVisible(false);
    this.scene.launch('FishingScene');
    this.scene.pause();
  }

  private startCrystalCartRide(): void {
    if (!this.player || !this.worldInputEnabled || this.scene.isActive('CrystalCartScene')) {
      return;
    }

    this.progress.savePlayerPosition(this.player.x, this.player.y);
    this.worldInputEnabled = false;
    this.clearPointerMoveTarget();
    this.input.keyboard?.resetKeys();
    this.input.enabled = false;
    this.nearbyTallvokterActivity = undefined;
    this.nearbyTallvokterStatus = '';
    this.hud.setNearbyPortal(undefined);
    this.hud.setWorldHudVisible(false);
    this.scene.launch('CrystalCartScene');
    this.scene.pause();
  }

  private startSwampAlchemy(): void {
    if (!this.player || !this.worldInputEnabled || this.scene.isActive('SwampAlchemyScene')) {
      return;
    }

    this.progress.savePlayerPosition(this.player.x, this.player.y);
    this.worldInputEnabled = false;
    this.clearPointerMoveTarget();
    this.input.keyboard?.resetKeys();
    this.input.enabled = false;
    this.nearbyTallvokterActivity = undefined;
    this.nearbyTallvokterStatus = '';
    this.hud.setNearbyPortal(undefined);
    this.hud.setWorldHudVisible(false);
    this.scene.launch('SwampAlchemyScene');
    this.scene.pause();
  }

  private startLightForest(): void {
    if (
      !this.player
      || !this.worldInputEnabled
      || this.lightForestLaunchPending
      || this.scene.isActive('LightForestScene')
    ) {
      return;
    }

    this.progress.savePlayerPosition(this.player.x, this.player.y);
    this.lightForestLaunchPending = true;
    this.clearPointerMoveTarget();
    this.input.keyboard?.resetKeys();
    this.nearbyTallvokterActivity = undefined;
    this.nearbyTallvokterStatus = '';
    this.hud.setNearbyPortal(undefined);
    try {
      this.scene.launch('LightForestScene');
    } catch {
      this.restoreAfterLightForestLaunchFailure();
      return;
    }
    this.time.delayedCall(8000, () => {
      if (this.lightForestLaunchPending) {
        this.restoreAfterLightForestLaunchFailure();
      }
    });
  }

  public confirmLightForestReady(): void {
    if (!this.lightForestLaunchPending) {
      return;
    }
    this.lightForestLaunchPending = false;
    this.worldInputEnabled = false;
    this.clearPointerMoveTarget();
    this.input.keyboard?.resetKeys();
    this.input.enabled = false;
    this.hud.setWorldHudVisible(false);
    this.mapEditor?.setAvailable(false);
    this.scene.bringToTop('LightForestScene');
    this.scene.pause();
  }

  private restoreAfterLightForestLaunchFailure(): void {
    this.lightForestLaunchPending = false;
    this.scene.stop('LightForestScene');
    this.clearPointerMoveTarget();
    this.input.keyboard?.resetKeys();
    this.input.enabled = true;
    this.worldInputEnabled = true;
    this.hud.closeLightForestUi();
    this.hud.setWorldHudVisible(true);
    this.mapEditor?.setAvailable(this.isActiveMapEditable());
    this.nearbyTallvokterActivity = undefined;
    this.nearbyTallvokterStatus = '';
    this.updateNearbyLocation();
    this.hud.showToast('Lysrøttenes nettverk kunne ikke åpnes. Prøv igjen.');
  }

  private startCounterweightVault(): void {
    if (
      !this.player
      || !this.worldInputEnabled
      || this.counterweightVaultLaunchPending
      || this.scene.isActive('CounterweightVaultScene')
    ) {
      return;
    }

    this.progress.savePlayerPosition(this.player.x, this.player.y);
    this.counterweightVaultLaunchPending = true;
    this.clearPointerMoveTarget();
    this.input.keyboard?.resetKeys();
    this.nearbyTallvokterActivity = undefined;
    this.nearbyTallvokterStatus = '';
    this.hud.setNearbyPortal(undefined);
    try {
      this.scene.launch('CounterweightVaultScene');
    } catch {
      this.restoreAfterCounterweightVaultLaunchFailure();
      return;
    }
    this.time.delayedCall(8000, () => {
      if (this.counterweightVaultLaunchPending) {
        this.restoreAfterCounterweightVaultLaunchFailure();
      }
    });
  }

  public confirmCounterweightVaultReady(): void {
    if (!this.counterweightVaultLaunchPending) {
      return;
    }
    this.counterweightVaultLaunchPending = false;
    this.worldInputEnabled = false;
    this.clearPointerMoveTarget();
    this.input.keyboard?.resetKeys();
    this.input.enabled = false;
    this.hud.setWorldHudVisible(false);
    this.mapEditor?.setAvailable(false);
    this.scene.bringToTop('CounterweightVaultScene');
    this.scene.pause();
  }

  private restoreAfterCounterweightVaultLaunchFailure(): void {
    this.counterweightVaultLaunchPending = false;
    this.scene.stop('CounterweightVaultScene');
    this.clearPointerMoveTarget();
    this.input.keyboard?.resetKeys();
    this.input.enabled = true;
    this.worldInputEnabled = true;
    this.hud.closeCounterweightVaultUi();
    this.hud.setWorldHudVisible(true);
    this.mapEditor?.setAvailable(this.isActiveMapEditable());
    this.nearbyTallvokterActivity = undefined;
    this.nearbyTallvokterStatus = '';
    this.updateNearbyLocation();
    this.hud.showToast('Motvekthvelvet kunne ikke åpnes. Prøv igjen.');
  }

  private collectCampPart(partId: string): void {
    const part = getCampPart(partId);
    if (!part) {
      return;
    }

    const result = this.progress.collectTallvokterCampPart(partId);
    if (!result.collected) {
      this.hud.showToast('Denne hjuldelen er allerede samlet inn.');
      return;
    }

    this.nearbyCampPartId = undefined;
    this.nearbyTallvokterActivity = undefined;
    this.nearbyTallvokterStatus = '';
    this.ensureCampQuestViews();
    this.hud.showToast(result.allCollected
      ? CAMP_RETURN_MESSAGE
      : `${part.displayName} funnet! ${result.collectedCount} av ${CAMP_PARTS.length} deler er samlet.`);
    this.updateNearbyLocation();
  }

  private travelWithBoat(origin: BoatTravelPoint): void {
    if (!this.player || !this.marker || !this.worldInputEnabled || this.scene.isActive('BoatTravelScene')) {
      return;
    }
    const destination = getBoatTravelPoint(origin.destinationId);
    this.progress.savePlayerPosition(this.player.x, this.player.y);
    this.worldInputEnabled = false;
    this.clearPointerMoveTarget();
    this.input.keyboard?.resetKeys();
    this.input.enabled = false;
    this.hud.setNearbyPortal(undefined);
    this.hud.setWorldHudVisible(false);
    this.scene.launch('BoatTravelScene', {
      direction: origin.id === 'boatWest' ? 'west-to-east' : 'east-to-west',
      destinationId: destination.id
    });
    this.scene.pause();
  }

  public completeBoatTravel(destinationId: 'boatWest' | 'boatEast'): void {
    const destination = getBoatTravelPoint(destinationId);
    const target = this.getSafePlayerPosition(destination.position);
    this.player?.setPosition(target.x, target.y);
    this.marker?.setPosition(target.x, target.y + 18);
    this.cameras.main.centerOn(target.x, target.y);
    this.progress.savePlayerPosition(target.x, target.y);
    this.nearbyTallvokterActivity = undefined;
    this.nearbyTallvokterStatus = '';
    this.clearPointerMoveTarget();
    this.input.enabled = false;
    this.worldInputEnabled = false;
    this.time.delayedCall(120, () => {
      this.clearPointerMoveTarget();
      this.input.keyboard?.resetKeys();
      this.input.enabled = true;
      this.worldInputEnabled = true;
      this.hud.setWorldHudVisible(true);
      this.hud.showToast('Du tok båten over havet.');
      this.updateNearbyLocation();
    });
  }

  public resumeFromFishing(): void {
    this.clearPointerMoveTarget();
    this.input.enabled = false;
    this.worldInputEnabled = false;
    this.time.delayedCall(120, () => {
      this.clearPointerMoveTarget();
      this.input.keyboard?.resetKeys();
      this.input.enabled = true;
      this.worldInputEnabled = true;
      this.hud.setWorldHudVisible(true);
      this.nearbyTallvokterStatus = '';
      this.updateNearbyLocation();
    });
  }

  public resumeFromCrystalCart(resetToProgress = false): void {
    if (resetToProgress) {
      this.movePlayerToSavedPosition();
    }
    this.clearPointerMoveTarget();
    this.input.enabled = false;
    this.worldInputEnabled = false;
    this.time.delayedCall(120, () => {
      this.clearPointerMoveTarget();
      this.input.keyboard?.resetKeys();
      this.input.enabled = true;
      this.worldInputEnabled = true;
      this.hud.setWorldHudVisible(true);
      this.nearbyTallvokterActivity = undefined;
      this.nearbyTallvokterStatus = '';
      this.refreshCrystalConductorView();
      this.updateNearbyLocation();
    });
  }

  public resumeFromSwampAlchemy(resetToProgress = false): void {
    if (resetToProgress) {
      this.movePlayerToSavedPosition();
    }
    this.clearPointerMoveTarget();
    this.input.enabled = false;
    this.worldInputEnabled = false;
    this.time.delayedCall(120, () => {
      this.clearPointerMoveTarget();
      this.input.keyboard?.resetKeys();
      this.input.enabled = true;
      this.worldInputEnabled = true;
      this.hud.setWorldHudVisible(true);
      this.nearbyTallvokterActivity = undefined;
      this.nearbyTallvokterStatus = '';
      this.refreshSwampAlchemistView();
      this.updateNearbyLocation();
    });
  }

  public resumeFromLightForest(resetToProgress = false): void {
    this.lightForestLaunchPending = false;
    if (resetToProgress) {
      this.movePlayerToSavedPosition();
    }
    this.clearPointerMoveTarget();
    this.input.enabled = false;
    this.worldInputEnabled = false;
    this.time.delayedCall(120, () => {
      this.clearPointerMoveTarget();
      this.input.keyboard?.resetKeys();
      this.input.enabled = true;
      this.worldInputEnabled = true;
      this.hud.setWorldHudVisible(true);
      this.nearbyTallvokterActivity = undefined;
      this.nearbyTallvokterStatus = '';
      this.mapEditor?.setAvailable(this.isActiveMapEditable());
      this.refreshLightWeaverView();
      this.updateNearbyLocation();
    });
  }

  public resumeFromCounterweightVault(resetToProgress = false): void {
    this.counterweightVaultLaunchPending = false;
    if (resetToProgress) {
      this.movePlayerToSavedPosition();
    }
    this.clearPointerMoveTarget();
    this.input.enabled = false;
    this.worldInputEnabled = false;
    this.time.delayedCall(120, () => {
      this.clearPointerMoveTarget();
      this.input.keyboard?.resetKeys();
      this.input.enabled = true;
      this.worldInputEnabled = true;
      this.hud.setWorldHudVisible(true);
      this.nearbyTallvokterActivity = undefined;
      this.nearbyTallvokterStatus = '';
      this.mapEditor?.setAvailable(this.isActiveMapEditable());
      this.refreshVaultGuardianView();
      this.updateNearbyLocation();
    });
  }

  private resetWorldProgress(): void {
    this.stopTimedRun();
    this.progress.reset();
    this.tallvokterThiefTriggered = false;
    this.tallvokterThiefRevealed = false;
    this.ensureTallvokterThiefEncounter();
    this.movePlayerToSavedPosition();
    this.nearby = undefined;
    this.nearbyRegneriket = undefined;
    this.nearbyRegneriketPortal = undefined;
    this.nearbyTallvokterActivity = undefined;
    this.nearbyTallvokterStatus = '';
    this.refreshNodeViews();
    this.refreshRegneriketViews();
    this.refreshRegneriketPortalViews();
    this.refreshMapItemViews();
    this.refreshFishingStationViews();
    this.refreshMineBossView();
    this.refreshLanistaView();
    this.refreshMazeGuardianView();
    this.refreshButlerView();
    this.refreshArchivistView();
    this.refreshCrystalConductorView();
    this.refreshPuzzleMasterView();
    this.refreshSwampAlchemistView();
    this.refreshLightWeaverView();
    this.refreshVaultGuardianView();
    this.refreshCampQuestViews();
    this.refreshBoatTravelViews();
    this.refreshTallvokterThiefView();
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
        if (this.textures.exists(textureKey) && view.bossSprite.texture.key !== textureKey) {
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
      const medalTextureKey = getMedalTextureKey(this.progress.getActiveMedalId());
      if (this.textures.exists(medalTextureKey)) {
        this.finalRewardMedal.setTexture(medalTextureKey);
      }
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
      const screen = this.getWorldClientPoint(rewardCoin.x, rewardCoin.y);
      if (regnecoins > 0) {
        this.hud.playRegnecoinWorldRewardAnimation(regnecoins, screen.x, screen.y);
      }
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
      const regnecoins = result?.regnecoins ?? 0;
      const medalIds = result?.medalIds ?? [];
      const screen = this.getWorldClientPoint(view.rewardCoin.x, view.rewardCoin.y);
      if (regnecoins > 0) {
        this.hud.playRegnecoinWorldRewardAnimation(regnecoins, screen.x, screen.y, () => {
          if (medalIds.length > 0) {
            this.hud.openMedalReward(medalIds, regnecoins);
          }
        });
      } else if (medalIds.length > 0) {
        this.hud.openMedalReward(medalIds, 0);
      }
      if (!medalIds.length) {
        this.hud.showToast(`${view.stop.place}-mynten er hentet! +${result?.regnecoins ?? this.progress.getRegneriketRewardCoins(view.stop.id)} Regnecoins.`);
      }
      this.refreshRegneriketViews();
      this.updateNearbyLocation();
      return;
    }
  }

  private getWorldClientPoint(worldX: number, worldY: number): { x: number; y: number } {
    const canvas = this.game.canvas;
    const rect = canvas.getBoundingClientRect();
    const worldView = this.cameras.main.worldView;
    const normalizedX = worldView.width > 0 ? (worldX - worldView.x) / worldView.width : 0.5;
    const normalizedY = worldView.height > 0 ? (worldY - worldView.y) / worldView.height : 0.5;
    return {
      x: rect.left + Phaser.Math.Clamp(normalizedX, 0, 1) * rect.width,
      y: rect.top + Phaser.Math.Clamp(normalizedY, 0, 1) * rect.height
    };
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
    if (!this.player || this.activeMap.id !== REGNERIKET_MAP_ID) {
      this.nearbyRegneriket = undefined;
      this.hud.setNearbyRegneriket(undefined);
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

  private ensureSelectedPlayerToken(): void {
    if (!this.player) {
      return;
    }
    const token = getTokenById(this.progress.getSettings().tokenId);
    const targetKey = getPlayerTokenTextureKey(token.id);
    if (!this.textures.exists(targetKey)) {
      const sourceKey = getPlayerTokenSourceTextureKey(token.id);
      if (!this.textures.exists(sourceKey) && !this.load.isLoading()) {
        this.load.image(sourceKey, token.src);
        this.load.once('complete', () => {
          if (!this.sys.isActive()) {
            return;
          }
          this.createNormalizedPlayerTokenTextures();
          this.updatePlayerToken();
        });
        this.load.start();
      }
      return;
    }
    this.updatePlayerToken();
  }

  private ensureActiveMedalTexture(): void {
    if (!this.activeMap.showBossJourney) {
      return;
    }
    const medal = MEDALS.find((candidate) => candidate.id === this.progress.getActiveMedalId());
    if (!medal) {
      return;
    }
    const targetKey = getMedalTextureKey(medal.id);
    if (this.textures.exists(targetKey)) {
      return;
    }
    const sourceKey = getMedalSourceTextureKey(medal.id);
    if (this.load.isLoading()) {
      this.load.once('complete', () => {
        if (this.sys.isActive()) {
          this.ensureActiveMedalTexture();
        }
      });
      return;
    }
    if (!this.textures.exists(sourceKey)) {
      this.load.image(sourceKey, medal.src);
    }
    this.load.once('complete', () => {
      if (!this.sys.isActive()) {
        return;
      }
      this.createNormalizedMedalTextures();
      const normalizedKey = getMedalTextureKey(this.progress.getActiveMedalId());
      if (this.finalRewardMedal && this.textures.exists(normalizedKey)) {
        this.finalRewardMedal.setTexture(normalizedKey);
      }
    });
    this.load.start();
  }

  private ensureMapBossTexture(location: LocationNode, mood: 'idle' | 'defeated'): void {
    const targetKey = getMapBossTextureKey(location, mood);
    if (this.textures.exists(targetKey)) {
      return;
    }

    const sourceKey = getMapBossSourceTextureKey(location, mood);
    if (this.textures.exists(sourceKey)) {
      this.createNormalizedMapBossTexture(location, mood);
      this.refreshNodeViews();
      return;
    }

    if (this.load.isLoading()) {
      this.load.once('complete', () => {
        if (this.sys.isActive()) {
          this.ensureMapBossTexture(location, mood);
        }
      });
      return;
    }

    this.load.image(sourceKey, location.boss[mood]);
    this.load.once('complete', () => {
      if (!this.sys.isActive()) {
        return;
      }
      this.createNormalizedMapBossTexture(location, mood);
      this.refreshNodeViews();
    });
    this.load.start();
  }

  private updatePlayerToken(): void {
    if (!this.player) {
      return;
    }
    this.player.setTexture(this.getPlayerTextureKey());
    const tokenScale = getTokenMapScale(this.progress.getSettings().tokenId);
    const baseSize = this.activeMap.id === REGNEMONSTER_MAP_ID ? 84 : 132;
    this.player.setDisplaySize(baseSize * tokenScale, baseSize * tokenScale);
    this.player.setOrigin(0.5, 0.58);
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
