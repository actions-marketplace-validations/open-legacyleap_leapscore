/** baseline-diff CLI + comparability-inputs verification — one test per task's verify clause.
 *
 *  Real local scans over a temporary fixture; baselines are either earlier real
 *  scans or deliberately mutated sealed envelopes (the differ reads them from
 *  disk exactly as CI would from a restored artifact). The byte-identity
 *  checks freeze the clock (`Date` only) so two runs are directly comparable.
 */
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { main, parseRatchetTolerance, validateBaselineDocument } from '../../../bin/scan';
import { headlineFromRows } from '../diff';
import { sealScan } from '../scoring/seal';
import { FINGERPRINT_VERSION, computeScoreFingerprint } from '../scoring/fingerprint';
import {
  assertContractVersion,
  isDeltaDocument,
  resolveRequestedIndicators,
  tierForScore,
  POSITIONING_LINE,
  assessmentUrlForBand,
  type RowStatus,
} from '@leapscore/contracts';
import type { FactRecord } from '../facts';

type StoredRow = {
  id: string;
  status: RowStatus;
  score?: number;
  category_id?: string;
  evidence?: { tool?: string; tool_version?: string; pointers?: Array<{ file?: string; line?: number; detail?: string }> };
};

type StoredEnvelope = {
  report: {
    headline: { score: number; tier: string; score_policy?: string; suppressed?: boolean };
    categories: Array<{ id: string; weight: number; indicator_rows: StoredRow[] }>;
    full_table: StoredRow[];
  };
  meta: {
    repoSlug: string;
    runId: string;
    ranAt: string;
    score: number;
    tier: string;
    rubric_version: string;
    fingerprint_version?: number;
    requested_indicators?: string[];
    score_policy?: string;
    score_fingerprint?: string;
    contractVersion: number;
  };
  trace: unknown[];
  contractVersion: number;
};

function makeFixture(): string {
  const dir = mkdtempSync(join(tmpdir(), 'leapscore-diff-fixture-'));
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'fixture', version: '1.0.0', dependencies: { lodash: '4.17.20' } }));
  writeFileSync(join(dir, 'package-lock.json'), JSON.stringify({ name: 'fixture', lockfileVersion: 3, packages: {} }));
  writeFileSync(join(dir, 'README.md'), '# fixture\nsetup: npm install\n');
  writeFileSync(join(dir, 'index.js'), 'module.exports = 1;\n');
  return dir;
}

async function runCli(argv: string[], env: Record<string, string | undefined> = {}) {
  const out: string[] = [];
  const err: string[] = [];
  const code = await main(argv, { env, stdout: (s) => out.push(s), stderr: (s) => err.push(s) });
  return { code, out, err };
}

function readJson<T = unknown>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

function cleanup(...dirs: string[]) {
  for (const d of dirs) rmSync(d, { recursive: true, force: true });
}

/** Write a mutated copy of a sealed report.json into its own directory. */
function mutatedBaseline(src: string, dstDir: string, mutate: (env: StoredEnvelope) => void): string {
  const env = readJson<StoredEnvelope>(src);
  mutate(env);
  const dst = join(dstDir, 'report.json');
  writeFileSync(dst, JSON.stringify(env, null, 2), 'utf8');
  return dst;
}

/** Recompute the sealed headline from the (possibly mutated) rows, exactly as
 *  the differ recomputes counterfactuals — keeps a mutated baseline internally
 *  consistent instead of pitting a stale headline against new rows. */
function recomputeHeadline(env: StoredEnvelope): void {
  const weights: Record<string, number> = {};
  for (const c of env.report.categories) weights[c.id] = c.weight;
  const score = headlineFromRows(env.report.full_table, env.meta.score_policy ?? 'frozen', weights);
  env.report.headline.score = score;
  env.meta.score = score;
  env.report.headline.tier = tierForScore(score);
  env.meta.tier = env.report.headline.tier;
}

