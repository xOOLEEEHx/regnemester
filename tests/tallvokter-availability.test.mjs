import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const availabilityModule = await import(
  '../src/regnereisen-bossreisen/game/content/mapAvailability.ts'
).catch(() => ({}));

test('låst Tallvokter-kart faller tilbake til Boss-reisen før spillet starter', () => {
  assert.equal(typeof availabilityModule.resolveAvailableMapId, 'function');
  assert.equal(
    availabilityModule.resolveAvailableMapId('tallvokterens-rike', false),
    'boss-reisen'
  );
});

test('åpen Tallvokter og andre kart beholder valgt kart', () => {
  assert.equal(typeof availabilityModule.resolveAvailableMapId, 'function');
  assert.equal(
    availabilityModule.resolveAvailableMapId('tallvokterens-rike', true),
    'tallvokterens-rike'
  );
  assert.equal(
    availabilityModule.resolveAvailableMapId('regneriket', false),
    'regneriket'
  );
});

test('admininnstillingen er koblet fra database til Regnereisen', async () => {
  const [app, component, hud, edge, migration] = await Promise.all([
    readFile(new URL('../src/App.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/regnereisen-bossreisen/RegnereisenBossreisen.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/regnereisen-bossreisen/ui/hud.ts', import.meta.url), 'utf8'),
    readFile(new URL('../supabase/functions/regnemester-api/index.ts', import.meta.url), 'utf8'),
    readFile(new URL('../supabase/migrations/20260815100336_lock_tallvokter_world.sql', import.meta.url), 'utf8'),
  ]);

  assert.match(app, /tallvokter_world_enabled/);
  assert.match(app, /regnemester_tallvokter_enabled_dev_v1/);
  assert.match(app, /tallvokterEnabled=\{tallvokterWorldEnabled\}/);
  assert.match(component, /resolveAvailableMapId/);
  assert.match(hud, /Kommer snart/);
  assert.match(edge, /admin_set_tallvokter_world/);
  assert.match(migration, /'tallvokter_world_enabled'\s*,\s*'false'::jsonb/);
});
