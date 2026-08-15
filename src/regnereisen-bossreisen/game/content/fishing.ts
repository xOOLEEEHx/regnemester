export type FishId =
  | 'smallFish'
  | 'gukkFish'
  | 'crystalFish'
  | 'rainbowFish'
  | 'regneFish'
  | 'eternityFish';

export type FishMovement = 'gentle' | 'wave' | 'sine' | 'zigzag' | 'erratic' | 'cosmic';

export type FishDefinition = {
  id: FishId;
  displayName: string;
  rarityLabel: string;
  value: number;
  probability: number;
  textureKey: string;
  assetPath: string;
  baseSpeed: number;
  visibilityMs: number;
  movement: FishMovement;
  scale: number;
  hitboxWidth: number;
  hitboxHeight: number;
  accentColor: number;
};

export type FishInventory = Record<FishId, number>;

export const FISHING_CONFIG = {
  unlock: {
    requiredCompletedQuests: 10,
    totalQuests: 15,
    testUnlocked: true
  },
  fishingSpotPosition: getMapObjectPosition(TALLVOKTER_MAP_ID, 'fishingSpot'),
  fishermanPosition: getMapObjectPosition(TALLVOKTER_MAP_ID, 'fisherman'),
  interactionDistance: 125,
  roundDurationMs: 30_000,
  spawnIntervalMs: 760,
  concurrentFish: {
    compact: 4,
    default: 6
  }
} as const;

export const FISH_TYPES: readonly FishDefinition[] = [
  {
    id: 'smallFish',
    displayName: 'Småfisk',
    rarityLabel: 'Vanlig',
    value: 1,
    probability: 70,
    textureKey: 'fishing-small-fish',
    assetPath: '/regnemester/fishing/fish/small-fish.webp',
    baseSpeed: 375,
    visibilityMs: 9_400,
    movement: 'gentle',
    scale: 0.13,
    hitboxWidth: 132,
    hitboxHeight: 88,
    accentColor: 0x56d9e8
  },
  {
    id: 'gukkFish',
    displayName: 'Gukkfisk',
    rarityLabel: 'Uvanlig',
    value: 3,
    probability: 20,
    textureKey: 'fishing-gukk-fish',
    assetPath: '/regnemester/fishing/fish/gukk-fish.webp',
    baseSpeed: 465,
    visibilityMs: 7_800,
    movement: 'wave',
    scale: 0.12,
    hitboxWidth: 136,
    hitboxHeight: 104,
    accentColor: 0x99dd55
  },
  {
    id: 'crystalFish',
    displayName: 'Krystallfisk',
    rarityLabel: 'Sjelden',
    value: 5,
    probability: 8,
    textureKey: 'fishing-crystal-fish',
    assetPath: '/regnemester/fishing/fish/crystal-fish.webp',
    baseSpeed: 600,
    visibilityMs: 6_400,
    movement: 'sine',
    scale: 0.115,
    hitboxWidth: 142,
    hitboxHeight: 104,
    accentColor: 0x79aaff
  },
  {
    id: 'rainbowFish',
    displayName: 'Regnbuefisk',
    rarityLabel: 'Svært sjelden',
    value: 15,
    probability: 1.88,
    textureKey: 'fishing-rainbow-fish',
    assetPath: '/regnemester/fishing/fish/rainbow-fish.webp',
    baseSpeed: 620,
    visibilityMs: 5_100,
    movement: 'zigzag',
    scale: 0.11,
    hitboxWidth: 150,
    hitboxHeight: 108,
    accentColor: 0xff8ecf
  },
  {
    id: 'regneFish',
    displayName: 'Regnefisken',
    rarityLabel: 'Ekstremt sjelden',
    value: 25,
    probability: 0.1,
    textureKey: 'fishing-regne-fish',
    assetPath: '/regnemester/fishing/fish/regne-fish.webp',
    baseSpeed: 620,
    visibilityMs: 4_500,
    movement: 'erratic',
    scale: 0.105,
    hitboxWidth: 158,
    hitboxHeight: 116,
    accentColor: 0xffd75e
  },
  {
    id: 'eternityFish',
    displayName: 'Evighetsfisken',
    rarityLabel: 'Ultra sjelden',
    value: 100,
    probability: 0.02,
    textureKey: 'fishing-eternity-fish',
    assetPath: '/regnemester/fishing/fish/eternity-fish.webp',
    baseSpeed: 620,
    visibilityMs: 4_100,
    movement: 'cosmic',
    scale: 0.105,
    hitboxWidth: 166,
    hitboxHeight: 122,
    accentColor: 0xc58cff
  }
] as const;

export const FISHERMAN_TEXTURE_KEY = 'fishing-fisherman';
export const FISHERMAN_ASSET_PATH = '/regnemester/fishing/fisherman.webp';
export const FISHING_ROD_TEXTURE_KEY = 'fishing-rod-icon';
export const FISHING_ROD_ASSET_PATH = '/regnemester/fishing/fishing-rod-icon.webp';

const FISH_BY_ID = new Map(FISH_TYPES.map((fish) => [fish.id, fish]));
const TOTAL_FISH_PROBABILITY = FISH_TYPES.reduce((total, fish) => total + fish.probability, 0);

if (Math.abs(TOTAL_FISH_PROBABILITY - 100) > 1e-9) {
  throw new Error(`Fiskesannsynlighetene må summere til 100, men er ${TOTAL_FISH_PROBABILITY}.`);
}

export function getFishById(id: FishId): FishDefinition {
  const fish = FISH_BY_ID.get(id);
  if (!fish) {
    throw new Error(`Ukjent fisketype: ${id}`);
  }
  return fish;
}

export function createEmptyFishInventory(saved?: Partial<FishInventory>): FishInventory {
  return FISH_TYPES.reduce((inventory, fish) => {
    inventory[fish.id] = Math.max(0, Math.floor(saved?.[fish.id] ?? 0));
    return inventory;
  }, {} as FishInventory);
}

export function rollFish(random: () => number = Math.random): FishDefinition {
  const roll = Math.min(0.999999999, Math.max(0, random())) * 100;
  let cursor = 0;

  for (const fish of FISH_TYPES) {
    cursor += fish.probability;
    if (roll < cursor) {
      return fish;
    }
  }

  return FISH_TYPES[FISH_TYPES.length - 1];
}

export function getFishInventoryCount(inventory: FishInventory): number {
  return FISH_TYPES.reduce((total, fish) => total + inventory[fish.id], 0);
}

export function getFishInventoryValue(inventory: FishInventory): number {
  return FISH_TYPES.reduce((total, fish) => total + inventory[fish.id] * fish.value, 0);
}

export function isFishingUnlocked(completedQuestCount: number): boolean {
  return FISHING_CONFIG.unlock.testUnlocked
    || completedQuestCount >= FISHING_CONFIG.unlock.requiredCompletedQuests;
}

export function getFishingLockMessage(): string {
  const { requiredCompletedQuests, totalQuests } = FISHING_CONFIG.unlock;
  return `Fullfør ${requiredCompletedQuests} av ${totalQuests} oppdrag for å låse opp fisking.`;
}
import { TALLVOKTER_MAP_ID } from './maps';
import { getMapObjectPosition } from './mapObjectPositions';
