import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { heapSnapshotStats } from './analyze-baseline.mjs';
import { BASELINE_COMMIT } from './baseline-config.mjs';
import { captureScenario } from './collect-baseline.mjs';

function argumentValue(args, name) {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
}

export function sanitizeVariant(value) {
  if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(value ?? '')) {
    throw new Error('Ugyldig variant. Bruk små bokstaver, tall og bindestrek.');
  }
  return value;
}

export function parseCleanupArgs(args) {
  const baseUrlValue = argumentValue(args, '--base-url');
  if (!baseUrlValue) throw new Error('Mangler --base-url.');
  const variantValue = argumentValue(args, '--variant');
  if (!variantValue) throw new Error('Mangler --variant.');

  let parsedUrl;
  try {
    parsedUrl = new URL(baseUrlValue);
  } catch {
    throw new Error(`Ugyldig base URL: ${baseUrlValue}`);
  }
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(parsedUrl.hostname)) {
    throw new Error('Oppryddingsmålingen må bruke lokal preview.');
  }

  return {
    baseUrl: parsedUrl.toString(),
    variant: sanitizeVariant(variantValue)
  };
}

export function cleanupArtifactPaths(baseRoot, variantValue) {
  const variant = sanitizeVariant(variantValue);
  const root = path.join(baseRoot, variant);
  return {
    root,
    clean: path.join(root, 'clean'),
    trace: path.join(root, 'trace'),
    validationJson: path.join(root, 'validation.json'),
    validationMarkdown: path.join(root, 'validation.md')
  };
}

export function evaluateCleanupCandidate({ cleanRuns, heapDiagnostics }) {
  const reasons = new Set();
  for (const run of cleanRuns) {
    const round2 = run.lifecycleRounds.find((round) => round.round === 2);
    const round5 = run.lifecycleRounds.find((round) => round.round === 5);
    if (!round2 || !round5 || round5.listeners - round2.listeners > 5) {
      reasons.add('listener-growth');
    }
    if (run.lifecycleRounds.some((round) => (
      round.canvases !== 0 || round.webglContexts !== 0
    ))) {
      reasons.add('connected-renderer-after-exit');
    }
  }

  if (heapDiagnostics.round5.registeredEventListeners
      - heapDiagnostics.round2.registeredEventListeners > 10) {
    reasons.add('registered-listener-growth');
  }
  if (heapDiagnostics.round5.detachedNodes - heapDiagnostics.round2.detachedNodes > 200) {
    reasons.add('detached-node-growth');
  }
  if (heapDiagnostics.round5.retainedGameCanvases
      > heapDiagnostics.round2.retainedGameCanvases) {
    reasons.add('retained-canvas-growth');
  }

  return { passed: reasons.size === 0, reasons: [...reasons] };
}

async function ensureVariantDoesNotExist(directory) {
  try {
    await access(directory);
  } catch (error) {
    if (error?.code === 'ENOENT') return;
    throw error;
  }
  throw new Error(`Varianten finnes allerede og overskrives ikke: ${path.basename(directory)}`);
}

async function workingTreeDiffSha256(rootDir) {
  const hash = createHash('sha256');
  const trackedDiff = execFileSync(
    'git',
    ['diff', '--binary', '--no-ext-diff', '--'],
    { cwd: rootDir, encoding: 'utf8', maxBuffer: 100 * 1024 * 1024 }
  );
  hash.update('tracked\0');
  hash.update(trackedDiff);

  const untrackedOutput = execFileSync(
    'git',
    ['ls-files', '--others', '--exclude-standard', '-z'],
    { cwd: rootDir, encoding: 'utf8' }
  );
  const untrackedFiles = untrackedOutput.split('\0').filter(Boolean).toSorted();
  for (const relativePath of untrackedFiles) {
    hash.update(`untracked\0${relativePath}\0`);
    hash.update(await readFile(path.join(rootDir, relativePath)));
  }
  return hash.digest('hex');
}

function summarizeRun(run) {
  return {
    capturedAt: run.metadata.capturedAt,
    browserVersion: run.metadata.browserVersion,
    lifecycleRounds: run.lifecycleRounds,
    errors: run.errors
  };
}

