import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import {
  BASELINE_COMMIT,
  BASELINE_RUN_ID,
  getHeavyScene,
  getProfile,
  getScenario
} from './baseline-config.mjs';
import { classifyCleanupTrend, percentile, sanitizeUrl } from './analyze-baseline.mjs';
import { installBaselineProbe } from './browser-probe.mjs';

function argumentValue(args, name) {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
}

export function parseCollectorArgs(args) {
  const scenarioId = argumentValue(args, '--scenario');
  const profileId = argumentValue(args, '--profile');
  const baseUrlValue = argumentValue(args, '--base-url');
  const repeatValue = argumentValue(args, '--repeat') ?? '1';
  const sceneId = argumentValue(args, '--scene');

  getScenario(scenarioId);
  getProfile(profileId);
  if (scenarioId === 'A06-heavy-scenes-and-binder') {
    if (!sceneId) throw new Error('Mangler --scene for A06.');
    getHeavyScene(sceneId);
  } else if (sceneId) {
    throw new Error('--scene kan bare brukes med A06.');
  }
  if (!baseUrlValue) throw new Error('Mangler --base-url.');

  let baseUrl;
  try {
    baseUrl = new URL(baseUrlValue).toString();
  } catch {
    throw new Error(`Ugyldig base URL: ${baseUrlValue}`);
  }

  const repeat = Number(repeatValue);
  if (!Number.isInteger(repeat) || repeat < 1) {
    throw new Error('--repeat må være et positivt heltall.');
  }

  return {
    baseUrl,
    captureTrace: args.includes('--trace'),
    headless: args.includes('--headless'),
    profileId,
    repeat,
    scenarioId,
    ...(sceneId ? { sceneId } : {})
  };
}

export function validateBaselineRun(run) {
  const requiredObjects = ['metadata', 'scenario', 'network', 'mainThread', 'memory'];
  for (const field of requiredObjects) {
    if (!run?.[field] || typeof run[field] !== 'object') {
      throw new Error(`Baseline-kjøringen mangler ${field}.`);
    }
  }
  if (!Array.isArray(run.checkpoints)) throw new Error('Baseline-kjøringen mangler checkpoints.');
  if (!Array.isArray(run.memory.checkpoints)) throw new Error('Baseline-kjøringen mangler memory.checkpoints.');
  if (!Array.isArray(run.errors)) throw new Error('Baseline-kjøringen mangler errors.');
  if (!run.metadata.commit || !run.metadata.profileId || !run.metadata.browserVersion) {
    throw new Error('Baseline-kjøringen mangler påkrevd metadata.');
  }
  if (!run.scenario.id) throw new Error('Baseline-kjøringen mangler scenario.id.');
  return true;
}

