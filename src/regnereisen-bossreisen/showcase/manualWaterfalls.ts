import { TALLVOKTER_WATERFALL_REGIONS } from './tallvokterWaterfallRegions.generated';

export type WaterfallRegion = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Uses the same rectangles that were derived from the manual waterfall mask.
 * They are generated once during development instead of making every pupil
 * download and scan a full-resolution work template.
 */
export function readManualWaterfallRegions(): readonly WaterfallRegion[] {
  return TALLVOKTER_WATERFALL_REGIONS;
}
