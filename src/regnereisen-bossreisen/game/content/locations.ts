export type Operation = 'add' | 'subtract' | 'multiply' | 'divide';

export type LocationNode = {
  id: string;
  order: number;
  place: string;
  bossName: string;
  region: string;
  x: number;
  y: number;
  color: number;
  accent: string;
  operations: Operation[];
  maxFactor: number;
  bossHp: number;
  hiddenUntilUnlocked?: boolean;
  secret?: boolean;
  reward: string;
  boss: {
    idle: string;
    attack: string;
    hurt: string;
    hurt2: string;
    low: string;
    defeated: string;
    panel: string;
  };
};

const bossBase = '/bosses';

export const WORLD_SIZE = {
  width: 2400,
  height: 1600,
  startX: 430,
  startY: 305
};

export const LOCATIONS: LocationNode[] = [
  {
    id: 'slimmyra',
    order: 1,
    place: 'Slimmyra',
    bossName: 'Slimbossen',
    region: 'Myrporten',
    x: 430,
    y: 250,
    color: 0x85e65e,
    accent: '#9cff71',
    operations: ['add'],
    maxFactor: 10,
    bossHp: 10,
    reward: 'Trollhulen åpnes',
    boss: {
      idle: `${bossBase}/slime/slime-boss-idle.webp`,
      attack: `${bossBase}/slime/slime-boss-attack.webp`,
      hurt: `${bossBase}/slime/slime-boss-hurt-01.webp`,
      hurt2: `${bossBase}/slime/slime-boss-hurt-02.webp`,
      low: `${bossBase}/slime/slime-boss-low-hp.webp`,
      defeated: `${bossBase}/slime/slime-boss-defeated.webp`,
      panel: `${bossBase}/slime/slime-panel-bg.webp`
    }
  },
  {
    id: 'trollhulen',
    order: 2,
    place: 'Trollhulen',
    bossName: 'Trollkongen',
    region: 'Steinringen',
    x: 940,
    y: 235,
    color: 0xc58b52,
    accent: '#d89b61',
    operations: ['add', 'subtract'],
    maxFactor: 14,
    bossHp: 15,
    reward: 'Skyggeborgen åpnes',
    boss: {
      idle: `${bossBase}/trollkongen/trollkongen-idle.webp`,
      attack: `${bossBase}/trollkongen/trollkongen-attack.webp`,
      hurt: `${bossBase}/trollkongen/trollkongen-hurt-1.webp`,
      hurt2: `${bossBase}/trollkongen/trollkongen-hurt-2.webp`,
      low: `${bossBase}/trollkongen/trollkongen-low-hp.webp`,
      defeated: `${bossBase}/trollkongen/trollkongen-defeated.webp`,
      panel: `${bossBase}/trollkongen/trollkongen-panel-bg.webp`
    }
  },
  {
    id: 'skyggeborgen',
    order: 3,
    place: 'Skyggeborgen',
    bossName: 'Skyggegolemen',
    region: 'Nattbroen',
    x: 1435,
    y: 350,
    color: 0x6b64d8,
    accent: '#8b82ff',
    operations: ['add', 'subtract', 'multiply'],
    maxFactor: 8,
    bossHp: 20,
    reward: 'Frostfjellene åpnes',
    boss: {
      idle: `${bossBase}/skyggegolemen/skyggegolemen-idle.webp`,
      attack: `${bossBase}/skyggegolemen/skyggegolemen-attack.webp`,
      hurt: `${bossBase}/skyggegolemen/skyggegolemen-hurt-1.webp`,
      hurt2: `${bossBase}/skyggegolemen/skyggegolemen-hurt-2.webp`,
      low: `${bossBase}/skyggegolemen/skyggegolemen-low-hp.webp`,
      defeated: `${bossBase}/skyggegolemen/skyggegolemen-defeated.webp`,
      panel: `${bossBase}/skyggegolemen/skyggegolemen-panel-bg.webp`
    }
  },
  {
    id: 'frostfjellene',
    order: 4,
    place: 'Frostfjellene',
    bossName: 'Isdragen',
    region: 'Snøpasset',
    x: 1900,
    y: 300,
    color: 0x7bdcff,
    accent: '#8fe7ff',
    operations: ['subtract', 'multiply'],
    maxFactor: 10,
    bossHp: 25,
    reward: 'Vulkanringen åpnes',
    boss: {
      idle: `${bossBase}/isdragen/isdragen-idle.webp`,
      attack: `${bossBase}/isdragen/isdragen-attack.webp`,
      hurt: `${bossBase}/isdragen/isdragen-hurt-1.webp`,
      hurt2: `${bossBase}/isdragen/isdragen-hurt-2.webp`,
      low: `${bossBase}/isdragen/isdragen-low-hp.webp`,
      defeated: `${bossBase}/isdragen/isdragen-defeated.webp`,
      panel: `${bossBase}/isdragen/isdragen-panel-bg.webp`
    }
  },
  {
    id: 'vulkanringen',
    order: 5,
    place: 'Vulkanringen',
    bossName: 'Lavakjempen',
    region: 'Glødestien',
    x: 320,
    y: 705,
    color: 0xff7448,
    accent: '#ff8d58',
    operations: ['add', 'subtract', 'multiply'],
    maxFactor: 11,
    bossHp: 30,
    reward: 'Tordentoppen åpnes',
    boss: {
      idle: `${bossBase}/lavakjempen/lavakjempen-idle.webp`,
      attack: `${bossBase}/lavakjempen/lavakjempen-attack.webp`,
      hurt: `${bossBase}/lavakjempen/lavakjempen-hurt-1.webp`,
      hurt2: `${bossBase}/lavakjempen/lavakjempen-hurt-2.webp`,
      low: `${bossBase}/lavakjempen/lavakjempen-low-hp.webp`,
      defeated: `${bossBase}/lavakjempen/lavakjempen-defeated.webp`,
      panel: `${bossBase}/lavakjempen/lavakjempen-panel-bg.webp`
    }
  },
  {
    id: 'tordentoppen',
    order: 6,
    place: 'Tordentoppen',
    bossName: 'Stormørnen',
    region: 'Lyntrappen',
    x: 2260,
    y: 195,
    color: 0x72a7ff,
    accent: '#8db8ff',
    operations: ['multiply', 'divide'],
    maxFactor: 12,
    bossHp: 35,
    reward: 'Krystallgrotten åpnes',
    boss: {
      idle: `${bossBase}/stormornen/stormornen-idle.webp`,
      attack: `${bossBase}/stormornen/stormornen-attack.webp`,
      hurt: `${bossBase}/stormornen/stormornen-hurt-1.webp`,
      hurt2: `${bossBase}/stormornen/stormornen-hurt-2.webp`,
      low: `${bossBase}/stormornen/stormornen-low-hp.webp`,
      defeated: `${bossBase}/stormornen/stormornen-defeated.webp`,
      panel: `${bossBase}/stormornen/stormornen-panel-bg.webp`
    }
  },
  {
    id: 'krystallgrotten',
    order: 7,
    place: 'Krystallgrotten',
    bossName: 'Krystallvokteren',
    region: 'Speilhallen',
    x: 1515,
    y: 810,
    color: 0xb076ff,
    accent: '#c995ff',
    operations: ['add', 'subtract', 'multiply', 'divide'],
    maxFactor: 12,
    bossHp: 40,
    reward: 'Tannhjulsbyen åpnes',
    boss: {
      idle: `${bossBase}/krystallvokteren/krystallvokteren-idle.webp`,
      attack: `${bossBase}/krystallvokteren/krystallvokteren-attack.webp`,
      hurt: `${bossBase}/krystallvokteren/krystallvokteren-hurt-1.webp`,
      hurt2: `${bossBase}/krystallvokteren/krystallvokteren-hurt-2.webp`,
      low: `${bossBase}/krystallvokteren/krystallvokteren-low-hp.webp`,
      defeated: `${bossBase}/krystallvokteren/krystallvokteren-defeated.webp`,
      panel: `${bossBase}/krystallvokteren/krystallvokteren-panel-bg.webp`
    }
  },
  {
    id: 'tannhjulsbyen',
    order: 8,
    place: 'Tannhjulsbyen',
    bossName: 'Mekamaskinen',
    region: 'Girporten',
    x: 2075,
    y: 835,
    color: 0x4fd0cf,
    accent: '#66e7e0',
    operations: ['multiply', 'divide'],
    maxFactor: 14,
    bossHp: 45,
    reward: 'Dypvannshavet åpnes',
    boss: {
      idle: `${bossBase}/mekamaskinen/mekamaskinen-idle.webp`,
      attack: `${bossBase}/mekamaskinen/mekamaskinen-attack.webp`,
      hurt: `${bossBase}/mekamaskinen/mekamaskinen-hurt-1.webp`,
      hurt2: `${bossBase}/mekamaskinen/mekamaskinen-hurt-2.webp`,
      low: `${bossBase}/mekamaskinen/mekamaskinen-low-hp.webp`,
      defeated: `${bossBase}/mekamaskinen/mekamaskinen-defeated.webp`,
      panel: `${bossBase}/mekamaskinen/mekamaskinen-panel-bg.webp`
    }
  },
  {
    id: 'dypvannshavet',
    order: 9,
    place: 'Dypvannshavet',
    bossName: 'Mørkekraken',
    region: 'Bølgekorset',
    x: 370,
    y: 1300,
    color: 0x3b7bd9,
    accent: '#5c96ff',
    operations: ['add', 'subtract', 'multiply', 'divide'],
    maxFactor: 15,
    bossHp: 50,
    reward: 'Den siste arenaen åpnes',
    boss: {
      idle: `${bossBase}/morkekraken/morkekraken-idle.webp`,
      attack: `${bossBase}/morkekraken/morkekraken-attack.webp`,
      hurt: `${bossBase}/morkekraken/morkekraken-hurt-1.webp`,
      hurt2: `${bossBase}/morkekraken/morkekraken-hurt-2.webp`,
      low: `${bossBase}/morkekraken/morkekraken-low-hp.webp`,
      defeated: `${bossBase}/morkekraken/morkekraken-defeated.webp`,
      panel: `${bossBase}/morkekraken/morkekraken-panel-bg.webp`
    }
  },
  {
    id: 'siste-arenaen',
    order: 10,
    place: 'Den siste arenaen',
    bossName: 'Regnemesteren',
    region: 'Tallslottet',
    x: 1955,
    y: 1280,
    color: 0xe861ff,
    accent: '#f48cff',
    operations: ['add', 'subtract', 'multiply', 'divide'],
    maxFactor: 16,
    bossHp: 55,
    reward: 'Regnereisen fullført',
    boss: {
      idle: `${bossBase}/regnemesteren/regnemesteren-idle.webp`,
      attack: `${bossBase}/regnemesteren/regnemesteren-attack.webp`,
      hurt: `${bossBase}/regnemesteren/regnemesteren-hurt-1.webp`,
      hurt2: `${bossBase}/regnemesteren/regnemesteren-hurt-2.webp`,
      low: `${bossBase}/regnemesteren/regnemesteren-low-hp.webp`,
      defeated: `${bossBase}/regnemesteren/regnemesteren-defeated.webp`,
      panel: `${bossBase}/regnemesteren/regnemesteren-panel-bg.webp`
    }
  },
  {
    id: 'mega-regnemesteren',
    order: 11,
    place: 'Siste stopp',
    bossName: 'Mega Regnemesteren',
    region: 'Den skjulte portalen',
    x: 1335,
    y: 1185,
    color: 0xfacc15,
    accent: '#f0abfc',
    operations: ['add', 'subtract', 'multiply', 'divide'],
    maxFactor: 20,
    bossHp: 30,
    hiddenUntilUnlocked: true,
    secret: true,
    reward: 'Regnereisen fullført',
    boss: {
      idle: `${bossBase}/mega-regnemesteren/mega-regnemesteren-idle.webp`,
      attack: `${bossBase}/mega-regnemesteren/mega-regnemesteren-attack.webp`,
      hurt: `${bossBase}/mega-regnemesteren/mega-regnemesteren-hurt-1.webp`,
      hurt2: `${bossBase}/mega-regnemesteren/mega-regnemesteren-hurt-2.webp`,
      low: `${bossBase}/mega-regnemesteren/mega-regnemesteren-low-hp.webp`,
      defeated: `${bossBase}/mega-regnemesteren/mega-regnemesteren-defeated.webp`,
      panel: '/backgrounds/mega-regnemesteren-bg.webp'
    }
  }
];

export function getLocationById(id: string): LocationNode | undefined {
  return LOCATIONS.find((location) => location.id === id);
}
