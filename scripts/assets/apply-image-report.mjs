import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const sourceExtensions = new Set(['.css', '.html', '.js', '.json', '.jsx', '.ts', '.tsx']);

function assertInside(parent, candidate) {
  const relative = path.relative(parent, candidate);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Stien er utenfor tillatt mappe: ${candidate}`);
  }
}

async function sourceFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await sourceFiles(fullPath));
    else if (sourceExtensions.has(path.extname(entry.name).toLowerCase())) files.push(fullPath);
  }
  return files;
}

async function sameContents(first, second) {
  const [left, right] = await Promise.all([fs.readFile(first), fs.readFile(second)]);
  return left.equals(right);
}

export async function applyImageReport({ root, reportPath, apply = false, dynamicPrefixes = [] }) {
  const resolvedRoot = path.resolve(root);
  const publicRoot = path.join(resolvedRoot, 'public');
  const archiveRoot = path.join(resolvedRoot, 'source-assets', 'runtime-originals');
  const scanRoots = [path.join(resolvedRoot, 'src')];
  const indexHtml = path.join(resolvedRoot, 'index.html');
  const files = [];
  for (const scanRoot of scanRoots) files.push(...await sourceFiles(scanRoot));
  try {
    await fs.access(indexHtml);
    files.push(indexHtml);
  } catch {
    // Et test-fixture trenger ikke index.html.
  }

  const report = JSON.parse(await fs.readFile(path.resolve(reportPath), 'utf8'));
  const accepted = report.results.filter((entry) => entry.accepted);
  const contents = new Map(await Promise.all(files.map(async (file) => [file, await fs.readFile(file, 'utf8')])));
  const updated = [];
  const dynamic = [];
  const unmatched = [];
  const normalizedDynamicPrefixes = dynamicPrefixes.map((prefix) => {
    const normalized = prefix.replaceAll('\\', '/').replace(/^\/+/, '').replace(/\/+$/, '') + '/';
    if (normalized.startsWith('../') || normalized.includes('/../')) {
      throw new Error(`Ugyldig dynamisk bildeprefix: ${prefix}`);
    }
    return normalized;
  });

  async function archiveSource(publicSource, relativePath) {
    const archivedSource = path.resolve(archiveRoot, relativePath);
    assertInside(archiveRoot, archivedSource);
    await fs.mkdir(path.dirname(archivedSource), { recursive: true });
    try {
      await fs.access(archivedSource);
      if (!await sameContents(publicSource, archivedSource)) {
        throw new Error(`Arkivet har en annen original for ${relativePath}`);
      }
      await fs.rm(publicSource);
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
      await fs.rename(publicSource, archivedSource);
    }
  }

  for (const entry of accepted) {
    const sourceReference = `/${entry.path.replaceAll('\\', '/')}`;
    const destinationReference = `/${entry.destination.replaceAll('\\', '/')}`;
    const matches = [];
    for (const [file, original] of contents) {
      if (!original.includes(sourceReference)) continue;
      const replacement = original.replaceAll(sourceReference, destinationReference);
      contents.set(file, replacement);
      matches.push(path.relative(resolvedRoot, file).replaceAll('\\', '/'));
    }

    const publicSource = path.resolve(publicRoot, entry.path);
    const publicDestination = path.resolve(publicRoot, entry.destination);
    assertInside(publicRoot, publicSource);
    assertInside(publicRoot, publicDestination);

    if (!matches.length) {
      const dynamicPrefix = normalizedDynamicPrefixes.find((prefix) => entry.path.startsWith(prefix));
      if (dynamicPrefix) {
        const baseReference = `/${dynamicPrefix.slice(0, -1)}`;
        const evidenceFiles = [...contents]
          .filter(([, source]) => source.includes(baseReference) && source.includes('.webp'))
          .map(([file]) => path.relative(resolvedRoot, file).replaceAll('\\', '/'));
        if (evidenceFiles.length) {
          dynamic.push({ path: entry.path, destination: entry.destination, files: evidenceFiles });
          if (apply) await archiveSource(publicSource, entry.path);
          continue;
        }
      }
      unmatched.push(entry.path);
      if (apply) await fs.rm(publicDestination, { force: true });
      continue;
    }

    updated.push({ path: entry.path, destination: entry.destination, files: matches });
    if (!apply) continue;

    await archiveSource(publicSource, entry.path);
  }

  if (apply) {
    for (const [file, replacement] of contents) {
      const original = await fs.readFile(file, 'utf8');
      if (original !== replacement) await fs.writeFile(file, replacement, 'utf8');
    }
  }

  return { apply, accepted: accepted.length, updated, dynamic, unmatched };
}

function parseArgs(argv) {
  const args = { apply: false };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--apply') args.apply = true;
    else if (argument === '--root') args.root = argv[++index];
    else if (argument === '--report') args.reportPath = argv[++index];
    else if (argument === '--dynamic-prefix') (args.dynamicPrefixes ??= []).push(argv[++index]);
    else throw new Error(`Ukjent argument: ${argument}`);
  }
  if (!args.reportPath) throw new Error('Mangler --report');
  return args;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const args = parseArgs(process.argv.slice(2));
  const result = await applyImageReport({
    root: args.root ?? process.cwd(),
    reportPath: args.reportPath,
    apply: args.apply,
    dynamicPrefixes: args.dynamicPrefixes,
  });
  console.log(JSON.stringify(result, null, 2));
}
