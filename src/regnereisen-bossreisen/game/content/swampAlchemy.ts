import type { Operation } from './locations';
import { getMapObjectPosition } from './mapObjectPositions';
import { TALLVOKTER_MAP_ID } from './maps';
import { getEffectiveDifficulty, type Difficulty, type GameSettings } from './settings';

export type SwampIngredientId =
  | 'crystalWater'
  | 'glowMushroom'
  | 'moonRoot'
  | 'swampBerry';

export type SwampIngredientDefinition = {
  id: SwampIngredientId;
  displayName: string;
  assetPath: string;
  liquidColor: number;
  accentColor: number;
};

export type SwampAlchemyRoundDefinition = {
  id: string;
  place: string;
  title: string;
  description: string;
  successText: string;
  iconSrc: string;
  operations: Operation[];
  requiredCorrect: number;
  ingredient: SwampIngredientDefinition;
};

export const SWAMP_ALCHEMY_QUEST_ID = 'sumpalkymistens-motgift';
export const SWAMP_ALCHEMY_REQUIRED_PER_ROUND = 3;
export const SWAMP_ALCHEMY_TOTAL_REQUIRED = 12;

export const SWAMP_ALCHEMIST_TEXTURE_KEY = 'swamp-alchemy-alchemist';
export const SWAMP_ALCHEMIST_MAP_TEXTURE_KEY = 'swamp-alchemy-alchemist-map';
export const SWAMP_ALCHEMY_BACKGROUND_TEXTURE_KEY = 'swamp-alchemy-background';
export const SWAMP_ALCHEMY_CAULDRON_TEXTURE_KEY = 'swamp-alchemy-cauldron';
export const SWAMP_ALCHEMY_WORKBENCH_TEXTURE_KEY = 'swamp-alchemy-workbench';
export const SWAMP_ALCHEMY_SPOON_TEXTURE_KEY = 'swamp-alchemy-spoon';

export const SWAMP_ALCHEMIST_ASSET_PATH = '/regnemester/swamp-alchemy/swamp-alchemist.png';
export const SWAMP_ALCHEMIST_MAP_ASSET_PATH = '/regnemester/swamp-alchemy/swamp-alchemist-map.png';
export const SWAMP_ALCHEMY_BACKGROUND_ASSET_PATH = '/regnemester/swamp-alchemy/swamp-laboratory-background.png';
export const SWAMP_ALCHEMY_CAULDRON_ASSET_PATH = '/regnemester/swamp-alchemy/cauldron.png';
export const SWAMP_ALCHEMY_WORKBENCH_ASSET_PATH = '/regnemester/swamp-alchemy/workbench.png';
export const SWAMP_ALCHEMY_SPOON_ASSET_PATH = '/regnemester/swamp-alchemy/stirring-spoon.png';

export const SWAMP_ALCHEMY_CONFIG = {
  alchemistPosition: getMapObjectPosition(TALLVOKTER_MAP_ID, 'swampAlchemist'),
  interactionDistance: 122
} as const;

export const SWAMP_ALCHEMY_WELCOME =
  'Den giftige sumptåken blir sterkere. Hjelp meg å brygge motgiften: løs tre matematikkoppgaver, før ingrediensen til gryten og rør brygget ferdig. Vi trenger fire ingredienser og tolv riktige svar.';

const ALL_OPERATIONS: Operation[] = ['add', 'subtract', 'multiply', 'divide'];

export const SWAMP_ALCHEMY_INGREDIENTS: readonly SwampIngredientDefinition[] = [
  {
    id: 'crystalWater',
    displayName: 'Krystallvann',
    assetPath: '/regnemester/swamp-alchemy/crystal-water.png',
    liquidColor: 0x39d9e6,
    accentColor: 0xa9fbff
  },
  {
    id: 'glowMushroom',
    displayName: 'Glødesopp',
    assetPath: '/regnemester/swamp-alchemy/glow-mushroom.png',
    liquidColor: 0x59e36f,
    accentColor: 0xc9ff8f
  },
  {
    id: 'moonRoot',
    displayName: 'Månerot',
    assetPath: '/regnemester/swamp-alchemy/moon-root.png',
    liquidColor: 0xa36cff,
    accentColor: 0xead3ff
  },
  {
    id: 'swampBerry',
    displayName: 'Sumpbær',
    assetPath: '/regnemester/swamp-alchemy/swamp-berry.png',
    liquidColor: 0xe7c94f,
    accentColor: 0xf8ff9a
  }
] as const;

export const SWAMP_ALCHEMY_ROUNDS: readonly SwampAlchemyRoundDefinition[] =
  SWAMP_ALCHEMY_INGREDIENTS.map((ingredient, index) => ({
    id: `sumpbrygg-${ingredient.id}`,
    place: `Bryggerunde ${index + 1} av ${SWAMP_ALCHEMY_INGREDIENTS.length}`,
    title: ingredient.displayName,
    description: `Svar riktig på ${SWAMP_ALCHEMY_REQUIRED_PER_ROUND} matematikkoppgaver for å vekke ${ingredient.displayName.toLowerCase()}.`,
    successText: `${ingredient.displayName} er klar. Før ingrediensen til gryten.`,
    iconSrc: ingredient.assetPath,
    operations: [...ALL_OPERATIONS],
    requiredCorrect: SWAMP_ALCHEMY_REQUIRED_PER_ROUND,
    ingredient
  }));

const SWAMP_ALCHEMY_REWARDS: Record<Difficulty, number> = {
  'easy-add-subtract': 45,
  easy: 45,
  normal: 60,
  hard: 80
};

export function getSwampAlchemyReward(settings: GameSettings): number {
  return SWAMP_ALCHEMY_REWARDS[getEffectiveDifficulty(settings)];
}

export function getSwampAlchemyIngredientTextureKey(id: SwampIngredientId): string {
  return `swamp-alchemy-ingredient-${id}`;
}
