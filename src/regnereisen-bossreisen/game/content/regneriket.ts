import type { Operation } from './locations';
import type { MedalId } from './medals';

export type RegneriketStopKind = 'lys' | 'hent' | 'reparer' | 'lever' | 'portal' | 'utforsk' | 'tid';
export type RegneriketQuestType = 'standard' | 'pickup' | 'timed';
export type RegneriketPickupMode = 'simultaneous' | 'sequential';

export type RegneriketStop = {
  id: string;
  order: number;
  place: string;
  title: string;
  kind: RegneriketStopKind;
  description: string;
  successText: string;
  iconSrc: string;
  x: number;
  y: number;
  color: number;
  accent: string;
  operations: Operation[];
  requiredCorrect: number;
  regnecoins: number;
  dependencies: string[];
  medalReward?: MedalId;
  questType?: RegneriketQuestType;
};

export type RegneriketMapItem = {
  id: string;
  questId: string;
  label: string;
  src: string;
  x: number;
  y: number;
  ringColor: number;
};

export type RegneriketPickupQuest = {
  stopId: string;
  mode: RegneriketPickupMode;
  introTitle: string;
  introText: string;
  itemRequiredCorrect: number;
  items: RegneriketMapItem[];
};

export const REGNERIKET_FINAL_STOP_ID = 'portalarkivet';

