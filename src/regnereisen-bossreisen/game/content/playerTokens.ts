export type PlayerToken = {
  id: string;
  label: string;
  src: string;
  cost: number;
  rarity: 'start' | 'common' | 'rare' | 'legendary';
};

const tokenBase = '/regnemester/Spillbrikkene';
const tokenSrc = (filename: string): string => `${tokenBase}/${filename}.webp`;

export const PLAYER_TOKENS: PlayerToken[] = [
  { id: 'elev-gutt', label: 'Elev gutt', src: tokenSrc('regnemester-elev-gutt'), cost: 0, rarity: 'start' },
  { id: 'elev-jente', label: 'Elev jente', src: tokenSrc('regnemester-elev-jente'), cost: 0, rarity: 'start' },
  { id: 'trollmann', label: 'Trollmann', src: tokenSrc('trollmann'), cost: 320, rarity: 'common' },
  { id: 'superblyant', label: 'Superblyant', src: tokenSrc('superblyant'), cost: 360, rarity: 'common' },
  { id: 'nokkelmester', label: 'Nøkkelmester', src: tokenSrc('nokkelmester'), cost: 440, rarity: 'common' },
  { id: 'morsom-dinosaur', label: 'Dinosaur', src: tokenSrc('morsom-dinosaur'), cost: 520, rarity: 'common' },
  { id: 'mini-drage', label: 'Mini-drage', src: tokenSrc('mini-drage-sot'), cost: 680, rarity: 'rare' },
  { id: 'matterobot', label: 'Matterobot', src: tokenSrc('matterobot'), cost: 760, rarity: 'rare' },
  { id: 'magisk-bok', label: 'Magisk bok', src: tokenSrc('magisk-bok'), cost: 840, rarity: 'rare' },
  { id: 'lynrobot', label: 'Lynrobot', src: tokenSrc('lynrobot'), cost: 920, rarity: 'rare' },
  { id: 'kalkulator', label: 'Kalkulator', src: tokenSrc('kul-kalkulator'), cost: 1020, rarity: 'rare' },
  { id: 'krystallvenn', label: 'Krystallvenn', src: tokenSrc('krystallvenn'), cost: 1140, rarity: 'rare' },
  { id: 'stjernehelt', label: 'Stjernehelt', src: tokenSrc('stjernehelt'), cost: 1320, rarity: 'legendary' },
  { id: 'skogrobot', label: 'Skogrobot', src: tokenSrc('skogrobot'), cost: 1480, rarity: 'legendary' },
  { id: 'skydrage', label: 'Skydrage', src: tokenSrc('skydrage'), cost: 1660, rarity: 'legendary' },
  { id: 'krystallninja', label: 'Krystallninja', src: tokenSrc('krystallninja'), cost: 1840, rarity: 'legendary' },
  { id: 'lavasuperhelt', label: 'Lavasuperhelt', src: tokenSrc('lavasuperhelt'), cost: 2040, rarity: 'legendary' },
  { id: 'regnekaptein', label: 'Regnekaptein', src: tokenSrc('regnekaptein'), cost: 2260, rarity: 'legendary' },
  { id: 'neonvokter', label: 'Neonvokter', src: tokenSrc('neonvokter'), cost: 2500, rarity: 'legendary' },
  { id: 'maanesmed', label: 'Månesmed', src: tokenSrc('maanesmed'), cost: 2740, rarity: 'legendary' },
  { id: 'runeskurk', label: 'Runeskurk', src: tokenSrc('runeskurk'), cost: 3000, rarity: 'legendary' },
  { id: 'kosmoridder', label: 'Kosmoridder', src: tokenSrc('kosmoridder'), cost: 3280, rarity: 'legendary' },
  { id: 'gnistheks', label: 'Gnistheks', src: tokenSrc('gnistheks'), cost: 3580, rarity: 'legendary' },
  { id: 'tidsagent', label: 'Tidsagent', src: tokenSrc('tidsagent'), cost: 3900, rarity: 'legendary' },
  { id: 'tordenrev', label: 'Tordenrev', src: tokenSrc('tordenrev'), cost: 4200, rarity: 'legendary' },
  { id: 'galakserobot', label: 'Galakserobot', src: tokenSrc('galakserobot'), cost: 4520, rarity: 'legendary' },
  { id: 'soppridder', label: 'Soppridder', src: tokenSrc('soppridder'), cost: 4860, rarity: 'legendary' },
  { id: 'krystallhavfrue', label: 'Krystallhavfrue', src: tokenSrc('krystallhavfrue'), cost: 5220, rarity: 'legendary' },
  { id: 'lavaskater', label: 'Lavaskater', src: tokenSrc('lavaskater'), cost: 5600, rarity: 'legendary' },
  { id: 'regnbueugle', label: 'Regnbueugle', src: tokenSrc('regnbueugle'), cost: 6000, rarity: 'legendary' }
];

export const DEFAULT_TOKEN_ID = PLAYER_TOKENS[0].id;

const LARGE_VISIBLE_TOKEN_IDS = new Set([
  'nokkelmester',
  'galakserobot',
  'krystallhavfrue',
  'lavaskater',
  'regnbueugle',
  'soppridder',
  'tordenrev'
]);

const MEDIUM_VISIBLE_TOKEN_IDS = new Set([
  'gnistheks',
  'kosmoridder',
  'maanesmed',
  'neonvokter',
  'runeskurk',
  'skydrage',
  'tidsagent'
]);

const COMPACT_VISIBLE_TOKEN_IDS = new Set([
  'krystallninja',
  'lavasuperhelt',
  'regnekaptein',
  'skogrobot',
  'stjernehelt'
]);

export function getTokenById(id: string): PlayerToken {
  return PLAYER_TOKENS.find((token) => token.id === id) ?? PLAYER_TOKENS[0];
}

export function getTokenMapScale(id: string): number {
  if (LARGE_VISIBLE_TOKEN_IDS.has(id)) {
    return 0.9;
  }
  if (MEDIUM_VISIBLE_TOKEN_IDS.has(id)) {
    return 0.95;
  }
  if (COMPACT_VISIBLE_TOKEN_IDS.has(id)) {
    return 1.015;
  }
  return 1;
}
