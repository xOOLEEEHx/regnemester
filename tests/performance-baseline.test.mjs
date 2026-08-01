import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright';

const {
  aggregateRuns,
  assessCoverage,
  classifyCleanupTrend,
  median,
  npmVersionFromUserAgent,
  percentile,
  sanitizeUrl
} = await import('../scripts/performance/analyze-baseline.mjs');

const {
  BASELINE_COMMIT,
  HEAVY_SCENES,
  PROFILES,
  SCENARIOS
} = await import('../scripts/performance/baseline-config.mjs');

const { createBuildInventory } = await import('../scripts/performance/inventory-build.mjs');
const { installBaselineProbe } = await import('../scripts/performance/browser-probe.mjs');
const {
  captureScenario,
  dismissAnnouncementIfVisible,
  parseCollectorArgs,
  summarizeNetwork,
  validateBaselineRun
} = await import('../scripts/performance/collect-baseline.mjs');

const {
  cleanupArtifactPaths,
  evaluateCleanupCandidate,
  parseCleanupArgs,
  sanitizeVariant
} = await import('../scripts/performance/validate-cleanup.mjs');

test('sanitiserer query og hash fra ressurs-URL', () => {
  assert.equal(
    sanitizeUrl('https://example.test/app.js?token=secret#part'),
    'https://example.test/app.js'
  );
});

test('oppryddingsvariant tillater bare sikre mappenavn', () => {
  assert.equal(sanitizeVariant('before-event-scope'), 'before-event-scope');
  assert.throws(() => sanitizeVariant('../baseline'), /Ugyldig variant/);
  assert.throws(() => sanitizeVariant('Elev Ola'), /Ugyldig variant/);
});

test('oppryddingskommando krever lokal URL og variant', () => {
  assert.deepEqual(
    parseCleanupArgs([
      '--base-url',
      'http://127.0.0.1:4173/',
      '--variant',
      'before-event-scope'
    ]),
    {
      baseUrl: 'http://127.0.0.1:4173/',
      variant: 'before-event-scope'
    }
  );
  assert.throws(() => parseCleanupArgs(['--variant', 'before-event-scope']), /Mangler --base-url/);
  assert.throws(() => parseCleanupArgs(['--base-url', 'http://127.0.0.1:4173/']), /Mangler --variant/);
  assert.throws(
    () => parseCleanupArgs([
      '--base-url',
      'https://regnemester.example/',
      '--variant',
      'before-event-scope'
    ]),
    /lokal preview/
  );
});

test('oppryddingskommando skiller clean og trace fysisk', () => {
  const paths = cleanupArtifactPaths('C:\\baseline-root', 'before-event-scope');
  assert.equal(path.basename(paths.clean), 'clean');
  assert.equal(path.basename(paths.trace), 'trace');
  assert.equal(path.dirname(paths.clean), paths.root);
  assert.equal(path.dirname(paths.trace), paths.root);
  assert.notEqual(paths.clean, paths.trace);
});

test('oppryddingskandidat avvises ved vedvarende lytter- og DOM-vekst', () => {
  const result = evaluateCleanupCandidate({
    cleanRuns: [{
      lifecycleRounds: [
        { round: 2, listeners: 457, canvases: 0, webglContexts: 0 },
        { round: 5, listeners: 859, canvases: 0, webglContexts: 0 }
      ]
    }],
    heapDiagnostics: {
      round2: { detachedNodes: 1082, registeredEventListeners: 457, retainedGameCanvases: 2 },
      round5: { detachedNodes: 2490, registeredEventListeners: 859, retainedGameCanvases: 5 }
    }
  });

  assert.equal(result.passed, false);
  assert.deepEqual(result.reasons.sort(), [
    'detached-node-growth',
    'listener-growth',
    'registered-listener-growth',
    'retained-canvas-growth'
  ]);
});

test('oppryddingskandidat godtas når varme runder flater ut', () => {
  const result = evaluateCleanupCandidate({
    cleanRuns: [{
      lifecycleRounds: [
        { round: 2, listeners: 325, canvases: 0, webglContexts: 0 },
        { round: 5, listeners: 327, canvases: 0, webglContexts: 0 }
      ]
    }],
    heapDiagnostics: {
      round2: { detachedNodes: 1100, registeredEventListeners: 325, retainedGameCanvases: 1 },
      round5: { detachedNodes: 1180, registeredEventListeners: 329, retainedGameCanvases: 1 }
    }
  });

  assert.equal(result.passed, true);
  assert.deepEqual(result.reasons, []);
});

