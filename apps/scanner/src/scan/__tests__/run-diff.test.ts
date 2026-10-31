/** baseline-diff comparable verdict + attribution verification — one test per task's verify clause.
 *
 *  Pure differ behavior (spec: run-diff): comparability verdict, row-wise
 *  comparison with transitions, kind taxonomy with precedence, headline
 *  decomposition with a disclosed residual, and the derived-never-sealed rules.
 */
import { describe, it, expect } from 'vitest';
import { computeDelta, formatDeltaLine, ratchetOutcome } from '../diff';
import { FINGERPRINT_VERSION } from '../scoring/fingerprint';
import { makeEnvelope, row } from './helpers/diff-fixtures';
import type { DeltaDocument, DeltaKind, DeltaTransition, ReportEnvelope } from '@leapscore/contracts';

const FROZEN = 'frozen';

describe('1.2 closed delta-kind and transition unions', () => {
  it('an unknown kind fails typechecking rather than being accepted as a string', () => {
    const scored: DeltaKind = 'scored-change';
    // @ts-expect-error — the kind vocabulary is a closed union; 'score-change' is not a kind
    const unknownKind: DeltaKind = 'score-change';
    expect(scored).toBe('scored-change');
    expect(unknownKind).toBe('score-change');
  });
  it('an unknown transition fails typechecking', () => {
    // @ts-expect-error — the transition vocabulary is a closed union; 'became-worse' is not a transition
    const unknownTransition: DeltaTransition = 'became-worse';
    expect(unknownTransition).toBe('became-worse');
  });
});

describe('1.3 the delta is not an envelope', () => {
  it('a delta document cannot be passed where an envelope is expected', () => {
    const takesEnvelope = (env: ReportEnvelope): ReportEnvelope => env;
    const delta = {} as DeltaDocument;
    // @ts-expect-error — a derived delta is not a sealed envelope (run-diff: delta is derived, never sealed)
    expect(takesEnvelope(delta)).toBe(delta);
  });
});

describe('3.1 subject matching refuses a cross-repo pair', () => {
  it('a cross-repo pair is incomparable with cause subject-mismatch and no score deltas', () => {
    const base = makeEnvelope({ subject: 'acme/app', rows: [row('ARCH-01', 'measured', 0)] });
    const cur = makeEnvelope({ subject: 'other/app', rows: [row('ARCH-01', 'measured', 3)] });
    const delta = computeDelta(base, cur);
    expect(delta.verdict.status).toBe('incomparable');
    expect(delta.verdict.cause).toBe('subject-mismatch');
    expect(delta.headline).toBeUndefined();
    expect(delta.rows).toEqual([]);
    expect(delta.transitions).toEqual([]);
    expect(JSON.stringify(delta)).not.toContain('score_delta');
    // The refusal still names; it never guesses between the two subjects.
    expect(delta.verdict.inputs.find((i) => i.name === 'subject')!.matched).toBe(false);
  });
});

describe('3.2 era and rubric-version checks yield their own named causes', () => {
  it('a fingerprint era bump is refused with fingerprint-era-mismatch', () => {
    // Cross-era fixture (release-packaging 1.4): a stored v2-era report vs the
    // current era — v2 fingerprints are never equated with v3.
    expect(FINGERPRINT_VERSION).toBe(3);
    const base = makeEnvelope({ fingerprintVersion: 2, rows: [row('ARCH-01', 'measured', 1)] });
    const cur = makeEnvelope({ fingerprintVersion: FINGERPRINT_VERSION, rows: [row('ARCH-01', 'measured', 2)] });
    const delta = computeDelta(base, cur);
    expect(delta.verdict.status).toBe('incomparable');
    expect(delta.verdict.cause).toBe('fingerprint-era-mismatch');
    expect(delta.headline).toBeUndefined();
    expect(delta.rows).toEqual([]);
  });
  it('a rubric-version change is refused with rubric-version-mismatch', () => {
    const base = makeEnvelope({ rubricVersion: 'docs/rubric@a', rows: [row('ARCH-01', 'measured', 1)] });
    const cur = makeEnvelope({ rubricVersion: 'docs/rubric@b', rows: [row('ARCH-01', 'measured', 2)] });
    const delta = computeDelta(base, cur);
    expect(delta.verdict.status).toBe('incomparable');
    expect(delta.verdict.cause).toBe('rubric-version-mismatch');
    expect(delta.rows).toEqual([]);
  });
});

