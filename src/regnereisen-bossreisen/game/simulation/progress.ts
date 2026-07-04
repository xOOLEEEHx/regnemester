import { LOCATIONS, WORLD_SIZE } from '../content/locations';
import { isRewardLocation, MAP_BOSS_REWARD_EXPERIMENT } from '../content/mapExperiment';
import { IMMORTALITY_MEDAL_ID, MEDAL_IDS, OPERATION_MEDAL_IDS, type MedalId } from '../content/medals';
import { DEFAULT_SETTINGS, type GameSettings, type OperationMode } from '../content/settings';

type PlayerPosition = {
  x: number;
  y: number;
};

type StoredRunProgress = {
  completed?: string[];
  collectedRewards?: string[];
  spentRewards?: string[];
  unlocked?: string[];
  finalRewardCollected?: boolean;
  flawless?: boolean;
  player?: PlayerPosition;
};

type StoredStoryProgress = StoredRunProgress & {
  lives?: number;
  started?: boolean;
  medalEarned?: boolean;
};

type StoredProgress = StoredRunProgress & {
  settings?: Partial<GameSettings>;
  story?: StoredStoryProgress;
  normalRuns?: Partial<Record<OperationMode, StoredRunProgress>>;
  storyRuns?: Partial<Record<OperationMode, StoredStoryProgress>>;
  medalCounts?: Partial<Record<MedalId, number>>;
};

type RunProgress = {
  completed: Set<string>;
  collectedRewards: Set<string>;
  spentRewards: Set<string>;
  unlocked: Set<string>;
  finalRewardCollected: boolean;
  flawless: boolean;
  playerPosition: PlayerPosition;
};

type StoryProgress = RunProgress & {
  lives: number;
  started: boolean;
  medalEarned: boolean;
};

type MedalCounts = Record<MedalId, number>;

export const STORY_MAX_LIVES = 3;
export const FINAL_REWARD_POSITION = {
  x: 600,
  y: 850
};

const STORAGE_KEY = 'regnemester-bossreisen-progress';

export class ProgressStore extends EventTarget {
  private normalRuns = createRunProgressMap();
  private storyRuns = createStoryProgressMap();
  private medalCounts = createMedalCounts();
  private settings: GameSettings = { ...DEFAULT_SETTINGS };

  constructor() {
    super();
    this.load();
  }

  getCompleted(): string[] {
    return [...this.activeRun().completed];
  }

  getPlayerPosition(): PlayerPosition {
    return { ...this.activeRun().playerPosition };
  }

  getSettings(): GameSettings {
    return { ...this.settings };
  }

  isStoryMode(): boolean {
    return this.settings.playMode === 'story';
  }

  getStoryLives(): number {
    return this.activeStoryRun().lives;
  }

  getBattleHearts(): { playerHp?: number; maxPlayerHp?: number } {
    if (!this.isStoryMode()) {
      return {};
    }

    return {
      playerHp: this.activeStoryRun().lives,
      maxPlayerHp: STORY_MAX_LIVES
    };
  }

  getActiveMedalId(): MedalId {
    return this.isStoryMode() ? 'story' : this.settings.operationMode;
  }

  getMedalCount(id: MedalId): number {
    return this.medalCounts[id] ?? 0;
  }

  getMedalCounts(): MedalCounts {
    return { ...this.medalCounts };
  }

  isFlawlessRun(): boolean {
    return this.activeRun().flawless;
  }

  updateSettings(settings: Partial<GameSettings>): void {
    this.settings = {
      ...this.settings,
      ...settings
    };

    this.save(true);
  }

  startNormalMode(): void {
    this.settings = {
      ...this.settings,
      started: true,
      playMode: 'normal'
    };
    this.save(true);
  }

  startStoryMode(): void {
    this.settings = {
      ...this.settings,
      started: true,
      playMode: 'story'
    };
    const story = this.activeStoryRun();
    story.started = true;
    if (story.lives <= 0) {
      this.storyRuns[this.settings.operationMode] = createStoryProgress({ started: true });
    }
    this.save(true);
  }

  savePlayerPosition(x: number, y: number): void {
    this.activeRun().playerPosition = { x: Math.round(x), y: Math.round(y) };
    this.save(false);
  }

  isCompleted(id: string): boolean {
    return this.activeRun().completed.has(id);
  }

  isRewardCollected(id: string): boolean {
    return this.activeRun().collectedRewards.has(id);
  }

