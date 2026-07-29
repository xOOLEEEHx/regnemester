import type { Operation } from './locations';
import { getMapObjectPosition } from './mapObjectPositions';
import { TALLVOKTER_MAP_ID } from './maps';
import { getEffectiveDifficulty, type Difficulty, type GameSettings } from './settings';
import type { MathQuestDefinition } from '../simulation/mathQuest';

export const CRYSTAL_CART_QUEST_ID = 'krystallvognen';
export const CRYSTAL_CART_CHECKPOINT_COUNT = 10;
export const CRYSTAL_CONDUCTOR_TEXTURE_KEY = 'crystal-cart-conductor';
export const CRYSTAL_CONDUCTOR_ASSET_PATH = '/regnemester/crystal-cart/crystal-conductor.png';
export const CRYSTAL_CART_TEXTURE_KEY = 'crystal-cart-vehicle';
export const CRYSTAL_CART_ASSET_PATH = '/regnemester/crystal-cart/crystal-cart.png';
export const CRYSTAL_CART_REAR_TEXTURE_KEY = 'crystal-cart-vehicle-rear';
export const CRYSTAL_CART_REAR_ASSET_PATH = '/regnemester/crystal-cart/crystal-cart-rear.png';
export const CRYSTAL_MINE_BACKGROUND_TEXTURE_KEY = 'crystal-cart-mine-background';
export const CRYSTAL_MINE_BACKGROUND_ASSET_PATH = '/regnemester/crystal-cart/crystal-mine-journey.png';
export const CRYSTAL_CART_ROUTE_BEACON_TEXTURE_KEY = 'crystal-cart-route-beacon';
export const CRYSTAL_CART_ROUTE_BEACON_ASSET_PATH = '/regnemester/crystal-cart/route-crystal.png';
export const CRYSTAL_CART_BARRIER_TEXTURE_KEY = 'crystal-cart-barrier';
export const CRYSTAL_CART_BARRIER_ASSET_PATH = '/regnemester/crystal-cart/crystal-barrier.png';

export const CRYSTAL_CART_JUNCTION_BACKGROUNDS = [
  {
    key: 'crystal-cart-junction-blue',
    path: '/regnemester/crystal-cart/crystal-cart-junction-v2.png'
  },
  {
    key: 'crystal-cart-junction-forge',
    path: '/regnemester/crystal-cart/crystal-cart-junction-forge.png'
  },
  {
    key: 'crystal-cart-junction-core',
    path: '/regnemester/crystal-cart/crystal-cart-junction-core.png'
  }
] as const;

export const CRYSTAL_CART_CONFIG = {
  conductorPosition: getMapObjectPosition(TALLVOKTER_MAP_ID, 'crystalConductor'),
  interactionDistance: 118
} as const;

export const CRYSTAL_CART_WELCOME =
  'Skinnene gjennom Krystallgruven har skiftet retning. Ved hvert av de ti veikryssene viser fire krystallspor hvert sitt svar. Velg sporet med riktig svar for å føre vognen trygt helt frem til krystallkjernen. Feil spor koster ett hjerte.';

const ALL_OPERATIONS: Operation[] = ['add', 'subtract', 'multiply', 'divide'];

export const CRYSTAL_CART_CHALLENGE: MathQuestDefinition = {
  id: CRYSTAL_CART_QUEST_ID,
  place: 'Krystallvognen',
  title: 'Finn riktig spor gjennom Krystallgruven',
  description: CRYSTAL_CART_WELCOME,
  successText: 'Alle veikryssene er passert. Krystallkjernen er nådd!',
  iconSrc: CRYSTAL_CONDUCTOR_ASSET_PATH,
  operations: ALL_OPERATIONS,
  requiredCorrect: CRYSTAL_CART_CHECKPOINT_COUNT
};

const REWARDS: Record<Difficulty, number> = {
  'easy-add-subtract': 40,
  easy: 40,
  normal: 55,
  hard: 70
};

export function getCrystalCartReward(settings: GameSettings): number {
  return REWARDS[getEffectiveDifficulty(settings)];
}