describe('3.3 producer-version comparison withholds only that producer’s rows', () => {
  it('a single bumped detector yields comparable-with-row-exclusions affecting only its rows', () => {
    const weights = { ARCH: 50, SEC: 50 };
    const producer = (v: string) => ({ tool: 'adr-inventory', toolVersion: v });
    const base = makeEnvelope({
      weights,
      requested: ['ARCH-01', 'ARCH-02', 'SEC-01'],
      rows: [
        row('ARCH-01', 'measured', 1, producer('1.0')),
        row('ARCH-02', 'measured', 1, producer('1.0')),
        row('SEC-01', 'measured', 2, { tool: 'sec-scan', toolVersion: '1.0' }),
      ],
    });
    const cur = makeEnvelope({
      weights,
      requested: ['ARCH-01', 'ARCH-02', 'SEC-01'],
      rows: [
        row('ARCH-01', 'measured', 2, producer('1.1')), // bumped producer — withheld
        row('ARCH-02', 'measured', 1, producer('1.0')),
        row('SEC-01', 'measured', 1, { tool: 'sec-scan', toolVersion: '1.0' }),
      ],
    });
    const delta = computeDelta(base, cur);
    expect(delta.verdict.status).toBe('comparable-with-row-exclusions');
    expect(delta.verdict.row_exclusions!.rows).toEqual(['ARCH-01']);
    expect(delta.verdict.row_exclusions!.producers).toEqual([
      { tool: 'adr-inventory', baseline_version: '1.0', current_version: '1.1' },
    ]);
    const byId = new Map(delta.rows.map((r) => [r.row, r]));
    expect(byId.get('ARCH-01')!.kind).toBe('model-change');
    expect(byId.get('ARCH-02')).toBeUndefined(); // unchanged row: no difference reported
    expect(byId.get('SEC-01')!.kind).toBe('scored-change'); // other producer still compared
    expect(byId.get('SEC-01')!.score_delta).toBe(-1);
    // Code attribution excludes the bumped producer's row and keeps the other;
    // the withheld row is attributed to the model, not the target's code.
    expect(delta.headline!.code_attributable).toBeLessThan(0);
    expect(delta.headline!.model_attributable).toBeGreaterThan(0);
    expect(delta.headline!.attribution_notes.join(' ')).toMatch(/adr-inventory 1\.0→1\.1/);
  });
});

describe('3.4 engine-only difference does not block (D1)', () => {
  it('differing engine identity alone still yields comparable', () => {
    const base = makeEnvelope({ engineSha7: 'aaaaaaa', engineVersion: 'unified/1.0', rows: [row('ARCH-01', 'measured', 1)] });
    const cur = makeEnvelope({ engineSha7: 'bbbbbbb', engineVersion: 'unified/1.1', rows: [row('ARCH-01', 'measured', 1)] });
    const delta = computeDelta(base, cur);
    expect(delta.verdict.status).toBe('comparable');
    const engine = delta.verdict.inputs.find((i) => i.name === 'engine-identity')!;
    expect(engine.matched).toBe(false);
    expect(engine.detail).toContain('aaaaaaa');
    expect(engine.detail).toContain('bbbbbbb');
  });
});

describe('3.5 requested-set difference is a coverage change, not a blocker', () => {
  it('a grown requested set yields comparable-with-coverage-change and still compares shared rows', () => {
    const base = makeEnvelope({
      requested: ['ARCH-01', 'ARCH-02'],
      rows: [row('ARCH-01', 'measured', 1), row('ARCH-02', 'measured', 1)],
    });
    const cur = makeEnvelope({
      requested: ['ARCH-01', 'ARCH-02', 'ARCH-03'],
      rows: [row('ARCH-01', 'measured', 2), row('ARCH-02', 'measured', 1), row('ARCH-03', 'measured', 3)],
    });
    const delta = computeDelta(base, cur);
    expect(delta.verdict.status).toBe('comparable-with-coverage-change');
    const byId = new Map(delta.rows.map((r) => [r.row, r]));
    expect(byId.get('ARCH-01')!.kind).toBe('scored-change');
    expect(byId.get('ARCH-01')!.score_delta).toBe(1);
    // The newly requested row is a transition — never a score delta.
    expect(byId.get('ARCH-03')!.transition).toBe('became-implemented');
    expect(byId.get('ARCH-03')!.score_delta).toBeUndefined();
    expect(delta.verdict.inputs.find((i) => i.name === 'requested-indicators')!.matched).toBe(false);
  });
});

