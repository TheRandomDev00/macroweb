import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSceneLayout } from "../src/lib/scene-layout.ts";
import {
  SCENE_TRANSITION_MS,
  sceneGap,
  sceneLanding,
  smoothSceneEase,
  sampleSceneSwap,
} from "../src/lib/scene-transitions.ts";
const layout = buildSceneLayout([600, 2600, 500, 700], 844);

test("transition boundaries are exact pixels and only the crossing interval needs settling", () => {
  assert.equal(SCENE_TRANSITION_MS, 700);
  for (let i = 0; i < layout.scenes.length; i++) {
    const scene = layout.scenes[i];
    assert.ok(Number.isInteger(scene.start));
    assert.ok(Number.isInteger(scene.hold));
    assert.equal(sceneGap(layout, scene.start), null);
    assert.equal(sceneGap(layout, scene.start + scene.hold), null);
    if (i < layout.scenes.length - 1)
      assert.deepEqual(sceneGap(layout, scene.start + scene.hold + 1), {
        from: i,
        to: i + 1,
      });
  }
});
test("timed swaps have smooth endpoints and leave exactly one fully visible scene", () => {
  for (const [from, to, landing] of [
    [0, 1, "start"],
    [2, 1, "end"],
    [0, 3, "start"],
  ]) {
    for (const phase of [0, 0.1, 0.5, 0.9, 1]) {
      const swap = { from, to, fromOffset: 0, landing, progress: phase };
      const samples = layout.scenes.map((_, index) =>
        sampleSceneSwap(layout, index, swap),
      );
      assert.ok(
        Math.abs(samples.reduce((sum, s) => sum + s.opacity, 0) - 1) < 1e-9,
      );
      assert.ok(
        samples.every((s, i) => i === from || i === to || s.opacity === 0),
      );
      if (phase === 1) {
        assert.equal(samples[to].opacity, 1);
        assert.equal(samples[from].opacity, 0);
        assert.equal(samples[to].x, 0);
      }
    }
  }
  assert.equal(smoothSceneEase(0), 0);
  assert.equal(smoothSceneEase(1), 1);
  assert.ok(smoothSceneEase(0.01) < 0.00002);
  assert.ok(1 - smoothSceneEase(0.99) < 0.00002);
});
test("backward transitions land at the readable bottom of the previous long section", () => {
  const swap = { from: 2, to: 1, fromOffset: 0, landing: "end", progress: 1 };
  assert.equal(
    sceneLanding(layout, 1, "end"),
    layout.scenes[1].start + layout.scenes[1].hold,
  );
  assert.equal(sampleSceneSwap(layout, 1, swap).y, -layout.scenes[1].travel);
});
test("returning to the top of the same scene never creates a crossfade", () => {
  const swap = {
    from: 1,
    to: 1,
    fromOffset: 1000,
    landing: "start",
    progress: 0.5,
  };
  const sample = sampleSceneSwap(layout, 1, swap);
  assert.equal(sample.opacity, 1);
  assert.equal(sample.x, 0);
  assert.ok(sample.y < 0 && sample.y > -1000);
});
