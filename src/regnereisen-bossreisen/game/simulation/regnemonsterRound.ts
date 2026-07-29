import type { Operation } from '../content/locations';
import {
  DEFAULT_SETTINGS,
  type OperationMode
} from '../content/settings';
import type { RegnemonsterDifficulty } from './regnemonsterCollection';
import {
  createQuestionDeck,
  type MathQuestion
} from './questions';

export const REGNEMONSTER_ROUND_QUESTION_COUNT = 10;
export const REGNEMONSTER_CORRECT_FEEDBACK_MS = 380;
export const REGNEMONSTER_WRONG_FEEDBACK_MS = 760;

export type RegnemonsterRoundSetup = {
  operationMode: OperationMode;
  difficulty: RegnemonsterDifficulty;
};

export type RegnemonsterRoundState = {
  setup: RegnemonsterRoundSetup;
  questions: MathQuestion[];
  questionIndex: number;
  answeredCount: number;
  correctCount: number;
  phase: 'question' | 'feedback' | 'complete';
  selectedAnswer?: number;
  lastAnswerCorrect?: boolean;
};

const ALL_OPERATIONS: Operation[] = ['add', 'subtract', 'multiply', 'divide'];

export function createRegnemonsterRound(
  setup: RegnemonsterRoundSetup,
  suppliedQuestions?: MathQuestion[]
): RegnemonsterRoundState {
  const generated = suppliedQuestions ?? createQuestionDeck(ALL_OPERATIONS, {
    ...DEFAULT_SETTINGS,
    started: true,
    mapId: 'regnemonster',
    operationMode: setup.operationMode,
    difficulty: setup.difficulty,
    playMode: 'normal'
  });
  if (generated.length < REGNEMONSTER_ROUND_QUESTION_COUNT) {
    throw new Error('En Regnemonster-runde trenger minst ti oppgaver.');
  }
  return {
    setup: { ...setup },
    questions: generated.map((question) => ({
        ...question,
        choices: [...question.choices]
      })),
    questionIndex: 0,
    answeredCount: 0,
    correctCount: 0,
    phase: 'question'
  };
}

export function getCurrentRegnemonsterQuestion(
  state: RegnemonsterRoundState
): MathQuestion {
  return state.questions[state.questionIndex];
}

export function answerRegnemonsterRound(
  state: RegnemonsterRoundState,
  selectedAnswer: number
): RegnemonsterRoundState {
  if (state.phase !== 'question') {
    return state;
  }
  const correct = selectedAnswer === getCurrentRegnemonsterQuestion(state).answer;
  return {
    ...state,
    answeredCount: state.answeredCount + 1,
    correctCount: state.correctCount + (correct ? 1 : 0),
    phase: 'feedback',
    selectedAnswer,
    lastAnswerCorrect: correct
  };
}

export function advanceRegnemonsterRound(
  state: RegnemonsterRoundState
): RegnemonsterRoundState {
  if (state.phase !== 'feedback') {
    return state;
  }
  if (state.correctCount >= REGNEMONSTER_ROUND_QUESTION_COUNT) {
    return {
      ...state,
      phase: 'complete'
    };
  }
  let questions = state.questions;
  const nextQuestionIndex = state.questionIndex + 1;
  if (nextQuestionIndex >= questions.length) {
    questions = [
      ...questions,
      ...createQuestionDeck(ALL_OPERATIONS, {
        ...DEFAULT_SETTINGS,
        started: true,
        mapId: 'regnemonster',
        operationMode: state.setup.operationMode,
        difficulty: state.setup.difficulty,
        playMode: 'normal'
      })
    ];
  }
  return {
    ...state,
    questions,
    questionIndex: nextQuestionIndex,
    phase: 'question',
    selectedAnswer: undefined,
    lastAnswerCorrect: undefined
  };
}

export function getRegnemonsterFeedbackDuration(correct: boolean): number {
  return correct
    ? REGNEMONSTER_CORRECT_FEEDBACK_MS
    : REGNEMONSTER_WRONG_FEEDBACK_MS;
}