test('beregner median og p95 deterministisk', () => {
  assert.equal(median([1, 3, 2]), 2);
  assert.equal(percentile([1, 2, 3, 4, 5], 0.95), 5);
});

test('leser npm-versjon uten å starte et Windows-program', () => {
  assert.equal(npmVersionFromUserAgent('npm/11.13.0 node/v24.16.0 win32 x64'), '11.13.0');
  assert.equal(npmVersionFromUserAgent(''), 'unknown');
});

test('markerer vedvarende heap- og lyttervekst etter oppvarming', () => {
  const result = classifyCleanupTrend([
    { round: 1, heapAfterGc: 80_000_000, listeners: 30 },
    { round: 2, heapAfterGc: 82_000_000, listeners: 31 },
    { round: 3, heapAfterGc: 87_000_000, listeners: 32 },
    { round: 4, heapAfterGc: 93_000_000, listeners: 33 },
    { round: 5, heapAfterGc: 99_000_000, listeners: 34 }
  ]);

  assert.equal(result.suspectedLeak, true);
  assert.deepEqual(result.reasons.sort(), ['heap-growth', 'listener-growth']);
});

test('aggregerer scenarioer med median, min og maks', () => {
  const runs = [100, 300, 200].map((playableMs, index) => ({
    metadata: { profileId: 'tablet-native', repeatIndex: index + 1 },
    scenario: { id: 'A04-first-regnereisen-open' },
    checkpoints: [{ label: 'playable', elapsedMs: playableMs }],
    network: { requestCount: 10, transferBytes: playableMs * 1_000, resources: [] },
    mainThread: { totalBlockingTime: index, rafGapP95: 16 },
    memory: { checkpoints: [{ label: 'playable', jsHeapUsedBytes: 1_000_000, jsEventListeners: 5 }] },
    errors: []
  }));

  const [aggregate] = aggregateRuns(runs);
  assert.deepEqual(aggregate.timings.playableMs, { median: 200, min: 100, max: 300 });
  assert.equal(aggregate.network.transferBytes.median, 200_000);
});

test('holder tunge A06-scener atskilt i aggregatet', () => {
  const runs = ['fishing', 'maze'].map((sceneId) => ({
    metadata: { profileId: 'tablet-native', sceneId },
    scenario: { id: 'A06-heavy-scenes-and-binder', sceneId },
    checkpoints: [],
    network: { requestCount: 1, transferBytes: 1 },
    mainThread: {},
    errors: []
  }));

  assert.deepEqual(
    aggregateRuns(runs).map((entry) => entry.scenarioId),
    ['A06-heavy-scenes-and-binder:fishing', 'A06-heavy-scenes-and-binder:maze']
  );
});

test('dekning avviser baseline uten begge profiler, langøkt og fysisk iPad', () => {
  const runs = Array.from({ length: 3 }, (_, index) => ({
    metadata: { profileId: 'tablet-native', repeatIndex: index + 1 },
    scenario: { id: 'A01-cold-home' }
  }));
  const coverage = assessCoverage(runs, { physicalIpadCompleted: false });

  assert.equal(coverage.complete, false);
  assert.ok(coverage.missing.some((item) => item.includes('A04-first-regnereisen-open')));
  assert.ok(coverage.missing.some((item) => item.includes('A06-heavy-scenes-and-binder/binder')));
  assert.ok(coverage.missing.some((item) => item.includes('fysisk iPad')));
});

test('låser baseline til godkjent commit og to iPad-formede profiler', () => {
  assert.equal(BASELINE_COMMIT, '129422d97eb126ba6eb983c3329d12c3eb956c35');
  assert.deepEqual(PROFILES['tablet-native'].viewport, { width: 1024, height: 768 });
  assert.equal(PROFILES['tablet-native'].cpuRate, 1);
  assert.equal(PROFILES['tablet-native'].timeoutMs, 30_000);
  assert.equal(PROFILES['tablet-conservative'].cpuRate, 4);
  assert.equal(PROFILES['tablet-conservative'].timeoutMs, 600_000);
  assert.equal(PROFILES['tablet-conservative'].network.downloadThroughput, 500_000);
  assert.equal(PROFILES['tablet-conservative'].network.uploadThroughput, 125_000);
});