describe('3.6 identical inputs yield comparable and every verdict names its inputs', () => {
  const fingerprint = 'f'.repeat(64);
  it('identical fingerprints and matching inputs yield comparable with every input named', () => {
    const rows = [row('ARCH-01', 'measured', 1, { tool: 'adr-inventory', toolVersion: '1.0' })];
    const base = makeEnvelope({ rows, requested: ['ARCH-01'], fingerprint });
    const cur = makeEnvelope({ rows, requested: ['ARCH-01'], fingerprint });
    const delta = computeDelta(base, cur);
    expect(delta.verdict.status).toBe('comparable');
    const names = delta.verdict.inputs.map((i) => i.name).sort();
    expect(names).toEqual(['engine-identity', 'fingerprint-era', 'producer-versions', 'requested-indicators', 'rubric-version', 'score-policy', 'subject']);
    for (const i of delta.verdict.inputs) expect(i.matched, i.name).toBe(true);
  });
  it('a verdict names which inputs matched and which differed', () => {
    const base = makeEnvelope({ requested: ['ARCH-01'], scorePolicy: 'frozen', rows: [row('ARCH-01', 'measured', 1, { tool: 't', toolVersion: '1' })] });
    const cur = makeEnvelope({ requested: ['ARCH-01', 'ARCH-02'], scorePolicy: 'legacy', rows: [row('ARCH-01', 'measured', 1, { tool: 't', toolVersion: '1' })] });
    const delta = computeDelta(base, cur);
    expect(delta.verdict.status).toBe('comparable-with-coverage-change');
    const requested = delta.verdict.inputs.find((i) => i.name === 'requested-indicators')!;
    const policy = delta.verdict.inputs.find((i) => i.name === 'score-policy')!;
    expect(requested.matched).toBe(false);
    expect(policy.matched).toBe(false);
    expect(delta.verdict.inputs.find((i) => i.name === 'subject')!.matched).toBe(true);
  });
});

describe('4.1 only rows graded in both runs contribute score deltas', () => {
  it('a row graded in only one run is a transition and carries no score delta', () => {
    const base = makeEnvelope({ rows: [row('ARCH-01', 'measured', 1), row('ARCH-02', 'unknown')] });
    const cur = makeEnvelope({ rows: [row('ARCH-01', 'measured', 2), row('ARCH-02', 'measured', 3)] });
    const delta = computeDelta(base, cur);
    const byId = new Map(delta.rows.map((r) => [r.row, r]));
    expect(byId.get('ARCH-01')!.score_delta).toBe(1);
    expect(byId.get('ARCH-02')!.transition).toBe('became-graded');
    expect('score_delta' in byId.get('ARCH-02')!).toBe(false);
  });
});

describe('4.2 transition vocabulary is emitted instead of a score delta', () => {
  const cases: Array<{ id: string; from: 'unknown' | 'measured' | 'not_applicable' | 'not_implemented'; to: 'measured' | 'unknown' | 'not_applicable'; transition: DeltaTransition; kind: DeltaKind }> = [
    { id: 'P1', from: 'unknown', to: 'measured', transition: 'became-graded', kind: 'coverage-change' },
    { id: 'P2', from: 'measured', to: 'unknown', transition: 'became-ungraded', kind: 'coverage-change' },
    { id: 'P3', from: 'not_applicable', to: 'measured', transition: 'became-applicable', kind: 'applicability-change' },
    { id: 'P4', from: 'measured', to: 'not_applicable', transition: 'became-not-applicable', kind: 'applicability-change' },
    { id: 'P5', from: 'not_implemented', to: 'measured', transition: 'became-implemented', kind: 'implementation-change' },
  ];
  it('each transition case reports its transition and no score delta', () => {
    const base = makeEnvelope({ rows: cases.map((c) => row(c.id, c.from, c.from === 'measured' ? 2 : undefined)) });
    const cur = makeEnvelope({ rows: cases.map((c) => row(c.id, c.to, c.to === 'measured' ? 1 : undefined)) });
    const delta = computeDelta(base, cur);
    const byId = new Map(delta.rows.map((r) => [r.row, r]));
    for (const c of cases) {
      const diff = byId.get(c.id)!;
      expect(diff.transition, c.id).toBe(c.transition);
      expect(diff.kind, c.id).toBe(c.kind);
      expect('score_delta' in diff, c.id).toBe(false);
    }
    // The transition list mirrors the row differences.
    expect(delta.transitions.map((t) => `${t.row}:${t.transition}`).sort()).toEqual(cases.map((c) => `${c.id}:${c.transition}`).sort());
  });
});

