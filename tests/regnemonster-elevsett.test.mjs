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

test('Elevsett er registrert med fire kort og egen kortbakside', () => {
  const student = manifest.sets.find((set) => set.id === 'student');

  assert.ok(student);
  assert.deepEqual(student.cards.map((card) => card.number), ['001', '002', '003', '004']);
  assert.equal(student.back.fullSrc, '/regnemester/regnemonster/cards/backs/student-full.webp');
  assert.equal(student.back.thumbnailSrc, '/regnemester/regnemonster/cards/backs/student-thumb.webp');
});

test('alle optimaliserte Elevsett-bilder finnes i full- og permstørrelse', async () => {
  const student = manifest.sets.find((set) => set.id === 'student');

  assert.ok(student);
  await Promise.all([
    access(new URL(`../public${student.back.fullSrc}`, import.meta.url)),
    access(new URL(`../public${student.back.thumbnailSrc}`, import.meta.url)),
    ...student.cards.flatMap((card) => [
      access(new URL(`../public${card.fullSrc}`, import.meta.url)),
      access(new URL(`../public${card.thumbnailSrc}`, import.meta.url))
    ])
  ]);
});

test('kortmodellen trekker 87 prosent Sett 1, 7 prosent Holosett, 5 prosent Spesialsett og 1 prosent Elevsett', () => {
  assert.match(cardsSource, /RegnemonsterSetId = 'set1' \| 'holo' \| 'special' \| 'student'/u);
  assert.equal(selectRegnemonsterSet(0), 'set1');
  assert.equal(selectRegnemonsterSet(0.869999), 'set1');
  assert.equal(selectRegnemonsterSet(0.87), 'holo');
  assert.equal(selectRegnemonsterSet(0.939999), 'holo');
  assert.equal(selectRegnemonsterSet(0.94), 'special');
  assert.equal(selectRegnemonsterSet(0.989999), 'special');
  assert.equal(selectRegnemonsterSet(0.99), 'student');
  assert.equal(selectRegnemonsterSet(0.999999), 'student');
  assert.equal(selectRegnemonsterSet(Number.NaN), 'set1');
  assert.equal(selectRegnemonsterSet(2), 'student');
});

test('samlepermen har Elevsett-fane og tydelige Elevsett-etiketter', () => {
  assert.match(template, /id="regnemonster-binder-tab-student"/u);
  assert.match(template, />Elevsett</u);
  assert.match(template, /regnemonster-binder-tab-short" aria-hidden="true">E</u);
  assert.match(hudSource, /setRegnemonsterBinderSet\('student'\)/u);
  assert.match(hudSource, /Elevsett · Kort E\$\{card\.number\}/u);
});
