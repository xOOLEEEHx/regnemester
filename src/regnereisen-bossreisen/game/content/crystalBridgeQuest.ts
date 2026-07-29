import type { Operation } from './locations';
import { getMapObjectPosition } from './mapObjectPositions';
import { TALLVOKTER_MAP_ID } from './maps';
import { getEffectiveDifficulty, type Difficulty, type GameSettings } from './settings';
import type { MathQuestDefinition } from '../simulation/mathQuest';

export const CRYSTAL_BRIDGE_QUEST_ID = 'krystallbroens-manglende-ledd';
export const CRYSTAL_BRIDGE_GUARDIAN_TEXTURE_KEY = 'crystal-bridge-guardian';
export const CRYSTAL_BRIDGE_GUARDIAN_ASSET_PATH =
  '/regnemester/crystal-bridge/bridge-guardian.png';
export const CRYSTAL_BRIDGE_CRYSTAL_COUNT = 8;

export const CRYSTAL_BRIDGE_CONFIG = {
  guardianPosition: getMapObjectPosition(TALLVOKTER_MAP_ID, 'crystalBridgeGuardian'),
  interactionDistance: 122
} as const;

export const CRYSTAL_BRIDGE_WELCOME =
  'Krystallbroen har mistet sine åtte lysledd. Løs regnestykkene og før riktig svar-krystall inn i den aktive sokkelen. Feil krystall koster ett hjerte.';

export const CRYSTAL_BRIDGE_QUEST_DEFINITION: MathQuestDefinition = {
  id: CRYSTAL_BRIDGE_QUEST_ID,
  place: 'Krystallbroen',
  title: 'Krystallbroens manglende ledd',
  description:
    'Løs åtte matematikkoppgaver og plasser riktig svar-krystall i broens tomme sokler.',
  successText: 'Alle lysleddene gløder, og den forseglede porten åpner seg!',
  iconSrc: CRYSTAL_BRIDGE_GUARDIAN_ASSET_PATH,
  operations: ['add', 'subtract', 'multiply', 'divide'] as Operation[],
  requiredCorrect: CRYSTAL_BRIDGE_CRYSTAL_COUNT
};

const CRYSTAL_BRIDGE_REWARDS: Record<Difficulty, number> = {
  'easy-add-subtract': 45,
  easy: 45,
  normal: 60,
  hard: 80
};

export function getCrystalBridgeReward(settings: GameSettings): number {
  return CRYSTAL_BRIDGE_REWARDS[getEffectiveDifficulty(settings)];
}
