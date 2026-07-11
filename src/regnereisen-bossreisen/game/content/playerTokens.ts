export type PlayerToken = {
  id: string;
  label: string;
  src: string;
  cost: number;
  rarity: 'start' | 'common' | 'rare' | 'legendary';
};

const tokenBase = '/regnemester/Spillbrikkene';

export const PLAYER_TOKENS: PlayerToken[] = [
  { id: 'elev-gutt', label: 'Elev gutt', src: `${tokenBase}/regnemester-elev-gutt.png`, cost: 0, rarity: 'start' },
  { id: 'elev-jente', label: 'Elev jente', src: `${tokenBase}/regnemester-elev-jente.png`, cost: 0, rarity: 'start' },
  { id: 'trollmann', label: 'Trollmann', src: `${tokenBase}/trollmann.png`, cost: 320, rarity: 'common' },
  { id: 'superblyant', label: 'Superblyant', src: `${tokenBase}/superblyant.png`, cost: 360, rarity: 'common' },
  { id: 'nokkelmester', label: 'Nøkkelmester', src: `${tokenBase}/nokkelmester.png`, cost: 440, rarity: 'common' },
  { id: 'morsom-dinosaur', label: 'Dinosaur', src: `${tokenBase}/morsom-dinosaur.png`, cost: 520, rarity: 'common' },
  { id: 'mini-drage', label: 'Mini-drage', src: `${tokenBase}/mini-drage-sot.png`, cost: 680, rarity: 'rare' },
  { id: 'matterobot', label: 'Matterobot', src: `${tokenBase}/matterobot.png`, cost: 760, rarity: 'rare' },
  { id: 'magisk-bok', label: 'Magisk bok', src: `${tokenBase}/magisk-bok.png`, cost: 840, rarity: 'rare' },
  { id: 'lynrobot', label: 'Lynrobot', src: `${tokenBase}/lynrobot.png`, cost: 920, rarity: 'rare' },
  { id: 'kalkulator', label: 'Kalkulator', src: `${tokenBase}/kul-kalkulator.png`, cost: 1020, rarity: 'rare' },
  { id: 'krystallvenn', label: 'Krystallvenn', src: `${tokenBase}/krystallvenn.png`, cost: 1140, rarity: 'rare' },
  { id: 'stjernehelt', label: 'Stjernehelt', src: `${tokenBase}/stjernehelt.png`, cost: 1320, rarity: 'legendary' },
  { id: 'skogrobot', label: 'Skogrobot', src: `${tokenBase}/skogrobot.png`, cost: 1480, rarity: 'legendary' },
  { id: 'skydrage', label: 'Skydrage', src: `${tokenBase}/skydrage.png`, cost: 1660, rarity: 'legendary' },
  { id: 'krystallninja', label: 'Krystallninja', src: `${tokenBase}/krystallninja.png`, cost: 1840, rarity: 'legendary' },
  { id: 'lavasuperhelt', label: 'Lavasuperhelt', src: `${tokenBase}/lavasuperhelt.png`, cost: 2040, rarity: 'legendary' },
  { id: 'regnekaptein', label: 'Regnekaptein', src: `${tokenBase}/regnekaptein.png`, cost: 2260, rarity: 'legendary' },
  { id: 'neonvokter', label: 'Neonvokter', src: `${tokenBase}/neonvokter.png`, cost: 2500, rarity: 'legendary' },
  { id: 'maanesmed', label: 'Månesmed', src: `${tokenBase}/maanesmed.png`, cost: 2740, rarity: 'legendary' },
  { id: 'runeskurk', label: 'Runeskurk', src: `${tokenBase}/runeskurk.png`, cost: 3000, rarity: 'legendary' },
  { id: 'kosmoridder', label: 'Kosmoridder', src: `${tokenBase}/kosmoridder.png`, cost: 3280, rarity: 'legendary' },
  { id: 'gnistheks', label: 'Gnistheks', src: `${tokenBase}/gnistheks.png`, cost: 3580, rarity: 'legendary' },
  { id: 'tidsagent', label: 'Tidsagent', src: `${tokenBase}/tidsagent.png`, cost: 3900, rarity: 'legendary' },
  { id: 'tordenrev', label: 'Tordenrev', src: `${tokenBase}/tordenrev.png`, cost: 4200, rarity: 'legendary' },
  { id: 'galakserobot', label: 'Galakserobot', src: `${tokenBase}/galakserobot.png`, cost: 4520, rarity: 'legendary' },
  { id: 'soppridder', label: 'Soppridder', src: `${tokenBase}/soppridder.png`, cost: 4860, rarity: 'legendary' },
  { id: 'krystallhavfrue', label: 'Krystallhavfrue', src: `${tokenBase}/krystallhavfrue.png`, cost: 5220, rarity: 'legendary' },
  { id: 'lavaskater', label: 'Lavaskater', src: `${tokenBase}/lavaskater.png`, cost: 5600, rarity: 'legendary' },
  { id: 'regnbueugle', label: 'Regnbueugle', src: `${tokenBase}/regnbueugle.png`, cost: 6000, rarity: 'legendary' }
];

export const DEFAULT_TOKEN_ID = PLAYER_TOKENS[0].id;

export function getTokenById(id: string): PlayerToken {
  return PLAYER_TOKENS.find((token) => token.id === id) ?? PLAYER_TOKENS[0];
}
