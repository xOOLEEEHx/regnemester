type SceneEventEmitter = {
  once(event: string, listener: () => void): unknown;
  off(event: string, listener: () => void): unknown;
};

export function registerSceneCleanup(
  events: SceneEventEmitter,
  cleanup: () => void,
): void {
  let cleaned = false;
  const runCleanup = (): void => {
    if (cleaned) return;
    cleaned = true;
    events.off('shutdown', runCleanup);
    events.off('destroy', runCleanup);
    cleanup();
  };

  events.once('shutdown', runCleanup);
  events.once('destroy', runCleanup);
}
