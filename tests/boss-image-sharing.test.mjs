import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const appSource = readFileSync(path.join(root, 'src', 'App.jsx'), 'utf8');
const locationsSource = readFileSync(
  path.join(root, 'src', 'regnereisen-bossreisen', 'game', 'content', 'locations.ts'),
  'utf8',
);

test('Bosskamp og Boss-reisen deler ett WebP-bildebibliotek', () => {
  assert.match(locationsSource, /const bossBase = '\/bosses';/);
  assert.doesNotMatch(appSource, /\/bosses\/[^"']+\.png/);
  assert.doesNotMatch(locationsSource, /\$\{bossBase\}\/[^`]+\.png/);
  assert.equal(existsSync(path.join(root, 'public', 'regnemester', 'bosses')), false);
});
