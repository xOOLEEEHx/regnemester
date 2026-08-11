export function resolveMazeCellPixelSize(
  cachedCellPixelSize: number,
  measureGridWidth: () => number,
  viewportSize: number
): number {
  if (cachedCellPixelSize > 0) {
    return cachedCellPixelSize;
  }
  if (viewportSize <= 0) {
    return 1;
  }
  return Math.max(1, measureGridWidth() / viewportSize);
}

export type DiscreteMazeDirection = 'up' | 'right' | 'down' | 'left';

export function resolveDiscreteMazeStep(
  input: { x: number; y: number } | undefined,
  timestamp: number,
  lastStepAt: number | undefined,
  intervalMs = 150
): { direction?: DiscreteMazeDirection; lastStepAt?: number } {
  if (!input || (input.x === 0 && input.y === 0)) {
    return {};
  }
  if (lastStepAt !== undefined && timestamp - lastStepAt < intervalMs) {
    return { lastStepAt };
  }

  const direction: DiscreteMazeDirection = Math.abs(input.x) >= Math.abs(input.y)
    ? (input.x >= 0 ? 'right' : 'left')
    : (input.y >= 0 ? 'down' : 'up');
  return { direction, lastStepAt: timestamp };
}
