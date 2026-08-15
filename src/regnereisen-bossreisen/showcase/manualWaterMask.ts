import Phaser from 'phaser';
import { SHOWCASE_ASSETS } from './assets';
import { MAP_HEIGHT, MAP_WIDTH } from './mapRegions';

const MASK_WIDTH = MAP_WIDTH / 2;
const MASK_HEIGHT = MAP_HEIGHT / 2;

export type ManualWaterMask = {
  textureKey: string;
  width: number;
  height: number;
  coverage: Uint8Array;
  waterPixelRatio: number;
};

type SizedCanvasSource = CanvasImageSource & {
  width: number;
  height: number;
  naturalWidth?: number;
  naturalHeight?: number;
};

/**
 * Reads the precomputed half-resolution alpha mask. It contains the exact same
 * coverage values as the old 3840 x 2560 magenta work template, without making
 * every pupil download and decode that template.
 */
export function createManualWaterMask(scene: Phaser.Scene): ManualWaterMask {
  const sourceTexture = scene.textures.get(SHOWCASE_ASSETS.waterMask.sourceKey);
  const source = sourceTexture.getSourceImage() as SizedCanvasSource;
  const sourceWidth = source.naturalWidth || source.width;
  const sourceHeight = source.naturalHeight || source.height;
  if (sourceWidth !== MASK_WIDTH || sourceHeight !== MASK_HEIGHT) {
    throw new Error(`Den kompakte vannmasken er ${sourceWidth} x ${sourceHeight}; forventet ${MASK_WIDTH} x ${MASK_HEIGHT}.`);
  }

  const readCanvas = document.createElement('canvas');
  readCanvas.width = sourceWidth;
  readCanvas.height = sourceHeight;
  const readContext = readCanvas.getContext('2d', { willReadFrequently: true });
  if (!readContext) throw new Error('Kunne ikke lese den manuelle vannmarkeringen.');
  readContext.drawImage(source, 0, 0, sourceWidth, sourceHeight);
  const sourcePixels = readContext.getImageData(0, 0, sourceWidth, sourceHeight).data;

  if (scene.textures.exists(SHOWCASE_ASSETS.waterMask.runtimeKey)) {
    scene.textures.remove(SHOWCASE_ASSETS.waterMask.runtimeKey);
  }
  const maskTexture = scene.textures.createCanvas(
    SHOWCASE_ASSETS.waterMask.runtimeKey,
    MASK_WIDTH,
    MASK_HEIGHT
  );
  if (!maskTexture) throw new Error('Kunne ikke opprette runtime-vannmasken.');

  const maskImage = maskTexture.context.createImageData(MASK_WIDTH, MASK_HEIGHT);
  const coverage = new Uint8Array(MASK_WIDTH * MASK_HEIGHT);
  let coveredPixels = 0;

  for (let y = 0; y < MASK_HEIGHT; y += 1) {
    for (let x = 0; x < MASK_WIDTH; x += 1) {
      const maskIndex = y * MASK_WIDTH + x;
      const imageIndex = maskIndex * 4;
      const alpha = sourcePixels[imageIndex + 3];
      coverage[maskIndex] = alpha;
      maskImage.data[imageIndex] = 255;
      maskImage.data[imageIndex + 1] = 255;
      maskImage.data[imageIndex + 2] = 255;
      maskImage.data[imageIndex + 3] = alpha;
      if (alpha >= 128) coveredPixels += 1;
    }
  }

  maskTexture.context.putImageData(maskImage, 0, 0);
  maskTexture.refresh();

  readCanvas.width = 1;
  readCanvas.height = 1;
  scene.textures.remove(SHOWCASE_ASSETS.waterMask.sourceKey);

  return {
    textureKey: SHOWCASE_ASSETS.waterMask.runtimeKey,
    width: MASK_WIDTH,
    height: MASK_HEIGHT,
    coverage,
    waterPixelRatio: coveredPixels / coverage.length
  };
}
