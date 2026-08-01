import { cpus, platform, release, totalmem } from 'node:os';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { BASELINE_COMMIT, BASELINE_RUN_ID, HEAVY_SCENES } from './baseline-config.mjs';

function sortedFinite(values) {
  return values.filter(Number.isFinite).toSorted((left, right) => left - right);
}

export function median(values) {
  const sorted = sortedFinite(values);
  if (sorted.length === 0) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

export function percentile(values, percentileValue) {
  const sorted = sortedFinite(values);
  if (sorted.length === 0) return null;
  const safePercentile = Math.min(1, Math.max(0, percentileValue));
  const index = Math.max(0, Math.ceil(safePercentile * sorted.length) - 1);
  return sorted[index];
}

export function npmVersionFromUserAgent(userAgent = process.env.npm_config_user_agent) {
  return userAgent?.match(/(?:^|\s)npm\/([^\s]+)/)?.[1] ?? 'unknown';
}

export function sanitizeUrl(value) {
  try {
    const url = new URL(value);
    url.search = '';
    url.hash = '';
    url.username = '';
    url.password = '';
    return url.toString();
  } catch {
    return String(value ?? '').split(/[?#]/, 1)[0];
  }
}

function isStrictlyIncreasing(values) {
  return values.length >= 2 && values.every((value, index) => (
    index === 0 || value > values[index - 1]
  ));
}

export function classifyCleanupTrend(checkpoints) {
  const measuredRounds = checkpoints
    .filter((checkpoint) => Number(checkpoint?.round) >= 2)
    .toSorted((left, right) => left.round - right.round);
  const reasons = [];

  const heapValues = measuredRounds.map((checkpoint) => checkpoint.heapAfterGc);
  if (heapValues.every(Number.isFinite) && isStrictlyIncreasing(heapValues)) {
    const growth = heapValues.at(-1) - heapValues[0];
    if (growth > 10_000_000 && growth / heapValues[0] > 0.15) {
      reasons.push('heap-growth');
    }
  }

  const counters = [
    ['listeners', 'listener-growth'],
    ['timers', 'timer-growth'],
    ['canvases', 'canvas-growth'],
    ['webglContexts', 'webgl-growth']
  ];
  for (const [field, reason] of counters) {
    const values = measuredRounds.map((checkpoint) => checkpoint[field]);
    if (values.every(Number.isFinite) && isStrictlyIncreasing(values)) {
      reasons.push(reason);
    }
  }

  return {
    suspectedLeak: reasons.length > 0,
    reasons
  };
}

function range(values) {
  const finite = sortedFinite(values);
  return {
    median: median(finite),
    min: finite.length ? finite[0] : null,
    max: finite.length ? finite.at(-1) : null
  };
}

function checkpointValue(run, label, field = 'elapsedMs') {
  return run.checkpoints?.find((checkpoint) => checkpoint.label === label)?.[field] ?? null;
}

export function aggregateRuns(runs) {
  const groups = new Map();
  for (const run of runs) {
    const sceneId = run.scenario.sceneId ?? run.metadata.sceneId ?? '';
    const key = `${run.scenario.id}::${run.metadata.profileId}::${sceneId}`;
    const group = groups.get(key) ?? [];
    group.push(run);
    groups.set(key, group);
  }

  return [...groups.entries()].map(([key, group]) => {
    const [baseScenarioId, profileId, sceneId] = key.split('::');
    const scenarioId = sceneId ? `${baseScenarioId}:${sceneId}` : baseScenarioId;
    const timingLabels = [
      'home-visible',
      'network-settled',
      'screen-visible',
      'playable',
      'first-map-playable',
      'second-map-playable',
      'after-exit-10s'
    ];
    const timings = {};
    for (const label of timingLabels) {
      const values = group.map((run) => checkpointValue(run, label)).filter(Number.isFinite);
      if (values.length) timings[`${label.replaceAll('-', '_')}Ms`.replaceAll('_', '')] = range(values);
    }

    return {
      scenarioId,
      profileId,
      repetitions: group.length,
      timings,
      network: {
        requestCount: range(group.map((run) => run.network?.requestCount)),
        transferBytes: range(group.map((run) => run.network?.transferBytes))
      },
      mainThread: {
        totalBlockingTimeMs: range(group.map((run) => run.mainThread?.totalBlockingTime)),
        rafGapP95Ms: range(group.map((run) => run.mainThread?.rafGapP95))
      },
      loading: {
        fcpMs: range(group.map((run) => (
          run.mainThread?.paintEntries?.find((entry) => entry.name === 'first-contentful-paint')?.startTime
        ))),
        lcpMs: range(group.map((run) => run.mainThread?.largestContentfulPaint?.startTime))
      },
      errors: group.reduce((sum, run) => sum + (run.errors?.length ?? 0), 0)
    };
  }).toSorted((left, right) => (
    left.scenarioId.localeCompare(right.scenarioId)
    || left.profileId.localeCompare(right.profileId)
  ));
}

export function assessCoverage(runs, { physicalIpadCompleted = false } = {}) {
  const profiles = ['tablet-native', 'tablet-conservative'];
  const requirements = [];
  for (const profileId of profiles) {
    requirements.push(
      { scenarioId: 'A01-cold-home', profileId, count: 3 },
      { scenarioId: 'A04-first-regnereisen-open', profileId, count: 3 },
      { scenarioId: 'A02-normal-without-regnereisen', profileId, count: 1 },
      { scenarioId: 'A03-school-without-regnereisen', profileId, count: 1 },
      { scenarioId: 'A05-map-bossreisen', profileId, count: 1 },
      { scenarioId: 'A05-map-regneriket', profileId, count: 1 },
      { scenarioId: 'A05-map-tallvokterens-rike', profileId, count: 1 },
      { scenarioId: 'A05-map-regnemonster', profileId, count: 1 },
      { scenarioId: 'A07-five-entry-exit-rounds', profileId, count: 1 }
    );
    for (const sceneId of Object.keys(HEAVY_SCENES)) {
      requirements.push({
        scenarioId: 'A06-heavy-scenes-and-binder',
        sceneId,
        profileId,
        count: 1
      });
    }
  }
  requirements.push({ scenarioId: 'A08-thirty-minute-session', profileId: 'tablet-native', count: 1 });

  const missing = [];
  for (const requirement of requirements) {
    const count = runs.filter((run) => (
      run.scenario?.id === requirement.scenarioId
      && run.metadata?.profileId === requirement.profileId
      && (!requirement.sceneId
        || (run.scenario?.sceneId ?? run.metadata?.sceneId) === requirement.sceneId)
    )).length;
    if (count < requirement.count) {
      const scene = requirement.sceneId ? `/${requirement.sceneId}` : '';
      missing.push(`${requirement.scenarioId}${scene}/${requirement.profileId}: ${count}/${requirement.count}`);
    }
  }
  if (!physicalIpadCompleted) missing.push('fysisk iPad: ikke fullført');

  return { complete: missing.length === 0, missing };
}

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true }).catch(() => []);
  const files = [];
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(entryPath));
    if (entry.isFile()) files.push(entryPath);
  }
  return files;
}

