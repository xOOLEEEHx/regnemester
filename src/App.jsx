import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@supabase/supabase-js";
import { Crown, Gem, KeyRound, Lock, Shield, Sparkles, Star, Timer, Trophy, Zap } from "lucide-react";

const NORMAL_GAME_SECONDS = 60;
const SCHOOL_BATTLE_SECONDS = 70;
const TIME_PENALTY_SECONDS = 5;
const SCHOOL_BATTLE_TIME_QUESTION_COUNT = 25;
const NORMAL_HIGHSCORE_VISIBLE_LIMIT = 10;
const NORMAL_VISIBLE_FETCH_LIMIT = 1000;
const SCHOOL_BATTLE_VISIBLE_FETCH_LIMIT = 1000;
const QUESTION_COUNT_OPTIONS = [10, 20, 30, 40];
const STORAGE_KEY = "gangemester_highscores_v1";
const PENDING_HIGHSCORE_KEY = "regnemester_pending_highscores_v1";
const REGNEREISEN_PROGRESS_KEY = "regnemester_regnereisen_progress_v3";
const REGNEREISEN_TOKEN_KEY = "regnemester_regnereisen_token_v1";
const REGNEREISEN_MISSION_TARGET = 10;
const REGNEREISEN_MISSION_LIVES = 5;
const REGNEREISEN_TRAVEL_ANIMATION_MS = 900;
const HIGHSCORE_SAVE_PENDING_MESSAGE = "Runden er fullført, men resultatet kunne ikke lagres på highscore akkurat nå. Appen prøver igjen automatisk.";
const HIGHSCORE_SAVE_CONFIRMED_MESSAGE = "Resultatet ble lagret på highscore.";
const HIGHSCORE_LOAD_FAILED_MESSAGE = "Highscore-listen kunne ikke lastes akkurat nå.";
const PENDING_HIGHSCORE_SAVED_MESSAGE = "Tidligere resultat ble lagret på highscore.";
const SCHOOL_BATTLE_SETTING_KEY = "school_battle_enabled";
const REGNEREISEN_ACCESS_CODE_SETTING_KEY = "regnereisen_access_code";
const REGNEREISEN_ACCESS_CODE_LOCAL_SETTINGS_KEY = "regnemester_regnereisen_access_code_v1";
const REGNEREISEN_ACCESS_GRANTED_STORAGE_KEY = "regnemester_regnereisen_access_granted_v1";
const ANNOUNCEMENT_ENABLED_KEY = "announcement_enabled";
const ANNOUNCEMENT_TITLE_KEY = "announcement_title";
const ANNOUNCEMENT_MESSAGE_KEY = "announcement_message";
const ANNOUNCEMENT_VERSION_KEY = "announcement_version";
const ANNOUNCEMENT_SETTING_KEYS = [
  ANNOUNCEMENT_ENABLED_KEY,
  ANNOUNCEMENT_TITLE_KEY,
  ANNOUNCEMENT_MESSAGE_KEY,
  ANNOUNCEMENT_VERSION_KEY,
];
const ANNOUNCEMENT_DEFAULT_TITLE = "Nyhet i Regnemester!";
const ANNOUNCEMENT_DISMISSED_STORAGE_KEY = "regnemester_dismissed_announcement_v1";
const ANNOUNCEMENT_LOCAL_SETTINGS_KEY = "regnemester_announcement_settings_v1";
const SCHOOL_BATTLE_CLOSED_MESSAGE = "Skolekampen er for øyeblikket stengt.\nDu kan fortsatt spille de andre modusene.";
const SCHOOL_BATTLE_CLOSED_DURING_ROUND_MESSAGE = "Skolekampen ble stengt før runden var ferdig.\nResultatet ble derfor ikke lagret.";
const NORMAL_RESULT_FEEDBACK_MESSAGES = {
  perfect: [
    "Fantastisk presisjon! Du traff på alt. 🚀",
    "Full pott! Alle svarene var riktige. 🏆",
    "Strålende! Du hadde kontroll på hver eneste oppgave. ⭐",
    "Perfekt runde! Dette var skikkelig imponerende. 🔥",
    "Alt riktig! Du er virkelig i flytsonen. 💪",
  ],
  excellent: [
    "Fantastisk presisjon! Du traff på nesten alt. 🚀",
    "Sterkt jobbet! Du var bare litt unna full pott. ⭐",
    "Dette var en skikkelig god runde! Nesten alt satt. 🔥",
    "Veldig bra kontroll! Du bommet bare litt. 💪",
    "Kjemperunde! Du traff på det aller meste. 🏆",
  ],
  strong: [
    "Sterk runde! Du hadde god kontroll. ⭐",
    "Godt jobbet! Du traff på mange oppgaver. 💪",
    "Dette går riktig vei! Du viser god forståelse. 🚀",
    "Flott innsats! Mange riktige svar her. 👏",
    "Bra runde! Fortsett sånn, så blir du enda tryggere. 🔥",
  ],
  practice: [
    "Bra jobbet! Øv litt til, så blir du enda tryggere. 💪",
    "God innsats! Du er på vei. Prøv en runde til. 🌱",
    "Du fikk til mye! Litt mer øving, så sitter det bedre. ⭐",
    "Fin innsats! Se om du klarer enda flere riktige neste gang. 🚀",
    "Dette var en god start! Fortsett å øve. 👏",
  ],
  beginner: [
    "God innsats! Prøv igjen og se om du klarer flere riktige. 🌱",
    "Ikke gi opp! En ny runde kan gjøre stor forskjell. 💪",
    "Alle må øve for å bli bedre. Prøv en gang til. ⭐",
    "Dette var god trening! Neste runde kan bli bedre. 🚀",
    "Du er i gang! Fortsett å prøve, så blir du tryggere. 👏",
  ],
};

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const ADMIN_PIN_FALLBACK = import.meta.env.VITE_ADMIN_PIN_FALLBACK || "48291736";
const APP_URL = "https://regnemester.vercel.app/";
const REGNEREISEN_PLACES = [
  { id: "sumpporten", name: "Sumpporten", subtitle: "Porten inn i myra", x: 26, y: 86 },
  { id: "myrstien", name: "Myrstien", subtitle: "Sleipe minusspor", x: 76, y: 67 },
  { id: "slimbroen", name: "Slimbroen", subtitle: "Multipliser over slimstrømmen", x: 29, y: 49 },
  { id: "klissedammen", name: "Klissedammen", subtitle: "Blandet slimvann", x: 70, y: 25 },
  { id: "slimmyra", name: "Slimmyra", subtitle: "Boss: Slimbossen", x: 30, y: 15 },
];
const REGNEREISEN_SLIM_KEY_PLACE_IDS = ["sumpporten", "myrstien", "slimbroen", "klissedammen"];
const REGNEREISEN_REQUIRED_SLIM_KEYS = REGNEREISEN_SLIM_KEY_PLACE_IDS.length;
const REGNEREISEN_TOKENS = [
  { id: "regnemester-elev-gutt", label: "Regnemester (Elev gutt)", image: "/regnereisen/tokens/regnemester-elev-gutt.png" },
  { id: "regnemester-elev-jente", label: "Regnemester (Elev jente)", image: "/regnereisen/tokens/regnemester-elev-jente.png" },
  { id: "kul-kalkulator", label: "Kul kalkulator", image: "/regnereisen/tokens/kul-kalkulator.png" },
  { id: "mini-drage-sot", label: "Mini drage (søt)", image: "/regnereisen/tokens/mini-drage-sot.png" },
  { id: "krystallvenn", label: "Krystallvenn", image: "/regnereisen/tokens/krystallvenn.png" },
  { id: "matterobot", label: "Matterobot", image: "/regnereisen/tokens/matterobot.png" },
  { id: "helteskjold", label: "Helteskjold", image: "/regnereisen/tokens/helteskjold.png" },
  { id: "magisk-bok", label: "Magisk bok", image: "/regnereisen/tokens/magisk-bok.png" },
  { id: "superblyant", label: "Superblyant", image: "/regnereisen/tokens/superblyant.png" },
  { id: "portalbrikke", label: "Portalbrikke", image: "/regnereisen/tokens/portalbrikke.png" },
  { id: "nokkelmester", label: "Nøkkelmester", image: "/regnereisen/tokens/nokkelmester.png" },
  { id: "trollmann", label: "Trollmann", image: "/regnereisen/tokens/trollmann.png" },
  { id: "lynrobot", label: "Lynrobot", image: "/regnereisen/tokens/lynrobot.png" },
  { id: "eventyrkompass", label: "Eventyrkompass", image: "/regnereisen/tokens/eventyrkompass.png" },
  { id: "skattekiste", label: "Skattekiste", image: "/regnereisen/tokens/skattekiste.png" },
  { id: "morsom-dinosaur", label: "Morsom dinosaur", image: "/regnereisen/tokens/morsom-dinosaur.png" },
];
const REGNEREISEN_WORLD_CARDS = [
  { id: "slimmyra", name: "Slimmyra", subtitle: "Første kart", boss: "Slimbossen", isOpen: true },
  { id: "trollhulen", name: "Trollhulen", subtitle: "Neste kart", boss: "Trollkongen", isOpen: false, requiresSlimCrystal: true },
  { id: "skyggeborgen", name: "Skyggeborgen", subtitle: "Kommer senere", boss: "Skyggegolemen", isOpen: false },
  { id: "frostfjellene", name: "Frostfjellene", subtitle: "Kommer senere", boss: "Isdragen", isOpen: false },
  { id: "vulkanringen", name: "Vulkanringen", subtitle: "Kommer senere", boss: "Lavakjempen", isOpen: false },
];
const REGNEREISEN_MISSIONS = {
  sumpporten: {
    kind: "mission",
    placeId: "sumpporten",
    title: "Sumpporten",
    mode: "addition",
    level: "easy",
    intro: "Sumpporten er stengt! Få 10 riktige addisjonsoppgaver for å åpne veien videre.",
    note: "Lett addisjon. Du har 5 liv.",
    completeText: "Sumpporten åpnes.",
  },
  myrstien: {
    kind: "mission",
    placeId: "myrstien",
    title: "Myrstien",
    mode: "subtraction",
    level: "easy",
    intro: "Myrstien er glatt! Få 10 riktige subtraksjonsoppgaver for å finne fast grunn.",
    note: "Lett subtraksjon. Du har 5 liv.",
    completeText: "Myrstien er fullført.",
  },
  slimbroen: {
    kind: "mission",
    placeId: "slimbroen",
    title: "Slimbroen",
    mode: "multiplication",
    level: "easy",
    intro: "Slimbroen gynger! Få 10 riktige multiplikasjonsoppgaver for å komme over.",
    note: "Lett multiplikasjon. Du har 5 liv.",
    completeText: "Slimbroen er fullført.",
  },
  klissedammen: {
    kind: "mission",
    placeId: "klissedammen",
    title: "Klissedammen",
    mode: "mixed",
    level: "easy",
    intro: "Klissedammen bobler! Få 10 riktige blandingsoppgaver for å nå Slimmyra.",
    note: "Lett blanding. Du har 5 liv.",
    completeText: "Klissedammen er fullført.",
  },
  slimmyra: {
    kind: "boss",
    placeId: "slimmyra",
    title: "Slimmyra",
    bossId: "slime",
    mode: "mixed",
    level: "easy",
    intro: "Slimbossen venter i Slimmyra! Slå bossen for å fullføre første kart.",
    note: "Bosskamp mot Slimbossen.",
    completeText: "Første kart er fullført.",
  },
};

function SlimKeySlots({ count = 0, className = "" }) {
  const filledCount = Math.max(0, Math.min(REGNEREISEN_REQUIRED_SLIM_KEYS, count));
  return (
    <span className={`journey-key-slots ${className}`.trim()} aria-label={`${filledCount} av ${REGNEREISEN_REQUIRED_SLIM_KEYS} slimnøkler samlet`}>
      {Array.from({ length: REGNEREISEN_REQUIRED_SLIM_KEYS }).map((_, index) => (
        <span key={index} className={`journey-key-slot ${index < filledCount ? "filled" : ""}`}>
          <KeyRound aria-hidden="true" />
        </span>
      ))}
    </span>
  );
}

function SlimCrystalStatus({ collected = false, compact = false }) {
  return (
    <span className={`journey-crystal-status ${collected ? "collected" : ""} ${compact ? "compact" : ""}`.trim()}>
      <span className="journey-crystal-icon"><Gem aria-hidden="true" /></span>
      <span>{compact ? "Slimkrystall" : `Slimkrystall: ${collected ? "samlet" : "ikke samlet"}`}</span>
    </span>
  );
}

function RegnereisenTokenBadge({ token, className = "" }) {
  if (!token) return null;
  return (
    <span className={`journey-token journey-token-${token.id} ${className}`.trim()} aria-hidden="true">
      <span className="journey-token-core">
        <img className="journey-token-image" src={token.image} alt="" draggable="false" />
      </span>
    </span>
  );
}

function RegnereisenRewardPopup({ reward, onClose }) {
  if (!reward) return null;
  const isCrystalReward = reward.type === "crystal";

  return (
    <div className={`journey-reward-overlay ${reward.isBossUnlocked ? "boss-unlocked" : ""} ${isCrystalReward ? "crystal-reward" : ""}`} role="dialog" aria-modal="true" aria-live="polite">
      <div className="journey-reward-card">
        <span className="journey-reward-spark"><Sparkles aria-hidden="true" /></span>
        <span className={`journey-reward-icon ${isCrystalReward ? "crystal" : "key"}`}>
          {isCrystalReward ? <Gem aria-hidden="true" /> : <KeyRound aria-hidden="true" />}
        </span>
        <span className="journey-kicker">{isCrystalReward ? "Slimkrystall samlet" : reward.isBossUnlocked ? "Boss-sted åpnet" : "Nøkkel samlet"}</span>
        <h2>{isCrystalReward ? "Kart fullført!" : reward.isBossUnlocked ? "Alle slimnøklene er samlet!" : "Sted fullført!"}</h2>
        <p>
          {isCrystalReward
            ? "Du slo Slimbossen og fikk Slimkrystallen. Slimmyra-kartet er fullført!"
            : reward.isBossUnlocked
              ? `Du har fått nøkkelen fra ${reward.placeName}. Slimmyra er nå åpen, og Slimbossen venter!`
              : `Du har fått nøkkelen fra ${reward.placeName}!`}
        </p>
        <div className="journey-reward-progress">
          {isCrystalReward ? (
            <>
              <SlimCrystalStatus collected />
              <strong>Trollhulen er nå åpen</strong>
              <span>Neste kart kommer snart.</span>
            </>
          ) : (
            <>
              <strong>Slimnøkler: {reward.keyCount}/{REGNEREISEN_REQUIRED_SLIM_KEYS}</strong>
              <SlimKeySlots count={reward.keyCount} />
            </>
          )}
        </div>
        <Button onClick={onClose} className="full">Fortsett</Button>
      </div>
    </div>
  );
}
const MODE_BACKGROUND_URLS = [
  "/backgrounds/modes/normal-mode-bg.png",
  "/backgrounds/modes/school-battle-mode-bg.png",
  "/backgrounds/modes/boss-battle-mode-bg.png",
];

const MODE_ORDER = ["addition", "subtraction", "multiplication", "division"];
const MIXED_MODE = "mixed";
const MIXED_MODE_OPTIONS = MODE_ORDER;
const PRACTICE_MODE_ORDER = [...MODE_ORDER, MIXED_MODE];
const LEVEL_ORDER = ["easy", "medium", "hard"];
const GRADE_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];
const SCHOOL_BATTLE_GRADE_OPTIONS = [1, 2, 3, 4, 5, 6, 7];
const ALL_FILTER_VALUE = "all";

const SCHOOL_OPTIONS = [
  "Austafjord skole",
  "Foldereid oppvekstsenter",
  "Gravvik oppvekstsenter",
  "Kolvereid skole",
  "Nærøysundet skole",
  "Rørvik skole",
];

const MEGA_REGNEMESTEREN_ID = "mega-regnemesteren";
const MEGA_REGNEMESTEREN_INTRO_LINES = [
  "Vent litt... noe er galt!",
  "Regnemesteren nekter å gi seg!",
  "Regnemesteren forvandler seg til MEGA REGNEMESTEREN!",
];

const BOSS_OPTIONS = [
  {
    id: "slime",
    name: "Slimbossen",
    treasureName: "Slimbossens skatt",
    lives: 10,
    hearts: 5,
    arena: "Slimmyra",
    shortIcon: "SLIM",
    treasureSize: "small",
    gradient: "linear-gradient(135deg, #d9f99d, #86efac, #22c55e)",
    accent: "#16a34a",
  },
  {
    id: "troll",
    name: "Trollkongen",
    treasureName: "Trollkongens skatt",
    lives: 20,
    hearts: 4,
    arena: "Trollhulen",
    shortIcon: "TROLL",
    treasureSize: "medium",
    gradient: "linear-gradient(135deg, #fde68a, #f59e0b, #92400e)",
    accent: "#b45309",
  },
  {
    id: "shadow",
    name: "Skyggegolemen",
    treasureName: "Skyggegolemens skatt",
    lives: 30,
    hearts: 3,
    arena: "Skyggeborgen",
    shortIcon: "GOLEM",
    treasureSize: "large",
    gradient: "linear-gradient(135deg, #cbd5e1, #475569, #020617)",
    accent: "#111827",
  },
  {
    id: "isdragen",
    name: "Isdragen",
    treasureName: "Isdragens skatt",
    lives: 40,
    hearts: 3,
    arena: "Frostfjellene",
    shortIcon: "IS",
    treasureSize: "large",
    gradient: "linear-gradient(135deg, #e0f2fe, #67e8f9, #2563eb)",
    accent: "#0284c7",
  },
  {
    id: "lavakjempen",
    name: "Lavakjempen",
    treasureName: "Lavakjempens skatt",
    lives: 50,
    hearts: 3,
    arena: "Vulkanringen",
    shortIcon: "LAVA",
    treasureSize: "large",
    gradient: "linear-gradient(135deg, #451a03, #dc2626 48%, #f59e0b)",
    accent: "#dc2626",
  },
  {
    id: "stormornen",
    name: "Stormørnen",
    treasureName: "Stormørnens skatt",
    lives: 60,
    hearts: 3,
    arena: "Tordentoppen",
    shortIcon: "STORM",
    treasureSize: "large",
    gradient: "linear-gradient(135deg, #dbeafe, #2563eb 48%, #0f172a)",
    accent: "#2563eb",
  },
  {
    id: "krystallvokteren",
    name: "Krystallvokteren",
    treasureName: "Krystallvokterens skatt",
    lives: 70,
    hearts: 3,
    arena: "Krystallgrotten",
    shortIcon: "KRYST",
    treasureSize: "large",
    gradient: "linear-gradient(135deg, #ecfeff, #8b5cf6 48%, #312e81)",
    accent: "#7c3aed",
  },
  {
    id: "mekamaskinen",
    name: "Mekamaskinen",
    treasureName: "Mekamaskinens skatt",
    lives: 80,
    hearts: 3,
    arena: "Tannhjulsbyen",
    shortIcon: "MEKA",
    treasureSize: "large",
    gradient: "linear-gradient(135deg, #f8fafc, #64748b 48%, #0f172a)",
    accent: "#475569",
  },
  {
    id: "morkekraken",
    name: "Mørkekraken",
    treasureName: "Mørkekrakens skatt",
    lives: 90,
    hearts: 3,
    arena: "Dypvannshavet",
    shortIcon: "KRAKEN",
    treasureSize: "large",
    gradient: "linear-gradient(135deg, #0f172a, #1e3a8a 48%, #0891b2)",
    accent: "#0891b2",
  },
  {
    id: "regnemesteren",
    name: "Regnemesteren",
    treasureName: "Regnemesterens skatt",
    lives: 100,
    hearts: 3,
    arena: "Den siste arenaen",
    shortIcon: "MESTER",
    treasureSize: "large",
    gradient: "linear-gradient(135deg, #1e1b4b, #7c3aed 48%, #facc15)",
    accent: "#7c3aed",
  },
  {
    id: MEGA_REGNEMESTEREN_ID,
    name: "Mega Regnemesteren",
    treasureName: "Mega Regnemesterens skatt",
    lives: 50,
    hearts: 3,
    arena: "Den skjulte finalen",
    shortIcon: "MEGA",
    treasureSize: "large",
    gradient: "linear-gradient(135deg, #020617, #581c87 48%, #facc15)",
    accent: "#a855f7",
  },
];

const BOSS_LADDER_UNLOCK_KEY = "regnemester_boss_ladder_unlocks_v1";
const BOSS_LADDER = [
  { id: "slime", order: 1, name: "Slimbossen", lives: 10, playable: true, isImplemented: true, unlockedByDefault: true },
  { id: "troll", order: 2, name: "Trollkongen", lives: 20, playable: true, isImplemented: true, unlockedByDefault: true },
  { id: "shadow", order: 3, name: "Skyggegolemen", lives: 30, playable: true, isImplemented: true, unlockedByDefault: true },
  { id: "isdragen", order: 4, name: "Isdragen", lives: 40, playable: true, isImplemented: true, unlockKey: "isdragen", legacyUnlockKey: "ice", lockedText: "Slå Skyggegolemen for å låse opp" },
  { id: "lavakjempen", order: 5, name: "Lavakjempen", lives: 50, playable: true, isImplemented: true, unlockKey: "lavakjempen", legacyUnlockKey: "lava", lockedText: "Slå Isdragen for å låse opp" },
  { id: "stormornen", order: 6, name: "Stormørnen", lives: 60, playable: true, isImplemented: true, unlockKey: "stormornen", legacyUnlockKey: "storm", lockedText: "Slå Lavakjempen for å låse opp" },
  { id: "krystallvokteren", order: 7, name: "Krystallvokteren", lives: 70, playable: true, isImplemented: true, unlockKey: "krystallvokteren", lockedText: "Slå Stormørnen for å låse opp" },
  { id: "mekamaskinen", order: 8, name: "Mekamaskinen", lives: 80, playable: true, isImplemented: true, unlockKey: "mekamaskinen", legacyUnlockKey: "mecha", lockedText: "Slå Krystallvokteren for å låse opp" },
  { id: "morkekraken", order: 9, name: "Mørkekraken", lives: 90, playable: true, isImplemented: true, unlockKey: "morkekraken", legacyUnlockKey: "kraken", lockedText: "Slå Mekamaskinen for å låse opp" },
  { id: "regnemesteren", order: 10, name: "Regnemesteren", lives: 100, playable: true, isImplemented: true, unlockKey: "regnemesteren", lockedText: "Slå Mørkekraken for å låse opp" },
];

const SLIME_BOSS_ASSETS = {
  states: {
    idle: "/bosses/slime/slime-boss-idle.png",
    hurt1: "/bosses/slime/slime-boss-hurt-01.png",
    hurt2: "/bosses/slime/slime-boss-hurt-02.png",
    attack: "/bosses/slime/slime-boss-attack.png",
    lowHp: "/bosses/slime/slime-boss-low-hp.png",
    defeated: "/bosses/slime/slime-boss-defeated.png",
  },
  panelBackground: "/bosses/slime/slime-panel-bg.png",
  pageBackground: "/bosses/slime/slime-boss-page-bg.webp",
};

const SLIME_BOSS_PRELOAD_URLS = Object.values(SLIME_BOSS_ASSETS.states);
const BOSS_ATTACK_HOLD_MS = 720;
const SLIME_HURT_FIRST_FRAME_MS = 210;
const SLIME_HURT_TOTAL_MS = 620;
const SLIME_ATTACK_FRAME_MS = BOSS_ATTACK_HOLD_MS;
const SLIME_DEFEATED_INTRO_MS = 300;

const TROLL_BOSS_ASSETS = {
  states: {
    idle: "/bosses/trollkongen/trollkongen-idle.png",
    hurt1: "/bosses/trollkongen/trollkongen-hurt-2.png",
    hurt2: "/bosses/trollkongen/trollkongen-hurt-1.png",
    attack: "/bosses/trollkongen/trollkongen-attack.png",
    lowHp: "/bosses/trollkongen/trollkongen-low-hp.png",
    defeated: "/bosses/trollkongen/trollkongen-defeated.png",
  },
  panelBackground: "/bosses/trollkongen/trollkongen-panel-bg.png",
};

const TROLL_BOSS_PRELOAD_URLS = Object.values(TROLL_BOSS_ASSETS.states);
const TROLL_HURT_FIRST_FRAME_MS = 260;
const TROLL_HURT_TOTAL_MS = 780;
const TROLL_ATTACK_FRAME_MS = BOSS_ATTACK_HOLD_MS;
const TROLL_DEFEATED_INTRO_MS = 420;

const SHADOW_GOLEM_ASSETS = {
  states: {
    idle: "/bosses/skyggegolemen/skyggegolemen-idle.png",
    hurt1: "/bosses/skyggegolemen/skyggegolemen-hurt-1.png",
    hurt2: "/bosses/skyggegolemen/skyggegolemen-hurt-2.png",
    attack: "/bosses/skyggegolemen/skyggegolemen-attack.png",
    lowHp: "/bosses/skyggegolemen/skyggegolemen-low-hp.png",
    defeated: "/bosses/skyggegolemen/skyggegolemen-defeated.png",
  },
  panelBackground: "/bosses/skyggegolemen/skyggegolemen-panel-bg.png",
};

const SHADOW_GOLEM_PRELOAD_URLS = Object.values(SHADOW_GOLEM_ASSETS.states);
const SHADOW_GOLEM_HURT_FIRST_FRAME_MS = 240;
const SHADOW_GOLEM_HURT_TOTAL_MS = 720;
const SHADOW_GOLEM_ATTACK_FRAME_MS = BOSS_ATTACK_HOLD_MS;
const SHADOW_GOLEM_DEFEATED_INTRO_MS = 320;

const ISDRAGEN_ASSETS = {
  states: {
    idle: "/bosses/isdragen/isdragen-idle.png",
    hurt1: "/bosses/isdragen/isdragen-hurt-1.png",
    hurt2: "/bosses/isdragen/isdragen-hurt-2.png",
    attack: "/bosses/isdragen/isdragen-attack.png",
    lowHp: "/bosses/isdragen/isdragen-low-hp.png",
    defeated: "/bosses/isdragen/isdragen-defeated.png",
  },
  panelBackground: "/bosses/isdragen/isdragen-panel-bg.png",
};

const ISDRAGEN_PRELOAD_URLS = Object.values(ISDRAGEN_ASSETS.states);
const ISDRAGEN_HURT_FIRST_FRAME_MS = 240;
const ISDRAGEN_HURT_TOTAL_MS = 720;
const ISDRAGEN_ATTACK_FRAME_MS = BOSS_ATTACK_HOLD_MS;
const ISDRAGEN_DEFEATED_INTRO_MS = 320;

const LAVAKJEMPEN_ASSETS = {
  states: {
    idle: "/bosses/lavakjempen/lavakjempen-idle.png",
    hurt1: "/bosses/lavakjempen/lavakjempen-hurt-1.png",
    hurt2: "/bosses/lavakjempen/lavakjempen-hurt-2.png",
    attack: "/bosses/lavakjempen/lavakjempen-attack.png",
    lowHp: "/bosses/lavakjempen/lavakjempen-low-hp.png",
    defeated: "/bosses/lavakjempen/lavakjempen-defeated.png",
  },
  panelBackground: "/bosses/lavakjempen/lavakjempen-panel-bg.png",
};

const LAVAKJEMPEN_PRELOAD_URLS = Object.values(LAVAKJEMPEN_ASSETS.states);
const LAVAKJEMPEN_HURT_FIRST_FRAME_MS = 240;
const LAVAKJEMPEN_HURT_TOTAL_MS = 720;
const LAVAKJEMPEN_ATTACK_FRAME_MS = BOSS_ATTACK_HOLD_MS;
const LAVAKJEMPEN_DEFEATED_INTRO_MS = 320;

const STORMORNEN_ASSETS = {
  states: {
    idle: "/bosses/stormornen/stormornen-idle.png",
    hurt1: "/bosses/stormornen/stormornen-hurt-1.png",
    hurt2: "/bosses/stormornen/stormornen-hurt-2.png",
    attack: "/bosses/stormornen/stormornen-attack.png",
    lowHp: "/bosses/stormornen/stormornen-low-hp.png",
    defeated: "/bosses/stormornen/stormornen-defeated.png",
  },
  panelBackground: "/bosses/stormornen/stormornen-panel-bg.png",
};

const STORMORNEN_PRELOAD_URLS = Object.values(STORMORNEN_ASSETS.states);
const STORMORNEN_HURT_FIRST_FRAME_MS = 240;
const STORMORNEN_HURT_TOTAL_MS = 720;
const STORMORNEN_ATTACK_FRAME_MS = BOSS_ATTACK_HOLD_MS;
const STORMORNEN_DEFEATED_INTRO_MS = 320;

const KRYSTALLVOKTEREN_ASSETS = {
  states: {
    idle: "/bosses/krystallvokteren/krystallvokteren-idle.png",
    hurt1: "/bosses/krystallvokteren/krystallvokteren-hurt-1.png",
    hurt2: "/bosses/krystallvokteren/krystallvokteren-hurt-2.png",
    attack: "/bosses/krystallvokteren/krystallvokteren-attack.png",
    lowHp: "/bosses/krystallvokteren/krystallvokteren-low-hp.png",
    defeated: "/bosses/krystallvokteren/krystallvokteren-defeated.png",
  },
  panelBackground: "/bosses/krystallvokteren/krystallvokteren-panel-bg.png",
};

const KRYSTALLVOKTEREN_PRELOAD_URLS = Object.values(KRYSTALLVOKTEREN_ASSETS.states);
const KRYSTALLVOKTEREN_HURT_FIRST_FRAME_MS = 240;
const KRYSTALLVOKTEREN_HURT_TOTAL_MS = 720;
const KRYSTALLVOKTEREN_ATTACK_FRAME_MS = BOSS_ATTACK_HOLD_MS;
const KRYSTALLVOKTEREN_DEFEATED_INTRO_MS = 320;

const MEKAMASKINEN_ASSETS = {
  states: {
    idle: "/bosses/mekamaskinen/mekamaskinen-idle.png",
    hurt1: "/bosses/mekamaskinen/mekamaskinen-hurt-1.png",
    hurt2: "/bosses/mekamaskinen/mekamaskinen-hurt-2.png",
    attack: "/bosses/mekamaskinen/mekamaskinen-attack.png",
    lowHp: "/bosses/mekamaskinen/mekamaskinen-low-hp.png",
    defeated: "/bosses/mekamaskinen/mekamaskinen-defeated.png",
  },
  panelBackground: "/bosses/mekamaskinen/mekamaskinen-panel-bg.png",
};

const MEKAMASKINEN_PRELOAD_URLS = Object.values(MEKAMASKINEN_ASSETS.states);
const MEKAMASKINEN_HURT_FIRST_FRAME_MS = 240;
const MEKAMASKINEN_HURT_TOTAL_MS = 720;
const MEKAMASKINEN_ATTACK_FRAME_MS = BOSS_ATTACK_HOLD_MS;
const MEKAMASKINEN_DEFEATED_INTRO_MS = 320;

const MORKEKRAKEN_ASSETS = {
  states: {
    idle: "/bosses/morkekraken/morkekraken-idle.png",
    hurt1: "/bosses/morkekraken/morkekraken-hurt-1.png",
    hurt2: "/bosses/morkekraken/morkekraken-hurt-2.png",
    attack: "/bosses/morkekraken/morkekraken-attack.png",
    lowHp: "/bosses/morkekraken/morkekraken-low-hp.png",
    defeated: "/bosses/morkekraken/morkekraken-defeated.png",
  },
  panelBackground: "/bosses/morkekraken/morkekraken-panel-bg.png",
};

const MORKEKRAKEN_PRELOAD_URLS = Object.values(MORKEKRAKEN_ASSETS.states);
const MORKEKRAKEN_HURT_FIRST_FRAME_MS = 240;
const MORKEKRAKEN_HURT_TOTAL_MS = 720;
const MORKEKRAKEN_ATTACK_FRAME_MS = BOSS_ATTACK_HOLD_MS;
const MORKEKRAKEN_DEFEATED_INTRO_MS = 320;

const REGNEMESTEREN_ASSETS = {
  states: {
    idle: "/bosses/regnemesteren/regnemesteren-idle.png",
    hurt1: "/bosses/regnemesteren/regnemesteren-hurt-1.png",
    hurt2: "/bosses/regnemesteren/regnemesteren-hurt-2.png",
    attack: "/bosses/regnemesteren/regnemesteren-attack.png",
    lowHp: "/bosses/regnemesteren/regnemesteren-low-hp.png",
    defeated: "/bosses/regnemesteren/regnemesteren-defeated.png",
  },
  panelBackground: "/bosses/regnemesteren/regnemesteren-panel-bg.png",
  finalDiploma: "/bosses/regnemesteren/regnemesteren-final-diploma.png",
};

const REGNEMESTEREN_PRELOAD_URLS = [...Object.values(REGNEMESTEREN_ASSETS.states), REGNEMESTEREN_ASSETS.finalDiploma];
const REGNEMESTEREN_HURT_FIRST_FRAME_MS = 240;
const REGNEMESTEREN_HURT_TOTAL_MS = 720;
const REGNEMESTEREN_ATTACK_FRAME_MS = BOSS_ATTACK_HOLD_MS;
const REGNEMESTEREN_DEFEATED_INTRO_MS = 320;

const MEGA_REGNEMESTEREN_ASSETS = {
  states: {
    idle: "/bosses/mega-regnemesteren/mega-regnemesteren-idle.png",
    hurt1: "/bosses/mega-regnemesteren/mega-regnemesteren-hurt-1.png",
    hurt2: "/bosses/mega-regnemesteren/mega-regnemesteren-hurt-2.png",
    attack: "/bosses/mega-regnemesteren/mega-regnemesteren-attack.png",
    lowHp: "/bosses/mega-regnemesteren/mega-regnemesteren-low-hp.png",
    defeated: "/bosses/mega-regnemesteren/mega-regnemesteren-defeated.png",
  },
  panelBackground: "/backgrounds/mega-regnemesteren-bg.png",
};

const MEGA_REGNEMESTEREN_PRELOAD_URLS = [...Object.values(MEGA_REGNEMESTEREN_ASSETS.states), MEGA_REGNEMESTEREN_ASSETS.panelBackground];
const MEGA_REGNEMESTEREN_HURT_FIRST_FRAME_MS = 240;
const MEGA_REGNEMESTEREN_HURT_TOTAL_MS = 720;
const MEGA_REGNEMESTEREN_ATTACK_FRAME_MS = BOSS_ATTACK_HOLD_MS;
const MEGA_REGNEMESTEREN_DEFEATED_INTRO_MS = 320;

const BLOCKED_CONTAINS = [
  "faen", "faan", "fanden", "satan", "satans", "helvete", "hælvete", "haelvete", "jævel", "javel", "jævla", "javla", "jævlig", "javlig", "dritt", "drit", "driten", "drittsekk", "shit", "sh1t", "bæsj", "baesj", "bajs", "tiss", "piss", "promp", "fjesing", "ræv", "raev", "rompe", "rumpe", "idiot", "dust", "dumming", "taper", "loser", "mongo", "retard", "teit", "stygg", "styggen", "feit", "fett", "dum", "hater", "mobber", "slem", "ekkel", "ekkelt", "creep", "sex", "sexy", "porno", "porn", "naken", "nude", "penis", "pikk", "p1kk", "kuk", "kukk", "fitte", "f1tte", "vagina", "pupp", "pupper", "boobs", "boob", "tits", "hore", "h0re", "slut", "dildo", "sug", "suge", "suger", "blowjob", "handjob", "cum", "cumming", "orgasme", "fuck", "fck", "fuk", "fucker", "fucking", "motherfucker", "bitch", "btch", "asshole", "bastard", "damn", "crap", "dick", "cock", "pussy", "whore", "kill", "killer", "killing", "drep", "drepe", "dreper", "mord", "morder", "myrd", "death", "die", "dead", "blod", "blood", "kniv", "knife", "gun", "guns", "våpen", "vapen", "bomb", "bombe", "skyte", "skyt", "shoot", "nazi", "nazist", "hitler", "rasist", "racist", "terror", "terrorist", "isis", "kkk", "alkohol", "drunk", "vodka", "beer", "dop", "drug", "drugs", "weed", "hasj", "hash", "røyk", "royk", "snus", "vape",
];
const BLOCKED_EXACT = ["ass", "tit", "poo", "pee", "die", "dum", "slem", "stygg", "feit", "teit"];
const PLAYER_NAME_MIN_LENGTH = 2;
const PLAYER_NAME_MAX_LENGTH = 24;
const PLAYER_NAME_INPUT_MAX_LENGTH = 32;
const PLAYER_NAME_MAX_PARTS = 3;
const PLAYER_NAME_ALLOWED_PATTERN = /^[A-Za-z0-9\u00C6\u00D8\u00C5\u00E6\u00F8\u00E5 -]+$/;
const PLAYER_NAME_VALID_MESSAGE = "Skriv et gyldig navn. Du kan bruke bokstaver, tall, bindestrek og ett mellomrom mellom navn.";

const supabase = SUPABASE_URL && SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
let modeBackgroundsPreloaded = false;

function parseAppSettingBoolean(value, fallback = true) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalizedValue = value.trim().toLowerCase();
    if (normalizedValue === "true") return true;
    if (normalizedValue === "false") return false;
  }
  if (typeof value === "number") return value !== 0;
  return fallback;
}

function parseAppSettingText(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

function normalizeRegnereisenAccessCode(value) {
  return parseAppSettingText(value, "").replace(/\D/g, "").slice(0, 4);
}

function getDefaultAnnouncementSettings() {
  return { enabled: false, title: "", message: "", version: "" };
}

function normalizeAnnouncementSettings(settings = {}) {
  return {
    enabled: Boolean(settings.enabled),
    title: parseAppSettingText(settings.title).trim(),
    message: parseAppSettingText(settings.message).trim(),
    version: parseAppSettingText(settings.version).trim(),
  };
}

function getAnnouncementDismissKey(announcement) {
  const normalized = normalizeAnnouncementSettings(announcement);
  if (normalized.version) return normalized.version;
  if (!normalized.message) return "";
  return `${normalized.title || ANNOUNCEMENT_DEFAULT_TITLE}::${normalized.message}`;
}

function readDismissedAnnouncementKey() {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(ANNOUNCEMENT_DISMISSED_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

function writeDismissedAnnouncementKey(versionKey) {
  if (typeof window === "undefined" || !versionKey) return;
  try {
    window.localStorage.setItem(ANNOUNCEMENT_DISMISSED_STORAGE_KEY, versionKey);
  } catch {
    // localStorage can be unavailable in private or restricted browser contexts.
  }
}

function readLocalAnnouncementSettings() {
  if (typeof window === "undefined") return getDefaultAnnouncementSettings();
  try {
    const raw = window.localStorage.getItem(ANNOUNCEMENT_LOCAL_SETTINGS_KEY);
    return raw ? normalizeAnnouncementSettings(JSON.parse(raw)) : getDefaultAnnouncementSettings();
  } catch {
    return getDefaultAnnouncementSettings();
  }
}

function writeLocalAnnouncementSettings(settings) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ANNOUNCEMENT_LOCAL_SETTINGS_KEY, JSON.stringify(normalizeAnnouncementSettings(settings)));
  } catch {
    // localStorage fallback is best-effort only.
  }
}

function readLocalRegnereisenAccessCode() {
  if (typeof window === "undefined") return "";
  try {
    return normalizeRegnereisenAccessCode(window.localStorage.getItem(REGNEREISEN_ACCESS_CODE_LOCAL_SETTINGS_KEY) || "");
  } catch {
    return "";
  }
}

function writeLocalRegnereisenAccessCode(code) {
  if (typeof window === "undefined") return;
  try {
    const cleanCode = normalizeRegnereisenAccessCode(code);
    if (cleanCode) {
      window.localStorage.setItem(REGNEREISEN_ACCESS_CODE_LOCAL_SETTINGS_KEY, cleanCode);
    } else {
      window.localStorage.removeItem(REGNEREISEN_ACCESS_CODE_LOCAL_SETTINGS_KEY);
    }
  } catch {
    // localStorage fallback is best-effort only.
  }
}

function readRegnereisenUnlockedCode() {
  if (typeof window === "undefined") return "";
  try {
    return normalizeRegnereisenAccessCode(window.localStorage.getItem(REGNEREISEN_ACCESS_GRANTED_STORAGE_KEY) || "");
  } catch {
    return "";
  }
}

function writeRegnereisenUnlockedCode(code) {
  if (typeof window === "undefined") return;
  try {
    const cleanCode = normalizeRegnereisenAccessCode(code);
    if (cleanCode) {
      window.localStorage.setItem(REGNEREISEN_ACCESS_GRANTED_STORAGE_KEY, cleanCode);
    } else {
      window.localStorage.removeItem(REGNEREISEN_ACCESS_GRANTED_STORAGE_KEY);
    }
  } catch {
    // localStorage preview access is best-effort only.
  }
}

function readBossLadderUnlocks() {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(window.localStorage.getItem(BOSS_LADDER_UNLOCK_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeBossLadderUnlocks(unlocks) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(BOSS_LADDER_UNLOCK_KEY, JSON.stringify(unlocks));
  } catch {
    // localStorage progress is best-effort only.
  }
}

function resetBossLadderUnlocks() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(BOSS_LADDER_UNLOCK_KEY);
  } catch {
    // localStorage progress is best-effort only.
  }
}

function isBossLadderUnlocked(boss, unlocks) {
  const unlockKeys = [boss.unlockKey, boss.legacyUnlockKey].filter(Boolean);
  return Boolean(boss.unlockedByDefault || unlockKeys.some((key) => unlocks?.[key]));
}

function getDefaultRegnereisenProgress() {
  return {
    currentPlaceId: REGNEREISEN_PLACES[0].id,
    completedPlaceIds: [],
    slimKeyPlaceIds: [],
    slimBossDefeated: false,
    slimCrystalCollected: false,
    slimmyraMapCompleted: false,
  };
}

function normalizeRegnereisenProgress(progress) {
  if (!progress || typeof progress !== "object") return getDefaultRegnereisenProgress();
  const validPlaceIds = new Set(REGNEREISEN_PLACES.map((place) => place.id));
  const completedPlaceIdList = Array.isArray(progress.completedPlaceIds)
    ? progress.completedPlaceIds.filter((placeId, index, list) => validPlaceIds.has(placeId) && list.indexOf(placeId) === index)
    : [];
  const completedPlaceIds = new Set(completedPlaceIdList);
  const slimKeyPlaceIds = new Set(
    Array.isArray(progress.slimKeyPlaceIds)
      ? progress.slimKeyPlaceIds.filter((placeId) => REGNEREISEN_SLIM_KEY_PLACE_IDS.includes(placeId))
      : []
  );

  REGNEREISEN_SLIM_KEY_PLACE_IDS.forEach((placeId) => {
    if (completedPlaceIds.has(placeId)) slimKeyPlaceIds.add(placeId);
  });

  const slimBossDefeated = Boolean(progress.slimBossDefeated || completedPlaceIds.has("slimmyra"));
  if (slimBossDefeated) {
    REGNEREISEN_SLIM_KEY_PLACE_IDS.forEach((placeId) => {
      completedPlaceIds.add(placeId);
      slimKeyPlaceIds.add(placeId);
    });
    completedPlaceIds.add("slimmyra");
  }

  const normalizedCompletedPlaceIds = REGNEREISEN_PLACES
    .filter((place) => completedPlaceIds.has(place.id))
    .map((place) => place.id);
  const normalizedSlimKeyPlaceIds = REGNEREISEN_SLIM_KEY_PLACE_IDS.filter((placeId) => slimKeyPlaceIds.has(placeId));
  const requestedCurrentPlaceId = validPlaceIds.has(progress.currentPlaceId) ? progress.currentPlaceId : "";
  const requestedCurrentIndex = REGNEREISEN_PLACES.findIndex((place) => place.id === requestedCurrentPlaceId);
  const requestedCurrentIsOpen = requestedCurrentIndex >= 0 && (requestedCurrentIndex === 0 || completedPlaceIds.has(REGNEREISEN_PLACES[requestedCurrentIndex - 1].id));
  const requestedCurrentIsUsable = requestedCurrentIsOpen && (!completedPlaceIds.has(requestedCurrentPlaceId) || normalizedCompletedPlaceIds.length === REGNEREISEN_PLACES.length);
  const fallbackPlace = REGNEREISEN_PLACES.find((place) => !completedPlaceIds.has(place.id)) || REGNEREISEN_PLACES[REGNEREISEN_PLACES.length - 1];
  const slimCrystalCollected = Boolean(progress.slimCrystalCollected || slimBossDefeated || progress.slimmyraMapCompleted);
  const slimmyraMapCompleted = Boolean(progress.slimmyraMapCompleted || slimBossDefeated || completedPlaceIds.has("slimmyra"));

  return {
    currentPlaceId: requestedCurrentIsUsable ? requestedCurrentPlaceId : fallbackPlace.id,
    completedPlaceIds: normalizedCompletedPlaceIds,
    slimKeyPlaceIds: normalizedSlimKeyPlaceIds,
    slimBossDefeated,
    slimCrystalCollected,
    slimmyraMapCompleted,
  };
}

function readRegnereisenProgress() {
  if (typeof window === "undefined") return getDefaultRegnereisenProgress();
  try {
    return normalizeRegnereisenProgress(JSON.parse(window.localStorage.getItem(REGNEREISEN_PROGRESS_KEY) || "null"));
  } catch {
    return getDefaultRegnereisenProgress();
  }
}

function writeRegnereisenProgress(progress) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(REGNEREISEN_PROGRESS_KEY, JSON.stringify(normalizeRegnereisenProgress(progress)));
  } catch {
    // localStorage progress is best-effort only.
  }
}

function resetRegnereisenProgress() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(REGNEREISEN_PROGRESS_KEY);
  } catch {
    // localStorage progress is best-effort only.
  }
}

function getRegnereisenToken(tokenId) {
  return REGNEREISEN_TOKENS.find((token) => token.id === tokenId) || null;
}

function readRegnereisenTokenId() {
  if (typeof window === "undefined") return "";
  try {
    const tokenId = window.localStorage.getItem(REGNEREISEN_TOKEN_KEY) || "";
    return getRegnereisenToken(tokenId)?.id || "";
  } catch {
    return "";
  }
}

function writeRegnereisenTokenId(tokenId) {
  if (typeof window === "undefined") return;
  const token = getRegnereisenToken(tokenId);
  if (!token) return;
  try {
    window.localStorage.setItem(REGNEREISEN_TOKEN_KEY, token.id);
  } catch {
    // localStorage token choice is best-effort only.
  }
}

async function loadSchoolBattleEnabledSetting(fallback = true) {
  if (!supabase) return fallback;
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", SCHOOL_BATTLE_SETTING_KEY)
    .maybeSingle();
  if (error) throw new Error(error.message || "Kunne ikke hente Skolekampen-status.");
  return parseAppSettingBoolean(data?.value, fallback);
}

async function loadRegnereisenAccessCode() {
  const localCode = readLocalRegnereisenAccessCode();
  if (!supabase) return localCode;
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", REGNEREISEN_ACCESS_CODE_SETTING_KEY)
    .maybeSingle();
  if (error) throw new Error(error.message || "Kunne ikke hente Regnereisen-kode.");
  return normalizeRegnereisenAccessCode(data?.value) || localCode;
}

async function loadAnnouncementSettings() {
  if (!supabase) return readLocalAnnouncementSettings();
  const { data, error } = await supabase
    .from("app_settings")
    .select("key,value")
    .in("key", ANNOUNCEMENT_SETTING_KEYS);
  if (error) throw new Error(error.message || "Kunne ikke hente startsidebeskjed.");

  const values = new Map((data || []).map((entry) => [entry.key, entry.value]));
  return normalizeAnnouncementSettings({
    enabled: parseAppSettingBoolean(values.get(ANNOUNCEMENT_ENABLED_KEY), false),
    title: parseAppSettingText(values.get(ANNOUNCEMENT_TITLE_KEY), ""),
    message: parseAppSettingText(values.get(ANNOUNCEMENT_MESSAGE_KEY), ""),
    version: parseAppSettingText(values.get(ANNOUNCEMENT_VERSION_KEY), ""),
  });
}

function preloadModeBackgrounds() {
  if (modeBackgroundsPreloaded || typeof window === "undefined" || typeof window.Image !== "function") return;
  modeBackgroundsPreloaded = true;
  MODE_BACKGROUND_URLS.forEach((src) => {
    const image = new window.Image();
    image.decoding = "async";
    image.src = src;
  });
}

function normalizePlayerName(name) {
  return String(name ?? "").trim().replace(/ +/g, " ");
}

function normalizeVisibleNameForCheck(name) {
  return normalizePlayerName(name).toLowerCase();
}

function normalizeNameForCheck(name) {
  return String(name ?? "")
    .toLowerCase()
    .replace(/\u00E6/g, "ae")
    .replace(/\u00F8/g, "o")
    .replace(/\u00E5/g, "a")
    .replaceAll("0", "o")
    .replaceAll("1", "i")
    .replaceAll("!", "i")
    .replaceAll("3", "e")
    .replaceAll("4", "a")
    .replaceAll("@", "a")
    .replaceAll("5", "s")
    .replaceAll("$", "s")
    .replaceAll("7", "t")
    .replace(/[^a-z0-9]/g, "");
}

function hasBlockedPlayerName(cleanName) {
  const visibleName = normalizeVisibleNameForCheck(cleanName);
  const compactName = normalizeNameForCheck(cleanName);
  const hasBlockedContainsWord = BLOCKED_CONTAINS.some((word) => {
    const visibleWord = normalizeVisibleNameForCheck(word);
    const compactWord = normalizeNameForCheck(word);
    return (visibleWord && visibleName.includes(visibleWord)) || (compactWord && compactName.includes(compactWord));
  });
  const hasBlockedExactWord = BLOCKED_EXACT.some((word) => {
    const visibleWord = normalizeVisibleNameForCheck(word);
    const compactWord = normalizeNameForCheck(word);
    return (visibleWord && visibleName === visibleWord) || (compactWord && compactName === compactWord);
  });
  return hasBlockedContainsWord || hasBlockedExactWord;
}

function validatePlayerName(name) {
  const cleanName = normalizePlayerName(name);
  if (cleanName.length < PLAYER_NAME_MIN_LENGTH) return "Spillnavnet må ha minst 2 tegn.";
  if (cleanName.length > PLAYER_NAME_MAX_LENGTH) return "Spillnavnet kan maks ha 24 tegn.";
  if (/^\d+$/.test(cleanName.replace(/[ -]/g, ""))) return "Spillnavnet kan ikke bare være tall.";
  if (hasBlockedPlayerName(cleanName)) return "Velg et annet spillnavn. Bruk et hyggelig navn.";
  if (!PLAYER_NAME_ALLOWED_PATTERN.test(cleanName)) return PLAYER_NAME_VALID_MESSAGE;

  const nameParts = cleanName.split(" ");
  if (nameParts.length > PLAYER_NAME_MAX_PARTS) return PLAYER_NAME_VALID_MESSAGE;
  const hasInvalidPart = nameParts.some((part) => {
    const isShortNumber = /^\d+$/.test(part);
    return (!isShortNumber && part.length < 2) || part.startsWith("-") || part.endsWith("-") || part.includes("--");
  });
  if (hasInvalidPart) return PLAYER_NAME_VALID_MESSAGE;

  return "";
}

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function isTimeChallengeMode(mode) {
  return mode === "addition" || mode === "subtraction";
}

function formatTime(totalSeconds) {
  const safeSeconds = Math.max(0, Number(totalSeconds) || 0);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  if (minutes <= 0) return `${seconds} sek`;
  return `${minutes} min ${String(seconds).padStart(2, "0")} sek`;
}

function scrollToGameTop(target = null) {
  if (typeof window === "undefined") return;
  const doc = window.document;
  const scroll = () => {
    if (target?.scrollIntoView) {
      target.scrollIntoView({ block: "start", inline: "nearest", behavior: "auto" });
      return;
    }
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    if (doc?.scrollingElement) doc.scrollingElement.scrollTop = 0;
    if (doc?.documentElement) doc.documentElement.scrollTop = 0;
    if (doc?.body) doc.body.scrollTop = 0;
  };
  const frame = typeof window.requestAnimationFrame === "function"
    ? (callback) => window.requestAnimationFrame(callback)
    : (callback) => setTimeout(callback, 0);

  scroll();
  setTimeout(scroll, 0);
  frame(() => frame(scroll));
  setTimeout(scroll, 80);
  setTimeout(scroll, 180);
}

function scrollToTopNow(target = null) {
  scrollToGameTop(target);
}

function getBossConfig(bossId) {
  return BOSS_OPTIONS.find((boss) => boss.id === bossId) || BOSS_OPTIONS[0];
}

function getBossCardImageSrc(bossId) {
  if (bossId === "troll") return TROLL_BOSS_ASSETS.states.idle;
  if (bossId === "shadow") return SHADOW_GOLEM_ASSETS.states.idle;
  if (bossId === "isdragen") return ISDRAGEN_ASSETS.states.idle;
  if (bossId === "lavakjempen") return LAVAKJEMPEN_ASSETS.states.idle;
  if (bossId === "stormornen") return STORMORNEN_ASSETS.states.idle;
  if (bossId === "krystallvokteren") return KRYSTALLVOKTEREN_ASSETS.states.idle;
  if (bossId === "mekamaskinen") return MEKAMASKINEN_ASSETS.states.idle;
  if (bossId === "morkekraken") return MORKEKRAKEN_ASSETS.states.idle;
  if (bossId === "regnemesteren") return REGNEMESTEREN_ASSETS.states.idle;
  if (bossId === MEGA_REGNEMESTEREN_ID) return MEGA_REGNEMESTEREN_ASSETS.states.idle;
  return SLIME_BOSS_ASSETS.states.idle;
}

function getBossTreasureSize(boss) {
  const ladderEntry = BOSS_LADDER.find((item) => item.id === boss?.id);
  if (ladderEntry?.order > 3) {
    return BOSS_OPTIONS.find((item) => item.id === "shadow")?.treasureSize || "large";
  }
  return boss?.treasureSize || "small";
}

function getBossDamage(streak) {
  if (streak >= 5) return 2;
  return 1;
}

function getBossAttackName(bossId) {
  if (bossId === "troll") return "Trollslag!";
  if (bossId === MEGA_REGNEMESTEREN_ID) return "Megastøt!";
  if (bossId === "regnemesteren") return "Mesterstøt!";
  if (bossId === "morkekraken") return "Dypvannsslag!";
  if (bossId === "mekamaskinen") return "Tannhjulsangrep!";
  if (bossId === "krystallvokteren") return "Krystallslag!";
  if (bossId === "stormornen") return "Tordenklør!";
  if (bossId === "lavakjempen") return "Lavabrøl!";
  if (bossId === "isdragen") return "Frostpust!";
  if (bossId === "shadow" || bossId === "dragon") return "Skyggestøt!";
  return "Slimsprut!";
}

function getBossIntroText(bossId) {
  if (bossId === "troll") return "Trollkongen tramper inn!";
  if (bossId === MEGA_REGNEMESTEREN_ID) return "Mega Regnemesteren reiser seg!";
  if (bossId === "regnemesteren") return "Regnemesteren venter i den siste arenaen!";
  if (bossId === "morkekraken") return "Mørkekraken stiger opp fra Dypvannshavet!";
  if (bossId === "mekamaskinen") return "Mekamaskinen durer inn fra Tannhjulsbyen!";
  if (bossId === "krystallvokteren") return "Krystallvokteren vokter Krystallgrotten!";
  if (bossId === "stormornen") return "Stormørnen stuper ned fra Tordentoppen!";
  if (bossId === "lavakjempen") return "Lavakjempen gløder i Vulkanringen!";
  if (bossId === "isdragen") return "Isdragen blåser kald luft fra Frostfjellene!";
  if (bossId === "shadow" || bossId === "dragon") return "Skyggegolemen samler mørk energi!";
  return "Slimbossen bobler fram!";
}

function getBossMood(hpPercent = 100) {
  if (hpPercent <= 0) return "defeated";
  if (hpPercent < 40) return "weak";
  if (hpPercent <= 70) return "angry";
  return "confident";
}

function getSlimeBossVisualState({ hpPercent = 100, action = "idle", defeated = false } = {}) {
  if (defeated || hpPercent <= 0 || action === "defeat") return "defeated";
  if (action === "hit") return "hurt1";
  if (action === "attack") return "attack";
  if (hpPercent <= 40) return "lowHp";
  return "idle";
}

function getTrollBossVisualState({ hpPercent = 100, action = "idle", defeated = false } = {}) {
  if (defeated || hpPercent <= 0 || action === "defeat") return "defeated";
  if (action === "hit") return "hurt1";
  if (action === "attack") return "attack";
  if (hpPercent <= 40) return "lowHp";
  return "idle";
}

function getShadowGolemVisualState({ hpPercent = 100, action = "idle", defeated = false } = {}) {
  if (defeated || hpPercent <= 0 || action === "defeat") return "defeated";
  if (action === "hit") return "hurt1";
  if (action === "attack") return "attack";
  if (hpPercent <= 40) return "lowHp";
  return "idle";
}

function getIsdragenVisualState({ hpPercent = 100, action = "idle", defeated = false } = {}) {
  if (defeated || hpPercent <= 0 || action === "defeat") return "defeated";
  if (action === "hit") return "hurt1";
  if (action === "attack") return "attack";
  if (hpPercent <= 40) return "lowHp";
  return "idle";
}

function getLavakjempenVisualState({ hpPercent = 100, action = "idle", defeated = false } = {}) {
  if (defeated || hpPercent <= 0 || action === "defeat") return "defeated";
  if (action === "hit") return "hurt1";
  if (action === "attack") return "attack";
  if (hpPercent <= 40) return "lowHp";
  return "idle";
}

function getStormornenVisualState({ hpPercent = 100, action = "idle", defeated = false } = {}) {
  if (defeated || hpPercent <= 0 || action === "defeat") return "defeated";
  if (action === "hit") return "hurt1";
  if (action === "attack") return "attack";
  if (hpPercent <= 40) return "lowHp";
  return "idle";
}

function getKrystallvokterenVisualState({ hpPercent = 100, action = "idle", defeated = false } = {}) {
  if (defeated || hpPercent <= 0 || action === "defeat") return "defeated";
  if (action === "hit") return "hurt1";
  if (action === "attack") return "attack";
  if (hpPercent <= 40) return "lowHp";
  return "idle";
}

function getMekamaskinenVisualState({ hpPercent = 100, action = "idle", defeated = false } = {}) {
  if (defeated || hpPercent <= 0 || action === "defeat") return "defeated";
  if (action === "hit") return "hurt1";
  if (action === "attack") return "attack";
  if (hpPercent <= 40) return "lowHp";
  return "idle";
}

function getMorkekrakenVisualState({ hpPercent = 100, action = "idle", defeated = false } = {}) {
  if (defeated || hpPercent <= 0 || action === "defeat") return "defeated";
  if (action === "hit") return "hurt1";
  if (action === "attack") return "attack";
  if (hpPercent <= 40) return "lowHp";
  return "idle";
}

function getRegnemesterenVisualState({ hpPercent = 100, action = "idle", defeated = false } = {}) {
  if (defeated || hpPercent <= 0 || action === "defeat") return "defeated";
  if (action === "hit") return "hurt1";
  if (action === "attack") return "attack";
  if (hpPercent <= 40) return "lowHp";
  return "idle";
}

function getMegaRegnemesterenVisualState({ hpPercent = 100, action = "idle", defeated = false } = {}) {
  if (defeated || hpPercent <= 0 || action === "defeat") return "defeated";
  if (action === "hit") return "hurt1";
  if (action === "attack") return "attack";
  if (hpPercent <= 40) return "lowHp";
  return "idle";
}

function getBossArenaStyle(boss) {
  if (boss?.id === MEGA_REGNEMESTEREN_ID && MEGA_REGNEMESTEREN_ASSETS.panelBackground) {
    return {
      backgroundColor: "#020617",
      backgroundImage: `linear-gradient(180deg, rgba(250,204,21,.18), rgba(88,28,135,.08) 46%, rgba(2,6,23,.26)), url("${MEGA_REGNEMESTEREN_ASSETS.panelBackground}"), ${boss.gradient}`,
      backgroundPosition: "center 52%",
      backgroundRepeat: "no-repeat",
      backgroundSize: "cover",
    };
  }
  if (boss?.id === "regnemesteren" && REGNEMESTEREN_ASSETS.panelBackground) {
    return {
      backgroundColor: "#1e1b4b",
      backgroundImage: `linear-gradient(180deg, rgba(254,243,199,.16), rgba(30,27,75,.04) 48%, rgba(15,23,42,.22)), url("${REGNEMESTEREN_ASSETS.panelBackground}"), ${boss.gradient}`,
      backgroundPosition: "center 55%",
      backgroundRepeat: "no-repeat",
      backgroundSize: "cover",
    };
  }
  if (boss?.id === "morkekraken" && MORKEKRAKEN_ASSETS.panelBackground) {
    return {
      backgroundColor: "#0f172a",
      backgroundImage: `linear-gradient(180deg, rgba(34,211,238,.16), rgba(15,23,42,.04) 48%, rgba(2,6,23,.24)), url("${MORKEKRAKEN_ASSETS.panelBackground}"), ${boss.gradient}`,
      backgroundPosition: "center 56%",
      backgroundRepeat: "no-repeat",
      backgroundSize: "cover",
    };
  }
  if (boss?.id === "mekamaskinen" && MEKAMASKINEN_ASSETS.panelBackground) {
    return {
      backgroundColor: "#334155",
      backgroundImage: `linear-gradient(180deg, rgba(248,250,252,.18), rgba(15,23,42,.04) 48%, rgba(15,23,42,.2)), url("${MEKAMASKINEN_ASSETS.panelBackground}"), ${boss.gradient}`,
      backgroundPosition: "center 55%",
      backgroundRepeat: "no-repeat",
      backgroundSize: "cover",
    };
  }
  if (boss?.id === "krystallvokteren" && KRYSTALLVOKTEREN_ASSETS.panelBackground) {
    return {
      backgroundColor: "#312e81",
      backgroundImage: `linear-gradient(180deg, rgba(236,254,255,.18), rgba(49,46,129,.04) 48%, rgba(49,46,129,.18)), url("${KRYSTALLVOKTEREN_ASSETS.panelBackground}"), ${boss.gradient}`,
      backgroundPosition: "center 55%",
      backgroundRepeat: "no-repeat",
      backgroundSize: "cover",
    };
  }
  if (boss?.id === "stormornen" && STORMORNEN_ASSETS.panelBackground) {
    return {
      backgroundColor: "#0f172a",
      backgroundImage: `linear-gradient(180deg, rgba(219,234,254,.2), rgba(15,23,42,.04) 48%, rgba(15,23,42,.18)), url("${STORMORNEN_ASSETS.panelBackground}"), ${boss.gradient}`,
      backgroundPosition: "center 54%",
      backgroundRepeat: "no-repeat",
      backgroundSize: "cover",
    };
  }
  if (boss?.id === "lavakjempen" && LAVAKJEMPEN_ASSETS.panelBackground) {
    return {
      backgroundColor: "#451a03",
      backgroundImage: `linear-gradient(180deg, rgba(254,215,170,.2), rgba(69,26,3,.04) 48%, rgba(69,26,3,.18)), url("${LAVAKJEMPEN_ASSETS.panelBackground}"), ${boss.gradient}`,
      backgroundPosition: "center 55%",
      backgroundRepeat: "no-repeat",
      backgroundSize: "cover",
    };
  }
  if (boss?.id === "isdragen" && ISDRAGEN_ASSETS.panelBackground) {
    return {
      backgroundColor: "#dbeafe",
      backgroundImage: `linear-gradient(180deg, rgba(240,249,255,.18), rgba(14,165,233,.06) 48%, rgba(15,23,42,.1)), url("${ISDRAGEN_ASSETS.panelBackground}"), ${boss.gradient}`,
      backgroundPosition: "center 54%",
      backgroundRepeat: "no-repeat",
      backgroundSize: "cover",
    };
  }
  if (boss?.id === "shadow" && SHADOW_GOLEM_ASSETS.panelBackground) {
    return {
      backgroundColor: "#312e81",
      backgroundImage: `linear-gradient(180deg, rgba(238,242,255,.14), rgba(15,23,42,.04) 48%, rgba(2,6,23,.16)), url("${SHADOW_GOLEM_ASSETS.panelBackground}"), ${boss.gradient}`,
      backgroundPosition: "center 56%",
      backgroundRepeat: "no-repeat",
      backgroundSize: "cover",
    };
  }
  if (boss?.id === "troll" && TROLL_BOSS_ASSETS.panelBackground) {
    return {
      backgroundColor: "#92400e",
      backgroundImage: `linear-gradient(180deg, rgba(255,251,235,.12), rgba(68,64,60,.08)), url("${TROLL_BOSS_ASSETS.panelBackground}"), ${boss.gradient}`,
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      backgroundSize: "cover",
    };
  }
  if (boss?.id !== "slime") return { background: boss?.gradient };
  return {
    backgroundColor: "#86efac",
    backgroundImage: `linear-gradient(180deg, rgba(240,253,244,.16), rgba(22,101,52,.04)), url("${SLIME_BOSS_ASSETS.panelBackground}"), ${boss.gradient}`,
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
  };
}

function getBossPageStyle(bossId) {
  if (bossId === MEGA_REGNEMESTEREN_ID) {
    return {
      backgroundColor: "#020617",
      backgroundImage: "radial-gradient(circle at 50% 8%, rgba(250,204,21,.3), transparent 30%), radial-gradient(circle at 16% 24%, rgba(217,70,239,.24), transparent 26%), radial-gradient(circle at 86% 28%, rgba(124,58,237,.22), transparent 28%), linear-gradient(180deg, rgba(30,27,75,.44), rgba(2,6,23,.2)), linear-gradient(135deg, #020617, #312e81 48%, #7e22ce)",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      backgroundSize: "cover",
    };
  }
  if (bossId === "regnemesteren") {
    return {
      backgroundColor: "#1e1b4b",
      backgroundImage: "radial-gradient(circle at 50% 8%, rgba(250,204,21,.28), transparent 32%), radial-gradient(circle at 16% 24%, rgba(167,139,250,.22), transparent 26%), linear-gradient(180deg, rgba(49,46,129,.36), rgba(15,23,42,.12)), linear-gradient(135deg, #111827, #312e81 48%, #7c3aed)",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      backgroundSize: "cover",
    };
  }
  if (bossId === "morkekraken") {
    return {
      backgroundColor: "#0f172a",
      backgroundImage: "radial-gradient(circle at 50% 8%, rgba(34,211,238,.28), transparent 32%), radial-gradient(circle at 16% 24%, rgba(14,165,233,.2), transparent 26%), linear-gradient(180deg, rgba(8,47,73,.34), rgba(15,23,42,.14)), linear-gradient(135deg, #020617, #0f172a 48%, #0891b2)",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      backgroundSize: "cover",
    };
  }
  if (bossId === "mekamaskinen") {
    return {
      backgroundColor: "#e2e8f0",
      backgroundImage: "radial-gradient(circle at 50% 8%, rgba(255,255,255,.62), transparent 32%), radial-gradient(circle at 18% 22%, rgba(250,204,21,.16), transparent 24%), linear-gradient(180deg, rgba(248,250,252,.84), rgba(71,85,105,.16)), linear-gradient(135deg, #f8fafc, #94a3b8 48%, #1e293b)",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      backgroundSize: "cover",
    };
  }
  if (bossId === "krystallvokteren") {
    return {
      backgroundColor: "#ede9fe",
      backgroundImage: "radial-gradient(circle at 50% 8%, rgba(255,255,255,.66), transparent 32%), radial-gradient(circle at 18% 22%, rgba(103,232,249,.2), transparent 24%), linear-gradient(180deg, rgba(245,243,255,.86), rgba(124,58,237,.16)), linear-gradient(135deg, #ecfeff, #c4b5fd 48%, #312e81)",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      backgroundSize: "cover",
    };
  }
  if (bossId === "stormornen") {
    return {
      backgroundColor: "#dbeafe",
      backgroundImage: "radial-gradient(circle at 50% 8%, rgba(255,255,255,.62), transparent 32%), radial-gradient(circle at 18% 20%, rgba(250,204,21,.18), transparent 24%), linear-gradient(180deg, rgba(219,234,254,.86), rgba(37,99,235,.18)), linear-gradient(135deg, #dbeafe, #60a5fa 48%, #1e3a8a)",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      backgroundSize: "cover",
    };
  }
  if (bossId === "lavakjempen") {
    return {
      backgroundColor: "#451a03",
      backgroundImage: "radial-gradient(circle at 50% 8%, rgba(254,215,170,.46), transparent 32%), radial-gradient(circle at 16% 22%, rgba(248,113,113,.24), transparent 27%), linear-gradient(180deg, rgba(127,29,29,.28), rgba(69,26,3,.1)), linear-gradient(135deg, #451a03, #991b1b 48%, #f97316)",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      backgroundSize: "cover",
    };
  }
  if (bossId === "isdragen") {
    return {
      backgroundColor: "#e0f2fe",
      backgroundImage: "radial-gradient(circle at 50% 7%, rgba(255,255,255,.72), transparent 34%), linear-gradient(180deg, rgba(240,249,255,.86), rgba(14,165,233,.16)), linear-gradient(135deg, #ecfeff, #bae6fd 48%, #dbeafe)",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      backgroundSize: "cover",
    };
  }
  if (bossId === "shadow") {
    return {
      backgroundColor: "#e0e7ff",
      backgroundImage: "linear-gradient(180deg, rgba(238,242,255,.82), rgba(99,102,241,.14)), linear-gradient(135deg, #e0e7ff, #c7d2fe 48%, #f8fafc)",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      backgroundSize: "cover",
    };
  }
  if (bossId === "troll") {
    return {
      backgroundColor: "#fef3c7",
      backgroundImage: "linear-gradient(180deg, rgba(255,251,235,.72), rgba(120,53,15,.1)), linear-gradient(135deg, #fef3c7, #fde68a 52%, #fafaf9)",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      backgroundSize: "cover",
    };
  }
  if (bossId !== "slime") return undefined;
  return {
    backgroundColor: "#dcfce7",
    backgroundImage: `linear-gradient(180deg, rgba(240,253,244,.72), rgba(34,197,94,.12)), url("${SLIME_BOSS_ASSETS.pageBackground}"), linear-gradient(135deg, #dcfce7, #86efac 52%, #f0fdf4)`,
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
  };
}

function preloadImageUrls(urls) {
  if (typeof window === "undefined" || typeof window.Image !== "function") return;
  urls.forEach((src) => {
    const image = new window.Image();
    image.decoding = "async";
    image.src = src;
  });
}

function getModeLabel(mode) {
  const symbol = getModeSymbol(mode);
  const name = getModeName(mode);
  return symbol ? `${name} (${symbol})` : name;
}

function getModeName(mode) {
  if (mode === "addition") return "Addisjon";
  if (mode === "subtraction") return "Subtraksjon";
  if (mode === "division") return "Divisjon";
  if (mode === MIXED_MODE) return "Blanding";
  return "Multiplikasjon";
}

function getModeSymbol(mode) {
  if (mode === "addition") return "+";
  if (mode === "subtraction") return "−";
  if (mode === "multiplication") return "×";
  if (mode === "division") return "÷";
  return "";
}

function getLevelLabel(level) {
  if (level === "easy") return "Lett";
  if (level === "hard") return "Vanskelig";
  return "Middels";
}

function getGradeLabel(gradeLevel) {
  if (Number(gradeLevel) === 8) return "Eldre";
  return `${gradeLevel}. klasse`;
}

function getGradeGroupLabel(gradeGroup) {
  if (gradeGroup === "middle") return "Mellomtrinn";
  return "Småtrinn";
}

function getSchoolBattleGradeGroup(gradeLevel) {
  const numericGrade = Number(gradeLevel);
  return numericGrade >= 5 ? "middle" : "small";
}

function getSchoolBattleGradeLevel(entryOrGrade) {
  const rawGrade = typeof entryOrGrade === "object" ? entryOrGrade?.grade_level : entryOrGrade;
  const numericGrade = Number(rawGrade);
  return SCHOOL_BATTLE_GRADE_OPTIONS.includes(numericGrade) ? numericGrade : 0;
}

function getSchoolBattleClassLabel(entryOrGrade) {
  const gradeLevel = getSchoolBattleGradeLevel(entryOrGrade);
  return gradeLevel > 0 ? `${gradeLevel}. klasse` : "Ukjent klasse";
}

function getLevelMax(level = "medium", mode = "multiplication") {
  if (mode === "addition" || mode === "subtraction") {
    if (level === "easy") return 20;
    if (level === "hard") return 1000;
    return 100;
  }
  if (level === "easy") return mode === "division" ? 5 : 5;
  if (level === "hard") return mode === "division" ? 20 : 20;
  return mode === "division" ? 10 : 10;
}

function getLevelDescription(mode, level) {
  if (mode === MIXED_MODE) return `${getLevelLabel(level)}: oppgaver fra +, −, × og ÷`;
  const max = getLevelMax(level, mode);
  if (mode === "addition") return `${getLevelLabel(level)}: addisjon med svar fra 0–${max}`;
  if (mode === "subtraction") return `${getLevelLabel(level)}: subtraksjon uten minus, tall fra 0–${max}`;
  if (mode === "division") return `${getLevelLabel(level)}: deling med tall fra 1–${max}`;
  return `${getLevelLabel(level)}: gangestykker fra 0–${max}`;
}

function getGameSeconds(gameType) {
  return gameType === "school_battle" ? SCHOOL_BATTLE_SECONDS : NORMAL_GAME_SECONDS;
}

function getHighscoreTitle(mode, level, gradeLevel, questionCount = 10) {
  const baseTitle = `${getGradeLabel(gradeLevel)} - ${getModeLabel(mode)} - ${getLevelLabel(level)}`;
  if (isTimeChallengeMode(mode)) return `${baseTitle} - ${questionCount} oppgaver - Topp 10`;
  return `${baseTitle} - Topp 10`;
}

function getNormalAdminQuestionCount(entry) {
  const count = Number(entry?.question_count || 0);
  return count > 0 ? count : 10;
}

function normalizeNormalAdminScore(entry) {
  const mode = entry?.mode || "multiplication";
  const isTimed = isTimeChallengeMode(mode);
  return {
    id: entry?.id,
    name: typeof entry?.name === "string" ? entry.name : "",
    score: Number(entry?.score),
    mode,
    level: entry?.level || "medium",
    grade_level: Number(entry?.grade_level || 4),
    game_type: "normal",
    question_count: isTimed ? getNormalAdminQuestionCount(entry) : 0,
  };
}

function sortNormalAdminEntries(entries, mode) {
  const isTimed = isTimeChallengeMode(mode);
  return [...entries].sort((a, b) => (isTimed ? Number(a.score) - Number(b.score) : Number(b.score) - Number(a.score)));
}

function getNormalAdminGroupKey(entry) {
  const isTimed = isTimeChallengeMode(entry.mode);
  const questionPart = isTimed ? getNormalAdminQuestionCount(entry) : "score";
  return `${entry.grade_level}-${entry.mode}-${entry.level}-${questionPart}`;
}

function getNormalAdminGroupTitle(group) {
  const baseTitle = `${getGradeLabel(group.gradeLevel)} · ${getModeLabel(group.mode)} · ${getLevelLabel(group.level)}`;
  if (isTimeChallengeMode(group.mode)) return `${baseTitle} · ${group.questionCount} oppgaver`;
  return baseTitle;
}

function buildNormalAdminGroups(entries, filters = {}) {
  const searchTerm = (filters.search || "").trim().toLowerCase();
  const gradeFilter = filters.grade ?? ALL_FILTER_VALUE;
  const modeFilter = filters.mode ?? ALL_FILTER_VALUE;
  const levelFilter = filters.level ?? ALL_FILTER_VALUE;
  const questionCountFilter = filters.questionCount ?? ALL_FILTER_VALUE;
  const grouped = new Map();

  entries
    .map(normalizeNormalAdminScore)
    .filter((entry) => entry.name && Number.isFinite(entry.score))
    .forEach((entry) => {
      if (gradeFilter !== ALL_FILTER_VALUE && Number(entry.grade_level) !== Number(gradeFilter)) return;
      if (modeFilter !== ALL_FILTER_VALUE && entry.mode !== modeFilter) return;
      if (levelFilter !== ALL_FILTER_VALUE && entry.level !== levelFilter) return;
      if (questionCountFilter !== ALL_FILTER_VALUE && isTimeChallengeMode(entry.mode) && Number(entry.question_count) !== Number(questionCountFilter)) return;
      if (questionCountFilter !== ALL_FILTER_VALUE && !isTimeChallengeMode(entry.mode)) return;
      if (searchTerm && !entry.name.toLowerCase().includes(searchTerm)) return;

      const key = getNormalAdminGroupKey(entry);
      if (!grouped.has(key)) {
        grouped.set(key, {
          key,
          gradeLevel: entry.grade_level,
          mode: entry.mode,
          level: entry.level,
          questionCount: isTimeChallengeMode(entry.mode) ? getNormalAdminQuestionCount(entry) : null,
          entries: [],
        });
      }
      grouped.get(key).entries.push(entry);
    });

  return [...grouped.values()]
    .map((group) => ({ ...group, entries: sortNormalAdminEntries(group.entries, group.mode) }))
    .sort((a, b) => {
      if (a.gradeLevel !== b.gradeLevel) return a.gradeLevel - b.gradeLevel;
      const modeDiff = MODE_ORDER.indexOf(a.mode) - MODE_ORDER.indexOf(b.mode);
      if (modeDiff !== 0) return modeDiff;
      const levelDiff = LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level);
      if (levelDiff !== 0) return levelDiff;
      return Number(a.questionCount || 0) - Number(b.questionCount || 0);
    });
}

function getNormalAdminStats(entries) {
  const normalizedEntries = entries.map(normalizeNormalAdminScore).filter((entry) => entry.name && Number.isFinite(entry.score));
  const groups = buildNormalAdminGroups(normalizedEntries);
  const bestScoreEntry = normalizedEntries
    .filter((entry) => !isTimeChallengeMode(entry.mode))
    .sort((a, b) => Number(b.score) - Number(a.score))[0];
  const bestTimeEntry = normalizedEntries
    .filter((entry) => isTimeChallengeMode(entry.mode))
    .sort((a, b) => Number(a.score) - Number(b.score))[0];

  return {
    totalResults: normalizedEntries.length,
    activeLists: groups.length,
    bestScoreEntry,
    bestTimeEntry,
  };
}

function randomWrongAnswer(correct) {
  if (correct === 0) return randomInt(1, 20);
  const strategies = [correct + randomInt(-4, 4), correct + 10, correct - 10, correct + randomInt(1, 12), Math.max(1, correct - randomInt(1, 12))];
  return Math.max(0, strategies[randomInt(0, strategies.length - 1)]);
}

function randomDivisionWrongAnswer(correct, max = 10) {
  const nearbyCandidates = [correct - 4, correct - 3, correct - 2, correct - 1, correct + 1, correct + 2, correct + 3, correct + 4].filter(
    (value) => value >= 1 && value <= max && value !== correct
  );
  if (nearbyCandidates.length > 0) return nearbyCandidates[randomInt(0, nearbyCandidates.length - 1)];
  let candidate = correct;
  while (candidate === correct) candidate = randomInt(1, max);
  return candidate;
}

function makeOptions(correct, mode, max = 10) {
  const wrongs = new Set();
  while (wrongs.size < 3) {
    const candidate = mode === "division" ? randomDivisionWrongAnswer(correct, max) : randomWrongAnswer(correct);
    if (candidate !== correct) wrongs.add(candidate);
  }
  return shuffle([correct, ...wrongs]);
}

function makeMultiplicationQuestion(a, b) {
  const correct = a * b;
  return { mode: "multiplication", a, b, symbol: "×", correct, options: makeOptions(correct, "multiplication") };
}

function makeDivisionQuestion(divisor, answer, max = 10) {
  const dividend = divisor * answer;
  const correct = answer;
  return { mode: "division", a: dividend, b: divisor, symbol: "÷", correct, options: makeOptions(correct, "division", max) };
}

function makeAdditionQuestion(level = "medium") {
  const max = getLevelMax(level, "addition");
  const a = randomInt(0, max);
  const b = randomInt(0, max - a);
  const correct = a + b;
  return { mode: "addition", a, b, symbol: "+", correct, options: makeOptions(correct, "addition") };
}

function makeSubtractionQuestion(level = "medium") {
  const max = getLevelMax(level, "subtraction");
  const a = randomInt(0, max);
  const b = randomInt(0, a);
  const correct = a - b;
  return { mode: "subtraction", a, b, symbol: "−", correct, options: makeOptions(correct, "subtraction") };
}

function makeCalculationQuestion(mode, a, b) {
  const correct = mode === "addition" ? a + b : a - b;
  const symbol = mode === "addition" ? "+" : "−";
  return { mode, a, b, symbol, correct, options: makeOptions(correct, mode) };
}

function makeMixedQuestion(level = "medium") {
  const mode = MIXED_MODE_OPTIONS[randomInt(0, MIXED_MODE_OPTIONS.length - 1)];
  if (mode === "addition") return makeAdditionQuestion(level);
  if (mode === "subtraction") return makeSubtractionQuestion(level);
  const max = getLevelMax(level, mode);
  if (mode === "division") return makeDivisionQuestion(randomInt(1, max), randomInt(1, max), max);
  return makeMultiplicationQuestion(randomInt(0, max), randomInt(0, max));
}

function makeSchoolBattleCalculationQuestion(mode, gradeGroup = "small", category = randomInt(0, 4)) {
  if (gradeGroup === "middle") {
    if (mode === "addition") {
      if (category === 0) return makeCalculationQuestion(mode, randomInt(20, 99), randomInt(20, 99));
      if (category === 1) {
        const a = randomInt(100, 900);
        const b = randomInt(10, Math.min(99, 999 - a));
        return makeCalculationQuestion(mode, a, b);
      }
      if (category === 2) {
        const a = randomInt(100, 800);
        const b = randomInt(100, Math.min(999 - a, 899));
        return makeCalculationQuestion(mode, a, b);
      }
      if (category === 3) {
        const a = randomInt(1, 9) * 100;
        const b = randomInt(0, 10 - a / 100) * 100;
        return makeCalculationQuestion(mode, a, b);
      }
      const a = randomInt(100, 900);
      const b = randomInt(1, 999 - a);
      return makeCalculationQuestion(mode, a, b);
    }
    if (category === 0) return makeCalculationQuestion(mode, randomInt(40, 99), randomInt(20, 40));
    if (category === 1) {
      const a = randomInt(100, 999);
      const b = randomInt(10, Math.min(99, a));
      return makeCalculationQuestion(mode, a, b);
    }
    if (category === 2) {
      const a = randomInt(200, 999);
      const b = randomInt(100, a);
      return makeCalculationQuestion(mode, a, b);
    }
    if (category === 3) {
      const a = randomInt(2, 10) * 100;
      const b = randomInt(0, Math.floor(a / 100)) * 100;
      return makeCalculationQuestion(mode, a, b);
    }
    const a = randomInt(100, 999);
    const b = randomInt(1, a);
    return makeCalculationQuestion(mode, a, b);
  }
  if (mode === "addition") {
    if (category === 0) {
      const a = randomInt(0, 10);
      const b = randomInt(0, Math.min(9, 19 - a));
      return makeCalculationQuestion(mode, a, b);
    }
    if (category === 1) {
      const a = randomInt(5, 9);
      const b = randomInt(10 - a, 10);
      return makeCalculationQuestion(mode, a, b);
    }
    if (category === 2) {
      const a = randomInt(10, 95);
      const b = randomInt(1, Math.min(9, 99 - a));
      return makeCalculationQuestion(mode, a, b);
    }
    if (category === 3) {
      const a = randomInt(1, 9) * 10;
      const b = randomInt(0, 10 - a / 10) * 10;
      return makeCalculationQuestion(mode, a, b);
    }
    const a = randomInt(10, 80);
    const b = randomInt(10, 99 - a);
    return makeCalculationQuestion(mode, a, b);
  }
  if (category === 0) {
    const a = randomInt(1, 20);
    const b = randomInt(0, Math.min(10, a));
    return makeCalculationQuestion(mode, a, b);
  }
  if (category === 1) {
    const a = randomInt(11, 20);
    const minB = Math.min(a, (a % 10) + 1);
    const b = randomInt(minB, Math.min(a, 9));
    return makeCalculationQuestion(mode, a, b);
  }
  if (category === 2) {
    const a = randomInt(10, 99);
    const b = randomInt(1, Math.min(9, a));
    return makeCalculationQuestion(mode, a, b);
  }
  if (category === 3) {
    const a = randomInt(2, 10) * 10;
    const b = randomInt(0, Math.floor(a / 10)) * 10;
    return makeCalculationQuestion(mode, a, b);
  }
  const a = randomInt(20, 99);
  const b = randomInt(10, a);
  return makeCalculationQuestion(mode, a, b);
}

function createQuestionDeck(mode = "multiplication", level = "medium", gradeGroup = null) {
  const questions = [];
  const max = getLevelMax(level, mode);
  if (mode === MIXED_MODE) {
    for (let index = 0; index < 240; index += 1) questions.push(makeMixedQuestion(level));
    return shuffle(questions);
  }
  if ((mode === "addition" || mode === "subtraction") && gradeGroup) {
    for (let category = 0; category < 5; category += 1) {
      for (let index = 0; index < 5; index += 1) questions.push(makeSchoolBattleCalculationQuestion(mode, gradeGroup, category));
    }
    return shuffle(questions);
  }
  if (mode === "addition") {
    for (let index = 0; index < 200; index += 1) questions.push(makeAdditionQuestion(level));
    return shuffle(questions);
  }
  if (mode === "subtraction") {
    for (let index = 0; index < 200; index += 1) questions.push(makeSubtractionQuestion(level));
    return shuffle(questions);
  }
  if (mode === "division") {
    const answerMax = level === "easy" ? 10 : max;
    for (let divisor = 1; divisor <= max; divisor += 1) {
      for (let answer = 1; answer <= answerMax; answer += 1) questions.push(makeDivisionQuestion(divisor, answer, answerMax));
    }
    return shuffle(questions);
  }
  const multiplierMax = level === "easy" ? 10 : max;
  for (let a = 0; a <= max; a += 1) {
    for (let b = 0; b <= multiplierMax; b += 1) questions.push(makeMultiplicationQuestion(a, b));
  }
  return shuffle(questions);
}

function makeQuestion(mode = "multiplication", level = "medium") {
  const deck = createQuestionDeck(mode, level);
  return deck[0];
}

function addRegnereisenWrongOption(wrongs, candidate, correct, min, max) {
  if (!Number.isFinite(candidate)) return;
  const roundedCandidate = Math.round(candidate);
  if (roundedCandidate !== correct && roundedCandidate >= min && roundedCandidate <= max) wrongs.add(roundedCandidate);
}

function makeRegnereisenOptions(question) {
  const { mode, a, b, correct } = question;
  const minOption = mode === "division" ? 1 : 0;
  const maxOption = mode === "division" ? 10 : mode === "multiplication" ? 60 : 30;
  const wrongs = new Set();
  const nearOffsets = [-4, -3, -2, -1, 1, 2, 3, 4];
  let candidates = nearOffsets.map((offset) => correct + offset);

  if (mode === "multiplication") {
    candidates = [
      ...candidates,
      (a + 1) * b,
      Math.max(0, a - 1) * b,
      a * (b + 1),
      a * Math.max(0, b - 1),
      correct + Math.max(1, a),
      correct - Math.max(1, a),
      correct + Math.max(1, b),
      correct - Math.max(1, b),
      correct + 5,
      correct - 5,
    ];
  } else if (mode === "division") {
    candidates = [
      ...candidates,
      Math.round(a / (b + 1)),
      b > 1 ? Math.round(a / (b - 1)) : correct + 2,
      correct + 5,
      correct - 5,
    ];
  } else if (mode === "addition") {
    candidates = [...candidates, Math.abs(a - b), correct + 10, correct - 10];
  } else if (mode === "subtraction") {
    candidates = [...candidates, a + b, correct + 10, correct - 10];
  }

  shuffle(candidates).forEach((candidate) => addRegnereisenWrongOption(wrongs, candidate, correct, minOption, maxOption));
  while (wrongs.size < 3) {
    const offset = randomInt(1, 6) * (randomInt(0, 1) === 0 ? -1 : 1);
    addRegnereisenWrongOption(wrongs, correct + offset, correct, minOption, maxOption);
  }

  return shuffle([correct, ...wrongs].slice(0, 4));
}

function withRegnereisenOptions(question) {
  return { ...question, options: makeRegnereisenOptions(question) };
}

function getRegnereisenMission(placeId) {
  return REGNEREISEN_MISSIONS[placeId] || null;
}

function makeRegnereisenMissionQuestion(placeId) {
  const mission = getRegnereisenMission(placeId);
  const playableMission = mission?.kind === "mission" ? mission : REGNEREISEN_MISSIONS.sumpporten;
  return withRegnereisenOptions(makeQuestion(playableMission.mode, playableMission.level));
}

function createRegnereisenMissionDeck(placeId) {
  const mission = getRegnereisenMission(placeId);
  const playableMission = mission?.kind === "mission" ? mission : REGNEREISEN_MISSIONS.sumpporten;
  return createQuestionDeck(playableMission.mode, playableMission.level).map(withRegnereisenOptions);
}

function getStars(score) {
  if (score >= 30) return 5;
  if (score >= 20) return 4;
  if (score >= 15) return 3;
  if (score >= 8) return 2;
  return 1;
}

function getMessage(score) {
  if (score >= 30) return "Regnemester!";
  if (score >= 20) return "Kjempebra!";
  if (score >= 15) return "Sterkt jobbet!";
  if (score >= 8) return "Bra innsats!";
  return "God start!";
}

function getNormalResultFeedbackOptions(accuracy) {
  if (accuracy >= 100) return NORMAL_RESULT_FEEDBACK_MESSAGES.perfect;
  if (accuracy >= 90) return NORMAL_RESULT_FEEDBACK_MESSAGES.excellent;
  if (accuracy >= 70) return NORMAL_RESULT_FEEDBACK_MESSAGES.strong;
  if (accuracy >= 50) return NORMAL_RESULT_FEEDBACK_MESSAGES.practice;
  return NORMAL_RESULT_FEEDBACK_MESSAGES.beginner;
}

function getNormalResultFeedback(accuracy) {
  return getNormalResultFeedbackOptions(accuracy)[0] || "Flott innsats! ⭐";
}

function getRandomNormalResultFeedback(accuracy) {
  const messages = getNormalResultFeedbackOptions(accuracy);
  const index = Math.floor(Math.random() * messages.length);
  return messages[index] || getNormalResultFeedback(accuracy);
}

function normalizeNormalScore(entry, mode = "multiplication", level = "medium", gradeLevel = 4, questionCount = 10) {
  const name = typeof entry?.name === "string" ? entry.name : "";
  const score = Number(entry?.score);
  if (!name.trim() || !Number.isFinite(score)) return null;
  const entryMode = entry.mode || mode || "multiplication";
  return {
    id: entry.id,
    name,
    score,
    mode: entryMode,
    level: entry.level || level || "medium",
    grade_level: Number(entry.grade_level || gradeLevel || 4),
    school: entry.school || "",
    game_type: entry.game_type || "normal",
    question_count: Number(entry.question_count || (isTimeChallengeMode(entryMode) ? questionCount : 0)),
  };
}

function sortScores(scores, mode = "multiplication", limit = NORMAL_HIGHSCORE_VISIBLE_LIMIT) {
  const isTimed = isTimeChallengeMode(mode);
  const safeLimit = Number.isFinite(Number(limit)) ? Math.max(0, Number(limit)) : NORMAL_HIGHSCORE_VISIBLE_LIMIT;
  return (Array.isArray(scores) ? scores : [])
    .map((entry) => normalizeNormalScore(entry, mode))
    .filter(Boolean)
    .sort((a, b) => (isTimed ? a.score - b.score : b.score - a.score))
    .slice(0, safeLimit);
}

function getNormalPlayerKey(entry) {
  const nameKey = String(entry?.name || "").trim().toLowerCase();
  const modeKey = String(entry?.mode || "multiplication").trim().toLowerCase();
  const levelKey = String(entry?.level || "medium").trim().toLowerCase();
  const gradeKey = String(entry?.grade_level || 4);
  const questionKey = isTimeChallengeMode(entry?.mode) ? String(entry?.question_count || 0) : "score";
  return `${modeKey}|${levelKey}|${gradeKey}|${questionKey}|${nameKey}`;
}

function isBetterNormalScore(candidate, current, mode = "multiplication") {
  if (!current) return true;
  if (candidate.score === current.score) return false;
  return isTimeChallengeMode(mode) ? candidate.score < current.score : candidate.score > current.score;
}

function dedupeNormalScores(scores, mode = "multiplication", limit = NORMAL_HIGHSCORE_VISIBLE_LIMIT) {
  const bestByPlayer = new Map();
  const safeLimit = Number.isFinite(Number(limit)) ? Math.max(0, Number(limit)) : NORMAL_HIGHSCORE_VISIBLE_LIMIT;
  for (const entry of Array.isArray(scores) ? scores : []) {
    const normalizedEntry = normalizeNormalScore(entry, mode);
    if (!normalizedEntry) continue;
    const key = getNormalPlayerKey(normalizedEntry);
    const currentBest = bestByPlayer.get(key);
    if (isBetterNormalScore(normalizedEntry, currentBest, mode)) bestByPlayer.set(key, normalizedEntry);
  }
  const isTimed = isTimeChallengeMode(mode);
  return [...bestByPlayer.values()]
    .sort((a, b) => (isTimed ? a.score - b.score : b.score - a.score))
    .slice(0, safeLimit);
}

function normalizeSchoolBattleScore(entry, mode = "multiplication") {
  const name = typeof entry?.name === "string" ? entry.name : "";
  const score = Number(entry?.score);
  if (!name.trim() || !Number.isFinite(score)) return null;
  return {
    id: entry.id,
    name,
    school: entry.school || "Ukjent skole",
    score,
    mode: entry.mode || mode || "multiplication",
    grade_level: getSchoolBattleGradeLevel(entry),
    grade_group: entry.grade_group || "small",
    question_count: Number(entry.question_count || 0),
  };
}

function sortSchoolBattleScores(scores, mode = "multiplication", limit = 20) {
  const isTimed = isTimeChallengeMode(mode);
  const safeLimit = Number.isFinite(Number(limit)) ? Math.max(0, Number(limit)) : 20;
  return (Array.isArray(scores) ? scores : [])
    .map((entry) => normalizeSchoolBattleScore(entry, mode))
    .filter(Boolean)
    .sort((a, b) => (isTimed ? a.score - b.score : b.score - a.score))
    .slice(0, safeLimit);
}

function getSchoolBattlePlayerKey(entry) {
  const nameKey = String(entry?.name || "").trim().toLowerCase();
  const schoolKey = String(entry?.school || "Ukjent skole").trim().toLowerCase();
  const modeKey = String(entry?.mode || "multiplication").trim().toLowerCase();
  const gradeKey = String(getSchoolBattleGradeLevel(entry));
  return `${schoolKey}|${modeKey}|${gradeKey}|${nameKey}`;
}

function isBetterSchoolBattleScore(candidate, current, mode = "multiplication") {
  if (!current) return true;
  if (candidate.score === current.score) return false;
  return isTimeChallengeMode(mode) ? candidate.score < current.score : candidate.score > current.score;
}

function dedupeSchoolBattleScores(scores, mode = "multiplication", limit = 20) {
  const bestByPlayer = new Map();
  const safeLimit = Number.isFinite(Number(limit)) ? Math.max(0, Number(limit)) : 20;
  for (const entry of Array.isArray(scores) ? scores : []) {
    const normalizedEntry = normalizeSchoolBattleScore(entry, mode);
    if (!normalizedEntry) continue;
    const key = getSchoolBattlePlayerKey(normalizedEntry);
    const currentBest = bestByPlayer.get(key);
    if (isBetterSchoolBattleScore(normalizedEntry, currentBest, mode)) bestByPlayer.set(key, normalizedEntry);
  }
  const isTimed = isTimeChallengeMode(mode);
  return [...bestByPlayer.values()]
    .sort((a, b) => (isTimed ? a.score - b.score : b.score - a.score))
    .slice(0, safeLimit);
}

function getPlayerNameKey(name) {
  return String(name || "").trim().toLowerCase();
}

function getScoreEntryPlayerKey(entry) {
  const nameKey = getPlayerNameKey(entry?.name);
  if (!nameKey) return "";
  if (entry?.game_type === "school_battle" || entry?.school) {
    const schoolKey = getPlayerNameKey(entry?.school || "Ukjent skole");
    const modeKey = String(entry?.mode || "multiplication").trim().toLowerCase();
    const gradeKey = String(getSchoolBattleGradeLevel(entry));
    return `${schoolKey}|${modeKey}|${gradeKey}|${nameKey}`;
  }
  return nameKey;
}

function compareScoreEntries(a, b, mode = "multiplication") {
  const aScore = Number(a?.score);
  const bScore = Number(b?.score);
  if (!Number.isFinite(aScore) && !Number.isFinite(bScore)) return 0;
  if (!Number.isFinite(aScore)) return 1;
  if (!Number.isFinite(bScore)) return -1;
  return isTimeChallengeMode(mode) ? aScore - bScore : bScore - aScore;
}

function isBetterScoreEntry(candidate, current, mode = "multiplication") {
  if (!current) return true;
  const candidateScore = Number(candidate?.score);
  const currentScore = Number(current?.score);
  if (!Number.isFinite(candidateScore)) return false;
  if (!Number.isFinite(currentScore)) return true;
  if (candidateScore === currentScore) return false;
  return isTimeChallengeMode(mode) ? candidateScore < currentScore : candidateScore > currentScore;
}

function getTopUniqueScoreEntries(entries, mode = "multiplication", limit = 10) {
  const bestByPlayer = new Map();
  for (const entry of Array.isArray(entries) ? entries : []) {
    const playerKey = getScoreEntryPlayerKey(entry);
    if (!playerKey || !Number.isFinite(Number(entry?.score))) continue;
    const currentBest = bestByPlayer.get(playerKey);
    if (isBetterScoreEntry(entry, currentBest, mode)) bestByPlayer.set(playerKey, entry);
  }
  const safeLimit = Number.isFinite(Number(limit)) ? Math.max(0, Number(limit)) : 10;
  return [...bestByPlayer.values()].sort((a, b) => compareScoreEntries(a, b, mode)).slice(0, safeLimit);
}

function sameNormalScoreList(entry, reference) {
  const mode = reference?.mode || "multiplication";
  const sameBaseList =
    (entry?.game_type || "normal") === "normal" &&
    (entry?.mode || "multiplication") === mode &&
    (entry?.level || "medium") === (reference?.level || "medium") &&
    Number(entry?.grade_level || 4) === Number(reference?.grade_level || 4);
  if (!sameBaseList) return false;
  if (!isTimeChallengeMode(mode)) return true;
  return Number(entry?.question_count || 0) === Number(reference?.question_count || 0);
}

function sameSchoolBattleScoreList(entry, reference) {
  const mode = reference?.mode || "multiplication";
  const sameBaseList =
    entry?.game_type === "school_battle" &&
    entry?.mode === mode &&
    getPlayerNameKey(entry?.school || "Ukjent skole") === getPlayerNameKey(reference?.school || "Ukjent skole");
  if (!sameBaseList) return false;
  if (!isTimeChallengeMode(mode)) return true;
  return (
    (entry?.grade_group || "small") === (reference?.grade_group || "small") &&
    Number(entry?.question_count || 0) === Number(reference?.question_count || SCHOOL_BATTLE_TIME_QUESTION_COUNT)
  );
}

function cleanLocalHighscoreList(currentScores, entryWithType, sameListFn, limit) {
  const updatedScores = [...currentScores, entryWithType];
  const sameListScores = updatedScores.filter((scoreEntry) => sameListFn(scoreEntry, entryWithType));
  const keptScores = getTopUniqueScoreEntries(sameListScores, entryWithType.mode, limit);
  return {
    saved: keptScores.includes(entryWithType),
    trimmedScores: updatedScores.filter((storedEntry) => !sameListFn(storedEntry, entryWithType) || keptScores.includes(storedEntry)),
  };
}

function applySupabaseListFilters(query, type, entry) {
  const mode = entry?.mode || "multiplication";
  if (type === "normal_score" || type === "normal_time") {
    query = query
      .eq("game_type", "normal")
      .eq("mode", mode)
      .eq("level", entry?.level || "medium")
      .eq("grade_level", Number(entry?.grade_level || 4));
    if (isTimeChallengeMode(mode)) query = query.eq("question_count", Number(entry?.question_count || 0));
    return query;
  }

  query = query
    .eq("game_type", "school_battle")
    .eq("mode", mode)
    .eq("school", entry?.school || "Ukjent skole");
  if (isTimeChallengeMode(mode)) {
    query = query
      .eq("grade_group", entry?.grade_group || "small")
      .eq("question_count", SCHOOL_BATTLE_TIME_QUESTION_COUNT);
  }
  return query;
}

function getHighscoreListLimit(type) {
  return type === "school_battle_score" || type === "school_battle_time" ? 20 : NORMAL_HIGHSCORE_VISIBLE_LIMIT;
}

function buildSupabaseScorePayload(type, entry) {
  const mode = entry?.mode || "multiplication";
  const payload = {
    name: entry.name,
    score: Number(entry.score),
    mode,
    game_type: getHighscoreGameType(type),
  };

  if (type === "normal_score" || type === "normal_time") {
    return {
      ...payload,
      level: entry.level || "medium",
      grade_level: Number(entry.grade_level || 4),
      question_count: isTimeChallengeMode(mode) ? Number(entry.question_count || 0) : 0,
    };
  }

  return {
    ...payload,
    school: entry.school || "Ukjent skole",
    level: "medium",
    grade_level: getSchoolBattleGradeLevel(entry),
    grade_group: entry.grade_group || "small",
    question_count: isTimeChallengeMode(mode) ? SCHOOL_BATTLE_TIME_QUESTION_COUNT : 0,
  };
}

async function loadSupabaseHighscoreListRows(type, entry) {
  const mode = entry?.mode || "multiplication";
  let query = supabase
    .from("scores")
    .select("id, name, score, mode, level, grade_level, game_type, question_count, school, grade_group")
    .limit(1000);
  query = applySupabaseListFilters(query, type, entry);
  query = isTimeChallengeMode(mode) ? query.order("score", { ascending: true }) : query.order("score", { ascending: false });
  const { data, error } = await query;
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

async function saveSupabaseHighscoreWithUniqueCleanup(type, entry, fallbackSave) {
  const mode = entry?.mode || "multiplication";
  const limit = getHighscoreListLimit(type);
  try {
    const rows = await loadSupabaseHighscoreListRows(type, entry);
    const candidate = buildSupabaseScorePayload(type, entry);
    const keptRows = getTopUniqueScoreEntries([...rows, candidate], mode, limit);
    if (!keptRows.includes(candidate)) {
      await cleanupSupabaseHighscoreListSafely(type, entry);
      return { saved: false, message: type.startsWith("school_battle") ? "Det holdt ikke til topp 20 i Skolekampen denne gangen." : "Det holdt ikke til topp 10 denne gangen." };
    }

    const { error } = await supabase.from("scores").insert(candidate);
    if (error) throw error;
    await cleanupSupabaseHighscoreListSafely(type, entry);
    return { saved: true, message: type.startsWith("school_battle") ? "Du kom på Skolekampen-listen!" : "Du kom på highscore-listen!" };
  } catch (error) {
    console.warn("[Regnemester highscore] Direkte unik lagring feilet, bruker RPC-fallback.", {
      type,
      mode,
      playerName: entry?.name,
      school: entry?.school,
      grade_level: entry?.grade_level,
      score: entry?.score,
      error,
    });
    const fallbackResult = await fallbackSave();
    await cleanupSupabaseHighscoreListSafely(type, entry);
    return fallbackResult;
  }
}

async function cleanupSupabaseHighscoreList(type, entry) {
  if (!supabase) return;
  const mode = entry?.mode || "multiplication";
  const limit = getHighscoreListLimit(type);
  const rows = await loadSupabaseHighscoreListRows(type, entry);
  const keptRows = getTopUniqueScoreEntries(rows, mode, limit);
  const keptIds = new Set(keptRows.map((row) => row.id).filter(Boolean));
  const deleteIds = rows.map((row) => row.id).filter((id) => id && !keptIds.has(id));
  if (deleteIds.length === 0) return;

  let deleteQuery = supabase.from("scores").delete().in("id", deleteIds);
  deleteQuery = applySupabaseListFilters(deleteQuery, type, entry);
  const { error: deleteError } = await deleteQuery;
  if (deleteError) throw deleteError;
}

async function cleanupSupabaseHighscoreListSafely(type, entry) {
  try {
    await cleanupSupabaseHighscoreList(type, entry);
  } catch (error) {
    logHighscoreError("opprydding", { ...entry, type, game_type: getHighscoreGameType(type) }, error);
  }
}

let pendingHighscoreRetryInFlight = false;
const HIGHSCORE_RETRY_DELAYS_MS = [0, 1500, 4000];
const MAX_PENDING_HIGHSCORES = 50;

function makeLocalId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getHighscoreGameType(type) {
  return type === "school_battle_score" || type === "school_battle_time" ? "school_battle" : "normal";
}

function delay(ms) {
  if (!ms) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getErrorMessage(error) {
  if (!error) return "Ukjent feil.";
  if (typeof error === "string") return error;
  return error.message || error.error_description || error.details || "Ukjent feil.";
}

function normalizePendingHighscore(entry) {
  if (!entry || !entry.type || !Number.isFinite(Number(entry.score))) return null;
  const name = entry.name || entry.playerName || "";
  return {
    id: entry.id || makeLocalId(),
    type: entry.type,
    game_type: entry.game_type || getHighscoreGameType(entry.type),
    name,
    playerName: name,
    score: Number(entry.score),
    mode: entry.mode,
    operation: entry.operation || entry.mode,
    level: entry.level,
    grade_level: entry.grade_level,
    question_count: entry.question_count,
    school: entry.school,
    grade_group: entry.grade_group,
    createdAt: entry.createdAt || new Date().toISOString(),
    attemptCount: Number(entry.attemptCount || entry.retryCount || 0),
    lastAttemptAt: entry.lastAttemptAt || entry.lastRetryAt || null,
  };
}

function readPendingHighscores() {
  try {
    const raw = localStorage.getItem(PENDING_HIGHSCORE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(normalizePendingHighscore).filter(Boolean) : [];
  } catch (error) {
    console.error("[Regnemester highscore] Kunne ikke lese pending highscore-ko.", { error });
    return [];
  }
}

function writePendingHighscores(entries) {
  try {
    const normalized = entries.map(normalizePendingHighscore).filter(Boolean);
    const uniqueById = Array.from(new Map(normalized.map((entry) => [entry.id, entry])).values());
    localStorage.setItem(PENDING_HIGHSCORE_KEY, JSON.stringify(uniqueById.slice(-MAX_PENDING_HIGHSCORES)));
    return true;
  } catch (error) {
    console.error("[Regnemester highscore] Kunne ikke skrive pending highscore-ko.", { error });
    return false;
  }
}

function queuePendingHighscore(type, entry) {
  const pending = normalizePendingHighscore({
    ...entry,
    id: entry.id || makeLocalId(),
    type,
    game_type: getHighscoreGameType(type),
    name: entry.name || entry.playerName || "",
    playerName: entry.playerName || entry.name || "",
    operation: entry.operation || entry.mode,
    createdAt: new Date().toISOString(),
    attemptCount: 0,
    lastAttemptAt: null,
  });
  const current = readPendingHighscores();
  const existingIndex = current.findIndex((item) => item.id === pending.id);
  if (existingIndex >= 0) current[existingIndex] = { ...current[existingIndex], ...pending };
  else current.push(pending);
  writePendingHighscores(current);
  return pending;
}

function logHighscoreError(stage, context, error) {
  console.error("[Regnemester highscore]", {
    stage,
    game_type: context?.game_type || getHighscoreGameType(context?.type),
    mode: context?.mode,
    operation: context?.operation || context?.mode,
    level: context?.level,
    grade_level: context?.grade_level,
    question_count: context?.question_count,
    school: context?.school,
    grade_group: context?.grade_group,
    pendingId: context?.id,
    attemptNumber: context?.attemptNumber,
    attemptCount: context?.attemptCount,
    playerName: context?.name || context?.playerName,
    score: context?.score,
    message: getErrorMessage(error),
    error,
  });
}

function updatePendingHighscore(id, patch) {
  const current = readPendingHighscores();
  const next = current.map((item) => (item.id === id ? { ...item, ...patch } : item));
  writePendingHighscores(next);
  return next.find((item) => item.id === id) || null;
}

function removePendingHighscore(id) {
  const current = readPendingHighscores();
  writePendingHighscores(current.filter((item) => item.id !== id));
}

async function saveHighscoreEntry(type, entry) {
  if (type === "normal_time") return saveTimeScore(entry);
  if (type === "school_battle_score") return saveSchoolBattleScore(entry);
  if (type === "school_battle_time") return saveSchoolBattleTimeScore(entry);
  return saveScore(entry);
}

async function savePendingHighscoreOnce(pending, context = {}) {
  const latest = readPendingHighscores().find((item) => item.id === pending.id);
  if (!latest) return { saved: true, message: "Resultatet er allerede behandlet." };
  const attemptCount = Number(latest.attemptCount || 0) + 1;
  const attemptAt = new Date().toISOString();
  const attemptEntry = updatePendingHighscore(latest.id, { attemptCount, lastAttemptAt: attemptAt }) || { ...latest, attemptCount, lastAttemptAt: attemptAt };
  try {
    const result = await saveHighscoreEntry(attemptEntry.type, attemptEntry);
    removePendingHighscore(attemptEntry.id);
    return result || { saved: true, message: "Resultatet ble lagret på highscore." };
  } catch (error) {
    logHighscoreError(context.stage || "lagring", { ...attemptEntry, attemptNumber: attemptCount, source: context.source }, error);
    throw error;
  }
}

async function savePendingHighscoreWithRetry(pending, context = {}) {
  let lastError = null;
  for (let index = 0; index < HIGHSCORE_RETRY_DELAYS_MS.length; index += 1) {
    await delay(HIGHSCORE_RETRY_DELAYS_MS[index]);
    const latest = readPendingHighscores().find((item) => item.id === pending.id);
    if (!latest) return { saved: true, message: "Resultatet er allerede behandlet." };
    try {
      return await savePendingHighscoreOnce(latest, { ...context, attemptNumber: index + 1 });
    } catch (error) {
      lastError = error;
      if (index < HIGHSCORE_RETRY_DELAYS_MS.length - 1) {
        console.warn("[Regnemester highscore] Lagring feilet, prover igjen.", {
          pendingId: latest.id,
          attemptNumber: index + 1,
          nextDelayMs: HIGHSCORE_RETRY_DELAYS_MS[index + 1],
          mode: latest.mode,
          operation: latest.operation,
          school: latest.school,
          playerName: latest.name,
          score: latest.score,
          error,
        });
      }
    }
  }
  throw lastError || new Error("Kunne ikke lagre highscore.");
}

async function retryPendingHighscores(context = {}) {
  const pending = readPendingHighscores().filter((item) => getHighscoreGameType(item.type) === "school_battle");
  if (pendingHighscoreRetryInFlight || pending.length === 0) return { savedCount: 0, failedCount: 0 };
  pendingHighscoreRetryInFlight = true;
  let savedCount = 0;
  let failedCount = 0;
  try {
    for (const item of pending) {
      try {
        await savePendingHighscoreWithRetry(item, { source: context.source || "pending-retry", stage: "retry" });
        savedCount += 1;
      } catch (error) {
        failedCount += 1;
        logHighscoreError("retry-ga-opp", { ...item, source: context.source }, error);
      }
    }
    return { savedCount, failedCount };
  } finally {
    pendingHighscoreRetryInFlight = false;
  }
}

async function loadScores(mode = "multiplication", level = "medium", gradeLevel = 4, questionCount = 10, resultLimit = NORMAL_HIGHSCORE_VISIBLE_LIMIT) {
  const isTimed = isTimeChallengeMode(mode);
  const safeLimit = Number.isFinite(Number(resultLimit)) ? Math.max(NORMAL_HIGHSCORE_VISIBLE_LIMIT, Number(resultLimit)) : NORMAL_HIGHSCORE_VISIBLE_LIMIT;
  if (supabase) {
    let query = supabase
      .from("scores")
      .select("id, name, score, mode, level, grade_level, game_type, question_count")
      .eq("game_type", "normal")
      .eq("mode", mode)
      .eq("level", level)
      .eq("grade_level", gradeLevel);
    if (isTimed) query = query.eq("question_count", questionCount).order("score", { ascending: true });
    else query = query.order("score", { ascending: false });
    const { data, error } = await query.limit(safeLimit);
    if (!error && data) return sortScores(data, mode, safeLimit);
    throw new Error(error?.message || "Kunne ikke hente highscore.");
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const storedScores = raw ? JSON.parse(raw) : [];
    const filteredScores = storedScores.filter((entry) => {
      const sameBaseList =
        (entry.game_type || "normal") === "normal" &&
        (entry.mode || "multiplication") === mode &&
        (entry.level || "medium") === level &&
        Number(entry.grade_level || 4) === Number(gradeLevel);
      if (!sameBaseList) return false;
      if (!isTimed) return true;
      return Number(entry.question_count || 0) === Number(questionCount);
    });
    return sortScores(filteredScores, mode, safeLimit);
  } catch {
    return [];
  }
}


async function loadAllNormalAdminScores() {
  if (supabase) {
    const { data, error } = await supabase
      .from("scores")
      .select("id, name, score, mode, level, grade_level, game_type, question_count")
      .eq("game_type", "normal");
    if (!error && data) return data.map(normalizeNormalAdminScore).filter((entry) => entry.name && Number.isFinite(entry.score));
    throw new Error(error?.message || "Kunne ikke hente Normal-resultater.");
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const storedScores = raw ? JSON.parse(raw) : [];
    return storedScores
      .filter((entry) => (entry.game_type || "normal") === "normal")
      .map(normalizeNormalAdminScore)
      .filter((entry) => entry.name && Number.isFinite(entry.score));
  } catch {
    return [];
  }
}


async function loadSchoolBattleScores(mode = "multiplication", gradeGroup = "small", resultLimit = 20) {
  const isTimed = isTimeChallengeMode(mode);
  const safeLimit = Number.isFinite(Number(resultLimit)) ? Math.max(20, Number(resultLimit)) : 20;
  if (supabase) {
    let query = supabase
      .from("scores")
      .select("id, name, score, mode, school, game_type, grade_level, grade_group, question_count")
      .eq("game_type", "school_battle")
      .eq("mode", mode);
    if (isTimed) query = query.eq("grade_group", gradeGroup).eq("question_count", SCHOOL_BATTLE_TIME_QUESTION_COUNT).order("score", { ascending: true });
    else query = query.order("score", { ascending: false });
    const { data, error } = await query.limit(safeLimit);
    if (!error && data) return sortSchoolBattleScores(data, mode, safeLimit);
    throw new Error(error?.message || "Kunne ikke hente Skolekampen-listen.");
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const storedScores = raw ? JSON.parse(raw) : [];
    const filteredScores = storedScores.filter((entry) => {
      const sameMode = entry.game_type === "school_battle" && entry.mode === mode;
      if (!sameMode) return false;
      if (!isTimed) return true;
      return entry.grade_group === gradeGroup && Number(entry.question_count) === SCHOOL_BATTLE_TIME_QUESTION_COUNT;
    });
    return sortSchoolBattleScores(filteredScores, mode, safeLimit);
  } catch {
    return [];
  }
}

async function saveScore(entry) {
  if (supabase) {
    return saveSupabaseHighscoreWithUniqueCleanup("normal_score", entry, async () => {
      const { data, error } = await supabase.rpc("save_top_score", {
        player_name: entry.name,
        player_score: entry.score,
        score_mode: entry.mode,
        score_level: entry.level,
        score_grade_level: entry.grade_level,
      });
      if (error) throw new Error(error.message || "Kunne ikke lagre score.");
      const result = Array.isArray(data) ? data[0] : data;
      return { saved: Boolean(result?.saved), message: result?.message || "Resultatet er sjekket mot highscore-listen." };
    });
    const { data, error } = await supabase.rpc("save_top_score", {
      player_name: entry.name,
      player_score: entry.score,
      score_mode: entry.mode,
      score_level: entry.level,
      score_grade_level: entry.grade_level,
    });
    if (error) throw new Error(error.message || "Kunne ikke lagre score.");
    const result = Array.isArray(data) ? data[0] : data;
    await cleanupSupabaseHighscoreListSafely("normal_score", entry);
    return { saved: Boolean(result?.saved), message: result?.message || "Resultatet er sjekket mot highscore-listen." };
  }
  const raw = localStorage.getItem(STORAGE_KEY);
  const current = raw ? JSON.parse(raw) : [];
  const entryWithType = { ...entry, id: crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`, game_type: "normal" };
  const cleanedLocal = cleanLocalHighscoreList(current, entryWithType, sameNormalScoreList, NORMAL_HIGHSCORE_VISIBLE_LIMIT);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanedLocal.trimmedScores));
  if (!cleanedLocal.saved) return { saved: false, message: "Det holdt ikke til topp 10 denne gangen." };
  return { saved: true, message: "Du kom på highscore-listen!" };
}

async function saveTimeScore(entry) {
  if (supabase) {
    return saveSupabaseHighscoreWithUniqueCleanup("normal_time", entry, async () => {
      const { data, error } = await supabase.rpc("save_time_score", {
        player_name: entry.name,
        player_time: entry.score,
        score_mode: entry.mode,
        score_level: entry.level,
        score_grade_level: entry.grade_level,
        score_question_count: entry.question_count,
      });
      if (error) throw new Error(error.message || "Kunne ikke lagre tidsscore.");
      const result = Array.isArray(data) ? data[0] : data;
      return { saved: Boolean(result?.saved), message: result?.message || "Resultatet er sjekket mot highscore-listen." };
    });
    const { data, error } = await supabase.rpc("save_time_score", {
      player_name: entry.name,
      player_time: entry.score,
      score_mode: entry.mode,
      score_level: entry.level,
      score_grade_level: entry.grade_level,
      score_question_count: entry.question_count,
    });
    if (error) throw new Error(error.message || "Kunne ikke lagre tidsscore.");
    const result = Array.isArray(data) ? data[0] : data;
    await cleanupSupabaseHighscoreListSafely("normal_time", entry);
    return { saved: Boolean(result?.saved), message: result?.message || "Resultatet er sjekket mot highscore-listen." };
  }
  const raw = localStorage.getItem(STORAGE_KEY);
  const current = raw ? JSON.parse(raw) : [];
  const entryWithType = { ...entry, id: crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`, game_type: "normal" };
  const cleanedLocal = cleanLocalHighscoreList(current, entryWithType, sameNormalScoreList, NORMAL_HIGHSCORE_VISIBLE_LIMIT);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanedLocal.trimmedScores));
  if (!cleanedLocal.saved) return { saved: false, message: "Det holdt ikke til topp 10 denne gangen." };
  return { saved: true, message: "Du kom på highscore-listen!" };
}

async function saveSchoolBattleTimeScore(entry) {
  if (supabase) {
    return saveSupabaseHighscoreWithUniqueCleanup("school_battle_time", entry, async () => {
      const { data, error } = await supabase.rpc("save_school_battle_time_score", {
        player_name: entry.name,
        player_time: entry.score,
        score_mode: entry.mode,
        player_school: entry.school,
        player_grade_group: entry.grade_group,
        score_question_count: SCHOOL_BATTLE_TIME_QUESTION_COUNT,
      });
      if (error) throw new Error(error.message || "Kunne ikke lagre Skolekampen-tid.");
      const result = Array.isArray(data) ? data[0] : data;
      return { saved: Boolean(result?.saved), message: result?.message || "Resultatet er sjekket mot Skolekampen-listen." };
    });
    const { data, error } = await supabase.rpc("save_school_battle_time_score", {
      player_name: entry.name,
      player_time: entry.score,
      score_mode: entry.mode,
      player_school: entry.school,
      player_grade_group: entry.grade_group,
      score_question_count: SCHOOL_BATTLE_TIME_QUESTION_COUNT,
    });
    if (error) throw new Error(error.message || "Kunne ikke lagre Skolekampen-tid.");
    const result = Array.isArray(data) ? data[0] : data;
    await cleanupSupabaseHighscoreListSafely("school_battle_time", entry);
    return { saved: Boolean(result?.saved), message: result?.message || "Resultatet er sjekket mot Skolekampen-listen." };
  }
  const raw = localStorage.getItem(STORAGE_KEY);
  const current = raw ? JSON.parse(raw) : [];
  const entryWithType = {
    ...entry,
    id: crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,
    game_type: "school_battle",
    level: "medium",
    grade_level: getSchoolBattleGradeLevel(entry),
    question_count: SCHOOL_BATTLE_TIME_QUESTION_COUNT,
  };
  const cleanedLocal = cleanLocalHighscoreList(current, entryWithType, sameSchoolBattleScoreList, 20);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanedLocal.trimmedScores));
  if (!cleanedLocal.saved) return { saved: false, message: "Det holdt ikke til topp 20 i Skolekampen denne gangen." };
  return { saved: true, message: "Du kom på Skolekampen-listen!" };
}

async function saveSchoolBattleScore(entry) {
  if (supabase) {
    return saveSupabaseHighscoreWithUniqueCleanup("school_battle_score", entry, async () => {
      const { data, error } = await supabase.rpc("save_school_battle_score", {
        player_name: entry.name,
        player_score: entry.score,
        score_mode: entry.mode,
        player_school: entry.school,
      });
      if (error) throw new Error(error.message || "Kunne ikke lagre Skolekampen-score.");
      const result = Array.isArray(data) ? data[0] : data;
      return { saved: Boolean(result?.saved), message: result?.message || "Resultatet er sjekket mot Skolekampen-listen." };
    });
    const { data, error } = await supabase.rpc("save_school_battle_score", {
      player_name: entry.name,
      player_score: entry.score,
      score_mode: entry.mode,
      player_school: entry.school,
    });
    if (error) throw new Error(error.message || "Kunne ikke lagre Skolekampen-score.");
    const result = Array.isArray(data) ? data[0] : data;
    await cleanupSupabaseHighscoreListSafely("school_battle_score", entry);
    return { saved: Boolean(result?.saved), message: result?.message || "Resultatet er sjekket mot Skolekampen-listen." };
  }
  const raw = localStorage.getItem(STORAGE_KEY);
  const current = raw ? JSON.parse(raw) : [];
  const entryWithType = { ...entry, id: crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`, game_type: "school_battle", level: "medium", grade_level: getSchoolBattleGradeLevel(entry) };
  const cleanedLocal = cleanLocalHighscoreList(current, entryWithType, sameSchoolBattleScoreList, 20);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanedLocal.trimmedScores));
  if (!cleanedLocal.saved) return { saved: false, message: "Det holdt ikke til topp 20 i Skolekampen denne gangen." };
  return { saved: true, message: "Du kom på Skolekampen-listen!" };
}

async function clearNormalScoreList(adminPin, resetMode, resetLevel, resetGradeLevel, resetQuestionCount = null) {
  const isTimedList = isTimeChallengeMode(resetMode);
  if (supabase) {
    const { error } = await supabase.rpc("reset_normal_score_list", {
      admin_pin: adminPin,
      reset_mode: resetMode,
      reset_level: resetLevel,
      reset_grade_level: resetGradeLevel,
      reset_question_count: isTimedList ? resetQuestionCount : null,
    });
    if (error) throw new Error(error.message || "Kunne ikke tømme listen.");
    return;
  }
  if (adminPin !== ADMIN_PIN_FALLBACK) throw new Error("Feil adminkode.");
  const raw = localStorage.getItem(STORAGE_KEY);
  const current = raw ? JSON.parse(raw) : [];
  const remainingScores = current.filter((entry) => {
    const sameBaseList =
      (entry.game_type || "normal") === "normal" &&
      (entry.mode || "multiplication") === resetMode &&
      (entry.level || "medium") === resetLevel &&
      Number(entry.grade_level || 4) === Number(resetGradeLevel);
    if (!sameBaseList) return true;
    if (!isTimedList) return false;
    return Number(entry.question_count || 0) !== Number(resetQuestionCount);
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(remainingScores));
}

function Button({ children, onClick, variant = "primary", disabled = false, className = "" }) {
  return <button onClick={onClick} disabled={disabled} className={`button button-${variant} ${className}`}>{children}</button>;
}

function ModeButtonLabel({ mode }) {
  const symbol = getModeSymbol(mode);
  return (
    <span className={`mode-button-label ${symbol ? "" : "mode-button-label-plain"}`}>
      <span className="mode-button-name">{getModeName(mode)}</span>
      {symbol && <span className="mode-button-symbol">{symbol}</span>}
    </span>
  );
}

function ModeButtons({ selectedMode, onSelect, includeMixed = false }) {
  const modes = includeMixed ? PRACTICE_MODE_ORDER : MODE_ORDER;
  return <>{modes.map((mode, index) => <Button key={mode} variant={selectedMode === mode ? "primary" : "light"} onClick={() => onSelect(mode)} className={`full mode-choice-button ${index > 0 ? "top-space" : ""}`}><ModeButtonLabel mode={mode} /></Button>)}</>;
}

function ModeFilterButtons({ selectedMode, onSelect }) {
  return <>{MODE_ORDER.map((mode, index) => <Button key={mode} variant={selectedMode === mode ? "primary" : "light"} onClick={() => onSelect(mode)} className={`full mode-choice-button ${index > 0 ? "top-space" : ""}`}><ModeButtonLabel mode={mode} /></Button>)}</>;
}

function NormalTimeToggle({ timed, onChange }) {
  return (
    <div className="card input-card normal-time-card">
      <label>Velg tidsmodus</label>
      <div className="normal-time-toggle" role="group" aria-label="Velg tidsmodus">
        <button type="button" className={`normal-time-option ${timed ? "selected" : ""}`} aria-pressed={timed} onClick={() => onChange(true)}>
          <span>Med tid</span>
          <small>Som vanlig</small>
        </button>
        <button type="button" className={`normal-time-option ${!timed ? "selected" : ""}`} aria-pressed={!timed} onClick={() => onChange(false)}>
          <span>Uten tid</span>
          <small>Øv rolig</small>
        </button>
      </div>
    </div>
  );
}

function AnnouncementPopup({ title, message, onClose }) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="announcement-backdrop" role="dialog" aria-modal="true" aria-labelledby="announcement-title">
      <div className="announcement-modal">
        <span className="announcement-kicker">Nyhet</span>
        <h2 id="announcement-title">{title || ANNOUNCEMENT_DEFAULT_TITLE}</h2>
        <p>{message}</p>
        <Button onClick={onClose} className="full">Lukk</Button>
      </div>
    </div>,
    document.body
  );
}

function RegnereisenAccessPopup({ code, message, onCodeChange, onSubmit, onClose }) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="announcement-backdrop regnereisen-access-backdrop" role="dialog" aria-modal="true" aria-labelledby="regnereisen-access-title">
      <form className="announcement-modal regnereisen-access-modal" onSubmit={onSubmit}>
        <span className="announcement-kicker">Kommer snart</span>
        <h2 id="regnereisen-access-title">Regnereisen er låst</h2>
        <p>Har du fått en testkode, kan du skrive den inn her for å prøve modusen.</p>
        <div className="regnereisen-access-row">
          <input
            aria-label="Testkode for Regnereisen"
            value={code}
            onChange={(event) => onCodeChange(normalizeRegnereisenAccessCode(event.target.value))}
            inputMode="numeric"
            maxLength={4}
            placeholder="4 sifre"
            autoComplete="off"
          />
          <button type="submit" className="button button-secondary">Åpne</button>
        </div>
        {message && <p className="regnereisen-access-message">{message}</p>}
        <button type="button" className="button button-light full top-space" onClick={onClose}>Lukk</button>
      </form>
    </div>,
    document.body
  );
}

function Shell({ children, theme = "", isHome = false, isSetup = false, modeBg = "", frameClassName = "", shellClassName = "", frameStyle = undefined }) {
  const appThemeClass = theme ? ` app-theme-${theme}` : "";
  const frameThemeClass = theme ? ` theme-frame theme-${theme}` : "";
  const homeFrameClass = isHome ? " home-frame" : "";
  const setupFrameClass = isSetup ? " setup-frame" : "";
  const modeBgClass = modeBg ? ` mode-bg-${modeBg}` : "";
  const extraFrameClass = frameClassName ? ` ${frameClassName}` : "";
  const extraShellClass = shellClassName ? ` ${shellClassName}` : "";
  return <main className={`app-shell${appThemeClass}${extraShellClass}`}><BossBattleStyles /><section className={`phone-frame${frameThemeClass}${homeFrameClass}${setupFrameClass}${modeBgClass}${extraFrameClass}`} style={frameStyle}><div className="blob blob-one" /><div className="blob blob-two" /><div className="content">{children}</div></section></main>;
}

function BossBattleStyles() {
  return (
    <style>{`
      @keyframes boss-hit-shake { 0% { transform: translateX(0) scale(1); filter: brightness(1); } 20% { transform: translateX(-8px) scale(1.03); filter: brightness(1.25) saturate(1.4); } 40% { transform: translateX(8px) scale(0.98); filter: brightness(1.1); } 60% { transform: translateX(-5px) scale(1.02); filter: brightness(1.3) saturate(1.7); } 80% { transform: translateX(5px) scale(1); } 100% { transform: translateX(0) scale(1); filter: brightness(1); } }
      @keyframes player-hit-shake { 0% { transform: translateX(0); } 20% { transform: translateX(-7px); } 40% { transform: translateX(7px); } 60% { transform: translateX(-5px); } 80% { transform: translateX(5px); } 100% { transform: translateX(0); } }
      @keyframes damage-pop { 0% { transform: translate(-50%, 12px) scale(.6); opacity: 0; } 20% { transform: translate(-50%, -4px) scale(1.25); opacity: 1; } 100% { transform: translate(-50%, -34px) scale(1); opacity: 0; } }
      @keyframes super-pulse { 0%, 100% { transform: scale(1); box-shadow: 0 0 0 rgba(251, 191, 36, 0); } 50% { transform: scale(1.05); box-shadow: 0 0 26px rgba(251, 191, 36, .8); } }
      @keyframes boss-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
      @keyframes treasure-shine { 0%, 100% { transform: scale(1) rotate(-1deg); filter: brightness(1); } 50% { transform: scale(1.04) rotate(1deg); filter: brightness(1.16); } }
      @keyframes boss-breathe { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-3px) scale(1.025); } }
      @keyframes slime-squash { 0%, 100% { transform: translateY(0) scale(1); } 38% { transform: translateY(-5px) scale(1.045, .965); } 58% { transform: translateY(2px) scale(.97, 1.055); } }
      @keyframes troll-stomp { 0%, 100% { transform: translateY(0) rotate(0deg) scale(1); } 46% { transform: translateY(-2px) rotate(-.5deg) scale(1.01); } 62% { transform: translateY(3px) rotate(.35deg) scale(1.025, .985); } }
      @keyframes shadow-hover { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-6px) scale(1.018); } }
      @keyframes boss-attack-lunge { 0% { transform: translateX(0) scale(1); } 35% { transform: translateX(-7px) scale(1.04); } 58% { transform: translateX(12px) scale(1.08); } 100% { transform: translateX(0) scale(1); } }
      @keyframes boss-defeat-fall { 0% { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; filter: saturate(1); } 100% { transform: translateY(18px) rotate(-8deg) scale(.86); opacity: .55; filter: grayscale(.7) saturate(.55); } }
      @keyframes arena-drift { 0% { transform: translate3d(-8px, 0, 0) rotate(0deg); opacity: .45; } 50% { transform: translate3d(10px, -8px, 0) rotate(3deg); opacity: .75; } 100% { transform: translate3d(-8px, 0, 0) rotate(0deg); opacity: .45; } }
      @keyframes arena-haze-sway { 0%, 100% { transform: translate3d(-7px, 0, 0) scale(1); opacity: .72; } 50% { transform: translate3d(9px, -5px, 0) scale(1.03); opacity: .92; } }
      @keyframes arena-floor-pulse { 0%, 100% { filter: saturate(1) brightness(1); } 50% { filter: saturate(1.18) brightness(1.08); } }
      @keyframes cave-dust-drift { 0%, 100% { transform: translate3d(-5px, 2px, 0); opacity: .42; } 50% { transform: translate3d(8px, -7px, 0); opacity: .7; } }
      @keyframes shadow-smoke-roll { 0%, 100% { transform: translate3d(-10px, 2px, 0) scale(1); opacity: .6; } 50% { transform: translate3d(10px, -6px, 0) scale(1.06); opacity: .9; } }
      @keyframes attack-word-pop { 0% { transform: translate(-50%, 8px) scale(.7); opacity: 0; } 25% { transform: translate(-50%, -8px) scale(1.12); opacity: 1; } 100% { transform: translate(-50%, -32px) scale(.95); opacity: 0; } }
      @keyframes goo-wiggle { 0%, 100% { transform: translateY(0) scaleY(1); } 50% { transform: translateY(3px) scaleY(1.18); } }
      @keyframes crown-wobble { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(-2deg); } 75% { transform: rotate(2deg); } }
      @keyframes core-pulse { 0%, 100% { opacity: .82; transform: scale(1); } 50% { opacity: 1; transform: scale(1.12); } }
      @keyframes boss-eye-blink { 0%, 88%, 100% { transform: scaleY(1); } 92% { transform: scaleY(.16); } }
      @keyframes aura-pulse { 0%, 100% { opacity: .18; transform: scale(.96); } 50% { opacity: .42; transform: scale(1.06); } }
      @keyframes slime-bubble-float { 0%, 100% { transform: translateY(0) scale(1); opacity: .78; } 50% { transform: translateY(-5px) scale(1.08); opacity: 1; } }
      @keyframes shadow-wisp-drift { 0%, 100% { transform: translateY(0) rotate(0deg); opacity: .34; } 50% { transform: translateY(-8px) rotate(5deg); opacity: .72; } }
      @keyframes hit-flash-pop { 0% { opacity: 0; transform: scale(.86); } 28% { opacity: .72; transform: scale(1.05); } 100% { opacity: 0; transform: scale(1.18); } }
      @keyframes weak-stress { 0%, 100% { transform: translateX(0); } 30% { transform: translateX(-1.5px); } 65% { transform: translateX(1.5px); } }
      @keyframes battle-screen-shake { 0%, 100% { transform: translateX(0); } 18% { transform: translateX(-3px); } 36% { transform: translateX(3px); } 54% { transform: translateX(-2px); } 72% { transform: translateX(2px); } }
      @keyframes arena-danger-pulse { 0%, 100% { box-shadow: inset 0 -18px 34px rgba(15, 23, 42, 0.16), 0 16px 34px rgba(15, 23, 42, 0.2); } 50% { box-shadow: inset 0 -20px 38px rgba(127, 29, 29, 0.2), 0 18px 38px rgba(127, 29, 29, 0.22); } }
      @keyframes super-ring-surge { 0%, 100% { opacity: 0; transform: translate(-50%, -50%) scale(.9); } 45% { opacity: .64; transform: translate(-50%, -50%) scale(1.08); } }
      @keyframes damage-heavy-pop { 0% { transform: translate(-50%, 16px) scale(.55) rotate(-3deg); opacity: 0; } 18% { transform: translate(-50%, -8px) scale(1.38) rotate(2deg); opacity: 1; } 56% { transform: translate(-50%, -23px) scale(1.1) rotate(-1deg); opacity: 1; } 100% { transform: translate(-50%, -48px) scale(.9) rotate(0deg); opacity: 0; } }
      @keyframes hp-shine { 0% { transform: translateX(-70%); opacity: .35; } 100% { transform: translateX(120%); opacity: .82; } }
      @keyframes hp-danger-throb { 0%, 100% { filter: saturate(1.1) brightness(1); } 50% { filter: saturate(1.55) brightness(1.18); } }
      @keyframes super-meter-ready { 0%, 100% { filter: drop-shadow(0 0 0 rgba(251, 191, 36, 0)); } 50% { filter: drop-shadow(0 0 12px rgba(251, 191, 36, .9)); } }
      @keyframes boss-intro-reveal { 0% { opacity: 0; transform: translate(-50%, -12px) scale(.92); } 14%, 72% { opacity: 1; transform: translate(-50%, 0) scale(1); } 100% { opacity: 0; transform: translate(-50%, 12px) scale(.98); visibility: hidden; } }
      @keyframes hero-energy-shot { 0% { opacity: 0; transform: translate(-50%, 42px) scale(.7); } 18% { opacity: 1; } 72% { opacity: 1; transform: translate(-50%, -46px) scale(1.05); } 100% { opacity: 0; transform: translate(-50%, -62px) scale(1.28); } }
      @keyframes hero-energy-trail { 0% { opacity: 0; transform: translate(-50%, 20px) scaleY(.55); } 30% { opacity: .86; } 100% { opacity: 0; transform: translate(-50%, -42px) scaleY(1.2); } }
      @keyframes boss-retaliation-pop { 0% { opacity: 0; transform: scale(.96); } 24% { opacity: 1; transform: scale(1.02); } 100% { opacity: 0; transform: scale(1.06); } }
      @keyframes atmosphere-rise { 0% { opacity: 0; transform: translateY(18px) scale(.8); } 22% { opacity: .72; } 100% { opacity: 0; transform: translateY(-58px) scale(1.12); } }
      @keyframes atmosphere-drift { 0%, 100% { transform: translateX(-5px); } 50% { transform: translateX(7px); } }
      @keyframes answer-correct-pop { 0% { transform: scale(1); } 42% { transform: scale(1.045); box-shadow: 0 0 0 5px rgba(34,197,94,.18), 0 16px 26px rgba(21,128,61,.2); } 100% { transform: scale(1); } }
      @keyframes answer-wrong-jolt { 0%, 100% { transform: translateX(0); } 22% { transform: translateX(-4px); } 48% { transform: translateX(4px); } 72% { transform: translateX(-2px); } }
      @keyframes feedback-pop-in { 0% { opacity: 0; transform: translateY(4px) scale(.96); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
      @keyframes result-card-pop { 0% { transform: translateY(12px) scale(.97); opacity: 0; } 100% { transform: translateY(0) scale(1); opacity: 1; } }
      @keyframes result-spark-drift { 0%, 100% { transform: translateY(0) scale(.85); opacity: .45; } 50% { transform: translateY(-13px) scale(1.18); opacity: 1; } }
      @keyframes result-boss-victory { 0%, 100% { transform: translateY(0) rotate(-2deg); } 50% { transform: translateY(-5px) rotate(2deg); } }
      @keyframes result-boss-loom { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-2px) scale(1.035); } }
      @keyframes slime-boss-image-attack { 0% { transform: translateY(-30px) translateX(0) scale(1.18); } 35% { transform: translateY(-30px) translateX(-7px) scale(1.22); } 58% { transform: translateY(-30px) translateX(12px) scale(1.27); } 100% { transform: translateY(-30px) translateX(0) scale(1.18); } }
      @keyframes slime-boss-image-defeat { 0% { transform: translateY(-30px) rotate(0deg) scale(1.18); opacity: 1; filter: saturate(1); } 100% { transform: translateY(-14px) rotate(-8deg) scale(1); opacity: .58; filter: grayscale(.7) saturate(.55); } }
      @keyframes troll-boss-image-attack { 0% { transform: translateY(-58px) translateX(0) scale(.96); } 35% { transform: translateY(-58px) translateX(-6px) scale(.99); } 58% { transform: translateY(-58px) translateX(10px) scale(1.03); } 100% { transform: translateY(-58px) translateX(0) scale(.96); } }
      @keyframes troll-boss-image-defeat { 0% { transform: translateY(-58px) rotate(0deg) scale(.96); opacity: 1; filter: saturate(1); } 100% { transform: translateY(-26px) rotate(7deg) scale(.92); opacity: .62; filter: grayscale(.45) saturate(.7); } }
      @keyframes troll-result-image-defeat { 0% { transform: translateY(-18px) rotate(0deg) scale(.96); opacity: 1; filter: saturate(1); } 100% { transform: translateY(8px) rotate(7deg) scale(.96); opacity: .62; filter: grayscale(.45) saturate(.7); } }
      @keyframes shadow-boss-image-attack { 0% { transform: translateY(-50px) translateX(0) scale(.96); } 35% { transform: translateY(-50px) translateX(-6px) scale(.99); } 58% { transform: translateY(-50px) translateX(10px) scale(1.03); } 100% { transform: translateY(-50px) translateX(0) scale(.96); } }
      @keyframes shadow-boss-image-defeat { 0% { transform: translateY(-50px) rotate(0deg) scale(.96); opacity: 1; filter: saturate(1); } 100% { transform: translateY(-18px) rotate(-6deg) scale(.9); opacity: .6; filter: grayscale(.55) saturate(.68); } }
      @keyframes shadow-result-image-defeat { 0% { transform: translateY(-16px) rotate(0deg) scale(.98); opacity: 1; filter: saturate(1); } 100% { transform: translateY(-12px) rotate(-6deg) scale(.94); opacity: .62; filter: grayscale(.55) saturate(.68); } }
      @keyframes isdragen-boss-image-attack { 0% { transform: translateY(-148px) translateX(0) scale(.94); } 35% { transform: translateY(-148px) translateX(-5px) scale(.98); } 58% { transform: translateY(-148px) translateX(10px) scale(1.02); } 100% { transform: translateY(-148px) translateX(0) scale(.94); } }
      @keyframes isdragen-boss-image-defeat { 0% { transform: translateY(-148px) rotate(0deg) scale(.94); opacity: 1; filter: saturate(1); } 100% { transform: translateY(-84px) rotate(5deg) scale(.88); opacity: .62; filter: grayscale(.38) saturate(.72); } }
      @keyframes isdragen-result-image-defeat { 0% { transform: translateY(-96px) rotate(0deg) scale(.8); opacity: 1; filter: saturate(1); } 100% { transform: translateY(-74px) rotate(5deg) scale(.76); opacity: .64; filter: grayscale(.38) saturate(.72); } }
      @keyframes lavakjempen-boss-image-attack { 0% { transform: translateY(-120px) translateX(0) scale(.86); } 35% { transform: translateY(-120px) translateX(-6px) scale(.9); } 58% { transform: translateY(-120px) translateX(11px) scale(.94); } 100% { transform: translateY(-120px) translateX(0) scale(.86); } }
      @keyframes lavakjempen-boss-image-defeat { 0% { transform: translateY(-90px) rotate(0deg) scale(.94); opacity: 1; filter: saturate(1); } 100% { transform: translateY(-46px) rotate(-5deg) scale(.82); opacity: .62; filter: grayscale(.42) saturate(.7); } }
      @keyframes lavakjempen-result-image-defeat { 0% { transform: translateY(-102px) rotate(0deg) scale(.8); opacity: 1; filter: saturate(1); } 100% { transform: translateY(-112px) rotate(-5deg) scale(.76); opacity: .64; filter: grayscale(.42) saturate(.7); } }
      @keyframes stormornen-boss-image-attack { 0% { transform: translateY(-116px) translateX(0) scale(.9); } 35% { transform: translateY(-116px) translateX(-7px) scale(.94); } 58% { transform: translateY(-116px) translateX(12px) scale(.98); } 100% { transform: translateY(-116px) translateX(0) scale(.9); } }
      @keyframes stormornen-boss-image-defeat { 0% { transform: translateY(-116px) rotate(0deg) scale(.9); opacity: 1; filter: saturate(1); } 100% { transform: translateY(-66px) rotate(6deg) scale(.82); opacity: .62; filter: grayscale(.42) saturate(.72); } }
      @keyframes stormornen-result-image-defeat { 0% { transform: translateY(-94px) rotate(0deg) scale(.72); opacity: 1; filter: saturate(1); } 100% { transform: translateY(-80px) rotate(6deg) scale(.68); opacity: .64; filter: grayscale(.42) saturate(.72); } }
      @keyframes krystallvokteren-boss-image-attack { 0% { transform: translateY(-136px) translateX(0) scale(.9); } 35% { transform: translateY(-136px) translateX(-6px) scale(.94); } 58% { transform: translateY(-136px) translateX(11px) scale(.98); } 100% { transform: translateY(-136px) translateX(0) scale(.9); } }
      @keyframes krystallvokteren-boss-image-defeat { 0% { transform: translateY(-136px) rotate(0deg) scale(.9); opacity: 1; filter: saturate(1); } 100% { transform: translateY(-76px) rotate(-5deg) scale(.82); opacity: .62; filter: grayscale(.42) saturate(.72); } }
      @keyframes krystallvokteren-result-image-defeat { 0% { transform: translateY(-92px) rotate(0deg) scale(.68); opacity: 1; filter: saturate(1); } 100% { transform: translateY(-82px) rotate(-5deg) scale(.64); opacity: .64; filter: grayscale(.42) saturate(.72); } }
      @keyframes mekamaskinen-boss-image-attack { 0% { transform: translateY(-124px) translateX(0) scale(.88); } 35% { transform: translateY(-124px) translateX(-6px) scale(.92); } 58% { transform: translateY(-124px) translateX(11px) scale(.96); } 100% { transform: translateY(-124px) translateX(0) scale(.88); } }
      @keyframes mekamaskinen-boss-image-defeat { 0% { transform: translateY(-118px) rotate(0deg) scale(.88); opacity: 1; filter: saturate(1); } 100% { transform: translateY(-62px) rotate(-5deg) scale(.8); opacity: .62; filter: grayscale(.42) saturate(.7); } }
      @keyframes mekamaskinen-result-image-defeat { 0% { transform: translateY(-88px) rotate(0deg) scale(.68); opacity: 1; filter: saturate(1); } 100% { transform: translateY(-78px) rotate(-5deg) scale(.64); opacity: .64; filter: grayscale(.42) saturate(.7); } }
      @keyframes morkekraken-boss-image-attack { 0% { transform: translateY(-72px) translateX(0) scale(.88); } 35% { transform: translateY(-72px) translateX(-7px) scale(.92); } 58% { transform: translateY(-72px) translateX(12px) scale(.96); } 100% { transform: translateY(-72px) translateX(0) scale(.88); } }
      @keyframes morkekraken-boss-image-defeat { 0% { transform: translateY(-72px) rotate(0deg) scale(.88); opacity: 1; filter: saturate(1); } 100% { transform: translateY(-34px) rotate(5deg) scale(.8); opacity: .62; filter: grayscale(.42) saturate(.72); } }
      @keyframes morkekraken-result-image-defeat { 0% { transform: translateY(-58px) rotate(0deg) scale(.72); opacity: 1; filter: saturate(1); } 100% { transform: translateY(-50px) rotate(5deg) scale(.68); opacity: .64; filter: grayscale(.42) saturate(.72); } }
      @keyframes regnemesteren-boss-image-attack { 0% { transform: translateY(-112px) translateX(0) scale(1); } 35% { transform: translateY(-112px) translateX(-6px) scale(1.04); } 58% { transform: translateY(-112px) translateX(11px) scale(1.08); } 100% { transform: translateY(-112px) translateX(0) scale(1); } }
      @keyframes regnemesteren-boss-image-defeat { 0% { transform: translateY(-108px) rotate(0deg) scale(.9); opacity: 1; filter: saturate(1); } 100% { transform: translateY(-58px) rotate(-5deg) scale(.82); opacity: .62; filter: grayscale(.42) saturate(.72); } }
      @keyframes regnemesteren-result-image-defeat { 0% { transform: translateY(-86px) rotate(0deg) scale(.68); opacity: 1; filter: saturate(1); } 100% { transform: translateY(-74px) rotate(-5deg) scale(.64); opacity: .64; filter: grayscale(.42) saturate(.72); } }
      @keyframes mega-regnemesteren-boss-image-attack { 0% { transform: translateY(-148px) translateX(0) scale(.92); } 35% { transform: translateY(-148px) translateX(-7px) scale(.96); } 58% { transform: translateY(-148px) translateX(12px) scale(1); } 100% { transform: translateY(-148px) translateX(0) scale(.92); } }
      @keyframes mega-regnemesteren-boss-image-defeat { 0% { transform: translateY(-134px) rotate(0deg) scale(.92); opacity: 1; filter: saturate(1); } 100% { transform: translateY(-76px) rotate(-5deg) scale(.84); opacity: .62; filter: grayscale(.42) saturate(.72); } }
      @keyframes mega-regnemesteren-result-image-defeat { 0% { transform: translateY(-88px) rotate(0deg) scale(.74); opacity: 1; filter: saturate(1); } 100% { transform: translateY(-76px) rotate(-5deg) scale(.7); opacity: .64; filter: grayscale(.42) saturate(.72); } }
      @keyframes mega-dialog-pop { 0% { opacity: 0; transform: translateY(12px) scale(.96); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
      .app-shell.app-theme-boss.app-shell-isdragen-boss { background: linear-gradient(135deg, #ecfeff, #bae6fd, #dbeafe); }
      .theme-frame.boss-isdragen-page-frame { --theme-primary: #0284c7; --theme-primary-rgb: 2 132 199; --theme-accent: #22d3ee; --theme-accent-rgb: 34 211 238; --theme-border-rgb: 125 211 252; --theme-card: #f0f9ff; --theme-shadow-rgb: 14 116 144; }
      .app-shell.app-theme-boss.app-shell-lavakjempen-boss { background: linear-gradient(135deg, #2c0a04, #7f1d1d, #f97316); }
      .theme-frame.boss-lavakjempen-page-frame { --theme-primary: #dc2626; --theme-primary-rgb: 220 38 38; --theme-accent: #f97316; --theme-accent-rgb: 249 115 22; --theme-border-rgb: 251 146 60; --theme-card: #fff7ed; --theme-shadow-rgb: 127 29 29; }
      .app-shell.app-theme-boss.app-shell-stormornen-boss { background: linear-gradient(135deg, #dbeafe, #60a5fa, #1e3a8a); }
      .theme-frame.boss-stormornen-page-frame { --theme-primary: #2563eb; --theme-primary-rgb: 37 99 235; --theme-accent: #facc15; --theme-accent-rgb: 250 204 21; --theme-border-rgb: 147 197 253; --theme-card: #eff6ff; --theme-shadow-rgb: 30 64 175; }
      .app-shell.app-theme-boss.app-shell-krystallvokteren-boss { background: linear-gradient(135deg, #ecfeff, #c4b5fd, #312e81); }
      .theme-frame.boss-krystallvokteren-page-frame { --theme-primary: #7c3aed; --theme-primary-rgb: 124 58 237; --theme-accent: #22d3ee; --theme-accent-rgb: 34 211 238; --theme-border-rgb: 196 181 253; --theme-card: #f5f3ff; --theme-shadow-rgb: 76 29 149; }
      .app-shell.app-theme-boss.app-shell-mekamaskinen-boss { background: linear-gradient(135deg, #f8fafc, #94a3b8, #0f172a); }
      .theme-frame.boss-mekamaskinen-page-frame { --theme-primary: #475569; --theme-primary-rgb: 71 85 105; --theme-accent: #facc15; --theme-accent-rgb: 250 204 21; --theme-border-rgb: 148 163 184; --theme-card: #f8fafc; --theme-shadow-rgb: 51 65 85; }
      .app-shell.app-theme-boss.app-shell-morkekraken-boss { background: linear-gradient(135deg, #020617, #0f172a, #0891b2); }
      .theme-frame.boss-morkekraken-page-frame { --theme-primary: #0891b2; --theme-primary-rgb: 8 145 178; --theme-accent: #22d3ee; --theme-accent-rgb: 34 211 238; --theme-border-rgb: 103 232 249; --theme-card: #ecfeff; --theme-shadow-rgb: 8 47 73; }
      .app-shell.app-theme-boss.app-shell-regnemesteren-boss { background: linear-gradient(135deg, #111827, #312e81, #7c3aed); }
      .theme-frame.boss-regnemesteren-page-frame { --theme-primary: #7c3aed; --theme-primary-rgb: 124 58 237; --theme-accent: #facc15; --theme-accent-rgb: 250 204 21; --theme-border-rgb: 196 181 253; --theme-card: #f8fafc; --theme-shadow-rgb: 49 46 129; }
      .app-shell.app-theme-boss.app-shell-mega-regnemesteren-boss { background: linear-gradient(135deg, #020617, #312e81, #a855f7); }
      .theme-frame.boss-mega-regnemesteren-page-frame { --theme-primary: #a855f7; --theme-primary-rgb: 168 85 247; --theme-accent: #facc15; --theme-accent-rgb: 250 204 21; --theme-border-rgb: 216 180 254; --theme-card: #faf5ff; --theme-shadow-rgb: 76 29 149; }
      .boss-difficulty-card { gap: 10px; }
      .boss-difficulty-segments { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; width: 100%; padding: 5px; border-radius: 18px; background: rgba(226,232,240,.72); border: 1px solid rgba(203,213,225,.82); }
      .boss-difficulty-segment { min-height: 42px; border: 0; border-radius: 14px; background: transparent; color: #475569; font-family: inherit; font-size: .88rem; font-weight: 1000; cursor: pointer; transition: transform .16s ease, background .16s ease, color .16s ease, box-shadow .16s ease; }
      .boss-difficulty-segment:hover { transform: translateY(-1px); background: rgba(255,255,255,.72); color: #1d4ed8; }
      .boss-difficulty-segment:focus-visible { outline: 3px solid rgba(59,130,246,.36); outline-offset: 2px; }
      .boss-difficulty-segment.selected { color: #fff; background: linear-gradient(135deg, #2563eb, #7c3aed); box-shadow: 0 8px 16px rgba(37,99,235,.22), inset 0 1px 0 rgba(255,255,255,.24); }
      .boss-ladder-panel { display: flex; flex-direction: column; gap: 8px; padding: 12px; }
      .boss-ladder-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; max-height: 520px; overflow-y: auto; padding-right: 2px; }
      .boss-ladder-card { width: 100%; min-height: 186px; border: 2px solid rgba(226,232,240,.95); border-radius: 18px; padding: 8px; display: flex; flex-direction: column; gap: 8px; align-items: stretch; text-align: center; font-family: inherit; color: #0f172a; background: rgba(255,255,255,.9); box-shadow: 0 10px 20px rgba(15,23,42,.1); cursor: pointer; transition: transform .16s ease, box-shadow .16s ease, border-color .16s ease, background .16s ease, opacity .16s ease, filter .16s ease; }
      .boss-ladder-card:hover:not(:disabled) { transform: translateY(-2px); border-color: var(--boss-card-accent, #2563eb); box-shadow: 0 14px 26px rgba(15,23,42,.14), 0 0 0 4px rgba(59,130,246,.12); }
      .boss-ladder-card:focus-visible { outline: 3px solid rgba(59,130,246,.4); outline-offset: 2px; }
      .boss-ladder-card.selected { border-color: var(--boss-card-accent, #2563eb); background: linear-gradient(180deg, rgba(255,255,255,.96), rgba(239,246,255,.92)); box-shadow: 0 0 0 4px rgba(59,130,246,.16), 0 16px 28px rgba(37,99,235,.16); }
      .boss-ladder-card.locked { background: rgba(241,245,249,.86); color: #64748b; cursor: not-allowed; opacity: .86; box-shadow: none; filter: grayscale(.26); }
      .boss-ladder-card.upcoming { background: linear-gradient(135deg, rgba(255,251,235,.92), rgba(254,243,199,.86)); border-color: rgba(245,158,11,.32); cursor: not-allowed; }
      .boss-card-media { position: relative; display: flex; align-items: center; justify-content: center; height: 104px; border-radius: 14px; overflow: hidden; background: var(--boss-card-gradient, linear-gradient(135deg, #dbeafe, #bfdbfe)); box-shadow: inset 0 -20px 30px rgba(15,23,42,.16), inset 0 1px 0 rgba(255,255,255,.35); }
      .boss-card-media::after { content: ""; position: absolute; inset: 0; background: radial-gradient(circle at 50% 18%, rgba(255,255,255,.42), transparent 46%), linear-gradient(180deg, rgba(255,255,255,.08), rgba(15,23,42,.12)); pointer-events: none; }
      .boss-ladder-index { position: absolute; top: 7px; left: 7px; z-index: 2; width: 28px; height: 28px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; font-size: .78rem; font-weight: 1000; background: rgba(255,255,255,.9); color: #075985; border: 1px solid rgba(255,255,255,.95); box-shadow: 0 5px 10px rgba(15,23,42,.14); }
      .boss-ladder-card.locked .boss-ladder-index { background: rgba(226,232,240,.94); color: #64748b; border-color: rgba(248,250,252,.8); }
      .boss-ladder-card.upcoming .boss-ladder-index { background: #fef3c7; color: #92400e; border-color: rgba(245,158,11,.34); }
      .boss-card-image { position: relative; z-index: 1; display: block; width: 110px; height: 110px; object-fit: contain; object-position: center bottom; filter: drop-shadow(0 12px 12px rgba(15,23,42,.28)); transform: translateY(5px) scale(1.02); user-select: none; pointer-events: none; }
      .boss-card-image-slime { width: 132px; height: 112px; transform: translateY(2px) scale(1.04); }
      .boss-card-image-troll { width: 116px; height: 116px; transform: translateY(6px) scale(1.06); }
      .boss-card-image-shadow { width: 118px; height: 118px; transform: translateY(5px) scale(1.04); }
      .boss-card-image-isdragen { width: 132px; height: 132px; transform: translateY(3px) scale(1.02); }
      .boss-card-image-lavakjempen { width: 110px; height: 132px; transform: translateY(14px) scale(1.02); }
      .boss-card-image-stormornen { width: 136px; height: 132px; transform: translateY(5px) scale(.98); }
      .boss-card-image-krystallvokteren { width: 112px; height: 138px; transform: translateY(9px) scale(1); }
      .boss-card-image-mekamaskinen { width: 112px; height: 132px; transform: translateY(15px) scale(1); }
      .boss-card-image-morkekraken { width: 140px; height: 112px; transform: translateY(3px) scale(1); }
      .boss-card-image-regnemesteren { width: 148px; height: 148px; transform: translateY(-18px) scale(1.1); }
      .boss-ladder-card.locked .boss-card-image { opacity: .46; filter: grayscale(.8) drop-shadow(0 8px 10px rgba(15,23,42,.18)); }
      .boss-ladder-copy { display: flex; min-width: 0; flex-direction: column; align-items: center; gap: 3px; }
      .boss-ladder-copy strong { color: inherit; font-size: clamp(.84rem, 3.5vw, .98rem); font-weight: 1000; line-height: 1.08; text-wrap: balance; }
      .boss-ladder-copy span { color: #475569; font-size: .78rem; font-weight: 900; line-height: 1.12; }
      .boss-ladder-card.locked .boss-ladder-copy span { color: #64748b; }
      .boss-ladder-copy small { min-height: 2.25em; color: #64748b; font-size: .67rem; font-weight: 850; line-height: 1.12; text-wrap: balance; }
      .boss-ladder-status { position: absolute; right: 7px; top: 7px; z-index: 2; padding: 6px 8px; border-radius: 999px; background: #dcfce7; color: #166534; font-size: .6rem; font-weight: 1000; line-height: 1; text-transform: uppercase; white-space: nowrap; letter-spacing: .04em; box-shadow: 0 5px 10px rgba(15,23,42,.12); }
      .boss-ladder-status.locked { background: #e2e8f0; color: #475569; }
      .boss-ladder-status.upcoming { background: #fef3c7; color: #92400e; }
      .boss-reset-button { min-height: 42px; font-size: .86rem; color: #475569; background: rgba(248,250,252,.9); border-color: rgba(148,163,184,.36); box-shadow: 0 8px 16px rgba(15,23,42,.08); }
      .boss-reset-confirm { margin-top: 8px; padding: 12px; border-radius: 18px; text-align: center; background: rgba(255,247,237,.94); border: 1px solid rgba(251,146,60,.36); box-shadow: 0 10px 22px rgba(124,45,18,.1); }
      .boss-reset-confirm strong { display: block; color: #7c2d12; font-size: .95rem; font-weight: 1000; line-height: 1.2; }
      .boss-reset-confirm p { margin: 6px auto 0; color: #9a3412; font-size: .8rem; font-weight: 850; line-height: 1.25; }
      .boss-reset-actions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin-top: 10px; }
      .boss-reset-actions .button { min-height: 40px; padding: 8px 10px; border-radius: 13px; font-size: .82rem; }
      .boss-reset-confirm-button { color: #fff; background: linear-gradient(135deg, #dc2626, #f97316); border: 0; box-shadow: 0 8px 16px rgba(220,38,38,.18); }
      .boss-reset-message { margin: 8px auto 0; text-align: center; color: #166534; font-size: .82rem; font-weight: 950; }
      @media (min-width: 680px) { .boss-ladder-list { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
      @media (max-width: 520px) { .boss-difficulty-segments { gap: 4px; padding: 4px; border-radius: 16px; } .boss-difficulty-segment { min-height: 38px; border-radius: 12px; font-size: .78rem; } .boss-ladder-panel { padding: 10px; } .boss-ladder-list { max-height: 346px; gap: 8px; } .boss-ladder-card { min-height: 168px; gap: 7px; padding: 7px; border-radius: 16px; } .boss-card-media { height: 92px; border-radius: 13px; } .boss-ladder-index { width: 25px; height: 25px; font-size: .7rem; top: 6px; left: 6px; } .boss-ladder-copy strong { font-size: .82rem; } .boss-ladder-copy span { font-size: .7rem; } .boss-ladder-copy small { min-height: 2.2em; font-size: .61rem; } .boss-ladder-status { right: 6px; top: 6px; padding: 5px 6px; font-size: .52rem; } .boss-card-image { width: 96px; height: 96px; } .boss-card-image-slime { width: 116px; height: 98px; transform: translateY(1px) scale(1.04); } .boss-card-image-troll, .boss-card-image-shadow { width: 102px; height: 102px; } .boss-card-image-isdragen, .boss-card-image-stormornen { width: 114px; height: 114px; } .boss-card-image-isdragen { transform: translateY(2px) scale(1.02); } .boss-card-image-stormornen { transform: translateY(4px) scale(.98); } .boss-card-image-lavakjempen, .boss-card-image-mekamaskinen { width: 98px; height: 116px; } .boss-card-image-krystallvokteren { width: 98px; height: 118px; transform: translateY(7px) scale(1); } .boss-card-image-morkekraken { width: 120px; height: 96px; transform: translateY(2px) scale(1); } .boss-card-image-regnemesteren { width: 128px; height: 128px; transform: translateY(-16px) scale(1.08); } }
      .play-compact-layout { display: flex; flex-direction: column; gap: 10px; }
      .status-row.play-status-compact { gap: 8px; margin-bottom: 0; }
      .status-row.play-status-compact .status-pill { padding: 9px 12px; min-height: 42px; border-radius: 16px; font-size: .95rem; }
      .status-row.play-status-compact .status-pill svg { width: 18px; height: 18px; }
      .question-card.play-question-compact { margin-top: 0; padding: 18px 14px; border-radius: 24px; }
      .question-card.play-question-compact .label { margin-bottom: 6px; font-size: .82rem; letter-spacing: .18em; }
      .question-card.play-question-compact h2 { font-size: clamp(2.15rem, 8vw, 3.25rem); line-height: 1; margin: 0; }
      .answer-grid.play-answer-grid-compact { gap: 10px; margin-top: 0; }
      .answer-grid.play-answer-grid-compact .answer-button { min-height: 76px; padding: 12px; border-radius: 22px; font-size: clamp(2rem, 7vw, 3.45rem); line-height: 1; }
      .feedback-area.play-feedback-compact { min-height: 28px; margin-top: 0; }
      .feedback-area.play-feedback-compact .feedback { margin: 2px 0 0; font-size: .9rem; }
      .play-compact-layout .quit-round-button { margin-top: 2px; }
      .boss-play-layout { position: relative; display: flex; flex-direction: column; gap: 8px; }
      .boss-play-layout.player-under-attack { animation: battle-screen-shake .38s ease; }
      .boss-arena { border-radius: 24px; padding: 10px 11px 11px; color: #0f172a; box-shadow: inset 0 -22px 38px rgba(15, 23, 42, 0.15), inset 0 1px 0 rgba(255,255,255,.28), 0 16px 34px rgba(15, 23, 42, 0.18); position: relative; overflow: hidden; border: 1px solid rgba(255,255,255,.62); isolation: isolate; background-size: cover; }
      .boss-arena::before { content: ""; position: absolute; inset: 0; z-index: 0; background: radial-gradient(ellipse at 50% 14%, rgba(255,255,255,.78), rgba(255,255,255,.18) 34%, transparent 58%), radial-gradient(ellipse at 50% 78%, rgba(15,23,42,.18), transparent 46%), linear-gradient(180deg, rgba(255,255,255,.18) 0%, rgba(255,255,255,0) 48%, rgba(15,23,42,.18) 100%); pointer-events: none; transition: filter .25s ease, opacity .25s ease; }
      .boss-arena::after { content: ""; position: absolute; inset: -18px; z-index: 0; background: radial-gradient(circle at 18% 28%, rgba(255,255,255,.45) 0 4px, transparent 5px), radial-gradient(circle at 74% 22%, rgba(255,255,255,.28) 0 5px, transparent 6px), radial-gradient(circle at 82% 74%, rgba(255,255,255,.34) 0 3px, transparent 4px), radial-gradient(circle at 34% 82%, rgba(255,255,255,.25) 0 6px, transparent 7px); animation: arena-drift 5.5s ease-in-out infinite; pointer-events: none; opacity: .9; transition: filter .25s ease, opacity .25s ease; }
      .boss-arena.boss-theme-slime::before { background: linear-gradient(180deg, rgba(220,252,231,.7) 0 26%, rgba(134,239,172,.38) 27% 48%, rgba(22,101,52,.3) 49% 100%), radial-gradient(ellipse at 18% 55%, rgba(21,128,61,.42) 0 16%, transparent 17%), radial-gradient(ellipse at 82% 54%, rgba(20,184,166,.34) 0 18%, transparent 19%), linear-gradient(82deg, transparent 0 13%, rgba(22,101,52,.38) 14% 15%, transparent 16% 100%), linear-gradient(98deg, transparent 0 83%, rgba(22,101,52,.32) 84% 85%, transparent 86% 100%), repeating-linear-gradient(90deg, transparent 0 24px, rgba(20,83,45,.18) 25px 27px, transparent 28px 52px); animation: arena-haze-sway 6s ease-in-out infinite; }
      .boss-arena.boss-theme-slime::after { background: radial-gradient(ellipse at 24% 78%, rgba(34,197,94,.36) 0 14px, rgba(22,163,74,.2) 15px 32px, transparent 34px), radial-gradient(ellipse at 76% 78%, rgba(45,212,191,.28) 0 12px, rgba(20,184,166,.16) 13px 27px, transparent 29px), radial-gradient(circle at 18% 35%, rgba(220,252,231,.68) 0 3px, transparent 4px), radial-gradient(circle at 31% 49%, rgba(187,247,208,.52) 0 4px, transparent 5px), radial-gradient(circle at 72% 33%, rgba(220,252,231,.58) 0 3px, transparent 4px), radial-gradient(circle at 86% 58%, rgba(187,247,208,.48) 0 5px, transparent 6px), linear-gradient(180deg, transparent 0 58%, rgba(236,253,245,.28) 70%, transparent 100%); animation-duration: 6.2s; }
      .boss-arena.boss-theme-slime.boss-arena-asset-bg::before { background: none; opacity: 0; animation: none; }
      .boss-arena.boss-theme-slime.boss-arena-asset-bg::after { background: none; opacity: 0; animation: none; }
      .boss-arena.boss-theme-troll::before { background: linear-gradient(180deg, rgba(68,64,60,.44) 0 24%, rgba(120,53,15,.24) 25% 54%, rgba(41,37,36,.36) 55% 100%), linear-gradient(118deg, transparent 0 12%, rgba(41,37,36,.5) 13% 29%, transparent 30% 100%), linear-gradient(63deg, transparent 0 66%, rgba(68,64,60,.52) 67% 85%, transparent 86% 100%), radial-gradient(ellipse at 50% 19%, rgba(254,243,199,.46), rgba(245,158,11,.16) 22%, transparent 48%), repeating-linear-gradient(90deg, rgba(28,25,23,.1) 0 10px, rgba(87,83,78,.16) 11px 18px, transparent 19px 44px); }
      .boss-arena.boss-theme-troll::after { background: linear-gradient(25deg, transparent 0 32%, rgba(41,37,36,.36) 33% 35%, transparent 36% 100%), linear-gradient(145deg, transparent 0 62%, rgba(120,53,15,.3) 63% 65%, transparent 66% 100%), radial-gradient(ellipse at 16% 74%, rgba(68,64,60,.5) 0 14px, rgba(87,83,78,.26) 15px 25px, transparent 27px), radial-gradient(ellipse at 86% 73%, rgba(87,83,78,.46) 0 18px, rgba(120,53,15,.22) 19px 31px, transparent 33px), radial-gradient(circle at 23% 30%, rgba(254,243,199,.36) 0 3px, transparent 4px), radial-gradient(circle at 72% 38%, rgba(214,211,209,.28) 0 4px, transparent 5px); animation: cave-dust-drift 5.8s ease-in-out infinite; }
      .boss-arena.boss-theme-troll.boss-arena-asset-bg::before { background: none; opacity: 0; animation: none; }
      .boss-arena.boss-theme-troll.boss-arena-asset-bg::after { background: none; opacity: 0; animation: none; }
      .boss-arena.boss-theme-troll.boss-arena-asset-bg .boss-name-title { color: #fff7ed; text-shadow: 0 2px 8px rgba(41,37,36,.82), 0 0 2px rgba(0,0,0,.62); }
      .boss-arena.boss-theme-shadow { color: #f8fafc; border-color: rgba(148,163,184,.48); }
      .boss-arena.boss-theme-shadow .boss-badge { color: #111827; background: rgba(248,250,252,.78); border-color: rgba(248,250,252,.92); }
      .boss-arena.boss-theme-shadow .boss-arena-name { color: rgba(248,250,252,.76); }
      .boss-arena.boss-theme-shadow::before { background: linear-gradient(180deg, rgba(15,23,42,.36) 0 35%, rgba(30,41,59,.44) 36% 62%, rgba(2,6,23,.58) 63% 100%), linear-gradient(90deg, transparent 0 10%, rgba(15,23,42,.58) 11% 18%, transparent 19% 39%, rgba(15,23,42,.5) 40% 48%, transparent 49% 76%, rgba(15,23,42,.58) 77% 84%, transparent 85% 100%), linear-gradient(180deg, transparent 0 17%, rgba(148,163,184,.22) 18% 19%, transparent 20% 100%), radial-gradient(ellipse at 50% 25%, rgba(251,146,60,.42), rgba(127,29,29,.2) 26%, transparent 56%); }
      .boss-arena.boss-theme-shadow::after { background: linear-gradient(28deg, transparent 0 38%, rgba(248,113,113,.45) 39% 40%, transparent 41% 100%), linear-gradient(146deg, transparent 0 61%, rgba(251,146,60,.34) 62% 63%, transparent 64% 100%), radial-gradient(ellipse at 17% 75%, rgba(15,23,42,.56) 0 20px, rgba(2,6,23,.28) 21px 35px, transparent 37px), radial-gradient(ellipse at 84% 72%, rgba(30,41,59,.5) 0 18px, rgba(127,29,29,.24) 19px 33px, transparent 35px), radial-gradient(circle at 22% 35%, rgba(248,113,113,.38) 0 3px, transparent 4px), radial-gradient(circle at 78% 28%, rgba(251,146,60,.36) 0 5px, transparent 6px), radial-gradient(ellipse at 50% 74%, rgba(2,6,23,.45), transparent 48%); animation: shadow-smoke-roll 5.2s ease-in-out infinite; }
      .boss-arena.boss-theme-shadow.boss-arena-asset-bg::before { background: none; opacity: 0; animation: none; }
      .boss-arena.boss-theme-shadow.boss-arena-asset-bg::after { background: none; opacity: 0; animation: none; }
      .boss-arena.boss-theme-shadow.boss-arena-asset-bg .boss-name-title { color: #f8fafc; text-shadow: 0 2px 8px rgba(15,23,42,.86), 0 0 10px rgba(199,210,254,.36); }
      .boss-arena.boss-theme-isdragen { color: #0f172a; border-color: rgba(186,230,253,.78); box-shadow: inset 0 -22px 38px rgba(14,116,144,.13), inset 0 1px 0 rgba(255,255,255,.5), 0 16px 34px rgba(14,116,144,.16); }
      .boss-arena.boss-theme-isdragen::before { background: radial-gradient(ellipse at 50% 12%, rgba(255,255,255,.72), rgba(224,242,254,.24) 36%, transparent 58%), linear-gradient(180deg, rgba(240,249,255,.28), rgba(14,165,233,.16)); }
      .boss-arena.boss-theme-isdragen::after { background: radial-gradient(circle at 18% 30%, rgba(255,255,255,.68) 0 3px, transparent 4px), radial-gradient(circle at 78% 24%, rgba(207,250,254,.58) 0 5px, transparent 6px), radial-gradient(circle at 84% 68%, rgba(186,230,253,.48) 0 4px, transparent 5px), linear-gradient(135deg, transparent 0 42%, rgba(255,255,255,.28) 43% 44%, transparent 45% 100%); }
      .boss-arena.boss-theme-isdragen.boss-arena-asset-bg::before { background: none; opacity: 0; animation: none; }
      .boss-arena.boss-theme-isdragen.boss-arena-asset-bg::after { background: none; opacity: 0; animation: none; }
      .boss-arena.boss-theme-isdragen.boss-arena-asset-bg .boss-name-title { color: #f8fafc; text-shadow: 0 2px 8px rgba(8,47,73,.84), 0 0 12px rgba(186,230,253,.48); }
      .boss-arena.boss-theme-lavakjempen { border-color: rgba(251,146,60,.7); box-shadow: inset 0 -24px 40px rgba(69,26,3,.24), inset 0 1px 0 rgba(254,215,170,.24), 0 16px 34px rgba(127,29,29,.22); }
      .boss-arena.boss-theme-lavakjempen.boss-arena-asset-bg::before { background: none; opacity: 0; animation: none; }
      .boss-arena.boss-theme-lavakjempen.boss-arena-asset-bg::after { background: none; opacity: 0; animation: none; }
      .boss-arena.boss-theme-lavakjempen.boss-arena-asset-bg .boss-name-title { color: #fff7ed; text-shadow: 0 2px 8px rgba(69,26,3,.86), 0 0 12px rgba(251,146,60,.42); }
      .boss-arena.boss-theme-stormornen { color: #0f172a; border-color: rgba(147,197,253,.76); box-shadow: inset 0 -22px 38px rgba(30,64,175,.18), inset 0 1px 0 rgba(255,255,255,.46), 0 16px 34px rgba(30,64,175,.18); }
      .boss-arena.boss-theme-stormornen.boss-arena-asset-bg::before { background: none; opacity: 0; animation: none; }
      .boss-arena.boss-theme-stormornen.boss-arena-asset-bg::after { background: none; opacity: 0; animation: none; }
      .boss-arena.boss-theme-stormornen.boss-arena-asset-bg .boss-name-title { color: #f8fafc; text-shadow: 0 2px 8px rgba(15,23,42,.86), 0 0 12px rgba(191,219,254,.5); }
      .boss-arena.boss-theme-krystallvokteren { color: #0f172a; border-color: rgba(196,181,253,.76); box-shadow: inset 0 -22px 38px rgba(76,29,149,.18), inset 0 1px 0 rgba(255,255,255,.46), 0 16px 34px rgba(76,29,149,.18); }
      .boss-arena.boss-theme-krystallvokteren.boss-arena-asset-bg::before { background: none; opacity: 0; animation: none; }
      .boss-arena.boss-theme-krystallvokteren.boss-arena-asset-bg::after { background: none; opacity: 0; animation: none; }
      .boss-arena.boss-theme-krystallvokteren.boss-arena-asset-bg .boss-name-title { color: #f8fafc; text-shadow: 0 2px 8px rgba(49,46,129,.86), 0 0 12px rgba(103,232,249,.42); }
      .boss-arena.boss-theme-mekamaskinen { color: #0f172a; border-color: rgba(148,163,184,.76); box-shadow: inset 0 -22px 38px rgba(51,65,85,.2), inset 0 1px 0 rgba(255,255,255,.46), 0 16px 34px rgba(15,23,42,.18); }
      .boss-arena.boss-theme-mekamaskinen.boss-arena-asset-bg::before { background: none; opacity: 0; animation: none; }
      .boss-arena.boss-theme-mekamaskinen.boss-arena-asset-bg::after { background: none; opacity: 0; animation: none; }
      .boss-arena.boss-theme-mekamaskinen.boss-arena-asset-bg .boss-name-title { color: #f8fafc; text-shadow: 0 2px 8px rgba(15,23,42,.86), 0 0 12px rgba(250,204,21,.32); }
      .boss-arena.boss-theme-morkekraken { color: #0f172a; border-color: rgba(34,211,238,.58); box-shadow: inset 0 -22px 38px rgba(2,6,23,.28), inset 0 1px 0 rgba(255,255,255,.34), 0 16px 34px rgba(8,47,73,.24); }
      .boss-arena.boss-theme-morkekraken.boss-arena-asset-bg::before { background: none; opacity: 0; animation: none; }
      .boss-arena.boss-theme-morkekraken.boss-arena-asset-bg::after { background: none; opacity: 0; animation: none; }
      .boss-arena.boss-theme-morkekraken.boss-arena-asset-bg .boss-name-title { color: #f8fafc; text-shadow: 0 2px 8px rgba(2,6,23,.86), 0 0 12px rgba(34,211,238,.38); }
      .boss-arena.boss-theme-regnemesteren { color: #0f172a; border-color: rgba(250,204,21,.62); box-shadow: inset 0 -22px 38px rgba(49,46,129,.22), inset 0 1px 0 rgba(255,255,255,.36), 0 16px 34px rgba(49,46,129,.22); }
      .boss-arena.boss-theme-regnemesteren.boss-arena-asset-bg::before { background: none; opacity: 0; animation: none; }
      .boss-arena.boss-theme-regnemesteren.boss-arena-asset-bg::after { background: none; opacity: 0; animation: none; }
      .boss-arena.boss-theme-regnemesteren.boss-arena-asset-bg .boss-name-title { color: #fefce8; text-shadow: 0 2px 8px rgba(30,27,75,.86), 0 0 12px rgba(250,204,21,.42); }
      .boss-arena.boss-theme-mega-regnemesteren { color: #0f172a; border-color: rgba(216,180,254,.66); box-shadow: inset 0 -24px 42px rgba(30,27,75,.28), inset 0 1px 0 rgba(250,204,21,.24), 0 16px 34px rgba(49,46,129,.24), 0 0 24px rgba(168,85,247,.18); }
      .boss-arena.boss-theme-mega-regnemesteren.boss-arena-asset-bg::before { background: none; opacity: 0; animation: none; }
      .boss-arena.boss-theme-mega-regnemesteren.boss-arena-asset-bg::after { background: none; opacity: 0; animation: none; }
      .boss-arena.boss-theme-mega-regnemesteren.boss-arena-asset-bg .boss-name-title { color: #fefce8; text-shadow: 0 2px 8px rgba(30,27,75,.9), 0 0 14px rgba(250,204,21,.48), 0 0 22px rgba(217,70,239,.34); }
      .boss-arena.boss-phase-angry::before { filter: saturate(1.14) contrast(1.04); }
      .boss-arena.boss-phase-angry::after { opacity: 1; filter: saturate(1.18) brightness(1.08); }
      .boss-arena.boss-phase-weak { animation: arena-danger-pulse 1.45s ease-in-out infinite; }
      .boss-arena.boss-phase-weak::before { filter: saturate(1.32) contrast(1.08) brightness(.92); }
      .boss-arena.boss-phase-weak::after { opacity: 1; filter: saturate(1.45) brightness(1.12); animation-duration: 3.6s; }
      .boss-arena.super-ready::after { opacity: 1; filter: saturate(1.25) brightness(1.08); }
      .boss-arena.super-impact { box-shadow: inset 0 -22px 38px rgba(15, 23, 42, 0.12), inset 0 0 40px rgba(251,191,36,.18), 0 16px 34px rgba(15, 23, 42, 0.18), 0 0 26px rgba(251,191,36,.26); }
      .boss-arena.super-impact::before { filter: saturate(1.22) brightness(1.08); opacity: 1; }
      .boss-arena.super-impact::after { filter: saturate(1.28) brightness(1.12); opacity: 1; }
      .boss-scenery { position: absolute; inset: 0; z-index: 0; width: 100%; height: 100%; pointer-events: none; opacity: .72; }
      .boss-scenery-slime { opacity: .68; filter: saturate(1.06); }
      .boss-scenery-troll { opacity: .74; filter: contrast(1.04); }
      .boss-scenery-shadow { opacity: .78; filter: saturate(1.18); }
      .boss-arena.boss-phase-weak .boss-scenery { opacity: .86; filter: saturate(1.28) contrast(1.05) brightness(.92); }
      .boss-arena.super-impact .boss-scenery { opacity: .86; filter: saturate(1.18) brightness(1.08); }
      .arena-atmosphere { position: absolute; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; animation: atmosphere-drift 6s ease-in-out infinite; }
      .arena-atmosphere span { position: absolute; bottom: 34px; width: 8px; height: 8px; border-radius: 999px; animation: atmosphere-rise 4.8s ease-in-out infinite; opacity: 0; }
      .arena-atmosphere span:nth-child(1) { left: 18%; animation-delay: .2s; }
      .arena-atmosphere span:nth-child(2) { left: 72%; width: 6px; height: 6px; animation-delay: 1.6s; }
      .arena-atmosphere span:nth-child(3) { left: 52%; width: 10px; height: 10px; animation-delay: 2.8s; }
      .atmosphere-slime span { background: rgba(220,252,231,.72); box-shadow: 0 0 10px rgba(34,197,94,.45); }
      .atmosphere-troll span { width: 5px; height: 5px; background: rgba(254,243,199,.42); box-shadow: 0 0 9px rgba(120,53,15,.32); }
      .atmosphere-shadow span { background: rgba(248,113,113,.48); box-shadow: 0 0 12px rgba(251,146,60,.5); }
      .boss-intro-banner { position: absolute; top: 42px; left: 50%; z-index: 8; width: min(86%, 360px); padding: 10px 12px; border-radius: 18px; text-align: center; pointer-events: none; background: rgba(255,255,255,.88); border: 2px solid rgba(255,255,255,.94); box-shadow: 0 16px 30px rgba(15,23,42,.22), 0 0 0 5px rgba(255,255,255,.14); animation: boss-intro-reveal 1.8s ease-out forwards; }
      .boss-intro-banner span { display: block; font-size: .68rem; font-weight: 1000; text-transform: uppercase; letter-spacing: .12em; color: #f97316; }
      .boss-intro-banner strong { display: block; font-size: 1.08rem; line-height: 1.05; color: #0f172a; }
      .boss-intro-banner em { display: block; margin-top: 3px; font-size: .76rem; line-height: 1.2; font-style: normal; font-weight: 900; color: #475569; }
      .intro-slime { background: rgba(240,253,244,.9); border-color: rgba(134,239,172,.88); }
      .intro-troll { background: rgba(255,251,235,.9); border-color: rgba(245,158,11,.55); }
      .intro-shadow { background: rgba(15,23,42,.88); border-color: rgba(248,113,113,.46); }
      .intro-shadow strong, .intro-shadow em { color: #f8fafc; }
      .intro-isdragen { background: rgba(240,249,255,.92); border-color: rgba(125,211,252,.72); box-shadow: 0 16px 30px rgba(14,116,144,.18), 0 0 0 5px rgba(224,242,254,.22); }
      .intro-isdragen span { color: #0284c7; }
      .boss-retaliation { position: absolute; inset: 0; z-index: 3; pointer-events: none; border-radius: inherit; animation: boss-retaliation-pop .46s ease-out forwards; }
      .boss-retaliation-slime { background: radial-gradient(circle at 50% 62%, rgba(34,197,94,.34) 0 12px, transparent 13px), radial-gradient(circle at 38% 56%, rgba(187,247,208,.45) 0 8px, transparent 9px), radial-gradient(circle at 64% 50%, rgba(74,222,128,.36) 0 10px, transparent 11px), linear-gradient(180deg, transparent, rgba(22,163,74,.16)); }
      .boss-retaliation-troll { background: radial-gradient(ellipse at 50% 80%, rgba(120,53,15,.34), transparent 42%), radial-gradient(circle at 32% 70%, rgba(214,211,209,.44) 0 5px, transparent 6px), radial-gradient(circle at 68% 64%, rgba(168,162,158,.4) 0 6px, transparent 7px); }
      .boss-retaliation-shadow { background: radial-gradient(ellipse at 50% 62%, rgba(127,29,29,.38), transparent 42%), radial-gradient(circle at 50% 50%, rgba(251,146,60,.28), transparent 26%), linear-gradient(180deg, rgba(2,6,23,.18), rgba(2,6,23,.32)); }
      .boss-retaliation-isdragen { background: radial-gradient(ellipse at 50% 66%, rgba(14,165,233,.32), transparent 42%), radial-gradient(circle at 44% 54%, rgba(224,242,254,.52) 0 9px, transparent 10px), radial-gradient(circle at 62% 46%, rgba(103,232,249,.38) 0 12px, transparent 13px), linear-gradient(180deg, rgba(240,249,255,.08), rgba(14,116,144,.18)); }
      .boss-arena-inner { position: relative; z-index: 1; }
      .boss-topline { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 2px; }
      .boss-name-title { font-weight: 900; font-size: 1.05rem; line-height: 1; }
      .boss-arena-name { font-size: .72rem; opacity: .78; font-weight: 800; line-height: 1.1; }
      .boss-badge { font-size: .64rem; font-weight: 1000; padding: 6px 8px; border-radius: 999px; background: rgba(255,255,255,.72); border: 1px solid rgba(255,255,255,.8); }
      .boss-stage { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 2px; min-height: 118px; padding: 0 0 5px; isolation: isolate; perspective: 520px; }
      .boss-stage.boss-stage-slime { min-height: 136px; padding-top: 6px; }
      .boss-stage::before { content: ""; position: absolute; left: 7%; right: 7%; bottom: 0; height: 46px; border-radius: 50%; background: radial-gradient(ellipse at center, rgba(255,255,255,.72) 0%, rgba(255,255,255,.36) 38%, rgba(15,23,42,.16) 74%, rgba(15,23,42,0) 100%); transform: rotateX(62deg); transform-origin: center bottom; z-index: 0; box-shadow: inset 0 -10px 20px rgba(15,23,42,.08); }
      .boss-stage::after { content: ""; position: absolute; top: 0; left: 50%; width: 190px; height: 88px; border-radius: 50%; background: radial-gradient(ellipse at center, rgba(255,255,255,.48), rgba(255,255,255,.16) 42%, rgba(255,255,255,0) 72%); transform: translateX(-50%); z-index: 0; pointer-events: none; }
      .boss-stage-slime::before { background: none; box-shadow: none; animation: none; }
      .boss-stage-slime::after { background: none; opacity: 0; animation: none; }
      .boss-stage.boss-stage-troll { min-height: 150px; padding-top: 8px; padding-bottom: 8px; }
      .boss-stage-troll::before { background: radial-gradient(ellipse at center, rgba(250,204,21,.36) 0%, rgba(146,64,14,.3) 42%, rgba(68,64,60,.28) 68%, rgba(41,37,36,0) 100%), linear-gradient(24deg, transparent 0 35%, rgba(41,37,36,.46) 36% 38%, transparent 39% 100%), linear-gradient(146deg, transparent 0 56%, rgba(120,53,15,.38) 57% 60%, transparent 61% 100%), linear-gradient(7deg, rgba(87,83,78,.18) 0 28%, transparent 29% 100%); box-shadow: inset 0 -12px 18px rgba(68,64,60,.24), 0 9px 18px rgba(120,53,15,.18); }
      .boss-stage-troll::after { background: radial-gradient(ellipse at center, rgba(254,243,199,.46), rgba(245,158,11,.14) 38%, rgba(120,53,15,0) 72%), radial-gradient(ellipse at 22% 70%, rgba(68,64,60,.34) 0 12px, transparent 14px), radial-gradient(ellipse at 78% 72%, rgba(87,83,78,.32) 0 10px, transparent 12px); animation: cave-dust-drift 6s ease-in-out infinite; }
      .boss-arena.boss-theme-troll.boss-arena-asset-bg .boss-stage-troll::before { background: none; box-shadow: none; animation: none; }
      .boss-arena.boss-theme-troll.boss-arena-asset-bg .boss-stage-troll::after { background: none; opacity: 0; animation: none; }
      .boss-stage.boss-stage-shadow { min-height: 148px; padding-top: 8px; padding-bottom: 8px; }
      .boss-stage-shadow::before { background: radial-gradient(ellipse at center, rgba(248,113,113,.34) 0%, rgba(15,23,42,.46) 42%, rgba(2,6,23,.4) 70%, rgba(2,6,23,0) 100%), linear-gradient(30deg, transparent 0 38%, rgba(248,113,113,.48) 39% 41%, transparent 42% 100%), linear-gradient(150deg, transparent 0 58%, rgba(251,146,60,.34) 59% 61%, transparent 62% 100%), repeating-linear-gradient(90deg, rgba(15,23,42,.16) 0 12px, transparent 13px 26px); box-shadow: inset 0 -14px 20px rgba(2,6,23,.36), 0 0 24px rgba(127,29,29,.28); }
      .boss-stage-shadow::after { background: radial-gradient(ellipse at center, rgba(251,146,60,.36), rgba(127,29,29,.22) 34%, rgba(2,6,23,0) 74%), linear-gradient(90deg, transparent 0 26%, rgba(248,113,113,.38) 27% 28%, transparent 29% 72%, rgba(251,146,60,.28) 73% 74%, transparent 75% 100%); animation: shadow-smoke-roll 4.8s ease-in-out infinite; }
      .boss-arena.boss-theme-shadow.boss-arena-asset-bg .boss-stage-shadow::before { background: none; box-shadow: none; animation: none; }
      .boss-arena.boss-theme-shadow.boss-arena-asset-bg .boss-stage-shadow::after { background: none; opacity: 0; animation: none; }
      .boss-stage.boss-stage-isdragen { min-height: 186px; padding-top: 4px; padding-bottom: 6px; }
      .boss-stage-isdragen::before { background: radial-gradient(ellipse at center, rgba(224,242,254,.46) 0%, rgba(14,165,233,.28) 42%, rgba(8,47,73,.2) 70%, rgba(8,47,73,0) 100%); box-shadow: inset 0 -14px 20px rgba(14,116,144,.18), 0 0 24px rgba(103,232,249,.24); }
      .boss-stage-isdragen::after { background: radial-gradient(ellipse at center, rgba(240,249,255,.54), rgba(103,232,249,.2) 38%, rgba(14,165,233,0) 72%), linear-gradient(90deg, transparent 0 28%, rgba(255,255,255,.42) 29% 30%, transparent 31% 70%, rgba(186,230,253,.34) 71% 72%, transparent 73% 100%); }
      .boss-arena.boss-theme-isdragen.boss-arena-asset-bg .boss-stage-isdragen::before { background: none; box-shadow: none; animation: none; }
      .boss-arena.boss-theme-isdragen.boss-arena-asset-bg .boss-stage-isdragen::after { background: none; opacity: 0; animation: none; }
      .boss-stage.boss-stage-lavakjempen { min-height: 172px; padding-top: 8px; padding-bottom: 8px; }
      .boss-stage-lavakjempen::before { background: radial-gradient(ellipse at center, rgba(251,146,60,.42) 0%, rgba(220,38,38,.32) 42%, rgba(69,26,3,.3) 70%, rgba(69,26,3,0) 100%); box-shadow: inset 0 -14px 20px rgba(69,26,3,.28), 0 0 24px rgba(249,115,22,.28); }
      .boss-stage-lavakjempen::after { background: radial-gradient(ellipse at center, rgba(254,215,170,.42), rgba(249,115,22,.2) 38%, rgba(127,29,29,0) 72%), linear-gradient(90deg, transparent 0 26%, rgba(254,215,170,.26) 27% 28%, transparent 29% 72%, rgba(248,113,113,.22) 73% 74%, transparent 75% 100%); animation: arena-haze-sway 5.8s ease-in-out infinite; }
      .boss-stage.boss-stage-stormornen { min-height: 175px; padding-top: 8px; padding-bottom: 8px; }
      .boss-stage-stormornen::before { background: radial-gradient(ellipse at center, rgba(219,234,254,.44) 0%, rgba(59,130,246,.28) 42%, rgba(15,23,42,.22) 70%, rgba(15,23,42,0) 100%); box-shadow: inset 0 -14px 20px rgba(30,64,175,.2), 0 0 24px rgba(96,165,250,.24); }
      .boss-stage-stormornen::after { background: radial-gradient(ellipse at center, rgba(255,255,255,.5), rgba(147,197,253,.22) 38%, rgba(37,99,235,0) 72%), linear-gradient(116deg, transparent 0 33%, rgba(250,204,21,.34) 34% 35%, transparent 36% 100%), linear-gradient(62deg, transparent 0 62%, rgba(219,234,254,.3) 63% 64%, transparent 65% 100%); animation: arena-drift 5.2s ease-in-out infinite; }
      .boss-arena.boss-theme-stormornen.boss-arena-asset-bg .boss-stage-stormornen::before { background: none; box-shadow: none; animation: none; }
      .boss-arena.boss-theme-stormornen.boss-arena-asset-bg .boss-stage-stormornen::after { background: none; opacity: 0; animation: none; }
      .boss-stage.boss-stage-krystallvokteren { min-height: 172px; padding-top: 8px; padding-bottom: 8px; }
      .boss-stage-krystallvokteren::before { background: radial-gradient(ellipse at center, rgba(221,214,254,.44) 0%, rgba(124,58,237,.28) 42%, rgba(49,46,129,.24) 70%, rgba(49,46,129,0) 100%); box-shadow: inset 0 -14px 20px rgba(76,29,149,.2), 0 0 24px rgba(103,232,249,.2); }
      .boss-stage-krystallvokteren::after { background: radial-gradient(ellipse at center, rgba(255,255,255,.5), rgba(167,139,250,.22) 38%, rgba(124,58,237,0) 72%), linear-gradient(132deg, transparent 0 34%, rgba(103,232,249,.34) 35% 36%, transparent 37% 100%), linear-gradient(48deg, transparent 0 62%, rgba(221,214,254,.3) 63% 64%, transparent 65% 100%); animation: arena-drift 5.6s ease-in-out infinite; }
      .boss-arena.boss-theme-krystallvokteren.boss-arena-asset-bg .boss-stage-krystallvokteren::before { background: none; box-shadow: none; animation: none; }
      .boss-arena.boss-theme-krystallvokteren.boss-arena-asset-bg .boss-stage-krystallvokteren::after { background: none; opacity: 0; animation: none; }
      .boss-stage.boss-stage-mekamaskinen { min-height: 172px; padding-top: 8px; padding-bottom: 8px; }
      .boss-stage-mekamaskinen::before { background: radial-gradient(ellipse at center, rgba(226,232,240,.46) 0%, rgba(100,116,139,.28) 42%, rgba(15,23,42,.24) 70%, rgba(15,23,42,0) 100%); box-shadow: inset 0 -14px 20px rgba(15,23,42,.2), 0 0 24px rgba(250,204,21,.16); }
      .boss-stage-mekamaskinen::after { background: radial-gradient(ellipse at center, rgba(255,255,255,.48), rgba(148,163,184,.2) 38%, rgba(71,85,105,0) 72%), linear-gradient(118deg, transparent 0 34%, rgba(250,204,21,.28) 35% 36%, transparent 37% 100%), linear-gradient(62deg, transparent 0 62%, rgba(226,232,240,.3) 63% 64%, transparent 65% 100%); animation: arena-drift 5.4s ease-in-out infinite; }
      .boss-arena.boss-theme-mekamaskinen.boss-arena-asset-bg .boss-stage-mekamaskinen::before { background: none; box-shadow: none; animation: none; }
      .boss-arena.boss-theme-mekamaskinen.boss-arena-asset-bg .boss-stage-mekamaskinen::after { background: none; opacity: 0; animation: none; }
      .boss-stage.boss-stage-morkekraken { min-height: 160px; padding-top: 8px; padding-bottom: 8px; }
      .boss-stage-morkekraken::before { background: radial-gradient(ellipse at center, rgba(34,211,238,.36) 0%, rgba(14,116,144,.3) 42%, rgba(2,6,23,.26) 70%, rgba(2,6,23,0) 100%); box-shadow: inset 0 -14px 20px rgba(2,6,23,.28), 0 0 24px rgba(34,211,238,.22); }
      .boss-stage-morkekraken::after { background: radial-gradient(ellipse at center, rgba(236,254,255,.42), rgba(34,211,238,.2) 38%, rgba(14,116,144,0) 72%), linear-gradient(115deg, transparent 0 34%, rgba(103,232,249,.24) 35% 36%, transparent 37% 100%), linear-gradient(64deg, transparent 0 62%, rgba(14,165,233,.24) 63% 64%, transparent 65% 100%); animation: arena-drift 5.8s ease-in-out infinite; }
      .boss-arena.boss-theme-morkekraken.boss-arena-asset-bg .boss-stage-morkekraken::before { background: none; box-shadow: none; animation: none; }
      .boss-arena.boss-theme-morkekraken.boss-arena-asset-bg .boss-stage-morkekraken::after { background: none; opacity: 0; animation: none; }
      .boss-stage.boss-stage-regnemesteren { min-height: 170px; padding-top: 8px; padding-bottom: 8px; }
      .boss-stage-regnemesteren::before { background: radial-gradient(ellipse at center, rgba(250,204,21,.34) 0%, rgba(124,58,237,.28) 42%, rgba(30,27,75,.24) 70%, rgba(30,27,75,0) 100%); box-shadow: inset 0 -14px 20px rgba(49,46,129,.22), 0 0 24px rgba(250,204,21,.22); }
      .boss-stage-regnemesteren::after { background: radial-gradient(ellipse at center, rgba(255,255,255,.46), rgba(196,181,253,.2) 38%, rgba(124,58,237,0) 72%), linear-gradient(124deg, transparent 0 34%, rgba(250,204,21,.3) 35% 36%, transparent 37% 100%), linear-gradient(56deg, transparent 0 62%, rgba(221,214,254,.28) 63% 64%, transparent 65% 100%); animation: arena-drift 5.4s ease-in-out infinite; }
      .boss-arena.boss-theme-regnemesteren.boss-arena-asset-bg .boss-stage-regnemesteren::before { background: none; box-shadow: none; animation: none; }
      .boss-arena.boss-theme-regnemesteren.boss-arena-asset-bg .boss-stage-regnemesteren::after { background: none; opacity: 0; animation: none; }
      .boss-stage.boss-stage-mega-regnemesteren { min-height: 192px; padding-top: 8px; padding-bottom: 8px; }
      .boss-stage-mega-regnemesteren::before { background: radial-gradient(ellipse at center, rgba(250,204,21,.34) 0%, rgba(168,85,247,.28) 42%, rgba(15,23,42,.28) 70%, rgba(15,23,42,0) 100%); box-shadow: inset 0 -14px 20px rgba(30,27,75,.28), 0 0 28px rgba(217,70,239,.28); }
      .boss-stage-mega-regnemesteren::after { background: radial-gradient(ellipse at center, rgba(255,255,255,.42), rgba(217,70,239,.2) 38%, rgba(124,58,237,0) 72%), linear-gradient(124deg, transparent 0 34%, rgba(250,204,21,.32) 35% 36%, transparent 37% 100%), linear-gradient(56deg, transparent 0 62%, rgba(216,180,254,.3) 63% 64%, transparent 65% 100%); animation: arena-drift 5.2s ease-in-out infinite; }
      .boss-arena.boss-theme-mega-regnemesteren.boss-arena-asset-bg .boss-stage-mega-regnemesteren::before { background: none; box-shadow: none; animation: none; }
      .boss-arena.boss-theme-mega-regnemesteren.boss-arena-asset-bg .boss-stage-mega-regnemesteren::after { background: none; opacity: 0; animation: none; }
      .boss-stage-weak::before { filter: saturate(1.28) brightness(.95); box-shadow: inset 0 -14px 22px rgba(127,29,29,.22), 0 0 22px rgba(239,68,68,.22); }
      .boss-stage-weak::after { opacity: .95; filter: saturate(1.35) brightness(1.08); }
      .boss-stage.super-ready::after { animation: super-ring-surge 1.05s ease-in-out infinite; background: radial-gradient(ellipse at center, rgba(254,243,199,.78), rgba(251,191,36,.3) 38%, rgba(255,255,255,0) 72%); }
      .boss-stage.super-impact::after { opacity: .9; filter: saturate(1.22) brightness(1.16); }
      .hero-attack { position: absolute; left: 50%; bottom: 18px; z-index: 5; width: 16px; height: 16px; border-radius: 999px; background: radial-gradient(circle, #fff 0 24%, #bfdbfe 25% 55%, rgba(59,130,246,.24) 56% 100%); box-shadow: 0 0 16px rgba(59,130,246,.72), 0 0 0 5px rgba(219,234,254,.3); animation: hero-energy-shot .5s ease-out forwards; pointer-events: none; }
      .hero-attack::after { content: ""; position: absolute; left: 50%; bottom: -30px; width: 7px; height: 58px; border-radius: 999px; background: linear-gradient(180deg, rgba(219,234,254,0), rgba(219,234,254,.86), rgba(96,165,250,0)); transform-origin: center bottom; animation: hero-energy-trail .5s ease-out forwards; }
      .hero-attack.super { width: 24px; height: 24px; background: radial-gradient(circle, #fff 0 20%, #fef3c7 21% 50%, rgba(251,146,60,.28) 51% 100%); box-shadow: 0 0 24px rgba(251,191,36,.9), 0 0 0 8px rgba(251,191,36,.2), 0 0 38px rgba(249,115,22,.54); animation-duration: .62s; }
      .hero-attack.super::after { width: 12px; height: 76px; bottom: -42px; background: linear-gradient(180deg, rgba(254,243,199,0), rgba(254,243,199,.92), rgba(249,115,22,0)); animation-duration: .62s; }
      .boss-figure-wrap { position: relative; z-index: 2; width: 145px; height: 92px; display: grid; place-items: center; margin-bottom: -2px; animation: boss-float 2.5s ease-in-out infinite; transform-origin: center bottom; transition: transform .2s ease; }
      .boss-figure-wrap.hit { animation: boss-hit-shake .42s ease; }
      .boss-svg { width: 145px; height: 100px; overflow: visible; filter: drop-shadow(0 12px 13px rgba(15,23,42,.31)) drop-shadow(0 2px 2px rgba(255,255,255,.32)); }
      .boss-image { width: 164px; height: 116px; object-fit: contain; user-select: none; pointer-events: none; filter: drop-shadow(0 13px 14px rgba(15,23,42,.32)) drop-shadow(0 2px 2px rgba(255,255,255,.32)); transform-origin: center bottom; }
      .boss-image-slime { width: 200px; height: 142px; transform: translateY(-30px) scale(1.18); }
      .boss-image-troll { width: 170px; height: 170px; transform: translateY(-58px) scale(1); }
      .boss-stage .boss-image-troll { transform: translateY(-58px) scale(.96); }
      .boss-image-shadow { width: 164px; height: 164px; transform: translateY(-50px) scale(.96); filter: drop-shadow(0 15px 16px rgba(2,6,23,.36)) drop-shadow(0 0 12px rgba(199,210,254,.24)) drop-shadow(0 0 10px rgba(248,113,113,.22)); }
      .boss-image-isdragen { width: 220px; height: 330px; transform: translateY(-148px) scale(.94); filter: drop-shadow(0 15px 16px rgba(8,47,73,.3)) drop-shadow(0 0 14px rgba(186,230,253,.34)); }
      .boss-image-lavakjempen { width: 166px; height: 221px; transform: translateY(-120px) scale(.86); filter: drop-shadow(0 16px 18px rgba(69,26,3,.38)) drop-shadow(0 0 16px rgba(249,115,22,.32)); }
      .boss-image-stormornen { width: 230px; height: 260px; transform: translateY(-116px) scale(.9); filter: drop-shadow(0 15px 16px rgba(15,23,42,.34)) drop-shadow(0 0 16px rgba(147,197,253,.34)); }
      .boss-image-krystallvokteren { width: 205px; height: 307px; transform: translateY(-136px) scale(.9); filter: drop-shadow(0 16px 18px rgba(49,46,129,.34)) drop-shadow(0 0 16px rgba(103,232,249,.28)); }
      .boss-image-mekamaskinen { width: 185px; height: 247px; transform: translateY(-124px) scale(.88); filter: drop-shadow(0 16px 18px rgba(15,23,42,.36)) drop-shadow(0 0 16px rgba(250,204,21,.24)); }
      .boss-image-morkekraken { width: 250px; height: 205px; transform: translateY(-104px) scale(.88); filter: drop-shadow(0 15px 16px rgba(2,6,23,.4)) drop-shadow(0 0 16px rgba(34,211,238,.3)); }
      .boss-image-regnemesteren { width: 286px; height: 320px; transform: translateY(-112px) scale(1); filter: drop-shadow(0 16px 18px rgba(30,27,75,.36)) drop-shadow(0 0 16px rgba(250,204,21,.26)); }
      .boss-image-mega-regnemesteren { width: 254px; height: 326px; transform: translateY(-148px) scale(.92); filter: drop-shadow(0 17px 20px rgba(15,23,42,.42)) drop-shadow(0 0 18px rgba(250,204,21,.26)) drop-shadow(0 0 20px rgba(217,70,239,.22)); }
      .boss-image.boss-action-attack { animation: boss-attack-lunge ${BOSS_ATTACK_HOLD_MS}ms ease-out; }
      .boss-image-slime.boss-action-attack { animation: slime-boss-image-attack ${SLIME_ATTACK_FRAME_MS}ms ease-out; }
      .boss-image-troll.boss-action-attack,
      .boss-image-troll.boss-state-attack { animation: troll-boss-image-attack ${TROLL_ATTACK_FRAME_MS}ms ease-out; }
      .boss-image-shadow.boss-action-attack,
      .boss-image-shadow.boss-state-attack { animation: shadow-boss-image-attack ${SHADOW_GOLEM_ATTACK_FRAME_MS}ms ease-out; }
      .boss-image-isdragen.boss-action-attack,
      .boss-image-isdragen.boss-state-attack { animation: isdragen-boss-image-attack ${ISDRAGEN_ATTACK_FRAME_MS}ms ease-out; }
      .boss-image-lavakjempen.boss-action-attack,
      .boss-image-lavakjempen.boss-state-attack { animation: lavakjempen-boss-image-attack ${LAVAKJEMPEN_ATTACK_FRAME_MS}ms ease-out; }
      .boss-image-stormornen.boss-action-attack,
      .boss-image-stormornen.boss-state-attack { animation: stormornen-boss-image-attack ${STORMORNEN_ATTACK_FRAME_MS}ms ease-out; }
      .boss-image-krystallvokteren.boss-action-attack,
      .boss-image-krystallvokteren.boss-state-attack { animation: krystallvokteren-boss-image-attack ${KRYSTALLVOKTEREN_ATTACK_FRAME_MS}ms ease-out; }
      .boss-image-mekamaskinen.boss-action-attack,
      .boss-image-mekamaskinen.boss-state-attack { animation: mekamaskinen-boss-image-attack ${MEKAMASKINEN_ATTACK_FRAME_MS}ms ease-out; }
      .boss-image-morkekraken.boss-action-attack,
      .boss-image-morkekraken.boss-state-attack { animation: morkekraken-boss-image-attack ${MORKEKRAKEN_ATTACK_FRAME_MS}ms ease-out; }
      .boss-image-regnemesteren.boss-action-attack,
      .boss-image-regnemesteren.boss-state-attack { animation: regnemesteren-boss-image-attack ${REGNEMESTEREN_ATTACK_FRAME_MS}ms ease-out; }
      .boss-image-mega-regnemesteren.boss-action-attack,
      .boss-image-mega-regnemesteren.boss-state-attack { animation: mega-regnemesteren-boss-image-attack ${MEGA_REGNEMESTEREN_ATTACK_FRAME_MS}ms ease-out; }
      .boss-image.boss-action-defeat,
      .boss-image.boss-defeated { animation: boss-defeat-fall .75s ease-out forwards; }
      .boss-image-slime.boss-action-defeat,
      .boss-image-slime.boss-defeated { animation: slime-boss-image-defeat .75s ease-out forwards; }
      .boss-image-troll.boss-action-defeat,
      .boss-image-troll.boss-defeated { animation: troll-boss-image-defeat .95s ease-out forwards; }
      .boss-image-shadow.boss-action-defeat,
      .boss-image-shadow.boss-defeated { animation: shadow-boss-image-defeat .9s ease-out forwards; }
      .boss-image-isdragen.boss-action-defeat,
      .boss-image-isdragen.boss-defeated { animation: isdragen-boss-image-defeat .9s ease-out forwards; }
      .boss-image-lavakjempen.boss-action-defeat,
      .boss-image-lavakjempen.boss-defeated { animation: lavakjempen-boss-image-defeat .9s ease-out forwards; }
      .boss-image-stormornen.boss-action-defeat,
      .boss-image-stormornen.boss-defeated { animation: stormornen-boss-image-defeat .9s ease-out forwards; }
      .boss-image-krystallvokteren.boss-action-defeat,
      .boss-image-krystallvokteren.boss-defeated { animation: krystallvokteren-boss-image-defeat .9s ease-out forwards; }
      .boss-image-mekamaskinen.boss-action-defeat,
      .boss-image-mekamaskinen.boss-defeated { animation: mekamaskinen-boss-image-defeat .9s ease-out forwards; }
      .boss-image-morkekraken.boss-action-defeat,
      .boss-image-morkekraken.boss-defeated { animation: morkekraken-boss-image-defeat .9s ease-out forwards; }
      .boss-image-regnemesteren.boss-action-defeat,
      .boss-image-regnemesteren.boss-defeated { animation: regnemesteren-boss-image-defeat .9s ease-out forwards; }
      .boss-image-mega-regnemesteren.boss-action-defeat,
      .boss-image-mega-regnemesteren.boss-defeated { animation: mega-regnemesteren-boss-image-defeat .9s ease-out forwards; }
      .boss-image.boss-state-lowHp { filter: drop-shadow(0 13px 14px rgba(15,23,42,.34)) drop-shadow(0 0 14px rgba(248,113,113,.24)); }
      .boss-image-troll.boss-state-lowHp { filter: drop-shadow(0 13px 14px rgba(15,23,42,.36)) drop-shadow(0 0 16px rgba(251,191,36,.28)); }
      .boss-image-shadow.boss-state-lowHp { filter: drop-shadow(0 14px 15px rgba(2,6,23,.4)) drop-shadow(0 0 14px rgba(248,113,113,.26)); }
      .boss-image-isdragen.boss-state-lowHp { transform: translateY(-148px) scale(1); filter: drop-shadow(0 14px 15px rgba(8,47,73,.38)) drop-shadow(0 0 18px rgba(103,232,249,.42)); }
      .boss-image-lavakjempen.boss-state-lowHp { transform: translateY(-120px) scale(.89); filter: drop-shadow(0 16px 18px rgba(69,26,3,.44)) drop-shadow(0 0 18px rgba(248,113,113,.36)); }
      .boss-image-stormornen.boss-state-lowHp { transform: translateY(-116px) scale(.92); filter: drop-shadow(0 15px 16px rgba(15,23,42,.38)) drop-shadow(0 0 18px rgba(250,204,21,.28)); }
      .boss-image-krystallvokteren.boss-state-lowHp { transform: translateY(-136px) scale(.92); filter: drop-shadow(0 16px 18px rgba(49,46,129,.4)) drop-shadow(0 0 18px rgba(103,232,249,.34)); }
      .boss-image-mekamaskinen.boss-state-lowHp { transform: translateY(-124px) scale(.9); filter: drop-shadow(0 16px 18px rgba(15,23,42,.42)) drop-shadow(0 0 18px rgba(250,204,21,.32)); }
      .boss-image-morkekraken.boss-state-lowHp { transform: translateY(-104px) scale(.9); filter: drop-shadow(0 15px 16px rgba(2,6,23,.46)) drop-shadow(0 0 18px rgba(34,211,238,.38)); }
      .boss-image-regnemesteren.boss-state-lowHp { transform: translateY(-112px) scale(1.02); filter: drop-shadow(0 16px 18px rgba(30,27,75,.42)) drop-shadow(0 0 18px rgba(250,204,21,.36)); }
      .boss-image-mega-regnemesteren.boss-state-lowHp { transform: translateY(-148px) scale(.95); filter: drop-shadow(0 17px 20px rgba(15,23,42,.46)) drop-shadow(0 0 20px rgba(250,204,21,.34)) drop-shadow(0 0 24px rgba(217,70,239,.3)); }
      .boss-svg-shadow { width: 158px; height: 112px; filter: drop-shadow(0 12px 13px rgba(2,6,23,.38)) drop-shadow(0 0 10px rgba(248,113,113,.26)); }
      .boss-svg .boss-body-main { transform-box: fill-box; transform-origin: center bottom; animation: boss-breathe 2.2s ease-in-out infinite; }
      .boss-svg-slime .boss-body-main { animation-name: slime-squash; animation-duration: 2.25s; }
      .boss-svg-troll .boss-body-main { animation-name: troll-stomp; animation-duration: 2.85s; }
      .boss-svg-shadow .boss-body-main { animation-name: boss-breathe; animation-duration: 2.65s; opacity: 1; }
      .boss-svg .boss-eye { transform-box: fill-box; transform-origin: center; animation: boss-eye-blink 4.4s ease-in-out infinite; }
      .boss-svg .boss-aura { transform-box: fill-box; transform-origin: center; animation: aura-pulse 2.4s ease-in-out infinite; }
      .boss-svg .slime-drip { transform-box: fill-box; transform-origin: center top; animation: goo-wiggle 2.1s ease-in-out infinite; }
      .boss-svg .slime-bubble { transform-box: fill-box; transform-origin: center; animation: slime-bubble-float 2.6s ease-in-out infinite; }
      .boss-svg .troll-crown { transform-box: fill-box; transform-origin: center bottom; animation: crown-wobble 2.8s ease-in-out infinite; }
      .boss-svg .golem-core { transform-box: fill-box; transform-origin: center; animation: core-pulse 1.6s ease-in-out infinite; }
      .boss-svg .shadow-wisp { transform-box: fill-box; transform-origin: center; animation: shadow-wisp-drift 3.2s ease-in-out infinite; }
      .boss-svg .shadow-mist-back { opacity: .26; }
      .boss-svg .boss-hit-flash { opacity: 0; transform-box: fill-box; transform-origin: center; pointer-events: none; }
      .boss-svg.boss-action-hit .boss-hit-flash { animation: hit-flash-pop .42s ease-out; }
      .boss-svg.boss-action-hit .boss-body-main, .boss-svg.boss-action-hit .boss-head { filter: brightness(1.45) saturate(1.5); }
      .boss-svg.boss-action-attack { animation: boss-attack-lunge ${BOSS_ATTACK_HOLD_MS}ms ease-out; }
      .boss-svg.boss-action-defeat, .boss-svg.boss-defeated { animation: boss-defeat-fall .75s ease-out forwards; }
      .boss-svg.boss-mood-angry .boss-brow { stroke-width: 11; }
      .boss-svg.boss-mood-angry .boss-aura { animation-duration: 1.55s; filter: saturate(1.35); }
      .boss-svg.boss-mood-weak .boss-body-main { animation-duration: 1.1s; filter: saturate(.78); }
      .boss-svg.boss-mood-weak .boss-eye { animation-duration: 2.1s; }
      .boss-svg.boss-mood-weak:not(.boss-action-attack):not(.boss-action-defeat):not(.boss-defeated) { animation: weak-stress .46s ease-in-out infinite; }
      .boss-svg-shadow.boss-mood-angry .boss-aura, .boss-svg-shadow.boss-mood-weak .boss-aura { filter: saturate(1.6) brightness(1.12); }
      .boss-attack-effect { position: absolute; top: 32px; left: 50%; transform: translateX(-50%); z-index: 6; font-weight: 1000; font-size: 1.05rem; padding: 7px 10px; border-radius: 999px; color: #111827; background: rgba(255,255,255,.88); box-shadow: 0 10px 22px rgba(15,23,42,.22); border: 2px solid rgba(255,255,255,.95); animation: attack-word-pop .86s ease-out forwards; pointer-events: none; white-space: nowrap; }
      .boss-attack-effect.attack-slime { top: 4px; right: 8px; left: auto; transform: none; color: #14532d; }
      .boss-attack-effect.attack-troll { top: 4px; right: 8px; left: auto; transform: none; color: #78350f; }
      .boss-attack-effect.attack-shadow { top: 4px; right: 8px; left: auto; transform: none; color: #7f1d1d; }
      .boss-attack-effect.attack-isdragen { top: 4px; right: 8px; left: auto; transform: none; color: #075985; }
      .boss-attack-effect.attack-lavakjempen { top: 4px; right: 8px; left: auto; transform: none; color: #7c2d12; }
      .boss-attack-effect.attack-stormornen { top: 4px; right: 8px; left: auto; transform: none; color: #1e3a8a; }
      .boss-attack-effect.attack-krystallvokteren { top: 4px; right: 8px; left: auto; transform: none; color: #4c1d95; }
      .boss-attack-effect.attack-mekamaskinen { top: 4px; right: 8px; left: auto; transform: none; color: #334155; }
      .boss-attack-effect.attack-morkekraken { top: 4px; right: 8px; left: auto; transform: none; color: #0e7490; }
      .boss-attack-effect.attack-regnemesteren { top: 4px; right: 8px; left: auto; transform: none; color: #6d28d9; }
      .boss-attack-effect.attack-mega-regnemesteren { top: 4px; right: 8px; left: auto; transform: none; color: #7e22ce; }
      .boss-arena.boss-attacking .boss-attack-effect { background: #fff1f2; border-color: rgba(248,113,113,.7); box-shadow: 0 0 0 5px rgba(239,68,68,.14), 0 14px 28px rgba(127,29,29,.28); }
      .boss-result-hero { padding-top: 20px; }
      .boss-result-hero h1 { font-size: clamp(2.3rem, 10vw, 4.2rem); text-transform: uppercase; letter-spacing: 0; }
      .boss-result-hero p { margin-top: 10px; }
      .boss-result-card { position: relative; overflow: hidden; margin-top: 22px; padding: 24px 18px 22px; animation: result-card-pop .34s ease-out; }
      .boss-result-card::before { content: ""; position: absolute; inset: 0; pointer-events: none; background: radial-gradient(circle at 50% 12%, rgba(255,255,255,.78), transparent 30%), radial-gradient(circle at 18% 24%, rgba(250,204,21,.22), transparent 22%), radial-gradient(circle at 82% 30%, rgba(56,189,248,.18), transparent 24%); }
      .boss-result-card.won { border-color: rgba(250,204,21,.75); box-shadow: 0 18px 38px rgba(217,119,6,.16), 0 0 0 5px rgba(250,204,21,.12); }
      .boss-result-card.lost { color: #f8fafc; background: linear-gradient(155deg, #111827, #334155); border-color: rgba(148,163,184,.4); box-shadow: 0 18px 38px rgba(15,23,42,.2); }
      .boss-result-card.lost::before { background: radial-gradient(circle at 50% 12%, rgba(248,250,252,.16), transparent 32%), radial-gradient(circle at 82% 28%, rgba(248,113,113,.14), transparent 25%); }
      .boss-result-card > * { position: relative; z-index: 1; }
      .boss-result-banner { display: inline-flex; align-items: center; justify-content: center; min-height: 34px; margin: 0 auto 12px; padding: 8px 13px; border-radius: 999px; font-weight: 1000; font-size: .8rem; letter-spacing: .08em; text-transform: uppercase; background: rgba(255,255,255,.82); color: #0f172a; border: 1px solid rgba(255,255,255,.9); }
      .boss-result-card.won .boss-result-banner { background: #fef3c7; color: #92400e; border-color: #facc15; box-shadow: 0 0 18px rgba(250,204,21,.35); }
      .boss-result-card.lost .boss-result-banner { background: rgba(15,23,42,.75); color: #fecaca; border-color: rgba(248,113,113,.4); }
      .boss-result-burst { position: absolute; inset: 10px 20px auto; height: 120px; pointer-events: none; z-index: 0; }
      .result-spark { position: absolute; width: 10px; height: 10px; border-radius: 999px; background: #facc15; box-shadow: 0 0 14px rgba(250,204,21,.72); animation: result-spark-drift 1.35s ease-in-out infinite; }
      .result-spark:nth-child(1) { left: 9%; top: 34px; animation-delay: 0s; }
      .result-spark:nth-child(2) { left: 21%; top: 8px; width: 7px; height: 7px; animation-delay: .16s; }
      .result-spark:nth-child(3) { left: 37%; top: 42px; background: #38bdf8; animation-delay: .28s; }
      .result-spark:nth-child(4) { left: 55%; top: 12px; width: 8px; height: 8px; animation-delay: .4s; }
      .result-spark:nth-child(5) { right: 25%; top: 44px; background: #86efac; animation-delay: .56s; }
      .result-spark:nth-child(6) { right: 10%; top: 18px; animation-delay: .7s; }
      .boss-result-card.lost .result-spark { background: #94a3b8; box-shadow: 0 0 12px rgba(148,163,184,.45); opacity: .6; }
      .boss-result-figure { width: 230px; height: 165px; margin: 0 auto 12px; display: grid; place-items: center; }
      .boss-result-figure .boss-svg { width: 225px; height: 160px; }
      .boss-result-figure .boss-image-shadow { width: 205px; height: 205px; transform: translateY(-8px) scale(.98); }
      .boss-result-figure.boss-result-defeated-isdragen { width: 290px; height: 230px; margin-bottom: 2px; }
      .boss-result-figure.boss-result-standing-isdragen { width: 260px; height: 210px; margin-bottom: 8px; }
      .boss-result-figure .boss-image-isdragen { width: 240px; height: 360px; transform: translateY(-96px) scale(.8); }
      .boss-result-figure.boss-result-defeated-lavakjempen { width: 250px; height: 200px; margin-bottom: -2px; }
      .boss-result-figure.boss-result-standing-lavakjempen { width: 230px; height: 176px; margin-bottom: 8px; }
      .boss-result-figure .boss-image-lavakjempen { width: 218px; height: 291px; transform: translateY(-102px) scale(.8); }
      .boss-result-figure.boss-result-defeated-stormornen { width: 260px; height: 200px; margin-bottom: 2px; }
      .boss-result-figure.boss-result-standing-stormornen { width: 240px; height: 178px; margin-bottom: 8px; }
      .boss-result-figure .boss-image-stormornen { width: 225px; height: 300px; transform: translateY(-94px) scale(.72); }
      .boss-result-figure.boss-result-defeated-krystallvokteren { width: 250px; height: 200px; margin-bottom: 2px; }
      .boss-result-figure.boss-result-standing-krystallvokteren { width: 252px; height: 194px; margin-bottom: 6px; }
      .boss-result-figure .boss-image-krystallvokteren { width: 210px; height: 315px; transform: translateY(-92px) scale(.68); }
      .boss-result-figure.boss-result-defeated-mekamaskinen { width: 250px; height: 200px; margin-bottom: 2px; }
      .boss-result-figure.boss-result-standing-mekamaskinen { width: 232px; height: 176px; margin-bottom: 8px; }
      .boss-result-figure .boss-image-mekamaskinen { width: 210px; height: 280px; transform: translateY(-88px) scale(.68); }
      .boss-result-figure.boss-result-defeated-morkekraken { width: 260px; height: 190px; margin-bottom: 2px; }
      .boss-result-figure.boss-result-standing-morkekraken { width: 250px; height: 178px; margin-bottom: 8px; }
      .boss-result-figure .boss-image-morkekraken { width: 240px; height: 240px; transform: translateY(-58px) scale(.72); }
      .boss-result-figure.boss-result-defeated-regnemesteren { width: 250px; height: 198px; margin-bottom: 2px; }
      .boss-result-figure.boss-result-standing-regnemesteren { width: 360px; height: 285px; margin-bottom: 8px; }
      .boss-result-figure .boss-image-regnemesteren { width: 220px; height: 246px; transform: translateY(-86px) scale(.68); }
      .boss-result-figure.boss-result-defeated-mega-regnemesteren { width: 280px; height: 220px; margin-bottom: 2px; }
      .boss-result-figure.boss-result-standing-mega-regnemesteren { width: 360px; height: 282px; margin-bottom: 8px; }
      .boss-result-figure .boss-image-mega-regnemesteren { width: 250px; height: 321px; transform: translateY(-88px) scale(.74); }
      .boss-result-defeated { animation: result-boss-victory 1.7s ease-in-out infinite; }
      .boss-result-defeated .boss-svg { filter: grayscale(.42) saturate(.72) drop-shadow(0 12px 14px rgba(15,23,42,.22)); }
      .boss-result-standing { animation: result-boss-loom 1.55s ease-in-out infinite; }
      .boss-result-standing .boss-svg { filter: drop-shadow(0 14px 16px rgba(15,23,42,.34)); }
      .boss-result-card.lost .boss-result-standing-slime .boss-image-slime { transform: translateY(4px) scale(1.18); }
      .boss-result-card.lost .boss-result-standing-troll .boss-image-troll { transform: translateY(8px) scale(1); }
      .boss-result-card.lost .boss-result-standing-shadow .boss-image-shadow { transform: translateY(-10px) scale(.98); }
      .boss-result-card.lost .boss-result-standing-isdragen .boss-image-isdragen { transform: translateY(-70px) scale(.78); }
      .boss-result-card.lost .boss-result-standing-lavakjempen .boss-image-lavakjempen { transform: translateY(-94px) scale(.66); }
      .boss-result-card.lost .boss-result-standing-stormornen .boss-image-stormornen { transform: translateY(-78px) scale(.66); }
      .boss-result-card.lost .boss-result-standing-krystallvokteren .boss-image-krystallvokteren { width: 260px; height: 390px; transform: translateY(-118px) scale(.74); }
      .boss-result-card.lost .boss-result-standing-mekamaskinen .boss-image-mekamaskinen { transform: translateY(-76px) scale(.62); }
      .boss-result-card.lost .boss-result-standing-morkekraken .boss-image-morkekraken { transform: translateY(-48px) scale(.66); }
      .boss-result-card.lost .boss-result-standing-regnemesteren .boss-image-regnemesteren { width: 355px; height: 398px; transform: translateY(-54px) scale(.9); }
      .boss-result-card.lost .boss-result-standing-mega-regnemesteren .boss-image-mega-regnemesteren { width: 350px; height: 449px; transform: translateY(-118px) scale(.82); }
      .boss-result-card.lost .boss-image.boss-action-attack,
      .boss-result-card.lost .boss-image.boss-state-attack,
      .boss-result-card.lost .boss-svg.boss-action-attack { animation: none; }
      .boss-result-card.boss-result-isdragen .treasure-wrap.large svg { width: 180px; height: 142px; }
      .boss-result-card.won .boss-result-defeated-troll .boss-image-troll.boss-action-defeat,
      .boss-result-card.won .boss-result-defeated-troll .boss-image-troll.boss-defeated { animation: troll-result-image-defeat .95s ease-out forwards; }
      .boss-result-card.won .boss-result-defeated-shadow .boss-image-shadow.boss-action-defeat,
      .boss-result-card.won .boss-result-defeated-shadow .boss-image-shadow.boss-defeated { animation: shadow-result-image-defeat .9s ease-out forwards; }
      .boss-result-card.won .boss-result-defeated-isdragen .boss-image-isdragen.boss-action-defeat,
      .boss-result-card.won .boss-result-defeated-isdragen .boss-image-isdragen.boss-defeated { animation: isdragen-result-image-defeat .9s ease-out forwards; }
      .boss-result-card.won .boss-result-defeated-lavakjempen .boss-image-lavakjempen.boss-action-defeat,
      .boss-result-card.won .boss-result-defeated-lavakjempen .boss-image-lavakjempen.boss-defeated { animation: lavakjempen-result-image-defeat .9s ease-out forwards; }
      .boss-result-card.won .boss-result-defeated-stormornen .boss-image-stormornen.boss-action-defeat,
      .boss-result-card.won .boss-result-defeated-stormornen .boss-image-stormornen.boss-defeated { animation: stormornen-result-image-defeat .9s ease-out forwards; }
      .boss-result-card.won .boss-result-defeated-krystallvokteren .boss-image-krystallvokteren.boss-action-defeat,
      .boss-result-card.won .boss-result-defeated-krystallvokteren .boss-image-krystallvokteren.boss-defeated { animation: krystallvokteren-result-image-defeat .9s ease-out forwards; }
      .boss-result-card.won .boss-result-defeated-mekamaskinen .boss-image-mekamaskinen.boss-action-defeat,
      .boss-result-card.won .boss-result-defeated-mekamaskinen .boss-image-mekamaskinen.boss-defeated { animation: mekamaskinen-result-image-defeat .9s ease-out forwards; }
      .boss-result-card.won .boss-result-defeated-morkekraken .boss-image-morkekraken.boss-action-defeat,
      .boss-result-card.won .boss-result-defeated-morkekraken .boss-image-morkekraken.boss-defeated { animation: morkekraken-result-image-defeat .9s ease-out forwards; }
      .boss-result-card.won .boss-result-defeated-regnemesteren .boss-image-regnemesteren.boss-action-defeat,
      .boss-result-card.won .boss-result-defeated-regnemesteren .boss-image-regnemesteren.boss-defeated { animation: regnemesteren-result-image-defeat .9s ease-out forwards; }
      .boss-result-card.won .boss-result-defeated-mega-regnemesteren .boss-image-mega-regnemesteren.boss-action-defeat,
      .boss-result-card.won .boss-result-defeated-mega-regnemesteren .boss-image-mega-regnemesteren.boss-defeated { animation: mega-regnemesteren-result-image-defeat .9s ease-out forwards; }
      .boss-result-card h2 { margin-top: 8px; }
      .boss-result-card.lost h2, .boss-result-card.lost span { color: #f8fafc; }
      .boss-result-stats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin-top: 16px; }
      .boss-result-stat { min-height: 58px; padding: 9px 7px; border-radius: 16px; background: rgba(248,250,252,.82); border: 1px solid rgba(226,232,240,.9); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; }
      .boss-result-card.lost .boss-result-stat { background: rgba(15,23,42,.42); border-color: rgba(148,163,184,.34); }
      .boss-result-stat strong { margin: 0; font-size: 1.35rem; line-height: 1; color: #0f172a; }
      .boss-result-card.lost .boss-result-stat strong { color: #f8fafc; }
      .boss-result-stat span { font-size: .68rem; font-weight: 1000; text-transform: uppercase; letter-spacing: .04em; color: #64748b; }
      .final-diploma-hero h1 { font-size: clamp(2.15rem, 8vw, 3.55rem); text-transform: none; color: #4c1d95; text-shadow: 0 3px 0 rgba(254,243,199,.9), 0 12px 26px rgba(168,85,247,.26); }
      .final-diploma-hero p { margin-top: 8px; font-size: clamp(1rem, 3.8vw, 1.24rem); font-weight: 1000; color: #7c2d12; }
      .final-diploma-name-card input { text-align: center; font-weight: 1000; }
      .final-diploma-card { padding: 18px 12px 20px; background: linear-gradient(150deg, #fdf4ff 0%, #fff7ed 45%, #fef3c7 100%); border-color: rgba(250,204,21,.88); box-shadow: 0 22px 44px rgba(126,34,206,.2), 0 0 0 6px rgba(250,204,21,.16), inset 0 1px 0 rgba(255,255,255,.86); }
      .final-diploma-card::before { background: radial-gradient(circle at 50% 4%, rgba(250,204,21,.5), transparent 32%), radial-gradient(circle at 10% 28%, rgba(236,72,153,.28), transparent 24%), radial-gradient(circle at 88% 24%, rgba(124,58,237,.3), transparent 26%), linear-gradient(135deg, rgba(255,255,255,.3), rgba(254,243,199,.18)); }
      .final-diploma-card::after { content: ""; position: absolute; inset: 10px; border-radius: 22px; border: 1px solid rgba(250,204,21,.34); pointer-events: none; z-index: 0; box-shadow: inset 0 0 28px rgba(217,70,239,.14); }
      .final-diploma-frame { position: relative; width: min(100%, 430px); margin: 0 auto 12px; border-radius: 18px; overflow: hidden; background: #111827; box-shadow: 0 20px 38px rgba(88,28,135,.26), 0 0 0 4px rgba(250,204,21,.28), 0 0 34px rgba(217,70,239,.2); }
      .final-diploma-image { display: block; width: 100%; height: auto; user-select: none; }
      .final-diploma-name { position: absolute; left: 45%; top: 49%; width: 66%; transform: translate(-50%, -50%); box-sizing: border-box; display: flex; align-items: center; justify-content: center; min-height: 7%; overflow: hidden; text-align: center; color: #1e1b4b; font-size: clamp(1.38rem, 6vw, 2.25rem); font-weight: 1000; line-height: 1.05; white-space: nowrap; text-shadow: 0 2px 0 rgba(255,255,255,.75), 0 5px 12px rgba(120,53,15,.18); }
      .final-diploma-name-medium { font-size: clamp(1.12rem, 5vw, 1.85rem); }
      .final-diploma-name-long { font-size: clamp(.86rem, 3.8vw, 1.32rem); }
      .final-diploma-screenshot-note { display: block; width: 100%; max-width: none; margin: 10px 0 0; padding: 0 12px; box-sizing: border-box; color: #581c87; font-weight: 1000; line-height: 1.25; text-align: center; text-wrap: balance; }
      @media (max-width: 520px) { .final-diploma-card { padding: 12px 8px 16px; } .final-diploma-frame { width: min(100%, 340px); border-radius: 14px; } .final-diploma-name { width: 68%; top: 49%; } }
      .boss-shadow { position: relative; z-index: 1; width: 108px; height: 14px; margin-top: -8px; border-radius: 999px; background: radial-gradient(ellipse at center, rgba(15,23,42,.36), rgba(15,23,42,.16) 48%, rgba(15,23,42,0) 74%); filter: blur(2px); transform: rotateX(58deg); opacity: .88; transition: width .2s ease, opacity .2s ease; }
      .boss-stage-troll .boss-shadow { width: 122px; opacity: .94; }
      .boss-stage-shadow .boss-shadow { background: radial-gradient(ellipse at center, rgba(2,6,23,.48), rgba(127,29,29,.2) 48%, rgba(15,23,42,0) 76%); }
      .boss-stage-shadow .boss-figure-wrap { width: 150px; height: 94px; }
      .boss-stage-shadow .boss-shadow { width: 120px; opacity: .94; }
      .boss-stage-isdragen .boss-figure-wrap { width: 220px; height: 112px; }
      .boss-stage-isdragen .boss-shadow { width: 156px; opacity: .92; background: radial-gradient(ellipse at center, rgba(8,47,73,.34), rgba(14,165,233,.18) 48%, rgba(14,165,233,0) 76%); }
      .boss-stage-lavakjempen .boss-figure-wrap { width: 170px; height: 88px; }
      .boss-stage-lavakjempen .boss-shadow { width: 118px; opacity: .94; background: radial-gradient(ellipse at center, rgba(69,26,3,.5), rgba(220,38,38,.2) 48%, rgba(249,115,22,0) 76%); }
      .boss-stage-stormornen .boss-figure-wrap { width: 230px; height: 94px; }
      .boss-stage-stormornen .boss-shadow { width: 150px; opacity: .9; background: radial-gradient(ellipse at center, rgba(15,23,42,.38), rgba(37,99,235,.18) 48%, rgba(96,165,250,0) 76%); }
      .boss-stage-krystallvokteren .boss-figure-wrap { width: 205px; height: 96px; }
      .boss-stage-krystallvokteren .boss-shadow { width: 124px; opacity: .92; background: radial-gradient(ellipse at center, rgba(49,46,129,.42), rgba(124,58,237,.18) 48%, rgba(103,232,249,0) 76%); }
      .boss-stage-mekamaskinen .boss-figure-wrap { width: 185px; height: 90px; }
      .boss-stage-mekamaskinen .boss-shadow { width: 126px; opacity: .92; background: radial-gradient(ellipse at center, rgba(15,23,42,.42), rgba(100,116,139,.2) 48%, rgba(250,204,21,0) 76%); }
      .boss-stage-morkekraken .boss-figure-wrap { width: 250px; height: 84px; }
      .boss-stage-morkekraken .boss-shadow { width: 158px; opacity: .9; background: radial-gradient(ellipse at center, rgba(2,6,23,.46), rgba(14,116,144,.2) 48%, rgba(34,211,238,0) 76%); }
      .boss-stage-regnemesteren .boss-figure-wrap { width: 286px; height: 110px; }
      .boss-stage-regnemesteren .boss-shadow { width: 132px; opacity: .92; background: radial-gradient(ellipse at center, rgba(30,27,75,.42), rgba(124,58,237,.18) 48%, rgba(250,204,21,0) 76%); }
      .boss-stage-mega-regnemesteren .boss-figure-wrap { width: 254px; height: 112px; }
      .boss-stage-mega-regnemesteren .boss-shadow { width: 146px; opacity: .94; background: radial-gradient(ellipse at center, rgba(15,23,42,.5), rgba(124,58,237,.22) 48%, rgba(250,204,21,0) 76%); }
      .boss-arena.boss-phase-weak .boss-shadow { width: 116px; opacity: 1; }
      .damage-popup { position: absolute; top: 24px; left: 50%; transform: translateX(-50%); font-size: 1.65rem; font-weight: 1000; color: #dc2626; padding: 2px 9px; border-radius: 999px; background: rgba(255,255,255,.44); text-shadow: 0 3px 0 rgba(255,255,255,.9), 0 6px 14px rgba(0,0,0,.24); animation: damage-pop .82s ease-out forwards; pointer-events: none; z-index: 5; }
      .damage-popup.damage-troll:not(.super) { left: 38%; }
      .damage-popup.super { color: #f59e0b; font-size: 2rem; background: rgba(255,251,235,.72); box-shadow: 0 0 0 6px rgba(251,191,36,.16), 0 0 26px rgba(251,191,36,.72); text-shadow: 0 3px 0 rgba(255,255,255,.95), 0 0 18px rgba(251,191,36,.86), 0 8px 18px rgba(0,0,0,.24); animation: damage-heavy-pop .98s ease-out forwards; }
      .boss-hp-wrap { background: rgba(255,255,255,.76); border-radius: 16px; padding: 7px; border: 1px solid rgba(255,255,255,.86); box-shadow: inset 0 1px 0 rgba(255,255,255,.75), 0 8px 16px rgba(15,23,42,.1); }
      .boss-hp-label { display: flex; justify-content: space-between; font-weight: 900; font-size: .76rem; margin-bottom: 3px; }
      .boss-hp-bar { height: 16px; border-radius: 999px; background: linear-gradient(180deg, rgba(15,23,42,.28), rgba(15,23,42,.12)); overflow: hidden; border: 2px solid rgba(255,255,255,.88); box-shadow: inset 0 3px 7px rgba(15,23,42,.22); position: relative; }
      .boss-hp-bar::after { content: ""; position: absolute; inset: 0; background: repeating-linear-gradient(90deg, rgba(255,255,255,.34) 0 2px, transparent 2px 13px); mix-blend-mode: soft-light; pointer-events: none; }
      .boss-hp-fill { position: relative; height: 100%; border-radius: 999px; overflow: hidden; transition: width .35s ease; background: linear-gradient(90deg, #22c55e 0%, #84cc16 44%, #facc15 66%, #f97316 84%, #ef4444 100%); box-shadow: inset 0 2px 3px rgba(255,255,255,.45), inset 0 -4px 6px rgba(15,23,42,.2), 0 0 12px rgba(34,197,94,.28); }
      .boss-hp-fill::after { content: ""; position: absolute; top: 0; bottom: 0; left: -60%; width: 58%; background: linear-gradient(90deg, transparent, rgba(255,255,255,.62), transparent); animation: hp-shine 1.7s ease-in-out infinite; }
      .boss-arena.boss-phase-angry .boss-hp-fill { box-shadow: inset 0 2px 3px rgba(255,255,255,.45), inset 0 -4px 6px rgba(15,23,42,.2), 0 0 15px rgba(249,115,22,.42); }
      .boss-arena.boss-phase-weak .boss-hp-fill { background: linear-gradient(90deg, #f97316, #ef4444, #991b1b); box-shadow: inset 0 2px 3px rgba(255,255,255,.35), inset 0 -4px 6px rgba(15,23,42,.26), 0 0 18px rgba(239,68,68,.62); animation: hp-danger-throb .82s ease-in-out infinite; }
      .player-panel { background: white; border-radius: 18px; padding: 8px 10px; box-shadow: 0 10px 22px rgba(15, 23, 42, .09); border: 1px solid rgba(226,232,240,.9); position: relative; overflow: hidden; }
      .player-panel.hit { animation: player-hit-shake .35s ease; background: #fff1f2; border-color: rgba(248,113,113,.55); box-shadow: 0 0 0 5px rgba(239,68,68,.08), 0 12px 24px rgba(127,29,29,.13); }
      .player-panel.hit::after { content: ""; position: absolute; inset: 0; background: radial-gradient(circle at 18% 50%, rgba(239,68,68,.18), transparent 42%); pointer-events: none; }
      .boss-compact-status { display: grid; grid-template-columns: auto 1fr; align-items: center; gap: 10px; }
      .heart-row { display: flex; justify-content: flex-start; gap: 5px; margin-bottom: 0; font-size: 1.18rem; line-height: 1; }
      .heart-lost { opacity: .25; filter: grayscale(1); transform: scale(.86); }
      .super-area { min-width: 0; }
      .super-meter { display: grid; grid-template-columns: repeat(5, 1fr); gap: 5px; align-items: center; }
      .super-meter.ready { animation: super-meter-ready .82s ease-in-out infinite; }
      .super-cell { height: 9px; border-radius: 999px; background: #e2e8f0; border: 1px solid rgba(148,163,184,.6); transition: all .18s ease; box-shadow: inset 0 1px 0 rgba(255,255,255,.65); }
      .super-cell.filled { background: linear-gradient(90deg, #facc15, #f97316); border-color: #f59e0b; }
      .super-cell.ready { animation: super-pulse .7s ease-in-out infinite; background: linear-gradient(180deg, #f8fafc, #e2e8f0); border-color: #f59e0b; box-shadow: 0 0 18px rgba(251,191,36,.75), inset 0 1px 0 rgba(255,255,255,.7); }
      .super-meter-label { display: flex; justify-content: space-between; align-items: center; font-weight: 900; font-size: .7rem; margin-bottom: 3px; }
      .boss-question-card { margin-top: 0; padding-top: 10px; padding-bottom: 10px; }
      .boss-question-card h2 { font-size: 2rem; line-height: 1; margin: 4px 0 0; }
      .boss-play-layout .answer-grid { gap: 10px; margin-top: 8px; }
      .boss-play-layout .answer-button { min-height: 74px; padding: 14px 10px; border-radius: 22px; font-size: clamp(2rem, 6vw, 2.45rem); line-height: 1; }
      .boss-play-layout.boss-play-slime .answer-button:not(.correct):not(.wrong) { background: linear-gradient(135deg, #15803d, #22c55e 54%, #84cc16); box-shadow: 0 18px 34px rgba(21,128,61,.24), inset 0 1px 0 rgba(255,255,255,.28); text-shadow: 0 2px 5px rgba(20,83,45,.34); }
      .boss-play-layout.boss-play-troll .answer-button:not(.correct):not(.wrong) { background: linear-gradient(135deg, #92400e, #d97706 52%, #f59e0b); box-shadow: 0 18px 34px rgba(146,64,14,.24), inset 0 1px 0 rgba(255,255,255,.24); text-shadow: 0 2px 5px rgba(69,26,3,.34); }
      .boss-play-layout.boss-play-shadow .answer-button:not(.correct):not(.wrong) { background: linear-gradient(135deg, #4f46e5, #7c3aed 55%, #8b5cf6); box-shadow: 0 18px 34px rgba(49,46,129,.24), inset 0 1px 0 rgba(255,255,255,.24); text-shadow: 0 2px 5px rgba(30,27,75,.34); }
      .boss-play-layout.boss-play-isdragen .answer-button:not(.correct):not(.wrong) { background: linear-gradient(135deg, #0284c7, #06b6d4 52%, #67e8f9); box-shadow: 0 18px 34px rgba(14,116,144,.22), inset 0 1px 0 rgba(255,255,255,.3); text-shadow: 0 2px 5px rgba(8,47,73,.34); }
      .boss-play-layout.boss-play-lavakjempen .answer-button:not(.correct):not(.wrong) { background: linear-gradient(135deg, #991b1b, #dc2626 48%, #f97316); box-shadow: 0 18px 34px rgba(127,29,29,.24), inset 0 1px 0 rgba(255,255,255,.24); text-shadow: 0 2px 5px rgba(69,26,3,.36); }
      .boss-play-layout.boss-play-stormornen .answer-button:not(.correct):not(.wrong) { background: linear-gradient(135deg, #1d4ed8, #2563eb 52%, #facc15); box-shadow: 0 18px 34px rgba(30,64,175,.24), inset 0 1px 0 rgba(255,255,255,.26); text-shadow: 0 2px 5px rgba(30,58,138,.36); }
      .boss-play-layout.boss-play-krystallvokteren .answer-button:not(.correct):not(.wrong) { background: linear-gradient(135deg, #5b21b6, #7c3aed 52%, #22d3ee); box-shadow: 0 18px 34px rgba(76,29,149,.24), inset 0 1px 0 rgba(255,255,255,.26); text-shadow: 0 2px 5px rgba(49,46,129,.36); }
      .boss-play-layout.boss-play-mekamaskinen .answer-button:not(.correct):not(.wrong) { background: linear-gradient(135deg, #334155, #64748b 52%, #facc15); box-shadow: 0 18px 34px rgba(51,65,85,.24), inset 0 1px 0 rgba(255,255,255,.26); text-shadow: 0 2px 5px rgba(15,23,42,.36); }
      .boss-play-layout.boss-play-morkekraken .answer-button:not(.correct):not(.wrong) { background: linear-gradient(135deg, #0f172a, #0e7490 52%, #22d3ee); box-shadow: 0 18px 34px rgba(8,47,73,.24), inset 0 1px 0 rgba(255,255,255,.26); text-shadow: 0 2px 5px rgba(2,6,23,.36); }
      .boss-play-layout.boss-play-regnemesteren .answer-button:not(.correct):not(.wrong) { background: linear-gradient(135deg, #312e81, #7c3aed 52%, #facc15); box-shadow: 0 18px 34px rgba(49,46,129,.24), inset 0 1px 0 rgba(255,255,255,.26); text-shadow: 0 2px 5px rgba(30,27,75,.36); }
      .boss-play-layout.boss-play-mega-regnemesteren .answer-button:not(.correct):not(.wrong) { background: linear-gradient(135deg, #1e1b4b, #a855f7 52%, #facc15); box-shadow: 0 18px 34px rgba(49,46,129,.26), inset 0 1px 0 rgba(255,255,255,.26); text-shadow: 0 2px 5px rgba(30,27,75,.38); }
      .boss-play-layout .quit-round-button { margin-top: 2px; }
      .boss-play-layout .answer-button.correct { animation: answer-correct-pop .34s ease-out; box-shadow: 0 0 0 5px rgba(34,197,94,.14), 0 14px 24px rgba(21,128,61,.16); }
      .boss-play-layout .answer-button.wrong { animation: answer-wrong-jolt .28s ease-out; }
      .boss-dev-panel { display: grid; grid-template-columns: auto repeat(2, minmax(0, 1fr)); align-items: center; gap: 6px; padding: 7px; border-radius: 16px; background: rgba(15,23,42,.06); border: 1px dashed rgba(100,116,139,.42); }
      .boss-dev-label { color: #475569; font-size: .68rem; font-weight: 1000; text-transform: uppercase; letter-spacing: .08em; white-space: nowrap; }
      .boss-dev-button { min-height: 34px; border: 0; border-radius: 11px; color: #fff; font-family: inherit; font-size: .78rem; font-weight: 1000; cursor: pointer; background: linear-gradient(135deg, #475569, #1e293b); box-shadow: 0 8px 14px rgba(15,23,42,.14), inset 0 1px 0 rgba(255,255,255,.18); }
      .boss-dev-button:hover:not(:disabled) { transform: translateY(-1px); }
      .boss-dev-button:disabled { cursor: not-allowed; opacity: .45; box-shadow: none; }
      .boss-dev-button.win { background: linear-gradient(135deg, #15803d, #22c55e); }
      .boss-dev-button.loss { background: linear-gradient(135deg, #991b1b, #ef4444); }
      .mega-boss-transition { position: absolute; inset: -6px; z-index: 30; display: flex; align-items: center; justify-content: center; padding: 18px; border-radius: 28px; background: radial-gradient(circle at 50% 28%, rgba(168,85,247,.34), transparent 36%), rgba(2,6,23,.72); backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px); }
      .mega-boss-dialog { width: min(100%, 340px); padding: 20px 16px 16px; border-radius: 24px; text-align: center; background: linear-gradient(150deg, rgba(250,245,255,.98), rgba(254,243,199,.94)); border: 2px solid rgba(250,204,21,.75); box-shadow: 0 24px 50px rgba(2,6,23,.36), 0 0 0 6px rgba(168,85,247,.18), inset 0 1px 0 rgba(255,255,255,.86); animation: mega-dialog-pop .24s ease-out; }
      .mega-boss-dialog span { display: inline-flex; align-items: center; justify-content: center; min-height: 28px; padding: 6px 10px; border-radius: 999px; color: #581c87; background: rgba(250,204,21,.28); border: 1px solid rgba(250,204,21,.56); font-size: .72rem; font-weight: 1000; text-transform: uppercase; letter-spacing: .08em; }
      .mega-boss-dialog p { margin: 13px auto 16px; color: #1e1b4b; font-size: clamp(1.2rem, 5vw, 1.62rem); font-weight: 1000; line-height: 1.12; text-wrap: balance; }
      .treasure-wrap { display: flex; justify-content: center; align-items: center; margin: 4px auto 12px; animation: treasure-shine 1.7s ease-in-out infinite; }
      .treasure-wrap.small svg { width: 120px; height: 100px; }
      .treasure-wrap.medium svg { width: 160px; height: 130px; }
      .treasure-wrap.large svg { width: 210px; height: 165px; }
      .quit-round-button { margin-top: 10px; border: 2px solid rgba(239, 68, 68, .24); color: #991b1b; background: #fff7f7; }
      .quit-round-button:hover { background: #fee2e2; }
      .normal-result-motivation { margin: 2px auto 4px; text-align: center; font-size: clamp(1.16rem, 4vw, 1.45rem); font-weight: 1000; line-height: 1.2; color: #2563eb; text-shadow: 0 2px 10px rgba(37,99,235,.16); }
      .normal-result-hero p { max-width: 34ch; margin-left: auto; margin-right: auto; font-weight: 900; color: #475569; }
      .normal-result-card { position: relative; overflow: hidden; padding: 20px 16px 18px; animation: result-card-pop .34s ease-out; }
      .normal-result-card::before { content: ""; position: absolute; inset: 0; pointer-events: none; background: radial-gradient(circle at 50% 0%, rgba(59,130,246,.12), transparent 34%), radial-gradient(circle at 14% 20%, rgba(250,204,21,.14), transparent 22%), radial-gradient(circle at 86% 26%, rgba(34,197,94,.12), transparent 24%); }
      .normal-result-card > * { position: relative; z-index: 1; }
      .normal-result-card strong { font-size: clamp(2.2rem, 10vw, 3.8rem); line-height: 1; }
      .normal-result-stat-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin-top: 16px; }
      .normal-result-stat-item { min-height: 68px; padding: 10px 8px; border-radius: 16px; background: rgba(248,250,252,.92); border: 1px solid rgba(226,232,240,.95); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; box-shadow: inset 0 1px 0 rgba(255,255,255,.75); }
      .normal-result-stat-item strong { margin: 0; font-size: 1.45rem; color: #0f172a; }
      .normal-result-stat-item span { font-size: .68rem; font-weight: 1000; text-transform: uppercase; letter-spacing: .04em; color: #64748b; }
      .normal-result-feedback { display: block; width: 100%; max-width: 32ch; margin: 14px auto 0; color: #1d4ed8; font-size: clamp(1rem, 3.5vw, 1.18rem); font-weight: 1000; line-height: 1.25; text-align: center; text-wrap: balance; align-self: center; justify-self: center; text-shadow: 0 2px 10px rgba(37,99,235,.12); }
      .result-highscore-title { margin: 0 0 4px; text-align: center; font-size: 1.2rem; font-weight: 1000; color: #0f172a; }
      @media (max-width: 520px) { .play-compact-layout { gap: 8px; } .status-row.play-status-compact .status-pill { padding: 7px 9px; min-height: 38px; font-size: .82rem; border-radius: 14px; } .status-row.play-status-compact .status-pill svg { width: 16px; height: 16px; } .question-card.play-question-compact { padding: 13px 10px; border-radius: 21px; } .question-card.play-question-compact .label { font-size: .68rem; margin-bottom: 4px; } .question-card.play-question-compact h2 { font-size: clamp(1.85rem, 9vw, 2.65rem); } .answer-grid.play-answer-grid-compact { gap: 8px; } .answer-grid.play-answer-grid-compact .answer-button { min-height: 64px; padding: 10px; border-radius: 19px; font-size: clamp(1.8rem, 9vw, 2.85rem); } .feedback-area.play-feedback-compact { min-height: 24px; } .feedback-area.play-feedback-compact .feedback { font-size: .78rem; } .boss-play-layout { gap: 8px; } .boss-arena { padding: 10px; border-radius: 22px; } .boss-stage { min-height: 108px; padding-bottom: 7px; } .boss-stage::before { left: 5%; right: 5%; height: 42px; } .boss-stage::after { width: 166px; height: 78px; } .boss-figure-wrap { width: 128px; height: 76px; } .boss-svg { width: 128px; height: 88px; } .boss-image { width: 138px; height: 96px; } .boss-image-slime { width: 168px; height: 118px; transform: translateY(-22px) scale(1.12); } .boss-shadow { width: 88px; height: 11px; margin-top: -7px; } .boss-hp-wrap { padding: 6px; } .boss-hp-bar { height: 11px; } .player-panel { padding: 8px 10px; border-radius: 18px; } .heart-row { font-size: 1.08rem; gap: 4px; } .super-meter-label { font-size: .67rem; margin-bottom: 4px; } .super-cell { height: 8px; } .boss-question-card { padding-top: 10px; padding-bottom: 10px; } .boss-question-card h2 { font-size: 1.9rem; } }
      @media (max-width: 520px) { .boss-play-layout { gap: 7px; } .boss-arena { padding: 9px; } .boss-stage { min-height: 116px; padding-bottom: 7px; } .boss-stage::before { height: 44px; } .boss-stage::after { width: 178px; height: 82px; } .boss-figure-wrap { width: 136px; height: 84px; } .boss-svg { width: 136px; height: 96px; } .boss-svg-shadow { width: 146px; height: 102px; } .boss-stage.boss-stage-troll { min-height: 136px; padding-bottom: 8px; } .boss-stage.boss-stage-troll::before { height: 50px; } .boss-stage.boss-stage-troll::after { width: 184px; height: 90px; } .boss-stage-troll .boss-figure-wrap { width: 146px; height: 96px; } .boss-stage-troll .boss-shadow { width: 118px; } .boss-stage.boss-stage-shadow { min-height: 144px; padding-top: 8px; padding-bottom: 8px; } .boss-stage.boss-stage-shadow::before { height: 48px; } .boss-stage.boss-stage-shadow::after { width: 184px; height: 88px; } .boss-stage-shadow .boss-figure-wrap { width: 146px; height: 96px; } .boss-stage-shadow .boss-shadow { width: 116px; } .boss-image-slime { width: 168px; height: 118px; transform: translateY(-22px) scale(1.12); } .boss-stage-slime .boss-image-slime { filter: none; } .boss-stage .boss-image-troll { width: 166px; height: 166px; transform: translateY(-54px) scale(.98); } .boss-stage .boss-image-shadow { width: 160px; height: 160px; transform: translateY(-50px) scale(.96); } .player-panel { padding: 7px 9px; } .heart-row { font-size: 1.04rem; } .super-meter-label { margin-bottom: 3px; } .super-cell { height: 7px; } .boss-question-card { padding-top: 8px; padding-bottom: 8px; } .boss-question-card h2 { font-size: 1.82rem; margin-top: 3px; } .boss-play-layout .answer-grid { gap: 8px; margin-top: 6px; } .boss-play-layout .answer-button { min-height: 62px; padding: 10px 8px; border-radius: 19px; font-size: clamp(1.75rem, 9vw, 2.5rem); } .boss-play-layout .quit-round-button { margin-top: 2px; } }
      @media (max-width: 520px) { .boss-stage.boss-stage-slime { min-height: 128px; padding-top: 6px; } }
      @media (max-width: 520px) { .boss-stage.boss-stage-troll { min-height: 146px; padding-top: 8px; } }
      @media (max-width: 520px) { @keyframes isdragen-boss-image-attack { 0% { transform: translateY(-118px) translateX(0) scale(.9); } 35% { transform: translateY(-118px) translateX(-5px) scale(.94); } 58% { transform: translateY(-118px) translateX(10px) scale(.98); } 100% { transform: translateY(-118px) translateX(0) scale(.9); } } @keyframes isdragen-boss-image-defeat { 0% { transform: translateY(-118px) rotate(0deg) scale(.9); opacity: 1; filter: saturate(1); } 100% { transform: translateY(-64px) rotate(5deg) scale(.84); opacity: .62; filter: grayscale(.38) saturate(.72); } } @keyframes isdragen-result-image-defeat { 0% { transform: translateY(-70px) rotate(0deg) scale(.74); opacity: 1; filter: saturate(1); } 100% { transform: translateY(-52px) rotate(5deg) scale(.7); opacity: .64; filter: grayscale(.38) saturate(.72); } } }
      @media (max-width: 520px) { .boss-stage.boss-stage-isdragen { min-height: 166px; padding-top: 4px; padding-bottom: 6px; } .boss-stage-isdragen .boss-figure-wrap { width: 178px; height: 96px; } .boss-stage .boss-image-isdragen { width: 178px; height: 267px; transform: translateY(-118px) scale(.9); } .boss-stage .boss-image-isdragen.boss-state-lowHp { transform: translateY(-118px) scale(.96); } .boss-stage-isdragen .boss-shadow { width: 132px; } }
      @media (max-width: 520px) { @keyframes lavakjempen-boss-image-attack { 0% { transform: translateY(-98px) translateX(0) scale(.82); } 35% { transform: translateY(-98px) translateX(-5px) scale(.86); } 58% { transform: translateY(-98px) translateX(10px) scale(.9); } 100% { transform: translateY(-98px) translateX(0) scale(.82); } } @keyframes lavakjempen-boss-image-defeat { 0% { transform: translateY(-76px) rotate(0deg) scale(.9); opacity: 1; filter: saturate(1); } 100% { transform: translateY(-44px) rotate(-5deg) scale(.8); opacity: .62; filter: grayscale(.42) saturate(.7); } } @keyframes lavakjempen-result-image-defeat { 0% { transform: translateY(-84px) rotate(0deg) scale(.7); opacity: 1; filter: saturate(1); } 100% { transform: translateY(-94px) rotate(-5deg) scale(.66); opacity: .64; filter: grayscale(.42) saturate(.7); } } }
      @media (max-width: 520px) { .boss-stage.boss-stage-lavakjempen { min-height: 154px; padding-top: 6px; padding-bottom: 7px; } .boss-stage-lavakjempen .boss-figure-wrap { width: 134px; height: 74px; } .boss-stage .boss-image-lavakjempen { width: 128px; height: 171px; transform: translateY(-98px) scale(.82); } .boss-stage .boss-image-lavakjempen.boss-state-lowHp { transform: translateY(-98px) scale(.85); } .boss-stage-lavakjempen .boss-shadow { width: 98px; } .boss-attack-effect.attack-lavakjempen { top: 2px; right: 6px; } .boss-result-figure.boss-result-defeated-lavakjempen { width: 220px; height: 184px; margin-bottom: 0; } .boss-result-figure.boss-result-standing-lavakjempen { width: 200px; height: 162px; margin-bottom: 6px; } .boss-result-figure .boss-image-lavakjempen { width: 185px; height: 247px; transform: translateY(-84px) scale(.7); } .boss-result-card.lost .boss-result-standing-lavakjempen .boss-image-lavakjempen { transform: translateY(-76px) scale(.58); } }
      @media (max-width: 520px) { @keyframes stormornen-boss-image-attack { 0% { transform: translateY(-104px) translateX(0) scale(.88); } 35% { transform: translateY(-104px) translateX(-5px) scale(.92); } 58% { transform: translateY(-104px) translateX(10px) scale(.96); } 100% { transform: translateY(-104px) translateX(0) scale(.88); } } @keyframes stormornen-boss-image-defeat { 0% { transform: translateY(-104px) rotate(0deg) scale(.88); opacity: 1; filter: saturate(1); } 100% { transform: translateY(-62px) rotate(6deg) scale(.8); opacity: .62; filter: grayscale(.42) saturate(.72); } } @keyframes stormornen-result-image-defeat { 0% { transform: translateY(-78px) rotate(0deg) scale(.68); opacity: 1; filter: saturate(1); } 100% { transform: translateY(-64px) rotate(6deg) scale(.64); opacity: .64; filter: grayscale(.42) saturate(.72); } } }
      @media (max-width: 520px) { .boss-stage.boss-stage-stormornen { min-height: 166px; padding-top: 6px; padding-bottom: 7px; } .boss-stage-stormornen .boss-figure-wrap { width: 198px; height: 88px; } .boss-stage .boss-image-stormornen { width: 198px; height: 224px; transform: translateY(-104px) scale(.88); } .boss-stage .boss-image-stormornen.boss-state-lowHp { transform: translateY(-104px) scale(.9); } .boss-stage-stormornen .boss-shadow { width: 130px; } .boss-attack-effect.attack-stormornen { top: 2px; right: 6px; } .boss-result-figure.boss-result-defeated-stormornen { width: 226px; height: 184px; margin-bottom: 2px; } .boss-result-figure.boss-result-standing-stormornen { width: 210px; height: 164px; margin-bottom: 6px; } .boss-result-figure .boss-image-stormornen { width: 196px; height: 261px; transform: translateY(-78px) scale(.68); } .boss-result-card.lost .boss-result-standing-stormornen .boss-image-stormornen { transform: translateY(-66px) scale(.62); } }
      @media (max-width: 520px) { @keyframes krystallvokteren-boss-image-attack { 0% { transform: translateY(-118px) translateX(0) scale(.86); } 35% { transform: translateY(-118px) translateX(-5px) scale(.9); } 58% { transform: translateY(-118px) translateX(10px) scale(.94); } 100% { transform: translateY(-118px) translateX(0) scale(.86); } } @keyframes krystallvokteren-boss-image-defeat { 0% { transform: translateY(-118px) rotate(0deg) scale(.86); opacity: 1; filter: saturate(1); } 100% { transform: translateY(-68px) rotate(-5deg) scale(.78); opacity: .62; filter: grayscale(.42) saturate(.72); } } @keyframes krystallvokteren-result-image-defeat { 0% { transform: translateY(-76px) rotate(0deg) scale(.64); opacity: 1; filter: saturate(1); } 100% { transform: translateY(-66px) rotate(-5deg) scale(.6); opacity: .64; filter: grayscale(.42) saturate(.72); } } }
      @media (max-width: 520px) { .boss-stage.boss-stage-krystallvokteren { min-height: 158px; padding-top: 6px; padding-bottom: 7px; } .boss-stage-krystallvokteren .boss-figure-wrap { width: 174px; height: 84px; } .boss-stage .boss-image-krystallvokteren { width: 174px; height: 261px; transform: translateY(-118px) scale(.86); } .boss-stage .boss-image-krystallvokteren.boss-state-lowHp { transform: translateY(-118px) scale(.88); } .boss-stage-krystallvokteren .boss-shadow { width: 104px; } .boss-attack-effect.attack-krystallvokteren { top: 2px; right: 6px; } .boss-result-figure.boss-result-defeated-krystallvokteren { width: 220px; height: 184px; margin-bottom: 2px; } .boss-result-figure.boss-result-standing-krystallvokteren { width: 228px; height: 180px; margin-bottom: 5px; } .boss-result-figure .boss-image-krystallvokteren { width: 184px; height: 276px; transform: translateY(-76px) scale(.64); } .boss-result-card.lost .boss-result-standing-krystallvokteren .boss-image-krystallvokteren { width: 220px; height: 330px; transform: translateY(-94px) scale(.68); } }
      @media (max-width: 520px) { @keyframes mekamaskinen-boss-image-attack { 0% { transform: translateY(-108px) translateX(0) scale(.84); } 35% { transform: translateY(-108px) translateX(-5px) scale(.88); } 58% { transform: translateY(-108px) translateX(10px) scale(.92); } 100% { transform: translateY(-108px) translateX(0) scale(.84); } } @keyframes mekamaskinen-boss-image-defeat { 0% { transform: translateY(-102px) rotate(0deg) scale(.84); opacity: 1; filter: saturate(1); } 100% { transform: translateY(-58px) rotate(-5deg) scale(.76); opacity: .62; filter: grayscale(.42) saturate(.7); } } @keyframes mekamaskinen-result-image-defeat { 0% { transform: translateY(-74px) rotate(0deg) scale(.62); opacity: 1; filter: saturate(1); } 100% { transform: translateY(-64px) rotate(-5deg) scale(.58); opacity: .64; filter: grayscale(.42) saturate(.7); } } }
      @media (max-width: 520px) { .boss-stage.boss-stage-mekamaskinen { min-height: 158px; padding-top: 6px; padding-bottom: 7px; } .boss-stage-mekamaskinen .boss-figure-wrap { width: 156px; height: 78px; } .boss-stage .boss-image-mekamaskinen { width: 156px; height: 208px; transform: translateY(-108px) scale(.84); } .boss-stage .boss-image-mekamaskinen.boss-state-lowHp { transform: translateY(-108px) scale(.86); } .boss-stage-mekamaskinen .boss-shadow { width: 104px; } .boss-attack-effect.attack-mekamaskinen { top: 2px; right: 6px; } .boss-result-figure.boss-result-defeated-mekamaskinen { width: 220px; height: 184px; margin-bottom: 2px; } .boss-result-figure.boss-result-standing-mekamaskinen { width: 204px; height: 164px; margin-bottom: 6px; } .boss-result-figure .boss-image-mekamaskinen { width: 184px; height: 245px; transform: translateY(-74px) scale(.62); } .boss-result-card.lost .boss-result-standing-mekamaskinen .boss-image-mekamaskinen { transform: translateY(-66px) scale(.58); } }
      @media (max-width: 520px) { @keyframes morkekraken-boss-image-attack { 0% { transform: translateY(-60px) translateX(0) scale(.86); } 35% { transform: translateY(-60px) translateX(-5px) scale(.9); } 58% { transform: translateY(-60px) translateX(10px) scale(.94); } 100% { transform: translateY(-60px) translateX(0) scale(.86); } } @keyframes morkekraken-boss-image-defeat { 0% { transform: translateY(-60px) rotate(0deg) scale(.86); opacity: 1; filter: saturate(1); } 100% { transform: translateY(-32px) rotate(5deg) scale(.78); opacity: .62; filter: grayscale(.42) saturate(.72); } } @keyframes morkekraken-result-image-defeat { 0% { transform: translateY(-46px) rotate(0deg) scale(.66); opacity: 1; filter: saturate(1); } 100% { transform: translateY(-40px) rotate(5deg) scale(.62); opacity: .64; filter: grayscale(.42) saturate(.72); } } }
      @media (max-width: 520px) { .boss-stage.boss-stage-morkekraken { min-height: 150px; padding-top: 6px; padding-bottom: 7px; } .boss-stage-morkekraken .boss-figure-wrap { width: 212px; height: 76px; } .boss-stage .boss-image-morkekraken { width: 212px; height: 178px; transform: translateY(-84px) scale(.86); } .boss-stage .boss-image-morkekraken.boss-state-lowHp { transform: translateY(-84px) scale(.88); } .boss-stage-morkekraken .boss-shadow { width: 132px; } .boss-attack-effect.attack-morkekraken { top: 2px; right: 6px; } .boss-result-figure.boss-result-defeated-morkekraken { width: 228px; height: 178px; margin-bottom: 2px; } .boss-result-figure.boss-result-standing-morkekraken { width: 216px; height: 164px; margin-bottom: 6px; } .boss-result-figure .boss-image-morkekraken { width: 205px; height: 205px; transform: translateY(-46px) scale(.66); } .boss-result-card.lost .boss-result-standing-morkekraken .boss-image-morkekraken { transform: translateY(-42px) scale(.62); } }
      @media (max-width: 520px) { @keyframes regnemesteren-boss-image-attack { 0% { transform: translateY(-96px) translateX(0) scale(.96); } 35% { transform: translateY(-96px) translateX(-5px) scale(1); } 58% { transform: translateY(-96px) translateX(10px) scale(1.04); } 100% { transform: translateY(-96px) translateX(0) scale(.96); } } @keyframes regnemesteren-boss-image-defeat { 0% { transform: translateY(-92px) rotate(0deg) scale(.88); opacity: 1; filter: saturate(1); } 100% { transform: translateY(-52px) rotate(-5deg) scale(.8); opacity: .62; filter: grayscale(.42) saturate(.72); } } @keyframes regnemesteren-result-image-defeat { 0% { transform: translateY(-70px) rotate(0deg) scale(.62); opacity: 1; filter: saturate(1); } 100% { transform: translateY(-60px) rotate(-5deg) scale(.58); opacity: .64; filter: grayscale(.42) saturate(.72); } } }
      @media (max-width: 520px) { .boss-stage.boss-stage-regnemesteren { min-height: 158px; padding-top: 6px; padding-bottom: 7px; } .boss-stage-regnemesteren .boss-figure-wrap { width: 230px; height: 96px; } .boss-stage .boss-image-regnemesteren { width: 230px; height: 258px; transform: translateY(-96px) scale(.96); } .boss-stage .boss-image-regnemesteren.boss-state-lowHp { transform: translateY(-96px) scale(.98); } .boss-stage-regnemesteren .boss-shadow { width: 118px; } .boss-attack-effect.attack-regnemesteren { top: 2px; right: 6px; } .boss-result-figure.boss-result-defeated-regnemesteren { width: 220px; height: 184px; margin-bottom: 2px; } .boss-result-figure.boss-result-standing-regnemesteren { width: 280px; height: 224px; margin-bottom: 6px; } .boss-result-figure .boss-image-regnemesteren { width: 190px; height: 213px; transform: translateY(-70px) scale(.62); } .boss-result-card.lost .boss-result-standing-regnemesteren .boss-image-regnemesteren { width: 280px; height: 314px; transform: translateY(-44px) scale(.8); } }
      @media (max-width: 520px) { @keyframes mega-regnemesteren-boss-image-attack { 0% { transform: translateY(-132px) translateX(0) scale(.9); } 35% { transform: translateY(-132px) translateX(-5px) scale(.94); } 58% { transform: translateY(-132px) translateX(10px) scale(.98); } 100% { transform: translateY(-132px) translateX(0) scale(.9); } } @keyframes mega-regnemesteren-boss-image-defeat { 0% { transform: translateY(-120px) rotate(0deg) scale(.86); opacity: 1; filter: saturate(1); } 100% { transform: translateY(-66px) rotate(-5deg) scale(.78); opacity: .62; filter: grayscale(.42) saturate(.72); } } @keyframes mega-regnemesteren-result-image-defeat { 0% { transform: translateY(-70px) rotate(0deg) scale(.66); opacity: 1; filter: saturate(1); } 100% { transform: translateY(-60px) rotate(-5deg) scale(.62); opacity: .64; filter: grayscale(.42) saturate(.72); } } }
      @media (max-width: 520px) { .boss-stage.boss-stage-mega-regnemesteren { min-height: 168px; padding-top: 6px; padding-bottom: 7px; } .boss-stage-mega-regnemesteren .boss-figure-wrap { width: 218px; height: 96px; } .boss-stage .boss-image-mega-regnemesteren { width: 218px; height: 280px; transform: translateY(-132px) scale(.9); } .boss-stage .boss-image-mega-regnemesteren.boss-state-lowHp { transform: translateY(-132px) scale(.93); } .boss-stage-mega-regnemesteren .boss-shadow { width: 122px; } .boss-attack-effect.attack-mega-regnemesteren { top: 2px; right: 6px; } .boss-result-figure.boss-result-defeated-mega-regnemesteren { width: 230px; height: 190px; margin-bottom: 2px; } .boss-result-figure.boss-result-standing-mega-regnemesteren { width: 280px; height: 224px; margin-bottom: 6px; } .boss-result-figure .boss-image-mega-regnemesteren { width: 196px; height: 252px; transform: translateY(-70px) scale(.66); } .boss-result-card.lost .boss-result-standing-mega-regnemesteren .boss-image-mega-regnemesteren { width: 276px; height: 354px; transform: translateY(-92px) scale(.78); } .mega-boss-transition { inset: -4px; padding: 12px; border-radius: 24px; } .mega-boss-dialog { border-radius: 20px; padding: 17px 13px 14px; } }
      @media (max-width: 520px) { .boss-dev-panel { grid-template-columns: repeat(2, minmax(0, 1fr)); padding: 6px; } .boss-dev-label { grid-column: 1 / -1; text-align: center; } .boss-dev-button { min-height: 32px; font-size: .74rem; } }
      @media (max-width: 520px) { .boss-attack-effect.attack-slime, .boss-attack-effect.attack-troll, .boss-attack-effect.attack-shadow { top: 2px; right: 6px; } .damage-popup.damage-troll:not(.super) { left: 34%; } .boss-result-card.lost .boss-result-standing-slime .boss-image-slime { transform: translateY(2px) scale(1.12); } .boss-result-card.lost .boss-result-standing-troll .boss-image-troll { transform: translateY(6px) scale(1); } .boss-result-card.lost .boss-result-standing-shadow .boss-image-shadow { transform: translateY(-8px) scale(.96); } }
      @media (max-width: 520px) { .boss-attack-effect.attack-isdragen { top: 2px; right: 6px; } .boss-result-figure.boss-result-defeated-isdragen { width: 240px; height: 204px; margin-bottom: 2px; } .boss-result-figure.boss-result-standing-isdragen { width: 220px; height: 188px; margin-bottom: 6px; } .boss-result-figure .boss-image-isdragen { width: 205px; height: 308px; transform: translateY(-70px) scale(.74); } .boss-result-card.lost .boss-result-standing-isdragen .boss-image-isdragen { transform: translateY(-56px) scale(.76); } .boss-result-card.boss-result-isdragen .treasure-wrap.large svg { width: 154px; height: 122px; } }
    `}</style>
  );
}

function BossArenaScenery({ bossId }) {
  if (bossId === "troll") {
    return (
      <svg className="boss-scenery boss-scenery-troll" viewBox="0 0 680 230" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <path d="M0 0h680v230H0z" fill="rgba(28,25,23,.22)" />
        <path d="M0 98 52 57l49 24 62-52 58 34 72-43 73 39 54-24 74 48 50-20 136 54v113H0z" fill="rgba(41,37,36,.46)" />
        <path d="M0 126c54-22 103-23 157-12 54 12 98-3 151-18 75-20 119 8 171 22 60 17 112 1 201-23v135H0z" fill="rgba(120,53,15,.28)" />
        <path d="M0 170c83-13 151-9 226 3 84 14 134 5 209-9 90-17 153-8 245 13v53H0z" fill="rgba(68,64,60,.36)" />
        <path d="M134 168l30 16 42-12 24 18 45-10" fill="none" stroke="rgba(41,37,36,.48)" strokeWidth="5" strokeLinecap="round" />
        <path d="M432 164l34 20 33-11 36 23" fill="none" stroke="rgba(41,37,36,.42)" strokeWidth="5" strokeLinecap="round" />
        <ellipse cx="83" cy="164" rx="38" ry="18" fill="rgba(87,83,78,.5)" />
        <ellipse cx="590" cy="162" rx="48" ry="22" fill="rgba(68,64,60,.48)" />
        <circle cx="180" cy="72" r="3" fill="rgba(254,243,199,.42)" />
        <circle cx="525" cy="88" r="4" fill="rgba(254,243,199,.34)" />
      </svg>
    );
  }

  if (bossId === "shadow") {
    return (
      <svg className="boss-scenery boss-scenery-shadow" viewBox="0 0 680 230" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <path d="M0 0h680v230H0z" fill="rgba(2,6,23,.3)" />
        <path d="M58 64h52v116H58zM570 55h56v125h-56zM244 46h58v134h-58zM382 52h58v128h-58z" fill="rgba(15,23,42,.54)" />
        <path d="M0 118c83-31 151-33 214-7 58 24 99 12 152-9 67-27 148-18 314 25v103H0z" fill="rgba(15,23,42,.46)" />
        <path d="M221 180c34-61 199-61 236 0v50H221z" fill="rgba(2,6,23,.46)" />
        <path d="M0 174c110 8 184 4 282-10 101-15 178-9 398 16v50H0z" fill="rgba(2,6,23,.55)" />
        <path d="m148 164 35 14 18-21 24 39" fill="none" stroke="rgba(248,113,113,.52)" strokeWidth="5" strokeLinecap="round" />
        <path d="m484 158 24 35 31-22 18 27" fill="none" stroke="rgba(251,146,60,.48)" strokeWidth="5" strokeLinecap="round" />
        <polygon points="94,160 113,126 134,160" fill="rgba(248,113,113,.38)" />
        <polygon points="548,162 567,118 589,162" fill="rgba(251,146,60,.38)" />
        <circle cx="340" cy="80" r="36" fill="rgba(251,146,60,.18)" />
      </svg>
    );
  }

  return (
    <svg className="boss-scenery boss-scenery-slime" viewBox="0 0 680 230" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d="M0 0h680v230H0z" fill="rgba(220,252,231,.18)" />
      <path d="M0 113c70-33 124-28 184-7 62 22 111 8 163-12 68-27 135-24 333 30v106H0z" fill="rgba(34,197,94,.2)" />
      <path d="M0 154c74-20 132-16 207 0 72 16 122 5 184-9 79-18 165-9 289 23v62H0z" fill="rgba(21,128,61,.22)" />
      <path d="M0 184c107 15 184 8 263-7 71-14 135-12 211 2 73 13 125 11 206-6v57H0z" fill="rgba(20,83,45,.24)" />
      <ellipse cx="145" cy="166" rx="54" ry="18" fill="rgba(187,247,208,.42)" />
      <ellipse cx="526" cy="169" rx="62" ry="20" fill="rgba(45,212,191,.28)" />
      <path d="M65 162c10-25 9-43-3-61M96 160c-2-31 7-52 28-70M594 160c5-27 0-45-15-62M622 158c-4-30 5-47 27-62" fill="none" stroke="rgba(20,83,45,.46)" strokeWidth="6" strokeLinecap="round" />
      <circle cx="118" cy="88" r="5" fill="rgba(220,252,231,.58)" />
      <circle cx="188" cy="64" r="3" fill="rgba(187,247,208,.56)" />
      <circle cx="486" cy="79" r="4" fill="rgba(220,252,231,.54)" />
      <circle cx="552" cy="102" r="6" fill="rgba(187,247,208,.5)" />
    </svg>
  );
}

function BossFigure({ bossId, hpPercent = 100, action = "idle", defeated = false, holdAction = false }) {
  const mood = defeated ? "defeated" : getBossMood(hpPercent);
  if (bossId === "troll") return <TrollBossAssetFigure hpPercent={hpPercent} action={action} mood={mood} defeated={defeated} holdAction={holdAction} />;
  if (bossId === "shadow") return <ShadowGolemAssetFigure hpPercent={hpPercent} action={action} mood={mood} defeated={defeated} holdAction={holdAction} />;
  if (bossId === "isdragen") return <IsdragenAssetFigure hpPercent={hpPercent} action={action} mood={mood} defeated={defeated} holdAction={holdAction} />;
  if (bossId === "lavakjempen") return <LavakjempenAssetFigure hpPercent={hpPercent} action={action} mood={mood} defeated={defeated} holdAction={holdAction} />;
  if (bossId === "stormornen") return <StormornenAssetFigure hpPercent={hpPercent} action={action} mood={mood} defeated={defeated} holdAction={holdAction} />;
  if (bossId === "krystallvokteren") return <KrystallvokterenAssetFigure hpPercent={hpPercent} action={action} mood={mood} defeated={defeated} holdAction={holdAction} />;
  if (bossId === "mekamaskinen") return <MekamaskinenAssetFigure hpPercent={hpPercent} action={action} mood={mood} defeated={defeated} holdAction={holdAction} />;
  if (bossId === "morkekraken") return <MorkekrakenAssetFigure hpPercent={hpPercent} action={action} mood={mood} defeated={defeated} holdAction={holdAction} />;
  if (bossId === "regnemesteren") return <RegnemesterenAssetFigure hpPercent={hpPercent} action={action} mood={mood} defeated={defeated} holdAction={holdAction} />;
  if (bossId === MEGA_REGNEMESTEREN_ID) return <MegaRegnemesterenAssetFigure hpPercent={hpPercent} action={action} mood={mood} defeated={defeated} holdAction={holdAction} />;
  if (bossId === "dragon") return <ShadowGolemSvg hpPercent={hpPercent} action={action} mood={mood} defeated={defeated} />;
  if (bossId === "slime") return <SlimeBossAssetFigure hpPercent={hpPercent} action={action} mood={mood} defeated={defeated} holdAction={holdAction} />;
  return <SlimeBossSvg hpPercent={hpPercent} action={action} mood={mood} defeated={defeated} />;
}

function TrollBossAssetFigure({ hpPercent = 100, action = "idle", mood = "confident", defeated = false, holdAction = false }) {
  const [animationState, setAnimationState] = useState(() => (action === "hit" || action === "defeat" || defeated ? "hurt1" : action === "attack" ? "attack" : ""));
  const [suppressedAction, setSuppressedAction] = useState("");
  const baseVisualState = getTrollBossVisualState({ hpPercent, action: suppressedAction === action ? "idle" : action, defeated });
  const visualState = animationState || baseVisualState;
  const src = TROLL_BOSS_ASSETS.states[visualState] || TROLL_BOSS_ASSETS.states.idle;
  const [failedSrc, setFailedSrc] = useState("");
  const animationTimersRef = useRef([]);

  useEffect(() => {
    return () => {
      animationTimersRef.current.forEach((timerId) => clearTimeout(timerId));
      animationTimersRef.current = [];
    };
  }, []);

  useEffect(() => {
    const clearAnimationTimers = () => {
      animationTimersRef.current.forEach((timerId) => clearTimeout(timerId));
      animationTimersRef.current = [];
    };

    if (action === "hit") {
      clearAnimationTimers();
      setSuppressedAction("");
      setAnimationState("hurt1");
      const hurt2Timer = setTimeout(() => setAnimationState("hurt2"), TROLL_HURT_FIRST_FRAME_MS);
      const doneTimer = setTimeout(() => {
        animationTimersRef.current = [];
        setAnimationState("");
      }, TROLL_HURT_TOTAL_MS);
      animationTimersRef.current = [hurt2Timer, doneTimer];
      return undefined;
    }

    if (defeated || action === "defeat") {
      clearAnimationTimers();
      setSuppressedAction("");
      setAnimationState("hurt1");
      const doneTimer = setTimeout(() => {
        animationTimersRef.current = [];
        setAnimationState("");
      }, TROLL_DEFEATED_INTRO_MS);
      animationTimersRef.current = [doneTimer];
      return undefined;
    }

    if (holdAction && action === "attack") {
      clearAnimationTimers();
      setSuppressedAction("");
      setAnimationState("attack");
      return undefined;
    }

    if (action === "attack") {
      clearAnimationTimers();
      setSuppressedAction("");
      setAnimationState("attack");
      const doneTimer = setTimeout(() => {
        animationTimersRef.current = [];
        setSuppressedAction("attack");
        setAnimationState("");
      }, TROLL_ATTACK_FRAME_MS);
      animationTimersRef.current = [doneTimer];
      return undefined;
    }

    setSuppressedAction("");
    if (animationTimersRef.current.length === 0) setAnimationState("");
    return undefined;
  }, [action, defeated, holdAction]);

  if (failedSrc === src) {
    return <TrollBossSvg hpPercent={hpPercent} action={action} mood={mood} defeated={defeated || visualState === "defeated"} />;
  }

  return (
    <img
      className={`boss-image boss-image-troll boss-action-${action} boss-state-${visualState} boss-mood-${mood} ${visualState === "defeated" ? "boss-defeated" : ""}`}
      src={src}
      alt="Trollkongen"
      draggable="false"
      decoding="async"
      onError={() => setFailedSrc(src)}
    />
  );
}

function ShadowGolemAssetFigure({ hpPercent = 100, action = "idle", mood = "confident", defeated = false, holdAction = false }) {
  const [animationState, setAnimationState] = useState(() => (action === "hit" || action === "defeat" || defeated ? "hurt1" : action === "attack" ? "attack" : ""));
  const [suppressedAction, setSuppressedAction] = useState("");
  const baseVisualState = getShadowGolemVisualState({ hpPercent, action: suppressedAction === action ? "idle" : action, defeated });
  const visualState = animationState || baseVisualState;
  const src = SHADOW_GOLEM_ASSETS.states[visualState] || SHADOW_GOLEM_ASSETS.states.idle;
  const [failedSrc, setFailedSrc] = useState("");
  const animationTimersRef = useRef([]);

  useEffect(() => {
    return () => {
      animationTimersRef.current.forEach((timerId) => clearTimeout(timerId));
      animationTimersRef.current = [];
    };
  }, []);

  useEffect(() => {
    const clearAnimationTimers = () => {
      animationTimersRef.current.forEach((timerId) => clearTimeout(timerId));
      animationTimersRef.current = [];
    };

    if (action === "hit") {
      clearAnimationTimers();
      setSuppressedAction("");
      setAnimationState("hurt1");
      const hurt2Timer = setTimeout(() => setAnimationState("hurt2"), SHADOW_GOLEM_HURT_FIRST_FRAME_MS);
      const doneTimer = setTimeout(() => {
        animationTimersRef.current = [];
        setAnimationState("");
      }, SHADOW_GOLEM_HURT_TOTAL_MS);
      animationTimersRef.current = [hurt2Timer, doneTimer];
      return undefined;
    }

    if (defeated || action === "defeat") {
      clearAnimationTimers();
      setSuppressedAction("");
      setAnimationState("hurt1");
      const doneTimer = setTimeout(() => {
        animationTimersRef.current = [];
        setAnimationState("");
      }, SHADOW_GOLEM_DEFEATED_INTRO_MS);
      animationTimersRef.current = [doneTimer];
      return undefined;
    }

    if (holdAction && action === "attack") {
      clearAnimationTimers();
      setSuppressedAction("");
      setAnimationState("attack");
      return undefined;
    }

    if (action === "attack") {
      clearAnimationTimers();
      setSuppressedAction("");
      setAnimationState("attack");
      const doneTimer = setTimeout(() => {
        animationTimersRef.current = [];
        setSuppressedAction("attack");
        setAnimationState("");
      }, SHADOW_GOLEM_ATTACK_FRAME_MS);
      animationTimersRef.current = [doneTimer];
      return undefined;
    }

    setSuppressedAction("");
    if (animationTimersRef.current.length === 0) setAnimationState("");
    return undefined;
  }, [action, defeated, holdAction]);

  if (failedSrc === src) {
    return <ShadowGolemSvg hpPercent={hpPercent} action={action} mood={mood} defeated={defeated || visualState === "defeated"} />;
  }

  return (
    <img
      className={`boss-image boss-image-shadow boss-action-${action} boss-state-${visualState} boss-mood-${mood} ${visualState === "defeated" ? "boss-defeated" : ""}`}
      src={src}
      alt="Skyggegolemen"
      draggable="false"
      decoding="async"
      onError={() => setFailedSrc(src)}
    />
  );
}

function IsdragenAssetFigure({ hpPercent = 100, action = "idle", mood = "confident", defeated = false, holdAction = false }) {
  const [animationState, setAnimationState] = useState(() => (action === "hit" || action === "defeat" || defeated ? "hurt1" : action === "attack" ? "attack" : ""));
  const [suppressedAction, setSuppressedAction] = useState("");
  const baseVisualState = getIsdragenVisualState({ hpPercent, action: suppressedAction === action ? "idle" : action, defeated });
  const visualState = animationState || baseVisualState;
  const src = ISDRAGEN_ASSETS.states[visualState] || ISDRAGEN_ASSETS.states.idle;
  const [failedSrc, setFailedSrc] = useState("");
  const safeSrc = failedSrc === src ? ISDRAGEN_ASSETS.states.idle : src;
  const animationTimersRef = useRef([]);

  useEffect(() => {
    return () => {
      animationTimersRef.current.forEach((timerId) => clearTimeout(timerId));
      animationTimersRef.current = [];
    };
  }, []);

  useEffect(() => {
    const clearAnimationTimers = () => {
      animationTimersRef.current.forEach((timerId) => clearTimeout(timerId));
      animationTimersRef.current = [];
    };

    if (action === "hit") {
      clearAnimationTimers();
      setSuppressedAction("");
      setAnimationState("hurt1");
      const hurt2Timer = setTimeout(() => setAnimationState("hurt2"), ISDRAGEN_HURT_FIRST_FRAME_MS);
      const doneTimer = setTimeout(() => {
        animationTimersRef.current = [];
        setAnimationState("");
      }, ISDRAGEN_HURT_TOTAL_MS);
      animationTimersRef.current = [hurt2Timer, doneTimer];
      return undefined;
    }

    if (defeated || action === "defeat") {
      clearAnimationTimers();
      setSuppressedAction("");
      setAnimationState("hurt1");
      const doneTimer = setTimeout(() => {
        animationTimersRef.current = [];
        setAnimationState("");
      }, ISDRAGEN_DEFEATED_INTRO_MS);
      animationTimersRef.current = [doneTimer];
      return undefined;
    }

    if (holdAction && action === "attack") {
      clearAnimationTimers();
      setSuppressedAction("");
      setAnimationState("attack");
      return undefined;
    }

    if (action === "attack") {
      clearAnimationTimers();
      setSuppressedAction("");
      setAnimationState("attack");
      const doneTimer = setTimeout(() => {
        animationTimersRef.current = [];
        setSuppressedAction("attack");
        setAnimationState("");
      }, ISDRAGEN_ATTACK_FRAME_MS);
      animationTimersRef.current = [doneTimer];
      return undefined;
    }

    setSuppressedAction("");
    if (animationTimersRef.current.length === 0) setAnimationState("");
    return undefined;
  }, [action, defeated, holdAction]);

  return (
    <img
      className={`boss-image boss-image-isdragen boss-action-${action} boss-state-${visualState} boss-mood-${mood} ${visualState === "defeated" ? "boss-defeated" : ""}`}
      src={safeSrc}
      alt="Isdragen"
      draggable="false"
      decoding="async"
      onError={() => { if (src !== ISDRAGEN_ASSETS.states.idle) setFailedSrc(src); }}
    />
  );
}

function LavakjempenAssetFigure({ hpPercent = 100, action = "idle", mood = "confident", defeated = false, holdAction = false }) {
  const [animationState, setAnimationState] = useState(() => (action === "hit" || action === "defeat" || defeated ? "hurt1" : action === "attack" ? "attack" : ""));
  const [suppressedAction, setSuppressedAction] = useState("");
  const baseVisualState = getLavakjempenVisualState({ hpPercent, action: suppressedAction === action ? "idle" : action, defeated });
  const visualState = animationState || baseVisualState;
  const src = LAVAKJEMPEN_ASSETS.states[visualState] || LAVAKJEMPEN_ASSETS.states.idle;
  const [failedSrc, setFailedSrc] = useState("");
  const safeSrc = failedSrc === src ? LAVAKJEMPEN_ASSETS.states.idle : src;
  const animationTimersRef = useRef([]);

  useEffect(() => {
    return () => {
      animationTimersRef.current.forEach((timerId) => clearTimeout(timerId));
      animationTimersRef.current = [];
    };
  }, []);

  useEffect(() => {
    const clearAnimationTimers = () => {
      animationTimersRef.current.forEach((timerId) => clearTimeout(timerId));
      animationTimersRef.current = [];
    };

    if (action === "hit") {
      clearAnimationTimers();
      setSuppressedAction("");
      setAnimationState("hurt1");
      const hurt2Timer = setTimeout(() => setAnimationState("hurt2"), LAVAKJEMPEN_HURT_FIRST_FRAME_MS);
      const doneTimer = setTimeout(() => {
        animationTimersRef.current = [];
        setAnimationState("");
      }, LAVAKJEMPEN_HURT_TOTAL_MS);
      animationTimersRef.current = [hurt2Timer, doneTimer];
      return undefined;
    }

    if (defeated || action === "defeat") {
      clearAnimationTimers();
      setSuppressedAction("");
      setAnimationState("hurt1");
      const doneTimer = setTimeout(() => {
        animationTimersRef.current = [];
        setAnimationState("");
      }, LAVAKJEMPEN_DEFEATED_INTRO_MS);
      animationTimersRef.current = [doneTimer];
      return undefined;
    }

    if (holdAction && action === "attack") {
      clearAnimationTimers();
      setSuppressedAction("");
      setAnimationState("attack");
      return undefined;
    }

    if (action === "attack") {
      clearAnimationTimers();
      setSuppressedAction("");
      setAnimationState("attack");
      const doneTimer = setTimeout(() => {
        animationTimersRef.current = [];
        setSuppressedAction("attack");
        setAnimationState("");
      }, LAVAKJEMPEN_ATTACK_FRAME_MS);
      animationTimersRef.current = [doneTimer];
      return undefined;
    }

    setSuppressedAction("");
    if (animationTimersRef.current.length === 0) setAnimationState("");
    return undefined;
  }, [action, defeated, holdAction]);

  return (
    <img
      className={`boss-image boss-image-lavakjempen boss-action-${action} boss-state-${visualState} boss-mood-${mood} ${visualState === "defeated" ? "boss-defeated" : ""}`}
      src={safeSrc}
      alt="Lavakjempen"
      draggable="false"
      decoding="async"
      onError={() => { if (src !== LAVAKJEMPEN_ASSETS.states.idle) setFailedSrc(src); }}
    />
  );
}

function StormornenAssetFigure({ hpPercent = 100, action = "idle", mood = "confident", defeated = false, holdAction = false }) {
  const [animationState, setAnimationState] = useState(() => (action === "hit" || action === "defeat" || defeated ? "hurt1" : action === "attack" ? "attack" : ""));
  const [suppressedAction, setSuppressedAction] = useState("");
  const baseVisualState = getStormornenVisualState({ hpPercent, action: suppressedAction === action ? "idle" : action, defeated });
  const visualState = animationState || baseVisualState;
  const src = STORMORNEN_ASSETS.states[visualState] || STORMORNEN_ASSETS.states.idle;
  const [failedSrc, setFailedSrc] = useState("");
  const safeSrc = failedSrc === src ? STORMORNEN_ASSETS.states.idle : src;
  const animationTimersRef = useRef([]);

  useEffect(() => {
    return () => {
      animationTimersRef.current.forEach((timerId) => clearTimeout(timerId));
      animationTimersRef.current = [];
    };
  }, []);

  useEffect(() => {
    const clearAnimationTimers = () => {
      animationTimersRef.current.forEach((timerId) => clearTimeout(timerId));
      animationTimersRef.current = [];
    };

    if (action === "hit") {
      clearAnimationTimers();
      setSuppressedAction("");
      setAnimationState("hurt1");
      const hurt2Timer = setTimeout(() => setAnimationState("hurt2"), STORMORNEN_HURT_FIRST_FRAME_MS);
      const doneTimer = setTimeout(() => {
        animationTimersRef.current = [];
        setAnimationState("");
      }, STORMORNEN_HURT_TOTAL_MS);
      animationTimersRef.current = [hurt2Timer, doneTimer];
      return undefined;
    }

    if (defeated || action === "defeat") {
      clearAnimationTimers();
      setSuppressedAction("");
      setAnimationState("hurt1");
      const doneTimer = setTimeout(() => {
        animationTimersRef.current = [];
        setAnimationState("");
      }, STORMORNEN_DEFEATED_INTRO_MS);
      animationTimersRef.current = [doneTimer];
      return undefined;
    }

    if (holdAction && action === "attack") {
      clearAnimationTimers();
      setSuppressedAction("");
      setAnimationState("attack");
      return undefined;
    }

    if (action === "attack") {
      clearAnimationTimers();
      setSuppressedAction("");
      setAnimationState("attack");
      const doneTimer = setTimeout(() => {
        animationTimersRef.current = [];
        setSuppressedAction("attack");
        setAnimationState("");
      }, STORMORNEN_ATTACK_FRAME_MS);
      animationTimersRef.current = [doneTimer];
      return undefined;
    }

    setSuppressedAction("");
    if (animationTimersRef.current.length === 0) setAnimationState("");
    return undefined;
  }, [action, defeated, holdAction]);

  return (
    <img
      className={`boss-image boss-image-stormornen boss-action-${action} boss-state-${visualState} boss-mood-${mood} ${visualState === "defeated" ? "boss-defeated" : ""}`}
      src={safeSrc}
      alt="Stormørnen"
      draggable="false"
      decoding="async"
      onError={() => { if (src !== STORMORNEN_ASSETS.states.idle) setFailedSrc(src); }}
    />
  );
}

function KrystallvokterenAssetFigure({ hpPercent = 100, action = "idle", mood = "confident", defeated = false, holdAction = false }) {
  const [animationState, setAnimationState] = useState(() => (action === "hit" || action === "defeat" || defeated ? "hurt1" : action === "attack" ? "attack" : ""));
  const [suppressedAction, setSuppressedAction] = useState("");
  const baseVisualState = getKrystallvokterenVisualState({ hpPercent, action: suppressedAction === action ? "idle" : action, defeated });
  const visualState = animationState || baseVisualState;
  const src = KRYSTALLVOKTEREN_ASSETS.states[visualState] || KRYSTALLVOKTEREN_ASSETS.states.idle;
  const [failedSrc, setFailedSrc] = useState("");
  const safeSrc = failedSrc === src ? KRYSTALLVOKTEREN_ASSETS.states.idle : src;
  const animationTimersRef = useRef([]);

  useEffect(() => {
    return () => {
      animationTimersRef.current.forEach((timerId) => clearTimeout(timerId));
      animationTimersRef.current = [];
    };
  }, []);

  useEffect(() => {
    const clearAnimationTimers = () => {
      animationTimersRef.current.forEach((timerId) => clearTimeout(timerId));
      animationTimersRef.current = [];
    };

    if (action === "hit") {
      clearAnimationTimers();
      setSuppressedAction("");
      setAnimationState("hurt1");
      const hurt2Timer = setTimeout(() => setAnimationState("hurt2"), KRYSTALLVOKTEREN_HURT_FIRST_FRAME_MS);
      const doneTimer = setTimeout(() => {
        animationTimersRef.current = [];
        setAnimationState("");
      }, KRYSTALLVOKTEREN_HURT_TOTAL_MS);
      animationTimersRef.current = [hurt2Timer, doneTimer];
      return undefined;
    }

    if (defeated || action === "defeat") {
      clearAnimationTimers();
      setSuppressedAction("");
      setAnimationState("hurt1");
      const doneTimer = setTimeout(() => {
        animationTimersRef.current = [];
        setAnimationState("");
      }, KRYSTALLVOKTEREN_DEFEATED_INTRO_MS);
      animationTimersRef.current = [doneTimer];
      return undefined;
    }

    if (holdAction && action === "attack") {
      clearAnimationTimers();
      setSuppressedAction("");
      setAnimationState("attack");
      return undefined;
    }

    if (action === "attack") {
      clearAnimationTimers();
      setSuppressedAction("");
      setAnimationState("attack");
      const doneTimer = setTimeout(() => {
        animationTimersRef.current = [];
        setSuppressedAction("attack");
        setAnimationState("");
      }, KRYSTALLVOKTEREN_ATTACK_FRAME_MS);
      animationTimersRef.current = [doneTimer];
      return undefined;
    }

    setSuppressedAction("");
    if (animationTimersRef.current.length === 0) setAnimationState("");
    return undefined;
  }, [action, defeated, holdAction]);

  return (
    <img
      className={`boss-image boss-image-krystallvokteren boss-action-${action} boss-state-${visualState} boss-mood-${mood} ${visualState === "defeated" ? "boss-defeated" : ""}`}
      src={safeSrc}
      alt="Krystallvokteren"
      draggable="false"
      decoding="async"
      onError={() => { if (src !== KRYSTALLVOKTEREN_ASSETS.states.idle) setFailedSrc(src); }}
    />
  );
}

function MekamaskinenAssetFigure({ hpPercent = 100, action = "idle", mood = "confident", defeated = false, holdAction = false }) {
  const [animationState, setAnimationState] = useState(() => (action === "hit" || action === "defeat" || defeated ? "hurt1" : action === "attack" ? "attack" : ""));
  const [suppressedAction, setSuppressedAction] = useState("");
  const baseVisualState = getMekamaskinenVisualState({ hpPercent, action: suppressedAction === action ? "idle" : action, defeated });
  const visualState = animationState || baseVisualState;
  const src = MEKAMASKINEN_ASSETS.states[visualState] || MEKAMASKINEN_ASSETS.states.idle;
  const [failedSrc, setFailedSrc] = useState("");
  const safeSrc = failedSrc === src ? MEKAMASKINEN_ASSETS.states.idle : src;
  const animationTimersRef = useRef([]);

  useEffect(() => {
    return () => {
      animationTimersRef.current.forEach((timerId) => clearTimeout(timerId));
      animationTimersRef.current = [];
    };
  }, []);

  useEffect(() => {
    const clearAnimationTimers = () => {
      animationTimersRef.current.forEach((timerId) => clearTimeout(timerId));
      animationTimersRef.current = [];
    };

    if (action === "hit") {
      clearAnimationTimers();
      setSuppressedAction("");
      setAnimationState("hurt1");
      const hurt2Timer = setTimeout(() => setAnimationState("hurt2"), MEKAMASKINEN_HURT_FIRST_FRAME_MS);
      const doneTimer = setTimeout(() => {
        animationTimersRef.current = [];
        setAnimationState("");
      }, MEKAMASKINEN_HURT_TOTAL_MS);
      animationTimersRef.current = [hurt2Timer, doneTimer];
      return undefined;
    }

    if (defeated || action === "defeat") {
      clearAnimationTimers();
      setSuppressedAction("");
      setAnimationState("hurt1");
      const doneTimer = setTimeout(() => {
        animationTimersRef.current = [];
        setAnimationState("");
      }, MEKAMASKINEN_DEFEATED_INTRO_MS);
      animationTimersRef.current = [doneTimer];
      return undefined;
    }

    if (holdAction && action === "attack") {
      clearAnimationTimers();
      setSuppressedAction("");
      setAnimationState("attack");
      return undefined;
    }

    if (action === "attack") {
      clearAnimationTimers();
      setSuppressedAction("");
      setAnimationState("attack");
      const doneTimer = setTimeout(() => {
        animationTimersRef.current = [];
        setSuppressedAction("attack");
        setAnimationState("");
      }, MEKAMASKINEN_ATTACK_FRAME_MS);
      animationTimersRef.current = [doneTimer];
      return undefined;
    }

    setSuppressedAction("");
    if (animationTimersRef.current.length === 0) setAnimationState("");
    return undefined;
  }, [action, defeated, holdAction]);

  return (
    <img
      className={`boss-image boss-image-mekamaskinen boss-action-${action} boss-state-${visualState} boss-mood-${mood} ${visualState === "defeated" ? "boss-defeated" : ""}`}
      src={safeSrc}
      alt="Mekamaskinen"
      draggable="false"
      decoding="async"
      onError={() => { if (src !== MEKAMASKINEN_ASSETS.states.idle) setFailedSrc(src); }}
    />
  );
}

function MorkekrakenAssetFigure({ hpPercent = 100, action = "idle", mood = "confident", defeated = false, holdAction = false }) {
  const [animationState, setAnimationState] = useState(() => (action === "hit" || action === "defeat" || defeated ? "hurt1" : action === "attack" ? "attack" : ""));
  const [suppressedAction, setSuppressedAction] = useState("");
  const baseVisualState = getMorkekrakenVisualState({ hpPercent, action: suppressedAction === action ? "idle" : action, defeated });
  const visualState = animationState || baseVisualState;
  const src = MORKEKRAKEN_ASSETS.states[visualState] || MORKEKRAKEN_ASSETS.states.idle;
  const [failedSrc, setFailedSrc] = useState("");
  const safeSrc = failedSrc === src ? MORKEKRAKEN_ASSETS.states.idle : src;
  const animationTimersRef = useRef([]);

  useEffect(() => {
    return () => {
      animationTimersRef.current.forEach((timerId) => clearTimeout(timerId));
      animationTimersRef.current = [];
    };
  }, []);

  useEffect(() => {
    const clearAnimationTimers = () => {
      animationTimersRef.current.forEach((timerId) => clearTimeout(timerId));
      animationTimersRef.current = [];
    };

    if (action === "hit") {
      clearAnimationTimers();
      setSuppressedAction("");
      setAnimationState("hurt1");
      const hurt2Timer = setTimeout(() => setAnimationState("hurt2"), MORKEKRAKEN_HURT_FIRST_FRAME_MS);
      const doneTimer = setTimeout(() => {
        animationTimersRef.current = [];
        setAnimationState("");
      }, MORKEKRAKEN_HURT_TOTAL_MS);
      animationTimersRef.current = [hurt2Timer, doneTimer];
      return undefined;
    }

    if (defeated || action === "defeat") {
      clearAnimationTimers();
      setSuppressedAction("");
      setAnimationState("hurt1");
      const doneTimer = setTimeout(() => {
        animationTimersRef.current = [];
        setAnimationState("");
      }, MORKEKRAKEN_DEFEATED_INTRO_MS);
      animationTimersRef.current = [doneTimer];
      return undefined;
    }

    if (holdAction && action === "attack") {
      clearAnimationTimers();
      setSuppressedAction("");
      setAnimationState("attack");
      return undefined;
    }

    if (action === "attack") {
      clearAnimationTimers();
      setSuppressedAction("");
      setAnimationState("attack");
      const doneTimer = setTimeout(() => {
        animationTimersRef.current = [];
        setSuppressedAction("attack");
        setAnimationState("");
      }, MORKEKRAKEN_ATTACK_FRAME_MS);
      animationTimersRef.current = [doneTimer];
      return undefined;
    }

    setSuppressedAction("");
    if (animationTimersRef.current.length === 0) setAnimationState("");
    return undefined;
  }, [action, defeated, holdAction]);

  return (
    <img
      className={`boss-image boss-image-morkekraken boss-action-${action} boss-state-${visualState} boss-mood-${mood} ${visualState === "defeated" ? "boss-defeated" : ""}`}
      src={safeSrc}
      alt="Mørkekraken"
      draggable="false"
      decoding="async"
      onError={() => { if (src !== MORKEKRAKEN_ASSETS.states.idle) setFailedSrc(src); }}
    />
  );
}

function RegnemesterenAssetFigure({ hpPercent = 100, action = "idle", mood = "confident", defeated = false, holdAction = false }) {
  const [animationState, setAnimationState] = useState(() => (action === "hit" || action === "defeat" || defeated ? "hurt1" : action === "attack" ? "attack" : ""));
  const [suppressedAction, setSuppressedAction] = useState("");
  const baseVisualState = getRegnemesterenVisualState({ hpPercent, action: suppressedAction === action ? "idle" : action, defeated });
  const visualState = animationState || baseVisualState;
  const src = REGNEMESTEREN_ASSETS.states[visualState] || REGNEMESTEREN_ASSETS.states.idle;
  const [failedSrc, setFailedSrc] = useState("");
  const safeSrc = failedSrc === src ? REGNEMESTEREN_ASSETS.states.idle : src;
  const animationTimersRef = useRef([]);

  useEffect(() => {
    return () => {
      animationTimersRef.current.forEach((timerId) => clearTimeout(timerId));
      animationTimersRef.current = [];
    };
  }, []);

  useEffect(() => {
    const clearAnimationTimers = () => {
      animationTimersRef.current.forEach((timerId) => clearTimeout(timerId));
      animationTimersRef.current = [];
    };

    if (action === "hit") {
      clearAnimationTimers();
      setSuppressedAction("");
      setAnimationState("hurt1");
      const hurt2Timer = setTimeout(() => setAnimationState("hurt2"), REGNEMESTEREN_HURT_FIRST_FRAME_MS);
      const doneTimer = setTimeout(() => {
        animationTimersRef.current = [];
        setAnimationState("");
      }, REGNEMESTEREN_HURT_TOTAL_MS);
      animationTimersRef.current = [hurt2Timer, doneTimer];
      return undefined;
    }

    if (defeated || action === "defeat") {
      clearAnimationTimers();
      setSuppressedAction("");
      setAnimationState("hurt1");
      const doneTimer = setTimeout(() => {
        animationTimersRef.current = [];
        setAnimationState("");
      }, REGNEMESTEREN_DEFEATED_INTRO_MS);
      animationTimersRef.current = [doneTimer];
      return undefined;
    }

    if (holdAction && action === "attack") {
      clearAnimationTimers();
      setSuppressedAction("");
      setAnimationState("attack");
      return undefined;
    }

    if (action === "attack") {
      clearAnimationTimers();
      setSuppressedAction("");
      setAnimationState("attack");
      const doneTimer = setTimeout(() => {
        animationTimersRef.current = [];
        setSuppressedAction("attack");
        setAnimationState("");
      }, REGNEMESTEREN_ATTACK_FRAME_MS);
      animationTimersRef.current = [doneTimer];
      return undefined;
    }

    setSuppressedAction("");
    if (animationTimersRef.current.length === 0) setAnimationState("");
    return undefined;
  }, [action, defeated, holdAction]);

  return (
    <img
      className={`boss-image boss-image-regnemesteren boss-action-${action} boss-state-${visualState} boss-mood-${mood} ${visualState === "defeated" ? "boss-defeated" : ""}`}
      src={safeSrc}
      alt="Regnemesteren"
      draggable="false"
      decoding="async"
      onError={() => { if (src !== REGNEMESTEREN_ASSETS.states.idle) setFailedSrc(src); }}
    />
  );
}

function MegaRegnemesterenAssetFigure({ hpPercent = 100, action = "idle", mood = "confident", defeated = false, holdAction = false }) {
  const [animationState, setAnimationState] = useState(() => (action === "hit" || action === "defeat" || defeated ? "hurt1" : action === "attack" ? "attack" : ""));
  const [suppressedAction, setSuppressedAction] = useState("");
  const baseVisualState = getMegaRegnemesterenVisualState({ hpPercent, action: suppressedAction === action ? "idle" : action, defeated });
  const visualState = animationState || baseVisualState;
  const src = MEGA_REGNEMESTEREN_ASSETS.states[visualState] || MEGA_REGNEMESTEREN_ASSETS.states.idle;
  const [failedSrc, setFailedSrc] = useState("");
  const safeSrc = failedSrc === src ? MEGA_REGNEMESTEREN_ASSETS.states.idle : src;
  const animationTimersRef = useRef([]);

  useEffect(() => {
    return () => {
      animationTimersRef.current.forEach((timerId) => clearTimeout(timerId));
      animationTimersRef.current = [];
    };
  }, []);

  useEffect(() => {
    const clearAnimationTimers = () => {
      animationTimersRef.current.forEach((timerId) => clearTimeout(timerId));
      animationTimersRef.current = [];
    };

    if (action === "hit") {
      clearAnimationTimers();
      setSuppressedAction("");
      setAnimationState("hurt1");
      const hurt2Timer = setTimeout(() => setAnimationState("hurt2"), MEGA_REGNEMESTEREN_HURT_FIRST_FRAME_MS);
      const doneTimer = setTimeout(() => {
        animationTimersRef.current = [];
        setAnimationState("");
      }, MEGA_REGNEMESTEREN_HURT_TOTAL_MS);
      animationTimersRef.current = [hurt2Timer, doneTimer];
      return undefined;
    }

    if (defeated || action === "defeat") {
      clearAnimationTimers();
      setSuppressedAction("");
      setAnimationState("hurt1");
      const doneTimer = setTimeout(() => {
        animationTimersRef.current = [];
        setAnimationState("");
      }, MEGA_REGNEMESTEREN_DEFEATED_INTRO_MS);
      animationTimersRef.current = [doneTimer];
      return undefined;
    }

    if (holdAction && action === "attack") {
      clearAnimationTimers();
      setSuppressedAction("");
      setAnimationState("attack");
      return undefined;
    }

    if (action === "attack") {
      clearAnimationTimers();
      setSuppressedAction("");
      setAnimationState("attack");
      const doneTimer = setTimeout(() => {
        animationTimersRef.current = [];
        setSuppressedAction("attack");
        setAnimationState("");
      }, MEGA_REGNEMESTEREN_ATTACK_FRAME_MS);
      animationTimersRef.current = [doneTimer];
      return undefined;
    }

    setSuppressedAction("");
    if (animationTimersRef.current.length === 0) setAnimationState("");
    return undefined;
  }, [action, defeated, holdAction]);

  return (
    <img
      className={`boss-image boss-image-mega-regnemesteren boss-action-${action} boss-state-${visualState} boss-mood-${mood} ${visualState === "defeated" ? "boss-defeated" : ""}`}
      src={safeSrc}
      alt="Mega Regnemesteren"
      draggable="false"
      decoding="async"
      onError={() => { if (src !== MEGA_REGNEMESTEREN_ASSETS.states.idle) setFailedSrc(src); }}
    />
  );
}

function SlimeBossAssetFigure({ hpPercent = 100, action = "idle", mood = "confident", defeated = false, holdAction = false }) {
  const [animationState, setAnimationState] = useState(() => (action === "hit" || action === "defeat" || defeated ? "hurt1" : action === "attack" ? "attack" : ""));
  const [suppressedAction, setSuppressedAction] = useState("");
  const baseVisualState = getSlimeBossVisualState({ hpPercent, action: suppressedAction === action ? "idle" : action, defeated });
  const visualState = animationState || baseVisualState;
  const src = SLIME_BOSS_ASSETS.states[visualState] || SLIME_BOSS_ASSETS.states.idle;
  const [failedSrc, setFailedSrc] = useState("");
  const animationTimersRef = useRef([]);

  useEffect(() => {
    return () => {
      animationTimersRef.current.forEach((timerId) => clearTimeout(timerId));
      animationTimersRef.current = [];
    };
  }, []);

  useEffect(() => {
    const clearAnimationTimers = () => {
      animationTimersRef.current.forEach((timerId) => clearTimeout(timerId));
      animationTimersRef.current = [];
    };

    if (action === "hit") {
      clearAnimationTimers();
      setSuppressedAction("");
      setAnimationState("hurt1");
      const hurt2Timer = setTimeout(() => setAnimationState("hurt2"), SLIME_HURT_FIRST_FRAME_MS);
      const doneTimer = setTimeout(() => {
        animationTimersRef.current = [];
        setAnimationState("");
      }, SLIME_HURT_TOTAL_MS);
      animationTimersRef.current = [hurt2Timer, doneTimer];
      return undefined;
    }

    if (defeated || action === "defeat") {
      clearAnimationTimers();
      setSuppressedAction("");
      setAnimationState("hurt1");
      const doneTimer = setTimeout(() => {
        animationTimersRef.current = [];
        setAnimationState("");
      }, SLIME_DEFEATED_INTRO_MS);
      animationTimersRef.current = [doneTimer];
      return undefined;
    }

    if (holdAction && action === "attack") {
      clearAnimationTimers();
      setSuppressedAction("");
      setAnimationState("attack");
      return undefined;
    }

    if (action === "attack") {
      clearAnimationTimers();
      setSuppressedAction("");
      setAnimationState("attack");
      const doneTimer = setTimeout(() => {
        animationTimersRef.current = [];
        setSuppressedAction("attack");
        setAnimationState("");
      }, SLIME_ATTACK_FRAME_MS);
      animationTimersRef.current = [doneTimer];
      return undefined;
    }

    setSuppressedAction("");
    if (animationTimersRef.current.length === 0) setAnimationState("");
    return undefined;
  }, [action, defeated, holdAction]);

  if (failedSrc === src) {
    return <SlimeBossSvg hpPercent={hpPercent} action={action} mood={mood} defeated={defeated || visualState === "defeated"} />;
  }

  return (
    <img
      className={`boss-image boss-image-slime boss-action-${action} boss-state-${visualState} boss-mood-${mood} ${visualState === "defeated" ? "boss-defeated" : ""}`}
      src={src}
      alt="Slimbossen"
      draggable="false"
      decoding="async"
      onError={() => setFailedSrc(src)}
    />
  );
}

function SlimeBossSvg({ hpPercent, action = "idle", mood = "confident", defeated = false }) {
  const hurt = hpPercent <= 40;
  const veryHurt = hpPercent <= 20;
  const angry = mood === "angry";
  const weak = mood === "weak" || defeated;
  return (
    <svg className={`boss-svg boss-svg-slime boss-action-${action} boss-mood-${mood} ${defeated ? "boss-defeated" : ""}`} viewBox="0 0 260 205" role="img" aria-label="Slimbossen">
      <defs>
        <radialGradient id="slimeBody2" cx="38%" cy="22%" r="76%"><stop offset="0%" stopColor="#ecfccb" /><stop offset="35%" stopColor="#86efac" /><stop offset="72%" stopColor="#22c55e" /><stop offset="100%" stopColor="#15803d" /></radialGradient>
        <radialGradient id="slimeGlow2" cx="50%" cy="50%" r="58%"><stop offset="0%" stopColor="#bbf7d0" stopOpacity=".72" /><stop offset="100%" stopColor="#16a34a" stopOpacity="0" /></radialGradient>
        <radialGradient id="slimeBubble2" cx="35%" cy="25%" r="70%"><stop offset="0%" stopColor="#ffffff" stopOpacity=".9" /><stop offset="55%" stopColor="#bbf7d0" stopOpacity=".52" /><stop offset="100%" stopColor="#16a34a" stopOpacity=".28" /></radialGradient>
        <linearGradient id="slimeMouth2" x1="0" x2="1"><stop offset="0" stopColor="#052e16" /><stop offset="1" stopColor="#14532d" /></linearGradient>
      </defs>
      <ellipse cx="130" cy="178" rx="88" ry="14" fill="rgba(15,23,42,.2)" />
      <circle className="boss-aura" cx="130" cy="102" r="72" fill="url(#slimeGlow2)" />
      <circle className="boss-hit-flash" cx="130" cy="104" r="91" fill="#ecfccb" />
      <g className="boss-body-main">
        <path d="M40 128 C27 88 50 44 88 34 C101 13 145 13 158 34 C196 42 221 86 204 127 C198 156 174 169 130 171 C85 170 50 159 40 128Z" fill="url(#slimeBody2)" stroke="#14532d" strokeWidth="6" />
        <path d="M73 58 C97 39 146 36 170 55 C151 50 101 51 73 58Z" fill="rgba(255,255,255,.5)" />
        <path d="M61 103 C67 78 91 58 119 54 C99 70 91 92 92 116 C80 115 69 111 61 103Z" fill="rgba(255,255,255,.18)" />
        <path className="slime-drip" d="M64 131 C68 155 88 157 92 132" fill="#22c55e" stroke="#14532d" strokeWidth="4" />
        <path className="slime-drip" style={{ animationDelay: ".35s" }} d="M164 131 C168 160 190 158 193 131" fill="#16a34a" stroke="#14532d" strokeWidth="4" />
        <path className="slime-drip" style={{ animationDelay: ".7s" }} d="M116 158 C119 183 140 183 144 158" fill="#15803d" stroke="#14532d" strokeWidth="4" opacity=".85" />
        <circle className="slime-bubble" cx="73" cy="73" r="10" fill="url(#slimeBubble2)" stroke="#15803d" strokeWidth="3" />
        <circle className="slime-bubble" style={{ animationDelay: ".4s" }} cx="207" cy="86" r="8" fill="url(#slimeBubble2)" stroke="#15803d" strokeWidth="3" />
        <circle className="slime-bubble" style={{ animationDelay: ".9s" }} cx="197" cy="54" r="5" fill="#dcfce7" stroke="#15803d" strokeWidth="2" />
        <circle className="slime-bubble" style={{ animationDelay: "1.2s" }} cx="57" cy="104" r="5" fill="#bbf7d0" stroke="#15803d" strokeWidth="2" opacity=".8" />
        <g className="boss-eye">
          <circle cx="93" cy="96" r="20" fill="white" stroke="#14532d" strokeWidth="5" />
          <circle cx="165" cy="96" r="20" fill="white" stroke="#14532d" strokeWidth="5" />
          <circle cx={angry ? "101" : "98"} cy={weak ? "103" : "100"} r={hurt ? "6" : "9"} fill="#052e16" />
          <circle cx={angry ? "157" : "160"} cy={weak ? "103" : "100"} r={hurt ? "6" : "9"} fill="#052e16" />
          <circle cx="101" cy="96" r="3" fill="white" opacity=".9" />
          <circle cx="163" cy="96" r="3" fill="white" opacity=".9" />
        </g>
        {angry && <><path className="boss-brow" d="M76 78 L113 68" stroke="#052e16" strokeWidth="10" strokeLinecap="round" /><path className="boss-brow" d="M183 78 L146 68" stroke="#052e16" strokeWidth="10" strokeLinecap="round" /></>}
        {weak && <><path className="boss-brow" d="M77 82 L110 86" stroke="#052e16" strokeWidth="8" strokeLinecap="round" /><path className="boss-brow" d="M183 82 L150 86" stroke="#052e16" strokeWidth="8" strokeLinecap="round" /></>}
        {hurt ? <path d="M96 135 C111 121 148 121 164 135" fill="none" stroke="#052e16" strokeWidth={veryHurt ? "10" : "8"} strokeLinecap="round" /> : <path d="M95 127 C113 147 148 147 166 127" fill="none" stroke="url(#slimeMouth2)" strokeWidth="10" strokeLinecap="round" />}
        <path d="M64 144 C82 161 105 150 116 164 C126 176 147 176 158 164 C169 150 193 160 205 142" fill="none" stroke="rgba(255,255,255,.36)" strokeWidth="9" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function TrollBossSvg({ hpPercent, action = "idle", mood = "confident", defeated = false }) {
  const hurt = hpPercent <= 40;
  const veryHurt = hpPercent <= 20;
  const angry = mood === "angry";
  const weak = mood === "weak" || defeated;
  return (
    <svg className={`boss-svg boss-svg-troll boss-action-${action} boss-mood-${mood} ${defeated ? "boss-defeated" : ""}`} viewBox="0 0 260 205" role="img" aria-label="Trollkongen">
      <defs>
        <linearGradient id="trollStone2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#e7e5e4" /><stop offset="38%" stopColor="#a8a29e" /><stop offset="72%" stopColor="#57534e" /><stop offset="100%" stopColor="#292524" /></linearGradient>
        <linearGradient id="trollCrown2" x1="0" x2="1"><stop offset="0" stopColor="#fef3c7" /><stop offset="45%" stopColor="#f59e0b" /><stop offset="100%" stopColor="#92400e" /></linearGradient>
        <radialGradient id="trollGlow2" cx="50%" cy="50%" r="60%"><stop offset="0%" stopColor="#fde68a" stopOpacity=".35" /><stop offset="100%" stopColor="#92400e" stopOpacity="0" /></radialGradient>
        <radialGradient id="trollEyeGlow2" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#fef3c7" /><stop offset=".55" stopColor="#f97316" /><stop offset="1" stopColor="#7c2d12" /></radialGradient>
      </defs>
      <ellipse cx="130" cy="180" rx="92" ry="14" fill="rgba(15,23,42,.24)" />
      <circle className="boss-aura" cx="130" cy="108" r="78" fill="url(#trollGlow2)" />
      <circle className="boss-hit-flash" cx="130" cy="113" r="94" fill="#fef3c7" />
      <g className="boss-body-main">
        <path d="M73 139 C78 109 101 96 130 96 C160 96 183 110 188 139 C181 171 157 188 130 188 C103 188 79 171 73 139Z" fill="url(#trollStone2)" stroke="#292524" strokeWidth="7" />
        <path d="M83 181 L108 181 L99 202 L72 202 Z" fill="#57534e" stroke="#292524" strokeWidth="6" />
        <path d="M152 181 L177 181 L188 202 L161 202 Z" fill="#57534e" stroke="#292524" strokeWidth="6" />
        <path className="boss-arm-left" d="M61 95 C36 90 28 126 48 141 C60 149 75 143 78 127 C81 110 75 98 61 95Z" fill="url(#trollStone2)" stroke="#292524" strokeWidth="6" />
        <path className="boss-arm-right" d="M199 95 C224 90 232 126 212 141 C200 149 185 143 182 127 C179 110 185 98 199 95Z" fill="url(#trollStone2)" stroke="#292524" strokeWidth="6" />
        <path className="troll-crown" d="M78 55 L91 24 L108 54 L130 20 L151 54 L170 24 L181 57 Z" fill="url(#trollCrown2)" stroke="#78350f" strokeWidth="5" />
        <circle cx="130" cy="39" r="6" fill="#fef08a" stroke="#78350f" strokeWidth="3" />
        <circle cx="91" cy="43" r="4" fill="#fef08a" stroke="#78350f" strokeWidth="2" />
        <circle cx="169" cy="43" r="4" fill="#fef08a" stroke="#78350f" strokeWidth="2" />
        <path className="boss-head" d="M55 84 C58 48 86 39 130 39 C176 39 202 51 206 86 C222 101 219 137 200 150 C193 173 170 182 130 182 C90 182 67 173 60 150 C41 137 38 101 55 84Z" fill="url(#trollStone2)" stroke="#292524" strokeWidth="7" />
        <path d="M74 60 C55 48 45 74 57 88" fill="#78716c" stroke="#292524" strokeWidth="5" />
        <path d="M186 60 C205 48 215 74 203 88" fill="#78716c" stroke="#292524" strokeWidth="5" />
        <path d="M89 61 L101 73 L116 61" fill="none" stroke="rgba(255,255,255,.28)" strokeWidth="5" strokeLinecap="round" />
        <path d="M144 61 L159 73 L174 61" fill="none" stroke="rgba(255,255,255,.22)" strokeWidth="5" strokeLinecap="round" />
        <path d="M76 117 L91 123 L83 137" fill="none" stroke="#292524" strokeWidth="5" strokeLinecap="round" opacity=".5" />
        <path d="M164 70 L154 88 L171 96" fill="none" stroke="#292524" strokeWidth="5" strokeLinecap="round" opacity=".45" />
        {weak && <path d="M118 54 L111 75 L124 92 L115 111" fill="none" stroke="#451a03" strokeWidth="5" strokeLinecap="round" opacity=".7" />}
        <path className="boss-brow" d={weak ? "M83 89 L113 85" : "M83 87 L113 77"} stroke="#292524" strokeWidth={angry ? "12" : "9"} strokeLinecap="round" />
        <path className="boss-brow" d={weak ? "M177 89 L147 85" : "M177 87 L147 77"} stroke="#292524" strokeWidth={angry ? "12" : "9"} strokeLinecap="round" />
        <g className="boss-eye">
          <circle cx="101" cy="105" r="15" fill={angry ? "url(#trollEyeGlow2)" : "white"} stroke="#292524" strokeWidth="5" />
          <circle cx="159" cy="105" r="15" fill={angry ? "url(#trollEyeGlow2)" : "white"} stroke="#292524" strokeWidth="5" />
          <circle cx={angry ? "106" : "105"} cy={weak ? "110" : "108"} r={hurt ? "5" : "8"} fill="#111827" />
          <circle cx={angry ? "154" : "155"} cy={weak ? "110" : "108"} r={hurt ? "5" : "8"} fill="#111827" />
        </g>
        <path d="M123 106 C107 132 109 150 130 148 C151 150 153 132 137 106" fill="#a8a29e" stroke="#292524" strokeWidth="5" />
        {hurt ? <path d="M99 158 C115 144 145 144 162 158" fill="none" stroke="#292524" strokeWidth={veryHurt ? "10" : "8"} strokeLinecap="round" /> : <path d="M98 150 C116 166 145 166 163 150" fill="none" stroke="#292524" strokeWidth="8" strokeLinecap="round" />}
        <path d="M72 137 L88 143" stroke="#57534e" strokeWidth="5" strokeLinecap="round" />
        <path d="M188 137 L172 143" stroke="#57534e" strokeWidth="5" strokeLinecap="round" />
        <path d="M86 62 L100 72 L116 61" fill="none" stroke="rgba(255,255,255,.25)" strokeWidth="5" strokeLinecap="round" />
        <path d="M145 62 L160 72 L174 61" fill="none" stroke="rgba(255,255,255,.25)" strokeWidth="5" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function ShadowGolemSvg({ hpPercent, action = "idle", mood = "confident", defeated = false }) {
  const hurt = hpPercent <= 40;
  const veryHurt = hpPercent <= 20;
  const angry = mood === "angry";
  const weak = mood === "weak" || defeated;
  return (
    <svg className={`boss-svg boss-svg-shadow boss-action-${action} boss-mood-${mood} ${defeated ? "boss-defeated" : ""}`} viewBox="0 0 280 210" role="img" aria-label="Skyggegolemen">
      <defs>
        <linearGradient id="golemStone2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#94a3b8" /><stop offset="40%" stopColor="#334155" /><stop offset="72%" stopColor="#0f172a" /><stop offset="100%" stopColor="#020617" /></linearGradient>
        <linearGradient id="golemCore2" x1="0" x2="1"><stop offset="0" stopColor="#fef3c7" /><stop offset="45%" stopColor="#f97316" /><stop offset="100%" stopColor="#dc2626" /></linearGradient>
        <radialGradient id="golemAura2" cx="50%" cy="50%" r="65%"><stop offset="0%" stopColor="#f97316" stopOpacity=".34" /><stop offset="55%" stopColor="#7f1d1d" stopOpacity=".22" /><stop offset="100%" stopColor="#020617" stopOpacity="0" /></radialGradient>
        <radialGradient id="golemEye2" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#fef2f2" /><stop offset="45%" stopColor="#ef4444" /><stop offset="100%" stopColor="#7f1d1d" /></radialGradient>
        <radialGradient id="golemDarkMist2" cx="50%" cy="50%" r="70%"><stop offset="0%" stopColor="#7f1d1d" stopOpacity=".45" /><stop offset="55%" stopColor="#111827" stopOpacity=".35" /><stop offset="100%" stopColor="#020617" stopOpacity="0" /></radialGradient>
      </defs>
      <ellipse cx="140" cy="188" rx="98" ry="14" fill="rgba(2,6,23,.32)" />
      <ellipse className="shadow-mist-back" cx="140" cy="126" rx="116" ry="76" fill="url(#golemDarkMist2)" />
      <circle className="boss-aura" cx="140" cy="112" r="86" fill="url(#golemAura2)" />
      <circle className="boss-hit-flash" cx="140" cy="115" r="102" fill="#fed7aa" />
      <path className="shadow-wisp" d="M58 84 C33 88 26 118 42 136 C31 136 22 128 20 115 C18 96 34 79 58 84Z" fill="#020617" opacity=".45" />
      <path className="shadow-wisp" style={{ animationDelay: ".55s" }} d="M224 82 C252 84 262 113 247 136 C260 134 267 124 267 112 C266 93 250 79 224 82Z" fill="#020617" opacity=".42" />
      <g className="boss-body-main">
        <path className="boss-arm-left" d="M62 108 C40 109 29 128 32 148 C34 168 50 178 69 172 C82 168 86 154 81 136 C77 119 73 109 62 108Z" fill="url(#golemStone2)" stroke="#020617" strokeWidth="7" />
        <path className="boss-arm-right" d="M218 108 C240 109 251 128 248 148 C246 168 230 178 211 172 C198 168 194 154 199 136 C203 119 207 109 218 108Z" fill="url(#golemStone2)" stroke="#020617" strokeWidth="7" />
        <path d="M58 171 L43 192" stroke="#020617" strokeWidth="9" strokeLinecap="round" />
        <path d="M222 171 L237 192" stroke="#020617" strokeWidth="9" strokeLinecap="round" />
        <path className="boss-head" d="M88 89 C87 53 108 33 140 33 C174 33 195 53 193 89 C208 99 215 118 213 141 C210 169 186 184 140 184 C95 184 70 169 67 141 C65 118 73 99 88 89Z" fill="url(#golemStone2)" stroke="#020617" strokeWidth="8" />
        <path d="M92 91 L72 56 L111 74" fill="#334155" stroke="#020617" strokeWidth="6" />
        <path d="M188 91 L208 56 L169 74" fill="#334155" stroke="#020617" strokeWidth="6" />
        <path d="M126 49 L140 17 L154 49" fill="#475569" stroke="#020617" strokeWidth="6" />
        <path d="M107 62 L105 39 L124 56" fill="#475569" stroke="#020617" strokeWidth="5" />
        <path d="M173 56 L194 39 L190 63" fill="#475569" stroke="#020617" strokeWidth="5" />
        <path d="M105 78 L118 91 L109 106" fill="none" stroke="#475569" strokeWidth="5" strokeLinecap="round" opacity=".75" />
        <path d="M175 77 L163 94 L177 109" fill="none" stroke="#475569" strokeWidth="5" strokeLinecap="round" opacity=".65" />
        {weak && <><path d="M132 57 L123 82 L135 101" fill="none" stroke="#f97316" strokeWidth="5" strokeLinecap="round" opacity=".74" /><path d="M151 142 L169 154 L160 176" fill="none" stroke="#f97316" strokeWidth="5" strokeLinecap="round" opacity=".66" /></>}
        <path className="boss-brow" d={weak ? "M103 103 L128 99" : "M103 101 L127 91"} stroke="#020617" strokeWidth={angry ? "12" : "9"} strokeLinecap="round" />
        <path className="boss-brow" d={weak ? "M177 103 L152 99" : "M177 101 L153 91"} stroke="#020617" strokeWidth={angry ? "12" : "9"} strokeLinecap="round" />
        <g className="boss-eye">
          <circle cx="118" cy="116" r={angry ? "17" : "15"} fill="url(#golemEye2)" stroke="#020617" strokeWidth="5" />
          <circle cx="162" cy="116" r={angry ? "17" : "15"} fill="url(#golemEye2)" stroke="#020617" strokeWidth="5" />
          {angry && <><path d="M101 116 H89" stroke="#ef4444" strokeWidth="5" strokeLinecap="round" opacity=".75" /><path d="M179 116 H191" stroke="#ef4444" strokeWidth="5" strokeLinecap="round" opacity=".75" /></>}
          <circle cx="122" cy="113" r="4" fill="#f8fafc" />
          <circle cx="166" cy="113" r="4" fill="#f8fafc" />
        </g>
        <path d="M128 131 L140 145 L153 131 Z" fill="#0f172a" stroke="#020617" strokeWidth="5" />
        {hurt ? <path d="M110 161 C125 148 155 148 172 161" fill="none" stroke="#020617" strokeWidth={veryHurt ? "10" : "8"} strokeLinecap="round" /> : <path d="M109 154 C126 170 155 170 172 154" fill="none" stroke="#020617" strokeWidth="8" strokeLinecap="round" />}
        <circle className="golem-core" cx="140" cy="160" r={weak ? "19" : "14"} fill="url(#golemCore2)" stroke="#020617" strokeWidth="5" />
        <circle className="golem-core" cx="140" cy="160" r={weak ? "27" : "21"} fill="none" stroke="#f97316" strokeWidth="4" opacity={weak ? ".45" : ".22"} />
        <path d="M122 168 L113 198" stroke="#020617" strokeWidth="10" strokeLinecap="round" />
        <path d="M158 168 L168 198" stroke="#020617" strokeWidth="10" strokeLinecap="round" />
        <path d="M110 198 L91 201" stroke="#020617" strokeWidth="7" strokeLinecap="round" />
        <path d="M171 198 L190 201" stroke="#020617" strokeWidth="7" strokeLinecap="round" />
        <path d="M91 132 L72 140" stroke="#475569" strokeWidth="6" strokeLinecap="round" />
        <path d="M189 132 L208 140" stroke="#475569" strokeWidth="6" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function TreasureChest({ size = "small" }) {
  const goldCount = size === "large" ? 18 : size === "medium" ? 12 : 7;
  const diamondCount = size === "large" ? 7 : size === "medium" ? 4 : 2;
  return (
    <div className={`treasure-wrap ${size}`} aria-label="Åpen skattekiste med gull og diamanter">
      <svg viewBox="0 0 240 180" role="img">
        <defs><linearGradient id="chestWoodOpen" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#92400e" /><stop offset="55%" stopColor="#b45309" /><stop offset="100%" stopColor="#78350f" /></linearGradient><linearGradient id="goldGlowOpen" x1="0" x2="1"><stop offset="0" stopColor="#fef3c7" /><stop offset="45%" stopColor="#facc15" /><stop offset="100%" stopColor="#d97706" /></linearGradient><linearGradient id="diamondGlow" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#e0f2fe" /><stop offset="45%" stopColor="#38bdf8" /><stop offset="100%" stopColor="#2563eb" /></linearGradient></defs>
        <ellipse cx="120" cy="160" rx="92" ry="12" fill="rgba(15,23,42,.18)" /><path d="M51 75 C58 38 85 20 122 22 C158 24 185 43 190 80 L174 100 C161 81 143 72 119 72 C95 72 76 81 63 101Z" fill="#7c2d12" stroke="#451a03" strokeWidth="7" /><path d="M72 72 C82 48 101 39 122 40 C144 41 160 50 171 73" fill="none" stroke="#fbbf24" strokeWidth="6" strokeLinecap="round" opacity=".8" />
        {Array.from({ length: goldCount }).map((_, index) => { const x = 65 + (index % 7) * 17; const y = 83 + Math.floor(index / 7) * 13 + (index % 2) * 3; return <circle key={`gold-${index}`} cx={x} cy={y} r="9" fill="url(#goldGlowOpen)" stroke="#a16207" strokeWidth="3" />; })}
        {Array.from({ length: diamondCount }).map((_, index) => { const x = 76 + (index % 5) * 28; const y = 75 + Math.floor(index / 5) * 16; return <path key={`diamond-${index}`} d={`M${x} ${y} L${x + 8} ${y + 9} L${x} ${y + 18} L${x - 8} ${y + 9} Z`} fill="url(#diamondGlow)" stroke="#075985" strokeWidth="2" />; })}
        <rect x="42" y="89" width="156" height="66" rx="14" fill="url(#chestWoodOpen)" stroke="#451a03" strokeWidth="7" /><path d="M42 113 H198" stroke="#451a03" strokeWidth="5" /><path d="M82 91 V154" stroke="#451a03" strokeWidth="5" /><path d="M158 91 V154" stroke="#451a03" strokeWidth="5" /><rect x="102" y="107" width="36" height="32" rx="7" fill="url(#goldGlowOpen)" stroke="#78350f" strokeWidth="4" /><circle cx="120" cy="124" r="4" fill="#78350f" />
      </svg>
    </div>
  );
}

function StarsDisplay({ count }) {
  return <div className="stars" aria-label={`${count} stjerner`}>{Array.from({ length: count }).map((_, index) => <Star key={index} className="star-icon" />)}</div>;
}

function ResultHighscoreList({ scores, mode, gameType, gradeLevel, level, questionCount, gradeGroup }) {
  const isTimed = isTimeChallengeMode(mode);
  const visibleScores = gameType === "school_battle"
    ? dedupeSchoolBattleScores(scores, mode)
    : dedupeNormalScores(scores, mode);
  const title = gameType === "school_battle"
    ? `Skolekampen - ${getModeLabel(mode)}${isTimed ? ` - ${getGradeGroupLabel(gradeGroup)}` : ""}`
    : getHighscoreTitle(mode, level, gradeLevel, questionCount);

  return (
    <div className="card highscore-card">
      <h2 className="result-highscore-title">Highscore</h2>
      <p className="small-note">{title}</p>
      {visibleScores.length === 0 ? (
        <div className="empty-state"><p>Ingen resultater på denne listen ennå.</p></div>
      ) : (
        <div className="score-list">
          {visibleScores.map((entry, index) => (
            <div key={`${entry.name}-${entry.school || ""}-${entry.grade_level || 0}-${entry.score}-${index}`} className="score-row">
              <div className="score-name">
                <span className={index === 0 ? "rank rank-first" : "rank"}>{index + 1}</span>
                <strong>{entry.name}</strong>
                {gameType === "school_battle" && <small>{entry.school || "Ukjent skole"} · {getSchoolBattleClassLabel(entry)}</small>}
              </div>
              <span className="score-value">{isTimed ? formatTime(entry.score) : entry.score}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function QrCodeImage() {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(APP_URL)}`;
  return <img src={qrUrl} alt="QR-kode til Regnemester" style={{ width: "260px", height: "260px", maxWidth: "100%", borderRadius: "18px" }} />;
}

export default function App() {
  const [screen, setScreen] = useState("home");
  const [gameType, setGameType] = useState("normal");
  const [gameGradeLevel, setGameGradeLevel] = useState(null);
  const [schoolBattleSchool, setSchoolBattleSchool] = useState("");
  const [schoolBattleGradeLevel, setSchoolBattleGradeLevel] = useState(4);
  const [schoolBattleGradeGroup, setSchoolBattleGradeGroup] = useState("small");
  const [gameMode, setGameMode] = useState("addition");
  const [gameLevel, setGameLevel] = useState("medium");
  const [gameQuestionCount, setGameQuestionCount] = useState(10);
  const [normalTimed, setNormalTimed] = useState(true);
  const [gameLevelChoiceMade, setGameLevelChoiceMade] = useState(false);
  const [gameQuestionCountChoiceMade, setGameQuestionCountChoiceMade] = useState(false);
  const [schoolGradeChoiceMade, setSchoolGradeChoiceMade] = useState(false);
  const [schoolGradeGroupChoiceMade, setSchoolGradeGroupChoiceMade] = useState(false);
  const [highscoreGradeLevel, setHighscoreGradeLevel] = useState(4);
  const [highscoreMode, setHighscoreMode] = useState("addition");
  const [highscoreLevel, setHighscoreLevel] = useState("medium");
  const [highscoreQuestionCount, setHighscoreQuestionCount] = useState(10);
  const [highscoreGradeGroup, setHighscoreGradeGroup] = useState("small");
  const [playerName, setPlayerName] = useState("");
  const [nameError, setNameError] = useState("");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(NORMAL_GAME_SECONDS);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [questionsDone, setQuestionsDone] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState(0);
  const [resultTimeSeconds, setResultTimeSeconds] = useState(0);
  const [resultCorrectAnswers, setResultCorrectAnswers] = useState(0);
  const [resultWrongAnswers, setResultWrongAnswers] = useState(0);
  const [question, setQuestion] = useState(() => makeQuestion("addition", "medium"));
  const [feedback, setFeedback] = useState(null);
  let [scores, setScores] = useState([]);
  const [resultScores, setResultScores] = useState([]);
  const [adminLoginPin, setAdminLoginPin] = useState("");
  const [adminAccessPin, setAdminAccessPin] = useState("");
  const [adminMessage, setAdminMessage] = useState("");
  const [adminNormalGradeLevel, setAdminNormalGradeLevel] = useState(4);
  const [adminNormalMode, setAdminNormalMode] = useState("addition");
  const [adminNormalLevel, setAdminNormalLevel] = useState("medium");
  const [adminNormalQuestionCount, setAdminNormalQuestionCount] = useState(10);
  const [adminNormalScores, setAdminNormalScores] = useState([]);
  const [adminNormalSearch, setAdminNormalSearch] = useState("");
  const [adminNormalGradeFilter, setAdminNormalGradeFilter] = useState(ALL_FILTER_VALUE);
  const [adminNormalModeFilter, setAdminNormalModeFilter] = useState(ALL_FILTER_VALUE);
  const [adminNormalLevelFilter, setAdminNormalLevelFilter] = useState(ALL_FILTER_VALUE);
  const [adminNormalQuestionCountFilter, setAdminNormalQuestionCountFilter] = useState(ALL_FILTER_VALUE);
  const [scoreMessage, setScoreMessage] = useState("");
  const [schoolBattleEnabled, setSchoolBattleEnabled] = useState(true);
  const [schoolBattleStatusLoading, setSchoolBattleStatusLoading] = useState(false);
  const [schoolBattleStatusMessage, setSchoolBattleStatusMessage] = useState("");
  const [schoolBattleToggleSaving, setSchoolBattleToggleSaving] = useState(false);
  const [announcementSettings, setAnnouncementSettings] = useState(() => getDefaultAnnouncementSettings());
  const [announcementDismissedKey, setAnnouncementDismissedKey] = useState(() => readDismissedAnnouncementKey());
  const [announcementDraftEnabled, setAnnouncementDraftEnabled] = useState(false);
  const [announcementDraftTitle, setAnnouncementDraftTitle] = useState("");
  const [announcementDraftMessage, setAnnouncementDraftMessage] = useState("");
  const [announcementSaving, setAnnouncementSaving] = useState(false);
  const [regnereisenAccessCode, setRegnereisenAccessCode] = useState(() => readLocalRegnereisenAccessCode());
  const [regnereisenAccessCodeDraft, setRegnereisenAccessCodeDraft] = useState(() => readLocalRegnereisenAccessCode());
  const [regnereisenAccessCodeSaving, setRegnereisenAccessCodeSaving] = useState(false);
  const [regnereisenAccessInput, setRegnereisenAccessInput] = useState("");
  const [regnereisenAccessMessage, setRegnereisenAccessMessage] = useState("");
  const [regnereisenAccessDialogOpen, setRegnereisenAccessDialogOpen] = useState(false);
  const [regnereisenUnlockedCode, setRegnereisenUnlockedCode] = useState(() => readRegnereisenUnlockedCode());
  const [normalResultMotivationMessage, setNormalResultMotivationMessage] = useState("");
  const [normalCorrectCount, setNormalCorrectCount] = useState(0);
  const [normalWrongCount, setNormalWrongCount] = useState(0);
  const [normalCurrentStreak, setNormalCurrentStreak] = useState(0);
  const [normalBestStreak, setNormalBestStreak] = useState(0);
  const [regnereisenProgress, setRegnereisenProgress] = useState(() => readRegnereisenProgress());
  const [regnereisenTokenId, setRegnereisenTokenId] = useState(() => readRegnereisenTokenId());
  const [regnereisenMissionPlaceId, setRegnereisenMissionPlaceId] = useState("sumpporten");
  const [regnereisenMissionQuestion, setRegnereisenMissionQuestion] = useState(() => makeRegnereisenMissionQuestion("sumpporten"));
  const [regnereisenMissionCorrect, setRegnereisenMissionCorrect] = useState(0);
  const [regnereisenMissionLives, setRegnereisenMissionLives] = useState(REGNEREISEN_MISSION_LIVES);
  const [regnereisenMissionFailed, setRegnereisenMissionFailed] = useState(false);
  const [regnereisenMissionFeedback, setRegnereisenMissionFeedback] = useState(null);
  const [regnereisenBossPlaceId, setRegnereisenBossPlaceId] = useState(null);
  const [regnereisenReward, setRegnereisenReward] = useState(null);
  const [regnereisenTravelAnimation, setRegnereisenTravelAnimation] = useState(null);
  const [regnereisenResetConfirmVisible, setRegnereisenResetConfirmVisible] = useState(false);

  const [bossId, setBossId] = useState("slime");
  const [bossChoiceMade, setBossChoiceMade] = useState(false);
  const [bossLevelChoiceMade, setBossLevelChoiceMade] = useState(false);
  const [bossLadderUnlocks, setBossLadderUnlocks] = useState(() => readBossLadderUnlocks());
  const [bossResetConfirmVisible, setBossResetConfirmVisible] = useState(false);
  const [bossResetMessage, setBossResetMessage] = useState("");
  const [bossLives, setBossLives] = useState(0);
  const [bossMaxLives, setBossMaxLives] = useState(0);
  const [playerHearts, setPlayerHearts] = useState(0);
  const [playerMaxHearts, setPlayerMaxHearts] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [bossCorrectAnswers, setBossCorrectAnswers] = useState(0);
  const [bossWrongAnswers, setBossWrongAnswers] = useState(0);
  const [bossOutcome, setBossOutcome] = useState(null);
  const [finalDiplomaName, setFinalDiplomaName] = useState("");
  const [finalDiplomaNameError, setFinalDiplomaNameError] = useState("");
  const [finalDiplomaReady, setFinalDiplomaReady] = useState(false);
  const [megaIntroStep, setMegaIntroStep] = useState(null);
  const [bossMessage, setBossMessage] = useState("");
  const [damagePopup, setDamagePopup] = useState(null);
  const [bossHit, setBossHit] = useState(false);
  const [playerHit, setPlayerHit] = useState(false);

  const savedThisRound = useRef(false);
  const questionDeck = useRef([]);
  const regnereisenQuestionDeck = useRef({ placeId: "", questions: [] });
  const gameAreaRef = useRef(null);
  const regnereisenMapPanelRef = useRef(null);

  const cleanPlayerName = normalizePlayerName(playerName);
  const cleanFinalDiplomaName = normalizePlayerName(finalDiplomaName);
  const stars = useMemo(() => getStars(score), [score]);
  const selectedRegnereisenToken = useMemo(() => getRegnereisenToken(regnereisenTokenId), [regnereisenTokenId]);
  const regnereisenAccessGranted = useMemo(
    () => Boolean(regnereisenAccessCode && regnereisenUnlockedCode === regnereisenAccessCode),
    [regnereisenAccessCode, regnereisenUnlockedCode]
  );
  const isNormalUntimedRound = gameType === "normal" && !normalTimed;
  const isCurrentTimeChallenge = isTimeChallengeMode(gameMode) && !isNormalUntimedRound;
  const isLocalDevEnvironment = import.meta.env.DEV && typeof window !== "undefined" && ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
  const activeQuestionCount = gameType === "school_battle" && isTimeChallengeMode(gameMode) ? SCHOOL_BATTLE_TIME_QUESTION_COUNT : gameQuestionCount;
  const adminNormalGroups = useMemo(
    () =>
      buildNormalAdminGroups(adminNormalScores, {
        search: adminNormalSearch,
        grade: adminNormalGradeFilter,
        mode: adminNormalModeFilter,
        level: adminNormalLevelFilter,
        questionCount: adminNormalQuestionCountFilter,
      }),
    [adminNormalScores, adminNormalSearch, adminNormalGradeFilter, adminNormalModeFilter, adminNormalLevelFilter, adminNormalQuestionCountFilter]
  );
  const adminNormalStats = useMemo(() => getNormalAdminStats(adminNormalScores), [adminNormalScores]);
  const activeAnnouncement = useMemo(() => normalizeAnnouncementSettings(announcementSettings), [announcementSettings]);
  const activeAnnouncementDismissKey = useMemo(() => getAnnouncementDismissKey(activeAnnouncement), [activeAnnouncement]);
  const shouldShowAnnouncementPopup =
    screen === "home" &&
    activeAnnouncement.enabled &&
    Boolean(activeAnnouncement.message) &&
    Boolean(activeAnnouncementDismissKey) &&
    announcementDismissedKey !== activeAnnouncementDismissKey;

  async function refreshSchoolBattleEnabledStatus(fallback = schoolBattleEnabled, options = {}) {
    const { showLoading = false } = options;
    if (showLoading) setSchoolBattleStatusLoading(true);
    try {
      const enabled = await loadSchoolBattleEnabledSetting(fallback);
      setSchoolBattleEnabled(enabled);
      if (enabled) setSchoolBattleStatusMessage("");
      return enabled;
    } catch (error) {
      console.warn("[Regnemester] Kunne ikke hente Skolekampen-status.", { error });
      return fallback;
    } finally {
      if (showLoading) setSchoolBattleStatusLoading(false);
    }
  }

  async function refreshAnnouncementSettings(options = {}) {
    const { syncDraft = false } = options;
    try {
      const loaded = await loadAnnouncementSettings();
      setAnnouncementSettings(loaded);
      if (syncDraft) {
        setAnnouncementDraftEnabled(loaded.enabled);
        setAnnouncementDraftTitle(loaded.title);
        setAnnouncementDraftMessage(loaded.message);
      }
      return loaded;
    } catch (error) {
      console.warn("[Regnemester] Kunne ikke hente startsidebeskjed.", { error });
      setAnnouncementSettings(getDefaultAnnouncementSettings());
      return getDefaultAnnouncementSettings();
    }
  }

  async function refreshRegnereisenAccessCode(options = {}) {
    const { syncDraft = false } = options;
    try {
      const loadedCode = await loadRegnereisenAccessCode();
      setRegnereisenAccessCode(loadedCode);
      if (syncDraft) setRegnereisenAccessCodeDraft(loadedCode);
      return loadedCode;
    } catch (error) {
      console.warn("[Regnemester] Kunne ikke hente Regnereisen-kode.", { error });
      return "";
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function refreshFromSupabase() {
      setSchoolBattleStatusLoading(true);
      try {
        const enabled = await loadSchoolBattleEnabledSetting(true);
        if (cancelled) return;
        setSchoolBattleEnabled(enabled);
        if (enabled) setSchoolBattleStatusMessage("");
      } catch (error) {
        if (!cancelled) console.warn("[Regnemester] Kunne ikke hente Skolekampen-status.", { error });
      } finally {
        if (!cancelled) setSchoolBattleStatusLoading(false);
      }
    }

    refreshFromSupabase();
    if (typeof window === "undefined") return () => { cancelled = true; };
    const handleFocus = () => refreshFromSupabase();
    const handleVisibilityChange = () => {
      if (!document.hidden) refreshFromSupabase();
    };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function refreshAnnouncement() {
      try {
        const loaded = await loadAnnouncementSettings();
        if (cancelled) return;
        setAnnouncementSettings(loaded);
        setAnnouncementDraftEnabled(loaded.enabled);
        setAnnouncementDraftTitle(loaded.title);
        setAnnouncementDraftMessage(loaded.message);
      } catch (error) {
        if (!cancelled) {
          console.warn("[Regnemester] Kunne ikke hente startsidebeskjed.", { error });
          setAnnouncementSettings(getDefaultAnnouncementSettings());
        }
      }
    }

    refreshAnnouncement();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function refreshAccessCode() {
      try {
        const loadedCode = await loadRegnereisenAccessCode();
        if (cancelled) return;
        setRegnereisenAccessCode(loadedCode);
        setRegnereisenAccessCodeDraft(loadedCode);
      } catch (error) {
        if (!cancelled) console.warn("[Regnemester] Kunne ikke hente Regnereisen-kode.", { error });
      }
    }

    refreshAccessCode();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (screen === "home") {
      refreshAnnouncementSettings();
      refreshRegnereisenAccessCode();
    }
  }, [screen]);

  useEffect(() => {
    retryPendingAndNotify("app-start");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const preload = () => preloadModeBackgrounds();
    if (typeof window.requestIdleCallback === "function") {
      const idleId = window.requestIdleCallback(preload, { timeout: 1500 });
      return () => window.cancelIdleCallback?.(idleId);
    }
    const timeoutId = window.setTimeout(preload, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (screen !== "bossSelect" && screen !== "bossPlay") return;
    if (bossId === "slime") preloadImageUrls(SLIME_BOSS_PRELOAD_URLS);
    if (bossId === "troll") preloadImageUrls(TROLL_BOSS_PRELOAD_URLS);
    if (bossId === "shadow") preloadImageUrls(SHADOW_GOLEM_PRELOAD_URLS);
    if (bossId === "isdragen") preloadImageUrls(ISDRAGEN_PRELOAD_URLS);
    if (bossId === "lavakjempen") preloadImageUrls(LAVAKJEMPEN_PRELOAD_URLS);
    if (bossId === "stormornen") preloadImageUrls(STORMORNEN_PRELOAD_URLS);
    if (bossId === "krystallvokteren") preloadImageUrls(KRYSTALLVOKTEREN_PRELOAD_URLS);
    if (bossId === "mekamaskinen") preloadImageUrls(MEKAMASKINEN_PRELOAD_URLS);
    if (bossId === "morkekraken") preloadImageUrls(MORKEKRAKEN_PRELOAD_URLS);
    if (bossId === "regnemesteren") preloadImageUrls(REGNEMESTEREN_PRELOAD_URLS);
    if (bossId === MEGA_REGNEMESTEREN_ID) preloadImageUrls(MEGA_REGNEMESTEREN_PRELOAD_URLS);
  }, [bossId, screen]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const handleOnline = () => retryPendingAndNotify("online");
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  useLayoutEffect(() => {
    if (screen === "play" || screen === "bossPlay" || screen === "regnereisenMission") {
      scrollToGameTop(gameAreaRef.current);
      return;
    }

    if (screen === "regnereisenMap") {
      scrollToGameTop(regnereisenMapPanelRef.current);
      return;
    }

    if (screen === "regnereisenTokenSelect" || screen === "regnereisen") {
      scrollToGameTop();
    }
  }, [screen]);

  useEffect(() => {
    if (!regnereisenTravelAnimation) return undefined;
    const timer = setTimeout(() => {
      setRegnereisenTravelAnimation((current) => (
        current?.id === regnereisenTravelAnimation.id ? null : current
      ));
    }, REGNEREISEN_TRAVEL_ANIMATION_MS);
    return () => clearTimeout(timer);
  }, [regnereisenTravelAnimation]);

  useEffect(() => {
    if (screen !== "play") return;
    if (isNormalUntimedRound) return;
    if (isCurrentTimeChallenge) {
      const timer = setTimeout(() => setElapsedSeconds((current) => current + 1), 1000);
      return () => clearTimeout(timer);
    }
    if (timeLeft <= 0) {
      finishGame();
      return;
    }
    const timer = setTimeout(() => setTimeLeft((current) => current - 1), 1000);
    return () => clearTimeout(timer);
  }, [screen, timeLeft, elapsedSeconds, isCurrentTimeChallenge, isNormalUntimedRound]);

  async function refreshScores(mode = highscoreMode, level = highscoreLevel, gradeLevel = highscoreGradeLevel, questionCount = highscoreQuestionCount, resultLimit = NORMAL_HIGHSCORE_VISIBLE_LIMIT) {
    try { const loaded = await loadScores(mode, level, gradeLevel, questionCount, resultLimit); setScores(loaded); setScoreMessage(""); return loaded; } catch (error) { logHighscoreError("henting", { type: "normal_score", game_type: "normal", mode, level, grade_level: gradeLevel, question_count: questionCount }, error); setScoreMessage(HIGHSCORE_LOAD_FAILED_MESSAGE); return []; }
  }

  async function refreshSchoolBattleScores(mode = highscoreMode, gradeGroup = highscoreGradeGroup, resultLimit = 20) {
    try { const loaded = await loadSchoolBattleScores(mode, gradeGroup, resultLimit); setScores(loaded); setScoreMessage(""); return loaded; } catch (error) { logHighscoreError("henting", { type: "school_battle_score", game_type: "school_battle", mode, grade_group: gradeGroup }, error); setScoreMessage(HIGHSCORE_LOAD_FAILED_MESSAGE); return []; }
  }

  async function retryPendingAndNotify(source = "manual") {
    const hasSchoolBattlePending = readPendingHighscores().some((item) => getHighscoreGameType(item.type) === "school_battle");
    if (hasSchoolBattlePending) {
      const schoolBattleOpen = await refreshSchoolBattleEnabledStatus(schoolBattleEnabled);
      if (!schoolBattleOpen) return { savedCount: 0, failedCount: 0 };
    }
    const result = await retryPendingHighscores({ source });
    if (result.savedCount > 0) {
      setScoreMessage((current) => current ? `${current} ${PENDING_HIGHSCORE_SAVED_MESSAGE}` : PENDING_HIGHSCORE_SAVED_MESSAGE);
    }
    return result;
  }

  async function saveRoundHighscore({ type, entry, baseMessage, loadScoresForResult, loadContext, applyHighscoreContext }) {
    applyHighscoreContext();
    const messages = [baseMessage];
    if (type.startsWith("school_battle")) {
      const schoolBattleOpen = await refreshSchoolBattleEnabledStatus(schoolBattleEnabled);
      if (!schoolBattleOpen) {
        setSchoolBattleStatusMessage(SCHOOL_BATTLE_CLOSED_MESSAGE);
        setResultScores([]);
        setScoreMessage(SCHOOL_BATTLE_CLOSED_DURING_ROUND_MESSAGE);
        return;
      }
    }
    const pending = queuePendingHighscore(type, entry);
    setScoreMessage(`${baseMessage} Lagrer resultat...`);
    let saveConfirmed = false;
    try {
      const saveResult = await savePendingHighscoreWithRetry(pending, { source: "round-finished", stage: "lagring" });
      saveConfirmed = true;
      messages.push(saveResult?.message || HIGHSCORE_SAVE_CONFIRMED_MESSAGE);
    } catch (error) {
      logHighscoreError("lagring-ga-opp", { ...pending, type, game_type: getHighscoreGameType(type) }, error);
      messages.push(HIGHSCORE_SAVE_PENDING_MESSAGE);
    }
    try {
      const loaded = await loadScoresForResult();
      setScores(loaded);
      setResultScores(loaded);
    } catch (error) {
      logHighscoreError("henting", loadContext, error);
      setResultScores([]);
      messages.push(HIGHSCORE_LOAD_FAILED_MESSAGE);
    }
    if (saveConfirmed && messages.length === 1) messages.push(HIGHSCORE_SAVE_CONFIRMED_MESSAGE);
    setScoreMessage(messages.filter(Boolean).join(" "));
  }

  function openHighscore(mode = gameMode, level = gameLevel, gradeLevel = gameGradeLevel, questionCount = gameQuestionCount) {
    setHighscoreMode(mode); setHighscoreLevel(level); setHighscoreGradeLevel(gradeLevel); setHighscoreQuestionCount(questionCount); setScreen("highscoreHome");
  }

  function openSchoolBattleHighscore(mode = gameMode, gradeGroup = schoolBattleGradeGroup) {
    setHighscoreMode(mode); if (isTimeChallengeMode(mode)) setHighscoreGradeGroup(gradeGroup || "small"); refreshSchoolBattleScores(mode, gradeGroup || highscoreGradeGroup, SCHOOL_BATTLE_VISIBLE_FETCH_LIMIT); setScreen("schoolHighscore");
  }

  function openHighscoreFromHome() { setScreen("highscoreHome"); }

  function openNormalHighscoreFromHome() {
    setGameType("normal"); setHighscoreMode("addition"); setHighscoreLevel("medium"); setHighscoreQuestionCount(10); setScreen("highscoreHome");
  }

  function openSchoolHighscoreFromHome() {
    setGameType("school_battle"); setHighscoreMode("addition"); setHighscoreGradeGroup("small"); refreshSchoolBattleScores("addition", "small", SCHOOL_BATTLE_VISIBLE_FETCH_LIMIT); setScreen("schoolHighscore");
  }

  async function checkSchoolBattleOpen() {
    const enabled = await refreshSchoolBattleEnabledStatus(schoolBattleEnabled, { showLoading: true });
    if (!enabled) setSchoolBattleStatusMessage(SCHOOL_BATTLE_CLOSED_MESSAGE);
    return enabled;
  }

  async function openSchoolBattleFromHome() {
    const enabled = await checkSchoolBattleOpen();
    if (!enabled) return;
    setSchoolBattleStatusMessage("");
    setGameType("school_battle");
    setSchoolBattleSchool("");
    setGameLevel("medium");
    setGameLevelChoiceMade(false);
    setGameQuestionCountChoiceMade(false);
    setSchoolGradeChoiceMade(false);
    setSchoolGradeGroupChoiceMade(false);
    setScreen("school");
  }

  function openRegnereisenFromHome() {
    setSchoolBattleStatusMessage("");
    if (!regnereisenAccessGranted) {
      setRegnereisenAccessMessage("");
      setRegnereisenAccessDialogOpen(true);
      return;
    }
    setRegnereisenAccessMessage("");
    setScreen(selectedRegnereisenToken ? "regnereisen" : "regnereisenTokenSelect");
  }

  function closeRegnereisenAccessDialog() {
    setRegnereisenAccessDialogOpen(false);
    setRegnereisenAccessMessage("");
  }

  async function submitRegnereisenAccessCode(event) {
    event?.preventDefault?.();
    const cleanCode = normalizeRegnereisenAccessCode(regnereisenAccessInput);
    if (cleanCode.length !== 4) {
      setRegnereisenAccessMessage("Skriv inn en 4-sifret testkode.");
      return;
    }

    const activeCode = regnereisenAccessCode || await refreshRegnereisenAccessCode();
    if (!activeCode) {
      setRegnereisenAccessMessage("Regnereisen er ikke åpnet for test ennå.");
      return;
    }
    if (cleanCode !== activeCode) {
      setRegnereisenAccessMessage("Koden stemmer ikke.");
      return;
    }
    writeRegnereisenUnlockedCode(cleanCode);
    setRegnereisenUnlockedCode(cleanCode);
    setRegnereisenAccessInput("");
    setRegnereisenAccessMessage("");
    setRegnereisenAccessDialogOpen(false);
    setScreen(selectedRegnereisenToken ? "regnereisen" : "regnereisenTokenSelect");
  }

  async function toggleSchoolBattleFromAdmin() {
    setAdminMessage("");
    if (!adminAccessPin && supabase) {
      setAdminMessage("Logg inn på nytt for å endre Skolekampen.");
      return;
    }

    const nextEnabled = !schoolBattleEnabled;
    setSchoolBattleToggleSaving(true);
    try {
      if (supabase) {
        const { error } = await supabase.rpc("set_school_battle_enabled", {
          p_enabled: nextEnabled,
          p_admin_pin: adminAccessPin,
        });
        if (error) throw new Error(error.message || "Kunne ikke endre Skolekampen-status.");
      }
      setSchoolBattleEnabled(nextEnabled);
      if (nextEnabled) setSchoolBattleStatusMessage("");
      setAdminMessage(nextEnabled ? "Skolekampen er nå åpen." : "Skolekampen er nå stengt.");
    } catch (error) {
      setAdminMessage(error.message || "Kunne ikke endre Skolekampen-status.");
    } finally {
      setSchoolBattleToggleSaving(false);
    }
  }

  function closeAnnouncementPopup() {
    if (!activeAnnouncementDismissKey) return;
    writeDismissedAnnouncementKey(activeAnnouncementDismissKey);
    setAnnouncementDismissedKey(activeAnnouncementDismissKey);
  }

  async function saveRegnereisenAccessCodeFromAdmin() {
    setAdminMessage("");
    const cleanCode = normalizeRegnereisenAccessCode(regnereisenAccessCodeDraft);
    if (cleanCode.length !== 4) {
      setAdminMessage("Regnereisen-koden må være 4 sifre.");
      return;
    }
    if (!adminAccessPin && supabase) {
      setAdminMessage("Logg inn på nytt for å endre Regnereisen-koden.");
      return;
    }

    setRegnereisenAccessCodeSaving(true);
    try {
      let globalSaveWarning = "";
      if (supabase) {
        const { error } = await supabase.rpc("set_regnereisen_access_code", {
          p_access_code: cleanCode,
          p_admin_pin: adminAccessPin,
        });
        if (error) {
          globalSaveWarning = error.message || "Kunne ikke publisere Regnereisen-koden via Supabase.";
        }
      }

      writeLocalRegnereisenAccessCode(cleanCode);
      setRegnereisenAccessCode(cleanCode);
      setRegnereisenAccessCodeDraft(cleanCode);

      if (supabase && !globalSaveWarning) {
        const loadedCode = await refreshRegnereisenAccessCode({ syncDraft: true });
        if (!loadedCode) {
          setRegnereisenAccessCode(cleanCode);
          setRegnereisenAccessCodeDraft(cleanCode);
        }
      }

      setAdminMessage(
        globalSaveWarning
          ? `Regnereisen-koden er lagret lokalt i denne nettleseren, men ikke publisert via Supabase: ${globalSaveWarning}`
          : "Regnereisen-koden er lagret."
      );
    } catch (error) {
      setAdminMessage(error.message || "Kunne ikke lagre Regnereisen-koden. Det kan mangle Supabase RPC: set_regnereisen_access_code.");
    } finally {
      setRegnereisenAccessCodeSaving(false);
    }
  }

  async function publishAnnouncementFromAdmin() {
    setAdminMessage("");
    const cleanTitle = announcementDraftTitle.trim();
    const cleanMessage = announcementDraftMessage.trim();
    if (announcementDraftEnabled && !cleanMessage) {
      setAdminMessage("Skriv en melding fÃ¸r du publiserer startsidebeskjeden.");
      return;
    }
    if (!adminAccessPin && supabase) {
      setAdminMessage("Logg inn pÃ¥ nytt for Ã¥ publisere startsidebeskjed.");
      return;
    }

    const nextSettings = normalizeAnnouncementSettings({
      enabled: announcementDraftEnabled,
      title: cleanTitle,
      message: cleanMessage,
      version: new Date().toISOString(),
    });
    setAnnouncementSaving(true);
    try {
      if (supabase) {
        const { error } = await supabase.rpc("set_announcement_settings", {
          p_enabled: announcementDraftEnabled,
          p_title: cleanTitle,
          p_message: cleanMessage,
          p_admin_pin: adminAccessPin,
        });
        if (error) throw new Error(error.message || "Kunne ikke publisere startsidebeskjed.");
        await refreshAnnouncementSettings({ syncDraft: true });
      } else {
        writeLocalAnnouncementSettings(nextSettings);
        setAnnouncementSettings(nextSettings);
        setAnnouncementDraftEnabled(nextSettings.enabled);
        setAnnouncementDraftTitle(nextSettings.title);
        setAnnouncementDraftMessage(nextSettings.message);
      }
      setAnnouncementDraftEnabled(nextSettings.enabled);
      setAdminMessage(nextSettings.enabled ? "Startsidebeskjed er publisert." : "Startsidebeskjed er skrudd av.");
    } catch (error) {
      setAdminMessage(error.message || "Kunne ikke publisere startsidebeskjed. Det kan mangle Supabase RPC: set_announcement_settings.");
    } finally {
      setAnnouncementSaving(false);
    }
  }

  async function disableAnnouncementFromAdmin() {
    setAdminMessage("");
    if (!adminAccessPin && supabase) {
      setAdminMessage("Logg inn pÃ¥ nytt for Ã¥ skru av startsidebeskjed.");
      return;
    }

    const nextSettings = normalizeAnnouncementSettings({
      ...announcementSettings,
      enabled: false,
    });
    setAnnouncementSaving(true);
    try {
      if (supabase) {
        const { error } = await supabase.rpc("set_announcement_settings", {
          p_enabled: false,
          p_title: announcementDraftTitle.trim(),
          p_message: announcementDraftMessage.trim(),
          p_admin_pin: adminAccessPin,
        });
        if (error) throw new Error(error.message || "Kunne ikke skru av startsidebeskjed.");
        await refreshAnnouncementSettings({ syncDraft: true });
      } else {
        writeLocalAnnouncementSettings(nextSettings);
        setAnnouncementSettings(nextSettings);
        setAnnouncementDraftEnabled(false);
      }
      setAnnouncementDraftEnabled(false);
      setAdminMessage("Startsidebeskjed er skrudd av.");
    } catch (error) {
      setAdminMessage(error.message || "Kunne ikke skru av startsidebeskjed. Det kan mangle Supabase RPC: set_announcement_settings.");
    } finally {
      setAnnouncementSaving(false);
    }
  }

  function changeHighscoreMode(mode) { setHighscoreMode(mode); }
  function changeHighscoreLevel(level) { setHighscoreLevel(level); }
  function changeHighscoreQuestionCount(questionCount) { setHighscoreQuestionCount(questionCount); }
  function changeSchoolBattleHighscoreMode(mode) { setHighscoreMode(mode); refreshSchoolBattleScores(mode, highscoreGradeGroup, screen === "adminSchool" ? 20 : SCHOOL_BATTLE_VISIBLE_FETCH_LIMIT); }
  function changeSchoolBattleGradeGroup(gradeGroup) { setHighscoreGradeGroup(gradeGroup); refreshSchoolBattleScores(highscoreMode, gradeGroup, screen === "adminSchool" ? 20 : SCHOOL_BATTLE_VISIBLE_FETCH_LIMIT); }

  function getNextQuestion(mode = gameMode, level = gameLevel, gradeGroup = gameType === "school_battle" ? schoolBattleGradeGroup : null) {
    if (questionDeck.current.length === 0) questionDeck.current = createQuestionDeck(mode, level, gradeGroup);
    return questionDeck.current.pop();
  }

  async function startGame() {
    if (gameType === "school_battle") {
      const schoolBattleOpen = await refreshSchoolBattleEnabledStatus(schoolBattleEnabled, { showLoading: true });
      if (!schoolBattleOpen) {
        setNameError(SCHOOL_BATTLE_CLOSED_MESSAGE);
        setScoreMessage(SCHOOL_BATTLE_CLOSED_MESSAGE);
        return;
      }
      const validationMessage = validatePlayerName(cleanPlayerName);
      if (validationMessage) { setNameError(validationMessage); return; }
      setPlayerName(cleanPlayerName);
    }
    setNameError(""); setScoreMessage(""); setNormalResultMotivationMessage(""); setResultScores([]); savedThisRound.current = false; questionDeck.current = createQuestionDeck(gameMode, gameLevel, gameType === "school_battle" ? schoolBattleGradeGroup : null);
    if (gameType === "normal") {
      setNormalCorrectCount(0);
      setNormalWrongCount(0);
      setNormalCurrentStreak(0);
      setNormalBestStreak(0);
    }
    setScore(0); setTimeLeft(getGameSeconds(gameType)); setElapsedSeconds(0); setQuestionsDone(0); setWrongAnswers(0); setResultTimeSeconds(0); setResultCorrectAnswers(0); setResultWrongAnswers(0); setQuestion(getNextQuestion(gameMode, gameLevel, gameType === "school_battle" ? schoolBattleGradeGroup : null)); setFeedback(null); setScreen("play");
  }

  function recordNormalAnswer(isCorrect) {
    if (gameType !== "normal") return;
    if (isCorrect) {
      const nextStreak = normalCurrentStreak + 1;
      setNormalCorrectCount((current) => current + 1);
      setNormalCurrentStreak(nextStreak);
      setNormalBestStreak((current) => Math.max(current, nextStreak));
      return;
    }
    setNormalWrongCount((current) => current + 1);
    setNormalCurrentStreak(0);
  }

  function quitRound() {
    if (gameType === "normal" && !normalTimed) {
      finishGame();
      return;
    }
    savedThisRound.current = true; setFeedback(null); setScore(0); setTimeLeft(getGameSeconds(gameType)); setElapsedSeconds(0); setQuestionsDone(0); setWrongAnswers(0); setResultScores([]);
    if (gameType === "school_battle") setScreen("schoolMode"); else setScreen("mode");
  }

  function returnToBossSelectFromHiddenFinale() {
    if (bossId === MEGA_REGNEMESTEREN_ID) {
      setBossId("regnemesteren");
      setBossChoiceMade(false);
    }
    setMegaIntroStep(null);
    setScreen("bossSelect");
  }

  function returnToBossModeFromHiddenFinale() {
    if (bossId === MEGA_REGNEMESTEREN_ID) {
      setBossId("regnemesteren");
      setBossChoiceMade(false);
    }
    setMegaIntroStep(null);
    setScreen("bossMode");
  }

  function quitBossBattle() {
    setFeedback(null);
    setDamagePopup(null);
    setBossHit(false);
    setPlayerHit(false);
    if (regnereisenBossPlaceId) {
      setRegnereisenBossPlaceId(null);
      setScreen("regnereisenMap");
      return;
    }
    returnToBossSelectFromHiddenFinale();
  }

  async function finishGame(resultOverride = {}) {
    const finalScore = Number.isFinite(resultOverride.score) ? resultOverride.score : score;
    const finalWrongAnswers = Number.isFinite(resultOverride.wrongAnswers) ? resultOverride.wrongAnswers : wrongAnswers;
    const finalTime = Number.isFinite(resultOverride.timeSeconds) ? resultOverride.timeSeconds : elapsedSeconds + finalWrongAnswers * TIME_PENALTY_SECONDS;
    setScreen("result"); setFeedback(null);
    if (gameType === "school_battle") retryPendingAndNotify("round-finished");
    if (isCurrentTimeChallenge) { setResultTimeSeconds(finalTime); setResultCorrectAnswers(finalScore); setResultWrongAnswers(finalWrongAnswers); }
    if (gameType === "normal") {
      if (!savedThisRound.current) {
        savedThisRound.current = true;
        const normalFinalCorrect = Number.isFinite(resultOverride.normalCorrectCount) ? resultOverride.normalCorrectCount : (isCurrentTimeChallenge ? finalScore : normalCorrectCount);
        const normalFinalWrong = Number.isFinite(resultOverride.normalWrongCount) ? resultOverride.normalWrongCount : (isCurrentTimeChallenge ? finalWrongAnswers : normalWrongCount);
        const normalFinalTotal = normalFinalCorrect + normalFinalWrong;
        const normalFinalAccuracy = normalFinalTotal > 0 ? Math.round((normalFinalCorrect / normalFinalTotal) * 100) : 0;
        setScores([]);
        setResultScores([]);
        setScoreMessage("");
        setNormalResultMotivationMessage(getRandomNormalResultFeedback(normalFinalAccuracy));
      }
      return;
    }
    if (!savedThisRound.current && cleanPlayerName) {
      savedThisRound.current = true;
      const playerResultName = cleanPlayerName;
      if (gameType === "school_battle" && isCurrentTimeChallenge) {
        const entry = { name: playerResultName, score: finalTime, mode: gameMode, school: schoolBattleSchool, grade_level: schoolBattleGradeLevel, grade_group: schoolBattleGradeGroup, question_count: SCHOOL_BATTLE_TIME_QUESTION_COUNT };
        await saveRoundHighscore({
          type: "school_battle_time",
          entry,
          baseMessage: `Du brukte ${formatTime(finalTime)}.`,
          loadScoresForResult: () => loadSchoolBattleScores(gameMode, schoolBattleGradeGroup, SCHOOL_BATTLE_VISIBLE_FETCH_LIMIT),
          loadContext: { ...entry, type: "school_battle_time", game_type: "school_battle" },
          applyHighscoreContext: () => { setHighscoreMode(gameMode); setHighscoreGradeGroup(schoolBattleGradeGroup); },
        });
        return;
      }
      if (gameType === "school_battle") {
        const entry = { name: playerResultName, score: finalScore, mode: gameMode, school: schoolBattleSchool, grade_level: schoolBattleGradeLevel, grade_group: schoolBattleGradeGroup };
        await saveRoundHighscore({
          type: "school_battle_score",
          entry,
          baseMessage: `Du fikk ${finalScore} poeng.`,
          loadScoresForResult: () => loadSchoolBattleScores(gameMode, "small", SCHOOL_BATTLE_VISIBLE_FETCH_LIMIT),
          loadContext: { ...entry, type: "school_battle_score", game_type: "school_battle" },
          applyHighscoreContext: () => { setHighscoreMode(gameMode); },
        });
        return;
      }
    }
  }

  function answer(value) {
    if (feedback) return;
    const isCorrect = value === question.correct;
    recordNormalAnswer(isCorrect);
    if (isCurrentTimeChallenge) {
      const nextCorrectAnswers = isCorrect ? score + 1 : score;
      const nextWrongAnswers = isCorrect ? wrongAnswers : wrongAnswers + 1;
      const finalTime = elapsedSeconds + nextWrongAnswers * TIME_PENALTY_SECONDS;
      setScore(nextCorrectAnswers); setQuestionsDone(nextCorrectAnswers); setWrongAnswers(nextWrongAnswers); setFeedback(isCorrect ? "correct" : "wrong");
      if (nextCorrectAnswers >= activeQuestionCount) { setTimeout(() => finishGame({ score: nextCorrectAnswers, wrongAnswers: nextWrongAnswers, timeSeconds: finalTime }), 180); return; }
      setTimeout(() => { setQuestion(getNextQuestion(gameMode, gameLevel)); setFeedback(null); }, 180); return;
    }
    if (isCorrect) { setScore((current) => current + 1); setFeedback("correct"); } else { setScore((current) => Math.max(0, current - 1)); setFeedback("wrong"); }
    setTimeout(() => { setQuestion(getNextQuestion(gameMode, gameLevel)); setFeedback(null); }, 180);
  }

  function unlockBossLadderEntry(unlockKey) {
    if (!unlockKey) return;
    setBossLadderUnlocks((current) => {
      const safeCurrent = current && typeof current === "object" ? current : {};
      if (safeCurrent[unlockKey]) return safeCurrent;
      const next = { ...safeCurrent, [unlockKey]: true };
      writeBossLadderUnlocks(next);
      return next;
    });
  }

  function requestBossLadderReset() {
    setBossResetMessage("");
    setBossResetConfirmVisible(true);
  }

  function cancelBossLadderReset() {
    setBossResetConfirmVisible(false);
  }

  function confirmBossLadderReset() {
    resetBossLadderUnlocks();
    setBossLadderUnlocks({});
    setBossId("slime");
    setBossChoiceMade(false);
    setBossResetConfirmVisible(false);
    setBossResetMessage("Boss-stigen er nullstilt.");
  }

  function unlockAllRegularBossesLocally() {
    const confirmed = window.confirm("Er du sikker på at du vil låse opp alle vanlige bosser på denne enheten?");
    if (!confirmed) return;

    const allRegularBossUnlocks = BOSS_LADDER.reduce((unlocks, boss) => {
      if (boss.unlockKey) unlocks[boss.unlockKey] = true;
      if (boss.legacyUnlockKey) unlocks[boss.legacyUnlockKey] = true;
      return unlocks;
    }, {});

    writeBossLadderUnlocks(allRegularBossUnlocks);
    setBossLadderUnlocks(allRegularBossUnlocks);
    setAdminMessage("Alle vanlige Boss Battle-bosser er låst opp lokalt på denne enheten.");
  }

  function setupBossBattleRound(boss, mode, level) {
    setGameType("boss_battle"); questionDeck.current = createQuestionDeck(mode, level); setQuestion(getNextQuestion(mode, level, null)); setBossLives(boss.lives); setBossMaxLives(boss.lives); setPlayerHearts(boss.hearts); setPlayerMaxHearts(boss.hearts); setCurrentStreak(0); setBestStreak(0); setBossCorrectAnswers(0); setBossWrongAnswers(0); setBossOutcome(null); setFinalDiplomaName(""); setFinalDiplomaNameError(""); setFinalDiplomaReady(false); setBossMessage(`${boss.name} er klar. Svar riktig for å angripe!`); setDamagePopup(null); setBossHit(false); setPlayerHit(false); setFeedback(null); setMegaIntroStep(null); setScreen("bossPlay");
  }

  function startBossBattle() {
    const ladderBoss = BOSS_LADDER.find((boss) => boss.id === bossId);
    if (ladderBoss && (!ladderBoss.isImplemented || !ladderBoss.playable || !isBossLadderUnlocked(ladderBoss, bossLadderUnlocks))) return;
    const boss = getBossConfig(bossId);
    setRegnereisenBossPlaceId(null);
    setupBossBattleRound(boss, gameMode, gameLevel);
  }

  function startRegnereisenBossBattle(mission) {
    const boss = getBossConfig(mission.bossId);
    const missionMode = mission.mode || MIXED_MODE;
    const missionLevel = mission.level || "easy";
    setRegnereisenBossPlaceId(mission.placeId);
    setBossId(mission.bossId);
    setGameMode(missionMode);
    setGameLevel(missionLevel);
    setupBossBattleRound(boss, missionMode, missionLevel);
  }

  function startMegaRegnemesterenBattle() {
    const boss = getBossConfig(MEGA_REGNEMESTEREN_ID);
    setGameType("boss_battle");
    setBossId(MEGA_REGNEMESTEREN_ID);
    questionDeck.current = createQuestionDeck(gameMode, gameLevel);
    setQuestion(getNextQuestion(gameMode, gameLevel, null));
    setBossLives(boss.lives);
    setBossMaxLives(boss.lives);
    setPlayerHearts(boss.hearts);
    setPlayerMaxHearts(boss.hearts);
    setCurrentStreak(0);
    setBestStreak(0);
    setBossCorrectAnswers(0);
    setBossWrongAnswers(0);
    setBossOutcome(null);
    setFinalDiplomaName("");
    setFinalDiplomaNameError("");
    setFinalDiplomaReady(false);
    setBossMessage(`${boss.name} er klar. Svar riktig for å angripe!`);
    setDamagePopup(null);
    setBossHit(false);
    setPlayerHit(false);
    setFeedback(null);
    setMegaIntroStep(null);
    setScreen("bossPlay");
  }

  function advanceMegaRegnemesterenIntro() {
    if (megaIntroStep === null) return;
    if (megaIntroStep >= MEGA_REGNEMESTEREN_INTRO_LINES.length - 1) {
      startMegaRegnemesterenBattle();
      return;
    }
    setMegaIntroStep((current) => (current === null ? current : current + 1));
  }

  function finishBossVictory(boss, delay = 650) {
    if (regnereisenBossPlaceId) {
      setBossOutcome("won");
      setTimeout(() => {
        setFeedback(null);
        setBossHit(false);
        setDamagePopup(null);
        completeRegnereisenPlace(regnereisenBossPlaceId);
        setRegnereisenBossPlaceId(null);
        setScreen("regnereisen");
      }, delay);
      return;
    }
    if (boss.id === "shadow") unlockBossLadderEntry("isdragen");
    if (boss.id === "isdragen") unlockBossLadderEntry("lavakjempen");
    if (boss.id === "lavakjempen") unlockBossLadderEntry("stormornen");
    if (boss.id === "stormornen") unlockBossLadderEntry("krystallvokteren");
    if (boss.id === "krystallvokteren") unlockBossLadderEntry("mekamaskinen");
    if (boss.id === "mekamaskinen") unlockBossLadderEntry("morkekraken");
    if (boss.id === "morkekraken") unlockBossLadderEntry("regnemesteren");
    if (boss.id === "regnemesteren") {
      setBossOutcome(null);
      setTimeout(() => {
        setFeedback(null);
        setBossHit(false);
        setDamagePopup(null);
        setMegaIntroStep(0);
      }, delay);
      return;
    }
    setBossOutcome("won");
    setTimeout(() => { setFeedback(null); setScreen("bossResult"); }, delay);
  }

  function finishBossLoss(delay = BOSS_ATTACK_HOLD_MS) {
    if (regnereisenBossPlaceId) {
      setBossOutcome("lost");
      setTimeout(() => {
        setFeedback(null);
        setPlayerHit(false);
        setRegnereisenBossPlaceId(null);
        setScreen("regnereisenMap");
      }, delay);
      return;
    }
    setBossOutcome("lost");
    setTimeout(() => { setFeedback(null); setScreen("bossResult"); }, delay);
  }

  function triggerBossTestVictory() {
    if (!import.meta.env.DEV || feedback || megaIntroStep !== null) return;
    const boss = getBossConfig(bossId);
    setBossLives(0);
    setFeedback("correct");
    setBossHit(true);
    setPlayerHit(false);
    setDamagePopup({ text: "TEST", super: true });
    setBossMessage(`DEV-test: ${boss.name} blir beseiret.`);
    setTimeout(() => setBossHit(false), 420);
    setTimeout(() => setDamagePopup(null), 780);
    finishBossVictory(boss);
  }

  function triggerBossTestLoss() {
    if (!import.meta.env.DEV || feedback || megaIntroStep !== null) return;
    const boss = getBossConfig(bossId);
    setPlayerHearts(0);
    setCurrentStreak(0);
    setBossWrongAnswers((current) => current + 1);
    setFeedback("wrong");
    setPlayerHit(true);
    setBossMessage(`DEV-test: ${boss.name} vinner kampen.`);
    setTimeout(() => setPlayerHit(false), BOSS_ATTACK_HOLD_MS);
    finishBossLoss();
  }

  function answerBoss(value) {
    if (feedback) return;
    const boss = getBossConfig(bossId); const isCorrect = value === question.correct;
    if (isCorrect) {
      const streakBeforeReset = currentStreak + 1; const damage = getBossDamage(streakBeforeReset); const nextStreak = streakBeforeReset >= 5 ? 0 : streakBeforeReset; const nextBossLives = Math.max(0, bossLives - damage); const nextCorrect = bossCorrectAnswers + 1; const nextBestStreak = Math.max(bestStreak, streakBeforeReset);
      setBossLives(nextBossLives); setCurrentStreak(nextStreak); setBestStreak(nextBestStreak); setBossCorrectAnswers(nextCorrect); setFeedback("correct"); setBossHit(true); setDamagePopup({ text: damage > 1 ? "-2 SUPER!" : "-1", super: damage > 1 }); setBossMessage(damage > 1 ? `Superangrep! ${boss.name} mistet 2 liv.` : `Riktig! ${boss.name} mistet 1 liv.`); setTimeout(() => setBossHit(false), 420); setTimeout(() => setDamagePopup(null), 780);
      if (nextBossLives <= 0) { finishBossVictory(boss); return; }
      setTimeout(() => { setQuestion(getNextQuestion(gameMode, gameLevel)); setFeedback(null); }, 520); return;
    }
    const nextHearts = Math.max(0, playerHearts - 1); const nextWrong = bossWrongAnswers + 1;
    setPlayerHearts(nextHearts); setCurrentStreak(0); setBossWrongAnswers(nextWrong); setFeedback("wrong"); setPlayerHit(true); setBossMessage(`Feil! ${boss.name} bruker ${getBossAttackName(boss.id)} Du mister 1 hjerte.`); setTimeout(() => setPlayerHit(false), BOSS_ATTACK_HOLD_MS);
    if (nextHearts <= 0) { finishBossLoss(); return; }
    setTimeout(() => { setQuestion(getNextQuestion(gameMode, gameLevel)); setFeedback(null); }, BOSS_ATTACK_HOLD_MS);
  }

  function showFinalDiploma() {
    const validationMessage = validatePlayerName(cleanFinalDiplomaName);
    if (validationMessage) {
      setFinalDiplomaNameError(validationMessage);
      return;
    }
    setFinalDiplomaName(cleanFinalDiplomaName);
    setFinalDiplomaNameError("");
    setFinalDiplomaReady(true);
  }

  async function validateAdminLogin() {
    setAdminMessage(""); const cleanPin = adminLoginPin.trim();
    try {
      let isValid = cleanPin === ADMIN_PIN_FALLBACK;
      if (supabase) { const { data, error } = await supabase.rpc("validate_admin_pin", { admin_pin: cleanPin }); if (error) throw new Error(error.message || "Kunne ikke sjekke adminkoden."); isValid = Boolean(data); }
      if (!isValid) { setAdminMessage("Feil adminkode."); return; }
      setAdminAccessPin(cleanPin); setAdminLoginPin(""); setAdminMessage(""); setScreen("adminHome");
    } catch (error) { setAdminMessage(error.message); }
  }

  async function refreshNormalAdminScores(mode = adminNormalMode, level = adminNormalLevel, gradeLevel = adminNormalGradeLevel, questionCount = adminNormalQuestionCount) {
    try { const loaded = await loadScores(mode, level, gradeLevel, questionCount); setScores(loaded); setAdminMessage(""); } catch (error) { setAdminMessage(error.message); }
  }

  async function refreshAllNormalAdminScores() {
    try {
      const loaded = await loadAllNormalAdminScores();
      setAdminNormalScores(loaded);
      setAdminMessage("");
      return loaded;
    } catch (error) {
      setAdminMessage(error.message);
      return [];
    }
  }

  function changeAdminNormalGradeLevel(gradeLevel) { setAdminNormalGradeLevel(gradeLevel); refreshNormalAdminScores(adminNormalMode, adminNormalLevel, gradeLevel, adminNormalQuestionCount); }
  function changeAdminNormalMode(mode) { setAdminNormalMode(mode); refreshNormalAdminScores(mode, adminNormalLevel, adminNormalGradeLevel, adminNormalQuestionCount); }
  function changeAdminNormalLevel(level) { setAdminNormalLevel(level); refreshNormalAdminScores(adminNormalMode, level, adminNormalGradeLevel, adminNormalQuestionCount); }
  function changeAdminNormalQuestionCount(questionCount) { setAdminNormalQuestionCount(questionCount); refreshNormalAdminScores(adminNormalMode, adminNormalLevel, adminNormalGradeLevel, questionCount); }

  async function deleteNormalScore(scoreId) {
    setAdminMessage("");
    try {
      if (supabase) {
        const { error } = await supabase.rpc("delete_normal_score", { admin_pin: adminAccessPin, score_id: scoreId });
        if (error) throw new Error(error.message || "Kunne ikke slette resultatet.");
      } else {
        const raw = localStorage.getItem(STORAGE_KEY);
        const current = raw ? JSON.parse(raw) : [];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(current.filter((entry) => entry.id !== scoreId)));
      }
      await refreshAllNormalAdminScores();
      setAdminMessage("Resultatet er slettet.");
    } catch (error) {
      setAdminMessage(error.message);
    }
  }

  async function deleteSchoolBattleScore(scoreId) {
    setAdminMessage("");
    try { if (supabase) { const { error } = await supabase.rpc("delete_school_battle_score", { delete_pin: adminAccessPin, score_id: scoreId }); if (error) throw new Error(error.message || "Kunne ikke slette resultatet."); } else { const raw = localStorage.getItem(STORAGE_KEY); const current = raw ? JSON.parse(raw) : []; localStorage.setItem(STORAGE_KEY, JSON.stringify(current.filter((entry) => entry.id !== scoreId))); } await refreshSchoolBattleScores(highscoreMode, highscoreGradeGroup); setAdminMessage("Resultatet er slettet."); } catch (error) { setAdminMessage(error.message); }
  }

  async function resetNormalFromAdmin() {
    setAdminMessage("");
    try {
      await clearNormalScoreList(adminAccessPin, adminNormalMode, adminNormalLevel, adminNormalGradeLevel, adminNormalQuestionCount);
      setScores([]);
      await refreshAllNormalAdminScores();
      setAdminMessage(`Tømte ${getGradeLabel(adminNormalGradeLevel)} - ${getModeLabel(adminNormalMode).toLowerCase()} - ${getLevelLabel(adminNormalLevel).toLowerCase()}${isTimeChallengeMode(adminNormalMode) ? ` - ${adminNormalQuestionCount} oppgaver` : ""}.`);
    } catch (error) {
      setAdminMessage(error.message);
    }
  }

  async function resetNormalAdminGroup(group) {
    setAdminMessage("");
    try {
      await clearNormalScoreList(adminAccessPin, group.mode, group.level, group.gradeLevel, group.questionCount);
      await refreshAllNormalAdminScores();
      setAdminMessage(`Tømte ${getNormalAdminGroupTitle(group)}.`);
    } catch (error) {
      setAdminMessage(error.message);
    }
  }

  function clearNormalAdminFilters() {
    setAdminNormalSearch("");
    setAdminNormalGradeFilter(ALL_FILTER_VALUE);
    setAdminNormalModeFilter(ALL_FILTER_VALUE);
    setAdminNormalLevelFilter(ALL_FILTER_VALUE);
    setAdminNormalQuestionCountFilter(ALL_FILTER_VALUE);
  }

  function completeRegnereisenPlace(placeId = null) {
    const normalized = normalizeRegnereisenProgress(regnereisenProgress);
    const targetPlaceId = placeId || normalized.currentPlaceId;
    const currentIndex = REGNEREISEN_PLACES.findIndex((place) => place.id === targetPlaceId);
    if (currentIndex < 0) return;

    const completedPlaceIds = new Set(normalized.completedPlaceIds);
    const slimKeyPlaceIds = new Set(normalized.slimKeyPlaceIds);
    const completedPlace = REGNEREISEN_PLACES[currentIndex];
    const completedPlaceId = completedPlace.id;
    const keyCountBefore = slimKeyPlaceIds.size;
    const isSlimKeyPlace = REGNEREISEN_SLIM_KEY_PLACE_IDS.includes(completedPlaceId);
    const isSlimmyraBossComplete = completedPlaceId === "slimmyra";
    completedPlaceIds.add(completedPlaceId);
    if (isSlimKeyPlace) slimKeyPlaceIds.add(completedPlaceId);
    if (isSlimmyraBossComplete) {
      REGNEREISEN_SLIM_KEY_PLACE_IDS.forEach((keyPlaceId) => {
        completedPlaceIds.add(keyPlaceId);
        slimKeyPlaceIds.add(keyPlaceId);
      });
    }
    const nextIndex = Math.min(currentIndex + 1, REGNEREISEN_PLACES.length - 1);
    const nextProgress = normalizeRegnereisenProgress({
      currentPlaceId: REGNEREISEN_PLACES[nextIndex].id,
      completedPlaceIds: REGNEREISEN_PLACES.filter((place) => completedPlaceIds.has(place.id)).map((place) => place.id),
      slimKeyPlaceIds: REGNEREISEN_SLIM_KEY_PLACE_IDS.filter((keyPlaceId) => slimKeyPlaceIds.has(keyPlaceId)),
      slimBossDefeated: normalized.slimBossDefeated || isSlimmyraBossComplete,
      slimCrystalCollected: normalized.slimCrystalCollected || isSlimmyraBossComplete,
      slimmyraMapCompleted: normalized.slimmyraMapCompleted || isSlimmyraBossComplete,
    });

    writeRegnereisenProgress(nextProgress);
    setRegnereisenProgress(nextProgress);

    if (isSlimKeyPlace && nextProgress.slimKeyPlaceIds.length > keyCountBefore) {
      setRegnereisenReward({
        type: "key",
        placeName: completedPlace.name,
        fromPlaceId: completedPlaceId,
        toPlaceId: REGNEREISEN_PLACES[nextIndex].id,
        keyCount: nextProgress.slimKeyPlaceIds.length,
        isBossUnlocked: nextProgress.slimKeyPlaceIds.length >= REGNEREISEN_REQUIRED_SLIM_KEYS,
      });
    } else if (isSlimmyraBossComplete) {
      setRegnereisenReward({
        type: "crystal",
        placeName: completedPlace.name,
        keyCount: nextProgress.slimKeyPlaceIds.length,
        isBossUnlocked: true,
      });
    }
  }

  function resetRegnereisenJourney() {
    const defaultProgress = getDefaultRegnereisenProgress();
    resetRegnereisenProgress();
    regnereisenQuestionDeck.current = { placeId: "", questions: [] };
    setRegnereisenReward(null);
    setRegnereisenTravelAnimation(null);
    setRegnereisenResetConfirmVisible(false);
    setRegnereisenProgress(defaultProgress);
  }

  function requestRegnereisenJourneyReset() {
    setRegnereisenResetConfirmVisible(true);
  }

  function cancelRegnereisenJourneyReset() {
    setRegnereisenResetConfirmVisible(false);
  }

  function confirmRegnereisenJourneyReset() {
    resetRegnereisenJourney();
  }

  function closeRegnereisenReward() {
    const reward = regnereisenReward;
    setRegnereisenReward(null);

    if (reward?.type !== "key" || !reward.fromPlaceId || !reward.toPlaceId || reward.fromPlaceId === reward.toPlaceId) return;

    const fromPlace = REGNEREISEN_PLACES.find((place) => place.id === reward.fromPlaceId);
    const toPlace = REGNEREISEN_PLACES.find((place) => place.id === reward.toPlaceId);
    if (!fromPlace || !toPlace) return;

    setScreen("regnereisenMap");
    scrollToGameTop(regnereisenMapPanelRef.current);

    setTimeout(() => {
      setRegnereisenTravelAnimation({
        id: `${reward.fromPlaceId}-${reward.toPlaceId}-${Date.now()}`,
        fromPlaceId: reward.fromPlaceId,
        toPlaceId: reward.toPlaceId,
      });
    }, 80);
  }

  function chooseRegnereisenToken(tokenId) {
    const token = getRegnereisenToken(tokenId);
    if (!token) return;
    writeRegnereisenTokenId(token.id);
    setRegnereisenTokenId(token.id);
    setScreen("regnereisen");
  }

  function getNextRegnereisenMissionQuestion(placeId) {
    const activeDeck = regnereisenQuestionDeck.current;
    if (activeDeck.placeId !== placeId || activeDeck.questions.length === 0) {
      regnereisenQuestionDeck.current = {
        placeId,
        questions: createRegnereisenMissionDeck(placeId),
      };
    }
    return regnereisenQuestionDeck.current.questions.pop() || makeRegnereisenMissionQuestion(placeId);
  }

  function resetRegnereisenMission(placeId) {
    setRegnereisenMissionPlaceId(placeId);
    regnereisenQuestionDeck.current = {
      placeId,
      questions: createRegnereisenMissionDeck(placeId),
    };
    setRegnereisenMissionQuestion(getNextRegnereisenMissionQuestion(placeId));
    setRegnereisenMissionCorrect(0);
    setRegnereisenMissionLives(REGNEREISEN_MISSION_LIVES);
    setRegnereisenMissionFailed(false);
    setRegnereisenMissionFeedback(null);
  }

  function startRegnereisenMission(placeId) {
    const mission = getRegnereisenMission(placeId);
    if (!mission) return;
    if (mission.kind === "boss") {
      const progress = normalizeRegnereisenProgress(regnereisenProgress);
      if (progress.slimKeyPlaceIds.length < REGNEREISEN_REQUIRED_SLIM_KEYS) return;
      setRegnereisenReward(null);
      startRegnereisenBossBattle(mission);
      return;
    }
    setRegnereisenReward(null);
    resetRegnereisenMission(placeId);
    setScreen("regnereisenMission");
  }

  function answerRegnereisenMission(value) {
    if (regnereisenMissionFeedback || regnereisenMissionFailed) return;
    const activeMission = getRegnereisenMission(regnereisenMissionPlaceId) || REGNEREISEN_MISSIONS.sumpporten;
    if (activeMission.kind !== "mission") return;

    const isCorrect = value === regnereisenMissionQuestion.correct;
    if (!isCorrect) {
      const nextLives = Math.max(0, regnereisenMissionLives - 1);
      setRegnereisenMissionLives(nextLives);
      setRegnereisenMissionFeedback("wrong");
      if (nextLives <= 0) {
        setRegnereisenMissionFailed(true);
        return;
      }
      setTimeout(() => {
        setRegnereisenMissionQuestion(getNextRegnereisenMissionQuestion(activeMission.placeId));
        setRegnereisenMissionFeedback(null);
      }, 520);
      return;
    }

    const nextCorrectCount = regnereisenMissionCorrect + 1;
    setRegnereisenMissionCorrect(nextCorrectCount);
    setRegnereisenMissionFeedback("correct");

    if (nextCorrectCount >= REGNEREISEN_MISSION_TARGET) {
      setTimeout(() => {
        completeRegnereisenPlace(activeMission.placeId);
        setRegnereisenMissionFeedback(null);
        setScreen("regnereisenMap");
      }, 650);
      return;
    }

    setTimeout(() => {
      setRegnereisenMissionQuestion(getNextRegnereisenMissionQuestion(activeMission.placeId));
      setRegnereisenMissionFeedback(null);
    }, 420);
  }

  if (screen === "home") {
    return (
      <Shell isHome>
        <div className="home-screen">
          <div className="home-arena-bg" aria-hidden="true">
            <span className="home-bg-symbol home-bg-symbol-plus">+</span>
            <span className="home-bg-symbol home-bg-symbol-minus">−</span>
            <span className="home-bg-symbol home-bg-symbol-times">×</span>
            <span className="home-bg-symbol home-bg-symbol-divide">÷</span>
            <span className="home-bg-star home-bg-star-one">★</span>
            <span className="home-bg-star home-bg-star-two">★</span>
            <span className="home-bg-star home-bg-star-three">✦</span>
            <span className="home-bg-star home-bg-star-four">✦</span>
            <span className="home-bg-orb home-bg-orb-blue" />
            <span className="home-bg-orb home-bg-orb-green" />
            <span className="home-bg-orb home-bg-orb-purple" />
            <span className="home-bg-orb home-bg-orb-gold" />
          </div>
          <div className="hero home-hero">
            <img className="home-logo" src="/branding/regnemester-logo-active.png?v=20260608-active2" alt="Regnemester-logo" />
            <p>Øv på matte, samle poeng og bli en ekte regnemester!</p>
          </div>
          <div className="home-mission-header">
            <span>Velg oppdrag</span>
            <p>Tren, konkurrer, reis eller gå i kamp mot en boss.</p>
          </div>
          <div className="home-mode-grid">
            <button type="button" className="home-mode-card home-mode-normal" onClick={() => { setSchoolBattleStatusMessage(""); setGameType("normal"); setNormalTimed(true); setGameLevelChoiceMade(false); setGameQuestionCountChoiceMade(false); setScreen("mode"); }}>
              <span className="home-mode-icon"><Zap /></span>
              <span className="home-mode-copy"><span className="home-mode-kicker">Treningsarena</span><strong>Normal</strong><span className="home-mode-description">Tren og slå rekorden.</span></span>
            </button>
            <button type="button" className={`home-mode-card home-mode-school${!schoolBattleEnabled ? " home-mode-disabled" : ""}`} aria-disabled={!schoolBattleEnabled} onClick={openSchoolBattleFromHome}>
              {!schoolBattleEnabled && <span className="home-mode-status">Stengt</span>}
              <span className="home-mode-icon"><Trophy /></span>
              <span className="home-mode-copy"><span className="home-mode-kicker">Turnering</span><strong>Skolekampen</strong><span className="home-mode-description">Kjemp for skolen.</span></span>
            </button>
            <button type="button" className="home-mode-card home-mode-boss" onClick={() => { setSchoolBattleStatusMessage(""); setGameType("boss_battle"); setGameLevel("easy"); setBossChoiceMade(false); setBossLevelChoiceMade(false); setScreen("bossMode"); }}>
              <span className="home-mode-icon"><Star /></span>
              <span className="home-mode-copy"><span className="home-mode-kicker">Boss-arena</span><strong>Boss Battle</strong><span className="home-mode-description">Slå bossen med matte.</span></span>
            </button>
            <button
              type="button"
              className={`home-mode-card home-mode-journey${!regnereisenAccessGranted ? " home-mode-disabled" : ""}`}
              aria-disabled={!regnereisenAccessGranted}
              onClick={openRegnereisenFromHome}
            >
              {!regnereisenAccessGranted && <span className="home-mode-status">Kommer snart</span>}
              <span className="home-mode-icon"><Crown /></span>
              <span className="home-mode-copy"><span className="home-mode-kicker">Kartreise</span><strong>Regnereisen</strong><span className="home-mode-description">{regnereisenAccessGranted ? "Samle nøkler og slå bosser." : "Kommer snart."}</span></span>
            </button>
          </div>
          {schoolBattleStatusMessage && <p className="error-box school-battle-closed-message">{schoolBattleStatusMessage}</p>}
          <div className="home-tools">
            <Button variant="secondary" onClick={openHighscoreFromHome} className="full">Highscore</Button>
            <Button variant="light" onClick={() => setScreen("qr")} className="full">Vis QR-kode</Button>
            <Button variant="light" onClick={() => setScreen("adminLogin")} className="full">Admin</Button>
          </div>
        </div>
        {regnereisenAccessDialogOpen && !regnereisenAccessGranted && (
          <RegnereisenAccessPopup
            code={regnereisenAccessInput}
            message={regnereisenAccessMessage}
            onCodeChange={setRegnereisenAccessInput}
            onSubmit={submitRegnereisenAccessCode}
            onClose={closeRegnereisenAccessDialog}
          />
        )}
        {shouldShowAnnouncementPopup && (
          <AnnouncementPopup
            title={activeAnnouncement.title}
            message={activeAnnouncement.message}
            onClose={closeAnnouncementPopup}
          />
        )}
      </Shell>
    );
  }

  if (screen === "regnereisenTokenSelect") {
    return (
      <Shell frameClassName="regnereisen-frame">
        <div className="regnereisen-page regnereisen-token-page">
          <div className="hero compact regnereisen-hero">
            <div className="icon-box icon-yellow"><Crown /></div>
            <h1>Velg spillbrikke</h1>
            <p>Velg en brikke som viser hvor du er på Regnereisen-kartet.</p>
          </div>

          <div className="journey-token-grid" aria-label="Velg spillbrikke">
            {REGNEREISEN_TOKENS.map((token) => {
              const isSelected = token.id === regnereisenTokenId;
              return (
                <button
                  key={token.id}
                  type="button"
                  className={`journey-token-choice ${isSelected ? "selected" : ""}`}
                  onClick={() => chooseRegnereisenToken(token.id)}
                >
                  <RegnereisenTokenBadge token={token} className="choice-token" />
                </button>
              );
            })}
          </div>

          <Button variant="light" onClick={() => setScreen(selectedRegnereisenToken ? "regnereisen" : "home")} className="full top-space">Tilbake</Button>
        </div>
      </Shell>
    );
  }

  if (screen === "regnereisen") {
    const progress = normalizeRegnereisenProgress(regnereisenProgress);
    const slimKeyCount = progress.slimKeyPlaceIds.length;
    const activeToken = selectedRegnereisenToken || REGNEREISEN_TOKENS[0];

    return (
      <Shell frameClassName="regnereisen-frame">
        <div className="regnereisen-page regnereisen-world-page">
          <div className="hero compact regnereisen-hero">
            <div className="icon-box icon-yellow"><Crown /></div>
            <h1>Regnereisen</h1>
            <p>Velg et kart, samle nøkler og slå bossen for å komme videre.</p>
          </div>

          <div className="journey-token-summary">
            <RegnereisenTokenBadge token={activeToken} className="summary-token" />
            <span>
              <small>Din brikke</small>
            </span>
            <Button variant="light" onClick={() => setScreen("regnereisenTokenSelect")}>Endre spillbrikke</Button>
          </div>

          <div className="journey-world-grid" aria-label="Kart i Regnereisen">
            {REGNEREISEN_WORLD_CARDS.map((world) => {
              const isSlimmyra = world.id === "slimmyra";
              const requiresSlimCrystal = Boolean(world.requiresSlimCrystal);
              const crystalRequirementMet = requiresSlimCrystal && progress.slimCrystalCollected;
              const isComplete = isSlimmyra && progress.slimmyraMapCompleted;
              const isPlayable = Boolean(world.isOpen);
              const worldClassName = `journey-world-card ${isPlayable ? "open" : "locked"} ${isComplete ? "completed" : ""} ${crystalRequirementMet ? "requirement-met" : ""}`.trim();

              return (
                <button
                  key={world.id}
                  type="button"
                  className={worldClassName}
                  disabled={!isPlayable}
                  onClick={() => {
                    if (isPlayable) setScreen("regnereisenMap");
                  }}
                >
                  <span className="journey-world-status">{isPlayable ? "Åpent" : crystalRequirementMet ? "Neste kart" : "Låst"}</span>
                  <span className="journey-world-kicker">{world.subtitle}</span>
                  <strong>{world.name}</strong>
                  <span className="journey-world-boss">Boss: {world.boss}</span>
                  {isSlimmyra ? (
                    <span className="journey-world-meta">
                      <span className="journey-key-row">Slimnøkler {slimKeyCount}/{REGNEREISEN_REQUIRED_SLIM_KEYS}</span>
                      <SlimKeySlots count={slimKeyCount} className="compact" />
                      <span>{progress.slimBossDefeated ? "Slimbossen er slått" : "Slimbossen venter"}</span>
                      <SlimCrystalStatus collected={progress.slimCrystalCollected} compact />
                    </span>
                  ) : requiresSlimCrystal ? (
                    <span className="journey-world-meta">
                      <SlimCrystalStatus collected={progress.slimCrystalCollected} compact />
                      <span>{progress.slimCrystalCollected ? "Slimkrystallen er samlet" : "Krever Slimkrystallen"}</span>
                      {progress.slimCrystalCollected && <span>Neste kart kommer snart</span>}
                    </span>
                  ) : (
                    <span className="journey-world-meta">
                      <span>Kommer senere</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <Button variant="light" onClick={() => setScreen("home")} className="full top-space">Tilbake</Button>
          <Button variant="light" onClick={requestRegnereisenJourneyReset} className="full top-space journey-reset-button">Nullstill reisen</Button>
          {regnereisenResetConfirmVisible && (
            <div className="journey-reset-confirm" role="dialog" aria-live="polite" aria-label="Bekreft nullstilling av Regnereisen">
              <strong>Nullstill Regnereisen?</strong>
              <p>Dette sletter progresjonen din i Regnereisen på denne enheten. Er du sikker?</p>
              <div className="journey-reset-actions">
                <button type="button" className="button button-light" onClick={cancelRegnereisenJourneyReset}>Avbryt</button>
                <button type="button" className="button journey-reset-confirm-button" onClick={confirmRegnereisenJourneyReset}>Nullstill reisen</button>
              </div>
            </div>
          )}
          <RegnereisenRewardPopup reward={regnereisenReward} onClose={closeRegnereisenReward} />
        </div>
      </Shell>
    );
  }

  if (screen === "regnereisenMap") {
    const progress = normalizeRegnereisenProgress(regnereisenProgress);
    const completedPlaceIds = new Set(progress.completedPlaceIds);
    const slimKeyCount = progress.slimKeyPlaceIds.length;
    const isSlimBossUnlocked = slimKeyCount >= REGNEREISEN_REQUIRED_SLIM_KEYS;
    const currentPlace = REGNEREISEN_PLACES.find((place) => place.id === progress.currentPlaceId) || REGNEREISEN_PLACES[0];
    const allPlacesCompleted = progress.slimmyraMapCompleted || REGNEREISEN_PLACES.every((place) => completedPlaceIds.has(place.id));
    const currentMission = getRegnereisenMission(currentPlace.id);
    const currentBossLocked = currentMission?.kind === "boss" && !isSlimBossUnlocked;
    const canStartCurrentMission = Boolean(currentMission && !completedPlaceIds.has(currentPlace.id) && !currentBossLocked);
    const activeToken = selectedRegnereisenToken || REGNEREISEN_TOKENS[0];
    const travelFromPlace = regnereisenTravelAnimation
      ? REGNEREISEN_PLACES.find((place) => place.id === regnereisenTravelAnimation.fromPlaceId)
      : null;
    const travelToPlace = regnereisenTravelAnimation
      ? REGNEREISEN_PLACES.find((place) => place.id === regnereisenTravelAnimation.toPlaceId)
      : null;
    const showTravelToken = Boolean(travelFromPlace && travelToPlace);

    return (
      <Shell frameClassName="regnereisen-frame">
        <div className="regnereisen-page">
          <div className="hero compact regnereisen-hero">
            <div className="icon-box icon-yellow"><Crown /></div>
            <h1>Regnereisen</h1>
            <p>Reis fra sted til sted og løs oppdrag for å åpne veien videre.</p>
          </div>

          <div className="card journey-summary-card">
            <span className="journey-kicker">Nåværende sted</span>
            <h2>{allPlacesCompleted ? "Første kart er fullført!" : currentPlace.name}</h2>
            <p>{allPlacesCompleted ? "Du har åpnet veien gjennom Slimmyra." : currentPlace.subtitle}</p>
            <div className="journey-progress-meter" aria-label={`${completedPlaceIds.size} av ${REGNEREISEN_PLACES.length} steder fullført`}>
              <span style={{ width: `${(completedPlaceIds.size / REGNEREISEN_PLACES.length) * 100}%` }} />
            </div>
            <small>{completedPlaceIds.size} av {REGNEREISEN_PLACES.length} steder fullført</small>
            <div className="journey-key-summary">
              <span>Slimnøkler: {slimKeyCount}/{REGNEREISEN_REQUIRED_SLIM_KEYS}</span>
              <SlimCrystalStatus collected={progress.slimCrystalCollected} compact />
            </div>
          </div>

          <div className={`journey-key-hud ${isSlimBossUnlocked ? "unlocked" : ""}`}>
            <span className="journey-key-hud-icon"><KeyRound aria-hidden="true" /></span>
            <span className="journey-key-hud-copy">
              <strong>Slimnøkler: {slimKeyCount}/{REGNEREISEN_REQUIRED_SLIM_KEYS}</strong>
              <span>{isSlimBossUnlocked ? "Boss-stedet er åpent" : "Samle alle for å åpne Slimbossen"}</span>
            </span>
            <SlimKeySlots count={slimKeyCount} />
            <SlimCrystalStatus collected={progress.slimCrystalCollected} />
          </div>

          <div className="journey-map-card" ref={regnereisenMapPanelRef} data-regnereisen-map-panel>
            <div className={`journey-map-board ${showTravelToken ? "traveling" : ""}`.trim()} aria-label="Kart over Regnereisen">
              <svg className="journey-map-path" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <path className="journey-map-path-shadow" d="M16 84 C34 82 58 82 76 68 C89 57 44 58 26 50 C8 42 52 38 72 32 C92 26 52 18 36 12" />
                <path className="journey-map-path-road" d="M16 84 C34 82 58 82 76 68 C89 57 44 58 26 50 C8 42 52 38 72 32 C92 26 52 18 36 12" />
              </svg>
              {showTravelToken && (
                <span
                  className="journey-travel-token"
                  aria-hidden="true"
                  style={{
                    "--journey-travel-duration": `${REGNEREISEN_TRAVEL_ANIMATION_MS}ms`,
                    "--journey-travel-from-x": `${travelFromPlace.x}%`,
                    "--journey-travel-from-y": `${travelFromPlace.y}%`,
                    "--journey-travel-quarter-x": `${travelFromPlace.x + ((travelToPlace.x - travelFromPlace.x) * 0.25)}%`,
                    "--journey-travel-quarter-y": `${Math.max(8, travelFromPlace.y + ((travelToPlace.y - travelFromPlace.y) * 0.25) - 2)}%`,
                    "--journey-travel-mid-x": `${(travelFromPlace.x + travelToPlace.x) / 2}%`,
                    "--journey-travel-mid-y": `${Math.max(8, ((travelFromPlace.y + travelToPlace.y) / 2) - 4)}%`,
                    "--journey-travel-three-quarter-x": `${travelFromPlace.x + ((travelToPlace.x - travelFromPlace.x) * 0.75)}%`,
                    "--journey-travel-three-quarter-y": `${Math.max(8, travelFromPlace.y + ((travelToPlace.y - travelFromPlace.y) * 0.75) - 2)}%`,
                    "--journey-travel-to-x": `${travelToPlace.x}%`,
                    "--journey-travel-to-y": `${travelToPlace.y}%`,
                  }}
                >
                  <RegnereisenTokenBadge token={activeToken} className="travel-token" />
                </span>
              )}
              {REGNEREISEN_PLACES.map((place, index) => {
                const isCompleted = completedPlaceIds.has(place.id);
                const isActive = place.id === progress.currentPlaceId;
                const showActiveMarker = isActive && !showTravelToken;
                const isBossPlace = place.id === "slimmyra";
                const isPathUnlocked = index === 0 || completedPlaceIds.has(REGNEREISEN_PLACES[index - 1].id);
                const isBossUnlocked = !isBossPlace || isSlimBossUnlocked || isCompleted;
                const isUnlocked = isPathUnlocked && isBossUnlocked;
                const statusText = isCompleted ? (isBossPlace ? "Slimkrystall" : "+1 nøkkel") : isBossPlace && !isBossUnlocked ? "Samle nøkler" : isUnlocked ? "Åpent" : "Låst";
                const placeClassName = `journey-place ${isCompleted ? "completed" : ""} ${showActiveMarker ? "active" : ""} ${!isUnlocked ? "locked" : ""} ${isBossPlace && !isBossUnlocked ? "boss-locked" : ""} ${isBossPlace && isBossUnlocked && !isCompleted ? "boss-open" : ""}`.trim();
                const canStartPlace = Boolean(!showTravelToken && isActive && isUnlocked && currentMission && !isCompleted && !currentBossLocked);

                return (
                  <button
                    key={place.id}
                    type="button"
                    className={placeClassName}
                    disabled={!canStartPlace}
                    onClick={() => {
                      if (canStartPlace) startRegnereisenMission(place.id);
                    }}
                    aria-label={canStartPlace ? `Start ${place.name}` : `${index + 1}. ${place.name}. ${statusText}`}
                    style={{
                      left: `${place.x}%`,
                      top: `${place.y}%`,
                    }}
                    aria-current={isActive ? "step" : undefined}
                  >
                    <span className="journey-place-node">
                      {showActiveMarker ? (
                        <RegnereisenTokenBadge token={activeToken} className="node-token" />
                      ) : (
                        <>
                          <span className="journey-node-number">{index + 1}</span>
                          {!isUnlocked && <span className="journey-node-lock">Lås</span>}
                        </>
                      )}
                    </span>
                    {showActiveMarker && (
                      <span className="journey-player-marker">Du er her</span>
                    )}
                    <span className="journey-place-card">
                      <span className="journey-place-copy">
                        <strong>{place.name}</strong>
                        {isActive && <small>{place.subtitle}</small>}
                      </span>
                      {(isCompleted || (isActive && currentBossLocked)) && <span className="journey-place-status">{statusText}</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="card journey-actions-card">
            {currentBossLocked && (
              <div className="journey-lock-note">
                <Lock aria-hidden="true" />
                <span>Samle 4 slimnøkler for å åpne boss-stedet.</span>
                <SlimKeySlots count={slimKeyCount} className="compact" />
              </div>
            )}
            {canStartCurrentMission && (
              <Button onClick={() => startRegnereisenMission(currentPlace.id)} className="full">
                {currentMission?.kind === "boss" ? "Start Slimbossen" : `Start ${currentPlace.name}-oppdrag`}
              </Button>
            )}
            {isLocalDevEnvironment && canStartCurrentMission && currentMission?.kind === "mission" && (
              <Button variant="secondary" onClick={() => completeRegnereisenPlace(currentPlace.id)} className="full top-space journey-dev-button">
                DEV-test: Fullfør sted
              </Button>
            )}
          </div>

          <Button variant="light" onClick={() => setScreen("regnereisen")} className="full top-space">Tilbake</Button>
          <Button variant="light" onClick={requestRegnereisenJourneyReset} className="full top-space journey-reset-button">Nullstill reisen</Button>
          {regnereisenResetConfirmVisible && (
            <div className="journey-reset-confirm" role="dialog" aria-live="polite" aria-label="Bekreft nullstilling av Regnereisen">
              <strong>Nullstill Regnereisen?</strong>
              <p>Dette sletter progresjonen din i Regnereisen på denne enheten. Er du sikker?</p>
              <div className="journey-reset-actions">
                <button type="button" className="button button-light" onClick={cancelRegnereisenJourneyReset}>Avbryt</button>
                <button type="button" className="button journey-reset-confirm-button" onClick={confirmRegnereisenJourneyReset}>Nullstill reisen</button>
              </div>
            </div>
          )}

          <RegnereisenRewardPopup reward={regnereisenReward} onClose={closeRegnereisenReward} />
        </div>
      </Shell>
    );
  }

  if (screen === "regnereisenMission") {
    const activeMission = getRegnereisenMission(regnereisenMissionPlaceId) || REGNEREISEN_MISSIONS.sumpporten;
    const missionProgress = Math.min(regnereisenMissionCorrect, REGNEREISEN_MISSION_TARGET);
    const missionPercent = (missionProgress / REGNEREISEN_MISSION_TARGET) * 100;

    return (
      <Shell frameClassName="regnereisen-frame">
        <div
          ref={gameAreaRef}
          className={`regnereisen-page regnereisen-mission-page regnereisen-mission-${activeMission.placeId} ${regnereisenMissionFeedback === "wrong" ? "journey-wrong-feedback" : ""}`}
        >
          <div className="hero compact regnereisen-hero">
            <div className="icon-box icon-yellow"><Crown /></div>
            <h1>{activeMission.title}</h1>
            <p>{activeMission.intro}</p>
          </div>

          <div className="card journey-mission-card">
            <span className="journey-kicker">Oppdrag</span>
            <h2>{missionProgress} av {REGNEREISEN_MISSION_TARGET} riktige</h2>
            <div className="journey-life-row" aria-label={`${regnereisenMissionLives} av ${REGNEREISEN_MISSION_LIVES} liv igjen`}>
              <span className="journey-life-text">Liv {regnereisenMissionLives}/{REGNEREISEN_MISSION_LIVES}</span>
              {Array.from({ length: REGNEREISEN_MISSION_LIVES }).map((_, index) => (
                <span key={index} className={`journey-life-dot ${index < regnereisenMissionLives ? "" : "lost"}`} aria-hidden="true" />
              ))}
            </div>
            <div className="journey-progress-meter" aria-label={`${missionProgress} av ${REGNEREISEN_MISSION_TARGET} riktige`}>
              <span style={{ width: `${missionPercent}%` }} />
            </div>
            <small>{activeMission.note}</small>
          </div>

          <div className="card question-card journey-question-card">
            <h2>{regnereisenMissionQuestion.a} {regnereisenMissionQuestion.symbol} {regnereisenMissionQuestion.b}</h2>
          </div>

          <div className="answer-grid journey-answer-grid">
            {regnereisenMissionQuestion.options.map((option) => (
              <button
                key={option}
                type="button"
                disabled={!!regnereisenMissionFeedback || regnereisenMissionFailed}
                onClick={() => answerRegnereisenMission(option)}
                className={`answer-button ${regnereisenMissionFeedback && option === regnereisenMissionQuestion.correct ? "correct" : ""}`}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="feedback-area journey-feedback-area" aria-live="polite">
            {regnereisenMissionFailed && (
              <div className="journey-failed-card">
                <p className="feedback wrong-text"><span className="journey-life-loss-pop">-1 liv</span> Du mistet alle livene. Start stedet på nytt.</p>
                <Button variant="secondary" onClick={() => resetRegnereisenMission(activeMission.placeId)} className="full">Start stedet på nytt</Button>
              </div>
            )}
            {!regnereisenMissionFailed && regnereisenMissionFeedback === "correct" && (
              <p className="feedback correct-text">
                Riktig! {missionProgress >= REGNEREISEN_MISSION_TARGET ? activeMission.completeText : "Fortsett videre."}
              </p>
            )}
            {!regnereisenMissionFailed && regnereisenMissionFeedback === "wrong" && <p className="feedback wrong-text"><span className="journey-life-loss-pop">-1 liv</span> Ikke helt. Prøv neste oppgave.</p>}
          </div>

          <Button variant="light" onClick={() => setScreen("regnereisenMap")} className="full top-space">Tilbake til kart</Button>
        </div>
      </Shell>
    );
  }

  if (screen === "highscoreHome") {
    return <Shell><div className="hero"><div className="icon-box icon-yellow"><Crown /></div><h1>Highscore</h1></div><div className="card input-card"><Button variant="secondary" onClick={openSchoolHighscoreFromHome} className="full">Skolekampen</Button></div><Button variant="light" onClick={() => setScreen("home")} className="full top-space">Tilbake</Button></Shell>;
  }

  if (screen === "highscoreGrade") {
    return <Shell><div className="hero"><div className="icon-box icon-yellow"><Crown /></div><h1>Highscore</h1></div><div className="card input-card"><Button variant="secondary" onClick={openSchoolHighscoreFromHome} className="full">Skolekampen</Button></div><Button variant="light" onClick={() => setScreen("highscoreHome")} className="full top-space">Tilbake</Button></Shell>;
  }

  if (screen === "bossMode") {
    return <Shell theme="boss" isSetup modeBg="boss"><div className="hero"><div className="icon-box icon-blue"><Star /></div><h1>Boss Battle</h1><p>Velg regneart.</p></div><div className="card input-card"><ModeButtons selectedMode={null} includeMixed onSelect={(mode) => { setGameMode(mode); setGameLevel("easy"); setBossChoiceMade(false); setBossLevelChoiceMade(true); setScreen("bossSelect"); }} /></div><Button variant="light" onClick={() => setScreen("home")} className="full top-space">Tilbake</Button></Shell>;
  }

  if (screen === "bossSelect") {
    const selectedLadderBoss = BOSS_LADDER.find((boss) => boss.id === bossId);
    const canStartSelectedBoss = Boolean(bossChoiceMade && selectedLadderBoss && selectedLadderBoss.playable && isBossLadderUnlocked(selectedLadderBoss, bossLadderUnlocks));
    return (
      <Shell theme="boss" isSetup modeBg="boss">
        <div className="hero">
          <div className="icon-box icon-blue"><Star /></div>
          <h1>Velg boss</h1>
          <p>{getModeLabel(gameMode)}</p>
          <p className="small-note">Velg boss og vanskelighetsgrad på oppgavene.</p>
        </div>
        <div className="card input-card boss-difficulty-card">
          <label>Velg vanskelighetsgrad</label>
          <div className="boss-difficulty-segments" role="group" aria-label="Velg vanskelighetsgrad">
            <button type="button" className={`boss-difficulty-segment ${bossLevelChoiceMade && gameLevel === "easy" ? "selected" : ""}`} aria-pressed={bossLevelChoiceMade && gameLevel === "easy"} onClick={() => { setGameLevel("easy"); setBossLevelChoiceMade(true); }}>Lett</button>
            <button type="button" className={`boss-difficulty-segment ${bossLevelChoiceMade && gameLevel === "medium" ? "selected" : ""}`} aria-pressed={bossLevelChoiceMade && gameLevel === "medium"} onClick={() => { setGameLevel("medium"); setBossLevelChoiceMade(true); }}>Middels</button>
            <button type="button" className={`boss-difficulty-segment ${bossLevelChoiceMade && gameLevel === "hard" ? "selected" : ""}`} aria-pressed={bossLevelChoiceMade && gameLevel === "hard"} onClick={() => { setGameLevel("hard"); setBossLevelChoiceMade(true); }}>Vanskelig</button>
          </div>
        </div>
        <div className="card input-card boss-ladder-panel">
          <div className="boss-ladder-list">
            {BOSS_LADDER.filter((boss) => boss.isImplemented).map((boss) => {
              const isUnlocked = isBossLadderUnlocked(boss, bossLadderUnlocks);
              const canStartBoss = isUnlocked && boss.playable;
              const isUpcoming = isUnlocked && !boss.playable;
              const isSelected = bossChoiceMade && bossId === boss.id && canStartBoss;
              const statusText = canStartBoss ? "Åpen" : isUpcoming ? "Kommer snart" : "Låst";
              const detailText = canStartBoss ? "Klar til kamp" : isUpcoming ? boss.unlockedText : boss.lockedText;
              const bossConfig = getBossConfig(boss.id);
              return (
                <button
                  key={boss.id}
                  type="button"
                  disabled={!canStartBoss}
                  aria-pressed={isSelected}
                  className={`boss-ladder-card boss-choice-card boss-choice-${boss.id} ${isSelected ? "selected" : ""} ${!isUnlocked ? "locked" : ""} ${isUpcoming ? "upcoming" : ""}`}
                  style={{ "--boss-card-accent": bossConfig.accent, "--boss-card-gradient": bossConfig.gradient }}
                  onClick={() => { setBossId(boss.id); setBossChoiceMade(true); }}
                >
                  <span className="boss-card-media" aria-hidden="true">
                    <span className="boss-ladder-index">{boss.order}</span>
                    <img className={`boss-card-image boss-card-image-${boss.id}`} src={getBossCardImageSrc(boss.id)} alt="" draggable="false" />
                    <span className={`boss-ladder-status ${!isUnlocked ? "locked" : ""} ${isUpcoming ? "upcoming" : ""}`}>{statusText}</span>
                  </span>
                  <span className="boss-ladder-copy boss-card-copy">
                    <strong>{boss.name}</strong>
                    <span>{boss.lives} liv</span>
                    <small>{detailText}</small>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="card input-card">
          <Button onClick={startBossBattle} disabled={!canStartSelectedBoss} className="full">Start bosskamp</Button>
          <p className="small-note">Hvert 5. riktige svar på rad gir superangrep og 2 skade.</p>
        </div>
        <Button variant="light" onClick={() => setScreen("bossMode")} className="full top-space">Tilbake</Button>
        <Button variant="light" onClick={requestBossLadderReset} className="full top-space boss-reset-button">Nullstill Boss battle</Button>
        {bossResetConfirmVisible && (
          <div className="boss-reset-confirm" role="dialog" aria-live="polite" aria-label="Bekreft nullstilling av boss-stige">
            <strong>Vil du nullstille boss-stigen på denne enheten?</strong>
            <p>Da låses bossene igjen, og du må starte på nytt fra begynnelsen.</p>
            <div className="boss-reset-actions">
              <button type="button" className="button button-light" onClick={cancelBossLadderReset}>Avbryt</button>
              <button type="button" className="button boss-reset-confirm-button" onClick={confirmBossLadderReset}>Ja, nullstill</button>
            </div>
          </div>
        )}
        {bossResetMessage && <p className="boss-reset-message">{bossResetMessage}</p>}
      </Shell>
    );
  }

  if (screen === "bossPlay") {
    const boss = getBossConfig(bossId);
    const hpPercent = bossMaxLives > 0 ? Math.max(0, Math.min(100, (bossLives / bossMaxLives) * 100)) : 0;
    const visualPhase = getBossMood(hpPercent);
    const isSuperReady = currentStreak === 4;
    const isSuperImpact = Boolean(damagePopup?.super);
    const bossAction = bossHit ? "hit" : playerHit ? "attack" : "idle";
    const isSlimeBoss = boss.id === "slime";
    const isTrollBoss = boss.id === "troll";
    const isShadowBoss = boss.id === "shadow";
    const isIsdragenBoss = boss.id === "isdragen";
    const isLavakjempenBoss = boss.id === "lavakjempen";
    const isStormornenBoss = boss.id === "stormornen";
    const isKrystallvokterenBoss = boss.id === "krystallvokteren";
    const isMekamaskinenBoss = boss.id === "mekamaskinen";
    const isMorkekrakenBoss = boss.id === "morkekraken";
    const isRegnemesterenBoss = boss.id === "regnemesteren";
    const isMegaRegnemesterenBoss = boss.id === MEGA_REGNEMESTEREN_ID;
    const usesCleanPanelBackground = isSlimeBoss || isTrollBoss || isShadowBoss || isIsdragenBoss || isLavakjempenBoss || isStormornenBoss || isKrystallvokterenBoss || isMekamaskinenBoss || isMorkekrakenBoss || isRegnemesterenBoss || isMegaRegnemesterenBoss;
    const bossFrameClassName = isMegaRegnemesterenBoss ? "boss-mega-regnemesteren-page-frame" : isRegnemesterenBoss ? "boss-regnemesteren-page-frame" : isMorkekrakenBoss ? "boss-morkekraken-page-frame" : isMekamaskinenBoss ? "boss-mekamaskinen-page-frame" : isKrystallvokterenBoss ? "boss-krystallvokteren-page-frame" : isStormornenBoss ? "boss-stormornen-page-frame" : isLavakjempenBoss ? "boss-lavakjempen-page-frame" : isIsdragenBoss ? "boss-isdragen-page-frame" : isShadowBoss ? "boss-shadow-page-frame" : isSlimeBoss ? "boss-slime-page-frame" : "";
    const bossShellClassName = isSlimeBoss ? "app-shell-slime-boss" : isTrollBoss ? "app-shell-troll-boss" : isShadowBoss ? "app-shell-shadow-boss" : isIsdragenBoss ? "app-shell-isdragen-boss" : isLavakjempenBoss ? "app-shell-lavakjempen-boss" : isStormornenBoss ? "app-shell-stormornen-boss" : isKrystallvokterenBoss ? "app-shell-krystallvokteren-boss" : isMekamaskinenBoss ? "app-shell-mekamaskinen-boss" : isMorkekrakenBoss ? "app-shell-morkekraken-boss" : isRegnemesterenBoss ? "app-shell-regnemesteren-boss" : isMegaRegnemesterenBoss ? "app-shell-mega-regnemesteren-boss" : "";
    return (
      <Shell theme="boss" frameClassName={bossFrameClassName} shellClassName={bossShellClassName} frameStyle={getBossPageStyle(boss.id)}>
        <div ref={gameAreaRef} className={`boss-play-layout boss-play-${boss.id} ${playerHit ? "player-under-attack" : ""} ${isSuperImpact ? "super-impact" : ""}`}>
          <div
            className={`boss-arena boss-theme-${boss.id} boss-phase-${visualPhase} ${usesCleanPanelBackground ? "boss-arena-asset-bg" : ""} ${isSuperReady ? "super-ready" : ""} ${isSuperImpact ? "super-impact" : ""} ${playerHit ? "boss-attacking" : ""}`}
            style={getBossArenaStyle(boss)}
          >
            {!usesCleanPanelBackground && <BossArenaScenery bossId={boss.id} />}
            {!usesCleanPanelBackground && <div className={`arena-atmosphere atmosphere-${boss.id}`} aria-hidden="true"><span /><span /><span /></div>}
            <div className={`boss-intro-banner intro-${boss.id}`} aria-hidden="true"><span>KAMP STARTER!</span><strong>{boss.name}</strong><em>{getBossIntroText(boss.id)}</em></div>
            {playerHit && <div className={`boss-retaliation boss-retaliation-${boss.id}`} aria-hidden="true" />}
            <div className="boss-arena-inner">
              <div className="boss-topline"><div>{!usesCleanPanelBackground && <div className="boss-arena-name">{boss.arena}</div>}<div className="boss-name-title">{boss.name}</div></div>{!usesCleanPanelBackground && <div className="boss-badge">{boss.shortIcon}</div>}</div>
              <div className={`boss-stage boss-stage-${boss.id} boss-stage-${visualPhase} ${isSuperReady ? "super-ready" : ""} ${isSuperImpact ? "super-impact" : ""}`}>
                <div className={`boss-figure-wrap ${bossHit ? "hit" : ""}`}><BossFigure bossId={bossId} hpPercent={hpPercent} action={bossAction} /></div>
                {feedback === "correct" && <div className={`hero-attack ${isSuperImpact ? "super" : ""}`} aria-hidden="true" />}
                {playerHit && <div className={`boss-attack-effect attack-${boss.id}`}>{getBossAttackName(boss.id)}</div>}
                {damagePopup && <div className={`damage-popup damage-${boss.id} ${damagePopup.super ? "super" : ""}`}>{damagePopup.text}</div>}
                <div className="boss-shadow" />
              </div>
              <div className="boss-hp-wrap"><div className="boss-hp-label"><span>Boss-liv</span><span>{bossLives}/{bossMaxLives}</span></div><div className="boss-hp-bar"><div className="boss-hp-fill" style={{ width: `${hpPercent}%` }} /></div></div>
            </div>
          </div>
          <div className={`player-panel ${playerHit ? "hit" : ""}`}><div className="boss-compact-status"><div className="heart-row">{Array.from({ length: playerMaxHearts }).map((_, index) => <span key={index} className={index < playerHearts ? "" : "heart-lost"}>❤️</span>)}</div><div className="super-area"><div className="super-meter-label"><span>Super</span><span>{currentStreak}/5</span></div><div className={`super-meter ${isSuperReady ? "ready" : ""}`}>{Array.from({ length: 5 }).map((_, index) => <div key={index} className={`super-cell ${index < currentStreak ? "filled" : ""} ${isSuperReady && index === 4 ? "ready" : ""}`} />)}</div></div></div></div>
          <div className="card question-card boss-question-card"><p className="label">Velg riktig svar</p><h2>{question.a} {question.symbol} {question.b} = ?</h2></div>
          <div className="answer-grid">{question.options.map((option) => { let answerClass = "answer-button"; if (feedback === "correct" && option === question.correct) answerClass += " correct"; if (feedback === "wrong" && option !== question.correct) answerClass += " wrong"; if (feedback === "wrong" && option === question.correct) answerClass += " correct"; return <button key={option} onClick={() => answerBoss(option)} disabled={Boolean(feedback)} className={answerClass}>{option}</button>; })}</div>
          <Button variant="light" onClick={quitBossBattle} className="full quit-round-button">Avslutt runde</Button>
          {import.meta.env.DEV && (
            <div className="boss-dev-panel" aria-label="DEV-test">
              <span className="boss-dev-label">DEV-test</span>
              <button type="button" className="boss-dev-button win" onClick={triggerBossTestVictory} disabled={Boolean(feedback) || megaIntroStep !== null}>Test seier</button>
              <button type="button" className="boss-dev-button loss" onClick={triggerBossTestLoss} disabled={Boolean(feedback) || megaIntroStep !== null}>Test tap</button>
            </div>
          )}
          {megaIntroStep !== null && (
            <div className="mega-boss-transition" role="dialog" aria-modal="true" aria-live="assertive">
              <div className="mega-boss-dialog">
                <span>Finalefase</span>
                <p>{MEGA_REGNEMESTEREN_INTRO_LINES[megaIntroStep]}</p>
                <Button onClick={advanceMegaRegnemesterenIntro}>Neste</Button>
              </div>
            </div>
          )}
        </div>
      </Shell>
    );
  }

  if (screen === "bossResult") {
    const boss = getBossConfig(bossId); const won = bossOutcome === "won";
    const isFinalBossVictory = won && boss.id === MEGA_REGNEMESTEREN_ID;
    const finalDiplomaNameClassName = cleanFinalDiplomaName.length > 20 ? "final-diploma-name final-diploma-name-long" : cleanFinalDiplomaName.length > 14 ? "final-diploma-name final-diploma-name-medium" : "final-diploma-name";

    if (isFinalBossVictory && !finalDiplomaReady) {
      return (
        <Shell theme="boss">
          <div className="hero compact boss-result-hero final-diploma-hero">
            <h1>Du beseiret Mega Regnemesteren!</h1>
            <p>Skriv navnet ditt for å få diplomet</p>
          </div>
          <form
            className="card input-card final-diploma-name-card"
            onSubmit={(event) => {
              event.preventDefault();
              showFinalDiploma();
            }}
          >
            <label htmlFor="final-diploma-name">Navn på diplomet</label>
            <input
              id="final-diploma-name"
              value={finalDiplomaName}
              onChange={(event) => {
                setFinalDiplomaName(event.target.value);
                if (finalDiplomaNameError) setFinalDiplomaNameError("");
              }}
              maxLength={PLAYER_NAME_INPUT_MAX_LENGTH}
              placeholder="f.eks. navn/brukernavn"
              autoComplete="off"
            />
            <p className="small-note">Navnet vises bare på diplomet.</p>
            {finalDiplomaNameError && <p className="admin-message">{finalDiplomaNameError}</p>}
            <Button disabled={!cleanFinalDiplomaName} className="full">Vis diplom</Button>
          </form>
        </Shell>
      );
    }

    if (isFinalBossVictory) {
      return (
        <Shell theme="boss">
          <div className="hero compact boss-result-hero final-diploma-hero">
            <h1>Regnemester!</h1>
            <p>Du har fullført hele Boss Battle.</p>
          </div>
          <div className="card result-card boss-result-card won final-diploma-card">
            <div className="final-diploma-frame">
              <img className="final-diploma-image" src={REGNEMESTEREN_ASSETS.finalDiploma} alt={`Diplom til ${cleanFinalDiplomaName}`} />
              <div className={finalDiplomaNameClassName}>{cleanFinalDiplomaName}</div>
            </div>
            <p className="final-diploma-screenshot-note">Du kan ta skjermbilde av diplomet hvis du vil.</p>
          </div>
          <div className="stack"><Button variant="secondary" onClick={returnToBossSelectFromHiddenFinale}>Velg ny boss</Button><Button variant="light" onClick={returnToBossModeFromHiddenFinale}>Tilbake</Button></div>
        </Shell>
      );
    }

    return (
      <Shell theme="boss">
        <div className="hero compact boss-result-hero">
          <h1>{won ? "SEIER!" : "Bossen vant"}</h1>
          <p>{won ? `Du beseiret ${boss.name}!` : "Du var nær - prøv igjen!"}</p>
        </div>
        <div className={`card result-card boss-result-card boss-result-${boss.id} ${won ? "won" : "lost"}`}>
          <div className="boss-result-burst" aria-hidden="true">{Array.from({ length: 6 }).map((_, index) => <span key={index} className="result-spark" />)}</div>
          <div className="boss-result-banner">{won ? "Du vant bosskampen" : "Neste gang tar du den"}</div>
          {won ? (
            <>
              <div className={`boss-result-figure boss-result-defeated ${boss.id === "troll" ? "boss-result-defeated-troll" : ""} ${boss.id === "shadow" ? "boss-result-defeated-shadow" : ""} ${boss.id === "isdragen" ? "boss-result-defeated-isdragen" : ""} ${boss.id === "lavakjempen" ? "boss-result-defeated-lavakjempen" : ""} ${boss.id === "stormornen" ? "boss-result-defeated-stormornen" : ""} ${boss.id === "krystallvokteren" ? "boss-result-defeated-krystallvokteren" : ""} ${boss.id === "mekamaskinen" ? "boss-result-defeated-mekamaskinen" : ""} ${boss.id === "morkekraken" ? "boss-result-defeated-morkekraken" : ""} ${boss.id === "regnemesteren" ? "boss-result-defeated-regnemesteren" : ""} ${boss.id === MEGA_REGNEMESTEREN_ID ? "boss-result-defeated-mega-regnemesteren" : ""}`}><BossFigure bossId={bossId} hpPercent={0} action="defeat" defeated /></div>
              <TreasureChest size={getBossTreasureSize(boss)} />
              <h2>{boss.treasureName}</h2>
              <span>{boss.name} ble slått</span>
            </>
          ) : (
            <>
              <div className={`boss-result-figure boss-result-standing ${boss.id === "slime" ? "boss-result-standing-slime" : ""} ${boss.id === "troll" ? "boss-result-standing-troll" : ""} ${boss.id === "shadow" ? "boss-result-standing-shadow" : ""} ${boss.id === "isdragen" ? "boss-result-standing-isdragen" : ""} ${boss.id === "lavakjempen" ? "boss-result-standing-lavakjempen" : ""} ${boss.id === "stormornen" ? "boss-result-standing-stormornen" : ""} ${boss.id === "krystallvokteren" ? "boss-result-standing-krystallvokteren" : ""} ${boss.id === "mekamaskinen" ? "boss-result-standing-mekamaskinen" : ""} ${boss.id === "morkekraken" ? "boss-result-standing-morkekraken" : ""} ${boss.id === "regnemesteren" ? "boss-result-standing-regnemesteren" : ""} ${boss.id === MEGA_REGNEMESTEREN_ID ? "boss-result-standing-mega-regnemesteren" : ""}`}><BossFigure bossId={bossId} hpPercent={Math.max(0, Math.min(100, (bossLives / bossMaxLives) * 100))} action="attack" holdAction /></div>
              <h2>{boss.name} står igjen</h2>
              <span>{bossLives} boss-liv igjen</span>
            </>
          )}
          <div className="boss-result-stats">
            <div className="boss-result-stat"><strong>{playerHearts}/{playerMaxHearts}</strong><span>Hjerter</span></div>
            <div className="boss-result-stat"><strong>{bossCorrectAnswers}</strong><span>Riktige</span></div>
          </div>
        </div>
        <div className="stack"><Button onClick={startBossBattle}>Prøv samme boss igjen</Button><Button variant="secondary" onClick={returnToBossSelectFromHiddenFinale}>Velg ny boss</Button><Button variant="light" onClick={boss.id === MEGA_REGNEMESTEREN_ID ? returnToBossSelectFromHiddenFinale : () => setScreen("bossMode")}>Tilbake</Button></div>
        <p className="small-note">Boss Battle har ingen highscore og lagrer ingen resultater.</p>
      </Shell>
    );
  }

  if (screen === "grade") {
    return <Shell theme="normal" isSetup modeBg="normal"><div className="hero"><div className="icon-box icon-blue"><Zap /></div><h1>Normal</h1><p>Velg regneart.</p></div><div className="card input-card"><ModeButtons selectedMode={null} includeMixed onSelect={(mode) => { setGameMode(mode); setNormalTimed(true); setGameLevelChoiceMade(false); setGameQuestionCountChoiceMade(false); if (isTimeChallengeMode(mode)) setGameQuestionCount(10); setScreen("start"); }} /></div><Button variant="light" onClick={() => setScreen("home")} className="full top-space">Tilbake</Button></Shell>;
  }

  if (screen === "school") {
    return <Shell theme="school" isSetup modeBg="school"><div className="hero"><div className="icon-box icon-blue"><Trophy /></div><h1>Skolekampen</h1><p>Velg skole.</p></div><div className="card input-card">{SCHOOL_OPTIONS.map((school) => <Button key={school} variant={schoolBattleSchool === school ? "primary" : "light"} onClick={() => { setSchoolBattleSchool(school); setSchoolGradeChoiceMade(false); setSchoolGradeGroupChoiceMade(false); setScreen("schoolClass"); }} className="full top-space">{school}</Button>)}</div><Button variant="light" onClick={() => setScreen("home")} className="full top-space">Tilbake</Button></Shell>;
  }

  if (screen === "schoolClass") {
    return <Shell theme="school" isSetup modeBg="school"><div className="hero"><div className="icon-box icon-blue"><Trophy /></div><h1>Skolekampen</h1><p>{schoolBattleSchool}</p><p className="small-note">Velg klasse.</p></div><div className="card input-card">{SCHOOL_BATTLE_GRADE_OPTIONS.map((grade) => <Button key={grade} variant={schoolGradeChoiceMade && schoolBattleGradeLevel === grade ? "primary" : "light"} onClick={() => { setSchoolBattleGradeLevel(grade); setSchoolBattleGradeGroup(getSchoolBattleGradeGroup(grade)); setSchoolGradeChoiceMade(true); setSchoolGradeGroupChoiceMade(false); setScreen("schoolMode"); }} className="full top-space">{getSchoolBattleClassLabel(grade)}</Button>)}</div><Button variant="light" onClick={() => setScreen("school")} className="full top-space">Tilbake</Button></Shell>;
  }

  if (screen === "schoolMode") {
    return <Shell theme="school" isSetup modeBg="school"><div className="hero"><div className="icon-box icon-blue"><Trophy /></div><h1>Skolekampen</h1><p>{schoolBattleSchool}</p><p className="small-note">{getSchoolBattleClassLabel(schoolBattleGradeLevel)} · velg regneart.</p></div><div className="card input-card"><ModeButtons selectedMode={null} onSelect={(mode) => { setGameMode(mode); setGameLevel("medium"); setSchoolBattleGradeGroup(getSchoolBattleGradeGroup(schoolBattleGradeLevel)); setSchoolGradeGroupChoiceMade(false); if (isTimeChallengeMode(mode)) setGameQuestionCount(SCHOOL_BATTLE_TIME_QUESTION_COUNT); setScreen("start"); }} /></div><Button variant="light" onClick={() => setScreen("schoolClass")} className="full top-space">Tilbake</Button></Shell>;
  }

  if (screen === "schoolGradeGroup") {
    return <Shell theme="school" isSetup modeBg="school"><div className="hero"><div className="icon-box icon-blue"><Trophy /></div><h1>Skolekampen</h1><p>{getModeLabel(gameMode)} · velg gruppe.</p><p className="small-note">25 riktige svar · Highscore på kortest tid</p></div><div className="card input-card"><Button variant={schoolGradeGroupChoiceMade && schoolBattleGradeGroup === "small" ? "primary" : "light"} onClick={() => { setSchoolBattleGradeGroup("small"); setSchoolGradeGroupChoiceMade(true); setScreen("start"); }} className="full">Småtrinn 1.–4.</Button><Button variant={schoolGradeGroupChoiceMade && schoolBattleGradeGroup === "middle" ? "primary" : "light"} onClick={() => { setSchoolBattleGradeGroup("middle"); setSchoolGradeGroupChoiceMade(true); setScreen("start"); }} className="full top-space">Mellomtrinn 5.–7.</Button></div><Button variant="light" onClick={() => setScreen("schoolMode")} className="full top-space">Tilbake</Button></Shell>;
  }

  if (screen === "mode") {
    return <Shell theme="normal" isSetup modeBg="normal"><div className="hero"><div className="icon-box icon-blue"><Zap /></div><h1>Normal</h1><p>Velg regneart.</p></div><div className="card input-card"><ModeButtons selectedMode={null} includeMixed onSelect={(mode) => { setGameMode(mode); setNormalTimed(true); setGameLevelChoiceMade(false); setGameQuestionCountChoiceMade(false); if (isTimeChallengeMode(mode)) setGameQuestionCount(10); setScreen("start"); }} /></div><Button variant="light" onClick={() => setScreen("home")} className="full top-space">Tilbake</Button></Shell>;
  }

  if (screen === "qr") {
    return <Shell><div className="hero compact"><div className="icon-box icon-yellow"><Zap /></div><h1>QR-kode</h1><p>Skann for å åpne Regnemester.</p></div><div className="card input-card" style={{ alignItems: "center", textAlign: "center" }}><QrCodeImage /><p className="small-note">{APP_URL}</p></div><Button variant="light" onClick={() => setScreen("home")} className="full top-space">Tilbake</Button></Shell>;
  }

  if (screen === "start") {
    const normalWithoutTime = gameType === "normal" && !normalTimed;
    const timeChallenge = !normalWithoutTime && isTimeChallengeMode(gameMode); const selectedQuestionCount = gameType === "school_battle" && timeChallenge ? SCHOOL_BATTLE_TIME_QUESTION_COUNT : gameQuestionCount;
    const startPrompt = normalWithoutTime ? `Øv på ${getModeLabel(gameMode).toLowerCase()} uten tidspress.` : timeChallenge ? `Hvor raskt klarer du ${selectedQuestionCount} ${gameMode === "subtraction" ? "subtraksjonsoppgaver" : "addisjonsoppgaver"}?` : gameMode === MIXED_MODE ? `Hvor mange blandede oppgaver klarer du på ${getGameSeconds(gameType)} sekunder?` : gameMode === "multiplication" ? `Hvor mange gangestykker klarer du på ${getGameSeconds(gameType)} sekunder?` : `Hvor mange divisjonsstykker klarer du på ${getGameSeconds(gameType)} sekunder?`;
    const startTheme = gameType === "school_battle" ? "school" : "normal";
    return (
      <Shell theme={startTheme} isSetup modeBg={startTheme}>
        <div className="hero">
          <div className="icon-box icon-blue"><Zap /></div>
          <h1>{gameType === "school_battle" ? "Skolekampen" : "Regnemester"}</h1>
          <p>{startPrompt}</p>
          {gameType === "school_battle" ? (timeChallenge ? <p className="small-note">{schoolBattleSchool} · {getSchoolBattleClassLabel(schoolBattleGradeLevel)} · 25 riktige svar · Feil gir +{TIME_PENALTY_SECONDS} sekunder</p> : <p className="small-note">{schoolBattleSchool} · {getSchoolBattleClassLabel(schoolBattleGradeLevel)} · Middels nivå · 70 sekunder</p>) : <p className="small-note">{getLevelDescription(gameMode, gameLevel)}{timeChallenge ? ` · Feil svar gir +${TIME_PENALTY_SECONDS} sekunder` : ""}</p>}
        </div>
        {gameType === "normal" ? <div className="card input-card"><label>Velg nivå</label><Button variant={gameLevelChoiceMade && gameLevel === "easy" ? "primary" : "light"} onClick={() => { setGameLevel("easy"); setGameLevelChoiceMade(true); }} className="full">Lett</Button><Button variant={gameLevelChoiceMade && gameLevel === "medium" ? "primary" : "light"} onClick={() => { setGameLevel("medium"); setGameLevelChoiceMade(true); }} className="full top-space">Middels</Button><Button variant={gameLevelChoiceMade && gameLevel === "hard" ? "primary" : "light"} onClick={() => { setGameLevel("hard"); setGameLevelChoiceMade(true); }} className="full top-space">Vanskelig</Button></div> : <div className="card input-card"><label>Skolekampen</label>{timeChallenge ? <p className="small-note">{getSchoolBattleClassLabel(schoolBattleGradeLevel)} · 25 riktige svar · kortest tid vinner.</p> : <p className="small-note">{getSchoolBattleClassLabel(schoolBattleGradeLevel)} · nivået er låst til Middels.</p>}</div>}
        {gameType === "normal" && <NormalTimeToggle timed={normalTimed} onChange={setNormalTimed} />}
        {gameType === "normal" && timeChallenge && <div className="card input-card"><label>Velg antall oppgaver</label>{QUESTION_COUNT_OPTIONS.map((count) => <Button key={count} variant={gameQuestionCountChoiceMade && gameQuestionCount === count ? "primary" : "light"} onClick={() => { setGameQuestionCount(count); setGameQuestionCountChoiceMade(true); }} className="full top-space">{count} oppgaver</Button>)}</div>}
        {gameType === "school_battle" ? <div className="card input-card"><label htmlFor="player-name">Skriv spillnavn</label><input id="player-name" value={playerName} onChange={(event) => setPlayerName(event.target.value)} maxLength={PLAYER_NAME_INPUT_MAX_LENGTH} placeholder="f.eks. Tiger23" autoComplete="off" />{nameError && <p className="admin-message">{nameError}</p>}<Button onClick={startGame} disabled={!cleanPlayerName} className="full">Start spillet</Button></div> : <div className="card input-card"><Button onClick={startGame} className="full">Start spillet</Button></div>}
        <Button variant="light" onClick={() => setScreen(gameType === "school_battle" ? "schoolMode" : "mode")} className="full top-space">Tilbake</Button>
      </Shell>
    );
  }

  if (screen === "play") {
    const normalWithoutTime = gameType === "normal" && !normalTimed;
    const timeChallenge = !normalWithoutTime && isTimeChallengeMode(gameMode); const displayedTime = elapsedSeconds + wrongAnswers * TIME_PENALTY_SECONDS; const displayedQuestionCount = gameType === "school_battle" && timeChallenge ? SCHOOL_BATTLE_TIME_QUESTION_COUNT : gameQuestionCount;
    const playTheme = gameType === "school_battle" ? "school" : "normal";
    return <Shell theme={playTheme} modeBg={playTheme}><div ref={gameAreaRef} className="play-compact-layout">{timeChallenge ? <div className="status-row play-status-compact"><div className="status-pill red"><Timer /><span>{formatTime(displayedTime)}</span></div><div className="status-pill green"><Trophy /><span>{questionsDone}/{displayedQuestionCount}</span></div></div> : normalWithoutTime ? <div className="status-row play-status-compact"><div className="status-pill"><Timer /><span>Uten tid</span></div><div className="status-pill green"><Trophy /><span>{score} poeng</span></div></div> : <div className="status-row play-status-compact"><div className="status-pill red"><Timer /><span>{timeLeft} sek</span></div><div className="status-pill green"><Trophy /><span>{score} poeng</span></div></div>}<div className="card question-card play-question-compact"><p className="label">{timeChallenge ? `Oppgave ${Math.min(questionsDone + 1, displayedQuestionCount)} av ${displayedQuestionCount}` : "Velg riktig svar"}</p><h2>{question.a} {question.symbol} {question.b} = ?</h2></div><div className="answer-grid play-answer-grid-compact">{question.options.map((option) => { let answerClass = "answer-button"; if (feedback === "correct" && option === question.correct) answerClass += " correct"; if (feedback === "wrong" && option !== question.correct) answerClass += " wrong"; if (feedback === "wrong" && option === question.correct) answerClass += " correct"; return <button key={option} onClick={() => answer(option)} disabled={Boolean(feedback)} className={answerClass}>{option}</button>; })}</div><div className="feedback-area play-feedback-compact">{feedback === "correct" && <p className="feedback correct-text">Riktig! +1</p>}{feedback === "wrong" && <p className="feedback wrong-text">{timeChallenge ? `Feil! +${TIME_PENALTY_SECONDS} sekunder. Oppgaven teller ikke.` : "Feil! -1 poeng"}</p>}{!feedback && <p className="feedback neutral-text">{normalWithoutTime ? "Øv rolig uten tidspress!" : timeChallenge ? "Svar riktig og raskt!" : "Svar så raskt du kan!"}</p>}</div><Button variant="light" onClick={quitRound} className="full quit-round-button">Avslutt runde</Button></div></Shell>;
  }

  if (screen === "result") {
    const normalWithoutTime = gameType === "normal" && !normalTimed;
    const timeChallenge = !normalWithoutTime && isTimeChallengeMode(gameMode); const resultQuestionCount = gameType === "school_battle" && timeChallenge ? SCHOOL_BATTLE_TIME_QUESTION_COUNT : gameQuestionCount;
    const schoolBattleClosedDuringRound = scoreMessage === SCHOOL_BATTLE_CLOSED_DURING_ROUND_MESSAGE;
    if (gameType === "normal") {
      const normalTotalAnswers = normalCorrectCount + normalWrongCount;
      const normalAccuracy = normalTotalAnswers > 0 ? Math.round((normalCorrectCount / normalTotalAnswers) * 100) : 0;
      const normalResultFeedback = normalResultMotivationMessage || getNormalResultFeedback(normalAccuracy);
      const normalMainLabel = timeChallenge ? "Din tid" : "Poeng";
      const normalMainValue = timeChallenge ? formatTime(resultTimeSeconds) : score;
      const normalMainDetail = `${getModeLabel(gameMode)} · ${getLevelLabel(gameLevel)}`;
      return (
        <Shell theme="normal">
          <div className="hero compact normal-result-hero">
            <div className="icon-box icon-yellow"><Trophy /></div>
            <h1>Runden er ferdig!</h1>
            <p>{normalMainDetail}</p>
          </div>
          <div className="card result-card normal-result-card">
            <p>{normalMainLabel}</p>
            <strong>{normalMainValue}</strong>
            <span>{timeChallenge ? `${resultCorrectAnswers || normalCorrectCount} riktige svar` : getMessage(score)}</span>
            {!timeChallenge && <StarsDisplay count={stars} />}
            <div className="normal-result-stat-grid">
              <div className="normal-result-stat-item"><strong>{normalCorrectCount}</strong><span>Riktige svar</span></div>
              <div className="normal-result-stat-item"><strong>{normalWrongCount}</strong><span>Feil svar</span></div>
              <div className="normal-result-stat-item"><strong>{normalAccuracy}%</strong><span>Treffprosent</span></div>
              <div className="normal-result-stat-item"><strong>{normalBestStreak}</strong><span>Beste rekke</span></div>
            </div>
            <p className="normal-result-feedback">{normalResultFeedback}</p>
          </div>
          <div className="stack"><Button onClick={startGame}>Prøv igjen</Button><Button variant="light" onClick={() => setScreen("mode")}>Til meny</Button></div>
        </Shell>
      );
    }
    return (
      <Shell theme="school">
        <div className="hero compact"><h1>{timeChallenge ? "Ferdig!" : "Tiden er ute!"}</h1></div>
        {timeChallenge ? <div className="card result-card"><p>Din tid</p><strong>{formatTime(resultTimeSeconds)}</strong><span>{resultQuestionCount} riktige svar</span><h2>Godt jobbet!</h2></div> : <div className="card result-card"><p>Du fikk</p><strong>{score}</strong><span>poeng</span><StarsDisplay count={stars} /><h2>{getMessage(score)}</h2></div>}
        {gameType === "normal" && <p className="normal-result-motivation">{normalResultMessage}</p>}
        {gameType === "school_battle" && scoreMessage && <p className={`error-box${schoolBattleClosedDuringRound ? " school-battle-closed-message" : ""}`}>{scoreMessage}</p>}
        <div className="stack"><Button onClick={startGame}>Spill igjen</Button><Button variant="light" onClick={() => setScreen(gameType === "school_battle" ? "schoolMode" : "mode")}>Tilbake</Button></div>
        {gameType === "school_battle" && !schoolBattleClosedDuringRound && <ResultHighscoreList scores={resultScores} mode={gameMode} gameType={gameType} gradeLevel={gameGradeLevel} level={gameLevel} questionCount={gameQuestionCount} gradeGroup={schoolBattleGradeGroup} />}
        {gameType === "school_battle" && !schoolBattleClosedDuringRound && <p className="small-note">{timeChallenge ? `Highscore for ${getModeLabel(gameMode).toLowerCase()} lagrer kun toppresultater. Feil svar gir +${TIME_PENALTY_SECONDS} sekunder.` : "Highscore lagrer kun relevante toppresultater."}</p>}
      </Shell>
    );
  }

  if (screen === "schoolHighscore") {
    const visibleSchoolScores = dedupeSchoolBattleScores(scores, highscoreMode);
    scores = visibleSchoolScores;
    return <Shell theme="school"><div className="hero compact"><div className="icon-box icon-yellow"><Crown /></div><h1>Skolekampen</h1><p>{getModeLabel(highscoreMode)} - {isTimeChallengeMode(highscoreMode) ? `${getGradeGroupLabel(highscoreGradeGroup)} - Topp 20 korteste tider` : "Topp 20"}</p></div><div className="card input-card"><ModeFilterButtons selectedMode={highscoreMode} onSelect={changeSchoolBattleHighscoreMode} /></div>{isTimeChallengeMode(highscoreMode) && <div className="card input-card"><label>Velg gruppe</label><Button variant={highscoreGradeGroup === "small" ? "primary" : "light"} onClick={() => changeSchoolBattleGradeGroup("small")} className="full">Småtrinn 1.–4.</Button><Button variant={highscoreGradeGroup === "middle" ? "primary" : "light"} onClick={() => changeSchoolBattleGradeGroup("middle")} className="full top-space">Mellomtrinn 5.–7.</Button></div>}{scoreMessage && <p className="error-box">{scoreMessage}</p>}<div className="card highscore-card">{scores.length === 0 ? <div className="empty-state"><h2>Ingen resultater ennå</h2><p>Spill en runde i Skolekampen for å lage første score.</p></div> : <div className="score-list">{scores.map((entry, index) => <div key={`${entry.name}-${entry.school}-${entry.grade_level || 0}-${entry.score}-${index}`} className="score-row"><div className="score-name"><span className={index === 0 ? "rank rank-first" : "rank"}>{index + 1}</span><strong>{entry.name}</strong><small>{entry.school || "Ukjent skole"} · {getSchoolBattleClassLabel(entry)}</small></div><span className="score-value">{isTimeChallengeMode(highscoreMode) ? formatTime(entry.score) : entry.score}</span></div>)}</div>}</div><div className="stack"><Button onClick={() => setScreen("highscoreHome")}>Tilbake</Button></div></Shell>;
  }

  if (screen === "highscore") {
    return <Shell><div className="hero compact"><div className="icon-box icon-yellow"><Crown /></div><h1>Highscore</h1></div><div className="card input-card"><Button variant="secondary" onClick={openSchoolHighscoreFromHome} className="full">Skolekampen</Button></div><Button variant="light" onClick={() => setScreen("highscoreHome")} className="full top-space">Tilbake</Button></Shell>;
  }

  if (screen === "adminLogin") {
    return <Shell><div className="hero compact"><div className="icon-box icon-red"><Shield /></div><h1>Admin</h1><p>Skriv adminkode for å fortsette.</p></div><div className="card input-card"><label htmlFor="admin-login-pin">Adminkode</label><input id="admin-login-pin" value={adminLoginPin} onChange={(event) => setAdminLoginPin(event.target.value)} type="password" inputMode="numeric" placeholder="8-sifret kode" maxLength={8} /><Button onClick={validateAdminLogin} disabled={adminLoginPin.trim().length !== 8} className="full">Logg inn</Button>{adminMessage && <p className="admin-message">{adminMessage}</p>}</div><Button variant="light" onClick={() => setScreen("home")} className="full top-space">Tilbake</Button></Shell>;
  }

  if (screen === "adminHome") {
    return (
      <Shell>
        <div className="hero compact"><div className="icon-box icon-red"><Shield /></div><h1>Admin</h1><p>Velg hva du vil administrere.</p></div>
        <div className="card input-card">
          <label>Skolekampen: {schoolBattleEnabled ? "ÅPEN" : "STENGT"}</label>
          <Button
            variant={schoolBattleEnabled ? "danger" : "primary"}
            onClick={toggleSchoolBattleFromAdmin}
            disabled={schoolBattleToggleSaving || schoolBattleStatusLoading}
            className="full"
          >
            {schoolBattleToggleSaving ? "Oppdaterer..." : schoolBattleEnabled ? "Steng Skolekampen" : "Åpne Skolekampen"}
          </Button>
          <p className="small-note">Status hentes fra Supabase.</p>
        </div>
        <div className="card input-card">
          <label>Boss Battle</label>
          <Button variant="secondary" onClick={unlockAllRegularBossesLocally} className="full">
            Lås opp alle bossene
          </Button>
          <p className="small-note">Låser opp boss 1-10 lokalt i denne nettleseren. Mega Regnemesteren vises fortsatt ikke i boss-velgeren.</p>
        </div>
        <div className="card input-card regnereisen-admin-card">
          <label htmlFor="regnereisen-access-code">Regnereisen testkode</label>
          <input
            id="regnereisen-access-code"
            value={regnereisenAccessCodeDraft}
            onChange={(event) => setRegnereisenAccessCodeDraft(normalizeRegnereisenAccessCode(event.target.value))}
            inputMode="numeric"
            maxLength={4}
            placeholder="4-sifret kode"
            autoComplete="off"
          />
          <Button
            onClick={saveRegnereisenAccessCodeFromAdmin}
            disabled={regnereisenAccessCodeSaving || regnereisenAccessCodeDraft.length !== 4}
            className="full"
          >
            {regnereisenAccessCodeSaving ? "Lagrer..." : "Lagre Regnereisen-kode"}
          </Button>
          <p className="small-note">Regnereisen-kortet er låst. Elever med riktig 4-sifret kode kan åpne modusen lokalt.</p>
        </div>
        <div className="card input-card announcement-admin-card">
          <label>Startsidebeskjed: {announcementSettings.enabled ? "AKTIV" : "INAKTIV"}</label>
          <label htmlFor="announcement-title">Tittel</label>
          <input
            id="announcement-title"
            value={announcementDraftTitle}
            onChange={(event) => setAnnouncementDraftTitle(event.target.value)}
            maxLength={80}
            placeholder={ANNOUNCEMENT_DEFAULT_TITLE}
          />
          <label htmlFor="announcement-message">Melding</label>
          <textarea
            id="announcement-message"
            value={announcementDraftMessage}
            onChange={(event) => setAnnouncementDraftMessage(event.target.value)}
            maxLength={280}
            rows={4}
            placeholder="Skriv beskjeden som skal vises pÃ¥ startsiden."
          />
          <label className="announcement-toggle">
            <input
              type="checkbox"
              checked={announcementDraftEnabled}
              onChange={(event) => setAnnouncementDraftEnabled(event.target.checked)}
            />
            <span>Aktiv</span>
          </label>
          <Button onClick={publishAnnouncementFromAdmin} disabled={announcementSaving || !announcementDraftMessage.trim()} className="full">
            {announcementSaving ? "Lagrer..." : "Publiser beskjed"}
          </Button>
          <Button variant="light" onClick={disableAnnouncementFromAdmin} disabled={announcementSaving || !announcementSettings.enabled} className="full top-space">
            Skru av beskjed
          </Button>
          <p className="small-note">Publisering bruker Supabase app_settings.</p>
        </div>
        {adminMessage && <p className="admin-message">{adminMessage}</p>}
        <div className="card input-card"><Button onClick={() => { refreshAllNormalAdminScores(); setScreen("adminNormal"); }} className="full">Normal highscore</Button><Button variant="secondary" onClick={() => { refreshSchoolBattleScores(highscoreMode); setScreen("adminSchool"); }} className="full top-space">Skolekampen</Button></div>
        <Button variant="light" onClick={() => setScreen("home")} className="full top-space">Tilbake</Button>
      </Shell>
    );
  }

  if (screen === "adminNormal") {
    const hasActiveFilters =
      adminNormalSearch.trim() ||
      adminNormalGradeFilter !== ALL_FILTER_VALUE ||
      adminNormalModeFilter !== ALL_FILTER_VALUE ||
      adminNormalLevelFilter !== ALL_FILTER_VALUE ||
      adminNormalQuestionCountFilter !== ALL_FILTER_VALUE;

    return (
      <Shell>
        <div className="hero compact">
          <div className="icon-box icon-red"><Shield /></div>
          <h1>Normal admin</h1>
          <p>Samlet oversikt over alle Normal-lister.</p>
        </div>

        <div className="card input-card">
          <label htmlFor="admin-normal-search">Søk etter spillnavn</label>
          <input
            id="admin-normal-search"
            value={adminNormalSearch}
            onChange={(event) => setAdminNormalSearch(event.target.value)}
            placeholder="Skriv navn, f.eks. Tiger23"
            autoComplete="off"
          />
          <p className="small-note">Filtrer, finn og slett uten å måtte gå inn på hver enkelt liste.</p>
        </div>

        <div className="card input-card">
          <label>Oversikt</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <div className="status-pill green" style={{ justifyContent: "center" }}>
              <Trophy />
              <span>{adminNormalStats.totalResults} resultater</span>
            </div>
            <div className="status-pill red" style={{ justifyContent: "center" }}>
              <Crown />
              <span>{adminNormalStats.activeLists} lister</span>
            </div>
          </div>
          <p className="small-note">
            Beste poengsum: {adminNormalStats.bestScoreEntry ? `${adminNormalStats.bestScoreEntry.name} · ${adminNormalStats.bestScoreEntry.score} poeng` : "ingen ennå"}
          </p>
          <p className="small-note">
            Beste tid: {adminNormalStats.bestTimeEntry ? `${adminNormalStats.bestTimeEntry.name} · ${formatTime(adminNormalStats.bestTimeEntry.score)}` : "ingen ennå"}
          </p>
        </div>

        <div className="card input-card">
          <label>Filtrer trinn</label>
          <Button
            variant={adminNormalGradeFilter === ALL_FILTER_VALUE ? "primary" : "light"}
            onClick={() => setAdminNormalGradeFilter(ALL_FILTER_VALUE)}
            className="full"
          >
            Alle trinn
          </Button>
          {GRADE_OPTIONS.map((grade) => (
            <Button
              key={grade}
              variant={Number(adminNormalGradeFilter) === grade ? "primary" : "light"}
              onClick={() => setAdminNormalGradeFilter(grade)}
              className="full top-space"
            >
              {getGradeLabel(grade)}
            </Button>
          ))}
        </div>

        <div className="card input-card">
          <label>Filtrer regneart</label>
          <Button
            variant={adminNormalModeFilter === ALL_FILTER_VALUE ? "primary" : "light"}
            onClick={() => setAdminNormalModeFilter(ALL_FILTER_VALUE)}
            className="full"
          >
            Alle regnearter
          </Button>
          {MODE_ORDER.map((mode) => (
            <Button
              key={mode}
              variant={adminNormalModeFilter === mode ? "primary" : "light"}
              onClick={() => setAdminNormalModeFilter(mode)}
              className="full top-space mode-choice-button"
            >
              <ModeButtonLabel mode={mode} />
            </Button>
          ))}
        </div>

        <div className="card input-card">
          <label>Filtrer nivå</label>
          <Button
            variant={adminNormalLevelFilter === ALL_FILTER_VALUE ? "primary" : "light"}
            onClick={() => setAdminNormalLevelFilter(ALL_FILTER_VALUE)}
            className="full"
          >
            Alle nivå
          </Button>
          {LEVEL_ORDER.map((level) => (
            <Button
              key={level}
              variant={adminNormalLevelFilter === level ? "primary" : "light"}
              onClick={() => setAdminNormalLevelFilter(level)}
              className="full top-space"
            >
              {getLevelLabel(level)}
            </Button>
          ))}
        </div>

        <div className="card input-card">
          <label>Filtrer antall oppgaver</label>
          <Button
            variant={adminNormalQuestionCountFilter === ALL_FILTER_VALUE ? "primary" : "light"}
            onClick={() => setAdminNormalQuestionCountFilter(ALL_FILTER_VALUE)}
            className="full"
          >
            Alle / poengmoduser
          </Button>
          {QUESTION_COUNT_OPTIONS.map((count) => (
            <Button
              key={count}
              variant={Number(adminNormalQuestionCountFilter) === count ? "primary" : "light"}
              onClick={() => setAdminNormalQuestionCountFilter(count)}
              className="full top-space"
            >
              {count} oppgaver
            </Button>
          ))}
          <p className="small-note">Antall oppgaver gjelder addisjon (+) og subtraksjon (−). Multiplikasjon (×) og divisjon (÷) vises under “Alle / poengmoduser”.</p>
        </div>

        {hasActiveFilters && (
          <Button variant="light" onClick={clearNormalAdminFilters} className="full top-space">
            Nullstill søk og filtre
          </Button>
        )}

        {adminMessage && <p className="admin-message">{adminMessage}</p>}

        {adminNormalGroups.length === 0 ? (
          <div className="card highscore-card">
            <div className="empty-state">
              <h2>Ingen resultater funnet</h2>
              <p>Prøv å endre søket eller filtrene.</p>
            </div>
          </div>
        ) : (
          <div className="stack">
            {adminNormalGroups.map((group) => {
              const groupIsTimed = isTimeChallengeMode(group.mode);
              return (
                <div key={group.key} className="card highscore-card">
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", alignItems: "flex-start", marginBottom: "10px" }}>
                    <div>
                      <h2 className="result-highscore-title" style={{ textAlign: "left", marginBottom: "2px" }}>{getNormalAdminGroupTitle(group)}</h2>
                      <p className="small-note">{group.entries.length} resultat{group.entries.length === 1 ? "" : "er"} på listen</p>
                    </div>
                    <button
                      type="button"
                      className="button button-danger"
                      onClick={() => resetNormalAdminGroup(group)}
                      style={{ padding: "8px 10px", fontSize: "0.78rem", flexShrink: 0 }}
                    >
                      Tøm
                    </button>
                  </div>

                  <div className="score-list">
                    {group.entries.map((entry, index) => (
                      <div key={`${entry.id || "local"}-${entry.name}-${entry.score}-${index}`} className="score-row">
                        <div className="score-name">
                          <span className={index === 0 ? "rank rank-first" : "rank"}>{index + 1}</span>
                          <strong>{entry.name}</strong>
                          <small>{getNormalAdminGroupTitle(group)}</small>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span className="score-value">{groupIsTimed ? formatTime(entry.score) : entry.score}</span>
                          {entry.id && (
                            <button
                              type="button"
                              className="button button-danger"
                              onClick={() => deleteNormalScore(entry.id)}
                              style={{ padding: "8px 10px", fontSize: "0.8rem" }}
                            >
                              Slett
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Button variant="light" onClick={() => setScreen("adminHome")} className="full top-space">Tilbake</Button>
      </Shell>
    );
  }

  if (screen === "adminSchool") {
    return <Shell><div className="hero compact"><div className="icon-box icon-red"><Shield /></div><h1>Skolekampen admin</h1><p>Slett enkeltresultater.</p></div><div className="card input-card"><ModeFilterButtons selectedMode={highscoreMode} onSelect={changeSchoolBattleHighscoreMode} /></div>{isTimeChallengeMode(highscoreMode) && <div className="card input-card"><label>Velg gruppe</label><Button variant={highscoreGradeGroup === "small" ? "primary" : "light"} onClick={() => changeSchoolBattleGradeGroup("small")} className="full">Småtrinn 1.–4.</Button><Button variant={highscoreGradeGroup === "middle" ? "primary" : "light"} onClick={() => changeSchoolBattleGradeGroup("middle")} className="full top-space">Mellomtrinn 5.–7.</Button></div>}<div className="card highscore-card">{scores.length === 0 ? <div className="empty-state"><h2>Ingen resultater</h2><p>Det er ingen Skolekampen-resultater på denne listen.</p></div> : <div className="score-list">{scores.map((entry, index) => <div key={`${entry.id}-${entry.name}-${entry.school}-${entry.grade_level || 0}-${entry.score}-${index}`} className="score-row"><div className="score-name"><span className={index === 0 ? "rank rank-first" : "rank"}>{index + 1}</span><strong>{entry.name}</strong><small>{entry.school || "Ukjent skole"} · {getSchoolBattleClassLabel(entry)}</small></div><div style={{ display: "flex", alignItems: "center", gap: "8px" }}><span className="score-value">{isTimeChallengeMode(highscoreMode) ? formatTime(entry.score) : entry.score}</span>{entry.id && <button type="button" className="button button-danger" onClick={() => deleteSchoolBattleScore(entry.id)} style={{ padding: "8px 10px", fontSize: "0.8rem" }}>Slett</button>}</div></div>)}</div>}</div><Button variant="light" onClick={() => setScreen("adminHome")} className="full top-space">Tilbake</Button></Shell>;
  }

  return null;
}
