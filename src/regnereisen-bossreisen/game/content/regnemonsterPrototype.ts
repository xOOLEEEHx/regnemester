export type RegnemonsterPrototypePosition = {
  x: number;
  y: number;
};

export type RegnemonsterPrototypeCollisionRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type RegnemonsterPrototypeObject = {
  id: string;
  label: string;
  x: number;
  y: number;
  textureKey: string;
  assetPath: string;
  originX: number;
  originY: number;
  depth: number;
  interactionRadius: number;
  collisionRects: RegnemonsterPrototypeCollisionRect[];
};

export const REGNEMONSTER_PROTOTYPE = {
  tileSize: 48,
  columns: 40,
  rows: 30,
  width: 1920,
  height: 1440,
  start: { x: 960, y: 1320 },
  groundTextureKey: 'regnemonster-prototype-ground',
  groundAssetPath: '/regnemester/regnemonster/assets/tiles/prototype-ground-48.png',
  tilemapKey: 'regnemonster-prototype-map',
  tilemapPath: '/regnemester/regnemonster/maps/prototype-town.tmj'
} as const;

export const REGNEMONSTER_PROTOTYPE_OBJECTS: RegnemonsterPrototypeObject[] = [
  {
    id: 'prototypeHouse',
    label: 'Samlerhuset',
    x: 530,
    y: 760,
    textureKey: 'regnemonster-prototype-house',
    assetPath: '/regnemester/regnemonster/assets/objects/one-story-house-48.png',
    originX: 0.5,
    originY: 1,
    depth: 11,
    interactionRadius: 120,
    collisionRects: [
      { x: -320, y: -520, width: 337, height: 520 },
      { x: 127, y: -520, width: 193, height: 520 }
    ]
  },
  {
    id: 'gameHouse',
    label: 'Spillhuset',
    x: 1390,
    y: 760,
    textureKey: 'regnemonster-game-house',
    assetPath: '/regnemester/regnemonster/assets/objects/japanese-house-48.png',
    originX: 0.5,
    originY: 1,
    depth: 11,
    interactionRadius: 120,
    collisionRects: [
      { x: -352, y: -540, width: 292, height: 520 },
      { x: 60, y: -540, width: 292, height: 520 }
    ]
  },
  {
    id: 'prototypeBench',
    label: 'Benken',
    x: 650,
    y: 1135,
    textureKey: 'regnemonster-prototype-bench',
    assetPath: '/regnemester/regnemonster/assets/objects/bench-48.png',
    originX: 0.5,
    originY: 0.72,
    depth: 14,
    interactionRadius: 58,
    collisionRects: [{ x: -44, y: -22, width: 88, height: 42 }]
  },
  {
    id: 'prototypeLamp',
    label: 'Gatelykten',
    x: 1270,
    y: 1130,
    textureKey: 'regnemonster-prototype-lamp',
    assetPath: '/regnemester/regnemonster/assets/objects/street-lamp-48.png',
    originX: 0.5,
    originY: 0.82,
    depth: 14,
    interactionRadius: 52,
    collisionRects: [{ x: -18, y: -18, width: 36, height: 38 }]
  },
  {
    id: 'prototypeBush',
    label: 'Busken',
    x: 510,
    y: 990,
    textureKey: 'regnemonster-prototype-bush',
    assetPath: '/regnemester/regnemonster/assets/objects/bush-48.png',
    originX: 0.5,
    originY: 0.72,
    depth: 13,
    interactionRadius: 42,
    collisionRects: [{ x: -20, y: -18, width: 40, height: 36 }]
  }
];

export const REGNEMONSTER_PROTOTYPE_DOOR = {
  objectId: 'prototypeHouse',
  x: 17,
  y: -110,
  width: 110,
  height: 110
} as const;

export function getRegnemonsterPrototypeObject(
  id: string
): RegnemonsterPrototypeObject | undefined {
  return REGNEMONSTER_PROTOTYPE_OBJECTS.find((object) => object.id === id);
}

export function isRegnemonsterPrototypePositionWalkable(
  x: number,
  y: number,
  positions: Partial<Record<string, RegnemonsterPrototypePosition>> = {},
  collisionRects: Partial<Record<string, RegnemonsterPrototypeCollisionRect[]>> = {}
): boolean {
  if (x < 48 || y < 48 || x > REGNEMONSTER_PROTOTYPE.width - 48 || y > REGNEMONSTER_PROTOTYPE.height - 48) {
    return false;
  }

  return !REGNEMONSTER_PROTOTYPE_OBJECTS.some((object) => {
    const position = positions[object.id] ?? object;
    const objectCollisionRects = collisionRects[object.id] ?? object.collisionRects;
    return objectCollisionRects.some((rect) => (
      x >= position.x + rect.x
      && x <= position.x + rect.x + rect.width
      && y >= position.y + rect.y
      && y <= position.y + rect.y + rect.height
    ));
  });
}

export function isPointInRegnemonsterPrototypeDoor(
  x: number,
  y: number,
  positions: Partial<Record<string, RegnemonsterPrototypePosition>> = {}
): boolean {
  const house = getRegnemonsterPrototypeObject(REGNEMONSTER_PROTOTYPE_DOOR.objectId);
  if (!house) {
    return false;
  }
  const position = positions[house.id] ?? house;
  return x >= position.x + REGNEMONSTER_PROTOTYPE_DOOR.x
    && x <= position.x + REGNEMONSTER_PROTOTYPE_DOOR.x + REGNEMONSTER_PROTOTYPE_DOOR.width
    && y >= position.y + REGNEMONSTER_PROTOTYPE_DOOR.y
    && y <= position.y + REGNEMONSTER_PROTOTYPE_DOOR.y + REGNEMONSTER_PROTOTYPE_DOOR.height;
}

export function shouldTriggerRegnemonsterPrototypeDoor(
  wasInside: boolean,
  isInside: boolean,
  transitionLocked: boolean
): boolean {
  return !transitionLocked && !wasInside && isInside;
}