function renderValidationMarkdown(validation) {
  const cleanRows = validation.cleanRuns.map((run, index) => {
    const round2 = run.lifecycleRounds.find((round) => round.round === 2);
    const round5 = run.lifecycleRounds.find((round) => round.round === 5);
    return `| ${index + 1} | ${round2?.listeners ?? '–'} | ${round5?.listeners ?? '–'} | ${round5?.canvases ?? '–'} | ${round5?.webglContexts ?? '–'} |`;
  }).join('\n');
  return `# Regnereisen – isolert oppryddingsmåling

- Variant: \`${validation.variant}\`
- Baseline-commit: \`${validation.baselineCommit}\`
- Kandidat-diff SHA-256: \`${validation.workingTreeDiffSha256}\`
- Resultat: **${validation.passed ? 'bestått' : 'ikke bestått'}**
- Årsaker: ${validation.reasons.length ? validation.reasons.join(', ') : 'ingen'}

| Ren kjøring | Lyttere runde 2 | Lyttere runde 5 | Canvas etter runde 5 | WebGL etter runde 5 |
|---:|---:|---:|---:|---:|
${cleanRows}

## Heap, trace-kjøring

- Frakoblede noder: ${validation.heapDiagnostics.round2.detachedNodes} → ${validation.heapDiagnostics.round5.detachedNodes}
- Registrerte lyttere: ${validation.heapDiagnostics.round2.registeredEventListeners} → ${validation.heapDiagnostics.round5.registeredEventListeners}
- Beholdte spillcanvas: ${validation.heapDiagnostics.round2.retainedGameCanvases} → ${validation.heapDiagnostics.round5.retainedGameCanvases}

Rådata ligger i ignorert artifact-mappe og inneholder ikke elevnavn, request bodies, cookies eller autorisasjonshoder.
`;
}

async function main() {
  const rootDir = process.cwd();
  const options = parseCleanupArgs(process.argv.slice(2));
  const paths = cleanupArtifactPaths(
    path.join(rootDir, 'artifacts', 'skolestart-cleanup'),
    options.variant
  );
  await ensureVariantDoesNotExist(paths.root);
  await Promise.all([
    mkdir(paths.clean, { recursive: true }),
    mkdir(paths.trace, { recursive: true })
  ]);

  const diffSha256 = await workingTreeDiffSha256(rootDir);
  const cleanRuns = [];
  for (let repeatIndex = 1; repeatIndex <= 3; repeatIndex += 1) {
    cleanRuns.push(await captureScenario({
      baseUrl: options.baseUrl,
      captureTrace: false,
      headless: true,
      outputDir: paths.clean,
      profileId: 'tablet-native',
      repeatIndex,
      scenarioId: 'A07-five-entry-exit-rounds',
      takeScreenshots: false
    }));
  }
  const traceRun = await captureScenario({
    baseUrl: options.baseUrl,
    captureTrace: true,
    headless: true,
    outputDir: paths.trace,
    profileId: 'tablet-native',
    repeatIndex: 1,
    scenarioId: 'A07-five-entry-exit-rounds',
    takeScreenshots: false
  });
  const [round2, round5] = await Promise.all([
    heapSnapshotStats(path.join(paths.trace, 'heap-round-2.heapsnapshot')),
    heapSnapshotStats(path.join(paths.trace, 'heap-round-5.heapsnapshot'))
  ]);
  const heapDiagnostics = { round2, round5 };
  const evaluation = evaluateCleanupCandidate({ cleanRuns, heapDiagnostics });
  const validation = {
    schemaVersion: 1,
    variant: options.variant,
    generatedAt: new Date().toISOString(),
    baselineCommit: BASELINE_COMMIT,
    workingTreeDiffSha256: diffSha256,
    cleanRuns: cleanRuns.map(summarizeRun),
    traceRun: summarizeRun(traceRun),
    heapDiagnostics,
    ...evaluation
  };
  await Promise.all([
    writeFile(paths.validationJson, `${JSON.stringify(validation, null, 2)}\n`, 'utf8'),
    writeFile(paths.validationMarkdown, renderValidationMarkdown(validation), 'utf8')
  ]);
  process.stdout.write(`${paths.validationJson}\n${paths.validationMarkdown}\n`);
  if (!validation.passed) process.exitCode = 1;
}

if (process.argv[1]
    && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  await main();
}
