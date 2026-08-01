import assert from 'node:assert/strict';
import test from 'node:test';

const {
  getRegnemonsterBinderTargetPage
} = await import('../src/regnereisen-bossreisen/game/simulation/regnemonsterBinderNavigation.ts');

test('mobilpermen går nøyaktig én side tilbake', () => {
  assert.equal(getRegnemonsterBinderTargetPage(4, -1, 12, false), 3);
  assert.equal(getRegnemonsterBinderTargetPage(1, -1, 12, false), 0);
});

test('mobilpermen går ikke utenfor første eller siste side', () => {
  assert.equal(getRegnemonsterBinderTargetPage(0, -1, 12, false), 0);
  assert.equal(getRegnemonsterBinderTargetPage(11, 1, 12, false), 11);
});

test('tosidig perm flytter ett helt sideoppslag', () => {
  assert.equal(getRegnemonsterBinderTargetPage(2, 1, 12, true), 4);
  assert.equal(getRegnemonsterBinderTargetPage(4, -1, 12, true), 2);
});