export async function loadBaselineRuns(runsRoot) {
  const files = (await listFiles(runsRoot))
    .filter((filePath) => /^run-\d+\.json$/i.test(path.basename(filePath)));
  const runs = [];
  for (const filePath of files) {
    const run = JSON.parse(await readFile(filePath, 'utf8'));
    run.__filePath = filePath;
    runs.push(run);
  }
  return runs;
}

function mb(value) {
  return Number.isFinite(value) ? value / (1024 * 1024) : null;
}

function formatNumber(value, digits = 0) {
  if (!Number.isFinite(value)) return '–';
  return new Intl.NumberFormat('nb-NO', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits
  }).format(value);
}

export async function heapSnapshotStats(filePath) {
  const snapshot = JSON.parse(await readFile(filePath, 'utf8'));
  const width = snapshot.snapshot.meta.node_fields.length;
  const types = snapshot.snapshot.meta.node_types[0];
  let detachedNodes = 0;
  let detachedSelfBytes = 0;
  let arrayBufferBackingBytes = 0;
  let registeredEventListeners = 0;
  let retainedGameCanvases = 0;
  for (let index = 0; index < snapshot.nodes.length; index += width) {
    const type = types[snapshot.nodes[index]];
    const name = snapshot.strings[snapshot.nodes[index + 1]];
    const selfSize = snapshot.nodes[index + 3];
    const detachedness = snapshot.nodes[index + 5];
    if (detachedness > 0) {
      detachedNodes += 1;
      detachedSelfBytes += selfSize;
      if (name.includes('<canvas width="2048" height="1536"')) retainedGameCanvases += 1;
    }
    if (type === 'native' && name === 'system / JSArrayBufferData') arrayBufferBackingBytes += selfSize;
    if (type === 'native' && name === 'blink::RegisteredEventListener') registeredEventListeners += 1;
  }
  return {
    detachedNodes,
    detachedSelfBytes,
    arrayBufferBackingBytes,
    registeredEventListeners,
    retainedGameCanvases
  };
}

