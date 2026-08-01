# Arbeidspakke A – målegrunnlag Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Etablere en reproducerbar, personvernvennlig baseline for lasting, ytelse, minnebruk og opprydding i Regnemester – særlig Regnereisen på iPad – uten å optimalisere eller endre appens funksjonelle kode.

**Architecture:** Baselinearbeidet deles i tre lag: statisk inventar av produksjonsbygget og ressursene, en isolert Playwright/Chrome-CDP-måler som observerer appen uten å bygge målekode inn i den, og en fysisk iPad-kontroll. Råmålinger lagres utenfor Git, mens en kort Markdown-rapport og en maskinlesbar, aggregert JSON-fil blir de varige leveransene og beslutningsgrunnlaget for arbeidspakke B og C.

**Tech Stack:** React 19, Vite 8, Phaser 4.2.1, Node.js 22–24, Node test runner, Playwright 1.62.1 (kun utviklingsverktøy), Chrome DevTools Protocol, Safari Web Inspector ved tilgang til Mac, Vercel Speed Insights og eksisterende teknisk feilrapportering.

## Global Constraints

- Baseline-revisjonen er commit `129422d97eb126ba6eb983c3329d12c3eb956c35` på `plan/skolestart-klargjoring`.
- Denne planen dekker bare arbeidspakke A. Skolekampens kjente 25/24-feil undersøkes ikke eller rettes her.
- Ingen filer under `src/`, `public/`, `supabase/` eller `vercel.json` skal endres i arbeidspakke A.
- Ingen database-, miljøvariabel-, Supabase- eller Vercel-konfigurasjon skal endres.
- Ingen produksjonsdata, elevnavn, elevsvar, tilgangskoder, cookies, autorisasjonshoder eller request bodies skal lagres i måleartefakter.
- Ingen test skal sende eller fullføre en highscore i produksjon.
- Ingen `git commit`, `git push`, `git merge`, `git rebase`, `git reset` eller endring av `main` utføres uten ny, uttrykkelig godkjenning.
- Måling skjer mot et lokalt produksjonsbygg av baseline-commiten. Vercel og Supabase brukes bare til lesing av eksisterende observasjonsdata.
- Chromium-throttling er en konservativ sammenligningsprofil, ikke en påstand om å emulere en bestemt iPad. Fysisk iPad-test forblir nødvendig.
- Normal målbelastning på 40 elever og kort topp rundt 100 hører til arbeidspakke E. Arbeidspakke A samler enkeltbrukerens request-miks som senere brukes til å lage den belastningstesten, men sender ikke samtidig last.
- Stabilitet og eksisterende funksjonalitet har prioritet foran perfekte måltall eller bred instrumentering.

---

## Avgrensning og kjent utgangspunkt

Følgende er allerede bekreftet i baseline-commiten og styrer hvor vi måler:

- `src/App.jsx` laster `RegnereisenBossreisen` med `React.lazy`.
- `src/regnereisen-bossreisen/RegnereisenBossreisen.jsx` oppretter `ProgressStore`, `HudController` og én Phaser-instans, og kaller `hud.destroy()` og `game.destroy(true)` ved utgang.
- `src/regnereisen-bossreisen/phaser/game.ts` registrerer sju Phaser-scener og globale lyttere for resize, orientering, touch, pageshow og visibility.
- De fire kartene er `bossreisen`, `regneriket`, `tallvokterens-rike` og `regnemonster`.
- `public/` inneholder omtrent 868 MB kildefiler, hvorav `public/regnemester/` er den største gruppen. Dette er ikke det samme som faktisk nettverkslast; baselinen skal finne hvilke filer som virkelig forespørres.
- `template.html` har 50 statiske `<img>`-elementer, og Regnemonster-manifestet beskriver 120 kort. Baselinen skal avgjøre om skjulte bilder eller kort lastes tidligere enn nødvendig.
- Et eksisterende `dist/` viser en separat Regnereisen-del, men eksisterende byggartefakter kan være utdaterte og skal ikke brukes som baseline. Nytt bygg fra den låste commiten er påkrevd.

## Filstruktur

### Filer som opprettes under gjennomføringen

- `scripts/performance/baseline-config.mjs` – profiler, scenario-ID-er, målepunkter, rådataformat og klassifiseringsgrenser.
- `scripts/performance/browser-probe.mjs` – kode som injiseres før appstart og teller lange oppgaver, rAF-gap, aktive timere og observerbare canvas/WebGL-ressurser uten å endre appkoden.
- `scripts/performance/collect-baseline.mjs` – starter Chromium, anvender profil, samler nettverk/ytelse/minne/feil og skriver én sanitert JSON-fil per kjøring.
- `scripts/performance/inventory-build.mjs` – lager inventar over Vite-deler, offentlige ressurser, bildeformater og filstørrelser.
- `scripts/performance/analyze-baseline.mjs` – validerer rådata, beregner median, p75/p95, minnedelta og oppryddingstrend, og lager aggregert rapportdata.
- `tests/performance-baseline.test.mjs` – enhetstester for sanitisering, statistikk, trendklassifisering og scenariooppsett; fanges opp av eksisterende `npm test`.
- `docs/superpowers/reports/skolestart-malegrunnlag-scenario.md` – operativ steg-for-steg-sjekkliste for PC og iPad.
- `docs/superpowers/reports/skolestart-malegrunnlag-baseline.md` – kort beslutningsrapport med funn sortert som kritisk, viktig eller kan vente.
- `docs/superpowers/reports/skolestart-malegrunnlag-baseline.json` – aggregert, personvernkontrollert målegrunnlag som senere arbeidspakker kan sammenligne mot.
- `docs/superpowers/reports/skolestart-malegrunnlag-ipad.md` – fysisk iPad-logg med enhet, iPadOS/Safari, orientering, scenarioresultat og eventuelle Web Inspector-eksporter.

### Filer som endres under gjennomføringen

