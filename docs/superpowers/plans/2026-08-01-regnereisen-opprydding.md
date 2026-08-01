# Regnereisen-opprydding – Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stanse den dokumenterte veksten i registrerte HUD-lyttere og beholdte Regnereisen-elementer etter gjentatt inn- og utgang, uten å endre spillregler, progresjon eller visuell oppførsel.

**Architecture:** Før appkode endres etableres en egen før/etter-kontroll som holder rene kjøringer, trace og heap-snapshots fysisk atskilt. Deretter samles de langlivede lytterne som `HudController` oppretter i konstruktøren, i ett aborterbart livsløp. Hvis den avgrensede endringen ikke består de målte tersklene, stopper arbeidet før Phaser- eller React-livsløpet endres.

**Tech Stack:** React 19, TypeScript, Phaser 4, Vite 8, Node test runner, Playwright/Chromium og Chrome DevTools Protocol.

## Global Constraints

- Elevene bruker hovedsakelig iPad; test-iPaden er en iPad (A16), mens skolens iPader trolig er svakere.
- Stabilitet og ytelse prioriteres; ingen nye funksjoner eller stor omskriving.
- Bevar eksisterende funksjonalitet, progresjon, spillregler, grafikk og lydflyt.
- Ikke endre Skolekampens kjente 25/24-feil i denne pakken.
- Ikke endre Supabase, database, miljøvariabler eller produksjonsoppsett.
- Ingen nye avhengigheter. Bruk eksisterende Node-, Playwright- og CDP-verktøy.
- Ikke commit, stage, push, merge eller endre `main` uten ny, uttrykkelig beskjed fra brukeren. Planens kontrollpunkter erstatter skriveplan-skillens vanlige commit-steg.
- Råmålinger skal fortsatt ligge under ignorert `artifacts/`; rapporter skal ikke inneholde elevdata, request bodies, cookies eller autorisasjonshoder.
- Kodearbeidet avgrenses til `A-CLEAN-01`. Lasting og Labyrint-hakking får egne planer senere.

---

## Viktig bevisavklaring før kode

Den rene A07-kjøringen viser fortsatt reell og helt regelmessig vekst i nettleserens DOM-teller: `323 → 457 → 591 → 725 → 859` registrerte lyttere etter eksplisitt GC. Samtidig ble det under planlegging oppdaget at de eksisterende heap-filene er eldre enn den nåværende `run-01.json`:

- `heap-round-2.heapsnapshot`: 1. august 2026 kl. 17:57
- `heap-round-5.heapsnapshot`: 1. august 2026 kl. 17:58
- `run-01.json`: 1. august 2026 kl. 18:54

Filnavnene ble gjenbrukt mellom trace- og ikke-trace-kjøringer. Heap-funnet er derfor relevant støtte fra samme commit og scenario, men er ikke sikkert koblet til akkurat den JSON-kjøringen rapportgeneratoren viser. Task 1 retter denne svakheten før appkoden røres.

## Filkart

- Create: `scripts/performance/validate-cleanup.mjs` – isolert A07 før/etter-kjøring og maskinlesbar godkjenningsregel.
- Modify: `scripts/performance/analyze-baseline.mjs:231-280` – eksporter heap-oppsummeringen slik at valideringsskriptet gjenbruker samme definisjoner.
- Modify: `tests/performance-baseline.test.mjs` – enhetstester for valideringsregel, variantnavn og at trace/clean aldri deler mappe.
- Modify: `package.json` – legg til `perf:cleanup`; ingen avhengigheter.
- Create: `src/regnereisen-bossreisen/ui/eventScope.ts` – én liten eier for langlivede DOM-/window-lyttere.
- Create: `tests/regnereisen-event-scope.test.mjs` – oppførselstest av abort og idempotent opprydding.
- Modify: `src/regnereisen-bossreisen/ui/hud.ts:1082-1546,1599-1693` – før konstruktørens langlivede lyttere gjennom `EventScope` og aborter dem ved `destroy()`.
- Create: `docs/superpowers/reports/skolestart-opprydding-validation.md` – før/etter-resultat og beslutning om funnet er løst eller fortsatt åpent.

