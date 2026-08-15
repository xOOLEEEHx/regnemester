import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:5176";
const outputDir = path.resolve("artifacts/image-optimization/boss-verification");

async function dismissAnnouncement(page) {
  const closeButton = page.locator('[aria-label="Lukk kunngjøring"], .announcement-popup button').last();
  if (await closeButton.isVisible().catch(() => false)) await closeButton.click();
}

async function assertLoadedImage(locator, label) {
  await locator.waitFor({ state: "visible" });
  const result = await locator.evaluate((image) => ({
    src: image.currentSrc || image.src,
    naturalWidth: image.naturalWidth,
    naturalHeight: image.naturalHeight,
    complete: image.complete,
  }));
  if (!result.complete || result.naturalWidth < 1 || result.naturalHeight < 1) {
    throw new Error(`${label} ble ikke lastet: ${JSON.stringify(result)}`);
  }
  if (!new URL(result.src).pathname.endsWith(".webp")) {
    throw new Error(`${label} bruker ikke WebP: ${result.src}`);
  }
  return result;
}

async function verifyStandaloneBoss(page) {
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await dismissAnnouncement(page);
  await page.locator(".home-mode-boss").click();
  await page.locator(".input-card .mode-button, .input-card button").first().click();
  await page.locator(".boss-difficulty-segment").first().click();
  await page.locator(".boss-ladder-card:not([disabled])").first().click();
  await page.getByRole("button", { name: "Start bosskamp" }).click();
  await page.locator(".boss-play-layout").waitFor({ state: "visible" });
  const image = await assertLoadedImage(page.locator(".boss-figure-wrap img").first(), "Boss Battle-figur");
  const panel = await page.locator(".boss-arena").evaluate((element) => getComputedStyle(element).backgroundImage);
  if (!panel.includes(".webp")) throw new Error(`Boss Battle-bakgrunnen bruker ikke WebP: ${panel}`);
  await page.screenshot({ path: path.join(outputDir, "boss-battle.png"), fullPage: true });
  return { image, panel };
}

async function verifyJourneyBoss(page) {
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await dismissAnnouncement(page);
  await page.locator(".home-mode-journey").click();
  await page.locator('[data-map-id="bossreisen"]').click();
  const settings = page.locator("#map-settings-modal");
  if (await settings.isVisible().catch(() => false)) {
    await page.locator("#confirm-map-settings").click();
    await settings.waitFor({ state: "hidden" });
  }
  await page.locator("#start-game:not([disabled])").click();
  await page.locator("#start-screen").waitFor({ state: "hidden" });
  const action = page.locator("#nearby-card button");
  await action.waitFor({ state: "visible" });
  await action.dispatchEvent("click");
  await page.locator("#battle-modal").waitFor({ state: "visible" });
  const image = await assertLoadedImage(page.locator("#boss-art"), "Boss-reisen-figur");
  const panel = await page.locator("#boss-art-bg").evaluate((element) => getComputedStyle(element).backgroundImage);
  if (!panel.includes(".webp")) throw new Error(`Boss-reisen-bakgrunnen bruker ikke WebP: ${panel}`);
  await page.screenshot({ path: path.join(outputDir, "boss-reisen.png"), fullPage: true });
  return { image, panel };
}

await fs.mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const errors = [];
const context = await browser.newContext({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 1 });
const page = await context.newPage();
page.on("console", (message) => {
  if (message.type() === "error") errors.push(`console: ${message.text()}`);
});
page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
page.on("requestfailed", (request) => errors.push(`requestfailed: ${request.url()} (${request.failure()?.errorText})`));

try {
  const standalone = await verifyStandaloneBoss(page);
  const journey = await verifyJourneyBoss(page);
  if (errors.length) throw new Error(errors.join("\n"));
  console.log(JSON.stringify({ standalone, journey, screenshots: outputDir }, null, 2));
} finally {
  await context.close();
  await browser.close();
}
