import { LOCATIONS, type LocationNode } from '../game/content/locations';
import { getMedal, MEDALS } from '../game/content/medals';
import { PLAYER_TOKENS } from '../game/content/playerTokens';
import { DIFFICULTY_OPTIONS, OPERATION_OPTIONS, type Difficulty, type OperationMode } from '../game/content/settings';
import { answerQuestion, createBattle, getBossAttackName, type BattleState } from '../game/simulation/battle';
import type { ProgressStore } from '../game/simulation/progress';

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

export class HudController {
  private hooks?: WorldHooks;
  private nearby?: LocationNode;
  private battle?: BattleState;
  private winCallback?: () => void;
  private toastTimer?: number;
  private battleEffectTimer?: number;
  private battleSecondFrameTimer?: number;
  private battleInputLocked = false;
  private startManuallyOpened = false;
  private previewTokenId?: string;
  private unlockConfirmCallback?: () => void;
  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      this.closeResetConfirm();
      this.closePrizeBox();
      this.closeMedalCabinet();
      this.closeReward();
      this.closeTokenPreview();
      this.closeStoryConfirm();
      this.closeUnlockConfirm();
    }
  };

  private readonly objective = requireElement<HTMLDivElement>('objective');
  private readonly nearbyCard = requireElement<HTMLDivElement>('nearby-card');
  private readonly progressStrip = requireElement<HTMLDivElement>('progress-strip');
  private readonly coinCount = requireElement<HTMLSpanElement>('coin-count');
  private readonly prizeBoxModal = requireElement<HTMLElement>('prize-box-modal');
  private readonly prizeBoxList = requireElement<HTMLDivElement>('prize-box-list');
  private readonly medalCabinetModal = requireElement<HTMLElement>('medal-cabinet-modal');
  private readonly medalCabinetList = requireElement<HTMLDivElement>('medal-cabinet-list');
  private readonly toast = requireElement<HTMLDivElement>('toast');
  private readonly startScreen = requireElement<HTMLElement>('start-screen');
  private readonly tokenPicker = requireElement<HTMLDivElement>('token-picker');
  private readonly operationPicker = requireElement<HTMLDivElement>('operation-picker');
  private readonly difficultyPicker = requireElement<HTMLDivElement>('difficulty-picker');
  private readonly storyModeButton = requireElement<HTMLButtonElement>('story-mode');
  private readonly tokenPreview = requireElement<HTMLElement>('token-preview');
  private readonly tokenPreviewImage = requireElement<HTMLImageElement>('token-preview-image');
  private readonly tokenPreviewTitle = requireElement<HTMLHeadingElement>('token-preview-title');
  private readonly tokenPreviewName = requireElement<HTMLParagraphElement>('token-preview-name');
  private readonly storyConfirm = requireElement<HTMLElement>('story-confirm');
  private readonly unlockConfirm = requireElement<HTMLElement>('unlock-confirm');
  private readonly unlockTitle = requireElement<HTMLHeadingElement>('unlock-title');
  private readonly unlockCopy = requireElement<HTMLParagraphElement>('unlock-copy');
  private readonly rewardModal = requireElement<HTMLElement>('reward-modal');
  private readonly rewardMedal = requireElement<HTMLImageElement>('reward-medal');
  private readonly rewardKicker = requireElement<HTMLParagraphElement>('reward-kicker');
  private readonly rewardTitle = requireElement<HTMLHeadingElement>('reward-title');
  private readonly rewardCopy = requireElement<HTMLParagraphElement>('reward-copy');
  private readonly resetConfirm = requireElement<HTMLElement>('reset-confirm');
  private readonly modal = requireElement<HTMLElement>('battle-modal');
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
    requireElement<HTMLButtonElement>('reset-progress').addEventListener('click', () => this.openResetConfirm());
    requireElement<HTMLButtonElement>('cancel-reset').addEventListener('click', () => this.closeResetConfirm());
    requireElement<HTMLButtonElement>('confirm-reset').addEventListener('click', () => {
      this.hooks?.resetProgress();
      this.closeResetConfirm();
    });
    requireElement<HTMLButtonElement>('open-start').addEventListener('click', () => this.openStartScreen());
    requireElement<HTMLButtonElement>('open-prize-box').addEventListener('click', () => this.openPrizeBox());
    requireElement<HTMLButtonElement>('close-prize-box').addEventListener('click', () => this.closePrizeBox());
    requireElement<HTMLButtonElement>('open-medal-cabinet').addEventListener('click', () => this.openMedalCabinet());
    requireElement<HTMLButtonElement>('close-medal-cabinet').addEventListener('click', () => this.closeMedalCabinet());
    requireElement<HTMLButtonElement>('back-to-regnemester').addEventListener('click', () => this.goBackToRegnemester());
    requireElement<HTMLButtonElement>('close-reward').addEventListener('click', () => this.closeReward());
    requireElement<HTMLButtonElement>('cancel-story').addEventListener('click', () => this.closeStoryConfirm());
    requireElement<HTMLButtonElement>('confirm-story').addEventListener('click', () => this.startStoryMode());
    requireElement<HTMLButtonElement>('cancel-unlock').addEventListener('click', () => this.closeUnlockConfirm());
    requireElement<HTMLButtonElement>('confirm-unlock').addEventListener('click', () => this.confirmUnlock());
    requireElement<HTMLButtonElement>('close-token-preview').addEventListener('click', () => this.closeTokenPreview());
    requireElement<HTMLButtonElement>('back-token-preview').addEventListener('click', () => this.closeTokenPreview());
    requireElement<HTMLButtonElement>('choose-token-preview').addEventListener('click', () => this.choosePreviewToken());
    requireElement<HTMLButtonElement>('start-game').addEventListener('click', () => {
      this.progress.startNormalMode();
      this.hooks?.resetPlayerToProgress();
      this.closeTokenPreview();
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
    this.nearbyCard.addEventListener('click', () => this.hooks?.startBattle());
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
    if (this.toastTimer) {
      window.clearTimeout(this.toastTimer);
      this.toastTimer = undefined;
    }
  }

  isBattleOpen(): boolean {
    return !this.modal.classList.contains('is-hidden');
  }

  isWorldBlocked(): boolean {
    return this.isBattleOpen()
      || !this.startScreen.classList.contains('is-hidden')
      || !this.resetConfirm.classList.contains('is-hidden')
      || !this.prizeBoxModal.classList.contains('is-hidden')
      || !this.medalCabinetModal.classList.contains('is-hidden')
      || !this.rewardModal.classList.contains('is-hidden')
      || !this.tokenPreview.classList.contains('is-hidden')
      || !this.storyConfirm.classList.contains('is-hidden')
      || !this.unlockConfirm.classList.contains('is-hidden');
  }

  setNearby(location: LocationNode | undefined): void {
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

  renderProgress(): void {
    this.objective.textContent = this.progress.getNextObjective();
    this.coinCount.textContent = `${this.progress.getCollectedCoinCount()}/${this.progress.getTotalCoinCount()}`;
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

  openJourneyReward(): void {
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

  openUnlockConfirm(location: LocationNode, onConfirm: () => void): void {
    this.unlockConfirmCallback = onConfirm;
    this.unlockTitle.textContent = `Lås opp ${location.place}?`;
    this.unlockCopy.textContent = `Bruk 1 mynt for å åpne kampen mot ${location.bossName}. Du har ${this.progress.getAvailableUnlockCoinCount()} mynt${this.progress.getAvailableUnlockCoinCount() === 1 ? '' : 'er'} som kan brukes.`;
    this.unlockConfirm.classList.remove('is-hidden');
  }

  private confirmUnlock(): void {
    const callback = this.unlockConfirmCallback;
    this.closeUnlockConfirm();
    callback?.();
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
    this.storyConfirm.classList.remove('is-hidden');
  }

  private closeStoryConfirm(): void {
    this.storyConfirm.classList.add('is-hidden');
  }

  private startStoryMode(): void {
    this.progress.startStoryMode();
    this.hooks?.resetPlayerToProgress();
    this.closeStoryConfirm();
    this.closeTokenPreview();
    this.closeStartScreen();
  }

  private closeUnlockConfirm(): void {
    this.unlockConfirm.classList.add('is-hidden');
    this.unlockConfirmCallback = undefined;
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

  private openTokenPreview(tokenId: string): void {
    const token = PLAYER_TOKENS.find((candidate) => candidate.id === tokenId) ?? PLAYER_TOKENS[0];
    this.previewTokenId = token.id;
    this.tokenPreviewImage.src = token.src;
    this.tokenPreviewImage.alt = token.label;
    this.tokenPreviewTitle.textContent = token.label;
    this.tokenPreviewName.textContent = 'Se spillbrikken i stor størrelse før du velger.';
    this.tokenPreview.classList.remove('is-hidden');
  }

  private closeTokenPreview(): void {
    this.tokenPreview.classList.add('is-hidden');
    this.previewTokenId = undefined;
  }

  private choosePreviewToken(): void {
    if (!this.previewTokenId) {
      return;
    }

    this.progress.updateSettings({ tokenId: this.previewTokenId });
    this.closeTokenPreview();
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
    this.storyModeButton.classList.toggle('is-active', settings.playMode === 'story');
    this.storyModeButton.innerHTML = `
      <strong>Story mode</strong>
      <em>${this.progress.getStoryLives()}/${3} liv igjen</em>
    `;
    this.tokenPicker.innerHTML = PLAYER_TOKENS.map((token) => `
      <button class="token-choice ${settings.tokenId === token.id ? 'is-selected' : ''}" type="button" data-token-id="${token.id}" aria-label="${token.label}">
        <img src="${token.src}" alt="" />
        <span>${token.label}</span>
      </button>
    `).join('');
    this.operationPicker.innerHTML = OPERATION_OPTIONS.map((option) => `
      <button class="${settings.operationMode === option.id ? 'is-selected' : ''} ${option.shortLabel ? '' : 'is-symbol-free'}" type="button" data-operation-id="${option.id}">
        ${option.shortLabel ? `<strong>${option.shortLabel}</strong>` : ''}
        <span>${option.label}</span>
      </button>
    `).join('');
    this.difficultyPicker.innerHTML = DIFFICULTY_OPTIONS.map((option) => `
      <button class="${settings.difficulty === option.id ? 'is-selected' : ''}" type="button" data-difficulty-id="${option.id}">
        ${option.label}
      </button>
    `).join('');

    this.tokenPicker.querySelectorAll<HTMLButtonElement>('[data-token-id]').forEach((button) => {
      button.addEventListener('click', () => this.openTokenPreview(button.dataset.tokenId!));
    });
    this.operationPicker.querySelectorAll<HTMLButtonElement>('[data-operation-id]').forEach((button) => {
      button.addEventListener('click', () => {
        this.progress.updateSettings({ operationMode: button.dataset.operationId! as OperationMode });
        this.hooks?.resetPlayerToProgress();
      });
    });
    this.difficultyPicker.querySelectorAll<HTMLButtonElement>('[data-difficulty-id]').forEach((button) => {
      button.addEventListener('click', () => this.progress.updateSettings({ difficulty: button.dataset.difficultyId! as Difficulty }));
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