function sanitizeErrorMessage(value) {
  return String(value ?? '')
    .replace(/([?&](?:token|key|code|email|name|school|authorization)=[^&#\s]*)/gi, '[redacted]')
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[redacted-email]')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500);
}

function metricValue(metrics, name) {
  return metrics.metrics.find((metric) => metric.name === name)?.value ?? null;
}

async function countGlobalListeners(cdp) {
  const targets = ['window', 'document', 'window.visualViewport'];
  const counts = {};
  for (const expression of targets) {
    try {
      const evaluated = await cdp.send('Runtime.evaluate', {
        expression,
        objectGroup: 'regnemester-baseline',
        returnByValue: false
      });
      const objectId = evaluated.result?.objectId;
      if (!objectId) {
        counts[expression] = 0;
        continue;
      }
      const result = await cdp.send('DOMDebugger.getEventListeners', { objectId });
      counts[expression] = result.listeners.length;
    } catch {
      counts[expression] = null;
    }
  }
  await cdp.send('Runtime.releaseObjectGroup', { objectGroup: 'regnemester-baseline' }).catch(() => {});
  return counts;
}

async function captureMemoryCheckpoint({ cdp, label, page }) {
  const performanceMetrics = await cdp.send('Performance.getMetrics');
  const domCounters = await cdp.send('Memory.getDOMCounters');
  const probe = await page.evaluate((checkpointLabel) => (
    window.__regnemesterBaseline?.snapshot(checkpointLabel) ?? null
  ), label).catch(() => null);
  return {
    label,
    timestamp: probe?.timestamp ?? null,
    jsHeapUsedBytes: metricValue(performanceMetrics, 'JSHeapUsedSize'),
    jsHeapTotalBytes: metricValue(performanceMetrics, 'JSHeapTotalSize'),
    documents: domCounters.documents,
    nodes: domCounters.nodes,
    jsEventListeners: domCounters.jsEventListeners,
    knownGlobalListeners: await countGlobalListeners(cdp),
    activeTimeouts: probe?.activeTimeouts ?? null,
    activeIntervals: probe?.activeIntervals ?? null,
    activeRafs: probe?.activeRafs ?? null,
    canvasCount: probe?.canvasCount ?? 0,
    webglContextCount: probe?.webglContextCount ?? 0
  };
}

export function summarizeNetwork(requests) {
  const resources = [...requests.values()]
    .map((resource) => ({
      url: sanitizeUrl(resource.url),
      type: resource.type ?? 'Other',
      status: resource.status ?? null,
      mimeType: resource.mimeType ?? '',
      transferBytes: resource.transferBytes ?? 0,
      fromDiskCache: resource.fromDiskCache === true,
      fromServiceWorker: resource.fromServiceWorker === true,
      failed: resource.failed === true,
      initiatorType: resource.initiatorType ?? 'other',
      phase: resource.phase ?? 'unknown'
    }))
    .toSorted((left, right) => left.url.localeCompare(right.url));
  const byType = {};
  const byPhase = {};
  for (const resource of resources) {
    const group = byType[resource.type] ?? { requests: 0, transferBytes: 0 };
    group.requests += 1;
    group.transferBytes += resource.transferBytes;
    byType[resource.type] = group;
    const phaseGroup = byPhase[resource.phase] ?? { requests: 0, transferBytes: 0 };
    phaseGroup.requests += 1;
    phaseGroup.transferBytes += resource.transferBytes;
    byPhase[resource.phase] = phaseGroup;
  }
  return {
    requestCount: resources.length,
    transferBytes: resources.reduce((sum, resource) => sum + resource.transferBytes, 0),
    byType,
    byPhase,
    resources
  };
}

function summarizeMainThread(probe) {
  const longTasks = probe?.longTasks ?? [];
  const rafGaps = probe?.rafGaps ?? [];
  return {
    longTaskCount: longTasks.length,
    longestTask: longTasks.length ? Math.max(...longTasks.map((entry) => entry.duration)) : 0,
    totalBlockingTime: longTasks.reduce((sum, entry) => sum + Math.max(0, entry.duration - 50), 0),
    rafGapP75: percentile(rafGaps, 0.75),
    rafGapP95: percentile(rafGaps, 0.95),
    rafGapMax: rafGaps.length ? Math.max(...rafGaps) : null,
    rafGapsOver50: rafGaps.filter((gap) => gap > 50).length,
    rafGapsOver100: rafGaps.filter((gap) => gap > 100).length,
    paintEntries: probe?.paintEntries ?? [],
    largestContentfulPaint: probe?.largestContentfulPaint ?? null
  };
}

async function screenshot(page, outputDir, label, enabled) {
  if (!enabled) return null;
  const filePath = path.join(outputDir, `${label}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  return filePath;
}

export async function dismissAnnouncementIfVisible(page, waitMs = 0) {
  const backdrop = page.locator('.announcement-backdrop');
  if (waitMs > 0) {
    await Promise.race([
      backdrop.waitFor({ state: 'visible', timeout: waitMs }).catch(() => {}),
      page.waitForTimeout(waitMs)
    ]);
  }
  if (!await backdrop.isVisible().catch(() => false)) return false;

  await backdrop.getByRole('button', { name: 'Lukk' }).click();
  await backdrop.waitFor({ state: 'detached' });
  return true;
}

async function captureHeapSnapshot(cdp, outputPath) {
  const chunks = [];
  const onChunk = (event) => chunks.push(event.chunk);
  cdp.on('HeapProfiler.addHeapSnapshotChunk', onChunk);
  try {
    await cdp.send('HeapProfiler.takeHeapSnapshot', { reportProgress: false, captureNumericValue: true });
    await writeFile(outputPath, chunks.join(''), 'utf8');
  } finally {
    cdp.off('HeapProfiler.addHeapSnapshotChunk', onChunk);
  }
}

async function stopPerformanceTrace(cdp, outputPath, traceChunks) {
  const completed = new Promise((resolve) => cdp.once('Tracing.tracingComplete', resolve));
  await cdp.send('Tracing.end');
  await completed;
  await writeFile(outputPath, `${JSON.stringify({ traceEvents: traceChunks })}\n`, 'utf8');
}

export async function captureScenario({
  backgroundDelayMs = 10_000,
  baseUrl,
  captureTrace = false,
  expectedCommit = BASELINE_COMMIT,
  headless,
  outputDir,
  profileId,
  repeatIndex,
  scenarioId,
  sceneId,
  sessionSegmentMs = 5 * 60_000,
  settleDelays = { afterExitMs: 2_000, finalExitMs: 10_000 },
  takeScreenshots = true
}) {
  const scenario = getScenario(scenarioId);
  const heavyScene = sceneId ? getHeavyScene(sceneId) : undefined;
  const profile = getProfile(profileId);
  const rootDir = process.cwd();
  const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: rootDir, encoding: 'utf8' }).trim();
  if (expectedCommit && commit !== expectedCommit) {
    throw new Error(`Forventet baseline ${expectedCommit}, men HEAD er ${commit}.`);
  }
  await mkdir(outputDir, { recursive: true });

  const browser = await chromium.launch({ headless });
  const browserVersion = browser.version();
  const context = await browser.newContext({
    viewport: profile.viewport,
    deviceScaleFactor: profile.deviceScaleFactor,
    hasTouch: profile.hasTouch
  });
  const page = await context.newPage();
  page.setDefaultTimeout(profile.timeoutMs);
  page.setDefaultNavigationTimeout(profile.timeoutMs);
  await page.addInitScript(installBaselineProbe);
  if (heavyScene) {
    await page.addInitScript(({ scene }) => {
      const emptyRun = {
        completed: [],
        collectedRewards: [],
        spentRewards: [],
        unlocked: ['slimmyra'],
        awardedMedals: [],
        finalRewardCollected: false,
        player: scene.player ?? { x: 430, y: 2185 },
        damageTaken: false,
        pickupItems: {},
        activePickupQuests: [],
        fishInventory: {
          smallFish: 0,
          gukkFish: 0,
          crystalFish: 0,
          rainbowFish: 0,
          regneFish: 0,
          eternityFish: 0
        },
        fishingRoundUsed: false,
        tallvokterFinale: {
          unlocked: false,
          eventSeen: false,
          introSeen: false,
          won: false,
          rewardClaimed: false
        }
      };
      const snapshot = {
        version: 8,
        settings: {
          started: true,
          tokenId: 'elev-gutt',
          mapId: scene.mapId,
          operationMode: 'mixed',
          difficulty: 'normal',
          playMode: 'normal'
        },
        ...(scene.mapId === 'tallvokterens-rike'
          ? { tallvokter: emptyRun, tallvokterRuns: { normal: emptyRun } }
          : {}),
        regnemonsterPosition: scene.regnemonsterPosition ?? { x: 960, y: 1320 }
      };
      window.localStorage.setItem('regnemester-bossreisen-progress', JSON.stringify(snapshot));
    }, { scene: heavyScene });
  }
  let schoolRoundEndpointBlocked = false;
  const productionWritesBlocked = true;
  await page.route('**/functions/v1/regnemester-api', (route) => {
    if (scenarioId === 'A03-school-without-regnereisen') {
      schoolRoundEndpointBlocked = true;
      return route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Baselinekontroll: rundestart er blokkert.' })
      });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Performance.enable');
  await cdp.send('HeapProfiler.enable');
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: profile.cpuRate });
  if (profile.network) {
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: profile.network.latency,
      downloadThroughput: profile.network.downloadThroughput,
      uploadThroughput: profile.network.uploadThroughput,
      connectionType: 'cellular4g'
    });
  }

  const traceChunks = [];
  let traceStarted = false;
  let traceCompleted = false;
  if (captureTrace) {
    cdp.on('Tracing.dataCollected', (event) => traceChunks.push(...event.value));
    await cdp.send('Tracing.start', {
      categories: 'devtools.timeline,v8.execute,blink.user_timing,disabled-by-default-devtools.timeline',
      options: 'sampling-frequency=10000'
    });
    traceStarted = true;
  }

  const requests = new Map();
  let activePhase = 'browser-start';
  const errors = [];
  cdp.on('Network.requestWillBeSent', (event) => {
    requests.set(event.requestId, {
      url: event.request.url,
      type: event.type,
      initiatorType: event.initiator?.type,
      phase: activePhase
    });
  });
  cdp.on('Network.responseReceived', (event) => {
    const resource = requests.get(event.requestId) ?? { url: event.response.url, type: event.type };
    Object.assign(resource, {
      status: event.response.status,
      mimeType: event.response.mimeType,
      fromDiskCache: event.response.fromDiskCache,
      fromServiceWorker: event.response.fromServiceWorker
    });
    requests.set(event.requestId, resource);
  });
  cdp.on('Network.loadingFinished', (event) => {
    const resource = requests.get(event.requestId);
    if (resource) resource.transferBytes = event.encodedDataLength;
  });
  cdp.on('Network.loadingFailed', (event) => {
    const resource = requests.get(event.requestId);
    if (resource) resource.failed = true;
  });
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push({ category: 'console', message: sanitizeErrorMessage(message.text()) });
    }
  });
  page.on('pageerror', (error) => {
    errors.push({ category: 'pageerror', message: sanitizeErrorMessage(error.message) });
  });
  page.on('requestfailed', (request) => {
    errors.push({
      category: 'requestfailed',
      message: sanitizeErrorMessage(request.failure()?.errorText),
      url: sanitizeUrl(request.url())
    });
  });

  const startedAt = Date.now();
  const checkpoints = [];
  const memoryCheckpoints = [];
  const lifecycleRounds = [];
  let announcementDismissed = false;
  let scoreSubmissionAttempted = false;
  async function checkpoint(label) {
    activePhase = label;
    checkpoints.push({ label, elapsedMs: Date.now() - startedAt });
    memoryCheckpoints.push(await captureMemoryCheckpoint({ cdp, label, page }));
    await screenshot(page, outputDir, label, takeScreenshots && [
      'home-visible',
      'screen-visible',
      'playable',
      'first-map-playable',
      'second-map-playable',
      'session-minute-5',
      'session-minute-15',
      'session-minute-30',
      'after-exit-10s'
    ].includes(label));
  }

  try {
    await checkpoint('before-navigation');
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await page.locator('.home-mode-journey').waitFor({ state: 'visible' });
    await checkpoint('home-visible');

    if (scenarioId === 'A01-cold-home') {
      await page.waitForLoadState('networkidle');
      await checkpoint('network-settled');
    }

    if (scenarioId === 'A02-normal-without-regnereisen') {
      announcementDismissed = await dismissAnnouncementIfVisible(page, 2_000);
      await checkpoint('before-open');
      await page.locator('.home-mode-normal').click();
      await page.getByRole('heading', { name: 'Normal' }).waitFor({ state: 'visible' });
      await checkpoint('screen-visible');
      await page.getByRole('button', { name: /Addisjon/ }).click();
      await page.getByRole('button', { name: 'Lett', exact: true }).click();
      await page.getByRole('button', { name: /Uten tid/ }).click();
      await page.getByRole('button', { name: 'Start spillet', exact: true }).click();
      await page.locator('.answer-button').first().waitFor({ state: 'visible' });
      await checkpoint('playable');
      await page.locator('.answer-button').first().click();
      await page.locator('.feedback:not(.neutral-text)').waitFor({ state: 'visible' });
      await checkpoint('normal-answer-processed');
      await checkpoint('peak-observed');
      await checkpoint('before-exit');
      await page.locator('.quit-round-button').click();
      await page.getByRole('heading', { name: 'Runden er ferdig!' }).waitFor({ state: 'visible' });
      await page.getByRole('button', { name: 'Til meny', exact: true }).click();
      await page.getByRole('heading', { name: 'Normal' }).waitFor({ state: 'visible' });
      await page.getByRole('button', { name: 'Tilbake', exact: true }).click();
      await page.locator('.home-mode-journey').waitFor({ state: 'visible' });
      await page.waitForTimeout(settleDelays.afterExitMs);
      await checkpoint('after-exit-2s');
      await page.waitForTimeout(Math.max(0, settleDelays.finalExitMs - settleDelays.afterExitMs));
      await checkpoint('after-exit-10s');
      await cdp.send('HeapProfiler.collectGarbage');
      await checkpoint('after-explicit-gc');
    } else if (scenarioId === 'A03-school-without-regnereisen') {
      announcementDismissed = await dismissAnnouncementIfVisible(page, 2_000);
      await checkpoint('before-open');
      await page.locator('.home-mode-school').click();
      await page.getByRole('button', { name: 'Austafjord skole', exact: true }).waitFor({ state: 'visible' });
      await checkpoint('screen-visible');
      await page.getByRole('button', { name: 'Austafjord skole', exact: true }).click();
      await page.getByRole('button', { name: '1. klasse', exact: true }).click();
      await page.getByRole('button', { name: /Addisjon/ }).click();
      await page.locator('#player-name').fill('Baseline Elev');
      await page.getByRole('button', { name: 'Start spillet', exact: true }).click();
      await page.locator('.quit-round-button').waitFor({ state: 'visible' });
      await checkpoint('playable');
      await checkpoint('school-play-visible');
      await checkpoint('peak-observed');
      await checkpoint('before-exit');
      await page.locator('.quit-round-button').click();
      await page.getByRole('button', { name: 'Tilbake', exact: true }).click();
      await page.getByRole('button', { name: '1. klasse', exact: true }).waitFor({ state: 'visible' });
      await page.getByRole('button', { name: 'Tilbake', exact: true }).click();
      await page.getByRole('button', { name: 'Austafjord skole', exact: true }).waitFor({ state: 'visible' });
      await page.getByRole('button', { name: 'Tilbake', exact: true }).click();
      await page.locator('.home-mode-journey').waitFor({ state: 'visible' });
      await page.waitForTimeout(settleDelays.afterExitMs);
      await checkpoint('after-exit-2s');
      await page.waitForTimeout(Math.max(0, settleDelays.finalExitMs - settleDelays.afterExitMs));
      await checkpoint('after-exit-10s');
      await cdp.send('HeapProfiler.collectGarbage');
      await checkpoint('after-explicit-gc');
    } else if (scenarioId === 'A04-first-regnereisen-open') {
      announcementDismissed = await dismissAnnouncementIfVisible(page, 2_000);
      await checkpoint('before-open');
      await page.locator('.home-mode-journey').click();
      await page.locator('#start-screen').waitFor({ state: 'visible' });
      await checkpoint('screen-visible');
      await page.locator('#start-game:not([disabled])').waitFor({ state: 'visible' });
      await checkpoint('playable');
      await page.waitForTimeout(250);
      await checkpoint('peak-observed');
      await checkpoint('before-exit');
      await page.locator('#back-to-regnemester').click();
      await page.locator('.home-mode-journey').waitFor({ state: 'visible' });
      await page.waitForTimeout(settleDelays.afterExitMs);
      await checkpoint('after-exit-2s');
      await page.waitForTimeout(Math.max(0, settleDelays.finalExitMs - settleDelays.afterExitMs));
      await checkpoint('after-exit-10s');
      await cdp.send('HeapProfiler.collectGarbage');
      await checkpoint('after-explicit-gc');
    } else if (scenarioId.startsWith('A05-map-')) {
      announcementDismissed = await dismissAnnouncementIfVisible(page, 2_000);
      await checkpoint('before-open');
      await page.locator('.home-mode-journey').click();
      await page.locator('#start-screen').waitFor({ state: 'visible' });
      await page.locator('#start-game:not([disabled])').waitFor({ state: 'visible' });
      await checkpoint('screen-visible');

      for (const [index, phase] of ['first', 'second'].entries()) {
        const mapChoice = page.locator(`[data-map-id="${scenario.mapId}"]`);
        await mapChoice.waitFor({ state: 'visible' });
        await mapChoice.click();
        const mapSettings = page.locator('#map-settings-modal');
        if (await mapSettings.isVisible().catch(() => false)) {
          await page.locator('#confirm-map-settings').click();
          await mapSettings.waitFor({ state: 'hidden' });
        }

        await checkpoint(`${phase}-map-selected`);
        await page.locator('#start-game:not([disabled])').click();
        await page.locator('#start-screen').waitFor({ state: 'hidden' });
        const canvas = page.locator('#game canvas');
        await canvas.waitFor({ state: 'visible' });
        await page.locator('#open-start').waitFor({ state: 'visible' });
        const canvasBounds = await canvas.boundingBox();
        await canvas.tap({
          position: {
            x: Math.max(2, (canvasBounds?.width ?? 4) / 2),
            y: Math.max(2, (canvasBounds?.height ?? 4) / 2)
          }
        });
        await page.waitForTimeout(250);
        await checkpoint(`${phase}-map-playable`);

        await page.locator('#open-start').click();
        await page.locator('#start-screen').waitFor({ state: 'visible' });
        if (index === 0) await checkpoint('warm-before-open');
      }

      await checkpoint('peak-observed');
      await checkpoint('before-exit');
      await page.locator('#back-to-regnemester').click();
      await page.locator('.home-mode-journey').waitFor({ state: 'visible' });
      await page.waitForTimeout(settleDelays.afterExitMs);
      await checkpoint('after-exit-2s');
      await page.waitForTimeout(Math.max(0, settleDelays.finalExitMs - settleDelays.afterExitMs));
      await checkpoint('after-exit-10s');
      await cdp.send('HeapProfiler.collectGarbage');
      await checkpoint('after-explicit-gc');
    } else if (scenarioId === 'A06-heavy-scenes-and-binder') {
      announcementDismissed = await dismissAnnouncementIfVisible(page, 2_000);
      await checkpoint('before-open');
      await page.locator('.home-mode-journey').click();
      await page.locator('#start-screen').waitFor({ state: 'visible' });
      await page.locator('#start-game:not([disabled])').waitFor({ state: 'visible' });
      await checkpoint('screen-visible');
      await page.locator('#start-game:not([disabled])').click();
      await page.locator('#start-screen').waitFor({ state: 'hidden' });
      const canvas = page.locator('#game canvas');
      await canvas.waitFor({ state: 'visible' });
      await page.locator('#open-start').waitFor({ state: 'visible' });

      if (sceneId === 'binder') {
        await page.waitForTimeout(2_000);
        await page.bringToFront();
        await page.evaluate(() => window.focus());
        await page.keyboard.down('w');
        await page.waitForTimeout(1_700);
        await page.keyboard.up('w');
        await page.waitForTimeout(500);
        await screenshot(page, outputDir, 'binder-positioned', takeScreenshots);
      }

      const nearbyAction = page.locator('#nearby-card button');
      await nearbyAction.waitFor({ state: 'attached' });
      await nearbyAction.dispatchEvent('click');
      if (heavyScene.startSelector) {
        await page.locator(heavyScene.startSelector).waitFor({ state: 'visible' });
        await page.locator(heavyScene.startSelector).click();
      }
      if (heavyScene.visibleSelector) {
        await page.locator(heavyScene.visibleSelector).waitFor({ state: 'visible' });
      }
      await page.waitForTimeout(heavyScene.settleMs ?? 500);
      await checkpoint('playable');
      await checkpoint('peak-observed');
      await checkpoint('before-exit');

      if (heavyScene.exitSelector) {
        const exit = page.locator(heavyScene.exitSelector);
        if (
          await exit.isVisible().catch(() => false)
          && await exit.isEnabled().catch(() => false)
        ) await exit.click();
      }
      await page.locator('#open-start').dispatchEvent('click');
      await page.locator('#start-screen').waitFor({ state: 'visible' });
      await page.locator('#back-to-regnemester').dispatchEvent('click');
      await page.locator('.home-mode-journey').waitFor({ state: 'visible' });
      await page.waitForTimeout(settleDelays.afterExitMs);
      await checkpoint('after-exit-2s');
      await page.waitForTimeout(Math.max(0, settleDelays.finalExitMs - settleDelays.afterExitMs));
      await checkpoint('after-exit-10s');
      await cdp.send('HeapProfiler.collectGarbage');
      await checkpoint('after-explicit-gc');
    } else if (scenarioId === 'A07-five-entry-exit-rounds') {
      announcementDismissed = await dismissAnnouncementIfVisible(page, 2_000);
      await checkpoint('before-open');
      for (let round = 1; round <= 5; round += 1) {
        await page.locator('.home-mode-journey').click();
        await page.locator('#start-screen').waitFor({ state: 'visible' });
        await page.locator('#start-game:not([disabled])').waitFor({ state: 'visible' });
        await page.locator('[data-map-id="bossreisen"]').click();
        const mapSettings = page.locator('#map-settings-modal');
        if (await mapSettings.isVisible().catch(() => false)) {
          await page.locator('#confirm-map-settings').click();
          await mapSettings.waitFor({ state: 'hidden' });
        }
        await page.locator('#start-game:not([disabled])').click();
        await page.locator('#start-screen').waitFor({ state: 'hidden' });
        const canvas = page.locator('#game canvas');
        await canvas.waitFor({ state: 'visible' });
        const canvasBounds = await canvas.boundingBox();
        await canvas.tap({
          position: {
            x: Math.max(2, (canvasBounds?.width ?? 4) / 2),
            y: Math.max(2, (canvasBounds?.height ?? 4) / 2)
          }
        });
        await page.waitForTimeout(250);
        await checkpoint(`round-${round}-playable`);
        await page.locator('#open-start').click();
        await page.locator('#start-screen').waitFor({ state: 'visible' });
        await page.locator('#back-to-regnemester').click();
        await page.locator('.home-mode-journey').waitFor({ state: 'visible' });
        await page.waitForTimeout(settleDelays.afterExitMs);
        await checkpoint(`round-${round}-after-exit`);
        await cdp.send('HeapProfiler.collectGarbage');
        await checkpoint(`round-${round}-after-gc`);
        const afterGc = memoryCheckpoints.at(-1);
        lifecycleRounds.push({
          round,
          heapAfterGc: afterGc.jsHeapUsedBytes,
          listeners: afterGc.jsEventListeners,
          timers: (afterGc.activeTimeouts ?? 0) + (afterGc.activeIntervals ?? 0),
          canvases: afterGc.canvasCount,
          webglContexts: afterGc.webglContextCount
        });
        if (captureTrace && (round === 2 || round === 5)) {
          await captureHeapSnapshot(cdp, path.join(outputDir, `heap-round-${round}.heapsnapshot`));
        }
      }
      await page.waitForTimeout(Math.max(0, settleDelays.finalExitMs - settleDelays.afterExitMs));
      await checkpoint('after-exit-10s');
      await cdp.send('HeapProfiler.collectGarbage');
      await checkpoint('after-explicit-gc');
    } else if (scenarioId === 'A08-thirty-minute-session') {
      announcementDismissed = await dismissAnnouncementIfVisible(page, 2_000);
      await checkpoint('before-open');
      await page.locator('.home-mode-journey').click();
      await page.locator('#start-screen').waitFor({ state: 'visible' });
      await page.locator('#start-game:not([disabled])').waitFor({ state: 'visible' });
      await page.locator('[data-map-id="bossreisen"]').click();
      const mapSettings = page.locator('#map-settings-modal');
      if (await mapSettings.isVisible().catch(() => false)) {
        await page.locator('#confirm-map-settings').click();
        await mapSettings.waitFor({ state: 'hidden' });
      }
      await page.locator('#start-game:not([disabled])').click();
      await page.locator('#start-screen').waitFor({ state: 'hidden' });
      const canvas = page.locator('#game canvas');
      await canvas.waitFor({ state: 'visible' });
      await checkpoint('playable');

      for (let segment = 1; segment <= 6; segment += 1) {
        await page.waitForTimeout(sessionSegmentMs);
        if (segment === 2 || segment === 5) {
          const bounds = await canvas.boundingBox();
          const x = (bounds?.x ?? 0) + Math.max(2, (bounds?.width ?? 4) / 2);
          const y = (bounds?.y ?? 0) + Math.max(2, (bounds?.height ?? 4) / 2);
          const taps = segment === 5 ? 3 : 1;
          for (let tapIndex = 0; tapIndex < taps; tapIndex += 1) {
            await page.touchscreen.tap(x, y);
          }
        }
        if (segment === 4) {
          const backgroundPage = await context.newPage();
          await backgroundPage.goto('about:blank');
          await backgroundPage.bringToFront();
          await page.waitForTimeout(backgroundDelayMs);
          await page.bringToFront();
          await backgroundPage.close();
        }
        if (segment === 5) {
          await page.setViewportSize({ width: 768, height: 1024 });
          await page.waitForTimeout(Math.min(1_000, sessionSegmentMs));
          await page.setViewportSize(profile.viewport);
        }
        await checkpoint(`session-minute-${segment * 5}`);
      }

      await checkpoint('peak-observed');
      await checkpoint('before-exit');
      await page.locator('#open-start').click();
      await page.locator('#start-screen').waitFor({ state: 'visible' });
      await page.locator('#back-to-regnemester').click();
      await page.locator('.home-mode-journey').waitFor({ state: 'visible' });
      await page.waitForTimeout(settleDelays.afterExitMs);
      await checkpoint('after-exit-2s');
      await page.waitForTimeout(Math.max(0, settleDelays.finalExitMs - settleDelays.afterExitMs));
      await checkpoint('after-exit-10s');
      await cdp.send('HeapProfiler.collectGarbage');
      await checkpoint('after-explicit-gc');
    } else if (scenarioId !== 'A01-cold-home') {
      throw new Error(`Scenario ${scenarioId} er ennå ikke automatisert.`);
    }

    const finalProbe = await page.evaluate(() => window.__regnemesterBaseline.finish());
    if (traceStarted) {
      await stopPerformanceTrace(cdp, path.join(outputDir, 'performance-trace.json'), traceChunks);
      traceCompleted = true;
    }
    const run = {
      metadata: {
        commit,
        profileId,
        browserVersion,
        repeatIndex,
        capturedAt: new Date().toISOString(),
        baseOrigin: new URL(baseUrl).origin,
        announcementDismissed,
        scoreSubmissionAttempted,
        schoolRoundEndpointBlocked,
        productionWritesBlocked,
        traceCaptured: captureTrace
        ,sceneId: sceneId ?? null
      },
      scenario: heavyScene
        ? { ...scenario, sceneId, label: `${scenario.label}: ${heavyScene.label}` }
        : scenario,
      checkpoints,
      network: summarizeNetwork(requests),
      mainThread: summarizeMainThread(finalProbe),
      memory: { checkpoints: memoryCheckpoints },
      errors,
      lifecycleRounds,
      cleanupTrend: classifyCleanupTrend(lifecycleRounds)
    };
    validateBaselineRun(run);
    const outputPath = path.join(outputDir, `run-${String(repeatIndex).padStart(2, '0')}.json`);
    await writeFile(outputPath, `${JSON.stringify(run, null, 2)}\n`, 'utf8');
    return run;
  } finally {
    if (traceStarted && !traceCompleted) {
      await stopPerformanceTrace(cdp, path.join(outputDir, 'performance-trace-incomplete.json'), traceChunks).catch(() => {});
    }
    await cdp.detach().catch(() => {});
    await context.close();
    await browser.close();
  }
}

async function main() {
  const options = parseCollectorArgs(process.argv.slice(2));
  const outputDir = path.join(
    process.cwd(),
    'artifacts',
    'skolestart-baseline',
    BASELINE_RUN_ID,
    'runs',
    options.scenarioId,
    options.profileId,
    ...(options.sceneId ? [options.sceneId] : [])
  );
  for (let repeatIndex = 1; repeatIndex <= options.repeat; repeatIndex += 1) {
    await captureScenario({ ...options, outputDir, repeatIndex });
  }
  process.stdout.write(`${outputDir}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  await main();
}
