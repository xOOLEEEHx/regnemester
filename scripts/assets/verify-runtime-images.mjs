import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.argv[2] ?? "http://127.0.0.1:5176/";
const outputDir = path.resolve(
  process.cwd(),
  "artifacts",
  "image-optimization",
  "browser-verification",
);

const maps = [
  { id: "bossreisen", label: "bossreisen" },
  { id: "regneriket", label: "regneriket" },
  { id: "tallvokterens-rike", label: "tallvokterens-rike" },
  { id: "regnemonster", label: "regnemonster" },
];

async function dismissAnnouncement(page) {
  const closeButton = page.locator(".announcement-backdrop").getByRole("button", { name: "Lukk" });
  if (await closeButton.isVisible().catch(() => false)) await closeButton.click();
}

async function openMap(page, map) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    window.localStorage.setItem("regnemester_tallvokter_enabled_dev_v1", "true");
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator(".home-mode-journey").waitFor({ state: "visible" });
  await dismissAnnouncement(page);
  await page.locator(".home-mode-journey").click();
  await page.locator("#start-screen").waitFor({ state: "visible" });

  const mapChoice = page.locator(`[data-map-id="${map.id}"]`);
  await mapChoice.waitFor({ state: "visible" });
  await mapChoice.click();
  const settings = page.locator("#map-settings-modal");
  if (await settings.isVisible().catch(() => false)) {
    await page.locator("#confirm-map-settings").click();
    await settings.waitFor({ state: "hidden" });
  }

  await page.locator("#start-game:not([disabled])").click();
  await page.locator("#start-screen").waitFor({ state: "hidden" });
  await page.locator("#game canvas").waitFor({ state: "visible" });
  await page.locator("#open-start").waitFor({ state: "visible" });
  await page.waitForTimeout(map.id === "regnemonster" ? 2_000 : 1_000);
  await page.screenshot({
    path: path.join(outputDir, `${map.label}.png`),
    fullPage: true,
  });
}

await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const errors = [];
const failedResponses = [];
const results = [];

try {
  for (const map of maps) {
    const context = await browser.newContext({
      deviceScaleFactor: 2,
      hasTouch: true,
      viewport: { width: 1024, height: 768 },
    });
    const page = await context.newPage();
    page.on("console", (message) => {
      if (message.type() === "error") errors.push({ map: map.id, message: message.text() });
    });
    page.on("pageerror", (error) => errors.push({ map: map.id, message: error.message }));
    page.on("response", (response) => {
      if (response.status() >= 400) {
        failedResponses.push({ map: map.id, status: response.status(), url: response.url() });
      }
    });

    try {
      await openMap(page, map);
      results.push({ map: map.id, status: "passed" });
    } catch (error) {
      results.push({ map: map.id, status: "failed", message: error.message });
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}

const report = { baseUrl, results, errors, failedResponses };
await writeFile(path.join(outputDir, "report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);

if (results.some((result) => result.status !== "passed") || errors.length || failedResponses.length) {
  process.exitCode = 1;
}
