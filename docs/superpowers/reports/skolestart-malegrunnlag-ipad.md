# Skolestart – fysisk iPad-kontroll

Status: fullført

## Ramme

- Direkte Safari-minnemåling ikke utført – Mac mangler.
- Windows/Chromium-tall skal ikke omtales som iPad-minne.
- Bruk en egen Safari-fane og eksisterende progresjon. Ikke nullstill eller overskriv virkelig progresjon.
- Bruk testnavnet `Baseline Elev`; ikke send highscore og ikke åpne admin.

## Enhet

- iPad-modell: iPad (A16)
- Omtrentlig modellår: ikke registrert
- iPadOS-versjon: 26.5
- Safari-versjon: system-Safari i iPadOS 26.5; separat versjonsnummer ikke registrert
- Ledig lagring: ikke registrert
- Batteri/tilkoblet strøm: ikke registrert
- Test-iPad eller skole-iPad: test-iPad
- Skjermretning ved start: liggende

Ikke noter serienummer, Apple-ID eller elevdata.

## Tilkobling fra Windows-PC

1. Bygg samme baseline-commit og start preview på `0.0.0.0:4173`.
2. Finn PC-ens lokale IPv4-adresse med `ipconfig`.
3. Åpne `http://<PC-adresse>:4173/` i Safari på iPaden mens begge enheter er på samme nett.
4. Noter at lokal nettlevering ikke er det samme som Vercel CDN.

Utført 1. august 2026:

- Baseline-commit: `129422d97eb126ba6eb983c3329d12c3eb956c35`
- Lokal adresse: `http://192.168.0.112:4173/`
- Startsiden med fire moduser åpnet i Safari på fysisk iPad.
- Safari ble sendt i bakgrunnen via Innstillinger og åpnet igjen; startsiden fortsatte å virke.
- Dette er levering over lokalt nett, ikke gjennom Vercel CDN.

## Resultatlogg

| Scenario | Synlig tid | Spillbar tid | Hakking/inputtap | Svart skjerm/refresh | Resultat |
|---|---:|---:|---|---|---|
| A01 kald hovedside | ca. 1–2 s | ca. 1–2 s | Ingen problemer rapportert | Ingen problemer rapportert | Bestått; alle fire moduser synlige og Normal-knappen reagerte |
| A02 Normal uten Regnereisen | – | – | Ingen kjente problemer gjennom langvarig bruk | Ingen kjente problemer | Inngang bestått i baseline; tidligere gjennomspilt mange ganger på samme iPad |
| A03 Skolekampen uten Regnereisen | – | – | Ingen kjente problemer gjennom langvarig bruk | Ingen kjente problemer | Tidligere gjennomspilt mange ganger på samme iPad; separat baseline-runde utelatt |
| A04 første Regnereisen | ca. 5–6 s | ca. 5–6 s | Ingen problemer rapportert | Ingen problemer rapportert | Bestått; andre åpning ca. 3–4 s |
| A05 Boss-reisen | – | – | Ikke testet | Ikke testet | Ikke testet |
| A05 Regneriket | – | – | Ikke testet | Ikke testet | Ikke testet |
| A05 Tallvokterens verden | ca. 4 s fra «Velg» til kart | ca. 4 s | Ingen hakking eller inputtap | Ingen svart skjerm eller refresh | Bestått inkl. lyd, rotasjon, bakgrunn/retur og tilbakeknapp |
| A05 Regnemonster | – | – | Ikke testet | Ikke testet | Ikke testet |
| A06 valgt tung scene – Labyrinten | Umiddelbar, opplevd som millisekunder | Umiddelbar | Bekreftet hakking gjør styringen litt vanskeligere, men scenen er fortsatt spillbar; avbrutt berøring låser ikke input | Ingen svart skjerm eller refresh | Viktig ytelsesfunn, ikke kritisk på test-iPaden |
| A07 fem inn/ut-runder | Runde 1: ca. 5–6 s; runde 2–5: ca. 3–4 s | Samme som synlig tid | Ingen hakking eller inputtap | Ingen svart skjerm eller automatisk refresh | Bestått på test-iPad; alle fem runder fullført |
| A08 30 minutter | 30 min sammenhengende økt | Spillbar hele økten | Labyrint-hakkingen var uendret; alle knapper fungerte | Ingen svart skjerm eller automatisk refresh | Bestått på test-iPad |

## A08-kontroller

- [x] Bakgrunn i minst ti sekunder og retur uten svart skjerm eller refresh, også inne i Tallvokter-kartet.
- [x] Liggende → stående → liggende uten fastlåst UI i Tallvokter-kartet.
- [x] Tre raske dobbelttrykk på Regnereisen åpnet bare én meny, uten dobbel navigasjon.
- [x] Avbrutt drag/touch i Labyrinten uten fastlåst figur eller input.
- [x] Tilbakeknapp og øvrige knapper virker etter 30 minutter.
- [x] Hele økten fullført uten tvungen refresh.

## Eksisterende fysisk erfaring

Brukeren opplyser at Normal, Skolekampen og den etablerte Boss Battle-modusen har vært brukt lenge på denne iPaden uten lasteproblemer. Regnereisen er også gjennomspilt flere ganger uten synlige feil. Dette reduserer behovet for å gjenta hele de kjente spillflytene, men erstatter ikke den målrettede kontrollen av gjentatt inn/ut-lasting: Windows-målingen fant opphopning av lyttere og ressurser som kan bli synlig tidligere på svakere skole-iPader.

En vanlig Regnereisen-runde varer ifølge brukeren kortere enn 30 minutter. Flere slike runder er tidligere fullført uten svart skjerm, automatisk refresh eller fastlåst input; dette er nyttig normalbrukserfaring, men er ikke ført som en kontrollert sammenhengende 30-minuttersøkt.

## Begrensning

Uten Mac kan vi ikke hente Safari Web Inspector-heap, Images eller Layers fra iPaden på en støttet måte. Denne loggen dekker derfor faktisk elevopplevelse – tid, hakking, input, bakgrunn/retur, rotasjon og stabilitet – mens minnetallene kommer fra Chromium-profilen på Windows og holdes tydelig adskilt.

Desktop-baselinen er ferdig nok til å peke ut hva iPad-kontrollen særlig må avklare: om Regnereisen kan åpnes uten refresh, om lyd starter, om Tallvokterens verden forblir spillbar, og om fem inn/ut-runder gir svart skjerm eller fastlåst input.
