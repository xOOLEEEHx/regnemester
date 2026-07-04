import type { OperationMode } from './settings';

export type MedalId = OperationMode | 'story';

export type MedalDefinition = {
  id: MedalId;
  label: string;
  shortLabel: string;
  src: string;
  description: string;
};

export const OPERATION_MEDAL_IDS: OperationMode[] = ['add', 'subtract', 'multiply', 'divide', 'mixed'];
export const MEDAL_IDS: MedalId[] = [...OPERATION_MEDAL_IDS, 'story'];

export const MEDALS: MedalDefinition[] = [
  {
    id: 'add',
    label: 'Addisjonsmedalje',
    shortLabel: '+',
    src: '/regnemester/rewards/addisjon-medal.png',
    description: 'Fullfør Regnereisen med addisjon.'
  },
  {
    id: 'subtract',
    label: 'Subtraksjonsmedalje',
    shortLabel: '-',
    src: '/regnemester/rewards/subtraksjon-medal.png',
    description: 'Fullfør Regnereisen med subtraksjon.'
  },
  {
    id: 'multiply',
    label: 'Multiplikasjonsmedalje',
    shortLabel: 'x',
    src: '/regnemester/rewards/multiplikasjon-medal.png',
    description: 'Fullfør Regnereisen med multiplikasjon.'
  },
  {
    id: 'divide',
    label: 'Divisjonsmedalje',
    shortLabel: ':',
    src: '/regnemester/rewards/divisjon-medal.png',
    description: 'Fullfør Regnereisen med divisjon.'
  },
  {
    id: 'mixed',
    label: 'Blanding-medalje',
    shortLabel: '',
    src: '/regnemester/rewards/regnereisen-medal.png',
    description: 'Fullfør Regnereisen med blandede regnearter.'
  },
  {
    id: 'story',
    label: 'Story mode-medalje',
    shortLabel: '',
    src: '/regnemester/rewards/story-mode-medal.png',
    description: 'Fullfør Story mode med tre liv for hele reisen.'
  }
];

export const MEDAL_BY_ID: Record<MedalId, MedalDefinition> = MEDALS.reduce(
  (accumulator, medal) => {
    accumulator[medal.id] = medal;
    return accumulator;
  },
  {} as Record<MedalId, MedalDefinition>
);

export function getMedal(id: MedalId): MedalDefinition {
  return MEDAL_BY_ID[id] ?? MEDAL_BY_ID.mixed;
}
