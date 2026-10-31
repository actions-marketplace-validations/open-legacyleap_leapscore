/** apps/scanner/src/scan/__tests__/bundle-parity.test.ts — source vs artifact parity (artifact-packaging)
 *
 * "Sealed output is identical source vs artifact": the same fixture scanned from source
 * and from the built bundle at the same engine identity must agree on score, band, and
 * score_fingerprint. This exercises the bundler against the dynamic
 * `import('./scoring/scorer/applicability')` sites, the `node:fs/promises` dynamic
 * import, and the JSON-assertion imports through the bundle.
 *
 * The identity is pinned via `--engine-ref` (the explicit override) on both runs; the
 * version input is identical by construction — the bundle's build stamp is the package
 * version and the unstamped source default is stable — so any divergence is the
 * bundler, never the stamp.
 *
 * Bare-environment smoke (task 2.2): the bundle runs `--help` and a fixture scan with
 * `--out` under a network-disabled harness (no sockets for the child), outside the
 * project tree, and completes with the three report files.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, writeFileSync, rmSync, readFileSync, mkdirSync, chmodSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { main } from '../../../bin/scan';
// @ts-expect-error — plain-JS build primitive (scripts/), no declaration file; the
// test consumes it as the repo's own build entry point, checked by its own execution.
import { buildArtifact, REPO_ROOT } from '../../../scripts/build-lib.mjs';
import { ENGINE_VERSION, UNOFFICIAL_ENGINE_VERSION } from '../../identity';

/** Builds the parity bundle at an explicit identity: the same primitive the release
 *  build uses, with the stamp overridden — the parity premise is "same engine identity". */
function buildScannerBundle(
  outfile: string,
  opts: { logLevel?: string; versionOverride: string },
): { bytes: number } {
  return buildArtifact({
    entryPoints: [join(REPO_ROOT, 'apps/scanner/bin/scan.ts')],
    format: 'esm',
    platform: 'node',
    target: 'node20',
    bundle: true,
    minify: false,
    keepNames: true,
    legalComments: 'none',
    define: { __LEAPSCORE_ENGINE_VERSION__: JSON.stringify(opts.versionOverride) },
    shebang: '#!/usr/bin/env node',
    outfile,
  });
}

const BUNDLE_DIR = mkdtempSync(join(tmpdir(), 'leapscore-bundle-parity-'));
const BUNDLE = join(BUNDLE_DIR, 'leapscore-scan.mjs'); // the argv[1] dispatch name must survive relocation

beforeAll(async () => {
  // The parity premise is "the same engine identity": build the bundle at the version
  // the unstamped source run resolves to (`unofficial-build`), so the bundle's stamp and
  // the source constant are the same string and any divergence is the bundler.
  await buildScannerBundle(BUNDLE, { logLevel: 'silent', versionOverride: UNOFFICIAL_ENGINE_VERSION });
  chmodSync(BUNDLE, 0o755);
}, 120_000);

afterAll(() => {
  rmSync(BUNDLE_DIR, { recursive: true, force: true });
});

function makeFixture(label: string): string {
  const dir = mkdtempSync(join(tmpdir(), `leapscore-parity-${label}-`));
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'parity-fixture', version: '1.0.0', dependencies: { lodash: '4.17.20' }, devDependencies: { jest: '29.7.0' } }));
  writeFileSync(join(dir, 'package-lock.json'), JSON.stringify({ name: 'parity-fixture', lockfileVersion: 3, packages: {} }));
  writeFileSync(join(dir, 'README.md'), '# parity fixture\n\n## Setup\n\n```sh\nnpm install\nnpm test\n```\n');
  writeFileSync(join(dir, 'index.js'), 'module.exports = 1;\n');
  mkdirSync(join(dir, 'src'));
  writeFileSync(join(dir, 'src', 'main.js'), "const x = require('./util');\nmodule.exports = x;\n");
  writeFileSync(join(dir, 'src', 'util.js'), 'module.exports = 2;\n');
  return dir;
}

const PINNED_REF = 'parity1'; // same explicit engine-ref override for both paths

