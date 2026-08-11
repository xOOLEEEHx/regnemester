export type CounterweightPuzzleDifficulty = 'easy-add-subtract' | 'easy' | 'normal' | 'hard';

export type CounterweightPuzzleRules = {
  targetRanges: ReadonlyArray<readonly [number, number]>;
  solutionStoneCount: number;
  totalStoneCount: number;
  minimumStoneValue: number;
};

const PUZZLE_RULES: Record<CounterweightPuzzleDifficulty, CounterweightPuzzleRules> = {
  'easy-add-subtract': {
    targetRanges: [[8, 13], [12, 18], [16, 20], [18, 20]],
    solutionStoneCount: 2,
    totalStoneCount: 4,
    minimumStoneValue: 2
  },
  easy: {
    targetRanges: [[8, 13], [12, 18], [16, 20], [18, 20]],
    solutionStoneCount: 2,
    totalStoneCount: 4,
    minimumStoneValue: 2
  },
  normal: {
    targetRanges: [[12, 20], [18, 28], [24, 36], [30, 44]],
    solutionStoneCount: 3,
    totalStoneCount: 5,
    minimumStoneValue: 2
  },
  hard: {
    targetRanges: [[18, 28], [26, 40], [36, 52], [46, 68]],
    solutionStoneCount: 3,
    totalStoneCount: 6,
    minimumStoneValue: 3
  }
};

export function getCounterweightPuzzleRules(
  difficulty: CounterweightPuzzleDifficulty
): CounterweightPuzzleRules {
  return PUZZLE_RULES[difficulty];
}

export function getCounterweightTargetRange(
  difficulty: CounterweightPuzzleDifficulty,
  lockIndex: number
): readonly [number, number] {
  const ranges = PUZZLE_RULES[difficulty].targetRanges;
  const safeIndex = Math.max(0, Math.min(ranges.length - 1, lockIndex));
  return ranges[safeIndex];
}