  hasPendingReward(id: string): boolean {
    return MAP_BOSS_REWARD_EXPERIMENT
      && isRewardLocation(id)
      && this.activeRun().completed.has(id)
      && !this.activeRun().collectedRewards.has(id);
  }

  getCollectedCoinCount(): number {
    return LOCATIONS.filter((location) => (
      isRewardLocation(location.id)
      && this.activeRun().collectedRewards.has(location.id)
    )).length;
  }

  getAvailableUnlockCoinCount(): number {
    return LOCATIONS.filter((location) => (
      isRewardLocation(location.id)
      && this.activeRun().collectedRewards.has(location.id)
      && !this.activeRun().spentRewards.has(location.id)
    )).length;
  }

  getTotalCoinCount(): number {
    return LOCATIONS.filter((location) => isRewardLocation(location.id)).length;
  }

  getCoinStatus(locationId: string): 'collected' | 'pending' | 'available' | 'locked' {
    if (this.activeRun().collectedRewards.has(locationId)) {
      return 'collected';
    }

    if (this.hasPendingReward(locationId)) {
      return 'pending';
    }

    if (this.isCompleted(locationId)) {
      return 'available';
    }

    return 'locked';
  }

  isUnlocked(locationId: string): boolean {
    const location = LOCATIONS.find((candidate) => candidate.id === locationId);
    if (!location) {
      return false;
    }

    if (location.order === 1) {
      return true;
    }

    if (location.id === 'mega-regnemesteren') {
      return this.activeRun().completed.has('siste-arenaen')
        && this.activeRun().collectedRewards.has('siste-arenaen');
    }

    return this.activeRun().unlocked.has(locationId);
  }

  canUnlock(locationId: string): boolean {
    const location = LOCATIONS.find((candidate) => candidate.id === locationId);
    if (!location || this.isUnlocked(locationId) || this.isCompleted(locationId)) {
      return false;
    }

    if (location.order === 1 || location.id === 'mega-regnemesteren') {
      return false;
    }

    if (location.id === 'siste-arenaen' && !this.areBossesBeforeFinalArenaComplete()) {
      return false;
    }

    return this.getAvailableUnlockCoinCount() > 0;
  }

  unlockLocation(locationId: string): boolean {
    if (!this.canUnlock(locationId)) {
      return false;
    }

    const coin = this.getFirstAvailableUnlockCoin();
    if (!coin) {
      return false;
    }

    this.activeRun().spentRewards.add(coin.id);
    this.activeRun().unlocked.add(locationId);
    this.save(true);
    return true;
  }

  isJourneyComplete(): boolean {
    return LOCATIONS.every((location) => (
      this.activeRun().completed.has(location.id)
      && (!isRewardLocation(location.id) || this.activeRun().collectedRewards.has(location.id))
    ));
  }

  hasFinalRewardPending(): boolean {
    return this.isJourneyComplete() && !this.activeRun().finalRewardCollected;
  }

  isFinalRewardCollected(): boolean {
    return this.activeRun().finalRewardCollected;
  }

  collectFinalReward(): MedalId[] {
    if (!this.hasFinalRewardPending()) {
      return [];
    }

    const awardedMedalIds: MedalId[] = [];
    this.activeRun().finalRewardCollected = true;
    const medalId = this.getActiveMedalId();
    this.medalCounts[medalId] += 1;
    awardedMedalIds.push(medalId);
    if (this.activeRun().flawless) {
      this.medalCounts[IMMORTALITY_MEDAL_ID] += 1;
      awardedMedalIds.push(IMMORTALITY_MEDAL_ID);
    }
    if (this.isStoryMode()) {
      this.activeStoryRun().medalEarned = true;
    }
    this.save(true);
    return awardedMedalIds;
  }

  hasStoryMedal(): boolean {
    return this.medalCounts.story > 0;
  }

  hasRegnereisenMedal(): boolean {
    return OPERATION_MEDAL_IDS.some((id) => this.medalCounts[id] > 0);
  }

