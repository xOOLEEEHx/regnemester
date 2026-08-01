# Skolestart – baseline for lasting, ytelse, minne og opprydding

## Kort konklusjon

Port 1: **godkjent av brukeren 2026-08-01**. Målingen har funnet en reproduserbar oppryddingsfeil, høy førstegangs-last og merkbar hakking i Labyrinten. Den fysiske testen betyr ikke at appen er ferdig godkjent for svakere skole-iPader. Appkoden er ikke endret.

## Miljø og metode

- Baseline-commit: `129422d97eb126ba6eb983c3329d12c3eb956c35`
- Profiler: Chromium 1024 × 768, DPR 2, touch; normal PC-referanse og 4× CPU / 4 Mbit/s konservativ profil.
- Rådata: ignorert `artifacts/skolestart-baseline/`; rapporten inneholder bare aggregater og URL-er uten query/hash.
- Safari-begrensning: direkte Safari-minne er ikke målt fordi Mac mangler.
- Fysisk enhet: iPad (A16), iPadOS 26.5, Safari over lokalt Wi-Fi. Test-iPaden antas å være sterkere enn skolens iPader.

## Lasting og ytelse

| Scenario | Profil | Runder | Synlig s | LCP s | Nett rolig s | Spillbar s | MB | Requests | TBT ms |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| A01-cold-home | tablet-conservative | 3 | 2,3 | 18,6 | 37,5 | – | 17,4 | 19 | 147 |
| A01-cold-home | tablet-native | 3 | 0,2 | 0,2 | 1,6 | – | 17,4 | 19 | 0 |
| A02-normal-without-regnereisen | tablet-conservative | 1 | 2,6 | 2,4 | – | 7,0 | 4,2 | 21 | 437 |
| A02-normal-without-regnereisen | tablet-native | 1 | 0,2 | 0,3 | – | 4,3 | 17,4 | 21 | 0 |
| A03-school-without-regnereisen | tablet-conservative | 1 | 2,3 | 2,2 | – | 6,8 | 4,2 | 27 | 189 |
| A03-school-without-regnereisen | tablet-native | 1 | 0,2 | 0,4 | – | 4,7 | 17,4 | 27 | 0 |
| A04-first-regnereisen-open | tablet-conservative | 3 | 2,4 | 2,3 | – | 374,3 | 180,1 | 393 | 17 984 |
| A04-first-regnereisen-open | tablet-native | 3 | 0,2 | 0,2 | – | 10,7 | 208,9 | 394 | 7 033 |
| A05-map-bossreisen | tablet-conservative | 1 | 2,3 | 2,2 | – | 407,0 | 210,8 | 396 | 46 439 |
| A05-map-bossreisen | tablet-native | 1 | 0,2 | 0,3 | – | 21,8 | 210,8 | 396 | 20 866 |
| A05-map-regnemonster | tablet-conservative | 1 | 2,3 | 2,2 | – | 400,9 | 210,8 | 398 | 46 792 |
| A05-map-regnemonster | tablet-native | 1 | 0,2 | 0,3 | – | 18,5 | 210,8 | 398 | 22 408 |
| A05-map-regneriket | tablet-conservative | 1 | 2,4 | 2,3 | – | 487,0 | 229,4 | 400 | 94 326 |
| A05-map-regneriket | tablet-native | 1 | 0,2 | 0,3 | – | 22,1 | 229,4 | 400 | 20 665 |
| A05-map-tallvokterens-rike | tablet-conservative | 1 | 2,3 | 2,2 | – | 650,0 | 299,3 | 470 | 259 060 |
| A05-map-tallvokterens-rike | tablet-native | 1 | 0,2 | 0,3 | – | 41,3 | 299,3 | 470 | 95 376 |
| A06-heavy-scenes-and-binder:boat-travel | tablet-native | 1 | 0,2 | 0,3 | – | 37,2 | 295,7 | 465 | 52 009 |
| A06-heavy-scenes-and-binder:counterweight-vault | tablet-native | 1 | 0,2 | 0,3 | – | 40,9 | 313,1 | 485 | 53 482 |
| A06-heavy-scenes-and-binder:crystal-cart | tablet-native | 1 | 0,2 | 0,3 | – | 46,9 | 311,4 | 478 | 57 929 |
| A06-heavy-scenes-and-binder:fishing | tablet-native | 1 | 0,2 | 0,3 | – | 36,1 | 295,7 | 465 | 49 901 |
| A06-heavy-scenes-and-binder:light-forest | tablet-native | 1 | 0,2 | 0,3 | – | 39,2 | 298,8 | 466 | 56 298 |
| A06-heavy-scenes-and-binder:maze | tablet-native | 1 | 0,2 | 0,3 | – | 40,2 | 296,2 | 466 | 36 167 |
| A06-heavy-scenes-and-binder:swamp-alchemy | tablet-native | 1 | 0,2 | 0,3 | – | 37,9 | 314,8 | 488 | 60 035 |
| A07-five-entry-exit-rounds | tablet-conservative | 1 | 2,3 | 2,2 | – | – | 858,4 | 1 784 | 135 405 |
| A07-five-entry-exit-rounds | tablet-native | 1 | 0,2 | 0,3 | – | – | 858,4 | 1 784 | 44 114 |
| A08-thirty-minute-session | tablet-native | 1 | 0,2 | 0,3 | – | 13,0 | 210,8 | 396 | – |

