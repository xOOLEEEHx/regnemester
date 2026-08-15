import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";
import { createServer } from "vite";

test("lokal utviklingsserver kan åpne test-admin uten e-postomdirigering", async () => {
  const server = await createServer({
    logLevel: "silent",
    server: { host: "127.0.0.1", port: 4199, strictPort: true },
  });
  await server.listen();
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto("http://127.0.0.1:4199/", { waitUntil: "networkidle" });

    await page.getByRole("button", { name: "Admin", exact: true }).click();
    const localAdminButton = page.getByRole("button", { name: "Åpne lokal test-admin", exact: true });
    assert.equal(await localAdminButton.isVisible(), true);

    await localAdminButton.click();
    assert.equal(await page.getByRole("heading", { name: "Admin", exact: true }).isVisible(), true);
    assert.equal(await page.getByText("Velg hva du vil administrere.", { exact: true }).isVisible(), true);
  } finally {
    await browser.close();
    await server.close();
  }
});
