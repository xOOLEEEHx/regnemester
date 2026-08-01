import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import test from 'node:test';

const { registerSceneCleanup } = await import(
  '../src/regnereisen-bossreisen/phaser/sceneCleanup.ts'
);

test('sceneopprydding kjører ved destroy uten shutdown', () => {
  const events = new EventEmitter();
  let cleanupCalls = 0;

  registerSceneCleanup(events, () => {
    cleanupCalls += 1;
  });
  events.emit('destroy');

  assert.equal(cleanupCalls, 1);
});

test('sceneopprydding kjører bare én gang når shutdown etterfølges av destroy', () => {
  const events = new EventEmitter();
  let cleanupCalls = 0;

  registerSceneCleanup(events, () => {
    cleanupCalls += 1;
  });
  events.emit('shutdown');
  events.emit('destroy');

  assert.equal(cleanupCalls, 1);
});
