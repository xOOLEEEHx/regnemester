export type RegnemonsterDrawSetId = 'set1' | 'holo' | 'special' | 'student';

export function selectRegnemonsterSet(roll: number): RegnemonsterDrawSetId {
  const normalizedRoll = Math.max(
    0,
    Math.min(0.999999999, Number.isFinite(roll) ? roll : 0)
  );
  if (normalizedRoll < 0.87) return 'set1';
  if (normalizedRoll < 0.94) return 'holo';
  return normalizedRoll < 0.99 ? 'special' : 'student';
}
