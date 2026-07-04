export type PlayerToken = {
  id: string;
  label: string;
  src: string;
};

const tokenBase = '/regnemester/Spillbrikkene';

export const PLAYER_TOKENS: PlayerToken[] = [
  { id: 'elev-gutt', label: 'Elev gutt', src: `${tokenBase}/regnemester-elev-gutt.png` },
  { id: 'elev-jente', label: 'Elev jente', src: `${tokenBase}/regnemester-elev-jente.png` },
  { id: 'trollmann', label: 'Trollmann', src: `${tokenBase}/trollmann.png` },
  { id: 'superblyant', label: 'Superblyant', src: `${tokenBase}/superblyant.png` },
  { id: 'skattekiste', label: 'Skattekiste', src: `${tokenBase}/skattekiste.png` },
  { id: 'portalbrikke', label: 'Portal', src: `${tokenBase}/portalbrikke.png` },
  { id: 'nokkelmester', label: 'Nøkkelmester', src: `${tokenBase}/nokkelmester.png` },
  { id: 'morsom-dinosaur', label: 'Dinosaur', src: `${tokenBase}/morsom-dinosaur.png` },
  { id: 'mini-drage', label: 'Mini-drage', src: `${tokenBase}/mini-drage-sot.png` },
  { id: 'matterobot', label: 'Matterobot', src: `${tokenBase}/matterobot.png` },
  { id: 'magisk-bok', label: 'Magisk bok', src: `${tokenBase}/magisk-bok.png` },
  { id: 'lynrobot', label: 'Lynrobot', src: `${tokenBase}/lynrobot.png` },
  { id: 'kalkulator', label: 'Kalkulator', src: `${tokenBase}/kul-kalkulator.png` },
  { id: 'krystallvenn', label: 'Krystallvenn', src: `${tokenBase}/krystallvenn.png` },
  { id: 'helteskjold', label: 'Helteskjold', src: `${tokenBase}/helteskjold.png` },
  { id: 'eventyrkompass', label: 'Kompass', src: `${tokenBase}/eventyrkompass.png` }
];

export const DEFAULT_TOKEN_ID = PLAYER_TOKENS[0].id;

export function getTokenById(id: string): PlayerToken {
  return PLAYER_TOKENS.find((token) => token.id === id) ?? PLAYER_TOKENS[0];
}
