import { getMapObjectPosition } from './mapObjectPositions';
import { TALLVOKTER_MAP_ID } from './maps';

export type MiningResourceId =
  | 'copper'
  | 'silver'
  | 'gold'
  | 'ruby'
  | 'diamond'
  | 'regneCrystal';

export type MiningCellContent = MiningResourceId | 'empty';

export type MiningResourceDefinition = {
  id: MiningResourceId;
  displayName: string;
  value: number;
  count: number;
  assetPath: string;
  accent: string;
};

export type MiningCell = {
  id: number;
  content: MiningCellContent;
};

export type MiningInventory = Record<MiningResourceId, number>;

export const MINING_GRID_SIZE = 10;
export const MINING_CELL_COUNT = MINING_GRID_SIZE * MINING_GRID_SIZE;
export const MINING_QUESTION_COUNT = 10;
export const MINING_EMPTY_CELL_COUNT = 25;
export const MINING_QUEST_ID = 'gruveekspedisjonen';

export const MINING_CONFIG = {
  mineBossPosition: getMapObjectPosition(TALLVOKTER_MAP_ID, 'mineBoss'),
  interactionDistance: 110
} as const;

export const MINE_BOSS_TEXTURE_KEY = 'mining-mine-boss';
export const MINE_BOSS_ASSET_PATH = '/regnemester/mining/mine-boss.png';

export const MINING_RESOURCES: readonly MiningResourceDefinition[] = [
  {
    id: 'copper',
    displayName: 'Kobber',
    value: 1,
    count: 30,
    assetPath: '/regnemester/mining/resources/copper.png',
    accent: '#cf7f43'
  },
  {
    id: 'silver',
    displayName: 'Sølv',
    value: 3,
    count: 20,
    assetPath: '/regnemester/mining/resources/silver.png',
    accent: '#d7e7f4'
  },
  {
    id: 'gold',
    displayName: 'Gull',
    value: 5,
    count: 12,
    assetPath: '/regnemester/mining/resources/gold.png',
    accent: '#ffd45b'
  },
  {
    id: 'ruby',
    displayName: 'Rubin',
    value: 10,
    count: 7,
    assetPath: '/regnemester/mining/resources/ruby.png',
    accent: '#ff5d72'
  },
  {
    id: 'diamond',
    displayName: 'Diamant',
    value: 15,
    count: 4,
    assetPath: '/regnemester/mining/resources/diamond.png',
    accent: '#8ef2ff'
  },
  {
    id: 'regneCrystal',
    displayName: 'Regnekrystall',
    value: 50,
    count: 2,
    assetPath: '/regnemester/mining/resources/regne-crystal.png',
    accent: '#74a8ff'
  }
] as const;

const RESOURCE_BY_ID = new Map(MINING_RESOURCES.map((resource) => [resource.id, resource]));
const RESOURCE_CELL_COUNT = MINING_RESOURCES.reduce((total, resource) => total + resource.count, 0);

if (RESOURCE_CELL_COUNT + MINING_EMPTY_CELL_COUNT !== MINING_CELL_COUNT) {
  throw new Error('Fordelingen i Gruveekspedisjonen må fylle nøyaktig 100 ruter.');
}

if (RESOURCE_BY_ID.get('regneCrystal')?.count !== 2) {
  throw new Error('Gruveekspedisjonen må inneholde nøyaktig to Regnekrystaller.');
}

export function getMiningResource(id: MiningResourceId): MiningResourceDefinition {
  const resource = RESOURCE_BY_ID.get(id);
  if (!resource) {
    throw new Error(`Ukjent gruveressurs: ${id}`);
  }
  return resource;
}

export function createEmptyMiningInventory(): MiningInventory {
  return MINING_RESOURCES.reduce((inventory, resource) => {
    inventory[resource.id] = 0;
    return inventory;
  }, {} as MiningInventory);
}

export function createMiningBoard(random: () => number = Math.random): MiningCell[] {
  const contents: MiningCellContent[] = [];
  for (const resource of MINING_RESOURCES) {
    contents.push(...Array.from({ length: resource.count }, () => resource.id));
  }
  contents.push(...Array.from({ length: MINING_EMPTY_CELL_COUNT }, () => 'empty' as const));

  for (let index = contents.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.min(0.999999999, Math.max(0, random())) * (index + 1));
    [contents[index], contents[swapIndex]] = [contents[swapIndex], contents[index]];
  }

  return contents.map((content, id) => ({ id, content }));
}