- `package.json` – legger til tre målekommandoer og eksakt `playwright@1.62.1` som utviklingsavhengighet.
- `package-lock.json` – låser den samme utviklingsavhengigheten.
- `.gitignore` – ignorerer `/artifacts/skolestart-baseline/`, fordi rå trace-, screenshot- og målefiler kan være store.

Playwright er kun måleverktøy. Det importeres ikke av `src/`, tas ikke med i produksjonsbunten og endrer ikke elevappen. Hvis godkjenningen ikke omfatter en ny utviklingsavhengighet, brukes Chrome DevTools manuelt etter samme scenario- og rapportformat, men den automatiske repeterbarheten og CDP-målingene blir svakere. Anbefalingen er derfor å godkjenne den ene, eksakt låste utviklingsavhengigheten.

### Filer som bare leses

- `src/main.jsx`, `src/App.jsx`, `src/errorMonitoring.mjs`
- `src/regnereisen-bossreisen/RegnereisenBossreisen.jsx`
- `src/regnereisen-bossreisen/template.html`
- `src/regnereisen-bossreisen/ui/hud.ts`
- `src/regnereisen-bossreisen/phaser/game.ts`
- `src/regnereisen-bossreisen/phaser/scenes/WorldScene.ts`
- `src/regnereisen-bossreisen/phaser/scenes/FishingScene.ts`
- `src/regnereisen-bossreisen/phaser/scenes/BoatTravelScene.ts`
- `src/regnereisen-bossreisen/phaser/scenes/CrystalCartScene.ts`
- `src/regnereisen-bossreisen/phaser/scenes/SwampAlchemyScene.ts`
- `src/regnereisen-bossreisen/phaser/scenes/LightForestScene.ts`
- `src/regnereisen-bossreisen/phaser/scenes/CounterweightVaultScene.ts`
- `src/regnereisen-bossreisen/game/content/maps.ts`
- `src/regnereisen-bossreisen/game/content/regnemonsterCardManifest.generated.json`
- `src/regnereisen-bossreisen/game/simulation/progress.ts`
- `dist/.vite/manifest.json` og `dist/assets/*` fra det nye baseline-bygget

## Måleprofiler

Begge Chromium-profiler bruker 1024 × 768 CSS-piksler, device scale factor 2 og touch aktivert, slik at layout og touchgrener ligner en iPad i liggende retning.

| Profil | CPU | Nettverk | Formål |
|---|---:|---:|---|
| `tablet-native` | 1× | Ingen kunstig begrensning | Stabil, lokal referanse på test-PC |
| `tablet-conservative` | 4× slowdown | 150 ms RTT, 4 Mbit/s ned, 1 Mbit/s opp | Stressprofil for en svakere skole-iPad og travlere Wi‑Fi |

Chrome-throttling er relativ til test-PC-en og kan ikke kopiere iPad-CPU, Safari/WebKit eller GPU. Profilnavn, vertsmaskin, Node-, Playwright- og Chromium-versjon lagres i hver kjøring, så senere målinger ikke sammenlignes på tvers av ulike miljøer uten merknad.

## Måleverdier og definisjoner

Hver kjøring skal lagre følgende:

- **Nettverk:** request-antall, `encodedDataLength`, cache-hit, status, MIME-type, initiator og URL uten query/hash; summer per JavaScript, bilde, font, API og annet.
- **Lasting:** navigation start, TTFB, FCP, LCP der den finnes, og scenarioets egne `visible`- og `playable`-målepunkter.
- **Spillbar:** riktig skjerm/HUD er synlig, canvas er opprettet når scenarioet krever det, og ett ufarlig trykk eller én bevegelse blir behandlet. Bare synlig canvas er ikke nok.
- **Hovedtråd/bildeflyt:** antall long tasks over 50 ms, største long task, total blocking time som summen av delen over 50 ms, rAF-gap p75/p95/maks, antall gap over 50 og 100 ms.
- **Minne:** naturlig `JSHeapUsedSize`, heap etter eksplisitt GC ved kontrollerte sammenligningspunkter, DOM-noder, dokumenter og JS event listeners fra CDP, samt observerte canvas, WebGL-contexts, aktive timeouts, intervaller og rAF-callbacks.
- **Bilde-/grafikkbudsjett:** overførte bildebytes og et øvre RGBA-estimat `bredde × høyde × 4` for unike lastede bilder. Dette merkes som estimat; fysisk Safari Web Inspector brukes for Images/Layers når Mac er tilgjengelig.
- **Phaser-instansproxy:** antall tilkoblede Phaser-canvas og aktive WebGL-contexts. For dagens arkitektur forventes én mens Regnereisen er åpen og null etter full utgang. Eksakt telling av Phaser-objekter krever en app-hook og er ikke tillatt i arbeidspakke A.
- **Opprydding:** delta fra målepunkt før Regnereisen til 2 og 10 sekunder etter utgang, og trend gjennom fem runder etter at første runde er behandlet som oppvarming.
- **Feil:** `console.error`, uncaught page errors, unhandled rejections, failed requests og eksisterende tekniske feilrapporter. Request body, elevdata og hemmelige headere lagres aldri.

## Foreløpige vurderingsregler

Disse reglene prioriterer undersøkelser; de er ikke nye produktkrav:

- **Kritisk:** krasj, tvungen refresh, fastlåst input, mer enn én samtidig Phaser-canvas, canvas/WebGL som fortsatt finnes etter utgang, Regnereisen-kart/kort på kald hovedside, eller klar vekst i lyttere/timere/canvas for hver av fem runder.
- **Sannsynlig minnelekkasje:** rundene 2–5 vokser i samme retning og heap etter GC ender mer enn både 15 % og 10 MB over rundens start, eller objekt-/lytter-/timerantall vokser monotont. Heap alene skal ikke kalles lekkasje uten trend eller retainer-bevis.
- **Viktig:** stor tidlig ressurslast uten funksjonell grunn, `playable` over 8 sekunder i konservativ profil, gjentatte rAF-gap over 100 ms under vanlig navigasjon, eller tydelig høy topp i Images/Layers/heap som faller dårlig etter utgang.
- **Kan vente:** enkeltstående støy, varm-cache-avvik, liten ikke-vedvarende heapvekst eller hakking uten inputtap på test-iPaden. Labyrinten løftes bare hvis målingen viser reell spillbarhetsrisiko på svak profil eller fysisk enhet.

