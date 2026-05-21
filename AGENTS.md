# Regnemester – prosjektinstruksjoner for Codex

## Om prosjektet

Regnemester er et matematikkspill for barn bygget med React og Vite.

Målet er å lage en stabil, profesjonell og motiverende læringsapp som senere kan publiseres på Google Play og App Store.

Appen inneholder blant annet:

- Matematikkoppgaver
- Poengsystem
- Stjerner og belønninger
- Bosskamper
- Adminpanel
- Highscore-system
- Supabase-integrasjon
- Spillgrafikk og animasjoner

## Viktig arbeidsmåte

Prosjektet utvikles steg for steg.

Ikke gjør store omskrivinger av fungerende kode uten eksplisitt beskjed.

Behold eksisterende funksjonalitet med mindre oppgaven uttrykkelig sier at den skal endres.

Prioriter stabile og trygge endringer fremfor store refaktoreringer.

## Før du gjør endringer

Forklar kort:

- hvilke filer som skal endres
- hvorfor endringen er nødvendig
- hvilke konsekvenser endringen får

Ved store endringer skal det gis en kort plan før koden endres.

## Regler for kodeendringer

- Gjør små og avgrensede endringer.
- Endre kun det som er nødvendig for oppgaven.
- Ikke flytt kode mellom filer uten grunn.
- Ikke lag nye biblioteker eller avhengigheter uten å forklare hvorfor.
- Ikke slett eksisterende funksjoner uten eksplisitt beskjed.
- Ikke endre Supabase-oppsett uten eksplisitt beskjed.
- Ikke endre miljøvariabler uten eksplisitt beskjed.
- Ikke endre databasestruktur uten eksplisitt beskjed.

## Testing

Etter større endringer skal følgende kjøres:

npm run build

Hvis mulig skal også lokale feil og advarsler kontrolleres.

Rapporter alltid:

- om build lykkes
- eventuelle feil
- eventuelle advarsler

## Git-regler

VIKTIG:

Ikke kjør:

- git push
- git commit
- git reset
- git rebase
- git merge

uten at brukeren uttrykkelig ber om det.

Brukeren ønsker full kontroll over commits og push.

## Designregler

Appen er laget for barn.

Derfor skal design være:

- barnevennlig
- tydelig
- motiverende
- moderne
- oversiktlig
- lett å forstå

Unngå:

- rotete grensesnitt
- små knapper
- vanskelig lesbar tekst
- unødvendig kompleksitet

## Boss-system

Bossene skal oppleves som en naturlig del av spillverdenen.

Unngå løsninger som får bossene til å se ut som flate klistremerker på skjermen.

Foretrekk:

- dybde
- skygger
- volum
- animasjon
- integrasjon med bakgrunn

Målet er en 2.5D-følelse som minner om moderne mobilspill.

## Hvis du er usikker

Stopp og forklar:

- hva du er usikker på
- hvilke alternativer som finnes
- hvilken løsning du anbefaler

Ikke gjett dersom risikoen for å ødelegge eksisterende funksjonalitet er høy.

## Hovedmål

Hjelp til med å forbedre Regnemester uten å ødelegge eksisterende funksjonalitet.

Stabilitet er viktigere enn store omskrivinger.

Små, trygge og godt forklarte forbedringer foretrekkes alltid.