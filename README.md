# Regnemester

Regnemester er et matematikkspill for barn, bygget med React og Vite. Appen inneholder Normal, Skolekampen, Boss Battle og Regnereisen.

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
- Regnereisen-koden lagres som hash i privat databaseskjema og kontrolleres med ratebegrensning.
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

## Vercel

`vercel.json` legger på CSP og øvrige sikkerhetsheadere. Bare innholdshashede filer under `/assets/` får lang `immutable`-cache; `index.html` revalideres normalt slik at nye versjoner blir synlige raskt.
