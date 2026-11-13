import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveSceneViewport } from "../src/lib/scene-viewport.ts";
import { buildSceneLayout, sampleScene } from "../src/lib/scene-layout.ts";
import { verifySceneCss } from "../scripts/verify-scene-css.mjs";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

test("inflated embedded viewport values cannot produce a giant runway", () => {
  assert.equal(resolveSceneViewport([8000, 8000, 900]), 900);
  assert.equal(resolveSceneViewport([8000, 8000]), 1100);
  assert.equal(resolveSceneViewport([0, NaN, Infinity, -100]), null);
  const viewport = resolveSceneViewport([8000]);
  const layout = buildSceneLayout(
    [740, 220, 1400, 1100, 500, 700, 700, 500, 400],
    viewport,
  );
  assert.ok(layout.maxScroll < 9000);
  assert.ok(sampleScene(layout, 0, 0).y <= 64);
  assert.equal(sampleScene(layout, 0, 0).opacity, 1);
});

test("the CSS safety gate rejects the stale stylesheet responsible for the blank opening", () => {
  assert.throws(
    () =>
      verifySceneCss(
        ".hero-stage{position:relative}.scene-stage{position:static}",
      ),
    /Scene CSS is missing/,
  );
});

test("the production export contains the actual pinning CSS", async () => {
  const files = await readdir("out", { recursive: true });
  const css = await Promise.all(
    files
      .filter((file) => file.endsWith(".css"))
      .map((file) => readFile(join("out", file), "utf8")),
  );
  verifySceneCss(css.join("\n"));
});
