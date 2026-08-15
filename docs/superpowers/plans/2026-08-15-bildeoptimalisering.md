# Bildeoptimalisering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redusere de publiserte bildedataene i Regnemester betydelig uten synlig kvalitetsfall eller endret spilloppførsel.

**Architecture:** En deklarativ JSON-konfigurasjon deler runtime-bilder i profiler og eksplisitte unntak. Et Python/Pillow-verktøy lager WebP- eller tapsfri PNG-runtimefiler med dimensjons-, alfa- og størrelseskontroll, mens en Node-test bekrefter at alle statiske bildehenvisninger peker til filer som faktisk deployes. Endringene innføres kategori for kategori og verifiseres lokalt.

**Tech Stack:** React 19, Vite 8, Phaser 4, TypeScript, Node test runner, Python 3.12, Pillow 12 med WebP-støtte.

## Global Constraints

- Resultatet skal se likt ut for øyet ved normal visningsstørrelse på PC og iPad.
- Ingen dimensjoner, sideforhold, plasseringer eller alfa-kanaler skal endres utilsiktet.
- Kollisjonskart, masker og andre dataavlesende bilder skal forbli tapsfrie PNG-filer.
- Originaler som fjernes fra `public` skal bevares under `source-assets` når de er redigeringskilder.
- `main` skal ikke endres, pushes eller merges i denne arbeidsperioden.
- Ingen Vercel-preview brukes under implementering og lokal validering.
- Graphify-filer skal ikke committes.

---

### Task 1: Reproducerbart bildeinventar og sikker konfigurasjon

**Files:**
- Create: `scripts/assets/image-optimization-config.json`
- Create: `scripts/assets/inventory-runtime-images.py`
- Create: `tests/image-optimization-config.test.mjs`
- Create: `artifacts/image-optimization/.gitkeep` only if `artifacts/` is ignored; otherwise keep reports untracked without creating the file.

**Interfaces:**
- Consumes: filer under `public/`.
- Produces: `load_config(path) -> dict`, konsollrapport og valgfri JSON-rapport med `totalBytes`, `files`, `byTopFolder`, `byExtension` og `largest`.

- [ ] **Step 1: Write the failing configuration test**

Testen skal lese JSON-konfigurasjonen og bekrefte at profilene `background`, `transparent`, `text`, `lossless` finnes, at kvalitetene er henholdsvis 92, 95, 97 og tapsfri, og at tekniske stier ikke kan plasseres i en tapsprofil.