Alle grenser vises sammen med råtall, antall repetisjoner og usikkerhet. En funnklassifisering skal aldri bygge på én avvikende kjøring alene med mindre den gir krasj eller funksjonssvikt.

---

### Task 1: Lås revisjon, miljø og nullpunkt

**Files:**
- Create: `docs/superpowers/reports/skolestart-malegrunnlag-scenario.md`
- Read: `package.json`, `package-lock.json`, `AGENTS.md`

**Interfaces:**
- Consumes: Git-revisjon `129422d97eb126ba6eb983c3329d12c3eb956c35` og de globale rammene ovenfor.
- Produces: En miljøblokk som alle råkjøringer refererer til: commit, gren, dirty status, OS, CPU/RAM, Node/npm, testbrowser og dato.

- [ ] **Step 1: Bekreft at riktig commit måles uten å bytte gren**

Run:

```powershell
git rev-parse HEAD
git branch --show-current
git status --short
```

Expected: HEAD er `129422d97eb126ba6eb983c3329d12c3eb956c35`, grenen er `plan/skolestart-klargjoring`, eksisterende `.codex/` behandles som brukerens urørte fil, og dette plandokumentet er den eneste oppgavefilen som finnes før gjennomføringen.

- [ ] **Step 2: Registrer verktøy- og maskinversjoner**

Run:

```powershell
node --version
npm.cmd --version
Get-CimInstance Win32_OperatingSystem | Select-Object Caption, Version, OSArchitecture, TotalVisibleMemorySize
Get-CimInstance Win32_Processor | Select-Object Name, NumberOfCores, NumberOfLogicalProcessors
```

Expected: Node oppfyller `>=22.12.0 <25`; resultatene kopieres inn i scenariofilens miljøblokk.

- [ ] **Step 3: Installer nøyaktig den godkjente måleavhengigheten**

Run:

```powershell
npm.cmd install --save-dev --save-exact playwright@1.62.1
npx.cmd playwright install chromium
```

Expected: bare `package.json`, `package-lock.json` og Playwrights lokale browsercache endres; `npm.cmd ls playwright --depth=0` viser `playwright@1.62.1`.

- [ ] **Step 4: Kjør dagens tester og produksjonsbygg før måling**

Run:

```powershell
npm.cmd test
npm.cmd run typecheck:regnereisen
npm.cmd run build -- --manifest
```

Expected: alle tester, typekontroll og bygg består. Alle advarsler og feil føres i scenariofilen før videre måling. Et mislykket bygg stopper baselinen fordi målinger av et annet bygg ikke er sammenlignbare.

- [ ] **Step 5: Dokumenter at Task 1 ikke har endret appen**

Run:

```powershell
git diff -- src public supabase vercel.json
git status --short
```

Expected: ingen diff i app-, ressurs-, Supabase- eller Vercel-filer.

### Task 2: Lag og test målekontrakten

**Files:**
- Create: `scripts/performance/baseline-config.mjs`
- Create: `scripts/performance/analyze-baseline.mjs`
- Create: `tests/performance-baseline.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces: `PROFILES`, `SCENARIOS`, `sanitizeUrl(url)`, `median(values)`, `percentile(values, p)` og `classifyCleanupTrend(checkpoints)`.
- Produces: `BaselineRun`-format med toppnivåfeltene `metadata`, `scenario`, `checkpoints`, `network`, `mainThread`, `memory` og `errors`.

- [ ] **Step 1: Skriv tester for statistikk og URL-sanitising**

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  classifyCleanupTrend,
  median,
  percentile,
  sanitizeUrl
} from '../scripts/performance/analyze-baseline.mjs';

test('sanitiserer query og hash fra ressurs-URL', () => {
  assert.equal(
    sanitizeUrl('https://example.test/app.js?token=secret#part'),
    'https://example.test/app.js'
  );
});

test('beregner median og p95 deterministisk', () => {
  assert.equal(median([1, 3, 2]), 2);
  assert.equal(percentile([1, 2, 3, 4, 5], 0.95), 5);
});

test('markerer vedvarende heap- og lyttervekst etter oppvarming', () => {
  const result = classifyCleanupTrend([
    { round: 1, heapAfterGc: 80_000_000, listeners: 30 },
    { round: 2, heapAfterGc: 82_000_000, listeners: 31 },
    { round: 3, heapAfterGc: 87_000_000, listeners: 32 },
    { round: 4, heapAfterGc: 93_000_000, listeners: 33 },
    { round: 5, heapAfterGc: 99_000_000, listeners: 34 }
  ]);
  assert.equal(result.suspectedLeak, true);
  assert.deepEqual(result.reasons.sort(), ['heap-growth', 'listener-growth']);
});
```

- [ ] **Step 2: Kjør testen og bekreft forventet feil**

Run:

```powershell
node --test tests/performance-baseline.test.mjs
```

Expected: FAIL fordi analysemodulen ikke finnes ennå.

- [ ] **Step 3: Implementer konfigurasjonen med eksakte profiler og scenario-ID-er**

`baseline-config.mjs` skal eksportere:

