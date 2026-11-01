#!/usr/bin/env tsx
// Byte-freshness gate for the committed GitHub-Action bundle (release-packaging §4.4).
//
// The action must run from a `uses:` checkout with no build step, so its dist is
// committed. Committed build output goes stale silently, so CI rebuilds both artifacts
// into a scratch dir and requires them to be byte-identical to the committed copies —
// a git-diff check can't catch churn that happens to reproduce, and a stale commit is
// exactly the failure this whole change exists to prevent.
//
// Byte-equality alone approves an artifact that is fresh and still cannot run (it did: a
// CJS wrapper in a `"type": "module"` package). So the gate also asserts the rebuilt
// wrapper's module shape and boots it, expecting the wrapper's own refusal for a
// nonexistent path — a loader crash fails here instead of on a runner.
//
// The rebuild is offline and token-free: a pure esbuild of committed sources through the
// same build primitive the real build uses, so the comparison is between like and like.
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { REPO_ROOT, buildArtifact } from '../../apps/scanner/scripts/build-lib.mjs';
import { wrapperBuildOptions } from '../../action/scripts/wrapper-build.mjs';

const ROOT = REPO_ROOT;
const ACTION = join(ROOT, 'action');
const ARTIFACTS = ['index.js', 'leapscore-scan.mjs'];

const scratch = mkdtempSync(join(tmpdir(), 'leapscore-dist-check-'));
const scratch2 = mkdtempSync(join(tmpdir(), 'leapscore-dist-check2-'));
let failed = 0;
let wiringFailed = 0;
function rebuildInto(dir: string): void {
  buildArtifact(wrapperBuildOptions(join(dir, 'action/dist/index.js')));
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

  // Module-shape agreement (release-packaging D1/D2): the runner loads `dist/index.js` as
  // whatever `action/package.json`'s `type` declares — a bundler format that disagrees only
  // fails at run time, which is how a green tree shipped an action that could not start
  // (`module is not defined in ES module scope`, because the package is `"type": "module"`
  // and the wrapper was built CJS). The second half is the same failure one layer down: a
  // CJS build stubs `import.meta` to `{}`, and the wrapper derives its bundle path from
  // `import.meta.url`, so it would throw even with the package type fixed. Byte-equality
  // cannot see either, because a stale-but-equal artifact is exactly what it approves.
  const actionType = (JSON.parse(readFileSync(join(ACTION, 'package.json'), 'utf-8')) as { type?: string }).type;
  const wrapperText = readFileSync(join(scratch, 'action/dist/index.js'), 'utf-8');
  const wrapperSource = readFileSync(join(ACTION, 'src/main.ts'), 'utf-8');
  if (actionType === 'module' && /^module\.exports\s*=/m.test(wrapperText)) {
    wiringFailed++;
    console.error(
      `action/dist/index.js: built as CommonJS but action/package.json declares "type": "module" — the runner loads it as ESM and it throws "module is not defined".\n` +
        `  Fix: build the wrapper with format: 'esm' (action/scripts/build.mjs).`,
    );
  }
  if (/\bimport\.meta\b/.test(wrapperSource) && /var import_meta = \{\};/.test(wrapperText)) {
    wiringFailed++;
    console.error(
      `action/dist/index.js: the build stubbed import.meta (a CommonJS output format) but the wrapper resolves its scanner bundle from import.meta.url — it throws at run time.\n` +
        `  Fix: build the wrapper with format: 'esm' (action/scripts/build.mjs).`,
    );
  }
  // Boot probe: the static checks above only see the two shapes we already shipped wrong.
  // Actually loading the rebuilt wrapper catches every loader-level regression, without a
  // scan: an input path that does not exist is rejected by the wrapper itself, so the only
  // correct outcome is that wrapper's own refusal — a crash stack instead means the
  // artifact cannot start (module format, dynamic require, missing import.meta).
  const probe = spawnSync(process.execPath, [join(scratch, 'action/dist/index.js')], {
    cwd: scratch,
    encoding: 'utf8',
    timeout: 30_000,
    env: {
      ...process.env,
      GITHUB_OUTPUT: join(scratch, 'probe-output'),
      GITHUB_STEP_SUMMARY: join(scratch, 'probe-summary'),
      INPUT_PATH: join(scratch, 'definitely-not-a-path'),
      INPUT_OUT_DIR: join(scratch, 'probe-out'),
    },
  });
  const probeText = `${probe.stdout ?? ''}${probe.stderr ?? ''}`;
  if (probe.status !== 1 || !probeText.includes('Missing file at path')) {
    wiringFailed++;
    console.error(
      `action/dist/index.js: the rebuilt wrapper does not start — expected the action's own "Missing file at path" refusal, got exit ${probe.status} without it.\n` +
        `  Output: ${probeText.trim().split('\n').slice(0, 6).join('\n    ') || '(empty)'}\n` +
        `  A loader crash here means the committed action is unusable on a runner.`,
    );
  }

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
        `  Fix: npm run build -w leapscore-action && git add action/dist/${file}`,
    );
  }
} finally {
  rmSync(scratch, { recursive: true, force: true });
  rmSync(scratch2, { recursive: true, force: true });
}
const problems = failed + wiringFailed;
if (problems) {
  console.error(`\ndist-freshness: FAIL (${problems} problem${problems === 1 ? '' : 's'})`);
  process.exit(1);
}
console.log(`dist-freshness: PASS — both action artifacts match a rebuild from the current sources`);
