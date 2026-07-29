import {
  CRYSTAL_CART_CHALLENGE,
  getCrystalCartReward
} from '../content/crystalCart';
import type { GameSettings } from '../content/settings';
import {
  answerMathQuestQuestion,
  createMathQuest,
  type MathQuestState
} from './mathQuest';

export type CrystalCartRunState = {
  challenge: MathQuestState;
  rewardValue: number;
  message: string;
};

export function createCrystalCartRun(
  settings: GameSettings,
  hearts: { playerHp?: number; maxPlayerHp?: number } = {}
): CrystalCartRunState {
  return {
    challenge: createMathQuest(CRYSTAL_CART_CHALLENGE, settings, hearts),
    rewardValue: getCrystalCartReward(settings),
    message: 'Vognen nærmer seg det første veikrysset.'
  };
}

export function answerCrystalCartQuestion(
  state: CrystalCartRunState,
  selectedAnswer: number
): CrystalCartRunState {
  const challenge = answerMathQuestQuestion(state.challenge, selectedAnswer);
  const previousCorrect = state.challenge.correct;
  const passedCheckpoint = challenge.correct > previousCorrect;

  return {
    ...state,
    challenge,
    message: challenge.status === 'won'
      ? 'Krystallkjernen lyser! Hele ruten er åpnet.'
      : challenge.status === 'lost'
        ? 'Vognen har mistet all beskyttelse og må returnere til inngangen.'
        : passedCheckpoint
          ? `Riktig spor! Vognen raser videre. ${challenge.requiredCorrect - challenge.correct} veikryss gjenstår.`
          : 'Feil spor! Krystallporten smeller igjen. Vognen nødbremser, og du mister ett hjerte.'
  };
}
