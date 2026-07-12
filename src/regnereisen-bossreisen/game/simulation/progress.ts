import { LOCATIONS } from '../content/locations';
import { isRewardLocation, MAP_BOSS_REWARD_EXPERIMENT } from '../content/mapExperiment';
import { DEFAULT_MAP_ID, getGameMap, REGNERIKET_MAP_ID } from '../content/maps';
import { MEDAL_IDS, OPERATION_MEDAL_IDS, REGNECOIN_MEDAL_TIERS, type MedalId } from '../content/medals';
import { DEFAULT_TOKEN_ID, getTokenById } from '../content/playerTokens';
import { getRegneriketStopById, REGNERIKET_STOPS } from '../content/regneriket';
import { DEFAULT_SETTINGS, DIFFICULTY_OPTIONS, type Difficulty, type GameSettings, type OperationMode } from '../content/settings';

type PlayerPosition = {
  x: number;
  y: number;
};

type StoredRunProgress = {
  completed?: string[];
  collectedRewards?: string[];
  spentRewards?: string[];
  unlocked?: string[];
  awardedMedals?: MedalId[];
  finalRewardCollected?: boolean;
  player?: PlayerPosition;
  damageTaken?: boolean;
  pickupItems?: Record<string, string[]>;
  activePickupQuests?: string[];
};

type StoredStoryProgress = StoredRunProgress & {
  lives?: number;
  started?: boolean;
  medalEarned?: boolean;
};

type StoredProgress = StoredRunProgress & {
  version?: number;
  settings?: Partial<GameSettings>;
  story?: StoredStoryProgress;
  normalRuns?: Partial<Record<OperationMode, StoredRunProgress>>;
  storyRuns?: Partial<Record<OperationMode, StoredStoryProgress>>;
  regneriket?: StoredRunProgress;
  regneriketRuns?: Partial<Record<Difficulty, StoredRunProgress>>;
  regneriketStory?: StoredStoryProgress;
  regnecoins?: number;
  totalRegnecoinsEarned?: number;
  purchasedTokens?: string[];
  medalCounts?: Partial<Record<MedalId, number>>;
};

type RunProgress = {
  completed: Set<string>;
  collectedRewards: Set<string>;
  spentRewards: Set<string>;
  unlocked: Set<string>;
  awardedMedals: Set<MedalId>;
  finalRewardCollected: boolean;
  playerPosition: PlayerPosition;
  damageTaken: boolean;
  pickupItems: Record<string, Set<string>>;
  activePickupQuests: Set<string>;
};

type StoryProgress = RunProgress & {
  lives: number;
  started: boolean;
  medalEarned: boolean;
};

type MedalCounts = Record<MedalId, number>;

export type RewardResult = {
  medalIds: MedalId[];
  regnecoins: number;
};

export const STORY_MAX_LIVES = 3;
export const FINAL_REWARD_POSITION = {
  x: 600,
  y: 850
};

const STORAGE_KEY = 'regnemester-bossreisen-progress';
const STORAGE_VERSION = 2;
const BOSS_COIN_BASE_REWARD = 10;
const MEDAL_REGNECOIN_REWARD = 120;

export class ProgressStore extends EventTarget {
  private normalRuns = createRunProgressMap();
  private storyRuns = createStoryProgressMap();
  private regneriketRuns = createRegneriketProgressMap();
  private regneriketStory = createStoryProgress({}, REGNERIKET_MAP_ID);
  private medalCounts = createMedalCounts();
  private purchasedTokens = new Set<string>([DEFAULT_TOKEN_ID]);
  private regnecoins = 0;
  private totalRegnecoinsEarned = 0;
  private settings: GameSettings = { ...DEFAULT_SETTINGS };

  constructor() {
    super();
    this.load();
    this.restoreEarnedRegneriketAchievements();
  }

  private get regneriket(): RunProgress {
    return this.isStoryMode() ? this.regneriketStory : this.regneriketRuns[this.settings.difficulty];
  }

  getCompleted(): string[] {
    return [...this.activeMapRun().completed];
  }

