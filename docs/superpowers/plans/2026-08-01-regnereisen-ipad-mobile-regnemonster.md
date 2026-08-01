# Regnereisen iPad- og mobilrettinger

**Mål:** Rette de rapporterte iPad-feilene i Tallvokterens verden, innføre tre liv i Regnemonster og gi Regnemonster en fungerende telefonlayout uten å endre dagens PC- og iPad-oppsett unødvendig.

**Arbeidsgren:** `fix/ipad-mobile-regnemonster-pakke`

## Avgrensning

- Tallvokterens verden sperres kun på telefon, ikke iPad eller PC.
- Supabase, miljøvariabler og database endres ikke.
- Fungerende oppdrag og kart endres ikke.
- Produksjon (`main`) endres ikke før brukeren har godkjent Vercel Preview.

## Oppgaver

1. Utvid den rene Regnemonster-rundelogikken med tre liv, tapstilstand og ny runde med gjenopprettede liv. Legg til regeltester.
2. Gjør Regnemonster-valgpanelet skrollbart på telefon.
3. Gi samlepermen én side om gangen på telefon, 3 x 3 kort, sikre navigasjonsknapper og korte settetiketter.
4. Sperr Tallvokterens verden på telefon både i kartvalget og ved forsøk på direkte åpning.
5. Sørg for at leirdelene har synlige, iPad-vennlige teksturer og en reservevisning dersom teksturen svikter.
6. Juster sirkelregistreringen hos Sumpalkymisten slik at rolig, faktisk røring registreres.
7. Stabiliser fiskescenens håndtering av ekstra fingre, avbrutte berøringer og Safari-gestures.
8. Kjør relevante tester, typekontroll og produksjonsbygg.
9. Commit og push kun arbeidsgrenen. Bekreft Vercel Preview før brukerens enhetstest.

## Manuell testmatrise for Preview

- **iPad:** Leirdeler er synlige; rolig røring virker; gjentatt rask fisketrykking låser ikke input.
- **Telefon stående og liggende:** Tallvokteren er sperret; oppgavevalget kan skrolles; permen viser én hel side med piler og kryss.
- **PC og iPad:** Eksisterende dobbelsidige samleperm beholdes.
- **Alle plattformer:** Tre feil avslutter runden uten kort; ti riktige gir kort; ny runde starter med tre liv.
