export type RegnemonsterDrawSetId = 'set1' | 'holo' | 'special';

export function selectRegnemonsterSet(roll: number): RegnemonsterDrawSetId {
  const normalizedRoll = Math.max(
    0,
    Math.min(0.999999999, Number.isFinite(roll) ? roll : 0)
  );
  if (normalizedRoll < 0.85) return 'set1';
  return normalizedRoll < 0.95 ? 'holo' : 'special';
}
