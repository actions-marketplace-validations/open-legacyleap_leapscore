#!/usr/bin/env node
/**
 * apps/scanner/bin/leapscore-scan.mjs — the committed command entry point (cli-packaging).
 *
 * `bin` must name a file that exists at link time, not one `prepare` builds. npm links
 * `node_modules/.bin/<command>` during reify, *before* the root `prepare` script runs, and
 * it skips a bin target that does not exist yet — so a mapping straight at
 * `dist/leapscore-scan.mjs` produces no shim on a clean checkout even though the bundle is
 * built a moment later, and the command is unreachable from a fresh `npm install`
 * (`check:bin-wiring` reports exactly that). This launcher always exists, so the shim is
 * always linked.
 *
 * It execs the artifact as `node <bundle>`, keeping the bundle's own `argv[1]` (its `main`
 * dispatch matches on the artifact path) and its exit codes, stdio, and signals intact.
 *
 * The bundle is `npm run build:cli` (root `prepare` runs it on every `npm install`); it is
 * a build output and is never committed.
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const bundle = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'leapscore-scan.mjs');

if (!existsSync(bundle)) {
  process.stderr.write(
    `leapscore-scan: the built bundle is missing — ${bundle}\n` +
      'run `npm run build:cli` at the repo root (a plain `npm install` builds it via `prepare`).\n',
  );
  process.exit(1);
}

const child = spawnSync(process.execPath, [bundle, ...process.argv.slice(2)], { stdio: 'inherit' });
if (child.error) {
  process.stderr.write(`leapscore-scan: failed to start the bundle: ${child.error.message}\n`);
  process.exit(1);
}
if (child.signal) process.kill(process.pid, child.signal);
process.exit(child.status ?? 1);
