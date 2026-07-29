import type { RegnemonsterCardId } from '../content/regnemonsterCards';

export type RegnemonsterRewardRevealState = {
  cardId: RegnemonsterCardId;
  phase: 'sealed' | 'revealing' | 'revealed';
};

export function getRegnemonsterRewardFrameAspectRatio(
  imageWidth: number,
  imageHeight: number
): number {
  return imageWidth / imageHeight;
}

export function createRegnemonsterRewardReveal(
  cardId: RegnemonsterCardId
): RegnemonsterRewardRevealState {
  return {
    cardId,
    phase: 'sealed'
  };
}

export function beginRegnemonsterRewardReveal(
  state: RegnemonsterRewardRevealState
): RegnemonsterRewardRevealState {
  if (state.phase !== 'sealed') {
    return state;
  }
  return {
    ...state,
    phase: 'revealing'
  };
}

export function completeRegnemonsterRewardReveal(
  state: RegnemonsterRewardRevealState
): RegnemonsterRewardRevealState {
  if (state.phase !== 'revealing') {
    return state;
  }
  return {
    ...state,
    phase: 'revealed'
  };
}
