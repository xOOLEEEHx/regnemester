# Regnemester

Regnemester er en matematikkapp for elever på barnetrinnet. Appen lar elevene øve på regnearter, konkurrere i Skolekampen og kjempe seg gjennom Boss Battle.

Produksjon: https://regnemester.vercel.app/

## Hva er Regnemester?

Regnemester er laget for korte, tydelige og motiverende matteøkter. Elevene kan trene på addisjon, subtraksjon, multiplikasjon og divisjon, med ulike nivåer og spillmoduser.

Appen bygges med React og Vite, bruker Supabase til Skolekampen/highscore og publiseres på Vercel.

## Moduser

### Normal / Treningsarena

- Øvingsmodus uten highscore.
- Elevene velger regneart og nivå.
- Støtter addisjon, subtraksjon, multiplikasjon og divisjon.
- Har også Blanding, der flere regnearter kan øves sammen.

### Skolekampen / Turnering

- Konkurransemodus for klasser og skoler.
- Elevene velger skole, klasse, regneart og spillnavn.
- Bruker Supabase-basert highscore.
- Kan åpnes og stenges fra admin.
- Når Skolekampen er stengt, kan elevene fortsatt bruke Normal og Boss Battle.

### Boss Battle / Boss-arena

- Elevene kjemper mot bosser ved å svare riktig på matteoppgaver.
- Har boss-stige med lokal progresjon på enheten/nettleseren.
- Nye bosser låses opp etter hvert som eleven slår tidligere bosser.
- Støtter addisjon, subtraksjon, multiplikasjon, divisjon og Blanding.

## Teknologi

- React
- Vite
- Supabase
- Vercel

## Kjør lokalt

Installer avhengigheter og start utviklingsserveren fra prosjektroten:

```powershell
npm.cmd install
npm.cmd run dev
```

## Bygg prosjektet

Kjør produksjonsbuild lokalt:

```powershell
npm.cmd run build
```

## Miljøvariabler

Lag en `.env.local` i prosjektroten for lokal utvikling:

```env
VITE_SUPABASE_URL=https://DIN-PROSJEKTREF.supabase.co
VITE_SUPABASE_ANON_KEY=LIM-INN-ANON-PUBLIC-KEY-HER
VITE_ADMIN_PIN_FALLBACK=DIN_ADMIN_PIN_HER
```

`VITE_SUPABASE_ANON_KEY` er frontend-nøkkelen som kan brukes i appen. Bruk aldri `service_role`-nøkkelen i frontend.

Ekte verdier skal ligge i `.env.local` lokalt og som Environment Variables i Vercel.

## Supabase

Supabase brukes til Skolekampen/highscore og app-innstillinger.

Appen bruker blant annet app setting `school_battle_enabled` for å styre om Skolekampen er åpen eller stengt. Adminpanelet bruker også app-innstillinger til startsidebeskjed.

Denne README-en inneholder ikke gammel SQL-oppskrift, fordi databasefelter og RPC-funksjoner må holdes synkronisert med faktisk Supabase-oppsett. Bruk gjeldende Supabase-prosjekt og eventuelle oppdaterte migrasjoner/oppsettsnotater som følger prosjektet.

## Publisering

Appen publiseres via Vercel.

Ved deploy må nødvendige miljøvariabler legges inn i Vercel:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ADMIN_PIN_FALLBACK`

## Viktig utviklingsprinsipp

Regnemester utvikles stegvis og testes i praksis med elever. Stabilitet, tydelig flyt og trygge små endringer er viktigere enn store omskrivinger.
