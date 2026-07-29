import type { Operation } from '../content/locations';
import { getDifficultyOption, getEffectiveDifficulty, type GameSettings } from '../content/settings';
import { createQuestionDeck, drawQuestion, type MathQuestion } from './questions';

export type MathQuestDefinition = {
  id: string;
  place: string;
  title: string;
  description: string;
  successText: string;
  iconSrc: string;
  operations: Operation[];
  requiredCorrect: number;
};

export type MathQuestState<TQuest extends MathQuestDefinition = MathQuestDefinition> = {
  stop: TQuest;
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

export type MathQuestOptions = {
  playerHp?: number;
  maxPlayerHp?: number;
};

/** Shared foundation for every mathematics quest in Regnereisen. */
export function createMathQuest<TQuest extends MathQuestDefinition>(
  quest: TQuest,
  settings: GameSettings,
  options: MathQuestOptions = {}
): MathQuestState<TQuest> {
  const defaultPlayerHearts = getDifficultyOption(getEffectiveDifficulty(settings)).playerHearts;
  const playerHp = options.playerHp ?? defaultPlayerHearts;
  const maxPlayerHp = options.maxPlayerHp ?? playerHp;
  const questSettings: GameSettings = { ...settings, operationMode: 'mixed' };
  const questionDeck = createQuestionDeck(quest.operations, questSettings);

  return {
    stop: quest,
    correct: 0,
    requiredCorrect: quest.requiredCorrect,
    playerHp,
    maxPlayerHp,
    question: drawQuestion(questionDeck, quest.operations, questSettings),
    questionDeck,
    status: 'active',
    message: quest.description,
    settings: questSettings
  };
}

export function answerMathQuestQuestion<TQuest extends MathQuestDefinition>(
  state: MathQuestState<TQuest>,
  selectedAnswer: number
): MathQuestState<TQuest> {
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
      message: won ? state.stop.successText : `Riktig! ${state.requiredCorrect - correct} igjen.`
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
      ? 'Oppdraget mislyktes.'
      : 'Feil svar. Du mister ett hjerte, men oppdraget fortsetter.'
  };
}
