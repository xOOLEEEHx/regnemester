import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { applyImageReport } from '../scripts/assets/apply-image-report.mjs';

test('oppdaterer bare refererte bilder og arkiverer originalen ved apply', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'regnemester-image-report-'));
  await fs.mkdir(path.join(root, 'public', 'example'), { recursive: true });
  await fs.mkdir(path.join(root, 'src'), { recursive: true });
  await fs.writeFile(path.join(root, 'public', 'example', 'used.png'), 'png');
  await fs.writeFile(path.join(root, 'public', 'example', 'used.webp'), 'webp');
  await fs.writeFile(path.join(root, 'public', 'example', 'unused.png'), 'png');
  await fs.writeFile(path.join(root, 'public', 'example', 'unused.webp'), 'webp');
  await fs.writeFile(path.join(root, 'src', 'assets.ts'), "export const used = '/example/used.png?v=1';\n");
  const reportPath = path.join(root, 'report.json');
  await fs.writeFile(reportPath, JSON.stringify({ results: [
    { path: 'example/used.png', destination: 'example/used.webp', accepted: true },
    { path: 'example/unused.png', destination: 'example/unused.webp', accepted: true },
  ] }));

  const result = await applyImageReport({ root, reportPath, apply: true });

  assert.equal(await fs.readFile(path.join(root, 'src', 'assets.ts'), 'utf8'), "export const used = '/example/used.webp?v=1';\n");
  await fs.access(path.join(root, 'source-assets', 'runtime-originals', 'example', 'used.png'));
  await assert.rejects(fs.access(path.join(root, 'public', 'example', 'used.png')));
  await fs.access(path.join(root, 'public', 'example', 'unused.png'));
  await assert.rejects(fs.access(path.join(root, 'public', 'example', 'unused.webp')));
  assert.equal(result.updated.length, 1);
  assert.deepEqual(result.unmatched, ['example/unused.png']);
});

test('bevarer eksplisitt godkjente dynamiske bilder når kodebasen bruker WebP-suffiks', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'regnemester-image-report-dynamic-'));
  await fs.mkdir(path.join(root, 'public', 'dynamic'), { recursive: true });
  await fs.mkdir(path.join(root, 'src'), { recursive: true });
  await fs.writeFile(path.join(root, 'public', 'dynamic', 'item-1.png'), 'png');
  await fs.writeFile(path.join(root, 'public', 'dynamic', 'item-1.webp'), 'webp');
  await fs.writeFile(
    path.join(root, 'src', 'assets.ts'),
    "const base = '/dynamic'; export const item = `${base}/item-${1}.webp`;\n",
  );
  const reportPath = path.join(root, 'report.json');
  await fs.writeFile(reportPath, JSON.stringify({ results: [
    { path: 'dynamic/item-1.png', destination: 'dynamic/item-1.webp', accepted: true },
  ] }));

  const result = await applyImageReport({
    root,
    reportPath,
    apply: true,
    dynamicPrefixes: ['dynamic/'],
  });

  await fs.access(path.join(root, 'public', 'dynamic', 'item-1.webp'));
  await fs.access(path.join(root, 'source-assets', 'runtime-originals', 'dynamic', 'item-1.png'));
  await assert.rejects(fs.access(path.join(root, 'public', 'dynamic', 'item-1.png')));
  assert.equal(result.dynamic.length, 1);
  assert.deepEqual(result.unmatched, []);
});
