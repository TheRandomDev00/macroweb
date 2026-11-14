import { test } from "node:test";
import assert from "node:assert/strict";
import {
  activeScene,
  buildSceneLayout,
  sampleScene,
} from "../src/lib/scene-layout.ts";

test("adjacent scenes crossfade in the same stage, then fully replace one another", () => {
  const layout = buildSceneLayout([600, 600, 600], 900);
  const next = layout.scenes[1];
  const midpoint = next.start - layout.transition / 2;
  const outgoing = sampleScene(layout, 0, midpoint);
  const incoming = sampleScene(layout, 1, midpoint);
  assert.equal(outgoing.opacity, 0.5);
  assert.equal(incoming.opacity, 0.5);
  assert.equal(incoming.x, 9);
  assert.equal(Math.abs(outgoing.x), 0);
  assert.equal(sampleScene(layout, 0, next.start).opacity, 0);
  assert.equal(sampleScene(layout, 1, next.start).opacity, 1);
  assert.equal(sampleScene(layout, 1, next.start).x, 0);
  assert.equal(activeScene(layout, midpoint), 1);
  assert.equal(
    sampleScene(layout, 1, midpoint - layout.transition / 2).opacity,
    0,
  );
  assert.equal(sampleScene(layout, 0, 0).opacity, 1);
});

test("all of a tall scene is reachable before it fades out", () => {
  const layout = buildSceneLayout([600, 2600, 500], 900);
  const scene = layout.scenes[1];
  assert.equal(scene.travel, 1860);
  const bottom = sampleScene(layout, 1, scene.start + scene.travel);
  assert.equal(bottom.y, -1860);
  assert.equal(bottom.opacity, 1);
  assert.equal(sampleScene(layout, 1, scene.start + scene.hold).opacity, 1);
  assert.equal(sampleScene(layout, 2, layout.maxScroll).opacity, 1);
});

test("every scroll position keeps at least one scene visible", () => {
  const layout = buildSceneLayout([600, 2600, 500, 1200, 300], 844);
  for (let y = 0; y <= layout.maxScroll; y += 5) {
    const samples = layout.scenes.map((_, i) => sampleScene(layout, i, y));
    assert.ok(
      Math.max(...samples.map((s) => s.opacity)) >= 0.49,
      `Invisible content at ${y}`,
    );
    assert.ok(samples.every((s) => Number.isFinite(s.y)));
  }
});

test("invalid dimensions cannot initialize a pinned layout", () => {
  for (const height of [0, -1, NaN, Infinity])
    assert.throws(() => buildSceneLayout([600, height], 900), RangeError);
  assert.throws(() => buildSceneLayout([600], 0), RangeError);
});

test("light transitions retain visibility and reading travel without full-chapter depth effects", () => {
  const layout = buildSceneLayout([1600, 2600, 1800], 844);
  for (let position = 0; position <= layout.maxScroll; position += 20) {
    for (let index = 0; index < layout.scenes.length; index++) {
      const full = sampleScene(layout, index, position);
      const light = sampleScene(layout, index, position, "light");
      assert.equal(light.opacity, full.opacity);
      assert.equal(light.x, full.x);
      assert.equal(light.progress, full.progress);
      assert.equal(light.scale, 1);
      assert.equal(Math.abs(light.z), 0);
      assert.equal(light.rotateX, 0);
      assert.equal(light.blur, 0);
      assert.equal(light.sink, 0);
      assert.ok(Math.abs(light.y - (full.y - 80 * full.sink)) < 1e-8);
    }
  }
});
