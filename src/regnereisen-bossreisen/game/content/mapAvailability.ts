const BOSS_MAP_ID = 'boss-reisen';
const TALLVOKTER_MAP_ID = 'tallvokterens-rike';

export function resolveAvailableMapId(mapId: string, tallvokterEnabled: boolean): string {
  if (mapId === TALLVOKTER_MAP_ID && !tallvokterEnabled) {
    return BOSS_MAP_ID;
  }
  return mapId;
}