describe('4.3 applicability transition carries its recorded reason', () => {
  it('a became-not-applicable transition carries the row’s reason and evidence pointers', () => {
    const base = makeEnvelope({ rows: [row('ARCH-06', 'measured', 1)] });
    const cur = makeEnvelope({
      rows: [
        row('ARCH-06', 'not_applicable', undefined, {
          reason: 'archetype changed to agent-skills — CLI entrypoint not applicable',
          pointers: [{ file: 'package.json', line: 3, detail: 'bin field present' }],
        }),
      ],
    });
    const delta = computeDelta(base, cur);
    const diff = delta.rows.find((r) => r.row === 'ARCH-06')!;
    expect(diff.transition).toBe('became-not-applicable');
    expect(diff.transition_reason).toMatch(/archetype changed/);
    expect(diff.transition_evidence).toEqual(['package.json:3 — bin field present']);
    const entry = delta.transitions.find((t) => t.row === 'ARCH-06')!;
    expect(entry.reason).toMatch(/archetype changed/);
    expect(entry.evidence).toEqual(['package.json:3 — bin field present']);
  });
});

describe('4.4 model-change takes precedence over scored-change', () => {
  it('a version bump classifies model-change even when the score moved', () => {
    const base = makeEnvelope({ rows: [row('ARCH-01', 'measured', 0, { tool: 'adr-inventory', toolVersion: '1.0' })] });
    const cur = makeEnvelope({ rows: [row('ARCH-01', 'measured', 3, { tool: 'adr-inventory', toolVersion: '1.1' })] });
    const delta = computeDelta(base, cur);
    const diff = delta.rows.find((r) => r.row === 'ARCH-01')!;
    expect(diff.kind).toBe('model-change');
    expect(diff.producer).toEqual({ tool: 'adr-inventory', from: '1.0', to: '1.1' });
    expect(delta.verdict.status).toBe('comparable-with-row-exclusions');
    // The moved score is excluded from code attribution entirely.
    expect(delta.headline!.code_attributable).toBe(0);
    expect(delta.headline!.model_attributable).toBe(3 * 100 / (3 * 1));
  });
});

describe('4.5 unknown→measured with an available producer is coverage, not code', () => {
  it('classifies coverage-change and never model-change or scored-change', () => {
    const base = makeEnvelope({ rows: [row('ARCH-01', 'unknown', undefined, { tool: 'adr-inventory', toolVersion: '1.0' })] });
    const cur = makeEnvelope({ rows: [row('ARCH-01', 'measured', 3, { tool: 'adr-inventory', toolVersion: '1.0' })] });
    const delta = computeDelta(base, cur);
    const diff = delta.rows.find((r) => r.row === 'ARCH-01')!;
    expect(diff.kind).toBe('coverage-change');
    expect(diff.transition).toBe('became-graded');
    expect(diff.score_delta).toBeUndefined();
    expect(delta.headline!.code_attributable).toBe(0);
    expect(delta.headline!.coverage_attributable).toBe(100);
  });
});

describe('4.6 decomposition parts sum to the headline movement', () => {
  it('code and coverage parts sum to the movement with zero residual', () => {
    // A measured row improved (code) while a previously unknown row became
    // measured (coverage): both parts move and must sum to the full movement.
    const base = makeEnvelope({ rows: [row('ARCH-01', 'measured', 0), row('ARCH-02', 'unknown')] });
    const cur = makeEnvelope({ rows: [row('ARCH-01', 'measured', 3), row('ARCH-02', 'measured', 3)] });
    const delta = computeDelta(base, cur);
    const h = delta.headline!;
    expect(h.movement).toBe(100);
    expect(h.code_attributable).toBe(50);
    expect(h.coverage_attributable).toBe(50);
    expect(h.model_attributable).toBe(0);
    expect(h.unattributable).toBe(0);
    expect(h.baseline + h.code_attributable + h.coverage_attributable + h.model_attributable + h.unattributable).toBeCloseTo(h.current, 2);
  });
});

describe('4.7 a coverage-driven rise states no code change was measured', () => {
  it('reports a zero code part with the explicit no-code-change statement', () => {
    const base = makeEnvelope({ rows: [row('ARCH-01', 'measured', 0), row('ARCH-02', 'unknown'), row('ARCH-03', 'unknown')] });
    const cur = makeEnvelope({ rows: [row('ARCH-01', 'measured', 0), row('ARCH-02', 'measured', 3), row('ARCH-03', 'measured', 3)] });
    const delta = computeDelta(base, cur);
    const h = delta.headline!;
    expect(h.movement).toBeGreaterThan(0);
    expect(h.code_attributable).toBe(0);
    expect(h.coverage_attributable).toBe(h.movement);
    expect(h.no_code_change_measured).toBe(true);
    expect(h.statement).toMatch(/no code change was measured/i);
    expect(formatDeltaLine(delta)).toContain('no-code-change');
  });
});

