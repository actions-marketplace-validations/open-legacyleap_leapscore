/** action/src/main.test.ts — Action unit test matrix over pass/trip/refused exits (node:test, run: npm test --workspace action) */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildScanArgs, handleExitCode, readScore, readInputs, run } from './main.js';
import { main as scanMain } from '../../apps/scanner/bin/scan';

function tmpOut(): string {
  return mkdtempSync(join(tmpdir(), 'leapscore-action-'));
}

describe('buildScanArgs', () => {
  it('maps path/fail_under/strict/out_dir to scan <path>', () => {
    const { cmd, args } = buildScanArgs(
      { path: '.', failUnder: '53', strict: true, outDir: 'out', engineRef: 'abc1234' },
      '/repo/apps/scanner/bin/scan.ts',
    );
    assert.equal(cmd, 'npx');
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
  });
  it('passes the band gate through only when set', () => {
    const withBand = buildScanArgs({ path: '.', failUnderBand: 'moderate', strict: false, outDir: 'out' }, 'scan.ts');
    const i = withBand.args.indexOf('--fail-under-band');
    assert.equal(withBand.args[i + 1], 'moderate');
    assert.ok(!withBand.args.includes('--fail-under'));
    const without = buildScanArgs({ path: '.', strict: false, outDir: 'out' }, 'scan.ts');
    assert.ok(!without.args.includes('--fail-under-band'));
  });
});

describe('readInputs defaults', () => {
  it('defaults to path "." and out_dir leapscore-report', () => {
    const inputs = readInputs(() => '');
    assert.equal(inputs.path, '.');
    assert.equal(inputs.outDir, 'leapscore-report');
    assert.equal(inputs.strict, false);
  });
  it('reads fail_under_band, empty default leaves it unset', () => {
    assert.equal(readInputs((name) => (name === 'fail_under_band' ? 'high' : '')).failUnderBand, 'high');
    assert.equal(readInputs(() => '').failUnderBand, undefined);
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

describe('5.3 workflow run with the band gate set', () => {
  it('fails the step on a below-band seal while the report files remain for upload', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'leapscore-action-fixture-'));
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'fixture', version: '1.0.0', dependencies: { lodash: '4.17.20' } }));
    writeFileSync(join(dir, 'package-lock.json'), JSON.stringify({ name: 'fixture', lockfileVersion: 3, packages: {} }));
    writeFileSync(join(dir, 'README.md'), '# fixture\nsetup: npm install\n');
    writeFileSync(join(dir, 'index.js'), 'module.exports = 1;\n');
    const outDir = mkdtempSync(join(tmpdir(), 'leapscore-action-out-'));
    const failed: string[] = [];
    const outputs: Record<string, string> = {};
    try {
      await run({
        getInput: (name) => (name === 'path' ? dir : name === 'fail_under_band' ? 'high' : name === 'out_dir' ? outDir : ''),
        setFailed: (m) => failed.push(m),
        setOutput: (n, v) => { outputs[n] = v; },
        // Execute the same argv the workflow would: npx tsx@4 <scanBin> scan <path> ... → scanner main.
        execImpl: async (_cmd, args) => scanMain(args.slice(3), { env: {}, stdout: () => {}, stderr: () => {} }),
      });
      assert.equal(failed.length, 1);
      assert.match(failed[0], /fail_under_band high/);
      assert.equal(outputs['exit-code'], '3');
      for (const f of ['report.json', 'report.html', 'report.md']) assert.ok(existsSync(join(outDir, f)), `${f} kept for upload`);
    } finally {
      rmSync(dir, { recursive: true, force: true });
      rmSync(outDir, { recursive: true, force: true });
    }
  });
});
