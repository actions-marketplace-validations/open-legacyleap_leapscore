/** deterministic-scoring change verification — one test per task's verify clause. */
import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { walkSortedTree } from '../tree';
import {
  computeSampleN,
  createBudgetController,
  partitionByteCap,
  isKillerTrip,
} from '../budget';
import { DETECTOR_TOOL_VERSIONS, toolVersion, buildToolVersions } from '../detectors/common';
import { computeScoreFingerprint, FINGERPRINT_VERSION } from '../scoring/fingerprint';
import { scoreMvp } from '../scoring/scorer/mvp';
import { evaluateGates } from '../scoring/scorer/rollup';
import { sealScan } from '../scoring/seal';
import { bindLocalReadFilePartitioned, runLocalScan } from '../local';
import { main } from '../../../bin/scan';
import type { FactRecord } from '../facts';

function fake(id: string, facts: Record<string, unknown>, error?: FactRecord['error']): FactRecord {
  return {
    id,
    detectorId: id,
    schemaVersion: '1.0.0',
    facts,
    evidencePointers: [{ detail: `${id} detail` }],
    provenance: { tool: 'test', version: '1', flags: ['test'], durationMs: 1 },
    truncated: false,
    ...(error ? { error } : {}),
  } as unknown as FactRecord;
}

describe('1.1 sorted enumeration is canonical', () => {
  it('walkSortedTree returns sorted paths regardless of creation order', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'leapscore-tree-'));
    try {
      for (const f of ['zebra.js', 'apple.js', 'mango/index.js', 'apple/util.js']) {
        mkdirSync(join(dir, f.split('/').slice(0, -1).join('/') || '.'), { recursive: true });
        writeFileSync(join(dir, f), 'x');
      }
      const a = await walkSortedTree(dir);
      const b = await walkSortedTree(dir);
      expect(a.paths).toEqual([...a.paths].sort());
      expect(a.paths).toEqual(b.paths);
      expect(a.fileCount).toBe(4);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('1.2 sampleN threaded through the lease', () => {
  it('setSampleN lands on lease().sampleN', () => {
    const ctrl = createBudgetController({ timeoutMs: 60_000 });
    expect(ctrl.lease().sampleN).toBeUndefined();
    ctrl.setSampleN(computeSampleN(1200));
    expect(ctrl.lease().sampleN).toBe(500);
    ctrl.cancel();
  });
  it('fixture exceeding the shard threshold yields sampled (truncated) slow detectors', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'leapscore-big-'));
    try {
      writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'big', version: '1.0.0' }));
      for (let i = 0; i < 600; i++) writeFileSync(join(dir, `file-${String(i).padStart(4, '0')}.js`), 'module.exports = 1;\n');
      const events: Array<{ type: string; [k: string]: unknown }> = [];
      for await (const e of runLocalScan(dir)) events.push(e as { type: string; [k: string]: unknown });
      const done = events.find((e) => e.type === 'done');
      expect(done).toBeDefined();
      const facts = (done!.facts as FactRecord[]) ?? [];
      for (const id of ['ARCH-01', 'ARCH-08', 'ECOS-05']) {
        const f = facts.find((x) => x.detectorId === id);
        expect(f, id).toBeDefined();
        expect(f!.truncated, id).toBe(true);
        expect(String((f!.error as { detail?: string } | undefined)?.detail)).toMatch(/sampled/);
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 120_000);
});

