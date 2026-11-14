import { chromium } from "playwright-core";
import { createStaticServer } from "../scripts/serve.mjs";
import { buildSceneLayout } from "../src/lib/scene-layout.ts";
import assert from "node:assert/strict";

if (!process.env.CHROMIUM_PATH) throw new Error("Set CHROMIUM_PATH to a local Chromium executable.");
const server = createStaticServer("out");
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
let browser;
try {
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, headless: true });
  for (const width of [390, 1024, 1920]) {
    const touch = width !== 1920;
    const context = await browser.newContext({ viewport: { width, height: 844 }, isMobile: touch, hasTouch: touch, deviceScaleFactor: touch ? 3 : 1 });
    const page = await context.newPage();
    await page.route("https://api.github.com/**", route => route.fulfill({ json: [] }));
    await page.goto(`http://127.0.0.1:${server.address().port}`, { waitUntil: "networkidle" });
    await page.waitForSelector('.scene-stack[data-mode="pinned"]');
    assert.equal(await page.locator(".scene-stack").getAttribute("data-effects"), touch ? "light" : "full");
    const startSampling = () => page.evaluate(() => {
      window.samples = [];
      window.sampling = setInterval(() => {
        const visible = [...document.querySelectorAll('.scene-panel[data-visible="true"] .scene-content')];
        window.samples.push(visible.map(el => ({ opacity: Number(getComputedStyle(el).opacity), filter: getComputedStyle(el).filter, transform: el.style.transform })));
      }, 20);
    });
    const checkSamples = async (requireOverlap = false) => {
      const samples = await page.evaluate(() => { clearInterval(window.sampling); return window.samples; });
      if (requireOverlap) assert.ok(samples.some(items => items.length === 2), `Adjacent chapters must overlap during the crossing: ${JSON.stringify(await page.locator('.scene-stack').evaluate(el=>({position:el.scrollTop,mode:el.dataset.mode,state:el.dataset.transition,visible:[...el.querySelectorAll('.scene-panel')].map(p=>p.dataset.visible)})))}`);
      assert.ok(samples.every(items => items.some(item => item.opacity >= 0.49)), "A chapter must remain readable throughout");
      if (touch) {
        assert.ok(samples.flat().every(item => item.filter === "none" && !/rotateX|scale\(/.test(item.transform)));
        const blur = await page.locator(".version-card").first().evaluate(el => getComputedStyle(el).backdropFilter);
        assert.equal(blur, "none");
      } else if (requireOverlap) assert.ok(samples.flat().some(item => item.filter.includes("blur")), "Desktop depth effects must remain available");
    };
    for (const hash of ["#store", "#community", "#top"]) {
      await startSampling();
      await page.evaluate(hash => document.querySelector(`a[href="${hash}"]`).click(), hash);
      await page.waitForTimeout(1000);
      await checkSamples();
      assert.equal(await page.locator(".scene-stack").getAttribute("data-mode"), "pinned");
    }
    {
      const metrics = await page.locator(".scene-stack").evaluate(root => ({ height: root.clientHeight, heights: [...root.querySelectorAll(".scene-content")].map(el => el.offsetHeight) }));
      const layout = buildSceneLayout(metrics.heights, metrics.height);
      await page.locator(".scene-stack").evaluate((root, position) => { root.scrollTop = position; }, layout.scenes[0].hold);
      await page.waitForTimeout(200);
      console.log('Gesture start', width, layout.scenes[0].hold, await page.locator('.scene-stack').evaluate(el=>({position:el.scrollTop,bounds:el.getBoundingClientRect().toJSON()})));
      await startSampling();
      if (touch) {
        const cdp = await context.newCDPSession(page);
        await cdp.send("Input.synthesizeScrollGesture", { x: width / 2, y: 420, yDistance: -180, speed: 600, gestureSourceType: "touch" });
      } else {
        await page.mouse.move(width / 2, 420);
        await page.mouse.wheel(0, 180);
      }
      await page.waitForTimeout(1400);
      await checkSamples(true);
    }
    console.log(`${width}px: forward/reverse crossings, visibility, effects profile${touch ? ", and native touch" : ""} passed.`);
    await context.close();
  }
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
