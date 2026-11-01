/** action/scripts/wrapper-build.mjs — the one definition of the Action wrapper build.
 *
 * `action/package.json` is `"type": "module"`, so a runner loads `dist/index.js` as ESM,
 * and the wrapper resolves its sibling scanner bundle from `import.meta.url`. Two shipped
 * defects came from getting this shape wrong, so every option that encodes it lives here
 * and is imported by both the build and `npm run check:dist` (they cannot drift apart):
 *
 *  - `format: 'esm'` — a CommonJS build of this entry is still loaded as ESM (the package
 *    type decides, not the bundler) and dies on `module is not defined in ES module scope`;
 *    a CJS build also stubs `import.meta` to `{}`, so `scannerCliDir()` throws on
 *    `fileURLToPath(undefined)` even if the loader problem is fixed.
 *  - the `createRequire` banner — bundled CommonJS dependencies (`@actions/*`) call
 *    `require('os')`; in ESM output esbuild's shim throws
 *    `Dynamic require of "os" is not supported` unless a real `require` exists in scope.
 *
 * Action runners execute `main` with node, so ESM costs nothing here.
 */
import { join } from 'node:path';
import { REPO_ROOT } from '../../apps/scanner/scripts/build-lib.mjs';

export const ACTION_ROOT = join(REPO_ROOT, 'action');

const CREATE_REQUIRE =
  "import { createRequire as __createRequire } from 'node:module'; const require = __createRequire(import.meta.url);";

/** esbuild options for the committed wrapper, written to `outfile`. */
export function wrapperBuildOptions(outfile) {
  return {
    entryPoints: [join(ACTION_ROOT, 'src/main.ts')],
    outfile,
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'esm',
    minify: false,
    keepNames: true,
    legalComments: 'none',
    banner: { js: CREATE_REQUIRE },
  };
}
