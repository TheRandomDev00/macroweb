import { rm, readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { verifySceneCss } from "./verify-scene-css.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
// Generated outputs only. A stale webpack CSS cache previously omitted the pinning rules.
await Promise.all([
  rm(join(root, ".next"), { recursive: true, force: true }),
  rm(join(root, "out"), { recursive: true, force: true }),
]);
const next = fileURLToPath(import.meta.resolve("next/dist/bin/next"));
const child = spawn(process.execPath, [next, "build", "--webpack"], {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
});
const code = await new Promise((resolve) => {
  child.on("error", () => resolve(1));
  child.on("close", (code) => resolve(code ?? 1));
});
if (code !== 0) process.exit(code);
const files = await readdir(join(root, "out"), { recursive: true });
const css = await Promise.all(
  files
    .filter((file) => file.endsWith(".css"))
    .map((file) => readFile(join(root, "out", file), "utf8")),
);
verifySceneCss(css.join("\n"));
console.log(
  "Verified exported scrollport, sticky stage, and panel positioning CSS.",
);