/** Simulate a run whose slice did not build `droppedIds`: those rows are
 *  `not_implemented` there, and its requested set matches its own table. */
function simulateEarlierSlice(src: string, dstDir: string, droppedIds: string[]): string {
  return mutatedBaseline(src, dstDir, (env) => {
    for (const row of env.report.full_table) {
      if (!droppedIds.includes(row.id)) continue;
      delete row.score;
      row.status = 'not_implemented';
    }
    env.meta.requested_indicators = env.report.full_table.filter((r) => r.status !== 'not_implemented').map((r) => r.id);
    recomputeHeadline(env);
  });
}

function fake(id: string, facts: Record<string, unknown>): FactRecord {
  return {
    id,
    detectorId: id,
    schemaVersion: '1.0.0',
    facts,
    evidencePointers: [{ detail: `${id} detail` }],
    provenance: { tool: 'test', version: '1', flags: ['test'], durationMs: 1 },
    truncated: false,
  } as unknown as FactRecord;
}

let fixture: string;
let baseOut: string;
let baseEnv: StoredEnvelope;

beforeAll(async () => {
  fixture = makeFixture();
  baseOut = mkdtempSync(join(tmpdir(), 'leapscore-diff-base-'));
  const r = await runCli(['scan', fixture, '--out', baseOut]);
  expect(r.code).toBe(0);
  baseEnv = readJson<StoredEnvelope>(join(baseOut, 'report.json'));
  expect(baseEnv.report.headline.suppressed).toBe(false);
}, 180_000);

afterAll(() => cleanup(fixture, baseOut));

describe('2.1 a sealed envelope carries the comparability inputs', () => {
  it('meta records the requested set, score policy, fingerprint era, and rubric version', () => {
    expect(Array.isArray(baseEnv.meta.requested_indicators)).toBe(true);
    expect(baseEnv.meta.requested_indicators!.length).toBeGreaterThan(0);
    for (const id of baseEnv.meta.requested_indicators!) expect(id).toMatch(/^[A-Z]+-\d+$/);
    expect(baseEnv.meta.score_policy).toBe('frozen');
    expect(baseEnv.meta.fingerprint_version).toBe(FINGERPRINT_VERSION);
    expect(baseEnv.meta.rubric_version).toBeTruthy();
  });
});

describe('2.3 the new fields do not alter the score fingerprint', () => {
  it('one fixture sealed twice with the fields recorded keeps identical fingerprints', () => {
    const facts = [fake('DOCS-04', { docs04: { docs_present: [], stages_covered: [], stages_missing: ['setup'], undefined_commands: [], last_verified_days: 9999 } })];
    const snap = () => ({ repo: 'o/r', scanned_at: '2026-08-12T00:00:00.000Z', engine_version: 't', rubric_version: 't', scanned_commit: 'unknown' });
    const seal = () => sealScan({ facts, snapshot: snap(), budgetMs: 10_000, startMs: Date.now(), trace: [], subjectSlug: 'x', engineRef: 'abc1234', scanId: 'ls_fixed' });
    const a = seal();
    const b = seal();
    // The slice's requested set is the full table's non-`not_implemented` rows
    // (the local slice plus its GH-only rows), identical across the two seals.
    expect(a.meta.requested_indicators).toContain('DOCS-04');
    expect(b.meta.requested_indicators).toEqual(a.meta.requested_indicators);
    expect(b.meta.score_fingerprint).toBe(a.meta.score_fingerprint);
    // The fingerprint is a function of facts + semantic flags only — the record
    // fields are not inputs, so their presence cannot shift it.
    expect(a.meta.score_fingerprint).toBe(computeScoreFingerprint({
      facts,
      rubricVersion: 't',
      engineVersion: 't',
      engineSha7: 'abc1234',
      snapshotVersions: {},
      strict: false,
      indicatorSet: ['DOCS-04'],
      archetype: 'unknown',
      scorePolicy: 'frozen',
    }));
  });
});