```js
export const BASELINE_COMMIT = '129422d97eb126ba6eb983c3329d12c3eb956c35';

export const PROFILES = {
  'tablet-native': {
    viewport: { width: 1024, height: 768 },
    deviceScaleFactor: 2,
    hasTouch: true,
    cpuRate: 1,
    network: null
  },
  'tablet-conservative': {
    viewport: { width: 1024, height: 768 },
    deviceScaleFactor: 2,
    hasTouch: true,
    cpuRate: 4,
    network: {
      latency: 150,
      downloadThroughput: 500_000,
      uploadThroughput: 125_000
    }
  }
};

export const SCENARIO_IDS = [
  'A01-cold-home',
  'A02-normal-without-regnereisen',
  'A03-school-without-regnereisen',
  'A04-first-regnereisen-open',
  'A05-map-bossreisen',
  'A05-map-regneriket',
  'A05-map-tallvokterens-rike',
  'A05-map-regnemonster',
  'A06-heavy-scenes-and-binder',
  'A07-five-entry-exit-rounds',
  'A08-thirty-minute-session'
];
```

CDP throughput bruker bytes per sekund; verdiene over tilsvarer 4 Mbit/s ned og 1 Mbit/s opp.

- [ ] **Step 4: Implementer analysefunksjonene og skjema-valideringen**

`classifyCleanupTrend` skal ignorere runde 1 som oppvarming, kreve monotont stigende trend i rundene 2–5, og bare markere `heap-growth` når siste heap er mer enn både 15 % og 10 MB over runde 2. `listener-growth`, `timer-growth`, `canvas-growth` og `webgl-growth` markeres separat ved monotont stigende antall.

- [ ] **Step 5: Legg til målekommandoer uten å endre eksisterende kommandoer**

```json
{
  "perf:inventory": "node scripts/performance/inventory-build.mjs",
  "perf:capture": "node scripts/performance/collect-baseline.mjs",
  "perf:report": "node scripts/performance/analyze-baseline.mjs --write-report"
}
```

- [ ] **Step 6: Kjør testen på nytt**

Run:

```powershell
node --test tests/performance-baseline.test.mjs
npm.cmd test
```

Expected: ny test og hele eksisterende testsuite består.

### Task 3: Lag statisk ressurs- og bygginventar

**Files:**
- Create: `scripts/performance/inventory-build.mjs`
- Create: `artifacts/skolestart-baseline/baseline-129422d/inventory.json` ved kjøring
- Modify: `.gitignore`

**Interfaces:**
- Consumes: `dist/.vite/manifest.json`, `dist/assets/*`, `public/**/*` og Regnemonster-kortmanifestet.
- Produces: `inventory.json` med `buildChunks`, `publicAssets`, `largestAssets`, `duplicateHashes`, `cardCounts` og `staticTemplateImages`.

- [ ] **Step 1: Ignorer kun rå baselineartefakter**

Legg til nøyaktig denne linjen i `.gitignore`:

```gitignore
/artifacts/skolestart-baseline/
```

- [ ] **Step 2: Implementer inventarscriptet med Node-standardbiblioteket**

Scriptet skal:

1. feile dersom `git rev-parse HEAD` ikke matcher baseline-commiten;
2. lese Vite-manifestet og summere hver entry/dynamic chunk med CSS og imports;
3. gå gjennom `public/` uten å lese `.env` eller andre mapper;
4. gruppere filantall og bytes per toppmappe og filtype;
5. SHA-256-hashe filer for å finne duplikater uten å endre dem;
6. telle 100 ordinære og 20 spesielle Regnemonster-kort fra manifestet;
7. telle statiske `<img src>` i `template.html`;
8. skrive sanitert JSON under den ignorerte artifact-mappen.

- [ ] **Step 3: Kjør nytt produksjonsbygg og inventar**

Run:

```powershell
npm.cmd run build -- --manifest
npm.cmd run perf:inventory -- --run-id baseline-129422d
```

Expected: inventaret peker på det nybygde `dist/`, viser egen Regnereisen-del og gir eksakte byteverdier. Ingen filstørrelse alene klassifiseres som et problem før request-målingene viser at filen lastes i et relevant scenario.

- [ ] **Step 4: Kontroller at inventaret er read-only mot appressursene**

Run:

```powershell
git diff -- src public supabase vercel.json
```

Expected: tom diff.

### Task 4: Bygg en observasjonsprobe uten app-hook

**Files:**
- Create: `scripts/performance/browser-probe.mjs`
- Test: `tests/performance-baseline.test.mjs`

**Interfaces:**
- Produces i browsersiden: `window.__regnemesterBaseline.snapshot(label)` og `window.__regnemesterBaseline.finish()`.
- Consumes i collector: snapshots med `longTasks`, `rafGaps`, `activeTimeouts`, `activeIntervals`, `activeRafs`, `canvasCount` og `webglContextCount`.

- [ ] **Step 1: Skriv en test som krever at proben ikke lagrer innhold eller identitet**

Testen leser `browser-probe.mjs` som tekst og avviser strengene `request.postData`, `authorization`, `cookie`, `localStorage.getItem` og `input.value`. Den tillater bare aggregerte tellere og tidsverdier.

- [ ] **Step 2: Kjør testen og bekreft forventet feil**

Run:

```powershell
node --test tests/performance-baseline.test.mjs
```

Expected: FAIL fordi proben ikke finnes.

- [ ] **Step 3: Implementer proben som et `page.addInitScript`-payload**

Proben skal installeres før appens JavaScript og:

- bruke `PerformanceObserver` for `longtask`, `paint` og `largest-contentful-paint` når typen støttes;
- sample `requestAnimationFrame` og lagre bare gap-varigheter;
- wrappe `setTimeout`, `clearTimeout`, `setInterval`, `clearInterval`, `requestAnimationFrame` og `cancelAnimationFrame` slik at originale handle-verdier og argumenter bevares;
- wrappe `HTMLCanvasElement.prototype.getContext`, bruke `WeakMap` for å merke canvas som har WebGL/WebGL2-context, og telle bare merkede canvas som fortsatt er tilkoblet DOM-en; dette holder ikke fjernede canvas kunstig i live;
- telle bare tilkoblede `canvas` ved snapshot;
- returnere kopier av måledata og aldri DOM-tekst, inputverdier, lagret progresjon eller request-innhold;
- fjerne observatører og avslutte rAF-samplingen i `finish()`.