## Regnereisen-grenser

- Kald hovedside har 0 observerte Regnereisen-ressurser før klikk.
- Første Regnereisen-åpning legger til omtrent 191,5 MB på PC-profilen.
- Tallene er request-miks for én bruker. De er ikke en kapasitetstest for 40/100 samtidige elever.

## Minne og opprydding

Fem runder viste lyttere 323 → 859 etter GC. Tilkoblet canvas/WebGL gikk tilbake til null. Heap-snapshotene viser samtidig beholdte, frakoblede Shadow DOM-trær og spillcanvas.

30-minuttersøkten på PC fullførte uten krasj. JS-heap var 12,8 MB ved spillbar start, 26,7 MB ved 30 minutter og 10,5 MB etter full utgang og GC. Canvas/WebGL gikk tilbake til null. Den separate 30-minuttersøkten på fysisk iPad fullførte også uten svart skjerm, automatisk refresh eller fastlåste knapper. Safari-heap kunne ikke måles uten Mac, så den fysiske testen motbeviser ikke den skjulte oppryddingsfeilen.

## Fysisk iPad og feltdata

- Fysisk iPad: iPad (A16) med iPadOS 26.5; kontrollen er fullført over lokal preview, ikke Vercel CDN.
- Kald hovedside: omtrent 1-2 s til fire moduser og responsiv knapp.
- Første Regnereisen-åpning: omtrent 5-6 s; åpning 2–5: omtrent 3-4 s. Fem inn/ut-runder ga ingen økende ventetid, svart skjerm, refresh eller inputtap.
- Tallvokterens verden: omtrent 4 s fra «Velg» til spillbart kart. Lyd, rotasjon, bakgrunn/retur, berøring og tilbakeknapp fungerte.
- Labyrinten: lastet opplevd umiddelbart. Hakking under bevegelse gjorde styringen litt vanskeligere, men scenen var fortsatt spillbar og avbrutt berøring låste ikke input.
- 30 minutter sammenhengende Regnereisen: hakking var stabil, alle knapper fungerte, ingen svart skjerm og ingen automatisk refresh.
- Safari Web Inspector: ikke tilgjengelig fra Windows; Chromium-tall omtales ikke som iPad-minne.
- Vercel runtime: 0 runtime-feilgrupper siste 7d; Statisk React-klient og Supabase-feil dekkes ikke nødvendigvis av Vercel runtime-feil.
- Vercel Speed Insights: ikke hentet – Speed Insights er dashboard-only og ikke eksponert i den tilgjengelige read-only-tilkoblingen.
- Privat teknisk feillogg: 19 Regnereisen-hendelser: 18 lydoppstart-feil (15 iOS/Chrome, 3 macOS/Safari) og 1 nullstilt pointer/input på iOS. Fire Windows-hendelser fra dagens lokale baseline er ekskludert som labgenererte.

## Funn

