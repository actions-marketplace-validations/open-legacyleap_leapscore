#!/usr/bin/env tsx
/**
 * tooling/scripts/release-gates.ts — the release gate family, single-sourced
 * (release-and-publish §4.3, design D6).
 *
 * The release must refuse to publish when any documented `check:*` command, bundle parity,
 * or workspace test suite fails. Rather than hand-listing gates in the workflow (which
 * drifts as checks are added), this script reads the `check:*` scripts from the root
 * manifest and runs every one, then the bundle-parity suite, then every workspace suite.
 *
 * It is runnable locally with the same command the workflow uses:
 *   npm run release:gates
 *
 * Exit is non-zero on the first failure and names the failing gate.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname ?? '.', '../..');

type Step = { name: string; command: string; args: string[] };

function run(step: Step): void {
  const label = [step.command, ...step.args].join(' ');
  console.log(`\n── release-gates: ${step.name} (${label})`);
  const result = spawnSync(step.command, step.args, { cwd: ROOT, stdio: 'inherit', env: process.env });
  if (result.error) {
    console.error(`\nrelease-gates: FAIL at ${step.name} — could not start ${label}: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`\nrelease-gates: FAIL at ${step.name} — ${label} exited ${result.status}`);
    process.exit(result.status ?? 1);
  }
}

const manifest = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8')) as { scripts?: Record<string, string> };
const checks = Object.keys(manifest.scripts ?? {})
  .filter((name) => name.startsWith('check:'))
  .sort();

if (!checks.length) {
  console.error('release-gates: FAIL — no check:* scripts found in the root manifest');
  process.exit(1);
}

// 1. Every documented check:* command. The family is derived, so a new check joins the
//    release automatically and cannot be forgotten here.
for (const name of checks) run({ name, command: 'npm', args: ['run', name] });

// 2. Bundle parity: the release artifact must be a working, readable bundle built from
//    these sources, and source-vs-artifact seals must agree.
run({ name: 'build the release bundle', command: 'npm', args: ['run', 'build:cli'] });
run({ name: 'the bundle runs on a bare runtime', command: process.execPath, args: ['apps/scanner/dist/leapscore-scan.mjs', '--help'] });
const bundle = readFileSync(join(ROOT, 'apps/scanner/dist/leapscore-scan.mjs'), 'utf-8');
if (!bundle.includes('COMPILED from docs/rubric')) {
  console.error('\nrelease-gates: FAIL at the bundle provenance marker — apps/scanner/dist/leapscore-scan.mjs does not carry "COMPILED from docs/rubric"');
  process.exit(1);
}
run({
  name: 'source vs artifact parity',
  command: 'npm',
  args: ['run', 'test', '--workspace', 'leapscore-scan', '--', 'src/scan/__tests__/bundle-parity.test.ts'],
});

// 2b. One build feeds every surface: the bundle inside the npm tarball and the bundle the
//     committed Action runs must be byte-identical for the same release
//     (artifact-packaging "Tarball bundle matches the Action bundle").
const tarballBundle = readFileSync(join(ROOT, 'apps/scanner/dist/leapscore-scan.mjs'));
const actionBundle = readFileSync(join(ROOT, 'action/dist/leapscore-scan.mjs'));
if (!tarballBundle.equals(actionBundle)) {
  console.error(
    '\nrelease-gates: FAIL at bundle parity — apps/scanner/dist/leapscore-scan.mjs and ' +
      'action/dist/leapscore-scan.mjs differ; rebuild both from the same sources/version ' +
      '(npm run build:cli && npm run build --workspace leapscore-action) before releasing',
  );
  process.exit(1);
}
console.log(`\n── release-gates: tarball and Action bundles are byte-identical (${tarballBundle.length} bytes)`);

// 3. Every workspace test suite.
run({ name: 'workspace test suites', command: 'npm', args: ['test'] });

console.log(`\nrelease-gates: PASS — ${checks.length} check:* commands, bundle parity, and the workspace suites all passed`);
