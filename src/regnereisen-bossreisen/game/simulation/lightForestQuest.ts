import {
  LIGHT_FOREST_AREAS,
  LIGHT_FOREST_REQUIRED_PER_AREA,
  LIGHT_FOREST_TOTAL_REQUIRED,
  getLightForestArea,
  getLightForestReward,
  type LightForestAreaDefinition
} from '../content/lightForest';
import type { GameSettings } from '../content/settings';
import {
  answerMathQuestQuestion,
  createMathQuest,
  type MathQuestState
} from './mathQuest';

export type LightForestPhase =
  | 'intro'
  | 'question'
  | 'correct'
  | 'wrong'
  | 'network'
  | 'tree-awakening'
  | 'reward'
  | 'paid'
  | 'lost';

export type LightForestQuestState = {
  phase: LightForestPhase;
  settings: GameSettings;
  areaIndex: number;
  totalCorrect: number;
  challenge: MathQuestState<LightForestAreaDefinition>;
  awakenedAreas: string[];
  rewardValue: number;
  message: string;
};

export type CreateLightForestQuestOptions = {
  playerHp?: number;
  maxPlayerHp?: number;
};

export function createLightForestQuest(
  settings: GameSettings,
  options: CreateLightForestQuestOptions = {}
): LightForestQuestState {
  const challenge = createMathQuest(getLightForestArea(0), settings, options);
  return {
    phase: 'intro',
    settings,
    areaIndex: 0,
    totalCorrect: 0,
    challenge,
    awakenedAreas: [],
    rewardValue: getLightForestReward(settings),
    message: 'Rothjertet samler den første lysgnisten.'
  };
}

export function startLightForestQuest(state: LightForestQuestState): LightForestQuestState {
  if (state.phase !== 'intro') return state;
  return {
    ...state,
    phase: 'question',
    message: `Lad lysgnisten til ${state.challenge.stop.place}.`
  };
}

export function answerLightForestQuestion(
  state: LightForestQuestState,
  choice: number
): LightForestQuestState {
  if (state.phase !== 'question') return state;

  const challenge = answerMathQuestQuestion(state.challenge, choice);
  const totalCorrect = state.areaIndex * LIGHT_FOREST_REQUIRED_PER_AREA + challenge.correct;

  if (challenge.status === 'lost') {
    return {
      ...state,
      phase: 'lost',
      challenge,
      totalCorrect,
      message: 'Den siste lysgnisten sluknet. Nettverket må bygges på nytt.'
    };
  }

  if (challenge.lastAnswerCorrect) {
    return {
      ...state,
      phase: challenge.status === 'won' ? 'network' : 'correct',
      challenge,
      totalCorrect,
      message: challenge.status === 'won'
        ? `Lysgnisten er fulladet. Reparer roten til ${challenge.stop.place}.`
        : 'Riktig! Rothjertet samler mer lys.'
    };
  }

  return {
    ...state,
    phase: 'wrong',
    challenge,
    totalCorrect,
    message: 'Feil svar. Skyggerøttene tar ett hjerte.'
  };
}

export function completeLightForestRootPath(
  state: LightForestQuestState
): LightForestQuestState {
  if (state.phase !== 'network') return state;
  return {
    ...state,
    phase: 'tree-awakening',
    message: state.challenge.stop.successText
  };
}

export function continueLightForestJourney(state: LightForestQuestState): LightForestQuestState {
  if (state.phase === 'correct' || state.phase === 'wrong') {
    return {
      ...state,
      phase: 'question',
      message: state.phase === 'correct'
        ? `Lad lysgnisten til ${state.challenge.stop.place} ferdig.`
        : 'En ny matematikkoppgave tenner gnisten igjen.'
    };
  }

  if (state.phase !== 'tree-awakening') return state;

  const awakenedAreas = [...state.awakenedAreas, state.challenge.stop.id];
  const nextAreaIndex = state.areaIndex + 1;
  if (nextAreaIndex >= LIGHT_FOREST_AREAS.length) {
    return {
      ...state,
      phase: 'reward',
      totalCorrect: LIGHT_FOREST_TOTAL_REQUIRED,
      awakenedAreas,
      message: 'Alle fem lystrærne er koblet til rothjertet. Lysveveren står klar med belønningen.'
    };
  }

  const challenge = createMathQuest(
    getLightForestArea(nextAreaIndex),
    state.settings,
    {
      playerHp: state.challenge.playerHp,
      maxPlayerHp: state.challenge.maxPlayerHp
    }
  );

  return {
    ...state,
    phase: 'question',
    areaIndex: nextAreaIndex,
    challenge,
    awakenedAreas,
    message: `Nettverket søker nå mot ${challenge.stop.place}.`
  };
}

export function markLightForestRewardPaid(state: LightForestQuestState): LightForestQuestState {
  if (state.phase !== 'reward') return state;
  return {
    ...state,
    phase: 'paid',
    message: `${state.rewardValue} Regnecoins er lagt i ryggsekken.`
  };
}
