export type RegnemonsterTownLifeAxis = 'horizontal' | 'vertical';
export type RegnemonsterTownLifeDirection = 'down' | 'left' | 'right' | 'up';

export type RegnemonsterTownLifeRoute = {
  axis: RegnemonsterTownLifeAxis;
  distance: number;
  durationMs: number;
  phaseMs?: number;
};

export type RegnemonsterTownLifeDefinition = {
  id: string;
  label: string;
  textureKey: string;
  assetPath: string;
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  scale: number;
  depth: number;
  route?: RegnemonsterTownLifeRoute;
  animationKind: 'fountain' | 'butterfly' | 'pigeon' | 'crow' | 'person';
  collisionRects?: Array<{ x: number; y: number; width: number; height: number }>;
};

export const REGNEMONSTER_TOWN_LIFE: RegnemonsterTownLifeDefinition[] = [
  {
    id: 'townFountain',
    label: 'Animert fontene',
    textureKey: 'regnemonster-town-fountain',
    assetPath: '/regnemester/regnemonster/assets/animated/fountain.png',
    frameWidth: 64,
    frameHeight: 96,
    frameCount: 8,
    scale: 1.35,
    depth: 14,
    animationKind: 'fountain',
    collisionRects: [{ x: -42, y: -30, width: 84, height: 54 }]
  },
  {
    id: 'townButterflyBlue',
    label: 'Blå sommerfugl',
    textureKey: 'regnemonster-town-butterfly-blue',
    assetPath: '/regnemester/regnemonster/assets/animated/butterfly-blue.png',
    frameWidth: 32,
    frameHeight: 32,
    frameCount: 4,
    scale: 1.45,
    depth: 18,
    animationKind: 'butterfly',
    route: { axis: 'horizontal', distance: 120, durationMs: 5200 }
  },
  {
    id: 'townButterflyWhite',
    label: 'Lys sommerfugl',
    textureKey: 'regnemonster-town-butterfly-white',
    assetPath: '/regnemester/regnemonster/assets/animated/butterfly-white.png',
    frameWidth: 32,
    frameHeight: 32,
    frameCount: 4,
    scale: 1.45,
    depth: 18,
    animationKind: 'butterfly',
    route: { axis: 'vertical', distance: 105, durationMs: 4800, phaseMs: 1200 }
  },
  {
    id: 'townPigeonOne',
    label: 'Due',
    textureKey: 'regnemonster-town-pigeon-one',
    assetPath: '/regnemester/regnemonster/assets/animated/pigeon-1.png',
    frameWidth: 48,
    frameHeight: 48,
    frameCount: 6,
    scale: 1.25,
    depth: 16,
    animationKind: 'pigeon',
    route: { axis: 'horizontal', distance: 150, durationMs: 6200, phaseMs: 800 }
  },
  {
    id: 'townPigeonTwo',
    label: 'Due',
    textureKey: 'regnemonster-town-pigeon-two',
    assetPath: '/regnemester/regnemonster/assets/animated/pigeon-2.png',
    frameWidth: 48,
    frameHeight: 48,
    frameCount: 6,
    scale: 1.25,
    depth: 16,
    animationKind: 'pigeon',
    route: { axis: 'vertical', distance: 125, durationMs: 5700, phaseMs: 2100 }
  },
  {
    id: 'townCrowHorizontal',
    label: 'Kråke',
    textureKey: 'regnemonster-town-crow-horizontal',
    assetPath: '/regnemester/regnemonster/assets/animated/crow-right.png',
    frameWidth: 48,
    frameHeight: 96,
    frameCount: 12,
    scale: 1,
    depth: 19,
    animationKind: 'crow',
    route: { axis: 'horizontal', distance: 260, durationMs: 7200, phaseMs: 600 }
  },
  {
    id: 'townCrowVertical',
    label: 'Kråke',
    textureKey: 'regnemonster-town-crow-vertical',
    assetPath: '/regnemester/regnemonster/assets/animated/crow-down.png',
    frameWidth: 48,
    frameHeight: 96,
    frameCount: 18,
    scale: 1,
    depth: 19,
    animationKind: 'crow',
    route: { axis: 'vertical', distance: 220, durationMs: 7800, phaseMs: 3000 }
  },
  ...[1, 2, 3, 5].map((number, index): RegnemonsterTownLifeDefinition => ({
    id: `townNpc${index + 1}`,
    label: `Innbygger ${index + 1}`,
    textureKey: `regnemonster-town-npc-${index + 1}`,
    assetPath: `/regnemester/regnemonster/assets/animated/npc-${number}.png`,
    frameWidth: 48,
    frameHeight: 96,
    frameCount: 12,
    scale: 1,
    depth: 17,
    animationKind: 'person',
    route: {
      axis: index % 2 === 0 ? 'horizontal' : 'vertical',
      distance: index % 2 === 0 ? 180 : 145,
      durationMs: 6500 + index * 700,
      phaseMs: index * 950
    }
  }))
];

export function getRegnemonsterTownLifeMotion(
  route: RegnemonsterTownLifeRoute | undefined,
  elapsedMs: number
): { x: number; y: number; direction: RegnemonsterTownLifeDirection } {
  if (!route) {
    return { x: 0, y: 0, direction: 'down' };
  }
  const phase = (
    (
      ((elapsedMs + (route.phaseMs ?? 0)) % route.durationMs)
      + route.durationMs
    ) % route.durationMs
  ) / route.durationMs;
  const forward = phase < 0.5;
  const progress = forward ? phase * 2 : (1 - phase) * 2;
  const offset = Math.round(route.distance * progress);
  if (route.axis === 'horizontal') {
    return { x: offset, y: 0, direction: forward ? 'right' : 'left' };
  }
  return { x: 0, y: offset, direction: forward ? 'down' : 'up' };
}
