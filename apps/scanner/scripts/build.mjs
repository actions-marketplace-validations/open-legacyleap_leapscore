#!/usr/bin/env node
// Builds apps/scanner/dist/leapscore-scan.mjs — see build-lib.mjs for the shared
// determinism + Node-compatibility guarantees this artifact is contractually held to.
import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import { SCANNER_ROOT, buildArtifact } from './build-lib.mjs';

const outfile = join(SCANNER_ROOT, 'dist', 'leapscore-scan.mjs');
function packageVersion() {
  return JSON.parse(readFileSync(join(SCANNER_ROOT, 'package.json'), 'utf8')).version;
}
const { bytes } = buildArtifact({
  entryPoints: [join(SCANNER_ROOT, 'bin', 'scan.ts')],
  // ESM: the bundle must run under `node` with zero install steps and zero runtime deps.
  format: 'esm',
  platform: 'node',
  target: 'node20',
  bundle: true,
  // Readable on purpose: the bundle is distributed to be auditable, so a third party can
  // verify it contains no network destination other than the endpoints it calls. Minifying
  // would trade that guarantee for size we don't need.
  minify: false,
  keepNames: true,
  legalComments: 'none',
  // Release identity is stamped at bundle time; the artifact carries its own version.
  // The package version is the source of truth (tasks §1.2); an explicit env override
  // still wins so a release pipeline can stamp without editing package.json.
  define: { __LEAPSCORE_ENGINE_VERSION__: JSON.stringify(process.env.LEAPSCORE_ENGINE_VERSION ?? packageVersion()) },
  shebang: '#!/usr/bin/env node',
  outfile,
});
console.log(`built apps/scanner/dist/leapscore-scan.mjs (${(bytes / 1024 / 1024).toFixed(1)} MB, engine ${process.env.LEAPSCORE_ENGINE_VERSION ?? packageVersion()})`);
