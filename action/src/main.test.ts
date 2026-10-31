/** action/src/main.test.ts — Action unit test matrix over pass/trip/refused exits (node:test, run: npm test --workspace action) */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildScanArgs, handleExitCode, readScore, readInputs, resolveScannerCli, run, ratchetFlag, ratchetTolerance, readDelta } from './main.js';
import { main as scanMain } from '../../apps/scanner/bin/scan';
import { headlineFromRows } from '../../apps/scanner/src/scan/diff';
import { tierForScore, type RowStatus } from '@leapscore/contracts';

function tmpOut(): string {
  return mkdtempSync(join(tmpdir(), 'leapscore-action-'));
}

function makeActionFixture(): string {
  const dir = mkdtempSync(join(tmpdir(), 'leapscore-action-fixture-'));
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'fixture', version: '1.0.0', dependencies: { lodash: '4.17.20' } }));
  writeFileSync(join(dir, 'package-lock.json'), JSON.stringify({ name: 'fixture', lockfileVersion: 3, packages: {} }));
  writeFileSync(join(dir, 'README.md'), '# fixture\nsetup: npm install\n');
  writeFileSync(join(dir, 'index.js'), 'module.exports = 1;\n');
  return dir;
}

type StoredRow = { id: string; status: RowStatus; score?: number; category_id?: string; evidence?: { tool?: string; tool_version?: string } };
type StoredEnv = {
  report: { headline: { score: number; tier: string; score_policy?: string }; full_table: StoredRow[]; categories: Array<{ id: string; weight: number }> };
  meta: { repoSlug: string; score: number; tier: string; score_policy?: string; requested_indicators?: string[] };
};

function mutateStoredReport(p: string, mutate: (env: StoredEnv) => void): void {
  const env = JSON.parse(readFileSync(p, 'utf8')) as StoredEnv;
  mutate(env);
  writeFileSync(p, JSON.stringify(env, null, 2), 'utf8');
}

/** Recompute the sealed headline from rows, as the differ does for counterfactuals. */
function recomputeHeadline(env: StoredEnv): void {
  const weights: Record<string, number> = {};
  for (const c of env.report.categories) weights[c.id] = c.weight;
  const score = headlineFromRows(env.report.full_table, env.meta.score_policy ?? 'frozen', weights);
  env.report.headline.score = score;
  env.meta.score = score;
  env.report.headline.tier = tierForScore(score);
  env.meta.tier = env.report.headline.tier;
}

/** Simulate a baseline whose slice did not build `dropped` (coverage growth). */
function simulateEarlierSlice(p: string, dropped: string[]): void {
  mutateStoredReport(p, (env) => {
    for (const row of env.report.full_table) {
      if (!dropped.includes(row.id)) continue;
      delete row.score;
      row.status = 'not_implemented';
    }
    env.meta.requested_indicators = env.report.full_table.filter((r) => r.status !== 'not_implemented').map((r) => r.id);
    recomputeHeadline(env);
  });
}

async function runAction(
  inputs: Record<string, string>,
  collected: { failed: string[]; outputs: Record<string, string>; summaries: string[] },
): Promise<void> {
  await run({
    getInput: (name) => inputs[name] ?? '',
    setFailed: (m) => collected.failed.push(m),
    setOutput: (n, v) => { collected.outputs[n] = v; },
    summary: (md) => collected.summaries.push(md),
    // Execute the argv a workflow would: node <bundle> scan ... → scanner main.
    execImpl: async (_cmd, args) => scanMain(args.slice(1), { env: {}, stdout: () => {}, stderr: () => {} }),
  });
}

function collector() {
  return { failed: [] as string[], outputs: {} as Record<string, string>, summaries: [] as string[] };
}