- [ ] **Step 4: Kjør testene**

Run:

```powershell
node --test tests/performance-baseline.test.mjs
npm.cmd test
```

Expected: PASS.

### Task 5: Bygg den repeterbare Chromium/CDP-innsamleren

**Files:**
- Create: `scripts/performance/collect-baseline.mjs`
- Test: `tests/performance-baseline.test.mjs`

**Interfaces:**
- CLI-eksempel: `npm.cmd run perf:capture -- --scenario A01-cold-home --profile tablet-native --base-url http://127.0.0.1:4173 --repeat 3`.
- Produces: `run-01.json`, `run-02.json` og `run-03.json` under `artifacts/skolestart-baseline/baseline-129422d/runs/A01-cold-home/tablet-native/` for eksemplet ovenfor.

- [ ] **Step 1: Skriv valideringstester for CLI og rådataformat**

Testene skal avvise ukjent scenario/profil, manglende base URL og output som mangler commit, profil, browser-versjon, nettverksoppsummering, minnesnapshots eller feil-liste.

- [ ] **Step 2: Implementer en ny, isolert browser context per kald kjøring**

Collector skal bruke `chromium.launch({ headless: false })` og `browser.newContext` med profilens viewport, DPR og touch. En kald kjøring får ny context og tom cache/storage; en varm kjøring gjenbruker samme context etter første fullførte scenario. Context lukkes eksplisitt før browseren, slik at artefakter flushes korrekt.

- [ ] **Step 3: Implementer CDP-målingene**

Bruk `context.newCDPSession(page)` og følgende protokollområder:

- `Network.enable`, `Network.emulateNetworkConditions` og `Network.loadingFinished` for bytes/cache/status;
- `Emulation.setCPUThrottlingRate` for konservativ profil;
- `Performance.enable` og `Performance.getMetrics` for heap og prosessmålinger;
- `Memory.getDOMCounters` for dokumenter, DOM-noder og JS event listeners;
- `HeapProfiler.enable` og `HeapProfiler.collectGarbage` bare ved markerte sammenligningspunkter;
- `Runtime.evaluate` og `DOMDebugger.getEventListeners` på `window`, `document` og `visualViewport` for kjente globale lyttere.

URL-er skal passere `sanitizeUrl`; request-/response-body, cookies og autorisasjonshoder skal aldri leses eller skrives.

- [ ] **Step 4: Samle tekniske feil uten å utløse kunstige feil**

Lytt på `page.on('console')`, `page.on('pageerror')`, `page.on('requestfailed')` og `unhandledrejection` via init-script. Lagre feilkategori, sanitert melding, ressurs-URL uten query og tidspunkt. Ikke kopier elevdata eller stack-URL-query.

- [ ] **Step 5: Gjør målepunktene eksplisitte**

Collector skal ta snapshots ved:

1. `before-navigation`;
2. `home-visible`;
3. `before-open`;
4. `screen-visible`;
5. `playable`;
6. `peak-observed`;
7. `before-exit`;
8. `after-exit-2s`;
9. `after-exit-10s`;
10. `after-explicit-gc`.

DOM-baserte `visible`-punkter kan automatiseres. `playable` markeres først etter at et ufarlig brukerinput har gitt forventet respons; for canvas-scenene følger Codex den operative scenariofilen og bekrefter målepunktet i collectorens terminalprompt.

- [ ] **Step 6: Legg bare trace ved avvik**

Standardkjøringer lagrer den kompakte JSON-en og screenshots ved målepunktene. Hvis en kjøring krasjer, har fastlåst input, long task over 500 ms eller cleanup-regelen slår ut, gjentas den én gang med Chrome Performance trace og heap snapshot. Disse råfilene blir i ignorert artifact-mappe og oppsummeres, ikke sjekkes inn.

- [ ] **Step 7: Kjør collectorens enhetstester og en kort smoke**

Run:

```powershell
node --test tests/performance-baseline.test.mjs
npm.cmd run preview -- --host 127.0.0.1 --port 4173 --strictPort
```

I en ny terminal:

```powershell
npm.cmd run perf:capture -- --scenario A01-cold-home --profile tablet-native --base-url http://127.0.0.1:4173 --repeat 1
```

Expected: én fullstendig `run.json`, ingen Regnereisen-interaksjon, ingen appkodeendring og ingen sensitive felt.

### Task 6: Lås den operative scenariomatrisen

**Files:**
- Modify: `docs/superpowers/reports/skolestart-malegrunnlag-scenario.md`
- Read: kart-, HUD-, scene- og progresjonsfilene listet ovenfor.

**Interfaces:**
- Produces: nøyaktig navigasjonsrekkefølge, starttilstand, målepunkter og forventet sluttstatus for hver scenario-ID.

- [ ] **Step 1: Definer felles regler for alle scenarioer**

Scenariofilen skal kreve:

- testnavn som `Baseline Elev`, aldri et virkelig elevnavn;
- ingen highscore-innsending og ingen administrasjonsflyt;
- samme orientering, viewport, profil og commit per sammenligning;
- skjermbilde ved `screen-visible`, `playable` og `after-exit-10s`;
- kald context for første lasting, samme context for varm andre åpning;
- én normal repetisjon av alle tunge stier, tre repetisjoner av kald hovedside og første Regnereisen-åpning per profil, og ny repetisjon av alle avvik;
- ingen sletting eller overskriving av brukerens virkelige iPad-progresjon.

- [ ] **Step 2: Beskriv scenario A01–A04**

