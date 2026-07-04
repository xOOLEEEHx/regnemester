import type { LocationNode } from '../content/locations';
import { isRewardLocation, MAP_BOSS_REWARD_EXPERIMENT } from '../content/mapExperiment';
import { getDifficultyOption, getEffectiveDifficulty, type GameSettings } from '../content/settings';
import { createQuestionDeck, drawQuestion, type MathQuestion } from './questions';

export type BattleState = {
  location: LocationNode;
  bossHp: number;
  playerHp: number;
  maxPlayerHp: number;
  maxBossHp: number;
  question: MathQuestion;
  questionDeck: MathQuestion[];
  streak: number;
  lastDamage: number;
  lastAnswerCorrect?: boolean;
  lastAnswer?: number;
  status: 'active' | 'won' | 'lost';
  message: string;
  settings: GameSettings;
};

export type BattleOptions = {
  playerHp?: number;
  maxPlayerHp?: number;
};

export function createBattle(location: LocationNode, settings: GameSettings, options: BattleOptions = {}): BattleState {
  const defaultPlayerHearts = getDifficultyOption(getEffectiveDifficulty(settings)).playerHearts;
  const megaBattle = location.id === 'mega-regnemesteren';
  const playerHearts = megaBattle ? 1 : options.playerHp ?? defaultPlayerHearts;
  const maxPlayerHearts = megaBattle ? 1 : options.maxPlayerHp ?? playerHearts;
  const questionDeck = createQuestionDeck(location.operations, settings);
  return {
    location,
    bossHp: location.bossHp,
    playerHp: playerHearts,
    maxPlayerHp: maxPlayerHearts,
    maxBossHp: location.bossHp,
    question: drawQuestion(questionDeck, location.operations, settings),
    questionDeck,
    streak: 0,
    lastDamage: 0,
    status: 'active',
    message: 'Velg riktig svar for å svekke bossen.',
    settings
  };
}

export function answerQuestion(battle: BattleState, selectedAnswer: number): BattleState {
  if (battle.status !== 'active') {
    return battle;
  }

  const correct = selectedAnswer === battle.question.answer;
  if (correct) {
    const streakBeforeReset = battle.streak + 1;
    const damage = getBossDamage(streakBeforeReset);
    const streak = streakBeforeReset >= 5 ? 0 : streakBeforeReset;
    const bossHp = Math.max(0, battle.bossHp - damage);
    const questionDeck = [...battle.questionDeck];
    const victoryReward = getVictoryReward(battle.location, battle.location.reward);
    if (bossHp <= 0) {
      return {
        ...battle,
        bossHp,
        question: battle.question,
        questionDeck,
        streak,
        lastDamage: damage,
        lastAnswerCorrect: true,
        lastAnswer: selectedAnswer,
        status: 'won',
        message: `${battle.location.bossName} er slått! ${victoryReward}.`
      };
    }

    return {
      ...battle,
      bossHp,
      question: bossHp > 0 ? drawQuestion(questionDeck, battle.location.operations, battle.settings) : battle.question,
      questionDeck,
      streak,
      lastDamage: damage,
      lastAnswerCorrect: true,
      lastAnswer: selectedAnswer,
      status: bossHp <= 0 ? 'won' : 'active',
      message: bossHp <= 0
        ? `${battle.location.bossName} er slått! ${battle.location.reward}.`
        : damage > 1
          ? `Superangrep! ${battle.location.bossName} mister 2 liv.`
          : `Riktig! ${battle.location.bossName} mister 1 liv.`
    };
  }

  const playerHp = Math.max(0, battle.playerHp - 1);
  const questionDeck = [...battle.questionDeck];
  return {
    ...battle,
    playerHp,
    question: playerHp > 0 ? drawQuestion(questionDeck, battle.location.operations, battle.settings) : battle.question,
    questionDeck,
    streak: 0,
    lastDamage: 0,
    lastAnswerCorrect: false,
    lastAnswer: selectedAnswer,
    status: playerHp <= 0 ? 'lost' : 'active',
    message: playerHp <= 0
      ? getDefeatMessage(battle)
      : `Feil! ${battle.location.bossName} bruker ${getBossAttackName(battle.location.id)} Du mister 1 hjerte.`
  };
}

export function getBossDamage(streak: number): number {
  return streak >= 5 ? 2 : 1;
}

function getVictoryReward(location: LocationNode, fallback: string): string {
  if (MAP_BOSS_REWARD_EXPERIMENT && isRewardLocation(location.id)) {
    return 'Hent mynten på kartet';
  }

  return fallback;
}

function getDefeatMessage(battle: BattleState): string {
  if (battle.settings.playMode === 'story') {
    return 'Du mistet alle Story mode-livene. Storymoden starter helt på nytt.';
  }

  return 'Du mistet alle hjertene. Prøv kampen på nytt.';
}

export function getBossAttackName(locationId: string): string {
  if (locationId === 'mega-regnemesteren') {
    return 'Megastøt!';
  }

  const names: Record<string, string> = {
    slimmyra: 'Slimsprut!',
    trollhulen: 'Trollslag!',
    skyggeborgen: 'Skyggestøt!',
    frostfjellene: 'Frostpust!',
    vulkanringen: 'Lavabrøl!',
    tordentoppen: 'Tordenklør!',
    krystallgrotten: 'Krystallslag!',
    tannhjulsbyen: 'Tannhjulsangrep!',
    dypvannshavet: 'Dypvannsslag!',
    'siste-arenaen': 'Mesterstøt!'
  };

  return names[locationId] ?? 'Slimsprut!';
}