test('scenariooppsettet dekker alle fire kart og langøkten', () => {
  const scenarioIds = SCENARIOS.map((scenario) => scenario.id);
  assert.deepEqual(scenarioIds.filter((id) => id.startsWith('A05-map-')), [
    'A05-map-bossreisen',
    'A05-map-regneriket',
    'A05-map-tallvokterens-rike',
    'A05-map-regnemonster'
  ]);
  assert.ok(scenarioIds.includes('A08-thirty-minute-session'));
  assert.deepEqual(Object.keys(HEAVY_SCENES), [
    'fishing',
    'boat-travel',
    'crystal-cart',
    'swamp-alchemy',
    'light-forest',
    'counterweight-vault',
    'maze',
    'binder'
  ]);
});

test('inventaret summerer bygg, kort, bilder og duplikater fra virkelige filer', async (context) => {
  const rootDir = await mkdtemp(path.join(tmpdir(), 'regnemester-inventory-'));
  context.after(() => rm(rootDir, { recursive: true, force: true }));

  await mkdir(path.join(rootDir, 'dist', '.vite'), { recursive: true });
  await mkdir(path.join(rootDir, 'dist', 'assets'), { recursive: true });
  await mkdir(path.join(rootDir, 'public', 'maps'), { recursive: true });
  await mkdir(path.join(rootDir, 'public', 'cards'), { recursive: true });
  await mkdir(path.join(rootDir, 'src', 'regnereisen-bossreisen', 'game', 'content'), { recursive: true });

  await writeFile(path.join(rootDir, 'dist', 'assets', 'index.js'), 'export default 1;');
  await writeFile(path.join(rootDir, 'dist', '.vite', 'manifest.json'), JSON.stringify({
    'src/main.jsx': { file: 'assets/index.js', isEntry: true, imports: [], css: [] }
  }));
  await writeFile(path.join(rootDir, 'public', 'maps', 'one.png'), 'duplicate');
  await writeFile(path.join(rootDir, 'public', 'cards', 'two.png'), 'duplicate');
  await writeFile(
    path.join(rootDir, 'src', 'regnereisen-bossreisen', 'template.html'),
    '<img src="/one.png"><img src="/two.png"><img src="/one.png"><img alt="uten kilde">'
  );
  await writeFile(
    path.join(rootDir, 'src', 'regnereisen-bossreisen', 'game', 'content', 'regnemonsterCardManifest.generated.json'),
    JSON.stringify({ sets: [{ id: 'set1', cards: [{ id: '1' }, { id: '2' }] }] })
  );

  const inventory = await createBuildInventory({ rootDir, expectedCommit: null });

  assert.equal(inventory.buildChunks[0].bytes, 17);
  assert.equal(inventory.cardCounts.total, 2);
  assert.equal(inventory.staticTemplateImages.totalTags, 4);
  assert.equal(inventory.staticTemplateImages.uniqueSources, 2);
  assert.deepEqual(inventory.duplicateHashes[0].paths, [
    'public/cards/two.png',
    'public/maps/one.png'
  ]);
});

test('browserproben teller ressurser uten å lese skjemainnhold', async (context) => {
  const browser = await chromium.launch({ headless: true });
  context.after(() => browser.close());
  const browserContext = await browser.newContext();
  context.after(() => browserContext.close());
  const page = await browserContext.newPage();
  await page.addInitScript(installBaselineProbe);
  await page.goto('data:text/html,<canvas></canvas><div id="host"></div><input value="skal-ikke-males">');
  await page.evaluate(() => {
    const shadow = document.querySelector('#host').attachShadow({ mode: 'open' });
    shadow.innerHTML = '<canvas></canvas>';
  });

  const handles = await page.evaluate(() => ({
    timeout: window.setTimeout(() => {}, 60_000),
    interval: window.setInterval(() => {}, 60_000)
  }));
  const snapshot = await page.evaluate(() => window.__regnemesterBaseline.snapshot('test'));

  assert.equal(snapshot.label, 'test');
  assert.equal(snapshot.canvasCount, 2);
  assert.equal(snapshot.activeTimeouts, 1);
  assert.equal(snapshot.activeIntervals, 1);
  assert.doesNotMatch(JSON.stringify(snapshot), /skal-ikke-males/);

  await page.evaluate(({ timeout, interval }) => {
    window.clearTimeout(timeout);
    window.clearInterval(interval);
  }, handles);
  const cleaned = await page.evaluate(() => window.__regnemesterBaseline.finish());
  assert.equal(cleaned.activeTimeouts, 0);
  assert.equal(cleaned.activeIntervals, 0);
});

