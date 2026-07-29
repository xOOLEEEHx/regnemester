import type { Operation } from './locations';
import { getMapObjectPosition } from './mapObjectPositions';
import { TALLVOKTER_MAP_ID } from './maps';
import { getEffectiveDifficulty, type Difficulty, type GameSettings } from './settings';

export type ManorSpiderDefinition = {
  id: string;
  place: string;
  title: string;
  description: string;
  successText: string;
  iconSrc: string;
  operations: Operation[];
  requiredCorrect: number;
};

export const MANOR_QUEST_ID = 'herskapshuset';
export const BUTLER_TEXTURE_KEY = 'manor-butler';
export const BUTLER_ASSET_PATH = '/regnemester/manor/butler.png';
export const MANOR_SPIDER_ASSET_PATH = '/regnemester/manor/spider.png';
export const MANOR_WEB_ASSET_PATH = '/regnemester/manor/spider-web-background.png';
export const MANOR_SPIDER_COUNT = 5;
export const MANOR_QUESTIONS_PER_SPIDER = 4;

export const MANOR_CONFIG = {
  butlerPosition: getMapObjectPosition(TALLVOKTER_MAP_ID, 'butler'),
  interactionDistance: 110
} as const;

export const MANOR_WELCOME =
  'Herskapshuset er fullt av edderkopper! Finn og trykk på én edderkopp om gangen. Hver edderkopp slipper taket når du har svart riktig på fire matteoppgaver. Rydd alle fem, så belønner jeg deg for hjelpen.';

export const MANOR_SPIDERS: readonly ManorSpiderDefinition[] = Array.from(
  { length: MANOR_SPIDER_COUNT },
  (_, index) => ({
    id: `herskapshus-edderkopp-${index + 1}`,
    place: `Edderkopp ${index + 1} av ${MANOR_SPIDER_COUNT}`,
    title: 'Spindelvevets vokter',
    description: `Svar riktig på ${MANOR_QUESTIONS_PER_SPIDER} matteoppgaver for å fjerne edderkoppen.`,
    successText: 'Edderkoppen er fjernet!',
    iconSrc: MANOR_SPIDER_ASSET_PATH,
    operations: ['add', 'subtract', 'multiply', 'divide'] as Operation[],
    requiredCorrect: MANOR_QUESTIONS_PER_SPIDER
  })
);

const MANOR_REWARDS: Record<Difficulty, number> = {
  'easy-add-subtract': 40,
  easy: 40,
  normal: 50,
  hard: 65
};

export function getManorReward(settings: GameSettings): number {
  return MANOR_REWARDS[getEffectiveDifficulty(settings)];
}
