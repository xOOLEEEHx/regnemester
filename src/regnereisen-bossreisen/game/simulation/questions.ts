import type { Operation } from '../content/locations';
import { getEffectiveDifficulty, type Difficulty, type GameSettings, type OperationMode } from '../content/settings';

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
};

const ALL_OPERATIONS: Operation[] = ['add', 'subtract', 'multiply', 'divide'];
const CALCULATION_DECK_SIZE = 200;
const MIXED_DECK_SIZE = 240;

function shuffle<T>(values: T[]): T[] {
  return [...values].sort(() => Math.random() - 0.5);
}

export function createQuestionDeck(operations: Operation[], settings: GameSettings): MathQuestion[] {
  const operationPool = getOperationPool(settings.operationMode, operations);
  const difficulty = getEffectiveDifficulty(settings);
  if (settings.operationMode === 'mixed') {
    return createMixedDeck(operationPool, difficulty).map(withRegnemesterOptions);
  }

  return shuffle(uniqueQuestions(createOperationDeck(operationPool[0], difficulty).map(withRegnemesterOptions)));
}

export function drawQuestion(deck: MathQuestion[], operations: Operation[], settings: GameSettings): MathQuestion {
  if (deck.length === 0) {
    deck.push(...createQuestionDeck(operations, settings));
  }

  return deck.pop() ?? withRegnemesterOptions(makeRandomQuestion('add', 'normal'));
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

function uniqueQuestions(questions: MathQuestion[]): MathQuestion[] {
  const seen = new Set<string>();
  return questions.filter((question) => {
    const key = `${question.prompt}:${question.answer}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function createMixedDeck(operationPool: Operation[], difficulty: Difficulty): QuestionCore[] {
  const operations = [...new Set(operationPool)];
  const questions: QuestionCore[] = [];
  for (let index = 0; index < MIXED_DECK_SIZE; index += 1) {
    const operation = operations[randomInt(0, operations.length - 1)];
    questions.push(makeRandomQuestion(operation, difficulty));
  }
  return shuffle(uniqueQuestionCores(questions));
}

function uniqueQuestionCores(questions: QuestionCore[]): QuestionCore[] {
  const seen = new Set<string>();
  return questions.filter((question) => {
    const key = `${question.operation}:${question.a}:${question.b}:${question.answer}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
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
    const answerMax = difficulty === 'easy' ? 10 : max;
    for (let divisor = 1; divisor <= max; divisor += 1) {
      for (let answer = 1; answer <= answerMax; answer += 1) {
        questions.push(makeDivisionQuestion(divisor, answer));
      }
    }
    return questions;
  }

  const questions: QuestionCore[] = [];
  const multiplierMax = difficulty === 'easy' ? 10 : max;
  for (let a = 0; a <= max; a += 1) {
    for (let b = 0; b <= multiplierMax; b += 1) {
      questions.push(makeMultiplicationQuestion(a, b));
    }
  }
  return questions;
}

function getLevelMax(difficulty: Difficulty, operation: Operation): number {
  if (operation === 'add' || operation === 'subtract') {
    if (difficulty === 'easy') {
      return 20;
    }
    if (difficulty === 'hard') {
      return 1000;
    }
    return 100;
  }

  if (difficulty === 'easy') {
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
    return makeDivisionQuestion(randomInt(1, max), randomInt(1, max));
  }

  return makeMultiplicationQuestion(randomMultiplicationFactor(max), randomMultiplicationFactor(max));
}

function randomMultiplicationFactor(max: number): number {
  if (max <= 0) {
    return 0;
  }

  const zeroWeight = 0.35;
  if (Math.random() < zeroWeight / (max + zeroWeight)) {
    return 0;
  }

  return randomInt(1, max);
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

function makeDivisionQuestion(divisor: number, answer: number): QuestionCore {
  return { operation: 'divide', a: divisor * answer, b: divisor, symbol: '÷', answer };
}

function withRegnemesterOptions(question: QuestionCore): MathQuestion {
  return {
    prompt: `${question.a} ${question.symbol} ${question.b}`,
    answer: question.answer,
    choices: makeRegnemesterOptions(question)
  };
}

function makeRegnemesterOptions(question: QuestionCore): number[] {
  const { operation, a, b, answer } = question;
  const minOption = operation === 'divide' ? 1 : 0;
  const maxOption = getMaxOption(question);
  const wrongs = new Set<number>();
  const nearOffsets = [-4, -3, -2, -1, 1, 2, 3, 4];
  let candidates = nearOffsets.map((offset) => answer + offset);

  if (operation === 'multiply') {
    candidates = [
      ...candidates,
      (a + 1) * b,
      Math.max(0, a - 1) * b,
      a * (b + 1),
      a * Math.max(0, b - 1),
      answer + Math.max(1, a),
      answer - Math.max(1, a),
      answer + Math.max(1, b),
      answer - Math.max(1, b),
      answer + 5,
      answer - 5
    ];
  } else if (operation === 'divide') {
    candidates = [
      ...candidates,
      Math.round(a / (b + 1)),
      b > 1 ? Math.round(a / (b - 1)) : answer + 2,
      answer + 5,
      answer - 5
    ];
  } else if (operation === 'add') {
    candidates = [...candidates, Math.abs(a - b), answer + 10, answer - 10];
  } else {
    candidates = [...candidates, a + b, answer + 10, answer - 10];
  }

  shuffle(candidates).forEach((candidate) => addWrongOption(wrongs, candidate, answer, minOption, maxOption));
  while (wrongs.size < 3) {
    const offset = randomInt(1, 6) * (randomInt(0, 1) === 0 ? -1 : 1);
    addWrongOption(wrongs, answer + offset, answer, minOption, maxOption);
  }

  return shuffle([answer, ...wrongs].slice(0, 4));
}

function getMaxOption(question: QuestionCore): number {
  if (question.operation === 'multiply') {
    return Math.max(60, question.answer, Math.max(question.a, question.b) ** 2);
  }
  if (question.operation === 'divide') {
    return Math.max(10, question.answer, question.b);
  }
  return Math.max(30, question.a + question.b, question.answer + 10);
}

function addWrongOption(wrongs: Set<number>, candidate: number, correct: number, min: number, max: number): void {
  if (!Number.isFinite(candidate)) {
    return;
  }

  const roundedCandidate = Math.round(candidate);
  if (roundedCandidate !== correct && roundedCandidate >= min && roundedCandidate <= max) {
    wrongs.add(roundedCandidate);
  }
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