| ID | Handling | Krav til måling |
|---|---|---|
| A01 | Kald åpning av hovedappen | Hovedvalg synlig; null Regnereisen-kart, kortbilder eller Regnereisen-del før klikk |
| A02 | Åpne Normal, start en ufarlig lokal runde, svar én gang, gå hjem | Ingen Regnereisen-ressurser; input virker; ingen score sendes |
| A03 | Åpne Skolekampen til spillskjermen og gå ut før resultat | Ingen Regnereisen-ressurser; bare nettverkslesing registreres; 25/24-grensen testes ikke |
| A04 | Første åpning av Regnereisen og første spillbare kartmeny | Separat JS-del, HTML-bilder og Phaser-ressurser listes; synlig og spillbar tid skilles |

- [ ] **Step 3: Beskriv alle tilgjengelige kart i A05**

Hvert kart kjøres i egen, kald context med samme syntetiske testprogresjon:

1. Boss-reisen (`bossreisen`)
2. Regneriket (`regneriket`)
3. Tallvokterens verden (`tallvokterens-rike`)
4. Regnemonster (`regnemonster`)

For hvert kart måles første og andre åpning, alle nye JS-/bilde-URL-er, transfer/cache, tid til synlig/spillbar, minnetopp og exit til Regnereisen-meny. Det rapporteres eksplisitt hvis ressurser for de tre andre kartene allerede er lastet.

- [ ] **Step 4: Lag isolert testprogresjon uten å bygge testknapper inn i appen**

Start Vite dev på `127.0.0.1:4173`, bruk eksisterende localhost-beskyttede `Test seier`-kontroller til å åpne nødvendige steder, og eksporter bare verdien til `regnemester-bossreisen-progress` fra den isolerte Playwright-contexten. Lagre snapshotet i den ignorerte artifact-mappen, valider at `ProgressStore` kan laste det uten feil, og injiser samme snapshot før produksjons-preview lastes. Snapshotet inneholder ingen navn, svar, Supabase-data eller tilgangskoder og sjekkes ikke inn.

- [ ] **Step 5: Beskriv tunge minispill og samleperm i A06**

Mål minst disse eksisterende stiene separat:

- Fiske (`FishingScene`)
- Båtreise (`BoatTravelScene`)
- Krystallvognen (`CrystalCartScene`)
- Sumpalkymi (`SwampAlchemyScene`)
- Lysskogen (`LightForestScene`)
- Motvektshvelvet (`CounterweightVaultScene`)
- Labyrinten i Tallvokterens verden
- Regnemonster-samlepermen, først lukket, deretter første side, sideskift og lukking

For samlepermen telles spesielt om thumbnails, fullbilder, kortbakgrunner for `set1` og `special`, eller alle 120 kort lastes. For hvert minispill måles før åpning, spillbar, topp, rett etter lukking og 10 sekunder etter lukking.

- [ ] **Step 6: Beskriv fem-runders cleanup-scenario A07**

Kjør fem ganger:

`hovedside → Regnereisen → valgt kart → valgt tung scene → ut av scene → ut av Regnereisen → hovedside`.

Deterministisk scenevalg: bruk scenen med størst `peak-observed` minne i A06; ved likt resultat brukes størst bilde-transfer, deretter alfabetisk scenario-ID. Kjør i tillegg fem åpne/lukke-runder av samlepermen fordi kortressursene har en annen livsløpstype enn Phaser-scenene.

Forventet sluttstatus per runde: null Regnereisen-canvas, null aktive WebGL-contexts knyttet til fjernede canvas, og globale lyttere/timere tilbake til før-åpning-nivå etter 10 sekunder. Heap vurderes med trendregelen, ikke med krav om identisk byteverdi.

- [ ] **Step 7: Beskriv 30-minutters scenario A08**

Den 30 minutter lange økten skal inneholde:

- 0–5 min: kald appstart, Regnereisen og første kart;
- 5–15 min: to tunge scener og minst ett kartbytte;
- 15–20 min: samleperm med ti sideskift frem/tilbake;
- 20–25 min: tre raske dobbelttrykk på navigasjonselementer, én avbrutt drag/touch, bakgrunn i 10 sekunder og retur;
- 25–30 min: rotasjon liggende → stående → liggende, ny scene, full utgang til hovedside.

Snapshot tas hvert femte minutt og etter hver bakgrunn/rotasjon. Funksjonelle observasjoner er: input responderer, ingen dobbel canvas, ingen svart skjerm, tilbakeknapp virker, og Safari/Chromium trenger ikke refresh.

### Task 7: Kjør desktop-baseline i begge profiler

**Files:**
- Create: `artifacts/skolestart-baseline/baseline-129422d/runs/*` ved kjøring
- Read: lokalt produksjonsbygg

**Interfaces:**
- Consumes: collector, inventar og scenariofil.
- Produces: komplett rådatasett for A01–A08 i `tablet-native` og `tablet-conservative`.

- [ ] **Step 1: Start riktig produksjons-preview**

Run:

```powershell
npm.cmd run build -- --manifest
npm.cmd run preview -- --host 127.0.0.1 --port 4173 --strictPort
```

Expected: HTTP 200 på `http://127.0.0.1:4173/`; serverloggen og HEAD lagres i run-metadata.

- [ ] **Step 2: Kjør kald hovedside og første Regnereisen tre ganger per profil**

Run for hver profil:

```powershell
npm.cmd run perf:capture -- --scenario A01-cold-home --profile tablet-native --base-url http://127.0.0.1:4173 --repeat 3
npm.cmd run perf:capture -- --scenario A04-first-regnereisen-open --profile tablet-native --base-url http://127.0.0.1:4173 --repeat 3
npm.cmd run perf:capture -- --scenario A01-cold-home --profile tablet-conservative --base-url http://127.0.0.1:4173 --repeat 3
npm.cmd run perf:capture -- --scenario A04-first-regnereisen-open --profile tablet-conservative --base-url http://127.0.0.1:4173 --repeat 3
```

Expected: rapporten bruker median og viser min/maks; enkeltutliggere merkes.

- [ ] **Step 3: Kjør A02, A03 og alle fire A05-kart per profil**

