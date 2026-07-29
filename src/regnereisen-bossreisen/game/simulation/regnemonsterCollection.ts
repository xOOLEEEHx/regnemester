import {
  REGNEMONSTER_CARDS,
  getRegnemonsterCardById,
  type RegnemonsterCardId
} from '../content/regnemonsterCards';
import type { Difficulty, OperationMode } from '../content/settings';

export type RegnemonsterDifficulty = Exclude<Difficulty, 'easy-add-subtract'>;
export type RegnemonsterCardCounts = Record<RegnemonsterCardId, number>;

export type RegnemonsterCollectionState = {
  cardCounts: RegnemonsterCardCounts;
  pendingCardId?: RegnemonsterCardId;
  lastOperationMode: OperationMode;
  lastDifficulty: RegnemonsterDifficulty;
};

export type StoredRegnemonsterCollection = {
  cardCounts?: Record<string, unknown>;
  pendingCardId?: unknown;
  lastOperationMode?: unknown;
  lastDifficulty?: unknown;
};

const operationModes = new Set<OperationMode>([
  'add',
  'subtract',
  'multiply',
  'divide',
  'mixed'
]);
const difficulties = new Set<RegnemonsterDifficulty>(['easy', 'normal', 'hard']);

function normalizeCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.floor(value))
    : 0;
}

function isOperationMode(value: unknown): value is OperationMode {
  return typeof value === 'string' && operationModes.has(value as OperationMode);
}

export function isRegnemonsterDifficulty(
  value: unknown
): value is RegnemonsterDifficulty {
  return typeof value === 'string'
    && difficulties.has(value as RegnemonsterDifficulty);
}

export function normalizeRegnemonsterCollection(
  saved: StoredRegnemonsterCollection | undefined
): RegnemonsterCollectionState {
  const cardCounts = Object.fromEntries(
    REGNEMONSTER_CARDS.map((card) => [
      card.id,
      normalizeCount(saved?.cardCounts?.[card.id])
    ])
  ) as RegnemonsterCardCounts;
  const pendingCard = typeof saved?.pendingCardId === 'string'
    ? getRegnemonsterCardById(saved.pendingCardId)
    : undefined;

  return {
    cardCounts,
    pendingCardId: pendingCard?.id,
    lastOperationMode: isOperationMode(saved?.lastOperationMode)
      ? saved.lastOperationMode
      : 'mixed',
    lastDifficulty: isRegnemonsterDifficulty(saved?.lastDifficulty)
      ? saved.lastDifficulty
      : 'normal'
  };
}

export function createPendingRegnemonsterReward(
  state: RegnemonsterCollectionState,
  cardId: RegnemonsterCardId
): RegnemonsterCollectionState {
  if (state.pendingCardId) {
    return state;
  }
  if (!getRegnemonsterCardById(cardId)) {
    throw new Error(`Ukjent Regnemonster-kort: ${cardId}`);
  }
  return {
    ...state,
    pendingCardId: cardId
  };
}

export function claimPendingRegnemonsterReward(
  state: RegnemonsterCollectionState
): {
  state: RegnemonsterCollectionState;
  claimedCardId?: RegnemonsterCardId;
} {
  const claimedCardId = state.pendingCardId;
  if (!claimedCardId) {
    return { state };
  }
  return {
    state: {
      ...state,
      cardCounts: {
        ...state.cardCounts,
        [claimedCardId]: state.cardCounts[claimedCardId] + 1
      },
      pendingCardId: undefined
    },
    claimedCardId
  };
}
