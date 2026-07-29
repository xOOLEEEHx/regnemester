import {
  COUNTERWEIGHT_VAULT_LOCK_COUNT,
  getCounterweightLock,
  getCounterweightVaultReward,
  type CounterweightLockDefinition
} from '../content/counterweightVault';
import type { GameSettings } from '../content/settings';
import {
  answerMathQuestQuestion,
  createMathQuest,
  type MathQuestState
} from './mathQuest';

export type CounterweightVaultPhase =
  | 'intro'
  | 'question'
  | 'correct'
  | 'wrong'
  | 'balance'
  | 'balance-wrong'
  | 'unlocking'
  | 'reward'
  | 'paid'
  | 'lost';

export type CounterweightStone = { id: string; value: number };

export type CounterweightVaultState = {
  phase: CounterweightVaultPhase;
  settings: GameSettings;
  lockIndex: number;
  unlockedLocks: number;
  challenge: MathQuestState<CounterweightLockDefinition>;
  stones: CounterweightStone[];
  placedStoneIds: string[];
  rewardValue: number;
  message: string;
};

export type CreateCounterweightVaultOptions = {
  playerHp?: number;
  maxPlayerHp?: number;
};

function createStones(lock: CounterweightLockDefinition): CounterweightStone[] {
  return lock.stoneValues.map((value, index) => ({
    id: `lock-${lock.lockNumber}-stone-${index}`,
    value
  }));
}

export function createCounterweightVault(
  settings: GameSettings,
  options: CreateCounterweightVaultOptions = {}
): CounterweightVaultState {
  const challenge = createMathQuest(getCounterweightLock(settings, 0), settings, options);
  return {
    phase: 'intro',
    settings,
    lockIndex: 0,
    unlockedLocks: 0,
    challenge,
    stones: createStones(challenge.stop),
    placedStoneIds: [],
    rewardValue: getCounterweightVaultReward(settings),
    message: 'Hvelvvokteren vekker den første låsen.'
  };
}

export function startCounterweightVault(state: CounterweightVaultState): CounterweightVaultState {
  if (state.phase !== 'intro') return state;
  return { ...state, phase: 'question', message: 'Lad motvekten med to riktige svar.' };
}

export function answerCounterweightQuestion(
  state: CounterweightVaultState,
  selectedAnswer: number
): CounterweightVaultState {
  if (state.phase !== 'question') return state;
  const challenge = answerMathQuestQuestion(state.challenge, selectedAnswer);
  if (challenge.status === 'lost') {
    return {
      ...state,
      phase: 'lost',
      challenge,
      message: 'Den siste låsegnisten sluknet. Hele hvelvet må startes på nytt.'
    };
  }
  if (challenge.lastAnswerCorrect) {
    return {
      ...state,
      phase: challenge.status === 'won' ? 'balance' : 'correct',
      challenge,
      message: challenge.status === 'won'
        ? 'Motvekten er ladet. Legg runesteiner på vektskålen.'
        : 'Riktig! Én låsegnist er tent.'
    };
  }
  return {
    ...state,
    phase: 'wrong',
    challenge,
    message: 'Feil svar. Låsen tar ett hjerte.'
  };
}

export function continueCounterweightQuestion(
  state: CounterweightVaultState
): CounterweightVaultState {
  if (state.phase !== 'correct' && state.phase !== 'wrong') return state;
  return { ...state, phase: 'question', message: 'Løs neste matematikkoppgave.' };
}

export function setCounterweightStonePlaced(
  state: CounterweightVaultState,
  stoneId: string,
  placed: boolean
): CounterweightVaultState {
  if (state.phase !== 'balance' && state.phase !== 'balance-wrong') return state;
  if (!state.stones.some((stone) => stone.id === stoneId)) return state;
  const withoutStone = state.placedStoneIds.filter((id) => id !== stoneId);
  return {
    ...state,
    phase: 'balance',
    placedStoneIds: placed ? [...withoutStone, stoneId] : withoutStone,
    message: placed
      ? 'Runesteinen ligger på vektskålen. Trekk i spaken når summen er riktig.'
      : 'Runesteinen er lagt tilbake.'
  };
}

export function getPlacedCounterweightSum(state: CounterweightVaultState): number {
  const selected = new Set(state.placedStoneIds);
  return state.stones.reduce(
    (sum, stone) => sum + (selected.has(stone.id) ? stone.value : 0),
    0
  );
}

export function checkCounterweightBalance(
  state: CounterweightVaultState
): CounterweightVaultState {
  if (state.phase !== 'balance' && state.phase !== 'balance-wrong') return state;
  if (getPlacedCounterweightSum(state) === state.challenge.stop.targetWeight) {
    return {
      ...state,
      phase: 'unlocking',
      message: `Lås ${state.lockIndex + 1} er i balanse!`
    };
  }
  const playerHp = Math.max(0, state.challenge.playerHp - 1);
  return {
    ...state,
    phase: playerHp <= 0 ? 'lost' : 'balance-wrong',
    challenge: { ...state.challenge, playerHp },
    placedStoneIds: [],
    message: playerHp <= 0
      ? 'Motvekten slo tilbake. Hele hvelvet må startes på nytt.'
      : 'Feil balanse. Du mister ett hjerte, og runesteinene legges tilbake.'
  };
}

export function continueCounterweightVault(
  state: CounterweightVaultState
): CounterweightVaultState {
  if (state.phase !== 'unlocking') return state;
  const unlockedLocks = state.unlockedLocks + 1;
  const nextLockIndex = state.lockIndex + 1;
  if (nextLockIndex >= COUNTERWEIGHT_VAULT_LOCK_COUNT) {
    return {
      ...state,
      phase: 'reward',
      unlockedLocks,
      message: 'Alle fire låsene er åpne. Hvelvvokteren har hentet belønningen.'
    };
  }
  const challenge = createMathQuest(
    getCounterweightLock(state.settings, nextLockIndex),
    state.settings,
    {
      playerHp: state.challenge.playerHp,
      maxPlayerHp: state.challenge.maxPlayerHp
    }
  );
  return {
    ...state,
    phase: 'question',
    lockIndex: nextLockIndex,
    unlockedLocks,
    challenge,
    stones: createStones(challenge.stop),
    placedStoneIds: [],
    message: `Lås ${nextLockIndex + 1} våkner. Lad motvekten på nytt.`
  };
}

export function markCounterweightRewardPaid(
  state: CounterweightVaultState
): CounterweightVaultState {
  if (state.phase !== 'reward') return state;
  return {
    ...state,
    phase: 'paid',
    message: `${state.rewardValue} Regnecoins er lagt i ryggsekken.`
  };
}
