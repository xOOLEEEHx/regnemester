import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = path.join(root, 'src');
const publicRoot = path.join(root, 'public');
const sourceExtensions = new Set(['.css', '.js', '.jsx', '.ts', '.tsx']);
const imageReference = /\/(?:[A-Za-z0-9_().%+@ -]+\/)*[A-Za-z0-9_().%+@ -]+\.(?:avif|gif|jpe?g|png|webp)(?:[?#][^'"\s)]*)?/gi;
const knownOptionalReferences = new Set(['/bosses/slime/slime-boss-page-bg.webp']);

function sourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(fullPath);
    return sourceExtensions.has(path.extname(entry.name).toLowerCase()) ? [fullPath] : [];
  });
}

test('alle statiske runtime-bildereferanser peker til publiserte filer', () => {
  const missing = [];
  for (const file of sourceFiles(sourceRoot)) {
    const contents = readFileSync(file, 'utf8');
    for (const match of contents.matchAll(imageReference)) {
      if (match.index > 0 && contents[match.index - 1] === '}') continue;
      const reference = match[0].split(/[?#]/, 1)[0];
      if (knownOptionalReferences.has(reference)) continue;
      const publicPath = path.join(publicRoot, ...reference.slice(1).split('/'));
      if (!existsSync(publicPath)) {
        missing.push({
          source: path.relative(root, file).replaceAll('\\', '/'),
          reference,
        });
      }
    }
  }
  assert.deepEqual(missing, []);
});
