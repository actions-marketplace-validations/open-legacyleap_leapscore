#!/usr/bin/env tsx
/**
 * tooling/checks/package-publish.ts — the published package ships the repository license
 * (release-and-publish §2.3, design D7).
 *
 * npm only includes license files that live in the package directory, so the Apache-2.0
 * text is committed twice: once at the repository root and once beside the package that
 * publishes it. A second copy can drift silently, so this gate requires byte equality —
 * a reworded or truncated package license fails here instead of shipping.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname ?? '.', '../..');
const ROOT_LICENSE = join(ROOT, 'LICENSE');
const PACKAGE_DIR = join(ROOT, 'apps/scanner');
const PACKAGE_LICENSE = join(PACKAGE_DIR, 'LICENSE');
const PACKAGE_MANIFEST = join(PACKAGE_DIR, 'package.json');

const violations: string[] = [];

if (!existsSync(ROOT_LICENSE)) {
  violations.push('LICENSE: missing at the repository root — the package copy has no canonical source');
}
if (!existsSync(PACKAGE_LICENSE)) {
  violations.push('apps/scanner/LICENSE: missing — npm only ships a license file that lives in the package directory, so the published tarball would carry no license text');
}
if (existsSync(ROOT_LICENSE) && existsSync(PACKAGE_LICENSE)) {
  const rootBytes = readFileSync(ROOT_LICENSE);
  const packageBytes = readFileSync(PACKAGE_LICENSE);
  if (!rootBytes.equals(packageBytes)) {
    violations.push(
      `apps/scanner/LICENSE: diverges from the root LICENSE (${packageBytes.length} bytes vs ${rootBytes.length}) — ` +
        `re-copy the root text (cp LICENSE apps/scanner/LICENSE) instead of editing one copy`,
    );
  }
}

if (!existsSync(PACKAGE_MANIFEST)) {
  violations.push('apps/scanner/package.json: missing');
} else {
  const manifest = JSON.parse(readFileSync(PACKAGE_MANIFEST, 'utf-8')) as {
    license?: string;
    files?: string[];
    publishConfig?: { access?: string; provenance?: boolean };
    repository?: { url?: string };
    homepage?: string;
    bugs?: { url?: string };
  };
  if (manifest.license !== 'Apache-2.0') {
    violations.push(`apps/scanner/package.json: license is ${JSON.stringify(manifest.license)}, expected "Apache-2.0"`);
  }
  if (!Array.isArray(manifest.files) || !manifest.files.includes('LICENSE')) {
    violations.push('apps/scanner/package.json: "files" does not list LICENSE — the release tarball must ship the license text');
  }
  if (manifest.publishConfig?.access !== 'public' || manifest.publishConfig?.provenance !== true) {
    violations.push('apps/scanner/package.json: publishConfig must declare access "public" and provenance true');
  }
  if (manifest.repository?.url !== 'git+https://github.com/open-legacyleap/leapscore.git') {
    violations.push(`apps/scanner/package.json: repository.url must name the public home (got ${JSON.stringify(manifest.repository?.url)})`);
  }
  if (manifest.homepage !== 'https://github.com/open-legacyleap/leapscore#readme') {
    violations.push(`apps/scanner/package.json: homepage must name the public home (got ${JSON.stringify(manifest.homepage)})`);
  }
  if (manifest.bugs?.url !== 'https://github.com/open-legacyleap/leapscore/issues') {
    violations.push(`apps/scanner/package.json: bugs.url must name the public home (got ${JSON.stringify(manifest.bugs?.url)})`);
  }
}

if (violations.length) {
  console.error('package-publish violations:\n' + violations.map((v) => `  - ${v}`).join('\n'));
  process.exit(1);
}
console.log('package-publish: ok (apps/scanner/LICENSE is byte-identical to the root Apache-2.0 text; publish metadata names the public home)');
