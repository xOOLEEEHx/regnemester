import { getMapObjectPosition } from './mapObjectPositions';
import { TALLVOKTER_MAP_ID } from './maps';

export type BoatTravelPointId = 'boatWest' | 'boatEast';

export type BoatTravelPoint = {
  id: BoatTravelPointId;
  activityId: 'boat-west' | 'boat-east';
  destinationId: BoatTravelPointId;
  title: string;
  position: ReturnType<typeof getMapObjectPosition>;
};

export const BOAT_WHEEL_TEXTURE_KEY = 'boat-travel-wheel';
export const BOAT_WHEEL_ASSET_PATH = '/regnemester/boat-travel/boat-wheel-icon.webp';
export const BOAT_SHIP_RIGHT_TEXTURE_KEY = 'boat-travel-ship-right';
export const BOAT_SHIP_RIGHT_ASSET_PATH = '/regnemester/boat-travel/wooden-ship-right.webp';
export const BOAT_SHIP_LEFT_TEXTURE_KEY = 'boat-travel-ship-left';
export const BOAT_SHIP_LEFT_ASSET_PATH = '/regnemester/boat-travel/wooden-ship-left.webp';
export const BOAT_TRAVEL_INTERACTION_DISTANCE = 125;

export const BOAT_TRAVEL_POINTS: readonly BoatTravelPoint[] = [
  {
    id: 'boatWest',
    activityId: 'boat-west',
    destinationId: 'boatEast',
    title: 'Båten på vestsiden',
    position: getMapObjectPosition(TALLVOKTER_MAP_ID, 'boatWest')
  },
  {
    id: 'boatEast',
    activityId: 'boat-east',
    destinationId: 'boatWest',
    title: 'Båten på østsiden',
    position: getMapObjectPosition(TALLVOKTER_MAP_ID, 'boatEast')
  }
] as const;

export function getBoatTravelPoint(id: BoatTravelPointId): BoatTravelPoint {
  const point = BOAT_TRAVEL_POINTS.find((candidate) => candidate.id === id);
  if (!point) {
    throw new Error(`Ukjent båtrutepunkt: ${id}.`);
  }
  return point;
}