test('browserproben inneholder ingen lesing av identitet eller request-innhold', async () => {
  const source = await readFile(new URL('../scripts/performance/browser-probe.mjs', import.meta.url), 'utf8');
  for (const forbidden of ['request.postData', 'authorization', 'cookie', 'localStorage.getItem', 'input.value']) {
    assert.equal(source.includes(forbidden), false, `Fant forbudt probeuttrykk: ${forbidden}`);
  }
});

test('collector godtar bare kjente scenarioer, profiler og positive repetisjoner', () => {
  assert.deepEqual(parseCollectorArgs([
    '--scenario', 'A01-cold-home',
    '--profile', 'tablet-native',
    '--base-url', 'http://127.0.0.1:4173',
    '--repeat', '3',
    '--trace',
    '--headless'
  ]), {
    baseUrl: 'http://127.0.0.1:4173/',
    captureTrace: true,
    headless: true,
    profileId: 'tablet-native',
    repeat: 3,
    scenarioId: 'A01-cold-home'
  });
  assert.throws(
    () => parseCollectorArgs(['--scenario', 'ukjent', '--profile', 'tablet-native', '--base-url', 'http://127.0.0.1:4173']),
    /Ukjent scenario/
  );
  assert.throws(
    () => parseCollectorArgs(['--scenario', 'A01-cold-home', '--profile', 'tablet-native', '--base-url', 'http://127.0.0.1:4173', '--repeat', '0']),
    /positivt heltall/
  );
  assert.throws(
    () => parseCollectorArgs(['--scenario', 'A06-heavy-scenes-and-binder', '--profile', 'tablet-native', '--base-url', 'http://127.0.0.1:4173']),
    /Mangler --scene/
  );
  assert.equal(parseCollectorArgs([
    '--scenario', 'A06-heavy-scenes-and-binder',
    '--scene', 'fishing',
    '--profile', 'tablet-native',
    '--base-url', 'http://127.0.0.1:4173'
  ]).sceneId, 'fishing');
});

test('collector avviser ufullstendige råmålinger', () => {
  const validRun = {
    metadata: { commit: BASELINE_COMMIT, profileId: 'tablet-native', browserVersion: '151' },
    scenario: { id: 'A01-cold-home' },
    checkpoints: [{ label: 'home-visible' }],
    network: { requestCount: 1, transferBytes: 100, resources: [] },
    mainThread: { longTaskCount: 0, totalBlockingTime: 0, rafGapP95: 16 },
    memory: { checkpoints: [{ label: 'home-visible', jsHeapUsedBytes: 1 }] },
    errors: []
  };
  assert.equal(validateBaselineRun(validRun), true);
  assert.throws(() => validateBaselineRun({ ...validRun, memory: undefined }), /memory/);
});

test('nettverksoppsummeringen skiller ressurser per målefase', () => {
  const summary = summarizeNetwork(new Map([
    ['first', { url: 'https://example.test/map.png?secret=1', type: 'Image', transferBytes: 100, phase: 'first-map-selected' }],
    ['warm', { url: 'https://example.test/map.png?secret=2', type: 'Image', transferBytes: 20, phase: 'warm-before-open', fromDiskCache: true }]
  ]));

  assert.deepEqual(summary.byPhase, {
    'first-map-selected': { requests: 1, transferBytes: 100 },
    'warm-before-open': { requests: 1, transferBytes: 20 }
  });
  assert.equal(summary.resources[0].url.includes('?'), false);
});

