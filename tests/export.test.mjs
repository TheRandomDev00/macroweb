import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createStaticServer } from "../scripts/serve.mjs";

let server, origin, html;
before(async () => {
  html = await readFile(resolve("out/index.html"), "utf8");
  server = createStaticServer(resolve("out"));
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
});
after(() => server && new Promise((resolve) => server.close(resolve)));

test("the static export serves the full page, including its server-rendered catalogue", async () => {
  const response = await fetch(origin);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /text\/html/);
  assert.equal(await response.text(), html);
  for (const text of [
    "INFORMAAL",
    "Anime Adventures",
    "Anime Vanguards",
    "Informaal Task",
    "Goodbye, grind.",
    "Independent interface study.",
  ])
    assert.ok(html.includes(text), `Missing content: ${text}`);
  assert.equal((html.match(/class="product-card /g) || []).length, 6);
  assert.doesNotMatch(
    html,
    /style="[^"]*opacity:0(?:;|")/,
    "Content must remain visible in server HTML without animation JavaScript",
  );
});

test("every local navigation target and ARIA control points to a unique element", () => {
  const ids = Array.from(html.matchAll(/\bid="([^"]+)"/g), (match) => match[1]);
  const idSet = new Set(ids);
  assert.equal(ids.length, idSet.size, "Duplicate element IDs");
  for (const match of html.matchAll(
    /href="#([^"]+)"|aria-controls="([^"]+)"|aria-labelledby="([^"]+)"/g,
  )) {
    for (const target of (match[1] || match[2] || match[3]).split(" "))
      assert.ok(idSet.has(target), `Missing target: ${target}`);
  }
});

test("all exported scripts, styles, imagery, and self-hosted fonts are available", async () => {
  const assets = new Set(
    Array.from(
      html.matchAll(/(?:src|href)="(\/[^"#?]+)(?:\?[^"#]*)?"/g),
      (match) => match[1],
    ),
  );
  assets.add("/fonts/geist-sans.woff");
  assets.add("/fonts/geist-mono.woff");
  const results = await Promise.all(
    Array.from(assets, async (path) => {
      const response = await fetch(origin + path);
      const size = (await response.arrayBuffer()).byteLength;
      return {
        path,
        status: response.status,
        size,
        type: response.headers.get("content-type"),
      };
    }),
  );
  for (const result of results) {
    assert.equal(result.status, 200, `Unavailable asset: ${result.path}`);
    assert.ok(result.size > 0, `Empty asset: ${result.path}`);
  }
  for (const result of results.filter((item) => item.path.endsWith(".css")))
    assert.match(result.type, /text\/css/);
  for (const result of results.filter((item) => item.path.endsWith(".js")))
    assert.match(result.type, /javascript/);
});

test("the preview server handles HEAD, missing assets, malformed URLs, and traversal safely", async () => {
  const head = await fetch(origin, { method: "HEAD" });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), "");
  assert.equal((await fetch(origin + "/missing-image.png")).status, 404);
  assert.equal((await fetch(origin + "/%E0%A4%A")).status, 400);
  assert.equal((await fetch(origin + "/%2e%2e%2fpackage.json")).status, 403);
  assert.equal((await fetch(origin, { method: "POST" })).status, 405);
});
