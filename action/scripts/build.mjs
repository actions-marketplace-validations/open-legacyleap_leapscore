#!/usr/bin/env node
// Builds the Action's committed bundle:
//   action/dist/index.js            — the wrapper (checkout → scan → annotate), self-contained
//   action/dist/leapscore-scan.mjs  — the scanner bundle the wrapper launches
//
// The Action must run from a `uses:` checkout with no build step, so its dist is
// committed; the freshness gate (npm run check:dist) rebuilds here and byte-compares.
// Both artifacts go through the scanner's build primitive so their bytes depend on the
// sources alone — not on the checkout path, the cwd, or the destination filename.
import { join } from 'node:path';
import { REPO_ROOT, buildArtifact } from '../../apps/scanner/scripts/build-lib.mjs';

const ROOT = REPO_ROOT;
const ACTION = join(ROOT, 'action');

const wrapper = buildArtifact({
  entryPoints: [join(ACTION, 'src/main.ts')],
  outfile: join(ACTION, 'dist/index.js'),
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  minify: false,
  keepNames: true,
  legalComments: 'none',
});
const scanner = buildArtifact({
  entryPoints: [join(ROOT, 'apps/scanner/bin/scan.ts')],
  outfile: join(ACTION, 'dist/leapscore-scan.mjs'),
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  minify: false,
  keepNames: true,
  legalComments: 'none',
  // The Action stamps its own release identity and passes it to the scanner via
  // LEAPSCORE_CLI, so this copy is built with the non-release marker and any real run
  // reports the Action's version instead.
  define: { __LEAPSCORE_ENGINE_VERSION__: '"unofficial-build"' },
  shebang: '#!/usr/bin/env node',
});
console.log(
  `built action/dist/index.js (${(wrapper.bytes / 1024).toFixed(0)} KB) + action/dist/leapscore-scan.mjs (${(scanner.bytes / 1024 / 1024).toFixed(1)} MB)`,
);
