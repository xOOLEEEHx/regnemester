export const REGNEMONSTER_ROUND_LIFE_COUNT = 3;

export type RegnemonsterRoundProgress = {
  correctCount: number;
  livesRemaining: number;
};

export function applyRegnemonsterAnswer(
  progress: RegnemonsterRoundProgress,
  correct: boolean
): RegnemonsterRoundProgress {
  return {
    correctCount: progress.correctCount + (correct ? 1 : 0),
    livesRemaining: progress.livesRemaining - (correct ? 0 : 1)
  };
}

export function getRegnemonsterRoundOutcome(
  progress: RegnemonsterRoundProgress,
  targetCorrectCount: number
): 'continue' | 'failed' | 'complete' {
  if (progress.correctCount >= targetCorrectCount) {
    return 'complete';
  }
  return progress.livesRemaining <= 0 ? 'failed' : 'continue';
}
