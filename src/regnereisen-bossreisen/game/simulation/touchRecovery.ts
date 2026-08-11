export function shouldScheduleTouchRecovery(remainingTouchCount: number): boolean {
  return remainingTouchCount === 0;
}

export function shouldCancelPendingTouchRecovery(activeTouchCount: number): boolean {
  return activeTouchCount > 0;
}
