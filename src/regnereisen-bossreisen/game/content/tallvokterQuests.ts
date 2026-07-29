export type TallvokterQuestOverviewEntry = {
  id: string;
  order: number;
  place: string;
  title: string;
};

import { SWAMP_ALCHEMY_QUEST_ID } from './swampAlchemy';
import { LIGHT_FOREST_QUEST_ID } from './lightForest';
import { COUNTERWEIGHT_VAULT_QUEST_ID } from './counterweightVault';
import { ARCHIVE_QUEST_ID } from './archiveQuest';
import { CRYSTAL_BRIDGE_QUEST_ID } from './crystalBridgeQuest';

// Nye Tallvokter-oppdrag legges inn her når de blir implementert.
// Skattekisten leser denne listen og fremdriften fra Tallvokterens egen lagring.
export const TALLVOKTER_QUESTS: readonly TallvokterQuestOverviewEntry[] = [
  {
    id: 'gruveekspedisjonen',
    order: 1,
    place: 'Gullgruven',
    title: 'Gruveekspedisjonen'
  },
  {
    id: 'gladiator-arenaen',
    order: 2,
    place: 'Gladiatorarenaen',
    title: 'Arenaens fire gladiatorer'
  },
  {
    id: 'labyrintens-fire-segl',
    order: 3,
    place: 'Labyrinten',
    title: 'Labyrintens fire segl'
  },
  {
    id: 'herskapshuset',
    order: 4,
    place: 'Herskapshuset',
    title: 'Rydd huset for edderkopper'
  },
  {
    id: 'leirstedet',
    order: 5,
    place: 'Leirstedet',
    title: 'Finn delene til det knuste vognhjulet'
  },
  {
    id: 'krystallvognen',
    order: 6,
    place: 'Krystallgruven',
    title: 'Før Krystallvognen gjennom ti veikryss'
  },
  {
    id: 'puslespill-mesteren',
    order: 7,
    place: 'Ruinbyen',
    title: 'Gjenreis den knuste mosaikken'
  },
  {
    id: SWAMP_ALCHEMY_QUEST_ID,
    order: 8,
    place: 'Sumpområdet',
    title: 'Brygg Sumpalkymistens motgift'
  },
  {
    id: LIGHT_FOREST_QUEST_ID,
    order: 9,
    place: 'Lysskogen',
    title: 'Lysrøttenes nettverk'
  },
  {
    id: COUNTERWEIGHT_VAULT_QUEST_ID,
    order: 10,
    place: 'Det forseglede hvelvet',
    title: 'Åpne Motvekthvelvets fire låser'
  },
  {
    id: ARCHIVE_QUEST_ID,
    order: 11,
    place: 'Tallarkivet',
    title: 'Sorter Tallarkivets forsvunne skriftruller'
  },
  {
    id: CRYSTAL_BRIDGE_QUEST_ID,
    order: 12,
    place: 'Krystallbassenget',
    title: 'Reparer Krystallbroens manglende ledd'
  }
];
