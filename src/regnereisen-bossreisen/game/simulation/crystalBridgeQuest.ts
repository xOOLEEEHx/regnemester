import {
  CRYSTAL_BRIDGE_QUEST_DEFINITION,
  getCrystalBridgeReward
} from '../content/crystalBridgeQuest';
import type { GameSettings } from '../content/settings';
import {
  answerMathQuestQuestion,
  createMathQuest,
  type MathQuestOptions,
  type MathQuestState
} from './mathQuest';

export type CrystalBridgeQuestPhase =
  | 'intro'
  | 'placing'
  | 'reward'
  | 'paid'
  | 'lost';

export type CrystalBridgeQuestState = {
  phase: CrystalBridgeQuestPhase;
  settings: GameSettings;
  challenge: MathQuestState;
  placedCrystals: number;
  rewardValue: number;
  message: string;
};

export function createCrystalBridgeQuest(
  settings: GameSettings,
  options: MathQuestOptions = {}
): CrystalBridgeQuestState {
  return {
    phase: 'intro',
    settings,
    challenge: createMathQuest(CRYSTAL_BRIDGE_QUEST_DEFINITION, settings, options),
    placedCrystals: 0,
    rewardValue: getCrystalBridgeReward(settings),
    message: 'Krystallbrovokteren venter ved den mørke broen.'
  };
}

export function startCrystalBridgeQuest(
  state: CrystalBridgeQuestState
): CrystalBridgeQuestState {
  if (state.phase !== 'intro') {
    return state;
  }
  return {
    ...state,
    phase: 'placing',
    message: 'Dra svar-krystallen til den lysende, tomme sokkelen.'
  };
}

export function placeBridgeCrystal(
  state: CrystalBridgeQuestState,
  selectedAnswer: number
): CrystalBridgeQuestState {
  if (state.phase !== 'placing') {
    return state;
  }

  const challenge = answerMathQuestQuestion(state.challenge, selectedAnswer);
  if (challenge.status === 'lost') {
    return {
      ...state,
      phase: 'lost',
      challenge,
      message: 'Lyset sluknet. Broen må repareres fra begynnelsen.'
    };
  }

  if (!challenge.lastAnswerCorrect) {
    return {
      ...state,
      challenge,
      message: challenge.message
    };
  }

  const placedCrystals = state.placedCrystals + 1;
  if (challenge.status === 'won') {
    return {
      ...state,
      phase: 'reward',
      challenge,
      placedCrystals,
      message: 'Krystallbroen stråler igjen. Porten er åpnet!'
    };
  }

  return {
    ...state,
    challenge,
    placedCrystals,
    message: 'Krystallen låste seg fast. Neste sokkel våkner.'
  };
}

export function markCrystalBridgeRewardPaid(
  state: CrystalBridgeQuestState
): CrystalBridgeQuestState {
  if (state.phase !== 'reward') {
    return state;
  }
  return {
    ...state,
    phase: 'paid',
    message: `${state.rewardValue} Regnecoins er lagt i ryggsekken.`
  };
}
