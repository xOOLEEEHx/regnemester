import type { MathQuestDefinition } from '../simulation/mathQuest';

export const TALLVOKTER_THIEF_TEXTURE_KEY = 'tallvokter-regnetyvene';
export const TALLVOKTER_THIEF_ASSET_PATH = '/regnemester/events/regnetyvene/regnetyvene-trio.webp';
export const TALLVOKTER_THIEF_QUEST_ASSET_PATH = '/regnemester/events/regnetyvene/regnetyvene-trio-full.webp';
export const TALLVOKTER_THIEF_MASK_TEXTURE_KEY = 'tallvokter-thief-spawn-mask';
export const TALLVOKTER_THIEF_MASK_PATH = '/regnemester/maps/tallvokter-thief-spawn-mask.png';
export const TALLVOKTER_THIEF_MASK_SCALE = 4;
export const TALLVOKTER_THIEF_ROBBERY_AMOUNT = 100;
export const TALLVOKTER_THIEF_VICTORY_REWARD = 50;

export const TALLVOKTER_THIEF_QUEST: MathQuestDefinition = {
  id: 'regnetyvene',
  place: 'Regnetyvene',
  title: 'Stopp tyvene',
  description: 'Løs 10 matematikkoppgaver for å beskytte Regnecoinene dine.',
  successText: 'Du løste alle oppgavene. Regnetyvene må dra tomhendte videre.',
  iconSrc: TALLVOKTER_THIEF_QUEST_ASSET_PATH,
  operations: ['add', 'subtract', 'multiply', 'divide'],
  requiredCorrect: 10
};
