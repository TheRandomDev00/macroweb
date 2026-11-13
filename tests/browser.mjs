import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { createStaticServer } from "../scripts/serve.mjs";
import postcss from "postcss";
import { buildSceneLayout } from "../src/lib/scene-layout.ts";

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
    transition: root.dataset.transition,
    visiblePanels: [...document.querySelectorAll(".scene-panel")].filter(
      (panel) =>
        getComputedStyle(panel).visibility !== "hidden" &&
        Number(panel.querySelector(".scene-content").style.opacity) > 0.01,
    ).length,
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
async function idle(page) {
  await page.waitForFunction(
    () =>
      document.querySelector(".scene-stack").dataset.mode === "flow" ||
      document.querySelector(".scene-stack").dataset.transition === "idle",
  );
  await settle(page);
}
async function scrollTo(page, top) {
  await idle(page);
  await page
    .locator(".scene-stack")
    .evaluate((root, y) => root.scrollTo({ top: y, behavior: "instant" }), top);
  await settle(page);
  await idle(page);
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
    await idle(page);
    assert.ok(
      (await page.locator(".site-header").getAttribute("class")).includes(
        "is-compact",
      ),
    );
    await scrollTo(page, 0);
    const reached = new Set();
    const metrics = await page.locator(".scene-stack").evaluate((root) => ({
      height: root.clientHeight,
      heights: [...root.querySelectorAll(".scene-content")].map(
        (node) => node.offsetHeight,
      ),
    }));
    const reading = buildSceneLayout(metrics.heights, metrics.height);
    for (const scene of reading.scenes) {
      for (
        let y = scene.start;
        y <= scene.start + scene.hold;
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
        assert.equal(
          state.visiblePanels,
          1,
          "A settled scroll position must show only one scene",
        );
        reached.add(state.active);
      }
    }
    await scrollTo(page, initial.max);
    reached.add((await page.evaluate(snapshot)).active);
    assert.equal(reached.size, 3, "All three chapters must be reachable");
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
        document.querySelector('[data-scene-index="1"] .scene-content').style
          .opacity === "1",
    );
    await idle(page);
    await page.locator('input[type="search"]').fill("Vanguards");
    assert.equal(await page.locator(".product-card").count(), 1);
    await page.getByRole("button", { name: "Monthly", exact: true }).click();
    assert.match(await page.locator(".product-price").innerText(), /2.99/);
    await idle(page);
    // Bring this control into the reading viewport without skipping to Free Tools.
    const buttonTop = await page.locator(".product-view").evaluate((button) => {
      const root = document.querySelector(".scene-stack"),
        rect = button.getBoundingClientRect();
      return (
        root.scrollTop + Math.max(0, rect.bottom - (root.clientHeight - 85))
      );
    });
    await scrollTo(page, buttonTop);
    try {
      await page.locator(".product-view").click({ timeout: 4000 });
    } catch (error) {
      console.log(
        "PRODUCT DEBUG",
        viewport,
        buttonTop,
        await page.evaluate(snapshot),
        await page.locator(".product-view").boundingBox(),
      );
      await page.screenshot({
        path: `${artifacts}/failed-product-${viewport.width}.png`,
      });
      throw error;
    }
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
    for (const id of ["how-it-works", "free-tools", "faq"]) {
      await page.evaluate(
        (id) => document.querySelector(`a[href="#${id}"]`).click(),
        id,
      );
      await idle(page);
      const destination = await page.locator(`#${id}`).boundingBox();
      assert.ok(
        destination.y < viewport.height - 65 &&
          destination.y + destination.height > 88,
        `Grouped chapter anchor #${id} must reveal its own topic`,
      );
    }
    await scrollTo(page, 0);
    assert.ok(
      (await page.evaluate(snapshot)).visible.some((text) =>
        text.includes("INFORMAAL"),
      ),
    );
    console.log(
      `PASS ${viewport.width}×${viewport.height}: opening, all 3 chapters, no blank intervals, reverse, anchors, search, pricing, dialog`,
    );
    await page.close();
  }

  const snapping = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });
  await open(snapping);
  const crossingMetrics = await snapping
    .locator(".scene-stack")
    .evaluate((root) => ({
      height: root.clientHeight,
      heights: [...root.querySelectorAll(".scene-content")].map(
        (node) => node.offsetHeight,
      ),
    }));
  const crossing = buildSceneLayout(
    crossingMetrics.heights,
    crossingMetrics.height,
  );
  const midpoint = crossing.scenes[1].start - crossing.transition / 2;
  // Synthetic events exercise the passive input observer while a native scroll places us in a gap.
  await snapping.evaluate((y) => {
    const port = document.querySelector(".scene-stack");
    window.blockedWheel = false;
    window.wheelStream = setInterval(() => {
      const event = new WheelEvent("wheel", {
        deltaY: 20,
        bubbles: true,
        cancelable: true,
      });
      port.dispatchEvent(event);
      window.blockedWheel ||= event.defaultPrevented;
    }, 25);
    port.scrollTop = y;
  }, midpoint);
  await snapping.waitForTimeout(400);
  const active = await snapping.evaluate(snapshot);
  assert.equal(
    active.transition,
    "scrolling",
    "Input must postpone forced settling",
  );
  assert.equal(active.visiblePanels, 2);
  assert.ok(Math.abs(active.y - midpoint) <= 1, "No input-time snapping");
  const depth = await snapping
    .locator('[data-scene-index="0"] .scene-content')
    .evaluate((node) => ({
      transform: node.style.transform,
      filter: node.style.filter,
      overflow: document.querySelector(".scene-stack").style.overflowY,
      blocked: window.blockedWheel,
    }));
  assert.ok(Number(depth.transform.match(/, (-?[0-9.]+)px\)/)[1]) < -160);
  assert.ok(Number(depth.transform.match(/scale\(([0-9.]+)\)/)[1]) < 0.96);
  assert.ok(Number(depth.filter.match(/blur\(([0-9.]+)px\)/)[1]) > 0.9);
  assert.equal(depth.overflow, "");
  assert.equal(depth.blocked, false);
  await snapping.screenshot({ path: `${artifacts}/sinking.png` });
  await snapping.evaluate(() => clearInterval(window.wheelStream));
  await idle(snapping);
  assert.equal((await snapping.evaluate(snapshot)).visiblePanels, 1);
  // A new wheel interrupts an idle snap immediately, without jumping to its endpoint.
  await snapping
    .locator(".scene-stack")
    .evaluate((root, y) => (root.scrollTop = y), midpoint);
  await snapping.waitForFunction(
    () =>
      document.querySelector(".scene-stack").dataset.transition === "running",
  );
  const interrupted = await snapping.evaluate(() => {
    const root = document.querySelector(".scene-stack"),
      before = root.scrollTop;
    const event = new WheelEvent("wheel", {
      deltaY: 10,
      bubbles: true,
      cancelable: true,
    });
    root.dispatchEvent(event);
    return {
      before,
      after: root.scrollTop,
      state: root.dataset.transition,
      blocked: event.defaultPrevented,
    };
  });
  assert.equal(interrupted.state, "scrolling");
  assert.equal(interrupted.after, interrupted.before);
  assert.equal(interrupted.blocked, false);
  await idle(snapping);
  // Real large native wheel input can cross multiple chapters in one event.
  await scrollTo(snapping, 0);
  await snapping.mouse.move(700, 450);
  await snapping.mouse.wheel(0, crossing.scenes[2].start + 100);
  await snapping.waitForFunction(
    (y) => document.querySelector(".scene-stack").scrollTop >= y,
    crossing.scenes[2].start,
  );
  assert.equal((await snapping.evaluate(snapshot)).active, "2");
  await idle(snapping);
  await snapping.close();
  console.log(
    "PASS unrestricted native scrolling, passive input, idle-only settling, interruption, and sinking depth",
  );

  const touchPage = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  await open(touchPage);
  const touchSession = await touchPage.context().newCDPSession(touchPage);
  await touchSession.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: 195, y: 650 }],
  });
  await touchSession.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: 195, y: 180 }],
  });
  await touchSession.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await settle(touchPage);
  await idle(touchPage);
  assert.ok(
    (await touchPage.evaluate(snapshot)).y > 20,
    "Touch must scroll within a long chapter",
  );
  // Native fling distance depends on device timing; it may cross a chapter.
  assert.equal((await touchPage.evaluate(snapshot)).mode, "pinned");
  assert.equal((await touchPage.evaluate(snapshot)).visiblePanels, 1);
  await touchPage.close();
  console.log("PASS native touch scrolling within a longer chapter");

  // A tall real window must not leave the former 180px background-only strip.
  const tall = await browser.newPage({
    viewport: { width: 1440, height: 1280 },
    screen: { width: 1440, height: 900 },
  });
  await open(tall);
  assert.equal((await tall.evaluate(snapshot)).height, 1280);
  assert.equal(
    await tall
      .locator(".scene-stage")
      .evaluate((node) => node.getBoundingClientRect().bottom),
    1280,
  );
  await tall.screenshot({ path: `${artifacts}/tall-viewport.png` });
  await tall.setViewportSize({ width: 1440, height: 1440 });
  await tall.waitForTimeout(200);
  assert.equal((await tall.evaluate(snapshot)).height, 1440);
  await tall.close();
  console.log(
    "PASS tall viewport fills the window, including when screen metrics are smaller",
  );

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