describe('2.4 requested-set reconstruction reproduces the recorded set exactly', () => {
  it('a freshly sealed envelope reconstructs the same set it recorded', () => {
    const recorded = resolveRequestedIndicators({ meta: baseEnv.meta, report: baseEnv.report });
    expect(recorded.ok).toBe(true);
    expect(recorded).toMatchObject({ source: 'recorded' });
    const reconstructed = resolveRequestedIndicators({ meta: {}, report: baseEnv.report });
    expect(reconstructed.ok).toBe(true);
    expect(reconstructed).toMatchObject({ source: 'reconstructed' });
    if (recorded.ok && reconstructed.ok) {
      expect(reconstructed.indicators).toEqual(recorded.indicators);
      expect(recorded.indicators).toEqual(baseEnv.meta.requested_indicators);
    }
  });
});

describe('2.5 pre-field envelopes reconstruct or refuse; absence is not an empty set', () => {
  it('absence reconstructs from the table; an empty recorded set stays empty', () => {
    const reconstructed = resolveRequestedIndicators({ meta: {}, report: baseEnv.report });
    expect(reconstructed).toMatchObject({ ok: true, source: 'reconstructed' });
    const empty = resolveRequestedIndicators({ meta: { requested_indicators: [] }, report: baseEnv.report });
    expect(empty).toEqual({ ok: true, indicators: [], source: 'recorded' });
    const missing = resolveRequestedIndicators({ meta: {}, report: {} });
    expect(missing).toMatchObject({ ok: false, reason: 'missing-comparability-inputs' });
  });
});

describe('5.1 an unreadable, missing, or non-envelope baseline is refused before work', () => {
  it('a missing baseline exits 2 naming the path and writes nothing', async () => {
    const outDir = mkdtempSync(join(tmpdir(), 'leapscore-diff-out-'));
    try {
      const r = await runCli(['scan', fixture, '--out', outDir, '--baseline', join(outDir, 'nope.json')]);
      expect(r.code).toBe(2);
      expect(r.err.join('\n')).toMatch(/cannot read baseline/);
      expect(existsSync(join(outDir, 'report.json'))).toBe(false);
    } finally {
      cleanup(outDir);
    }
  });
  it('a non-envelope JSON file exits 2 with no report written', async () => {
    const badDir = mkdtempSync(join(tmpdir(), 'leapscore-diff-bad-'));
    const outDir = mkdtempSync(join(tmpdir(), 'leapscore-diff-out-'));
    try {
      const cases: Array<[string, string, RegExp]> = [
        ['not-json.json', '{not json', /not valid JSON/],
        ['object.json', JSON.stringify({ hello: 1 }), /not a sealed report envelope/],
        ['delta.json', JSON.stringify({ document: 'run-delta', delta_schema: 1, baseline: {}, current: {}, verdict: {}, rows: [], transitions: [] }), /delta document, not a sealed report/],
      ];
      for (const [name, body, msg] of cases) {
        const p = join(badDir, name);
        writeFileSync(p, body, 'utf8');
        const r = await runCli(['scan', fixture, '--out', outDir, '--baseline', p]);
        expect(r.code, name).toBe(2);
        expect(r.err.join('\n'), name).toMatch(msg);
        for (const f of ['report.json', 'report.html', 'report.md', 'report.delta.json']) {
          expect(existsSync(join(outDir, f)), `${name}:${f}`).toBe(false);
        }
      }
      // A delta document is refused as a document class, not read as an envelope.
      expect(validateBaselineDocument({ document: 'run-delta', delta_schema: 1, baseline: {}, current: {}, verdict: {} }).ok).toBe(false);
    } finally {
      cleanup(badDir, outDir);
    }
  });
  it('--ratchet without --baseline is a usage error', async () => {
    const outDir = mkdtempSync(join(tmpdir(), 'leapscore-diff-out-'));
    try {
      const r = await runCli(['scan', fixture, '--out', outDir, '--ratchet']);
      expect(r.code).toBe(2);
      expect(r.err.join('\n')).toMatch(/--ratchet requires --baseline/);
      expect(existsSync(join(outDir, 'report.json'))).toBe(false);
    } finally {
      cleanup(outDir);
    }
  });
  it('ratchet tolerance parsing: bare means zero, negatives and junk are refused', () => {
    expect(parseRatchetTolerance(undefined)).toBeUndefined();
    expect(parseRatchetTolerance(true)).toBe(0);
    expect(parseRatchetTolerance('2.5')).toBe(2.5);
    expect(() => parseRatchetTolerance('-1')).toThrow(/non-negative/);
    expect(() => parseRatchetTolerance('abc')).toThrow(/non-negative/);
  });
});

