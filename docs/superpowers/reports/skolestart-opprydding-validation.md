# Regnereisen – validering av opprydding

- Baseline-commit: `129422d97eb126ba6eb983c3329d12c3eb956c35`
- Kandidat-diff SHA-256: `6ab27f5f2a0c49080f030b77b82b0169ea0148006a06e8845ab2cc920ab39bce`
- Før: tre rene kjøringer viste alle 457 → 859 lyttere fra runde 2 til 5. Trace-heap viste 1046 → 2383 frakoblede noder, 457 → 859 registrerte lyttere og gamle spillcanvas.
- Etter: tre rene kjøringer viste alle 191 → 194 lyttere fra runde 2 til 5. Trace-heap viste 139 → 139 frakoblede noder, 191 → 194 registrerte lyttere og ingen gamle 1024 × 768-spillcanvas i verken runde 2 eller 5.
- Canvas/WebGL: alle etter-utgangspunkter viste 0 tilkoblede canvas og 0 WebGL-kontekster.
- Funksjonell røykprøve på PC: bestått fem hele åpne–spille–avslutte-runder. Hver runde viste nøyaktig én startside, én tilbakeknapp og ett Regnereisen-valg. Startside, kartvalg, innstillinger, spillkart og retur til hovedsiden ble også kontrollert visuelt.
- Nettleserfeil i PC-prøven: ingen sidefeil. Én lokal 404 gjaldt bare Vercels valgfrie måleskript `/_vercel/speed-insights/script.js`, ikke appinnhold eller spillflyt.
- Fysisk iPad-prøve: fem åpne–avslutte-runder, øvrige knapper, bakgrunn/gjenopptak, fisking og gryterøring fungerte. Prøven avdekket at et sakte ingrediensdrag i Sumpalkymisten kunne hoppe mellom benken og fingeren.
- Ingrediensdrag-retting: skjermtilpasningen beholder nå ingrediensposisjonen mens enten Phaser-drag eller det aktive native iPad-touchdraget pågår. Touch-handlerne, slippavgjørelsen og røringen er uendret.
- Kontroll etter retting: 55/55 tester, typekontroll og produksjonsbygg besto. Tallvokter-kartet ble åpnet kaldt og varmt og kontrollert visuelt før ren retur til hovedsiden.
- Ny isolert A07-måling etter ingrediensrettingen: tre rene kjøringer viste igjen 191 → 194 lyttere; heap viste 139 → 139 frakoblede noder, 191 → 194 registrerte lyttere og 0 → 0 beholdte spillcanvas.
- Fysisk iPad-retest etter retting: sakte dra og slipp av ingrediens fungerte uten hopping. Brukeren bekreftet at handlingen fungerte perfekt.
- Beslutning: A07-oppryddingskravene, PC-røykprøvene og den målrettede fysiske iPad-retesten er bestått. Oppryddingsrettingen og ingrediensdrag-rettingen er funksjonelt godkjent.
- Begrensning: fysisk Safari-heap kan ikke måles uten Mac. Skolens svakeste iPad er fortsatt ukjent.

## Beviskjede

1. Førvarianten beholdt 402 nye lyttere mellom runde 2 og 5.
2. HUD-konstruktørens opprydding reduserte veksten til 66.
3. Kortlivede kart-, regnearts- og vanskelighetslyttere reduserte veksten til 30.
4. Heap viste fem gamle 1024 × 768-spillcanvas med `WorldScene`-handlerne `handleCanvasTouchStart`, `handleCanvasTouchMove` og `handleCanvasTouchEnd`.
5. Phaser-koden viste at full `Game.destroy()` sender scenehendelsen `DESTROY`, mens `WorldScene` bare ryddet ved `SHUTDOWN`.
6. Samme eksisterende WorldScene-opprydding registreres nå for begge avslutningsveier og kan bare kjøre én gang.
7. Sluttvarianten bestod med +3 lyttere, 0 vekst i frakoblede noder og ingen gamle spillcanvas fra runde 2 til 5.

## Funksjonsvern

- Ingen touch-handler, event-type, `capture`- eller `passive`-innstilling er endret.
- Fisking, gryterøring, spillregler, progresjon, innhold og visuell oppførsel er ikke skrevet om.
- Den nye sceneoppryddingen aktiveres bare når scenen stopper eller hele Regnereisen ødelegges.
- Målrettede tester bekrefter opprydding ved både `SHUTDOWN` og `DESTROY`, og at oppryddingen ikke dobbelkjøres.
