# Skolestart-klargjøring av Regnemester

**Dato:** 1. august 2026

**Status:** Design til gjennomgang

**Arbeidsgren:** `plan/skolestart-klargjoring`

**Tidshorisont:** 14 dager

## 1. Bakgrunn

Regnemester er publisert og fungerer nå på PC, iPad og mobil for de tilgjengelige modusene. Regnereisen er den nyeste og klart tyngste delen av appen. Elevene har ikke brukt Regnereisen i undervisningen ennå, og vi kjenner ikke modell eller alder på skolens iPader. Vi vet bare at de er svakere enn enheten som hittil er brukt til testing.

Skolekampen var den mest populære modusen før sommerferien. Denne har allerede fått arbeid med highscore-begrensning, sletting av resultater utenfor topplisten, avvisning av dårligere duplikater og ny innsending av resultater som midlertidig ikke kunne lagres. Det finnes likevel én kjent grensefeil: En elev svarte riktig på det siste spørsmålet samtidig som tiden gikk ut, men fikk registrert 24 i stedet for 25.

Målet for de neste 14 dagene er ikke å bygge nye funksjoner. Målet er å gjøre den eksisterende appen tryggere, lettere og mer forutsigbar før elever begynner å bruke den.

## 2. Hovedmål

Regnemester skal være klar for vanlig skolebruk på iPad og tåle at minst 40 elever bruker appen samtidig. Løsningen skal også håndtere en kort topp på omtrent 100 samtidige handlinger eller oppstarter uten tap av gyldige resultater eller full stans.

Arbeidet skal spesielt:

- redusere unødvendig nedlasting og minnebruk;
- laste tunge deler først når eleven faktisk åpner dem;
- rydde korrekt etter kart, scener og minispill;
- sikre at trykk og navigasjon ikke låser seg etter lengre bruk;
- gjøre highscore-lagring korrekt ved tidsgrensen og ved ustabilt nett;
- kontrollere Supabase- og Vercel-flyten under realistisk samtidig bruk;
- gi en trygg Preview-, godkjennings- og tilbakeføringsprosess.

## 3. Føringer og avgrensninger

### Dette inngår

- hovedappen og de eksisterende spillmodusene;
- særlig Regnereisen på iPad;
- Skolekampens tidsgrense og resultatlagring;
- nettverksfeil, bakgrunn/fortsettelse og raske trykk;
- måling av lastetid, nettverksbruk, bildefiler, bilde-/grafikkminne og opprydding;
- kontrollert belastningstest mot et isolert testoppsett;
- automatiserte tester, Vercel Preview og fysisk iPad-test.

### Dette inngår ikke

- nye spillmoduser, kart, oppdrag, kortsett eller belønninger;
- visuell redesign;
- endring av oppgavereglene eller den finjusterte oppgavegeneratoren;
- bred omskriving av React-, Phaser- eller Supabase-arkitekturen;
- fjerning av effekter bare fordi de kan være tunge, uten måling;
- optimalisering av alle bildefiler uten at en måling viser at de gir et problem;
- endring av database, miljøvariabler eller produksjonsoppsett uten egen godkjenning;
- belastningstest som fyller produksjonens highscore-lister med testdata.

Litt hakking i labyrinten på den nåværende test-iPaden står på observasjonslisten. Dette prioriteres først dersom måling eller test på svakere enhet viser at det påvirker spillbarheten.

## 4. Dagens tekniske utgangspunkt

Den innledende kodekontrollen viser at Regnereisen allerede lastes som en egen forsinket React-modul. Det er et godt første skille: En elev som bare spiller Normal eller Skolekampen skal ikke måtte laste hele Regnereisen-koden ved første oppstart.

Dette beviser likevel ikke at ressursene inne i Regnereisen lastes optimalt. Phaser-spillet inneholder flere kart, scener, effekter, minispill og mange store bilder. Før kode endres skal vi derfor finne ut:

- hvilke filer som lastes når hovedsiden åpnes;
- hva som lastes idet Regnereisen åpnes;
- om alle kart og kort lastes samtidig;
- hvilke ressurser som blir liggende i minnet etter at eleven går ut;
- om hendelser, tidsur, animasjoner eller berøringslyttere opprettes flere ganger.

Prosjektet har allerede Vercel Speed Insights og teknisk feilrapportering. Disse kan brukes som støtte, men skolestartkontrollen trenger også målrettede lokale målinger og konkrete spillscenarier.

## 5. Suksesskriterier

Arbeidet regnes som klart for skolestart når følgende er oppfylt:

