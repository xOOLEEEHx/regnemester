export function beginFishingTouch(
  activeTouchId: number | undefined,
  activeTouchIds: readonly number[],
  changedTouchId: number
): number {
  if (activeTouchId !== undefined && activeTouchIds.includes(activeTouchId)) {
    return activeTouchId;
  }

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