describe('1.3 partitioned byte budgets', () => {
  it('partitionByteCap splits evenly with a floor', () => {
    expect(partitionByteCap(4 * 1024 * 1024, 4)).toBe(1024 * 1024);
    expect(partitionByteCap(4 * 1024 * 1024, 25)).toBe(256 * 1024); // even split below floor
    expect(partitionByteCap(100, 100)).toBe(256 * 1024);
  });
  it('one detector cannot exhaust another detector budget', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'leapscore-part-'));
    try {
      writeFileSync(join(dir, 'big.bin'), Buffer.alloc(3000, 7));
      writeFileSync(join(dir, 'small.txt'), 'hello');
      const factory = bindLocalReadFilePartitioned(dir, {});
      const a = factory.forDetector(100);
      const b = factory.forDetector(10 * 1024 * 1024);
      await expect(a('big.bin')).rejects.toThrow(/byteCap/);
      await expect(b('big.bin')).resolves.not.toBeNull();
      await expect(b('small.txt')).resolves.not.toBeNull();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('2.1 per-detector tool versions', () => {
  it('every detector tool has a version and changed detectors are bumped', () => {
    for (const tool of ['adr-inventory', 'lizard', 'jscpd', 'syft', 'gh-api', 'phase2', 'budget']) {
      expect(toolVersion(tool)).toMatch(/^\d+\.\d+$/);
    }
    expect(DETECTOR_TOOL_VERSIONS['adr-inventory']).toBe('1.1');
    expect(buildToolVersions().get('syft')).toBe('1.1');
  });
  it('versions appear in provenance output on a real scan', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'leapscore-prov-'));
    try {
      writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'p', version: '1.0.0' }));
      const events: Array<{ type: string; [k: string]: unknown }> = [];
      for await (const e of runLocalScan(dir)) events.push(e as { type: string; [k: string]: unknown });
      const facts = ((events.find((e) => e.type === 'done') as { facts?: FactRecord[] } | undefined)?.facts ?? []);
      expect(facts.length).toBeGreaterThan(0);
      for (const f of facts) {
        expect(f.provenance.version).toBeTruthy();
        expect(f.provenance.version).not.toBe('phase2: 1.0');
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 120_000);
});

describe('2.2 score fingerprint', () => {
  const base = {
    rubricVersion: 'docs/rubric@tranche-a',
    engineVersion: 'unified/1.0',
    engineSha7: 'abc1234',
    strict: false,
    indicatorSet: ['DOCS-01'],
    archetype: 'library' as string,
  };
  it('identical inputs yield identical fingerprints; timings normalized out', () => {
    const mk = (ms: number) => [fake('DOCS-01', { docs01: { adr_count: 1 } })].map((f) => ({
      ...f,
      provenance: { ...f.provenance, durationMs: ms },
    })) as FactRecord[];
    const a = computeScoreFingerprint({ ...base, facts: mk(12) });
    const b = computeScoreFingerprint({ ...base, facts: mk(9876) });
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
    expect(FINGERPRINT_VERSION).toBe(1);
  });
  it('flag change changes the fingerprint', () => {
    const facts = [fake('DOCS-01', { docs01: { adr_count: 1 } })];
    const a = computeScoreFingerprint({ ...base, facts });
    const b = computeScoreFingerprint({ ...base, facts, strict: true });
    expect(a).not.toBe(b);
  });
  it('sealScan emits fingerprint in meta; repeat seals share it', () => {
    const facts = [fake('DOCS-04', { docs04: { docs_present: [], stages_covered: [], stages_missing: ['setup'], undefined_commands: [], last_verified_days: 9999 } })];
    const snap = () => ({ repo: 'o/r', scanned_at: new Date().toISOString(), engine_version: 't', rubric_version: 't', scanned_commit: 'unknown' });
    const s1 = sealScan({ facts, snapshot: snap(), budgetMs: 10_000, startMs: Date.now(), trace: [], subjectSlug: 'x', engineRef: 'abc1234' });
    const s2 = sealScan({ facts, snapshot: snap(), budgetMs: 10_000, startMs: Date.now(), trace: [], subjectSlug: 'x', engineRef: 'abc1234' });
    expect(s1.meta.score_fingerprint).toBeTruthy();
    expect(s1.meta.fingerprint_version).toBe(1);
    expect(s1.meta.score_fingerprint).toBe(s2.meta.score_fingerprint);
    expect(s1.runId).not.toBe(s2.runId);
  });
});