describe('5.2 a baselined run adds the delta document beside the sealed trio', () => {
  it('the output directory holds three sealed files plus report.delta.json', async () => {
    const outDir = mkdtempSync(join(tmpdir(), 'leapscore-diff-out-'));
    try {
      const r = await runCli(['scan', fixture, '--out', outDir, '--baseline', join(baseOut, 'report.json')]);
      expect(r.code).toBe(0);
      for (const f of ['report.json', 'report.html', 'report.md', 'report.delta.json']) {
        expect(existsSync(join(outDir, f)), f).toBe(true);
      }
      const delta = readJson<Record<string, unknown>>(join(outDir, 'report.delta.json'));
      expect(isDeltaDocument(delta)).toBe(true);
      expect(delta.document).toBe('run-delta');
      expect(delta.delta_schema).toBe(1);
      expect((delta.verdict as { status: string }).status).toBe('comparable');
      // No fingerprint of the delta itself; the run references name each run's.
      expect('score_fingerprint' in delta).toBe(false);
      const cur = readJson<StoredEnvelope>(join(outDir, 'report.json'));
      expect((delta.baseline as { score_fingerprint?: string }).score_fingerprint).toBe(baseEnv.meta.score_fingerprint);
      expect((delta.current as { score_fingerprint?: string }).score_fingerprint).toBe(cur.meta.score_fingerprint);
    } finally {
      cleanup(outDir);
    }
  });
});

describe('5.3 the sealed trio is byte-identical with and without a baseline', () => {
  it('report.json, report.html, and report.md match byte for byte and keep the fingerprint', async () => {
    const outA = mkdtempSync(join(tmpdir(), 'leapscore-diff-out-'));
    const outB = mkdtempSync(join(tmpdir(), 'leapscore-diff-out-'));
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-08-12T00:00:00.000Z'));
    try {
      const plain = await runCli(['scan', fixture, '--out', outA], { LEAPSCORE_SHA: 'fixedsha' });
      const baselined = await runCli(['scan', fixture, '--out', outB, '--baseline', join(outA, 'report.json')], { LEAPSCORE_SHA: 'fixedsha' });
      expect(plain.code).toBe(0);
      expect(baselined.code).toBe(0);
      for (const f of ['report.json', 'report.html', 'report.md']) {
        expect(readFileSync(join(outB, f)).equals(readFileSync(join(outA, f))), f).toBe(true);
      }
      const a = readJson<StoredEnvelope>(join(outA, 'report.json'));
      const b = readJson<StoredEnvelope>(join(outB, 'report.json'));
      expect(b.meta.score_fingerprint).toBe(a.meta.score_fingerprint);
    } finally {
      vi.useRealTimers();
      cleanup(outA, outB);
    }
  }, 180_000);
});

