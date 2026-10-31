/** apps/scanner/src/identity.ts — release-derived engine identity (artifact-packaging, design D3)
 *
 * The sealed `engine_version` is the release version stamped into the artifact at build
 * time — never a source-tree literal, never derived from the consumer's checkout. The
 * bundle build (`scripts/build-lib.mjs`, and the Action's dist composition) injects the
 * package version via esbuild `define`, which replaces the identifier below with the
 * literal stamp. A build without the stamp (source-run dev, any unbundled path) falls
 * through to the `unofficial-build` disclosure rather than reusing a released version.
 *
 * `engine_sha7` keeps its existing meaning (the `--engine-ref`/meta override, else
 * `unknown` — resolved in seal.ts); this module owns only the version.
 */

/** The identity an unstamped build seals with — disclosed, never a released version. */
export const UNOFFICIAL_ENGINE_VERSION = 'unofficial-build';

/** The build stamp: replaced by esbuild `define` with the package version string.
 *  The declaration gives the identifier a runtime value when the build was bypassed;
 *  in a built artifact the reference below is a literal before this ever executes. */
declare const __LEAPSCORE_ENGINE_VERSION__: string | undefined;

/** Build-time release identity: the stamped package version, else the unofficial marker.
 *  Exported separately so verification (the source-vs-artifact parity test) can align a
 *  source run with a stamped artifact without any production code reading an override. */
export const ENGINE_VERSION: string =
  typeof __LEAPSCORE_ENGINE_VERSION__ === 'string' && __LEAPSCORE_ENGINE_VERSION__ !== ''
    ? __LEAPSCORE_ENGINE_VERSION__
    : UNOFFICIAL_ENGINE_VERSION;
