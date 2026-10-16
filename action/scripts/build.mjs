/** action/scripts/build.mjs — bundle action/src/main.ts to dist/index.js with the vendored esbuild */
import { buildSync } from '../node_modules/esbuild/lib/main.js';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
buildSync({
  entryPoints: [join(root, 'src', 'main.ts')],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  outfile: join(root, 'dist', 'index.js'),
  external: [],
  logLevel: 'info',
});
