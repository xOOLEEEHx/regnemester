import { getMapObjectPosition } from './mapObjectPositions';
import { TALLVOKTER_MAP_ID } from './maps';
import { getEffectiveDifficulty, type Difficulty, type GameSettings } from './settings';
import type { MathQuestDefinition } from '../simulation/mathQuest';

export const MAZE_QUEST_ID = 'labyrintens-fire-segl';
export const MAZE_GUARDIAN_TEXTURE_KEY = 'maze-guardian';
export const MAZE_GUARDIAN_ASSET_PATH = '/regnemester/maze/maze-guardian-v2.png?v=2';
export const MAZE_GATE_COUNT = 4;
export const MAZE_GATE_QUESTION_COUNT = 5;

export const MAZE_QUEST_CONFIG = {
  guardianPosition: getMapObjectPosition(TALLVOKTER_MAP_ID, 'mazeGuardian'),
  interactionDistance: 110
} as const;

export const MAZE_WELCOME =
  'Fire magiske segl er skjult i forskjellige blindveier. Du ser bare området rundt spillbrikken og må utforske sidegangene for å finne dem. Hvert segl åpnes med fem riktige svar. Feil svar koster ett hjerte, og mister du alle hjertene, må hele labyrinten startes på nytt.';

export function createMazeGateDefinition(index: number): MathQuestDefinition {
  const number = index + 1;
  return {
    id: `maze-seal-${number}`,
    place: `Seglport ${number} av ${MAZE_GATE_COUNT}`,
    title: `Det ${['første', 'andre', 'tredje', 'fjerde'][index]} seglet`,
    description: `Svar riktig på ${MAZE_GATE_QUESTION_COUNT} matematikkoppgaver for å åpne porten.`,
    successText: `Seglport ${number} er åpnet!`,
    iconSrc: MAZE_GUARDIAN_ASSET_PATH,
    operations: ['add', 'subtract', 'multiply', 'divide'],
    requiredCorrect: MAZE_GATE_QUESTION_COUNT
  };
}

const REWARDS: Record<Difficulty, number> = {
  'easy-add-subtract': 35,
  easy: 35,
  normal: 45,
  hard: 60
};

export function getMazeReward(settings: GameSettings): number {
  return REWARDS[getEffectiveDifficulty(settings)];
}
