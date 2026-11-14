import { spawnSync } from 'node:child_process';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '/macroweb';
if (!/^\/[a-zA-Z0-9_-]+$/.test(basePath) && basePath !== '') throw new Error('Invalid Pages base path');
const build = spawnSync(process.execPath, [fileURLToPath(import.meta.resolve('next/dist/bin/next')), 'build', '--webpack'], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, NEXT_PUBLIC_BASE_PATH: basePath, NEXT_DIST_DIR: '.next-pages', NEXT_TELEMETRY_DISABLED: '1' },
});
if (build.status !== 0) process.exit(build.status ?? 1);
const output = resolve(root, 'out');
// Plain img tags and CSS font URLs require the project prefix too.
for (const file of await readdir(output, { recursive: true })) {
  if (!['.html', '.css', '.js', '.json', '.txt', '.svg'].includes(extname(file))) continue;
  const path = join(output, file);
  const original = await readFile(path, 'utf8');
  const updated = original.replace(/(?<=["'`(\s])\/(images|fonts)\//g, `${basePath}/$1/`);
  if (updated !== original) await writeFile(path, updated);
}
await writeFile(join(output, '.nojekyll'), '');
console.log(`GitHub Pages export ready in out/ for ${basePath || '/'}`);