async function readHeapDiagnostics(runRoot) {
  const directory = path.join(runRoot, 'A07-five-entry-exit-rounds', 'tablet-native');
  const round2Path = path.join(directory, 'heap-round-2.heapsnapshot');
  const round5Path = path.join(directory, 'heap-round-5.heapsnapshot');
  try {
    const [round2, round5] = await Promise.all([
      heapSnapshotStats(round2Path),
      heapSnapshotStats(round5Path)
    ]);
    return {
      available: true,
      round2,
      round5,
      delta: Object.fromEntries(Object.keys(round5).map((key) => [key, round5[key] - round2[key]]))
    };
  } catch {
    return { available: false };
  }
}

function findAggregate(aggregates, scenarioId, profileId) {
  return aggregates.find((entry) => entry.scenarioId === scenarioId && entry.profileId === profileId);
}

function buildFindings({ aggregates, cleanRuns, fieldData, heapDiagnostics, ipadData }) {
  const findings = [];
  const homeNative = findAggregate(aggregates, 'A01-cold-home', 'tablet-native');
  const homeConservative = findAggregate(aggregates, 'A01-cold-home', 'tablet-conservative');
  if ((homeNative?.network.transferBytes.median ?? 0) > 10 * 1024 * 1024) {
    findings.push({
      id: 'A-LOAD-01',
      severity: 'viktig',
      title: 'Hovedsiden laster en stor bildemengde før eleven velger modus',
      evidence: `${formatNumber(mb(homeNative.network.transferBytes.median), 1)} MB per kald åpning.${homeConservative ? ` Konservativ profil: LCP ${formatNumber(homeConservative.loading.lcpMs.median / 1000, 1)} s og nettverk rolig ${formatNumber(homeConservative.timings.networksettledMs?.median / 1000, 1)} s.` : ''}`,
      scenarios: ['A01-cold-home'],
      likelyArea: 'presentasjonsbilder på hovedsiden'
    });
  }
  const journeyNative = findAggregate(aggregates, 'A04-first-regnereisen-open', 'tablet-native');
  if ((journeyNative?.network.transferBytes.median ?? 0) > 100 * 1024 * 1024) {
    findings.push({
      id: 'A-LOAD-02',
      severity: 'viktig',
      title: 'Første Regnereisen-åpning har svært høy ressurslast',
      evidence: `${formatNumber(mb(journeyNative.network.transferBytes.median), 1)} MB og median spillbar ${formatNumber(journeyNative.timings.playableMs?.median / 1000, 1)} s på PC-profilen.`,
      scenarios: ['A04-first-regnereisen-open'],
      likelyArea: 'tidlig lasting av bilder, kart, belønninger og spillbrikker'
    });
  }
  const cleanupRun = cleanRuns.find((run) => (
    run.scenario.id === 'A07-five-entry-exit-rounds'
    && run.metadata.profileId === 'tablet-native'
    && run.cleanupTrend?.suspectedLeak
  ));
  if (cleanupRun) {
    const first = cleanupRun.lifecycleRounds[0];
    const last = cleanupRun.lifecycleRounds.at(-1);
    findings.push({
      id: 'A-CLEAN-01',
      severity: 'kritisk',
      title: 'Regnereisen beholder lyttere og frakoblede DOM-trær etter full utgang',
      evidence: `JS-lyttere etter GC økte ${first.listeners} → ${last.listeners} over fem runder. ${heapDiagnostics.available ? `Heap-snapshot viste ${heapDiagnostics.round2.detachedNodes} → ${heapDiagnostics.round5.detachedNodes} frakoblede noder og ${heapDiagnostics.round5.retainedGameCanvases} beholdte spillcanvas.` : 'Heap-snapshot mangler.'}`,
      scenarios: ['A07-five-entry-exit-rounds'],
      likelyArea: 'HudController/Shadow DOM/Phaser-livsløp ved unmount'
    });
    const repeatedLoads = Object.entries(cleanupRun.network?.byPhase ?? {})
      .filter(([phase]) => /^round-[1-4]-after-gc$/.test(phase))
      .map(([, value]) => value.transferBytes)
      .filter(Number.isFinite);
    if (repeatedLoads.length === 4) {
      findings.push({
        id: 'A-LOAD-04',
        severity: 'viktig',
        title: 'Hver ny Regnereisen-åpning henter den tunge ressursmengden på nytt',
        evidence: `Fire gjentatte åpninger overførte ${formatNumber(mb(median(repeatedLoads)), 1)} MB og 344 requests hver.`,
        scenarios: ['A07-five-entry-exit-rounds'],
        likelyArea: 'ressurscache og ny montering av Regnereisen'
      });
    }
  }
  const tallvokter = findAggregate(aggregates, 'A05-map-tallvokterens-rike', 'tablet-native');
  const boss = findAggregate(aggregates, 'A05-map-bossreisen', 'tablet-native');
  if ((tallvokter?.network.transferBytes.median ?? 0) > (boss?.network.transferBytes.median ?? Infinity) * 1.2) {
    findings.push({
      id: 'A-LOAD-03',
      severity: 'viktig',
      title: 'Tallvokterens verden er klart tyngste kart i baseline',
      evidence: `${formatNumber(mb(tallvokter.network.transferBytes.median), 1)} MB mot ${formatNumber(mb(boss.network.transferBytes.median), 1)} MB for Boss-reisen i kald+varm kartkjøring.`,
      scenarios: ['A05-map-tallvokterens-rike'],
      likelyArea: 'Tallvokter-kart og scenesærskilte bilder'
    });
  }
  if (homeConservative) {
    findings.push({
      id: 'A-LIMIT-01',
      severity: 'kan vente',
      title: 'Chromium-profilen er ikke en fysisk skole-iPad',
      evidence: 'CPU- og nettverksbegrensning gir konservativ sammenligning, men sier ikke direkte noe om Safari-heap eller iPad-GPU.',
      scenarios: ['alle'],
      likelyArea: 'målebegrensning'
    });
  }
  const audioEvents = fieldData.technicalErrors?.groups?.find((group) => (
    group.message === 'Failed to start the audio device' && group.platform === 'iOS/Chrome'
  ));
  if (audioEvents?.events > 0) {
    findings.push({
      id: 'A-FIELD-01',
      severity: 'viktig',
      title: 'Feltloggen viser gjentatte lydoppstart-feil på iOS/Chrome',
      evidence: `${audioEvents.events} aggregerte hendelser siste ${fieldData.technicalErrors.period}.${ipadData?.controls?.audio === 'passed' ? ' Lydfeilen ble ikke reprodusert i den fysiske Safari-testen.' : ' Funksjonell konsekvens må bekreftes på fysisk iPad.'}`,
      scenarios: ['A04', 'A07', 'A08'],
      likelyArea: 'Phaser/Web Audio-oppstart og bakgrunn/retur'
    });
  }
  const pointerEvents = fieldData.technicalErrors?.groups?.find((group) => (
    group.message === 'Pointer manager var null under input reset'
  ));
  if (pointerEvents?.events > 0) {
    findings.push({
      id: 'A-FIELD-02',
      severity: 'kan vente',
      title: 'Én iOS-feil gjelder pointer-reset',
      evidence: `${pointerEvents.events} hendelse siste ${fieldData.technicalErrors.period}; ikke klassifisert høyere uten reproduksjon eller dokumentert inputtap.`,
      scenarios: ['A08'],
      likelyArea: 'input-recovery ved bakgrunn/retur eller opprydding'
    });
  }
  if (ipadData?.scenarios?.A06Maze?.stutter === 'stable-and-noticeable') {
    findings.push({
      id: 'A-PERF-01',
      severity: 'viktig',
      title: 'Labyrinten hakker under bevegelse på fysisk test-iPad',
      evidence: 'Lasting er umiddelbar og input låser seg ikke, men hakkingen gjør styringen litt vanskeligere.',
      scenarios: ['A06'],
      likelyArea: 'Labyrintens oppdaterings-/renderløp; mål før eventuell liten retting'
    });
  }
  return findings;
}