export const REGNERIKET_STOPS: RegneriketStop[] = [
  {
    id: 'talltreportalen',
    order: 1,
    place: 'Talltreportalen',
    title: 'Tenn portallyset',
    kind: 'lys',
    description: 'Svar riktig for å tenne de gamle lyktene rundt Talltreet.',
    successText: 'Talltreet lyser igjen. Den første mynten venter ved portalen.',
    iconSrc: '/regnemester/quests/talltreportalen.png',
    x: 355,
    y: 245,
    color: 0x78e06f,
    accent: '#78e06f',
    operations: ['add'],
    requiredCorrect: 10,
    regnecoins: 12,
    dependencies: [],
    medalReward: 'skogvokter'
  },
  {
    id: 'regneenga',
    order: 2,
    place: 'Regneenga',
    title: 'Samle tallfrø',
    kind: 'hent',
    description: 'Finn riktige svar og samle tallfrø til de små hagene.',
    successText: 'Tallfrøene spirer. En ny oppdragsmynt ligger klar.',
    iconSrc: '/regnemester/quests/regneenga.png',
    x: 540,
    y: 700,
    color: 0xffd45f,
    accent: '#ffd45f',
    operations: ['add'],
    requiredCorrect: 15,
    regnecoins: 14,
    dependencies: ['talltreportalen'],
    questType: 'pickup'
  },
  {
    id: 'krystallporten',
    order: 3,
    place: 'Krystallporten',
    title: 'Knekk krystallkoden',
    kind: 'reparer',
    description: 'Krystallene er ute av takt. Løs oppgaver for å samle lyset.',
    successText: 'Krystallporten svarer. Koden er hel igjen.',
    iconSrc: '/regnemester/quests/krystallporten.png',
    x: 1365,
    y: 480,
    color: 0xb076ff,
    accent: '#c995ff',
    operations: ['subtract'],
    requiredCorrect: 12,
    regnecoins: 16,
    dependencies: ['talltreportalen'],
    medalReward: 'krystallkode'
  },
  {
    id: 'klokkebyen',
    order: 4,
    place: 'Klokkebyen',
    title: 'Still tallklokkene',
    kind: 'reparer',
    description: 'Klokkene går ulikt. Bruk regning for å få byen i rytme.',
    successText: 'Klokkene slår samtidig. Byen sender deg videre.',
    iconSrc: '/regnemester/quests/klokkebyen.png',
    x: 1925,
    y: 655,
    color: 0x20b7ff,
    accent: '#20b7ff',
    operations: ['subtract'],
    requiredCorrect: 13,
    regnecoins: 18,
    dependencies: ['regneenga', 'krystallporten'],
    medalReward: 'tidsmester'
  },
  {
    id: 'frostpasset',
    order: 5,
    place: 'Frostpasset',
    title: 'Bygg isstien',
    kind: 'lever',
    description: 'Svar riktig for å legge trygge isbrikker over fjellpasset.',
    successText: 'Isstien holder. Veien mot skyplattformene er åpen.',
    iconSrc: '/regnemester/quests/frostpasset.png',
    x: 2500,
    y: 300,
    color: 0x7bdcff,
    accent: '#8fe7ff',
    operations: ['multiply'],
    requiredCorrect: 14,
    regnecoins: 20,
    dependencies: ['klokkebyen']
  },
  {
    id: 'skyhaven',
    order: 6,
    place: 'Skyhaven',
    title: 'Aktiver skybroene',
    kind: 'lys',
    description: 'Skyplattformene trenger regnekraft for å holde broene oppe.',
    successText: 'Skybroene lyser. Hele høyden er trygg å utforske.',
    iconSrc: '/regnemester/quests/skyhaven.png',
    x: 3520,
    y: 170,
    color: 0xfacc15,
    accent: '#facc15',
    operations: ['multiply'],
    requiredCorrect: 15,
    regnecoins: 24,
    dependencies: ['frostpasset'],
    medalReward: 'skybro'
  },
  {
    id: 'soppbiblioteket',
    order: 7,
    place: 'Soppbiblioteket',
    title: 'Sorter regnebokene',
    kind: 'hent',
    description: 'Biblioteket har mistet rekkefølgen. Finn riktige svar og sorter hyllene.',
    successText: 'Bokhyllene står riktig. Soppbyen feirer med en mynt.',
    iconSrc: '/regnemester/quests/soppbiblioteket.png',
    x: 3050,
    y: 1370,
    color: 0xff8ac7,
    accent: '#ff8ac7',
    operations: ['divide'],
    requiredCorrect: 14,
    regnecoins: 20,
    dependencies: ['frostpasset']
  },
  {
    id: 'havneverkstedet',
    order: 8,
    place: 'Havneverkstedet',
    title: 'Reparer regneskipet',
    kind: 'reparer',
    description: 'Skipsmotoren mangler tannhjul. Finn tannhjulene for å fikse motoren.',
    successText: 'Regneskipet flyter igjen. Havnen gir deg en blank mynt.',
    iconSrc: '/regnemester/quests/havneverkstedet.png',
    x: 1900,
    y: 1320,
    color: 0x4fd0cf,
    accent: '#66e7e0',
    operations: ['divide'],
    requiredCorrect: 16,
    regnecoins: 24,
    dependencies: ['klokkebyen'],
    medalReward: 'havnemester',
    questType: 'pickup'
  },
  {
    id: 'lavaakademiet',
    order: 9,
    place: 'Lavaakademiet',
    title: 'Kjøl ned lavakjernen',
    kind: 'reparer',
    description: 'Lavaen stiger. Løs oppgaver raskt og stabiliser kjernen.',
    successText: 'Lavakjernen er stabil. Akademiet sender deg mot slutten.',
    iconSrc: '/regnemester/quests/lavaakademiet.png',
    x: 1505,
    y: 1795,
    color: 0xff7448,
    accent: '#ff8d58',
    operations: ['add', 'subtract', 'multiply'],
    requiredCorrect: 16,
    regnecoins: 28,
    dependencies: ['havneverkstedet'],
    medalReward: 'lavamester'
  },
  {
    id: 'portalarkivet',
    order: 10,
    place: 'Portalarkivet',
    title: 'Åpne Regnerikets arkiv',
    kind: 'portal',
    description: 'Løs oppgavene for å åpne portalen som fører deg til Skyhaven.',
    successText: 'Portalarkivet åpner seg. Regneriket-medaljen er din.',
    iconSrc: '/regnemester/quests/portalarkivet.png',
    x: 3200,
    y: 2000,
    color: 0x9b5cff,
    accent: '#b78cff',
    operations: ['add', 'subtract', 'multiply', 'divide'],
    requiredCorrect: 18,
    regnecoins: 36,
    dependencies: ['skyhaven', 'soppbiblioteket', 'lavaakademiet'],
    medalReward: 'regneriket'
  },
  {
    id: 'utforskningsrunden',
    order: 11,
    place: 'Utforskningsrunden',
    title: 'Finn seks skjulte gjenstander',
    kind: 'utforsk',
    description: 'Finn gjenstandene som er gjemt rundt i Regneriket og løs tre oppgaver ved hver.',
    successText: 'Alle gjenstandene er funnet. Utforskningsmynten venter på kartet.',
    iconSrc: '/regnemester/quest-items/utforskningsrunden.png',
    x: 480,
    y: 1760,
    color: 0x7dd3fc,
    accent: '#7dd3fc',
    operations: ['add', 'subtract', 'multiply', 'divide'],
    requiredCorrect: 18,
    regnecoins: 34,
    dependencies: [],
    questType: 'pickup'
  },
  {
    id: 'tidslopet',
    order: 12,
    place: 'Tidsløpet',
    title: 'Finn timeglasset',
    kind: 'tid',
    description: 'Løs fem oppgaver og finn timeglasset før tiden renner ut.',
    successText: 'Timeglasset er funnet. Tidsmynten venter på kartet.',
    iconSrc: '/regnemester/quest-items/tidslopet.png',
    x: 2840,
    y: 1735,
    color: 0xf97316,
    accent: '#fb923c',
    operations: ['add', 'subtract', 'multiply', 'divide'],
    requiredCorrect: 5,
    regnecoins: 32,
    dependencies: [],
    questType: 'timed'
  }
];

