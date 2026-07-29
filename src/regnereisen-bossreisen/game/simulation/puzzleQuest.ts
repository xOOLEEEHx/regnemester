import {
  PUZZLE_IMAGES,
  PUZZLE_MATH_CHALLENGE,
  PUZZLE_PIECE_COUNT,
  getPuzzleQuestReward,
  type PuzzleImageDefinition
} from '../content/puzzleQuest';
import type { GameSettings } from '../content/settings';
import {
  answerMathQuestQuestion,
  createMathQuest,
  type MathQuestOptions,
  type MathQuestState
} from './mathQuest';

export type PuzzleQuestPhase = 'intro' | 'quiz' | 'puzzle' | 'reward' | 'paid' | 'lost';

export type PuzzleQuestState = {
  phase: PuzzleQuestPhase;
  settings: GameSettings;
  challenge: MathQuestState;
  image: PuzzleImageDefinition;
  pieceOrder: number[];
  moves: number;
  rewardValue: number;
  message: string;
};

let previousImageId: string | undefined;

function shufflePieces(): number[] {
  const solved = Array.from({ length: PUZZLE_PIECE_COUNT }, (_, index) => index);
  let shuffled = [...solved];
  do {
    shuffled = [...solved].sort(() => Math.random() - 0.5);
  } while (shuffled.some((piece, slot) => piece === slot));
  return shuffled;
}

function choosePuzzleImage(): PuzzleImageDefinition {
  const candidates = PUZZLE_IMAGES.filter((image) => image.id !== previousImageId);
  const image = candidates[Math.floor(Math.random() * candidates.length)] ?? PUZZLE_IMAGES[0];
  previousImageId = image.id;
  return image;
}

export function createPuzzleQuest(
  settings: GameSettings,
  options: MathQuestOptions = {}
): PuzzleQuestState {
  return {
    phase: 'intro',
    settings,
    challenge: createMathQuest(PUZZLE_MATH_CHALLENGE, settings, options),
    image: choosePuzzleImage(),
    pieceOrder: shufflePieces(),
    moves: 0,
    rewardValue: getPuzzleQuestReward(settings),
    message: 'Puslespill-mesteren venter på at du skal vekke mosaikken.'
  };
}

export function startPuzzleQuest(state: PuzzleQuestState): PuzzleQuestState {
  if (state.phase !== 'intro') {
    return state;
  }
  return {
    ...state,
    phase: 'quiz',
    message: state.challenge.stop.description
  };
}

export function answerPuzzleQuestion(state: PuzzleQuestState, choice: number): PuzzleQuestState {
  if (state.phase !== 'quiz') {
    return state;
  }

  const challenge = answerMathQuestQuestion(state.challenge, choice);
  if (challenge.status === 'lost') {
    return {
      ...state,
      phase: 'lost',
      challenge,
      message: 'Du gikk tom for hjerter. Mosaikken sovner, og oppdraget må startes på nytt.'
    };
  }
  if (challenge.status === 'won') {
    return {
      ...state,
      phase: 'puzzle',
      challenge,
      message: 'Alle tolv brikkene er vekket. Flytt dem til bildet er helt.'
    };
  }
  return {
    ...state,
    challenge,
    message: challenge.message
  };
}

export function swapPuzzlePieces(
  state: PuzzleQuestState,
  firstSlot: number,
  secondSlot: number
): PuzzleQuestState {
  if (
    state.phase !== 'puzzle'
    || firstSlot === secondSlot
    || firstSlot < 0
    || secondSlot < 0
    || firstSlot >= state.pieceOrder.length
    || secondSlot >= state.pieceOrder.length
    || state.pieceOrder[firstSlot] === firstSlot
    || state.pieceOrder[secondSlot] === secondSlot
  ) {
    return state;
  }

  const pieceOrder = [...state.pieceOrder];
  [pieceOrder[firstSlot], pieceOrder[secondSlot]] = [pieceOrder[secondSlot], pieceOrder[firstSlot]];
  const solved = pieceOrder.every((piece, slot) => piece === slot);
  return {
    ...state,
    phase: solved ? 'reward' : 'puzzle',
    pieceOrder,
    moves: state.moves + 1,
    message: solved
      ? 'Mosaikken er hel igjen! Puslespill-mesteren står klar med belønningen.'
      : 'Brikkene glir på plass. Finn neste riktige kobling.'
  };
}

export function solvePuzzleForDev(state: PuzzleQuestState): PuzzleQuestState {
  if (state.phase !== 'puzzle') {
    return state;
  }
  return {
    ...state,
    phase: 'reward',
    pieceOrder: Array.from({ length: PUZZLE_PIECE_COUNT }, (_, index) => index),
    message: 'Mosaikken er hel igjen! Puslespill-mesteren står klar med belønningen.'
  };
}

export function markPuzzleRewardPaid(state: PuzzleQuestState): PuzzleQuestState {
  if (state.phase !== 'reward') {
    return state;
  }
  return {
    ...state,
    phase: 'paid',
    message: `${state.rewardValue} Regnecoins er lagt i ryggsekken.`
  };
}
