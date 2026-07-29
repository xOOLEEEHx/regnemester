import Phaser from 'phaser';
import { SHOWCASE_ASSETS } from './assets';
import { MAP_HEIGHT, MAP_WIDTH, WATERFALL_POINTS } from './mapRegions';

const GRID_SCALE = 4;
const MIN_COMPONENT_CELLS = 3;

export type WaterfallRegion = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type SizedCanvasSource = CanvasImageSource & {
  width: number;
  height: number;
  naturalWidth?: number;
  naturalHeight?: number;
};

function isManualMarker(red: number, green: number, blue: number): boolean {
  const marker = SHOWCASE_ASSETS.waterfallMask.marker;
  return red >= marker.minRed && green <= marker.maxGreen && blue >= marker.minBlue;
}

/**
 * Reads only the user's magenta paint and converts each connected mark into a
 * waterfall rectangle. The unchanged template contains no marker pixels, so
 * the temporary hand-tuned points remain active until the user has painted it.
 */
export function readManualWaterfallRegions(scene: Phaser.Scene): readonly WaterfallRegion[] {
  if (!SHOWCASE_ASSETS.waterfallMask.available) return WATERFALL_POINTS;

  const sourceTexture = scene.textures.get(SHOWCASE_ASSETS.waterfallMask.sourceKey);
  const source = sourceTexture.getSourceImage() as SizedCanvasSource;
  const sourceWidth = source.naturalWidth || source.width;
  const sourceHeight = source.naturalHeight || source.height;
  if (sourceWidth !== MAP_WIDTH || sourceHeight !== MAP_HEIGHT) {
    throw new Error(
      `Den manuelle fossefallmarkeringen er ${sourceWidth} Ã— ${sourceHeight}; forventet ${MAP_WIDTH} Ã— ${MAP_HEIGHT}.`
    );
  }

  const canvas = document.createElement('canvas');
  canvas.width = sourceWidth;
  canvas.height = sourceHeight;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Kunne ikke lese den manuelle fossefallmarkeringen.');
  context.drawImage(source, 0, 0, sourceWidth, sourceHeight);
  const pixels = context.getImageData(0, 0, sourceWidth, sourceHeight).data;

  const gridWidth = Math.ceil(sourceWidth / GRID_SCALE);
  const gridHeight = Math.ceil(sourceHeight / GRID_SCALE);
  const occupied = new Uint8Array(gridWidth * gridHeight);
  for (let y = 0; y < sourceHeight; y += 1) {
    for (let x = 0; x < sourceWidth; x += 1) {
      const pixelIndex = (y * sourceWidth + x) * 4;
      if (!isManualMarker(pixels[pixelIndex], pixels[pixelIndex + 1], pixels[pixelIndex + 2])) continue;
      occupied[Math.floor(y / GRID_SCALE) * gridWidth + Math.floor(x / GRID_SCALE)] = 1;
    }
  }

  const queue = new Int32Array(occupied.length);
  const regions: WaterfallRegion[] = [];
  for (let start = 0; start < occupied.length; start += 1) {
    if (occupied[start] !== 1) continue;
    let head = 0;
    let tail = 0;
    let count = 0;
    let minX = gridWidth;
    let maxX = 0;
    let minY = gridHeight;
    let maxY = 0;
    occupied[start] = 2;
    queue[tail++] = start;

    while (head < tail) {
      const current = queue[head++];
      const x = current % gridWidth;
      const y = Math.floor(current / gridWidth);
      count += 1;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);

      for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
        for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
          if (offsetX === 0 && offsetY === 0) continue;
          const nextX = x + offsetX;
          const nextY = y + offsetY;
          if (nextX < 0 || nextX >= gridWidth || nextY < 0 || nextY >= gridHeight) continue;
          const next = nextY * gridWidth + nextX;
          if (occupied[next] !== 1) continue;
          occupied[next] = 2;
          queue[tail++] = next;
        }
      }
    }

    if (count < MIN_COMPONENT_CELLS) continue;
    const left = minX * GRID_SCALE;
    const top = minY * GRID_SCALE;
    const right = Math.min(sourceWidth, (maxX + 1) * GRID_SCALE);
    const bottom = Math.min(sourceHeight, (maxY + 1) * GRID_SCALE);
    regions.push({
      x: (left + right) / 2,
      y: top,
      width: Math.max(10, right - left),
      height: Math.max(12, bottom - top)
    });
  }

  canvas.width = 1;
  canvas.height = 1;
  scene.textures.remove(SHOWCASE_ASSETS.waterfallMask.sourceKey);

  if (regions.length === 0) return WATERFALL_POINTS;
  return regions.sort((a, b) => a.y - b.y || a.x - b.x);
}
