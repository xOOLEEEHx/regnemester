import assert from 'node:assert/strict';
import test from 'node:test';

let releaseFishingTouchOwnership;
let takeFishingTouchOwnership;
try {
  ({ releaseFishingTouchOwnership, takeFishingTouchOwnership } = await import(
    '../src/regnereisen-bossreisen/game/simulation/fishingTouchOwnership.ts'
  ));
} catch (error) {
  if (error?.code !== 'ERR_MODULE_NOT_FOUND') throw error;
}

test('aktiv fiskerunde lar native berøring eie input alene', () => {
  const phaserTouch = { enabled: true };

  const previousState = takeFishingTouchOwnership?.(phaserTouch);

  assert.equal(previousState, true);
  assert.equal(phaserTouch.enabled, false);
});

test('fiskerunden gjenoppretter Phasers tidligere inputtilstand', () => {
  const phaserTouch = { enabled: true };
  const previousState = takeFishingTouchOwnership?.(phaserTouch);

  releaseFishingTouchOwnership?.(phaserTouch, previousState);

  assert.equal(phaserTouch.enabled, true);
});
