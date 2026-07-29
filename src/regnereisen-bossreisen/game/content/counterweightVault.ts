import type { Operation } from './locations';
import { getMapObjectPosition } from './mapObjectPositions';
import { TALLVOKTER_MAP_ID } from './maps';
import { getEffectiveDifficulty, type Difficulty, type GameSettings } from './settings';
import type { MathQuestDefinition } from '../simulation/mathQuest';

export type CounterweightLockDefinition = MathQuestDefinition & {
  lockNumber: number;
  targetWeight: number;
  stoneValues: number[];
};

export const COUNTERWEIGHT_VAULT_QUEST_ID = 'motvekthvelvet';
export const COUNTERWEIGHT_VAULT_LOCK_COUNT = 4;
export const COUNTERWEIGHT_VAULT_REQUIRED_PER_LOCK = 2;

export const VAULT_GUARDIAN_TEXTURE_KEY = 'counterweight-vault-guardian';
export const VAULT_GUARDIAN_MAP_TEXTURE_KEY = 'counterweight-vault-guardian-map';
export const VAULT_BACKGROUND_TEXTURE_KEY = 'counterweight-vault-background';
export const VAULT_RUNE_STONE_TEXTURE_KEY = 'counterweight-vault-rune-stone';
export const VAULT_BALANCE_BASE_TEXTURE_KEY = 'counterweight-vault-balance-base';
export const VAULT_BALANCE_BEAM_TEXTURE_KEY = 'counterweight-vault-balance-beam';
export const VAULT_LEVER_TEXTURE_KEY = 'counterweight-vault-lever-90';
export const VAULT_LEVER_80_TEXTURE_KEY = 'counterweight-vault-lever-80';
export const VAULT_LEVER_70_TEXTURE_KEY = 'counterweight-vault-lever-70';
export const VAULT_LEVER_60_TEXTURE_KEY = 'counterweight-vault-lever-60';
export const VAULT_LEVER_50_TEXTURE_KEY = 'counterweight-vault-lever-50';

export const VAULT_GUARDIAN_ASSET_PATH = '/regnemester/counterweight-vault/vault-guardian.png';
export const VAULT_GUARDIAN_MAP_ASSET_PATH = '/regnemester/counterweight-vault/vault-guardian-map.png';
export const VAULT_BACKGROUND_ASSET_PATH = '/regnemester/counterweight-vault/vault-background.png';
export const VAULT_RUNE_STONE_ASSET_PATH = '/regnemester/counterweight-vault/rune-stone.png';
export const VAULT_BALANCE_BASE_ASSET_PATH = '/regnemester/counterweight-vault/balance-base.png';
export const VAULT_BALANCE_BEAM_ASSET_PATH = '/regnemester/counterweight-vault/balance-beam.png';
export const VAULT_LEVER_ASSET_PATH = '/regnemester/counterweight-vault/vault-lever-90.png';
export const VAULT_LEVER_80_ASSET_PATH = '/regnemester/counterweight-vault/vault-lever-80.png';
export const VAULT_LEVER_70_ASSET_PATH = '/regnemester/counterweight-vault/vault-lever-70.png';
export const VAULT_LEVER_60_ASSET_PATH = '/regnemester/counterweight-vault/vault-lever-60.png';
export const VAULT_LEVER_50_ASSET_PATH = '/regnemester/counterweight-vault/vault-lever-50.png';

export const COUNTERWEIGHT_VAULT_CONFIG = {
  guardianPosition: getMapObjectPosition(TALLVOKTER_MAP_ID, 'vaultGuardian'),
  interactionDistance: 132
} as const;

export const COUNTERWEIGHT_VAULT_WELCOME =
  'Motvekthvelvets fire låser har stivnet. For hver lås må du først løse to '
  + 'matematikkoppgaver. Deretter legger du riktige runesteiner på vektskålen '
  + 'slik at motvekten matcher krystallet. Trekk i spaken når vekten er riktig. '
  + 'Feil svar eller feil balanse koster ett hjerte.';

const ALL_OPERATIONS: Operation[] = ['add', 'subtract', 'multiply', 'divide'];

