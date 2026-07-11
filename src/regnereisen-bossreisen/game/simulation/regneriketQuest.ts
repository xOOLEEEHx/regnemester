import type { RegneriketStop } from '../content/regneriket';
import { getDifficultyOption, getEffectiveDifficulty, type GameSettings } from '../content/settings';
import { createQuestionDeck, drawQuestion, type MathQuestion } from './questions';

export type RegneriketQuestState = {
  stop: RegneriketStop;
  correct: number;
  requiredCorrect: number;
  playerHp: number;
  maxPlayerHp: number;
  question: MathQuestion;
  questionDeck: MathQuestion[];
  lastAnswerCorrect?: boolean;
  status: 'active' | 'won' | 'lost';
  message: string;
  settings: GameSettings;
};

export type RegneriketQuestOptions = {
  playerHp?: number;
  maxPlayerHp?: number;
};

export function createRegneriketQuest(
  stop: RegneriketStop,
  settings: GameSettings,
  options: RegneriketQuestOptions = {}
): RegneriketQuestState {
  const defaultPlayerHearts = getDifficultyOption(getEffectiveDifficulty(settings)).playerHearts;
  const playerHp = options.playerHp ?? defaultPlayerHearts;
  const maxPlayerHp = options.maxPlayerHp ?? playerHp;
  const questSettings: GameSettings = { ...settings, operationMode: 'mixed' };
  const questionDeck = createQuestionDeck(stop.operations, questSettings);
  return {
    stop,
    correct: 0,
    requiredCorrect: stop.requiredCorrect,
    playerHp,
    maxPlayerHp,
    question: drawQuestion(questionDeck, stop.operations, questSettings),
    questionDeck,
    status: 'active',
    message: stop.description,
    settings: questSettings
  };
}

export function answerRegneriketQuestion(state: RegneriketQuestState, selectedAnswer: number): RegneriketQuestState {
  if (state.status !== 'active') {
    return state;
  }

  const correctAnswer = selectedAnswer === state.question.answer;
  if (correctAnswer) {
    const correct = state.correct + 1;
    const won = correct >= state.requiredCorrect;
    const questionDeck = [...state.questionDeck];
    return {
      ...state,
      correct,
      question: won ? state.question : drawQuestion(questionDeck, state.stop.operations, state.settings),
      questionDeck,
      lastAnswerCorrect: true,
      status: won ? 'won' : 'active',
      message: won
        ? state.stop.successText
        : `Riktig! ${state.requiredCorrect - correct} igjen.`
    };
  }

  const playerHp = Math.max(0, state.playerHp - 1);
  const questionDeck = [...state.questionDeck];
  return {
    ...state,
    playerHp,
    question: playerHp > 0 ? drawQuestion(questionDeck, state.stop.operations, state.settings) : state.question,
    questionDeck,
    lastAnswerCorrect: false,
    status: playerHp <= 0 ? 'lost' : 'active',
    message: playerHp <= 0
      ? 'Oppdraget mislyktes. Prøv igjen når du er klar.'
      : 'Feil svar. Du mister ett hjerte, men oppdraget fortsetter.'
  };
}