Kjør én full repetisjon av hvert scenario i hver profil. Gjenta scenarioet dersom feil, resource-differanse over 10 %, playable-differanse over 20 % eller krasj observeres.

- [ ] **Step 4: Kjør alle A06-stier og lag request-matrisen**

For hver sti: list ressurser som først dukker opp ved scenen, ressurser som kom for tidlig, cache ved andre åpning og bildetall/bytes. Request-matrisen blir senere inngang til arbeidspakke E, men multipliseres ikke med 40/100 som et løfte om kapasitet.

- [ ] **Step 5: Kjør A07 og A08 med checkpoints**

A07 kjøres i begge profiler. A08 kjøres minst i `tablet-native`, og i konservativ profil hvis 30-minutterskjøringen ikke gjør måleinstrumentet selv ustabilt. Instrumenteringskostnad måles med ett kort scenario med proben av og på; avvik over 10 % i playable-tid merkes i rapporten.

- [ ] **Step 6: Ta målrettet trace bare ved reproduserte avvik**

Ved reprodusert feil: lag Chrome Performance trace med Memory aktivert, noter nøyaktig målepunkt og behold trace lokalt. Ved minnemistanke: ta heap snapshots etter runde 2 og 5 og sammenlign retainers. Ingen app-endring foreslås i denne tasken.

### Task 8: Kjør fysisk iPad-kontroll og dokumenter begrensningene

**Files:**
- Create: `docs/superpowers/reports/skolestart-malegrunnlag-ipad.md`
- Create: lokal Web Inspector-export utenfor Git dersom Mac finnes

**Interfaces:**
- Produces: fysisk verifikasjon av iPad-input, bakgrunn/retur, rotasjon, langøkt og observerbar minne-/CPU-utvikling.

- [ ] **Step 1: Registrer enheten uten personopplysninger**

Noter iPad-modell, modellår hvis kjent, iPadOS-versjon, Safari-versjon, ledig lagring, batteri/strømtilstand, orientering og om dette er brukerens test-iPad eller skolens svakere modell. Ikke noter serienummer, Apple-ID eller elevdata.

- [ ] **Step 2: Server samme baseline-bygg over lokalt nett**

Run:

```powershell
npm.cmd run preview -- --host 0.0.0.0 --port 4173 --strictPort
```

Finn test-PC-ens IPv4-adresse med `ipconfig`, noter den valgte adressen i iPad-loggen, og åpne URL-en som består av `http://`, den noterte IPv4-adressen og `:4173/` i Safari. Dette tester samme commit, men lokal nettlevering er ikke lik Vercel CDN; forskjellen skal stå i rapporten.

- [ ] **Step 3: Kjør A01, A04, alle tilgjengelige A05-kart, valgt A06-scene, A07 og A08**

Bruk normal UI og eksisterende progresjon i en isolert Safari-fane. Ikke nullstill brukerens lagrede progresjon. Hvis et kart ikke er tilgjengelig uten å endre reell progresjon, dokumenteres det som fysisk dekning som mangler; desktop-baselinen dekker fortsatt kartets tekniske målinger.

- [ ] **Step 4: Mål fysisk Safari med Web Inspector hvis en Mac er tilgjengelig**

Aktiver Web Inspector på iPad, koble den til en Mac, og ta Safari Timelines-opptak med Network, CPU, Memory, JavaScript Allocations og Frames for A04, A07 og A08. Eksporter opptak lokalt. Registrer JavaScript-, Images-, Layers- og Page-minne ved start, topp og etter exit.

- [ ] **Step 5: Bruk ærlig fallback hvis Mac ikke er tilgjengelig**

Uten Mac kan Windows ikke hente Safari Web Inspector-heap fra iPad på en støttet måte. Da registreres skjermopptak/stoppeklokke, synlig/spillbar tid, hakking, inputtap, svart skjerm, refresh, bakgrunn/retur og rotasjon. Rapporten skal si `direkte Safari-minnemåling ikke utført – Mac manglet`; Chrome-tall skal ikke omtales som iPad-minne.

- [ ] **Step 6: Skill test-iPad fra skole-iPad**

Bestått test på brukerens iPad dokumenteres som nødvendig, men ikke tilstrekkelig. Hvis skolens modell blir kjent innen 14 dager, gjentas A04, A07 og minst 30 minutter A08 på den svakeste tilgjengelige skole-iPaden før Port 3.

### Task 9: Hent eksisterende feltdata og tekniske feil read-only

**Files:**
- Modify: `docs/superpowers/reports/skolestart-malegrunnlag-baseline.md`
- Read only: Vercel Speed Insights og eksisterende privat teknisk feilrapportering

**Interfaces:**
- Produces: kontekstdata som støtter eller motsier labmålingene, tydelig merket med periode og sample count.

- [ ] **Step 1: Hent Speed Insights uten å endre innstillinger**

Hent mobil P75 og P90 for FCP, LCP, INP, CLS og TTFB for siste 7 og 30 dager, med antall datapunkter og deploy/commit hvis tilgjengelig. Bruk Vercel dashboard eller autentisert `vercel metrics`. Hvis sample count er for lav, skriv `utilstrekkelig feltgrunnlag` i stedet for å trekke konklusjon.

- [ ] **Step 2: Forklar begrensningen ved SPA-data**

Speed Insights ved hard navigation kan beskrive hovedappens start og virkelige brukere, men skiller ikke nødvendigvis Normal, Skolekampen og interne Regnereisen-scener. Det brukes som støtte, ikke erstatning for scenarioenes egne `visible`/`playable`-målinger.

- [ ] **Step 3: Les eksisterende tekniske feil for baselineperioden**

Filtrer på teknisk kategori, modus, skjerm, browserfamilie og tidspunkt. Rapporter antall og teknisk mønster, ikke navn, svar, score, e-post eller andre elevdata. Ikke endre tabeller, retention, Edge Functions eller feilsamplingsgrad.