| ID | Alvorlighet | Funn | Evidens | Minste sannsynlige område |
|---|---|---|---|---|
| A-LOAD-01 | viktig | Hovedsiden laster en stor bildemengde før eleven velger modus | 17,4 MB per kald åpning. Konservativ profil: LCP 18,6 s og nettverk rolig 37,5 s. | presentasjonsbilder på hovedsiden |
| A-LOAD-02 | viktig | Første Regnereisen-åpning har svært høy ressurslast | 208,9 MB og median spillbar 10,7 s på PC-profilen. | tidlig lasting av bilder, kart, belønninger og spillbrikker |
| A-CLEAN-01 | kritisk | Regnereisen beholder lyttere og frakoblede DOM-trær etter full utgang | JS-lyttere etter GC økte 323 → 859 over fem runder. Heap-snapshot viste 1082 → 2490 frakoblede noder og 5 beholdte spillcanvas. | HudController/Shadow DOM/Phaser-livsløp ved unmount |
| A-LOAD-04 | viktig | Hver ny Regnereisen-åpning henter den tunge ressursmengden på nytt | Fire gjentatte åpninger overførte 160,1 MB og 344 requests hver. | ressurscache og ny montering av Regnereisen |
| A-LOAD-03 | viktig | Tallvokterens verden er klart tyngste kart i baseline | 299,3 MB mot 210,8 MB for Boss-reisen i kald+varm kartkjøring. | Tallvokter-kart og scenesærskilte bilder |
| A-LIMIT-01 | kan vente | Chromium-profilen er ikke en fysisk skole-iPad | CPU- og nettverksbegrensning gir konservativ sammenligning, men sier ikke direkte noe om Safari-heap eller iPad-GPU. | målebegrensning |
| A-FIELD-01 | viktig | Feltloggen viser gjentatte lydoppstart-feil på iOS/Chrome | 15 aggregerte hendelser siste 7d. Lydfeilen ble ikke reprodusert i den fysiske Safari-testen. | Phaser/Web Audio-oppstart og bakgrunn/retur |
| A-FIELD-02 | kan vente | Én iOS-feil gjelder pointer-reset | 1 hendelse siste 7d; ikke klassifisert høyere uten reproduksjon eller dokumentert inputtap. | input-recovery ved bakgrunn/retur eller opprydding |
| A-PERF-01 | viktig | Labyrinten hakker under bevegelse på fysisk test-iPad | Lasting er umiddelbar og input låser seg ikke, men hakkingen gjør styringen litt vanskeligere. | Labyrintens oppdaterings-/renderløp; mål før eventuell liten retting |

## Avgrenset eller manglende dekning

- A06-heavy-scenes-and-binder/binder/tablet-native: 0/1
- A06-heavy-scenes-and-binder/fishing/tablet-conservative: 0/1
- A06-heavy-scenes-and-binder/boat-travel/tablet-conservative: 0/1
- A06-heavy-scenes-and-binder/crystal-cart/tablet-conservative: 0/1
- A06-heavy-scenes-and-binder/swamp-alchemy/tablet-conservative: 0/1
- A06-heavy-scenes-and-binder/light-forest/tablet-conservative: 0/1
- A06-heavy-scenes-and-binder/counterweight-vault/tablet-conservative: 0/1
- A06-heavy-scenes-and-binder/maze/tablet-conservative: 0/1
- A06-heavy-scenes-and-binder/binder/tablet-conservative: 0/1
- Samlepermen lot seg ikke nå pålitelig med desktop-automatiseringen og har ikke egen kontrollert målerad.
- Den svakeste faktiske skole-iPaden er fortsatt ukjent og må brukes til en kort kontroll av A04, A07, A08 og Labyrinten når den blir tilgjengelig. Dette er en begrensning for sluttgodkjenning, ikke for Port 1-prioriteringen.

## Kan vente

- Skolekampens kjente 25/24-feil er med vilje ikke undersøkt her.
- Store omskrivinger og nye funksjoner er utenfor arbeidspakke A.
- Lokale 404-feil fra favicon/Speed Insights under Vite-preview behandles som målemiljøstøy til de eventuelt kan reproduseres i produksjon.

## Port 1

**godkjent av brukeren 2026-08-01.** Prioriter deretter:

1. `A-CLEAN-01`: finn og stopp lytter-/DOM-opphopningen ved utgang fra Regnereisen.
2. `A-LOAD-02`, `A-LOAD-04` og `A-LOAD-03`: reduser unødvendig førstegangs- og gjentatt lasting i små, målbare steg.
3. `A-PERF-01`: profiler Labyrinten og vurder en liten retting dersom kostnaden kan isoleres uten omskriving.
4. Følg opp `A-FIELD-01` uten å endre lydflyten før en reproduksjon eller mer presis evidens finnes.

Arbeidspakke B–E er ikke startet. Ingen kodeoptimalisering skal begynne før brukeren har godkjent denne prioriteringen.
