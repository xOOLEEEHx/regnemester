import assert from 'node:assert/strict';
import { access, readdir, stat } from 'node:fs/promises';
import test from 'node:test';

const publicRoot = new URL('../public/regnemester/maps/tallvokter-fx/', import.meta.url);
const compactWaterMask = new URL('runtime/tallvokter-water-mask.png', publicRoot);

async function exists(url) {
  try {
    await access(url);
    return true;
  } catch {
    return false;
  }
}

test('Tallvokterens vannmaske er kompakt nok for skole-iPader', async () => {
  assert.equal(await exists(compactWaterMask), true, 'den kompakte vannmasken skal finnes');
  const file = await stat(compactWaterMask);
  assert.ok(file.size < 150_000, `vannmasken er fortsatt for stor: ${file.size} byte`);
});

test('tunge manuelle effektmaler blir ikke publisert til elevene', async () => {
  const manualDir = new URL('manual/', publicRoot);
  const sourceDir = new URL(
    '../source-assets/regnemester/maps/tallvokter-fx/manual/',
    import.meta.url
  );
  const sourceFiles = [
    'tallvokter-water-mask-manual-template.png',
    'tallvokter-waterfalls-manual-template.png',
    'tallvokter-camp-part-spawn-mask-manual-template.png',
    'tallvokter-thief-spawn-mask-manual-template.png',
    'tallvokter-collision-mask-manual-template.png'
  ];

  for (const filename of sourceFiles) {
    assert.equal(
      await exists(new URL(filename, manualDir)),
      false,
      `${filename} skal bare ligge blant kildefilene, ikke i public`
    );
    assert.equal(
      await exists(new URL(filename, sourceDir)),
      true,
      `${filename} skal fortsatt være bevart som kildefil`
    );
  }
});

test('de største kartbildene er tapsfritt komprimert', async () => {
  const mapsDir = new URL('../public/regnemester/maps/', import.meta.url);
  const limits = new Map([
    ['tallvokterens-rike-v4.png', 18_500_000],
    ['world-map-v2.png', 3_400_000]
  ]);

  for (const [filename, maximumBytes] of limits) {
    const file = await stat(new URL(filename, mapsDir));
    assert.ok(
      file.size < maximumBytes,
      `${filename} er ${file.size} byte og bør komprimeres tapsfritt`
    );
  }
});

test('spillbrikkene er tapsfritt komprimert som en samlet ressurs', async () => {
  const tokenDir = new URL('../public/regnemester/Spillbrikkene/', import.meta.url);
  const entries = await readdir(tokenDir, { withFileTypes: true });
  let totalBytes = 0;
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.toLowerCase().endsWith('.png')) continue;
    totalBytes += (await stat(new URL(entry.name, tokenDir))).size;
  }
  assert.ok(totalBytes < 49_000_000, `spillbrikkene er fortsatt ${totalBytes} byte`);
});