1. **Oppstart og behovsstyrt lasting**
   - Hovedsiden laster ikke Regnereisen-kart, monsterkort eller tunge Phaser-ressurser før Regnereisen åpnes.
   - Når Regnereisen åpnes, lastes bare ressursene som er nødvendige for menyen og det valgte kartet eller rommet, så langt eksisterende arkitektur tillater dette uten risikabel omskriving.
   - Kortforsider lastes når de faktisk skal vises, ikke alle ved vanlig oppstart.

2. **Stabilitet på iPad**
   - En elev kan spille i minst 30 minutter og gå inn og ut av tunge kart og minispill uten at trykk slutter å fungere eller at appen krever oppdatering av nettleseren.
   - Fem gjentatte inn/ut-runder i samme scene gir ikke en jevn, vedvarende vekst i minne, aktive lyttere, tidsur eller Phaser-objekter etter oppvarming.
   - Appen tåler at Safari settes i bakgrunnen og åpnes igjen, og at enheten roteres, uten fastlåst input eller doble spillinstanser.

3. **Korrekte resultater**
   - Et svar som godtas innen den fastsatte tidsgrensen telles nøyaktig én gang.
   - Et svar etter tidsgrensen telles ikke.
   - Samtidig svar og tidsutløp avgjøres deterministisk; samme hendelsesrekkefølge skal alltid gi samme resultat.
   - En gyldig highscore som ikke kan sendes på grunn av midlertidig nettfeil, beholdes og prøves igjen uten å dupliseres.

4. **Samtidig bruk**
   - 40 simulerte elever kan bruke en realistisk blanding av appen uten en uakseptabel feilrate eller tap av data.
   - En kort topp på omtrent 100 samtidige oppstarter eller API-handlinger håndteres kontrollert. Midlertidig venting er akseptabelt; tapte eller doble resultater er ikke akseptabelt.
   - Testen dokumenterer svartid, feil, ratebegrensning og om nye forsøk fungerer.

5. **Trygg publisering**
   - Relevante tester, typekontroll og produksjonsbygg består.
   - Endringene testes i Vercel Preview på fysisk iPad før `main` endres.
   - Forrige stabile commit og Vercel-deployment er dokumentert, slik at appen raskt kan tilbakeføres.

## 6. Arbeidspakker

### Arbeidspakke A – målegrunnlag

Første kodefase er lesing og måling, ikke optimalisering.

Vi lager et fast målescenario for:

1. kald åpning av hovedappen;
2. åpning av Normal og Skolekampen uten å åpne Regnereisen;
3. første åpning av Regnereisen;
4. åpning av hvert tilgjengelige kart;
5. åpning av tunge minispill og samlepermen;
6. fem gjentatte inn/ut-runder;
7. en sammenhengende økt på minst 30 minutter.

For hvert scenario registreres:

- antall nettverksforespørsler og overførte megabyte;
- hvilke JavaScript-deler og bilder som lastes;
- tidspunkt for synlig og spillbar skjerm;
- lange hovedtrådoppgaver og tydelige fall i bildeflyt;
- minne før åpning, under bruk og etter avslutning;
- antall aktive spillinstanser og kjente globale lyttere;
- tekniske feil i konsoll og feilrapportering.

Målingen gjøres både uten kunstig begrensning og med konservativ CPU-/nettverksprofil som omtrentlig representerer en svakere skole-iPad. Den erstatter ikke fysisk enhetstest, men gjør det mulig å finne problemer før skolen åpner.

Resultatet blir en kort baseline-rapport med funn sortert som kritisk, viktig eller kan vente. Brukeren godkjenner prioriteringen før større kodeendringer begynner.

### Arbeidspakke B – behovsstyrt lasting

Etter baseline beholdes dagens hovedskille for Regnereisen dersom målingen bekrefter at det virker. Videre oppdeling gjøres i små steg:

- egne dynamiske modulgrenser for tunge kart eller scener når dette gir målbar gevinst;
- egne ressurslister per kart, rom eller minispill;
- lasting av nødvendige bilder ved sceneoppstart;
- gjenbruk fra nettleserens cache når eleven går tilbake;
- lasting av synlige kort og nødvendige kortbakgrunner i samlepermen;
- ingen forhåndslasting av hele kortsamlingen eller alle verdener uten dokumentert behov;
- enkel og tydelig lastestatus der ventetid ikke kan unngås.

Endringen skal ikke endre oppgavegeneratoren, lagret progresjon, kartregler eller visuell oppførsel.

### Arbeidspakke C – opprydding og inngangskontroll

Alle berørte Phaser-scener og minispill skal følge samme livsløp:

