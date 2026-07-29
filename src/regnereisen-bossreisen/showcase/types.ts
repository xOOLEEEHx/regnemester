export const EFFECT_KEYS = [
  'ocean',
  'waterfalls',
  'portal',
  'crystals',
  'forest',
  'cave',
  'swamp',
  'fountain',
  'lighting',
  'particles',
  'atmosphere',
  'interactions',
  'camera',
  'filters',
  'mesh',
  'events'
] as const;

export type EffectKey = (typeof EFFECT_KEYS)[number];
export type QualityLevel = 'low' | 'standard' | 'high' | 'ultra';
export type ShowcaseAction = 'tour-start' | 'tour-stop' | 'overview' | 'portal-demo' | 'event-demo' | 'filter-demo';

export type ShowcaseState = {
  quality: QualityLevel;
  effects: Record<EffectKey, boolean>;
};

export type ShowcaseTelemetry = {
  fps: number;
  frameMs: number;
  activeEmitters: number;
  aliveParticles: number;
  visibleLights: number;
  cameraX: number;
  cameraY: number;
  zoom: number;
  renderer: string;
};

export type QualityProfile = {
  particleMultiplier: number;
  shaderIntensity: number;
  fogLayers: number;
  glowQuality: number;
  lightCount: number;
  rareEvents: boolean;
};

export const QUALITY_PROFILES: Record<QualityLevel, QualityProfile> = {
  low: {
    particleMultiplier: 0.3,
    shaderIntensity: 0.45,
    fogLayers: 1,
    glowQuality: 3,
    lightCount: 2,
    rareEvents: true
  },
  standard: {
    particleMultiplier: 0.65,
    shaderIntensity: 0.72,
    fogLayers: 2,
    glowQuality: 5,
    lightCount: 3,
    rareEvents: true
  },
  high: {
    particleMultiplier: 1,
    shaderIntensity: 1,
    fogLayers: 3,
    glowQuality: 7,
    lightCount: 5,
    rareEvents: true
  },
  ultra: {
    particleMultiplier: 1.45,
    shaderIntensity: 1.24,
    fogLayers: 4,
    glowQuality: 10,
    lightCount: 7,
    rareEvents: true
  }
};

export const EFFECT_LABELS: Record<EffectKey, string> = {
  ocean: 'Hav / vann',
  waterfalls: 'Fossefall',
  portal: 'Portal',
  crystals: 'Krystaller',
  forest: 'Magisk skog',
  cave: 'Mørk hule',
  swamp: 'Tåkesump',
  fountain: 'Fontene',
  lighting: 'Dynamisk lys',
  particles: 'Partikler',
  atmosphere: 'Atmosfære',
  interactions: 'Interaktivitet',
  camera: 'Kameraeffekter',
  filters: 'Filtersystem',
  mesh: 'Mesh2D',
  events: 'Stjerneregn'
};