describe('buildScanArgs', () => {
  it('maps path/fail_under/strict/out_dir to scan <path> on the runner node, no toolchain fetch', () => {
    const { cmd, args } = buildScanArgs(
      { path: '.', failUnder: '53', strict: true, outDir: 'out', engineRef: 'abc1234' },
      '/runner/action/dist/leapscore-scan.mjs',
    );
    // The artifact runs on the runner's node directly: no npx, no tsx, no registry.
    assert.equal(cmd, process.execPath);
    assert.equal(args[0], '/runner/action/dist/leapscore-scan.mjs');
    assert.ok(!args.includes('npx') && !args.includes('tsx@4'));
    assert.ok(args.includes('scan'));
    assert.ok(args.includes('.'));
    assert.ok(args.includes('--out'));
    assert.ok(args.includes('out'));
    assert.ok(args.includes('--strict'));
    const i = args.indexOf('--fail-under');
    assert.equal(args[i + 1], '53');
    assert.ok(!args.includes('--repo'), 'wrapper never passes --repo');
  });
  it('omits optional flags when unset', () => {
    const { args } = buildScanArgs({ path: 'sub', strict: false, outDir: 'r' }, 'scan.ts');
    assert.ok(!args.includes('--strict'));
    assert.ok(!args.includes('--fail-under'));
    assert.ok(!args.includes('--fail-under-band'));
    assert.ok(!args.includes('--engine-ref'));
    assert.ok(!args.includes('--baseline'));
    assert.ok(!args.some((a) => a.startsWith('--ratchet')));
  });
  it('maps baseline and ratchet inputs to the comparison flags', () => {
    const { args } = buildScanArgs({ path: '.', strict: false, outDir: 'out', baseline: 'prev/report.json', ratchet: 'true' }, 'scan.ts');
    const b = args.indexOf('--baseline');
    assert.equal(args[b + 1], 'prev/report.json');
    assert.ok(args.includes('--ratchet'));
    const tol = buildScanArgs({ path: '.', strict: false, outDir: 'out', baseline: 'p.json', ratchet: '2.5' }, 'scan.ts');
    assert.ok(tol.args.includes('--ratchet=2.5'));
    const off = buildScanArgs({ path: '.', strict: false, outDir: 'out', baseline: 'p.json', ratchet: 'false' }, 'scan.ts');
    assert.ok(!off.args.some((a) => a.startsWith('--ratchet')));
  });
  it('passes the band gate through only when set', () => {
    const withBand = buildScanArgs({ path: '.', failUnderBand: 'moderate', strict: false, outDir: 'out' }, 'scan.ts');
    const i = withBand.args.indexOf('--fail-under-band');
    assert.equal(withBand.args[i + 1], 'moderate');
    assert.ok(!withBand.args.includes('--fail-under'));
    const without = buildScanArgs({ path: '.', strict: false, outDir: 'out' }, 'scan.ts');
    assert.ok(!without.args.includes('--fail-under-band'));
  });
  it('forwards --badge only when the input is non-empty', () => {
    const withBadge = buildScanArgs({ path: '.', strict: false, outDir: 'out', badge: 'out/badge.svg' }, 'scan.ts');
    const i = withBadge.args.indexOf('--badge');
    assert.ok(i > 0);
    assert.equal(withBadge.args[i + 1], 'out/badge.svg');
    const without = buildScanArgs({ path: '.', strict: false, outDir: 'out' }, 'scan.ts');
    assert.ok(!without.args.includes('--badge'));
    const empty = buildScanArgs({ path: '.', strict: false, outDir: 'out', badge: '' }, 'scan.ts');
    assert.ok(!empty.args.includes('--badge'));
  });
});

describe('launcher artifact resolution (artifact-packaging 4.2)', () => {
  it('resolves the bundle beside the committed wrapper (dist/index.js layout)', () => {
    const cli = resolveScannerCli({}, '/runner/action/dist');
    assert.equal(cli, '/runner/action/dist/leapscore-scan.mjs');
  });
  it('source-run layout finds the built bundle under action/dist', () => {
    // This test file lives in action/src; the committed layout has the bundle in action/dist.
    const srcDir = new URL('./', import.meta.url).pathname;
    const cli = resolveScannerCli({}, srcDir);
    assert.ok(cli.endsWith(join('dist', 'leapscore-scan.mjs')), cli);
    assert.ok(cli.includes(join('action', 'dist')), cli);
  });
  it('LEAPSCORE_CLI override wins over the beside-wrapper default (air-gapped operator bundle)', () => {
    const cli = resolveScannerCli({ LEAPSCORE_CLI: '/opt/operator/leapscore-scan.mjs' }, '/runner/action/dist');
    assert.equal(cli, '/opt/operator/leapscore-scan.mjs');
  });
  it('a non-executable override fails the step with the usage-or-refused exit and never falls back', async () => {
    const dir = makeActionFixture();
    const outDir = tmpOut();
    const c = collector();
    const saved = process.env.LEAPSCORE_CLI;
    process.env.LEAPSCORE_CLI = join(tmpdir(), 'leapscore-definitely-not-here-xyz.mjs');
    try {
      await run({
        getInput: (name) => (name === 'path' ? dir : name === 'out_dir' ? outDir : ''),
        setFailed: (m) => c.failed.push(m),
        setOutput: (n, v) => { c.outputs[n] = v; },
        summary: (md) => c.summaries.push(md),
        execImpl: async () => { throw new Error('must never launch when the artifact is refused'); },
      });
      assert.equal(c.outputs['exit-code'], '2'); // usage-or-refused
      assert.equal(c.failed.length, 1);
      assert.match(c.failed[0], /leapscore-definitely-not-here-xyz\.mjs/);
      assert.match(c.failed[0], /missing or not executable/);
      assert.ok(!existsSync(join(outDir, 'report.json')), 'no scan ran — no silent fallback');
    } finally {
      if (saved === undefined) delete process.env.LEAPSCORE_CLI;
      else process.env.LEAPSCORE_CLI = saved;
      rmSync(dir, { recursive: true, force: true });
      rmSync(outDir, { recursive: true, force: true });
    }
  });
});