1. opprett spillinstans og nødvendige lyttere;
2. kjør scenen;
3. stans input ved overgang;
4. fjern globale lyttere, tidsur, tweens, dra-operasjoner og midlertidige DOM-elementer;
5. avslutt eller gjenbruk Phaser-instansen kontrollert;
6. gjenopprett korrekt input etter bakgrunn, rotasjon eller avbrutt fingerbevegelse.

Det skal være umulig å opprette to aktive kopier av samme scene ved raske trykk. Avslutt- og tilbakeknapper skal fortsatt virke etter avbrutt berøring eller nettverksfeil.

### Arbeidspakke D – Skolekampens tidsgrense og resultatkø

Den kjente 25/24-feilen behandles som en korrekthetsfeil, selv om den er sjelden.

Rundens slutt skal ha én autoritativ beslutning:

- svarhendelsen får tidspunkt og behandles bare dersom runden fortsatt er åpen;
- tidsutløp lukker runden én gang;
- et svar og tidsutløp kan ikke begge endre resultatet etter at runden er lukket;
- samme svar kan ikke telles eller sendes to ganger;
- resultatet som vises lokalt skal være det samme som resultatet serveren godtar.

Det legges til automatiserte grenseprøver for svar rett før, samtidig med og rett etter tidsutløp. Den eksisterende køen for uinnsendte highscores beholdes. Den kontrolleres for oppdatering av siden, ny runde, offline/online og gjentatt innsending. Hver innsending må være idempotent, slik at samme gyldige resultat ikke blir lagret dobbelt.

### Arbeidspakke E – kontrollert belastningstest

Belastningstesten skal bruke et avgrenset testmiljø eller tydelig merkede testdata som kan ryddes trygt. Produksjonens elevtoppliste skal ikke fylles med falske resultater.

Testnivåer:

- **Normal last:** 40 samtidige virtuelle elever med spredte oppstarter, lesing av innstillinger/highscore og realistiske runder.
- **Kort topp:** omtrent 100 samtidige oppstarter eller API-handlinger.
- **Nettverksfeil:** enkelte forespørsler forsinkes eller avbrytes for å kontrollere nye forsøk.

Vi registrerer:

- svartid og antall feil per endepunkt;
- ratebegrensning og hvordan klienten forklarer venting;
- tapte og dupliserte resultater;
- Supabase-feil og Edge Function-feil;
- om appen fortsetter å virke selv om highscore ikke er tilgjengelig et øyeblikk.

Målet er kontrollert oppførsel, ikke at alle forespørsler alltid skal svare øyeblikkelig.

### Arbeidspakke F – observasjon, personvern og gjenoppretting

Tekniske feil skal kunne oppdages uten å samle elevnavn, svar eller annen unødvendig personinformasjon. Feilrapportering kan inneholde:

- appversjon;
- skjerm/modus og scene;
- enhetstype og nettleserfamilie;
- teknisk feilkode;
- om hendelsen skjedde under oppstart, berøring, lasting eller innsending.

Appen skal ved en gjenopprettelig feil forsøke å:

1. stoppe den berørte scenen kontrollert;
2. bevare gyldig lokal progresjon eller ventende resultat;
3. vise en kort, forståelig beskjed;
4. tilby nytt forsøk eller retur til sikker meny;
5. unngå krav om full nettleseroppdatering når dette er teknisk mulig.

## 7. Viktige dataflyter

### Regnereisen

`Hovedapp → åpne Regnereisen → last Regnereisen-modul → last valgt kart/scene → bruk ressurser → rydd scene → behold bare avtalt cache`

Hvert steg skal kunne måles. Ressurser for senere kart skal ikke følge med tidligere i flyten uten en konkret begrunnelse.

### Skolekampen

`Svar → kontroller åpen runde og tidsgrense → oppdater autoritativ score én gang → avslutt runde → legg resultat i sikker lokal kø → idempotent innsending → bekreftet highscore eller senere nytt forsøk`

Denne flyten skal hindre både 25/24-feilen, tap ved nettverksbrudd og duplikater ved nye forsøk.

## 8. Testmatrise

### Enheter

- PC med Chrome for utvikling og detaljert måling;
- brukerens iPad med Safari for fysisk Preview-test;
- konservativ CPU- og nettverkssimulering for svakere enheter;
- telefon for å kontrollere at eksisterende mobiltilpasning ikke ødelegges.

Ukjent skole-iPad er ikke en grunn til å vente. Når modell blir kjent, legges den til som siste fysisk kontroll dersom tiden tillater det.

### Scenarier