```js
test('bildeprofilene har sikre kvalitetsgrenser', () => {
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  assert.equal(config.profiles.background.quality, 92);
  assert.equal(config.profiles.transparent.quality, 95);
  assert.equal(config.profiles.text.quality, 97);
  assert.equal(config.profiles.lossless.format, 'png');
  assert.ok(config.protectedPathPatterns.includes('**/*mask*.png'));
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `node --test tests/image-optimization-config.test.mjs`
Expected: FAIL because the config file does not exist.

- [ ] **Step 3: Add the exact profile configuration**

```json
{
  "profiles": {
    "background": { "format": "webp", "quality": 92, "method": 6, "minSavingsPercent": 15 },
    "transparent": { "format": "webp", "quality": 95, "method": 6, "minSavingsPercent": 12 },
    "text": { "format": "webp", "quality": 97, "method": 6, "minSavingsPercent": 20 },
    "lossless": { "format": "png", "optimize": true, "compressLevel": 9, "pixelExact": true }
  },
  "protectedPathPatterns": [
    "**/*mask*.png",
    "**/*collision*.png",
    "**/*template*.png"
  ],
  "groups": []
}
```

- [ ] **Step 4: Implement the read-only inventory script**

Skriptet skal skanne `public` rekursivt, inkludere `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif` og `.avif`, og aldri skrive inn i `public`. `--json <path>` skal skrive rapporten bare til oppgitt artifact-sti.

- [ ] **Step 5: Run inventory and tests**

Run:

```powershell
$py='C:\Users\Ole_e\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
& $py scripts/assets/inventory-runtime-images.py --json artifacts/image-optimization/before.json
node --test tests/image-optimization-config.test.mjs
```

Expected: test PASS and report with a total close to the measured baseline.

- [ ] **Step 6: Commit**

```powershell
git add scripts/assets/image-optimization-config.json scripts/assets/inventory-runtime-images.py tests/image-optimization-config.test.mjs
git commit -m "test: legg til bildeinventar og profiler"
```

### Task 2: Konverteringsverktøy med avvisning av risikable filer

**Files:**
- Create: `scripts/assets/optimize-runtime-images.py`
- Modify: `tests/image-optimization-config.test.mjs`
- Create: `tests/fixtures/image-optimization/opaque.png`
- Create: `tests/fixtures/image-optimization/transparent.png`
- Create: `tests/fixtures/image-optimization/mask.png`

**Interfaces:**
- Consumes: `image-optimization-config.json` og eksplisitte grupper.
- Produces: `convert_file(source: Path, destination: Path, profile: dict) -> ConversionResult` med `sourceBytes`, `outputBytes`, `savingsPercent`, `width`, `height`, `hasAlpha`, `accepted`, `reason`.

- [ ] **Step 1: Extend the failing test for converter safety**

Testen skal starte Python-verktøyet i `--dry-run` og bekrefte at manglende WebP-støtte, ukjent profil og beskyttet maskesti gir exit code ulik 0. Den skal også bekrefte at fixture-dimensjonene beholdes.

- [ ] **Step 2: Run the focused test and verify failure**

Run: `node --test tests/image-optimization-config.test.mjs`
Expected: FAIL because the converter is absent.

- [ ] **Step 3: Implement deterministic conversion**

Verktøyet skal:

```python
with Image.open(source_path) as source:
    source.load()
    original_size = source.size
    has_alpha = "A" in source.getbands() or "transparency" in source.info
    save_kwargs = {"format": "WEBP", "quality": quality, "method": method, "exact": has_alpha}
    source.save(temp_path, **save_kwargs)
