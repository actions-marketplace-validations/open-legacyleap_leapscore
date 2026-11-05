#!/usr/bin/env tsx
/**
 * tooling/scripts/release-version-guard.ts — one tag, one version (release-and-publish §4.2).
 *
 * The release identity is the tag: the package manifest version, the version stamped into
 * the bundle, and the version published to the registry must all be the same value. This
 * guard runs before anything is built or published and fails when the tag and the manifest
 * disagree, naming both values. It also refuses a prerelease tag on the release path:
 * a prerelease is published once by a maintainer under the `next` dist-tag (§5.1), never by
 * the stable release workflow.
 *
 * Usage:
 *   tsx tooling/scripts/release-version-guard.ts v1.0.0
 *   tsx tooling/scripts/release-version-guard.ts 1.0.0-rc.1 --allow-prerelease
 *
 * On success the normalized version (no leading `v`) is printed to stdout and nothing else,
 * so a workflow can capture it directly.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname ?? '.', '../..');
const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(-[0-9A-Za-z][0-9A-Za-z.-]*)?$/;

const args = process.argv.slice(2);
const allowPrerelease = args.includes('--allow-prerelease');
const ref = args.find((arg) => !arg.startsWith('--'));

function fail(message: string): never {
  console.error(`release-version-guard: ${message}`);
  process.exit(1);
}

if (!ref) {
  fail('missing the tag or version to check — usage: release-version-guard.ts <vX.Y.Z|X.Y.Z> [--allow-prerelease]');
}

const version = ref.startsWith('v') ? ref.slice(1) : ref;
const match = SEMVER.exec(version);
if (!match) {
  fail(`"${ref}" is not a semantic version — expected vX.Y.Z (or X.Y.Z for a dry run)`);
}
if (match[4] && !allowPrerelease) {
  fail(
    `"${ref}" is a prerelease — the release workflow publishes stable versions only; ` +
      `a prerelease is published once by a maintainer under the "next" dist-tag (release-and-publish §5.1)`,
  );
}

const manifestPath = join(ROOT, 'apps/scanner/package.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8')) as { version?: string };
if (manifest.version !== version) {
  fail(
    `tag/manifest mismatch — the tag names ${version} but apps/scanner/package.json declares ${JSON.stringify(manifest.version)}; ` +
      `bump the manifest (and rebuild the committed bundle) before tagging`,
  );
}

console.log(version);
