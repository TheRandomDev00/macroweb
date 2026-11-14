import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { cp, readFile } from 'node:fs/promises';
import { verifySceneCss } from './verify-scene-css.mjs';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const result = spawnSync(process.execPath, [fileURLToPath(import.meta.resolve('next/dist/bin/next')), 'build', '--webpack'], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, NEXT_PUBLIC_BASE_PATH: '', NEXT_DIST_DIR: '.next-cloudflare', NEXT_TELEMETRY_DISABLED: '1' },
});
if (result.status !== 0) process.exit(result.status ?? 1);
// With output: export, this Next.js version exports into the configured distDir.
await cp(join(root, '.next-cloudflare'), join(root, 'out'), { recursive: true, force: true });
const files = await readdir(join(root, 'out'), { recursive: true });
const css = await Promise.all(files.filter(file => file.endsWith('.css')).map(file => readFile(join(root, 'out', file), 'utf8')));
verifySceneCss(css.join('\n'));
console.log('Cloudflare Pages build ready in out/ with root-relative assets.');
