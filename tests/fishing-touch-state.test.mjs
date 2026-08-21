import assert from 'node:assert/strict';
import test from 'node:test';

let beginFishingTouch;
let endFishingTouch;
try {
  ({ beginFishingTouch, endFishingTouch } = await import(
    '../src/regnereisen-bossreisen/game/simulation/fishingTouchState.ts'
  ));
} catch (error) {
  if (error?.code !== 'ERR_MODULE_NOT_FOUND') throw error;
}

test('raske overlappende trykk lar det nyeste trykket overta', () => {
  assert.equal(beginFishingTouch?.(undefined, [], 17), 17);
  assert.equal(beginFishingTouch?.(17, [17, 29], 29), 29);
});

test('aktiv fiskefinger frigjøres først når den avsluttes eller alle fingre er borte', () => {
  assert.equal(endFishingTouch?.(17, [29], 1), 17);
  assert.equal(endFishingTouch?.(17, [17], 1), undefined);
  assert.equal(endFishingTouch?.(17, [], 0), undefined);
});