- kald og varm oppstart;
- Normal og Skolekampen uten besøk i Regnereisen;
- første og andre åpning av hvert Regnereisen-kart;
- minst fem gjentatte sceneoverganger;
- minst 30 minutters sammenhengende bruk;
- raske og flerfoldige trykk;
- avbrutt dra- eller berøringsbevegelse;
- Safari i bakgrunnen og tilbake;
- rotasjon av iPad;
- ti sekunder uten nett og deretter nett tilbake;
- oppdatering av siden mens en highscore venter;
- svar rundt det nøyaktige tidspunktet tiden løper ut;
- 40 samtidige vanlige brukere og en kort topp rundt 100.

## 9. 14-dagers rekkefølge

### Dag 1–3: måling og prioritering

- etablere faste målescenarier;
- registrere dagens lasting, minne, bildeflyt og opprydding;
- kartlegge hvilke ressurser som lastes for tidlig;
- kontrollere Skolekampens tidsløp og resultatkø;
- levere prioritert baseline-rapport.

### Dag 4–7: målrettet lasting og opprydding

- gjennomføre de få endringene med størst dokumentert gevinst;
- dele ut tunge kart-/sceneressurser ved behov;
- sikre sceneopprydding og én aktiv spillinstans;
- legge til relevante automatiserte tester.

### Dag 8–9: resultatkorrekthet og nettverksmotstand

- rette tidsgrensen i Skolekampen;
- prøve pending highscore ved nettbrudd, sideoppdatering og ny runde;
- verifisere at samme resultat ikke lagres dobbelt.

### Dag 10–11: belastning

- kjøre normal last med 40 virtuelle elever;
- kjøre kort topp rundt 100;
- kontrollere feil, svartid, ratebegrensning og datakorrekthet;
- rette bare dokumenterte kritiske flaskehalser.

### Dag 12: langøkt og stress på klienten

- 30 minutters økt;
- gjentatte kartbytter, raske trykk, bakgrunn/fortsettelse og rotasjon;
- kontrollere minne og fastlåst input.

### Dag 13: Vercel Preview

- full test og produksjonsbygg;
- Preview på PC og fysisk iPad;
- brukerens godkjenning av de viktigste elevflytene.

### Dag 14: utgivelsesvakt

- bare kritiske rettinger;
- godkjent merge til `main`;
- produksjons-smoke-test;
- klar tilbakeføringsplan og kort driftsnotat.

## 10. Arbeids- og utgivelsesform

- Alt arbeid skjer på egen gren.
- Endringer deles i små, forståelige commits.
- Hver kodepakke får den minste relevante testen, og større pakker får `npm test`, sikkerhetssjekk, typekontroll og produksjonsbygg.
- Supabase- eller miljøendringer krever egen forklaring og godkjenning.
- Vercel Preview testes før `main`.
- Brukeren tester fysisk iPad; Codex utfører automatiserte, emulerte og PC-baserte kontroller.
- Ingen push eller merge til `main` uten uttrykkelig godkjenning.
- Før merge oppgis repo, gren, commit og planlagt merge-metode.
- Etter produksjonsdeploy kontrolleres hovedside, Normal, Skolekampen og inngang/utgang av Regnereisen.

## 11. Leveranser

1. baseline-rapport med konkrete målinger;
2. prioritert liste over kritiske og viktige funn;
3. små kodepakker for behovsstyrt lasting og opprydding;
4. tester for tidsgrensen og resultatkøen i Skolekampen;
5. belastningsrapport for 40 normalbrukere og kort topp rundt 100;
6. iPad-/Preview-sjekkliste;
7. kort produksjons- og tilbakeføringsrutine.

## 12. Beslutningsporter

Dette er ett skolestartprogram, men det skal ikke gjennomføres som én stor endring.

- **Port 1:** Baseline og prioritering godkjennes før kodeoptimalisering.
- **Port 2:** Lasting/opprydding godkjennes i Preview før resultat- og belastningsarbeidet ferdigstilles.
- **Port 3:** Hele pakken godkjennes på fysisk iPad før `main`.

Hvis baseline viser at en forbedring krever stor arkitekturomskriving, utsettes den til etter skolestart med mindre den løser en kritisk feil. Stabil, fungerende kode har høyere prioritet enn en teoretisk perfekt arkitektur.

## 13. Første konkrete neste steg

Etter at dette designet er godkjent, lages en detaljert implementeringsplan for **arbeidspakke A: målegrunnlag**. Denne skal beskrive nøyaktige måleverktøy, kommandoer, scenarier, filer og rapportformat. Først når baseline er gjennomført og prioritert, lages kodeplanen for arbeidspakke B–D.