describe('5.4 the delta summary is a second stdout line; the sealed line is unchanged', () => {
  it('stdout carries the sealed-run line followed by one delta line, URL still final and once', async () => {
    const outA = mkdtempSync(join(tmpdir(), 'leapscore-diff-out-'));
    const outB = mkdtempSync(join(tmpdir(), 'leapscore-diff-out-'));
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-08-12T00:00:00.000Z'));
    try {
      const plain = await runCli(['scan', fixture, '--out', outA], { LEAPSCORE_SHA: 'fixedsha' });
      const baselined = await runCli(['scan', fixture, '--out', outB, '--baseline', join(outA, 'report.json')], { LEAPSCORE_SHA: 'fixedsha' });
      expect(baselined.out).toHaveLength(2);
      // The sealed line is the plain run's line, untouched by the comparison.
      expect(baselined.out[0]).toBe(plain.out[0]);
      const tier = readJson<StoredEnvelope>(join(outB, 'report.json')).report.headline.tier;
      expect(baselined.out[0].endsWith(assessmentUrlForBand(tier))).toBe(true);
      expect(baselined.out[0].match(/utm_campaign=cli-scan-v1/g)).toHaveLength(1);
      expect(baselined.out[1].startsWith('delta:comparable')).toBe(true);
      expect(baselined.out[1]).toContain('movement:0pp');
      expect(baselined.out[1]).not.toContain('utm_campaign');
    } finally {
      vi.useRealTimers();
      cleanup(outA, outB);
    }
  }, 180_000);
});

describe('5.5 ratchet exit semantics', () => {
  it('a code-attributable regression beyond tolerance exits 3 with the delta line naming the trip', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'leapscore-diff-base-'));
    const outDir = mkdtempSync(join(tmpdir(), 'leapscore-diff-out-'));
    try {
      // Baseline sealed better than the fixture actually scans (one row up): the
      // current run's code-attributable part falls. Producers are untouched.
      const baseline = mutatedBaseline(join(baseOut, 'report.json'), dir, (env) => {
        const row = env.report.full_table.find((r) => r.id === 'DOCS-01')!;
        row.score = (row.score ?? 0) + 1;
        recomputeHeadline(env);
      });
      const r = await runCli(['scan', fixture, '--out', outDir, '--baseline', baseline, '--ratchet']);
      expect(r.code).toBe(3);
      expect(r.err.join('\n')).toMatch(/ratchet trip/);
      expect(r.out[1]).toContain('ratchet:trip');
      for (const f of ['report.json', 'report.html', 'report.md', 'report.delta.json']) expect(existsSync(join(outDir, f)), f).toBe(true);
    } finally {
      cleanup(dir, outDir);
    }
  }, 120_000);
  it('the same regression within tolerance exits 0', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'leapscore-diff-base-'));
    const outDir = mkdtempSync(join(tmpdir(), 'leapscore-diff-out-'));
    try {
      const baseline = mutatedBaseline(join(baseOut, 'report.json'), dir, (env) => {
        const row = env.report.full_table.find((r) => r.id === 'DOCS-01')!;
        row.score = (row.score ?? 0) + 1;
        recomputeHeadline(env);
      });
      const r = await runCli(['scan', fixture, '--out', outDir, '--baseline', baseline, '--ratchet=100']);
      expect(r.code).toBe(0);
      expect(r.out[1]).toContain('ratchet:pass');
    } finally {
      cleanup(dir, outDir);
    }
  }, 120_000);
  it('coverage-attributable movement does not trip the ratchet', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'leapscore-diff-base-'));
    const outDir = mkdtempSync(join(tmpdir(), 'leapscore-diff-out-'));
    try {
      const baseline = simulateEarlierSlice(join(baseOut, 'report.json'), dir, ['DOCS-01', 'DOCS-03', 'SEC-09', 'SEC-10']);
      const r = await runCli(['scan', fixture, '--out', outDir, '--baseline', baseline, '--ratchet']);
      expect(r.code).toBe(0);
      const delta = readJson<{ headline: { code_attributable: number; coverage_attributable: number; movement: number; no_code_change_measured: boolean } }>(join(outDir, 'report.delta.json'));
      expect(delta.headline.code_attributable).toBe(0);
      expect(delta.headline.coverage_attributable).toBe(delta.headline.movement);
      expect(r.out[1]).toContain('ratchet:pass');
    } finally {
      cleanup(dir, outDir);
    }
  }, 120_000);
  it('model-attributable movement does not trip the ratchet', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'leapscore-diff-base-'));
    const outDir = mkdtempSync(join(tmpdir(), 'leapscore-diff-out-'));
    try {
      // One producer is older in the baseline and its row scored higher there:
      // the whole movement is model-attributable and the code part stays zero.
      const baseline = mutatedBaseline(join(baseOut, 'report.json'), dir, (env) => {
        for (const row of env.report.full_table) {
          if (row.evidence?.tool === 'adr-inventory') row.evidence.tool_version = '0.0';
        }
        const row = env.report.full_table.find((r) => r.id === 'DOCS-01')!;
        row.score = (row.score ?? 0) + 1;
        recomputeHeadline(env);
      });
      const r = await runCli(['scan', fixture, '--out', outDir, '--baseline', baseline, '--ratchet']);
      expect(r.code).toBe(0);
      const delta = readJson<{ headline: { code_attributable: number; model_attributable: number; movement: number } }>(join(outDir, 'report.delta.json'));
      expect(delta.headline.code_attributable).toBe(0);
      expect(delta.headline.model_attributable).toBe(delta.headline.movement);
      expect(delta.headline.model_attributable).toBeLessThan(0);
      expect(r.out[1]).toContain('ratchet:pass');
    } finally {
      cleanup(dir, outDir);
    }
  }, 120_000);
});

