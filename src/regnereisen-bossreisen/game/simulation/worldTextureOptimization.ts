export const WORLD_MARKER_TEXTURE_SIZE = 320;

export type ContainedTextureRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function getContainedTextureRect(
  sourceWidth: number,
  sourceHeight: number,
  targetSize: number
): ContainedTextureRect | undefined {
  if (sourceWidth <= 0 || sourceHeight <= 0 || targetSize <= 0) {
    return undefined;
  }
  const scale = Math.min(targetSize / sourceWidth, targetSize / sourceHeight);
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));
  return {
    x: Math.round((targetSize - width) / 2),
    y: Math.round((targetSize - height) / 2),
    width,
    height
  };
}