Følgende appfiler skal ikke endres i første forsøk: `RegnereisenBossreisen.jsx`, `phaser/game.ts`, Phaser-scenene, progresjonslagring og innholdsfiler. De har allerede eksplisitt unmount-/destroy-logikk. Hvis HUD-endringen ikke består, stoppes pakken og nytt bevis legges frem før dette omfanget utvides.

---

### Task 1: Gjør oppryddingsbeviset reproducerbart

**Files:**
- Create: `scripts/performance/validate-cleanup.mjs`
- Modify: `scripts/performance/analyze-baseline.mjs:231-280`
- Modify: `tests/performance-baseline.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: eksisterende `captureScenario(options)` og `heapSnapshotStats(path)`.
- Produces: `evaluateCleanupCandidate(input): CleanupValidation`, `sanitizeVariant(value): string` og kommandoen `npm run perf:cleanup -- --base-url http://127.0.0.1:4173/ --variant before-event-scope`.

- [ ] **Step 1: Skriv tester som krever isolerte varianter og en streng godkjenningsregel**

Legg følgende tester til `tests/performance-baseline.test.mjs`:

```js
const {
  evaluateCleanupCandidate,
  sanitizeVariant
} = await import('../scripts/performance/validate-cleanup.mjs');

test('oppryddingsvariant tillater bare sikre mappenavn', () => {
  assert.equal(sanitizeVariant('before-event-scope'), 'before-event-scope');
  assert.throws(() => sanitizeVariant('../baseline'), /Ugyldig variant/);
  assert.throws(() => sanitizeVariant('Elev Ola'), /Ugyldig variant/);
});

test('oppryddingskandidat avvises ved vedvarende lytter- og DOM-vekst', () => {
  const result = evaluateCleanupCandidate({
    cleanRuns: [{
      lifecycleRounds: [
        { round: 2, listeners: 457, canvases: 0, webglContexts: 0 },
        { round: 5, listeners: 859, canvases: 0, webglContexts: 0 }
      ]
    }],
    heapDiagnostics: {
      round2: { detachedNodes: 1082, registeredEventListeners: 457, retainedGameCanvases: 2 },
      round5: { detachedNodes: 2490, registeredEventListeners: 859, retainedGameCanvases: 5 }
    }
  });

  assert.equal(result.passed, false);
  assert.deepEqual(result.reasons.sort(), [
    'detached-node-growth',
    'listener-growth',
    'registered-listener-growth',
    'retained-canvas-growth'
  ]);
});

test('oppryddingskandidat godtas når varme runder flater ut', () => {
  const result = evaluateCleanupCandidate({
    cleanRuns: [{
      lifecycleRounds: [
        { round: 2, listeners: 325, canvases: 0, webglContexts: 0 },
        { round: 5, listeners: 327, canvases: 0, webglContexts: 0 }
      ]
    }],
    heapDiagnostics: {
      round2: { detachedNodes: 1100, registeredEventListeners: 325, retainedGameCanvases: 1 },
      round5: { detachedNodes: 1180, registeredEventListeners: 329, retainedGameCanvases: 1 }
    }
  });

  assert.equal(result.passed, true);
  assert.deepEqual(result.reasons, []);
});
```

- [ ] **Step 2: Kjør testene og bekreft rød tilstand**

Run:

```powershell
node --test tests/performance-baseline.test.mjs
```

Expected: FAIL fordi `validate-cleanup.mjs` eller eksportene ennå ikke finnes.

- [ ] **Step 3: Eksporter eksisterende heap-oppsummering uten å endre beregningen**

I `scripts/performance/analyze-baseline.mjs` endres bare signaturen:

```js
export async function heapSnapshotStats(filePath) {
  // Behold dagens parser og feltene detachedNodes,
  // registeredEventListeners og retainedGameCanvases uendret.
}
```

- [ ] **Step 4: Implementer den isolerte valideringsregelen**

Opprett `scripts/performance/validate-cleanup.mjs` med disse tersklene:

