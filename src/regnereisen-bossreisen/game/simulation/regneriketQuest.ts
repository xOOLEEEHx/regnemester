import type { RegneriketStop } from '../content/regneriket';
import type { GameSettings } from '../content/settings';
import {
  answerMathQuestQuestion,
  createMathQuest,
  type MathQuestOptions,
  type MathQuestState
} from './mathQuest';

export type RegneriketQuestState = MathQuestState<RegneriketStop>;
export type RegneriketQuestOptions = MathQuestOptions;

export function createRegneriketQuest(
  stop: RegneriketStop,
  settings: GameSettings,
  options: RegneriketQuestOptions = {}
): RegneriketQuestState {
  return createMathQuest(stop, settings, options);
}

export function answerRegneriketQuestion(state: RegneriketQuestState, selectedAnswer: number): RegneriketQuestState {
  return answerMathQuestQuestion(state, selectedAnswer);
}
