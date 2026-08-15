# Bildeoptimalisering for Regnemester

**Dato:** 2026-08-15
**Status:** Godkjent retning
**Arbeidsgren:** `agent/komprimer-regnereisen-bilder`
**Utgangspunkt:** `origin/main` ved commit `82bfb40`

## 1. Mål

Redusere mengden bildedata som Regnemester publiserer og sender til elevenes enheter, uten at spillingen, bildekvaliteten, gjennomsiktigheten, kartplasseringene eller de tekniske bildedataene endres merkbart.

Arbeidet skal først utvikles og testes lokalt. Dagens `main` skal forbli urørt til hele pakken er testet og godkjent.

## 2. Utgangspunkt

Den isolerte arbeidskopien inneholder omtrent 780 MB publiserte bildefiler fordelt på omtrent 869 filer. Regnereisen står for størsteparten av dette. Alt lastes ikke av hver elev i én økt, men publiseringsmengden og potensialet for nettverksoverføring er stort nok til at en målrettet optimalisering er nødvendig.

Det finnes en eldre, upushet arbeidsgren med tapsfri PNG-optimalisering og utsatt lasting av enkelte bossbilder. Den grenen skal brukes som kilde til gjennomprøvde endringer, men skal ikke merges direkte fordi nyere feilrettinger finnes på dagens `main`.

Baseline før endringer:

- `npm test`: 80 tester, 0 feil.
- `npm run build`: fullført.
- npm audit ved installasjon: 0 sårbarheter.

## 3. Kvalitetskrav

Brukeren har godkjent komprimering som ikke er matematisk tapsfri så lenge resultatet ser likt ut for øyet.

Følgende krav gjelder likevel uten unntak:

- Ingen synlig reduksjon i kvalitet ved normal visningsstørrelse på PC eller iPad.
- Ingen endring i dimensjoner, sideforhold eller plassering.
- Ingen synlig kant eller feil rundt gjennomsiktige elementer.
- Tekst, kortdetaljer, ikoner og rammer skal forbli skarpe.
- Kollisjonskart, masker, treffsoner og andre dataavlesende bilder må forbli pikselkorrekte.
- Animert eller interaktiv oppførsel skal være uendret.
- Originale kildefiler skal være tilgjengelige utenfor den publiserte `public`-mappen når de må bevares.

## 4. Valgt strategi

Vi bruker en kontrollert hybridstrategi:

1. Store fotografiske eller maleriske kart, bakgrunner og illustrasjoner konverteres til WebP med svært høy kvalitet.
2. Gjennomsiktige spillbrikker og figurer konverteres bare når alfa-kanalen og kantene består automatiske og visuelle kontroller.
3. Teksttunge kort og UI-bilder behandles med strengere profil og beholdes som PNG dersom WebP ikke gir trygg gevinst.
4. Masker, kollisjonsbilder og andre tekniske datafiler forblir tapsfrie PNG-filer.
5. Ubrukte redigeringsmaler og kildefiler flyttes ut av `public`, men slettes ikke.
6. Kode skal peke direkte til den nye runtime-filen. Gamle PNG-originaler skal ikke ligge parallelt i `public` når de ikke lenger brukes, fordi de ellers fortsatt inngår i deploy-størrelsen.

## 5. Konverteringsprofiler

Profilene skal kalibreres på en prøvepakke før massekonvertering. Startverdiene er:

### Kart og store bakgrunner

- Format: WebP.
- Kvalitet: 92.
- Metode: 6.
- Metadata fjernes.
- Originale dimensjoner og alfa beholdes.

### Figurer, spillbrikker og objektillustrasjoner

- Format: WebP.
- Kvalitet: 95.
- Metode: 6.
- Eksakt dimensjon og alfa beholdes.
- Konvertering avvises dersom kantkontrollen finner avvik som kan bli synlige.

### Kort og teksttunge UI-bilder

- Første forsøk: WebP kvalitet 97, metode 6.
- Filen konverteres bare dersom den gir meningsfull reduksjon og består visuell kontroll ved 100 prosent og normal spillstørrelse.
- PNG beholdes når skarphet eller tekst påvirkes.

### Tekniske filer

- Format: PNG.
- Kun tapsfri `optimize=True`, `compress_level=9` når pikselidentitet kan bekreftes.
- Ingen dimensjonsendring, fargeendring eller tapskomprimering.

## 6. Fil- og verktøystruktur

Følgende ansvar holdes adskilt:

