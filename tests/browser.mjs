import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { createStaticServer } from "../scripts/serve.mjs";
import postcss from "postcss";

// Termux Chromium speaks desktop CDP; Playwright's cache-path lookup omits Android.
// This is isolated to the test process and does not change production code.
const android = process.platform === "android";
if (android) Object.defineProperty(process, "platform", { value: "linux" });
const { chromium } = await import("playwright-core");
if (!process.env.CHROMIUM_PATH)
  throw new Error(
    "Set CHROMIUM_PATH to a local Chromium executable before running test:browser.",
  );
const artifacts = resolve(process.env.BROWSER_ARTIFACTS || ".qa/browser");
await mkdir(artifacts, { recursive: true });
const server = createStaticServer(resolve("out"));
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
const errors = [];

function snapshot() {
  const root = document.querySelector(".scene-stack"),
    stage = document.querySelector(".scene-stage");
  const visible = [];
  for (const element of document.querySelectorAll(
    ".scene-panel h1,.scene-panel h2,.scene-panel h3,.scene-panel p,.scene-panel img,.scene-panel .button,.stat strong,.product-price",
  )) {
    const rect = element.getBoundingClientRect();
    let opacity = 1,
      hidden = false;
    for (let node = element; node; node = node.parentElement) {
      const style = getComputedStyle(node);
      opacity *= Number(style.opacity);
      if (style.visibility === "hidden" || style.display === "none")
        hidden = true;
    }
    if (
      !hidden &&
      opacity > 0.15 &&
      rect.width > 2 &&
      rect.height > 2 &&
      rect.top < root.clientHeight - 55 &&
      rect.bottom > 85 &&
      rect.left < innerWidth &&
      rect.right > 0
    ) {
      visible.push(
        (element.textContent || element.getAttribute("alt") || "image").trim(),
      );
    }
  }
  return {
    mode: root.dataset.mode,
    fallback: root.dataset.sceneFallback,
    y: root.scrollTop,
    max: root.scrollHeight - root.clientHeight,
    height: root.clientHeight,
    pageHeight: document.documentElement.scrollHeight,
    visible,
    stagePosition: getComputedStyle(stage).position,
    aligned:
      Math.abs(
        stage.getBoundingClientRect().top - root.getBoundingClientRect().top,
      ) <= 2,
    active: [...document.querySelectorAll(".scene-panel")].find(
      (node) => !node.hasAttribute("inert"),
    )?.dataset.sceneIndex,
  };
}
async function settle(page) {
  // Observe two real rendering frames, rather than assuming a fixed frame rate.
  await page.evaluate(
    () =>
      new Promise((done) =>
        requestAnimationFrame(() => requestAnimationFrame(done)),
      ),
  );
}
async function open(page) {
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(origin, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(900);
  await settle(page);
}
async function scrollTo(page, top) {
  await page
    .locator(".scene-stack")
    .evaluate((root, y) => root.scrollTo({ top: y, behavior: "instant" }), top);
  await settle(page);
}

try {
  browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-dev-shm-usage",
      ...(android
        ? ["--disable-gpu", "--no-zygote", "--disable-software-rasterizer"]
        : []),
    ],
  });
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
    { width: 844, height: 390 },
  ]) {
    const page = await browser.newPage({ viewport });
    await open(page);
    const initial = await page.evaluate(snapshot);
    assert.equal(initial.mode, "pinned", initial.fallback);
    assert.equal(initial.stagePosition, "sticky");
    assert.ok(
      initial.visible.some((text) => text.includes("INFORMAAL")),
      "Hero must render before scrolling",
    );
    assert.ok(
      initial.pageHeight <= viewport.height + 2,
      "No giant outer-page runway",
    );
    await page.screenshot({
      path: `${artifacts}/opening-${viewport.width}.png`,
    });
    await page.locator(".scene-stack").focus();
    await page.keyboard.press("PageDown");
    await page.waitForFunction(
      () => document.querySelector(".scene-stack").scrollTop > 20,
    );
    await settle(page);
    assert.ok(
      (await page.locator(".site-header").getAttribute("class")).includes(
        "is-compact",
      ),
    );
    await scrollTo(page, 0);
    const reached = new Set();
    for (
      let y = 0;
      y <= initial.max;
      y += Math.max(65, viewport.height * 0.26)
    ) {
      await scrollTo(page, y);
      const state = await page.evaluate(snapshot);
      assert.equal(
        state.mode,
        "pinned",
        `Pinning lost at ${y}: ${state.fallback}`,
      );
      assert.ok(state.aligned, `Stage drift at ${y}`);
      assert.ok(state.visible.length, `Blank viewport at ${y}`);
      reached.add(state.active);
    }
    await scrollTo(page, initial.max);
    reached.add((await page.evaluate(snapshot)).active);
    assert.equal(reached.size, 9, "Every section must be reachable");
    await scrollTo(page, 0);
    assert.ok(
      (await page.evaluate(snapshot)).visible.some((text) =>
        text.includes("INFORMAAL"),
      ),
      "Reverse scroll must restore the hero",
    );
    await page.locator('.hero-actions a[href="#store"]').click();
    await page.waitForFunction(
      () =>
        document.querySelector('[data-scene-index="2"] .scene-content').style
          .opacity === "1",
    );
    await page.locator('input[type="search"]').fill("Vanguards");
    assert.equal(await page.locator(".product-card").count(), 1);
    await page.getByRole("button", { name: "Monthly", exact: true }).click();
    assert.match(await page.locator(".product-price").innerText(), /2.99/);
    await page.locator(".product-view").click();
    await page.locator("dialog[open]").waitFor({ state: "visible" });
    assert.equal(await page.locator("dialog[open]").count(), 1);
    await page.getByRole("button", { name: "Close product details" }).click();
    await settle(page);
    const before = await page
      .locator(".scene-stack")
      .evaluate((root) => root.scrollTop);
    await page.waitForTimeout(200);
    assert.equal(
      await page.locator(".scene-stack").evaluate((root) => root.scrollTop),
      before,
      "Observers must not auto-scroll",
    );
    await scrollTo(page, 0);
    assert.ok(
      (await page.evaluate(snapshot)).visible.some((text) =>
        text.includes("INFORMAAL"),
      ),
    );
    console.log(
      `PASS ${viewport.width}×${viewport.height}: opening, all 9 scenes, no blank intervals, reverse, anchors, search, pricing, dialog`,
    );
    await page.close();
  }

  // Real ResizeObserver and visualViewport events; do not replace them with no-op mocks.
  const resized = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });
  await open(resized);
  await resized.setViewportSize({ width: 390, height: 844 });
  await resized.waitForTimeout(200);
  await settle(resized);
  assert.equal((await resized.evaluate(snapshot)).mode, "pinned");
  assert.ok((await resized.evaluate(snapshot)).visible.length);
  await resized.setViewportSize({ width: 844, height: 390 });
  await resized.waitForTimeout(200);
  await settle(resized);
  assert.equal((await resized.evaluate(snapshot)).mode, "pinned");
  assert.ok((await resized.evaluate(snapshot)).visible.length);
  await resized.close();
  console.log("PASS live resize/orientation with real resize observations");

  const fallback = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });
  await fallback.route("**/*.css", async (route) => {
    const response = await route.fetch();
    const css = postcss.parse(await response.text());
    css.walkRules((rule) => {
      if (/\.scene-(stack|stage|panel)/.test(rule.selector)) rule.remove();
    });
    await route.fulfill({ response, body: css.toString() });
  });
  await open(fallback);
  assert.equal(
    await fallback.locator(".scene-stack").getAttribute("data-mode"),
    "flow",
  );
  assert.equal(await fallback.locator(".scene-panel[inert]").count(), 0);
  assert.equal(await fallback.locator(".scene-navigation").count(), 0);
  await fallback.screenshot({ path: `${artifacts}/missing-css-fallback.png` });
  assert.ok(await fallback.locator("#hero-title").isVisible());
  assert.ok((await fallback.locator("#hero-title").boundingBox()).y < 900);
  await fallback.locator("#faq-question-0").click();
  assert.equal(
    await fallback.locator("#faq-question-0").getAttribute("aria-expanded"),
    "true",
  );
  await fallback.close();
  console.log(
    "PASS missing scene CSS fails open to a readable, interactive page",
  );

  for (const config of [
    { reducedMotion: "reduce" },
    { javaScriptEnabled: false },
  ]) {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      ...config,
    });
    await page.goto(origin, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    assert.equal(await page.locator(".scene-panel[inert]").count(), 0);
    assert.equal(await page.locator(".scene-navigation").count(), 0);
    assert.ok(await page.locator("#hero-title").isVisible());
    await page.close();
  }
  console.log("PASS reduced-motion and no-JavaScript readable fallbacks");

  const embedded = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });
  await embedded.setContent(
    `<iframe src="${origin}" style="width:100%;height:8000px;border:0"></iframe>`,
  );
  const frame = embedded
    .frames()
    .find((frame) => frame.url().startsWith(origin));
  assert.ok(frame, "Embedded document must load");
  await frame.waitForSelector('.scene-stack[data-mode="pinned"]');
  const metrics = await frame.locator(".scene-stack").evaluate((root) => ({
    height: root.clientHeight,
    scroll: root.scrollTop,
  }));
  assert.ok(
    metrics.height <= 1100,
    "Inflated iframe must not inflate the scene viewport",
  );
  assert.equal(metrics.scroll, 0);
  await embedded.close();
  console.log("PASS oversized embedded viewport is bounded");
  assert.deepEqual(errors, []);
  console.log("Browser regression checks passed.");
} finally {
  await browser?.close();
  await new Promise((done) => server.close(done));
}
