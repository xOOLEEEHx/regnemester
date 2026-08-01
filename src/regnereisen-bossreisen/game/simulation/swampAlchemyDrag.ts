export function shouldPreserveSwampIngredientDrag(
  phase: string | undefined,
  phaserPointerIsDown: boolean,
  nativeTouchId: number | undefined
): boolean {
  return phase === 'ingredient'
    && (phaserPointerIsDown || nativeTouchId !== undefined);
}