test('collector lukker et synlig nyhetsvindu før elevhandlingen fortsetter', async (context) => {
  const browser = await chromium.launch({ headless: true });
  context.after(() => browser.close());
  const browserContext = await browser.newContext();
  context.after(() => browserContext.close());
  const page = await browserContext.newPage();
  await page.setContent(`
    <button class="home-mode-journey">Regnereisen</button>
    <div role="dialog" class="announcement-backdrop">
      <button onclick="this.parentElement.remove()">Lukk</button>
    </div>
  `);

  const dismissed = await dismissAnnouncementIfVisible(page);

  assert.equal(dismissed, true);
  assert.equal(await page.locator('.announcement-backdrop').count(), 0);
  await page.locator('.home-mode-journey').click();
});

test('collector måler en kald hovedside i en ekte browser', async (context) => {
  const server = createServer((request, response) => {
    if (request.url === '/slow.png') {
      setTimeout(() => {
        response.writeHead(200, { 'content-type': 'image/png' });
        response.end('not-a-real-image');
      }, 500);
      return;
    }
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    response.end('<!doctype html><button class="home-mode-journey">Regnereisen</button><img src="/slow.png">');
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  context.after(() => new Promise((resolve) => server.close(resolve)));
  const address = server.address();
  const outputDir = await mkdtemp(path.join(tmpdir(), 'regnemester-capture-'));
  context.after(() => rm(outputDir, { recursive: true, force: true }));

  const run = await captureScenario({
    baseUrl: `http://127.0.0.1:${address.port}/`,
    headless: true,
    outputDir,
    profileId: 'tablet-native',
    repeatIndex: 1,
    scenarioId: 'A01-cold-home',
    takeScreenshots: false
  });

  assert.equal(run.metadata.commit, BASELINE_COMMIT);
  assert.equal(run.scenario.id, 'A01-cold-home');
  assert.equal(run.metadata.productionWritesBlocked, true);
  assert.ok(run.checkpoints.some((checkpoint) => checkpoint.label === 'home-visible'));
  const homeVisible = run.checkpoints.find((checkpoint) => checkpoint.label === 'home-visible').elapsedMs;
  const networkSettled = run.checkpoints.find((checkpoint) => checkpoint.label === 'network-settled').elapsedMs;
  assert.ok(networkSettled - homeVisible >= 400);
  assert.ok(run.network.requestCount >= 1);
  assert.ok(run.memory.checkpoints[0].jsHeapUsedBytes > 0);
  assert.deepEqual(run.errors, []);
});

test('collector måler første Regnereisen-åpning og full opprydding', async (context) => {
  const server = createServer((request, response) => {
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    response.end(`<!doctype html>
      <button class="home-mode-journey">Regnereisen</button>
      <div role="dialog" class="announcement-backdrop">
        <button onclick="this.parentElement.remove()">Lukk</button>
      </div>
      <script>
        const home = document.querySelector('.home-mode-journey');
        home.addEventListener('click', () => {
          document.body.innerHTML = '<section id="start-screen"><canvas></canvas><button id="start-game" disabled>Starter</button><button id="back-to-regnemester">Tilbake</button></section>';
          setTimeout(() => { document.querySelector('#start-game').disabled = false; }, 5);
          document.querySelector('#back-to-regnemester').addEventListener('click', () => {
            document.body.innerHTML = '<button class="home-mode-journey">Regnereisen</button>';
          });
        });
      </script>`);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  context.after(() => new Promise((resolve) => server.close(resolve)));
  const address = server.address();
  const outputDir = await mkdtemp(path.join(tmpdir(), 'regnemester-regnereisen-capture-'));
  context.after(() => rm(outputDir, { recursive: true, force: true }));

  const run = await captureScenario({
    baseUrl: `http://127.0.0.1:${address.port}/`,
    headless: true,
    outputDir,
    profileId: 'tablet-native',
    repeatIndex: 1,
    scenarioId: 'A04-first-regnereisen-open',
    settleDelays: { afterExitMs: 10, finalExitMs: 20 },
    takeScreenshots: false
  });

  assert.deepEqual(run.checkpoints.map((checkpoint) => checkpoint.label), [
    'before-navigation',
    'home-visible',
    'before-open',
    'screen-visible',
    'playable',
    'peak-observed',
    'before-exit',
    'after-exit-2s',
    'after-exit-10s',
    'after-explicit-gc'
  ]);
  assert.equal(run.metadata.announcementDismissed, true);
  const playable = run.memory.checkpoints.find((checkpoint) => checkpoint.label === 'playable');
  const afterExit = run.memory.checkpoints.find((checkpoint) => checkpoint.label === 'after-exit-10s');
  assert.equal(playable.canvasCount, 1);
  assert.equal(afterExit.canvasCount, 0);
});

test('collector måler kald og varm åpning av et Regnereisen-kart', async (context) => {
  const server = createServer((request, response) => {
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    response.end(`<!doctype html>
      <button class="home-mode-journey">Regnereisen</button>
      <script>
        function showHome() {
          document.body.innerHTML = '<button class="home-mode-journey">Regnereisen</button>';
        }
        function showStart() {
          document.body.innerHTML = '<section id="start-screen"><button data-map-id="bossreisen">Boss-reisen</button><button id="start-game">Start reisen</button><button id="back-to-regnemester">Tilbake</button></section>';
        }
        document.addEventListener('click', (event) => {
          if (event.target.closest('.home-mode-journey')) showStart();
          if (event.target.closest('[data-map-id]')) {
            document.body.insertAdjacentHTML('beforeend', '<section id="map-settings-modal"><button id="confirm-map-settings">Velg</button></section>');
          }
          if (event.target.closest('#confirm-map-settings')) event.target.closest('#map-settings-modal').remove();
          if (event.target.closest('#start-game')) {
            document.body.innerHTML = '<div id="hud"><button id="open-start">Meny</button></div><div id="game"><canvas></canvas></div>';
          }
          if (event.target.closest('#open-start')) showStart();
          if (event.target.closest('#back-to-regnemester')) showHome();
        });
      </script>`);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  context.after(() => new Promise((resolve) => server.close(resolve)));
  const address = server.address();
  const outputDir = await mkdtemp(path.join(tmpdir(), 'regnemester-map-capture-'));
  context.after(() => rm(outputDir, { recursive: true, force: true }));

  const run = await captureScenario({
    baseUrl: `http://127.0.0.1:${address.port}/`,
    headless: true,
    outputDir,
    profileId: 'tablet-native',
    repeatIndex: 1,
    scenarioId: 'A05-map-bossreisen',
    settleDelays: { afterExitMs: 10, finalExitMs: 20 },
    takeScreenshots: false
  });

  assert.ok(run.checkpoints.some((checkpoint) => checkpoint.label === 'first-map-playable'));
  assert.ok(run.checkpoints.some((checkpoint) => checkpoint.label === 'second-map-playable'));
  assert.equal(run.memory.checkpoints.find((entry) => entry.label === 'first-map-playable').canvasCount, 1);
  assert.equal(run.memory.checkpoints.find((entry) => entry.label === 'after-exit-10s').canvasCount, 0);
});

test('collector måler Normal uten å laste Regnereisen eller fullføre en score', async (context) => {
  const server = createServer((request, response) => {
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    response.end(`<!doctype html>
      <button class="home-mode-journey">Regnereisen</button><button class="home-mode-normal">Normal</button>
      <script>
        const home = '<button class="home-mode-journey">Regnereisen</button><button class="home-mode-normal">Normal</button>';
        document.addEventListener('click', (event) => {
          const text = event.target.textContent;
          if (event.target.closest('.home-mode-normal')) document.body.innerHTML = '<h1>Normal</h1><button class="mode-choice-button">Addisjon</button><button>Tilbake</button>';
          else if (event.target.closest('.mode-choice-button')) document.body.innerHTML = '<h1>Regnemester</h1><button>Lett</button><button>Uten tid</button><button>Start spillet</button><button>Tilbake</button>';
          else if (text === 'Start spillet') document.body.innerHTML = '<h1>Velg riktig svar</h1><button class="answer-button">4</button><button class="quit-round-button">Avslutt runde</button>';
          else if (event.target.closest('.answer-button')) document.body.insertAdjacentHTML('beforeend', '<p class="feedback">Riktig!</p>');
          else if (event.target.closest('.quit-round-button')) document.body.innerHTML = '<h1>Runden er ferdig!</h1><button>Til meny</button>';
          else if (text === 'Til meny') document.body.innerHTML = '<h1>Normal</h1><button>Tilbake</button>';
          else if (text === 'Tilbake') document.body.innerHTML = home;
        });
      </script>`);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  context.after(() => new Promise((resolve) => server.close(resolve)));
  const address = server.address();
  const outputDir = await mkdtemp(path.join(tmpdir(), 'regnemester-normal-capture-'));
  context.after(() => rm(outputDir, { recursive: true, force: true }));

  const run = await captureScenario({
    baseUrl: `http://127.0.0.1:${address.port}/`,
    headless: true,
    outputDir,
    profileId: 'tablet-native',
    repeatIndex: 1,
    scenarioId: 'A02-normal-without-regnereisen',
    settleDelays: { afterExitMs: 10, finalExitMs: 20 },
    takeScreenshots: false
  });

  assert.ok(run.checkpoints.some((entry) => entry.label === 'normal-answer-processed'));
  assert.equal(run.metadata.scoreSubmissionAttempted, false);
});

test('collector går inn og ut av Skolekampen uten highscore-innsending', async (context) => {
  const server = createServer((request, response) => {
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    response.end(`<!doctype html>
      <main data-screen="home"><button class="home-mode-journey">Regnereisen</button><button class="home-mode-school">Skolekampen</button></main>
      <script>
        const screens = {
          home: '<button class="home-mode-journey">Regnereisen</button><button class="home-mode-school">Skolekampen</button>',
          school: '<h1>Skolekampen</h1><button>Austafjord skole</button><button>Tilbake</button>',
          schoolClass: '<h1>Skolekampen</h1><button>1. klasse</button><button>Tilbake</button>',
          schoolMode: '<h1>Skolekampen</h1><button class="mode-choice-button">Addisjon</button><button>Tilbake</button>',
          start: '<h1>Skolekampen</h1><input id="player-name"><button>Start spillet</button><button>Tilbake</button>',
          play: '<h1>Velg riktig svar</h1><button class="answer-button">4</button><button class="quit-round-button">Avslutt runde</button>'
        };
        function show(name) { document.body.innerHTML = '<main data-screen="' + name + '">' + screens[name] + '</main>'; }
        document.addEventListener('click', (event) => {
          const screen = document.querySelector('main').dataset.screen;
          const text = event.target.textContent;
          if (event.target.closest('.home-mode-school')) show('school');
          else if (text === 'Austafjord skole') show('schoolClass');
          else if (text === '1. klasse') show('schoolMode');
          else if (event.target.closest('.mode-choice-button')) show('start');
          else if (text === 'Start spillet') show('play');
          else if (event.target.closest('.quit-round-button')) show('schoolMode');
          else if (text === 'Tilbake' && screen === 'schoolMode') show('schoolClass');
          else if (text === 'Tilbake' && screen === 'schoolClass') show('school');
          else if (text === 'Tilbake' && screen === 'school') show('home');
        });
      </script>`);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  context.after(() => new Promise((resolve) => server.close(resolve)));
  const address = server.address();
  const outputDir = await mkdtemp(path.join(tmpdir(), 'regnemester-school-capture-'));
  context.after(() => rm(outputDir, { recursive: true, force: true }));

  const run = await captureScenario({
    baseUrl: `http://127.0.0.1:${address.port}/`,
    headless: true,
    outputDir,
    profileId: 'tablet-native',
    repeatIndex: 1,
    scenarioId: 'A03-school-without-regnereisen',
    settleDelays: { afterExitMs: 10, finalExitMs: 20 },
    takeScreenshots: false
  });

  assert.ok(run.checkpoints.some((entry) => entry.label === 'school-play-visible'));
  assert.equal(run.metadata.scoreSubmissionAttempted, false);
  assert.equal(run.metadata.productionWritesBlocked, true);
  assert.equal(run.metadata.schoolRoundEndpointBlocked, false);
});

test('collector lagrer fem separate inn- og utgangsrunder med opprydding', async (context) => {
  const server = createServer((request, response) => {
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    response.end(`<!doctype html>
      <button class="home-mode-journey">Regnereisen</button>
      <script>
        function showHome() { document.body.innerHTML = '<button class="home-mode-journey">Regnereisen</button>'; }
        function showStart() { document.body.innerHTML = '<section id="start-screen"><button data-map-id="bossreisen">Boss-reisen</button><button id="start-game">Start reisen</button><button id="back-to-regnemester">Tilbake</button></section>'; }
        document.addEventListener('click', (event) => {
          if (event.target.closest('.home-mode-journey')) showStart();
          if (event.target.closest('[data-map-id]')) document.body.insertAdjacentHTML('beforeend', '<section id="map-settings-modal"><button id="confirm-map-settings">Velg</button></section>');
          if (event.target.closest('#confirm-map-settings')) event.target.closest('#map-settings-modal').remove();
          if (event.target.closest('#start-game')) document.body.innerHTML = '<div id="hud"><button id="open-start">Meny</button></div><div id="game"><canvas></canvas></div>';
          if (event.target.closest('#open-start')) showStart();
          if (event.target.closest('#back-to-regnemester')) showHome();
        });
      </script>`);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  context.after(() => new Promise((resolve) => server.close(resolve)));
  const address = server.address();
  const outputDir = await mkdtemp(path.join(tmpdir(), 'regnemester-lifecycle-capture-'));
  context.after(() => rm(outputDir, { recursive: true, force: true }));

  const run = await captureScenario({
    baseUrl: `http://127.0.0.1:${address.port}/`,
    headless: true,
    outputDir,
    profileId: 'tablet-native',
    repeatIndex: 1,
    scenarioId: 'A07-five-entry-exit-rounds',
    settleDelays: { afterExitMs: 10, finalExitMs: 20 },
    takeScreenshots: false
  });

  assert.equal(run.lifecycleRounds.length, 5);
  assert.equal(run.lifecycleRounds.every((round) => round.canvases === 0), true);
  assert.equal(run.cleanupTrend.suspectedLeak, false);
});

test('collector holder en kartøkt i seks segmenter og går helt ut', async (context) => {
  const server = createServer((request, response) => {
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    response.end(`<!doctype html>
      <button class="home-mode-journey">Regnereisen</button>
      <script>
        function showHome() { document.body.innerHTML = '<button class="home-mode-journey">Regnereisen</button>'; }
        function showStart() { document.body.innerHTML = '<section id="start-screen"><button data-map-id="bossreisen">Boss-reisen</button><button id="start-game">Start reisen</button><button id="back-to-regnemester">Tilbake</button></section>'; }
        document.addEventListener('click', (event) => {
          if (event.target.closest('.home-mode-journey')) showStart();
          if (event.target.closest('[data-map-id]')) document.body.insertAdjacentHTML('beforeend', '<section id="map-settings-modal"><button id="confirm-map-settings">Velg</button></section>');
          if (event.target.closest('#confirm-map-settings')) event.target.closest('#map-settings-modal').remove();
          if (event.target.closest('#start-game')) document.body.innerHTML = '<div id="hud"><button id="open-start">Meny</button></div><div id="game"><canvas></canvas></div>';
          if (event.target.closest('#open-start')) showStart();
          if (event.target.closest('#back-to-regnemester')) showHome();
        });
      </script>`);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  context.after(() => new Promise((resolve) => server.close(resolve)));
  const address = server.address();
  const outputDir = await mkdtemp(path.join(tmpdir(), 'regnemester-long-session-'));
  context.after(() => rm(outputDir, { recursive: true, force: true }));

  const run = await captureScenario({
    backgroundDelayMs: 10,
    baseUrl: `http://127.0.0.1:${address.port}/`,
    headless: true,
    outputDir,
    profileId: 'tablet-native',
    repeatIndex: 1,
    scenarioId: 'A08-thirty-minute-session',
    sessionSegmentMs: 10,
    settleDelays: { afterExitMs: 10, finalExitMs: 20 },
    takeScreenshots: false
  });

  assert.deepEqual(
    run.checkpoints.filter((entry) => entry.label.startsWith('session-minute-')).map((entry) => entry.label),
    ['session-minute-5', 'session-minute-10', 'session-minute-15', 'session-minute-20', 'session-minute-25', 'session-minute-30']
  );
  assert.equal(run.memory.checkpoints.find((entry) => entry.label === 'after-explicit-gc').canvasCount, 0);
});
