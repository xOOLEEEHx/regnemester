import type { Operation } from './locations';
import { DEFAULT_TOKEN_ID } from './playerTokens';

export type OperationMode = Operation | 'mixed';
export type Difficulty = 'easy' | 'normal' | 'hard';
export type PlayMode = 'normal' | 'story';

export type GameSettings = {
  started: boolean;
  tokenId: string;
  operationMode: OperationMode;
  difficulty: Difficulty;
  playMode: PlayMode;
};

export type MathDifficultyProfile = {
  add: {
    min: number;
    max: number;
  };
  subtract: {
    min: number;
    max: number;
  };
  multiply: {
    min: number;
    max: number;
  };
  divide: {
    divisorMin: number;
    divisorMax: number;
    quotientMin: number;
    quotientMax: number;
  };
};

export const DEFAULT_SETTINGS: GameSettings = {
  started: false,
  tokenId: DEFAULT_TOKEN_ID,
  operationMode: 'mixed',
  difficulty: 'normal',
  playMode: 'normal'
};

export const OPERATION_OPTIONS: Array<{ id: OperationMode; label: string; shortLabel: string }> = [
  { id: 'add', label: 'Addisjon', shortLabel: '+' },
  { id: 'subtract', label: 'Subtraksjon', shortLabel: '−' },
  { id: 'multiply', label: 'Multiplikasjon', shortLabel: '×' },
  { id: 'divide', label: 'Divisjon', shortLabel: '÷' },
  { id: 'mixed', label: 'Blanding', shortLabel: '' }
];

export const DIFFICULTY_OPTIONS: Array<{ id: Difficulty; label: string; playerHearts: number; profile: MathDifficultyProfile }> = [
  {
    id: 'easy',
    label: 'Lett',
    playerHearts: 5,
    profile: {
      add: { min: 0, max: 20 },
      subtract: { min: 0, max: 20 },
      multiply: { min: 0, max: 5 },
      divide: { divisorMin: 1, divisorMax: 5, quotientMin: 1, quotientMax: 10 }
    }
  },
  {
    id: 'normal',
    label: 'Middels',
    playerHearts: 3,
    profile: {
      add: { min: 0, max: 100 },
      subtract: { min: 0, max: 100 },
      multiply: { min: 0, max: 10 },
      divide: { divisorMin: 1, divisorMax: 10, quotientMin: 1, quotientMax: 10 }
    }
  },
  {
    id: 'hard',
    label: 'Vanskelig',
    playerHearts: 2,
    profile: {
      add: { min: 0, max: 1000 },
      subtract: { min: 0, max: 1000 },
      multiply: { min: 0, max: 20 },
      divide: { divisorMin: 1, divisorMax: 20, quotientMin: 1, quotientMax: 20 }
    }
  }
];

export function getDifficultyOption(difficulty: Difficulty) {
  return DIFFICULTY_OPTIONS.find((option) => option.id === difficulty) ?? DIFFICULTY_OPTIONS[1];
}

export function getEffectiveDifficulty(settings: GameSettings): Difficulty {
  return settings.playMode === 'story' ? 'normal' : settings.difficulty;
}

export function getMathProfile(difficulty: Difficulty): MathDifficultyProfile {
  return getDifficultyOption(difficulty).profile;
}
