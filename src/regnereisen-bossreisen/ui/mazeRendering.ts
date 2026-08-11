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