type CounterweightPuzzleRules = {
  targetRanges: ReadonlyArray<readonly [number, number]>;
  solutionStoneCount: number;
  totalStoneCount: number;
  minimumStoneValue: number;
};

const PUZZLE_RULES: Record<Difficulty, CounterweightPuzzleRules> = {
  'easy-add-subtract': {
    targetRanges: [[8, 13], [12, 18], [16, 24], [20, 30]],
    solutionStoneCount: 2,
    totalStoneCount: 4,
    minimumStoneValue: 2
  },
  easy: {
    targetRanges: [[8, 13], [12, 18], [16, 24], [20, 30]],
    solutionStoneCount: 2,
    totalStoneCount: 4,
    minimumStoneValue: 2
  },
  normal: {
    targetRanges: [[12, 20], [18, 28], [24, 36], [30, 44]],
    solutionStoneCount: 3,
    totalStoneCount: 5,
    minimumStoneValue: 2
  },
  hard: {
    targetRanges: [[18, 28], [26, 40], [36, 52], [46, 68]],
    solutionStoneCount: 3,
    totalStoneCount: 6,
    minimumStoneValue: 3
  }
};

function randomInteger(minimum: number, maximum: number): number {
  return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
}

function shuffled<T>(values: T[]): T[] {
  for (let index = values.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInteger(0, index);
    [values[index], values[swapIndex]] = [values[swapIndex], values[index]];
  }
  return values;
}

function createRandomPuzzle(
  difficulty: Difficulty,
  lockIndex: number
): { targetWeight: number; stoneValues: number[] } {
  const rules = PUZZLE_RULES[difficulty];
  const [minimumTarget, maximumTarget] = rules.targetRanges[lockIndex];
  const targetWeight = randomInteger(minimumTarget, maximumTarget);
  const solution: number[] = [];
  let remaining = targetWeight;

  for (let index = 0; index < rules.solutionStoneCount - 1; index += 1) {
    const remainingSlots = rules.solutionStoneCount - index - 1;
    const maximumPart = remaining - rules.minimumStoneValue * remainingSlots;
    const value = randomInteger(rules.minimumStoneValue, maximumPart);
    solution.push(value);
    remaining -= value;
  }
  solution.push(remaining);

  const stoneValues = [...solution];
  let guard = 0;
  while (stoneValues.length < rules.totalStoneCount && guard < 80) {
    guard += 1;
    const candidate = randomInteger(
      rules.minimumStoneValue,
      Math.max(rules.minimumStoneValue, targetWeight - 1)
    );
    if (!stoneValues.includes(candidate)) stoneValues.push(candidate);
  }

  return {
    targetWeight,
    stoneValues: shuffled(stoneValues)
  };
}

const REWARDS: Record<Difficulty, number> = {
  'easy-add-subtract': 45,
  easy: 45,
  normal: 60,
  hard: 80
};

export function getCounterweightVaultReward(settings: GameSettings): number {
  return REWARDS[getEffectiveDifficulty(settings)];
}

export function getCounterweightLock(
  settings: GameSettings,
  lockIndex: number
): CounterweightLockDefinition {
  const clampedIndex = Math.max(0, Math.min(COUNTERWEIGHT_VAULT_LOCK_COUNT - 1, lockIndex));
  const difficulty = getEffectiveDifficulty(settings);
  const puzzle = createRandomPuzzle(difficulty, clampedIndex);
  const lockNumber = clampedIndex + 1;
  return {
    id: `counterweight-lock-${lockNumber}`,
    lockNumber,
    place: `Lås ${lockNumber}`,
    title: `Vekk hvelvlås ${lockNumber}`,
    description: 'Løs to matematikkoppgaver for å lade låsens motvekt.',
    successText: 'Runekraften er ladet. Balanser vekten.',
    iconSrc: VAULT_RUNE_STONE_ASSET_PATH,
    operations: [...ALL_OPERATIONS],
    requiredCorrect: COUNTERWEIGHT_VAULT_REQUIRED_PER_LOCK,
    targetWeight: puzzle.targetWeight,
    stoneValues: [...puzzle.stoneValues]
  };
}