describe('4.8 a residual is disclosed as unattributable, never absorbed', () => {
  it('rounding the intermediates leaves the parts unadjusted and the remainder disclosed', () => {
    // The sealed baseline headline sits 0.01 below what the row arithmetic
    // recomputes (the shape a seal-time rounding can leave behind): the named
    // parts keep their values and the difference is disclosed, not folded in.
    const base = makeEnvelope({
      rows: [row('ARCH-01', 'measured', 0), row('ARCH-02', 'unknown')],
      score: 0.01,
    });
    const cur = makeEnvelope({ rows: [row('ARCH-01', 'measured', 2), row('ARCH-02', 'unknown')] });
    const delta = computeDelta(base, cur);
    const h = delta.headline!;
    expect(h.code_attributable).toBe(33.33);
    expect(h.coverage_attributable).toBe(0);
    expect(h.model_attributable).toBe(0);
    expect(h.movement).toBe(33.32);
    expect(h.unattributable).toBe(-0.01);
    expect(h.code_attributable + h.coverage_attributable + h.model_attributable).not.toBe(h.movement);
    expect(h.statement).toMatch(/unattributable/);
    expect(formatDeltaLine(delta)).toContain('unattributable:-0.01pp');
  });
});

describe('2.5 pre-field envelopes with no resolvable requested set refuse', () => {
  it('a table-less pre-field envelope yields missing-comparability-inputs rather than a guess', () => {
    const base = makeEnvelope({ rows: [row('ARCH-01', 'measured', 1)] });
    const bare = base as unknown as { report: { full_table?: unknown }; meta: { requested_indicators?: unknown } };
    delete bare.report.full_table;
    delete bare.meta.requested_indicators;
    const cur = makeEnvelope({ rows: [row('ARCH-01', 'measured', 1)] });
    const delta = computeDelta(base, cur);
    expect(delta.verdict.status).toBe('incomparable');
    expect(delta.verdict.cause).toBe('missing-comparability-inputs');
    expect(delta.verdict.inputs.find((i) => i.name === 'requested-indicators')!.matched).toBe(false);
    expect(delta.headline).toBeUndefined();
  });
});

describe('ratchet semantics over the decomposition', () => {
  it('a coverage-driven fall does not trip, a code fall beyond tolerance does', () => {
    // Coverage shrank (a measured row became ungraded) with no code regression:
    // movement is negative but code-attributable is zero.
    const covBase = makeEnvelope({ rows: [row('ARCH-01', 'measured', 3), row('ARCH-02', 'measured', 3)] });
    const covCur = makeEnvelope({ rows: [row('ARCH-01', 'measured', 3), row('ARCH-02', 'unknown')] });
    const covDelta = computeDelta(covBase, covCur);
    expect(covDelta.headline!.movement).toBeLessThan(0);
    expect(covDelta.headline!.code_attributable).toBe(0);
    expect(ratchetOutcome(covDelta, 0).tripped).toBe(false);

    // A graded row drops with unchanged producers: the code part falls and the
    // gate trips beyond its tolerance.
    const codeBase = makeEnvelope({ rows: [row('ARCH-01', 'measured', 3)] });
    const codeCur = makeEnvelope({ rows: [row('ARCH-01', 'measured', 1, { tool: 't', toolVersion: '1' })] });
    const codeDelta = computeDelta(codeBase, codeCur);
    expect(codeDelta.headline!.code_attributable).toBeLessThan(0);
    expect(ratchetOutcome(codeDelta, 0).tripped).toBe(true);
    expect(ratchetOutcome(codeDelta, 70).tripped).toBe(false);
  });
  it('an incomparable verdict refuses the ratchet naming the cause', () => {
    const base = makeEnvelope({ subject: 'acme/app', rows: [row('ARCH-01', 'measured', 1)] });
    const cur = makeEnvelope({ subject: 'other/app', rows: [row('ARCH-01', 'measured', 1)] });
    const outcome = ratchetOutcome(computeDelta(base, cur), 0);
    expect(outcome.tripped).toBe(false);
    expect(outcome.refused).toBe(true);
    expect(outcome.state).toBe('ratchet:refused(subject-mismatch)');
    expect(outcome.message).toContain('subject-mismatch');
    expect(formatDeltaLine(computeDelta(base, cur), { ratchetState: outcome.state })).not.toMatch(/\d/);
  });
});
