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

const bossBase = '/regnemester/bosses';

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
      idle: `${bossBase}/slime/slime-boss-idle.png`,
      attack: `${bossBase}/slime/slime-boss-attack.png`,
      hurt: `${bossBase}/slime/slime-boss-hurt-01.png`,
      hurt2: `${bossBase}/slime/slime-boss-hurt-02.png`,
      low: `${bossBase}/slime/slime-boss-low-hp.png`,
      defeated: `${bossBase}/slime/slime-boss-defeated.png`,
      panel: `${bossBase}/slime/slime-panel-bg.png`
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
      idle: `${bossBase}/trollkongen/trollkongen-idle.png`,
      attack: `${bossBase}/trollkongen/trollkongen-attack.png`,
      hurt: `${bossBase}/trollkongen/trollkongen-hurt-1.png`,
      hurt2: `${bossBase}/trollkongen/trollkongen-hurt-2.png`,
      low: `${bossBase}/trollkongen/trollkongen-low-hp.png`,
      defeated: `${bossBase}/trollkongen/trollkongen-defeated.png`,
      panel: `${bossBase}/trollkongen/trollkongen-panel-bg.png`
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
      idle: `${bossBase}/skyggegolemen/skyggegolemen-idle.png`,
      attack: `${bossBase}/skyggegolemen/skyggegolemen-attack.png`,
      hurt: `${bossBase}/skyggegolemen/skyggegolemen-hurt-1.png`,
      hurt2: `${bossBase}/skyggegolemen/skyggegolemen-hurt-2.png`,
      low: `${bossBase}/skyggegolemen/skyggegolemen-low-hp.png`,
      defeated: `${bossBase}/skyggegolemen/skyggegolemen-defeated.png`,
      panel: `${bossBase}/skyggegolemen/skyggegolemen-panel-bg.png`
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
      idle: `${bossBase}/isdragen/isdragen-idle.png`,
      attack: `${bossBase}/isdragen/isdragen-attack.png`,
      hurt: `${bossBase}/isdragen/isdragen-hurt-1.png`,
      hurt2: `${bossBase}/isdragen/isdragen-hurt-2.png`,
      low: `${bossBase}/isdragen/isdragen-low-hp.png`,
      defeated: `${bossBase}/isdragen/isdragen-defeated.png`,
      panel: `${bossBase}/isdragen/isdragen-panel-bg.png`
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
      idle: `${bossBase}/lavakjempen/lavakjempen-idle.png`,
      attack: `${bossBase}/lavakjempen/lavakjempen-attack.png`,
      hurt: `${bossBase}/lavakjempen/lavakjempen-hurt-1.png`,
      hurt2: `${bossBase}/lavakjempen/lavakjempen-hurt-2.png`,
      low: `${bossBase}/lavakjempen/lavakjempen-low-hp.png`,
      defeated: `${bossBase}/lavakjempen/lavakjempen-defeated.png`,
      panel: `${bossBase}/lavakjempen/lavakjempen-panel-bg.png`
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
      idle: `${bossBase}/stormornen/stormornen-idle.png`,
      attack: `${bossBase}/stormornen/stormornen-attack.png`,
      hurt: `${bossBase}/stormornen/stormornen-hurt-1.png`,
      hurt2: `${bossBase}/stormornen/stormornen-hurt-2.png`,
      low: `${bossBase}/stormornen/stormornen-low-hp.png`,
      defeated: `${bossBase}/stormornen/stormornen-defeated.png`,
      panel: `${bossBase}/stormornen/stormornen-panel-bg.png`
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
      idle: `${bossBase}/krystallvokteren/krystallvokteren-idle.png`,
      attack: `${bossBase}/krystallvokteren/krystallvokteren-attack.png`,
      hurt: `${bossBase}/krystallvokteren/krystallvokteren-hurt-1.png`,
      hurt2: `${bossBase}/krystallvokteren/krystallvokteren-hurt-2.png`,
      low: `${bossBase}/krystallvokteren/krystallvokteren-low-hp.png`,
      defeated: `${bossBase}/krystallvokteren/krystallvokteren-defeated.png`,
      panel: `${bossBase}/krystallvokteren/krystallvokteren-panel-bg.png`
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
      idle: `${bossBase}/mekamaskinen/mekamaskinen-idle.png`,
      attack: `${bossBase}/mekamaskinen/mekamaskinen-attack.png`,
      hurt: `${bossBase}/mekamaskinen/mekamaskinen-hurt-1.png`,
      hurt2: `${bossBase}/mekamaskinen/mekamaskinen-hurt-2.png`,
      low: `${bossBase}/mekamaskinen/mekamaskinen-low-hp.png`,
      defeated: `${bossBase}/mekamaskinen/mekamaskinen-defeated.png`,
      panel: `${bossBase}/mekamaskinen/mekamaskinen-panel-bg.png`
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
      idle: `${bossBase}/morkekraken/morkekraken-idle.png`,
      attack: `${bossBase}/morkekraken/morkekraken-attack.png`,
      hurt: `${bossBase}/morkekraken/morkekraken-hurt-1.png`,
      hurt2: `${bossBase}/morkekraken/morkekraken-hurt-2.png`,
      low: `${bossBase}/morkekraken/morkekraken-low-hp.png`,
      defeated: `${bossBase}/morkekraken/morkekraken-defeated.png`,
      panel: `${bossBase}/morkekraken/morkekraken-panel-bg.png`
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
      idle: `${bossBase}/regnemesteren/regnemesteren-idle.png`,
      attack: `${bossBase}/regnemesteren/regnemesteren-attack.png`,
      hurt: `${bossBase}/regnemesteren/regnemesteren-hurt-1.png`,
      hurt2: `${bossBase}/regnemesteren/regnemesteren-hurt-2.png`,
      low: `${bossBase}/regnemesteren/regnemesteren-low-hp.png`,
      defeated: `${bossBase}/regnemesteren/regnemesteren-defeated.png`,
      panel: `${bossBase}/regnemesteren/regnemesteren-panel-bg.png`
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
      idle: `${bossBase}/mega-regnemesteren/mega-regnemesteren-idle.png`,
      attack: `${bossBase}/mega-regnemesteren/mega-regnemesteren-attack.png`,
      hurt: `${bossBase}/mega-regnemesteren/mega-regnemesteren-hurt-1.png`,
      hurt2: `${bossBase}/mega-regnemesteren/mega-regnemesteren-hurt-2.png`,
      low: `${bossBase}/mega-regnemesteren/mega-regnemesteren-low-hp.png`,
      defeated: `${bossBase}/mega-regnemesteren/mega-regnemesteren-defeated.png`,
      panel: '/regnemester/backgrounds/mega-regnemesteren-bg.png'
    }
  }
];

export function getLocationById(id: string): LocationNode | undefined {
  return LOCATIONS.find((location) => location.id === id);
}
