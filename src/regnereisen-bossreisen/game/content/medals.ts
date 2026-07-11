import type { OperationMode } from './settings';

export type RegneriketMedalId =
  | 'regneriket'
  | 'regneriket-normal'
  | 'regneriket-hard'
  | 'skogvokter'
  | 'krystallkode'
  | 'tidsmester'
  | 'skybro'
  | 'havnemester'
  | 'lavamester'
  | 'regnecoin'
  | 'regnecoin-5000'
  | 'regnecoin-10000'
  | 'regnecoin-20000'
  | 'regnecoin-40000'
  | 'tidslop-bronse'
  | 'tidslop-solv'
  | 'tidslop-gull'
  | 'immortal';

export type MedalId = OperationMode | 'story' | RegneriketMedalId;

export type MedalDefinition = {
  id: MedalId;
  label: string;
  shortLabel: string;
  src: string;
  description: string;
};

export const OPERATION_MEDAL_IDS: OperationMode[] = ['add', 'subtract', 'multiply', 'divide', 'mixed'];
export const REGNECOIN_MEDAL_TIERS: Array<{ id: RegneriketMedalId; threshold: number }> = [
  { id: 'regnecoin', threshold: 2000 },
  { id: 'regnecoin-5000', threshold: 5000 },
  { id: 'regnecoin-10000', threshold: 10000 },
  { id: 'regnecoin-20000', threshold: 20000 },
  { id: 'regnecoin-40000', threshold: 40000 }
];
export const ACHIEVEMENT_MEDAL_IDS: RegneriketMedalId[] = [
  'regneriket',
  'regneriket-normal',
  'regneriket-hard',
  'skogvokter',
  'krystallkode',
  'tidsmester',
  'skybro',
  'havnemester',
  'lavamester',
  'regnecoin',
  'regnecoin-5000',
  'regnecoin-10000',
  'regnecoin-20000',
  'regnecoin-40000',
  'tidslop-bronse',
  'tidslop-solv',
  'tidslop-gull',
  'immortal'
];
export const MEDAL_IDS: MedalId[] = [...OPERATION_MEDAL_IDS, 'story', ...ACHIEVEMENT_MEDAL_IDS];

