export function beginFishingTouch(
  activeTouchId: number | undefined,
  activeTouchIds: readonly number[],
  changedTouchId: number
): number {
  void activeTouchId;
  void activeTouchIds;
  // Fisking består av korte trykk, ikke en drag-bevegelse. På iPad kan raske,
  // overlappende trykk etterlate den forrige fingeren som aktiv litt for lenge.
  // Det nyeste touchstart-signalet må derfor alltid få overta.
  return changedTouchId;
}

export function endFishingTouch(
  activeTouchId: number | undefined,
  changedTouchIds: readonly number[],
  remainingTouchCount: number
): number | undefined {
  if (
    activeTouchId === undefined
    || changedTouchIds.includes(activeTouchId)
    || remainingTouchCount === 0
  ) {
    return undefined;
  }

  return activeTouchId;
}
