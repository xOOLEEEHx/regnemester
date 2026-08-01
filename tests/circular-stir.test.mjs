import assert from 'node:assert/strict';
import test from 'node:test';

const {
  createCircularStirState,
  updateCircularStirState
} = await import('../src/regnereisen-bossreisen/game/simulation/circularStir.ts');

function traceCircle(sampleCount, radius = 70) {
  let state = createCircularStirState(100, 100, 20, 90);
  let update;
  for (let index = 0; index <= sampleCount; index += 1) {
    const angle = index / sampleCount * Math.PI * 2;
    update = updateCircularStirState(
      state,
      100 + Math.cos(angle) * radius,
      100 + Math.sin(angle) * radius
    );
    state = update.state;
  }
  return update;
}

test('rolig sirkel med mange små bevegelser fullfører røringen', () => {
  assert.equal(traceCircle(240).completed, true);
});

test('rask sirkel med færre punkter fullfører røringen', () => {
  assert.equal(traceCircle(18).completed, true);
});

test('bevegelse utenfor gryten teller ikke', () => {
  let state = createCircularStirState(100, 100, 20, 90);
  const update = updateCircularStirState(state, 230, 100);
  state = update.state;
  assert.equal(update.accepted, false);
  assert.equal(state.accumulatedAngle, 0);
});