describe('readInputs defaults', () => {
  it('defaults to path "." and out_dir leapscore-report', () => {
    const inputs = readInputs(() => '');
    assert.equal(inputs.path, '.');
    assert.equal(inputs.outDir, 'leapscore-report');
    assert.equal(inputs.strict, false);
    assert.equal(inputs.baseline, undefined);
    assert.equal(inputs.ratchet, undefined);
  });
  it('reads fail_under_band, empty default leaves it unset', () => {
    assert.equal(readInputs((name) => (name === 'fail_under_band' ? 'high' : '')).failUnderBand, 'high');
    assert.equal(readInputs(() => '').failUnderBand, undefined);
  });
  it('reads baseline and ratchet', () => {
    const inputs = readInputs((name) => (name === 'baseline' ? 'prev/report.json' : name === 'ratchet' ? '2' : ''));
    assert.equal(inputs.baseline, 'prev/report.json');
    assert.equal(inputs.ratchet, '2');
  });
});

describe('ratchetFlag and ratchetTolerance', () => {
  it('empty and false disable the gate; true and numbers map to the CLI forms', () => {
    assert.equal(ratchetFlag(undefined), undefined);
    assert.equal(ratchetFlag(''), undefined);
    assert.equal(ratchetFlag('FALSE'), undefined);
    assert.equal(ratchetFlag('true'), '--ratchet');
    assert.equal(ratchetFlag('2.5'), '--ratchet=2.5');
    assert.equal(ratchetTolerance('true'), 0);
    assert.equal(ratchetTolerance('2.5'), 2.5);
    assert.equal(ratchetTolerance(''), undefined);
  });
});