  getPlayerPosition(): PlayerPosition {
    return { ...this.activeMapRun().playerPosition };
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

  getRegnecoins(): number {
    return this.regnecoins;
  }

  getRegneriketRewardCoins(stopId: string): number {
    const stop = getRegneriketStopById(stopId);
    return stop ? this.getRegneriketRewardCoinsFor(stop.regnecoins) : 0;
  }

  getTotalRegnecoinsEarned(): number {
    return this.totalRegnecoinsEarned;
  }

  isTokenUnlocked(tokenId: string): boolean {
    const token = getTokenById(tokenId);
    return token.cost <= 0 || this.purchasedTokens.has(token.id);
  }

  getPurchasedTokens(): string[] {
    return [...this.purchasedTokens];
  }

  purchaseToken(tokenId: string): boolean {
    const token = getTokenById(tokenId);
    if (this.isTokenUnlocked(token.id)) {
      return false;
    }

    if (this.regnecoins < token.cost) {
      return false;
    }

    this.regnecoins -= token.cost;
    this.purchasedTokens.add(token.id);
    this.save(true);
    return true;
  }

  updateSettings(settings: Partial<GameSettings>): void {
    const previousMapId = this.settings.mapId;
    const requestedToken = settings.tokenId ? getTokenById(settings.tokenId) : undefined;
    this.settings = {
      ...this.settings,
      ...settings,
      tokenId: requestedToken && !this.isTokenUnlocked(requestedToken.id) ? this.settings.tokenId : settings.tokenId ?? this.settings.tokenId,
      mapId: getGameMap(settings.mapId ?? this.settings.mapId).id
    };

    if (settings.mapId && settings.mapId !== previousMapId) {
      this.resetPlayerToActiveMapStart();
    }

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
      this.replaceActiveStoryRun(createStoryProgress({ started: true }, this.settings.mapId));
    }
    this.save(true);
  }