```js
export function sanitizeVariant(value) {
  if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(value ?? '')) {
    throw new Error('Ugyldig variant. Bruk små bokstaver, tall og bindestrek.');
  }
  return value;
}

export function evaluateCleanupCandidate({ cleanRuns, heapDiagnostics }) {
  const reasons = new Set();
  for (const run of cleanRuns) {
    const round2 = run.lifecycleRounds.find((round) => round.round === 2);
    const round5 = run.lifecycleRounds.find((round) => round.round === 5);
    if (!round2 || !round5 || round5.listeners - round2.listeners > 5) {
      reasons.add('listener-growth');
    }
    if (run.lifecycleRounds.some((round) => round.canvases !== 0 || round.webglContexts !== 0)) {
      reasons.add('connected-renderer-after-exit');
    }
  }

  if (heapDiagnostics.round5.registeredEventListeners
      - heapDiagnostics.round2.registeredEventListeners > 10) {
    reasons.add('registered-listener-growth');
  }
  if (heapDiagnostics.round5.detachedNodes - heapDiagnostics.round2.detachedNodes > 200) {
    reasons.add('detached-node-growth');
  }
  if (heapDiagnostics.round5.retainedGameCanvases
      > heapDiagnostics.round2.retainedGameCanvases) {
    reasons.add('retained-canvas-growth');
  }

  return { passed: reasons.size === 0, reasons: [...reasons] };
}
```

CLI-delen skal:

1. kreve `--base-url` og `--variant`;
2. skrive tre ikke-trace A07-kjøringer til `artifacts/skolestart-cleanup/{variant}/clean/`;
3. skrive én trace-kjøring og dens heap-filer til `artifacts/skolestart-cleanup/{variant}/trace/`;
4. beregne SHA-256 av `git diff --binary` og lagre den som `workingTreeDiffSha256`;
5. skrive `validation.json` og `validation.md` i variantmappen;
6. returnere exit code 1 når `passed` er `false`.

Beskytt CLI-kallet med samme `pathToFileURL`-mønster som de eksisterende måleskriptene, slik at import i testen ikke starter Chromium. Ingen eksisterende baseline-filer skal leses som kandidatbevis.

- [ ] **Step 5: Legg til én npm-kommando**

I `package.json`:

```json
"perf:cleanup": "node scripts/performance/validate-cleanup.mjs"
```

Ikke endre `package-lock.json`, siden ingen pakke legges til.

- [ ] **Step 6: Kjør enhetstestene og rapportgeneratoren**

Run:

```powershell
node --test tests/performance-baseline.test.mjs
node scripts/performance/analyze-baseline.mjs --write-report --allow-incomplete
```

Expected: begge exit 0; den godkjente baseline-rapporten skal fortsatt vise Port 1 som godkjent.

- [ ] **Step 7: Kontrollpunkt – ingen appkode ennå**

Run:

```powershell
git status --short -- src
git diff --check
```

Expected: ingen endringer under `src`; ingen whitespace-feil. Ikke stage eller commit.

- [ ] **Step 8: Kjør og behold den røde appreferansen før Task 2**

Start dagens produksjonsbygg og preview i separate terminaler:

```powershell
npm run build
npm run preview -- --host 127.0.0.1 --port 4173 --strictPort
```

Kjør deretter:

```powershell
npm run perf:cleanup -- --base-url http://127.0.0.1:4173/ --variant before-event-scope
```

Expected: exit 1 og minst `listener-growth`. Bekreft at `artifacts/skolestart-cleanup/before-event-scope/validation.json` har `passed: false`, og stopp preview før Task 2. Denne røde varianten skal ikke overskrives senere.

---

### Task 2: Lag et lite, testdrevet lytterlivsløp

**Files:**
- Create: `src/regnereisen-bossreisen/ui/eventScope.ts`
- Create: `tests/regnereisen-event-scope.test.mjs`

**Interfaces:**
- Produces: `EventScope.listen<TEvent extends Event>(target, type, listener, options): void` og idempotent `EventScope.dispose(): void`.
- Consumed by: `HudController` i Task 3.

- [ ] **Step 1: Skriv en rød enhetstest for abort og idempotens**

Opprett `tests/regnereisen-event-scope.test.mjs`:

