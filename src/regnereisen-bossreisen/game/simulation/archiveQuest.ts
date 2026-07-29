import {
  ARCHIVE_QUEST_DEFINITION,
  getArchiveReward
} from '../content/archiveQuest';
import type { GameSettings } from '../content/settings';
import {
  answerMathQuestQuestion,
  createMathQuest,
  type MathQuestOptions,
  type MathQuestState
} from './mathQuest';

export type ArchiveQuestPhase = 'intro' | 'sorting' | 'reward' | 'paid' | 'lost';

export type ArchiveQuestState = {
  phase: ArchiveQuestPhase;
  settings: GameSettings;
  challenge: MathQuestState;
  rewardValue: number;
  message: string;
};

export function createArchiveQuest(
  settings: GameSettings,
  options: MathQuestOptions = {}
): ArchiveQuestState {
  return {
    phase: 'intro',
    settings,
    challenge: createMathQuest(ARCHIVE_QUEST_DEFINITION, settings, options),
    rewardValue: getArchiveReward(settings),
    message: 'Riksarkivaren venter på at du skal starte sorteringen.'
  };
}

export function startArchiveQuest(state: ArchiveQuestState): ArchiveQuestState {
  if (state.phase !== 'intro') {
    return state;
  }
  return {
    ...state,
    phase: 'sorting',
    message: 'Dra skriftrullen til hyllen med riktig svar.'
  };
}

export function sortArchiveScroll(
  state: ArchiveQuestState,
  shelfValue: number
): ArchiveQuestState {
  if (state.phase !== 'sorting') {
    return state;
  }

  const challenge = answerMathQuestQuestion(state.challenge, shelfValue);
  if (challenge.status === 'lost') {
    return {
      ...state,
      phase: 'lost',
      challenge,
      message: 'Du gikk tom for hjerter. Sorteringen må startes på nytt.'
    };
  }
  if (challenge.status === 'won') {
    return {
      ...state,
      phase: 'reward',
      challenge,
      message: 'Alle ti skriftrullene er sortert. Riksarkivaren står klar med belønningen.'
    };
  }
  return {
    ...state,
    challenge,
    message: challenge.lastAnswerCorrect
      ? 'Riktig hylle! Neste skriftrull er klar.'
      : challenge.message
  };
}

export function markArchiveRewardPaid(state: ArchiveQuestState): ArchiveQuestState {
  if (state.phase !== 'reward') {
    return state;
  }
  return {
    ...state,
    phase: 'paid',
    message: `${state.rewardValue} Regnecoins er lagt i ryggsekken.`
  };
}
