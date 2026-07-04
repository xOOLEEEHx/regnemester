export const MAP_BOSS_REWARD_EXPERIMENT = true;
export const RED_COLLISION_MASK_TEST = true;
export const RED_COLLISION_MASK_PATH = '/regnemester/maps/world-map-collision-mask.png';
export const HIDDEN_MEGA_LOCATION_ID = 'mega-regnemesteren';

export type CoinOffset = {
  x: number;
  y: number;
};

export const REWARD_COIN_OFFSETS: Record<string, CoinOffset> = {
  slimmyra: { x: 205, y: 92 },
  trollhulen: { x: -190, y: 104 },
  skyggeborgen: { x: 174, y: 116 },
  frostfjellene: { x: -172, y: 124 },
  vulkanringen: { x: 154, y: -132 },
  tordentoppen: { x: -180, y: 108 },
  krystallgrotten: { x: 172, y: -122 },
  tannhjulsbyen: { x: -184, y: 124 },
  dypvannshavet: { x: 176, y: -120 },
  'siste-arenaen': { x: -178, y: -116 },
  'mega-regnemesteren': { x: 160, y: -98 }
};

export function isMapBossMarkerLocation(locationId: string): boolean {
  return MAP_BOSS_REWARD_EXPERIMENT && Boolean(locationId);
}

export function isRewardLocation(_locationId: string): boolean {
  return MAP_BOSS_REWARD_EXPERIMENT;
}

export function getRewardCoinOffset(locationId: string): CoinOffset {
  return REWARD_COIN_OFFSETS[locationId] ?? { x: 156, y: 96 };
}
