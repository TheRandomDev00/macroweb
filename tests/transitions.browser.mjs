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
    await page.waitForSelector(touch ? '.scene-stack[data-mode="flow"]' : '.scene-stack[data-mode="pinned"]');
    const cdp = touch ? await context.newCDPSession(page) : null;
    const swipe = async (from, to) => {
      await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: width / 2, y: from }] });
      const steps = 20;
      for (let step = 1; step <= steps; step++) {
        await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: width / 2, y: from + (to - from) * step / steps }] });
        await page.waitForTimeout(20);
      }
      await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    };
    if (touch) {
      assert.equal(await page.locator('.particle-network').count(), 0, 'Mobile must not mount the particle canvas');
      assert.equal(await page.locator('.scroll-progress').count(), 0, 'Mobile must not run the progress spring');
      assert.equal(await page.locator('.scene-navigation').count(), 0, 'Mobile must use normal document flow');
      const effects = await page.evaluate(() => [...document.querySelectorAll('*')].flatMap(el => {
        const style = getComputedStyle(el);
        return style.animationName !== 'none' || style.transitionDuration !== '0s' ||
          style.filter !== 'none' || style.backdropFilter !== 'none' ||
          style.boxShadow !== 'none' || style.textShadow !== 'none' || style.willChange !== 'auto'
          ? [el.className?.baseVal ?? el.className] : [];
      }));
      assert.deepEqual(effects, [], 'Mobile must not retain costly CSS effects');
      await page.evaluate(() => document.querySelector('a[href="#store"]').click());
      await page.waitForTimeout(200);
      const store = await page.locator('#store').boundingBox();
      assert.ok(store.y < 150 && store.y + store.height > 0, 'Native pricing anchor must work');
      let previous = await page.evaluate(() => window.scrollY);
      assert.ok(previous > 100, 'Pricing must be below the opening');
      for (let attempt = 0; attempt < 30 && previous > 1; attempt++) {
        await swipe(250, 700);
        await page.waitForTimeout(400);
        const position = await page.evaluate(() => window.scrollY);
        assert.ok(position < previous, `Mobile reverse scroll must reach the hero: ${previous} -> ${position}`);
        previous = position;
      }
      assert.ok(previous <= 1, 'Mobile reverse scrolling must reach the top');
      await swipe(650, 250);
      await page.waitForTimeout(400);
      assert.ok(await page.evaluate(() => window.scrollY > 20), 'Forward scrolling must still work');
      await page.locator('#how-it-works').scrollIntoViewIfNeeded();
      await page.getByRole('button', { name: 'Performance', exact: true }).click();
      assert.equal(await page.getByRole('button', { name: 'Performance', exact: true }).getAttribute('aria-pressed'), 'true');
      assert.equal(await page.locator('.how-panel').evaluate(el => el.inert), false, 'Static features must remain interactive');
      assert.equal(await page.locator('.how-panel').evaluate(el => getComputedStyle(el).opacity), '1');
      assert.equal(await page.locator('#store .entrance').evaluate(el => getComputedStyle(el).opacity), '1', 'Pricing must not remain hidden behind an entrance effect');
      console.log(`${width}px: static mobile effects, native anchors, forward/reverse touch, and feature controls passed.`);
      await context.close();
      continue;
    }
    assert.equal(await page.locator(".scene-stack").getAttribute("data-effects"), "full");
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
      if (requireOverlap) assert.ok(samples.flat().some(item => item.filter.includes("blur")), "Desktop depth effects must remain available");
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
      await page.mouse.move(width / 2, 420);
      await page.mouse.wheel(0, 180);
      await page.waitForTimeout(1400);
      await checkSamples(true);
    }
    console.log(`${width}px: desktop crossings, visibility, and depth effects passed.`);
    await context.close();
  }
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
