export type EditableCollisionRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const MIN_COLLISION_SIZE = 8;
const DEFAULT_COLLISION_SIZE = 64;

export function cloneCollisionRects(
  rects: readonly EditableCollisionRect[]
): EditableCollisionRect[] {
  return rects.map((rect) => ({ ...rect }));
}

export function moveCollisionRect(
  rect: EditableCollisionRect,
  dx: number,
  dy: number
): EditableCollisionRect {
  return {
    ...rect,
    x: Math.round(rect.x + dx),
    y: Math.round(rect.y + dy)
  };
}

export function resizeCollisionRect(
  rect: EditableCollisionRect,
  width: number,
  height: number
): EditableCollisionRect {
  return {
    ...rect,
    width: Math.max(MIN_COLLISION_SIZE, Math.round(width)),
    height: Math.max(MIN_COLLISION_SIZE, Math.round(height))
  };
}

export function addCollisionRect(
  rects: readonly EditableCollisionRect[],
  position: { x: number; y: number }
): EditableCollisionRect[] {
  return [
    ...cloneCollisionRects(rects),
    {
      x: Math.round(position.x),
      y: Math.round(position.y),
      width: DEFAULT_COLLISION_SIZE,
      height: DEFAULT_COLLISION_SIZE
    }
  ];
}

export function removeCollisionRect(
  rects: readonly EditableCollisionRect[],
  index: number
): EditableCollisionRect[] {
  return rects.filter((_, candidateIndex) => candidateIndex !== index).map((rect) => ({ ...rect }));
}
