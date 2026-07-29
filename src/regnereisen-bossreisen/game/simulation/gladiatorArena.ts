import {
  GLADIATORS,
  getGladiatorArenaReward,
  type GladiatorDefinition
} from '../content/gladiatorArena';
import type { GameSettings } from '../content/settings';
import {
  answerMathQuestQuestion,
  createMathQuest,
  type MathQuestOptions,
  type MathQuestState
} from './mathQuest';

export type GladiatorArenaPhase = 'intro' | 'fight' | 'intermission' | 'reward' | 'paid' | 'lost';

export type GladiatorArenaState = {
  phase: GladiatorArenaPhase;
  settings: GameSettings;
  gladiatorIndex: number;
  defeatedCount: number;
  fight: MathQuestState<GladiatorDefinition>;
  rewardValue: number;
  message: string;
};

export function createGladiatorArena(
  settings: GameSettings,
  options: MathQuestOptions = {}
): GladiatorArenaState {
  return {
    phase: 'intro',
    settings,
    gladiatorIndex: 0,
    defeatedCount: 0,
    fight: createMathQuest(GLADIATORS[0], settings, options),
    rewardValue: getGladiatorArenaReward(settings),
    message: 'Lanistaen venter på at du skal gå inn i arenaen.'
  };
}

export function startGladiatorArena(state: GladiatorArenaState): GladiatorArenaState {
  if (state.phase !== 'intro') {
    return state;
  }

  return {
    ...state,
    phase: 'fight',
    message: state.fight.stop.description
  };
}

export function answerGladiatorQuestion(
  state: GladiatorArenaState,
  choice: number
): GladiatorArenaState {
  if (state.phase !== 'fight') {
    return state;
  }

  const fight = answerMathQuestQuestion(state.fight, choice);
  if (fight.status === 'lost') {
    return {
      ...state,
      phase: 'lost',
      fight,
      message: 'Du gikk tom for hjerter. Hele arenautfordringen må startes på nytt.'
    };
  }

  if (fight.status === 'won') {
    return {
      ...state,
      phase: 'intermission',
      defeatedCount: state.gladiatorIndex + 1,
      fight,
      message: fight.stop.successText
    };
  }

  return {
    ...state,
    fight,
    message: fight.message
  };
}

export function continueGladiatorArena(state: GladiatorArenaState): GladiatorArenaState {
  if (state.phase !== 'intermission') {
    return state;
  }

  const nextIndex = state.gladiatorIndex + 1;
  if (nextIndex >= GLADIATORS.length) {
    return {
      ...state,
      phase: 'reward',
      message: 'Alle fire gladiatorene er beseiret. Lanistaen står klar med belønningen din.'
    };
  }

  const fight = createMathQuest(GLADIATORS[nextIndex], state.settings, {
    playerHp: state.fight.playerHp,
    maxPlayerHp: state.fight.maxPlayerHp
  });
  return {
    ...state,
    phase: 'fight',
    gladiatorIndex: nextIndex,
    fight,
    message: fight.stop.description
  };
}

export function markGladiatorRewardPaid(state: GladiatorArenaState): GladiatorArenaState {
  if (state.phase !== 'reward') {
    return state;
  }

  return {
    ...state,
    phase: 'paid',
    message: `${state.rewardValue} Regnecoins er lagt i ryggsekken.`
  };
}

