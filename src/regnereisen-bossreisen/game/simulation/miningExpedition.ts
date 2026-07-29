import type { Operation } from '../content/locations';
import {
  MINING_QUESTION_COUNT,
  createEmptyMiningInventory,
  createMiningBoard,
  getMiningResource,
  type MiningCell,
  type MiningInventory
} from '../content/mining';
import type { GameSettings } from '../content/settings';
import { createQuestionDeck, drawQuestion, type MathQuestion } from './questions';

export type MiningExpeditionPhase = 'quiz' | 'dig' | 'reward' | 'paid';

export type MiningExpeditionState = {
  phase: MiningExpeditionPhase;
  settings: GameSettings;
  questionDeck: MathQuestion[];
  question: MathQuestion;
  questionsAnswered: number;
  correctAnswers: number;
  drillsRemaining: number;
  board: MiningCell[];
  revealedCells: Set<number>;
  inventory: MiningInventory;
  rewardValue: number;
  message: string;
  lastAnswerCorrect?: boolean;
};

const ALL_OPERATIONS: Operation[] = ['add', 'subtract', 'multiply', 'divide'];

export function createMiningExpedition(settings: GameSettings): MiningExpeditionState {
  const miningSettings: GameSettings = {
    ...settings,
    operationMode: 'mixed'
  };
  const questionDeck = createQuestionDeck(ALL_OPERATIONS, miningSettings);
  return {
    phase: 'quiz',
    settings: miningSettings,
    questionDeck,
    question: drawQuestion(questionDeck, ALL_OPERATIONS, miningSettings),
    questionsAnswered: 0,
    correctAnswers: 0,
    drillsRemaining: 0,
    board: createMiningBoard(),
    revealedCells: new Set<number>(),
    inventory: createEmptyMiningInventory(),
    rewardValue: 0,
    message: 'Svar på alle 10 oppgavene. Hvert riktige svar gir ett bor.'
  };
}

export function answerMiningQuestion(
  state: MiningExpeditionState,
  choice: number
): MiningExpeditionState {
  if (state.phase !== 'quiz') {
    return state;
  }

  const correct = choice === state.question.answer;
  const questionsAnswered = state.questionsAnswered + 1;
  const correctAnswers = state.correctAnswers + (correct ? 1 : 0);
  const isQuizComplete = questionsAnswered >= MINING_QUESTION_COUNT;
  const questionDeck = [...state.questionDeck];

  return {
    ...state,
    phase: isQuizComplete ? (correctAnswers > 0 ? 'dig' : 'reward') : 'quiz',
    questionDeck,
    question: isQuizComplete
      ? state.question
      : drawQuestion(questionDeck, ALL_OPERATIONS, state.settings),
    questionsAnswered,
    correctAnswers,
    drillsRemaining: isQuizComplete ? correctAnswers : state.drillsRemaining,
    lastAnswerCorrect: correct,
    message: isQuizComplete
      ? correctAnswers > 0
        ? `Du fikk ${correctAnswers} bor. Velg ${correctAnswers} ruter å bore i.`
        : 'Du fikk ingen bor denne gangen. Gruvesjefen gjør opp ekspedisjonen.'
      : correct
        ? 'Riktig! Du fikk ett bor.'
        : `Ikke helt. Riktig svar var ${state.question.answer}.`
  };
}

export function revealMiningCell(
  state: MiningExpeditionState,
  cellId: number
): MiningExpeditionState {
  if (
    state.phase !== 'dig'
    || state.drillsRemaining <= 0
    || state.revealedCells.has(cellId)
  ) {
    return state;
  }

  const cell = state.board[cellId];
  if (!cell) {
    return state;
  }

  const revealedCells = new Set(state.revealedCells);
  revealedCells.add(cellId);
  const inventory = { ...state.inventory };
  let rewardValue = state.rewardValue;
  let message = 'Tom rute. Her var det bare jord.';

  if (cell.content !== 'empty') {
    const resource = getMiningResource(cell.content);
    inventory[cell.content] += 1;
    rewardValue += resource.value;
    message = `${resource.displayName}! Funnet er verdt ${resource.value} Regnecoin${resource.value === 1 ? '' : 's'}.`;
  }

  const drillsRemaining = state.drillsRemaining - 1;
  return {
    ...state,
    phase: drillsRemaining === 0 ? 'reward' : 'dig',
    revealedCells,
    inventory,
    rewardValue,
    drillsRemaining,
    message
  };
}

export function markMiningRewardPaid(state: MiningExpeditionState): MiningExpeditionState {
  return {
    ...state,
    phase: 'paid',
    message: state.rewardValue > 0
      ? `${state.rewardValue} Regnecoins er lagt i ryggsekken.`
      : 'Ingen funn å betale ut denne gangen.'
  };
}
