export const BASELINE_COMMIT = '129422d97eb126ba6eb983c3329d12c3eb956c35';
export const BASELINE_RUN_ID = 'baseline-129422d';

export const PROFILES = {
  'tablet-native': {
    viewport: { width: 1024, height: 768 },
    deviceScaleFactor: 2,
    hasTouch: true,
    cpuRate: 1,
    timeoutMs: 30_000,
    network: null
  },
  'tablet-conservative': {
    viewport: { width: 1024, height: 768 },
    deviceScaleFactor: 2,
    hasTouch: true,
    cpuRate: 4,
    timeoutMs: 600_000,
    network: {
      latency: 150,
      downloadThroughput: 500_000,
      uploadThroughput: 125_000
    }
  }
};

export const CHECKPOINT_LABELS = [
  'before-navigation',
  'home-visible',
  'before-open',
  'screen-visible',
  'playable',
  'peak-observed',
  'before-exit',
  'after-exit-2s',
  'after-exit-10s',
  'after-explicit-gc'
];

export const SCENARIOS = [
  {
    id: 'A01-cold-home',
    label: 'Kald hovedside',
    mode: 'automated',
    expectedCheckpoint: 'home-visible'
  },
  {
    id: 'A02-normal-without-regnereisen',
    label: 'Normal uten Regnereisen',
    mode: 'guided',
    expectedCheckpoint: 'playable'
  },
  {
    id: 'A03-school-without-regnereisen',
    label: 'Skolekampen uten Regnereisen',
    mode: 'guided',
    expectedCheckpoint: 'screen-visible'
  },
  {
    id: 'A04-first-regnereisen-open',
    label: 'Første åpning av Regnereisen',
    mode: 'automated',
    expectedCheckpoint: 'playable'
  },
  {
    id: 'A05-map-bossreisen',
    label: 'Kart: Boss-reisen',
    mode: 'guided',
    mapId: 'bossreisen',
    expectedCheckpoint: 'playable'
  },
  {
    id: 'A05-map-regneriket',
    label: 'Kart: Regneriket',
    mode: 'guided',
    mapId: 'regneriket',
    expectedCheckpoint: 'playable'
  },
  {
    id: 'A05-map-tallvokterens-rike',
    label: 'Kart: Tallvokterens verden',
    mode: 'guided',
    mapId: 'tallvokterens-rike',
    expectedCheckpoint: 'playable'
  },
  {
    id: 'A05-map-regnemonster',
    label: 'Kart: Regnemonster',
    mode: 'guided',
    mapId: 'regnemonster',
    expectedCheckpoint: 'playable'
  },
  {
    id: 'A06-heavy-scenes-and-binder',
    label: 'Tunge scener og samleperm',
    mode: 'guided',
    expectedCheckpoint: 'after-exit-10s'
  },
  {
    id: 'A07-five-entry-exit-rounds',
    label: 'Fem inn- og utganger',
    mode: 'guided',
    expectedCheckpoint: 'after-explicit-gc'
  },
  {
    id: 'A08-thirty-minute-session',
    label: '30 minutters sammenhengende økt',
    mode: 'guided',
    expectedCheckpoint: 'after-explicit-gc'
  }
];

export const HEAVY_SCENES = {
  fishing: {
    label: 'Fiske',
    mapId: 'tallvokterens-rike',
    player: { x: 2345, y: 705 },
    settleMs: 1_500
  },
  'boat-travel': {
    label: 'Båtreise',
    mapId: 'tallvokterens-rike',
    player: { x: 1258, y: 2283 },
    settleMs: 3_000
  },
  'crystal-cart': {
    label: 'Krystallvognen',
    mapId: 'tallvokterens-rike',
    player: { x: 2361, y: 427 },
    startSelector: '#crystal-cart-story-primary',
    visibleSelector: '#crystal-cart-ride-hud',
    exitSelector: '#leave-crystal-cart'
  },
  'swamp-alchemy': {
    label: 'Sumpalkymi',
    mapId: 'tallvokterens-rike',
    player: { x: 3332, y: 427 },
    startSelector: '#swamp-alchemy-story-primary',
    visibleSelector: '#swamp-alchemy-hud',
    exitSelector: '#leave-swamp-alchemy'
  },
  'light-forest': {
    label: 'Lysskogen',
    mapId: 'tallvokterens-rike',
    player: { x: 586, y: 876 },
    startSelector: '#light-forest-story-primary',
    visibleSelector: '#light-forest-hud',
    exitSelector: '#leave-light-forest'
  },
  'counterweight-vault': {
    label: 'Motvektshvelvet',
    mapId: 'tallvokterens-rike',
    player: { x: 3547, y: 2327 },
    startSelector: '#light-forest-story-primary',
    settleMs: 2_000
  },
  maze: {
    label: 'Labyrinten',
    mapId: 'tallvokterens-rike',
    player: { x: 2881, y: 2460 },
    startSelector: '#maze-primary',
    visibleSelector: '#maze-play',
    exitSelector: '#leave-maze'
  },
  binder: {
    label: 'Regnemonster-samlepermen',
    mapId: 'regnemonster',
    regnemonsterPosition: { x: 600, y: 730 },
    visibleSelector: '#regnemonster-binder-modal',
    exitSelector: '#close-regnemonster-binder'
  }
};

export function getHeavyScene(sceneId) {
  const scene = HEAVY_SCENES[sceneId];
  if (!scene) throw new Error(`Ukjent A06-scene: ${sceneId}`);
  return scene;
}

export function getProfile(profileId) {
  const profile = PROFILES[profileId];
  if (!profile) throw new Error(`Ukjent måleprofil: ${profileId}`);
  return profile;
}

export function getScenario(scenarioId) {
  const scenario = SCENARIOS.find((candidate) => candidate.id === scenarioId);
  if (!scenario) throw new Error(`Ukjent scenario: ${scenarioId}`);
  return scenario;
}