  getNextObjective(): string {
    const pendingReward = LOCATIONS.find((location) => this.hasPendingReward(location.id));
    if (pendingReward) {
      return `Hent mynten ved ${pendingReward.place}.`;
    }

    if (this.hasFinalRewardPending()) {
      return this.isStoryMode()
        ? 'Hent Story mode-medaljen ved portalen.'
        : 'Hent medaljen for denne utfordringen ved portalen.';
    }

    const nextUnlocked = LOCATIONS.find((location) => !this.activeRun().completed.has(location.id) && this.isUnlocked(location.id));
    if (nextUnlocked) {
      if (nextUnlocked.id === 'mega-regnemesteren') {
        return `Neste stopp: ${nextUnlocked.bossName}`;
      }
      return `Neste stopp: ${nextUnlocked.place}. Slå ${nextUnlocked.bossName}.`;
    }

    const next = LOCATIONS.find((location) => !this.activeRun().completed.has(location.id));
    if (!next) {
      return this.isStoryMode()
        ? 'Story mode er fullført. Medaljen er din!'
        : 'Alle bossene er slått. Gå fritt rundt og velg favorittkampene dine.';
    }

    if (next.id === 'siste-arenaen' && this.areBossesBeforeFinalArenaComplete() && this.getAvailableUnlockCoinCount() > 0) {
      return 'Lås opp Den siste arenaen med en mynt.';
    }

    if (this.getAvailableUnlockCoinCount() > 0) {
      return 'Velg en låst boss og bruk en mynt for å åpne den.';
    }

    return 'Slå en åpen boss, hent mynten og bruk den til å låse opp neste kamp.';
  }

  completeLocation(locationId: string): void {
    this.activeRun().completed.add(locationId);
    this.save(true);
  }

  collectReward(locationId: string): void {
    if (!this.activeRun().completed.has(locationId) || !isRewardLocation(locationId)) {
      return;
    }

    this.activeRun().collectedRewards.add(locationId);
    this.save(true);
  }

  markFlawlessFailed(): void {
    const run = this.activeRun();
    if (!run.flawless) {
      return;
    }

    run.flawless = false;
    this.save(true);
  }

  setStoryLives(lives: number): void {
    this.activeStoryRun().lives = Math.max(0, Math.min(STORY_MAX_LIVES, lives));
    this.save(true);
  }

  failStoryMode(): void {
    this.storyRuns[this.settings.operationMode] = createStoryProgress({ started: true });
    this.settings = {
      ...this.settings,
      started: true,
      playMode: 'story'
    };
    this.save(true);
  }

  reset(): void {
    if (this.isStoryMode()) {
      this.storyRuns[this.settings.operationMode] = createStoryProgress({ started: true });
    } else {
      this.normalRuns[this.settings.operationMode] = createRunProgress();
    }
    this.save(true);
  }

  private load(): void {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as StoredProgress;
      const legacyMode = getLegacyMode(parsed.settings?.operationMode);
      this.normalRuns = createRunProgressMap(parsed.normalRuns, parsed, legacyMode);
      this.storyRuns = createStoryProgressMap(parsed.storyRuns, parsed.story, legacyMode);
      this.medalCounts = createMedalCounts(parsed.medalCounts);
      if (parsed.finalRewardCollected) {
        this.medalCounts[legacyMode] = Math.max(this.medalCounts[legacyMode], 1);
      }
      if (parsed.story?.medalEarned) {
        this.medalCounts.story = Math.max(this.medalCounts.story, 1);
      }
      this.settings = {
        ...DEFAULT_SETTINGS,
        ...parsed.settings
      };
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }

