import type { Operation } from './locations';
import { getMapObjectPosition } from './mapObjectPositions';
import { TALLVOKTER_MAP_ID } from './maps';
import { getEffectiveDifficulty, type Difficulty, type GameSettings } from './settings';

export type GladiatorDefinition = {
  id: string;
  place: string;
  title: string;
  description: string;
  successText: string;
  iconSrc: string;
  operations: Operation[];
  requiredCorrect: number;
};

export const GLADIATOR_ARENA_QUEST_ID = 'gladiator-arenaen';
export const LANISTA_TEXTURE_KEY = 'gladiator-arena-lanista';
export const LANISTA_ASSET_PATH = '/regnemester/gladiator-arena/lanista.png?v=4';

export const GLADIATOR_ARENA_CONFIG = {
  lanistaPosition: getMapObjectPosition(TALLVOKTER_MAP_ID, 'lanista'),
  interactionDistance: 110
} as const;

export const GLADIATOR_ARENA_WELCOME =
  'Velkommen til Gladiatorarenaen! For å bli arenaens mester må du beseire fire gladiatorer. Hver av dem utfordrer deg med sin egen type matematikk. Slår du alle fire, venter både mestertittelen og en belønning fra meg.';

export const GLADIATORS: readonly GladiatorDefinition[] = [
  {
    id: 'bronsesverdet',
    place: 'Gladiator 1 av 4',
    title: 'Tvillingbladet',
    description: 'Svar riktig på 2 multiplikasjonsoppgaver for å beseire Tvillingbladet og de to bronsesverdene hennes.',
    successText: 'Tvillingbladet er beseiret!',
    iconSrc: '/regnemester/gladiator-arena/gladiator-1.png?v=3',
    operations: ['multiply'],
    requiredCorrect: 2
  },
  {
    id: 'solvskjoldet',
    place: 'Gladiator 2 av 4',
    title: 'Treforkjegeren',
    description: 'Svar riktig på 3 subtraksjonsoppgaver for å unnslippe nettet og beseire Treforkjegeren.',
    successText: 'Treforkjegeren er beseiret!',
    iconSrc: '/regnemester/gladiator-arena/gladiator-2.png?v=3',
    operations: ['subtract'],
    requiredCorrect: 3
  },
  {
    id: 'gullmesteren',
    place: 'Gladiator 3 av 4',
    title: 'Øksekolossen',
    description: 'Svar riktig på 4 addisjonsoppgaver for å overvinne den mektige Øksekolossen.',
    successText: 'Øksekolossen er beseiret!',
    iconSrc: '/regnemester/gladiator-arena/gladiator-3.png?v=3',
    operations: ['add'],
    requiredCorrect: 4
  },
  {
    id: 'tallkolossen',
    place: 'Gladiator 4 av 4',
    title: 'Krystallmesteren',
    description: 'Svar riktig på 5 blandingsoppgaver for å knuse Krystallmesterens forsvar og bli arenaens mester.',
    successText: 'Krystallmesteren er beseiret!',
    iconSrc: '/regnemester/gladiator-arena/gladiator-4.png?v=3',
    operations: ['add', 'subtract', 'multiply', 'divide'],
    requiredCorrect: 5
  }
] as const;

const GLADIATOR_ARENA_REWARDS: Record<Difficulty, number> = {
  'easy-add-subtract': 40,
  easy: 40,
  normal: 50,
  hard: 70
};

export function getGladiatorArenaReward(settings: GameSettings): number {
  return GLADIATOR_ARENA_REWARDS[getEffectiveDifficulty(settings)];
}
