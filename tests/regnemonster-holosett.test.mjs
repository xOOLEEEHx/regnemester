import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';
import { selectRegnemonsterSet } from '../src/regnereisen-bossreisen/game/content/regnemonsterSetDraw.ts';

const cardsSource = await readFile(
  new URL('../src/regnereisen-bossreisen/game/content/regnemonsterCards.ts', import.meta.url),
  'utf8'
);
const template = await readFile(
  new URL('../src/regnereisen-bossreisen/template.html', import.meta.url),
  'utf8'
);
const hudSource = await readFile(
  new URL('../src/regnereisen-bossreisen/ui/hud.ts', import.meta.url),
  'utf8'
);
const manifest = JSON.parse((await readFile(
  new URL('../src/regnereisen-bossreisen/game/content/regnemonsterCardManifest.generated.json', import.meta.url),
  'utf8'
)).replace(/^\uFEFF/u, ''));

test('Holosett er registrert med 50 kort og egen kortbakside', () => {
  const holo = manifest.sets.find((set) => set.id === 'holo');

  assert.ok(holo);
  assert.equal(holo.cards.length, 50);
  assert.deepEqual(holo.cards.map((card) => card.number),
    Array.from({ length: 50 }, (_, index) => String(index + 1).padStart(3, '0')));
  assert.equal(holo.back.fullSrc, '/regnemester/regnemonster/cards/backs/holo-full.webp');
  assert.equal(holo.back.thumbnailSrc, '/regnemester/regnemonster/cards/backs/holo-thumb.webp');
});

test('alle optimaliserte Holosett-bilder finnes i full- og permstørrelse', async () => {
  const holo = manifest.sets.find((set) => set.id === 'holo');

  await Promise.all([
    access(new URL(`../public${holo.back.fullSrc}`, import.meta.url)),
    access(new URL(`../public${holo.back.thumbnailSrc}`, import.meta.url)),
    ...holo.cards.flatMap((card) => [
      access(new URL(`../public${card.fullSrc}`, import.meta.url)),
      access(new URL(`../public${card.thumbnailSrc}`, import.meta.url))
    ])
  ]);
});

test('kortmodellen trekker 85 prosent Sett 1, 10 prosent Holosett og 5 prosent Spesialsett', () => {
  assert.match(cardsSource, /RegnemonsterSetId = 'set1' \| 'holo' \| 'special'/u);
  assert.equal(selectRegnemonsterSet(0), 'set1');
  assert.equal(selectRegnemonsterSet(0.849999), 'set1');
  assert.equal(selectRegnemonsterSet(0.85), 'holo');
  assert.equal(selectRegnemonsterSet(0.949999), 'holo');
  assert.equal(selectRegnemonsterSet(0.95), 'special');
  assert.equal(selectRegnemonsterSet(0.999999), 'special');
  assert.equal(selectRegnemonsterSet(Number.NaN), 'set1');
  assert.equal(selectRegnemonsterSet(2), 'special');
});

test('samlepermen har Holosett-fane og Holosett-etiketter', () => {
  assert.match(template, /id="regnemonster-binder-tab-holo"/u);
  assert.match(template, />Holosett</u);
  assert.match(template, /regnemonster-binder-tab-short" aria-hidden="true">H</u);
  assert.match(hudSource, /setRegnemonsterBinderSet\('holo'\)/u);
  assert.match(hudSource, /Holosett · Kort H\$\{card\.number\}/u);
});