describe('5.6 an incomparable verdict with a ratchet refuses, naming the cause', () => {
  it('exits 2 with the cause on stderr and never reports a pass', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'leapscore-diff-base-'));
    const outDir = mkdtempSync(join(tmpdir(), 'leapscore-diff-out-'));
    try {
      const baseline = mutatedBaseline(join(baseOut, 'report.json'), dir, (env) => {
        env.meta.repoSlug = 'other/app';
      });
      const r = await runCli(['scan', fixture, '--out', outDir, '--baseline', baseline, '--ratchet']);
      expect(r.code).toBe(2);
      expect(r.err.join('\n')).toMatch(/ratchet refused/);
      expect(r.err.join('\n')).toMatch(/subject-mismatch/);
      expect(r.out.join('\n')).not.toContain('ratchet:pass');
      expect(r.out[1]).toContain('delta:incomparable');
    } finally {
      cleanup(dir, outDir);
    }
  }, 120_000);
});

describe('5.7 a readable-but-incomparable baseline still writes all four artifacts', () => {
  it('records the blocking cause and emits no score delta', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'leapscore-diff-base-'));
    const outDir = mkdtempSync(join(tmpdir(), 'leapscore-diff-out-'));
    try {
      const baseline = mutatedBaseline(join(baseOut, 'report.json'), dir, (env) => {
        env.meta.fingerprint_version = 1;
      });
      const r = await runCli(['scan', fixture, '--out', outDir, '--baseline', baseline]);
      expect(r.code).toBe(0); // no gate requested: the refusal lives in the artifact
      for (const f of ['report.json', 'report.html', 'report.md', 'report.delta.json']) expect(existsSync(join(outDir, f)), f).toBe(true);
      const delta = readJson<{ verdict: { status: string; cause: string }; headline?: unknown; rows: unknown[] }>(join(outDir, 'report.delta.json'));
      expect(delta.verdict.status).toBe('incomparable');
      expect(delta.verdict.cause).toBe('fingerprint-era-mismatch');
      expect(delta.headline).toBeUndefined();
      expect(delta.rows).toEqual([]);
      expect(r.out[1]).toContain('delta:incomparable');
      expect(r.out[1]).toContain('fingerprint-era-mismatch');
    } finally {
      cleanup(dir, outDir);
    }
  }, 120_000);
});