  savePlayerPosition(x: number, y: number): void {
    this.activeMapRun().playerPosition = { x: Math.round(x), y: Math.round(y) };
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
    if (this.isRegneriketActive()) {
      return REGNERIKET_STOPS.filter((stop) => this.regneriket.collectedRewards.has(stop.id)).length;
    }

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

  getAvailableRegneriketUnlockCoinCount(): number {
    return REGNERIKET_STOPS.filter((stop) => (
      this.regneriket.collectedRewards.has(stop.id)
      && !this.regneriket.spentRewards.has(stop.id)
    )).length;
  }

  getTotalCoinCount(): number {
    if (this.isRegneriketActive()) {
      return REGNERIKET_STOPS.length;
    }

    return LOCATIONS.filter((location) => isRewardLocation(location.id)).length;
  }

  getCoinStatus(locationId: string): 'collected' | 'pending' | 'available' | 'locked' {
    if (this.isRegneriketActive()) {
      return this.getRegneriketCoinStatus(locationId);
    }

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

  collectFinalReward(): RewardResult | undefined {
    if (!this.hasFinalRewardPending()) {
      return;
    }

    this.activeRun().finalRewardCollected = true;
    const result: RewardResult = { medalIds: [], regnecoins: 0 };
    this.awardMedal(this.getActiveMedalId(), result);
    if (!this.activeRun().damageTaken) {
      this.awardMedal('immortal', result);
    }
    if (this.isStoryMode()) {
      this.activeStoryRun().medalEarned = true;
    }
    this.save(true);
    return result;
  }

  hasStoryMedal(): boolean {
    return this.medalCounts.story > 0;
  }

  hasRegnereisenMedal(): boolean {
    return OPERATION_MEDAL_IDS.some((id) => this.medalCounts[id] > 0);
  }

  getNextObjective(): string {
    if (this.isRegneriketActive()) {
      return this.getNextRegneriketObjective();
    }

    const pendingReward = LOCATIONS.find((location) => this.hasPendingReward(location.id));
    if (pendingReward) {
      return `Hent mynten til ${pendingReward.place}.`;
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

  collectReward(locationId: string): RewardResult | undefined {
    if (!this.activeRun().completed.has(locationId) || !isRewardLocation(locationId)) {
      return;
    }

    if (this.activeRun().collectedRewards.has(locationId)) {
      return;
    }

    this.activeRun().collectedRewards.add(locationId);
    const result: RewardResult = { medalIds: [], regnecoins: 0 };
    const location = LOCATIONS.find((candidate) => candidate.id === locationId);
    const reward = location ? BOSS_COIN_BASE_REWARD + location.order * 4 : BOSS_COIN_BASE_REWARD;
    this.addRegnecoins(reward, result);
    this.save(true);
    return result;
  }

  recordDamageTaken(): void {
    this.activeMapRun().damageTaken = true;
    this.save(false);
  }

  isRegneriketUnlocked(stopId: string): boolean {
    const stop = getRegneriketStopById(stopId);
    if (!stop) {
      return false;
    }

    if (stop.order === 1 || this.regneriket.unlocked.has(stopId) || this.regneriket.completed.has(stopId)) {
      return true;
    }

    return false;
  }

  canUnlockRegneriketStop(stopId: string): boolean {
    const stop = getRegneriketStopById(stopId);
    if (!stop || this.isRegneriketUnlocked(stopId) || this.regneriket.completed.has(stopId)) {
      return false;
    }

    if (stop.order === 1) {
      return false;
    }

    return this.getAvailableRegneriketUnlockCoinCount() > 0;
  }

  unlockRegneriketStop(stopId: string): boolean {
    if (!this.canUnlockRegneriketStop(stopId)) {
      return false;
    }

    const coin = this.getFirstAvailableRegneriketUnlockCoin();
    if (!coin) {
      return false;
    }

    this.regneriket.spentRewards.add(coin.id);
    this.regneriket.unlocked.add(stopId);
    this.save(true);
    return true;
  }

  isRegneriketCompleted(stopId: string): boolean {
    return this.regneriket.completed.has(stopId);
  }

  hasPendingRegneriketReward(stopId: string): boolean {
    return this.regneriket.completed.has(stopId) && !this.regneriket.collectedRewards.has(stopId);
  }

  getRegneriketCoinStatus(stopId: string): 'collected' | 'pending' | 'available' | 'locked' {
    if (this.regneriket.collectedRewards.has(stopId)) {
      return 'collected';
    }

    if (this.hasPendingRegneriketReward(stopId)) {
      return 'pending';
    }

    if (this.isRegneriketUnlocked(stopId)) {
      return 'available';
    }

    return 'locked';
  }

  completeRegneriketStop(stopId: string): void {
    if (!this.isRegneriketUnlocked(stopId)) {
      return;
    }

    this.regneriket.completed.add(stopId);
    this.regneriket.activePickupQuests.delete(stopId);
    this.save(true);
  }

  startRegneriketPickupQuest(stopId: string): void {
    if (!this.isRegneriketUnlocked(stopId) || this.regneriket.completed.has(stopId)) {
      return;
    }

    this.regneriket.activePickupQuests.add(stopId);
    this.ensurePickupItems(stopId);
    this.save(true);
  }

  isRegneriketPickupQuestActive(stopId: string): boolean {
    return this.regneriket.activePickupQuests.has(stopId);
  }

  getRegneriketPickupItems(stopId: string): string[] {
    return [...this.ensurePickupItems(stopId)];
  }

  isRegneriketPickupItemCollected(stopId: string, itemId: string): boolean {
    return this.ensurePickupItems(stopId).has(itemId);
  }

  collectRegneriketPickupItem(stopId: string, itemId: string): void {
    if (!this.regneriket.activePickupQuests.has(stopId) || this.regneriket.completed.has(stopId)) {
      return;
    }

    this.ensurePickupItems(stopId).add(itemId);
    this.save(true);
  }

  collectRegneriketReward(stopId: string): RewardResult | undefined {
    const stop = getRegneriketStopById(stopId);
    if (!stop || !this.hasPendingRegneriketReward(stopId)) {
      return undefined;
    }

    const result: RewardResult = { medalIds: [], regnecoins: 0 };
    this.regneriket.collectedRewards.add(stopId);
    this.evaluateRegneriketAchievements(result);
    if (this.isRegneriketJourneyComplete()
      && !this.regneriket.damageTaken
      && !this.regneriket.awardedMedals.has('immortal')) {
      this.regneriket.awardedMedals.add('immortal');
      this.awardMedal('immortal', result);
    }
    this.addRegnecoins(this.getRegneriketRewardCoinsFor(stop.regnecoins), result);
    this.save(true);
    return result;
  }

  awardTimedRegneriketMedal(elapsedSeconds: number): RewardResult {
    const result: RewardResult = { medalIds: [], regnecoins: 0 };
    const medalId: MedalId | undefined = elapsedSeconds < 10
      ? 'tidslop-gull'
      : elapsedSeconds < 15
        ? 'tidslop-solv'
        : elapsedSeconds < 20
          ? 'tidslop-bronse'
          : undefined;

    if (!medalId || this.regneriket.awardedMedals.has(medalId)) {
      return result;
    }

    this.regneriket.awardedMedals.add(medalId);
    this.awardMedal(medalId, result);
    this.save(true);
    return result;
  }

  setStoryLives(lives: number): void {
    this.activeStoryRun().lives = Math.max(0, Math.min(STORY_MAX_LIVES, lives));
    this.save(true);
  }

  failStoryMode(): void {
    this.replaceActiveStoryRun(createStoryProgress({ started: true }, this.settings.mapId));
    this.settings = {
      ...this.settings,
      started: true,
      playMode: 'story'
    };
    this.save(true);
  }

  reset(): void {
    if (this.isRegneriketActive()) {
      if (this.isStoryMode()) {
        this.regneriketStory = createStoryProgress({ started: true }, REGNERIKET_MAP_ID);
      } else {
        this.regneriketRuns[this.settings.difficulty] = createRunProgress({}, REGNERIKET_MAP_ID);
      }
      this.save(true);
      return;
    }

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
      this.regneriketRuns = createRegneriketProgressMap(parsed.regneriketRuns, parsed.regneriket, parsed.settings?.difficulty);
      this.regneriketStory = createRegneriketStoryProgress(parsed);
      this.medalCounts = createMedalCounts(parsed.medalCounts);
      this.regnecoins = Math.max(0, Math.floor(parsed.regnecoins ?? 0));
      this.totalRegnecoinsEarned = getStoredLifetimeRegnecoins(parsed);
      REGNECOIN_MEDAL_TIERS.forEach((tier) => {
        if (this.totalRegnecoinsEarned >= tier.threshold) {
          this.medalCounts[tier.id] = Math.max(1, this.medalCounts[tier.id]);
        }
      });
      this.purchasedTokens = new Set([DEFAULT_TOKEN_ID, ...(parsed.purchasedTokens ?? [])]);
      if (parsed.finalRewardCollected) {
        this.medalCounts[legacyMode] = Math.max(this.medalCounts[legacyMode], 1);
      }
      if (parsed.story?.medalEarned) {
        this.medalCounts.story = Math.max(this.medalCounts.story, 1);
      }
      this.settings = {
        ...DEFAULT_SETTINGS,
        ...parsed.settings,
        mapId: getGameMap(parsed.settings?.mapId ?? DEFAULT_SETTINGS.mapId).id
      };
      const selectedToken = getTokenById(this.settings.tokenId);
      if (selectedToken.id !== this.settings.tokenId || !this.isTokenUnlocked(selectedToken.id)) {
        this.settings.tokenId = DEFAULT_SETTINGS.tokenId;
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }

  private save(announce: boolean): void {
    const activeNormal = this.activeNormalRun();
    const activeStory = this.activeStoryRun();
    const snapshot: StoredProgress = {
      ...snapshotRun(activeNormal),
      version: STORAGE_VERSION,
      settings: this.settings,
      normalRuns: snapshotRunMap(this.normalRuns),
      storyRuns: snapshotStoryRunMap(this.storyRuns),
      regneriket: snapshotRun(this.regneriket),
      regneriketRuns: snapshotRegneriketRunMap(this.regneriketRuns),
      regneriketStory: snapshotStoryRun(this.regneriketStory),
      story: snapshotStoryRun(activeStory),
      regnecoins: this.regnecoins,
      totalRegnecoinsEarned: this.totalRegnecoinsEarned,
      purchasedTokens: [...this.purchasedTokens],
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

  private activeMapRun(): RunProgress {
    return this.isRegneriketActive() ? this.regneriket : this.activeRun();
  }

  private activeNormalRun(): RunProgress {
    return this.normalRuns[this.settings.operationMode];
  }

  private activeStoryRun(): StoryProgress {
    if (this.isRegneriketActive()) {
      return this.regneriketStory;
    }

    return this.storyRuns[this.settings.operationMode];
  }

  private ensurePickupItems(stopId: string): Set<string> {
    this.regneriket.pickupItems[stopId] ??= new Set<string>();
    return this.regneriket.pickupItems[stopId];
  }

  private replaceActiveStoryRun(progress: StoryProgress): void {
    if (this.isRegneriketActive()) {
      this.regneriketStory = progress;
      return;
    }

    this.storyRuns[this.settings.operationMode] = progress;
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

  private getFirstAvailableRegneriketUnlockCoin(): { id: string } | undefined {
    return REGNERIKET_STOPS.find((stop) => (
      this.regneriket.collectedRewards.has(stop.id)
      && !this.regneriket.spentRewards.has(stop.id)
    ));
  }

  private evaluateRegneriketAchievements(result: RewardResult): void {
    this.evaluateRegneriketAchievementsForRun(
      this.regneriket,
      this.settings.difficulty,
      this.isStoryMode(),
      result
    );
  }

  private evaluateRegneriketAchievementsForRun(
    run: RunProgress,
    difficulty: Difficulty,
    storyMode: boolean,
    result: RewardResult
  ): void {
    const hasCollected = (...ids: string[]) => ids.every((id) => run.collectedRewards.has(id));
    const noDamage = !run.damageTaken;
    const hardRun = difficulty === 'hard' && !storyMode;
    const normalOrHardRun = storyMode || difficulty === 'normal' || difficulty === 'hard';
    const collectedCount = run.collectedRewards.size;
    const candidates: Array<{ id: MedalId; eligible: boolean }> = [
      {
        id: 'skogvokter',
        eligible: noDamage
          && collectedCount >= 5
          && hasCollected('talltreportalen', 'regneenga', 'frostpasset', 'soppbiblioteket')
      },
      {
        id: 'krystallkode',
        eligible: normalOrHardRun
          && noDamage
          && collectedCount >= 5
          && hasCollected('krystallporten', 'klokkebyen', 'frostpasset')
      },
      {
        id: 'tidsmester',
        eligible: normalOrHardRun
          && noDamage
          && collectedCount >= 4
          && hasCollected('regneenga', 'krystallporten', 'klokkebyen')
      },
      {
        id: 'skybro',
        eligible: normalOrHardRun
          && noDamage
          && collectedCount >= 6
          && hasCollected('frostpasset', 'portalarkivet', 'skyhaven')
      },
      {
        id: 'havnemester',
        eligible: noDamage
          && collectedCount >= 6
          && hasCollected('klokkebyen', 'havneverkstedet')
      },
      {
        id: 'lavamester',
        eligible: hardRun
          && noDamage
          && collectedCount >= 8
          && hasCollected('krystallporten', 'havneverkstedet', 'lavaakademiet')
      },
      {
        id: this.getRegneriketCompletionMedalId(difficulty, storyMode),
        eligible: this.isRegneriketJourneyComplete(run)
      }
    ];

    for (const medal of candidates) {
      if (!medal.eligible || run.awardedMedals.has(medal.id)) {
        continue;
      }

      run.awardedMedals.add(medal.id);
      this.awardMedal(medal.id, result);
    }
  }

  private restoreEarnedRegneriketAchievements(): void {
    const restored: RewardResult = { medalIds: [], regnecoins: 0 };
    for (const option of DIFFICULTY_OPTIONS) {
      this.evaluateRegneriketAchievementsForRun(this.regneriketRuns[option.id], option.id, false, restored);
    }
    this.evaluateRegneriketAchievementsForRun(this.regneriketStory, 'normal', true, restored);
    if (restored.medalIds.length > 0) {
      this.save(false);
    }
  }

  private getRegneriketCompletionMedalId(
    difficulty: Difficulty = this.settings.difficulty,
    storyMode: boolean = this.isStoryMode()
  ): MedalId {
    if (storyMode) {
      return 'story';
    }

    if (difficulty === 'hard') {
      return 'regneriket-hard';
    }

    if (difficulty === 'normal') {
      return 'regneriket-normal';
    }

    return 'regneriket';
  }

  private isRegneriketJourneyComplete(run: RunProgress = this.regneriket): boolean {
    return REGNERIKET_STOPS.every((stop) => run.collectedRewards.has(stop.id));
  }

  private getRegneriketRewardCoinsFor(baseReward: number): number {
    const difficulty = this.isStoryMode() ? 'normal' : this.settings.difficulty;
    const multiplier = difficulty === 'hard' ? 1.2 : difficulty === 'normal' ? 1.1 : 1;
    return Math.round(baseReward * multiplier);
  }

  private resetPlayerToActiveMapStart(): void {
    const map = getGameMap(this.settings.mapId);
    this.activeMapRun().playerPosition = { x: map.startX, y: map.startY };
  }

  private isRegneriketActive(): boolean {
    return this.settings.mapId === REGNERIKET_MAP_ID;
  }

  private getNextRegneriketObjective(): string {
    const pendingReward = REGNERIKET_STOPS.find((stop) => this.hasPendingRegneriketReward(stop.id));
    if (pendingReward) {
      return `Hent mynten til ${pendingReward.place}.`;
    }

    const nextOpen = REGNERIKET_STOPS.find((stop) => !this.regneriket.completed.has(stop.id) && this.isRegneriketUnlocked(stop.id));
    if (nextOpen) {
      return `Neste oppdrag: ${nextOpen.place}. ${nextOpen.title}.`;
    }

    if (REGNERIKET_STOPS.every((stop) => this.regneriket.collectedRewards.has(stop.id))) {
      return 'Regneriket er fullført. Utforsk fritt eller prøv et annet kart.';
    }

    if (this.getAvailableRegneriketUnlockCoinCount() > 0
      && REGNERIKET_STOPS.some((stop) => this.canUnlockRegneriketStop(stop.id))) {
      return 'Velg et låst sted i Regneriket og bruk en mynt for å åpne oppdraget.';
    }

    return 'Fullfør åpne oppdrag, hent myntene og la nye stier åpne seg.';
  }

  private awardMedal(medalId: MedalId, result: RewardResult): void {
    this.medalCounts[medalId] += 1;
    result.medalIds.push(medalId);
    this.addRegnecoins(MEDAL_REGNECOIN_REWARD, result);
  }

  private addRegnecoins(amount: number, result: RewardResult): void {
    if (amount <= 0) {
      return;
    }

    this.regnecoins += amount;
    this.totalRegnecoinsEarned += amount;
    result.regnecoins += amount;

    for (const tier of REGNECOIN_MEDAL_TIERS) {
      if (this.totalRegnecoinsEarned < tier.threshold || this.medalCounts[tier.id] > 0) {
        continue;
      }

      this.medalCounts[tier.id] = 1;
      result.medalIds.push(tier.id);
      this.regnecoins += MEDAL_REGNECOIN_REWARD;
      this.totalRegnecoinsEarned += MEDAL_REGNECOIN_REWARD;
      result.regnecoins += MEDAL_REGNECOIN_REWARD;
    }
  }
}

function createRunProgress(saved: StoredRunProgress = {}, mapId: string = DEFAULT_MAP_ID): RunProgress {
  const startMap = getGameMap(mapId);
  const completed = new Set(saved.completed ?? []);
  const collectedRewards = new Set(saved.collectedRewards ?? []);
  const unlocked = new Set(saved.unlocked ?? getLegacyUnlocked(completed, collectedRewards));

  return {
    completed,
    collectedRewards,
    spentRewards: new Set(saved.spentRewards ?? []),
    unlocked,
    awardedMedals: new Set(saved.awardedMedals ?? []),
    finalRewardCollected: saved.finalRewardCollected ?? false,
    playerPosition: saved.player ? { ...saved.player } : { x: startMap.startX, y: startMap.startY },
    damageTaken: saved.damageTaken ?? false,
    pickupItems: Object.fromEntries(
      Object.entries(saved.pickupItems ?? {}).map(([stopId, itemIds]) => [stopId, new Set(itemIds)])
    ),
    activePickupQuests: new Set(saved.activePickupQuests ?? [])
  };
}

function createStoryProgress(saved: StoredStoryProgress = {}, mapId: string = DEFAULT_MAP_ID): StoryProgress {
  return {
    ...createRunProgress(saved, mapId),
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

function createRegneriketProgressMap(
  saved?: Partial<Record<Difficulty, StoredRunProgress>>,
  legacy?: StoredRunProgress,
  legacyDifficulty: Difficulty = DEFAULT_SETTINGS.difficulty
): Record<Difficulty, RunProgress> {
  return DIFFICULTY_OPTIONS.reduce((runs, option) => {
    runs[option.id] = createRunProgress(saved?.[option.id] ?? (option.id === legacyDifficulty ? legacy : undefined), REGNERIKET_MAP_ID);
    return runs;
  }, {} as Record<Difficulty, RunProgress>);
}

function createRegneriketStoryProgress(saved: StoredProgress): StoryProgress {
  if (saved.regneriketStory) {
    return createStoryProgress(saved.regneriketStory, REGNERIKET_MAP_ID);
  }

  const settings = { ...DEFAULT_SETTINGS, ...saved.settings };
  if (settings.mapId !== REGNERIKET_MAP_ID || settings.playMode !== 'story') {
    return createStoryProgress({}, REGNERIKET_MAP_ID);
  }

  const legacyRun = saved.regneriketRuns?.[settings.difficulty] ?? saved.regneriket;
  const legacyStory = saved.storyRuns?.[settings.operationMode] ?? saved.story;
  return createStoryProgress({
    ...legacyRun,
    lives: legacyStory?.lives,
    started: legacyStory?.started ?? true,
    medalEarned: legacyStory?.medalEarned
  }, REGNERIKET_MAP_ID);
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
    awardedMedals: [...run.awardedMedals],
    finalRewardCollected: run.finalRewardCollected,
    player: run.playerPosition,
    damageTaken: run.damageTaken,
    pickupItems: Object.fromEntries(
      Object.entries(run.pickupItems).map(([stopId, itemIds]) => [stopId, [...itemIds]])
    ),
    activePickupQuests: [...run.activePickupQuests]
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

function snapshotRegneriketRunMap(runs: Record<Difficulty, RunProgress>): Partial<Record<Difficulty, StoredRunProgress>> {
  return DIFFICULTY_OPTIONS.reduce((snapshot, option) => {
    snapshot[option.id] = snapshotRun(runs[option.id]);
    return snapshot;
  }, {} as Partial<Record<Difficulty, StoredRunProgress>>);
}

function getLegacyMode(mode?: OperationMode): OperationMode {
  return mode && OPERATION_MEDAL_IDS.includes(mode) ? mode : DEFAULT_SETTINGS.operationMode;
}

function getStoredLifetimeRegnecoins(saved: StoredProgress): number {
  const balance = Math.max(0, Math.floor(saved.regnecoins ?? 0));
  const purchases = (saved.purchasedTokens ?? []).reduce((total, tokenId) => total + getTokenById(tokenId).cost, 0);
  const reachedThreshold = REGNECOIN_MEDAL_TIERS.reduce((highest, tier) => (
    (saved.medalCounts?.[tier.id] ?? 0) > 0 ? Math.max(highest, tier.threshold) : highest
  ), 0);

  return Math.max(
    0,
    Math.floor(saved.totalRegnecoinsEarned ?? 0),
    balance + purchases,
    reachedThreshold
  );
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
