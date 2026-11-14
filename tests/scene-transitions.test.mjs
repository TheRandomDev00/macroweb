import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSceneLayout, sampleScene } from "../src/lib/scene-layout.ts";
import {
  SCENE_IDLE_MS,
  capSceneScroll,
  SCENE_MAX_SCROLL_PX_PER_MS,
  stepSceneMomentum,
  sceneGap,
  sceneLanding,
  sceneSettleTarget,
  smoothSceneEase,
} from "../src/lib/scene-transitions.ts";
const layout = buildSceneLayout([1600, 2600, 1800], 844);

test("violent scrolling cannot skip transition gaps in either direction", () => {
  const start = layout.scenes[0].hold;
  const end = layout.scenes[1].start;
  const speed = SCENE_MAX_SCROLL_PX_PER_MS;
  assert.equal(capSceneScroll(layout, 0, layout.maxScroll, 10000), start + 32 * speed);
  assert.equal(capSceneScroll(layout, layout.maxScroll, 0, 16),
    layout.scenes[2].start - 16 * speed);
  assert.equal(capSceneScroll(layout, start + 20, layout.maxScroll, 10), start + 20 + 10 * speed);
  assert.equal(capSceneScroll(layout, end - 20, 0, 10), end - 20 - 10 * speed);
  assert.equal(capSceneScroll(layout, start + 20, start + 22, 10), start + 22);
  assert.equal(capSceneScroll(layout, 0, 100, 16), 100);
  assert.equal(capSceneScroll(layout, end + 100, end + 20, 16), end + 20);
});

test("a single input update cannot consume an entire crossing, even after a pause", () => {
  for (const viewport of [390, 844, 1280]) {
    const current = buildSceneLayout([1600, 2600], viewport);
    const start = current.scenes[0].hold;
    const end = current.scenes[1].start;
    assert.ok(capSceneScroll(current, 0, current.maxScroll, 10000) < end);
    assert.ok(capSceneScroll(current, current.maxScroll, 0, 10000) > start);
  }
});

test("only unfinished crossings need idle settling; reading positions remain untouched", () => {
  assert.equal(SCENE_IDLE_MS, 20);
  for (let i = 0; i < layout.scenes.length; i++) {
    const scene = layout.scenes[i];
    assert.ok(Number.isInteger(scene.start));
    assert.ok(Number.isInteger(scene.hold));
    for (const y of [
      scene.start,
      scene.start + scene.travel / 2,
      scene.start + scene.hold,
    ]) {
      assert.equal(sceneGap(layout, y), null);
      assert.equal(sceneSettleTarget(layout, y), null);
    }
    if (i < layout.scenes.length - 1) {
      const end = sceneLanding(layout, i, "end"),
        next = layout.scenes[i + 1].start;
      assert.deepEqual(sceneGap(layout, end + 1), { from: i, to: i + 1 });
      assert.equal(
        sceneSettleTarget(layout, end + layout.transition * 0.3),
        end,
      );
      assert.equal(
        sceneSettleTarget(layout, end + layout.transition * 0.7),
        next,
      );
      assert.equal(
        sceneSettleTarget(layout, end + layout.transition / 2),
        next,
      );
      assert.equal(sampleScene(layout, i + 1, next).opacity, 1);
      assert.equal(sampleScene(layout, i, end).opacity, 1);
    }
  }
});
test("outgoing chapters sink into depth while reading content and incoming chapters stay sharp", () => {
  const scene = layout.scenes[0],
    end = scene.start + scene.hold;
  const stable = sampleScene(layout, 0, end),
    midway = sampleScene(layout, 0, end + layout.transition / 2);
  assert.equal(Math.abs(stable.z), 0);
  assert.equal(stable.scale, 1);
  assert.equal(stable.blur, 0);
  assert.equal(midway.z, -170);
  assert.equal(midway.scale, 0.95);
  assert.equal(midway.y, stable.y + 40);
  assert.equal(midway.rotateX, 4);
  assert.equal(midway.blur, 1);
  const incoming = sampleScene(layout, 1, end + layout.transition / 2);
  assert.equal(incoming.scale, 1);
  assert.equal(Math.abs(incoming.z), 0);
  assert.equal(incoming.blur, 0);
  assert.equal(incoming.opacity + midway.opacity, 1);
});
test("settling ease decelerates toward its endpoint and stays monotonic", () => {
  assert.equal(smoothSceneEase(0), 0);
  assert.equal(smoothSceneEase(1), 1);
  assert.ok(smoothSceneEase(0.5) > 0.8);
  assert.ok(
    smoothSceneEase(0.25) > smoothSceneEase(0.75) - smoothSceneEase(0.5),
  );
  assert.ok(1 - smoothSceneEase(0.99) < 0.00002);
  let previous = 0;
  for (let t = 0; t <= 1; t += 0.01) {
    const current = smoothSceneEase(t);
    assert.ok(current >= previous && current <= 1);
    previous = current;
  }
});

test("friction decays velocity consistently across frame rates", () => {
  const full = stepSceneMomentum(0.8, 32);
  const first = stepSceneMomentum(0.8, 16);
  const second = stepSceneMomentum(first.velocity, 16);
  assert.ok(full.velocity > 0 && full.velocity < 0.8);
  assert.ok(Math.abs(full.velocity - second.velocity) < 1e-10);
  assert.ok(Math.abs(full.distance - first.distance - second.distance) < 1e-10);
});

test("completion force starts gently and respects the speed cap", () => {
  const first = stepSceneMomentum(0, 16, 300);
  assert.ok(first.velocity > 0 && first.velocity < 0.24);
  assert.ok(first.distance < 1);
  for (const velocity of [-100, -0.8, 0, 0.8, 100]) {
    const next = stepSceneMomentum(velocity, 10000, 300);
    assert.ok(Math.abs(next.velocity) <= 0.8);
    assert.ok(Math.abs(next.distance) <= 0.8 * 32);
  }
  assert.ok(stepSceneMomentum(0, 16, -300).distance < 0);
});
