import mapObjectPositionsJson from './mapObjectPositions.json';

export type EditableMapObjectPosition = {
  label: string;
  x: number;
  y: number;
  catalogId?: string;
  removable?: boolean;
  collisionRects?: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
  scale?: number;
  offset?: {
    x: number;
    y: number;
  };
};

export type MapObjectPositionConfig = Record<string, Record<string, EditableMapObjectPosition>>;

export const MAP_OBJECT_POSITIONS = mapObjectPositionsJson as MapObjectPositionConfig;

export function getMapObjectPosition(mapId: string, objectId: string): EditableMapObjectPosition {
  const position = MAP_OBJECT_POSITIONS[mapId]?.[objectId];
  if (!position) {
    throw new Error(`Mangler kartposisjon for ${mapId}/${objectId}.`);
  }
  return position;
}

export function getMapObjectPositions(
  mapId: string
): Array<{ id: string; position: EditableMapObjectPosition }> {
  return Object.entries(MAP_OBJECT_POSITIONS[mapId] ?? {}).map(([id, position]) => ({
    id,
    position
  }));
}
