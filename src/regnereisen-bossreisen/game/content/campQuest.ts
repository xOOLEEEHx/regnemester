import type { Operation } from './locations';
import { getMapObjectPosition } from './mapObjectPositions';
import { TALLVOKTER_MAP_ID } from './maps';
import { getEffectiveDifficulty, type Difficulty, type GameSettings } from './settings';
import type { MathQuestDefinition } from '../simulation/mathQuest';

export type CampPartKind = 'spoke' | 'rim' | 'hub';

export type CampPartDefinition = {
  id: string;
  kind: CampPartKind;
  displayName: string;
  assetPath: string;
  textureKey: string;
};

export type CampPartPlacement = CampPartDefinition & {
  x: number;
  y: number;
};

export const CAMP_QUEST_ID = 'leirstedet';
export const CAMP_RESIDENT_OBJECT_ID = 'campResident';
export const CAMP_RESIDENT_WAGON_TEXTURE_KEY = 'camp-resident-broken-wagon';
export const CAMP_RESIDENT_WAGON_ASSET_PATH = '/regnemester/camp/camp-resident-broken-wagon.webp';
export const CAMP_RESIDENT_ASSET_PATH = '/regnemester/camp/camp-resident.webp';
export const CAMP_SPOKE_TEXTURE_KEY = 'camp-wheel-spoke';
export const CAMP_SPOKE_ASSET_PATH = '/regnemester/camp/wagon-wheel-spoke-optimized.webp';
export const CAMP_RIM_TEXTURE_KEY = 'camp-wheel-rim';
export const CAMP_RIM_ASSET_PATH = '/regnemester/camp/wagon-wheel-rim-optimized.webp';
export const CAMP_HUB_TEXTURE_KEY = 'camp-wheel-hub';
export const CAMP_HUB_ASSET_PATH = '/regnemester/camp/wagon-wheel-hub-optimized.webp';
export const CAMP_PART_MASK_TEXTURE_KEY = 'tallvokter-camp-part-spawn-mask';
export const CAMP_PART_MASK_PATH = '/regnemester/maps/tallvokter-camp-part-spawn-mask.png';
export const CAMP_PART_MASK_SCALE = 4;
export const CAMP_PART_QUESTION_COUNT = 2;

export const CAMP_CONFIG = {
  residentPosition: getMapObjectPosition(TALLVOKTER_MAP_ID, CAMP_RESIDENT_OBJECT_ID),
  interactionDistance: 165,
  partInteractionDistance: 86
} as const;

export const CAMP_PARTS: readonly CampPartDefinition[] = [
  ...Array.from({ length: 5 }, (_, index): CampPartDefinition => ({
    id: `wheel-spoke-${index + 1}`,
    kind: 'spoke',
    displayName: 'Hjuleike',
    assetPath: CAMP_SPOKE_ASSET_PATH,
    textureKey: CAMP_SPOKE_TEXTURE_KEY
  })),
  {
    id: 'wheel-rim',
    kind: 'rim',
    displayName: 'Hjulring',
    assetPath: CAMP_RIM_ASSET_PATH,
    textureKey: CAMP_RIM_TEXTURE_KEY
  },
  {
    id: 'wheel-hub',
    kind: 'hub',
    displayName: 'Hjulnav',
    assetPath: CAMP_HUB_ASSET_PATH,
    textureKey: CAMP_HUB_TEXTURE_KEY
  }
] as const;

const CAMP_REWARDS: Record<Difficulty, number> = {
  'easy-add-subtract': 36,
  easy: 36,
  normal: 54,
  hard: 77
};

const ALL_OPERATIONS: Operation[] = ['add', 'subtract', 'multiply', 'divide'];

export const CAMP_WELCOME =
  'Et av trehjulene på vognen min er knust. Jeg trenger fem hjuleiker, den ytre hjulringen og navet i midten. Delene har blitt spredt rundt i hele riket. Finn alle sju og kom tilbake, så kan vi få vognen på veien igjen.';

export const CAMP_RETURN_MESSAGE =
  'Alle hjuldelene er samlet! Gå tilbake til mannen ved Leirstedet for å levere dem.';

export function getCampReward(settings: GameSettings): number {
  return CAMP_REWARDS[getEffectiveDifficulty(settings)];
}

export function getCampPart(partId: string): CampPartDefinition | undefined {
  return CAMP_PARTS.find((part) => part.id === partId);
}

export function createCampPartQuest(partId: string): MathQuestDefinition {
  const part = getCampPart(partId) ?? CAMP_PARTS[0];
  const partNumber = part.kind === 'spoke'
    ? Math.max(1, Number(partId.split('-').at(-1)) || 1)
    : undefined;
  const place = partNumber ? `Hjuleike ${partNumber}` : part.displayName;
  return {
    id: `leirsted-del-${part.id}`,
    place,
    title: `Sikre ${part.displayName.toLowerCase()}`,
    description: `Svar riktig på ${CAMP_PART_QUESTION_COUNT} matematikkoppgaver for å få med deg ${part.displayName.toLowerCase()}.`,
    successText: `${part.displayName} er sikret!`,
    iconSrc: part.assetPath,
    operations: [...ALL_OPERATIONS],
    requiredCorrect: CAMP_PART_QUESTION_COUNT
  };
}
