import type { Operation } from '../content/locations';
import {
  getEffectiveDifficulty,
  isAddSubtractOnlyDifficulty,
  isEasyDifficulty,
  type Difficulty,
  type GameSettings,
  type OperationMode
} from '../content/settings';

export type MathQuestion = {
  prompt: string;
  answer: number;
  choices: number[];
};

type QuestionCore = {
  operation: Operation;
  a: number;
  b: number;
  symbol: string;
  answer: number;
  optionMax?: number;
};

const ALL_OPERATIONS: Operation[] = ['add', 'subtract', 'multiply', 'divide'];
const CALCULATION_DECK_SIZE = 200;
const MIXED_DECK_SIZE = 240;

function shuffle<T>(values: T[]): T[] {
  return [...values].sort(() => Math.random() - 0.5);
}

export function createQuestionDeck(operations: Operation[], settings: GameSettings): MathQuestion[] {
  const difficulty = getEffectiveDifficulty(settings);
  const operationPool = isAddSubtractOnlyDifficulty(difficulty)
    ? (['add', 'subtract'] satisfies Operation[])
    : getOperationPool(settings.operationMode, operations);
  if (settings.operationMode === 'mixed') {
    return createMixedDeck(operationPool, difficulty).map(withNormalModeOptions);
  }

  return shuffle(createOperationDeck(operationPool[0], difficulty).map(withNormalModeOptions));
}

export function drawQuestion(deck: MathQuestion[], operations: Operation[], settings: GameSettings): MathQuestion {
  if (deck.length === 0) {
    deck.push(...createQuestionDeck(operations, settings));
  }

  return deck.pop() ?? withNormalModeOptions(makeRandomQuestion('add', 'normal'));
}

export function createQuestion(operations: Operation[], _maxFactor: number, settings: GameSettings): MathQuestion {
  const deck = createQuestionDeck(operations, settings);
  return drawQuestion(deck, operations, settings);
}

function getOperationPool(operationMode: OperationMode, operations: Operation[] = ALL_OPERATIONS): Operation[] {
  if (operationMode !== 'mixed') {
    return [operationMode];
  }

  return operations.length > 0 ? operations : ALL_OPERATIONS;
}

function createMixedDeck(operationPool: Operation[], difficulty: Difficulty): QuestionCore[] {
  const operations = [...new Set(operationPool)];
  const questions: QuestionCore[] = [];
  for (let index = 0; index < MIXED_DECK_SIZE; index += 1) {
    const operation = operations[randomInt(0, operations.length - 1)];
    questions.push(makeRandomQuestion(operation, difficulty));
  }
  return shuffle(questions);
}

function createOperationDeck(operation: Operation, difficulty: Difficulty): QuestionCore[] {
  const max = getLevelMax(difficulty, operation);
  if (operation === 'add') {
    const questions: QuestionCore[] = [];
    for (let index = 0; index < CALCULATION_DECK_SIZE; index += 1) {
      questions.push(makeAdditionQuestion(difficulty));
    }
    return questions;
  }

  if (operation === 'subtract') {
    const questions: QuestionCore[] = [];
    for (let index = 0; index < CALCULATION_DECK_SIZE; index += 1) {
      questions.push(makeSubtractionQuestion(difficulty));
    }
    return questions;
  }

  if (operation === 'divide') {
    const questions: QuestionCore[] = [];
    const answerMax = isEasyDifficulty(difficulty) ? 10 : max;
    for (let divisor = 1; divisor <= max; divisor += 1) {
      for (let answer = 1; answer <= answerMax; answer += 1) {
        questions.push(makeDivisionQuestion(divisor, answer, answerMax));
      }
    }
    return questions;
  }

  const questions: QuestionCore[] = [];
  const multiplierMax = isEasyDifficulty(difficulty) ? 10 : max;
  for (let a = 0; a <= max; a += 1) {
    for (let b = 0; b <= multiplierMax; b += 1) {
      questions.push(makeMultiplicationQuestion(a, b));
    }
  }
  return questions;
}

