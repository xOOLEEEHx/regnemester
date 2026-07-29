import type { Operation } from './locations';
import { getMapObjectPosition } from './mapObjectPositions';
import { TALLVOKTER_MAP_ID } from './maps';
import { getEffectiveDifficulty, type Difficulty, type GameSettings } from './settings';
import type { MathQuestDefinition } from '../simulation/mathQuest';

export type LightForestAreaId =
  | 'dew-tree'
  | 'sun-tree'
  | 'moon-tree'
  | 'star-tree'
  | 'elder-root';

export type LightForestAreaDefinition = MathQuestDefinition & {
  id: LightForestAreaId;
  glowColor: number;
  accentColor: number;
};

// ID-en beholdes slik at eksisterende lagring og skattekisteoppføring ikke brytes.
export const LIGHT_FOREST_QUEST_ID = 'lysskogen-vakner';
export const LIGHT_FOREST_REQUIRED_PER_AREA = 2;
export const LIGHT_FOREST_TOTAL_REQUIRED = 10;

export const LIGHT_WEAVER_TEXTURE_KEY = 'light-forest-weaver';
export const LIGHT_WEAVER_MAP_TEXTURE_KEY = 'light-forest-weaver-map';
export const LIGHT_SPIRIT_TEXTURE_KEY = 'light-forest-spirit';
export const LIGHT_FOREST_NETWORK_TEXTURE_KEY = 'light-forest-root-network';
export const LIGHT_FOREST_ROOT_KNOT_TEXTURE_KEY = 'light-forest-root-knot';

export const LIGHT_WEAVER_ASSET_PATH = '/regnemester/light-forest/light-weaver.png';
export const LIGHT_WEAVER_MAP_ASSET_PATH = '/regnemester/light-forest/light-weaver-map.png';
export const LIGHT_SPIRIT_ASSET_PATH = '/regnemester/light-forest/light-spirit.png';
export const LIGHT_FOREST_NETWORK_ASSET_PATH = '/regnemester/light-forest/light-root-network.png';
export const LIGHT_FOREST_ROOT_KNOT_ASSET_PATH = '/regnemester/light-forest/root-knot.png';

export const LIGHT_FOREST_CONFIG = {
  guardianPosition: getMapObjectPosition(TALLVOKTER_MAP_ID, 'lightWeaver'),
  interactionDistance: 128
} as const;

export const LIGHT_FOREST_WELCOME =
  'Fem sovende lystrær har mistet forbindelsen til skogens rothjerte. '
  + 'Svar riktig på to matematikkoppgaver for å lade en lysgnist. '
  + 'Roter deretter de magiske rotknutene til lysroten henger sammen, slik at gnisten kan vekke treet. '
  + 'Feil svar koster ett hjerte.';

const ALL_OPERATIONS: Operation[] = ['add', 'subtract', 'multiply', 'divide'];

export const LIGHT_FOREST_AREAS: readonly LightForestAreaDefinition[] = [
  {
    id: 'dew-tree',
    place: 'Duggtreet',
    title: 'Tenn Duggtreets røtter',
    description: 'Lad en lysgnist og reparer forbindelsen til Duggtreet.',
    successText: 'Duggtreet våkner!',
    iconSrc: LIGHT_SPIRIT_ASSET_PATH,
    operations: [...ALL_OPERATIONS],
    requiredCorrect: LIGHT_FOREST_REQUIRED_PER_AREA,
    glowColor: 0x66ffe0,
    accentColor: 0xd7fff5
  },
  {
    id: 'sun-tree',
    place: 'Solgløden',
    title: 'Før lyset til Solgløden',
    description: 'Lad neste lysgnist og knytt Solgløden til nettverket.',
    successText: 'Solgløden stråler igjen!',
    iconSrc: LIGHT_SPIRIT_ASSET_PATH,
    operations: [...ALL_OPERATIONS],
    requiredCorrect: LIGHT_FOREST_REQUIRED_PER_AREA,
    glowColor: 0xffd96b,
    accentColor: 0xffffd7
  },
  {
    id: 'moon-tree',
    place: 'Månekronen',
    title: 'Vekk Månekronen',
    description: 'Reparer den mørke roten som fører til Månekronen.',
    successText: 'Månekronen fylles med lys!',
    iconSrc: LIGHT_SPIRIT_ASSET_PATH,
    operations: [...ALL_OPERATIONS],
    requiredCorrect: LIGHT_FOREST_REQUIRED_PER_AREA,
    glowColor: 0xb181ff,
    accentColor: 0xf0ddff
  },
  {
    id: 'star-tree',
    place: 'Stjernestammen',
    title: 'Tenn Stjernestammen',
    description: 'Koble Stjernestammen tilbake til skogens rothjerte.',
    successText: 'Stjernestammen er vekket!',
    iconSrc: LIGHT_SPIRIT_ASSET_PATH,
    operations: [...ALL_OPERATIONS],
    requiredCorrect: LIGHT_FOREST_REQUIRED_PER_AREA,
    glowColor: 0x54bfff,
    accentColor: 0xd8f4ff
  },
  {
    id: 'elder-root',
    place: 'Eldreroten',
    title: 'Fullfør nettverket',
    description: 'Den siste lysgnisten skal vekke Eldreroten og hele skogen.',
    successText: 'Eldreroten lever, og nettverket er komplett!',
    iconSrc: LIGHT_SPIRIT_ASSET_PATH,
    operations: [...ALL_OPERATIONS],
    requiredCorrect: LIGHT_FOREST_REQUIRED_PER_AREA,
    glowColor: 0x8cff8a,
    accentColor: 0xe6ffe2
  }
] as const;

const LIGHT_FOREST_REWARDS: Record<Difficulty, number> = {
  'easy-add-subtract': 50,
  easy: 50,
  normal: 65,
  hard: 85
};

export function getLightForestReward(settings: GameSettings): number {
  return LIGHT_FOREST_REWARDS[getEffectiveDifficulty(settings)];
}

export function getLightForestArea(index: number): LightForestAreaDefinition {
  return LIGHT_FOREST_AREAS[Math.max(0, Math.min(LIGHT_FOREST_AREAS.length - 1, index))];
}
