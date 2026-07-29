export type RegnemonsterRoomId = 'town' | 'collector-house' | 'game-house';
export type RegnemonsterInteriorRoomId = Exclude<RegnemonsterRoomId, 'town'>;

export type RegnemonsterPoint = {
  x: number;
  y: number;
};

export type RegnemonsterRoomTransition = {
  zoneId: string;
  targetRoom: RegnemonsterRoomId;
  spawn: RegnemonsterPoint;
};

type FindTransitionInput = {
  room: RegnemonsterRoomId;
  x: number;
  y: number;
  previousZoneId?: string;
  transitionLocked: boolean;
  townObjectPositions: Partial<Record<string, RegnemonsterPoint>>;
  interiorObjectPositions?: Partial<Record<
    RegnemonsterInteriorRoomId,
    Partial<Record<string, RegnemonsterPoint>>
  >>;
};

type RegnemonsterRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type ResolvedDoor = {
  id: string;
  rect: RegnemonsterRect;
  targetRoom: RegnemonsterRoomId;
  spawn: RegnemonsterPoint;
};

const DEFAULT_INTERIOR_POSITIONS: Record<
  RegnemonsterInteriorRoomId,
  Record<string, RegnemonsterPoint>
> = {
  'collector-house': {
    roomExit: { x: 960, y: 1070 },
    binder: { x: 790, y: 760 }
  },
  'game-house': {
    roomExit: { x: 1095, y: 1070 },
    gameConsole: { x: 970, y: 815 }
  }
};

const ROOM_WALKABLE_BOUNDS: Record<'collector-house' | 'game-house', RegnemonsterRect> = {
  'collector-house': { x: 600, y: 360, width: 720, height: 750 },
  'game-house': { x: 710, y: 580, width: 520, height: 500 }
};

const ROOM_BLOCKERS: Record<'collector-house' | 'game-house', RegnemonsterRect[]> = {
  'collector-house': [
    { x: 650, y: 410, width: 265, height: 240 },
    { x: 1050, y: 400, width: 220, height: 250 },
    { x: 630, y: 770, width: 270, height: 205 },
    { x: 1040, y: 770, width: 250, height: 205 }
  ],
  'game-house': [
    { x: 790, y: 620, width: 370, height: 180 },
    { x: 730, y: 720, width: 75, height: 175 },
    { x: 1150, y: 720, width: 75, height: 175 },
    { x: 750, y: 910, width: 95, height: 75 },
    { x: 1105, y: 910, width: 95, height: 75 }
  ]
};

function pointIsInsideRect(
  x: number,
  y: number,
  rect: { x: number; y: number; width: number; height: number }
): boolean {
  return x >= rect.x
    && x <= rect.x + rect.width
    && y >= rect.y
    && y <= rect.y + rect.height;
}

function getResolvedDoors(
  room: RegnemonsterRoomId,
  townObjectPositions: Partial<Record<string, RegnemonsterPoint>>,
  interiorObjectPositions: FindTransitionInput['interiorObjectPositions'] = {}
): ResolvedDoor[] {
  const collectorHouse = townObjectPositions.prototypeHouse;
  const gameHouse = townObjectPositions.gameHouse;
  const collectorExit = interiorObjectPositions['collector-house']?.roomExit
    ?? DEFAULT_INTERIOR_POSITIONS['collector-house'].roomExit;
  const gameExit = interiorObjectPositions['game-house']?.roomExit
    ?? DEFAULT_INTERIOR_POSITIONS['game-house'].roomExit;
  if (room === 'town') {
    return [
      ...(collectorHouse ? [{
        id: 'town-to-collector-house',
        rect: {
          x: collectorHouse.x + 17,
          y: collectorHouse.y - 110,
          width: 110,
          height: 110
        },
        targetRoom: 'collector-house' as const,
        spawn: { x: collectorExit.x, y: collectorExit.y - 140 }
      }] : []),
      ...(gameHouse ? [{
        id: 'town-to-game-house',
        rect: {
          x: gameHouse.x - 60,
          y: gameHouse.y - 160,
          width: 120,
          height: 140
        },
        targetRoom: 'game-house' as const,
        spawn: { x: gameExit.x, y: gameExit.y - 80 }
      }] : [])
    ];
  }
  if (room === 'collector-house' && collectorHouse) {
    return [{
      id: 'collector-house-to-town',
      rect: {
        x: collectorExit.x - 60,
        y: collectorExit.y - 50,
        width: 120,
        height: 100
      },
      targetRoom: 'town',
      spawn: { x: collectorHouse.x + 72, y: collectorHouse.y + 60 }
    }];
  }
  if (room === 'game-house' && gameHouse) {
    return [{
      id: 'game-house-to-town',
      rect: {
        x: gameExit.x - 75,
        y: gameExit.y - 50,
        width: 150,
        height: 100
      },
      targetRoom: 'town',
      spawn: { x: gameHouse.x, y: gameHouse.y + 90 }
    }];
  }
  return [];
}

export function getRegnemonsterRoomZoneIdAt(
  room: RegnemonsterRoomId,
  x: number,
  y: number,
  townObjectPositions: Partial<Record<string, RegnemonsterPoint>>,
  interiorObjectPositions?: FindTransitionInput['interiorObjectPositions']
): string | undefined {
  return getResolvedDoors(room, townObjectPositions, interiorObjectPositions)
    .find((door) => pointIsInsideRect(x, y, door.rect))
    ?.id;
}

export function findRegnemonsterRoomTransition(
  input: FindTransitionInput
): RegnemonsterRoomTransition | undefined {
  if (input.transitionLocked) {
    return undefined;
  }
  const door = getResolvedDoors(
    input.room,
    input.townObjectPositions,
    input.interiorObjectPositions
  )
    .find((candidate) => pointIsInsideRect(input.x, input.y, candidate.rect));
  if (!door || input.previousZoneId === door.id) {
    return undefined;
  }
  return {
    zoneId: door.id,
    targetRoom: door.targetRoom,
    spawn: door.spawn
  };
}

export function isRegnemonsterRoomPositionWalkable(
  room: RegnemonsterRoomId,
  x: number,
  y: number,
  editableCollisionRects?: RegnemonsterRect[]
): boolean {
  if (room === 'town') {
    return true;
  }
  return pointIsInsideRect(x, y, ROOM_WALKABLE_BOUNDS[room])
    && !(editableCollisionRects ?? ROOM_BLOCKERS[room])
      .some((rect) => pointIsInsideRect(x, y, rect));
}

export function getRegnemonsterInteractionAt(
  room: RegnemonsterRoomId,
  x: number,
  y: number,
  interiorObjectPositions: FindTransitionInput['interiorObjectPositions'] = {}
): 'binder' | 'game-console' | undefined {
  const target = room === 'collector-house'
    ? {
        id: 'binder' as const,
        ...(interiorObjectPositions['collector-house']?.binder
          ?? DEFAULT_INTERIOR_POSITIONS['collector-house'].binder)
      }
    : room === 'game-house'
      ? {
          id: 'game-console' as const,
          ...(interiorObjectPositions['game-house']?.gameConsole
            ?? DEFAULT_INTERIOR_POSITIONS['game-house'].gameConsole)
        }
      : undefined;
  if (!target) {
    return undefined;
  }
  return Math.hypot(x - target.x, y - target.y) <= 130
    ? target.id
    : undefined;
}
