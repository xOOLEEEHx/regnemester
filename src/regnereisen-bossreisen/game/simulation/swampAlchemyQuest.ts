import {
  SWAMP_ALCHEMY_INGREDIENTS,
  SWAMP_ALCHEMY_ROUNDS,
  getSwampAlchemyReward,
  type SwampAlchemyRoundDefinition,
  type SwampIngredientId
} from '../content/swampAlchemy';
import type { GameSettings } from '../content/settings';
import {
  answerMathQuestQuestion,
  createMathQuest,
  type MathQuestState
} from './mathQuest';

export type SwampAlchemyPhase =
  | 'intro'
  | 'quiz'
  | 'ingredient'
  | 'stirring'
  | 'reward'
  | 'paid'
  | 'lost';

export type SwampAlchemyQuestState = {
  phase: SwampAlchemyPhase;
  settings: GameSettings;
  roundIndex: number;
  totalCorrect: number;
  roundChallenge: MathQuestState<SwampAlchemyRoundDefinition>;
  completedIngredients: SwampIngredientId[];
  rewardValue: number;
  message: string;
};

export type CreateSwampAlchemyQuestOptions = {
  playerHp?: number;
  maxPlayerHp?: number;
};

export function createSwampAlchemyQuest(
  settings: GameSettings,
  options: CreateSwampAlchemyQuestOptions = {}
): SwampAlchemyQuestState {
  return {
    phase: 'intro',
    settings,
    roundIndex: 0,
    totalCorrect: 0,
    roundChallenge: createMathQuest(SWAMP_ALCHEMY_ROUNDS[0], settings, options),
    completedIngredients: [],
    rewardValue: getSwampAlchemyReward(settings),
    message: 'Sumpalkymisten gjør klar gryten og de fire ingrediensplassene.'
  };
}

export function startSwampAlchemyQuest(state: SwampAlchemyQuestState): SwampAlchemyQuestState {
  if (state.phase !== 'intro') return state;
  return {
    ...state,
    phase: 'quiz',
    message: state.roundChallenge.stop.description
  };
}

export function answerSwampAlchemyQuestion(
  state: SwampAlchemyQuestState,
  choice: number
): SwampAlchemyQuestState {
  if (state.phase !== 'quiz') return state;

  const challenge = answerMathQuestQuestion(state.roundChallenge, choice);
  const completedBeforeRound = state.roundIndex * 3;
  const totalCorrect = completedBeforeRound + challenge.correct;

  if (challenge.status === 'lost') {
    return {
      ...state,
      phase: 'lost',
      totalCorrect,
      roundChallenge: challenge,
      message: 'Brygget ble ustabilt da det siste hjertet forsvant. Hele motgiften må startes på nytt.'
    };
  }

  if (challenge.status === 'won') {
    return {
      ...state,
      phase: 'ingredient',
      totalCorrect,
      roundChallenge: challenge,
      message: challenge.stop.successText
    };
  }

  return {
    ...state,
    totalCorrect,
    roundChallenge: challenge,
    message: challenge.message
  };
}

export function acceptSwampIngredient(state: SwampAlchemyQuestState): SwampAlchemyQuestState {
  if (state.phase !== 'ingredient') return state;
  return {
    ...state,
    phase: 'stirring',
    message: `Rør ${state.roundChallenge.stop.ingredient.displayName.toLowerCase()} inn i brygget med én hel sirkel.`
  };
}

export function completeSwampStirring(state: SwampAlchemyQuestState): SwampAlchemyQuestState {
  if (state.phase !== 'stirring') return state;

  const ingredient = state.roundChallenge.stop.ingredient;
  const completedIngredients = [...state.completedIngredients, ingredient.id];
  const nextRoundIndex = state.roundIndex + 1;

  if (nextRoundIndex >= SWAMP_ALCHEMY_INGREDIENTS.length) {
    return {
      ...state,
      phase: 'reward',
      completedIngredients,
      totalCorrect: 12,
      message: 'Motgiften er ferdig! Den giftige tåken trekker seg tilbake, og Sumpalkymisten har gjort klar belønningen.'
    };
  }

  const nextChallenge = createMathQuest(
    SWAMP_ALCHEMY_ROUNDS[nextRoundIndex],
    state.settings,
    {
      playerHp: state.roundChallenge.playerHp,
      maxPlayerHp: state.roundChallenge.maxPlayerHp
    }
  );

  return {
    ...state,
    phase: 'quiz',
    roundIndex: nextRoundIndex,
    completedIngredients,
    roundChallenge: nextChallenge,
    message: nextChallenge.stop.description
  };
}

export function markSwampAlchemyRewardPaid(
  state: SwampAlchemyQuestState
): SwampAlchemyQuestState {
  if (state.phase !== 'reward') return state;
  return {
    ...state,
    phase: 'paid',
    message: `${state.rewardValue} Regnecoins er lagt i ryggsekken.`
  };
}

export function getCurrentSwampIngredient(state: SwampAlchemyQuestState) {
  return state.roundChallenge.stop.ingredient;
}