function getLevelMax(difficulty: Difficulty, operation: Operation): number {
  if (operation === 'add' || operation === 'subtract') {
    if (isEasyDifficulty(difficulty)) {
      return 20;
    }
    if (difficulty === 'hard') {
      return 1000;
    }
    return 100;
  }

  if (isEasyDifficulty(difficulty)) {
    return 5;
  }
  if (difficulty === 'hard') {
    return 20;
  }
  return 10;
}

function makeRandomQuestion(operation: Operation, difficulty: Difficulty): QuestionCore {
  if (operation === 'add') {
    return makeAdditionQuestion(difficulty);
  }
  if (operation === 'subtract') {
    return makeSubtractionQuestion(difficulty);
  }

  const max = getLevelMax(difficulty, operation);
  if (operation === 'divide') {
    const answerMax = isEasyDifficulty(difficulty) ? 10 : max;
    return makeDivisionQuestion(randomInt(1, max), randomInt(1, answerMax), answerMax);
  }

  const multiplierMax = isEasyDifficulty(difficulty) ? 10 : max;
  return makeMultiplicationQuestion(randomInt(0, max), randomInt(0, multiplierMax));
}

function makeAdditionQuestion(difficulty: Difficulty): QuestionCore {
  const max = getLevelMax(difficulty, 'add');
  const a = randomInt(0, max);
  const b = randomInt(0, max - a);
  return { operation: 'add', a, b, symbol: '+', answer: a + b };
}

function makeSubtractionQuestion(difficulty: Difficulty): QuestionCore {
  const max = getLevelMax(difficulty, 'subtract');
  const a = randomInt(0, max);
  const b = randomInt(0, a);
  return { operation: 'subtract', a, b, symbol: '−', answer: a - b };
}

function makeMultiplicationQuestion(a: number, b: number): QuestionCore {
  return { operation: 'multiply', a, b, symbol: '×', answer: a * b };
}

function makeDivisionQuestion(divisor: number, answer: number, optionMax = 10): QuestionCore {
  return { operation: 'divide', a: divisor * answer, b: divisor, symbol: '÷', answer, optionMax };
}

function withNormalModeOptions(question: QuestionCore): MathQuestion {
  return {
    prompt: `${question.a} ${question.symbol} ${question.b}`,
    answer: question.answer,
    choices: makeNormalModeOptions(
      question.answer,
      question.operation,
      question.optionMax ?? 10
    )
  };
}

function randomWrongAnswer(correct: number): number {
  if (correct === 0) {
    return randomInt(1, 20);
  }

  const strategies = [
    correct + randomInt(-4, 4),
    correct + 10,
    correct - 10,
    correct + randomInt(1, 12),
    Math.max(1, correct - randomInt(1, 12))
  ];
  return Math.max(0, strategies[randomInt(0, strategies.length - 1)]);
}

function randomDivisionWrongAnswer(correct: number, max = 10): number {
  const nearbyCandidates = [
    correct - 4,
    correct - 3,
    correct - 2,
    correct - 1,
    correct + 1,
    correct + 2,
    correct + 3,
    correct + 4
  ].filter((value) => value >= 1 && value <= max && value !== correct);
  if (nearbyCandidates.length > 0) {
    return nearbyCandidates[randomInt(0, nearbyCandidates.length - 1)];
  }
  let candidate = correct;
  while (candidate === correct) {
    candidate = randomInt(1, max);
  }
  return candidate;
}

function makeNormalModeOptions(correct: number, operation: Operation, max = 10): number[] {
  const wrongs = new Set<number>();
  while (wrongs.size < 3) {
    const candidate = operation === 'divide'
      ? randomDivisionWrongAnswer(correct, max)
      : randomWrongAnswer(correct);
    if (candidate !== correct) {
      wrongs.add(candidate);
    }
  }
  return shuffle([correct, ...wrongs]);
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
