#!/usr/bin/env tsx
// Byte-freshness gate for the committed GitHub-Action bundle (release-packaging §4.4).
//
// The action must run from a `uses:` checkout with no build step, so its dist is
// committed. Committed build output goes stale silently, so CI rebuilds both artifacts
// into a scratch dir and requires them to be byte-identical to the committed copies —
// a git-diff check can't catch churn that happens to reproduce, and a stale commit is
// exactly the failure this whole change exists to prevent.
//
// The rebuild is offline and token-free: a pure esbuild of committed sources through the
// same build primitive the real build uses, so the comparison is between like and like.
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { REPO_ROOT, buildArtifact } from '../../apps/scanner/scripts/build-lib.mjs';

const ROOT = REPO_ROOT;
const ACTION = join(ROOT, 'action');
const ARTIFACTS = ['index.js', 'leapscore-scan.mjs'];

const scratch = mkdtempSync(join(tmpdir(), 'leapscore-dist-check-'));
const scratch2 = mkdtempSync(join(tmpdir(), 'leapscore-dist-check2-'));
let failed = 0;
function rebuildInto(dir: string): void {
  buildArtifact({
    entryPoints: [join(ACTION, 'src/main.ts')],
    outfile: join(dir, 'action/dist/index.js'),
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'cjs',
    minify: false,
    keepNames: true,
    legalComments: 'none',
  });
  buildArtifact({
    entryPoints: [join(ROOT, 'apps/scanner/bin/scan.ts')],
    outfile: join(dir, 'action/dist/leapscore-scan.mjs'),
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'esm',
    minify: false,
    keepNames: true,
    legalComments: 'none',
    define: { __LEAPSCORE_ENGINE_VERSION__: '"unofficial-build"' },
    shebang: '#!/usr/bin/env node',
  });
}
try {
  rebuildInto(scratch);
  rebuildInto(scratch2);

  // Compare against what a FRESH CHECKOUT would run — the committed blob in the git
  // index, not the working-tree file. Checking the working tree is self-fulfilling:
  // any edit that rebuilds before committing makes both sides change together and the
  // gate can never see the stale commit, which is the exact failure this file exists
  // to catch.
  let committed: Record<string, Buffer> = {};
  try {
    const listing = spawnSync('git', ['ls-files', '--stage', '--', ...ARTIFACTS.map((f) => `action/dist/${f}`)], {
      cwd: ROOT,
      encoding: 'utf8',
    });
    if (listing.status !== 0) throw new Error(listing.stderr);
    for (const line of listing.stdout.split('\n')) {
      if (!line.trim()) continue;
      const [, sha, , path] = line.split(/\s+/);
      const blob = spawnSync('git', ['cat-file', 'blob', sha], { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 });
      if (blob.status !== 0) throw new Error(blob.stderr.toString());
      committed[path] = blob.stdout;
    }
  } catch (e) {
    console.error(
      `dist-freshness: cannot read the committed blobs from git (${e instanceof Error ? e.message : String(e)}).\n` +
        `  The gate compares rebuilds against the git index; run it inside the repo checkout.`,
    );
    process.exit(1);
  }

  for (const file of ARTIFACTS) {
    const key = `action/dist/${file}`;
    const a = committed[key];
    if (a == null) {
      failed++;
      console.error(`action/dist/${file}: NOT TRACKED in git — a committed-artifact action must ship its dist in the checkout.`);
      continue;
    }
    const b = readFileSync(join(scratch, 'action/dist', file));
    // Rerun deterministically: if two rebuilds disagree the BUILD is nondeterministic,
    // and reporting that as "stale" would send someone chasing a git problem that
    // doesn't exist.
    if (!readFileSync(join(scratch2, 'action/dist', file)).equals(b)) {
      console.error(
        `action/dist/${file}: NONDETERMINISTIC BUILD — two rebuilds of the same sources differ. ` +
          `A committed artifact cannot be kept provably fresh; fix the build first.`,
      );
      failed++;
      continue;
    }
    if (a.equals(b)) {
      console.log(`action/dist/${file}: committed blob is byte-identical to a rebuild from the current sources (${a.length} bytes)`);
      continue;
    }
    failed++;
    console.error(
      `action/dist/${file}: STALE — the committed blob is ${a.length} bytes, a rebuild from the current sources is ${b.length} bytes.\n` +
        `  Fix: npm run build:action && git add action/dist/${file}`,
    );
  }
} finally {
  rmSync(scratch, { recursive: true, force: true });
  rmSync(scratch2, { recursive: true, force: true });
}
if (failed) {
  console.error(`\ndist-freshness: FAIL (${failed}/${ARTIFACTS.length} artifacts differ from a rebuild)`);
  process.exit(1);
}
console.log(`dist-freshness: PASS — both action artifacts match a rebuild from the current sources`);
