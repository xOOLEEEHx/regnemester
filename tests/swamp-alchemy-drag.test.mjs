import assert from 'node:assert/strict';
import test from 'node:test';

let shouldPreserveSwampIngredientDrag;
try {
  ({ shouldPreserveSwampIngredientDrag } = await import(
    '../src/regnereisen-bossreisen/game/simulation/swampAlchemyDrag.ts'
  ));
} catch (error) {
  if (error?.code !== 'ERR_MODULE_NOT_FOUND') throw error;
}

test('layout beholder ingrediensposisjonen bare mens en drag-rute er aktiv', () => {
  const cases = [
    { phase: 'ingredient', phaserPointerIsDown: false, nativeTouchId: 41, expected: true },
    { phase: 'ingredient', phaserPointerIsDown: true, nativeTouchId: undefined, expected: true },
    { phase: 'ingredient', phaserPointerIsDown: false, nativeTouchId: undefined, expected: false },
    { phase: 'quiz', phaserPointerIsDown: false, nativeTouchId: 41, expected: false }
  ];

  for (const input of cases) {
    assert.equal(
      shouldPreserveSwampIngredientDrag?.(
        input.phase,
        input.phaserPointerIsDown,
        input.nativeTouchId
      ),
      input.expected,
      JSON.stringify(input)
    );
  }
});