- `scripts/assets/image-optimization-config.json`: eksplisitt oversikt over profiler, inkluderinger, unntak og tekniske filer.
- `scripts/assets/optimize-runtime-images.py`: reproducerbar konvertering og kontroll av dimensjon, alfa og filgevinst.
- `scripts/assets/inventory-runtime-images.py`: størrelsesrapport før og etter, gruppert etter spillområde og format.
- `scripts/assets/verify-runtime-image-references.mjs`: bekrefter at kode og CSS ikke peker til fjernede filer, og at runtime-filene finnes.
- `source-assets/`: originale redigeringsfiler og tekniske maler som skal bevares, men ikke deployes.
- `artifacts/image-optimization/`: lokale rapporter og sammenligningsbilder som ikke skal deployes eller committes.

Konverteringsverktøyet bruker prosjektets tilgjengelige Python-runtime og Pillow med WebP-støtte. Appen får ingen ny runtime-avhengighet.

## 7. Etapper

### Etappe A: Målegrunnlag og prøvepakke

- Registrere samlet størrelse og de største filene.
- Kontrollere eksisterende bildehenvisninger og duplikater.
- Lage prøveversjoner av et stort kart, en bakgrunn, en gjennomsiktig spillbrikke og et teksttungt bilde.
- Sammenligne kvalitet og størrelse lokalt.
- Justere profilene én gang før bred konvertering.

### Etappe B: Tidligere sikre optimaliseringer

- Overføre den tapsfrie PNG-optimaliseringen fra den eldre grenen fil for fil.
- Flytte manuelle Tallvokter-maler ut av `public`.
- Gjenbruke den kompakte runtime-masken og genererte fossefallsregioner dersom de fortsatt passer dagens kode.
- Overføre utsatt bossbildelasting bare dersom dagens `main` ikke allerede har tilsvarende oppførsel.

### Etappe C: Store kart og bakgrunner

- Konvertere de største brukte kart- og bakgrunnsbildene først.
- Oppdatere TypeScript, JSX, CSS og innholdskonstanter til nye filnavn.
- Beholde tekniske kartmaler som tapsfri PNG eller flytte dem til `source-assets` dersom de ikke brukes i runtime.

### Etappe D: Bossbilder, oppdrag og objekter

- Konvertere store boss- og oppdragsillustrasjoner kategori for kategori.
- Avdekke identiske duplikater som finnes både under `/bosses` og `/regnemester/bosses`.
- Fjerne bare duplikater som beviselig ikke har egne brukere.
- Teste alle boss-tilstander og oppdragsflater lokalt.

### Etappe E: Spillbrikker, kort og UI

- Konvertere spillbrikker med alfa-kontroll.
- Behandle kort og teksttung UI sist og konservativt.
- Beholde PNG når gevinst eller kvalitet ikke er god nok.

### Etappe F: Dokumentasjon og samlet kontroll

- Oppdatere README slik at den beskriver dagens Regnemester, Regnereisen, karttilgjengelighet, lokal kjøring og bildeverktøy riktig.
- Kjøre alle tester, typekontroll og produksjonsbuild.
- Kjøre Graphify-oppdatering uten å committe Graphify-filer.
- Starte lokalserver og gjennomføre automatisk røykprøve av hovedappen og Regnereisen.
- Rapportere størrelse før og etter, filer som ikke ble konvertert og alle advarsler.

## 8. Lokal validering

Hver etappe må bestå følgende før neste etappe starter:

1. Referansetest for alle endrede filstier.
2. Kontroll av bildedimensjoner og alfakanal.
3. `npm test` for nærmeste relevante tester.
4. `npm run build` ved hvert naturlige stoppunkt.
5. Lokal nettverksmåling uten Vercel.
6. Visuell røykprøve i Chromium med skjermbilder av berørte flater.

Den endelige pakken skal i tillegg testes via lokalserver på PC. Brukeren kan senere teste samme gren på iPad før noen merge til `main`.

## 9. Feilhåndtering og tilbakeføring

- Hver kategori implementeres i en separat commit.
- En kategori som feiler kan tilbakeføres uten å påvirke resten.
- Originaler flyttes til `source-assets` før runtime-versjonen fjernes.
- Konverteringsskriptet skal stoppe ved manglende filer, ukjent profil, dimensjonsavvik eller manglende WebP-støtte.
- Ingen Vercel-deploy, push eller merge til `main` gjøres som del av denne pakken.

## 10. Ferdigkriterier

Arbeidet er ferdig når:

- alle valgte bildegrupper er behandlet med riktig profil;
- ingen runtime-henvisninger er brutt;
- tekniske bilder er pikselkorrekte;
- all tekst og alle kort er visuelt skarpe;
- alle automatiske tester og produksjonsbuild passerer;
- lokal røykprøve viser at spillflyten er uendret;
- README beskriver dagens app;
- størrelsesrapporten dokumenterer faktisk besparelse;
- `main` fortsatt er uendret.