describe('handleExitCode matrix', () => {
  function harness(outDir: string, score?: number, tier?: string) {
    if (score != null) {
      mkdirSync(outDir, { recursive: true });
      writeFileSync(join(outDir, 'report.json'), JSON.stringify({ meta: { score, tier }, report: { headline: { score, tier } } }));
    }
    const failed: string[] = [];
    const outputs: Record<string, string> = {};
    return {
      failed, outputs,
      deps: {
        setFailed: (m: string) => failed.push(m),
        setOutput: (n: string, v: string) => { outputs[n] = v; },
      },
    };
  }
  it('pass (0): no failure, score/tier outputs set', () => {
    const dir = tmpOut();
    try {
      const h = harness(dir, 62, 'Moderate');
      handleExitCode(0, { path: '.', strict: false, outDir: dir }, h.deps);
      assert.deepEqual(h.failed, []);
      assert.equal(h.outputs['exit-code'], '0');
      assert.equal(h.outputs.score, '62');
      assert.equal(h.outputs.tier, 'Moderate');
      assert.equal(h.outputs['badge-path'], undefined);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
  it('pass (0) with badge: badge-path output carries the requested path', () => {
    const dir = tmpOut();
    try {
      const h = harness(dir, 62, 'Moderate');
      handleExitCode(0, { path: '.', strict: false, outDir: dir, badge: 'out/badge.svg' }, h.deps);
      assert.equal(h.outputs['badge-path'], 'out/badge.svg');
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
  it('threshold trip (3): setFailed names score vs threshold', () => {
    const dir = tmpOut();
    try {
      const h = harness(dir, 41, 'High');
      handleExitCode(3, { path: '.', strict: false, outDir: dir, failUnder: '53' }, h.deps);
      assert.equal(h.failed.length, 1);
      assert.match(h.failed[0], /41.*53|threshold trip/i);
      assert.equal(h.outputs['exit-code'], '3');
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
  it('band threshold trip (3): setFailed names the band gate', () => {
    const dir = tmpOut();
    try {
      const h = harness(dir, 20, 'Critical');
      handleExitCode(3, { path: '.', strict: false, outDir: dir, failUnderBand: 'moderate' }, h.deps);
      assert.equal(h.failed.length, 1);
      assert.match(h.failed[0], /fail_under_band moderate/);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
  it('refused (2): setFailed guides invocation fix', () => {
    const dir = tmpOut();
    try {
      const h = harness(dir);
      handleExitCode(2, { path: '/nope', strict: false, outDir: dir }, h.deps);
      assert.equal(h.failed.length, 1);
      assert.match(h.failed[0], /refused|invocation/i);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
  it('crash (1): setFailed reports crash', () => {
    const dir = tmpOut();
    try {
      const h = harness(dir);
      handleExitCode(1, { path: '.', strict: false, outDir: dir }, h.deps);
      assert.equal(h.failed.length, 1);
      assert.match(h.failed[0], /crash/i);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
});

describe('readScore', () => {
  it('returns {} when no report was written', () => {
    assert.deepEqual(readScore(join(tmpdir(), 'leapscore-missing-xyz')), {});
  });
});

describe('handleExitCode with a ratchet gate', () => {
  function deltaHarness(outDir: string, delta: Record<string, unknown>, score?: number) {
    mkdirSync(outDir, { recursive: true });
    if (score != null) writeFileSync(join(outDir, 'report.json'), JSON.stringify({ meta: { score, tier: 'Moderate' }, report: { headline: { score, tier: 'Moderate' } } }));
    writeFileSync(join(outDir, 'report.delta.json'), JSON.stringify(delta));
    const c = collector();
    return c;
  }
  it('exit 3 with a negative code part is reported as a ratchet trip, not a threshold trip', () => {
    const dir = tmpOut();
    try {
      const c = deltaHarness(dir, { verdict: { status: 'comparable' }, headline: { code_attributable: -4.2, movement: -4.2 } }, 50);
      handleExitCode(3, { path: '.', strict: false, outDir: dir, baseline: 'b.json', ratchet: 'true' }, { setFailed: (m) => c.failed.push(m), setOutput: (n, v) => { c.outputs[n] = v; }, summary: (md) => c.summaries.push(md) });
      assert.equal(c.failed.length, 1);
      assert.match(c.failed[0], /ratchet trip/);
      assert.match(c.failed[0], /-4\.2pp/);
      assert.match(c.summaries[0], /ratchet trip/);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
  it('exit 3 with a non-negative code part falls back to the threshold message', () => {
    const dir = tmpOut();
    try {
      const c = deltaHarness(dir, { verdict: { status: 'comparable' }, headline: { code_attributable: 0, movement: 0 } }, 20);
      handleExitCode(3, { path: '.', strict: false, outDir: dir, failUnder: '53', baseline: 'b.json', ratchet: 'true' }, { setFailed: (m) => c.failed.push(m), setOutput: () => {} });
      assert.match(c.failed[0], /threshold trip/i);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
  it('exit 2 with an incomparable delta names the blocking cause in the message and summary', () => {
    const dir = tmpOut();
    try {
      const c = deltaHarness(dir, { verdict: { status: 'incomparable', cause: 'fingerprint-era-mismatch' } });
      handleExitCode(2, { path: '.', strict: false, outDir: dir, baseline: 'b.json', ratchet: 'true' }, { setFailed: (m) => c.failed.push(m), setOutput: () => {}, summary: (md) => c.summaries.push(md) });
      assert.equal(c.failed.length, 1);
      assert.match(c.failed[0], /ratchet refused/);
      assert.match(c.failed[0], /fingerprint-era-mismatch/);
      assert.match(c.summaries[0], /fingerprint-era-mismatch/);
      assert.ok(!/pass/i.test(c.failed[0]));
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
  it('readDelta returns undefined when no delta document exists', () => {
    const dir = tmpOut();
    try {
      assert.equal(readDelta(dir), undefined);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
});

describe('6.1 a workflow supplying neither baseline nor ratchet behaves as before', () => {
  it('action.yml declares both inputs with empty defaults', () => {
    const yml = readFileSync(new URL('../action.yml', import.meta.url), 'utf8');
    assert.match(yml, /baseline:\n\s+description:[^\n]*\n\s+required: false\n\s+default: ""/);
    assert.match(yml, /ratchet:\n\s+description:[^\n]*\n\s+required: false\n\s+default: ""/);
  });
  it('a run with neither input writes no delta document and does not fail', async () => {
    const dir = makeActionFixture();
    const outDir = tmpOut();
    const c = collector();
    try {
      await runAction({ path: dir, out_dir: outDir }, c);
      assert.deepEqual(c.failed, []);
      assert.equal(c.outputs['exit-code'], '0');
      assert.ok(existsSync(join(outDir, 'report.json')));
      assert.ok(!existsSync(join(outDir, 'report.delta.json')), 'no delta without a baseline');
    } finally {
      rmSync(dir, { recursive: true, force: true });
      rmSync(outDir, { recursive: true, force: true });
    }
  });
});

describe('6.2/6.3/6.4/6.5 workflow run against a restored baseline', () => {
  it('coverage-only movement does not fail the step; a code regression does, with artifacts kept', async () => {
    const dir = makeActionFixture();
    const baselineOut = tmpOut();
    try {
      await runAction({ path: dir, out_dir: baselineOut }, collector());
      assert.ok(existsSync(join(baselineOut, 'report.json')));

      // Coverage-only: the restored baseline did not build four rows the current
      // run does. The ratchet must not fail the step.
      const coverageBase = tmpOut();
      writeFileSync(join(coverageBase, 'report.json'), readFileSync(join(baselineOut, 'report.json')));
      simulateEarlierSlice(join(coverageBase, 'report.json'), ['DOCS-01', 'DOCS-03', 'SEC-09', 'SEC-10']);
      const covOut = tmpOut();
      const cov = collector();
      await runAction({ path: dir, out_dir: covOut, baseline: join(coverageBase, 'report.json'), ratchet: 'true' }, cov);
      assert.deepEqual(cov.failed, []);
      assert.equal(cov.outputs['exit-code'], '0');
      const covDelta = JSON.parse(readFileSync(join(covOut, 'report.delta.json'), 'utf8'));
      assert.equal(covDelta.verdict.status, 'comparable-with-coverage-change');
      assert.equal(covDelta.headline.code_attributable, 0);
      rmSync(coverageBase, { recursive: true, force: true });

      // Code regression: the restored baseline sealed one row better than the
      // fixture scans. The step fails and the artifacts remain for upload.
      const regressedBase = tmpOut();
      writeFileSync(join(regressedBase, 'report.json'), readFileSync(join(baselineOut, 'report.json')));
      mutateStoredReport(join(regressedBase, 'report.json'), (env) => {
        const row = env.report.full_table.find((r) => r.id === 'DOCS-01')!;
        row.score = (row.score ?? 0) + 1;
        recomputeHeadline(env);
      });
      const regOut = tmpOut();
      const reg = collector();
      await runAction({ path: dir, out_dir: regOut, baseline: join(regressedBase, 'report.json'), ratchet: 'true' }, reg);
      assert.equal(reg.outputs['exit-code'], '3');
      assert.equal(reg.failed.length, 1);
      assert.match(reg.failed[0], /ratchet trip/);
      for (const f of ['report.json', 'report.html', 'report.md', 'report.delta.json']) {
        assert.ok(existsSync(join(regOut, f)), `${f} kept for upload`);
      }
      rmSync(regressedBase, { recursive: true, force: true });

      // Incomparable refusal: a different subject. The step refuses and both the
      // failure message and the job summary name the blocking cause.
      const refBase = tmpOut();
      writeFileSync(join(refBase, 'report.json'), readFileSync(join(baselineOut, 'report.json')));
      mutateStoredReport(join(refBase, 'report.json'), (env) => { env.meta.repoSlug = 'other/app'; });
      const refOut = tmpOut();
      const ref = collector();
      await runAction({ path: dir, out_dir: refOut, baseline: join(refBase, 'report.json'), ratchet: 'true' }, ref);
      assert.equal(ref.outputs['exit-code'], '2');
      assert.equal(ref.failed.length, 1);
      assert.match(ref.failed[0], /subject-mismatch/);
      assert.equal(ref.summaries.length, 1);
      assert.match(ref.summaries[0], /subject-mismatch/);
      for (const f of ['report.json', 'report.html', 'report.md', 'report.delta.json']) {
        assert.ok(existsSync(join(refOut, f)), `${f} kept for upload`);
      }
      rmSync(refBase, { recursive: true, force: true });
    } finally {
      rmSync(dir, { recursive: true, force: true });
      rmSync(baselineOut, { recursive: true, force: true });
    }
  });
});

describe('6.4 workflow artifacts are uploaded in every outcome', () => {
  it('the workflow uploads the report directory with if: always()', () => {
    const yml = readFileSync(new URL('../../.github/workflows/leapscore-scan.yml', import.meta.url), 'utf8');
    assert.match(yml, /uses: actions\/upload-artifact@v\d+/);
    assert.match(yml, /upload-artifact@v\d+[\s\S]*?if: always\(\)/);
    assert.match(yml, /path: leapscore-report\//);
  });
});
