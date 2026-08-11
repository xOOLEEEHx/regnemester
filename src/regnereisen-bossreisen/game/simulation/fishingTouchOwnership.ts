type PhaserTouchInput = {
  enabled: boolean;
};

export function takeFishingTouchOwnership(touchInput: PhaserTouchInput): boolean {
  const previousState = touchInput.enabled;
  touchInput.enabled = false;
  return previousState;
}

export function releaseFishingTouchOwnership(
  touchInput: PhaserTouchInput,
  previousState: boolean | undefined
): void {
  if (previousState !== undefined) {
    touchInput.enabled = previousState;
  }
}