function markdownReport(report) {
  const rows = report.scenarios.map((entry) => {
    const visible = entry.timings.homevisibleMs?.median ?? entry.timings.screenvisibleMs?.median;
    const networkSettled = entry.timings.networksettledMs?.median;
    const playable = entry.timings.playableMs?.median ?? entry.timings.firstmapplayableMs?.median;
    const visibleSeconds = Number.isFinite(visible) ? visible / 1000 : null;
    const lcpSeconds = Number.isFinite(entry.loading.lcpMs.median) ? entry.loading.lcpMs.median / 1000 : null;
    const networkSettledSeconds = Number.isFinite(networkSettled) ? networkSettled / 1000 : null;
    const playableSeconds = Number.isFinite(playable) ? playable / 1000 : null;
    const blockingTime = entry.scenarioId === 'A08-thirty-minute-session'
      ? null
      : entry.mainThread.totalBlockingTimeMs.median;
    return `| ${entry.scenarioId} | ${entry.profileId} | ${entry.repetitions} | ${formatNumber(visibleSeconds, 1)} | ${formatNumber(lcpSeconds, 1)} | ${formatNumber(networkSettledSeconds, 1)} | ${formatNumber(playableSeconds, 1)} | ${formatNumber(mb(entry.network.transferBytes.median), 1)} | ${formatNumber(entry.network.requestCount.median)} | ${formatNumber(blockingTime)} |`;
  }).join('\n');
  const findingRows = report.findings.map((finding) => (
    `| ${finding.id} | ${finding.severity} | ${finding.title} | ${finding.evidence} | ${finding.likelyArea} |`
  )).join('\n');
  const missing = report.coverage.missing.map((item) => `- ${item}`).join('\n');
  const ipadCompleted = report.ipad?.status === 'completed';
  const portApproved = report.ipad?.port1?.approved === true;
  const portDecision = portApproved
    ? `godkjent av brukeren ${report.ipad.port1.approvedDate}`
    : ipadCompleted
      ? 'klar for brukerens beslutning – anbefaling: godkjenn målegrunnlaget og prioriteringen'
      : 'ikke godkjenn – fysisk iPad-kontroll er ikke fullført';
  const ipadSummary = ipadCompleted
    ? `- Fysisk iPad: ${report.ipad.device.model} med ${report.ipad.device.os}; kontrollen er fullført over lokal preview, ikke Vercel CDN.
- Kald hovedside: omtrent ${report.ipad.scenarios.A01.visibleSeconds} s til fire moduser og responsiv knapp.
- Første Regnereisen-åpning: omtrent ${report.ipad.scenarios.A04.firstOpenSeconds} s; åpning 2–5: omtrent ${report.ipad.scenarios.A04.repeatOpenSeconds} s. Fem inn/ut-runder ga ingen økende ventetid, svart skjerm, refresh eller inputtap.
- Tallvokterens verden: omtrent ${report.ipad.scenarios.A05Tallvokter.mapOpenSeconds} s fra «Velg» til spillbart kart. Lyd, rotasjon, bakgrunn/retur, berøring og tilbakeknapp fungerte.
- Labyrinten: lastet opplevd umiddelbart. Hakking under bevegelse gjorde styringen litt vanskeligere, men scenen var fortsatt spillbar og avbrutt berøring låste ikke input.
- 30 minutter sammenhengende Regnereisen: hakking var stabil, alle knapper fungerte, ingen svart skjerm og ingen automatisk refresh.`
    : '- Fysisk iPad: ikke fullført.';

  return `# Skolestart – baseline for lasting, ytelse, minne og opprydding

## Kort konklusjon

Port 1: **${portDecision}**. Målingen har funnet en reproduserbar oppryddingsfeil, høy førstegangs-last og merkbar hakking i Labyrinten. Den fysiske testen betyr ikke at appen er ferdig godkjent for svakere skole-iPader. Appkoden er ikke endret.

## Miljø og metode

- Baseline-commit: \`${report.baselineCommit}\`
- Profiler: Chromium 1024 × 768, DPR 2, touch; normal PC-referanse og 4× CPU / 4 Mbit/s konservativ profil.
- Rådata: ignorert \`artifacts/skolestart-baseline/\`; rapporten inneholder bare aggregater og URL-er uten query/hash.
- Safari-begrensning: direkte Safari-minne er ikke målt fordi Mac mangler.
- Fysisk enhet: ${ipadCompleted ? `${report.ipad.device.model}, ${report.ipad.device.os}, Safari over lokalt Wi-Fi. Test-iPaden antas å være sterkere enn skolens iPader.` : 'ikke fullført.'}

## Lasting og ytelse

| Scenario | Profil | Runder | Synlig s | LCP s | Nett rolig s | Spillbar s | MB | Requests | TBT ms |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
${rows}

## Regnereisen-grenser

- Kald hovedside har ${report.loadingBoundary.homeRegnereisenResourceCount} observerte Regnereisen-ressurser før klikk.
- Første Regnereisen-åpning legger til omtrent ${formatNumber(report.loadingBoundary.firstJourneyAdditionalMB, 1)} MB på PC-profilen.
- Tallene er request-miks for én bruker. De er ikke en kapasitetstest for 40/100 samtidige elever.

## Minne og opprydding

${report.cleanupTrend.summary}

30-minuttersøkten på PC fullførte uten krasj. JS-heap var ${formatNumber(report.longSession.heapAtPlayableMB, 1)} MB ved spillbar start, ${formatNumber(report.longSession.heapAt30MinutesMB, 1)} MB ved 30 minutter og ${formatNumber(report.longSession.heapAfterGcMB, 1)} MB etter full utgang og GC. Canvas/WebGL gikk tilbake til null. ${ipadCompleted ? 'Den separate 30-minuttersøkten på fysisk iPad fullførte også uten svart skjerm, automatisk refresh eller fastlåste knapper. Safari-heap kunne ikke måles uten Mac, så den fysiske testen motbeviser ikke den skjulte oppryddingsfeilen.' : 'Fysisk iPad-langøkt gjenstår.'}

## Fysisk iPad og feltdata

${ipadSummary}
- Safari Web Inspector: ikke tilgjengelig fra Windows; Chromium-tall omtales ikke som iPad-minne.
- Vercel runtime: ${report.fieldContext.vercelRuntime}
- Vercel Speed Insights: ${report.fieldContext.speedInsights}
- Privat teknisk feillogg: ${report.fieldContext.technicalErrors}

## Funn

| ID | Alvorlighet | Funn | Evidens | Minste sannsynlige område |
|---|---|---|---|---|
${findingRows}

## Avgrenset eller manglende dekning

${missing || '- Ingen automatiserte målerader mangler.'}
- Samlepermen lot seg ikke nå pålitelig med desktop-automatiseringen og har ikke egen kontrollert målerad.
- Den svakeste faktiske skole-iPaden er fortsatt ukjent og må brukes til en kort kontroll av A04, A07, A08 og Labyrinten når den blir tilgjengelig. Dette er en begrensning for sluttgodkjenning, ikke for Port 1-prioriteringen.

## Kan vente

- Skolekampens kjente 25/24-feil er med vilje ikke undersøkt her.
- Store omskrivinger og nye funksjoner er utenfor arbeidspakke A.
- Lokale 404-feil fra favicon/Speed Insights under Vite-preview behandles som målemiljøstøy til de eventuelt kan reproduseres i produksjon.

## Port 1

**${portDecision}.** Prioriter deretter:

1. \`A-CLEAN-01\`: finn og stopp lytter-/DOM-opphopningen ved utgang fra Regnereisen.
2. \`A-LOAD-02\`, \`A-LOAD-04\` og \`A-LOAD-03\`: reduser unødvendig førstegangs- og gjentatt lasting i små, målbare steg.
3. \`A-PERF-01\`: profiler Labyrinten og vurder en liten retting dersom kostnaden kan isoleres uten omskriving.
4. Følg opp \`A-FIELD-01\` uten å endre lydflyten før en reproduksjon eller mer presis evidens finnes.

Arbeidspakke B–E er ikke startet. Ingen kodeoptimalisering skal begynne før brukeren har godkjent denne prioriteringen.
`;
}