describe('8.1 same fixture against an earlier scan: comparable with parts summing', () => {
  it('reports comparable and the decomposition sums to the headline movement', async () => {
    const outDir = mkdtempSync(join(tmpdir(), 'leapscore-diff-out-'));
    try {
      const r = await runCli(['scan', fixture, '--out', outDir, '--baseline', join(baseOut, 'report.json')]);
      expect(r.code).toBe(0);
      const delta = readJson<{
        verdict: { status: string };
        baseline: { runId: string };
        current: { runId: string };
        headline: { movement: number; code_attributable: number; coverage_attributable: number; model_attributable: number; unattributable: number };
      }>(join(outDir, 'report.delta.json'));
      expect(delta.verdict.status).toBe('comparable');
      expect(delta.baseline.runId).toBe(baseEnv.meta.runId);
      const cur = readJson<StoredEnvelope>(join(outDir, 'report.json'));
      expect(delta.current.runId).toBe(cur.meta.runId);
      const h = delta.headline;
      expect(Math.abs(h.movement - (h.code_attributable + h.coverage_attributable + h.model_attributable + h.unattributable))).toBeLessThanOrEqual(0.01);
      expect(Math.abs(h.movement)).toBeLessThanOrEqual(0.01); // same content: no movement
    } finally {
      cleanup(outDir);
    }
  }, 120_000);
});

describe('8.2 coverage growth is attributed to coverage and does not trip the ratchet', () => {
  it('a later run with a larger requested set reports comparable-with-coverage-change', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'leapscore-diff-base-'));
    const outDir = mkdtempSync(join(tmpdir(), 'leapscore-diff-out-'));
    try {
      const baseline = simulateEarlierSlice(join(baseOut, 'report.json'), dir, ['DOCS-01', 'DOCS-03', 'SEC-09', 'SEC-10']);
      const r = await runCli(['scan', fixture, '--out', outDir, '--baseline', baseline, '--ratchet']);
      expect(r.code).toBe(0);
      const delta = readJson<{ verdict: { status: string; inputs: Array<{ name: string; matched: boolean }> }; headline: { movement: number; code_attributable: number; coverage_attributable: number } }>(join(outDir, 'report.delta.json'));
      expect(delta.verdict.status).toBe('comparable-with-coverage-change');
      expect(delta.verdict.inputs.find((i) => i.name === 'requested-indicators')!.matched).toBe(false);
      expect(delta.headline.coverage_attributable).toBe(delta.headline.movement);
      expect(delta.headline.code_attributable).toBe(0);
      expect(delta.headline.movement).not.toBe(0);
      expect(r.out[1]).toContain('ratchet:pass');
    } finally {
      cleanup(dir, outDir);
    }
  }, 120_000);
});

describe('8.3 an era bump refuses comparison and ratchet with no numbers printed', () => {
  it('exits 2, names the cause, and the delta line carries no numbers', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'leapscore-diff-base-'));
    const outDir = mkdtempSync(join(tmpdir(), 'leapscore-diff-out-'));
    try {
      const baseline = mutatedBaseline(join(baseOut, 'report.json'), dir, (env) => {
        env.meta.fingerprint_version = 1;
      });
      const r = await runCli(['scan', fixture, '--out', outDir, '--baseline', baseline, '--ratchet']);
      expect(r.code).toBe(2);
      expect(r.out[1]).toContain('delta:incomparable');
      expect(r.out[1]).not.toMatch(/\d/);
      expect(r.err.join('\n')).toMatch(/fingerprint-era-mismatch/);
      const delta = readJson<{ headline?: unknown }>(join(outDir, 'report.delta.json'));
      expect(delta.headline).toBeUndefined();
    } finally {
      cleanup(dir, outDir);
    }
  }, 120_000);
});

