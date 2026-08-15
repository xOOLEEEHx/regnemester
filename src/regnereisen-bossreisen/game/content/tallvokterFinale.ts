import type { MathQuestDefinition } from '../simulation/mathQuest';
import { getEffectiveDifficulty, type GameSettings } from './settings';
import { getMapObjectPosition } from './mapObjectPositions';
import { TALLVOKTER_MAP_ID } from './maps';

export const TALLVOKTER_FINALE_REQUIRED_CORRECT = 15;
export const TALLVOKTER_FINALE_PHASE_SIZE = 5;
export const TALLVOKTER_FINALE_OBJECT_ID = 'tallvokterFinale';
export const TALLVOKTER_FINALE_MAP_TEXTURE_KEY = 'tallvokter-finale-map';
export const TALLVOKTER_FINALE_INTERACTION_DISTANCE = 132;

export const TALLVOKTER_FINALE_ASSETS = {
  map: '/regnemester/tallvokter-finale/tallvokter-map.webp',
  intro: '/regnemester/tallvokter-finale/tallvokter-intro.webp',
  phase1: '/regnemester/tallvokter-finale/tallvokter-phase-1.webp',
  phase2: '/regnemester/tallvokter-finale/tallvokter-phase-2.webp',
  phase3: '/regnemester/tallvokter-finale/tallvokter-phase-3.webp',
  ending: '/regnemester/tallvokter-finale/tallvokter-ending.webp',
  arena: '/regnemester/tallvokter-finale/tallvokter-final-arena.webp'
} as const;

export const TALLVOKTER_FINALE_CONFIG = {
  position: getMapObjectPosition(TALLVOKTER_MAP_ID, TALLVOKTER_FINALE_OBJECT_ID),
  interactionDistance: TALLVOKTER_FINALE_INTERACTION_DISTANCE
} as const;

export const TALLVOKTER_FINALE: MathQuestDefinition = {
  id: 'tallvokterens-siste-duell',
  place: 'Tallvokterens siste duell',
  title: 'Bestå de tre siste prøvene',
  description: 'Svar riktig på 15 matematikkoppgaver og vis Tallvokteren alt du har lært.',
  successText: 'Alle tre prøvene er bestått!',
  iconSrc: TALLVOKTER_FINALE_ASSETS.intro,
  operations: ['add', 'subtract', 'multiply', 'divide'],
  requiredCorrect: TALLVOKTER_FINALE_REQUIRED_CORRECT
};

export const TALLVOKTER_FINALE_PHASES = [
  {
    id: 1,
    name: 'Innsiktens prøve',
    kicker: 'Fase 1 av 3',
    asset: TALLVOKTER_FINALE_ASSETS.phase1
  },
  {
    id: 2,
    name: 'Kraftens prøve',
    kicker: 'Fase 2 av 3',
    asset: TALLVOKTER_FINALE_ASSETS.phase2
  },
  {
    id: 3,
    name: 'Tallvokterens siste prøve',
    kicker: 'Fase 3 av 3',
    asset: TALLVOKTER_FINALE_ASSETS.phase3
  }
] as const;

export function getTallvokterFinaleReward(settings: GameSettings): number {
  const difficulty = getEffectiveDifficulty(settings);
  if (difficulty === 'easy' || difficulty === 'easy-add-subtract') {
    return 100;
  }
  if (difficulty === 'hard') {
    return 200;
  }
  return 125;
}