describe('3.1 frozen denominator headline', () => {
  it('unknowns drag the frozen headline but vanish from the renormalized reference', () => {
    const measured = [
      fake('DOCS-03', { docs03: { runbook_dir: 'runbooks', count: 5, topics_covered: ['a'], restore_doc_present: true, newest_days: 10 } }),
      fake('DOCS-04', { docs04: { docs_present: ['CONTRIBUTING.md'], stages_covered: ['setup', 'run', 'test'], stages_missing: [], last_verified_days: 10 } }),
    ];
    const withUnknown = scoreMvp([...measured, fake('DOCS-01', {}, { kind: 'cap', detail: 'sampled' })]);
    const docs = withUnknown.categories.find((c) => c.id === 'DOCS')!;
    expect(docs.category_score).toBeLessThan(docs.renormalized_category_score!);
    expect(withUnknown.canonical_score).toBeCloseTo(withUnknown.score, 10);
    expect(withUnknown.renormalized_score).toBeGreaterThan(withUnknown.score);
  });
});

describe('3.2 coverage floor suppresses thin signal', () => {
  it('fewer than half measured → insufficient-signal with references retained', () => {
    const one = fake('DOCS-03', { docs03: { runbook_dir: 'r', count: 5, topics_covered: ['a'], restore_doc_present: true, newest_days: 10 } });
    const res = scoreMvp([one]);
    expect(res.suppressed).toBe(true);
    expect(res.verdict).toBe('insufficient-signal');
    expect(res.renormalized_score).toBeDefined();
    expect(res.canonical_score).toBeDefined();
  });
  it('healthy coverage does not suppress', () => {
    const many = ['DOCS-01', 'DOCS-03', 'DOCS-04', 'DOCS-08', 'DOCS-09', 'PERF-02', 'PERF-06', 'DATA-01', 'ECOS-06', 'ECOS-08', 'SEC-09', 'SEC-10',
      'ECOS-01', 'ECOS-02', 'ECOS-03', 'ECOS-05', 'ECOS-07', 'SEC-01', 'SEC-06', 'SEC-02'].map((id) =>
      fake(id, { [id.toLowerCase().replace('-', '')]: {} }));
    const res = scoreMvp(many);
    expect(res.suppressed).toBe(false);
    expect(res.verdict).toBeUndefined();
  });
});

describe('3.3 unevaluable gates', () => {
  it('offline run with unknown gate inputs shows unevaluable, never silently uncapped', () => {
    const res = scoreMvp([fake('SEC-02', {}, { kind: 'cap', detail: 'offline' })]);
    const g1 = res.gates.find((g) => g.id === 'G1')!;
    expect(g1.status).toBe('unevaluable');
    expect(g1.note).toMatch(/unevaluable/);
    const raw = evaluateGates([fake('SEC-02', {}, { kind: 'cap', detail: 'offline' })]);
    expect(raw.find((g) => g.id === 'G1')!.status).toBe('unevaluable');
  });
  it('measured gate inputs stay evaluable', () => {
    const raw = evaluateGates([fake('SEC-02', { sec02: { verified_live: 1, tree_findings: [] } })]);
    expect(raw.find((g) => g.id === 'G1')!.status).toBe('proven');
  });
});

describe('4.1 killer timeout is run failure', () => {
  it('isKillerTrip distinguishes killer from clean cancel', () => {
    const c1 = createBudgetController({ timeoutMs: 60_000 });
    expect(isKillerTrip(c1.signal)).toBe(false);
    c1.cancel();
    expect(isKillerTrip(c1.signal)).toBe(false);
    const c2 = createBudgetController({ timeoutMs: 1 });
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(isKillerTrip(c2.signal)).toBe(true);
        resolve();
      }, 25);
    });
  });
  it('forced killer trip writes no report and exits 1', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'leapscore-killer-'));
    const outDir = mkdtempSync(join(tmpdir(), 'leapscore-killer-out-'));
    try {
      writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'k', version: '1.0.0' }));
      const out: string[] = [];
      const err: string[] = [];
      const code = await main(['scan', dir, '--out', outDir], {
        env: { LEAPSCORE_KILLER_MS: '1' },
        stdout: (s) => out.push(s),
        stderr: (s) => err.push(s),
      });
      expect(code).toBe(1);
      expect(existsSync(join(outDir, 'report.json'))).toBe(false);
      expect(err.join('\n')).toMatch(/budget-exceeded/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
      rmSync(outDir, { recursive: true, force: true });
    }
  }, 120_000);
});

