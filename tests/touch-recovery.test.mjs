import assert from 'node:assert/strict';
import test from 'node:test';

let shouldCancelPendingTouchRecovery;
let shouldScheduleTouchRecovery;
try {
  ({ shouldCancelPendingTouchRecovery, shouldScheduleTouchRecovery } = await import(
    '../src/regnereisen-bossreisen/game/simulation/touchRecovery.ts'
  ));
} catch (error) {
  if (error?.code !== 'ERR_MODULE_NOT_FOUND') throw error;
}

test('berøringspekere nullstilles først når siste finger er løftet', () => {
  assert.equal(shouldScheduleTouchRecovery?.(2), false);
  assert.equal(shouldScheduleTouchRecovery?.(1), false);
  assert.equal(shouldScheduleTouchRecovery?.(0), true);
});

test('et nytt trykk avbryter en ventende nullstilling', () => {
  assert.equal(shouldCancelPendingTouchRecovery?.(0), false);
  assert.equal(shouldCancelPendingTouchRecovery?.(1), true);
  assert.equal(shouldCancelPendingTouchRecovery?.(2), true);
});
