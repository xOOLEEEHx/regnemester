export type GameMapId = 'bossreisen' | 'regneriket' | 'tallvokterens-rike' | 'regnemonster';

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
export const TALLVOKTER_MAP_ID: GameMapId = 'tallvokterens-rike';
export const REGNEMONSTER_MAP_ID: GameMapId = 'regnemonster';
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
  },
  {
    id: TALLVOKTER_MAP_ID,
    label: 'Tallvokterens verden',
    description: 'Utforsk et magisk rike med oppdrag, aktiviteter og overraskelser.',
    textureKey: 'tallvokter-map',
    image: '/regnemester/maps/tallvokterens-rike-v4.png',
    width: 3840,
    height: 2560,
    startX: 430,
    startY: 2185,
    hasCollisionMask: true,
    showBossJourney: false
  },
  {
    id: REGNEMONSTER_MAP_ID,
    label: 'Regnemonster',
    description: 'Utforsk det nye prøveområdet i Regnemonsterbyen.',
    textureKey: 'regnemonster-reset-placeholder',
    image: '/regnemester/regnemonster/reset-placeholder.svg',
    width: 1920,
    height: 1440,
    startX: 960,
    startY: 1320,
    hasCollisionMask: false,
    showBossJourney: false
  }
];

export function getGameMap(id?: string): GameMapConfig {
  return GAME_MAPS.find((map) => map.id === id) ?? GAME_MAPS[0];
}
