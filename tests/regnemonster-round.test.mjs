import assert from 'node:assert/strict';
import test from 'node:test';

const {
  applyRegnemonsterAnswer,
  getRegnemonsterRoundOutcome,
  REGNEMONSTER_ROUND_LIFE_COUNT
} = await import('../src/regnereisen-bossreisen/game/simulation/regnemonsterRoundLives.ts');

test('tre feil avslutter Regnemonster-runden uten opptjente riktige', () => {
  let progress = { correctCount: 4, livesRemaining: REGNEMONSTER_ROUND_LIFE_COUNT };
  for (let index = 0; index < REGNEMONSTER_ROUND_LIFE_COUNT; index += 1) {
    progress = applyRegnemonsterAnswer(progress, false);
  }

  assert.equal(getRegnemonsterRoundOutcome(progress, 10), 'failed');
  assert.equal(progress.livesRemaining, 0);
  assert.equal(progress.correctCount, 4);
});

test('ti riktige før tredje feil fullfører runden', () => {
  let progress = { correctCount: 0, livesRemaining: REGNEMONSTER_ROUND_LIFE_COUNT };
  for (let index = 0; index < 10; index += 1) {
    if (index === 4 || index === 7) {
      progress = applyRegnemonsterAnswer(progress, false);
    }
    progress = applyRegnemonsterAnswer(progress, true);
  }

  assert.equal(getRegnemonsterRoundOutcome(progress, 10), 'complete');
  assert.equal(progress.correctCount, 10);
  assert.equal(progress.livesRemaining, 1);
});

test('en ny runde starter alltid med tre nye liv', () => {
  const progress = { correctCount: 0, livesRemaining: REGNEMONSTER_ROUND_LIFE_COUNT };
  assert.equal(getRegnemonsterRoundOutcome(progress, 10), 'continue');
  assert.equal(progress.correctCount, 0);
  assert.equal(progress.livesRemaining, REGNEMONSTER_ROUND_LIFE_COUNT);
});