describe('source vs artifact sealed equality', () => {
  it('score, band, and score_fingerprint are identical through the bundle', async () => {
    const fixture = makeFixture('seal');
    const outSrc = mkdtempSync(join(tmpdir(), 'leapscore-parity-out-src-'));
    const outBundle = mkdtempSync(join(tmpdir(), 'leapscore-parity-out-bundle-'));
    try {
      // Source path
      const code = await main(['scan', fixture, '--out', outSrc, '--engine-ref', PINNED_REF], {
        env: {},
        stdout: () => {},
        stderr: () => {},
      });
      expect(code).toBe(0);

      // Artifact path — spawn the built bundle as a standalone process.
      const res = spawnSync(process.execPath, [BUNDLE, 'scan', fixture, '--out', outBundle, '--engine-ref', PINNED_REF], {
        encoding: 'utf8',
        timeout: 180_000,
      });
      expect(res.status, `bundle scan failed: ${res.stderr}`).toBe(0);

      const a = JSON.parse(readFileSync(join(outSrc, 'report.json'), 'utf8'));
      const b = JSON.parse(readFileSync(join(outBundle, 'report.json'), 'utf8'));
      expect(b.meta.score).toBe(a.meta.score);
      expect(b.meta.tier).toBe(a.meta.tier);
      expect(b.meta.score_fingerprint).toBe(a.meta.score_fingerprint);
      expect(b.meta.fingerprint_version).toBe(a.meta.fingerprint_version);
      // The identity premise: the source run resolves the constant unstamped
      // (`unofficial-build`), and a bundle built at the same version stamps exactly
      // that string — so both seal at the same engine_version, which is the parity
      // the spec scenario presumes. A version-bump mismatch here means the bundle was
      // built from a different package version than the source under test.
      expect(b.meta.engine_version).toBe(ENGINE_VERSION);
    } finally {
      for (const d of [fixture, outSrc, outBundle]) rmSync(d, { recursive: true, force: true });
    }
  }, 300_000);
});

describe('bare-environment smoke (no project tree, no network)', () => {
  it('--help exits 0 with the usage from a foreign cwd', () => {
    const res = spawnSync(process.execPath, [BUNDLE, '--help'], {
      cwd: tmpdir(),
      encoding: 'utf8',
      timeout: 60_000,
    });
    expect(res.status).toBe(0);
    expect(res.stdout).toContain('scan <path>');
    expect(res.stdout).toContain('--fail-under');
  });

  it('a fixture scan with --out seals the three report files with network disabled', () => {
    const fixture = makeFixture('smoke');
    const outDir = mkdtempSync(join(tmpdir(), 'leapscore-smoke-out-'));
    // Network-disabled harness: a node policy that throws on any Socket connect.
    const policy = join(tmpdir(), `leapscore-no-net-${process.pid}.policy.cjs`);
    writeFileSync(
      policy,
      `const net = require('node:net');
const http = require('node:http');
const https = require('node:https');
const deny = () => { throw new Error('network disabled by test policy'); };
net.Socket.prototype.connect = deny;
http.request = deny;
https.request = deny;
globalThis.fetch = deny;
`,
      'utf8',
    );
    try {
      const res = spawnSync(process.execPath, ['--require', policy, BUNDLE, 'scan', fixture, '--out', outDir], {
        cwd: tmpdir(), // outside the project tree
        encoding: 'utf8',
        timeout: 180_000,
        env: { ...process.env, LEAPSCORE_SHA: undefined },
      });
      expect(res.status, `scan failed: ${res.stdout}\n${res.stderr}`).toBe(0);
      for (const f of ['report.json', 'report.html', 'report.md']) {
        expect(existsSync(join(outDir, f)), `${f} missing`).toBe(true);
      }
      const env = JSON.parse(readFileSync(join(outDir, 'report.json'), 'utf8'));
      expect(env.meta.score_fingerprint).toMatch(/^[0-9a-f]{64}$/);
    } finally {
      rmSync(policy, { force: true });
      rmSync(fixture, { recursive: true, force: true });
      rmSync(outDir, { recursive: true, force: true });
    }
  }, 300_000);

  it('the bundle itself lives outside the project tree and needs no project files at runtime', () => {
    // A copy outside the repo proves no relative asset resolution back into the tree.
    const stray = join(tmpdir(), `leapscore-stray-${process.pid}`, 'leapscore-scan.mjs');
    try {
      mkdirSync(dirname(stray), { recursive: true });
      copyFileSync(BUNDLE, stray);
      const res = spawnSync(process.execPath, [stray, '--help'], { cwd: tmpdir(), encoding: 'utf8', timeout: 60_000 });
      expect(res.status).toBe(0);
      expect(res.stdout).toContain('leapscore-scan');
    } finally {
      rmSync(dirname(stray), { recursive: true, force: true });
    }
  });
});
