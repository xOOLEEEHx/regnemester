import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { BASELINE_COMMIT, BASELINE_RUN_ID } from './baseline-config.mjs';

function toPosix(filePath) {
  return filePath.split(path.sep).join('/');
}

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(entryPath));
    if (entry.isFile()) files.push(entryPath);
  }
  return files;
}

async function sha256(filePath) {
  const contents = await readFile(filePath);
  return createHash('sha256').update(contents).digest('hex');
}

function countCards(manifest) {
  const sets = (manifest.sets ?? []).map((set) => ({
    id: String(set.id ?? 'unknown'),
    cards: Array.isArray(set.cards) ? set.cards.length : 0
  }));
  return {
    sets,
    total: sets.reduce((sum, set) => sum + set.cards, 0)
  };
}

export async function createBuildInventory({ rootDir, expectedCommit = BASELINE_COMMIT }) {
  const resolvedRoot = path.resolve(rootDir);
  let commit = null;
  if (expectedCommit) {
    commit = execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: resolvedRoot,
      encoding: 'utf8'
    }).trim();
    if (commit !== expectedCommit) {
      throw new Error(`Forventet baseline ${expectedCommit}, men HEAD er ${commit}.`);
    }
  }

  const manifestPath = path.join(resolvedRoot, 'dist', '.vite', 'manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const buildChunks = [];
  for (const [source, entry] of Object.entries(manifest)) {
    const outputPath = path.join(resolvedRoot, 'dist', entry.file);
    const outputStat = await stat(outputPath);
    buildChunks.push({
      source,
      file: toPosix(entry.file),
      bytes: outputStat.size,
      isEntry: entry.isEntry === true,
      isDynamicEntry: entry.isDynamicEntry === true,
      imports: [...(entry.imports ?? [])],
      dynamicImports: [...(entry.dynamicImports ?? [])],
      css: [...(entry.css ?? [])]
    });
  }
  buildChunks.sort((left, right) => right.bytes - left.bytes || left.file.localeCompare(right.file));

  const publicRoot = path.join(resolvedRoot, 'public');
  const publicFiles = await listFiles(publicRoot);
  const publicAssets = [];
  const hashes = new Map();
  for (const filePath of publicFiles) {
    const fileStat = await stat(filePath);
    const relativePath = toPosix(path.relative(resolvedRoot, filePath));
    const extension = path.extname(filePath).toLowerCase() || '[none]';
    const topDirectory = toPosix(path.relative(publicRoot, filePath)).split('/')[0];
    const hash = await sha256(filePath);
    publicAssets.push({ path: relativePath, bytes: fileStat.size, extension, topDirectory, sha256: hash });
    const duplicatePaths = hashes.get(hash) ?? [];
    duplicatePaths.push(relativePath);
    hashes.set(hash, duplicatePaths);
  }
  publicAssets.sort((left, right) => right.bytes - left.bytes || left.path.localeCompare(right.path));

  const duplicateHashes = [...hashes.entries()]
    .filter(([, paths]) => paths.length > 1)
    .map(([hash, paths]) => ({ hash, paths: paths.toSorted() }))
    .toSorted((left, right) => right.paths.length - left.paths.length || left.hash.localeCompare(right.hash));

  const groups = new Map();
  for (const asset of publicAssets) {
    const group = groups.get(asset.topDirectory) ?? { topDirectory: asset.topDirectory, files: 0, bytes: 0 };
    group.files += 1;
    group.bytes += asset.bytes;
    groups.set(asset.topDirectory, group);
  }

  const cardManifestPath = path.join(
    resolvedRoot,
    'src',
    'regnereisen-bossreisen',
    'game',
    'content',
    'regnemonsterCardManifest.generated.json'
  );
  const cardManifest = JSON.parse(await readFile(cardManifestPath, 'utf8'));
  const templatePath = path.join(resolvedRoot, 'src', 'regnereisen-bossreisen', 'template.html');
  const templateHtml = await readFile(templatePath, 'utf8');
  const imageTags = [...templateHtml.matchAll(/<img\b[^>]*>/gi)];
  const imageSources = [...templateHtml.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["']/gi)]
    .map((match) => match[1]);

  return {
    metadata: {
      commit,
      generatedAt: new Date().toISOString()
    },
    buildChunks,
    publicSummary: {
      files: publicAssets.length,
      bytes: publicAssets.reduce((sum, asset) => sum + asset.bytes, 0),
      groups: [...groups.values()].toSorted((left, right) => right.bytes - left.bytes)
    },
    largestAssets: publicAssets.slice(0, 100),
    publicAssets,
    duplicateHashes,
    cardCounts: countCards(cardManifest),
    staticTemplateImages: {
      totalTags: imageTags.length,
      tagsWithSource: imageSources.length,
      uniqueSources: new Set(imageSources).size,
      sources: [...new Set(imageSources)].toSorted()
    }
  };
}

function readArgument(name, fallback) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
}

async function main() {
  const rootDir = process.cwd();
  const runId = readArgument('--run-id', BASELINE_RUN_ID);
  const outputPath = path.join(rootDir, 'artifacts', 'skolestart-baseline', runId, 'inventory.json');
  const inventory = await createBuildInventory({ rootDir });
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(inventory, null, 2)}\n`, 'utf8');
  process.stdout.write(`${outputPath}\n`);
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  await main();
}