- [ ] **Step 4: Kryssjekk bare reproduserbare mønstre**

En feltfeil klassifiseres kritisk/viktig først når den enten er funksjonelt alvorlig alene eller kan knyttes til et scenario, en stack uten sensitive data eller en repeterbar lokal observasjon.

### Task 10: Generer baseline-rapport og Port 1-beslutning

**Files:**
- Create: `docs/superpowers/reports/skolestart-malegrunnlag-baseline.md`
- Create: `docs/superpowers/reports/skolestart-malegrunnlag-baseline.json`
- Modify: `docs/superpowers/reports/skolestart-malegrunnlag-scenario.md`
- Modify: `docs/superpowers/reports/skolestart-malegrunnlag-ipad.md`

**Interfaces:**
- Consumes: inventar, alle gyldige run-filer, fysisk iPad-logg og read-only feltdata.
- Produces: godkjenningsgrunnlag for Port 1 og avgrenset kandidatlist for arbeidspakke B/C.

- [ ] **Step 1: Valider at minimumsdekningen er komplett**

Rapportgeneratoren skal feile hvis følgende mangler:

- tre A01- og tre A04-kjøringer per profil;
- A02 og A03 uten Regnereisen;
- første og andre åpning av alle fire kart;
- alle listede A06-stier;
- fem komplette A07-runder;
- én 30-minutters A08-økt;
- fysisk iPad-resultat eller eksplisitt dokumentert fysisk blocker;
- commit, profil og browser-/enhetsversjon for alle tall.

- [ ] **Step 2: Generer den aggregerte JSON-filen**

Den varige JSON-filen inneholder bare:

```json
{
  "baselineCommit": "129422d97eb126ba6eb983c3329d12c3eb956c35",
  "environments": [],
  "scenarios": [],
  "loadingBoundary": {},
  "cleanupTrend": {},
  "fieldContext": {},
  "findings": []
}
```

`scenarios` inneholder aggregater og ressurs-URL-er uten query; ingen rå trace, input, cookies, headers eller request bodies.

- [ ] **Step 3: Skriv beslutningsrapporten i fast format**

Rapporten skal ha disse delene:

1. **Kort konklusjon** – hva som er trygt, hva som er usikkert, og om Port 1 kan godkjennes.
2. **Miljø og metode** – commit, profiler, repetisjoner, fysisk enhet og målebegrensninger.
3. **Lasting** – tabell per scenario med requests, MB, JS, bilder, visible og playable.
4. **Regnereisen-grenser** – hva som lastes før Regnereisen, ved første åpning, per kart og i samlepermen.
5. **Ytelse** – long tasks, TBT, rAF-gap og observerbar hakking/input.
6. **Minne og opprydding** – start/topp/exit/GC, fem-runders trend, canvas/WebGL, lyttere og timere.
7. **Fysisk iPad og feltdata** – hva som faktisk ble målt på Safari, og hva som bare er Chromium-estimat.
8. **Funn** – ID, alvorlighet, evidens, berørte scenarioer, sannsynlig område, anbefalt neste lille undersøkelse/endring.
9. **Kan vente** – dokumenterte observasjoner som ikke truer skolestart.
10. **Port 1** – `godkjenn`, `godkjenn med vilkår` eller `ikke godkjenn`, med konkrete vilkår.

- [ ] **Step 4: Klassifiser uten å foreskrive stor omskriving**

Hvert funn peker på den minste sannsynlige endringsflaten, men arbeidspakke A implementerer ingenting. Hvis et funn ser ut til å kreve bred React-/Phaser-arkitekturendring, anbefales utsettelse til etter skolestart med mindre funnet er kritisk.

- [ ] **Step 5: Kjør komplett validering etter måleverktøyene**

Run:

```powershell
npm.cmd test
npm.cmd run typecheck:regnereisen
npm.cmd run build
git diff --check
git diff -- src public supabase vercel.json
git status --short
```

Expected: tester, typekontroll og bygg består; eventuelle advarsler rapporteres; ingen app-, ressurs-, Supabase- eller Vercel-diff finnes. Bare godkjente måleverktøy, rapporter, `package.json`, `package-lock.json` og `.gitignore` kan være endret.

- [ ] **Step 6: Stopp ved Port 1 og be om prioriteringsgodkjenning**

Presenter kritisk/viktig/kan vente med konkrete tall. Ikke start arbeidspakke B, C, D eller E; ikke commit, push, merge eller endre `main`. Brukeren skal godkjenne både prioriteringen og neste avgrensede kodeplan.

## Estimert tidsbruk innen 14-dagersvinduet

- Dag 1: Task 1–5, verktøy og smoke.
- Dag 2: Task 6–7, statisk inventar og desktop-scenarioer.
- Dag 3: A07/A08, fysisk iPad, feltdata og rapport/Port 1.

Planen bruker dermed de avsatte dagene 1–3 til målegrunnlaget og lar dag 4–14 stå urørt til Port 1 er godkjent.

## Selvkontroll mot designet

- Alle sju scenariokategorier fra arbeidspakke A er dekket av A01–A08.
- Lasting, nettverk, JS, bilder, visible/playable, long tasks, bildeflyt, minne, globale lyttere, spillinstansproxy og tekniske feil har eksplisitte målemetoder.
- Både ubegrenset og konservativ profil er definert med eksakte verdier og begrensninger.
- Fysisk iPad, Safari-bakgrunn/retur og rotasjon er med, med ærlig Mac/Web Inspector-avhengighet.
- 40/100 er bevart som mål for senere arbeidspakke E uten risikabel produksjonsbelastning i A.
- Skolekampens 25/24-feil, appoptimalisering, nye funksjoner og arkitekturomskriving er eksplisitt utenfor planen.
- Ingen appkode, produksjonsoppsett, database eller `main` skal endres.
- Rapporten avsluttes ved Port 1 og krever brukerens godkjenning før kodeoptimalisering.
