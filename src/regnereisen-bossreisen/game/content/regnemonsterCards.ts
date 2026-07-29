import manifest from './regnemonsterCardManifest.generated.json';

export type RegnemonsterSetId = 'set1' | 'special';
export type RegnemonsterCardId = `${RegnemonsterSetId}-${string}`;

export type RegnemonsterCardDefinition = {
  id: RegnemonsterCardId;
  setId: RegnemonsterSetId;
  number: string;
  fullSrc: string;
  thumbnailSrc: string;
  backFullSrc: string;
  backThumbnailSrc: string;
};

export type RegnemonsterSetDefinition = {
  id: RegnemonsterSetId;
  backFullSrc: string;
  backThumbnailSrc: string;
  cards: RegnemonsterCardDefinition[];
};

function buildSet(setId: RegnemonsterSetId): RegnemonsterSetDefinition {
  const sourceSet = manifest.sets.find((set) => set.id === setId);
  if (!sourceSet || sourceSet.cards.length === 0) {
    throw new Error(`Regnemonster-manifestet mangler settet ${setId}.`);
  }

  const numbers = new Set<string>();
  const cards = sourceSet.cards.map((card) => {
    if (!/^\d{3}$/u.test(card.number) || numbers.has(card.number)) {
      throw new Error(`Ugyldig eller duplisert kortnummer i ${setId}: ${card.number}`);
    }
    numbers.add(card.number);
    return {
      id: `${setId}-${card.number}` as RegnemonsterCardId,
      setId,
      number: card.number,
      fullSrc: card.fullSrc,
      thumbnailSrc: card.thumbnailSrc,
      backFullSrc: sourceSet.back.fullSrc,
      backThumbnailSrc: sourceSet.back.thumbnailSrc
    };
  });

  return {
    id: setId,
    backFullSrc: sourceSet.back.fullSrc,
    backThumbnailSrc: sourceSet.back.thumbnailSrc,
    cards
  };
}

export const REGNEMONSTER_SETS: Record<RegnemonsterSetId, RegnemonsterSetDefinition> = {
  set1: buildSet('set1'),
  special: buildSet('special')
};

export const REGNEMONSTER_CARDS: RegnemonsterCardDefinition[] = [
  ...REGNEMONSTER_SETS.set1.cards,
  ...REGNEMONSTER_SETS.special.cards
];

const cardById = new Map(REGNEMONSTER_CARDS.map((card) => [card.id, card]));

export function getRegnemonsterCardById(
  id: string
): RegnemonsterCardDefinition | undefined {
  return cardById.get(id as RegnemonsterCardId);
}

function normalizeRoll(value: number): number {
  return Math.max(0, Math.min(0.999999999, Number.isFinite(value) ? value : 0));
}

export function drawRegnemonsterCard(
  random: () => number = Math.random
): RegnemonsterCardDefinition {
  const setId: RegnemonsterSetId = normalizeRoll(random()) < 0.96 ? 'set1' : 'special';
  const cards = REGNEMONSTER_SETS[setId].cards;
  const cardIndex = Math.floor(normalizeRoll(random()) * cards.length);
  return cards[cardIndex];
}
