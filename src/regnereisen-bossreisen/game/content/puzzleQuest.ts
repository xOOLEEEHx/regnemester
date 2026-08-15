import type { Operation } from './locations';
import { getMapObjectPosition } from './mapObjectPositions';
import { TALLVOKTER_MAP_ID } from './maps';
import { getEffectiveDifficulty, type Difficulty, type GameSettings } from './settings';
import type { MathQuestDefinition } from '../simulation/mathQuest';

export const PUZZLE_QUEST_ID = 'puslespill-mesteren';
export const PUZZLE_PIECE_COUNT = 12;
export const PUZZLE_COLUMNS = 4;
export const PUZZLE_ROWS = 3;
export const PUZZLE_MASTER_TEXTURE_KEY = 'puzzle-master';
export const PUZZLE_MASTER_ASSET_PATH = '/regnemester/puzzle/puzzle-master.webp';

export type PuzzleImageDefinition = {
  id: string;
  title: string;
  assetPath: string;
};

export const PUZZLE_IMAGES: readonly PuzzleImageDefinition[] = [
  {
    id: 'krystalldragen',
    title: 'Krystalldragens øyrike',
    assetPath: '/regnemester/puzzle/puzzle-crystal-dragon.webp'
  },
  {
    id: 'stjerneobservatoriet',
    title: 'Stjerneobservatoriet',
    assetPath: '/regnemester/puzzle/puzzle-star-observatory.webp'
  },
  {
    id: 'manetempel',
    title: 'Månetempelet',
    assetPath: '/regnemester/puzzle/puzzle-moonlit-temple.webp'
  },
  {
    id: 'andeskogen',
    title: 'Åndeskogens vokter',
    assetPath: '/regnemester/puzzle/puzzle-spirit-forest.webp'
  },
  {
    id: 'tallbiblioteket',
    title: 'Det levende tallbiblioteket',
    assetPath: '/regnemester/puzzle/puzzle-number-library.webp'
  },
  {
    id: 'krystallhagen',
    title: 'Krystallhagens kjempe',
    assetPath: '/regnemester/puzzle/puzzle-crystal-golem.webp'
  }
] as const;

export const PUZZLE_QUEST_CONFIG = {
  masterPosition: getMapObjectPosition(TALLVOKTER_MAP_ID, 'puzzleMaster'),
  interactionDistance: 112
} as const;

export const PUZZLE_QUEST_WELCOME =
  'En magisk mosaikk er knust i tolv brikker. Svar riktig på tolv matematikkoppgaver for å vekke brikkene, og sett dem deretter sammen til et helt bilde. Feil svar koster ett hjerte.';

const ALL_OPERATIONS: Operation[] = ['add', 'subtract', 'multiply', 'divide'];

export const PUZZLE_MATH_CHALLENGE: MathQuestDefinition = {
  id: PUZZLE_QUEST_ID,
  place: 'Ruinbyen',
  title: 'Vekk mosaikkens tolv brikker',
  description: PUZZLE_QUEST_WELCOME,
  successText: 'Alle tolv brikkene er vekket. Nå må mosaikken settes sammen!',
  iconSrc: PUZZLE_MASTER_ASSET_PATH,
  operations: ALL_OPERATIONS,
  requiredCorrect: PUZZLE_PIECE_COUNT
};

const REWARDS: Record<Difficulty, number> = {
  'easy-add-subtract': 40,
  easy: 40,
  normal: 55,
  hard: 70
};

export function getPuzzleQuestReward(settings: GameSettings): number {
  return REWARDS[getEffectiveDifficulty(settings)];
}
