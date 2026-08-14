import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { chromium } from 'playwright';

const template = await readFile(
  new URL('../src/regnereisen-bossreisen/template.html', import.meta.url),
  'utf8'
);
const worldScene = await readFile(
  new URL('../src/regnereisen-bossreisen/phaser/scenes/WorldScene.ts', import.meta.url),
  'utf8'
);

test('skjulte Regnereisen-bilder venter med nettverkshenting til de aktiveres', async (context) => {
  const browser = await chromium.launch({ headless: true });
  context.after(() => browser.close());
  const page = await browser.newPage();
  const requests = [];
  page.on('request', (request) => requests.push(new URL(request.url()).pathname));

  await page.route('https://regnemester.test/**', (route) => route.abort());
  await page.setContent(`<base href="https://regnemester.test">${template}`);
  await page.waitForTimeout(100);

  assert.ok(!requests.includes('/regnemester/puzzle/puzzle-crystal-dragon.png'));
  assert.ok(!requests.includes('/regnemester/light-forest/light-root-network.png'));
  assert.ok(!requests.includes('/regnemester/crystal-bridge/bridge-hall-background.png'));
});

test('tunge bilder i skjulte oppdragsflater bruker data-src i malen', () => {
  const deferredPaths = [
    '/regnemester/tallvokter-finale/tallvokter-intro.png',
    '/regnemester/light-forest/light-root-network.png',
    '/regnemester/crystal-bridge/bridge-hall-background.png',
    '/regnemester/puzzle/puzzle-crystal-dragon.png',
    '/regnemester/rewards/regnereisen-medal.png',
    '/regnemester/rewards/udodelighets-medal.png'
  ];

  for (const path of deferredPaths) {
    assert.match(
      template,
      new RegExp(`data-src="${path.replaceAll('/', '\\/')}"`, 'u'),
      `${path} skal ikke lastes før flaten åpnes`
    );
    assert.doesNotMatch(
      template,
      new RegExp(`(?<!data-)src="${path.replaceAll('/', '\\/')}"`, 'u')
    );
  }
});

test('WorldScene laster kartressurser etter valgt kart i stedet for alt ved oppstart', () => {
  const preloadBody = worldScene.slice(
    worldScene.indexOf('  preload(): void {'),
    worldScene.indexOf('  create(): void {')
  );
  const queueBody = worldScene.slice(
    worldScene.indexOf('  private queueMapAssets(map: GameMapConfig): void {'),
    worldScene.indexOf('  private hasMapAssets(map: GameMapConfig): boolean {')
  );

  assert.doesNotMatch(preloadBody, /queueRegnemonsterPrototypeAssets\(this\)/u);
  assert.doesNotMatch(preloadBody, /PLAYER_TOKENS\.forEach/u);
  assert.doesNotMatch(preloadBody, /MEDALS\.forEach/u);
  assert.doesNotMatch(preloadBody, /REGNERIKET_STOPS\.forEach/u);
  assert.doesNotMatch(preloadBody, /LOCATIONS\.filter/u);

  assert.match(queueBody, /map\.id === REGNEMONSTER_MAP_ID[\s\S]*queueRegnemonsterPrototypeAssets\(this\)/u);
  assert.match(queueBody, /map\.id === REGNERIKET_MAP_ID/u);
  assert.match(queueBody, /map\.showBossJourney/u);
  assert.doesNotMatch(queueBody, /for \(const fish of FISH_TYPES\)/u);
  assert.doesNotMatch(queueBody, /LIGHT_FOREST_NETWORK_ASSET_PATH/u);
  assert.doesNotMatch(queueBody, /LIGHT_SPIRIT_ASSET_PATH/u);
  assert.doesNotMatch(queueBody, /LIGHT_FOREST_ROOT_KNOT_ASSET_PATH/u);
});

test('Boss-reisen laster bare synlige bossvarianter og henter slått-varianten ved kamp', () => {
  const queueStart = worldScene.indexOf('  private queueMapAssets(map: GameMapConfig): void {');
  const queueEnd = worldScene.indexOf('  private hasMapAssets(map: GameMapConfig): boolean {', queueStart);
  const queueBody = worldScene.slice(queueStart, queueEnd);
  const battleStart = worldScene.indexOf('  private tryStartNearbyBattle(fromHud = false): void {');
  const battleEnd = worldScene.indexOf('  private tryUseNearbyTallvokterActivity(): void {', battleStart);
  const battleBody = worldScene.slice(battleStart, battleEnd);

  assert.ok(queueStart >= 0 && queueEnd > queueStart, 'queueMapAssets skal finnes');
  assert.doesNotMatch(
    queueBody,
    /for \(const mood of \['idle', 'defeated'\]/u,
    'begge bossvariantene skal ikke lastes blindt'
  );
  assert.match(queueBody, /const moods: Array<'idle' \| 'defeated'> = \['idle'\]/u);
  assert.match(queueBody, /this\.progress\.isCompleted\(location\.id\)[\s\S]*moods\.push\('defeated'\)/u);
  assert.match(
    battleBody,
    /this\.ensureMapBossTexture\(this\.nearby, 'defeated'\)/u,
    'slått-varianten skal klargjøres når den aktuelle kampen åpnes'
  );
});

test('kartfigurer ferdigbehandles ikke på nytt når bare den ferdige teksturen finnes', () => {
  const methods = [
    'createNormalizedMapItemTextures',
    'createNormalizedQuestIconTextures',
    'createNormalizedMapBossTexture'
  ];

  for (const [index, method] of methods.entries()) {
    const start = worldScene.indexOf(`  private ${method}`);
    const end = index + 1 < methods.length
      ? worldScene.indexOf(`  private ${methods[index + 1]}`, start)
      : worldScene.indexOf('  private getOpaqueBounds', start);
    const body = worldScene.slice(start, end);
    const sourceGuard = body.indexOf('if (!this.textures.exists(sourceKey))');
    const sourceRead = body.indexOf('this.textures.get(sourceKey)');

    assert.ok(start >= 0 && end > start, `${method} skal finnes`);
    assert.ok(sourceGuard >= 0, `${method} skal hoppe over en kilde som allerede er fjernet`);
    assert.ok(sourceGuard < sourceRead, `${method} skal kontrollere kilden før den leses`);
  }
});

test('Regneriket beholder riktig figurstørrelse etter sen teksturlasting', () => {
  const start = worldScene.indexOf('  private finalizeLoadedMapAssets(map: GameMapConfig): void {');
  const end = worldScene.indexOf('  private createRegnemonsterPrototypeView(): void {', start);
  const body = worldScene.slice(start, end);

  assert.ok(start >= 0 && end > start, 'finalizeLoadedMapAssets skal finnes');
  assert.match(
    body,
    /view\.sprite[\s\S]*?\.setTexture\(getMapItemTextureKey\(view\.item\.id\)\)[\s\S]*?\.setDisplaySize\(MAP_ITEM_DISPLAY_SIZE, MAP_ITEM_DISPLAY_SIZE\)/u
  );
  assert.match(
    body,
    /lantern[\s\S]*?\.setTexture\('talltree-lantern'\)[\s\S]*?\.setDisplaySize\(54 \* position\.scale, 78 \* position\.scale\)/u
  );
});