  private save(announce: boolean): void {
    const activeNormal = this.activeNormalRun();
    const activeStory = this.activeStoryRun();
    const snapshot: StoredProgress = {
      ...snapshotRun(activeNormal),
      settings: this.settings,
      normalRuns: snapshotRunMap(this.normalRuns),
      storyRuns: snapshotStoryRunMap(this.storyRuns),
      story: snapshotStoryRun(activeStory),
      medalCounts: { ...this.medalCounts }
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    if (announce) {
      this.dispatchEvent(new Event('change'));
    }
  }

  private activeRun(): RunProgress {
    return this.isStoryMode() ? this.activeStoryRun() : this.activeNormalRun();
  }

  private activeNormalRun(): RunProgress {
    return this.normalRuns[this.settings.operationMode];
  }

  private activeStoryRun(): StoryProgress {
    return this.storyRuns[this.settings.operationMode];
  }

  private areBossesBeforeFinalArenaComplete(): boolean {
    return LOCATIONS.filter((location) => location.order < 10)
      .every((location) => this.activeRun().completed.has(location.id));
  }

  private getFirstAvailableUnlockCoin(): { id: string } | undefined {
    return LOCATIONS.find((location) => (
      isRewardLocation(location.id)
      && this.activeRun().collectedRewards.has(location.id)
      && !this.activeRun().spentRewards.has(location.id)
    ));
  }
}

function createRunProgress(saved: StoredRunProgress = {}): RunProgress {
  const completed = new Set(saved.completed ?? []);
  const collectedRewards = new Set(saved.collectedRewards ?? []);
  const unlocked = new Set(saved.unlocked ?? getLegacyUnlocked(completed, collectedRewards));

  return {
    completed,
    collectedRewards,
    spentRewards: new Set(saved.spentRewards ?? []),
    unlocked,
    finalRewardCollected: saved.finalRewardCollected ?? false,
    flawless: saved.flawless ?? true,
    playerPosition: saved.player ? { ...saved.player } : { x: WORLD_SIZE.startX, y: WORLD_SIZE.startY }
  };
}

function createStoryProgress(saved: StoredStoryProgress = {}): StoryProgress {
  return {
    ...createRunProgress(saved),
    lives: saved.lives ?? STORY_MAX_LIVES,
    started: saved.started ?? false,
    medalEarned: saved.medalEarned ?? false
  };
}

function createRunProgressMap(
  saved?: Partial<Record<OperationMode, StoredRunProgress>>,
  legacy?: StoredRunProgress,
  legacyMode: OperationMode = DEFAULT_SETTINGS.operationMode
): Record<OperationMode, RunProgress> {
  return OPERATION_MEDAL_IDS.reduce((runs, id) => {
    runs[id] = createRunProgress(saved?.[id] ?? (id === legacyMode ? legacy : undefined));
    return runs;
  }, {} as Record<OperationMode, RunProgress>);
}

function createStoryProgressMap(
  saved?: Partial<Record<OperationMode, StoredStoryProgress>>,
  legacy?: StoredStoryProgress,
  legacyMode: OperationMode = DEFAULT_SETTINGS.operationMode
): Record<OperationMode, StoryProgress> {
  return OPERATION_MEDAL_IDS.reduce((runs, id) => {
    runs[id] = createStoryProgress(saved?.[id] ?? (id === legacyMode ? legacy : undefined));
    return runs;
  }, {} as Record<OperationMode, StoryProgress>);
}

function createMedalCounts(saved?: Partial<Record<MedalId, number>>): MedalCounts {
  return MEDAL_IDS.reduce((counts, id) => {
    counts[id] = Math.max(0, Math.floor(saved?.[id] ?? 0));
    return counts;
  }, {} as MedalCounts);
}

function snapshotRun(run: RunProgress): StoredRunProgress {
  return {
    completed: [...run.completed],
    collectedRewards: [...run.collectedRewards],
    spentRewards: [...run.spentRewards],
    unlocked: [...run.unlocked],
    finalRewardCollected: run.finalRewardCollected,
    flawless: run.flawless,
    player: run.playerPosition
  };
}

function snapshotStoryRun(run: StoryProgress): StoredStoryProgress {
  return {
    ...snapshotRun(run),
    lives: run.lives,
    started: run.started,
    medalEarned: run.medalEarned
  };
}

function snapshotRunMap(runs: Record<OperationMode, RunProgress>): Partial<Record<OperationMode, StoredRunProgress>> {
  return OPERATION_MEDAL_IDS.reduce((snapshot, id) => {
    snapshot[id] = snapshotRun(runs[id]);
    return snapshot;
  }, {} as Partial<Record<OperationMode, StoredRunProgress>>);
}

function snapshotStoryRunMap(runs: Record<OperationMode, StoryProgress>): Partial<Record<OperationMode, StoredStoryProgress>> {
  return OPERATION_MEDAL_IDS.reduce((snapshot, id) => {
    snapshot[id] = snapshotStoryRun(runs[id]);
    return snapshot;
  }, {} as Partial<Record<OperationMode, StoredStoryProgress>>);
}

function getLegacyMode(mode?: OperationMode): OperationMode {
  return mode && OPERATION_MEDAL_IDS.includes(mode) ? mode : DEFAULT_SETTINGS.operationMode;
}

function getLegacyUnlocked(completed: Set<string>, collectedRewards: Set<string>): string[] {
  const unlocked = new Set<string>(['slimmyra']);
  LOCATIONS.slice(1).forEach((location, index) => {
    const previous = LOCATIONS[index];
    if (completed.has(location.id) || (completed.has(previous.id) && collectedRewards.has(previous.id))) {
      unlocked.add(location.id);
    }
  });
  return [...unlocked];
}