```js
import assert from 'node:assert/strict';
import test from 'node:test';
const { EventScope } = await import('../src/regnereisen-bossreisen/ui/eventScope.ts');

test('EventScope fjerner alle registrerte lyttere og tåler dobbel dispose', () => {
  const scope = new EventScope();
  const first = new EventTarget();
  const second = new EventTarget();
  let calls = 0;

  scope.listen(first, 'ping', () => { calls += 1; });
  scope.listen(second, 'ping', () => { calls += 1; }, { passive: true });
  first.dispatchEvent(new Event('ping'));
  second.dispatchEvent(new Event('ping'));
  scope.dispose();
  scope.dispose();
  first.dispatchEvent(new Event('ping'));
  second.dispatchEvent(new Event('ping'));

  assert.equal(calls, 2);
});
```

- [ ] **Step 2: Kjør testen og bekreft rød tilstand**

Run:

```powershell
node --test tests/regnereisen-event-scope.test.mjs
```

Expected: FAIL fordi `eventScope.ts` mangler.

- [ ] **Step 3: Implementer bare den generelle EventTarget-mekanismen**

Opprett `src/regnereisen-bossreisen/ui/eventScope.ts`:

```ts
export class EventScope {
  private readonly controller = new AbortController();

  listen<TEvent extends Event>(
    target: EventTarget,
    type: string,
    listener: (event: TEvent) => void,
    options: boolean | AddEventListenerOptions = {}
  ): void {
    const scopedOptions: AddEventListenerOptions = typeof options === 'boolean'
      ? { capture: options, signal: this.controller.signal }
      : { ...options, signal: this.controller.signal };
    target.addEventListener(type, listener as EventListener, scopedOptions);
  }

  dispose(): void {
    this.controller.abort();
  }
}
```

Ikke legg til timer-, Phaser- eller ressursansvar i denne klassen.

- [ ] **Step 4: Kjør bare EventScope-testen**

Run:

```powershell
node --test tests/regnereisen-event-scope.test.mjs
```

Expected: testen PASS.

- [ ] **Step 5: Kontrollpunkt**

Vis diffen for `eventScope.ts` og testen. Bekreft at ingen eksisterende appflyt er endret. Ikke stage eller commit.

---

### Task 3: Knytt HUD-konstruktørens lyttere til ett livsløp

**Files:**
- Modify: `src/regnereisen-bossreisen/ui/hud.ts:1-5,361-430,1082-1546,1599-1693`
- Test: `tests/regnereisen-event-scope.test.mjs`

**Interfaces:**
- Consumes: `EventScope` fra Task 2.
- Preserves: alle eksisterende callback-funksjoner, event-typer og options (`passive`, `capture`) uendret.

- [ ] **Step 1: Legg EventScope til HudController**

Importer klassen og opprett én instans per HUD:

```ts
import { EventScope } from './eventScope';

export class HudController {
  private readonly events = new EventScope();
  // eksisterende felt beholdes
}
```

- [ ] **Step 2: Konverter alle 151 rå registreringer i konstruktørblokken**

Endre bare området fra `constructor(private readonly progress: ProgressStore)` til rett før `bindWorld`. Bruk disse eksakte formene:

```ts
// Element med anonym callback
this.events.listen(this.closeQuestButton, 'click', () => {
  // eksisterende callback-kropp uendret
});

// requireElement-uttrykk
this.events.listen(
  requireElement<HTMLButtonElement>('close-battle'),
  'click',
  () => {
    // eksisterende callback-kropp uendret
  }
);

// Navngitt touch/pointer-handler med eksisterende options
this.events.listen(
  this.choiceGrid,
  'touchstart',
  this.handleBattleTouchStart,
  this.passiveTouchOptions
);

// Document, window og ProgressStore
this.events.listen(document, 'keydown', this.handleKeyDown);
this.events.listen(window, 'blur', this.handleWindowBlur);
this.events.listen(this.progress, 'change', this.handleProgressChange);
```

Ikke konverter de 28 dynamiske lytterne etter konstruktøren i denne pakken. De tilhører kortlivede knapper som opprettes ved rendering og var ikke aktive i A07-reproduksjonen. Å legge dem på samme AbortSignal kan i stedet holde hver tidligere render registrert helt til HUD-en avsluttes.

- [ ] **Step 3: Aborter lytterne først i `destroy()`**

Legg inn som første linje:

```ts
destroy(): void {
  this.events.dispose();
  // eksisterende eksplisitte removeEventListener- og timerkall beholdes
}
```

De eksisterende eksplisitte `removeEventListener`-kallene beholdes i første versjon. De er idempotente etter abort og reduserer risikoen ved den mekaniske endringen.