export const MEDALS: MedalDefinition[] = [
  {
    id: 'add',
    label: 'Addisjonsmedalje',
    shortLabel: '+',
    src: '/regnemester/rewards/addisjon-medal.png',
    description: 'Fullfør Boss-reisen med addisjon.'
  },
  {
    id: 'subtract',
    label: 'Subtraksjonsmedalje',
    shortLabel: '-',
    src: '/regnemester/rewards/subtraksjon-medal.png',
    description: 'Fullfør Boss-reisen med subtraksjon.'
  },
  {
    id: 'multiply',
    label: 'Multiplikasjonsmedalje',
    shortLabel: 'x',
    src: '/regnemester/rewards/multiplikasjon-medal.png',
    description: 'Fullfør Boss-reisen med multiplikasjon.'
  },
  {
    id: 'divide',
    label: 'Divisjonsmedalje',
    shortLabel: ':',
    src: '/regnemester/rewards/divisjon-medal.png',
    description: 'Fullfør Boss-reisen med divisjon.'
  },
  {
    id: 'mixed',
    label: 'Blanding-medalje',
    shortLabel: '',
    src: '/regnemester/rewards/regnereisen-medal.png',
    description: 'Fullfør Boss-reisen med blandede regnearter.'
  },
  {
    id: 'story',
    label: 'Story mode-medalje',
    shortLabel: '',
    src: '/regnemester/rewards/story-mode-medal.png',
    description: 'Fullfør Story mode med tre liv for hele reisen.'
  },
  {
    id: 'regneriket',
    label: 'Regneriket Lett-medalje',
    shortLabel: '',
    src: '/regnemester/rewards/regneriket-medal.png',
    description: 'Fullfør alle stedene og hent alle myntene i Regneriket på Lett.'
  },
  {
    id: 'regneriket-normal',
    label: 'Regneriket Middels-medalje',
    shortLabel: '',
    src: '/regnemester/rewards/regneriket-middels-medal.png',
    description: 'Fullfør alle stedene og hent alle myntene i Regneriket på Middels.'
  },
  {
    id: 'regneriket-hard',
    label: 'Regneriket Vanskelig-medalje',
    shortLabel: '',
    src: '/regnemester/rewards/regneriket-vanskelig-medal.png',
    description: 'Fullfør alle stedene og hent alle myntene i Regneriket på Vanskelig.'
  },
  {
    id: 'skogvokter',
    label: 'Skogvokter-medalje',
    shortLabel: '',
    src: '/regnemester/rewards/skogvokter-medal.png',
    description: 'Hent minst 5 mynter og fullfør Talltreportalen, Regneenga, Frostpasset og Soppbiblioteket uten å miste liv.'
  },
  {
    id: 'krystallkode',
    label: 'Krystallkode-medalje',
    shortLabel: '',
    src: '/regnemester/rewards/krystallkode-medal.png',
    description: 'På Middels eller Vanskelig: hent minst 5 mynter og fullfør Krystallporten, Klokkebyen og Frostpasset uten å miste liv.'
  },
  {
    id: 'tidsmester',
    label: 'Tidsmester-medalje',
    shortLabel: '',
    src: '/regnemester/rewards/tidsmester-medal.png',
    description: 'På Middels eller Vanskelig: hent minst 4 mynter og fullfør Regneenga, Krystallporten og Klokkebyen uten å miste liv.'
  },
  {
    id: 'skybro',
    label: 'Skybro-medalje',
    shortLabel: '',
    src: '/regnemester/rewards/skybro-medal.png',
    description: 'På Middels eller Vanskelig: hent minst 6 mynter, fullfør Frostpasset, åpne Portalarkivet og fullfør Skyhaven uten å miste liv.'
  },
  {
    id: 'havnemester',
    label: 'Havnemester-medalje',
    shortLabel: '',
    src: '/regnemester/rewards/havnemester-medal.png',
    description: 'Hent minst 6 mynter og fullfør Klokkebyen og Havneverkstedet uten å miste liv.'
  },
  {
    id: 'lavamester',
    label: 'Lavamester-medalje',
    shortLabel: '',
    src: '/regnemester/rewards/lavamester-medal.png',
    description: 'På Vanskelig: hent minst 8 mynter og fullfør Krystallporten, Havneverkstedet og Lavaakademiet uten å miste liv.'
  },
  {
    id: 'regnecoin',
    label: 'Regnecoin-medalje',
    shortLabel: '',
    src: '/regnemester/rewards/regnecoin-medal.png',
    description: 'Samle 2000 Regnecoins gjennom reiser, oppdrag og medaljer.'
  },
  {
    id: 'regnecoin-5000',
    label: 'Myntjeger-medalje',
    shortLabel: '',
    src: '/regnemester/rewards/regnecoin-5000-medal.png',
    description: 'Tjen totalt 5000 Regnecoins gjennom reiser, oppdrag og medaljer.'
  },
  {
    id: 'regnecoin-10000',
    label: 'Regnecoin-mester',
    shortLabel: '',
    src: '/regnemester/rewards/regnecoin-10000-medal.png',
    description: 'Tjen totalt 10 000 Regnecoins gjennom reiser, oppdrag og medaljer.'
  },
  {
    id: 'regnecoin-20000',
    label: 'Skattkammer-legende',
    shortLabel: '',
    src: '/regnemester/rewards/regnecoin-20000-medal.png',
    description: 'Tjen totalt 20 000 Regnecoins gjennom reiser, oppdrag og medaljer.'
  },
  {
    id: 'regnecoin-40000',
    label: 'Regnecoin-keiser',
    shortLabel: '',
    src: '/regnemester/rewards/regnecoin-40000-medal.png',
    description: 'Tjen totalt 40 000 Regnecoins gjennom reiser, oppdrag og medaljer.'
  },
  {
    id: 'tidslop-bronse',
    label: 'Tidsløpets bronsemedalje',
    shortLabel: '',
    src: '/regnemester/rewards/tidslop-bronse-medal.png',
    description: 'Finn timeglasset på minst 15, men under 20 sekunder.'
  },
  {
    id: 'tidslop-solv',
    label: 'Tidsløpets sølvmedalje',
    shortLabel: '',
    src: '/regnemester/rewards/tidslop-solv-medal.png',
    description: 'Finn timeglasset på minst 10, men under 15 sekunder.'
  },
  {
    id: 'tidslop-gull',
    label: 'Tidsløpets gullmedalje',
    shortLabel: '',
    src: '/regnemester/rewards/tidslop-gull-medal.png',
    description: 'Finn timeglasset på under 10 sekunder.'
  },
  {
    id: 'immortal',
    label: 'Udødelighets-medaljen',
    shortLabel: '',
    src: '/regnemester/rewards/udodelighets-medal.png',
    description: 'Fullfør en hel utfordring uten å miste et eneste liv.'
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
