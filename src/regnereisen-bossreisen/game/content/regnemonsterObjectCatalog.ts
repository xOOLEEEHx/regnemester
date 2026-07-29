import catalogJson from './regnemonsterObjectCatalog.json';
import type { RegnemonsterPrototypeCollisionRect } from './regnemonsterPrototype';

export type RegnemonsterObjectCatalogItem = {
  id: string;
  label: string;
  category: string;
  assetFile: string;
  sourceFile: string;
  scale: number;
  collisionRects: RegnemonsterPrototypeCollisionRect[];
};

export type RegnemonsterLibraryInstance = {
  id: string;
  label: string;
  catalogId: string;
  x: number;
  y: number;
  collisionRects: RegnemonsterPrototypeCollisionRect[];
};

export const REGNEMONSTER_OBJECT_LIBRARY_ASSET_ROOT =
  '/regnemester/regnemonster/assets/library';

export const REGNEMONSTER_OBJECT_CATALOG =
  catalogJson as RegnemonsterObjectCatalogItem[];

export function getRegnemonsterCatalogItem(
  id: string
): RegnemonsterObjectCatalogItem | undefined {
  return REGNEMONSTER_OBJECT_CATALOG.find((item) => item.id === id);
}

export function getRegnemonsterCatalogTextureKey(id: string): string {
  return `regnemonster-library-${id}`;
}

export function getRegnemonsterCatalogAssetPath(
  item: RegnemonsterObjectCatalogItem
): string {
  return `${REGNEMONSTER_OBJECT_LIBRARY_ASSET_ROOT}/${item.assetFile}`;
}

export function createRegnemonsterLibraryInstance(
  catalogId: string,
  existingIds: readonly string[],
  position: { x: number; y: number }
): RegnemonsterLibraryInstance {
  const item = getRegnemonsterCatalogItem(catalogId);
  if (!item) {
    throw new Error(`Ukjent Regnemonster-katalogelement: ${catalogId}.`);
  }
  const prefix = `library-${catalogId}-`;
  const nextNumber = existingIds.reduce((highest, id) => {
    if (!id.startsWith(prefix)) {
      return highest;
    }
    const value = Number(id.slice(prefix.length));
    return Number.isInteger(value) ? Math.max(highest, value) : highest;
  }, 0) + 1;

  return {
    id: `${prefix}${nextNumber}`,
    label: item.label,
    catalogId,
    x: Math.round(position.x),
    y: Math.round(position.y),
    collisionRects: item.collisionRects.map((rect) => ({ ...rect }))
  };
}

export function isRegnemonsterLibraryPositionWalkable(
  x: number,
  y: number,
  instances: readonly RegnemonsterLibraryInstance[]
): boolean {
  return !instances.some((instance) => instance.collisionRects.some((rect) => (
    x >= instance.x + rect.x
    && x <= instance.x + rect.x + rect.width
    && y >= instance.y + rect.y
    && y <= instance.y + rect.y + rect.height
  )));
}