- [ ] **Step 4: Kjør EventScope-oppførselstesten**

Run:

```powershell
node --test tests/regnereisen-event-scope.test.mjs
```

Expected: 1 test PASS. Den virkelige HUD-effekten bevises med A07 i Task 4, ikke ved å lese kildekodetekst i en test.

- [ ] **Step 5: Kjør TypeScript-kontrollen før nettlesermåling**

Run:

```powershell
npm run typecheck:regnereisen
```

Expected: exit 0. Hvis callback-typene ikke passer `EventScope.listen`, juster den enkelte callbackens generiske type; ikke bruk global `any` eller `@ts-ignore`.

- [ ] **Step 6: Kontrollpunkt – gjennomgå mekanisk diff**

Run:

```powershell
git diff --stat -- src/regnereisen-bossreisen/ui/hud.ts src/regnereisen-bossreisen/ui/eventScope.ts
git diff --check
```

Kontroller manuelt at hver callback-kropp og hvert options-objekt er uendret. Ikke stage eller commit.

Bruk denne kontrollkommandoen bare som mekanisk diffgjennomgang, ikke som test:

```powershell
$source = Get-Content src/regnereisen-bossreisen/ui/hud.ts -Raw
$start = $source.IndexOf('constructor(private readonly progress: ProgressStore)')
$end = $source.IndexOf("`n  bindWorld(", $start)
($source.Substring($start, $end - $start) | Select-String '\.addEventListener\(' -AllMatches).Matches.Count
```

Expected: `0`.

---

### Task 4: Bevis rød → grønn på det virkelige A07-scenarioet

**Files:**
- Generated/ignored: `artifacts/skolestart-cleanup/before-event-scope/`
- Generated/ignored: `artifacts/skolestart-cleanup/after-event-scope/`
- Create: `docs/superpowers/reports/skolestart-opprydding-validation.md`

**Interfaces:**
- Consumes: `npm run perf:cleanup` fra Task 1.
- Produces: en kandidatbeslutning som enten er `passed: true` eller en konkret liste med gjenværende tellere.

- [ ] **Step 1: Bygg og start kandidat-preview lokalt**

Run i separate terminaler:

```powershell
npm run build
npm run preview -- --host 127.0.0.1 --port 4173 --strictPort
```

Expected: build exit 0 og preview på `http://127.0.0.1:4173/`.

- [ ] **Step 2: Verifiser at den røde referansen fra Task 1 er bevart**

Run:

```powershell
$before = Get-Content artifacts/skolestart-cleanup/before-event-scope/validation.json -Raw | ConvertFrom-Json
$before.passed
$before.workingTreeDiffSha256
```

Expected: `False` og en ikke-tom SHA-256. Hvis filen mangler, stopp; ikke reverser appkode med `git reset` eller `git checkout` for å gjenskape den.

- [ ] **Step 3: Kjør grønn kandidat tre ganger pluss egen trace**

Etter Task 3:

```powershell
npm run perf:cleanup -- --base-url http://127.0.0.1:4173/ --variant after-event-scope
```

Expected: exit 0 og alle disse betingelsene:

- runde 5 minus runde 2 er høyst 5 registrerte DOM-lyttere i hver ren kjøring;
- alle etter-utgangspunkter har 0 tilkoblede canvas og 0 WebGL-kontekster;
- trace-heap har høyst +10 registrerte lyttere, høyst +200 frakoblede noder og ingen økning i beholdte spillcanvas fra runde 2 til 5;
- `workingTreeDiffSha256` finnes og er ulik den røde variantens hash.

- [ ] **Step 4: Stopp hvis den avgrensede rettingen ikke består**

Hvis kommandoen gir exit 1:

1. behold endringen og begge variantmappene urørt;
2. skriv de eksakte `reasons` og rundetallene i valideringsrapporten;
3. ikke endre `RegnereisenBossreisen.jsx`, `phaser/game.ts` eller Phaser-scenene;
4. presenter beviset for brukeren og lag en revidert rotårsaksplan.

Dette er et obligatorisk beslutningspunkt, ikke tillatelse til å prøve flere tilfeldige oppryddingsendringer.

- [ ] **Step 5: Skriv før/etter-rapport bare fra de isolerte variantene**

`docs/superpowers/reports/skolestart-opprydding-validation.md` skal inneholde:

```markdown
# Regnereisen – validering av opprydding

- Baseline-commit: 129422d97eb126ba6eb983c3329d12c3eb956c35
- Kandidat-diff SHA-256: verdien i `after-event-scope/validation.json`-feltet `workingTreeDiffSha256`
- Før: lyttere runde 2 → 5, detached nodes og beholdte canvas
- Etter: samme fire mål
- Funksjonell røykprøve: resultat og eventuelle avvik
- Beslutning: bestått eller fortsatt åpen
- Begrensning: fysisk Safari-heap ikke målt uten Mac
```

Ikke skriv rå elevdata eller lokale absolute artifact-stier i rapporten.

---

### Task 5: Funksjonell regresjonskontroll på PC og iPad

**Files:**
- Modify: `docs/superpowers/reports/skolestart-opprydding-validation.md`

**Interfaces:**
- Consumes: kandidat som har bestått Task 4.
- Produces: brukerens godkjenningsgrunnlag før eventuell senere commit eller publisering.

- [ ] **Step 1: Kjør hele automatiske kontrollrekken**

Run separat:

```powershell
npm test
npm run typecheck:regnereisen
npm run build
```

Expected:

- alle tester PASS;
- TypeScript exit 0;
- build exit 0;
- eksisterende chunk-advarsel rapporteres, men skal ikke behandles i denne pakken.

- [ ] **Step 2: Kjør visuell Playwright-røykprøve med game-playtest-sjekklisten**

Kontroller og ta skjermbilder av:

1. Regnereisen-inngangen;
2. kartvalg og vanskelighetsdialog;
3. spillbart Boss-reisen-kart;
4. retur til startskjerm og hovedside;
5. fem nye inn/ut-runder uten dobbel meny eller manglende knapper.

Expected: ingen visuell endring, ingen ny konsollfeil og samme elevflyt som baseline.

- [ ] **Step 3: Kjør kort fysisk iPad-kontroll først etter desktop-pass**

Start preview på lokalnettet:

```powershell
npm run preview -- --host 0.0.0.0 --port 4173 --strictPort
```

På iPad (A16), iPadOS 26.5:

1. åpne Regnereisen fem ganger og gå helt tilbake hver gang;
2. åpne Tallvokterens verden og bekreft lyd og berøring;
3. roter liggende → stående → liggende;
4. sett Safari i bakgrunnen i minst ti sekunder og gå tilbake;
5. kontroller at tilbakeknappen fortsatt virker.

En ny 30-minuttersøkt kreves ikke for denne avgrensede listener-endringen dersom desktop-målingen er grønn og den korte iPad-kontrollen består. Skolens svakeste iPad må fortsatt inngå før Port 3.

- [ ] **Step 4: Verifiser omfang og bevar grenen**

Run:

```powershell
git status --short
git diff --check
git status --short -- supabase vercel.json
```

Expected: bare planlagte måleverktøy-, test-, HUD- og rapportfiler er endret; ingen Supabase- eller Vercel-endring.

- [ ] **Step 5: Rapporter og vent på brukerens integrasjonsvalg**

Oppgi:

- før/etter-tall for lyttere, detached nodes og canvas;
- test-, typecheck- og build-resultat med advarsler;
- fysisk iPad-resultat og begrensningen for svakere skole-iPader;
- eksakt filomfang;
- at ingen commit, push, merge eller `main`-endring er utført.

Ikke stage eller commit. Be om uttrykkelig godkjenning før neste arbeidspakke eller Git-handling.

---

## Ferdigkriterier

Pakken er ferdig bare når:

1. clean og trace ligger i separate variantmapper og kan kobles til samme kandidat-diff;
2. A07 består tersklene i Task 4;
3. alle automatiske tester, TypeScript og build består;
4. fem inn/ut-runder, bakgrunn/retur, rotasjon og tilbakeknapp virker på fysisk test-iPad;
5. rapporten viser både før- og ettertall;
6. ingen ikke-godkjente systemer eller appområder er endret.

Hvis punkt 2 ikke oppfylles, er resultatet «fortsatt åpen med bedre bevis», ikke «fikset».
