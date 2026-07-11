import { LOCATIONS, type LocationNode } from '../game/content/locations';
import { GAME_MAPS, getGameMap, type GameMapId } from '../game/content/maps';
import { getMedal, MEDALS, type MedalId } from '../game/content/medals';
import { getTokenById, PLAYER_TOKENS } from '../game/content/playerTokens';
import { REGNERIKET_STOPS, type RegneriketStop } from '../game/content/regneriket';
import { DIFFICULTY_OPTIONS, OPERATION_OPTIONS, type Difficulty, type OperationMode } from '../game/content/settings';
import { answerQuestion, createBattle, getBossAttackName, type BattleState } from '../game/simulation/battle';
import type { ProgressStore, RewardResult } from '../game/simulation/progress';
import { answerRegneriketQuestion, createRegneriketQuest, type RegneriketQuestState } from '../game/simulation/regneriketQuest';

type HudElementRoot = Document | ShadowRoot;

let hudElementRoot: HudElementRoot = document;

export function setHudElementRoot(root: HudElementRoot): void {
  hudElementRoot = root;
}

type WorldHooks = {
  startBattle: () => void;
  resetProgress: () => void;
  resetPlayerToProgress: () => void;
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

export class HudController {
  private hooks?: WorldHooks;
  private nearby?: LocationNode;
  private battle?: BattleState;
  private quest?: RegneriketQuestState;
  private winCallback?: () => void;
  private questWinCallback?: () => void;
  private questSuccessToast: string | false = 'Oppdrag fullført! Hent mynten på kartet.';
  private toastTimer?: number;
  private battleEffectTimer?: number;
  private battleSecondFrameTimer?: number;
  private questEffectTimer?: number;
  private battleInputLocked = false;
  private questInputLocked = false;
  private startManuallyOpened = false;
  private previewTokenId?: string;
  private previewTokenSource: 'picker' | 'shop' = 'picker';
  private unlockConfirmCallback?: () => void;
  private pendingMapSettings?: PendingMapSettings;
  private lastNearbyActionAt = 0;
  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      this.closeResetConfirm();
      this.closePrizeBox();
      this.closeMedalCabinet();
      this.closeReward();
      this.closeTokenPicker();
      this.closeShop();
      this.closeTokenPreview();
      this.closeQuest();
      this.closeStoryConfirm();
      this.closeMapSettings();
      this.closeUnlockConfirm();
    }
  };

  private readonly objective = requireElement<HTMLDivElement>('objective');
  private readonly nearbyCard = requireElement<HTMLDivElement>('nearby-card');
  private readonly progressStrip = requireElement<HTMLDivElement>('progress-strip');
  private readonly coinCount = requireElement<HTMLSpanElement>('coin-count');
  private readonly regnecoinCount = requireElement<HTMLSpanElement>('regnecoin-count');
  private readonly prizeBoxModal = requireElement<HTMLElement>('prize-box-modal');
  private readonly prizeBoxList = requireElement<HTMLDivElement>('prize-box-list');
  private readonly medalCabinetModal = requireElement<HTMLElement>('medal-cabinet-modal');
  private readonly medalCabinetList = requireElement<HTMLDivElement>('medal-cabinet-list');
  private readonly toast = requireElement<HTMLDivElement>('toast');
  private readonly startScreen = requireElement<HTMLElement>('start-screen');
  private readonly tokenPickerModal = requireElement<HTMLElement>('token-picker-modal');
  private readonly shopModal = requireElement<HTMLElement>('shop-modal');
  private readonly shopGrid = requireElement<HTMLDivElement>('shop-grid');
  private readonly shopRegnecoinCount = requireElement<HTMLSpanElement>('shop-regnecoin-count');
  private readonly selectedTokenImage = requireElement<HTMLImageElement>('selected-token-image');
  private readonly selectedTokenName = requireElement<HTMLElement>('selected-token-name');
  private readonly tokenPicker = requireElement<HTMLDivElement>('token-picker');
  private readonly mapPicker = requireElement<HTMLDivElement>('map-picker');
  private readonly mapSettingsModal = requireElement<HTMLElement>('map-settings-modal');
  private readonly mapSettingsTitle = requireElement<HTMLHeadingElement>('map-settings-title');
  private readonly mapSettingsCopy = requireElement<HTMLParagraphElement>('map-settings-copy');
  private readonly mapSettingsOperationBlock = requireElement<HTMLDivElement>('map-settings-operation-block');
  private readonly operationPicker = requireElement<HTMLDivElement>('map-settings-operation-picker');
  private readonly difficultyPicker = requireElement<HTMLDivElement>('map-settings-difficulty-picker');
  private readonly storyModeButton = requireElement<HTMLButtonElement>('story-mode');
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
  private readonly questPlace = requireElement<HTMLParagraphElement>('quest-place');
  private readonly questTask = requireElement<HTMLHeadingElement>('quest-task');
  private readonly questProgress = requireElement<HTMLDivElement>('quest-progress');
  private readonly questHearts = requireElement<HTMLDivElement>('quest-hearts');
  private readonly questQuestionText = requireElement<HTMLParagraphElement>('quest-question-text');
  private readonly questChoiceGrid = requireElement<HTMLDivElement>('quest-choice-grid');
  private readonly questMessage = requireElement<HTMLParagraphElement>('quest-message');
  private readonly retryQuest = requireElement<HTMLButtonElement>('retry-quest');
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
    requireElement<HTMLButtonElement>('close-battle').addEventListener('click', () => this.closeBattle());
    requireElement<HTMLButtonElement>('close-quest').addEventListener('click', () => this.closeQuest());
    requireElement<HTMLButtonElement>('reset-progress').addEventListener('click', () => this.openResetConfirm());
    requireElement<HTMLButtonElement>('cancel-reset').addEventListener('click', () => this.closeResetConfirm());
    requireElement<HTMLButtonElement>('confirm-reset').addEventListener('click', () => {
      this.hooks?.resetProgress();
      this.closeResetConfirm();
    });
    requireElement<HTMLButtonElement>('open-start').addEventListener('click', () => this.openStartScreen());
    requireElement<HTMLButtonElement>('open-token-picker').addEventListener('click', () => this.openTokenPicker());
    requireElement<HTMLButtonElement>('close-token-picker').addEventListener('click', () => this.closeTokenPicker());
    requireElement<HTMLButtonElement>('open-shop').addEventListener('click', () => this.openShop());
    requireElement<HTMLButtonElement>('close-shop').addEventListener('click', () => this.closeShop());
    requireElement<HTMLButtonElement>('open-prize-box').addEventListener('click', () => this.openPrizeBox());
    requireElement<HTMLButtonElement>('close-prize-box').addEventListener('click', () => this.closePrizeBox());
    requireElement<HTMLButtonElement>('open-medal-cabinet').addEventListener('click', () => this.openMedalCabinet());
    requireElement<HTMLButtonElement>('close-medal-cabinet').addEventListener('click', () => this.closeMedalCabinet());
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
    requireElement<HTMLButtonElement>('start-game').addEventListener('click', () => {
      this.progress.startNormalMode();
      this.hooks?.resetPlayerToProgress();
      this.closeTokenPreview();
      this.closeTokenPicker();
      this.closeShop();
      this.closeMapSettings();
      this.closeStartScreen();
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
      if (event.target === this.unlockConfirm) {
        this.closeUnlockConfirm();
      }
    });
    this.prizeBoxModal.addEventListener('click', (event) => {
      if (event.target === this.prizeBoxModal) {
        this.closePrizeBox();
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
    this.retryBattle.addEventListener('click', () => {
      if (this.battle) {
        if (this.battle.settings.playMode === 'story' && this.battle.status === 'lost') {
          this.closeBattle();
          this.hooks?.resetPlayerToProgress();
          return;
        }
        this.openBattle(this.battle.location, this.winCallback ?? (() => undefined));
      }
    });
    this.retryQuest.addEventListener('click', () => {
      if (this.quest) {
        this.openRegneriketQuest(this.quest.stop, this.questWinCallback ?? (() => undefined), this.questSuccessToast);
      }
    });
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
    this.progress.addEventListener('change', () => {
      this.renderProgress();
      this.renderStartControls();
      this.renderPrizeBox();
      this.renderMedalCabinet();
      this.syncStartVisibility();
    });
    this.renderStartControls();
    this.renderMedalCabinet();
    this.syncStartVisibility();
  }

  bindWorld(hooks: WorldHooks): void {
    this.hooks = hooks;
  }

  openEntryScreen(): void {
    this.openStartScreen();
  }

  destroy(): void {
    document.removeEventListener('keydown', this.handleKeyDown);
    this.clearBattleTimers();
    this.clearQuestTimers();
    if (this.toastTimer) {
      window.clearTimeout(this.toastTimer);
      this.toastTimer = undefined;
    }
  }

  isBattleOpen(): boolean {
    return !this.modal.classList.contains('is-hidden');
  }

  isQuestOpen(): boolean {
    return !this.questModal.classList.contains('is-hidden');
  }

  isWorldBlocked(): boolean {
    return this.isBattleOpen()
      || this.isQuestOpen()
      || !this.startScreen.classList.contains('is-hidden')
      || !this.resetConfirm.classList.contains('is-hidden')
      || !this.prizeBoxModal.classList.contains('is-hidden')
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
    this.objective.textContent = this.progress.getNextObjective();
    this.coinCount.textContent = `${this.progress.getCollectedCoinCount()}/${this.progress.getTotalCoinCount()}`;
    this.regnecoinCount.textContent = String(this.progress.getRegnecoins());
    this.shopRegnecoinCount.textContent = String(this.progress.getRegnecoins());
    this.progressStrip.classList.toggle('is-hidden', !activeMap.showBossJourney);
    if (!activeMap.showBossJourney) {
      this.progressStrip.innerHTML = '';
      this.setNearby(undefined);
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

    this.quest = createRegneriketQuest(stop, this.progress.getSettings(), this.progress.getBattleHearts());
    this.questWinCallback = onWin;
    this.questSuccessToast = successToast;
    this.clearQuestTimers();
    this.questModal.classList.remove('is-hidden');
    this.retryQuest.classList.add('is-hidden');
    this.renderQuest();
  }

  openUnlockConfirm(location: LocationNode, onConfirm: () => void): void {
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
    const coins = this.progress.getAvailableRegneriketUnlockCoinCount();
    this.unlockConfirmCallback = onConfirm;
    this.unlockTitle.textContent = `Lås opp ${stop.place}?`;
    this.unlockCopy.textContent = `Bruk 1 mynt for å åpne oppdraget "${stop.title}". Du har ${coins} mynt${coins === 1 ? '' : 'er'} som kan brukes.`;
    this.unlockConfirm.classList.remove('is-hidden');
  }

  openInfoConfirm(title: string, copy: string, confirmText: string, onConfirm: () => void, cancelText = 'Tilbake'): void {
    this.unlockConfirmCallback = onConfirm;
    this.unlockTitle.textContent = title;
    this.unlockCopy.textContent = copy;
    this.cancelUnlock.textContent = cancelText;
    this.confirmUnlockButton.textContent = confirmText;
    this.unlockConfirm.classList.remove('is-hidden');
  }

  private confirmUnlock(): void {
    const callback = this.unlockConfirmCallback;
    this.closeUnlockConfirm();
    callback?.();
  }

  private openTokenPicker(): void {
    this.closeTokenPreview();
    this.renderStartControls();
    this.tokenPickerModal.classList.remove('is-hidden');
  }

  private closeTokenPicker(): void {
    this.tokenPickerModal.classList.add('is-hidden');
  }

  private openShop(): void {
    this.closeTokenPreview();
    this.renderStartControls();
    this.shopModal.classList.remove('is-hidden');
  }

  private closeShop(): void {
    this.shopModal.classList.add('is-hidden');
  }

  private openPrizeBox(): void {
    this.renderPrizeBox();
    this.prizeBoxModal.classList.remove('is-hidden');
  }

  private openMedalCabinet(): void {
    this.renderMedalCabinet();
    this.medalCabinetModal.classList.remove('is-hidden');
  }

  private openStoryConfirm(): void {
    this.closeTokenPreview();
    this.closeTokenPicker();
    this.storyConfirm.classList.remove('is-hidden');
  }

  private closeStoryConfirm(): void {
    this.storyConfirm.classList.add('is-hidden');
  }

  private openMapSettings(mapId: GameMapId): void {
    const settings = this.progress.getSettings();
    this.pendingMapSettings = {
      mapId,
      operationMode: settings.operationMode,
      difficulty: settings.difficulty
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
      operationMode: map.showBossJourney ? this.pendingMapSettings.operationMode : 'mixed',
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
    this.mapSettingsTitle.textContent = map.label;
    this.mapSettingsCopy.textContent = map.showBossJourney
      ? 'Velg regneart og vanskelighetsgrad for denne Boss-reisen.'
      : 'Velg vanskelighetsgrad for Regneriket. Den styrer både hjerter og oppgavenivå.';
    this.mapSettingsOperationBlock.classList.toggle('is-hidden', !map.showBossJourney);
    this.operationPicker.innerHTML = OPERATION_OPTIONS.map((option) => `
      <button class="${this.pendingMapSettings!.operationMode === option.id ? 'is-selected' : ''} ${option.shortLabel ? '' : 'is-symbol-free'}" type="button" data-operation-id="${option.id}">
        ${option.shortLabel ? `<strong>${option.shortLabel}</strong>` : ''}
        <span>${option.label}</span>
      </button>
    `).join('');
    this.difficultyPicker.innerHTML = DIFFICULTY_OPTIONS.map((option) => `
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

  private closeUnlockConfirm(): void {
    this.unlockConfirm.classList.add('is-hidden');
    this.unlockConfirmCallback = undefined;
    this.cancelUnlock.textContent = 'Avbryt';
    this.confirmUnlockButton.textContent = 'Bruk mynt';
  }

  private closePrizeBox(): void {
    this.prizeBoxModal.classList.add('is-hidden');
  }

  private closeMedalCabinet(): void {
    this.medalCabinetModal.classList.add('is-hidden');
  }

  private renderPrizeBox(): void {
    const statusText: Record<string, string> = {
      collected: 'Hentet',
      pending: 'Mynt venter',
      available: 'Klar',
      locked: 'Ikke hentet'
    };
    const activeMap = getGameMap(this.progress.getSettings().mapId);
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
    this.questKind.textContent = this.getQuestKindLabel(stop.kind);
    this.questTitle.textContent = stop.place;
    this.questCopy.textContent = stop.description;
    this.questPlace.textContent = 'Regneriket';
    this.questTask.textContent = stop.title;
    this.questProgress.innerHTML = Array.from({ length: this.quest.requiredCorrect }, (_, index) => (
      `<span class="${index < this.quest!.correct ? 'is-filled' : ''}"></span>`
    )).join('');
    this.questHearts.innerHTML = Array.from(
      { length: this.quest.maxPlayerHp },
      (_, index) => `<span class="heart ${index < this.quest!.playerHp ? 'is-live' : 'is-lost'}" aria-hidden="true">❤️</span>`
    ).join('');
    this.questQuestionText.textContent = this.quest.status === 'active' ? this.quest.question.prompt : '';
    this.questMessage.textContent = this.quest.message;
    this.questChoiceGrid.innerHTML = '';

    if (this.quest.status !== 'active') {
      this.retryQuest.classList.toggle('is-hidden', this.quest.status !== 'lost');
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
    this.quest = answerRegneriketQuestion(this.quest, choice);
    if (!this.quest.lastAnswerCorrect) {
      this.questInputLocked = true;
      this.questShell.classList.add('is-player-hit');
      this.progress.recordDamageTaken();
      if (this.quest.settings.playMode === 'story') {
        if (this.quest.status === 'lost') {
          this.progress.failStoryMode();
          this.hooks?.resetPlayerToProgress();
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
      return;
    }

    if (this.quest.status === 'won') {
      const callback = this.questWinCallback;
      const successToast = this.questSuccessToast;
      if (successToast === false) {
        this.closeQuest();
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

  private closeQuest(): void {
    this.clearQuestTimers();
    this.questModal.classList.add('is-hidden');
    this.quest = undefined;
    this.questWinCallback = undefined;
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
      (_, index) => `<span class="heart ${index < this.battle!.playerHp ? 'is-live' : 'is-lost'}" aria-hidden="true">❤️</span>`
    ).join('');
    this.renderSuperMeter();
    this.questionText.textContent = this.battle.status === 'active' ? `${this.battle.question.prompt} = ?` : '';
    this.battleMessage.textContent = this.battle.message;
    this.choiceGrid.innerHTML = '';

    if (this.battle.status !== 'active') {
      this.retryBattle.textContent = this.battle.status === 'lost' && this.battle.settings.playMode === 'story'
        ? 'Til start'
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
        this.progress.failStoryMode();
        this.hooks?.resetPlayerToProgress();
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
    this.storyModeButton.innerHTML = `
      <strong>Story mode</strong>
      <em>${this.progress.getStoryLives()}/${3} liv igjen</em>
    `;
    this.mapPicker.innerHTML = GAME_MAPS.map((map) => `
      <button class="map-choice ${settings.mapId === map.id ? 'is-selected' : ''}" type="button" data-map-id="${map.id}">
        <strong>${map.label}</strong>
        <span>${map.description}</span>
      </button>
    `).join('');
    this.shopRegnecoinCount.textContent = String(this.progress.getRegnecoins());
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
    this.mapPicker.querySelectorAll<HTMLButtonElement>('[data-map-id]').forEach((button) => {
      button.addEventListener('click', () => this.openMapSettings(button.dataset.mapId! as GameMapId));
    });
  }

  private openStartScreen(): void {
    this.renderStartControls();
    this.closeResetConfirm();
    this.startManuallyOpened = true;
    this.startScreen.classList.remove('is-hidden');
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
