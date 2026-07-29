import {
  MANOR_SPIDERS,
  getManorReward,
  type ManorSpiderDefinition
} from '../content/manorQuest';
import type { GameSettings } from '../content/settings';
import {
  answerMathQuestQuestion,
  createMathQuest,
  type MathQuestOptions,
  type MathQuestState
} from './mathQuest';

export type ManorQuestPhase =
  | 'intro'
  | 'hunt'
  | 'challenge'
  | 'spider-cleared'
  | 'reward'
  | 'paid'
  | 'lost';

export type ManorQuestState = {
  phase: ManorQuestPhase;
  settings: GameSettings;
  spiderIndex: number;
  clearedCount: number;
  challenge: MathQuestState<ManorSpiderDefinition>;
  rewardValue: number;
  message: string;
};

export function createManorQuest(
  settings: GameSettings,
  options: MathQuestOptions = {}
): ManorQuestState {
  return {
    phase: 'intro',
    settings,
    spiderIndex: 0,
    clearedCount: 0,
    challenge: createMathQuest(MANOR_SPIDERS[0], settings, options),
    rewardValue: getManorReward(settings),
    message: 'Butleren venter på at du skal starte ryddingen.'
  };
}

export function startManorQuest(state: ManorQuestState): ManorQuestState {
  if (state.phase !== 'intro') {
    return state;
  }
  return {
    ...state,
    phase: 'hunt',
    message: 'Se nøye i spindelvevet og trykk på edderkoppen.'
  };
}

export function startManorSpiderChallenge(state: ManorQuestState): ManorQuestState {
  if (state.phase !== 'hunt') {
    return state;
  }
  return {
    ...state,
    phase: 'challenge',
    message: state.challenge.stop.description
  };
}

export function answerManorQuestion(state: ManorQuestState, choice: number): ManorQuestState {
  if (state.phase !== 'challenge') {
    return state;
  }

  const challenge = answerMathQuestQuestion(state.challenge, choice);
  if (challenge.status === 'lost') {
    return {
      ...state,
      phase: 'lost',
      challenge,
      message: 'Du gikk tom for hjerter. Hele ryddingen må startes på nytt.'
    };
  }
  if (challenge.status === 'won') {
    return {
      ...state,
      phase: 'spider-cleared',
      clearedCount: state.clearedCount + 1,
      challenge,
      message: challenge.stop.successText
    };
  }
  return {
    ...state,
    challenge,
    message: challenge.message
  };
}

export function continueManorQuest(state: ManorQuestState): ManorQuestState {
  if (state.phase !== 'spider-cleared') {
    return state;
  }

  if (state.clearedCount >= MANOR_SPIDERS.length) {
    return {
      ...state,
      phase: 'reward',
      message: 'Alle fem edderkoppene er borte. Butleren står klar med betalingen.'
    };
  }

  const spiderIndex = state.clearedCount;
  const challenge = createMathQuest(MANOR_SPIDERS[spiderIndex], state.settings, {
    playerHp: state.challenge.playerHp,
    maxPlayerHp: state.challenge.maxPlayerHp
  });
  return {
    ...state,
    phase: 'hunt',
    spiderIndex,
    challenge,
    message: 'Neste edderkopp har gjemt seg i spindelvevet.'
  };
}

export function markManorRewardPaid(state: ManorQuestState): ManorQuestState {
  if (state.phase !== 'reward') {
    return state;
  }
  return {
    ...state,
    phase: 'paid',
    message: `${state.rewardValue} Regnecoins er lagt i ryggsekken.`
  };
}
