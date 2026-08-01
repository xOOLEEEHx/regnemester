import assert from 'node:assert/strict';
import test from 'node:test';

const {
  createCircularStirState,
  getCircularStirProgress,
  pauseCircularStirState,
  reframeCircularStirState,
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

test('rolig røring beholder fremdriften når fingeren løftes og settes ned igjen', () => {
  let state = createCircularStirState(100, 100, 20, 90);
  for (let index = 0; index <= 80; index += 1) {
    const angle = index / 240 * Math.PI * 2;
    state = updateCircularStirState(
      state,
      100 + Math.cos(angle) * 70,
      100 + Math.sin(angle) * 70
    ).state;
  }

  const progressBeforePause = getCircularStirProgress(state);
  state = pauseCircularStirState(state);

  assert.ok(progressBeforePause > 0.2);
  assert.equal(getCircularStirProgress(state), progressBeforePause);
  assert.equal(state.lastAngle, undefined);

  let update;
  for (let index = 80; index <= 240; index += 1) {
    const angle = index / 240 * Math.PI * 2;
    update = updateCircularStirState(
      state,
      100 + Math.cos(angle) * 70,
      100 + Math.sin(angle) * 70
    );
    state = update.state;
  }

  assert.equal(update.completed, true);
});

test('layoutendring flytter røresonen uten å nullstille fremdriften', () => {
  let state = createCircularStirState(100, 100, 20, 90);
  for (let index = 0; index <= 100; index += 1) {
    const angle = index / 240 * Math.PI * 2;
    state = updateCircularStirState(
      state,
      100 + Math.cos(angle) * 70,
      100 + Math.sin(angle) * 70
    ).state;
  }

  const progressBeforeResize = getCircularStirProgress(state);
  state = reframeCircularStirState(state, 180, 160, 24, 108);

  assert.equal(getCircularStirProgress(state), progressBeforeResize);
  assert.equal(state.centerX, 180);
  assert.equal(state.centerY, 160);
  assert.equal(state.lastAngle, undefined);
});

test('små korreksjoner motsatt vei trekker ikke fra rolig rørefremdrift', () => {
  let state = createCircularStirState(100, 100, 20, 90);
  let previousProgress = 0;

  for (let index = 0; index <= 240; index += 1) {
    const baseAngle = index / 240 * Math.PI * 2;
    const correction = index % 24 === 12 ? -0.11 : 0;
    const angle = baseAngle + correction;
    const update = updateCircularStirState(
      state,
      100 + Math.cos(angle) * 70,
      100 + Math.sin(angle) * 70
    );
    state = update.state;
    assert.ok(update.progress >= previousProgress);
    previousProgress = update.progress;
  }

  assert.ok(previousProgress > 0.9);
});
