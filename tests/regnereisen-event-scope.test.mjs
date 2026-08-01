import assert from 'node:assert/strict';
import test from 'node:test';

const { EventScope } = await import('../src/regnereisen-bossreisen/ui/eventScope.ts');

test('EventScope fjerner alle registrerte lyttere og tåler dobbel dispose', () => {
  const scope = new EventScope();
  const first = new EventTarget();
  const second = new EventTarget();
  let calls = 0;

  scope.listen(first, 'ping', () => {
    calls += 1;
  });
  scope.listen(
    second,
    'ping',
    () => {
      calls += 1;
    },
    { passive: true },
  );

  first.dispatchEvent(new Event('ping'));
  second.dispatchEvent(new Event('ping'));

  scope.dispose();
  scope.dispose();

  first.dispatchEvent(new Event('ping'));
  second.dispatchEvent(new Event('ping'));

  assert.equal(calls, 2);
});

test('EventScope reset fjerner forrige rendering og lar den nye reagere', () => {
  const scope = new EventScope();
  const previousButton = new EventTarget();
  const currentButton = new EventTarget();
  const calls = [];

  scope.listen(previousButton, 'click', () => calls.push('previous'));
  scope.reset();
  scope.listen(currentButton, 'click', () => calls.push('current'));

  previousButton.dispatchEvent(new Event('click'));
  currentButton.dispatchEvent(new Event('click'));

  assert.deepEqual(calls, ['current']);
});