describe('8.4 a detector version bump excludes only the affected rows', () => {
  it('withholds that producer’s rows from code attribution and still compares the rest', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'leapscore-diff-base-'));
    const outDir = mkdtempSync(join(tmpdir(), 'leapscore-diff-out-'));
    try {
      const affected = baseEnv.report.full_table
        .filter((r) => r.evidence?.tool === 'adr-inventory' && (r.status === 'measured' || r.status === 'estimated'))
        .map((r) => r.id)
        .sort();
      const baseline = mutatedBaseline(join(baseOut, 'report.json'), dir, (env) => {
        for (const row of env.report.full_table) {
          if (row.evidence?.tool === 'adr-inventory') row.evidence.tool_version = '0.0';
        }
        // The bumped producer's row also moved, so a naive read would call it code.
        const row = env.report.full_table.find((r) => r.id === affected[0])!;
        row.score = (row.score ?? 0) + 1;
        recomputeHeadline(env);
      });
      const r = await runCli(['scan', fixture, '--out', outDir, '--baseline', baseline, '--ratchet']);
      expect(r.code).toBe(0);
      const delta = readJson<{
        verdict: { status: string; row_exclusions: { rows: string[] } };
        headline: { code_attributable: number; model_attributable: number };
        rows: Array<{ row: string; kind: string }>;
      }>(join(outDir, 'report.delta.json'));
      expect(delta.verdict.status).toBe('comparable-with-row-exclusions');
      expect(delta.verdict.row_exclusions.rows).toEqual(affected);
      const byId = new Map(delta.rows.map((row) => [row.row, row]));
      expect(byId.get(affected[0])!.kind).toBe('model-change');
      expect(delta.headline.code_attributable).toBe(0);
      expect(delta.headline.model_attributable).not.toBe(0);
      expect(r.out[1]).toContain('ratchet:pass');
    } finally {
      cleanup(dir, outDir);
    }
  }, 120_000);
});

describe('8.6 no funnel or envelope regression with a baseline supplied', () => {
  it('positioning line still closes the human-readable surfaces and every envelope stays readable', async () => {
    const outDir = mkdtempSync(join(tmpdir(), 'leapscore-diff-out-'));
    try {
      const r = await runCli(['scan', fixture, '--out', outDir, '--baseline', join(baseOut, 'report.json')]);
      expect(r.code).toBe(0);
      const html = readFileSync(join(outDir, 'report.html'), 'utf8');
      const md = readFileSync(join(outDir, 'report.md'), 'utf8');
      expect(html.trimEnd()).toMatch(/<p class="positioning">.*<\/p>\s*<\/body>\s*<\/html>$/s);
      expect(md.trimEnd().endsWith(POSITIONING_LINE)).toBe(true);
      // One tracked URL per artifact; the delta line adds none.
      expect(html.match(/utm_campaign=cli-scan-v1/g)).toHaveLength(1);
      expect(md.match(/utm_campaign=cli-scan-v1/g)).toHaveLength(1);
      expect(r.out[0].match(/utm_campaign=cli-scan-v1/g)).toHaveLength(1);
      expect(r.out[1]).not.toContain('utm_campaign');
      // Every existing envelope remains readable: this run's, the baseline's,
      // and the committed site fixture's.
      const siteFixture = fileURLToPath(new URL('../../../../site/lib/fixtures/django__django__506fc82__2026-08-12T000000-000Z.json', import.meta.url));
      for (const p of [join(outDir, 'report.json'), join(baseOut, 'report.json'), siteFixture]) {
        const env = readJson<StoredEnvelope>(p);
        expect(() => assertContractVersion(env)).not.toThrow();
        expect(env.report).toBeTruthy();
        expect(env.meta).toBeTruthy();
        expect(isDeltaDocument(env)).toBe(false);
      }
    } finally {
      cleanup(outDir);
    }
  }, 120_000);
});
