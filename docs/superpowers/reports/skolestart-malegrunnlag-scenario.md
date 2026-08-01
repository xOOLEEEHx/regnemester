# Skolestart – målegrunnlag og scenariologg

## Låst utgangspunkt

- Baseline-commit: `129422d97eb126ba6eb983c3329d12c3eb956c35`
- Gren: `plan/skolestart-klargjoring`
- Arbeidsområde: `C:\Users\Ole_e\Documents\GitHub\regnemester`
- Operativsystem: Windows 11 Home 64-bit, versjon `10.0.26200`
- Prosessor: AMD Ryzen 5 6600H, 6 kjerner / 12 logiske prosessorer
- Synlig systemminne: 14 415 968 KB
- Node.js: `v24.16.0`
- npm: `11.13.0`
- Playwright: `1.62.1`
- Chromium for baseline: Chrome for Testing `151.0.7922.34`, Playwright build `1234`

## Førmåling

- Eksisterende tester: 22 bestått, 0 feil.
- Kjente advarsler: Node varsler om at TypeScript-moduler tolkes på nytt som ES-moduler fordi `package.json` ikke har `type: module`. Dette er ikke en testfeil og endres ikke i arbeidspakke A.
- Eksisterende brukerfil: `.codex/` er urørt og utenfor oppgaven.
- Godkjent plandokument: `docs/superpowers/plans/2026-08-01-arbeidspakke-a-malegrunnlag.md`.

## Felles regler

- Bruk bare syntetisk testnavn: `Baseline Elev`.
- Ikke send eller fullfør highscore i produksjon.
- Ikke åpne administrasjonsflyten.
- Kald kjøring bruker ny browser-context uten cache eller lagring.
- Varm kjøring gjenbruker samme context etter den kalde kjøringen.
- Ta skjermbilde ved `screen-visible`, `playable` og `after-exit-10s`.
- Lagre aldri elevnavn, elevsvar, tilgangskoder, cookies, autorisasjonshoder eller request bodies.
- Gjenta en kjøring ved krasj, funksjonssvikt, mer enn 10 % ressursavvik eller mer enn 20 % avvik i `playable`-tid.

## Profiler

| Profil | Visning | Touch | CPU | Nettverk |
|---|---|---:|---:|---|
| `tablet-native` | 1024 × 768, DPR 2 | Ja | 1× | Ubegrenset |
| `tablet-conservative` | 1024 × 768, DPR 2 | Ja | 4× slowdown | 150 ms RTT, 4 Mbit/s ned, 1 Mbit/s opp |

Profilene er sammenligningsverktøy på Windows. De emulerer ikke Safari, iPad-GPU eller en bestemt skole-iPad.

## Scenarioer

| ID | Handling | Målepunkter og forventning |
|---|---|---|
| A01 | Kald åpning av hovedappen | Hovedvalg synlig; ingen Regnereisen-kart, kortbilder eller Regnereisen-del før klikk |
| A02 | Åpne Normal, start lokal runde, svar én gang og gå hjem | Ingen Regnereisen-ressurser; input virker; ingen score sendes |
| A03 | Åpne Skolekampen til spillskjermen og gå ut før resultat | Ingen Regnereisen-ressurser; bare nettverkslesing; 25/24-grensen testes ikke |
| A04 | Første åpning av Regnereisen | Skill `screen-visible` fra `playable`; list ny JS, HTML-bilder og Phaser-ressurser |
| A05 | Første og andre åpning av hvert kart | `bossreisen`, `regneriket`, `tallvokterens-rike`, `regnemonster`; list ressurser som kommer for tidlig |
| A06 | Tunge scener og samleperm | Fiske, båtreise, Krystallvognen, Sumpalkymi, Lysskogen, Motvektshvelvet, labyrinten og samlepermen |
| A07 | Fem inn/ut-runder | Mål etter hver runde; canvas/WebGL skal tilbake til null etter full utgang |
| A08 | 30 minutters sammenhengende økt | Snapshot hvert femte minutt; kartbytte, samleperm, raske trykk, avbrutt touch, bakgrunn/retur og rotasjon |

## Målepunkter

1. `before-navigation`
2. `home-visible`
3. `before-open`
4. `screen-visible`
5. `playable`
6. `peak-observed`
7. `before-exit`
8. `after-exit-2s`
9. `after-exit-10s`
10. `after-explicit-gc`

## Fysisk iPad uten Mac

Direkte Safari Web Inspector-minne kan ikke samles fra Windows. Den fysiske testen registrerte derfor:

- iPad-modell og iPadOS/Safari-versjon uten serienummer eller Apple-ID;
- synlig og spillbar tid med skjermopptak eller stoppeklokke;
- hakking, svart skjerm, inputtap og behov for refresh;
- bakgrunn i ti sekunder og retur;
- liggende → stående → liggende;
- minst fem inn/ut-runder og én økt på 30 minutter.

Rapporten sier eksplisitt at direkte Safari-heap, Images og Layers ikke er målt.

## Utført desktop-baseline 1. august 2026

- A01 og A04 er kjørt tre ganger i begge profiler.
- A02 og A03 er kjørt uten Regnereisen og uten highscore-innsending.
- Alle fire A05-kart er kjørt kaldt og varmt i begge profiler.
- A07 er kjørt med fem inn/ut-runder i begge profiler. Begge viser samme lyttervekst etter GC: `323 → 457 → 591 → 725 → 859`.
- A08 er kjørt i 30 minutter på `tablet-native` uten krasj. Økten omfattet bakgrunn/retur og rotasjon. Etter full utgang var canvas og WebGL null.
- Sju av åtte A06-stier er kjørt på `tablet-native`: fiske, båtreise, Krystallvognen, Sumpalkymi, Lysskogen, Motvektshvelvet og labyrinten.
- A06-samlepermen mangler fordi den syntetiske automatiseringen ikke nådde interaksjonspunktet stabilt. Dette er en måleverktøybegrensning, ikke en påvist appfeil.
- A06 på konservativ profil er ikke kjørt. Hver isolerte scene ville først hente hele Tallvokter-kartet på nytt; den allerede målte A05-konservative kjøringen brukte 650 sekunder og 299,3 MB. Fysisk iPad prioriteres før mer repetisjon av denne laboratorieprofilen.
- Fysisk iPad-kontroll er fullført på iPad (A16), iPadOS 26.5, over lokal Wi-Fi-preview. Kald hovedside var synlig og spillbar etter omtrent 1–2 sekunder; første Regnereisen-åpning tok omtrent 5–6 sekunder og åpning 2–5 omtrent 3–4 sekunder.
- Tallvokterens verden åpnet på omtrent 4 sekunder og bestod lyd, rotasjon, bakgrunn/retur, berøring og tilbakeknapp. Labyrinten lastet umiddelbart, men hakket merkbart under bevegelse; scenen var fortsatt spillbar og avbrutt berøring låste ikke input.
- En kontrollert 30-minuttersøkt fullførte uten svart skjerm, automatisk refresh eller sviktende knapper. Labyrint-hakkingen ble ikke verre.

Produksjonsskriving til Regnemester-funksjonen var blokkert i målekontekstene. Rådataene inneholder ikke request bodies, cookies, autorisasjonshoder, elevsvar eller ekte elevnavn.
