import type { Operation } from './locations';
import { getMapObjectPosition } from './mapObjectPositions';
import { TALLVOKTER_MAP_ID } from './maps';
import { getEffectiveDifficulty, type Difficulty, type GameSettings } from './settings';
import type { MathQuestDefinition } from '../simulation/mathQuest';

export const ARCHIVE_QUEST_ID = 'tallarkivets-skriftruller';
export const ARCHIVIST_TEXTURE_KEY = 'archive-archivist';
export const ARCHIVIST_ASSET_PATH = '/regnemester/archive/riksarkivar.png';
export const ARCHIVE_SCROLL_COUNT = 10;

export const ARCHIVE_CONFIG = {
  archivistPosition: getMapObjectPosition(TALLVOKTER_MAP_ID, 'archivist'),
  interactionDistance: 122
} as const;

export const ARCHIVE_WELCOME =
  'Et vindkast har blandet de ti viktigste skriftrullene i Tallarkivet. Les regnestykket på hver rull og dra den til hyllen med riktig svar. Feil hylle koster ett hjerte.';

export const ARCHIVE_QUEST_DEFINITION: MathQuestDefinition = {
  id: ARCHIVE_QUEST_ID,
  place: 'Tallarkivet',
  title: 'Tallarkivets forsvunne skriftruller',
  description: 'Sorter ti skriftruller ved å dra hver rull til hyllen med riktig svar.',
  successText: 'Alle skriftrullene står igjen på riktig plass!',
  iconSrc: ARCHIVIST_ASSET_PATH,
  operations: ['add', 'subtract', 'multiply', 'divide'] as Operation[],
  requiredCorrect: ARCHIVE_SCROLL_COUNT
};

const ARCHIVE_REWARDS: Record<Difficulty, number> = {
  'easy-add-subtract': 40,
  easy: 40,
  normal: 55,
  hard: 70
};

export function getArchiveReward(settings: GameSettings): number {
  return ARCHIVE_REWARDS[getEffectiveDifficulty(settings)];
}
