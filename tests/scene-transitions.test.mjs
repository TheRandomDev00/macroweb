import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSceneLayout, sampleScene } from "../src/lib/scene-layout.ts";
import {
  SCENE_IDLE_MS,
  sceneGap,
  sceneLanding,
  sceneSettleTarget,
  smoothSceneEase,
} from "../src/lib/scene-transitions.ts";
const layout = buildSceneLayout([1600, 2600, 1800], 844);

test("only unfinished crossings need idle settling; reading positions remain untouched", () => {
  assert.equal(SCENE_IDLE_MS, 160);
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
test("settling ease has still endpoints and stays monotonic", () => {
  assert.equal(smoothSceneEase(0), 0);
  assert.equal(smoothSceneEase(1), 1);
  assert.ok(smoothSceneEase(0.01) < 0.00002);
  assert.ok(1 - smoothSceneEase(0.99) < 0.00002);
  let previous = 0;
  for (let t = 0; t <= 1; t += 0.01) {
    const current = smoothSceneEase(t);
    assert.ok(current >= previous && current <= 1);
    previous = current;
  }
});