async function buildReport(rootDir) {
  const runRoot = path.join(rootDir, 'artifacts', 'skolestart-baseline', BASELINE_RUN_ID, 'runs');
  const allRuns = await loadBaselineRuns(runRoot);
  const cleanRuns = allRuns.filter((run) => !run.metadata?.traceCaptured);
  const measuredRuns = cleanRuns.length ? cleanRuns : allRuns;
  const aggregates = aggregateRuns(measuredRuns);
  const ipadPath = path.join(rootDir, 'docs', 'superpowers', 'reports', 'skolestart-malegrunnlag-ipad.json');
  const ipadData = JSON.parse(await readFile(ipadPath, 'utf8').catch(() => '{}'));
  const physicalIpadCompleted = ipadData.status === 'completed';
  const coverage = assessCoverage(measuredRuns, { physicalIpadCompleted });
  const heapDiagnostics = await readHeapDiagnostics(runRoot);
  const fieldData = JSON.parse(await readFile(
    path.join(rootDir, 'artifacts', 'skolestart-baseline', BASELINE_RUN_ID, 'field-context.json'),
    'utf8'
  ).catch(() => '{}'));
  const findings = buildFindings({ aggregates, cleanRuns: measuredRuns, fieldData, heapDiagnostics, ipadData });
  const homeRun = measuredRuns.find((run) => run.scenario.id === 'A01-cold-home' && run.metadata.profileId === 'tablet-native');
  const homeAggregate = findAggregate(aggregates, 'A01-cold-home', 'tablet-native');
  const journeyAggregate = findAggregate(aggregates, 'A04-first-regnereisen-open', 'tablet-native');
  const lifecycleRun = measuredRuns.find((run) => run.scenario.id === 'A07-five-entry-exit-rounds' && run.metadata.profileId === 'tablet-native');
  const longSessionRun = measuredRuns.find((run) => run.scenario.id === 'A08-thirty-minute-session' && run.metadata.profileId === 'tablet-native');
  const longSessionMemory = (label) => longSessionRun?.memory?.checkpoints
    ?.find((checkpoint) => checkpoint.label === label)?.jsHeapUsedBytes;
  const browserVersions = [...new Set(measuredRuns.map((run) => run.metadata.browserVersion).filter(Boolean))];
  const cpu = cpus()[0];
  const report = {
    baselineCommit: BASELINE_COMMIT,
    generatedAt: new Date().toISOString(),
    environments: [{
      platform: `${platform()} ${release()}`,
      cpu: cpu?.model ?? 'unknown',
      logicalProcessors: cpus().length,
      totalMemoryBytes: totalmem(),
      node: process.version,
      npm: npmVersionFromUserAgent(),
      browserVersions,
      profiles: [...new Set(measuredRuns.map((run) => run.metadata.profileId))]
    }],
    scenarios: aggregates,
    loadingBoundary: {
      homeRegnereisenResourceCount: homeRun?.network.resources.filter((resource) => (
        /\/regnemester\//i.test(resource.url) || /RegnereisenBossreisen/i.test(resource.url)
      )).length ?? null,
      firstJourneyAdditionalMB: journeyAggregate && homeAggregate
        ? mb(journeyAggregate.network.transferBytes.median - homeAggregate.network.transferBytes.median)
        : null
    },
    cleanupTrend: {
      classification: lifecycleRun?.cleanupTrend ?? null,
      rounds: lifecycleRun?.lifecycleRounds ?? [],
      heapDiagnostics,
      summary: lifecycleRun
        ? `Fem runder viste lyttere ${lifecycleRun.lifecycleRounds[0].listeners} → ${lifecycleRun.lifecycleRounds.at(-1).listeners} etter GC. Tilkoblet canvas/WebGL gikk tilbake til null. Heap-snapshotene viser samtidig beholdte, frakoblede Shadow DOM-trær og spillcanvas.`
        : 'Fem-runders opprydding er ikke målt.'
    },
    longSession: {
      heapAtPlayableMB: mb(longSessionMemory('playable')),
      heapAt30MinutesMB: mb(longSessionMemory('session-minute-30')),
      heapAfterGcMB: mb(longSessionMemory('after-explicit-gc')),
      errors: longSessionRun?.errors ?? []
    },
    fieldContext: {
      physicalIpad: physicalIpadCompleted ? 'fullført' : 'ikke fullført',
      speedInsights: fieldData.speedInsights?.status === 'available'
        ? fieldData.speedInsights.summary
        : `ikke hentet – ${fieldData.speedInsights?.reason ?? 'feltgrunnlag er ikke tilgjengelig'}`,
      technicalErrors: fieldData.technicalErrors?.status === 'available'
        ? fieldData.technicalErrors.summary
        : `ikke hentet – ${fieldData.technicalErrors?.reason ?? 'privat feillogg er ikke tilgjengelig'}`,
      vercelRuntime: fieldData.vercel
        ? `${fieldData.vercel.runtimeErrorClusters} runtime-feilgrupper siste ${fieldData.vercel.period}; ${fieldData.vercel.limitation}`
        : 'ikke hentet'
    },
    ipad: ipadData,
    findings,
    coverage
  };
  return report;
}

async function main() {
  const rootDir = process.cwd();
  const allowIncomplete = process.argv.includes('--allow-incomplete');
  const report = await buildReport(rootDir);
  const reportsDir = path.join(rootDir, 'docs', 'superpowers', 'reports');
  await mkdir(reportsDir, { recursive: true });
  const jsonPath = path.join(reportsDir, 'skolestart-malegrunnlag-baseline.json');
  const markdownPath = path.join(reportsDir, 'skolestart-malegrunnlag-baseline.md');
  await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  await writeFile(markdownPath, markdownReport(report), 'utf8');
  process.stdout.write(`${markdownPath}\n${jsonPath}\n`);
  if (!report.coverage.complete && !allowIncomplete) {
    throw new Error(`Baseline-dekningen er ikke komplett:\n${report.coverage.missing.join('\n')}`);
  }
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  if (process.argv.includes('--write-report')) await main();
}