describe('4.2 score-policy escape hatch', () => {
  it('frozen and legacy policies both seal; legacy headline equals the renormalized reference', () => {
    const facts = [
      fake('DOCS-03', { docs03: { runbook_dir: 'r', count: 5, topics_covered: ['a'], restore_doc_present: true, newest_days: 10 } }),
      fake('DOCS-01', {}, { kind: 'cap', detail: 'sampled' }),
    ];
    const snap = () => ({ repo: 'o/r', scanned_at: new Date().toISOString(), engine_version: 't', rubric_version: 't', scanned_commit: 'unknown' });
    const frozen = sealScan({ facts, snapshot: snap(), budgetMs: 10_000, startMs: Date.now(), trace: [], subjectSlug: 'x' });
    const legacy = sealScan({ facts, snapshot: snap(), budgetMs: 10_000, startMs: Date.now(), trace: [], subjectSlug: 'x', scorePolicy: 'legacy' });
    expect(frozen.report.headline.score_policy).toBe('frozen');
    expect(legacy.report.headline.score_policy).toBe('legacy');
    expect(legacy.report.headline.score).toBe(legacy.report.headline.renormalized_score);
    expect(frozen.report.headline.score).toBeLessThan(legacy.report.headline.score);
  });
  it('invalid --score-policy exits 2', async () => {
    const out: string[] = [];
    const err: string[] = [];
    const code = await main(['scan', tmpdir(), '--out', join(tmpdir(), 'never'), '--score-policy', 'bogus'], {
      env: {},
      stdout: (s) => out.push(s),
      stderr: (s) => err.push(s),
    });
    expect(code).toBe(2);
  });
});

describe('2.3 engine identity from release, not consumer tree', () => {
  it('same release env from any checkout yields the same engine identity', async () => {
    const mk = () => {
      const d = mkdtempSync(join(tmpdir(), 'leapscore-eng-'));
      writeFileSync(join(d, 'package.json'), JSON.stringify({ name: 'e', version: '1.0.0' }));
      return d;
    };
    const a = mk();
    const b = mkdtempSync(join(tmpdir(), 'leapscore-eng-'));
    writeFileSync(join(b, 'package.json'), JSON.stringify({ name: 'e', version: '1.0.0' }));
    const outA = mkdtempSync(join(tmpdir(), 'leapscore-eng-out-a-'));
    const outB = mkdtempSync(join(tmpdir(), 'leapscore-eng-out-b-'));
    try {
      const run = (dir: string, outDir: string) => {
        const o: string[] = [];
        const e: string[] = [];
        return main(['scan', dir, '--out', outDir], {
          env: { LEAPSCORE_SHA: 'release-sha-12345' },
          stdout: (s) => o.push(s),
          stderr: (s) => e.push(s),
        });
      };
      expect(await run(a, outA)).toBe(0);
      expect(await run(b, outB)).toBe(0);
      const ma = JSON.parse(readFileSync(join(outA, 'report.json'), 'utf8'));
      const mb = JSON.parse(readFileSync(join(outB, 'report.json'), 'utf8'));
      expect(ma.meta.engineSha7).toBe(mb.meta.engineSha7);
      expect(ma.meta.engineSha7).toBe('release');
      expect(ma.meta.score_fingerprint).toBe(mb.meta.score_fingerprint);
    } finally {
      for (const d of [a, b, outA, outB]) rmSync(d, { recursive: true, force: true });
    }
  }, 180_000);
});
