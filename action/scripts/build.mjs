#!/usr/bin/env node
// Builds the Action's committed bundle:
//   action/dist/index.js            — the wrapper (checkout → scan → annotate), self-contained
//   action/dist/leapscore-scan.mjs  — the scanner bundle the wrapper launches
//
// The Action must run from a `uses:` checkout with no build step, so its dist is
// committed; the freshness gate (npm run check:dist) rebuilds here and byte-compares.
// Both artifacts go through the scanner's build primitive so their bytes depend on the
// sources alone — not on the checkout path, the cwd, or the destination filename.
//
// The scanner copy is stamped with the package version, exactly like the npm tarball's
// copy, so the two release surfaces ship byte-identical bundles and a real Action run
// seals the release's `engine_version` (release-and-publish artifact-packaging).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO_ROOT, buildArtifact } from '../../apps/scanner/scripts/build-lib.mjs';
import { wrapperBuildOptions } from './wrapper-build.mjs';

const ROOT = REPO_ROOT;
const ACTION = join(ROOT, 'action');
const ENGINE_VERSION = JSON.parse(readFileSync(join(ROOT, 'apps/scanner/package.json'), 'utf-8')).version;

const wrapper = buildArtifact(wrapperBuildOptions(join(ACTION, 'dist/index.js')));
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
  // Same define as apps/scanner/scripts/build.mjs: the Action's scanner copy must be
  // byte-identical to the tarball's copy for the same release.
  define: { __LEAPSCORE_ENGINE_VERSION__: JSON.stringify(ENGINE_VERSION) },
  shebang: '#!/usr/bin/env node',
});
console.log(
  `built action/dist/index.js (${(wrapper.bytes / 1024).toFixed(0)} KB) + action/dist/leapscore-scan.mjs (${(scanner.bytes / 1024 / 1024).toFixed(1)} MB, engine ${ENGINE_VERSION})`,
);
