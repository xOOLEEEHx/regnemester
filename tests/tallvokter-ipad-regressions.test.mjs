import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { chromium } from 'playwright';

const counterweightPuzzle = await import(
  '../src/regnereisen-bossreisen/game/simulation/counterweightPuzzle.ts'
).catch(() => ({}));
const mazeRendering = await import(
  '../src/regnereisen-bossreisen/ui/mazeRendering.ts'
).catch(() => ({}));
const worldTextureOptimization = await import(
  '../src/regnereisen-bossreisen/game/simulation/worldTextureOptimization.ts'
);

const EASY_ADD_SUBTRACT_SETTINGS = {
  started: true,
  tokenId: 'elev-gutt',
  mapId: 'tallvokterens-rike',
  operationMode: 'add',
  difficulty: 'easy-add-subtract',
  playMode: 'normal'
};

test('Hvelvvokterens lette balanser holder målvekten innenfor 20', () => {
  assert.equal(typeof counterweightPuzzle.getCounterweightTargetRange, 'function');
  for (let lockIndex = 0; lockIndex < 4; lockIndex += 1) {
    const [, maximumTarget] = counterweightPuzzle.getCounterweightTargetRange(
      EASY_ADD_SUBTRACT_SETTINGS.difficulty,
      lockIndex
    );
    assert.ok(
      maximumTarget <= 20,
      `Lås ${lockIndex + 1} tillot målvekt ${maximumTarget}`
    );
  }
});

test('labyrintbevegelsen gjenbruker målt rutestørrelse mellom animasjonsbilder', () => {
  assert.equal(typeof mazeRendering.resolveMazeCellPixelSize, 'function');
  let measurements = 0;
  const measured = mazeRendering.resolveMazeCellPixelSize(0, () => {
    measurements += 1;
    return 500;
  }, 5);
  const reused = mazeRendering.resolveMazeCellPixelSize(measured, () => {
    measurements += 1;
    return 700;
  }, 5);

  assert.equal(measured, 100);
  assert.equal(reused, 100);
  assert.equal(measurements, 1);
});

test('labyrinten bruker et mindre 9 ganger 9 rutenett med fire segl', async () => {
  const mazeSource = await readFile(
    new URL('../src/regnereisen-bossreisen/game/simulation/mazeQuest.ts', import.meta.url),
    'utf8'
  );
  const mazeContentSource = await readFile(
    new URL('../src/regnereisen-bossreisen/game/content/mazeQuest.ts', import.meta.url),
    'utf8'
  );

  assert.match(mazeSource, /const size = 9;/);
  assert.match(mazeContentSource, /MAZE_GATE_COUNT = 4/);
});

test('Leirstedet utsetter ny hjuldel til teksturen finnes og reparerer manglende tekstur', () => {
  assert.equal(typeof worldTextureOptimization.getTextureSyncAction, 'function');
  assert.equal(
    worldTextureOptimization.getTextureSyncAction(undefined, 'camp-wheel-spoke', false),
    'defer'
  );
  assert.equal(
    worldTextureOptimization.getTextureSyncAction('__MISSING', 'camp-wheel-spoke', true),
    'replace'
  );
  assert.equal(
    worldTextureOptimization.getTextureSyncAction('camp-wheel-spoke', 'camp-wheel-spoke', true),
    'reuse'
  );
});

test('Labyrintens intro er sentrert i høyre ramme på iPad', async (context) => {
  const browser = await chromium.launch({ headless: true });
  context.after(() => browser.close());
  const browserContext = await browser.newContext({
    viewport: { width: 1024, height: 768 },
    hasTouch: true,
    deviceScaleFactor: 2
  });
  context.after(() => browserContext.close());
  const page = await browserContext.newPage();
  const css = await readFile(
    new URL('../src/regnereisen-bossreisen/styles.css', import.meta.url),
    'utf8'
  );

  await page.setContent(`
    <section class="maze-modal">
      <div class="maze-panel" data-phase="intro">
        <header class="maze-header">
          <div class="maze-heading-copy"><span>Labyrintekspedisjon</span><h1>Labyrintens fire segl</h1></div>
          <button>Avslutt</button>
        </header>
        <div class="maze-layout">
          <aside class="maze-guardian tallvokter-quest-info-art">
            <div class="maze-guardian-aura"><img alt="Labyrintens vokter"></div>
          </aside>
          <main class="maze-content">
            <div class="maze-story tallvokter-quest-info-copy">
              <div class="maze-story-copy">
                <span class="maze-story-kicker">Et oppdrag fra vokteren</span>
                <h2>Finn de fire seglene</h2>
                <p>Utforsk labyrinten og løs oppgavene ved hver port.</p>
              </div>
              <div class="maze-story-rules">
                <div><strong>4</strong><span>seglporter</span></div>
                <div><strong>5</strong><span>riktige per port</span></div>
                <div><strong>❤</strong><span>feil koster liv</span></div>
              </div>
              <button>Start labyrinten</button>
            </div>
          </main>
        </div>
      </div>
    </section>
  `);
  await page.addStyleTag({ content: css });

  const layout = await page.evaluate(() => {
    const content = document.querySelector('.maze-content');
    const story = document.querySelector('.maze-story');
    const contentRect = content.getBoundingClientRect();
    const storyRect = story.getBoundingClientRect();
    return {
      alignContent: getComputedStyle(content).alignContent,
      horizontalDelta: Math.abs(
        (storyRect.left + storyRect.width / 2) - (contentRect.left + contentRect.width / 2)
      ),
      verticalDelta: Math.abs(
        (storyRect.top + storyRect.height / 2) - (contentRect.top + contentRect.height / 2)
      )
    };
  });

  assert.equal(layout.alignContent, 'center');
  assert.ok(layout.horizontalDelta <= 2, `Vannrett avvik var ${layout.horizontalDelta}px`);
  assert.ok(layout.verticalDelta <= 12, `Loddrett avvik var ${layout.verticalDelta}px`);
});
