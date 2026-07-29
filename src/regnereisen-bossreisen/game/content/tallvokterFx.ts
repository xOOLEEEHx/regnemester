export const TALLVOKTER_FX_LEVELS = ['off', 'low', 'standard', 'high', 'ultra'] as const;

export type TallvokterFxLevel = (typeof TALLVOKTER_FX_LEVELS)[number];

export const DEFAULT_TALLVOKTER_FX_LEVEL: TallvokterFxLevel = 'standard';

const STORAGE_KEY = 'regnemester-tallvokter-fx-level';

function getDefaultTallvokterFxLevel(): TallvokterFxLevel {
  const touchFirst = window.matchMedia('(pointer: coarse)').matches
    || navigator.maxTouchPoints > 1;
  return touchFirst ? 'off' : DEFAULT_TALLVOKTER_FX_LEVEL;
}

export function isTallvokterFxLevel(value: string): value is TallvokterFxLevel {
  return TALLVOKTER_FX_LEVELS.some((level) => level === value);
}

export function getStoredTallvokterFxLevel(): TallvokterFxLevel {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored && isTallvokterFxLevel(stored) ? stored : getDefaultTallvokterFxLevel();
}

export function saveTallvokterFxLevel(level: TallvokterFxLevel): void {
  window.localStorage.setItem(STORAGE_KEY, level);
}