export const EXPLORATION_ITEMS: RegneriketMapItem[] = [
  { id: 'kalkulator', questId: 'utforskningsrunden', label: 'Kalkulator', src: '/regnemester/quest-items/kalkulator.png', x: 800, y: 2280, ringColor: 0x7dd3fc },
  { id: 'blyant', questId: 'utforskningsrunden', label: 'Blyant', src: '/regnemester/quest-items/blyant.png', x: 1440, y: 2280, ringColor: 0x7dd3fc },
  { id: 'lyspaere', questId: 'utforskningsrunden', label: 'Lyspære', src: '/regnemester/quest-items/lyspaere.png', x: 2170, y: 1840, ringColor: 0x7dd3fc },
  { id: 'fisk', questId: 'utforskningsrunden', label: 'Fisk', src: '/regnemester/quest-items/fisk.png', x: 1800, y: 1280, ringColor: 0x7dd3fc },
  { id: 'tannhjul', questId: 'utforskningsrunden', label: 'Tannhjul', src: '/regnemester/quest-items/tannhjul.png', x: 2240, y: 960, ringColor: 0x7dd3fc },
  { id: 'lilla-krystall', questId: 'utforskningsrunden', label: 'Lilla krystall', src: '/regnemester/quest-items/lilla-krystall.png', x: 1120, y: 800, ringColor: 0x7dd3fc }
];

export const REGNEENGA_ITEMS: RegneriketMapItem[] = [
  { id: 'tallfro-1', questId: 'regneenga', label: 'Tallfrø 1', src: '/regnemester/quest-items/tallfro.png', x: 350, y: 560, ringColor: 0x4ade80 },
  { id: 'tallfro-2', questId: 'regneenga', label: 'Tallfrø 2', src: '/regnemester/quest-items/tallfro.png', x: 515, y: 790, ringColor: 0x4ade80 },
  { id: 'tallfro-3', questId: 'regneenga', label: 'Tallfrø 3', src: '/regnemester/quest-items/tallfro.png', x: 700, y: 650, ringColor: 0x4ade80 },
  { id: 'tallfro-4', questId: 'regneenga', label: 'Tallfrø 4', src: '/regnemester/quest-items/tallfro.png', x: 760, y: 865, ringColor: 0x4ade80 },
  { id: 'tallfro-5', questId: 'regneenga', label: 'Tallfrø 5', src: '/regnemester/quest-items/tallfro.png', x: 430, y: 930, ringColor: 0x4ade80 }
];

export const HAVNEVERKSTEDET_ITEMS: RegneriketMapItem[] = [
  { id: 'havnehjul-1', questId: 'havneverkstedet', label: 'Tannhjul 1', src: '/regnemester/quest-items/tannhjul.png', x: 1660, y: 1055, ringColor: 0x4fd0cf },
  { id: 'havnehjul-2', questId: 'havneverkstedet', label: 'Tannhjul 2', src: '/regnemester/quest-items/tannhjul.png', x: 1880, y: 1260, ringColor: 0x4fd0cf },
  { id: 'havnehjul-3', questId: 'havneverkstedet', label: 'Tannhjul 3', src: '/regnemester/quest-items/tannhjul.png', x: 2070, y: 1370, ringColor: 0x4fd0cf },
  { id: 'havnehjul-4', questId: 'havneverkstedet', label: 'Tannhjul 4', src: '/regnemester/quest-items/tannhjul.png', x: 2190, y: 1180, ringColor: 0x4fd0cf }
];

export const REGNERIKET_PICKUP_QUESTS: RegneriketPickupQuest[] = [
  {
    stopId: 'regneenga',
    mode: 'simultaneous',
    introTitle: 'Samle tallfrøene',
    introText: 'Fem tallfrø er spredt rundt Regneenga. Finn dem, trykk «Plukk opp» og løs tre addisjonsoppgaver ved hvert frø.',
    itemRequiredCorrect: 3,
    items: REGNEENGA_ITEMS
  },
  {
    stopId: 'havneverkstedet',
    mode: 'simultaneous',
    introTitle: 'Finn tannhjulene',
    introText: 'Fire tannhjul er spredt rundt havnen. Finn dem, trykk «Plukk opp» og løs fire divisjonsoppgaver ved hvert tannhjul.',
    itemRequiredCorrect: 4,
    items: HAVNEVERKSTEDET_ITEMS
  },
  {
    stopId: 'utforskningsrunden',
    mode: 'sequential',
    introTitle: 'Utforskningsrunden',
    introText: 'Det er gjemt seks gjenstander rundt i Regneriket. Finn én og én gjenstand, plukk den opp og løs tre oppgaver for hver.',
    itemRequiredCorrect: 3,
    items: EXPLORATION_ITEMS
  }
];

export const REGNERIKET_PICKUP_ITEMS = REGNERIKET_PICKUP_QUESTS.flatMap((quest) => quest.items);

export const TIMED_TARGET: RegneriketMapItem = {
  id: 'timeglass',
  questId: 'tidslopet',
  label: 'Timeglasset',
  src: '/regnemester/quest-items/timeglass.png',
  x: 800,
  y: 160,
  ringColor: 0xf97316
};

export function getRegneriketStopById(id: string): RegneriketStop | undefined {
  return REGNERIKET_STOPS.find((stop) => stop.id === id);
}

export function getRegneriketPickupQuest(stopId: string): RegneriketPickupQuest | undefined {
  return REGNERIKET_PICKUP_QUESTS.find((quest) => quest.stopId === stopId);
}

export function getRegneriketPickupQuestForItem(itemId: string): RegneriketPickupQuest | undefined {
  return REGNERIKET_PICKUP_QUESTS.find((quest) => quest.items.some((item) => item.id === itemId));
}
