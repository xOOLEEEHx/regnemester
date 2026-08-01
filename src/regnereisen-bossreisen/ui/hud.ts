import { PageFlip } from 'page-flip';
import { LOCATIONS, type LocationNode } from '../game/content/locations';
import {
  CAMP_PARTS,
  CAMP_RESIDENT_ASSET_PATH,
  CAMP_RESIDENT_WAGON_ASSET_PATH,
  CAMP_WELCOME,
  getCampReward
} from '../game/content/campQuest';
import {
  COLLECTIBLE_CARDS,
  COLLECTIBLE_CARD_RARITIES,
  MYSTERY_PACK_COST,
  getCollectibleCardById
} from '../game/content/collectibleCards';
import {
  CRYSTAL_CART_QUEST_ID,
  CRYSTAL_CART_WELCOME
} from '../game/content/crystalCart';
import {
  FISH_TYPES,
  getFishInventoryCount,
  getFishInventoryValue
} from '../game/content/fishing';
import {
  GLADIATORS,
  GLADIATOR_ARENA_QUEST_ID,
  GLADIATOR_ARENA_WELCOME,
  LANISTA_ASSET_PATH
} from '../game/content/gladiatorArena';
import {
  GAME_MAPS,
  getGameMap,
  REGNEMONSTER_MAP_ID,
  REGNERIKET_MAP_ID,
  TALLVOKTER_MAP_ID,
  type GameMapId
} from '../game/content/maps';
import { getMedal, MEDALS, type MedalId } from '../game/content/medals';
import {
  BUTLER_ASSET_PATH,
  MANOR_QUEST_ID,
  MANOR_SPIDER_COUNT,
  MANOR_WELCOME
} from '../game/content/manorQuest';
import {
  ARCHIVE_QUEST_ID,
  ARCHIVE_SCROLL_COUNT,
  ARCHIVE_WELCOME,
  ARCHIVIST_ASSET_PATH
} from '../game/content/archiveQuest';
import {
  CRYSTAL_BRIDGE_CRYSTAL_COUNT,
  CRYSTAL_BRIDGE_GUARDIAN_ASSET_PATH,
  CRYSTAL_BRIDGE_QUEST_ID,
  CRYSTAL_BRIDGE_WELCOME
} from '../game/content/crystalBridgeQuest';
import {
  MINE_BOSS_ASSET_PATH,
  MINING_QUESTION_COUNT,
  MINING_QUEST_ID,
  MINING_RESOURCES,
  getMiningResource
} from '../game/content/mining';
import { getTokenById, PLAYER_TOKENS } from '../game/content/playerTokens';
import {
  PUZZLE_COLUMNS,
  PUZZLE_MASTER_ASSET_PATH,
  PUZZLE_PIECE_COUNT,
  PUZZLE_QUEST_ID,
  PUZZLE_QUEST_WELCOME
} from '../game/content/puzzleQuest';
import { REGNERIKET_STOPS, type RegneriketStop } from '../game/content/regneriket';
import { isTallvokterFxLevel, type TallvokterFxLevel } from '../game/content/tallvokterFx';
import {
  TALLVOKTER_FINALE_ASSETS,
  TALLVOKTER_FINALE_PHASES,
  getTallvokterFinaleReward
} from '../game/content/tallvokterFinale';
import { TALLVOKTER_QUESTS } from '../game/content/tallvokterQuests';
import { TALLVOKTER_THIEF_QUEST } from '../game/content/tallvokterThiefEncounter';
import {
  SWAMP_ALCHEMIST_ASSET_PATH,
  SWAMP_ALCHEMY_INGREDIENTS,
  SWAMP_ALCHEMY_QUEST_ID,
  SWAMP_ALCHEMY_WELCOME,
  type SwampIngredientId
} from '../game/content/swampAlchemy';
import {
  LIGHT_FOREST_AREAS,
  LIGHT_FOREST_NETWORK_ASSET_PATH,
  LIGHT_FOREST_QUEST_ID,
  LIGHT_FOREST_TOTAL_REQUIRED,
  LIGHT_FOREST_WELCOME,
  LIGHT_WEAVER_ASSET_PATH
} from '../game/content/lightForest';
import {
  COUNTERWEIGHT_VAULT_QUEST_ID,
  COUNTERWEIGHT_VAULT_WELCOME,
  VAULT_BACKGROUND_ASSET_PATH,
  VAULT_GUARDIAN_ASSET_PATH
} from '../game/content/counterweightVault';
import { MAZE_QUEST_ID, MAZE_WELCOME } from '../game/content/mazeQuest';
import { DIFFICULTY_OPTIONS, OPERATION_OPTIONS, type Difficulty, type OperationMode } from '../game/content/settings';
import { answerQuestion, createBattle, getBossAttackName, type BattleState } from '../game/simulation/battle';
import {
  answerMathQuestQuestion,
  createMathQuest,
  type MathQuestDefinition,
  type MathQuestState
} from '../game/simulation/mathQuest';
import {
  answerTallvokterFinale,
  createTallvokterFinale,
  type TallvokterFinaleState
} from '../game/simulation/tallvokterFinale';
import {
  answerGladiatorQuestion,
  continueGladiatorArena,
  createGladiatorArena,
  markGladiatorRewardPaid,
  startGladiatorArena,
  type GladiatorArenaState
} from '../game/simulation/gladiatorArena';
import {
  answerMiningQuestion,
  createMiningExpedition,
  markMiningRewardPaid,
  revealMiningCell,
  type MiningExpeditionState
} from '../game/simulation/miningExpedition';
import {
  answerManorQuestion,
  continueManorQuest,
  createManorQuest,
  markManorRewardPaid,
  startManorQuest,
  startManorSpiderChallenge,
  type ManorQuestState
} from '../game/simulation/manorQuest';
import {
  createArchiveQuest,
  markArchiveRewardPaid,
  sortArchiveScroll,
  startArchiveQuest,
  type ArchiveQuestState
} from '../game/simulation/archiveQuest';
import {
  createCrystalBridgeQuest,
  markCrystalBridgeRewardPaid,
  placeBridgeCrystal,
  startCrystalBridgeQuest,
  type CrystalBridgeQuestState
} from '../game/simulation/crystalBridgeQuest';
import {
  answerPuzzleQuestion,
  createPuzzleQuest,
  markPuzzleRewardPaid,
  solvePuzzleForDev,
  startPuzzleQuest,
  swapPuzzlePieces,
  type PuzzleQuestState
} from '../game/simulation/puzzleQuest';
import type { ProgressStore, RewardResult } from '../game/simulation/progress';
import {
  advanceRegnemonsterRound,
  answerRegnemonsterRound,
  createRegnemonsterRound,
  getRegnemonsterFeedbackDuration,
  getCurrentRegnemonsterQuestion,
  REGNEMONSTER_ROUND_LIFE_COUNT,
  REGNEMONSTER_ROUND_QUESTION_COUNT,
  type RegnemonsterRoundSetup,
  type RegnemonsterRoundState
} from '../game/simulation/regnemonsterRound';
import {
  getRegnemonsterCardById,
  type RegnemonsterCardDefinition,
  type RegnemonsterSetId
} from '../game/content/regnemonsterCards';
import {
  buildRegnemonsterBinderPages,
  getRegnemonsterBinderSetSummary,
  REGNEMONSTER_BINDER_CARDS_PER_PAGE
} from '../game/simulation/regnemonsterBinder';
import { getRegnemonsterBinderTargetPage } from '../game/simulation/regnemonsterBinderNavigation';
import {
  beginRegnemonsterRewardReveal,
  completeRegnemonsterRewardReveal,
  createRegnemonsterRewardReveal,
  getRegnemonsterRewardFrameAspectRatio,
  type RegnemonsterRewardRevealState
} from '../game/simulation/regnemonsterRewardReveal';
import {
  answerMazeQuestion,
  continueAfterGate,
  createMazeQuest,
  getVisibleMazeCells,
  markMazeRewardPaid,
  moveInMaze,
  startMazeQuest,
  type MazeDirection,
  type MazeQuestState
} from '../game/simulation/mazeQuest';

type HudElementRoot = Document | ShadowRoot;

let hudElementRoot: HudElementRoot = document;

export function setHudElementRoot(root: HudElementRoot): void {
  hudElementRoot = root;
}

function getHudOverlayRoot(): HTMLElement | ShadowRoot {
  return hudElementRoot instanceof ShadowRoot
    ? hudElementRoot
    : hudElementRoot.body;
}

const PHONE_VIEWPORT_MAX_SHORT_SIDE = 620;

function isPhoneViewport(): boolean {
  return window.matchMedia('(pointer: coarse)').matches
    && Math.min(window.innerWidth, window.innerHeight) <= PHONE_VIEWPORT_MAX_SHORT_SIDE;
}

type WorldHooks = {
  startBattle: () => void;
  resetProgress: () => void;
  resetPlayerToProgress: () => void;
  resetInput: () => void;
  setTallvokterFxLevel: (level: TallvokterFxLevel) => void;
};

type BattleMood = 'idle' | 'hurt' | 'hurt2' | 'attack' | 'low' | 'defeated';

type PendingMapSettings = {
  mapId: GameMapId;
  operationMode: OperationMode;
  difficulty: Difficulty;
};

type NearbyPortalInfo = {
  title: string;
  description: string;
  actionLabel?: string;
};

type CampDialogMode = 'intro' | 'progress' | 'reward' | 'paid';

export type MathQuestUiOptions = {
  mapLabel: string;
  kindLabel: string;
  onWin: () => void;
  onLose?: () => void;
  successToast?: string | false;
  allowRetry?: boolean;
  allowExit?: boolean;
  regnecoinRewardAnimation?: number;
};

export type CrystalCartRideView = {
  checkpoint: number;
  completedCheckpoints: number;
  checkpointCount: number;
  playerHp: number;
  maxPlayerHp: number;
  prompt: string;
  choices: number[];
  message: string;
  inputLocked: boolean;
};

export type SwampAlchemyHudView = {
  phase: 'quiz' | 'ingredient' | 'stirring';
  roundIndex: number;
  roundCount: number;
  completedIngredients: SwampIngredientId[];
  playerHp: number;
  maxPlayerHp: number;
  ingredientId: SwampIngredientId;
  ingredientName: string;
  ingredientAssetPath: string;
  roundCorrect: number;
  requiredCorrect: number;
  prompt: string;
  choices: number[];
  message: string;
  inputLocked: boolean;
};

export type LightForestHudView = {
  phase: 'question' | 'correct' | 'wrong' | 'network' | 'tree-awakening';
  areaName: string;
  areaIndex: number;
  totalCorrect: number;
  playerHp: number;
  maxPlayerHp: number;
  prompt: string;
  message: string;
  inputLocked: boolean;
};

const MAZE_DIRECTION_BY_KEY: Partial<Record<string, MazeDirection>> = {
  ArrowUp: 'up',
  w: 'up',
  W: 'up',
  ArrowRight: 'right',
  d: 'right',
  D: 'right',
  ArrowDown: 'down',
  s: 'down',
  S: 'down',
  ArrowLeft: 'left',
  a: 'left',
  A: 'left'
};

const MAZE_VIEWPORT_SIZE = 5;
const MAZE_PLAYER_RADIUS = 0.2;
const MAZE_TOKEN_SCALE = 0.78;
const MAZE_KEYBOARD_SPEED_PX_PER_MS = 0.28;
const MAZE_POINTER_SPEED_PX_PER_MS = 0.24;
const MAZE_JOYSTICK_SPEED_PX_PER_MS = 0.26;

type MazePointerControl = {
  pointerId: number;
  mode: 'target' | 'joystick';
  originX: number;
  originY: number;
  currentX: number;
  currentY: number;
  targetX: number;
  targetY: number;
};

type ShopSection = 'tokens' | 'cards';
type CollectionSection = 'medals' | 'cards';

type CrystalBridgeSceneLayout = {
  sockets: Array<[number, number]>;
  answers: { x: number; y: number };
};

type CrystalBridgeLayoutPointer = {
  id: number;
  target: HTMLElement;
  kind: 'socket' | 'answers';
  index?: number;
  offsetX: number;
  offsetY: number;
};

const CRYSTAL_BRIDGE_LAYOUT_STORAGE_KEY = 'regnemester-crystal-bridge-layout-v2';
const DEFAULT_CRYSTAL_BRIDGE_SOCKET_POSITIONS: Array<[number, number]> = [
  [38.2, 36.5], [34.3, 43.9], [30, 52.4], [23.4, 65.6],
  [61.8, 36.5], [65.7, 43.9], [70, 52.4], [76.6, 65.6]
];
const DEFAULT_CRYSTAL_BRIDGE_ANSWER_POSITION = { x: 50, y: 84 };

export class HudController {
  private hooks?: WorldHooks;
  private nearby?: LocationNode;
  private battle?: BattleState;
  private quest?: MathQuestState;
  private winCallback?: () => void;
  private questWinCallback?: () => void;
  private questLoseCallback?: () => void;
  private questRetryCallback?: () => void;
  private questMapLabel = 'Regneriket';
  private questKindLabel = 'Oppdrag';
  private questExitLocked = false;
  private questRegnecoinRewardAnimation = 0;
  private tallvokterFinale?: TallvokterFinaleState;
  private tallvokterFinaleMode: 'intro' | 'battle' | 'ending' | 'paid' = 'intro';
  private tallvokterFinaleInputLocked = false;
  private tallvokterFinaleTimer?: number;
  private thiefLossEndingActive = false;
  private thiefLossContinueCallback?: () => void;
  private questSuccessToast: string | false = 'Oppdrag fullført! Hent mynten på kartet.';
  private toastTimer?: number;
  private battleEffectTimer?: number;
  private battleSecondFrameTimer?: number;
  private questEffectTimer?: number;
  private battleInputLocked = false;
  private questInputLocked = false;
  private storyModeRestartPending = false;
  private startManuallyOpened = false;
  private shopSection: ShopSection = 'tokens';
  private collectionSection: CollectionSection = 'medals';
  private previewTokenId?: string;
  private previewTokenSource: 'picker' | 'shop' = 'picker';
  private unlockConfirmCallback?: () => void;
  private unlockConfirmDismissible = true;
  private pendingMapSettings?: PendingMapSettings;
  private lastNearbyActionAt = 0;
  private worldReady = false;
  private fishingSaleInProgress = false;
  private fishingSaleConfirmation = '';
  private regnemonsterSetup?: RegnemonsterRoundSetup;
  private regnemonsterRound?: RegnemonsterRoundState;
  private regnemonsterFeedbackTimer?: number;
  private regnemonsterRewardReveal?: RegnemonsterRewardRevealState;
  private regnemonsterRewardTimer?: number;
  private regnemonsterBinderSet: RegnemonsterSetId = 'set1';
  private regnemonsterBinderPageFlip?: PageFlip;
  private regnemonsterBinderPhonePage = 0;
  private miningExpedition?: MiningExpeditionState;
  private miningInputLocked = false;
  private miningDrillTimer?: number;
  private miningFeedbackTimer?: number;
  private gladiatorArena?: GladiatorArenaState;
  private gladiatorArenaInputLocked = false;
  private gladiatorArenaFeedbackTimer?: number;
  private mazeQuest?: MazeQuestState;
  private mazeMotionFrame?: number;
  private mazeLastMotionAt?: number;
  private mazeHeldDirections: MazeDirection[] = [];
  private mazePointerControl?: MazePointerControl;
  private mazePlayerX?: number;
  private mazePlayerY?: number;
  private mazeCameraX?: number;
  private mazeCameraY?: number;
  private mazeRevealedCells = new Set<number>();
  private mazeGridTrack?: HTMLDivElement;
  private mazeCellButtons: HTMLButtonElement[] = [];
  private mazePlayerToken?: HTMLImageElement;
  private mazeCellPixelSize = 0;
  private mazeReturnScroll?: Array<{ element: HTMLElement; left: number; top: number }>;
  private manorQuest?: ManorQuestState;
  private manorInputLocked = false;
  private manorFeedbackTimer?: number;
  private manorSpiderAnimation?: Animation;
  private manorAnimatedSpiderIndex?: number;
  private manorCapturedSpiderPosition?: { x: number; y: number };
  private manorReturnScroll?: Array<{ element: HTMLElement; left: number; top: number }>;
  private archiveQuest?: ArchiveQuestState;
  private archiveInputLocked = false;
  private archiveFeedbackTimer?: number;
  private archivePointer?: { id: number; offsetX: number; offsetY: number };
  private crystalBridgeQuest?: CrystalBridgeQuestState;
  private crystalBridgeInputLocked = false;
  private crystalBridgeFeedbackTimer?: number;
  private crystalBridgePointer?: {
    id: number;
    element: HTMLButtonElement;
    startClientX: number;
    startClientY: number;
  };
  private crystalBridgeEditMode = false;
  private crystalBridgeLayout: CrystalBridgeSceneLayout = {
    sockets: DEFAULT_CRYSTAL_BRIDGE_SOCKET_POSITIONS.map(([x, y]) => [x, y]),
    answers: { ...DEFAULT_CRYSTAL_BRIDGE_ANSWER_POSITION }
  };
  private crystalBridgeLayoutPointer?: CrystalBridgeLayoutPointer;
  private crystalBridgeEditButton?: HTMLButtonElement;
  private puzzleQuest?: PuzzleQuestState;
  private puzzleInputLocked = false;
  private puzzleFeedbackTimer?: number;
  private puzzlePreviewTimer?: number;
  private puzzleSelectedSlot?: number;
  private puzzleDraggedSlot?: number;
  private campDialogMode: CampDialogMode = 'intro';
  private campCollectedCount = 0;
  private campStartCallback?: () => void;
  private campPaymentInProgress = false;
  private crystalCartStoryPrimaryCallback?: () => void;
  private crystalCartStoryCancelCallback?: () => void;
  private crystalCartChoiceCallback?: (answer: number) => void;
  private crystalCartExitCallback?: () => void;
  private crystalCartTestCallback?: () => void;
  private swampAlchemyStoryPrimaryCallback?: () => void;
  private swampAlchemyStoryCancelCallback?: () => void;
  private swampAlchemyChoiceCallback?: (answer: number) => void;
  private swampAlchemyExitCallback?: () => void;
  private swampAlchemyTestCallback?: () => void;
  private lightForestStoryPrimaryCallback?: () => void;
  private lightForestStoryCancelCallback?: () => void;
  private lightForestExitCallback?: () => void;
  private lightForestTestCallback?: () => void;
  private readonly handleProgressChange = (): void => {
    this.renderProgress();
    this.renderBackpack();
    this.renderFishingSale();
    this.renderStartControls();
    this.renderPrizeBox();
    this.renderMedalCabinet();
    if (!this.regnemonsterBinderModal.classList.contains('is-hidden')) {
      this.renderRegnemonsterBinder();
    }
    this.syncStartVisibility();
  };
  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      this.closeResetConfirm();
      this.closePrizeBox();
      this.closeBackpack();
      this.closeFishingSale();
      this.closeMedalCabinet();
      this.closeReward();
      this.closeTokenPicker();
      this.closeShop();
      this.closeTokenPreview();
      this.closeQuest();
      this.closeGladiatorArena();
      this.closeMazeQuest();
      this.closeManorQuest();
      this.closeCrystalBridgeQuest();
      this.closePuzzleQuest();
      this.closeTallvokterFinale();
      this.closeCampDialog();
      this.cancelCrystalCartStory();
      this.cancelSwampAlchemyStory();
      this.cancelLightForestStory();
      this.closeRegnemonsterGame();
      this.closeRegnemonsterBinder();
      this.closeStoryConfirm();
      this.closeMapSettings();
      this.closeUnlockConfirm();
    }
    if (!this.regnemonsterBinderModal.classList.contains('is-hidden')) {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        this.flipRegnemonsterBinder(-1);
        return;
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        this.flipRegnemonsterBinder(1);
        return;
      }
    }
    if (!this.collectionCardPreview.classList.contains('is-hidden')) {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        this.showAdjacentCollectionCard(-1);
        return;
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        this.showAdjacentCollectionCard(1);
        return;
      }
    }
    if (!this.mazeModal.classList.contains('is-hidden') && this.mazeQuest?.phase === 'maze') {
      const direction = MAZE_DIRECTION_BY_KEY[event.key];
      if (direction) {
        event.preventDefault();
        if (!event.repeat) this.startMazeMovement(direction);
      }
    }
  };
  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    const direction = MAZE_DIRECTION_BY_KEY[event.key];
    if (!direction) return;
    if (!this.mazeModal.classList.contains('is-hidden')) event.preventDefault();
    this.stopMazeMovement(direction);
  };
  private readonly handleWindowBlur = (): void => this.stopAllMazeInput();
  private readonly handleMazePointerDown = (event: PointerEvent): void => {
    if (event.button !== 0 || this.mazeQuest?.phase !== 'maze') return;
    event.preventDefault();
    this.mazeGrid.setPointerCapture(event.pointerId);
    const joystick = event.pointerType === 'touch' || event.pointerType === 'pen';
    this.mazePointerControl = {
      pointerId: event.pointerId,
      mode: joystick ? 'joystick' : 'target',
      originX: event.clientX,
      originY: event.clientY,
      currentX: event.clientX,
      currentY: event.clientY,
      targetX: 0,
      targetY: 0
    };
    this.updateMazePointerTarget(event.clientX, event.clientY);
    this.ensureMazeMotionLoop();
  };
  private readonly handleMazePointerMove = (event: PointerEvent): void => {
    if (this.mazePointerControl?.pointerId !== event.pointerId) return;
    event.preventDefault();
    this.mazePointerControl.currentX = event.clientX;
    this.mazePointerControl.currentY = event.clientY;
    this.updateMazePointerTarget(event.clientX, event.clientY);
  };
  private readonly handleMazePointerEnd = (event: PointerEvent): void => {
    if (this.mazePointerControl?.pointerId !== event.pointerId) return;
    this.mazePointerControl = undefined;
    this.stopMazeMotionLoopIfIdle();
  };
  private battleTouchGesture?: {
    identifier: number;
    startX: number;
    startY: number;
    moved: boolean;
    button: HTMLButtonElement;
  };
  private readonly passiveTouchOptions: AddEventListenerOptions = { passive: true };
  private readonly activeTouchOptions: AddEventListenerOptions = { passive: false };
  private readonly handleBattleTouchStart = (event: TouchEvent): void => {
    if (!window.matchMedia('(max-width: 600px)').matches || event.touches.length !== 1) {
      return;
    }

    const target = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('button') : null;
    const touch = event.changedTouches.item(0);
    if (!target || !touch || !this.choiceGrid.contains(target) || target.disabled) {
      return;
    }

    this.battleTouchGesture = {
      identifier: touch.identifier,
      startX: touch.clientX,
      startY: touch.clientY,
      moved: false,
      button: target
    };
  };
  private readonly handleBattleTouchMove = (event: TouchEvent): void => {
    if (!this.battleTouchGesture) {
      return;
    }

    const touch = this.findTouch(event.touches, this.battleTouchGesture.identifier);
    if (!touch) {
      return;
    }

    if (Math.hypot(
      touch.clientX - this.battleTouchGesture.startX,
      touch.clientY - this.battleTouchGesture.startY
    ) > 10) {
      this.battleTouchGesture.moved = true;
    }
  };
  private readonly handleBattleTouchEnd = (event: TouchEvent): void => {
    const gesture = this.battleTouchGesture;
    if (!gesture || !this.findTouch(event.changedTouches, gesture.identifier)) {
      return;
    }

    this.battleTouchGesture = undefined;
    if (gesture.moved || gesture.button.disabled || !gesture.button.isConnected) {
      return;
    }

    event.preventDefault();
    gesture.button.click();
  };
  private readonly handleBattleTouchCancel = (): void => {
    this.battleTouchGesture = undefined;
  };

  private readonly hudRoot = requireElement<HTMLElement>('hud');
  private readonly loadingScreen = requireElement<HTMLElement>('loading-screen');
  private readonly loadingBarFill = requireElement<HTMLElement>('loading-bar-fill');
  private readonly loadingProgress = requireElement<HTMLSpanElement>('loading-progress');
  private readonly startGameButton = requireElement<HTMLButtonElement>('start-game');
  private readonly objective = requireElement<HTMLDivElement>('objective');
  private readonly nearbyCard = requireElement<HTMLDivElement>('nearby-card');
  private readonly progressStrip = requireElement<HTMLDivElement>('progress-strip');
  private readonly coinCounterButton = requireElement<HTMLButtonElement>('open-prize-box');
  private readonly coinCount = requireElement<HTMLSpanElement>('coin-count');
  private readonly backpackButton = requireElement<HTMLButtonElement>('open-backpack');
  private readonly backpackModal = requireElement<HTMLElement>('backpack-modal');
  private readonly backpackRegnecoinCount = requireElement<HTMLSpanElement>('backpack-regnecoin-count');
  private readonly fishBucketToggle = requireElement<HTMLButtonElement>('toggle-fish-bucket');
  private readonly fishBucketContent = requireElement<HTMLDivElement>('fish-bucket-content');
  private readonly backpackFishList = requireElement<HTMLDivElement>('backpack-fish-list');
  private readonly backpackDevActions = requireElement<HTMLDivElement>('backpack-dev-actions');
  private readonly fishingSaleModal = requireElement<HTMLElement>('fishing-sale-modal');
  private readonly fishingSaleList = requireElement<HTMLDivElement>('fishing-sale-list');
  private readonly fishingSaleTotal = requireElement<HTMLElement>('fishing-sale-total');
  private readonly fishingSaleMessage = requireElement<HTMLParagraphElement>('fishing-sale-message');
  private readonly sellAllFishButton = requireElement<HTMLButtonElement>('sell-all-fish');
  private readonly crystalCartStoryModal = requireElement<HTMLElement>('crystal-cart-story-modal');
  private readonly crystalCartStoryKicker = requireElement<HTMLElement>('crystal-cart-story-kicker');
  private readonly crystalCartStoryTitle = requireElement<HTMLElement>('crystal-cart-story-title');
  private readonly crystalCartStoryMessage = requireElement<HTMLElement>('crystal-cart-story-message');
  private readonly crystalCartStoryRules = requireElement<HTMLElement>('crystal-cart-story-rules');
  private readonly crystalCartStoryReward = requireElement<HTMLElement>('crystal-cart-story-reward');
  private readonly crystalCartRewardValue = requireElement<HTMLElement>('crystal-cart-reward-value');
  private readonly crystalCartStoryPrimary = requireElement<HTMLButtonElement>('crystal-cart-story-primary');
  private readonly closeCrystalCartStoryButton = requireElement<HTMLButtonElement>('close-crystal-cart-story');
  private readonly crystalCartRideHud = requireElement<HTMLElement>('crystal-cart-ride-hud');
  private readonly crystalCartCheckpointLabel = requireElement<HTMLElement>('crystal-cart-checkpoint-label');
  private readonly crystalCartProgress = requireElement<HTMLElement>('crystal-cart-progress');
  private readonly crystalCartHearts = requireElement<HTMLElement>('crystal-cart-hearts');
  private readonly crystalCartQuestion = requireElement<HTMLElement>('crystal-cart-question');
  private readonly crystalCartChoices = requireElement<HTMLElement>('crystal-cart-choices');
  private readonly crystalCartMessage = requireElement<HTMLElement>('crystal-cart-message');
  private readonly crystalCartDevActions = requireElement<HTMLElement>('crystal-cart-dev-actions');
  private readonly leaveCrystalCartButton = requireElement<HTMLButtonElement>('leave-crystal-cart');
  private readonly swampAlchemyStoryModal = requireElement<HTMLElement>('swamp-alchemy-story-modal');
  private readonly swampAlchemyStoryPanel = requireElement<HTMLElement>('swamp-alchemy-story-panel');
  private readonly swampAlchemyStoryKicker = requireElement<HTMLElement>('swamp-alchemy-story-kicker');
  private readonly swampAlchemyStoryTitle = requireElement<HTMLElement>('swamp-alchemy-story-title');
  private readonly swampAlchemyStoryMessage = requireElement<HTMLElement>('swamp-alchemy-story-message');
  private readonly swampAlchemyStoryRules = requireElement<HTMLElement>('swamp-alchemy-story-rules');
  private readonly swampAlchemyStoryReward = requireElement<HTMLElement>('swamp-alchemy-story-reward');
  private readonly swampAlchemyRewardValue = requireElement<HTMLElement>('swamp-alchemy-reward-value');
  private readonly swampAlchemyStoryPrimary = requireElement<HTMLButtonElement>('swamp-alchemy-story-primary');
  private readonly closeSwampAlchemyStoryButton = requireElement<HTMLButtonElement>('close-swamp-alchemy-story');
  private readonly swampAlchemyHud = requireElement<HTMLElement>('swamp-alchemy-hud');
  private readonly swampAlchemyRoundLabel = requireElement<HTMLElement>('swamp-alchemy-round-label');
  private readonly swampAlchemyIngredientTrack = requireElement<HTMLElement>('swamp-alchemy-ingredient-track');
  private readonly swampAlchemyHearts = requireElement<HTMLElement>('swamp-alchemy-hearts');
  private readonly leaveSwampAlchemyButton = requireElement<HTMLButtonElement>('leave-swamp-alchemy');
  private readonly swampAlchemyQuizPanel = requireElement<HTMLElement>('swamp-alchemy-quiz-panel');
  private readonly swampAlchemyIngredientIcon = requireElement<HTMLImageElement>('swamp-alchemy-ingredient-icon');
  private readonly swampAlchemyIngredientName = requireElement<HTMLElement>('swamp-alchemy-ingredient-name');
  private readonly swampAlchemyQuestionProgress = requireElement<HTMLElement>('swamp-alchemy-question-progress');
  private readonly swampAlchemyQuestion = requireElement<HTMLElement>('swamp-alchemy-question');
  private readonly swampAlchemyChoices = requireElement<HTMLElement>('swamp-alchemy-choices');
  private readonly swampAlchemyMessage = requireElement<HTMLElement>('swamp-alchemy-message');
  private readonly swampAlchemyDevActions = requireElement<HTMLElement>('swamp-alchemy-dev-actions');
  private readonly swampAlchemyActionHint = requireElement<HTMLElement>('swamp-alchemy-action-hint');
  private readonly lightForestStoryModal = requireElement<HTMLElement>('light-forest-story-modal');
  private readonly lightForestStoryKicker = requireElement<HTMLElement>('light-forest-story-kicker');
  private readonly lightForestStoryTitle = requireElement<HTMLElement>('light-forest-story-title');
  private readonly lightForestStoryMessage = requireElement<HTMLElement>('light-forest-story-message');
  private readonly lightForestStoryRules = requireElement<HTMLElement>('light-forest-story-rules');
  private readonly lightForestStoryReward = requireElement<HTMLElement>('light-forest-story-reward');
  private readonly lightForestRewardValue = requireElement<HTMLElement>('light-forest-reward-value');
  private readonly lightForestStoryPrimary = requireElement<HTMLButtonElement>('light-forest-story-primary');
  private readonly closeLightForestStoryButton = requireElement<HTMLButtonElement>('close-light-forest-story');
  private readonly lightForestQuestionCard = requireElement<HTMLElement>('light-forest-question-card');
  private readonly lightForestHud = requireElement<HTMLElement>('light-forest-hud');
  private readonly lightForestAreaLabel = requireElement<HTMLElement>('light-forest-area-label');
  private readonly lightForestProgress = requireElement<HTMLElement>('light-forest-progress');
  private readonly lightForestHearts = requireElement<HTMLElement>('light-forest-hearts');
  private readonly lightForestQuestion = requireElement<HTMLElement>('light-forest-question');
  private readonly lightForestMessage = requireElement<HTMLElement>('light-forest-message');
  private readonly lightForestDevActions = requireElement<HTMLElement>('light-forest-dev-actions');
  private readonly leaveLightForestButton = requireElement<HTMLButtonElement>('leave-light-forest');
  private readonly regnemonsterGameModal = requireElement<HTMLElement>('regnemonster-game-modal');
  private readonly regnemonsterGamePanel = requireElement<HTMLElement>('regnemonster-game-panel');
  private readonly regnemonsterSetupView = requireElement<HTMLElement>('regnemonster-setup-view');
  private readonly regnemonsterRoundView = requireElement<HTMLElement>('regnemonster-round-view');
  private readonly regnemonsterCompleteView = requireElement<HTMLElement>('regnemonster-complete-view');
  private readonly regnemonsterOperationPicker = requireElement<HTMLElement>('regnemonster-operation-picker');
  private readonly regnemonsterDifficultyPicker = requireElement<HTMLElement>('regnemonster-difficulty-picker');
  private readonly regnemonsterQuestionProgress = requireElement<HTMLElement>('regnemonster-question-progress');
  private readonly regnemonsterLives = requireElement<HTMLElement>('regnemonster-lives');
  private readonly regnemonsterScore = requireElement<HTMLElement>('regnemonster-score');
  private readonly regnemonsterProgressFill = requireElement<HTMLElement>('regnemonster-progress-fill');
  private readonly regnemonsterQuestion = requireElement<HTMLElement>('regnemonster-question');
  private readonly regnemonsterChoices = requireElement<HTMLElement>('regnemonster-choices');
  private readonly regnemonsterFeedback = requireElement<HTMLElement>('regnemonster-feedback');
  private readonly regnemonsterCompleteTitle = requireElement<HTMLElement>('regnemonster-complete-title');
  private readonly regnemonsterCompleteScore = requireElement<HTMLElement>('regnemonster-complete-score');
  private readonly regnemonsterRewardCard = requireElement<HTMLButtonElement>('regnemonster-reward-card');
  private readonly regnemonsterRewardBack = requireElement<HTMLImageElement>('regnemonster-reward-back');
  private readonly regnemonsterRewardFront = requireElement<HTMLImageElement>('regnemonster-reward-front');
  private readonly regnemonsterRewardPrompt = requireElement<HTMLElement>('regnemonster-reward-prompt');
  private readonly regnemonsterRewardResult = requireElement<HTMLElement>('regnemonster-reward-result');
  private readonly regnemonsterCompleteActions = requireElement<HTMLElement>('regnemonster-complete-actions');
  private readonly regnemonsterBinderModal = requireElement<HTMLElement>('regnemonster-binder-modal');
  private readonly regnemonsterBinderBook = requireElement<HTMLElement>('regnemonster-binder-book');
  private readonly regnemonsterBinderSummary = requireElement<HTMLElement>('regnemonster-binder-summary');
  private readonly regnemonsterBinderPageStatus = requireElement<HTMLElement>('regnemonster-binder-page-status');
  private readonly regnemonsterBinderPrevious = requireElement<HTMLButtonElement>('regnemonster-binder-previous');
  private readonly regnemonsterBinderNext = requireElement<HTMLButtonElement>('regnemonster-binder-next');
  private readonly regnemonsterBinderTabSet1 = requireElement<HTMLButtonElement>('regnemonster-binder-tab-set1');
  private readonly regnemonsterBinderTabSpecial = requireElement<HTMLButtonElement>('regnemonster-binder-tab-special');
  private readonly regnemonsterBinderPreview = requireElement<HTMLElement>('regnemonster-binder-preview');
  private readonly regnemonsterBinderPreviewImage =
    requireElement<HTMLImageElement>('regnemonster-binder-preview-image');
  private readonly regnemonsterBinderPreviewTitle =
    requireElement<HTMLElement>('regnemonster-binder-preview-title');
  private readonly regnemonsterBinderPreviewCount =
    requireElement<HTMLElement>('regnemonster-binder-preview-count');
  private readonly miningModal = requireElement<HTMLElement>('mining-modal');
  private readonly miningPanel = requireElement<HTMLDivElement>('mining-modal').querySelector<HTMLDivElement>('.mining-panel')!;
  private readonly miningPhaseLabel = requireElement<HTMLSpanElement>('mining-phase-label');
  private readonly miningQuizView = requireElement<HTMLDivElement>('mining-quiz-view');
  private readonly miningQuestionProgress = requireElement<HTMLElement>('mining-question-progress');
  private readonly miningDrillCount = requireElement<HTMLElement>('mining-drill-count');
  private readonly miningQuestionText = requireElement<HTMLParagraphElement>('mining-question-text');
  private readonly miningChoiceGrid = requireElement<HTMLDivElement>('mining-choice-grid');
  private readonly miningMessage = requireElement<HTMLParagraphElement>('mining-message');
  private readonly miningDevActions = requireElement<HTMLDivElement>('mining-dev-actions');
  private readonly miningDigView = requireElement<HTMLDivElement>('mining-dig-view');
  private readonly miningDrillsRemaining = requireElement<HTMLElement>('mining-drills-remaining');
  private readonly miningDigMessage = requireElement<HTMLParagraphElement>('mining-dig-message');
  private readonly miningCurrentValue = requireElement<HTMLElement>('mining-current-value');
  private readonly miningGrid = requireElement<HTMLDivElement>('mining-grid');
  private readonly miningHaul = requireElement<HTMLDivElement>('mining-haul');
  private readonly miningRewardView = requireElement<HTMLDivElement>('mining-reward-view');
  private readonly miningRewardSummary = requireElement<HTMLDivElement>('mining-reward-summary');
  private readonly miningRewardValue = requireElement<HTMLSpanElement>('mining-reward-value');
  private readonly miningRewardMessage = requireElement<HTMLParagraphElement>('mining-reward-message');
  private readonly claimMiningRewardButton = requireElement<HTMLButtonElement>('claim-mining-reward');
  private readonly leaveMiningButton = requireElement<HTMLButtonElement>('leave-mining');
  private readonly gladiatorArenaModal = requireElement<HTMLElement>('gladiator-arena-modal');
  private readonly mazeModal = requireElement<HTMLElement>('maze-modal');
  private readonly mazePanel = requireElement<HTMLElement>('maze-panel');
  private readonly mazePhase = requireElement<HTMLElement>('maze-phase');
  private readonly mazeStory = requireElement<HTMLElement>('maze-story');
  private readonly mazeStoryTitle = requireElement<HTMLElement>('maze-story-title');
  private readonly mazeStoryMessage = requireElement<HTMLElement>('maze-story-message');
  private readonly mazeStoryEmblem = requireElement<HTMLElement>('maze-story-emblem');
  private readonly mazeStoryRules = requireElement<HTMLElement>('maze-story-rules');
  private readonly mazeReward = requireElement<HTMLElement>('maze-reward');
  private readonly mazeRewardValue = requireElement<HTMLElement>('maze-reward-value');
  private readonly mazePrimary = requireElement<HTMLButtonElement>('maze-primary');
  private readonly mazePlay = requireElement<HTMLElement>('maze-play');
  private readonly mazeGrid = requireElement<HTMLElement>('maze-grid');
  private readonly mazeSeals = requireElement<HTMLElement>('maze-seals');
  private readonly mazeHearts = requireElement<HTMLElement>('maze-hearts');
  private readonly mazeMessage = requireElement<HTMLElement>('maze-message');
  private readonly mazeChallenge = requireElement<HTMLElement>('maze-challenge');
  private readonly mazeGateLabel = requireElement<HTMLElement>('maze-gate-label');
  private readonly mazeGateNumber = requireElement<HTMLElement>('maze-gate-number');
  private readonly mazeChallengeHearts = requireElement<HTMLElement>('maze-challenge-hearts');
  private readonly mazeQuestionProgress = requireElement<HTMLElement>('maze-question-progress');
  private readonly mazeQuestion = requireElement<HTMLElement>('maze-question');
  private readonly mazeChoices = requireElement<HTMLElement>('maze-choices');
  private readonly mazeChallengeMessage = requireElement<HTMLElement>('maze-challenge-message');
  private readonly mazeDevActions = requireElement<HTMLElement>('maze-dev-actions');
  private mazeTestVictoryButton?: HTMLButtonElement;
  private readonly gladiatorArenaPanel = requireElement<HTMLDivElement>('gladiator-arena-panel');
  private readonly gladiatorArenaPhase = requireElement<HTMLSpanElement>('gladiator-arena-phase');
  private readonly leaveGladiatorArenaButton = requireElement<HTMLButtonElement>('leave-gladiator-arena');
  private readonly gladiatorArenaCharacter = requireElement<HTMLImageElement>('gladiator-arena-character');
  private readonly gladiatorArenaCharacterKicker = requireElement<HTMLParagraphElement>('gladiator-arena-character-kicker');
  private readonly gladiatorArenaCharacterName = requireElement<HTMLHeadingElement>('gladiator-arena-character-name');
  private readonly gladiatorArenaCharacterCopy = requireElement<HTMLParagraphElement>('gladiator-arena-character-copy');
  private readonly gladiatorArenaStoryView = requireElement<HTMLDivElement>('gladiator-arena-story-view');
  private readonly gladiatorArenaStoryKicker = requireElement<HTMLParagraphElement>('gladiator-arena-story-kicker');
  private readonly gladiatorArenaStoryTitle = requireElement<HTMLHeadingElement>('gladiator-arena-story-title');
  private readonly gladiatorArenaStoryMessage = requireElement<HTMLParagraphElement>('gladiator-arena-story-message');
  private readonly gladiatorArenaReward = requireElement<HTMLDivElement>('gladiator-arena-reward');
  private readonly gladiatorArenaRewardValue = requireElement<HTMLSpanElement>('gladiator-arena-reward-value');
  private readonly gladiatorArenaPrimaryButton = requireElement<HTMLButtonElement>('gladiator-arena-primary');
  private readonly gladiatorArenaFightView = requireElement<HTMLDivElement>('gladiator-arena-fight-view');
  private readonly gladiatorArenaStageCount = requireElement<HTMLElement>('gladiator-arena-stage-count');
  private readonly gladiatorArenaHearts = requireElement<HTMLDivElement>('gladiator-arena-hearts');
  private readonly gladiatorArenaProgress = requireElement<HTMLDivElement>('gladiator-arena-progress');
  private readonly gladiatorArenaQuestion = requireElement<HTMLParagraphElement>('gladiator-arena-question');
  private readonly gladiatorArenaChoices = requireElement<HTMLDivElement>('gladiator-arena-choices');
  private readonly gladiatorArenaMessage = requireElement<HTMLParagraphElement>('gladiator-arena-message');
  private readonly gladiatorArenaDevActions = requireElement<HTMLDivElement>('gladiator-arena-dev-actions');
  private gladiatorArenaTestVictoryButton?: HTMLButtonElement;
  private readonly manorModal = requireElement<HTMLElement>('manor-modal');
  private readonly manorPanel = requireElement<HTMLElement>('manor-panel');
  private readonly manorPhase = requireElement<HTMLElement>('manor-phase');
  private readonly leaveManorButton = requireElement<HTMLButtonElement>('leave-manor');
  private readonly manorStoryView = requireElement<HTMLElement>('manor-story-view');
  private readonly manorStoryKicker = requireElement<HTMLElement>('manor-story-kicker');
  private readonly manorStoryTitle = requireElement<HTMLElement>('manor-story-title');
  private readonly manorStoryMessage = requireElement<HTMLElement>('manor-story-message');
  private readonly manorStoryRules = requireElement<HTMLElement>('manor-story-rules');
  private readonly manorStoryReward = requireElement<HTMLElement>('manor-story-reward');
  private readonly manorRewardValue = requireElement<HTMLElement>('manor-reward-value');
  private readonly manorPrimaryButton = requireElement<HTMLButtonElement>('manor-primary');
  private readonly manorHuntView = requireElement<HTMLElement>('manor-hunt-view');
  private readonly manorClearedCount = requireElement<HTMLElement>('manor-cleared-count');
  private readonly manorHuntHearts = requireElement<HTMLElement>('manor-hunt-hearts');
  private readonly manorPlayfield = requireElement<HTMLElement>('manor-playfield');
  private readonly manorSpiderTarget = requireElement<HTMLButtonElement>('manor-spider-target');
  private readonly manorHuntMessage = requireElement<HTMLElement>('manor-hunt-message');
  private readonly manorChallengeView = requireElement<HTMLElement>('manor-challenge-view');
  private readonly manorSpiderNumber = requireElement<HTMLElement>('manor-spider-number');
  private readonly manorQuestionProgress = requireElement<HTMLElement>('manor-question-progress');
  private readonly manorChallengeHearts = requireElement<HTMLElement>('manor-challenge-hearts');
  private readonly manorQuestion = requireElement<HTMLElement>('manor-question');
  private readonly manorChoices = requireElement<HTMLElement>('manor-choices');
  private readonly manorChallengeMessage = requireElement<HTMLElement>('manor-challenge-message');
  private readonly manorDevActions = requireElement<HTMLElement>('manor-dev-actions');
  private manorTestVictoryButton?: HTMLButtonElement;
  private readonly crystalBridgeModal = requireElement<HTMLElement>('crystal-bridge-modal');
  private readonly crystalBridgePanel = requireElement<HTMLElement>('crystal-bridge-panel');
  private readonly crystalBridgePhase = requireElement<HTMLElement>('crystal-bridge-phase');
  private readonly leaveCrystalBridgeButton = requireElement<HTMLButtonElement>('leave-crystal-bridge');
  private readonly crystalBridgeStoryView = requireElement<HTMLElement>('crystal-bridge-story-view');
  private readonly crystalBridgeStoryKicker = requireElement<HTMLElement>('crystal-bridge-story-kicker');
  private readonly crystalBridgeStoryTitle = requireElement<HTMLElement>('crystal-bridge-story-title');
  private readonly crystalBridgeStoryMessage = requireElement<HTMLElement>('crystal-bridge-story-message');
  private readonly crystalBridgeStoryRules = requireElement<HTMLElement>('crystal-bridge-story-rules');
  private readonly crystalBridgeStoryReward = requireElement<HTMLElement>('crystal-bridge-story-reward');
  private readonly crystalBridgeRewardValue = requireElement<HTMLElement>('crystal-bridge-reward-value');
  private readonly crystalBridgePrimaryButton = requireElement<HTMLButtonElement>('crystal-bridge-primary');
  private readonly crystalBridgeGameView = requireElement<HTMLElement>('crystal-bridge-game-view');
  private readonly crystalBridgePlacedCount = requireElement<HTMLElement>('crystal-bridge-placed-count');
  private readonly crystalBridgeQuestion = requireElement<HTMLElement>('crystal-bridge-question');
  private readonly crystalBridgeHearts = requireElement<HTMLElement>('crystal-bridge-hearts');
  private readonly crystalBridgePlayfield = requireElement<HTMLElement>('crystal-bridge-playfield');
  private readonly crystalBridgeSockets = requireElement<HTMLElement>('crystal-bridge-sockets');
  private readonly crystalBridgeAnswers = requireElement<HTMLElement>('crystal-bridge-answers');
  private readonly crystalBridgeLightWave = requireElement<HTMLElement>('crystal-bridge-light-wave');
  private readonly crystalBridgeMessage = requireElement<HTMLElement>('crystal-bridge-message');
  private readonly crystalBridgeDevActions = requireElement<HTMLElement>('crystal-bridge-dev-actions');
  private crystalBridgeTestVictoryButton?: HTMLButtonElement;
  private readonly archiveModal = requireElement<HTMLElement>('archive-modal');
  private readonly archivePanel = requireElement<HTMLElement>('archive-panel');
  private readonly archivePhase = requireElement<HTMLElement>('archive-phase');
  private readonly leaveArchiveButton = requireElement<HTMLButtonElement>('leave-archive');
  private readonly archiveStoryView = requireElement<HTMLElement>('archive-story-view');
  private readonly archiveStoryKicker = requireElement<HTMLElement>('archive-story-kicker');
  private readonly archiveStoryTitle = requireElement<HTMLElement>('archive-story-title');
  private readonly archiveStoryMessage = requireElement<HTMLElement>('archive-story-message');
  private readonly archiveStoryRules = requireElement<HTMLElement>('archive-story-rules');
  private readonly archiveStoryReward = requireElement<HTMLElement>('archive-story-reward');
  private readonly archiveRewardValue = requireElement<HTMLElement>('archive-reward-value');
  private readonly archivePrimaryButton = requireElement<HTMLButtonElement>('archive-primary');
  private readonly archiveSortingView = requireElement<HTMLElement>('archive-sorting-view');
  private readonly archiveSortedCount = requireElement<HTMLElement>('archive-sorted-count');
  private readonly archiveHearts = requireElement<HTMLElement>('archive-hearts');
  private readonly archivePlayfield = requireElement<HTMLElement>('archive-playfield');
  private readonly archiveShelves = requireElement<HTMLElement>('archive-shelves');
  private readonly archiveScroll = requireElement<HTMLButtonElement>('archive-scroll');
  private readonly archiveQuestion = requireElement<HTMLElement>('archive-question');
  private readonly archiveMessage = requireElement<HTMLElement>('archive-message');
  private readonly archiveDevActions = requireElement<HTMLElement>('archive-dev-actions');
  private archiveTestVictoryButton?: HTMLButtonElement;
  private readonly puzzleQuestModal = requireElement<HTMLElement>('puzzle-quest-modal');
  private readonly puzzleQuestPanel = requireElement<HTMLElement>('puzzle-quest-panel');
  private readonly puzzleQuestPhase = requireElement<HTMLElement>('puzzle-quest-phase');
  private readonly leavePuzzleQuestButton = requireElement<HTMLButtonElement>('leave-puzzle-quest');
  private readonly puzzleStoryView = requireElement<HTMLElement>('puzzle-story-view');
  private readonly puzzleStoryKicker = requireElement<HTMLElement>('puzzle-story-kicker');
  private readonly puzzleStoryTitle = requireElement<HTMLElement>('puzzle-story-title');
  private readonly puzzleStoryMessage = requireElement<HTMLElement>('puzzle-story-message');
  private readonly puzzleStoryRules = requireElement<HTMLElement>('puzzle-story-rules');
  private readonly puzzleStoryReward = requireElement<HTMLElement>('puzzle-story-reward');
  private readonly puzzleSolvedPreview = requireElement<HTMLImageElement>('puzzle-solved-preview');
  private readonly puzzleRewardValue = requireElement<HTMLElement>('puzzle-reward-value');
  private readonly puzzlePrimaryButton = requireElement<HTMLButtonElement>('puzzle-primary');
  private readonly puzzleQuizView = requireElement<HTMLElement>('puzzle-quiz-view');
  private readonly puzzleUnlockedCount = requireElement<HTMLElement>('puzzle-unlocked-count');
  private readonly puzzleHearts = requireElement<HTMLElement>('puzzle-hearts');
  private readonly puzzleUnlockedStrip = requireElement<HTMLElement>('puzzle-unlocked-strip');
  private readonly puzzleQuestion = requireElement<HTMLElement>('puzzle-question');
  private readonly puzzleChoices = requireElement<HTMLElement>('puzzle-choices');
  private readonly puzzleQuizMessage = requireElement<HTMLElement>('puzzle-quiz-message');
  private readonly puzzleDevActions = requireElement<HTMLElement>('puzzle-dev-actions');
  private readonly puzzleBoardView = requireElement<HTMLElement>('puzzle-board-view');
  private readonly puzzleImageTitle = requireElement<HTMLElement>('puzzle-image-title');
  private readonly puzzleMoveCount = requireElement<HTMLElement>('puzzle-move-count');
  private readonly puzzlePreviewButton = requireElement<HTMLButtonElement>('puzzle-preview');
  private readonly puzzleBoard = requireElement<HTMLElement>('puzzle-board');
  private readonly puzzleReference = requireElement<HTMLElement>('puzzle-reference');
  private readonly puzzleReferenceImage = requireElement<HTMLImageElement>('puzzle-reference-image');
  private readonly puzzleBoardMessage = requireElement<HTMLElement>('puzzle-board-message');
  private readonly puzzleBoardDevActions = requireElement<HTMLElement>('puzzle-board-dev-actions');
  private puzzleTestVictoryButton?: HTMLButtonElement;
  private readonly campModal = requireElement<HTMLElement>('camp-modal');
  private readonly campPanel = requireElement<HTMLElement>('camp-modal').querySelector<HTMLElement>('.camp-panel')!;
  private readonly campCharacter = requireElement<HTMLImageElement>('camp-character');
  private readonly campKicker = requireElement<HTMLElement>('camp-kicker');
  private readonly campStoryTitle = requireElement<HTMLElement>('camp-story-title');
  private readonly campMessage = requireElement<HTMLElement>('camp-message');
  private readonly campProgress = requireElement<HTMLElement>('camp-progress');
  private readonly campRewardValue = requireElement<HTMLElement>('camp-reward-value');
  private readonly campPrimary = requireElement<HTMLButtonElement>('camp-primary');
  private readonly tallvokterFxControl = requireElement<HTMLElement>('tallvokter-fx-control');
  private readonly tallvokterFxLevel = requireElement<HTMLSelectElement>('tallvokter-fx-level');
  private readonly prizeBoxModal = requireElement<HTMLElement>('prize-box-modal');
  private readonly prizeBoxList = requireElement<HTMLDivElement>('prize-box-list');
  private readonly medalCabinetModal = requireElement<HTMLElement>('medal-cabinet-modal');
  private readonly medalCabinetList = requireElement<HTMLDivElement>('medal-cabinet-list');
  private readonly cardCollectionList = requireElement<HTMLDivElement>('card-collection-list');
  private readonly collectionTabMedals = requireElement<HTMLButtonElement>('collection-tab-medals');
  private readonly collectionTabCards = requireElement<HTMLButtonElement>('collection-tab-cards');
  private readonly collectionCardPreview = requireElement<HTMLElement>('collection-card-preview');
  private readonly collectionCardPreviewImage = requireElement<HTMLImageElement>('collection-card-preview-image');
  private readonly collectionCardPreviewTitle = requireElement<HTMLHeadingElement>('collection-card-preview-title');
  private readonly collectionCardPreviewRarity = requireElement<HTMLParagraphElement>('collection-card-preview-rarity');
  private readonly previousCollectionCard = requireElement<HTMLButtonElement>('previous-collection-card');
  private readonly nextCollectionCard = requireElement<HTMLButtonElement>('next-collection-card');
  private collectionPreviewCardIds: string[] = [];
  private collectionPreviewIndex = -1;
  private readonly toast = requireElement<HTMLDivElement>('toast');
  private readonly startScreen = requireElement<HTMLElement>('start-screen');
  private readonly tokenPickerModal = requireElement<HTMLElement>('token-picker-modal');
  private readonly shopModal = requireElement<HTMLElement>('shop-modal');
  private readonly shopGrid = requireElement<HTMLDivElement>('shop-grid');
  private readonly shopCardPanel = requireElement<HTMLElement>('shop-card-panel');
  private readonly shopTabTokens = requireElement<HTMLButtonElement>('shop-tab-tokens');
  private readonly shopTabCards = requireElement<HTMLButtonElement>('shop-tab-cards');
  private readonly shopRegnecoinCount = requireElement<HTMLSpanElement>('shop-regnecoin-count');
  private readonly buyMysteryPackButton = requireElement<HTMLButtonElement>('buy-mystery-pack');
  private readonly mysteryPackCost = requireElement<HTMLElement>('mystery-pack-cost');
  private readonly mysteryPackStatus = requireElement<HTMLParagraphElement>('mystery-pack-status');
  private readonly cardReveal = requireElement<HTMLElement>('card-reveal');
  private readonly cardRevealFlipper = requireElement<HTMLButtonElement>('card-reveal-flipper');
  private readonly cardRevealDetails = requireElement<HTMLElement>('card-reveal-details');
  private readonly cardRevealImage = requireElement<HTMLImageElement>('card-reveal-image');
  private readonly cardRevealTitle = requireElement<HTMLHeadingElement>('card-reveal-title');
  private readonly cardRevealRarity = requireElement<HTMLParagraphElement>('card-reveal-rarity');
  private cardRevealTimer?: number;
  private readonly selectedTokenImage = requireElement<HTMLImageElement>('selected-token-image');
  private readonly selectedTokenName = requireElement<HTMLElement>('selected-token-name');
  private readonly tokenPicker = requireElement<HTMLDivElement>('token-picker');
  private readonly mapPicker = requireElement<HTMLDivElement>('map-picker');
  private readonly mapSettingsModal = requireElement<HTMLElement>('map-settings-modal');
  private readonly mapSettingsTitle = requireElement<HTMLHeadingElement>('map-settings-title');
  private readonly mapSettingsCopy = requireElement<HTMLParagraphElement>('map-settings-copy');
  private readonly mapSettingsOperationBlock = requireElement<HTMLDivElement>('map-settings-operation-block');
  private readonly mapSettingsDifficultyBlock = requireElement<HTMLDivElement>('map-settings-difficulty-block');
  private readonly operationPicker = requireElement<HTMLDivElement>('map-settings-operation-picker');
  private readonly difficultyPicker = requireElement<HTMLDivElement>('map-settings-difficulty-picker');
  private readonly storyModeButton = requireElement<HTMLButtonElement>('story-mode');
  private readonly storyTitle = requireElement<HTMLHeadingElement>('story-title');
  private readonly storyCopy = requireElement<HTMLParagraphElement>('story-copy');
  private readonly tokenPreview = requireElement<HTMLElement>('token-preview');
  private readonly tokenPreviewImage = requireElement<HTMLImageElement>('token-preview-image');
  private readonly tokenPreviewTitle = requireElement<HTMLHeadingElement>('token-preview-title');
  private readonly tokenPreviewName = requireElement<HTMLParagraphElement>('token-preview-name');
  private readonly chooseTokenPreview = requireElement<HTMLButtonElement>('choose-token-preview');
  private readonly storyConfirm = requireElement<HTMLElement>('story-confirm');
  private readonly unlockConfirm = requireElement<HTMLElement>('unlock-confirm');
  private readonly cancelUnlock = requireElement<HTMLButtonElement>('cancel-unlock');
  private readonly confirmUnlockButton = requireElement<HTMLButtonElement>('confirm-unlock');
  private readonly unlockTitle = requireElement<HTMLHeadingElement>('unlock-title');
  private readonly unlockCopy = requireElement<HTMLParagraphElement>('unlock-copy');
  private readonly rewardModal = requireElement<HTMLElement>('reward-modal');
  private readonly rewardMedal = requireElement<HTMLImageElement>('reward-medal');
  private readonly rewardExtraMedal = requireElement<HTMLImageElement>('reward-extra-medal');
  private readonly rewardKicker = requireElement<HTMLParagraphElement>('reward-kicker');
  private readonly rewardTitle = requireElement<HTMLHeadingElement>('reward-title');
  private readonly rewardCopy = requireElement<HTMLParagraphElement>('reward-copy');
  private readonly resetConfirm = requireElement<HTMLElement>('reset-confirm');
  private readonly modal = requireElement<HTMLElement>('battle-modal');
  private readonly questModal = requireElement<HTMLElement>('quest-modal');
  private readonly questShell = requireElement<HTMLDivElement>('quest-shell');
  private readonly questKind = requireElement<HTMLParagraphElement>('quest-kind');
  private readonly questTitle = requireElement<HTMLHeadingElement>('quest-title');
  private readonly questCopy = requireElement<HTMLParagraphElement>('quest-copy');
  private readonly questRuneImage = requireElement<HTMLImageElement>('quest-rune-image');
  private readonly thiefLossEnding = requireElement<HTMLDivElement>('thief-loss-ending');
  private readonly continueThiefLossButton = requireElement<HTMLButtonElement>('continue-thief-loss');
  private readonly questPlace = requireElement<HTMLParagraphElement>('quest-place');
  private readonly questTask = requireElement<HTMLHeadingElement>('quest-task');
  private readonly questProgress = requireElement<HTMLDivElement>('quest-progress');
  private readonly questHearts = requireElement<HTMLDivElement>('quest-hearts');
  private readonly questQuestionText = requireElement<HTMLParagraphElement>('quest-question-text');
  private readonly questChoiceGrid = requireElement<HTMLDivElement>('quest-choice-grid');
  private readonly questMessage = requireElement<HTMLParagraphElement>('quest-message');
  private readonly closeQuestButton = requireElement<HTMLButtonElement>('close-quest');
  private readonly retryQuest = requireElement<HTMLButtonElement>('retry-quest');
  private questTestVictoryButton?: HTMLButtonElement;
  private readonly tallvokterFinaleModal = requireElement<HTMLElement>('tallvokter-finale-modal');
  private readonly tallvokterFinalePanel = requireElement<HTMLDivElement>('tallvokter-finale-panel');
  private readonly tallvokterFinaleCharacter = requireElement<HTMLImageElement>('tallvokter-finale-character');
  private readonly tallvokterFinaleCharacterKicker = requireElement<HTMLSpanElement>('tallvokter-finale-character-kicker');
  private readonly tallvokterFinaleKicker = requireElement<HTMLParagraphElement>('tallvokter-finale-kicker');
  private readonly tallvokterFinaleTitle = requireElement<HTMLHeadingElement>('tallvokter-finale-title');
  private readonly closeTallvokterFinaleButton = requireElement<HTMLButtonElement>('close-tallvokter-finale');
  private readonly tallvokterFinaleStory = requireElement<HTMLDivElement>('tallvokter-finale-story');
  private readonly tallvokterFinaleStoryCopy = requireElement<HTMLParagraphElement>('tallvokter-finale-story-copy');
  private readonly tallvokterFinaleRules = requireElement<HTMLDivElement>('tallvokter-finale-rules');
  private readonly tallvokterFinaleReward = requireElement<HTMLDivElement>('tallvokter-finale-reward');
  private readonly tallvokterFinaleRewardValue = requireElement<HTMLSpanElement>('tallvokter-finale-reward-value');
  private readonly tallvokterFinalePrimary = requireElement<HTMLButtonElement>('tallvokter-finale-primary');
  private readonly tallvokterFinaleBattle = requireElement<HTMLDivElement>('tallvokter-finale-battle');
  private readonly tallvokterFinaleProgress = requireElement<HTMLDivElement>('tallvokter-finale-progress');
  private readonly tallvokterFinaleHearts = requireElement<HTMLDivElement>('tallvokter-finale-hearts');
  private readonly tallvokterFinaleQuestion = requireElement<HTMLParagraphElement>('tallvokter-finale-question');
  private readonly tallvokterFinaleChoices = requireElement<HTMLDivElement>('tallvokter-finale-choices');
  private readonly tallvokterFinaleMessage = requireElement<HTMLParagraphElement>('tallvokter-finale-message');
  private readonly tallvokterFinaleDevActions = requireElement<HTMLDivElement>('tallvokter-finale-dev-actions');
  private readonly retryTallvokterFinaleButton = requireElement<HTMLButtonElement>('retry-tallvokter-finale');
  private readonly battleShell = requireElement<HTMLDivElement>('battle-shell');
  private readonly bossStage = requireElement<HTMLDivElement>('boss-stage');
  private readonly bossArtBg = requireElement<HTMLDivElement>('boss-art-bg');
  private readonly bossArt = requireElement<HTMLImageElement>('boss-art');
  private readonly battleEffects = requireElement<HTMLDivElement>('battle-effects');
  private readonly battlePlace = requireElement<HTMLParagraphElement>('battle-place');
  private readonly battleTitle = requireElement<HTMLHeadingElement>('battle-title');
  private readonly bossLifeLabel = requireElement<HTMLSpanElement>('boss-life-label');
  private readonly bossMeter = requireElement<HTMLElement>('boss-meter');
  private readonly playerHearts = requireElement<HTMLDivElement>('player-hearts');
  private readonly superCount = requireElement<HTMLSpanElement>('super-count');
  private readonly superMeter = requireElement<HTMLDivElement>('super-meter');
  private readonly questionText = requireElement<HTMLParagraphElement>('question-text');
  private readonly choiceGrid = requireElement<HTMLDivElement>('choice-grid');
  private readonly battleMessage = requireElement<HTMLParagraphElement>('battle-message');
  private readonly retryBattle = requireElement<HTMLButtonElement>('retry-battle');

  constructor(private readonly progress: ProgressStore) {
    this.crystalBridgeLayout = this.loadCrystalBridgeSceneLayout();
    requireElement<HTMLButtonElement>('close-battle').addEventListener('click', () => {
      const storyFailed = this.battle?.status === 'lost' && this.battle.settings.playMode === 'story';
      this.closeBattle();
      if (storyFailed) this.completeStoryModeRestartAfterReturn();
    });
    this.closeQuestButton.addEventListener('click', () => {
      const storyFailed = this.quest?.status === 'lost' && this.quest.settings.playMode === 'story';
      this.closeQuest(storyFailed);
      if (storyFailed) this.completeStoryModeRestartAfterReturn();
    });
    this.continueThiefLossButton.addEventListener('click', () => this.continueTallvokterThiefLossEnding());
    this.closeTallvokterFinaleButton.addEventListener('click', () => {
      const storyFailed = this.tallvokterFinale?.status === 'lost'
        && this.tallvokterFinale.settings.playMode === 'story';
      this.closeTallvokterFinale();
      if (storyFailed) this.completeStoryModeRestartAfterReturn();
    });
    this.tallvokterFinalePrimary.addEventListener('click', () => this.advanceTallvokterFinale());
    this.retryTallvokterFinaleButton.addEventListener('click', () => {
      if (this.tallvokterFinale?.status === 'lost' && this.tallvokterFinale.settings.playMode === 'story') {
        this.closeTallvokterFinale();
        this.completeStoryModeRestartAfterReturn();
        return;
      }
      this.startTallvokterFinaleBattle();
    });
    if (
      import.meta.env.DEV
      && (
        window.location.hostname === 'localhost'
        || window.location.hostname === '127.0.0.1'
        || window.location.hostname === '::1'
      )
    ) {
      const questActions = this.closeQuestButton.closest('.battle-actions');
      if (questActions) {
        this.questTestVictoryButton = document.createElement('button');
        this.questTestVictoryButton.type = 'button';
        this.questTestVictoryButton.className = 'secondary-button';
        this.questTestVictoryButton.textContent = 'Test seier';
        this.questTestVictoryButton.addEventListener('click', () => {
          if (this.questInputLocked) {
            return;
          }
          while (this.quest?.status === 'active') {
            this.answerQuest(this.quest.question.answer);
          }
        });
        questActions.appendChild(this.questTestVictoryButton);
      }

      const tallvokterFinaleTestVictoryButton = document.createElement('button');
      tallvokterFinaleTestVictoryButton.type = 'button';
      tallvokterFinaleTestVictoryButton.className = 'secondary-button';
      tallvokterFinaleTestVictoryButton.textContent = 'Test seier';
      tallvokterFinaleTestVictoryButton.addEventListener('click', () => this.completeTallvokterFinaleForDev());
      this.tallvokterFinaleDevActions.append(tallvokterFinaleTestVictoryButton);

      const miningTestVictoryButton = document.createElement('button');
      miningTestVictoryButton.type = 'button';
      miningTestVictoryButton.className = 'secondary-button';
      miningTestVictoryButton.textContent = 'Test seier';
      miningTestVictoryButton.addEventListener('click', () => this.completeMiningQuizForDev());
      this.miningDevActions.append(miningTestVictoryButton);

      this.gladiatorArenaTestVictoryButton = document.createElement('button');
      this.gladiatorArenaTestVictoryButton.type = 'button';
      this.gladiatorArenaTestVictoryButton.className = 'secondary-button';
      this.gladiatorArenaTestVictoryButton.textContent = 'Test seier';
      this.gladiatorArenaTestVictoryButton.addEventListener('click', () => this.completeGladiatorFightForDev());
      this.gladiatorArenaDevActions.append(this.gladiatorArenaTestVictoryButton);

      this.mazeTestVictoryButton = document.createElement('button');
      this.mazeTestVictoryButton.type = 'button';
      this.mazeTestVictoryButton.className = 'secondary-button';
      this.mazeTestVictoryButton.textContent = 'Test seier';
      this.mazeTestVictoryButton.addEventListener('click', () => this.completeMazeGateForDev());
      this.mazeDevActions.append(this.mazeTestVictoryButton);

      const crystalCartTestVictoryButton = document.createElement('button');
      crystalCartTestVictoryButton.type = 'button';
      crystalCartTestVictoryButton.className = 'secondary-button';
      crystalCartTestVictoryButton.textContent = 'Test seier';
      crystalCartTestVictoryButton.addEventListener('click', () => this.crystalCartTestCallback?.());
      this.crystalCartDevActions.append(crystalCartTestVictoryButton);

      const swampAlchemyTestVictoryButton = document.createElement('button');
      swampAlchemyTestVictoryButton.type = 'button';
      swampAlchemyTestVictoryButton.className = 'secondary-button';
      swampAlchemyTestVictoryButton.textContent = 'Test seier';
      swampAlchemyTestVictoryButton.addEventListener('click', () => this.swampAlchemyTestCallback?.());
      this.swampAlchemyDevActions.append(swampAlchemyTestVictoryButton);

      const lightForestTestVictoryButton = document.createElement('button');
      lightForestTestVictoryButton.type = 'button';
      lightForestTestVictoryButton.className = 'secondary-button';
      lightForestTestVictoryButton.textContent = 'Test seier';
      lightForestTestVictoryButton.addEventListener('click', () => this.lightForestTestCallback?.());
      this.lightForestDevActions.append(lightForestTestVictoryButton);

      this.puzzleTestVictoryButton = document.createElement('button');
      this.puzzleTestVictoryButton.type = 'button';
      this.puzzleTestVictoryButton.className = 'secondary-button';
      this.puzzleTestVictoryButton.textContent = 'Test seier';
      this.puzzleTestVictoryButton.addEventListener('click', () => this.completePuzzleQuestForDev());
      this.puzzleDevActions.append(this.puzzleTestVictoryButton);

      this.archiveTestVictoryButton = document.createElement('button');
      this.archiveTestVictoryButton.type = 'button';
      this.archiveTestVictoryButton.className = 'secondary-button';
      this.archiveTestVictoryButton.textContent = 'Test seier';
      this.archiveTestVictoryButton.addEventListener('click', () => this.completeArchiveQuestForDev());
      this.archiveDevActions.append(this.archiveTestVictoryButton);

      this.crystalBridgeTestVictoryButton = document.createElement('button');
      this.crystalBridgeTestVictoryButton.type = 'button';
      this.crystalBridgeTestVictoryButton.className = 'secondary-button';
      this.crystalBridgeTestVictoryButton.textContent = 'Test seier';
      this.crystalBridgeTestVictoryButton.addEventListener('click', () => this.completeCrystalBridgeQuestForDev());
      this.crystalBridgeDevActions.append(this.crystalBridgeTestVictoryButton);

      this.crystalBridgeEditButton = document.createElement('button');
      this.crystalBridgeEditButton.type = 'button';
      this.crystalBridgeEditButton.className = 'secondary-button';
      this.crystalBridgeEditButton.textContent = 'Rediger scene';
      this.crystalBridgeEditButton.addEventListener('click', () => this.toggleCrystalBridgeSceneEditor());
      this.crystalBridgeDevActions.append(this.crystalBridgeEditButton);

      const resetCrystalBridgeLayoutButton = document.createElement('button');
      resetCrystalBridgeLayoutButton.type = 'button';
      resetCrystalBridgeLayoutButton.className = 'secondary-button';
      resetCrystalBridgeLayoutButton.textContent = 'Nullstill plassering';
      resetCrystalBridgeLayoutButton.addEventListener('click', () => this.resetCrystalBridgeSceneLayout());
      this.crystalBridgeDevActions.append(resetCrystalBridgeLayoutButton);
    }
    requireElement<HTMLButtonElement>('reset-progress').addEventListener('click', () => {
      this.closeBackpack();
      this.openResetConfirm();
    });
    requireElement<HTMLButtonElement>('cancel-reset').addEventListener('click', () => this.closeResetConfirm());
    requireElement<HTMLButtonElement>('confirm-reset').addEventListener('click', () => {
      this.hooks?.resetProgress();
      this.closeResetConfirm();
    });
    requireElement<HTMLButtonElement>('open-start').addEventListener('click', () => {
      this.closeBackpack();
      this.openStartScreen();
    });
    requireElement<HTMLButtonElement>('open-token-picker').addEventListener('click', () => this.openTokenPicker());
    requireElement<HTMLButtonElement>('close-token-picker').addEventListener('click', () => this.closeTokenPicker());
    requireElement<HTMLButtonElement>('open-shop').addEventListener('click', () => this.openShop());
    requireElement<HTMLButtonElement>('close-shop').addEventListener('click', () => this.closeShop());
    this.shopTabTokens.addEventListener('click', () => this.setShopSection('tokens'));
    this.shopTabCards.addEventListener('click', () => this.setShopSection('cards'));
    this.buyMysteryPackButton.addEventListener('click', () => this.purchaseMysteryPack());
    this.cardRevealFlipper.addEventListener('click', () => this.revealMysteryCard());
    requireElement<HTMLButtonElement>('close-card-reveal').addEventListener('click', () => this.closeCardReveal());
    this.coinCounterButton.addEventListener('click', () => this.openPrizeBox());
    this.backpackButton.addEventListener('click', () => this.openBackpack());
    requireElement<HTMLButtonElement>('close-backpack').addEventListener('click', () => this.closeBackpack());
    this.fishBucketToggle.addEventListener('click', () => {
      this.setFishBucketExpanded(this.fishBucketToggle.getAttribute('aria-expanded') !== 'true');
    });
    requireElement<HTMLButtonElement>('close-fishing-sale').addEventListener('click', () => this.closeFishingSale());
    requireElement<HTMLButtonElement>('leave-fishing-sale').addEventListener('click', () => this.closeFishingSale());
    this.sellAllFishButton.addEventListener('click', () => this.sellAllFish());
    this.closeCrystalCartStoryButton.addEventListener('click', () => this.cancelCrystalCartStory());
    this.crystalCartStoryPrimary.addEventListener('click', () => this.advanceCrystalCartStory());
    this.leaveCrystalCartButton.addEventListener('click', () => this.crystalCartExitCallback?.());
    this.closeSwampAlchemyStoryButton.addEventListener('click', () => this.cancelSwampAlchemyStory());
    this.swampAlchemyStoryPrimary.addEventListener('click', () => this.advanceSwampAlchemyStory());
    this.leaveSwampAlchemyButton.addEventListener('click', () => this.swampAlchemyExitCallback?.());
    this.closeLightForestStoryButton.addEventListener('click', () => this.cancelLightForestStory());
    this.lightForestStoryPrimary.addEventListener('click', () => this.advanceLightForestStory());
    this.leaveLightForestButton.addEventListener('click', () => this.lightForestExitCallback?.());
    requireElement<HTMLButtonElement>('close-regnemonster-game')
      .addEventListener('click', () => this.closeRegnemonsterGame());
    requireElement<HTMLButtonElement>('start-regnemonster-round')
      .addEventListener('click', () => this.startRegnemonsterRound());
    requireElement<HTMLButtonElement>('leave-regnemonster-round')
      .addEventListener('click', () => this.closeRegnemonsterGame());
    requireElement<HTMLButtonElement>('retry-regnemonster-round')
      .addEventListener('click', () => this.startRegnemonsterRound());
    this.regnemonsterRewardCard.addEventListener('click', () => this.revealRegnemonsterReward());
    requireElement<HTMLButtonElement>('restart-regnemonster-round')
      .addEventListener('click', () => this.startRegnemonsterRound());
    requireElement<HTMLButtonElement>('change-regnemonster-setup')
      .addEventListener('click', () => this.showRegnemonsterSetup());
    requireElement<HTMLButtonElement>('finish-regnemonster-round')
      .addEventListener('click', () => this.closeRegnemonsterGame());
    requireElement<HTMLButtonElement>('close-regnemonster-binder')
      .addEventListener('click', () => this.closeRegnemonsterBinder());
    const closeRegnemonsterBinderPreviewButton =
      requireElement<HTMLButtonElement>('close-regnemonster-binder-preview');
    closeRegnemonsterBinderPreviewButton
      .addEventListener('click', () => this.closeRegnemonsterBinderPreview());
    closeRegnemonsterBinderPreviewButton.addEventListener('touchend', (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.closeRegnemonsterBinderPreview();
    }, { passive: false });
    this.regnemonsterBinderPrevious.addEventListener('click', () => this.flipRegnemonsterBinder(-1));
    this.regnemonsterBinderNext.addEventListener('click', () => this.flipRegnemonsterBinder(1));
    this.regnemonsterBinderTabSet1.addEventListener('click', () => this.setRegnemonsterBinderSet('set1'));
    this.regnemonsterBinderTabSpecial.addEventListener(
      'click',
      () => this.setRegnemonsterBinderSet('special')
    );
    this.claimMiningRewardButton.addEventListener('click', () => this.claimMiningReward());
    this.leaveMiningButton.addEventListener('click', () => this.closeMiningExpedition());
    this.leaveGladiatorArenaButton.addEventListener('click', () => {
      const storyFailed = this.gladiatorArena?.phase === 'lost'
        && this.gladiatorArena.fight.settings.playMode === 'story';
      this.closeGladiatorArena();
      if (storyFailed) this.completeStoryModeRestartAfterReturn();
    });
    requireElement<HTMLButtonElement>('leave-maze').addEventListener('click', () => {
      const storyFailed = this.mazeQuest?.phase === 'lost'
        && this.mazeQuest.settings.playMode === 'story';
      this.closeMazeQuest();
      if (storyFailed) this.completeStoryModeRestartAfterReturn();
    });
    this.mazePrimary.addEventListener('click', () => this.advanceMazeQuest());
    this.mazeGrid.addEventListener('pointerdown', this.handleMazePointerDown);
    this.mazeGrid.addEventListener('pointermove', this.handleMazePointerMove);
    this.mazeGrid.addEventListener('pointerup', this.handleMazePointerEnd);
    this.mazeGrid.addEventListener('pointercancel', this.handleMazePointerEnd);
    this.mazeGrid.addEventListener('lostpointercapture', this.handleMazePointerEnd);
    this.gladiatorArenaPrimaryButton.addEventListener('click', () => this.advanceGladiatorArena());
    this.leaveManorButton.addEventListener('click', () => {
      const storyFailed = this.manorQuest?.phase === 'lost'
        && this.manorQuest.settings.playMode === 'story';
      this.closeManorQuest();
      if (storyFailed) this.completeStoryModeRestartAfterReturn();
    });
    this.manorPrimaryButton.addEventListener('click', () => this.advanceManorQuest());
    this.leaveArchiveButton.addEventListener('click', () => {
      const storyFailed = this.archiveQuest?.phase === 'lost'
        && this.archiveQuest.settings.playMode === 'story';
      this.closeArchiveQuest();
      if (storyFailed) this.completeStoryModeRestartAfterReturn();
    });
    this.archivePrimaryButton.addEventListener('click', () => this.advanceArchiveQuest());
    this.archiveScroll.addEventListener('pointerdown', this.handleArchivePointerDown);
    this.archivePlayfield.addEventListener('pointermove', this.handleArchivePointerMove);
    this.archivePlayfield.addEventListener('pointerup', this.handleArchivePointerEnd);
    this.archivePlayfield.addEventListener('pointercancel', this.handleArchivePointerEnd);
    this.leaveCrystalBridgeButton.addEventListener('click', () => {
      const storyFailed = this.crystalBridgeQuest?.phase === 'lost'
        && this.crystalBridgeQuest.settings.playMode === 'story';
      this.closeCrystalBridgeQuest();
      if (storyFailed) this.completeStoryModeRestartAfterReturn();
    });
    this.crystalBridgePrimaryButton.addEventListener('click', () => this.advanceCrystalBridgeQuest());
    this.crystalBridgePlayfield.addEventListener('pointermove', this.handleCrystalBridgePointerMove);
    this.crystalBridgePlayfield.addEventListener('pointerup', this.handleCrystalBridgePointerEnd);
    this.crystalBridgePlayfield.addEventListener('pointercancel', this.handleCrystalBridgePointerEnd);
    this.crystalBridgeAnswers.addEventListener(
      'pointerdown',
      this.handleCrystalBridgeLayoutPointerDown
    );
    this.crystalBridgePlayfield.addEventListener(
      'pointermove',
      this.handleCrystalBridgeLayoutPointerMove
    );
    this.crystalBridgePlayfield.addEventListener(
      'pointerup',
      this.handleCrystalBridgeLayoutPointerEnd
    );
    this.crystalBridgePlayfield.addEventListener(
      'pointercancel',
      this.handleCrystalBridgeLayoutPointerEnd
    );
    this.leavePuzzleQuestButton.addEventListener('click', () => {
      const storyFailed = this.puzzleQuest?.phase === 'lost'
        && this.puzzleQuest.settings.playMode === 'story';
      this.closePuzzleQuest();
      if (storyFailed) this.completeStoryModeRestartAfterReturn();
    });
    this.puzzlePrimaryButton.addEventListener('click', () => this.advancePuzzleQuest());
    this.puzzlePreviewButton.addEventListener('click', () => this.showPuzzleReference());
    this.manorSpiderTarget.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      this.beginManorSpiderChallenge();
    });
    this.manorSpiderTarget.addEventListener('click', () => this.beginManorSpiderChallenge());
    requireElement<HTMLButtonElement>('close-camp').addEventListener('click', () => this.closeCampDialog());
    this.campPrimary.addEventListener('click', () => this.advanceCampDialog());
    requireElement<HTMLButtonElement>('close-prize-box').addEventListener('click', () => this.closePrizeBox());
    requireElement<HTMLButtonElement>('open-medal-cabinet').addEventListener('click', () => this.openMedalCabinet());
    requireElement<HTMLButtonElement>('close-medal-cabinet').addEventListener('click', () => this.closeMedalCabinet());
    this.collectionTabMedals.addEventListener('click', () => this.setCollectionSection('medals'));
    this.collectionTabCards.addEventListener('click', () => this.setCollectionSection('cards'));
    requireElement<HTMLButtonElement>('close-collection-card-preview').addEventListener('click', () => this.closeCollectionCardPreview());
    requireElement<HTMLButtonElement>('back-to-card-collection').addEventListener('click', () => this.closeCollectionCardPreview());
    this.previousCollectionCard.addEventListener('click', () => this.showAdjacentCollectionCard(-1));
    this.nextCollectionCard.addEventListener('click', () => this.showAdjacentCollectionCard(1));
    requireElement<HTMLButtonElement>('back-to-regnemester').addEventListener('click', () => this.goBackToRegnemester());
    requireElement<HTMLButtonElement>('close-reward').addEventListener('click', () => this.closeReward());
    requireElement<HTMLButtonElement>('cancel-story').addEventListener('click', () => this.closeStoryConfirm());
    requireElement<HTMLButtonElement>('confirm-story').addEventListener('click', () => this.startStoryMode());
    requireElement<HTMLButtonElement>('close-map-settings').addEventListener('click', () => this.closeMapSettings());
    requireElement<HTMLButtonElement>('cancel-map-settings').addEventListener('click', () => this.closeMapSettings());
    requireElement<HTMLButtonElement>('confirm-map-settings').addEventListener('click', () => this.confirmMapSettings());
    this.cancelUnlock.addEventListener('click', () => this.closeUnlockConfirm());
    this.confirmUnlockButton.addEventListener('click', () => this.confirmUnlock());
    requireElement<HTMLButtonElement>('close-token-preview').addEventListener('click', () => this.closeTokenPreview());
    requireElement<HTMLButtonElement>('back-token-preview').addEventListener('click', () => this.closeTokenPreview());
    this.chooseTokenPreview.addEventListener('click', () => this.choosePreviewToken());
    this.startGameButton.addEventListener('click', () => {
      if (!this.worldReady) {
        return;
      }
      this.progress.startNormalMode();
      this.hooks?.resetPlayerToProgress();
      this.closeTokenPreview();
      this.closeTokenPicker();
      this.closeShop();
      this.closeMapSettings();
      this.closeStartScreen();
    });
    this.tallvokterFxLevel.addEventListener('change', () => {
      const level = this.tallvokterFxLevel.value;
      if (isTallvokterFxLevel(level)) {
        this.hooks?.setTallvokterFxLevel(level);
      }
    });
    this.storyModeButton.addEventListener('click', () => this.openStoryConfirm());
    this.resetConfirm.addEventListener('click', (event) => {
      if (event.target === this.resetConfirm) {
        this.closeResetConfirm();
      }
    });
    this.storyConfirm.addEventListener('click', (event) => {
      if (event.target === this.storyConfirm) {
        this.closeStoryConfirm();
      }
    });
    this.mapSettingsModal.addEventListener('click', (event) => {
      if (event.target === this.mapSettingsModal) {
        this.closeMapSettings();
      }
    });
    this.unlockConfirm.addEventListener('click', (event) => {
      if (event.target === this.unlockConfirm && this.unlockConfirmDismissible) {
        this.closeUnlockConfirm();
      }
    });
    this.prizeBoxModal.addEventListener('click', (event) => {
      if (event.target === this.prizeBoxModal) {
        this.closePrizeBox();
      }
    });
    this.backpackModal.addEventListener('click', (event) => {
      if (event.target === this.backpackModal) {
        this.closeBackpack();
      }
    });
    this.fishingSaleModal.addEventListener('click', (event) => {
      if (event.target === this.fishingSaleModal) {
        this.closeFishingSale();
      }
    });
    this.medalCabinetModal.addEventListener('click', (event) => {
      if (event.target === this.medalCabinetModal) {
        this.closeMedalCabinet();
      }
    });
    this.rewardModal.addEventListener('click', (event) => {
      if (event.target === this.rewardModal) {
        this.closeReward();
      }
    });
    this.questModal.addEventListener('click', (event) => {
      if (event.target === this.questModal) {
        this.closeQuest();
      }
    });
    this.campModal.addEventListener('click', (event) => {
      if (event.target === this.campModal) {
        this.closeCampDialog();
      }
    });
    this.tokenPickerModal.addEventListener('click', (event) => {
      if (event.target === this.tokenPickerModal) {
        this.closeTokenPicker();
      }
    });
    this.shopModal.addEventListener('click', (event) => {
      if (event.target === this.shopModal) {
        this.closeShop();
      }
    });
    this.tokenPreview.addEventListener('click', (event) => {
      if (event.target === this.tokenPreview) {
        this.closeTokenPreview();
      }
    });
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleWindowBlur);
    this.retryBattle.addEventListener('click', () => {
      if (this.battle) {
        if (this.battle.settings.playMode === 'story' && this.battle.status === 'lost') {
          this.closeBattle();
          this.completeStoryModeRestartAfterReturn();
          return;
        }
        this.openBattle(this.battle.location, this.winCallback ?? (() => undefined));
      }
    });
    this.retryQuest.addEventListener('click', () => {
      if (this.quest?.settings.playMode === 'story' && this.quest.status === 'lost') {
        this.closeQuest(true);
        this.completeStoryModeRestartAfterReturn();
        return;
      }
      this.questRetryCallback?.();
    });
    this.choiceGrid.addEventListener('touchstart', this.handleBattleTouchStart, this.passiveTouchOptions);
    this.choiceGrid.addEventListener('touchmove', this.handleBattleTouchMove, this.passiveTouchOptions);
    this.choiceGrid.addEventListener('touchend', this.handleBattleTouchEnd, this.activeTouchOptions);
    this.choiceGrid.addEventListener('touchcancel', this.handleBattleTouchCancel, this.passiveTouchOptions);
    this.nearbyCard.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
    this.nearbyCard.addEventListener('pointerup', (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.triggerNearbyAction();
    });
    this.nearbyCard.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.triggerNearbyAction();
    });
    if (
      import.meta.env.DEV
      && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ) {
      const resetFishingButton = document.createElement('button');
      resetFishingButton.type = 'button';
      resetFishingButton.className = 'secondary-button inventory-dev-button';
      resetFishingButton.textContent = 'Test: Nullstill fiskerunde';
      resetFishingButton.addEventListener('click', () => {
        if (this.progress.resetFishingRoundForDev()) {
          this.showToast('Fiskerunden er nullstilt for lokal test.');
          this.renderBackpack();
        }
      });
      this.backpackDevActions.append(resetFishingButton);

      const manorTestVictoryButton = document.createElement('button');
      manorTestVictoryButton.type = 'button';
      manorTestVictoryButton.className = 'secondary-button';
      manorTestVictoryButton.textContent = 'Test seier';
      manorTestVictoryButton.addEventListener('click', () => this.completeManorChallengeForDev());
      this.manorDevActions.append(manorTestVictoryButton);
      this.manorTestVictoryButton = manorTestVictoryButton;

    }
    this.progress.addEventListener('change', this.handleProgressChange);
    this.renderStartControls();
    this.syncStartVisibility();
  }

  bindWorld(hooks: WorldHooks): void {
    this.hooks = hooks;
  }

  setWorldHudVisible(visible: boolean): void {
    this.hudRoot.classList.toggle('is-hidden', !visible);
    if (!visible) {
      this.closeBackpack();
    }
  }

  setLoadingProgress(progress: number): void {
    const percent = Math.round(Math.max(0, Math.min(1, progress)) * 100);
    this.loadingBarFill.style.setProperty('--loading-progress', `${percent}%`);
    this.loadingProgress.textContent = `Gjør kartet klart ... ${percent} %`;
  }

  beginWorldLoading(): void {
    this.worldReady = false;
    this.setLoadingProgress(0);
    this.startGameButton.disabled = true;
    this.startGameButton.textContent = 'Laster kart ...';
    this.loadingScreen.classList.remove('is-hidden');
  }

  setWorldReady(): void {
    this.worldReady = true;
    this.setLoadingProgress(1);
    this.startGameButton.disabled = false;
    this.updateStartButtonLabel();
    this.loadingScreen.classList.add('is-hidden');
  }

  setTallvokterFxLevel(level: TallvokterFxLevel): void {
    this.tallvokterFxLevel.value = level;
  }

  setLoadingError(): void {
    this.worldReady = false;
    this.startGameButton.disabled = true;
    this.startGameButton.textContent = 'Kartet kunne ikke lastes';
    this.loadingProgress.textContent = 'Noe mangler. Last siden på nytt og prøv igjen.';
  }

  openEntryScreen(): void {
    this.openStartScreen();
  }

  destroy(): void {
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleWindowBlur);
    this.mazeGrid.removeEventListener('pointerdown', this.handleMazePointerDown);
    this.mazeGrid.removeEventListener('pointermove', this.handleMazePointerMove);
    this.mazeGrid.removeEventListener('pointerup', this.handleMazePointerEnd);
    this.mazeGrid.removeEventListener('pointercancel', this.handleMazePointerEnd);
    this.mazeGrid.removeEventListener('lostpointercapture', this.handleMazePointerEnd);
    this.archiveScroll.removeEventListener('pointerdown', this.handleArchivePointerDown);
    this.archivePlayfield.removeEventListener('pointermove', this.handleArchivePointerMove);
    this.archivePlayfield.removeEventListener('pointerup', this.handleArchivePointerEnd);
    this.archivePlayfield.removeEventListener('pointercancel', this.handleArchivePointerEnd);
    this.crystalBridgePlayfield.removeEventListener(
      'pointermove',
      this.handleCrystalBridgePointerMove
    );
    this.crystalBridgePlayfield.removeEventListener(
      'pointerup',
      this.handleCrystalBridgePointerEnd
    );
    this.crystalBridgePlayfield.removeEventListener(
      'pointercancel',
      this.handleCrystalBridgePointerEnd
    );
    this.crystalBridgeAnswers.removeEventListener(
      'pointerdown',
      this.handleCrystalBridgeLayoutPointerDown
    );
    this.crystalBridgePlayfield.removeEventListener(
      'pointermove',
      this.handleCrystalBridgeLayoutPointerMove
    );
    this.crystalBridgePlayfield.removeEventListener(
      'pointerup',
      this.handleCrystalBridgeLayoutPointerEnd
    );
    this.crystalBridgePlayfield.removeEventListener(
      'pointercancel',
      this.handleCrystalBridgeLayoutPointerEnd
    );
    this.stopAllMazeInput();
    this.progress.removeEventListener('change', this.handleProgressChange);
    this.choiceGrid.removeEventListener('touchstart', this.handleBattleTouchStart, this.passiveTouchOptions);
    this.choiceGrid.removeEventListener('touchmove', this.handleBattleTouchMove, this.passiveTouchOptions);
    this.choiceGrid.removeEventListener('touchend', this.handleBattleTouchEnd, this.activeTouchOptions);
    this.choiceGrid.removeEventListener('touchcancel', this.handleBattleTouchCancel, this.passiveTouchOptions);
    this.hooks = undefined;
    this.clearBattleTimers();
    this.clearQuestTimers();
    this.clearGladiatorArenaTimer();
    this.stopManorSpiderAnimation();
    if (this.manorFeedbackTimer) {
      window.clearTimeout(this.manorFeedbackTimer);
      this.manorFeedbackTimer = undefined;
    }
    if (this.archiveFeedbackTimer) {
      window.clearTimeout(this.archiveFeedbackTimer);
      this.archiveFeedbackTimer = undefined;
    }
    if (this.crystalBridgeFeedbackTimer) {
      window.clearTimeout(this.crystalBridgeFeedbackTimer);
      this.crystalBridgeFeedbackTimer = undefined;
    }
    if (this.puzzleFeedbackTimer) {
      window.clearTimeout(this.puzzleFeedbackTimer);
      this.puzzleFeedbackTimer = undefined;
    }
    if (this.puzzlePreviewTimer) {
      window.clearTimeout(this.puzzlePreviewTimer);
      this.puzzlePreviewTimer = undefined;
    }
    if (this.toastTimer) {
      window.clearTimeout(this.toastTimer);
      this.toastTimer = undefined;
    }
    if (this.regnemonsterFeedbackTimer) {
      window.clearTimeout(this.regnemonsterFeedbackTimer);
      this.regnemonsterFeedbackTimer = undefined;
    }
    if (this.regnemonsterRewardTimer) {
      window.clearTimeout(this.regnemonsterRewardTimer);
      this.regnemonsterRewardTimer = undefined;
    }
    if (this.miningDrillTimer) {
      window.clearTimeout(this.miningDrillTimer);
      this.miningDrillTimer = undefined;
    }
    this.miningModal.classList.remove('is-drilling-active');
    navigator.vibrate?.(0);
    if (this.miningFeedbackTimer) {
      window.clearTimeout(this.miningFeedbackTimer);
      this.miningFeedbackTimer = undefined;
    }
  }

  isBattleOpen(): boolean {
    return !this.modal.classList.contains('is-hidden');
  }

  isQuestOpen(): boolean {
    return !this.questModal.classList.contains('is-hidden');
  }

  isWorldBlocked(): boolean {
    return !this.worldReady
      || !this.loadingScreen.classList.contains('is-hidden')
      || this.isBattleOpen()
      || this.isQuestOpen()
      || !this.tallvokterFinaleModal.classList.contains('is-hidden')
      || !this.gladiatorArenaModal.classList.contains('is-hidden')
      || !this.mazeModal.classList.contains('is-hidden')
      || !this.manorModal.classList.contains('is-hidden')
      || !this.archiveModal.classList.contains('is-hidden')
      || !this.crystalBridgeModal.classList.contains('is-hidden')
      || !this.puzzleQuestModal.classList.contains('is-hidden')
      || !this.campModal.classList.contains('is-hidden')
      || !this.crystalCartStoryModal.classList.contains('is-hidden')
      || !this.swampAlchemyStoryModal.classList.contains('is-hidden')
      || !this.swampAlchemyHud.classList.contains('is-hidden')
      || !this.lightForestStoryModal.classList.contains('is-hidden')
      || !this.lightForestHud.classList.contains('is-hidden')
      || !this.regnemonsterGameModal.classList.contains('is-hidden')
      || !this.regnemonsterBinderModal.classList.contains('is-hidden')
      || !this.startScreen.classList.contains('is-hidden')
      || !this.resetConfirm.classList.contains('is-hidden')
      || !this.prizeBoxModal.classList.contains('is-hidden')
      || !this.backpackModal.classList.contains('is-hidden')
      || !this.fishingSaleModal.classList.contains('is-hidden')
      || !this.miningModal.classList.contains('is-hidden')
      || !this.medalCabinetModal.classList.contains('is-hidden')
      || !this.rewardModal.classList.contains('is-hidden')
      || !this.tokenPickerModal.classList.contains('is-hidden')
      || !this.shopModal.classList.contains('is-hidden')
      || !this.tokenPreview.classList.contains('is-hidden')
      || !this.storyConfirm.classList.contains('is-hidden')
      || !this.mapSettingsModal.classList.contains('is-hidden')
      || !this.unlockConfirm.classList.contains('is-hidden');
  }

  setNearby(location: LocationNode | undefined): void {
    if (!getGameMap(this.progress.getSettings().mapId).showBossJourney) {
      this.nearby = undefined;
      this.nearbyCard.classList.add('is-hidden');
      return;
    }

    this.nearby = location;
    if (!location) {
      this.nearbyCard.classList.add('is-hidden');
      return;
    }

    const unlocked = this.progress.isUnlocked(location.id);
    const completed = this.progress.isCompleted(location.id);
    const rewardPending = this.progress.hasPendingReward(location.id);
    const canUnlock = this.progress.canUnlock(location.id);
    const stateLabel = rewardPending
      ? 'Mynt venter'
      : completed
        ? 'Fullført'
        : unlocked
          ? 'Åpen'
          : canUnlock
            ? 'Koster 1 mynt'
            : 'Låst';
    this.nearbyCard.innerHTML = `
      <div>
        <strong>${location.place}</strong>
        <span>${location.bossName} · ${stateLabel}</span>
      </div>
      <button type="button">${rewardPending ? 'Gå til mynten' : unlocked ? 'Start kamp' : canUnlock ? 'Lås opp' : 'Låst'}</button>
    `;
    this.nearbyCard.classList.remove('is-hidden');
  }

  setNearbyRegneriket(stop: RegneriketStop | undefined): void {
    this.nearby = undefined;
    if (!stop) {
      this.nearbyCard.classList.add('is-hidden');
      return;
    }

    const unlocked = this.progress.isRegneriketUnlocked(stop.id);
    const completed = this.progress.isRegneriketCompleted(stop.id);
    const rewardPending = this.progress.hasPendingRegneriketReward(stop.id);
    const canUnlock = this.progress.canUnlockRegneriketStop(stop.id);
    const stateLabel = rewardPending
      ? 'Mynt venter'
      : completed
        ? 'Fullført'
        : unlocked
          ? 'Åpen'
          : canUnlock
            ? 'Koster 1 mynt'
            : 'Låst';
    this.nearbyCard.innerHTML = `
      <div>
        <strong>${stop.place}</strong>
        <span>${stop.title} · ${stateLabel} · ${this.progress.getRegneriketRewardCoins(stop.id)} Regnecoins</span>
      </div>
      <button type="button">${rewardPending ? 'Hent mynt' : unlocked ? 'Start oppdrag' : canUnlock ? 'Lås opp' : 'Låst'}</button>
    `;
    this.nearbyCard.classList.remove('is-hidden');
  }

  setNearbyPortal(portal: NearbyPortalInfo | undefined): void {
    this.nearby = undefined;
    if (!portal) {
      this.nearbyCard.classList.add('is-hidden');
      return;
    }

    this.nearbyCard.innerHTML = `
      <div>
        <strong>${portal.title}</strong>
        <span>${portal.description}</span>
      </div>
      <button type="button">${portal.actionLabel ?? 'Ta portal'}</button>
    `;
    this.nearbyCard.classList.remove('is-hidden');
  }

  private triggerNearbyAction(): void {
    const now = window.performance.now();
    if (now - this.lastNearbyActionAt < 260) {
      return;
    }

    this.lastNearbyActionAt = now;
    this.hooks?.startBattle();
  }

  renderProgress(): void {
    const activeMap = getGameMap(this.progress.getSettings().mapId);
    const isRegnemonster = activeMap.id === REGNEMONSTER_MAP_ID;
    this.objective.textContent = this.progress.getNextObjective();
    this.objective.classList.toggle('is-hidden', isRegnemonster);
    if (activeMap.id === TALLVOKTER_MAP_ID) {
      const completed = new Set(this.progress.getCompleted());
      const completedQuestCount = TALLVOKTER_QUESTS.filter((quest) => completed.has(quest.id)).length;
      this.coinCount.textContent = `${completedQuestCount}/${TALLVOKTER_QUESTS.length}`;
    } else {
      this.coinCount.textContent = `${this.progress.getCollectedCoinCount()}/${this.progress.getTotalCoinCount()}`;
    }
    const regnecoins = this.progress.getRegnecoins();
    this.shopRegnecoinCount.textContent = String(regnecoins);
    this.coinCounterButton.classList.toggle('is-hidden', isRegnemonster);
    this.backpackButton.classList.toggle('is-hidden', isRegnemonster);
    this.tallvokterFxControl.classList.toggle('is-hidden', activeMap.id !== TALLVOKTER_MAP_ID);
    this.progressStrip.classList.toggle('is-hidden', !activeMap.showBossJourney);
    if (!activeMap.showBossJourney) {
      this.progressStrip.innerHTML = '';
      if (!isRegnemonster) {
        this.setNearby(undefined);
      }
      return;
    }
    this.progressStrip.innerHTML = LOCATIONS.filter((location) => (
      !location.hiddenUntilUnlocked || this.progress.isUnlocked(location.id) || this.progress.isCompleted(location.id)
    )).map((location) => {
      const completed = this.progress.isCompleted(location.id);
      const unlocked = this.progress.isUnlocked(location.id);
      return `<span class="${completed ? 'is-done' : unlocked ? 'is-open' : ''}" title="${location.place}">${location.order}</span>`;
    }).join('');
    this.setNearby(this.nearby);
  }

  showToast(message: string): void {
    this.toast.textContent = message;
    this.toast.classList.remove('is-hidden');
    if (this.toastTimer) {
      window.clearTimeout(this.toastTimer);
    }
    this.toastTimer = window.setTimeout(() => {
      this.toast.classList.add('is-hidden');
    }, 1900);
  }

  private openLegacyJourneyReward(): void {
    const medal = getMedal(this.progress.getActiveMedalId());
    const storyReward = medal.id === 'story';
    this.rewardMedal.src = medal.src;
    this.rewardMedal.alt = medal.label;
    this.rewardKicker.textContent = storyReward ? 'Story mode fullført' : `${medal.label} vunnet`;
    this.rewardTitle.textContent = storyReward ? 'Legendarisk utholdenhet!' : 'Mesterlig arbeid!';
    this.rewardCopy.textContent = storyReward
      ? 'Du slo hele reisen med bare tre liv totalt. Dette er Story mode-medaljen, og den kan bare vinnes her.'
      : 'Du slo alle bossene, samlet alle myntene og fant medaljen for denne utfordringen. Medaljen vil nå vises i premieskapet ditt!';
    this.rewardModal.classList.remove('is-hidden');
  }

  openJourneyReward(result?: RewardResult): void {
    const medalIds = result?.medalIds.length ? result.medalIds : [this.progress.getActiveMedalId()];
    const primaryMedalId = medalIds.find((id) => id !== 'immortal') ?? medalIds[0];
    const medal = getMedal(primaryMedalId);
    const extraMedal = medalIds.includes('immortal') && primaryMedalId !== 'immortal' ? getMedal('immortal') : undefined;
    const storyReward = medal.id === 'story';
    this.rewardMedal.src = medal.src;
    this.rewardMedal.alt = medal.label;
    if (extraMedal) {
      this.rewardExtraMedal.src = extraMedal.src;
      this.rewardExtraMedal.alt = extraMedal.label;
      this.rewardExtraMedal.classList.remove('is-hidden');
    } else {
      this.rewardExtraMedal.classList.add('is-hidden');
    }
    this.rewardKicker.textContent = storyReward ? 'Story mode fullført' : `${medal.label} vunnet`;
    this.rewardTitle.textContent = extraMedal ? 'Perfekt gjennomført!' : storyReward ? 'Legendarisk utholdenhet!' : 'Mesterlig arbeid!';
    this.rewardCopy.textContent = extraMedal
      ? `${medal.label} er lagt i premieskapet. Du mistet ingen liv og fikk også Udødelighets-medaljen!`
      : storyReward
        ? 'Du slo hele reisen med bare tre liv totalt. Dette er Story mode-medaljen, og den kan bare vinnes her.'
        : 'Du slo utfordringen og fant medaljen. Medaljen vil nå vises i premieskapet ditt!';
    this.rewardModal.classList.remove('is-hidden');
  }

  openMedalReward(medalIds: MedalId[], regnecoins: number): void {
    if (medalIds.length === 0) {
      if (regnecoins > 0) {
        this.showToast(`+${regnecoins} Regnecoins`);
      }
      return;
    }

    this.openJourneyReward({ medalIds, regnecoins });
  }

  openBattle(location: LocationNode, onWin: () => void): void {
    if (!this.progress.isUnlocked(location.id)) {
      this.showToast('Dette stedet er fortsatt låst.');
      return;
    }

    this.battle = createBattle(location, this.progress.getSettings(), this.progress.getBattleHearts());
    this.winCallback = onWin;
    this.clearBattleTimers();
    this.modal.classList.remove('is-hidden');
    this.retryBattle.classList.add('is-hidden');
    this.renderBattle('idle');
  }

  openRegneriketQuest(
    stop: RegneriketStop,
    onWin: () => void,
    successToast: string | false = 'Oppdrag fullført! Hent mynten på kartet.'
  ): void {
    if (!this.progress.isRegneriketUnlocked(stop.id)) {
      this.showToast('Dette oppdraget er fortsatt låst.');
      return;
    }

    if (this.progress.hasPendingRegneriketReward(stop.id)) {
      this.showToast(`Hent mynten til ${stop.place} først.`);
      return;
    }

    this.openMathQuest(stop, {
      mapLabel: 'Regneriket',
      kindLabel: this.getQuestKindLabel(stop.kind),
      onWin,
      successToast,
      allowRetry: true
    });
  }

  /** Shared entry point for every current and future mathematics quest. */
  openMathQuest(quest: MathQuestDefinition, options: MathQuestUiOptions): void {
    this.quest = createMathQuest(quest, this.progress.getSettings(), this.progress.getBattleHearts());
    this.questWinCallback = options.onWin;
    this.questLoseCallback = options.onLose;
    this.questSuccessToast = options.successToast ?? 'Oppdrag fullført!';
    this.questMapLabel = options.mapLabel;
    this.questKindLabel = options.kindLabel;
    this.questExitLocked = options.allowExit === false;
    this.questRegnecoinRewardAnimation = Math.max(0, options.regnecoinRewardAnimation ?? 0);
    this.questRetryCallback = options.allowRetry === false
      ? undefined
      : () => this.openMathQuest(quest, options);
    this.clearQuestTimers();
    this.questModal.classList.remove('is-hidden');
    this.retryQuest.classList.add('is-hidden');
    this.renderQuest();
  }

  /** Ready for the random encounter trigger that will be connected in the next phase. */
  openTallvokterThiefEncounter(onWin: () => void, onLose?: () => void): void {
    this.openMathQuest(TALLVOKTER_THIEF_QUEST, {
      mapLabel: 'Tallvokterens verden',
      kindLabel: 'Tyvekamp',
      onWin,
      onLose,
      successToast: false,
      allowRetry: false,
      allowExit: false,
      regnecoinRewardAnimation: 50
    });
  }

  openTallvokterThiefLossEnding(onContinue: () => void): void {
    if (!this.quest || this.quest.status !== 'lost') {
      return;
    }

    this.clearQuestTimers();
    this.thiefLossEndingActive = true;
    this.thiefLossContinueCallback = onContinue;
    this.questShell.classList.add('is-thief-loss-ending');
    this.thiefLossEnding.classList.remove('is-hidden');
    this.closeQuestButton.classList.add('is-hidden');
    this.retryQuest.classList.add('is-hidden');
    this.continueThiefLossButton.disabled = false;
    this.continueThiefLossButton.textContent = 'Neste';
  }

  finishTallvokterThiefLossEnding(): void {
    this.closeQuest(true);
  }

  private continueTallvokterThiefLossEnding(): void {
    if (!this.thiefLossEndingActive || !this.thiefLossContinueCallback || this.continueThiefLossButton.disabled) {
      return;
    }

    const callback = this.thiefLossContinueCallback;
    this.thiefLossContinueCallback = undefined;
    this.continueThiefLossButton.disabled = true;
    this.continueThiefLossButton.textContent = 'Tyvene tar pengene ...';
    callback();
  }

  openCrystalCartIntro(onStart: () => void): void {
    this.closeCrystalCartUi();
    this.crystalCartStoryKicker.textContent = 'Ruten gjennom Krystallgruven';
    this.crystalCartStoryTitle.textContent = 'Krystallvognen';
    this.crystalCartStoryMessage.textContent = CRYSTAL_CART_WELCOME;
    this.crystalCartStoryRules.classList.remove('is-hidden');
    this.crystalCartStoryReward.classList.add('is-hidden');
    this.closeCrystalCartStoryButton.classList.remove('is-hidden');
    this.crystalCartStoryPrimary.disabled = false;
    this.crystalCartStoryPrimary.textContent = 'Start Krystallvognen';
    this.crystalCartStoryPrimaryCallback = () => {
      this.hideCrystalCartStory();
      onStart();
    };
    this.crystalCartStoryCancelCallback = () => undefined;
    this.crystalCartStoryModal.classList.remove('is-hidden');
  }

  openCrystalCartRide(
    view: CrystalCartRideView,
    onChoose: (answer: number) => void,
    onExit: () => void,
    onTestVictory: () => void
  ): void {
    this.hideCrystalCartStory();
    this.crystalCartChoiceCallback = onChoose;
    this.crystalCartExitCallback = onExit;
    this.crystalCartTestCallback = onTestVictory;
    this.crystalCartRideHud.classList.remove('is-hidden');
    this.renderCrystalCartRide(view, onChoose, onExit, onTestVictory);
  }

  renderCrystalCartRide(
    view: CrystalCartRideView,
    onChoose: (answer: number) => void,
    onExit: () => void,
    onTestVictory: () => void
  ): void {
    this.crystalCartChoiceCallback = onChoose;
    this.crystalCartExitCallback = onExit;
    this.crystalCartTestCallback = onTestVictory;
    this.crystalCartCheckpointLabel.textContent = `${view.checkpoint} av ${view.checkpointCount}`;
    this.crystalCartProgress.replaceChildren(...Array.from(
      { length: view.checkpointCount },
      (_, index) => {
        const marker = document.createElement('span');
        marker.classList.toggle('is-complete', index < view.completedCheckpoints);
        return marker;
      }
    ));
    this.crystalCartHearts.innerHTML = Array.from(
      { length: view.maxPlayerHp },
      (_, index) => `<span class="heart ${index < view.playerHp ? 'is-live' : 'is-lost'}" aria-hidden="true">❤</span>`
    ).join('');
    this.crystalCartQuestion.textContent = view.prompt;
    this.crystalCartMessage.textContent = view.message;
    this.crystalCartChoices.replaceChildren(...view.choices.map((choice, index) => {
      const button = document.createElement('button');
      const laneLabel = document.createElement('small');
      const answer = document.createElement('strong');
      const colors = ['#54e8ff', '#a875ff', '#ffd35c', '#58f0c2'];
      button.type = 'button';
      button.className = 'crystal-cart-choice';
      button.style.setProperty('--crystal-lane', colors[index] ?? colors[0]);
      button.disabled = view.inputLocked;
      button.setAttribute('aria-label', `Spor ${index + 1}, svar ${choice}`);
      laneLabel.textContent = `Spor ${index + 1}`;
      answer.textContent = String(choice);
      button.append(laneLabel, answer);
      button.addEventListener('click', () => this.crystalCartChoiceCallback?.(choice));
      return button;
    }));
    this.leaveCrystalCartButton.disabled = view.inputLocked;
    this.crystalCartDevActions.querySelectorAll('button').forEach((button) => {
      (button as HTMLButtonElement).disabled = view.inputLocked;
    });
  }

  hideCrystalCartRide(): void {
    this.crystalCartRideHud.classList.add('is-hidden');
    this.crystalCartChoiceCallback = undefined;
    this.crystalCartExitCallback = undefined;
    this.crystalCartTestCallback = undefined;
  }

  openCrystalCartReward(rewardValue: number, onComplete: () => void): void {
    this.hideCrystalCartRide();
    this.crystalCartStoryKicker.textContent = 'Krystallkjernen er nådd';
    this.crystalCartStoryTitle.textContent = 'En mesterlig kjøretur!';
    this.crystalCartStoryMessage.textContent =
      'Du valgte riktig spor gjennom alle veikryssene. Krystallføreren har gjort klar belønningen din.';
    this.crystalCartStoryRules.classList.add('is-hidden');
    this.crystalCartStoryReward.classList.remove('is-hidden');
    this.crystalCartRewardValue.textContent = String(rewardValue);
    this.closeCrystalCartStoryButton.classList.add('is-hidden');
    this.crystalCartStoryPrimary.disabled = false;
    this.crystalCartStoryPrimary.textContent = `Få utbetalt ${rewardValue}`;
    this.crystalCartStoryCancelCallback = undefined;
    this.crystalCartStoryPrimaryCallback = () => {
      this.crystalCartStoryPrimary.disabled = true;
      this.crystalCartStoryPrimary.textContent = 'Utbetaler ...';
      const result = this.progress.completeTallvokterQuest(CRYSTAL_CART_QUEST_ID, rewardValue);
      const finish = () => {
        this.hideCrystalCartStory();
        onComplete();
      };
      this.playRegnecoinRewardAnimation(result.regnecoins, this.crystalCartStoryPrimary, finish);
    };
    this.crystalCartStoryModal.classList.remove('is-hidden');
  }

  openCrystalCartFailure(storyFailed: boolean, onComplete: () => void): void {
    this.hideCrystalCartRide();
    this.crystalCartStoryKicker.textContent = 'Vognen returnerte til inngangen';
    this.crystalCartStoryTitle.textContent = 'Ruten ble for farlig';
    this.crystalCartStoryMessage.textContent = storyFailed
      ? 'Alle hjertene er brukt opp. Gå tilbake til kartet. Der nullstilles Story mode-runden, og du starter ved portalen.'
      : 'Alle hjertene er brukt opp. Finn Krystallføreren igjen når du er klar for et nytt forsøk.';
    this.crystalCartStoryRules.classList.add('is-hidden');
    this.crystalCartStoryReward.classList.add('is-hidden');
    this.closeCrystalCartStoryButton.classList.add('is-hidden');
    this.crystalCartStoryPrimary.disabled = false;
    this.crystalCartStoryPrimary.textContent = 'Til kartet';
    this.crystalCartStoryCancelCallback = undefined;
    this.crystalCartStoryPrimaryCallback = () => {
      this.hideCrystalCartStory();
      onComplete();
    };
    this.crystalCartStoryModal.classList.remove('is-hidden');
  }

  closeCrystalCartUi(): void {
    this.hideCrystalCartStory();
    this.hideCrystalCartRide();
  }

  private advanceCrystalCartStory(): void {
    if (this.crystalCartStoryPrimary.disabled) {
      return;
    }
    const callback = this.crystalCartStoryPrimaryCallback;
    this.crystalCartStoryPrimaryCallback = undefined;
    callback?.();
  }

  private cancelCrystalCartStory(): void {
    if (this.crystalCartStoryModal.classList.contains('is-hidden')) {
      return;
    }
    const callback = this.crystalCartStoryCancelCallback;
    if (!callback) {
      return;
    }
    this.hideCrystalCartStory();
    callback();
  }

  private hideCrystalCartStory(): void {
    this.crystalCartStoryModal.classList.add('is-hidden');
    this.crystalCartStoryPrimaryCallback = undefined;
    this.crystalCartStoryCancelCallback = undefined;
    this.crystalCartStoryPrimary.disabled = false;
    this.closeCrystalCartStoryButton.classList.remove('is-hidden');
  }

  openSwampAlchemyIntro(onStart: () => void, onCancel?: () => void): void {
    this.closeSwampAlchemyUi();
    this.swampAlchemyStoryPanel.querySelector<HTMLImageElement>('.swamp-alchemy-character-stage > img')
      ?.setAttribute('src', SWAMP_ALCHEMIST_ASSET_PATH);
    this.swampAlchemyStoryKicker.textContent = 'Motgiften mot sumptåken';
    this.swampAlchemyStoryTitle.textContent = 'Sumpalkymistens motgift';
    this.swampAlchemyStoryMessage.textContent = SWAMP_ALCHEMY_WELCOME;
    this.swampAlchemyStoryRules.classList.remove('is-hidden');
    this.swampAlchemyStoryReward.classList.add('is-hidden');
    this.closeSwampAlchemyStoryButton.classList.remove('is-hidden');
    this.swampAlchemyStoryPrimary.disabled = false;
    this.swampAlchemyStoryPrimary.textContent = 'Start bryggingen';
    this.swampAlchemyStoryPrimaryCallback = () => {
      this.hideSwampAlchemyStory();
      onStart();
    };
    this.swampAlchemyStoryCancelCallback = onCancel ?? (() => undefined);
    this.swampAlchemyStoryModal.classList.remove('is-hidden');
  }

  openSwampAlchemyHud(
    view: SwampAlchemyHudView,
    onChoose: (answer: number) => void,
    onExit: () => void,
    onTestVictory: () => void
  ): void {
    this.hideSwampAlchemyStory();
    this.swampAlchemyHud.classList.remove('is-hidden');
    this.renderSwampAlchemyHud(view, onChoose, onExit, onTestVictory);
  }

  renderSwampAlchemyHud(
    view: SwampAlchemyHudView,
    onChoose: (answer: number) => void,
    onExit: () => void,
    onTestVictory: () => void
  ): void {
    this.swampAlchemyChoiceCallback = onChoose;
    this.swampAlchemyExitCallback = onExit;
    this.swampAlchemyTestCallback = onTestVictory;
    this.swampAlchemyRoundLabel.textContent = `Bryggerunde ${view.roundIndex + 1} av ${view.roundCount}`;
    this.swampAlchemyIngredientTrack.replaceChildren(...SWAMP_ALCHEMY_INGREDIENTS.map((ingredient, index) => {
      const step = document.createElement('div');
      const image = document.createElement('img');
      const label = document.createElement('span');
      step.className = 'swamp-alchemy-ingredient-step';
      step.classList.toggle('is-complete', view.completedIngredients.includes(ingredient.id));
      step.classList.toggle('is-active', index === view.roundIndex && !view.completedIngredients.includes(ingredient.id));
      image.src = ingredient.assetPath;
      image.alt = '';
      label.textContent = ingredient.displayName;
      step.append(image, label);
      return step;
    }));
    this.swampAlchemyHearts.innerHTML = Array.from(
      { length: view.maxPlayerHp },
      (_, index) => `<span class="heart ${index < view.playerHp ? 'is-live' : 'is-lost'}" aria-hidden="true">❤</span>`
    ).join('');
    this.swampAlchemyIngredientIcon.src = view.ingredientAssetPath;
    this.swampAlchemyIngredientIcon.alt = view.ingredientName;
    this.swampAlchemyIngredientName.textContent = view.ingredientName;
    this.swampAlchemyQuestionProgress.textContent = `${view.roundCorrect} av ${view.requiredCorrect} riktige`;
    this.swampAlchemyQuestion.textContent = view.prompt;
    this.swampAlchemyMessage.textContent = view.message;
    this.swampAlchemyQuizPanel.classList.toggle('is-hidden', view.phase !== 'quiz');
    this.swampAlchemyActionHint.classList.toggle('is-hidden', view.phase === 'quiz');
    this.swampAlchemyActionHint.textContent = view.phase === 'ingredient'
      ? `Dra ${view.ingredientName.toLowerCase()} fra arbeidsbenken og slipp den i gryten.`
      : view.phase === 'stirring'
        ? 'Ta tak i sleiven og rør én hel sirkel rundt i gryten.'
        : '';
    this.swampAlchemyChoices.replaceChildren(...view.choices.map((choice) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'swamp-alchemy-choice';
      button.disabled = view.inputLocked || view.phase !== 'quiz';
      button.textContent = String(choice);
      button.addEventListener('click', () => this.swampAlchemyChoiceCallback?.(choice));
      return button;
    }));
    this.leaveSwampAlchemyButton.disabled = view.inputLocked;
    this.swampAlchemyDevActions.querySelectorAll('button').forEach((button) => {
      (button as HTMLButtonElement).disabled = view.inputLocked || view.phase !== 'quiz';
    });
  }

  flashSwampAlchemyHit(): void {
    this.swampAlchemyHud.classList.remove('is-player-hit');
    void this.swampAlchemyHud.offsetWidth;
    this.swampAlchemyHud.classList.add('is-player-hit');
    window.setTimeout(() => this.swampAlchemyHud.classList.remove('is-player-hit'), 380);
  }

  hideSwampAlchemyHud(): void {
    this.swampAlchemyHud.classList.add('is-hidden');
    this.swampAlchemyHud.classList.remove('is-player-hit');
    this.swampAlchemyChoiceCallback = undefined;
    this.swampAlchemyExitCallback = undefined;
    this.swampAlchemyTestCallback = undefined;
  }

  openSwampAlchemyReward(rewardValue: number, onComplete: () => void): void {
    this.hideSwampAlchemyHud();
    this.swampAlchemyStoryKicker.textContent = 'Motgiften er ferdig';
    this.swampAlchemyStoryTitle.textContent = 'Sumptåken trekker seg tilbake!';
    this.swampAlchemyStoryMessage.textContent =
      'Alle fire ingrediensene er vekket, blandet og rørt sammen. Sumpalkymisten har gjort klar belønningen din.';
    this.swampAlchemyStoryRules.classList.add('is-hidden');
    this.swampAlchemyStoryReward.classList.remove('is-hidden');
    this.swampAlchemyRewardValue.textContent = String(rewardValue);
    this.closeSwampAlchemyStoryButton.classList.add('is-hidden');
    this.swampAlchemyStoryPrimary.disabled = false;
    this.swampAlchemyStoryPrimary.textContent = 'Få utbetalt';
    this.swampAlchemyStoryCancelCallback = undefined;
    this.swampAlchemyStoryPrimaryCallback = () => {
      this.swampAlchemyStoryPrimary.disabled = true;
      this.swampAlchemyStoryPrimary.textContent = 'Utbetaler ...';
      const result = this.progress.completeTallvokterQuest(SWAMP_ALCHEMY_QUEST_ID, rewardValue);
      const finish = () => {
        this.hideSwampAlchemyStory();
        onComplete();
      };
      if (result.regnecoins > 0) {
        this.playRegnecoinRewardAnimation(result.regnecoins, this.swampAlchemyStoryPrimary, finish);
      } else {
        finish();
      }
    };
    this.swampAlchemyStoryModal.classList.remove('is-hidden');
  }

  openSwampAlchemyFailure(storyFailed: boolean, onComplete: () => void): void {
    this.hideSwampAlchemyHud();
    this.swampAlchemyStoryKicker.textContent = 'Brygget ble ustabilt';
    this.swampAlchemyStoryTitle.textContent = 'Motgiften må brygges på nytt';
    this.swampAlchemyStoryMessage.textContent = storyFailed
      ? 'Det siste hjertet forsvant. Gå tilbake til kartet. Der nullstilles Story mode-runden, og du starter ved portalen.'
      : 'Det siste hjertet forsvant. Finn Sumpalkymisten igjen når du er klar for et nytt forsøk.';
    this.swampAlchemyStoryRules.classList.add('is-hidden');
    this.swampAlchemyStoryReward.classList.add('is-hidden');
    this.closeSwampAlchemyStoryButton.classList.add('is-hidden');
    this.swampAlchemyStoryPrimary.disabled = false;
    this.swampAlchemyStoryPrimary.textContent = 'Til kartet';
    this.swampAlchemyStoryCancelCallback = undefined;
    this.swampAlchemyStoryPrimaryCallback = () => {
      this.hideSwampAlchemyStory();
      onComplete();
    };
    this.swampAlchemyStoryModal.classList.remove('is-hidden');
  }

  closeSwampAlchemyUi(): void {
    this.hideSwampAlchemyStory();
    this.hideSwampAlchemyHud();
  }

  private advanceSwampAlchemyStory(): void {
    if (this.swampAlchemyStoryPrimary.disabled) return;
    const callback = this.swampAlchemyStoryPrimaryCallback;
    this.swampAlchemyStoryPrimaryCallback = undefined;
    callback?.();
  }

  private cancelSwampAlchemyStory(): void {
    if (this.swampAlchemyStoryModal.classList.contains('is-hidden')) return;
    const callback = this.swampAlchemyStoryCancelCallback;
    if (!callback) return;
    this.hideSwampAlchemyStory();
    callback();
  }

  private hideSwampAlchemyStory(): void {
    this.swampAlchemyStoryModal.classList.add('is-hidden');
    this.swampAlchemyStoryPrimaryCallback = undefined;
    this.swampAlchemyStoryCancelCallback = undefined;
    this.swampAlchemyStoryPrimary.disabled = false;
    this.closeSwampAlchemyStoryButton.classList.remove('is-hidden');
  }

  openLightForestIntro(onStart: () => void, onCancel?: () => void): void {
    this.closeLightForestUi();
    const background = this.lightForestStoryModal.querySelector<HTMLImageElement>('.light-forest-story-background');
    background?.setAttribute('src', LIGHT_FOREST_NETWORK_ASSET_PATH);
    background?.setAttribute('alt', 'Lysrøttenes nettverk i Lysskogen');
    const character = this.lightForestStoryModal.querySelector<HTMLImageElement>('.light-forest-character');
    character?.setAttribute('src', LIGHT_WEAVER_ASSET_PATH);
    character?.setAttribute('alt', 'Lysveveren');
    const caption = this.lightForestStoryModal.querySelector<HTMLElement>('.light-forest-character-caption');
    if (caption) caption.innerHTML = '<span>Lysskogens vokter</span><strong>Lysveveren</strong>';
    this.lightForestStoryKicker.textContent = 'Fem trær · ett levende nettverk';
    this.lightForestStoryTitle.textContent = 'Lysrøttenes nettverk';
    this.lightForestStoryMessage.textContent = LIGHT_FOREST_WELCOME;
    this.lightForestStoryRules.classList.remove('is-hidden');
    this.lightForestStoryRules.innerHTML = `
      <div><strong>5</strong><span>sovende trær</span></div>
      <div><strong>2</strong><span>riktige svar per tre</span></div>
      <div><strong>♥</strong><span>feil koster liv</span></div>
    `;
    this.lightForestStoryReward.classList.add('is-hidden');
    this.closeLightForestStoryButton.classList.remove('is-hidden');
    this.lightForestStoryPrimary.disabled = false;
    this.lightForestStoryPrimary.textContent = 'Tenn den første lysroten';
    this.lightForestStoryPrimaryCallback = () => {
      this.hideLightForestStory();
      onStart();
    };
    this.lightForestStoryCancelCallback = onCancel ?? (() => undefined);
    this.lightForestStoryModal.classList.remove('is-hidden');
  }

  openLightForestHud(
    view: LightForestHudView,
    onExit: () => void,
    onTestVictory: () => void
  ): void {
    this.hideLightForestStory();
    this.lightForestQuestionCard.classList.remove('is-hidden');
    this.lightForestHud.classList.remove('is-hidden');
    this.renderLightForestHud(view, onExit, onTestVictory);
  }

  renderLightForestHud(
    view: LightForestHudView,
    onExit: () => void,
    onTestVictory: () => void
  ): void {
    this.lightForestExitCallback = onExit;
    this.lightForestTestCallback = onTestVictory;
    this.lightForestQuestionCard.dataset.phase = view.phase;
    this.lightForestHud.dataset.phase = view.phase;
    this.lightForestAreaLabel.textContent = `${view.areaName} · tre ${view.areaIndex + 1} av ${LIGHT_FOREST_AREAS.length}`;
    this.lightForestQuestion.textContent = view.prompt || 'Bygg Lysrøttenes nettverk';
    this.lightForestMessage.textContent = view.message;
    this.lightForestProgress.replaceChildren(...Array.from(
      { length: LIGHT_FOREST_TOTAL_REQUIRED },
      (_, index) => {
        const marker = document.createElement('span');
        marker.classList.toggle('is-complete', index < view.totalCorrect);
        return marker;
      }
    ));
    this.lightForestProgress.setAttribute('aria-valuenow', String(view.totalCorrect));
    this.lightForestHearts.innerHTML = Array.from(
      { length: view.maxPlayerHp },
      (_, index) => `<span class="heart ${index < view.playerHp ? 'is-live' : 'is-lost'}" aria-hidden="true">❤</span>`
    ).join('');
    this.lightForestHearts.setAttribute('aria-label', `${view.playerHp} av ${view.maxPlayerHp} hjerter`);
    this.leaveLightForestButton.disabled = false;
    this.lightForestDevActions.querySelectorAll('button').forEach((button) => {
      (button as HTMLButtonElement).disabled = view.inputLocked;
    });
  }

  flashLightForestHit(): void {
    this.lightForestHud.classList.remove('is-player-hit');
    void this.lightForestHud.offsetWidth;
    this.lightForestHud.classList.add('is-player-hit');
    window.setTimeout(() => this.lightForestHud.classList.remove('is-player-hit'), 380);
  }

  hideLightForestHud(): void {
    this.lightForestQuestionCard.classList.add('is-hidden');
    this.lightForestHud.classList.add('is-hidden');
    this.lightForestHud.classList.remove('is-player-hit');
    this.lightForestExitCallback = undefined;
    this.lightForestTestCallback = undefined;
  }

  openLightForestReward(rewardValue: number, onComplete: () => void): void {
    this.hideLightForestHud();
    this.lightForestStoryModal.querySelector<HTMLImageElement>('.light-forest-story-background')
      ?.setAttribute('src', LIGHT_FOREST_NETWORK_ASSET_PATH);
    this.lightForestStoryKicker.textContent = 'Alle fem lystrærne er koblet sammen';
    this.lightForestStoryTitle.textContent = 'Nettverket lever!';
    this.lightForestStoryMessage.textContent =
      'Lyset strømmer fra rothjertet gjennom hele skogen. Lysveveren har gjort klar belønningen din.';
    this.lightForestStoryRules.classList.add('is-hidden');
    this.lightForestStoryReward.classList.remove('is-hidden');
    const rewardLabel = this.lightForestStoryReward.querySelector<HTMLElement>(':scope > span');
    if (rewardLabel) rewardLabel.textContent = 'Belønning når lystrærne er vekket';
    this.lightForestRewardValue.textContent = String(rewardValue);
    this.closeLightForestStoryButton.classList.add('is-hidden');
    this.lightForestStoryPrimary.disabled = false;
    this.lightForestStoryPrimary.textContent = 'Få utbetalt';
    this.lightForestStoryCancelCallback = undefined;
    this.lightForestStoryPrimaryCallback = () => {
      this.lightForestStoryPrimary.disabled = true;
      this.lightForestStoryPrimary.textContent = 'Utbetaler ...';
      const result = this.progress.completeTallvokterQuest(LIGHT_FOREST_QUEST_ID, rewardValue);
      const finish = () => {
        this.hideLightForestStory();
        onComplete();
      };
      if (result.regnecoins > 0) {
        this.playRegnecoinRewardAnimation(result.regnecoins, this.lightForestStoryPrimary, finish);
      } else {
        finish();
      }
    };
    this.lightForestStoryModal.classList.remove('is-hidden');
  }

  openLightForestFailure(storyFailed: boolean, onComplete: () => void): void {
    this.hideLightForestHud();
    this.lightForestStoryKicker.textContent = 'Skyggerøttene tok over';
    this.lightForestStoryTitle.textContent = 'Nettverket må bygges på nytt';
    this.lightForestStoryMessage.textContent = storyFailed
      ? 'Det siste hjertet forsvant. Gå tilbake til kartet. Der nullstilles Story mode-runden, og du starter ved portalen.'
      : 'Det siste hjertet forsvant. Finn Lysveveren igjen når du er klar til å reparere lysrøttene på nytt.';
    this.lightForestStoryRules.classList.add('is-hidden');
    this.lightForestStoryReward.classList.add('is-hidden');
    this.closeLightForestStoryButton.classList.add('is-hidden');
    this.lightForestStoryPrimary.disabled = false;
    this.lightForestStoryPrimary.textContent = 'Til kartet';
    this.lightForestStoryCancelCallback = undefined;
    this.lightForestStoryPrimaryCallback = () => {
      this.hideLightForestStory();
      onComplete();
    };
    this.lightForestStoryModal.classList.remove('is-hidden');
  }

  closeLightForestUi(): void {
    this.hideLightForestStory();
    this.hideLightForestHud();
  }

  private advanceLightForestStory(): void {
    if (this.lightForestStoryPrimary.disabled) return;
    const callback = this.lightForestStoryPrimaryCallback;
    this.lightForestStoryPrimaryCallback = undefined;
    callback?.();
  }

  private cancelLightForestStory(): void {
    if (this.lightForestStoryModal.classList.contains('is-hidden')) return;
    const callback = this.lightForestStoryCancelCallback;
    if (!callback) return;
    this.hideLightForestStory();
    callback();
  }

  private hideLightForestStory(): void {
    this.lightForestStoryModal.classList.add('is-hidden');
    this.lightForestStoryPrimaryCallback = undefined;
    this.lightForestStoryCancelCallback = undefined;
    this.lightForestStoryPrimary.disabled = false;
    this.closeLightForestStoryButton.classList.remove('is-hidden');
  }

  openCounterweightVaultIntro(onStart: () => void, onCancel?: () => void): void {
    this.closeCounterweightVaultUi();
    const background = this.lightForestStoryModal.querySelector<HTMLImageElement>('.light-forest-story-background');
    background?.setAttribute('src', VAULT_BACKGROUND_ASSET_PATH);
    background?.setAttribute('alt', 'Motvekthvelvets fire låser');
    const character = this.lightForestStoryModal.querySelector<HTMLImageElement>('.light-forest-character');
    character?.setAttribute('src', VAULT_GUARDIAN_ASSET_PATH);
    character?.setAttribute('alt', 'Hvelvvokteren');
    const caption = this.lightForestStoryModal.querySelector<HTMLElement>('.light-forest-character-caption');
    if (caption) caption.innerHTML = '<span>Det forseglede hvelvets vokter</span><strong>Hvelvvokteren</strong>';
    this.lightForestStoryKicker.textContent = 'Fire låser · én levende motvekt';
    this.lightForestStoryTitle.textContent = 'Motvekthvelvet';
    this.lightForestStoryMessage.textContent = COUNTERWEIGHT_VAULT_WELCOME;
    this.lightForestStoryRules.classList.remove('is-hidden');
    this.lightForestStoryRules.innerHTML = `
      <div><strong>4</strong><span>hvelvlåser</span></div>
      <div><strong>2</strong><span>riktige svar per lås</span></div>
      <div><strong>♥</strong><span>feil koster liv</span></div>
    `;
    this.lightForestStoryReward.classList.add('is-hidden');
    this.closeLightForestStoryButton.classList.remove('is-hidden');
    this.lightForestStoryPrimary.disabled = false;
    this.lightForestStoryPrimary.textContent = 'Bygg motvekten';
    this.lightForestStoryPrimaryCallback = () => {
      this.hideLightForestStory();
      onStart();
    };
    this.lightForestStoryCancelCallback = onCancel ?? (() => undefined);
    this.lightForestStoryModal.classList.remove('is-hidden');
  }

  openMiningExpeditionIntro(onStart: () => void, onCancel?: () => void): void {
    this.closeLightForestUi();
    const background = this.lightForestStoryModal.querySelector<HTMLImageElement>(
      '.light-forest-story-background'
    );
    background?.setAttribute('src', '/regnemester/crystal-cart/crystal-mine-journey.png');
    background?.setAttribute('alt', 'Gullgruven med skinner og lysende krystaller');
    const character = this.lightForestStoryModal.querySelector<HTMLImageElement>(
      '.light-forest-character'
    );
    character?.setAttribute('src', MINE_BOSS_ASSET_PATH);
    character?.setAttribute('alt', 'Gruvesjefen');
    const caption = this.lightForestStoryModal.querySelector<HTMLElement>(
      '.light-forest-character-caption'
    );
    if (caption) {
      caption.innerHTML = '<span>Gullgruvens oppdragsgiver</span><strong>Gruvesjefen</strong>';
    }
    this.lightForestStoryKicker.textContent = 'Ti oppgaver · opptil ti bor';
    this.lightForestStoryTitle.textContent = 'Gruveekspedisjonen';
    this.lightForestStoryMessage.textContent =
      'Gruvesjefen trenger en modig tallgraver. Svar på ti matematikkoppgaver først. Hvert riktige svar gir ett bor som du kan bruke til å åpne en valgfri rute i gruven og lete etter verdifulle funn.';
    this.lightForestStoryRules.classList.remove('is-hidden');
    this.lightForestStoryRules.innerHTML = `
      <div><strong>10</strong><span>matematikkoppgaver</span></div>
      <div><strong>1</strong><span>bor per riktig svar</span></div>
      <div><strong>10×10</strong><span>ruter med skjulte funn</span></div>
    `;
    this.lightForestStoryReward.classList.add('is-hidden');
    this.closeLightForestStoryButton.classList.remove('is-hidden');
    this.lightForestStoryPrimary.disabled = false;
    this.lightForestStoryPrimary.textContent = 'Start Gruveekspedisjonen';
    this.lightForestStoryPrimaryCallback = () => {
      this.hideLightForestStory();
      onStart();
    };
    this.lightForestStoryCancelCallback = onCancel ?? (() => undefined);
    this.lightForestStoryModal.classList.remove('is-hidden');
  }

  private openMiningExpeditionFailure(onComplete: () => void): void {
    const background = this.lightForestStoryModal.querySelector<HTMLImageElement>(
      '.light-forest-story-background'
    );
    background?.setAttribute('src', '/regnemester/crystal-cart/crystal-mine-journey.png');
    background?.setAttribute('alt', 'Gullgruven med skinner og lysende krystaller');
    const character = this.lightForestStoryModal.querySelector<HTMLImageElement>(
      '.light-forest-character'
    );
    character?.setAttribute('src', MINE_BOSS_ASSET_PATH);
    character?.setAttribute('alt', 'Gruvesjefen');
    const caption = this.lightForestStoryModal.querySelector<HTMLElement>(
      '.light-forest-character-caption'
    );
    if (caption) {
      caption.innerHTML = '<span>Gullgruvens oppdragsgiver</span><strong>Gruvesjefen</strong>';
    }
    this.lightForestStoryKicker.textContent = 'Ekspedisjonen er over';
    this.lightForestStoryTitle.textContent = 'Det siste hjertet er brukt';
    this.lightForestStoryMessage.textContent =
      'Gå tilbake til kartet. Story mode-runden nullstilles, og du starter den nye reisen ved portalen.';
    this.lightForestStoryRules.classList.add('is-hidden');
    this.lightForestStoryReward.classList.add('is-hidden');
    this.closeLightForestStoryButton.classList.add('is-hidden');
    this.lightForestStoryPrimary.disabled = false;
    this.lightForestStoryPrimary.textContent = 'Tilbake til kartet';
    this.lightForestStoryCancelCallback = undefined;
    this.lightForestStoryPrimaryCallback = () => {
      this.hideLightForestStory();
      onComplete();
    };
    this.lightForestStoryModal.classList.remove('is-hidden');
  }

  openCounterweightVaultReward(rewardValue: number, onComplete: () => void): void {
    this.lightForestStoryModal.querySelector<HTMLImageElement>('.light-forest-story-background')
      ?.setAttribute('src', VAULT_BACKGROUND_ASSET_PATH);
    this.lightForestStoryModal.querySelector<HTMLImageElement>('.light-forest-character')
      ?.setAttribute('src', VAULT_GUARDIAN_ASSET_PATH);
    this.lightForestStoryKicker.textContent = 'Alle fire hvelvlåsene er åpne';
    this.lightForestStoryTitle.textContent = 'Hvelvet er i balanse!';
    this.lightForestStoryMessage.textContent =
      'Motvekten går jevnt, den forseglede porten åpner seg, og Hvelvvokteren overrekker belønningen.';
    this.lightForestStoryRules.classList.add('is-hidden');
    this.lightForestStoryReward.classList.remove('is-hidden');
    const rewardLabel = this.lightForestStoryReward.querySelector<HTMLElement>(':scope > span');
    if (rewardLabel) rewardLabel.textContent = 'Belønning for å åpne Motvekthvelvet';
    this.lightForestRewardValue.textContent = String(rewardValue);
    this.closeLightForestStoryButton.classList.add('is-hidden');
    this.lightForestStoryPrimary.disabled = false;
    this.lightForestStoryPrimary.textContent = 'Få utbetalt';
    this.lightForestStoryCancelCallback = undefined;
    this.lightForestStoryPrimaryCallback = () => {
      this.lightForestStoryPrimary.disabled = true;
      this.lightForestStoryPrimary.textContent = 'Utbetaler ...';
      const result = this.progress.completeTallvokterQuest(
        COUNTERWEIGHT_VAULT_QUEST_ID,
        rewardValue
      );
      const finish = () => {
        this.hideLightForestStory();
        onComplete();
      };
      if (result.regnecoins > 0) {
        this.playRegnecoinRewardAnimation(result.regnecoins, this.lightForestStoryPrimary, finish);
      } else {
        finish();
      }
    };
    this.lightForestStoryModal.classList.remove('is-hidden');
  }

  openCounterweightVaultFailure(storyFailed: boolean, onComplete: () => void): void {
    this.lightForestStoryModal.querySelector<HTMLImageElement>('.light-forest-story-background')
      ?.setAttribute('src', VAULT_BACKGROUND_ASSET_PATH);
    this.lightForestStoryModal.querySelector<HTMLImageElement>('.light-forest-character')
      ?.setAttribute('src', VAULT_GUARDIAN_ASSET_PATH);
    this.lightForestStoryKicker.textContent = 'Motvekten slo tilbake';
    this.lightForestStoryTitle.textContent = 'Hvelvet forsegles igjen';
    this.lightForestStoryMessage.textContent = storyFailed
      ? 'Det siste hjertet forsvant. Gå tilbake til kartet. Der nullstilles Story mode-runden, og du starter ved portalen.'
      : 'Det siste hjertet forsvant. Alle fire låsene må åpnes på nytt neste gang du undersøker porten.';
    this.lightForestStoryRules.classList.add('is-hidden');
    this.lightForestStoryReward.classList.add('is-hidden');
    this.closeLightForestStoryButton.classList.add('is-hidden');
    this.lightForestStoryPrimary.disabled = false;
    this.lightForestStoryPrimary.textContent = 'Til kartet';
    this.lightForestStoryCancelCallback = undefined;
    this.lightForestStoryPrimaryCallback = () => {
      this.hideLightForestStory();
      onComplete();
    };
    this.lightForestStoryModal.classList.remove('is-hidden');
  }

  closeCounterweightVaultUi(): void {
    this.hideLightForestStory();
  }

  openUnlockConfirm(location: LocationNode, onConfirm: () => void): void {
    this.prepareUnlockConfirm(true);
    this.unlockConfirmCallback = onConfirm;
    this.unlockTitle.textContent = `Lås opp ${location.place}?`;
    this.unlockCopy.textContent = `Bruk 1 mynt for å åpne kampen mot ${location.bossName}. Du har ${this.progress.getAvailableUnlockCoinCount()} mynt${this.progress.getAvailableUnlockCoinCount() === 1 ? '' : 'er'} som kan brukes.`;
    this.cancelUnlock.textContent = 'Avbryt';
    this.confirmUnlockButton.textContent = 'Bruk mynt';
    this.cancelUnlock.textContent = 'Avbryt';
    this.confirmUnlockButton.textContent = 'Bruk mynt';
    this.unlockConfirm.classList.remove('is-hidden');
  }

  openRegneriketUnlockConfirm(stop: RegneriketStop, onConfirm: () => void): void {
    this.prepareUnlockConfirm(true);
    const coins = this.progress.getAvailableRegneriketUnlockCoinCount();
    this.unlockConfirmCallback = onConfirm;
    this.unlockTitle.textContent = `Lås opp ${stop.place}?`;
    this.unlockCopy.textContent = `Bruk 1 mynt for å åpne oppdraget "${stop.title}". Du har ${coins} mynt${coins === 1 ? '' : 'er'} som kan brukes.`;
    this.unlockConfirm.classList.remove('is-hidden');
  }

  openInfoConfirm(title: string, copy: string, confirmText: string, onConfirm: () => void, cancelText = 'Tilbake'): void {
    this.prepareUnlockConfirm(true);
    this.unlockConfirmCallback = onConfirm;
    this.unlockTitle.textContent = title;
    this.unlockCopy.textContent = copy;
    this.cancelUnlock.textContent = cancelText;
    this.confirmUnlockButton.textContent = confirmText;
    this.unlockConfirm.classList.remove('is-hidden');
  }

  openMandatoryInfo(title: string, copy: string, confirmText: string, onConfirm: () => void): void {
    this.prepareUnlockConfirm(false);
    this.unlockConfirmCallback = onConfirm;
    this.unlockTitle.textContent = title;
    this.unlockCopy.textContent = copy;
    this.confirmUnlockButton.textContent = confirmText;
    this.unlockConfirm.classList.remove('is-hidden');
  }

  restartStoryModeAfterFailure(): void {
    this.storyModeRestartPending = true;
    this.hooks?.resetInput();
  }

  completeStoryModeRestartAfterReturn(): void {
    if (!this.storyModeRestartPending) return;
    this.storyModeRestartPending = false;
    this.progress.failStoryMode();
    this.hooks?.resetPlayerToProgress();
    this.hooks?.resetInput();
    window.setTimeout(() => {
      this.openMandatoryInfo(
        'Story mode starter på nytt',
        'Du mistet det siste hjertet. Hele reisen er nullstilt, og alle oppdragene må gjennomføres på nytt.',
        'Start reisen på nytt',
        () => {
          this.hooks?.resetPlayerToProgress();
          this.hooks?.resetInput();
        }
      );
    }, 180);
  }

  private prepareUnlockConfirm(dismissible: boolean): void {
    this.unlockConfirmDismissible = dismissible;
    this.cancelUnlock.classList.toggle('is-hidden', !dismissible);
  }

  private confirmUnlock(): void {
    const callback = this.unlockConfirmCallback;
    this.closeUnlockConfirm(true);
    callback?.();
  }

  private openTokenPicker(): void {
    this.closeTokenPreview();
    this.tokenPickerModal.classList.remove('is-hidden');
    this.renderStartControls();
  }

  private closeTokenPicker(): void {
    this.tokenPickerModal.classList.add('is-hidden');
    this.tokenPicker.innerHTML = '';
  }

  private openShop(): void {
    this.closeTokenPreview();
    this.shopSection = 'tokens';
    this.closeCardReveal();
    this.shopModal.classList.remove('is-hidden');
    this.renderStartControls();
  }

  private closeShop(): void {
    this.shopModal.classList.add('is-hidden');
    this.closeCardReveal();
    this.shopSection = 'tokens';
    this.shopGrid.innerHTML = '';
  }

  private setShopSection(section: ShopSection): void {
    this.shopSection = section;
    this.closeCardReveal();
    this.renderShop();
  }

  private closeCardReveal(): void {
    if (this.cardRevealTimer !== undefined) {
      window.clearTimeout(this.cardRevealTimer);
      this.cardRevealTimer = undefined;
    }
    this.cardReveal.classList.add('is-hidden');
    this.cardReveal.classList.remove('is-card-open');
    this.cardReveal.classList.remove('is-revealing');
    this.cardReveal.removeAttribute('data-rarity');
    this.cardRevealFlipper.classList.remove('is-flipped');
    this.cardRevealFlipper.disabled = false;
    this.cardRevealDetails.classList.add('is-hidden');
    this.cardRevealImage.removeAttribute('src');
    this.cardRevealImage.alt = '';
  }

  private getMysteryPackCost(): number {
    const isLocalTestServer = import.meta.env.DEV
      && ['127.0.0.1', 'localhost', '::1'].includes(window.location.hostname);
    return isLocalTestServer ? 0 : MYSTERY_PACK_COST;
  }

  private purchaseMysteryPack(): void {
    const packCost = this.getMysteryPackCost();
    const missing = Math.max(0, packCost - this.progress.getRegnecoins());
    if (missing > 0) {
      this.mysteryPackStatus.textContent = `Du mangler ${missing} Regnecoins.`;
      this.showToast(`Du trenger ${missing} Regnecoins til en mysteriepakke.`);
      return;
    }

    const result = this.progress.purchaseMysteryPack(Math.random, packCost);
    if (!result) {
      return;
    }

    const card = getCollectibleCardById(result.cardId);
    const rarity = COLLECTIBLE_CARD_RARITIES[card.rarity];
    this.cardReveal.dataset.rarity = card.rarity;
    this.cardRevealImage.src = card.src;
    this.cardRevealImage.alt = card.title;
    this.cardRevealTitle.textContent = card.title;
    this.cardRevealRarity.textContent = rarity.label;
    this.cardReveal.classList.remove('is-card-open');
    this.cardReveal.classList.remove('is-revealing');
    this.cardRevealFlipper.classList.remove('is-flipped');
    this.cardRevealFlipper.disabled = false;
    this.cardRevealDetails.classList.add('is-hidden');
    this.cardReveal.classList.remove('is-hidden');
  }

  private revealMysteryCard(): void {
    if (
      this.cardReveal.classList.contains('is-hidden')
      || this.cardRevealFlipper.classList.contains('is-flipped')
      || this.cardReveal.classList.contains('is-revealing')
    ) {
      return;
    }
    this.cardReveal.classList.add('is-revealing');
    this.cardRevealFlipper.disabled = true;
    const revealDuration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 80 : 3200;
    this.cardRevealTimer = window.setTimeout(() => {
      this.cardRevealFlipper.classList.add('is-flipped');
      this.cardReveal.classList.remove('is-revealing');
      this.cardRevealDetails.classList.remove('is-hidden');
      this.cardReveal.classList.add('is-card-open');
      this.cardRevealTimer = undefined;
    }, revealDuration);
  }

  private openBackpack(): void {
    this.backpackModal.classList.remove('is-hidden');
    this.setFishBucketExpanded(false);
    this.renderBackpack();
  }

  private closeBackpack(): void {
    this.backpackModal.classList.add('is-hidden');
    this.setFishBucketExpanded(false);
  }

  private setFishBucketExpanded(expanded: boolean): void {
    this.fishBucketToggle.setAttribute('aria-expanded', String(expanded));
    this.fishBucketContent.classList.toggle('is-hidden', !expanded);
  }

  public openMazeQuest(): void {
    this.stopAllMazeInput();
    this.mazeGrid.replaceChildren();
    this.mazeGridTrack = undefined;
    this.mazeCellButtons = [];
    this.mazePlayerToken = undefined;
    this.mazeCellPixelSize = 0;
    this.mazePlayerX = undefined;
    this.mazePlayerY = undefined;
    this.mazeCameraX = undefined;
    this.mazeCameraY = undefined;
    this.mazeRevealedCells.clear();
    this.mazeReturnScroll = undefined;
    this.mazeQuest = createMazeQuest(
      this.progress.getSettings(),
      this.progress.getBattleHearts()
    );
    this.mazePanel.classList.remove('is-player-hit');
    this.mazeModal.classList.remove('is-hidden');
    this.renderMazeQuest();
  }

  private closeMazeQuest(): void {
    const wasOpen = !this.mazeModal.classList.contains('is-hidden');
    this.stopAllMazeInput();
    this.mazeModal.classList.add('is-hidden');
    this.mazeQuest = undefined;
    this.mazeGrid.replaceChildren();
    this.mazeGridTrack = undefined;
    this.mazeCellButtons = [];
    this.mazePlayerToken = undefined;
    this.mazeCellPixelSize = 0;
    this.mazePlayerX = undefined;
    this.mazePlayerY = undefined;
    this.mazeCameraX = undefined;
    this.mazeCameraY = undefined;
    this.mazeRevealedCells.clear();
    this.mazeReturnScroll = undefined;
    this.mazeChoices.innerHTML = '';
    if (wasOpen) this.hooks?.resetInput();
  }

  private advanceMazeQuest(): void {
    const state = this.mazeQuest;
    if (!state) return;
    if (state.phase === 'intro') {
      this.mazeQuest = startMazeQuest(state);
      this.syncMazePlayerPosition(true);
    } else if (state.phase === 'gate-opened') {
      this.mazeQuest = continueAfterGate(state);
      this.syncMazePlayerPosition(true);
      this.blurHudFocus();
    }
    else if (state.phase === 'reward') {
      this.mazePrimary.disabled = true;
      const result = this.progress.completeTallvokterQuest(MAZE_QUEST_ID, state.rewardValue);
      this.renderBackpack();
      const finishPayment = () => {
        if (this.mazeQuest?.phase === 'reward') {
          this.mazeQuest = markMazeRewardPaid(this.mazeQuest);
        }
        this.mazePrimary.disabled = false;
        this.renderMazeQuest();
      };
      if (result.regnecoins > 0) {
        this.playRegnecoinRewardAnimation(result.regnecoins, this.mazePrimary, finishPayment);
      } else {
        finishPayment();
      }
      return;
    } else if (state.phase === 'paid') this.closeMazeQuest();
    else if (state.phase === 'lost') {
      const storyFailed = state.settings.playMode === 'story';
      this.closeMazeQuest();
      if (storyFailed) this.completeStoryModeRestartAfterReturn();
      else this.openMazeQuest();
      return;
    }
    this.renderMazeQuest();
    if (this.mazeQuest?.phase === 'maze') {
      this.restoreScrollPositions(this.mazeReturnScroll);
      this.mazeReturnScroll = undefined;
      if (!this.isMazeCameraSettled()) this.ensureMazeMotionLoop();
    }
  }

  private startMazeMovement(direction: MazeDirection): void {
    if (this.mazeModal.classList.contains('is-hidden') || this.mazeQuest?.phase !== 'maze') return;
    if (this.mazeHeldDirections.includes(direction)) return;

    this.mazeHeldDirections = this.mazeHeldDirections.filter((heldDirection) => heldDirection !== direction);
    this.mazeHeldDirections.push(direction);
    this.ensureMazeMotionLoop();
  }

  private stopMazeMovement(direction?: MazeDirection): void {
    if (direction) {
      this.mazeHeldDirections = this.mazeHeldDirections.filter((heldDirection) => heldDirection !== direction);
    } else {
      this.mazeHeldDirections = [];
    }
    this.stopMazeMotionLoopIfIdle();
  }

  private stopAllMazeInput(): void {
    this.mazeHeldDirections = [];
    this.mazePointerControl = undefined;
    if (this.mazeMotionFrame !== undefined) window.cancelAnimationFrame(this.mazeMotionFrame);
    this.mazeMotionFrame = undefined;
    this.mazeLastMotionAt = undefined;
  }

  private stopMazeMotionLoopIfIdle(): void {
    if (this.mazeHeldDirections.length > 0 || this.mazePointerControl) return;
    if (!this.isMazeCameraSettled()) {
      this.ensureMazeMotionLoop();
      return;
    }
    if (this.mazeMotionFrame === undefined) return;
    window.cancelAnimationFrame(this.mazeMotionFrame);
    this.mazeMotionFrame = undefined;
    this.mazeLastMotionAt = undefined;
  }

  private ensureMazeMotionLoop(): void {
    if (this.mazeMotionFrame !== undefined || this.mazeQuest?.phase !== 'maze') return;
    this.mazeLastMotionAt = performance.now();
    this.mazeMotionFrame = window.requestAnimationFrame((timestamp) => this.updateMazeMotion(timestamp));
  }

  private updateMazeMotion(timestamp: number): void {
    this.mazeMotionFrame = undefined;
    if (this.mazeQuest?.phase !== 'maze') {
      this.stopAllMazeInput();
      return;
    }

    const elapsed = Math.min(40, Math.max(0, timestamp - (this.mazeLastMotionAt ?? timestamp)));
    this.mazeLastMotionAt = timestamp;
    const input = this.getMazeInputVector();
    if (input && elapsed > 0) {
      const cellPixels = Math.max(1, this.mazeGrid.clientWidth / MAZE_VIEWPORT_SIZE);
      const distance = input.speed * elapsed / cellPixels;
      this.advanceMazePlayer(input.x * distance, input.y * distance, elapsed);
    } else {
      this.updateMazeVisualPosition(elapsed);
    }

    if (this.mazeHeldDirections.length > 0 || this.mazePointerControl || !this.isMazeCameraSettled()) {
      this.mazeMotionFrame = window.requestAnimationFrame((nextTimestamp) => this.updateMazeMotion(nextTimestamp));
    } else {
      this.mazeLastMotionAt = undefined;
    }
  }

  private getMazeInputVector(): { x: number; y: number; speed: number } | undefined {
    let x = 0;
    let y = 0;
    if (this.mazeHeldDirections.includes('left')) x -= 1;
    if (this.mazeHeldDirections.includes('right')) x += 1;
    if (this.mazeHeldDirections.includes('up')) y -= 1;
    if (this.mazeHeldDirections.includes('down')) y += 1;
    if (x !== 0 || y !== 0) {
      const length = Math.hypot(x, y);
      return { x: x / length, y: y / length, speed: MAZE_KEYBOARD_SPEED_PX_PER_MS };
    }

    const pointer = this.mazePointerControl;
    if (!pointer || this.mazePlayerX === undefined || this.mazePlayerY === undefined) return undefined;
    if (pointer.mode === 'joystick') {
      const dragX = pointer.currentX - pointer.originX;
      const dragY = pointer.currentY - pointer.originY;
      const distance = Math.hypot(dragX, dragY);
      if (distance < 8) return undefined;
      const strength = Math.min(1, (distance - 8) / 54);
      return { x: dragX / distance * strength, y: dragY / distance * strength, speed: MAZE_JOYSTICK_SPEED_PX_PER_MS };
    }

    this.updateMazePointerTarget(pointer.currentX, pointer.currentY);
    const targetX = pointer.targetX - this.mazePlayerX;
    const targetY = pointer.targetY - this.mazePlayerY;
    const distance = Math.hypot(targetX, targetY);
    if (distance < 0.07) return undefined;
    return { x: targetX / distance, y: targetY / distance, speed: MAZE_POINTER_SPEED_PX_PER_MS };
  }

  private updateMazePointerTarget(clientX: number, clientY: number): void {
    const state = this.mazeQuest;
    const pointer = this.mazePointerControl;
    if (!state || !pointer || pointer.mode !== 'target' || this.mazePlayerX === undefined || this.mazePlayerY === undefined) return;
    const rect = this.mazeGrid.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const viewportStartX = this.mazeCameraX
      ?? Math.max(0, Math.min(state.size - MAZE_VIEWPORT_SIZE, this.mazePlayerX - MAZE_VIEWPORT_SIZE / 2));
    const viewportStartY = this.mazeCameraY
      ?? Math.max(0, Math.min(state.size - MAZE_VIEWPORT_SIZE, this.mazePlayerY - MAZE_VIEWPORT_SIZE / 2));
    pointer.targetX = Math.max(0, Math.min(state.size, viewportStartX + (clientX - rect.left) / rect.width * MAZE_VIEWPORT_SIZE));
    pointer.targetY = Math.max(0, Math.min(state.size, viewportStartY + (clientY - rect.top) / rect.height * MAZE_VIEWPORT_SIZE));
  }

  private syncMazePlayerPosition(force = false): void {
    const state = this.mazeQuest;
    if (!state) return;
    const cell = state.cells[state.player];
    const visualCell = this.mazePlayerX === undefined || this.mazePlayerY === undefined
      ? -1
      : Math.floor(this.mazePlayerY) * state.size + Math.floor(this.mazePlayerX);
    if (force || visualCell !== state.player) {
      this.mazePlayerX = cell.x + 0.5;
      this.mazePlayerY = cell.y + 0.5;
    }
  }

  private advanceMazePlayer(deltaX: number, deltaY: number, elapsed = 1000 / 60): void {
    const startingState = this.mazeQuest;
    if (!startingState || startingState.phase !== 'maze') return;
    this.syncMazePlayerPosition();
    if (this.mazePlayerX === undefined || this.mazePlayerY === undefined) return;
    const startingPlayer = startingState.player;

    const moveAxis = (axis: 'x' | 'y', delta: number): void => {
      const state = this.mazeQuest;
      if (!state || state.phase !== 'maze' || delta === 0 || this.mazePlayerX === undefined || this.mazePlayerY === undefined) return;
      const cell = state.cells[state.player];
      const positive = delta > 0;
      const direction: MazeDirection = axis === 'x'
        ? (positive ? 'right' : 'left')
        : (positive ? 'down' : 'up');
      const current = axis === 'x' ? this.mazePlayerX : this.mazePlayerY;
      const cellCoordinate = axis === 'x' ? cell.x : cell.y;
      const boundary = positive ? cellCoordinate + 1 : cellCoordinate;
      let next = current + delta;

      if (!cell.open.includes(direction)) {
        next = positive
          ? Math.min(next, boundary - MAZE_PLAYER_RADIUS)
          : Math.max(next, boundary + MAZE_PLAYER_RADIUS);
      } else {
        const crossedBoundary = positive ? next >= boundary : next < boundary;
        if (crossedBoundary) {
          const previousPlayer = state.player;
          this.mazeQuest = moveInMaze(state, direction);
          if (this.mazeQuest.phase !== 'maze' || this.mazeQuest.player === previousPlayer) {
            next = positive ? boundary - MAZE_PLAYER_RADIUS : boundary + MAZE_PLAYER_RADIUS;
          }
        }
      }

      if (axis === 'x') this.mazePlayerX = Math.max(MAZE_PLAYER_RADIUS, Math.min(state.size - MAZE_PLAYER_RADIUS, next));
      else this.mazePlayerY = Math.max(MAZE_PLAYER_RADIUS, Math.min(state.size - MAZE_PLAYER_RADIUS, next));
    };

    moveAxis('x', deltaX);
    moveAxis('y', deltaY);
    const finalState = this.mazeQuest;
    if (!finalState) return;
    const stateChanged = finalState.phase !== 'maze' || finalState.player !== startingPlayer;
    if (stateChanged) {
      if (finalState.phase === 'challenge') {
        this.mazeReturnScroll = this.captureScrollPositions(this.mazePlay);
      }
      if (finalState.phase !== 'maze') this.stopAllMazeInput();
      if (finalState.phase === 'maze') {
        this.updateMazeAfterPlayerStep(startingPlayer);
        this.updateMazeVisualPosition(elapsed);
      } else {
        this.renderMazeQuest();
      }
    } else {
      this.updateMazeVisualPosition(elapsed);
    }
  }

  private updateMazeAfterPlayerStep(previousPlayer: number): void {
    const state = this.mazeQuest;
    if (!state || state.phase !== 'maze' || this.mazeCellButtons.length === 0) return;

    const newlyVisible: number[] = [];
    for (const index of getVisibleMazeCells(state, 2)) {
      if (!this.mazeRevealedCells.has(index)) newlyVisible.push(index);
      this.mazeRevealedCells.add(index);
    }

    const affected = new Set<number>([previousPlayer, state.player, ...newlyVisible]);
    const addNeighbors = (cellIndex: number) => {
      const cell = state.cells[cellIndex];
      if (!cell) return;
      for (const direction of cell.open) {
        const dx = direction === 'right' ? 1 : direction === 'left' ? -1 : 0;
        const dy = direction === 'down' ? 1 : direction === 'up' ? -1 : 0;
        affected.add((cell.y + dy) * state.size + cell.x + dx);
      }
    };
    addNeighbors(previousPlayer);
    addNeighbors(state.player);

    const currentCell = state.cells[state.player];
    for (const index of affected) {
      const button = this.mazeCellButtons[index];
      const cell = state.cells[index];
      if (!button || !cell) continue;
      button.classList.toggle('is-visited', state.visited.includes(index));
      button.classList.toggle('is-fogged', !this.mazeRevealedCells.has(index));
      button.classList.toggle('is-player', index === state.player);
      const dx = cell.x - currentCell.x;
      const dy = cell.y - currentCell.y;
      const direction: MazeDirection | undefined = dx === 1 && dy === 0
        ? 'right'
        : dx === -1 && dy === 0
          ? 'left'
          : dx === 0 && dy === 1
            ? 'down'
            : dx === 0 && dy === -1
              ? 'up'
              : undefined;
      button.classList.toggle(
        'is-nearby',
        Boolean(direction && currentCell.open.includes(direction))
      );
    }
    this.mazeMessage.textContent = state.message;
  }

  private updateMazeVisualPosition(elapsed = 1000 / 60): void {
    const state = this.mazeQuest;
    const track = this.mazeGridTrack;
    const token = this.mazePlayerToken;
    if (
      !state
      || state.phase !== 'maze'
      || !track
      || !token
      || this.mazePlayerX === undefined
      || this.mazePlayerY === undefined
    ) return;

    const cellPercent = 100 / state.size;
    const tokenScale = MAZE_TOKEN_SCALE;
    const cellPixels = this.mazeCellPixelSize > 0
      ? this.mazeCellPixelSize
      : Math.max(1, this.mazeGrid.clientWidth / MAZE_VIEWPORT_SIZE);
    this.mazeCellPixelSize = cellPixels;
    const tokenSize = cellPixels * tokenScale;
    const desiredCameraX = Math.max(0, Math.min(state.size - MAZE_VIEWPORT_SIZE, this.mazePlayerX - MAZE_VIEWPORT_SIZE / 2));
    const desiredCameraY = Math.max(0, Math.min(state.size - MAZE_VIEWPORT_SIZE, this.mazePlayerY - MAZE_VIEWPORT_SIZE / 2));
    if (this.mazeCameraX === undefined || this.mazeCameraY === undefined) {
      this.mazeCameraX = desiredCameraX;
      this.mazeCameraY = desiredCameraY;
    } else {
      const frameScale = Math.max(0.25, elapsed / (1000 / 60));
      const follow = 1 - Math.pow(1 - 0.08, frameScale);
      this.mazeCameraX += (desiredCameraX - this.mazeCameraX) * follow;
      this.mazeCameraY += (desiredCameraY - this.mazeCameraY) * follow;
      if (Math.abs(desiredCameraX - this.mazeCameraX) < 0.001) this.mazeCameraX = desiredCameraX;
      if (Math.abs(desiredCameraY - this.mazeCameraY) < 0.001) this.mazeCameraY = desiredCameraY;
    }
    track.style.transform = `translate3d(${-this.mazeCameraX * cellPercent}%, ${-this.mazeCameraY * cellPercent}%, 0)`;
    token.style.width = `${tokenSize}px`;
    token.style.height = `${tokenSize}px`;
    token.style.transform = `translate3d(${(this.mazePlayerX - tokenScale / 2) * cellPixels}px, ${(this.mazePlayerY - tokenScale / 2) * cellPixels}px, 0)`;
  }

  private isMazeCameraSettled(): boolean {
    const state = this.mazeQuest;
    if (
      !state
      || state.phase !== 'maze'
      || this.mazePlayerX === undefined
      || this.mazePlayerY === undefined
      || this.mazeCameraX === undefined
      || this.mazeCameraY === undefined
    ) return true;
    const targetX = Math.max(0, Math.min(state.size - MAZE_VIEWPORT_SIZE, this.mazePlayerX - MAZE_VIEWPORT_SIZE / 2));
    const targetY = Math.max(0, Math.min(state.size - MAZE_VIEWPORT_SIZE, this.mazePlayerY - MAZE_VIEWPORT_SIZE / 2));
    return Math.abs(targetX - this.mazeCameraX) < 0.001 && Math.abs(targetY - this.mazeCameraY) < 0.001;
  }

  private answerMazeChoice(choice: number): void {
    if (!this.mazeQuest || this.mazeQuest.phase !== 'challenge') return;
    this.blurHudFocus();
    const previousHp = this.mazeQuest.playerHp;
    const previousCorrect = this.mazeQuest.challenge?.correct ?? 0;
    this.mazeQuest = answerMazeQuestion(this.mazeQuest, choice);
    if (this.mazeQuest.playerHp < previousHp) {
      this.progress.recordDamageTaken();
      if (this.mazeQuest.settings.playMode === 'story') {
        if (this.mazeQuest.phase === 'lost') {
          this.restartStoryModeAfterFailure();
        } else {
          this.progress.setStoryLives(this.mazeQuest.playerHp);
        }
      }
      this.mazePanel.classList.add('is-player-hit');
      window.setTimeout(() => this.mazePanel.classList.remove('is-player-hit'), 480);
    } else if ((this.mazeQuest.challenge?.correct ?? previousCorrect) > previousCorrect) {
      this.mazePanel.classList.remove('is-answer-correct');
      requestAnimationFrame(() => this.mazePanel.classList.add('is-answer-correct'));
      window.setTimeout(() => this.mazePanel.classList.remove('is-answer-correct'), 540);
    }
    this.renderPreservingScroll(this.mazeChallenge, () => this.renderMazeQuest());
  }

  private completeMazeGateForDev(): void {
    if (!import.meta.env.DEV || !new Set(['localhost', '127.0.0.1', '::1']).has(window.location.hostname)) return;
    while (this.mazeQuest?.phase === 'challenge' && this.mazeQuest.challenge) {
      this.mazeQuest = answerMazeQuestion(this.mazeQuest, this.mazeQuest.challenge.question.answer);
    }
    this.renderMazeQuest();
  }

  private renderMazeQuest(): void {
    const state = this.mazeQuest;
    if (!state || this.mazeModal.classList.contains('is-hidden')) {
      return;
    }

    this.mazePanel.dataset.phase = state.phase;
    const story = ['intro', 'gate-opened', 'reward', 'paid', 'lost'].includes(state.phase);
    this.mazeStory.classList.toggle('is-hidden', !story);
    this.mazePlay.classList.toggle('is-hidden', state.phase !== 'maze');
    this.mazeChallenge.classList.toggle('is-hidden', state.phase !== 'challenge');
    this.mazeReward.classList.toggle('is-hidden', state.phase !== 'reward' && state.phase !== 'paid');
    this.mazeStoryRules.classList.toggle('is-hidden', state.phase !== 'intro' && state.phase !== 'lost');
    this.mazeRewardValue.textContent = String(state.rewardValue);
    this.mazePhase.textContent = state.phase === 'challenge'
      ? `Skjult segl ${((state.activeGateIndex ?? 0) + 1)} · matteport`
      : `Labyrintekspedisjon · ${state.openedGates} av 4 segl`;
    const hearts = Array.from({ length: state.maxPlayerHp }, (_, index) => `<span class="heart ${index < state.playerHp ? 'is-live' : 'is-lost'}">❤</span>`).join('');
    this.mazeHearts.innerHTML = hearts;
    this.mazeChallengeHearts.innerHTML = hearts;
    this.mazeSeals.innerHTML = '';
    for (let index = 0; index < 4; index += 1) {
      const opened = state.openedGateIndices.includes(index);
      const node = document.createElement('span');
      node.className = 'maze-seal-node';
      node.classList.toggle('is-open', opened);
      node.title = opened ? `Skjult segl ${index + 1} er åpnet` : 'Et skjult segl gjenstår';
      const label = document.createElement('span');
      label.textContent = opened ? '✓' : '?';
      node.append(label);
      this.mazeSeals.append(node);
    }
    this.mazeMessage.textContent = state.message;
    this.mazeTestVictoryButton?.classList.toggle('is-hidden', state.phase !== 'challenge');
    if (state.phase !== 'maze') this.stopAllMazeInput();

    if (state.phase === 'maze') {
      this.syncMazePlayerPosition();
      for (const cell of getVisibleMazeCells(state, 2)) this.mazeRevealedCells.add(cell);
      const visibleCells = this.mazeRevealedCells;
      const visitedCells = new Set(state.visited);
      const currentCell = state.cells[state.player];
      const selectedToken = getTokenById(this.progress.getSettings().tokenId);
      this.mazeGrid.style.setProperty('--maze-viewport-size', String(MAZE_VIEWPORT_SIZE));
      const firstTrackRender = !this.mazeGridTrack;
      const track = this.mazeGridTrack ?? document.createElement('div');
      track.className = 'maze-grid-track';
      track.style.width = `${(state.size / MAZE_VIEWPORT_SIZE) * 100}%`;
      track.style.height = `${(state.size / MAZE_VIEWPORT_SIZE) * 100}%`;
      track.style.gridTemplateColumns = `repeat(${state.size}, minmax(0, 1fr))`;
      track.style.gridTemplateRows = `repeat(${state.size}, minmax(0, 1fr))`;
      if (firstTrackRender) {
        this.mazeGridTrack = track;
        this.mazeCellButtons = [];
        this.mazeGrid.replaceChildren(track);
      }

      const token = this.mazePlayerToken ?? document.createElement('img');
      token.remove();
      const cellButtons = this.mazeCellButtons;

      for (let worldY = 0; worldY < state.size; worldY += 1) {
        for (let worldX = 0; worldX < state.size; worldX += 1) {
          const index = worldY * state.size + worldX;
          const cell = state.cells[index];
        let button = cellButtons[index];
        if (!button) {
          button = document.createElement('button');
          button.type = 'button';
          button.className = 'maze-cell';
          (['up', 'right', 'down', 'left'] as const).forEach((direction) => {
            if (cell.open.includes(direction)) {
              return;
            }
            const wall = document.createElement('span');
            wall.className = `maze-stone-wall is-${direction}`;
            wall.setAttribute('aria-hidden', 'true');
            button.append(wall);
          });
          track.append(button);
          cellButtons[index] = button;
        }
        button.classList.toggle('is-visited', visitedCells.has(index));
        button.classList.toggle('is-fogged', !visibleCells.has(index));
        button.classList.toggle('is-player', index === state.player);
        const gateIndex = state.gateCells.indexOf(index);
        const gateOpened = gateIndex >= 0 && state.openedGateIndices.includes(gateIndex);
        button.classList.toggle('is-gate', gateIndex >= 0 && !gateOpened);
        button.classList.toggle('is-open-gate', gateOpened);
        button.classList.toggle('is-exit', index === state.exit);
        button.classList.toggle('is-start', index === 0);

        const markerState = index === state.exit
          ? 'exit'
          : gateOpened
            ? 'open-gate'
            : gateIndex >= 0
              ? 'gate'
              : index === 0 && index !== state.player
                ? 'start'
                : 'none';
        if (button.dataset.markerState !== markerState) {
          button.querySelectorAll(':scope > .maze-start-marker, :scope > .maze-exit-marker, :scope > .maze-open-seal, :scope > .maze-seal-marker')
            .forEach((marker) => marker.remove());
          if (markerState === 'start') {
            const startMarker = document.createElement('span');
            startMarker.className = 'maze-start-marker';
            startMarker.textContent = '◆';
            button.append(startMarker);
          } else if (markerState === 'exit') {
            const exitMarker = document.createElement('span');
            exitMarker.className = 'maze-exit-marker';
            button.append(exitMarker);
          } else if (markerState === 'open-gate') {
            const openMarker = document.createElement('span');
            openMarker.className = 'maze-open-seal';
            openMarker.textContent = '✓';
            button.append(openMarker);
          } else if (markerState === 'gate') {
            const sealMarker = document.createElement('span');
            sealMarker.className = 'maze-seal-marker';
            const sealNumber = document.createElement('span');
            sealNumber.textContent = '✦';
            sealMarker.append(sealNumber);
            button.append(sealMarker);
          }
          button.dataset.markerState = markerState;
        }
        const dx = cell.x - currentCell.x;
        const dy = cell.y - currentCell.y;
        const direction: MazeDirection | undefined = dx === 1 && dy === 0 ? 'right' : dx === -1 && dy === 0 ? 'left' : dx === 0 && dy === 1 ? 'down' : dx === 0 && dy === -1 ? 'up' : undefined;
        const canMoveHere = Boolean(direction && currentCell.open.includes(direction));
        button.classList.toggle('is-nearby', canMoveHere);
        button.tabIndex = -1;
        button.setAttribute('aria-label', index === state.player
          ? 'Spillbrikken din'
          : gateIndex >= 0
            ? `Seglport ${gateIndex + 1}`
            : index === state.exit
              ? 'Utgangen fra labyrinten'
              : `Labyrintrute ${cell.x + 1}, ${cell.y + 1}`);
        }
      }

      token.className = 'maze-player-token';
      token.src = selectedToken.src;
      token.alt = 'Spillbrikken din';
      token.style.left = '0';
      token.style.top = '0';
      this.mazePlayerToken = token;
      track.append(token);
      this.mazeCellPixelSize = Math.max(1, this.mazeGrid.clientWidth / MAZE_VIEWPORT_SIZE);
      this.updateMazeVisualPosition();

      return;
    }

    if (state.phase === 'challenge' && state.challenge) {
      const romanNumerals = ['I', 'II', 'III', 'IV'];
      const gateIndex = state.activeGateIndex ?? 0;
      this.mazeGateLabel.textContent = state.challenge.stop.place;
      this.mazeGateNumber.textContent = romanNumerals[gateIndex] ?? String(gateIndex + 1);
      this.mazeQuestion.textContent = state.challenge.question.prompt;
      this.mazeChallengeMessage.textContent = state.message;
      this.mazeQuestionProgress.innerHTML = Array.from({ length: state.challenge.requiredCorrect }, (_, index) => `<span class="${index < state.challenge!.correct ? 'is-filled' : ''}"></span>`).join('');
      this.mazeChoices.innerHTML = '';
      for (const choice of state.challenge.question.choices) {
        const button = document.createElement('button'); button.type = 'button'; button.textContent = String(choice);
        button.addEventListener('click', () => this.answerMazeChoice(choice)); this.mazeChoices.append(button);
      }
      return;
    }

    this.mazeChoices.innerHTML = '';
    const emblem = this.mazeStoryEmblem.querySelector('span');
    if (state.phase === 'intro') {
      if (emblem) emblem.textContent = '✦';
      this.mazeStoryTitle.textContent = 'Bryt labyrintens fire segl';
      this.mazeStoryMessage.textContent = MAZE_WELCOME;
      this.mazePrimary.textContent = 'Gå inn i labyrinten';
    } else if (state.phase === 'gate-opened') {
      const gateNumber = (state.activeGateIndex ?? 0) + 1;
      if (emblem) emblem.textContent = ['I', 'II', 'III', 'IV'][gateNumber - 1] ?? '✓';
      this.mazeStoryTitle.textContent = `Skjult segl ${gateNumber} er brutt!`;
      this.mazeStoryMessage.textContent = `${state.message} Du beholder hjertene du har igjen.`;
      this.mazePrimary.textContent = 'Fortsett ekspedisjonen';
    } else if (state.phase === 'reward') {
      if (emblem) emblem.textContent = '★';
      this.mazeStoryTitle.textContent = 'Du beseiret labyrinten!';
      this.mazeStoryMessage.textContent = 'Alle fire segl er brutt. Labyrintens vokter er klar til å gi deg belønningen.';
      this.mazePrimary.textContent = 'Få utbetalt';
    } else if (state.phase === 'paid') {
      if (emblem) emblem.textContent = '✓';
      this.mazeStoryTitle.textContent = 'Labyrintmester';
      this.mazeStoryMessage.textContent = state.message;
      this.mazePrimary.textContent = 'Til kartet';
    } else {
      if (emblem) emblem.textContent = '!';
      this.mazeStoryTitle.textContent = 'Seglene sluknet';
      this.mazeStoryMessage.textContent = state.message;
      this.mazePrimary.textContent = state.settings.playMode === 'story'
        ? 'Tilbake til kartet'
        : 'Start hele oppdraget på nytt';
    }
  }

  public openTallvokterFinale(): void {
    const progress = this.progress.getTallvokterFinaleProgress();
    if (!progress.unlocked) return;

    this.clearTallvokterFinaleTimer();
    this.tallvokterFinale = undefined;
    this.tallvokterFinaleInputLocked = false;
    this.tallvokterFinalePanel.classList.remove('is-player-hit', 'is-phase-shift', 'is-victory');
    this.tallvokterFinaleMode = progress.rewardClaimed ? 'paid' : progress.won ? 'ending' : 'intro';
    this.tallvokterFinaleModal.classList.remove('is-hidden');
    this.renderTallvokterFinale();
  }

  private closeTallvokterFinale(): void {
    const wasOpen = !this.tallvokterFinaleModal.classList.contains('is-hidden');
    this.clearTallvokterFinaleTimer();
    this.tallvokterFinaleModal.classList.add('is-hidden');
    this.tallvokterFinalePanel.classList.remove('is-player-hit', 'is-phase-shift', 'is-victory');
    this.tallvokterFinale = undefined;
    this.tallvokterFinaleInputLocked = false;
    this.tallvokterFinaleChoices.innerHTML = '';
    if (wasOpen) this.hooks?.resetInput();
  }

  private clearTallvokterFinaleTimer(): void {
    if (!this.tallvokterFinaleTimer) return;
    window.clearTimeout(this.tallvokterFinaleTimer);
    this.tallvokterFinaleTimer = undefined;
  }

  private advanceTallvokterFinale(): void {
    if (this.tallvokterFinaleInputLocked) return;
    if (this.tallvokterFinaleMode === 'intro') {
      this.startTallvokterFinaleBattle();
    } else if (this.tallvokterFinaleMode === 'ending') {
      this.claimTallvokterFinaleReward();
    } else if (this.tallvokterFinaleMode === 'paid') {
      this.closeTallvokterFinale();
    }
  }

  private startTallvokterFinaleBattle(): void {
    this.clearTallvokterFinaleTimer();
    this.progress.markTallvokterFinaleIntroSeen();
    this.tallvokterFinale = createTallvokterFinale(
      this.progress.getSettings(),
      this.progress.getBattleHearts()
    );
    this.tallvokterFinaleMode = 'battle';
    this.tallvokterFinaleInputLocked = false;
    this.tallvokterFinalePanel.classList.remove('is-player-hit', 'is-phase-shift', 'is-victory');
    this.renderTallvokterFinale();
  }

  private answerTallvokterFinaleChoice(choice: number): void {
    const state = this.tallvokterFinale;
    if (
      this.tallvokterFinaleMode !== 'battle'
      || !state
      || state.status !== 'active'
      || this.tallvokterFinaleInputLocked
    ) return;

    const previousHp = state.playerHp;
    const previousPhase = state.phase;
    this.tallvokterFinale = answerTallvokterFinale(state, choice);
    const next = this.tallvokterFinale;
    const tookDamage = next.playerHp < previousHp;
    const phaseChanged = next.phase !== previousPhase;

    if (tookDamage) {
      this.progress.recordDamageTaken();
      if (next.settings.playMode === 'story') {
        if (next.status === 'lost') this.restartStoryModeAfterFailure();
        else this.progress.setStoryLives(next.playerHp);
      }
    }
    if (next.status === 'won') this.progress.markTallvokterFinaleWon();

    this.tallvokterFinaleInputLocked = true;
    this.tallvokterFinalePanel.classList.toggle('is-player-hit', tookDamage);
    this.tallvokterFinalePanel.classList.toggle('is-phase-shift', phaseChanged || next.status === 'won');
    this.renderTallvokterFinale();

    const duration = next.status === 'won' ? 1250 : phaseChanged ? 900 : tookDamage ? 620 : 360;
    this.tallvokterFinaleTimer = window.setTimeout(() => {
      this.tallvokterFinaleTimer = undefined;
      this.tallvokterFinaleInputLocked = false;
      this.tallvokterFinalePanel.classList.remove('is-player-hit', 'is-phase-shift');
      if (!this.tallvokterFinale) return;
      if (this.tallvokterFinale.status === 'won') {
        this.tallvokterFinaleMode = 'ending';
        this.tallvokterFinalePanel.classList.add('is-victory');
      }
      this.renderTallvokterFinale();
    }, duration);
  }

  private completeTallvokterFinaleForDev(): void {
    if (
      !import.meta.env.DEV
      || !new Set(['localhost', '127.0.0.1', '::1']).has(window.location.hostname)
      || this.tallvokterFinaleMode !== 'battle'
      || !this.tallvokterFinale
      || this.tallvokterFinaleInputLocked
    ) return;

    while (this.tallvokterFinale.status === 'active') {
      this.tallvokterFinale = answerTallvokterFinale(
        this.tallvokterFinale,
        this.tallvokterFinale.question.answer
      );
    }
    this.progress.markTallvokterFinaleWon();
    this.tallvokterFinaleMode = 'ending';
    this.tallvokterFinalePanel.classList.add('is-victory');
    this.renderTallvokterFinale();
  }

  private claimTallvokterFinaleReward(): void {
    if (this.tallvokterFinaleMode !== 'ending' || this.tallvokterFinaleInputLocked) return;

    const reward = getTallvokterFinaleReward(this.progress.getSettings());
    const result = this.progress.claimTallvokterFinaleReward(reward);
    this.tallvokterFinaleInputLocked = true;
    this.tallvokterFinalePrimary.disabled = true;
    const finish = (): void => {
      this.tallvokterFinaleInputLocked = false;
      this.tallvokterFinaleMode = 'paid';
      this.renderTallvokterFinale();
      this.renderBackpack();
    };
    if (result.regnecoins > 0) {
      this.playRegnecoinRewardAnimation(result.regnecoins, this.tallvokterFinalePrimary, finish);
    } else finish();
  }

  private renderTallvokterFinale(): void {
    if (this.tallvokterFinaleModal.classList.contains('is-hidden')) return;

    const reward = getTallvokterFinaleReward(this.progress.getSettings());
    const battleActive = this.tallvokterFinaleMode === 'battle';
    this.tallvokterFinaleRewardValue.textContent = String(reward);
    this.tallvokterFinaleStory.classList.toggle('is-hidden', battleActive);
    this.tallvokterFinaleBattle.classList.toggle('is-hidden', !battleActive);
    this.tallvokterFinalePanel.dataset.mode = this.tallvokterFinaleMode;

    if (!battleActive) {
      this.tallvokterFinaleRules.classList.toggle('is-hidden', this.tallvokterFinaleMode !== 'intro');
      this.tallvokterFinaleReward.classList.remove('is-hidden');
      this.retryTallvokterFinaleButton.classList.add('is-hidden');
      this.tallvokterFinaleCharacter.src = this.tallvokterFinaleMode === 'intro'
        ? TALLVOKTER_FINALE_ASSETS.intro
        : TALLVOKTER_FINALE_ASSETS.ending;
      this.tallvokterFinaleCharacterKicker.textContent = this.tallvokterFinaleMode === 'intro'
        ? 'Rikets vokter'
        : 'Rikets mester';

      if (this.tallvokterFinaleMode === 'intro') {
        this.tallvokterFinaleKicker.textContent = 'Den mystiske avslutningen';
        this.tallvokterFinaleTitle.textContent = 'Tallvokterens siste duell';
        this.tallvokterFinaleStoryCopy.textContent = 'Jeg har fulgt deg gjennom alle rikets prøver. Du har vist mot, kløkt og utholdenhet. Nå gjenstår én siste utfordring: bestå mine tre matematiske prøver og vis at du er en sann Regnemester.';
        this.tallvokterFinalePrimary.textContent = 'Start siste duell';
      } else if (this.tallvokterFinaleMode === 'ending') {
        this.tallvokterFinaleKicker.textContent = 'Alle tre prøvene er bestått';
        this.tallvokterFinaleTitle.textContent = 'Riket har fått en ny mester';
        this.tallvokterFinaleStoryCopy.textContent = 'Enestående! Du løste rikets oppdrag, sto støtt gjennom den siste duellen og viste at kunnskap er den sterkeste kraften av alle. Ta imot min belønning – du har fortjent den.';
        this.tallvokterFinalePrimary.textContent = 'Motta belønningen';
      } else {
        this.tallvokterFinaleKicker.textContent = 'Tallvokterens verden er fullført';
        this.tallvokterFinaleTitle.textContent = 'En sann Regnemester';
        this.tallvokterFinaleStoryCopy.textContent = 'Tallvokteren bøyer hodet i respekt. Den siste prøven er over, men rikets veier og opplevelser står fortsatt åpne for deg.';
        this.tallvokterFinalePrimary.textContent = 'Tilbake til kartet';
      }
      this.tallvokterFinalePrimary.disabled = this.tallvokterFinaleInputLocked;
      return;
    }

    const state = this.tallvokterFinale;
    if (!state) return;
    const phase = TALLVOKTER_FINALE_PHASES[state.phase - 1];
    this.tallvokterFinalePanel.dataset.phase = String(state.phase);
    this.tallvokterFinaleKicker.textContent = phase.kicker;
    this.tallvokterFinaleTitle.textContent = phase.name;
    this.tallvokterFinaleCharacterKicker.textContent = phase.name;
    this.tallvokterFinaleCharacter.src = phase.asset;
    this.tallvokterFinaleMessage.textContent = state.message;
    this.tallvokterFinaleQuestion.textContent = state.status === 'active' ? state.question.prompt : '';
    this.tallvokterFinaleProgress.innerHTML = Array.from(
      { length: state.requiredCorrect },
      (_, index) => `<span class="${index < state.correct ? 'is-done' : ''} phase-${Math.floor(index / 5) + 1}" aria-hidden="true"></span>`
    ).join('');
    this.tallvokterFinaleHearts.innerHTML = Array.from(
      { length: state.maxPlayerHp },
      (_, index) => `<span class="heart ${index < state.playerHp ? 'is-live' : 'is-lost'}" aria-hidden="true">❤</span>`
    ).join('');

    this.tallvokterFinaleChoices.innerHTML = '';
    if (state.status === 'active') {
      for (const choice of state.question.choices) {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = String(choice);
        button.disabled = this.tallvokterFinaleInputLocked;
        button.addEventListener('click', () => this.answerTallvokterFinaleChoice(choice));
        this.tallvokterFinaleChoices.append(button);
      }
    }
    const showLostAction = state.status === 'lost';
    this.retryTallvokterFinaleButton.textContent = state.settings.playMode === 'story'
      ? 'Tilbake til kartet'
      : 'Prøv igjen';
    this.retryTallvokterFinaleButton.classList.toggle('is-hidden', !showLostAction);
    this.retryTallvokterFinaleButton.disabled = this.tallvokterFinaleInputLocked;
  }

  public openGladiatorArena(): void {
    this.clearGladiatorArenaTimer();
    this.gladiatorArena = createGladiatorArena(
      this.progress.getSettings(),
      this.progress.getBattleHearts()
    );
    this.gladiatorArenaInputLocked = false;
    this.gladiatorArenaPanel.classList.remove('is-player-hit');
    this.gladiatorArenaModal.classList.remove('is-hidden');
    this.renderGladiatorArena();
  }

  private closeGladiatorArena(): void {
    const wasOpen = !this.gladiatorArenaModal.classList.contains('is-hidden');
    this.clearGladiatorArenaTimer();
    this.gladiatorArenaModal.classList.add('is-hidden');
    this.gladiatorArenaPanel.classList.remove('is-player-hit');
    this.gladiatorArena = undefined;
    this.gladiatorArenaInputLocked = false;
    this.gladiatorArenaChoices.innerHTML = '';
    if (wasOpen) {
      this.hooks?.resetInput();
    }
  }

  private clearGladiatorArenaTimer(): void {
    if (this.gladiatorArenaFeedbackTimer) {
      window.clearTimeout(this.gladiatorArenaFeedbackTimer);
      this.gladiatorArenaFeedbackTimer = undefined;
    }
  }

  private advanceGladiatorArena(): void {
    const state = this.gladiatorArena;
    if (!state || this.gladiatorArenaInputLocked) {
      return;
    }

    if (state.phase === 'intro') {
      this.gladiatorArena = startGladiatorArena(state);
    } else if (state.phase === 'intermission') {
      this.gladiatorArena = continueGladiatorArena(state);
    } else if (state.phase === 'reward') {
      this.claimGladiatorArenaReward();
      return;
    } else if (state.phase === 'paid') {
      this.closeGladiatorArena();
      return;
    } else if (state.phase === 'lost') {
      const storyFailed = state.fight.settings.playMode === 'story';
      this.closeGladiatorArena();
      if (storyFailed) this.completeStoryModeRestartAfterReturn();
      else this.openGladiatorArena();
      return;
    }

    this.renderGladiatorArena();
  }

  private answerGladiatorArenaChoice(choice: number): void {
    const state = this.gladiatorArena;
    if (!state || state.phase !== 'fight' || this.gladiatorArenaInputLocked) {
      return;
    }

    const previousHp = state.fight.playerHp;
    this.gladiatorArena = answerGladiatorQuestion(state, choice);
    const tookDamage = this.gladiatorArena.fight.playerHp < previousHp;
    if (!tookDamage) {
      this.renderGladiatorArena();
      return;
    }

    this.progress.recordDamageTaken();
    if (this.gladiatorArena.fight.settings.playMode === 'story') {
      if (this.gladiatorArena.phase === 'lost') {
        this.restartStoryModeAfterFailure();
      } else {
        this.progress.setStoryLives(this.gladiatorArena.fight.playerHp);
      }
    }

    this.gladiatorArenaInputLocked = true;
    this.gladiatorArenaPanel.classList.add('is-player-hit');
    this.renderGladiatorArena();
    this.gladiatorArenaFeedbackTimer = window.setTimeout(() => {
      this.gladiatorArenaInputLocked = false;
      this.gladiatorArenaPanel.classList.remove('is-player-hit');
      this.gladiatorArenaFeedbackTimer = undefined;
      this.renderGladiatorArena();
    }, 520);
  }

  private completeGladiatorFightForDev(): void {
    if (
      !import.meta.env.DEV
      || !new Set(['localhost', '127.0.0.1', '::1']).has(window.location.hostname)
      || !this.gladiatorArena
      || this.gladiatorArena.phase !== 'fight'
      || this.gladiatorArenaInputLocked
    ) {
      return;
    }

    while (this.gladiatorArena.phase === 'fight') {
      this.gladiatorArena = answerGladiatorQuestion(
        this.gladiatorArena,
        this.gladiatorArena.fight.question.answer
      );
    }
    this.renderGladiatorArena();
  }

  private claimGladiatorArenaReward(): void {
    const state = this.gladiatorArena;
    if (!state || state.phase !== 'reward') {
      return;
    }

    this.gladiatorArenaPrimaryButton.disabled = true;
    const result = this.progress.completeTallvokterQuest(
      GLADIATOR_ARENA_QUEST_ID,
      state.rewardValue
    );
    if (result.regnecoins > 0) {
      this.playRegnecoinRewardAnimation(result.regnecoins, this.gladiatorArenaPrimaryButton);
    }
    this.gladiatorArena = markGladiatorRewardPaid(state);
    this.renderGladiatorArena();
    this.renderBackpack();
  }

  private renderGladiatorArena(): void {
    const state = this.gladiatorArena;
    if (!state || this.gladiatorArenaModal.classList.contains('is-hidden')) {
      return;
    }

    const fighter = state.fight.stop;
    const fightActive = state.phase === 'fight';
    const lanistaActive = state.phase === 'intro' || state.phase === 'reward' || state.phase === 'paid';
    this.gladiatorArenaPanel.dataset.phase = state.phase;
    this.gladiatorArenaStoryView.classList.toggle('is-hidden', fightActive);
    this.gladiatorArenaFightView.classList.toggle('is-hidden', !fightActive);
    this.gladiatorArenaReward.classList.toggle(
      'is-hidden',
      state.phase !== 'reward' && state.phase !== 'paid'
    );
    this.gladiatorArenaTestVictoryButton?.classList.toggle('is-hidden', !fightActive);
    this.leaveGladiatorArenaButton.textContent = state.phase === 'paid' ? 'Til kartet' : 'Avslutt';
    this.leaveGladiatorArenaButton.disabled = false;
    this.gladiatorArenaPrimaryButton.disabled = false;

    if (lanistaActive) {
      this.gladiatorArenaCharacter.src = LANISTA_ASSET_PATH;
      this.gladiatorArenaCharacter.alt = 'Lanista';
      this.gladiatorArenaCharacterKicker.textContent = 'Arenaens Lanista';
      this.gladiatorArenaCharacterName.textContent = 'Lanista';
      this.gladiatorArenaCharacterCopy.textContent = state.phase === 'intro'
        ? 'Verten, dommeren og belønningsmesteren i Gladiatorarenaen.'
        : 'Lanistaen står klar til å krone arenaens nye mester.';
    } else {
      this.gladiatorArenaCharacter.src = fighter.iconSrc;
      this.gladiatorArenaCharacter.alt = fighter.title;
      this.gladiatorArenaCharacterKicker.textContent = fighter.place;
      this.gladiatorArenaCharacterName.textContent = fighter.title;
      this.gladiatorArenaCharacterCopy.textContent = fighter.description;
    }

    if (fightActive) {
      this.gladiatorArenaPhase.textContent = `Kamp ${state.gladiatorIndex + 1} av ${GLADIATORS.length}`;
      this.gladiatorArenaStageCount.textContent = `${state.gladiatorIndex + 1} av ${GLADIATORS.length}`;
      this.gladiatorArenaHearts.innerHTML = Array.from(
        { length: state.fight.maxPlayerHp },
        (_, index) => `<span class="heart ${index < state.fight.playerHp ? 'is-live' : 'is-lost'}" aria-hidden="true">❤</span>`
      ).join('');
      this.gladiatorArenaProgress.innerHTML = Array.from(
        { length: state.fight.requiredCorrect },
        (_, index) => `<span class="${index < state.fight.correct ? 'is-filled' : ''}"></span>`
      ).join('');
      this.gladiatorArenaQuestion.textContent = state.fight.question.prompt;
      this.gladiatorArenaMessage.textContent = state.message;
      this.gladiatorArenaChoices.innerHTML = '';
      for (const choice of state.fight.question.choices) {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = String(choice);
        button.disabled = this.gladiatorArenaInputLocked;
        button.addEventListener('click', () => this.answerGladiatorArenaChoice(choice));
        this.gladiatorArenaChoices.append(button);
      }
      return;
    }

    this.gladiatorArenaChoices.innerHTML = '';
    this.gladiatorArenaRewardValue.textContent = String(state.rewardValue);
    if (state.phase === 'intro') {
      this.gladiatorArenaPhase.textContent = 'Velkommen';
      this.gladiatorArenaStoryKicker.textContent = 'Lanistaen ønsker deg velkommen';
      this.gladiatorArenaStoryTitle.textContent = 'Bli arenaens mester!';
      this.gladiatorArenaStoryMessage.textContent = GLADIATOR_ARENA_WELCOME;
      this.gladiatorArenaPrimaryButton.textContent = 'Gå inn i arenaen';
      return;
    }

    if (state.phase === 'intermission') {
      const finalGladiator = state.gladiatorIndex === GLADIATORS.length - 1;
      const nextGladiator = GLADIATORS[state.gladiatorIndex + 1];
      this.gladiatorArenaPhase.textContent = `${state.defeatedCount} av ${GLADIATORS.length} beseiret`;
      this.gladiatorArenaStoryKicker.textContent = 'Gladiator beseiret';
      this.gladiatorArenaStoryTitle.textContent = `${fighter.title} er slått!`;
      this.gladiatorArenaStoryMessage.textContent = finalGladiator
        ? 'Du har beseiret alle fire gladiatorene. Trykk Neste for å møte Lanistaen og motta mesterbelønningen.'
        : `Godt kjempet! Neste motstander er ${nextGladiator.title}. Du beholder hjertene du har igjen.`;
      this.gladiatorArenaPrimaryButton.textContent = 'Neste';
      return;
    }

    if (state.phase === 'reward') {
      this.gladiatorArenaPhase.textContent = 'Arenaens mester';
      this.gladiatorArenaStoryKicker.textContent = 'Lanistaens belønning';
      this.gladiatorArenaStoryTitle.textContent = 'Du er arenaens mester!';
      this.gladiatorArenaStoryMessage.textContent =
        `Alle fire gladiatorene er beseiret. Lanistaen belønner deg med ${state.rewardValue} Regnecoins.`;
      this.gladiatorArenaPrimaryButton.textContent = `Få utbetalt ${state.rewardValue} Regnecoins`;
      return;
    }

    if (state.phase === 'paid') {
      this.gladiatorArenaPhase.textContent = 'Fullført';
      this.gladiatorArenaStoryKicker.textContent = 'Mestertittelen er din';
      this.gladiatorArenaStoryTitle.textContent = 'Vel kjempet, mester!';
      this.gladiatorArenaStoryMessage.textContent = state.message;
      this.gladiatorArenaPrimaryButton.textContent = 'Til kartet';
      return;
    }

    this.gladiatorArenaPhase.textContent = 'Forsøket er over';
    this.gladiatorArenaStoryKicker.textContent = 'Utfordringen mislyktes';
    this.gladiatorArenaStoryTitle.textContent = 'Arenaen venter på et nytt forsøk';
    this.gladiatorArenaStoryMessage.textContent = state.message;
    this.gladiatorArenaPrimaryButton.textContent = state.fight.settings.playMode === 'story'
      ? 'Tilbake til kartet'
      : 'Start på nytt';
  }

  public openCampQuestIntro(onStart: () => void): void {
    this.campDialogMode = 'intro';
    this.campCollectedCount = 0;
    this.campStartCallback = onStart;
    this.campPaymentInProgress = false;
    this.campModal.classList.remove('is-hidden');
    this.renderCampDialog();
  }

  public openCampQuestProgress(collectedCount: number): void {
    this.campDialogMode = 'progress';
    this.campCollectedCount = Math.max(0, Math.min(CAMP_PARTS.length, collectedCount));
    this.campStartCallback = undefined;
    this.campPaymentInProgress = false;
    this.campModal.classList.remove('is-hidden');
    this.renderCampDialog();
  }

  public openCampQuestReward(): void {
    this.campDialogMode = 'reward';
    this.campCollectedCount = CAMP_PARTS.length;
    this.campStartCallback = undefined;
    this.campPaymentInProgress = false;
    this.campModal.classList.remove('is-hidden');
    this.renderCampDialog();
  }

  private closeCampDialog(): void {
    if (this.campPaymentInProgress) {
      return;
    }
    this.campModal.classList.add('is-hidden');
    this.campStartCallback = undefined;
  }

  private advanceCampDialog(): void {
    if (this.campPaymentInProgress) {
      return;
    }

    if (this.campDialogMode === 'intro') {
      const callback = this.campStartCallback;
      this.closeCampDialog();
      callback?.();
      return;
    }

    if (this.campDialogMode === 'progress' || this.campDialogMode === 'paid') {
      this.closeCampDialog();
      return;
    }

    this.claimCampReward();
  }

  private claimCampReward(): void {
    if (this.campDialogMode !== 'reward' || this.campPaymentInProgress) {
      return;
    }

    const rewardValue = getCampReward(this.progress.getSettings());
    const result = this.progress.completeTallvokterCampQuest(rewardValue);
    if (result.regnecoins <= 0) {
      this.showToast('Hjuldelene må samles før oppdraget kan leveres.');
      return;
    }

    this.campPaymentInProgress = true;
    this.campPrimary.disabled = true;
    this.campPrimary.textContent = 'Betaler ...';
    this.playRegnecoinRewardAnimation(result.regnecoins, this.campPrimary, () => {
      this.campPaymentInProgress = false;
      this.campDialogMode = 'paid';
      this.renderCampDialog();
    });
  }

  private renderCampDialog(): void {
    const rewardValue = getCampReward(this.progress.getSettings());
    const rewardScene = this.campDialogMode === 'reward' || this.campDialogMode === 'paid';
    this.campPanel.dataset.phase = this.campDialogMode;
    this.campPanel.classList.toggle('is-reward', this.campDialogMode === 'reward');
    this.campPanel.classList.toggle('is-paid', this.campDialogMode === 'paid');
    this.campCharacter.src = rewardScene ? CAMP_RESIDENT_ASSET_PATH : CAMP_RESIDENT_WAGON_ASSET_PATH;
    this.campCharacter.alt = rewardScene
      ? 'Mannen ved Leirstedet'
      : 'Mannen ved den ødelagte vognen';
    this.campRewardValue.textContent = String(rewardValue);
    this.campProgress.textContent = `${this.campCollectedCount} av ${CAMP_PARTS.length} deler funnet`;
    this.campPrimary.disabled = this.campPaymentInProgress;

    if (this.campDialogMode === 'intro') {
      this.campKicker.textContent = 'Et knust vognhjul';
      this.campStoryTitle.textContent = 'Kan du redde vognen?';
      this.campMessage.textContent = CAMP_WELCOME;
      this.campPrimary.textContent = 'Start letingen';
      return;
    }

    if (this.campDialogMode === 'progress') {
      this.campKicker.textContent = 'Letingen fortsetter';
      this.campStoryTitle.textContent = 'Finn resten av hjuldelene';
      this.campMessage.textContent =
        `Du har funnet ${this.campCollectedCount} av ${CAMP_PARTS.length} deler. Delene som mangler ligger fortsatt skjult rundt i Tallvokterens verden.`;
      this.campPrimary.textContent = 'Tilbake til kartet';
      return;
    }

    if (this.campDialogMode === 'reward') {
      this.campKicker.textContent = 'Vognen er reddet';
      this.campStoryTitle.textContent = 'Takk for alle hjuldelene!';
      this.campMessage.textContent =
        `Du fant alle sju hjuldelene. Mannen setter sammen hjulet og vil betale ${rewardValue} Regnecoins for hjelpen.`;
      this.campPrimary.textContent = `Få utbetalt ${rewardValue}`;
      return;
    }

    this.campKicker.textContent = 'Oppdrag fullført';
    this.campStoryTitle.textContent = 'Vognen kan rulle igjen!';
    this.campMessage.textContent = `${rewardValue} Regnecoins er lagt i ryggsekken.`;
    this.campPrimary.textContent = 'Til kartet';
  }

  public openManorQuest(): void {
    this.stopManorSpiderAnimation();
    if (this.manorFeedbackTimer) {
      window.clearTimeout(this.manorFeedbackTimer);
      this.manorFeedbackTimer = undefined;
    }
    this.manorQuest = createManorQuest(
      this.progress.getSettings(),
      this.progress.getBattleHearts()
    );
    this.manorReturnScroll = undefined;
    this.manorInputLocked = false;
    this.manorPanel.classList.remove('is-player-hit', 'is-answer-correct', 'is-spider-cleared');
    this.manorStoryView.querySelector<HTMLImageElement>('.manor-butler-stage > img')?.setAttribute('src', BUTLER_ASSET_PATH);
    this.manorModal.classList.remove('is-hidden');
    this.renderManorQuest();
  }

  private closeManorQuest(): void {
    this.stopManorSpiderAnimation();
    if (this.manorFeedbackTimer) {
      window.clearTimeout(this.manorFeedbackTimer);
      this.manorFeedbackTimer = undefined;
    }
    this.manorModal.classList.add('is-hidden');
    this.manorPanel.classList.remove('is-player-hit', 'is-answer-correct', 'is-spider-cleared');
    this.manorChoices.innerHTML = '';
    this.manorQuest = undefined;
    this.manorReturnScroll = undefined;
    this.manorInputLocked = false;
    this.hooks?.resetInput();
  }

  private advanceManorQuest(): void {
    const state = this.manorQuest;
    if (!state || this.manorInputLocked) {
      return;
    }

    if (state.phase === 'intro') {
      this.manorQuest = startManorQuest(state);
      this.renderManorQuest();
      return;
    }
    if (state.phase === 'reward') {
      this.claimManorReward();
      return;
    }
    if (state.phase === 'paid') {
      this.closeManorQuest();
      return;
    }
    if (state.phase === 'lost') {
      const storyFailed = state.settings.playMode === 'story';
      this.closeManorQuest();
      if (storyFailed) this.completeStoryModeRestartAfterReturn();
      else this.openManorQuest();
      return;
    }
  }

  private beginManorSpiderChallenge(): void {
    if (!this.manorQuest || this.manorQuest.phase !== 'hunt' || this.manorInputLocked) {
      return;
    }
    const spiderBounds = this.manorSpiderTarget.getBoundingClientRect();
    const playfieldBounds = this.manorPlayfield.getBoundingClientRect();
    this.manorCapturedSpiderPosition = {
      x: spiderBounds.left - playfieldBounds.left,
      y: spiderBounds.top - playfieldBounds.top
    };
    this.manorReturnScroll = this.captureScrollPositions(this.manorHuntView);
    this.stopManorSpiderAnimation();
    this.manorQuest = startManorSpiderChallenge(this.manorQuest);
    this.renderManorQuest();
  }

  private answerManorChoice(choice: number): void {
    if (!this.manorQuest || this.manorQuest.phase !== 'challenge' || this.manorInputLocked) {
      return;
    }

    this.blurHudFocus();
    this.manorInputLocked = true;
    const previousHp = this.manorQuest.challenge.playerHp;
    this.manorQuest = answerManorQuestion(this.manorQuest, choice);
    if (this.manorQuest.challenge.playerHp < previousHp) {
      this.progress.recordDamageTaken();
      if (this.manorQuest.settings.playMode === 'story') {
        if (this.manorQuest.phase === 'lost') {
          this.restartStoryModeAfterFailure();
        } else {
          this.progress.setStoryLives(this.manorQuest.challenge.playerHp);
        }
      }
    }
    this.manorPanel.classList.remove('is-player-hit', 'is-answer-correct', 'is-spider-cleared');
    this.manorPanel.classList.add(
      this.manorQuest.phase === 'spider-cleared'
        ? 'is-spider-cleared'
        : this.manorQuest.challenge.lastAnswerCorrect
          ? 'is-answer-correct'
          : 'is-player-hit'
    );
    this.renderPreservingScroll(this.manorChallengeView, () => this.renderManorQuest());
    const spiderCleared = this.manorQuest.phase === 'spider-cleared';
    this.manorFeedbackTimer = window.setTimeout(() => {
      this.manorPanel.classList.remove('is-player-hit', 'is-answer-correct', 'is-spider-cleared');
      this.manorInputLocked = false;
      this.manorFeedbackTimer = undefined;
      if (this.manorQuest?.phase === 'spider-cleared') {
        this.manorQuest = continueManorQuest(this.manorQuest);
        this.manorCapturedSpiderPosition = undefined;
      }
      const returningToHunt = this.manorQuest?.phase === 'hunt';
      this.renderManorQuest();
      if (returningToHunt) {
        this.restoreScrollPositions(this.manorReturnScroll);
        this.manorReturnScroll = undefined;
      }
    }, spiderCleared ? 920 : 430);
  }

  private blurHudFocus(): void {
    const activeElement = hudElementRoot instanceof ShadowRoot
      ? hudElementRoot.activeElement
      : document.activeElement;
    if (activeElement instanceof HTMLElement) {
      activeElement.blur();
    }
  }

  private captureScrollPositions(anchor: HTMLElement): Array<{
    element: HTMLElement;
    left: number;
    top: number;
  }> {
    const positions: Array<{
      element: HTMLElement;
      left: number;
      top: number;
    }> = [];
    const visited = new Set<HTMLElement>();
    let current: HTMLElement | null = anchor;
    while (current) {
      if (!visited.has(current)) {
        visited.add(current);
        positions.push({
          element: current,
          left: current.scrollLeft,
          top: current.scrollTop
        });
      }
      const root = current.getRootNode();
      current = current.parentElement
        ?? (root instanceof ShadowRoot && root.host instanceof HTMLElement ? root.host : null);
    }
    const documentScroller = document.scrollingElement;
    if (documentScroller instanceof HTMLElement && !visited.has(documentScroller)) {
      positions.push({
        element: documentScroller,
        left: documentScroller.scrollLeft,
        top: documentScroller.scrollTop
      });
    }
    return positions;
  }

  private restoreScrollPositions(
    positions?: Array<{ element: HTMLElement; left: number; top: number }>
  ): void {
    if (!positions) return;
    const restore = (): void => {
      positions.forEach(({ element, left, top }) => {
        element.scrollLeft = left;
        element.scrollTop = top;
      });
    };
    restore();
    window.requestAnimationFrame(() => {
      restore();
      window.requestAnimationFrame(restore);
    });
  }

  private renderPreservingScroll(anchor: HTMLElement, render: () => void): void {
    const scrollPositions = this.captureScrollPositions(anchor);
    render();
    this.restoreScrollPositions(scrollPositions);
  }

  private completeManorChallengeForDev(): void {
    if (
      !import.meta.env.DEV
      || !new Set(['localhost', '127.0.0.1', '::1']).has(window.location.hostname)
      || !this.manorQuest
      || this.manorQuest.phase !== 'challenge'
      || this.manorInputLocked
    ) {
      return;
    }

    this.manorInputLocked = true;
    while (this.manorQuest.phase === 'challenge') {
      this.manorQuest = answerManorQuestion(
        this.manorQuest,
        this.manorQuest.challenge.question.answer
      );
    }
    this.manorPanel.classList.add('is-spider-cleared');
    this.renderManorQuest();
    this.manorFeedbackTimer = window.setTimeout(() => {
      this.manorPanel.classList.remove('is-spider-cleared');
      this.manorInputLocked = false;
      this.manorFeedbackTimer = undefined;
      if (this.manorQuest?.phase === 'spider-cleared') {
        this.manorQuest = continueManorQuest(this.manorQuest);
        this.manorCapturedSpiderPosition = undefined;
      }
      this.renderManorQuest();
      if (this.manorQuest?.phase === 'hunt') {
        this.restoreScrollPositions(this.manorReturnScroll);
        this.manorReturnScroll = undefined;
      }
    }, 920);
  }

  private claimManorReward(): void {
    const state = this.manorQuest;
    if (!state || state.phase !== 'reward' || this.manorInputLocked) {
      return;
    }

    this.manorInputLocked = true;
    this.manorPrimaryButton.disabled = true;
    const result = this.progress.completeTallvokterQuest(MANOR_QUEST_ID, state.rewardValue);
    const finishPayment = (): void => {
      if (this.manorQuest?.phase === 'reward') {
        this.manorQuest = markManorRewardPaid(this.manorQuest);
        this.manorInputLocked = false;
        this.renderManorQuest();
      }
    };
    if (result.regnecoins > 0) {
      this.playRegnecoinRewardAnimation(result.regnecoins, this.manorPrimaryButton, finishPayment);
    } else {
      finishPayment();
    }
    this.renderBackpack();
  }

  private startManorSpiderAnimation(): void {
    const state = this.manorQuest;
    if (!state || state.phase !== 'hunt') {
      this.stopManorSpiderAnimation();
      return;
    }
    if (this.manorSpiderAnimation && this.manorAnimatedSpiderIndex === state.spiderIndex) {
      return;
    }

    this.stopManorSpiderAnimation();
    this.manorSpiderTarget.classList.remove('is-falling');
    this.manorSpiderTarget.style.left = '0px';
    this.manorSpiderTarget.style.top = '0px';
    const fieldWidth = this.manorPlayfield.clientWidth;
    const fieldHeight = this.manorPlayfield.clientHeight;
    const targetWidth = this.manorSpiderTarget.offsetWidth;
    const targetHeight = this.manorSpiderTarget.offsetHeight;
    const maxX = Math.max(10, fieldWidth - targetWidth - 16);
    const minY = Math.min(68, Math.max(10, fieldHeight - targetHeight));
    const maxY = Math.max(minY, fieldHeight - targetHeight - 14);
    const randomX = (): number => 8 + Math.random() * Math.max(2, maxX - 8);
    const randomY = (): number => minY + Math.random() * Math.max(2, maxY - minY);
    const keyframes = Array.from({ length: 7 }, (_, index) => ({
      transform: `translate3d(${randomX()}px, ${randomY()}px, 0) rotate(${index % 2 === 0 ? -4 : 5}deg)`,
      offset: index / 6
    }));
    this.manorSpiderAnimation = this.manorSpiderTarget.animate(keyframes, {
      duration: 6500 + Math.random() * 1700,
      iterations: Number.POSITIVE_INFINITY,
      direction: 'alternate',
      easing: 'ease-in-out'
    });
    this.manorAnimatedSpiderIndex = state.spiderIndex;
  }

  private stopManorSpiderAnimation(): void {
    this.manorSpiderAnimation?.cancel();
    this.manorSpiderAnimation = undefined;
    this.manorAnimatedSpiderIndex = undefined;
    this.manorSpiderTarget.style.transform = '';
  }

  private renderManorQuest(): void {
    const state = this.manorQuest;
    if (!state || this.manorModal.classList.contains('is-hidden')) {
      return;
    }

    this.manorPanel.dataset.phase = state.phase;
    const storyActive = state.phase === 'intro'
      || state.phase === 'reward'
      || state.phase === 'paid'
      || state.phase === 'lost';
    const huntActive = state.phase === 'hunt' || state.phase === 'spider-cleared';
    const challengeActive = state.phase === 'challenge';
    this.manorStoryView.classList.toggle('is-hidden', !storyActive);
    this.manorHuntView.classList.toggle('is-hidden', !huntActive);
    this.manorChallengeView.classList.toggle('is-hidden', !challengeActive);
    this.manorStoryRules.classList.toggle('is-hidden', state.phase !== 'intro' && state.phase !== 'lost');
    this.manorStoryReward.classList.toggle('is-hidden', state.phase !== 'reward' && state.phase !== 'paid');
    this.manorTestVictoryButton?.classList.toggle('is-hidden', state.phase !== 'challenge');
    this.manorRewardValue.textContent = String(state.rewardValue);
    this.manorPrimaryButton.disabled = this.manorInputLocked;
    this.leaveManorButton.textContent = state.phase === 'paid' ? 'Til kartet' : 'Avslutt';

    if (huntActive) {
      const spiderCleared = state.phase === 'spider-cleared';
      this.manorPhase.textContent = spiderCleared
        ? `Edderkopp ${state.spiderIndex + 1} er slått`
        : `Finn edderkopp ${state.spiderIndex + 1} av ${MANOR_SPIDER_COUNT}`;
      this.manorClearedCount.textContent = `${state.clearedCount} av ${MANOR_SPIDER_COUNT}`;
      this.manorHuntHearts.innerHTML = Array.from(
        { length: state.challenge.maxPlayerHp },
        (_, index) => `<span class="heart ${index < state.challenge.playerHp ? 'is-live' : 'is-lost'}" aria-hidden="true">❤</span>`
      ).join('');
      this.manorHuntMessage.textContent = spiderCleared
        ? 'Edderkoppen mister taket og faller ut av spindelvevet!'
        : state.message;
      this.manorSpiderTarget.disabled = spiderCleared;
      if (spiderCleared) {
        this.stopManorSpiderAnimation();
        const position = this.manorCapturedSpiderPosition ?? { x: 24, y: 90 };
        this.manorSpiderTarget.style.left = `${position.x}px`;
        this.manorSpiderTarget.style.top = `${position.y}px`;
        this.manorSpiderTarget.classList.remove('is-falling');
        void this.manorSpiderTarget.offsetWidth;
        this.manorSpiderTarget.classList.add('is-falling');
      } else {
        this.manorSpiderTarget.classList.remove('is-falling');
        this.manorSpiderTarget.style.left = '0px';
        this.manorSpiderTarget.style.top = '0px';
        window.requestAnimationFrame(() => this.startManorSpiderAnimation());
      }
      return;
    }

    this.stopManorSpiderAnimation();
    if (challengeActive) {
      this.manorPhase.textContent = `Edderkopp ${state.spiderIndex + 1} av ${MANOR_SPIDER_COUNT}`;
      this.manorSpiderNumber.textContent = `Edderkopp ${state.spiderIndex + 1} av ${MANOR_SPIDER_COUNT}`;
      this.manorQuestionProgress.innerHTML = Array.from(
        { length: state.challenge.requiredCorrect },
        (_, index) => `<span class="${index < state.challenge.correct ? 'is-filled' : ''}"></span>`
      ).join('');
      this.manorChallengeHearts.innerHTML = Array.from(
        { length: state.challenge.maxPlayerHp },
        (_, index) => `<span class="heart ${index < state.challenge.playerHp ? 'is-live' : 'is-lost'}" aria-hidden="true">❤</span>`
      ).join('');
      this.manorQuestion.textContent = state.challenge.question.prompt;
      this.manorChallengeMessage.textContent = state.message;
      this.manorChoices.innerHTML = '';
      for (const choice of state.challenge.question.choices) {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = String(choice);
        button.disabled = this.manorInputLocked || state.phase !== 'challenge';
        button.addEventListener('click', () => this.answerManorChoice(choice));
        this.manorChoices.append(button);
      }
      return;
    }

    this.manorChoices.innerHTML = '';
    if (state.phase === 'intro') {
      this.manorPhase.textContent = 'Butlerens oppdrag';
      this.manorStoryKicker.textContent = 'Butleren trenger hjelp';
      this.manorStoryTitle.textContent = 'Rydd Herskapshuset!';
      this.manorStoryMessage.textContent = MANOR_WELCOME;
      this.manorPrimaryButton.textContent = 'Start ryddingen';
      return;
    }
    if (state.phase === 'reward') {
      this.manorPhase.textContent = 'Huset er ryddet';
      this.manorStoryKicker.textContent = 'Butlerens takk';
      this.manorStoryTitle.textContent = 'Et skinnende rent hus!';
      this.manorStoryMessage.textContent =
        `Alle fem edderkoppene er borte. Butleren betaler deg ${state.rewardValue} Regnecoins for hjelpen.`;
      this.manorPrimaryButton.textContent = 'Få utbetalt';
      return;
    }
    if (state.phase === 'paid') {
      this.manorPhase.textContent = 'Fullført';
      this.manorStoryKicker.textContent = 'Oppdrag fullført';
      this.manorStoryTitle.textContent = 'Takk for hjelpen!';
      this.manorStoryMessage.textContent = state.message;
      this.manorPrimaryButton.textContent = 'Til kartet';
      return;
    }

    this.manorPhase.textContent = 'Forsøket er over';
    this.manorStoryKicker.textContent = 'Edderkoppene tok overhånd';
    this.manorStoryTitle.textContent = 'Prøv ryddingen på nytt';
    this.manorStoryMessage.textContent = state.message;
    this.manorPrimaryButton.textContent = state.settings.playMode === 'story'
      ? 'Tilbake til kartet'
      : 'Start på nytt';
  }

  private loadCrystalBridgeSceneLayout(): CrystalBridgeSceneLayout {
    try {
      const stored = JSON.parse(
        window.localStorage.getItem(CRYSTAL_BRIDGE_LAYOUT_STORAGE_KEY) ?? 'null'
      ) as Partial<CrystalBridgeSceneLayout> | null;
      if (
        stored
        && Array.isArray(stored.sockets)
        && stored.sockets.length === CRYSTAL_BRIDGE_CRYSTAL_COUNT
        && stored.sockets.every((position) =>
          Array.isArray(position)
          && position.length === 2
          && position.every(Number.isFinite)
        )
        && stored.answers
        && Number.isFinite(stored.answers.x)
        && Number.isFinite(stored.answers.y)
      ) {
        return {
          sockets: stored.sockets.map(([x, y]) => [x, y]),
          answers: { x: stored.answers.x, y: stored.answers.y }
        };
      }
    } catch {
      // En ugyldig lokal redigeringsverdi skal aldri hindre spillet i å starte.
    }
    return {
      sockets: DEFAULT_CRYSTAL_BRIDGE_SOCKET_POSITIONS.map(([x, y]) => [x, y]),
      answers: { ...DEFAULT_CRYSTAL_BRIDGE_ANSWER_POSITION }
    };
  }

  private saveCrystalBridgeSceneLayout(): void {
    window.localStorage.setItem(
      CRYSTAL_BRIDGE_LAYOUT_STORAGE_KEY,
      JSON.stringify(this.crystalBridgeLayout)
    );
  }

  private applyCrystalBridgeSceneLayout(): void {
    this.crystalBridgeSockets
      .querySelectorAll<HTMLElement>('.crystal-bridge-socket')
      .forEach((socket, index) => {
        const position = this.crystalBridgeLayout.sockets[index];
        if (!position) return;
        socket.style.left = `${position[0]}%`;
        socket.style.top = `${position[1]}%`;
      });
    this.crystalBridgeAnswers.style.left = `${this.crystalBridgeLayout.answers.x}%`;
    this.crystalBridgeAnswers.style.top = `${this.crystalBridgeLayout.answers.y}%`;
    this.crystalBridgeAnswers.style.right = 'auto';
    this.crystalBridgeAnswers.style.bottom = 'auto';
    this.crystalBridgeAnswers.style.transform = 'translate(-50%, -50%)';
  }

  private toggleCrystalBridgeSceneEditor(): void {
    this.crystalBridgeEditMode = !this.crystalBridgeEditMode;
    this.crystalBridgePlayfield.classList.toggle('is-editing', this.crystalBridgeEditMode);
    if (this.crystalBridgeEditButton) {
      this.crystalBridgeEditButton.textContent =
        this.crystalBridgeEditMode ? 'Avslutt redigering' : 'Rediger scene';
    }
    this.crystalBridgeMessage.textContent = this.crystalBridgeEditMode
      ? 'Dra soklene enkeltvis. Dra i svar-krystallgruppen for å flytte alle fire.'
      : (this.crystalBridgeQuest?.message ?? '');
  }

  private resetCrystalBridgeSceneLayout(): void {
    this.crystalBridgeLayout = {
      sockets: DEFAULT_CRYSTAL_BRIDGE_SOCKET_POSITIONS.map(([x, y]) => [x, y]),
      answers: { ...DEFAULT_CRYSTAL_BRIDGE_ANSWER_POSITION }
    };
    this.saveCrystalBridgeSceneLayout();
    this.applyCrystalBridgeSceneLayout();
    this.crystalBridgeMessage.textContent = 'Plasseringene er nullstilt.';
  }

  private readonly handleCrystalBridgeLayoutPointerDown = (event: PointerEvent): void => {
    if (!this.crystalBridgeEditMode) return;
    const target = event.currentTarget;
    if (!(target instanceof HTMLElement)) return;
    event.preventDefault();
    event.stopPropagation();
    const field = this.crystalBridgePlayfield.getBoundingClientRect();
    const kind = target.classList.contains('crystal-bridge-socket') ? 'socket' : 'answers';
    const index = kind === 'socket' ? Number(target.dataset.index) : undefined;
    const position = kind === 'socket' && index !== undefined
      ? this.crystalBridgeLayout.sockets[index]
      : [this.crystalBridgeLayout.answers.x, this.crystalBridgeLayout.answers.y];
    if (!position) return;
    const pointerX = ((event.clientX - field.left) / field.width) * 100;
    const pointerY = ((event.clientY - field.top) / field.height) * 100;
    this.crystalBridgeLayoutPointer = {
      id: event.pointerId,
      target,
      kind,
      index,
      offsetX: pointerX - position[0],
      offsetY: pointerY - position[1]
    };
    target.setPointerCapture(event.pointerId);
    target.classList.add('is-layout-dragging');
  };

  private readonly handleCrystalBridgeLayoutPointerMove = (event: PointerEvent): void => {
    const pointer = this.crystalBridgeLayoutPointer;
    if (!pointer || pointer.id !== event.pointerId) return;
    event.preventDefault();
    const field = this.crystalBridgePlayfield.getBoundingClientRect();
    const x = Math.min(
      96,
      Math.max(4, ((event.clientX - field.left) / field.width) * 100 - pointer.offsetX)
    );
    const y = Math.min(
      94,
      Math.max(6, ((event.clientY - field.top) / field.height) * 100 - pointer.offsetY)
    );
    if (pointer.kind === 'socket' && pointer.index !== undefined) {
      this.crystalBridgeLayout.sockets[pointer.index] = [x, y];
    } else {
      this.crystalBridgeLayout.answers = { x, y };
    }
    this.applyCrystalBridgeSceneLayout();
  };

  private readonly handleCrystalBridgeLayoutPointerEnd = (event: PointerEvent): void => {
    const pointer = this.crystalBridgeLayoutPointer;
    if (!pointer || pointer.id !== event.pointerId) return;
    event.preventDefault();
    if (pointer.target.hasPointerCapture(event.pointerId)) {
      pointer.target.releasePointerCapture(event.pointerId);
    }
    pointer.target.classList.remove('is-layout-dragging');
    this.crystalBridgeLayoutPointer = undefined;
    this.saveCrystalBridgeSceneLayout();
  };

  private readonly handleCrystalBridgePointerDown = (event: PointerEvent): void => {
    const answer = event.currentTarget;
    if (
      !(answer instanceof HTMLButtonElement)
      || this.crystalBridgeEditMode
      || !this.crystalBridgeQuest
      || this.crystalBridgeQuest.phase !== 'placing'
      || this.crystalBridgeInputLocked
    ) return;
    event.preventDefault();
    this.crystalBridgePointer = {
      id: event.pointerId,
      element: answer,
      startClientX: event.clientX,
      startClientY: event.clientY
    };
    answer.setPointerCapture(event.pointerId);
    answer.classList.add('is-dragging');
  };

  private readonly handleCrystalBridgePointerMove = (event: PointerEvent): void => {
    const pointer = this.crystalBridgePointer;
    if (!pointer || pointer.id !== event.pointerId) return;
    event.preventDefault();
    pointer.element.style.transform =
      `translate(${event.clientX - pointer.startClientX}px, ${event.clientY - pointer.startClientY}px) scale(1.08)`;
  };

  private readonly handleCrystalBridgePointerEnd = (event: PointerEvent): void => {
    const pointer = this.crystalBridgePointer;
    if (!pointer || pointer.id !== event.pointerId) return;
    event.preventDefault();
    this.crystalBridgePointer = undefined;
    pointer.element.classList.remove('is-dragging');
    if (pointer.element.hasPointerCapture(event.pointerId)) {
      pointer.element.releasePointerCapture(event.pointerId);
    }
    const activeSocket =
      this.crystalBridgeSockets.querySelector<HTMLElement>('.crystal-bridge-socket.is-active');
    const crystalBounds = pointer.element.getBoundingClientRect();
    const socketBounds = activeSocket?.getBoundingClientRect();
    const centerX = crystalBounds.left + crystalBounds.width / 2;
    const centerY = crystalBounds.top + crystalBounds.height / 2;
    const insideSocket = Boolean(
      socketBounds
      && centerX >= socketBounds.left - 28
      && centerX <= socketBounds.right + 28
      && centerY >= socketBounds.top - 28
      && centerY <= socketBounds.bottom + 28
    );
    pointer.element.style.transform = '';
    if (!insideSocket || !activeSocket) return;
    const value = Number(pointer.element.dataset.value);
    if (Number.isFinite(value)) {
      this.answerCrystalBridge(value, pointer.element, activeSocket);
    }
  };

  public openCrystalBridgeQuest(): void {
    this.clearCrystalBridgeFeedback();
    this.crystalBridgeQuest = createCrystalBridgeQuest(
      this.progress.getSettings(),
      this.progress.getBattleHearts()
    );
    this.crystalBridgeInputLocked = false;
    this.crystalBridgeStoryView
      .querySelector<HTMLImageElement>('.crystal-bridge-guardian-art')
      ?.setAttribute('src', CRYSTAL_BRIDGE_GUARDIAN_ASSET_PATH);
    this.crystalBridgeModal.classList.remove('is-hidden');
    this.renderCrystalBridgeQuest();
  }

  private closeCrystalBridgeQuest(): void {
    const wasOpen = !this.crystalBridgeModal.classList.contains('is-hidden');
    this.clearCrystalBridgeFeedback();
    this.crystalBridgeModal.classList.add('is-hidden');
    this.crystalBridgeQuest = undefined;
    this.crystalBridgeInputLocked = false;
    this.crystalBridgeEditMode = false;
    this.crystalBridgeLayoutPointer = undefined;
    this.crystalBridgePlayfield.classList.remove('is-editing');
    if (this.crystalBridgeEditButton) {
      this.crystalBridgeEditButton.textContent = 'Rediger scene';
    }
    this.crystalBridgeAnswers.innerHTML = '';
    this.crystalBridgeSockets.innerHTML = '';
    if (wasOpen) this.hooks?.resetInput();
  }

  private advanceCrystalBridgeQuest(): void {
    const state = this.crystalBridgeQuest;
    if (!state || this.crystalBridgeInputLocked) return;
    if (state.phase === 'intro') {
      this.crystalBridgeQuest = startCrystalBridgeQuest(state);
      this.renderCrystalBridgeQuest();
    } else if (state.phase === 'reward') {
      this.claimCrystalBridgeReward();
    } else if (state.phase === 'paid') {
      this.closeCrystalBridgeQuest();
    } else if (state.phase === 'lost') {
      const storyFailed = state.settings.playMode === 'story';
      this.closeCrystalBridgeQuest();
      if (storyFailed) this.completeStoryModeRestartAfterReturn();
      else this.openCrystalBridgeQuest();
    }
  }

  private answerCrystalBridge(
    value: number,
    crystal: HTMLButtonElement,
    socket: HTMLElement
  ): void {
    const state = this.crystalBridgeQuest;
    if (!state || state.phase !== 'placing' || this.crystalBridgeInputLocked) return;
    this.crystalBridgeInputLocked = true;
    const previousHp = state.challenge.playerHp;
    const correct = value === state.challenge.question.answer;
    this.crystalBridgeQuest = placeBridgeCrystal(state, value);
    if (
      this.crystalBridgeQuest.challenge.playerHp < previousHp
      && this.crystalBridgeQuest.settings.playMode === 'story'
    ) {
      this.progress.recordDamageTaken();
      if (this.crystalBridgeQuest.phase === 'lost') {
        this.restartStoryModeAfterFailure();
      } else {
        this.progress.setStoryLives(this.crystalBridgeQuest.challenge.playerHp);
      }
    }
    if (correct) {
      socket.classList.remove('is-active');
      socket.classList.add('is-filled');
      crystal.style.opacity = '0';
      this.crystalBridgeLightWave.classList.remove('is-active');
      void this.crystalBridgeLightWave.offsetWidth;
      this.crystalBridgeLightWave.classList.add('is-active');
    } else {
      socket.classList.add('is-wrong');
      crystal.classList.add('is-wrong');
      this.crystalBridgePanel.classList.add('is-wrong');
    }
    this.crystalBridgeMessage.textContent = this.crystalBridgeQuest.message;
    this.crystalBridgeFeedbackTimer = window.setTimeout(() => {
      socket.classList.remove('is-wrong');
      crystal.classList.remove('is-wrong');
      this.crystalBridgePanel.classList.remove('is-wrong');
      this.crystalBridgeLightWave.classList.remove('is-active');
      this.crystalBridgeInputLocked = false;
      this.crystalBridgeFeedbackTimer = undefined;
      this.renderCrystalBridgeQuest();
    }, correct ? 620 : 430);
  }

  private completeCrystalBridgeQuestForDev(): void {
    if (
      !import.meta.env.DEV
      || !this.crystalBridgeQuest
      || this.crystalBridgeQuest.phase !== 'placing'
      || this.crystalBridgeInputLocked
    ) return;
    while (this.crystalBridgeQuest.phase === 'placing') {
      this.crystalBridgeQuest = placeBridgeCrystal(
        this.crystalBridgeQuest,
        this.crystalBridgeQuest.challenge.question.answer
      );
    }
    this.renderCrystalBridgeQuest();
  }

  private claimCrystalBridgeReward(): void {
    const state = this.crystalBridgeQuest;
    if (!state || state.phase !== 'reward' || this.crystalBridgeInputLocked) return;
    this.crystalBridgeInputLocked = true;
    this.crystalBridgePrimaryButton.disabled = true;
    const result = this.progress.completeTallvokterQuest(
      CRYSTAL_BRIDGE_QUEST_ID,
      state.rewardValue
    );
    const finishPayment = (): void => {
      if (this.crystalBridgeQuest?.phase === 'reward') {
        this.crystalBridgeQuest = markCrystalBridgeRewardPaid(this.crystalBridgeQuest);
        this.crystalBridgeInputLocked = false;
        this.renderCrystalBridgeQuest();
      }
    };
    if (result.regnecoins > 0) {
      this.playRegnecoinRewardAnimation(
        result.regnecoins,
        this.crystalBridgePrimaryButton,
        finishPayment
      );
    } else {
      finishPayment();
    }
    this.renderBackpack();
  }

  private clearCrystalBridgeFeedback(): void {
    if (this.crystalBridgeFeedbackTimer) {
      window.clearTimeout(this.crystalBridgeFeedbackTimer);
      this.crystalBridgeFeedbackTimer = undefined;
    }
    if (this.crystalBridgePointer) {
      this.crystalBridgePointer.element.style.transform = '';
      this.crystalBridgePointer.element.classList.remove('is-dragging');
    }
    this.crystalBridgePointer = undefined;
    this.crystalBridgeLayoutPointer = undefined;
    this.crystalBridgePanel.classList.remove('is-wrong');
    this.crystalBridgeLightWave.classList.remove('is-active');
  }

  private renderCrystalBridgeQuest(): void {
    const state = this.crystalBridgeQuest;
    if (!state || this.crystalBridgeModal.classList.contains('is-hidden')) return;
    this.crystalBridgePanel.dataset.phase = state.phase;
    const placing = state.phase === 'placing';
    this.crystalBridgeStoryView.classList.toggle('is-hidden', placing);
    this.crystalBridgeGameView.classList.toggle('is-hidden', !placing);
    this.crystalBridgeStoryRules.classList.toggle(
      'is-hidden',
      state.phase !== 'intro' && state.phase !== 'lost'
    );
    this.crystalBridgeStoryReward.classList.toggle(
      'is-hidden',
      state.phase !== 'reward' && state.phase !== 'paid'
    );
    this.crystalBridgeTestVictoryButton?.classList.toggle('is-hidden', !placing);
    this.crystalBridgeRewardValue.textContent = String(state.rewardValue);
    this.crystalBridgePrimaryButton.disabled = this.crystalBridgeInputLocked;
    this.leaveCrystalBridgeButton.textContent = state.phase === 'paid' ? 'Til kartet' : 'Avslutt';

    if (placing) {
      this.crystalBridgePhase.textContent =
        `Lysledd ${state.placedCrystals + 1} av ${CRYSTAL_BRIDGE_CRYSTAL_COUNT}`;
      this.crystalBridgePlacedCount.textContent =
        `${state.placedCrystals} av ${CRYSTAL_BRIDGE_CRYSTAL_COUNT}`;
      this.crystalBridgeQuestion.textContent = state.challenge.question.prompt;
      this.crystalBridgeHearts.innerHTML = Array.from(
        { length: state.challenge.maxPlayerHp },
        (_, index) =>
          `<span class="heart ${index < state.challenge.playerHp ? 'is-live' : 'is-lost'}" aria-hidden="true">❤</span>`
      ).join('');
      this.crystalBridgeMessage.textContent = state.message;
      this.crystalBridgePlayfield.classList.toggle(
        'is-complete',
        state.placedCrystals >= CRYSTAL_BRIDGE_CRYSTAL_COUNT
      );

      this.crystalBridgeSockets.innerHTML = '';
      this.crystalBridgeLayout.sockets.forEach(([left, top], index) => {
        const socket = document.createElement('div');
        socket.className = 'crystal-bridge-socket';
        socket.dataset.index = String(index);
        socket.style.left = `${left}%`;
        socket.style.top = `${top}%`;
        if (index < state.placedCrystals) socket.classList.add('is-filled');
        if (index === state.placedCrystals) socket.classList.add('is-active');
        socket.addEventListener('pointerdown', this.handleCrystalBridgeLayoutPointerDown);
        this.crystalBridgeSockets.append(socket);
      });

      this.crystalBridgeAnswers.innerHTML = '';
      state.challenge.question.choices.forEach((choice) => {
        const crystal = document.createElement('button');
        crystal.type = 'button';
        crystal.className = 'crystal-bridge-answer';
        crystal.dataset.value = String(choice);
        crystal.setAttribute('aria-label', `Svar ${choice}`);
        const value = document.createElement('strong');
        value.textContent = String(choice);
        crystal.append(value);
        crystal.addEventListener('pointerdown', this.handleCrystalBridgePointerDown);
        this.crystalBridgeAnswers.append(crystal);
      });
      this.applyCrystalBridgeSceneLayout();
      return;
    }

    if (state.phase === 'intro') {
      this.crystalBridgePhase.textContent = 'Vokterens oppdrag';
      this.crystalBridgeStoryKicker.textContent = 'Lyset er brutt';
      this.crystalBridgeStoryTitle.textContent = 'Gjenreis de åtte lysleddene';
      this.crystalBridgeStoryMessage.textContent = CRYSTAL_BRIDGE_WELCOME;
      this.crystalBridgePrimaryButton.textContent = 'Start reparasjonen';
    } else if (state.phase === 'reward') {
      this.crystalBridgePhase.textContent = 'Porten er åpnet';
      this.crystalBridgeStoryKicker.textContent = 'Broen stråler igjen';
      this.crystalBridgeStoryTitle.textContent = 'Krystallbroen er reddet!';
      this.crystalBridgeStoryMessage.textContent = state.message;
      this.crystalBridgePrimaryButton.textContent = 'Få utbetalt';
    } else if (state.phase === 'paid') {
      this.crystalBridgePhase.textContent = 'Fullført';
      this.crystalBridgeStoryKicker.textContent = 'Oppdrag fullført';
      this.crystalBridgeStoryTitle.textContent = 'Lyset viser vei';
      this.crystalBridgeStoryMessage.textContent = state.message;
      this.crystalBridgePrimaryButton.textContent = 'Til kartet';
    } else {
      this.crystalBridgePhase.textContent = 'Forsøket er over';
      this.crystalBridgeStoryKicker.textContent = 'Lyset sluknet';
      this.crystalBridgeStoryTitle.textContent = 'Prøv reparasjonen på nytt';
      this.crystalBridgeStoryMessage.textContent = state.message;
      this.crystalBridgePrimaryButton.textContent = state.settings.playMode === 'story'
        ? 'Tilbake til kartet'
        : 'Start på nytt';
    }
  }

  private readonly handleArchivePointerDown = (event: PointerEvent): void => {
    if (!this.archiveQuest || this.archiveQuest.phase !== 'sorting' || this.archiveInputLocked) return;
    event.preventDefault();
    const bounds = this.archiveScroll.getBoundingClientRect();
    this.archivePointer = {
      id: event.pointerId,
      offsetX: event.clientX - bounds.left,
      offsetY: event.clientY - bounds.top
    };
    this.archiveScroll.setPointerCapture(event.pointerId);
    this.archiveScroll.classList.add('is-dragging');
  };

  private readonly handleArchivePointerMove = (event: PointerEvent): void => {
    if (!this.archivePointer || this.archivePointer.id !== event.pointerId) return;
    event.preventDefault();
    const field = this.archivePlayfield.getBoundingClientRect();
    const left = Math.min(
      Math.max(0, field.width - this.archiveScroll.offsetWidth),
      Math.max(0, event.clientX - field.left - this.archivePointer.offsetX)
    );
    const top = Math.min(
      Math.max(0, field.height - this.archiveScroll.offsetHeight),
      Math.max(0, event.clientY - field.top - this.archivePointer.offsetY)
    );
    this.archiveScroll.style.left = `${left}px`;
    this.archiveScroll.style.top = `${top}px`;
    this.archiveScroll.style.bottom = 'auto';
    this.archiveScroll.style.transform = 'none';
  };

  private readonly handleArchivePointerEnd = (event: PointerEvent): void => {
    if (!this.archivePointer || this.archivePointer.id !== event.pointerId) return;
    event.preventDefault();
    this.archivePointer = undefined;
    this.archiveScroll.classList.remove('is-dragging');
    if (this.archiveScroll.hasPointerCapture(event.pointerId)) {
      this.archiveScroll.releasePointerCapture(event.pointerId);
    }
    const scrollBounds = this.archiveScroll.getBoundingClientRect();
    const centerX = scrollBounds.left + scrollBounds.width / 2;
    const centerY = scrollBounds.top + scrollBounds.height / 2;
    const shelf = Array.from(this.archiveShelves.querySelectorAll<HTMLElement>('.archive-shelf'))
      .find((candidate) => {
        const bounds = candidate.getBoundingClientRect();
        return centerX >= bounds.left - 18 && centerX <= bounds.right + 18
          && centerY >= bounds.top - 18 && centerY <= bounds.bottom + 18;
      });
    if (!shelf) {
      this.resetArchiveScrollPosition();
      return;
    }
    const value = Number(shelf.dataset.value);
    if (!Number.isFinite(value)) {
      this.resetArchiveScrollPosition();
      return;
    }
    this.answerArchiveShelf(value, shelf);
  };

  public openArchiveQuest(): void {
    this.clearArchiveFeedback();
    this.archiveQuest = createArchiveQuest(
      this.progress.getSettings(),
      this.progress.getBattleHearts()
    );
    this.archiveInputLocked = false;
    this.archiveStoryView.querySelector<HTMLImageElement>('.archive-archivist-stage > img')
      ?.setAttribute('src', ARCHIVIST_ASSET_PATH);
    this.archiveModal.classList.remove('is-hidden');
    this.renderArchiveQuest();
  }

  private closeArchiveQuest(): void {
    const wasOpen = !this.archiveModal.classList.contains('is-hidden');
    this.clearArchiveFeedback();
    this.archiveModal.classList.add('is-hidden');
    this.archiveQuest = undefined;
    this.archiveInputLocked = false;
    this.archiveShelves.innerHTML = '';
    this.resetArchiveScrollPosition();
    if (wasOpen) this.hooks?.resetInput();
  }

  private advanceArchiveQuest(): void {
    const state = this.archiveQuest;
    if (!state || this.archiveInputLocked) return;
    if (state.phase === 'intro') {
      this.archiveQuest = startArchiveQuest(state);
      this.renderArchiveQuest();
    } else if (state.phase === 'reward') {
      this.claimArchiveReward();
    } else if (state.phase === 'paid') {
      this.closeArchiveQuest();
    } else if (state.phase === 'lost') {
      const storyFailed = state.settings.playMode === 'story';
      this.closeArchiveQuest();
      if (storyFailed) this.completeStoryModeRestartAfterReturn();
      else this.openArchiveQuest();
    }
  }

  private answerArchiveShelf(value: number, shelf: HTMLElement): void {
    const state = this.archiveQuest;
    if (!state || state.phase !== 'sorting' || this.archiveInputLocked) return;
    this.archiveInputLocked = true;
    const previousHp = state.challenge.playerHp;
    const correct = value === state.challenge.question.answer;
    this.archiveQuest = sortArchiveScroll(state, value);
    if (this.archiveQuest.challenge.playerHp < previousHp && this.archiveQuest.settings.playMode === 'story') {
      this.progress.recordDamageTaken();
      if (this.archiveQuest.phase === 'lost') {
        this.restartStoryModeAfterFailure();
      } else {
        this.progress.setStoryLives(this.archiveQuest.challenge.playerHp);
      }
    }
    if (correct) {
      shelf.classList.add('is-correct');
      this.archiveScroll.classList.add('is-correct');
    } else {
      shelf.classList.add('is-wrong');
      this.archivePanel.classList.add('is-wrong');
    }
    this.archiveMessage.textContent = this.archiveQuest.message;
    this.archiveFeedbackTimer = window.setTimeout(() => {
      shelf.classList.remove('is-correct');
      shelf.classList.remove('is-wrong');
      this.archiveScroll.classList.remove('is-correct');
      this.archivePanel.classList.remove('is-wrong');
      this.archiveInputLocked = false;
      this.archiveFeedbackTimer = undefined;
      this.resetArchiveScrollPosition();
      this.renderArchiveQuest();
    }, correct ? 460 : 380);
  }

  private completeArchiveQuestForDev(): void {
    if (
      !import.meta.env.DEV
      || !this.archiveQuest
      || this.archiveQuest.phase !== 'sorting'
      || this.archiveInputLocked
    ) return;
    while (this.archiveQuest.phase === 'sorting') {
      this.archiveQuest = sortArchiveScroll(
        this.archiveQuest,
        this.archiveQuest.challenge.question.answer
      );
    }
    this.renderArchiveQuest();
  }

  private claimArchiveReward(): void {
    const state = this.archiveQuest;
    if (!state || state.phase !== 'reward' || this.archiveInputLocked) return;
    this.archiveInputLocked = true;
    this.archivePrimaryButton.disabled = true;
    const result = this.progress.completeTallvokterQuest(ARCHIVE_QUEST_ID, state.rewardValue);
    const finishPayment = (): void => {
      if (this.archiveQuest?.phase === 'reward') {
        this.archiveQuest = markArchiveRewardPaid(this.archiveQuest);
        this.archiveInputLocked = false;
        this.renderArchiveQuest();
      }
    };
    if (result.regnecoins > 0) {
      this.playRegnecoinRewardAnimation(result.regnecoins, this.archivePrimaryButton, finishPayment);
    } else {
      finishPayment();
    }
    this.renderBackpack();
  }

  private clearArchiveFeedback(): void {
    if (this.archiveFeedbackTimer) {
      window.clearTimeout(this.archiveFeedbackTimer);
      this.archiveFeedbackTimer = undefined;
    }
    this.archivePointer = undefined;
    this.archivePanel.classList.remove('is-wrong');
    this.archiveScroll.classList.remove('is-dragging', 'is-correct');
  }

  private resetArchiveScrollPosition(): void {
    this.archiveScroll.style.left = '50%';
    this.archiveScroll.style.top = '';
    this.archiveScroll.style.bottom = '';
    this.archiveScroll.style.transform = 'translateX(-50%)';
  }

  private renderArchiveQuest(): void {
    const state = this.archiveQuest;
    if (!state || this.archiveModal.classList.contains('is-hidden')) return;
    this.archivePanel.dataset.phase = state.phase;
    const sorting = state.phase === 'sorting';
    this.archiveStoryView.classList.toggle('is-hidden', sorting);
    this.archiveSortingView.classList.toggle('is-hidden', !sorting);
    this.archiveStoryRules.classList.toggle('is-hidden', state.phase !== 'intro' && state.phase !== 'lost');
    this.archiveStoryReward.classList.toggle('is-hidden', state.phase !== 'reward' && state.phase !== 'paid');
    this.archiveTestVictoryButton?.classList.toggle('is-hidden', !sorting);
    this.archiveRewardValue.textContent = String(state.rewardValue);
    this.archivePrimaryButton.disabled = this.archiveInputLocked;
    this.leaveArchiveButton.textContent = state.phase === 'paid' ? 'Til kartet' : 'Avslutt';

    if (sorting) {
      this.archivePhase.textContent = `Skriftrull ${state.challenge.correct + 1} av ${ARCHIVE_SCROLL_COUNT}`;
      this.archiveSortedCount.textContent = `${state.challenge.correct} av ${ARCHIVE_SCROLL_COUNT}`;
      this.archiveHearts.innerHTML = Array.from(
        { length: state.challenge.maxPlayerHp },
        (_, index) => `<span class="heart ${index < state.challenge.playerHp ? 'is-live' : 'is-lost'}" aria-hidden="true">❤</span>`
      ).join('');
      this.archiveQuestion.textContent = state.challenge.question.prompt;
      this.archiveMessage.textContent = state.message;
      this.archiveShelves.innerHTML = '';
      state.challenge.question.choices.forEach((choice, index) => {
        const shelf = document.createElement('div');
        shelf.className = 'archive-shelf';
        shelf.dataset.value = String(choice);
        const shelfImage = document.createElement('img');
        shelfImage.src = `/regnemester/archive/shelf-${index + 1}.png`;
        shelfImage.alt = '';
        shelfImage.draggable = false;
        const shelfValue = document.createElement('strong');
        shelfValue.textContent = String(choice);
        shelf.append(shelfImage, shelfValue);
        this.archiveShelves.append(shelf);
      });
      this.resetArchiveScrollPosition();
      return;
    }

    if (state.phase === 'intro') {
      this.archivePhase.textContent = 'Riksarkivarens oppdrag';
      this.archiveStoryKicker.textContent = 'Skriftrullene er blandet';
      this.archiveStoryTitle.textContent = 'Finn riktig hylle';
      this.archiveStoryMessage.textContent = ARCHIVE_WELCOME;
      this.archivePrimaryButton.textContent = 'Start sorteringen';
    } else if (state.phase === 'reward') {
      this.archivePhase.textContent = 'Arkivet er ordnet';
      this.archiveStoryKicker.textContent = 'Riksarkivarens takk';
      this.archiveStoryTitle.textContent = 'Alt er på riktig plass!';
      this.archiveStoryMessage.textContent = state.message;
      this.archivePrimaryButton.textContent = 'Få utbetalt';
    } else if (state.phase === 'paid') {
      this.archivePhase.textContent = 'Fullført';
      this.archiveStoryKicker.textContent = 'Oppdrag fullført';
      this.archiveStoryTitle.textContent = 'Tallarkivet er reddet';
      this.archiveStoryMessage.textContent = state.message;
      this.archivePrimaryButton.textContent = 'Til kartet';
    } else {
      this.archivePhase.textContent = 'Forsøket er over';
      this.archiveStoryKicker.textContent = 'Sorteringen stoppet';
      this.archiveStoryTitle.textContent = 'Prøv på nytt';
      this.archiveStoryMessage.textContent = state.message;
      this.archivePrimaryButton.textContent = state.settings.playMode === 'story'
        ? 'Tilbake til kartet'
        : 'Start på nytt';
    }
  }

  public openPuzzleQuest(): void {
    this.clearPuzzleQuestTimers();
    this.puzzleQuest = createPuzzleQuest(
      this.progress.getSettings(),
      this.progress.getBattleHearts()
    );
    this.puzzleInputLocked = false;
    this.puzzleSelectedSlot = undefined;
    this.puzzleDraggedSlot = undefined;
    this.puzzleQuestPanel.classList.remove('is-player-hit', 'is-answer-correct', 'is-complete');
    this.puzzleStoryView.querySelector<HTMLImageElement>('.puzzle-master-stage > img')
      ?.setAttribute('src', PUZZLE_MASTER_ASSET_PATH);
    this.puzzleQuestModal.classList.remove('is-hidden');
    this.renderPuzzleQuest();
  }

  private closePuzzleQuest(): void {
    this.clearPuzzleQuestTimers();
    this.puzzleQuestModal.classList.add('is-hidden');
    this.puzzleReference.classList.add('is-hidden');
    this.puzzleQuestPanel.classList.remove('is-player-hit', 'is-answer-correct', 'is-complete');
    this.puzzleChoices.innerHTML = '';
    this.puzzleBoard.innerHTML = '';
    this.puzzleQuest = undefined;
    this.puzzleInputLocked = false;
    this.puzzleSelectedSlot = undefined;
    this.puzzleDraggedSlot = undefined;
    this.hooks?.resetInput();
  }

  private clearPuzzleQuestTimers(): void {
    if (this.puzzleFeedbackTimer) {
      window.clearTimeout(this.puzzleFeedbackTimer);
      this.puzzleFeedbackTimer = undefined;
    }
    if (this.puzzlePreviewTimer) {
      window.clearTimeout(this.puzzlePreviewTimer);
      this.puzzlePreviewTimer = undefined;
    }
  }

  private advancePuzzleQuest(): void {
    const state = this.puzzleQuest;
    if (!state || this.puzzleInputLocked) {
      return;
    }

    if (state.phase === 'intro') {
      this.puzzleQuest = startPuzzleQuest(state);
      this.renderPuzzleQuest();
      return;
    }
    if (state.phase === 'reward') {
      this.claimPuzzleReward();
      return;
    }
    if (state.phase === 'paid') {
      this.closePuzzleQuest();
      return;
    }
    if (state.phase === 'lost') {
      const storyFailed = state.settings.playMode === 'story';
      this.closePuzzleQuest();
      if (storyFailed) this.completeStoryModeRestartAfterReturn();
      else this.openPuzzleQuest();
      return;
    }
  }

  private answerPuzzleChoice(choice: number): void {
    if (!this.puzzleQuest || this.puzzleQuest.phase !== 'quiz' || this.puzzleInputLocked) {
      return;
    }

    this.puzzleInputLocked = true;
    const previousHp = this.puzzleQuest.challenge.playerHp;
    this.puzzleQuest = answerPuzzleQuestion(this.puzzleQuest, choice);
    if (this.puzzleQuest.challenge.playerHp < previousHp) {
      this.progress.recordDamageTaken();
      if (this.puzzleQuest.settings.playMode === 'story') {
        if (this.puzzleQuest.phase === 'lost') {
          this.restartStoryModeAfterFailure();
        } else {
          this.progress.setStoryLives(this.puzzleQuest.challenge.playerHp);
        }
      }
    }

    const correct = this.puzzleQuest.challenge.lastAnswerCorrect === true;
    this.puzzleQuestPanel.classList.remove('is-player-hit', 'is-answer-correct');
    this.puzzleQuestPanel.classList.add(correct ? 'is-answer-correct' : 'is-player-hit');
    this.renderPuzzleQuest();
    this.puzzleFeedbackTimer = window.setTimeout(() => {
      this.puzzleQuestPanel.classList.remove('is-player-hit', 'is-answer-correct');
      this.puzzleInputLocked = false;
      this.puzzleFeedbackTimer = undefined;
      this.renderPuzzleQuest();
    }, this.puzzleQuest.phase === 'puzzle' ? 720 : 430);
  }

  private selectPuzzleSlot(slot: number): void {
    const state = this.puzzleQuest;
    if (
      !state
      || state.phase !== 'puzzle'
      || this.puzzleInputLocked
      || state.pieceOrder[slot] === slot
    ) {
      return;
    }

    if (this.puzzleSelectedSlot === undefined) {
      this.puzzleSelectedSlot = slot;
      this.renderPuzzleBoard();
      return;
    }
    if (this.puzzleSelectedSlot === slot) {
      this.puzzleSelectedSlot = undefined;
      this.renderPuzzleBoard();
      return;
    }

    const firstSlot = this.puzzleSelectedSlot;
    this.puzzleSelectedSlot = undefined;
    this.movePuzzlePieces(firstSlot, slot);
  }

  private movePuzzlePieces(firstSlot: number, secondSlot: number): void {
    const state = this.puzzleQuest;
    if (!state || state.phase !== 'puzzle' || this.puzzleInputLocked) {
      return;
    }

    const next = swapPuzzlePieces(state, firstSlot, secondSlot);
    if (next === state) {
      this.renderPuzzleBoard();
      return;
    }

    if (next.phase === 'reward') {
      this.puzzleInputLocked = true;
      this.puzzleQuest = { ...next, phase: 'puzzle' };
      this.puzzleQuestPanel.classList.add('is-complete');
      this.renderPuzzleQuest();
      this.puzzleFeedbackTimer = window.setTimeout(() => {
        this.puzzleFeedbackTimer = undefined;
        this.puzzleQuestPanel.classList.remove('is-complete');
        this.puzzleQuest = next;
        this.puzzleInputLocked = false;
        this.renderPuzzleQuest();
      }, 950);
      return;
    }

    this.puzzleQuest = next;
    this.renderPuzzleQuest();
  }

  private showPuzzleReference(): void {
    if (!this.puzzleQuest || this.puzzleQuest.phase !== 'puzzle' || this.puzzleInputLocked) {
      return;
    }
    if (this.puzzlePreviewTimer) {
      window.clearTimeout(this.puzzlePreviewTimer);
    }
    this.puzzleReference.classList.remove('is-hidden');
    this.puzzlePreviewButton.disabled = true;
    this.puzzlePreviewTimer = window.setTimeout(() => {
      this.puzzleReference.classList.add('is-hidden');
      this.puzzlePreviewButton.disabled = false;
      this.puzzlePreviewTimer = undefined;
    }, 2400);
  }

  private completePuzzleQuestForDev(): void {
    if (
      !import.meta.env.DEV
      || !new Set(['localhost', '127.0.0.1', '::1']).has(window.location.hostname)
      || !this.puzzleQuest
      || this.puzzleInputLocked
    ) {
      return;
    }

    if (this.puzzleQuest.phase === 'quiz') {
      while (this.puzzleQuest.phase === 'quiz') {
        this.puzzleQuest = answerPuzzleQuestion(
          this.puzzleQuest,
          this.puzzleQuest.challenge.question.answer
        );
      }
      this.renderPuzzleQuest();
      return;
    }
    if (this.puzzleQuest.phase === 'puzzle') {
      const next = solvePuzzleForDev(this.puzzleQuest);
      this.puzzleInputLocked = true;
      this.puzzleQuest = { ...next, phase: 'puzzle' };
      this.puzzleQuestPanel.classList.add('is-complete');
      this.renderPuzzleQuest();
      this.puzzleFeedbackTimer = window.setTimeout(() => {
        this.puzzleFeedbackTimer = undefined;
        this.puzzleQuestPanel.classList.remove('is-complete');
        this.puzzleQuest = next;
        this.puzzleInputLocked = false;
        this.renderPuzzleQuest();
      }, 950);
    }
  }

  private claimPuzzleReward(): void {
    const state = this.puzzleQuest;
    if (!state || state.phase !== 'reward' || this.puzzleInputLocked) {
      return;
    }

    this.puzzleInputLocked = true;
    this.puzzlePrimaryButton.disabled = true;
    const result = this.progress.completeTallvokterQuest(PUZZLE_QUEST_ID, state.rewardValue);
    const finishPayment = (): void => {
      if (this.puzzleQuest?.phase === 'reward') {
        this.puzzleQuest = markPuzzleRewardPaid(this.puzzleQuest);
        this.puzzleInputLocked = false;
        this.renderPuzzleQuest();
      }
    };
    if (result.regnecoins > 0) {
      this.playRegnecoinRewardAnimation(result.regnecoins, this.puzzlePrimaryButton, finishPayment);
    } else {
      finishPayment();
    }
    this.renderBackpack();
  }

  private renderPuzzleBoard(): void {
    const state = this.puzzleQuest;
    if (!state || state.phase !== 'puzzle') {
      this.puzzleBoard.innerHTML = '';
      return;
    }

    const rows = PUZZLE_PIECE_COUNT / PUZZLE_COLUMNS;
    if (this.puzzleBoard.children.length !== PUZZLE_PIECE_COUNT) {
      this.puzzleBoard.innerHTML = '';
      for (let slot = 0; slot < PUZZLE_PIECE_COUNT; slot += 1) {
        const button = document.createElement('button');
        button.type = 'button';
        button.addEventListener('click', () => this.selectPuzzleSlot(slot));
        button.addEventListener('dragstart', (event) => {
          if (button.disabled) {
            event.preventDefault();
            return;
          }
          this.puzzleDraggedSlot = slot;
          button.classList.add('is-dragging');
          event.dataTransfer?.setData('text/plain', String(slot));
          if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
        });
        button.addEventListener('dragend', () => {
          this.puzzleDraggedSlot = undefined;
          button.classList.remove('is-dragging');
        });
        button.addEventListener('dragover', (event) => {
          if (!button.disabled && this.puzzleDraggedSlot !== undefined) {
            event.preventDefault();
            if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
          }
        });
        button.addEventListener('drop', (event) => {
          event.preventDefault();
          const firstSlot = this.puzzleDraggedSlot;
          this.puzzleDraggedSlot = undefined;
          if (firstSlot !== undefined) this.movePuzzlePieces(firstSlot, slot);
        });
        this.puzzleBoard.append(button);
      }
    }

    const buttons = Array.from(this.puzzleBoard.children) as HTMLButtonElement[];
    state.pieceOrder.forEach((piece, slot) => {
      const column = piece % PUZZLE_COLUMNS;
      const row = Math.floor(piece / PUZZLE_COLUMNS);
      const locked = piece === slot;
      const button = buttons[slot];
      button.className = `puzzle-piece${locked ? ' is-locked' : ''}${this.puzzleSelectedSlot === slot ? ' is-selected' : ''}`;
      button.style.backgroundImage = `url('${state.image.assetPath}')`;
      button.style.backgroundSize = `${PUZZLE_COLUMNS * 100}% ${rows * 100}%`;
      button.style.backgroundPosition = `${column * 100 / (PUZZLE_COLUMNS - 1)}% ${row * 100 / (rows - 1)}%`;
      button.disabled = this.puzzleInputLocked || locked;
      button.draggable = !button.disabled;
      button.setAttribute('aria-label', locked
        ? `Brikke ${piece + 1} ligger riktig`
        : `Flytt brikken som ligger i felt ${slot + 1}`);
    });
  }

  private renderPuzzleQuest(): void {
    const state = this.puzzleQuest;
    if (!state || this.puzzleQuestModal.classList.contains('is-hidden')) {
      return;
    }

    this.puzzleQuestPanel.dataset.phase = state.phase;
    const storyActive = state.phase === 'intro'
      || state.phase === 'reward'
      || state.phase === 'paid'
      || state.phase === 'lost';
    const quizActive = state.phase === 'quiz';
    const boardActive = state.phase === 'puzzle';
    this.puzzleQuestPanel.classList.toggle('is-board-phase', boardActive);
    this.puzzleStoryView.classList.toggle('is-hidden', !storyActive);
    this.puzzleQuizView.classList.toggle('is-hidden', !quizActive);
    this.puzzleBoardView.classList.toggle('is-hidden', !boardActive);
    this.puzzleStoryRules.classList.toggle('is-hidden', state.phase !== 'intro' && state.phase !== 'lost');
    this.puzzleStoryReward.classList.toggle('is-hidden', state.phase !== 'reward' && state.phase !== 'paid');
    this.puzzleRewardValue.textContent = String(state.rewardValue);
    this.puzzleSolvedPreview.src = state.image.assetPath;
    this.puzzleReferenceImage.src = state.image.assetPath;
    this.puzzlePrimaryButton.disabled = this.puzzleInputLocked;
    this.leavePuzzleQuestButton.textContent = state.phase === 'paid' ? 'Til kartet' : 'Avslutt';

    if (this.puzzleTestVictoryButton) {
      const showDevButton = quizActive || boardActive;
      this.puzzleTestVictoryButton.classList.toggle('is-hidden', !showDevButton);
      if (quizActive) this.puzzleDevActions.append(this.puzzleTestVictoryButton);
      if (boardActive) this.puzzleBoardDevActions.append(this.puzzleTestVictoryButton);
    }

    if (quizActive) {
      this.puzzleQuestPhase.textContent = 'Vekk mosaikkbrikkene';
      this.puzzleUnlockedCount.textContent = `${state.challenge.correct} av ${PUZZLE_PIECE_COUNT}`;
      this.puzzleHearts.innerHTML = Array.from(
        { length: state.challenge.maxPlayerHp },
        (_, index) => `<span class="heart ${index < state.challenge.playerHp ? 'is-live' : 'is-lost'}" aria-hidden="true">❤</span>`
      ).join('');
      this.puzzleUnlockedStrip.innerHTML = Array.from(
        { length: PUZZLE_PIECE_COUNT },
        (_, index) => `<span class="${index < state.challenge.correct ? 'is-awake' : ''}${index === state.challenge.correct - 1 ? ' is-latest' : ''}" aria-hidden="true"></span>`
      ).join('');
      this.puzzleQuestion.textContent = state.challenge.question.prompt;
      this.puzzleQuizMessage.textContent = state.message;
      this.puzzleChoices.innerHTML = '';
      for (const choice of state.challenge.question.choices) {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = String(choice);
        button.disabled = this.puzzleInputLocked;
        button.addEventListener('click', () => this.answerPuzzleChoice(choice));
        this.puzzleChoices.append(button);
      }
      return;
    }

    this.puzzleChoices.innerHTML = '';
    if (boardActive) {
      this.puzzleQuestPhase.textContent = 'Sett sammen mosaikken';
      this.puzzleImageTitle.textContent = state.image.title;
      this.puzzleMoveCount.textContent = `${state.moves} flytt`;
      this.puzzleBoardMessage.textContent = state.message;
      this.puzzlePreviewButton.disabled = this.puzzleInputLocked || !this.puzzleReference.classList.contains('is-hidden');
      this.renderPuzzleBoard();
      return;
    }

    this.puzzleBoard.innerHTML = '';
    this.puzzleReference.classList.add('is-hidden');
    if (state.phase === 'intro') {
      this.puzzleQuestPhase.textContent = 'Den knuste mosaikken';
      this.puzzleStoryKicker.textContent = 'En mosaikk er knust';
      this.puzzleStoryTitle.textContent = 'Vekk de tolv brikkene';
      this.puzzleStoryMessage.textContent = PUZZLE_QUEST_WELCOME;
      this.puzzlePrimaryButton.textContent = 'Start oppdraget';
      return;
    }
    if (state.phase === 'reward') {
      this.puzzleQuestPhase.textContent = 'Mosaikken er hel';
      this.puzzleStoryKicker.textContent = 'Mesterlig løst';
      this.puzzleStoryTitle.textContent = state.image.title;
      this.puzzleStoryMessage.textContent =
        `Du vekket alle brikkene og gjenreiste mosaikken. Puslespill-mesteren belønner deg med ${state.rewardValue} Regnecoins.`;
      this.puzzlePrimaryButton.textContent = 'Få utbetalt';
      return;
    }
    if (state.phase === 'paid') {
      this.puzzleQuestPhase.textContent = 'Fullført';
      this.puzzleStoryKicker.textContent = 'Oppdrag fullført';
      this.puzzleStoryTitle.textContent = 'Ruinbyen skinner igjen';
      this.puzzleStoryMessage.textContent = state.message;
      this.puzzlePrimaryButton.textContent = 'Til kartet';
      return;
    }

    this.puzzleQuestPhase.textContent = 'Forsøket er over';
    this.puzzleStoryKicker.textContent = 'Mosaikken sovnet';
    this.puzzleStoryTitle.textContent = 'Prøv på nytt';
    this.puzzleStoryMessage.textContent = state.message;
    this.puzzlePrimaryButton.textContent = state.settings.playMode === 'story'
      ? 'Tilbake til kartet'
      : 'Start på nytt';
  }

  public openRegnemonsterBinder(): void {
    this.regnemonsterBinderModal.classList.remove('is-hidden');
    this.closeRegnemonsterBinderPreview();
    this.renderRegnemonsterBinder();
  }

  private closeRegnemonsterBinder(): void {
    if (this.regnemonsterBinderModal.classList.contains('is-hidden')) {
      return;
    }
    this.closeRegnemonsterBinderPreview();
    this.regnemonsterBinderModal.classList.add('is-hidden');
    this.hooks?.resetInput();
  }

  private setRegnemonsterBinderSet(setId: RegnemonsterSetId): void {
    if (this.regnemonsterBinderSet === setId) {
      return;
    }
    this.regnemonsterBinderSet = setId;
    this.closeRegnemonsterBinderPreview();
    this.renderRegnemonsterBinder();
  }

  private renderRegnemonsterBinder(): void {
    const counts = this.progress.getRegnemonsterCardCounts();
    const pages = buildRegnemonsterBinderPages(this.regnemonsterBinderSet, counts);
    const summary = getRegnemonsterBinderSetSummary(this.regnemonsterBinderSet, counts);
    const setLabel = this.getRegnemonsterBinderSetLabel(this.regnemonsterBinderSet);
    const phoneLayout = isPhoneViewport();
    this.regnemonsterBinderPhonePage = 0;
    this.regnemonsterBinderModal.classList.toggle('is-phone-layout', phoneLayout);

    this.regnemonsterBinderSummary.textContent =
      `${summary.ownedUnique} av ${summary.totalCards} kort funnet · ${summary.totalCopies} totalt`;
    this.regnemonsterBinderTabSet1.classList.toggle(
      'is-selected',
      this.regnemonsterBinderSet === 'set1'
    );
    this.regnemonsterBinderTabSet1.setAttribute(
      'aria-pressed',
      String(this.regnemonsterBinderSet === 'set1')
    );
    this.regnemonsterBinderTabSpecial.classList.toggle(
      'is-selected',
      this.regnemonsterBinderSet === 'special'
    );
    this.regnemonsterBinderTabSpecial.setAttribute(
      'aria-pressed',
      String(this.regnemonsterBinderSet === 'special')
    );

    const pageElements = pages.map((page) => {
      const pageElement = document.createElement('article');
      pageElement.className = 'regnemonster-binder-page';
      pageElement.dataset.density = 'hard';
      pageElement.setAttribute('aria-label', `${setLabel}, side ${page.index + 1}`);

      const pageHeader = document.createElement('header');
      pageHeader.innerHTML = `<strong>${setLabel}</strong><span>${page.index + 1}</span>`;
      pageElement.appendChild(pageHeader);

      const pocketGrid = document.createElement('div');
      pocketGrid.className = 'regnemonster-binder-pocket-grid';
      page.slots.forEach((slot) => {
        const pocket = document.createElement(slot.owned ? 'button' : 'div');
        pocket.className = `regnemonster-binder-pocket${slot.owned ? ' is-owned' : ' is-missing'}`;
        if (pocket instanceof HTMLButtonElement) {
          pocket.type = 'button';
          pocket.setAttribute(
            'aria-label',
            `${setLabel}, kort ${this.getRegnemonsterBinderCardNumber(slot.card)}, ${slot.count} eksemplar`
          );
          pocket.addEventListener('click', () => this.openRegnemonsterBinderPreview(slot.card, slot.count));
        } else {
          pocket.setAttribute('aria-label', 'Kort du ikke har funnet ennå');
        }

        const image = document.createElement('img');
        image.src = slot.imageSrc;
        image.loading = 'lazy';
        image.decoding = 'async';
        image.alt = slot.owned
          ? `${setLabel}, kort ${this.getRegnemonsterBinderCardNumber(slot.card)}`
          : '';
        pocket.appendChild(image);

        if (slot.count > 1) {
          const countBadge = document.createElement('span');
          countBadge.className = 'regnemonster-binder-pocket-count';
          countBadge.textContent = `×${slot.count}`;
          pocket.appendChild(countBadge);
        }
        pocketGrid.appendChild(pocket);
      });

      for (
        let index = page.slots.length;
        index < REGNEMONSTER_BINDER_CARDS_PER_PAGE;
        index += 1
      ) {
        const emptyPocket = document.createElement('div');
        emptyPocket.className = 'regnemonster-binder-pocket is-unused';
        emptyPocket.setAttribute('aria-hidden', 'true');
        pocketGrid.appendChild(emptyPocket);
      }

      pageElement.appendChild(pocketGrid);
      const pageFooter = document.createElement('footer');
      pageFooter.textContent = `${setLabel} · ${page.index + 1}`;
      pageElement.appendChild(pageFooter);
      return pageElement;
    });

    if (!this.regnemonsterBinderPageFlip) {
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const coverRect = this.regnemonsterBinderBook.parentElement?.getBoundingClientRect();
      const coverAspect = coverRect && coverRect.height > 0
        ? coverRect.width / coverRect.height
        : 2.32;
      const landscapeSpread = !phoneLayout && coverAspect >= 1.35;
      const pageAspect = Math.min(
        1.18,
        Math.max(0.58, landscapeSpread ? coverAspect / 2 : coverAspect)
      );
      const pageHeight = 600;
      const pageWidth = Math.round(pageHeight * pageAspect);
      this.regnemonsterBinderPageFlip = new PageFlip(this.regnemonsterBinderBook, {
        width: pageWidth,
        height: pageHeight,
        size: 'stretch',
        minWidth: phoneLayout ? 150 : 290,
        maxWidth: 720,
        minHeight: phoneLayout ? 210 : 250,
        maxHeight: 760,
        drawShadow: true,
        flippingTime: reducedMotion ? 80 : 900,
        usePortrait: true,
        autoSize: true,
        maxShadowOpacity: 0.55,
        showCover: false,
        mobileScrollSupport: false,
        clickEventForward: true,
        useMouseEvents: false,
        swipeDistance: 35,
        showPageCorners: false,
        disableFlipByClick: true
      });
      this.regnemonsterBinderPageFlip.on('flip', (event) => {
        if (isPhoneViewport() && typeof event.data === 'number') {
          this.regnemonsterBinderPhonePage = event.data;
        }
        this.syncRegnemonsterBinderNavigation();
      });
      this.regnemonsterBinderPageFlip.on(
        'changeOrientation',
        () => this.syncRegnemonsterBinderNavigation()
      );
      this.regnemonsterBinderPageFlip.loadFromHTML(pageElements);
      this.regnemonsterBinderPageFlip.updateFromHtml(pageElements);
      this.regnemonsterBinderPageFlip.turnToPage(0);
    } else {
      this.regnemonsterBinderPageFlip.updateFromHtml(pageElements);
      this.regnemonsterBinderPageFlip.turnToPage(0);
    }

    window.requestAnimationFrame(() => {
      this.regnemonsterBinderPageFlip?.update();
      this.syncRegnemonsterBinderNavigation();
    });
  }

  private flipRegnemonsterBinder(direction: -1 | 1): void {
    const pageFlip = this.regnemonsterBinderPageFlip;
    if (!pageFlip) {
      return;
    }
    const phoneLayout = isPhoneViewport();
    const currentPage = phoneLayout
      ? this.regnemonsterBinderPhonePage
      : pageFlip.getCurrentPageIndex();
    const landscapeSpread = !phoneLayout && pageFlip.getOrientation() === 'landscape';
    const targetPage = getRegnemonsterBinderTargetPage(
      currentPage,
      direction,
      pageFlip.getPageCount(),
      landscapeSpread
    );
    if (targetPage !== currentPage) {
      if (phoneLayout) {
        // PageFlip kan rapportere gammel sideindeks etter en mobilanimasjon.
        // På telefon styrer derfor knappene den enkle sideindeksen direkte.
        this.regnemonsterBinderPhonePage = targetPage;
        pageFlip.turnToPage(targetPage);
        pageFlip.update();
        this.syncRegnemonsterBinderNavigation();
      } else {
        pageFlip.flip(targetPage, 'bottom');
      }
    }
  }

  private syncRegnemonsterBinderNavigation(): void {
    const pageFlip = this.regnemonsterBinderPageFlip;
    if (!pageFlip) {
      return;
    }
    const pageCount = pageFlip.getPageCount();
    const phoneLayout = isPhoneViewport();
    const currentIndex = phoneLayout
      ? Math.min(Math.max(0, this.regnemonsterBinderPhonePage), Math.max(0, pageCount - 1))
      : pageFlip.getCurrentPageIndex();
    const landscape = !phoneLayout && pageFlip.getOrientation() === 'landscape';
    const visibleEnd = landscape
      ? Math.min(pageCount, currentIndex + 2)
      : Math.min(pageCount, currentIndex + 1);
    const finalSpreadStart = landscape
      ? Math.max(0, pageCount - (pageCount % 2 === 0 ? 2 : 1))
      : Math.max(0, pageCount - 1);

    this.regnemonsterBinderPrevious.disabled = currentIndex <= 0;
    this.regnemonsterBinderNext.disabled = currentIndex >= finalSpreadStart;
    this.regnemonsterBinderPageStatus.textContent = landscape && visibleEnd > currentIndex + 1
      ? `Side ${currentIndex + 1}–${visibleEnd} av ${pageCount}`
      : `Side ${currentIndex + 1} av ${pageCount}`;
  }

  private openRegnemonsterBinderPreview(card: RegnemonsterCardDefinition, count: number): void {
    const setLabel = this.getRegnemonsterBinderSetLabel(card.setId);
    const number = this.getRegnemonsterBinderCardNumber(card);
    this.regnemonsterBinderPreviewImage.src = card.fullSrc;
    this.regnemonsterBinderPreviewImage.alt = `${setLabel}, kort ${number}`;
    this.regnemonsterBinderPreviewTitle.textContent = `${setLabel} · Kort ${number}`;
    this.regnemonsterBinderPreviewCount.textContent =
      count === 1 ? '1 eksemplar i permen' : `${count} eksemplarer i permen`;
    this.regnemonsterBinderPreview.classList.remove('is-hidden');
  }

  private closeRegnemonsterBinderPreview(): void {
    this.regnemonsterBinderPreview.classList.add('is-hidden');
    this.regnemonsterBinderPreviewImage.removeAttribute('src');
    this.regnemonsterBinderPreviewImage.alt = '';
  }

  private getRegnemonsterBinderSetLabel(setId: RegnemonsterSetId): string {
    return setId === 'set1' ? 'Sett 1' : 'Spesialsett';
  }

  private getRegnemonsterBinderCardNumber(card: RegnemonsterCardDefinition): string {
    return card.setId === 'special' ? `!${card.number}` : card.number;
  }

  public openRegnemonsterGame(): void {
    this.clearRegnemonsterFeedbackTimer();
    this.clearRegnemonsterRewardTimer();
    this.regnemonsterSetup = this.progress.getRegnemonsterSetup();
    this.regnemonsterRound = undefined;
    const pendingCardId = this.progress.getPendingRegnemonsterReward();
    this.regnemonsterRewardReveal = pendingCardId
      ? createRegnemonsterRewardReveal(pendingCardId)
      : undefined;
    this.regnemonsterGameModal.classList.remove('is-hidden');
    this.renderRegnemonsterGame();
  }

  private closeRegnemonsterGame(): void {
    if (this.regnemonsterGameModal.classList.contains('is-hidden')) {
      return;
    }
    this.clearRegnemonsterFeedbackTimer();
    this.clearRegnemonsterRewardTimer();
    this.regnemonsterGameModal.classList.add('is-hidden');
    this.regnemonsterGamePanel.classList.remove('is-answer-correct', 'is-answer-wrong');
    this.regnemonsterRewardCard.classList.remove('is-revealing', 'is-revealed');
    this.regnemonsterRound = undefined;
    this.regnemonsterRewardReveal = undefined;
    this.hooks?.resetInput();
  }

  private clearRegnemonsterFeedbackTimer(): void {
    if (!this.regnemonsterFeedbackTimer) {
      return;
    }
    window.clearTimeout(this.regnemonsterFeedbackTimer);
    this.regnemonsterFeedbackTimer = undefined;
  }

  private clearRegnemonsterRewardTimer(): void {
    if (!this.regnemonsterRewardTimer) {
      return;
    }
    window.clearTimeout(this.regnemonsterRewardTimer);
    this.regnemonsterRewardTimer = undefined;
  }

  private showRegnemonsterSetup(): void {
    this.clearRegnemonsterFeedbackTimer();
    this.clearRegnemonsterRewardTimer();
    this.regnemonsterRound = undefined;
    this.regnemonsterRewardReveal = undefined;
    this.renderRegnemonsterGame();
  }

  private startRegnemonsterRound(): void {
    if (!this.regnemonsterSetup) {
      return;
    }
    const pendingCardId = this.progress.getPendingRegnemonsterReward();
    if (pendingCardId) {
      this.regnemonsterRound = undefined;
      this.regnemonsterRewardReveal = createRegnemonsterRewardReveal(pendingCardId);
      this.renderRegnemonsterGame();
      return;
    }
    this.clearRegnemonsterFeedbackTimer();
    this.clearRegnemonsterRewardTimer();
    this.progress.setRegnemonsterSetup(
      this.regnemonsterSetup.operationMode,
      this.regnemonsterSetup.difficulty
    );
    this.regnemonsterRewardReveal = undefined;
    this.regnemonsterRound = createRegnemonsterRound(this.regnemonsterSetup);
    this.renderRegnemonsterGame();
  }

  private answerRegnemonsterChoice(choice: number): void {
    if (!this.regnemonsterRound || this.regnemonsterRound.phase !== 'question') {
      return;
    }
    this.regnemonsterRound = answerRegnemonsterRound(this.regnemonsterRound, choice);
    this.renderRegnemonsterGame();
    const feedbackDuration = getRegnemonsterFeedbackDuration(
      this.regnemonsterRound.lastAnswerCorrect === true
    );
    this.regnemonsterFeedbackTimer = window.setTimeout(() => {
      this.regnemonsterFeedbackTimer = undefined;
      if (!this.regnemonsterRound || this.regnemonsterRound.phase !== 'feedback') {
        return;
      }
      this.regnemonsterRound = advanceRegnemonsterRound(this.regnemonsterRound);
      if (this.regnemonsterRound.phase === 'complete') {
        const cardId = this.progress.prepareRegnemonsterReward();
        this.regnemonsterRewardReveal = createRegnemonsterRewardReveal(cardId);
      }
      this.renderRegnemonsterGame();
    }, feedbackDuration);
  }

  private revealRegnemonsterReward(): void {
    const reward = this.regnemonsterRewardReveal;
    if (!reward || reward.phase !== 'sealed') {
      return;
    }
    this.regnemonsterRewardReveal = beginRegnemonsterRewardReveal(reward);
    this.renderRegnemonsterGame();
    const revealDuration = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 20
      : 3200;
    this.regnemonsterRewardTimer = window.setTimeout(() => {
      this.regnemonsterRewardTimer = undefined;
      if (!this.regnemonsterRewardReveal) {
        return;
      }
      const completed = completeRegnemonsterRewardReveal(this.regnemonsterRewardReveal);
      if (completed.phase !== 'revealed') {
        return;
      }
      this.regnemonsterRewardReveal = completed;
      this.progress.claimPendingRegnemonsterReward();
      this.renderRegnemonsterGame();
    }, revealDuration);
  }

  private renderRegnemonsterGame(): void {
    if (this.regnemonsterGameModal.classList.contains('is-hidden')) {
      return;
    }
    const round = this.regnemonsterRound;
    const reward = this.regnemonsterRewardReveal;
    const setupActive = !round && !reward;
    const complete = Boolean(reward);
    this.regnemonsterGamePanel.dataset.phase = setupActive
      ? 'setup'
      : complete
        ? 'reward'
        : 'round';
    this.regnemonsterSetupView.classList.toggle('is-hidden', !setupActive);
    this.regnemonsterRoundView.classList.toggle('is-hidden', setupActive || complete);
    this.regnemonsterCompleteView.classList.toggle('is-hidden', !complete);
    this.regnemonsterGamePanel.classList.toggle(
      'is-answer-correct',
      round?.phase === 'feedback' && round.lastAnswerCorrect === true
    );
    this.regnemonsterGamePanel.classList.toggle(
      'is-answer-wrong',
      round?.phase === 'feedback' && round.lastAnswerCorrect === false
    );
    this.regnemonsterGamePanel.classList.toggle('is-round-failed', round?.phase === 'failed');

    if (setupActive) {
      this.renderRegnemonsterSetup();
      return;
    }
    if (complete) {
      this.renderRegnemonsterReward(reward);
      return;
    }
    if (!round) {
      return;
    }

    const question = getCurrentRegnemonsterQuestion(round);
    const failed = round.phase === 'failed';
    this.regnemonsterQuestionProgress.textContent = failed
      ? 'Runden er over'
      : `Forsøk ${round.answeredCount + 1}`;
    this.regnemonsterLives.textContent = Array.from(
      { length: REGNEMONSTER_ROUND_LIFE_COUNT },
      (_, index) => index < round.livesRemaining ? '♥' : '♡'
    ).join(' ');
    this.regnemonsterLives.setAttribute(
      'aria-label',
      `${round.livesRemaining} av ${REGNEMONSTER_ROUND_LIFE_COUNT} liv igjen`
    );
    this.regnemonsterScore.textContent =
      `${round.correctCount} av ${REGNEMONSTER_ROUND_QUESTION_COUNT} riktige`;
    this.regnemonsterProgressFill.style.width =
      `${round.correctCount / REGNEMONSTER_ROUND_QUESTION_COUNT * 100}%`;
    this.regnemonsterQuestion.textContent = `${question.prompt} = ?`;
    this.regnemonsterFeedback.textContent = failed
      ? 'Du har brukt opp de tre livene. Antall riktige er nullstilt.'
      : round.phase === 'feedback'
      ? round.lastAnswerCorrect
        ? '✓ Riktig! Bra jobbet!'
        : `✕ Ikke helt – riktig svar er ${question.answer}. ${round.livesRemaining} liv igjen.`
      : 'Velg riktig svar.';
    this.regnemonsterChoices.replaceChildren(...question.choices.map((choice) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = String(choice);
      button.disabled = round.phase !== 'question';
      if (round.phase === 'feedback' && choice === question.answer) {
        button.classList.add('is-correct');
      } else if (
        round.phase === 'feedback'
        && choice === round.selectedAnswer
        && !round.lastAnswerCorrect
      ) {
        button.classList.add('is-wrong');
      }
      button.addEventListener('click', (event) => {
        (event.currentTarget as HTMLButtonElement).blur();
        this.answerRegnemonsterChoice(choice);
      });
      return button;
    }));
    requireElement<HTMLButtonElement>('retry-regnemonster-round')
      .classList.toggle('is-hidden', !failed);
  }

  private renderRegnemonsterReward(
    reward: RegnemonsterRewardRevealState | undefined
  ): void {
    if (!reward) {
      return;
    }
    const card = getRegnemonsterCardById(reward.cardId);
    if (!card) {
      return;
    }
    const score = this.regnemonsterRound?.correctCount;
    this.regnemonsterCompleteTitle.textContent = 'Du har vunnet et kort!';
    this.regnemonsterCompleteScore.textContent = score === undefined
      ? 'Kortbelønningen din venter'
      : `${score} av ${REGNEMONSTER_ROUND_QUESTION_COUNT} riktige`;
    this.regnemonsterRewardBack.src = card.backFullSrc;
    this.regnemonsterRewardFront.src = card.fullSrc;
    this.regnemonsterRewardCard.style.setProperty(
      '--regnemonster-card-aspect',
      String(getRegnemonsterRewardFrameAspectRatio(270, 360))
    );
    this.regnemonsterRewardCard.style.setProperty(
      '--regnemonster-card-back',
      `url("${card.backFullSrc}")`
    );
    this.regnemonsterRewardFront.alt = reward.phase === 'revealed'
      ? this.getRegnemonsterRewardLabel(card)
      : '';
    this.regnemonsterRewardCard.disabled = reward.phase !== 'sealed';
    this.regnemonsterRewardCard.classList.toggle('is-revealing', reward.phase === 'revealing');
    this.regnemonsterRewardCard.classList.toggle('is-revealed', reward.phase === 'revealed');
    this.regnemonsterRewardPrompt.classList.toggle('is-hidden', reward.phase === 'revealed');
    this.regnemonsterRewardPrompt.textContent = reward.phase === 'revealing'
      ? 'Kortet avsløres ...'
      : 'Trykk på kortet for å avsløre det';
    this.regnemonsterRewardResult.classList.toggle('is-hidden', reward.phase !== 'revealed');
    this.regnemonsterRewardResult.textContent = reward.phase === 'revealed'
      ? `${this.getRegnemonsterRewardLabel(card)} er lagt i samlepermen!`
      : '';
    this.regnemonsterCompleteActions.classList.toggle('is-hidden', reward.phase !== 'revealed');
  }

  private getRegnemonsterRewardLabel(card: RegnemonsterCardDefinition): string {
    return card.setId === 'special'
      ? `Spesialsett · Kort !${card.number}`
      : `Sett 1 · Kort ${card.number}`;
  }

  private renderRegnemonsterSetup(): void {
    const setup = this.regnemonsterSetup;
    if (!setup) {
      return;
    }
    this.regnemonsterOperationPicker.replaceChildren(...OPERATION_OPTIONS.map((option) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.classList.toggle('is-selected', setup.operationMode === option.id);
      const symbol = document.createElement('strong');
      symbol.textContent = option.shortLabel || '±×÷';
      const label = document.createElement('span');
      label.textContent = option.label;
      button.append(symbol, label);
      button.addEventListener('click', () => {
        this.regnemonsterSetup = {
          ...setup,
          operationMode: option.id
        };
        this.renderRegnemonsterSetup();
      });
      return button;
    }));

    const difficultyHints: Record<RegnemonsterRoundSetup['difficulty'], string> = {
      easy: 'Lett',
      normal: 'Middels',
      hard: 'Vanskelig'
    };
    this.regnemonsterDifficultyPicker.replaceChildren(
      ...DIFFICULTY_OPTIONS
        .filter((option): option is typeof option & {
          id: RegnemonsterRoundSetup['difficulty'];
        } => option.id !== 'easy-add-subtract')
        .map((option) => {
          const button = document.createElement('button');
          button.type = 'button';
          button.classList.toggle('is-selected', setup.difficulty === option.id);
          const label = document.createElement('strong');
          label.textContent = difficultyHints[option.id];
          const hint = document.createElement('span');
          hint.textContent = option.id === 'easy'
            ? 'Til 20 · 0–5-gangen'
            : option.id === 'normal'
              ? 'Til 100 · 0–10-gangen'
              : 'Til 1000 · 0–20-gangen';
          button.append(label, hint);
          button.addEventListener('click', () => {
            this.regnemonsterSetup = {
              ...setup,
              difficulty: option.id
            };
            this.renderRegnemonsterSetup();
          });
          return button;
        })
    );
  }

  public openMiningExpedition(): void {
    this.miningExpedition = createMiningExpedition(this.progress.getSettings());
    this.miningInputLocked = false;
    this.miningPanel.classList.remove('is-answer-correct', 'is-answer-wrong');
    this.miningModal.classList.remove('is-hidden');
    this.renderMiningExpedition();
  }

  private closeMiningExpedition(): void {
    if (this.miningDrillTimer) {
      window.clearTimeout(this.miningDrillTimer);
      this.miningDrillTimer = undefined;
    }
    this.miningModal.classList.remove('is-drilling-active');
    navigator.vibrate?.(0);
    if (this.miningFeedbackTimer) {
      window.clearTimeout(this.miningFeedbackTimer);
      this.miningFeedbackTimer = undefined;
    }
    this.miningModal.classList.add('is-hidden');
    this.miningExpedition = undefined;
    this.miningInputLocked = false;
    this.miningGrid.innerHTML = '';
    this.hooks?.resetInput();
  }

  private answerMiningChoice(choice: number): void {
    if (!this.miningExpedition || this.miningExpedition.phase !== 'quiz' || this.miningInputLocked) {
      return;
    }

    this.miningInputLocked = true;
    const wasCorrect = choice === this.miningExpedition.question.answer;
    this.miningExpedition = answerMiningQuestion(this.miningExpedition, choice);
    if (!wasCorrect) {
      this.progress.recordDamageTaken();
      if (this.miningExpedition.settings.playMode === 'story') {
        const remainingLives = this.progress.getStoryLives() - 1;
        if (remainingLives <= 0) {
          this.restartStoryModeAfterFailure();
          this.closeMiningExpedition();
          this.openMiningExpeditionFailure(() => this.completeStoryModeRestartAfterReturn());
          return;
        }
        this.progress.setStoryLives(remainingLives);
      }
    }
    this.miningPanel.classList.remove('is-answer-correct', 'is-answer-wrong');
    this.miningPanel.classList.add(
      this.miningExpedition.lastAnswerCorrect ? 'is-answer-correct' : 'is-answer-wrong'
    );
    this.renderMiningExpedition();
    this.miningFeedbackTimer = window.setTimeout(() => {
      this.miningPanel.classList.remove('is-answer-correct', 'is-answer-wrong');
      this.miningInputLocked = false;
      this.miningFeedbackTimer = undefined;
      this.renderMiningExpedition();
    }, 420);
  }

  private completeMiningQuizForDev(): void {
    if (
      !import.meta.env.DEV
      || !new Set(['localhost', '127.0.0.1', '::1']).has(window.location.hostname)
      || !this.miningExpedition
      || this.miningExpedition.phase !== 'quiz'
      || this.miningInputLocked
    ) {
      return;
    }

    while (this.miningExpedition.phase === 'quiz') {
      this.miningExpedition = answerMiningQuestion(
        this.miningExpedition,
        this.miningExpedition.question.answer
      );
    }
    this.renderMiningExpedition();
  }

  private drillMiningCell(cellId: number, button: HTMLButtonElement): void {
    if (
      !this.miningExpedition
      || this.miningExpedition.phase !== 'dig'
      || this.miningInputLocked
      || this.miningExpedition.revealedCells.has(cellId)
    ) {
      return;
    }

    const drillDurationMs = 860;
    this.miningInputLocked = true;
    this.miningModal.classList.add('is-drilling-active');
    this.playMiningDrillHaptics();
    button.classList.add('is-drilling');
    button.innerHTML = `
      <span class="mining-drill-tool" aria-hidden="true"></span>
      <span class="mining-drill-impact" aria-hidden="true"></span>
      <span class="mining-drill-dust" aria-hidden="true"></span>
    `;
    this.miningGrid.querySelectorAll<HTMLButtonElement>('button').forEach((cellButton) => {
      cellButton.disabled = true;
    });
    this.miningDigMessage.textContent = 'Borrer gjennom jord og stein ...';
    this.miningDrillTimer = window.setTimeout(() => {
      if (this.miningExpedition) {
        this.miningExpedition = revealMiningCell(this.miningExpedition, cellId);
      }
      this.miningModal.classList.remove('is-drilling-active');
      navigator.vibrate?.(0);
      this.miningInputLocked = false;
      this.miningDrillTimer = undefined;
      this.renderMiningExpedition();
    }, drillDurationMs);
  }

  private playMiningDrillHaptics(): void {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reducedMotion) {
      navigator.vibrate?.([58, 16, 70, 14, 82, 12, 96, 10, 112]);
    }
  }

  private claimMiningReward(): void {
    if (!this.miningExpedition || this.miningExpedition.phase !== 'reward') {
      return;
    }

    const value = this.miningExpedition.rewardValue;
    this.claimMiningRewardButton.disabled = true;
    this.progress.completeTallvokterQuest(MINING_QUEST_ID, value);
    if (value > 0) {
      this.playRegnecoinRewardAnimation(value, this.claimMiningRewardButton);
    }
    this.miningExpedition = markMiningRewardPaid(this.miningExpedition);
    this.renderMiningExpedition();
    this.renderBackpack();
  }

  private renderMiningExpedition(): void {
    const state = this.miningExpedition;
    if (!state || this.miningModal.classList.contains('is-hidden')) {
      return;
    }

    this.miningPanel.dataset.phase = state.phase;
    const quizActive = state.phase === 'quiz';
    const digActive = state.phase === 'dig';
    const rewardActive = state.phase === 'reward' || state.phase === 'paid';
    this.miningPanel.classList.toggle('is-quiz-phase', quizActive);
    this.miningPanel.classList.toggle('is-dig-phase', digActive);
    this.miningPanel.classList.toggle('is-reward-phase', rewardActive);
    this.leaveMiningButton.classList.remove('is-hidden');
    this.leaveMiningButton.textContent = state.phase === 'paid' ? 'Til kartet' : 'Avslutt';
    this.miningQuizView.classList.toggle('is-hidden', !quizActive);
    this.miningDigView.classList.toggle('is-hidden', !digActive);
    this.miningRewardView.classList.toggle('is-hidden', !rewardActive);
    this.miningPhaseLabel.textContent = quizActive
      ? 'Matteoppgaver'
      : digActive
        ? 'Borefasen'
        : 'Oppgjør';

    if (quizActive) {
      this.miningQuestionProgress.textContent = `${Math.min(
        MINING_QUESTION_COUNT,
        state.questionsAnswered + 1
      )} av ${MINING_QUESTION_COUNT}`;
      this.miningDrillCount.textContent = String(state.correctAnswers);
      this.miningQuestionText.textContent = state.question.prompt;
      this.miningMessage.textContent = state.message;
      this.miningChoiceGrid.innerHTML = '';
      for (const choice of state.question.choices) {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = String(choice);
        button.disabled = this.miningInputLocked;
        button.addEventListener('click', () => this.answerMiningChoice(choice));
        this.miningChoiceGrid.append(button);
      }
      return;
    }

    if (digActive) {
      this.miningDrillsRemaining.textContent = String(state.drillsRemaining);
      this.miningCurrentValue.textContent = `${state.rewardValue} Regnecoins`;
      this.miningDigMessage.textContent = state.message;
      this.miningGrid.innerHTML = '';
      for (const cell of state.board) {
        const revealed = state.revealedCells.has(cell.id);
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `mining-cell ${revealed ? 'is-revealed' : 'is-covered'}`;
        button.setAttribute('role', 'gridcell');
        button.disabled = revealed || this.miningInputLocked;
        if (revealed && cell.content !== 'empty') {
          const resource = getMiningResource(cell.content);
          button.style.setProperty('--resource-accent', resource.accent);
          button.innerHTML = `<img src="${resource.assetPath}" alt="" />`;
          button.setAttribute('aria-label', `Rute ${cell.id + 1}: ${resource.displayName}`);
        } else if (revealed) {
          button.innerHTML = '<span class="mining-empty">Tom</span>';
          button.setAttribute('aria-label', `Rute ${cell.id + 1}: tom`);
        } else {
          // Alle jordrutene er identiske. Det skal ikke finnes visuelle hint om innholdet.
          button.setAttribute('aria-label', `Rute ${cell.id + 1}, dekket av jord`);
          button.addEventListener('click', () => this.drillMiningCell(cell.id, button));
        }
        this.miningGrid.append(button);
      }
      this.miningHaul.innerHTML = MINING_RESOURCES.map((resource) => `
        <div class="mining-haul-item ${state.inventory[resource.id] === 0 ? 'is-empty' : ''}">
          <img src="${resource.assetPath}" alt="" />
          <span>${resource.displayName}</span>
          <strong>${state.inventory[resource.id]}</strong>
        </div>
      `).join('');
      return;
    }

    this.miningRewardSummary.innerHTML = MINING_RESOURCES.map((resource) => `
      <div class="mining-reward-item ${state.inventory[resource.id] === 0 ? 'is-empty' : ''}" aria-label="${resource.displayName}: ${state.inventory[resource.id]}">
        <img src="${resource.assetPath}" alt="" />
        <strong>${state.inventory[resource.id]}</strong>
      </div>
    `).join('');
    this.miningRewardValue.textContent = String(state.rewardValue);
    this.miningRewardMessage.textContent = state.phase === 'paid'
      ? state.message
      : state.rewardValue > 0
        ? 'Gruvesjefen er klar til å betale for funnene dine.'
        : 'Det ble ingen verdifulle funn denne gangen.';
    this.claimMiningRewardButton.classList.toggle('is-hidden', state.phase === 'paid');
    this.claimMiningRewardButton.disabled = state.phase === 'paid';
    this.claimMiningRewardButton.textContent = state.rewardValue > 0
      ? `Få utbetalt ${state.rewardValue} Regnecoins`
      : 'Avslutt ekspedisjonen';
  }

  public openFishingSale(): void {
    this.fishingSaleInProgress = false;
    this.fishingSaleConfirmation = '';
    this.fishingSaleModal.classList.remove('is-hidden');
    this.renderFishingSale();
  }

  private closeFishingSale(): void {
    this.fishingSaleModal.classList.add('is-hidden');
    this.fishingSaleInProgress = false;
    this.fishingSaleConfirmation = '';
  }

  private sellAllFish(): void {
    if (this.fishingSaleInProgress) {
      return;
    }

    const inventory = this.progress.getFishInventory();
    if (getFishInventoryCount(inventory) <= 0) {
      this.fishingSaleConfirmation = 'Du har ingen fisk å selge.';
      this.renderFishingSale();
      return;
    }

    this.fishingSaleInProgress = true;
    this.sellAllFishButton.disabled = true;
    const result = this.progress.sellAllFish();
    this.fishingSaleInProgress = false;
    this.fishingSaleConfirmation = result.soldFish > 0
      ? `Solgt ${result.soldFish} fisk for ${result.saleValue} Regnecoins!`
      : 'Du har ingen fisk å selge.';
    if (result.saleValue > 0) {
      this.playRegnecoinRewardAnimation(result.saleValue, this.sellAllFishButton);
    }
    this.renderFishingSale();
    this.renderBackpack();
  }

  public playRegnecoinRewardAnimation(
    amount: number,
    sourceElement: HTMLElement = this.sellAllFishButton,
    onComplete?: () => void
  ): void {
    const targetElement = this.backpackButton.querySelector<HTMLElement>('.backpack-icon')
      ?? this.backpackButton;
    this.playRegnecoinTransferAnimation(amount, sourceElement, targetElement, false, onComplete);
  }

  public playRegnecoinWorldRewardAnimation(
    amount: number,
    screenX: number,
    screenY: number,
    onComplete?: () => void
  ): void {
    const source = document.createElement('span');
    source.className = 'regnecoin-world-source';
    source.style.position = 'fixed';
    source.style.left = `${Math.round(screenX - 24)}px`;
    source.style.top = `${Math.round(screenY - 24)}px`;
    source.style.width = '48px';
    source.style.height = '48px';
    source.style.pointerEvents = 'none';
    source.style.opacity = '0';
    getHudOverlayRoot().append(source);
    this.playRegnecoinRewardAnimation(amount, source, () => {
      source.remove();
      onComplete?.();
    });
  }

  public playRegnecoinLossAnimation(
    amount: number,
    onComplete?: () => void,
    targetElement: HTMLElement = this.questRuneImage
  ): void {
    const sourceElement = this.backpackButton.querySelector<HTMLElement>('.backpack-icon')
      ?? this.backpackButton;
    this.playRegnecoinTransferAnimation(amount, sourceElement, targetElement, true, onComplete);
  }

  private playRegnecoinTransferAnimation(
    amount: number,
    sourceElement: HTMLElement,
    targetElement: HTMLElement,
    isLoss: boolean,
    onComplete?: () => void
  ): void {
    if (amount <= 0) {
      onComplete?.();
      return;
    }

    const sourceRect = sourceElement.getBoundingClientRect();
    const targetRect = targetElement.getBoundingClientRect();
    const backpackRect = this.backpackButton.getBoundingClientRect();
    const hasScreenPosition = (rect: DOMRect): boolean => (
      rect.width > 1
      && rect.height > 1
      && Number.isFinite(rect.left)
      && Number.isFinite(rect.top)
    );
    const backpackFallback = hasScreenPosition(backpackRect)
      ? backpackRect
      : {
          left: Math.max(16, window.innerWidth - 94),
          top: 16,
          width: 70,
          height: 54
        };
    const source = hasScreenPosition(sourceRect)
      ? sourceRect
      : isLoss
        ? backpackFallback
        : {
            left: window.innerWidth / 2 - 70,
            top: window.innerHeight / 2,
            width: 140,
            height: 54
          };
    const target = hasScreenPosition(targetRect)
      ? targetRect
      : isLoss
        ? {
            left: window.innerWidth / 2 - 35,
            top: window.innerHeight / 2 - 27,
            width: 70,
            height: 54
          }
        : backpackFallback;
    const layer = document.createElement('div');
    layer.className = 'regnecoin-animation-layer';
    getHudOverlayRoot().append(layer);

    const fromX = source.left + source.width / 2 - 16;
    const fromY = source.top + source.height / 2 - 16;
    const toX = target.left + target.width / 2 - 16;
    const toY = target.top + target.height / 2 - 16;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coinCount = reducedMotion ? 1 : Math.min(12, Math.max(7, Math.ceil(Math.sqrt(amount))));

    for (let index = 0; index < coinCount; index += 1) {
      const coin = document.createElement('span');
      coin.className = 'regnecoin-flight';
      coin.textContent = 'R';
      layer.append(coin);
      const side = index % 2 === 0 ? -1 : 1;
      const jitterX = side * (10 + (index % 4) * 8);
      const jitterY = (index % 3) * 5;
      const middleX = (fromX + toX) / 2 + side * (34 + (index % 3) * 12);
      const middleY = Math.min(fromY, toY) - (reducedMotion ? 12 : 70 + (index % 4) * 14);
      const animation = coin.animate([
        {
          opacity: 0,
          transform: `translate3d(${fromX + jitterX}px, ${fromY + jitterY}px, 0) scale(0.58) rotate(0deg)`
        },
        {
          opacity: 1,
          offset: 0.14,
          transform: `translate3d(${fromX + jitterX}px, ${fromY + jitterY - 12}px, 0) scale(1.08) rotate(80deg)`
        },
        {
          opacity: 1,
          offset: 0.58,
          transform: `translate3d(${middleX}px, ${middleY}px, 0) scale(1) rotate(${side * 250}deg)`
        },
        {
          opacity: 0.08,
          transform: `translate3d(${toX}px, ${toY}px, 0) scale(0.48) rotate(${side * 520}deg)`
        }
      ], {
        duration: reducedMotion ? 360 : 760 + index * 38,
        delay: reducedMotion ? 0 : index * 58,
        easing: 'cubic-bezier(0.22, 0.72, 0.22, 1)',
        fill: 'forwards'
      });
      void animation.finished.catch(() => undefined).finally(() => coin.remove());
    }

    const gain = document.createElement('strong');
    gain.className = `regnecoin-gain${isLoss ? ' is-loss' : ''}`;
    gain.textContent = `${isLoss ? '−' : '+'}${amount}`;
    layer.append(gain);
    const gainAnimation = gain.animate([
      {
        opacity: 0,
        transform: `translate3d(${toX - 5}px, ${toY + 16}px, 0) scale(0.7)`
      },
      {
        opacity: 1,
        offset: 0.3,
        transform: `translate3d(${toX - 5}px, ${toY - 6}px, 0) scale(1.12)`
      },
      {
        opacity: 0,
        transform: `translate3d(${toX - 5}px, ${toY - 48}px, 0) scale(1)`
      }
    ], {
      duration: reducedMotion ? 500 : 1050,
      delay: reducedMotion ? 0 : 520,
      easing: 'cubic-bezier(0.2, 0.75, 0.25, 1)',
      fill: 'forwards'
    });
    void gainAnimation.finished.catch(() => undefined).finally(() => gain.remove());

    const backpackEffectClass = isLoss ? 'is-coin-loss' : 'is-coin-reward';
    this.backpackButton.classList.add(backpackEffectClass);
    window.setTimeout(() => {
      this.backpackButton.classList.remove(backpackEffectClass);
      layer.remove();
      onComplete?.();
    }, reducedMotion ? 650 : 1700);
  }

  private renderBackpack(): void {
    if (this.backpackModal.classList.contains('is-hidden')) {
      return;
    }

    const inventory = this.progress.getFishInventory();
    this.backpackRegnecoinCount.textContent = String(this.progress.getRegnecoins());
    this.backpackFishList.innerHTML = FISH_TYPES.map((fish) => {
      const count = inventory[fish.id];
      return `
        <div class="fish-inventory-row ${count === 0 ? 'is-empty' : ''}">
          <img src="${fish.assetPath}" alt="" />
          <div>
            <strong>${fish.displayName}</strong>
          </div>
          <em aria-label="${count} fisk">${count}</em>
        </div>
      `;
    }).join('');
  }

  private renderFishingSale(): void {
    if (this.fishingSaleModal.classList.contains('is-hidden')) {
      return;
    }

    const inventory = this.progress.getFishInventory();
    const fishCount = getFishInventoryCount(inventory);
    const fishValue = getFishInventoryValue(inventory);
    const caughtFish = FISH_TYPES.filter((fish) => inventory[fish.id] > 0);
    this.fishingSaleList.innerHTML = caughtFish.length > 0
      ? caughtFish.map((fish) => {
        const count = inventory[fish.id];
        return `
          <div class="fish-inventory-row">
            <img src="${fish.assetPath}" alt="" />
            <div>
              <strong>${fish.displayName}</strong>
              <span>${count} × ${fish.value} Regnecoin${fish.value === 1 ? '' : 's'}</span>
            </div>
            <em>${count * fish.value}</em>
          </div>
        `;
      }).join('')
      : '<div class="fish-inventory-empty">Fiskebøtten er tom.</div>';
    this.fishingSaleTotal.textContent = `${fishValue} Regnecoins`;
    this.fishingSaleMessage.textContent = this.fishingSaleConfirmation
      || (fishCount === 0
        ? 'Du har ingen fisk å selge.'
        : 'Fangsten tømmes først når salget er gjennomført.');
    this.sellAllFishButton.disabled = this.fishingSaleInProgress || fishCount === 0;
    this.sellAllFishButton.textContent = this.fishingSaleInProgress ? 'Selger ...' : 'Selg all fisk';
  }

  private openPrizeBox(): void {
    this.prizeBoxModal.classList.remove('is-hidden');
    this.renderPrizeBox();
  }

  private openMedalCabinet(): void {
    this.collectionSection = 'medals';
    this.closeCollectionCardPreview();
    this.medalCabinetModal.classList.remove('is-hidden');
    this.renderMedalCabinet();
  }

  private setCollectionSection(section: CollectionSection): void {
    this.closeCollectionCardPreview();
    this.collectionSection = section;
    this.renderMedalCabinet();
  }

  private openStoryConfirm(): void {
    this.closeTokenPreview();
    this.closeTokenPicker();
    const isTallvokter = this.progress.getSettings().mapId === TALLVOKTER_MAP_ID;
    this.storyTitle.textContent = isTallvokter
      ? 'Start Story mode i Tallvokterens verden?'
      : 'Start Story mode?';
    this.storyCopy.textContent = isTallvokter
      ? 'Du har maksimalt 3 liv for hele Tallvokterens verden. Livene fylles ikke opp mellom oppdragene, alle matematikkoppgaver er på middels nivå, og mister du det tredje livet må hele kartet startes på nytt.'
      : 'Du starter med 3 liv for hele reisen. Alle oppgaver er på middels nivå. Mister du alle, starter storymoden helt på nytt.';
    this.storyConfirm.classList.remove('is-hidden');
  }

  private closeStoryConfirm(): void {
    this.storyConfirm.classList.add('is-hidden');
  }

  private openMapSettings(mapId: GameMapId): void {
    if (mapId === TALLVOKTER_MAP_ID && isPhoneViewport()) {
      this.showToast('Tallvokterens verden er ikke tilgjengelig på mobiltelefon.');
      return;
    }
    if (mapId === REGNEMONSTER_MAP_ID) {
      this.progress.updateSettings({ mapId });
      this.hooks?.resetPlayerToProgress();
      this.closeMapSettings();
      return;
    }

    const settings = this.progress.getSettings();
    const map = getGameMap(mapId);
    this.pendingMapSettings = {
      mapId,
      operationMode: settings.operationMode,
      difficulty: map.showBossJourney && settings.difficulty === 'easy-add-subtract'
        ? 'easy'
        : settings.difficulty
    };
    this.renderMapSettingsControls();
    this.mapSettingsModal.classList.remove('is-hidden');
  }

  private closeMapSettings(): void {
    this.mapSettingsModal.classList.add('is-hidden');
    this.pendingMapSettings = undefined;
  }

  private confirmMapSettings(): void {
    if (!this.pendingMapSettings) {
      this.closeMapSettings();
      return;
    }

    const map = getGameMap(this.pendingMapSettings.mapId);
    this.progress.updateSettings({
      mapId: this.pendingMapSettings.mapId,
      operationMode: map.id === REGNERIKET_MAP_ID || map.id === TALLVOKTER_MAP_ID
        ? 'mixed'
        : this.pendingMapSettings.operationMode,
      difficulty: this.pendingMapSettings.difficulty
    });
    this.hooks?.resetPlayerToProgress();
    this.closeMapSettings();
  }

  private renderMapSettingsControls(): void {
    if (!this.pendingMapSettings) {
      return;
    }

    const map = getGameMap(this.pendingMapSettings.mapId);
    const isTallvokter = map.id === TALLVOKTER_MAP_ID;
    this.mapSettingsTitle.textContent = map.label;
    this.mapSettingsCopy.textContent = isTallvokter
      ? 'Velg vanskelighetsgrad for Tallvokterens verden. Den styrer både hjerter og oppgavenivå i matematikkoppdrag.'
      : map.showBossJourney
        ? 'Velg regneart og vanskelighetsgrad for denne Boss-reisen.'
        : 'Velg vanskelighetsgrad for Regneriket. Den styrer både hjerter og oppgavenivå.';
    this.mapSettingsOperationBlock.classList.toggle('is-hidden', !map.showBossJourney);
    this.mapSettingsDifficultyBlock.classList.remove('is-hidden');
    const difficultyOptions = map.showBossJourney
      ? DIFFICULTY_OPTIONS.filter((option) => option.id !== 'easy-add-subtract')
      : DIFFICULTY_OPTIONS;
    this.operationPicker.innerHTML = OPERATION_OPTIONS.map((option) => `
      <button class="${this.pendingMapSettings!.operationMode === option.id ? 'is-selected' : ''} ${option.shortLabel ? '' : 'is-symbol-free'}" type="button" data-operation-id="${option.id}">
        ${option.shortLabel ? `<strong>${option.shortLabel}</strong>` : ''}
        <span>${option.label}</span>
      </button>
    `).join('');
    this.difficultyPicker.innerHTML = difficultyOptions.map((option) => `
      <button class="${this.pendingMapSettings!.difficulty === option.id ? 'is-selected' : ''}" type="button" data-difficulty-id="${option.id}">
        ${option.label}
      </button>
    `).join('');

    this.operationPicker.querySelectorAll<HTMLButtonElement>('[data-operation-id]').forEach((button) => {
      button.addEventListener('click', () => {
        if (!this.pendingMapSettings) {
          return;
        }
        this.pendingMapSettings = {
          ...this.pendingMapSettings,
          operationMode: button.dataset.operationId! as OperationMode
        };
        this.renderMapSettingsControls();
      });
    });
    this.difficultyPicker.querySelectorAll<HTMLButtonElement>('[data-difficulty-id]').forEach((button) => {
      button.addEventListener('click', () => {
        if (!this.pendingMapSettings) {
          return;
        }
        this.pendingMapSettings = {
          ...this.pendingMapSettings,
          difficulty: button.dataset.difficultyId! as Difficulty
        };
        this.renderMapSettingsControls();
      });
    });
  }

  private startStoryMode(): void {
    this.progress.startStoryMode();
    this.hooks?.resetPlayerToProgress();
    this.closeStoryConfirm();
    this.closeTokenPreview();
    this.closeTokenPicker();
    this.closeMapSettings();
    this.closeStartScreen();
  }

  private closeUnlockConfirm(force = false): void {
    if (!force && !this.unlockConfirmDismissible) {
      return;
    }
    this.unlockConfirm.classList.add('is-hidden');
    this.unlockConfirmCallback = undefined;
    this.unlockConfirmDismissible = true;
    this.cancelUnlock.classList.remove('is-hidden');
    this.cancelUnlock.textContent = 'Avbryt';
    this.confirmUnlockButton.textContent = 'Bruk mynt';
  }

  private closePrizeBox(): void {
    this.prizeBoxModal.classList.add('is-hidden');
    this.prizeBoxList.innerHTML = '';
  }

  private closeMedalCabinet(): void {
    this.closeCollectionCardPreview();
    this.medalCabinetModal.classList.add('is-hidden');
    this.collectionSection = 'medals';
    this.medalCabinetList.innerHTML = '';
    this.cardCollectionList.innerHTML = '';
  }

  private renderPrizeBox(): void {
    if (this.prizeBoxModal.classList.contains('is-hidden')) {
      return;
    }
    const statusText: Record<string, string> = {
      collected: 'Hentet',
      pending: 'Mynt venter',
      available: 'Klar',
      locked: 'Ikke hentet'
    };
    const activeMap = getGameMap(this.progress.getSettings().mapId);
    if (activeMap.id === TALLVOKTER_MAP_ID) {
      if (TALLVOKTER_QUESTS.length === 0) {
        this.prizeBoxList.innerHTML = `
          <div class="prize-empty">
            <img src="/regnemester/ui/treasure-chest-icon.png" alt="" aria-hidden="true" />
            <strong>Ingen oppdrag er lagt til ennå</strong>
            <span>Nye oppdrag i Tallvokterens verden vil vises her etter hvert som de blir implementert.</span>
          </div>
        `;
        return;
      }
      const completed = new Set(this.progress.getCompleted());
      const questRows = TALLVOKTER_QUESTS.map((quest) => {
        const isCompleted = completed.has(quest.id);
        return `
          <div class="prize-row ${isCompleted ? 'collected' : 'locked'}" data-location-id="${quest.id}">
            <span class="prize-quest-marker" aria-hidden="true">${quest.order}</span>
            <div>
              <strong>${quest.place}</strong>
              <span>${quest.title}</span>
            </div>
            <em>${isCompleted ? 'Fullført' : 'Ikke fullført'}</em>
          </div>
        `;
      }).join('');
      this.prizeBoxList.innerHTML = questRows;
      return;
    }
    if (!activeMap.showBossJourney) {
      this.prizeBoxList.innerHTML = REGNERIKET_STOPS.map((stop) => {
        const status = this.progress.getRegneriketCoinStatus(stop.id);
        return `
        <div class="prize-row ${status}" data-location-id="${stop.id}">
          <span class="prize-coin" aria-hidden="true"></span>
          <div>
            <strong>${stop.order}. ${stop.place}</strong>
            <span>${stop.title} · ${this.progress.getRegneriketRewardCoins(stop.id)} Regnecoins</span>
          </div>
          <em>${statusText[status]}</em>
        </div>
      `;
      }).join('');
      return;
    }

    this.prizeBoxList.innerHTML = LOCATIONS.map((location) => {
      const status = this.progress.getCoinStatus(location.id);
      return `
        <div class="prize-row ${status}" data-location-id="${location.id}">
          <span class="prize-coin" aria-hidden="true"></span>
          <div>
            <strong>${location.order}. ${location.bossName}</strong>
            <span>${location.place}</span>
          </div>
          <em>${statusText[status]}</em>
        </div>
      `;
    }).join('');
  }

  private renderMedalCabinet(): void {
    if (this.medalCabinetModal.classList.contains('is-hidden')) {
      return;
    }
    const counts = this.progress.getCollectibleCardCounts();
    this.collectionTabMedals.classList.toggle('is-selected', this.collectionSection === 'medals');
    this.collectionTabCards.classList.toggle('is-selected', this.collectionSection === 'cards');
    this.collectionTabMedals.setAttribute('aria-selected', String(this.collectionSection === 'medals'));
    this.collectionTabCards.setAttribute('aria-selected', String(this.collectionSection === 'cards'));
    this.medalCabinetList.classList.toggle('is-hidden', this.collectionSection !== 'medals');
    this.cardCollectionList.classList.toggle('is-hidden', this.collectionSection !== 'cards');

    if (this.collectionSection === 'medals') {
      this.cardCollectionList.innerHTML = '';
      this.medalCabinetList.innerHTML = MEDALS.map((medal) => {
        const count = this.progress.getMedalCount(medal.id);
        const earned = count > 0;
        return `
          <div class="medal-card ${earned ? 'earned' : ''}">
            <div class="medal-card__image">
              <img src="${medal.src}" alt="" />
              <span>x${count}</span>
            </div>
            <div>
              <strong>${medal.label}</strong>
              <p>${medal.description}</p>
            </div>
          </div>
        `;
      }).join('');
      return;
    }

    this.medalCabinetList.innerHTML = '';
    const ownedCards = COLLECTIBLE_CARDS
      .filter((card) => (counts[card.id] ?? 0) > 0)
      .sort((a, b) => {
        const rarityOrder = COLLECTIBLE_CARD_RARITIES[b.rarity].sortOrder
          - COLLECTIBLE_CARD_RARITIES[a.rarity].sortOrder;
        return rarityOrder || a.title.localeCompare(b.title, 'nb');
      });
    this.collectionPreviewCardIds = ownedCards.map((card) => card.id);

    if (ownedCards.length === 0) {
      this.collectionPreviewIndex = -1;
      this.cardCollectionList.innerHTML = `
        <div class="collection-empty">
          <strong>Kortsamlingen er tom</strong>
          <span>Finn ditt første samlekort i en mysteriepakke i butikken.</span>
        </div>
      `;
      return;
    }

    this.cardCollectionList.innerHTML = ownedCards.map((card) => {
      const count = counts[card.id] ?? 0;
      const rarity = COLLECTIBLE_CARD_RARITIES[card.rarity];
      return `
        <button type="button" class="collection-card is-owned" data-card-id="${card.id}" data-rarity="${card.rarity}" aria-label="Vis ${card.title} i stort format">
          <div class="collection-card__art">
            <img src="${card.src}" alt="${card.title}" />
          </div>
          <span class="collection-card__count">x${count}</span>
          <div class="collection-card__details">
            <strong>${card.title}</strong>
            <span>${rarity.label}</span>
            <p>${card.description}</p>
          </div>
        </button>
      `;
    }).join('');

    this.cardCollectionList.querySelectorAll<HTMLButtonElement>('[data-card-id]').forEach((button) => {
      button.addEventListener('click', () => this.openCollectionCardPreview(button.dataset.cardId!));
    });
  }

  private openCollectionCardPreview(cardId: string): void {
    this.collectionPreviewIndex = this.collectionPreviewCardIds.indexOf(cardId);
    if (this.collectionPreviewIndex < 0) {
      return;
    }
    this.renderCollectionCardPreview();
    this.collectionCardPreview.classList.remove('is-hidden');
  }

  private renderCollectionCardPreview(): void {
    const cardId = this.collectionPreviewCardIds[this.collectionPreviewIndex];
    if (!cardId) {
      this.closeCollectionCardPreview();
      return;
    }
    const card = getCollectibleCardById(cardId);
    const rarity = COLLECTIBLE_CARD_RARITIES[card.rarity];
    this.collectionCardPreview.dataset.rarity = card.rarity;
    this.collectionCardPreviewImage.src = card.src;
    this.collectionCardPreviewImage.alt = card.title;
    this.collectionCardPreviewTitle.textContent = card.title;
    this.collectionCardPreviewRarity.textContent = rarity.label;
    const hasSeveralCards = this.collectionPreviewCardIds.length > 1;
    this.previousCollectionCard.disabled = !hasSeveralCards;
    this.nextCollectionCard.disabled = !hasSeveralCards;
  }

  private showAdjacentCollectionCard(direction: -1 | 1): void {
    const cardCount = this.collectionPreviewCardIds.length;
    if (cardCount < 2 || this.collectionPreviewIndex < 0) {
      return;
    }
    this.collectionPreviewIndex = (this.collectionPreviewIndex + direction + cardCount) % cardCount;
    this.renderCollectionCardPreview();
  }

  private closeCollectionCardPreview(): void {
    this.collectionCardPreview.classList.add('is-hidden');
    this.collectionCardPreview.removeAttribute('data-rarity');
    this.collectionCardPreviewImage.removeAttribute('src');
    this.collectionCardPreviewImage.alt = '';
    this.collectionPreviewIndex = -1;
  }

  private closeReward(): void {
    this.rewardModal.classList.add('is-hidden');
  }

  private openTokenPreview(tokenId: string, source: 'picker' | 'shop' = 'picker'): void {
    const token = PLAYER_TOKENS.find((candidate) => candidate.id === tokenId) ?? PLAYER_TOKENS[0];
    const unlocked = this.progress.isTokenUnlocked(token.id);
    const missing = Math.max(0, token.cost - this.progress.getRegnecoins());
    this.previewTokenId = token.id;
    this.previewTokenSource = source;
    this.tokenPreviewImage.src = token.src;
    this.tokenPreviewImage.alt = token.label;
    this.tokenPreviewTitle.textContent = token.label;
    this.tokenPreviewName.textContent = unlocked
      ? source === 'shop'
        ? 'Denne spillbrikken er kjøpt. Velg den i spillbrikkevelgeren.'
        : 'Se spillbrikken i stor størrelse før du velger.'
      : `Denne koster ${token.cost} Regnecoins. Du mangler ${missing} Regnecoins.`;
    this.chooseTokenPreview.textContent = unlocked
      ? source === 'shop' ? 'Til spillbrikkevelgeren' : 'Velg denne'
      : `Kjøp for ${token.cost}`;
    this.tokenPreview.classList.remove('is-hidden');
  }

  private closeTokenPreview(): void {
    this.tokenPreview.classList.add('is-hidden');
    this.previewTokenId = undefined;
    this.previewTokenSource = 'picker';
  }

  private choosePreviewToken(): void {
    if (!this.previewTokenId) {
      return;
    }

    const token = getTokenById(this.previewTokenId);
    const wasUnlocked = this.progress.isTokenUnlocked(token.id);
    if (wasUnlocked && this.previewTokenSource === 'shop') {
      this.closeTokenPreview();
      this.closeShop();
      this.openTokenPicker();
      return;
    }
    if (!wasUnlocked && this.progress.getRegnecoins() < token.cost) {
      this.showToast(`Du trenger ${token.cost - this.progress.getRegnecoins()} Regnecoins til.`);
      return;
    }

    const purchased = this.progress.purchaseToken(token.id);
    if (wasUnlocked) {
      this.progress.updateSettings({ tokenId: token.id });
    } else if (purchased) {
      this.showToast(`${token.label} er kjøpt! Velg spillbrikken i spillbrikkevelgeren.`);
    }
    this.closeTokenPreview();
    this.closeTokenPicker();
    this.closeShop();
    this.renderStartControls();
  }

  private renderQuest(): void {
    if (!this.quest) {
      return;
    }

    const { stop } = this.quest;
    const imageSrc = stop.iconSrc?.trim();
    if (imageSrc) {
      const separator = imageSrc.includes('?') ? '&' : '?';
      this.questRuneImage.src = `${imageSrc}${separator}quest-image=1`;
    } else {
      this.questRuneImage.removeAttribute('src');
    }
    this.questRuneImage.alt = stop.place;
    this.questShell.dataset.questId = stop.id;
    this.questKind.textContent = this.questKindLabel;
    this.questTitle.textContent = stop.place;
    this.questCopy.textContent = stop.description;
    this.questPlace.textContent = this.questMapLabel;
    this.questTask.textContent = stop.title;
    this.questProgress.innerHTML = Array.from({ length: this.quest.requiredCorrect }, (_, index) => (
      `<span class="${index < this.quest!.correct ? 'is-filled' : ''}"></span>`
    )).join('');
    this.questHearts.innerHTML = Array.from(
      { length: this.quest.maxPlayerHp },
      (_, index) => `<span class="heart ${index < this.quest!.playerHp ? 'is-live' : 'is-lost'}" aria-hidden="true">❤</span>`
    ).join('');
    this.questQuestionText.textContent = this.quest.status === 'active' ? this.quest.question.prompt : '';
    this.questMessage.textContent = this.quest.message;
    this.questChoiceGrid.innerHTML = '';
    this.closeQuestButton.classList.toggle('is-hidden', this.questExitLocked && this.quest.status === 'active');
    this.closeQuestButton.textContent = this.quest.status === 'lost' && this.quest.settings.playMode === 'story'
      ? 'Tilbake til kartet'
      : 'Avslutt';
    this.questTestVictoryButton?.classList.toggle('is-hidden', this.quest.status !== 'active');

    if (this.quest.status !== 'active') {
      const isStoryLoss = this.quest.status === 'lost' && this.quest.settings.playMode === 'story';
      this.retryQuest.textContent = isStoryLoss ? 'Tilbake til kartet' : 'Prøv igjen';
      this.retryQuest.classList.toggle(
        'is-hidden',
        this.quest.status !== 'lost' || (!isStoryLoss && !this.questRetryCallback)
      );
      return;
    }

    this.retryQuest.classList.add('is-hidden');
    for (const choice of this.quest.question.choices) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = String(choice);
      button.disabled = this.questInputLocked;
      button.addEventListener('click', () => this.answerQuest(choice));
      this.questChoiceGrid.appendChild(button);
    }
  }

  private answerQuest(choice: number): void {
    if (!this.quest || this.quest.status !== 'active' || this.questInputLocked) {
      return;
    }

    this.clearQuestTimers();
    this.quest = answerMathQuestQuestion(this.quest, choice);
    if (!this.quest.lastAnswerCorrect) {
      this.questInputLocked = true;
      this.questShell.classList.add('is-player-hit');
      this.progress.recordDamageTaken();
      if (this.quest.settings.playMode === 'story') {
        if (this.quest.status === 'lost') {
          this.restartStoryModeAfterFailure();
        } else {
          this.progress.setStoryLives(this.quest.playerHp);
        }
      }
      this.renderQuest();
      this.questEffectTimer = window.setTimeout(() => {
        this.questInputLocked = false;
        this.questShell.classList.remove('is-player-hit');
        this.questEffectTimer = undefined;
        if (this.quest) {
          this.renderQuest();
        }
      }, 520);
      if (this.quest.status === 'lost' && this.quest.settings.playMode !== 'story') {
        const callback = this.questLoseCallback;
        this.questLoseCallback = undefined;
        callback?.();
      }
      return;
    }

    if (this.quest.status === 'won') {
      const callback = this.questWinCallback;
      const successToast = this.questSuccessToast;
      if (this.questRegnecoinRewardAnimation > 0) {
        this.playRegnecoinRewardAnimation(this.questRegnecoinRewardAnimation, this.questRuneImage);
        this.questRegnecoinRewardAnimation = 0;
      }
      if (successToast === false) {
        this.closeQuest(true);
        callback?.();
        return;
      }

      callback?.();
      if (this.questSuccessToast) {
        this.showToast(this.questSuccessToast);
      }
    }

    this.renderQuest();
  }

  private closeQuest(force = false): void {
    if (!force && (this.thiefLossEndingActive || (this.questExitLocked && this.quest?.status === 'active'))) {
      return;
    }
    this.clearQuestTimers();
    this.questModal.classList.add('is-hidden');
    delete this.questShell.dataset.questId;
    this.quest = undefined;
    this.questWinCallback = undefined;
    this.questLoseCallback = undefined;
    this.questRetryCallback = undefined;
    this.questMapLabel = 'Regneriket';
    this.questKindLabel = 'Oppdrag';
    this.questExitLocked = false;
    this.questRegnecoinRewardAnimation = 0;
    this.thiefLossEndingActive = false;
    this.thiefLossContinueCallback = undefined;
    this.questShell.classList.remove('is-thief-loss-ending');
    this.thiefLossEnding.classList.add('is-hidden');
    this.continueThiefLossButton.disabled = false;
    this.continueThiefLossButton.textContent = 'Neste';
    this.closeQuestButton.classList.remove('is-hidden');
    this.hooks?.resetInput();
    this.questSuccessToast = 'Oppdrag fullført! Hent mynten på kartet.';
  }

  private clearQuestTimers(): void {
    if (this.questEffectTimer) {
      window.clearTimeout(this.questEffectTimer);
    }
    this.questEffectTimer = undefined;
    this.questInputLocked = false;
    this.questShell.classList.remove('is-player-hit');
  }

  private getQuestKindLabel(kind: RegneriketStop['kind']): string {
    const labels: Record<RegneriketStop['kind'], string> = {
      lys: 'Lysoppdrag',
      hent: 'Samleoppdrag',
      reparer: 'Reparasjonsoppdrag',
      lever: 'Leveringsoppdrag',
      portal: 'Portaloppdrag',
      utforsk: 'Utforskningsoppdrag',
      tid: 'Tidsoppdrag'
    };
    return labels[kind];
  }

  private findTouch(touches: TouchList, identifier: number): Touch | undefined {
    for (let index = 0; index < touches.length; index += 1) {
      const touch = touches.item(index);
      if (touch?.identifier === identifier) {
        return touch;
      }
    }

    return undefined;
  }

  private renderBattle(mood: BattleMood = 'idle'): void {
    if (!this.battle) {
      return;
    }

    const { location } = this.battle;
    const percent = Math.max(0, Math.round((this.battle.bossHp / this.battle.maxBossHp) * 100));
    const artMood = this.getBossArtMood(mood, percent);
    const isBossHit = mood === 'hurt' || mood === 'hurt2';
    const isSuperHit = isBossHit && this.battle.lastDamage > 1;
    this.battleShell.dataset.locationId = location.id;
    this.bossStage.dataset.locationId = location.id;
    this.battleShell.classList.toggle('is-boss-hit', isBossHit);
    this.battleShell.classList.toggle('is-boss-attack', mood === 'attack');
    this.battleShell.classList.toggle('is-player-hit', mood === 'attack');
    this.battleShell.classList.toggle('is-super-hit', isSuperHit);
    this.bossArtBg.style.backgroundImage = `linear-gradient(180deg, rgba(8, 17, 31, 0.05), rgba(8, 17, 31, 0.72)), url("${location.boss.panel}")`;
    this.bossArt.src = location.boss[artMood];
    this.bossArt.alt = location.bossName;
    this.bossArt.className = 'boss-art';
    this.bossArt.classList.toggle('is-hit', mood === 'hurt');
    this.bossArt.classList.toggle('is-heavy-hit', mood === 'hurt2' || isSuperHit);
    this.bossArt.classList.toggle('is-attack', mood === 'attack');
    this.bossArt.classList.toggle('is-low', artMood === 'low');
    this.bossArt.classList.toggle('is-defeated', artMood === 'defeated');
    this.battlePlace.textContent = location.place;
    this.battleTitle.textContent = location.bossName;
    this.bossLifeLabel.textContent = `Bossliv ${this.battle.bossHp}/${this.battle.maxBossHp}`;
    this.bossMeter.style.width = `${percent}%`;
    this.playerHearts.innerHTML = Array.from(
      { length: this.battle.maxPlayerHp },
      (_, index) => `<span class="heart ${index < this.battle!.playerHp ? 'is-live' : 'is-lost'}" aria-hidden="true">❤</span>`
    ).join('');
    this.renderSuperMeter();
    this.questionText.textContent = this.battle.status === 'active' ? `${this.battle.question.prompt} = ?` : '';
    this.battleMessage.textContent = this.battle.message;
    this.choiceGrid.innerHTML = '';

    if (this.battle.status !== 'active') {
      this.retryBattle.textContent = this.battle.status === 'lost' && this.battle.settings.playMode === 'story'
        ? 'Tilbake til kartet'
        : 'Prøv igjen';
      this.retryBattle.classList.toggle('is-hidden', this.battle.status !== 'lost');
      return;
    }

    this.retryBattle.classList.add('is-hidden');
    for (const choice of this.battle.question.choices) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = String(choice);
      button.disabled = this.battleInputLocked;
      button.addEventListener('click', () => this.answer(choice));
      this.choiceGrid.appendChild(button);
    }
  }

  private answer(choice: number): void {
    if (!this.battle || this.battle.status !== 'active' || this.battleInputLocked) {
      return;
    }

    this.clearBattleTimers();
    this.battleInputLocked = true;
    const wasStoryBattle = this.battle.settings.playMode === 'story';
    this.battle = answerQuestion(this.battle, choice);

    if (this.battle.lastAnswerCorrect) {
      this.showBattleEffect('boss-hit');
      this.renderBattle('hurt');

      this.battleSecondFrameTimer = window.setTimeout(() => {
        if (this.battle) {
          this.renderBattle('hurt2');
        }
      }, 210);

      this.battleEffectTimer = window.setTimeout(() => {
        if (!this.battle) {
          return;
        }
        this.battleEffects.innerHTML = '';
        this.battleInputLocked = false;
        this.renderBattle(this.battle.status === 'won' ? 'defeated' : 'idle');
      }, 620);

      if (this.battle.status === 'won') {
        this.winCallback?.();
        this.showToast(this.battle.message);
      }
      return;
    }

    this.showBattleEffect('player-hit');
    this.progress.recordDamageTaken();
    if (wasStoryBattle) {
      if (this.battle.status === 'lost') {
        this.restartStoryModeAfterFailure();
      } else {
        this.progress.setStoryLives(this.battle.playerHp);
      }
    }
    this.renderBattle('attack');
    this.battleEffectTimer = window.setTimeout(() => {
      if (!this.battle) {
        return;
      }
      this.battleEffects.innerHTML = '';
      this.battleInputLocked = false;
      this.renderBattle('idle');
    }, 720);
  }

  private closeBattle(): void {
    this.clearBattleTimers();
    this.modal.classList.add('is-hidden');
    this.battle = undefined;
    this.winCallback = undefined;
  }

  private renderStartControls(): void {
    const settings = this.progress.getSettings();
    const selectedToken = getTokenById(settings.tokenId);
    this.selectedTokenImage.src = selectedToken.src;
    this.selectedTokenImage.alt = selectedToken.label;
    this.selectedTokenName.textContent = selectedToken.label;
    this.storyModeButton.classList.toggle('is-active', settings.playMode === 'story');
    this.storyModeButton.classList.remove('is-hidden');
    this.storyModeButton.innerHTML = `
      <strong>Story mode</strong>
      <em>${this.progress.getStoryLives()}/${3} liv igjen</em>
    `;
    this.mapPicker.innerHTML = GAME_MAPS.map((map) => `
      <button class="map-choice ${settings.mapId === map.id ? 'is-selected' : ''} ${map.id === TALLVOKTER_MAP_ID && isPhoneViewport() ? 'is-unavailable' : ''}" type="button" data-map-id="${map.id}" ${map.id === TALLVOKTER_MAP_ID && isPhoneViewport() ? 'disabled aria-disabled="true"' : ''}>
        <strong>${map.label}</strong>
        <span>${map.id === TALLVOKTER_MAP_ID && isPhoneViewport() ? 'Ikke tilgjengelig på mobiltelefon.' : map.description}</span>
      </button>
    `).join('');
    const selectedMapUnavailable = settings.mapId === TALLVOKTER_MAP_ID && isPhoneViewport();
    this.storyModeButton.disabled = selectedMapUnavailable;
    this.shopRegnecoinCount.textContent = String(this.progress.getRegnecoins());
    if (this.worldReady) {
      this.updateStartButtonLabel();
    }
    if (!this.tokenPickerModal.classList.contains('is-hidden')) {
      this.tokenPicker.innerHTML = PLAYER_TOKENS.filter((token) => this.progress.isTokenUnlocked(token.id)).map((token) => {
      const unlocked = this.progress.isTokenUnlocked(token.id);
      return `
      <button class="token-choice ${settings.tokenId === token.id ? 'is-selected' : ''} ${unlocked ? '' : 'is-locked'}" type="button" data-token-id="${token.id}" aria-label="${token.label}">
        <img src="${token.src}" alt="" />
        <span>${token.label}</span>
        <em>${unlocked ? (settings.tokenId === token.id ? 'Valgt' : 'Åpen') : `${token.cost} RC`}</em>
      </button>
    `;
    }).join('');
      this.tokenPicker.querySelectorAll<HTMLButtonElement>('[data-token-id]').forEach((button) => {
        button.addEventListener('click', () => this.openTokenPreview(button.dataset.tokenId!, 'picker'));
      });
    } else {
      this.tokenPicker.innerHTML = '';
    }
    this.renderShop();
    this.mapPicker.querySelectorAll<HTMLButtonElement>('[data-map-id]').forEach((button) => {
      button.addEventListener('click', () => this.openMapSettings(button.dataset.mapId! as GameMapId));
    });
  }

  private renderShop(): void {
    if (this.shopModal.classList.contains('is-hidden')) {
      this.shopGrid.innerHTML = '';
      return;
    }

    const regnecoins = this.progress.getRegnecoins();
    const packCost = this.getMysteryPackCost();
    const missing = Math.max(0, packCost - regnecoins);
    this.shopRegnecoinCount.textContent = String(regnecoins);
    this.mysteryPackCost.textContent = String(packCost);
    this.shopTabTokens.classList.toggle('is-selected', this.shopSection === 'tokens');
    this.shopTabCards.classList.toggle('is-selected', this.shopSection === 'cards');
    this.shopTabTokens.setAttribute('aria-selected', String(this.shopSection === 'tokens'));
    this.shopTabCards.setAttribute('aria-selected', String(this.shopSection === 'cards'));
    this.shopGrid.classList.toggle('is-hidden', this.shopSection !== 'tokens');
    this.shopCardPanel.classList.toggle('is-hidden', this.shopSection !== 'cards');

    if (this.shopSection === 'tokens') {
      this.shopGrid.innerHTML = PLAYER_TOKENS.filter((token) => token.cost > 0).map((token) => {
        const unlocked = this.progress.isTokenUnlocked(token.id);
        return `
          <button class="token-choice ${unlocked ? 'is-selected' : 'is-locked'}" type="button" data-token-id="${token.id}" aria-label="${token.label}">
            <img src="${token.src}" alt="" />
            <span>${token.label}</span>
            <em>${unlocked ? 'Kjøpt' : `${token.cost} RC`}</em>
          </button>
        `;
      }).join('');
      this.shopGrid.querySelectorAll<HTMLButtonElement>('[data-token-id]').forEach((button) => {
        button.addEventListener('click', () => this.openTokenPreview(button.dataset.tokenId!, 'shop'));
      });
      return;
    }

    this.shopGrid.innerHTML = '';
    this.buyMysteryPackButton.disabled = missing > 0;
    this.mysteryPackStatus.textContent = missing > 0
      ? `Du mangler ${missing} Regnecoins til en pakke.`
      : '';
  }

  private openStartScreen(): void {
    this.renderStartControls();
    this.closeResetConfirm();
    this.startManuallyOpened = true;
    this.startScreen.classList.remove('is-hidden');
  }

  private updateStartButtonLabel(): void {
    const selectedMapUnavailable = this.progress.getSettings().mapId === TALLVOKTER_MAP_ID
      && isPhoneViewport();
    this.startGameButton.disabled = !this.worldReady || selectedMapUnavailable;
    this.startGameButton.textContent = selectedMapUnavailable
      ? 'Velg et tilgjengelig kart'
      : 'Start reisen';
  }

  private closeStartScreen(): void {
    this.startManuallyOpened = false;
    this.startScreen.classList.add('is-hidden');
  }

  private syncStartVisibility(): void {
    if (this.progress.getSettings().started && !this.startManuallyOpened) {
      this.startScreen.classList.add('is-hidden');
    } else {
      this.startScreen.classList.remove('is-hidden');
    }
  }

  private openResetConfirm(): void {
    if (this.isBattleOpen()) {
      return;
    }
    this.resetConfirm.classList.remove('is-hidden');
  }

  private closeResetConfirm(): void {
    this.resetConfirm.classList.add('is-hidden');
  }

  private goBackToRegnemester(): void {
    const event = new CustomEvent('regnereisen:back', { cancelable: true });
    window.dispatchEvent(event);
    if (event.defaultPrevented) {
      return;
    }

    if (this.progress.getSettings().started) {
      this.closeStartScreen();
      return;
    }

    this.showToast('Tilbake-knappen er klar for Regnemester-appen.');
  }

  private getBossArtMood(mood: BattleMood, percent: number): BattleMood {
    if (mood === 'hurt' || mood === 'hurt2' || mood === 'attack' || mood === 'defeated' || mood === 'low') {
      return mood;
    }

    if (this.battle?.status === 'won') {
      return 'defeated';
    }

    return percent <= 40 ? 'low' : 'idle';
  }

  private renderSuperMeter(): void {
    if (!this.battle) {
      return;
    }

    this.superCount.textContent = `${this.battle.streak}/5`;
    this.superMeter.classList.toggle('ready', this.battle.streak === 4);
    this.superMeter.innerHTML = Array.from({ length: 5 }, (_, index) => {
      const filled = index < this.battle!.streak;
      const ready = this.battle!.streak === 4 && index === 4;
      return `<span class="super-cell ${filled ? 'filled' : ''} ${ready ? 'ready' : ''}"></span>`;
    }).join('');
  }

  private showBattleEffect(type: 'boss-hit' | 'player-hit'): void {
    if (!this.battle) {
      return;
    }

    if (type === 'boss-hit') {
      const isSuper = this.battle.lastDamage > 1;
      this.battleEffects.innerHTML = `
        <div class="hero-attack ${isSuper ? 'super' : ''}" aria-hidden="true"></div>
        <div class="damage-popup ${isSuper ? 'super' : ''}">-${this.battle.lastDamage}${isSuper ? ' SUPER!' : ''}</div>
      `;
      return;
    }

    this.battleEffects.innerHTML = `
      <div class="boss-retaliation" aria-hidden="true"></div>
      <div class="boss-attack-effect">${getBossAttackName(this.battle.location.id)}</div>
    `;
  }

  private clearBattleTimers(): void {
    if (this.battleEffectTimer) {
      window.clearTimeout(this.battleEffectTimer);
      this.battleEffectTimer = undefined;
    }

    if (this.battleSecondFrameTimer) {
      window.clearTimeout(this.battleSecondFrameTimer);
      this.battleSecondFrameTimer = undefined;
    }

    this.battleInputLocked = false;
    this.battleEffects.innerHTML = '';
    this.battleShell.classList.remove('is-boss-hit', 'is-boss-attack', 'is-player-hit', 'is-super-hit');
  }
}

function requireElement<T extends HTMLElement>(id: string): T {
  const element = hudElementRoot.getElementById(id);
  if (!element) {
    throw new Error(`Missing element #${id}`);
  }
  return element as T;
}
