import {
  REGNEMONSTER_SETS,
  type RegnemonsterCardDefinition,
  type RegnemonsterCardId,
  type RegnemonsterSetId
} from '../content/regnemonsterCards';

export const REGNEMONSTER_BINDER_CARDS_PER_PAGE = 9;

export type RegnemonsterBinderCardCounts = Partial<Record<RegnemonsterCardId, number>>;

export type RegnemonsterBinderSlot = {
  card: RegnemonsterCardDefinition;
  count: number;
  owned: boolean;
  imageSrc: string;
};

export type RegnemonsterBinderPage = {
  index: number;
  slots: RegnemonsterBinderSlot[];
};

export function buildRegnemonsterBinderPages(
  setId: RegnemonsterSetId,
  counts: RegnemonsterBinderCardCounts
): RegnemonsterBinderPage[] {
  const cards = REGNEMONSTER_SETS[setId].cards;
  const pages: RegnemonsterBinderPage[] = [];

  for (let start = 0; start < cards.length; start += REGNEMONSTER_BINDER_CARDS_PER_PAGE) {
    pages.push({
      index: pages.length,
      slots: cards
        .slice(start, start + REGNEMONSTER_BINDER_CARDS_PER_PAGE)
        .map((card) => {
          const count = Math.max(0, Math.floor(counts[card.id] ?? 0));
          return {
            card,
            count,
            owned: count > 0,
            imageSrc: count > 0 ? card.thumbnailSrc : card.backThumbnailSrc
          };
        })
    });
  }

  return pages;
}

export function getRegnemonsterBinderSetSummary(
  setId: RegnemonsterSetId,
  counts: RegnemonsterBinderCardCounts
): {
  ownedUnique: number;
  totalCards: number;
  totalCopies: number;
} {
  const cards = REGNEMONSTER_SETS[setId].cards;
  return cards.reduce((summary, card) => {
    const count = Math.max(0, Math.floor(counts[card.id] ?? 0));
    if (count > 0) {
      summary.ownedUnique += 1;
      summary.totalCopies += count;
    }
    return summary;
  }, {
    ownedUnique: 0,
    totalCards: cards.length,
    totalCopies: 0
  });
}
