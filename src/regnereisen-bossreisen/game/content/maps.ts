export type GameMapId = 'bossreisen' | 'regneriket';

export type GameMapConfig = {
  id: GameMapId;
  label: string;
  description: string;
  textureKey: string;
  image: string;
  width: number;
  height: number;
  startX: number;
  startY: number;
  hasCollisionMask: boolean;
  showBossJourney: boolean;
};

export const BOSS_MAP_ID: GameMapId = 'bossreisen';
export const REGNERIKET_MAP_ID: GameMapId = 'regneriket';
export const DEFAULT_MAP_ID = BOSS_MAP_ID;

export const GAME_MAPS: GameMapConfig[] = [
  {
    id: BOSS_MAP_ID,
    label: 'Boss-reisen',
    description: 'Kjemp mot bossene, samle mynter og finn medaljene.',
    textureKey: 'world-map-bossreisen',
    image: '/regnemester/maps/world-map-v2.png',
    width: 2400,
    height: 1600,
    startX: 430,
    startY: 305,
    hasCollisionMask: true,
    showBossJourney: true
  },
  {
    id: REGNERIKET_MAP_ID,
    label: 'Regneriket',
    description: 'Stor ny verden for oppdrag, stoppesteder og utforsking.',
    textureKey: 'world-map-regneriket',
    image: '/regnemester/maps/world-map-v4.png',
    width: 3840,
    height: 2560,
    startX: 430,
    startY: 360,
    hasCollisionMask: true,
    showBossJourney: false
  }
];

export function getGameMap(id?: string): GameMapConfig {
  return GAME_MAPS.find((map) => map.id === id) ?? GAME_MAPS[0];
}
