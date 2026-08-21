import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const configPath = path.join(root, 'scripts', 'assets', 'image-optimization-config.json');
const python = process.env.PYTHON ?? (process.platform === 'win32'
  ? 'C:\\Users\\Ole_e\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\python\\python.exe'
  : 'python3');

test('bildeprofilene har sikre kvalitetsgrenser', () => {
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  assert.equal(config.profiles.background.quality, 92);
  assert.equal(config.profiles.transparent.quality, 95);
  assert.equal(config.profiles.text.quality, 97);
  assert.equal(config.profiles.lossless.format, 'png');
  assert.equal(config.profiles.lossless.pixelExact, true);
  assert.ok(config.protectedPathPatterns.includes('**/*mask*.png'));
  assert.ok(config.protectedPathPatterns.includes('**/*collision*.png'));
});

test('bildeinventaret summerer filer og identiske duplikater', () => {
  const fixtureRoot = path.join(root, 'tests', 'fixtures', 'runtime-image-inventory');
  const output = execFileSync(
    python,
    [
      path.join(root, 'scripts', 'assets', 'inventory-runtime-images.py'),
      '--public-root',
      fixtureRoot,
    ],
    { encoding: 'utf8' },
  );
  const report = JSON.parse(output);
  assert.equal(report.totalFiles, 3);
  assert.equal(report.byExtension['.png'].files, 2);
  assert.equal(report.byExtension['.webp'].files, 1);
  assert.equal(report.duplicates.length, 1);
  assert.deepEqual(report.duplicates[0].paths, ['a/copy.png', 'a/original.png']);
});

test('konvertereren beholder dimensjoner og nøyaktig alfakanal', () => {
  const temporaryRoot = mkdtempSync(path.join(os.tmpdir(), 'regnemester-images-'));
  const fixtureScript = [
    'from pathlib import Path',
    'from PIL import Image',
    'root = Path(r"' + temporaryRoot + '")',
    'root.mkdir(parents=True, exist_ok=True)',
    'opaque = Image.new("RGB", (128, 96))',
    'opaque.putdata([((x * 7) % 256, (y * 11) % 256, ((x + y) * 5) % 256) for y in range(96) for x in range(128)])',
    'opaque.save(root / "opaque.png")',
    'transparent = Image.new("RGBA", (96, 72), (20, 80, 160, 0))',
    'transparent.putalpha(Image.linear_gradient("L").resize((96, 72)))',
    'transparent.save(root / "transparent.png")',
    '(root / "nested").mkdir(parents=True, exist_ok=True)',
    'opaque.save(root / "nested" / "first.png")',
    'opaque.save(root / "nested" / "skip-panel.png")',
    'opaque.save(root / "mekamaskinen-panel-bg.png")',
    'Image.new("L", (32, 32), 255).save(root / "collision-mask.png")',
  ].join('; ');
  execFileSync(python, ['-c', fixtureScript]);

  const temporaryConfig = path.join(temporaryRoot, 'config.json');
  writeFileSync(
    temporaryConfig,
    JSON.stringify({
      profiles: {
        background: { format: 'webp', quality: 92, method: 6, minSavingsPercent: -10000 },
        transparent: { format: 'webp', quality: 95, method: 6, minSavingsPercent: -10000 },
      },
      protectedPathPatterns: ['**/*mask*.png', '**/*collision*.png'],
      groups: {
        pilot: [
          { path: 'opaque.png', profile: 'background' },
          { path: 'transparent.png', profile: 'transparent' },
        ],
        globPilot: [
          {
            glob: 'nested/**/*.png',
            excludeGlobs: ['**/*-panel.png'],
            profile: 'background',
          },
        ],
        safeName: [{ path: 'mekamaskinen-panel-bg.png', profile: 'background' }],
        forbidden: [{ path: 'collision-mask.png', profile: 'background' }],
      },
    }),
  );

  const converter = path.join(root, 'scripts', 'assets', 'optimize-runtime-images.py');
  execFileSync(
    python,
    [converter, '--config', temporaryConfig, '--public-root', temporaryRoot, '--apply', '--group', 'pilot'],
    { encoding: 'utf8' },
  );

  const verifyScript = [
    'from pathlib import Path',
    'from PIL import Image, ImageChops',
    'root = Path(r"' + temporaryRoot + '")',
    'original = Image.open(root / "transparent.png").convert("RGBA")',
    'converted = Image.open(root / "transparent.webp").convert("RGBA")',
    'assert converted.size == original.size',
    'assert ImageChops.difference(original.getchannel("A"), converted.getchannel("A")).getbbox() is None',
    'assert Image.open(root / "opaque.webp").size == (128, 96)',
  ].join('; ');
  execFileSync(python, ['-c', verifyScript]);

  const globReport = JSON.parse(
    execFileSync(
      python,
      [converter, '--config', temporaryConfig, '--public-root', temporaryRoot, '--dry-run', '--group', 'globPilot'],
      { encoding: 'utf8' },
    ),
  );
  assert.deepEqual(globReport.results.map((result) => result.path), ['nested/first.png']);

  assert.doesNotThrow(() =>
    execFileSync(
      python,
      [converter, '--config', temporaryConfig, '--public-root', temporaryRoot, '--dry-run', '--group', 'safeName'],
      { encoding: 'utf8' },
    ),
  );

  assert.throws(
    () =>
      execFileSync(
        python,
        [converter, '--config', temporaryConfig, '--public-root', temporaryRoot, '--apply', '--group', 'forbidden'],
        { encoding: 'utf8', stdio: 'pipe' },
      ),
    /protected|beskyttet/i,
  );
});
