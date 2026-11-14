import { chromium } from "playwright-core";
import { createStaticServer } from "../scripts/serve.mjs";
import assert from "node:assert/strict";

if (!process.env.CHROMIUM_PATH) throw new Error("Set CHROMIUM_PATH to a local Chromium executable.");
const server = createStaticServer("out");
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
let browser;
try {
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, headless: true });
  for (const width of [390, 1024, 1920]) {
    const touch = width !== 1920;
    const context = await browser.newContext({
      viewport: { width, height: touch ? 844 : 1080 },
      isMobile: touch, hasTouch: touch, deviceScaleFactor: touch ? 3 : 1,
    });
    const page = await context.newPage();
    await page.route("https://api.github.com/**", route => route.fulfill({ json: [] }));
    await page.goto(`http://127.0.0.1:${server.address().port}`, { waitUntil: "networkidle" });
    await page.waitForSelector('.scene-stack[data-mode="pinned"]');
    assert.equal(await page.locator(".how-panel").evaluate(panel => getComputedStyle(panel).filter), "none", "The panel must stay filter-free before its entrance too");
    const showFeatures = async () => {
      await page.evaluate(() => document.querySelector('a[href="#how-it-works"]').click());
      await page.waitForFunction(() => document.querySelector(".how-panel").dataset.revealed === "true");
    };
    await showFeatures();
    await page.waitForTimeout(900);
    const styles = await page.locator(".how-panel").evaluate(panel => ({
      filter: getComputedStyle(panel).filter,
      texture: getComputedStyle(panel, "::before").content,
      textAnimation: getComputedStyle(panel.querySelector(".how-panel-entry-label")).animationName,
      glowAnimation: getComputedStyle(panel.querySelector(".how-panel-entry-label"), "::before").animationName,
      iconFilter: getComputedStyle(panel.querySelector(".how-panel-entry-icon")).filter,
      opacity: getComputedStyle(panel).opacity,
    }));
    assert.equal(styles.filter, "none", "The revealed panel must not retain a blur surface");
    assert.equal(styles.textAnimation, "none", "Label text must not repaint continuously");
    assert.equal(styles.opacity, "1");
    assert.equal(styles.texture, "none", "The panel must not rasterize SVG noise on any device");
    assert.equal(styles.glowAnimation, "none", "Desktop and mobile must use the same static glow");
    assert.equal(styles.iconFilter, "none");
    for (const name of ["Performance", "Remote", "Multi account", "Customizable", "Efficiency"]) {
      const button = page.getByRole("button", { name, exact: true });
      await button.click();
      assert.equal(await button.getAttribute("aria-pressed"), "true");
      assert.equal(await page.locator("#feature-preview h2").textContent(), name);
      await page.waitForFunction(() => {
        const img = document.querySelector("#feature-preview img");
        return img.complete && img.naturalWidth > 0;
      });
    }
    await page.evaluate(() => document.querySelector('a[href="#top"]').click());
    await page.waitForFunction(() => document.querySelector(".how-panel").dataset.revealed === "false");
    await showFeatures();
    console.log(`${width}px: mobile effects, feature selection, screenshots, and entrance replay passed.`);
    await context.close();
  }
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
