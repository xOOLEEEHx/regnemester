export type CollectibleCardRarity =
  | 'normal'
  | 'uncommon'
  | 'rare'
  | 'unique'
  | 'super'
  | 'legendary';

export type CollectibleCardDefinition = {
  id: string;
  title: string;
  rarity: CollectibleCardRarity;
  src: string;
  description: string;
};

export const MYSTERY_PACK_COST = 400;

const cardBase = '/regnemester/collectible-cards';

export const COLLECTIBLE_CARD_RARITIES: Record<CollectibleCardRarity, {
  label: string;
  sortOrder: number;
}> = {
  normal: { label: 'Normal', sortOrder: 0 },
  uncommon: { label: 'Uvanlig', sortOrder: 1 },
  rare: { label: 'Sjelden', sortOrder: 2 },
  unique: { label: 'Unik', sortOrder: 3 },
  super: { label: 'Super', sortOrder: 4 },
  legendary: { label: 'Legendarisk', sortOrder: 5 }
};

export const COLLECTIBLE_CARDS: CollectibleCardDefinition[] = [
  {
    id: 'regneugla',
    title: 'Regneugla',
    rarity: 'normal',
    src: `${cardBase}/regneugla.webp`,
    description: 'Den kloke ugla teller stjernene fra tretoppen.'
  },
  {
    id: 'tallsmeden',
    title: 'Tallsmeden',
    rarity: 'normal',
    src: `${cardBase}/tallsmeden.webp`,
    description: 'En ung smed som former glødende tall av stjernestål.'
  },
  {
    id: 'krystallreven',
    title: 'Krystallreven',
    rarity: 'uncommon',
    src: `${cardBase}/krystallreven.webp`,
    description: 'Et raskt glimt av blå pels mellom krystalltrærne.'
  },
  {
    id: 'kompasspiraten',
    title: 'Kompasspiraten',
    rarity: 'uncommon',
    src: `${cardBase}/kompasspiraten.webp`,
    description: 'Kartleseren som alltid finner den skjulte ruten.'
  },
  {
    id: 'tallmagiens-bok',
    title: 'Tallmagiens bok',
    rarity: 'rare',
    src: `${cardBase}/tallmagiens-bok.webp`,
    description: 'Sidene åpner seg bare for den som ser mønsteret.'
  },
  {
    id: 'havets-regnedrage',
    title: 'Havets regnedrage',
    rarity: 'rare',
    src: `${cardBase}/havets-regnedrage.webp`,
    description: 'Den vokter talløyene under det glitrende havet.'
  },
  {
    id: 'stjernetelleren',
    title: 'Stjernetelleren',
    rarity: 'unique',
    src: `${cardBase}/stjernetelleren.webp`,
    description: 'Hun tegner nye stjernebilder med lysende formler.'
  },
  {
    id: 'tidsloven',
    title: 'Tidsløven',
    rarity: 'unique',
    src: `${cardBase}/tidsloven.webp`,
    description: 'Et mektig brøl får de gamle tannhjulene til å gå.'
  },
  {
    id: 'regnekrystall-kjempen',
    title: 'Regnekrystall-kjempen',
    rarity: 'super',
    src: `${cardBase}/regnekrystall-kjempen.webp`,
    description: 'En kolossal vokter vekket av krystallens kraft.'
  },
  {
    id: 'labyrintens-vokter',
    title: 'Labyrintens vokter',
    rarity: 'legendary',
    src: `${cardBase}/labyrintens-vokter.webp`,
    description: 'Han kjenner hver hemmelighet i den levende labyrinten.'
  },
  {
    id: 'kartmusen',
    title: 'Kartmusen',
    rarity: 'normal',
    src: `${cardBase}/kartmusen.webp`,
    description: 'Den minste kartmakeren ser hele riket fra sin høye terrasse.'
  },
  {
    id: 'tellepadden',
    title: 'Tellepadden',
    rarity: 'normal',
    src: `${cardBase}/tellepadden.webp`,
    description: 'Hun teller hvert steg gjennom den brusende fossedalen.'
  },
  {
    id: 'myntkisten',
    title: 'Myntkisten',
    rarity: 'normal',
    src: `${cardBase}/myntkisten.webp`,
    description: 'Den levende kisten sorterer myntene med gammel tallmagi.'
  },
  {
    id: 'regnebakeren',
    title: 'Regnebakeren',
    rarity: 'normal',
    src: `${cardBase}/regnebakeren.webp`,
    description: 'Hun baker nye tall før markedsplassen våkner.'
  },
  {
    id: 'monsterportalen',
    title: 'Mønsterportalen',
    rarity: 'normal',
    src: `${cardBase}/monsterportalen.webp`,
    description: 'Steinbrikkene må danne riktig mønster før portalen åpner seg.'
  },
  {
    id: 'tallgartneren',
    title: 'Tallgartneren',
    rarity: 'normal',
    src: `${cardBase}/tallgartneren.webp`,
    description: 'Hver plante spirer i et nytt og vakkert tallmønster.'
  },
  {
    id: 'runekatten',
    title: 'Runekatten',
    rarity: 'uncommon',
    src: `${cardBase}/runekatten.webp`,
    description: 'Potesporene hennes vekker gamle runer til liv.'
  },
  {
    id: 'brokheksa',
    title: 'Brøkheksa',
    rarity: 'uncommon',
    src: `${cardBase}/brokheksa.webp`,
    description: 'Hun deler månelyset i like deler med ett trylleslag.'
  },
  {
    id: 'speilamuletten',
    title: 'Speilamuletten',
    rarity: 'uncommon',
    src: `${cardBase}/speilamuletten.webp`,
    description: 'I det magiske speilet viser riktig svar seg som et grønt lys.'
  },
  {
    id: 'kompassjegeren',
    title: 'Kompassjegeren',
    rarity: 'uncommon',
    src: `${cardBase}/kompassjegeren.webp`,
    description: 'Ingen skjult sti unnslipper det magiske kompasset hennes.'
  },
  {
    id: 'klokkevergen',
    title: 'Klokkevergen',
    rarity: 'uncommon',
    src: `${cardBase}/klokkevergen.webp`,
    description: 'Den eldgamle vergen holder alle tannhjulene i perfekt takt.'
  },
  {
    id: 'takebibliotekaren',
    title: 'Tåkebibliotekaren',
    rarity: 'uncommon',
    src: `${cardBase}/takebibliotekaren.webp`,
    description: 'Hun samler bøker som bare viser seg i morgentåken.'
  },
  {
    id: 'stormformelen',
    title: 'Stormformelen',
    rarity: 'rare',
    src: `${cardBase}/stormformelen.webp`,
    description: 'En levende formel samler lynet til ren tallkraft.'
  },
  {
    id: 'vulkanfoniksen',
    title: 'Vulkanføniksen',
    rarity: 'rare',
    src: `${cardBase}/vulkanfoniksen.webp`,
    description: 'Flammene former nye tall hver gang den reiser seg.'
  },
  {
    id: 'prismamesteren',
    title: 'Prismemesteren',
    rarity: 'rare',
    src: `${cardBase}/prismamesteren.webp`,
    description: 'Han deler lyset og finner mønsteret i alle farger.'
  },
  {
    id: 'nullportalen',
    title: 'Nullportalen',
    rarity: 'rare',
    src: `${cardBase}/nullportalen.webp`,
    description: 'Den runde portalen leder til stedet der alt kan begynne.'
  },
  {
    id: 'havfruens-kode',
    title: 'Havfruens kode',
    rarity: 'rare',
    src: `${cardBase}/havfruens-kode.webp`,
    description: 'Dypt under bølgene løser hun havets eldste gåte.'
  },
  {
    id: 'skygriffens-formel',
    title: 'Skygriffens formel',
    rarity: 'rare',
    src: `${cardBase}/skygriffens-formel.webp`,
    description: 'Den mektige griffen vokter formlene som er skrevet i skyene.'
  },
  {
    id: 'manearkitekten',
    title: 'Månearkitekten',
    rarity: 'unique',
    src: `${cardBase}/manearkitekten.webp`,
    description: 'Hun tegner broer som bare finnes under fullmånen.'
  },
  {
    id: 'tidens-kartograf',
    title: 'Tidens kartograf',
    rarity: 'unique',
    src: `${cardBase}/tidens-kartograf.webp`,
    description: 'Kartet hennes viser både veien frem og stien tilbake.'
  },
  {
    id: 'regnbueskjoldet',
    title: 'Regnbueskjoldet',
    rarity: 'unique',
    src: `${cardBase}/regnbueskjoldet.webp`,
    description: 'Det samler alle fargene til ett strålende vern.'
  },
  {
    id: 'dypets-orakel',
    title: 'Dypets orakel',
    rarity: 'unique',
    src: `${cardBase}/dypets-orakel.webp`,
    description: 'De flytende kulene hvisker svar fra havets mørkeste dyp.'
  },
  {
    id: 'stjernesfinxen',
    title: 'Stjernesfinxen',
    rarity: 'unique',
    src: `${cardBase}/stjernesfinxen.webp`,
    description: 'Den vokter gåtene mellom stjernebildene og kjenner alle svarene.'
  },
  {
    id: 'tordenmatrisen',
    title: 'Tordenmatrisen',
    rarity: 'super',
    src: `${cardBase}/tordenmatrisen.webp`,
    description: 'Et enormt rutenett leder stormens kraft gjennom krystallene.'
  },
  {
    id: 'prismadragen',
    title: 'Prismedragen',
    rarity: 'super',
    src: `${cardBase}/prismadragen.webp`,
    description: 'Hvert skjell bryter lyset til tusen glitrende svar.'
  },
  {
    id: 'kosmosmeden',
    title: 'Kosmosmeden',
    rarity: 'super',
    src: `${cardBase}/kosmosmeden.webp`,
    description: 'Han smir glødende tall av stjernestøv og lyn.'
  },
  {
    id: 'regnekrystall-foniksen',
    title: 'Krystallføniksen',
    rarity: 'super',
    src: `${cardBase}/regnekrystall-foniksen.webp`,
    description: 'Vingene sprer regnekrystaller over hele riket.'
  },
  {
    id: 'tallrikets-dronning',
    title: 'Tallrikets dronning',
    rarity: 'legendary',
    src: `${cardBase}/tallrikets-dronning.webp`,
    description: 'Hun bærer kronen som holder hele tallriket samlet.'
  },
  {
    id: 'evighetsdragen',
    title: 'Evighetsdragen',
    rarity: 'legendary',
    src: `${cardBase}/evighetsdragen.webp`,
    description: 'Den vokter tårnet der alle tall fortsetter for alltid.'
  },
  {
    id: 'regnemesterens-arving',
    title: 'Regnemesterens arving',
    rarity: 'legendary',
    src: `${cardBase}/regnemesterens-arving.webp`,
    description: 'Den neste mesteren løfter krystallen og åpner en ny tidsalder.'
  }
];

export type CollectibleCardCounts = Record<string, number>;

export function getCollectibleCardById(id: string): CollectibleCardDefinition {
  return COLLECTIBLE_CARDS.find((card) => card.id === id) ?? COLLECTIBLE_CARDS[0];
}

export function createCollectibleCardCounts(saved?: Partial<CollectibleCardCounts>): CollectibleCardCounts {
  return COLLECTIBLE_CARDS.reduce<CollectibleCardCounts>((counts, card) => {
    counts[card.id] = Math.max(0, Math.floor(saved?.[card.id] ?? 0));
    return counts;
  }, {});
}

export function drawCollectibleCard(random: () => number = Math.random): CollectibleCardDefinition {
  const roll = Math.max(0, Math.min(0.999999999, random()));
  return COLLECTIBLE_CARDS[Math.floor(roll * COLLECTIBLE_CARDS.length)];
}
