import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { chromium } from 'playwright';

const styles = await readFile(
  new URL('../src/regnereisen-bossreisen/styles.css', import.meta.url),
  'utf8'
);

const viewports = [
  { name: 'PC', width: 1440, height: 900, isMobile: false, hasTouch: false },
  { name: 'iPad', width: 1024, height: 768, isMobile: true, hasTouch: true },
  { name: 'mobil', width: 390, height: 844, isMobile: true, hasTouch: true }
];

for (const viewport of viewports) {
  test(`aktiv settknapp har mørk, tydelig tekst på ${viewport.name}`, async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      isMobile: viewport.isMobile,
      hasTouch: viewport.hasTouch
    });
    const page = await context.newPage();

    await page.setContent(`
      <style>${styles}</style>
      <header class="regnemonster-binder-heading">
        <div></div>
        <nav class="regnemonster-binder-tabs">
          <button class="is-selected">
            <span class="regnemonster-binder-tab-full">Sett 1</span>
            <span class="regnemonster-binder-tab-short">1</span>
          </button>
        </nav>
        <button>×</button>
      </header>
    `);

    const visibleLabel = page.locator('.regnemonster-binder-tabs span:visible');
    const color = await visibleLabel.evaluate((element) => getComputedStyle(element).color);

    assert.equal(color, 'rgb(64, 36, 18)');
    await browser.close();
  });
}
