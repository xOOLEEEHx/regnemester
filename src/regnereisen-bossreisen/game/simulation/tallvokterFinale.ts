import {
  TALLVOKTER_FINALE,
  TALLVOKTER_FINALE_PHASE_SIZE
} from '../content/tallvokterFinale';
import type { GameSettings } from '../content/settings';
import {
  answerMathQuestQuestion,
  createMathQuest,
  type MathQuestOptions,
  type MathQuestState
} from './mathQuest';

export type TallvokterFinalePhase = 1 | 2 | 3;

export type TallvokterFinaleState = MathQuestState & {
  phase: TallvokterFinalePhase;
  previousPhase: TallvokterFinalePhase;
  phaseChanged: boolean;
};

export function createTallvokterFinale(
  settings: GameSettings,
  hearts: MathQuestOptions = {}
): TallvokterFinaleState {
  const quest = createMathQuest(TALLVOKTER_FINALE, settings, hearts);
  return {
    ...quest,
    phase: 1,
    previousPhase: 1,
    phaseChanged: false,
    message: 'Tallvokteren åpner Innsiktens prøve.'
  };
}

export function answerTallvokterFinale(
  state: TallvokterFinaleState,
  selectedAnswer: number
): TallvokterFinaleState {
  const answered = answerMathQuestQuestion(state, selectedAnswer);
  const phase = getTallvokterFinalePhase(answered.correct);
  const phaseChanged = answered.lastAnswerCorrect === true
    && answered.status === 'active'
    && phase !== state.phase;

  return {
    ...answered,
    phase,
    previousPhase: state.phase,
    phaseChanged,
    message: getFinaleMessage(answered, phase, phaseChanged)
  };
}

function getTallvokterFinalePhase(correct: number): TallvokterFinalePhase {
  if (correct >= TALLVOKTER_FINALE_PHASE_SIZE * 2) {
    return 3;
  }
  if (correct >= TALLVOKTER_FINALE_PHASE_SIZE) {
    return 2;
  }
  return 1;
}

function getFinaleMessage(
  state: MathQuestState,
  phase: TallvokterFinalePhase,
  phaseChanged: boolean
): string {
  if (state.status === 'won') {
    return 'Du har bestått Tallvokterens siste prøve!';
  }
  if (state.status === 'lost') {
    return 'Duellen er over for denne gang. Tallvokteren venter ved statuen.';
  }
  if (state.lastAnswerCorrect === false) {
    return 'Tallvokteren svarer med en kraftpuls. Du mister ett hjerte.';
  }
  if (phaseChanged) {
    return phase === 2
      ? 'Innsiktens prøve er bestått. Kraftens prøve begynner!'
      : 'Kraftens prøve er bestått. Den siste prøven begynner!';
  }
  const remainingInPhase = TALLVOKTER_FINALE_PHASE_SIZE
    - (state.correct % TALLVOKTER_FINALE_PHASE_SIZE);
  return `Riktig! ${remainingInPhase} rune${remainingInPhase === 1 ? '' : 'r'} gjenstår i denne fasen.`;
}
