export type MapEditorCameraLimits = {
  minZoom: number;
  maxZoom: number;
};

export function getMapEditorFitZoom(
  viewportWidth: number,
  viewportHeight: number,
  mapWidth: number,
  mapHeight: number
): number {
  if (viewportWidth <= 0 || viewportHeight <= 0 || mapWidth <= 0 || mapHeight <= 0) {
    return 1;
  }
  return Math.min(viewportWidth / mapWidth, viewportHeight / mapHeight) * 0.92;
}

export function getMapEditorCameraLimits(
  fitZoom: number,
  initialZoom: number
): MapEditorCameraLimits {
  const safeInitialZoom = Math.max(initialZoom, 0.01);
  const minZoom = Math.max(0.05, Math.min(fitZoom, safeInitialZoom));
  return {
    minZoom,
    maxZoom: Math.max(safeInitialZoom * 1.6, minZoom * 2)
  };
}

export function getMapEditorZoom(
  currentZoom: number,
  direction: 'in' | 'out',
  limits: MapEditorCameraLimits
): number {
  const factor = direction === 'in' ? 1.18 : 1 / 1.18;
  return Math.min(limits.maxZoom, Math.max(limits.minZoom, currentZoom * factor));
}