```

Etter lagring skal filen åpnes på nytt. Verktøyet skal stoppe dersom dimensjonene avviker, alfa forsvinner, filen ikke kan dekodes eller besparelsen er lavere enn `minSavingsPercent`. Akseptert fil flyttes atomisk på plass.

- [ ] **Step 4: Add `--dry-run`, `--group`, `--all`, `--report` and `--source-root` flags**

`--dry-run` skal opprette midlertidige resultater og rapport, men ikke endre runtimefiler. `--source-root` skal gjøre fixture-test og senere regenerering fra `source-assets` mulig.

- [ ] **Step 5: Run converter fixtures and tests**

Run:

```powershell
node --test tests/image-optimization-config.test.mjs
$py='C:\Users\Ole_e\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
& $py scripts/assets/optimize-runtime-images.py --dry-run --group pilot --report artifacts/image-optimization/pilot.json
```

Expected: PASS; no tracked file changes after dry run.

- [ ] **Step 6: Commit**

```powershell
git add scripts/assets/optimize-runtime-images.py tests/image-optimization-config.test.mjs tests/fixtures/image-optimization
git commit -m "feat: legg til sikker bildekonvertering"
```

### Task 3: Flytt redigeringsmaler ut av deploy og overfør sikre, tapsfrie forbedringer

**Files:**
- Create: `scripts/assets/generate-tallvokter-effect-data.py`
- Create: `scripts/assets/optimize-lossless-pngs.py`
- Move: `public/regnemester/maps/tallvokter-fx/manual/*.png` to `source-assets/regnemester/maps/tallvokter-fx/manual/*.png`
- Create: `public/regnemester/maps/tallvokter-fx/runtime/tallvokter-water-mask.png`
- Modify: `src/regnereisen-bossreisen/showcase/assets.ts`
- Modify: `src/regnereisen-bossreisen/showcase/manualWaterMask.ts`
- Modify: `src/regnereisen-bossreisen/showcase/manualWaterfalls.ts`
- Modify: `src/regnereisen-bossreisen/showcase/systems/WaterfallSystem.ts`
- Create: `src/regnereisen-bossreisen/showcase/tallvokterWaterfallRegions.generated.ts`
- Modify: `src/regnereisen-bossreisen/phaser/tallvokter/TallvokterEffects.ts`
- Modify: `src/regnereisen-bossreisen/showcase/ShowcaseScene.ts`
- Create: `tests/tallvokter-effect-data.test.mjs`

**Interfaces:**
- Consumes: manuelle kildemasker fra `source-assets`.
- Produces: kompakt vannmaske og `TALLVOKTER_WATERFALL_REGIONS: readonly WaterfallRegion[]`.

- [ ] **Step 1: Port the focused tests from commit `2c295d8`**

Bruk `git show 2c295d8:<path>` som kilde. Tilpass bare forventninger som har endret seg på dagens `main`.

- [ ] **Step 2: Verify tests fail before runtime data is moved**

Run: `node --test tests/tallvokter-effect-data.test.mjs`
Expected: FAIL because source/runtime split is absent.

- [ ] **Step 3: Port generator and move manual sources**

Flytt de fem manuelle malene med Git, generer runtime-masken og fossefallsregionene, og bekreft at originalene er identiske etter flytting.

- [ ] **Step 4: Port only the current-compatible runtime consumers**

Bruk en treveis diff mot dagens filer. Ikke overskriv nyere iPad-, labyrint-, kartlås- eller sceneoppryddingsendringer.

- [ ] **Step 5: Run targeted and full tests**

Run:

```powershell
node --test tests/tallvokter-effect-data.test.mjs tests/regnereisen-loading-optimization.test.mjs
npm.cmd run build
```

Expected: PASS and no manual effect template in `dist/`.

- [ ] **Step 6: Commit**

```powershell
git add scripts/assets source-assets public/regnemester/maps/tallvokter-fx src/regnereisen-bossreisen/showcase src/regnereisen-bossreisen/phaser tests
git commit -m "perf: fjern Tallvokter-kildemasker fra deploy"
```

### Task 4: Konverter store kart og bakgrunner

**Files:**
- Modify: `scripts/assets/image-optimization-config.json`
- Modify: statiske bildefilstier under `src/regnereisen-bossreisen/`, `src/App.jsx` og `src/App.css` som refererer til godkjente gruppefiler.
- Create: WebP-runtimefiler ved siden av eller i samme runtime-mappe som de erstattede PNG-filene.
- Move: bevaringsverdige PNG-originaler til tilsvarende sti under `source-assets/`.
- Modify: `tests/runtime-image-references.test.mjs`

**Interfaces:**
- Consumes: `background`-gruppen i konfigurasjonen.
- Produces: WebP-filer med uendret dimensjon og oppdaterte runtime-referanser.

- [ ] **Step 1: Write the failing runtime-reference test**

Testen skal hente statiske `/...png|webp|jpg`-referanser fra `src`, bekrefte at filen finnes under `public`, og avvise runtime-referanser til filer flyttet til `source-assets`.

- [ ] **Step 2: Run the test against a deliberately staged pilot path**

Run: `node --test tests/runtime-image-references.test.mjs`
Expected: FAIL until pilotfilen og referansen samsvarer.

- [ ] **Step 3: Add explicit background groups**

Gruppen skal starte med de største faktisk brukte kartene og bakgrunnene, inkludert `regnemester/maps/world-map-v4.png`, `regnemester/maps/tallvokterens-rike-v4.png` og øvrige filer som inventaret dokumenterer som runtime-brukt. `world-map-collision-template.png` og tekniske kartfiler skal ikke inngå.

- [ ] **Step 4: Run dry-run and inspect savings gates**

Run:

```powershell
& $py scripts/assets/optimize-runtime-images.py --dry-run --group backgrounds --report artifacts/image-optimization/backgrounds-dry-run.json
```

Avvis filer med mindre enn 15 prosent besparelse eller uventet alfa/dimensjon.

- [ ] **Step 5: Apply accepted conversions and update references**

Kjør gruppen uten `--dry-run`, oppdater eksakte filendelser med målrettet tekstendring, og flytt originalene til `source-assets`.

- [ ] **Step 6: Verify references, build and local screenshots**

Run:

```powershell
node --test tests/runtime-image-references.test.mjs tests/regnereisen-loading-optimization.test.mjs
npm.cmd run build
```

Åpne lokalt Boss-reisen, Regneriket, Tallvokterens verden via adminåpning og Regnemonster. Ta skjermbilder i `artifacts/image-optimization/` og sammenlign mot baseline.

- [ ] **Step 7: Commit**

```powershell
git add scripts/assets/image-optimization-config.json scripts/assets/optimize-runtime-images.py tests/runtime-image-references.test.mjs src public source-assets
git commit -m "perf: konverter store kart og bakgrunner til WebP"
```

### Task 5: Reduser boss-, oppdrags- og objektbilder uten å endre lastelogikk

**Files:**
- Modify: `scripts/assets/image-optimization-config.json`
- Modify: `src/App.jsx`
- Modify: bildekonstanter og scenefiler under `src/regnereisen-bossreisen/game/content/` og `src/regnereisen-bossreisen/phaser/`.
- Modify: `tests/runtime-image-references.test.mjs`
- Modify: `tests/regnereisen-loading-optimization.test.mjs`
- Create/Move: aksepterte WebP-runtimefiler og PNG-originaler under `source-assets`.

**Interfaces:**
- Consumes: `background` og `transparent` profiler.
- Produces: konverterte boss- og oppdragsgrupper med samme lazy-loading-grenser som før.

- [ ] **Step 1: Add a duplicate hash report**

Inventaret skal gruppere filer med samme SHA-256 og rapportere duplikater uten å slette dem.

- [ ] **Step 2: Test that deferred images remain deferred**

Utvid `regnereisen-loading-optimization.test.mjs` slik at konvertert filendelse ikke fører til eager `<img src>` eller Phaser-preload på feil kart.

- [ ] **Step 3: Convert one boss and one quest as pilots**

Kjør dry-run, bruk profil etter alfa, oppdater referansene og kjør den fokuserte testen. Kontroller alle bossens `idle`, `hurt`, `attack`, `lowHp` og `defeated`-tilstander.

- [ ] **Step 4: Convert remaining accepted groups**

Behandle hver mappe som en egen rapportseksjon. Ikke slett hash-duplikater før `rg` og referansetesten viser at bare én offentlig sti er nødvendig.

- [ ] **Step 5: Run tests and build**

Run:

```powershell
node --test tests/runtime-image-references.test.mjs tests/regnereisen-loading-optimization.test.mjs
npm.cmd test
npm.cmd run build
```

- [ ] **Step 6: Commit**

```powershell
git add scripts/assets src public source-assets tests
git commit -m "perf: reduser boss- og oppdragsbilder"
```

### Task 6: Konverter spillbrikker og vurder kort/UI konservativt

**Files:**
- Modify: `scripts/assets/image-optimization-config.json`
- Modify: spillbrikkereferanser i `src/App.jsx` og Regnereisen-innholdet.
- Modify: Regnemonster-kortmanifest og permreferanser bare for filer som består tekstprofilen.
- Modify: `tests/runtime-image-references.test.mjs`
- Modify: `tests/regnemonster-holosett.test.mjs`
- Create/Move: aksepterte WebP-filer og bevarte originaler.

**Interfaces:**
- Consumes: `transparent` og `text` profiler.
- Produces: spillbrikker med bevart alfa og bare godkjente kort/UI-konverteringer.

- [ ] **Step 1: Add alpha and card completeness assertions**

Testen skal bekrefte at alle registrerte spillbrikker finnes, at alle tre Regnemonster-sett har både full- og permfil, og at filendelsen stemmer med manifestet.

- [ ] **Step 2: Apply lossless optimization from the older branch to tokens**

Bruk den tapsfrie varianten først. WebP brukes bare dersom den gir ytterligere minst 12 prosent og kantkontrollen består.

- [ ] **Step 3: Dry-run text profile for cards and UI**

Kort konverteres bare ved minst 20 prosent besparelse. Sammenlign 100 prosent zoom og normal permstørrelse. Ved tvil beholdes PNG/WebP-formatet som allerede er i bruk.

- [ ] **Step 4: Verify collection and character flows**

Kjør Regnemonster-testene, åpne alle tre permfaner lokalt, vis et funnet kort i stor visning og velg flere spillbrikker.

- [ ] **Step 5: Run full tests and build**

Run:

```powershell
npm.cmd test
npm.cmd run build
```

- [ ] **Step 6: Commit**

```powershell
git add scripts/assets src public source-assets tests
git commit -m "perf: optimaliser spillbrikker og kortbilder"
```

### Task 7: Oppdater README og fullfør lokal kvalitetsport

**Files:**
- Modify: `README.md`
- Create: `docs/superpowers/reports/2026-08-15-bildeoptimalisering-resultat.md`
- Modify: `docs/superpowers/plans/2026-08-15-bildeoptimalisering.md` to mark completed checkboxes.
- Untracked only: `graphify-out/` and `artifacts/image-optimization/`.

**Interfaces:**
- Consumes: før- og etterrapport, alle kategoriresultater og dagens appfunksjoner.
- Produces: oppdatert prosjektintroduksjon og dokumentert lokal godkjenning.

- [ ] **Step 1: Audit README against the current app**

README skal beskrive hovedmodusene, Regnereisen med fire kart, Regnemonster-settene, Tallvokterens standardlås og adminåpning, lokal kjøring, tester, build, Supabase-grenser og bildeverktøy. Fjern bare tekst som beviselig er utdatert.

- [ ] **Step 2: Generate final inventory**

Run:

```powershell
& $py scripts/assets/inventory-runtime-images.py --json artifacts/image-optimization/after.json
```

Resultatrapporten skal oppgi total MB før og etter, prosentvis reduksjon, reduksjon per toppmappe, antall konverterte filer, avviste filer og begrunnelse.

- [ ] **Step 3: Run complete verification**

Run:

```powershell
npm.cmd test
npm.cmd run build
node --test tests/runtime-image-references.test.mjs
```

Expected: alle tester PASS og produksjonsbuild fullført.

- [ ] **Step 4: Refresh Graphify without staging its output**

Run: `graphify update .`
Expected: grafoppdateringen fullfører. Rapporter alle advarsler. Bekreft med `git status --short` at `graphify-out/` ikke stages.

- [ ] **Step 5: Start the local server and run smoke checks**

Run: `npm.cmd run dev -- --host 0.0.0.0`
Test hovedside, Normal, Skolekampen, Boss Battle, Regnereisen-meny og alle lokalt tilgjengelige kart. Kontroller nettverksfeil, konsollfeil, bildekvalitet og at `main` fortsatt peker til `82bfb40` eller nyere ekstern produksjonsstatus uten våre commits.

- [ ] **Step 6: Commit documentation**

```powershell
git add README.md docs/superpowers/reports/2026-08-15-bildeoptimalisering-resultat.md docs/superpowers/plans/2026-08-15-bildeoptimalisering.md
git commit -m "docs: dokumenter bildeoptimalisering og lokal kontroll"
```

- [ ] **Step 7: Final branch audit**

Run:

```powershell
git status -sb
git log --oneline origin/main..HEAD
git diff --stat origin/main...HEAD
```

Expected: bare den isolerte grenen inneholder bildeendringene; ingen push, Vercel-deploy eller merge er utført.
