# Regnemester

Regnemester er et matematikkspill for barn, bygget med React, Vite og Phaser. Appen er laget for PC, iPad og mobil og inneholder fire hovedmoduser:

- **Normal:** finspisset oppgavegenerator for individuell trening i de fire regneartene og blandede oppgaver.
- **Skolekampen:** tidsstyrte klasserunder med serverkontrollert poengberegning og highscore.
- **Boss Battle:** regneoppgaver kombinert med bosskamper, progresjon og opplåsinger.
- **Regnereisen:** en interaktiv spillverden med spillbrikker, kart, oppdrag, belønninger, samlerom og butikk.

## Regnereisen

Regnereisen bruker den samme oppgavegeneratoren som Normal-modusen. Spilleren kan velge mellom:

- **Boss-reisen** med progresjon gjennom bossområder.
- **Regneriket** med steder, oppdrag og samleobjekter.
- **Tallvokterens verden** med utforsking og minispill. Verdenen kan merkes `Kommer snart` eller åpnes fra adminpanelet. Lokal utvikling har en tilsvarende lokal bryter.
- **Regnemonster** med oppgaver, kortbelønninger og samleperm for Sett 1, Holosett, Spesialsett og Elevsett.

Regnereisen lagrer lokal spillprogresjon i nettleseren. Regnemonster-kortene og trekningen er lokale og har ingen Supabase-avhengighet.

## Lokal utvikling

Krav: Node.js 22.12–24.

```bash
npm ci
npm run dev
```

Kopier `.env.example` til `.env.local` og fyll inn prosjektets offentlige Supabase-verdier:

```env
VITE_SUPABASE_URL=https://DIN-PROSJEKTREF.supabase.co
VITE_SUPABASE_ANON_KEY=LIM-INN-ANON-PUBLIC-KEY-HER
```

`anon`-nøkkelen er offentlig og kan ligge i frontend. `service_role`-nøkkelen skal aldri ligge i Vite-, GitHub- eller klientmiljøvariabler. Supabase tilfører den automatisk i Edge Function-miljøet.

## Sikker servergrense

- Nettleseren kan bare lese offentlige highscores og ufarlige appinnstillinger.
- Skolekampen oppretter en tidsbegrenset engangsrunde gjennom `regnemester-api`. Serveren lagrer spørsmålene og avleder score/tid fra svarlisten; nettleserens sluttresultat blir ikke godtatt som fasit.
- Admin bruker Supabase Auth via e-postlenke og en privat `admin_users`-tillatelsesliste. Klienten kan ikke opprette nye Auth-brukere, og det finnes ingen admin-PIN i klienten.

## Supabase-endringer

Databaseskjemaet er versjonert i `supabase/migrations`, og Edge Function-koden ligger i `supabase/functions/regnemester-api`.

Vanlig arbeidsflyt etter at førstegangsutrullingen er fullført:

```bash
npx supabase link --project-ref DIN-PROSJEKTREF
npx supabase db push
npx supabase functions deploy regnemester-api --no-verify-jwt
```

`--no-verify-jwt` er bevisst for dette kombinerte endepunktet: offentlige handlinger er ratebegrenset og bruker tidsbegrensede engangstoken, mens adminhandlinger validerer Supabase access token pluss privat adminliste. Alle interne databasefunksjoner kan bare kjøres av `service_role`.

Førstegangs sikkerhetsutrulling må gjøres i denne rekkefølgen for å unngå nedetid:

1. Bruk foundation-migrasjonen `20260713113634_secure_admin_scores_and_settings.sql`.
2. Bruk tempo-migrasjonen `20260713114554_guard_school_battle_round_pacing.sql`.
3. Deploy `regnemester-api`.
4. Opprett adminbrukeren i Supabase Auth, legg brukerens UUID i `private.admin_users`, og hold offentlig registrering avslått.
5. Deploy den nye frontend-versjonen og kjør smoke-test.
6. Bruk `20260714092321_retire_insecure_legacy_endpoints.sql` for å fjerne PIN-, legacy- og direkte score-endepunkter.

Ikke legg admin-e-post eller bruker-UUID i en commit. Allowlist-innslaget er produksjonskonfigurasjon.

## Verifisering før push

```bash
npm test
npm audit --audit-level=high
npm run build
deno check --config supabase/functions/regnemester-api/deno.json supabase/functions/regnemester-api/index.ts
```

GitHub Actions kjører de samme kontrollene. Bruk helst en kortlivet branch og pull request; Vercel lager preview-deploy før endringen merges til `main`. Produksjonsdeploy skjer fortsatt fra `main`.

## Bilder og databruk

Runtime-bilder bruker WebP med egne kvalitetsprofiler for bakgrunner, gjennomsiktige figurer og teksttunge motiver. Kollisjonskart, masker og andre dataavlesende bilder forblir pikselkorrekte PNG-filer. Originale arbeidsfiler skal ikke ligge i `public`, fordi alt der blir en del av produksjonsdeployen.

Verktøyene under `scripts/assets` brukes til inventar, kontrollert konvertering og kontroll av bildehenvisninger. En vanlig lokal kontroll er:

```bash
python scripts/assets/inventory-runtime-images.py --public-root public --json artifacts/image-inventory.json
node scripts/assets/verify-runtime-images.mjs http://127.0.0.1:5173/
```

Konvertering skal alltid gjøres fra en egen branch og etterfølges av visuell kontroll, tester og produksjonsbuild. Konverteringsreglene ligger i `scripts/assets/image-optimization-config.json`.

## Vercel

`vercel.json` legger på CSP og øvrige sikkerhetsheadere. Bare innholdshashede filer under `/assets/` får lang `immutable`-cache; `index.html` revalideres normalt slik at nye versjoner blir synlige raskt.
