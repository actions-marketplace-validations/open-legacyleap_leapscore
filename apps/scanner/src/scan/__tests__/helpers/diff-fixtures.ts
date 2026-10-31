/**
 * Shared fabricators for run-diff verification.
 *
 * Envelopes here are minimal but honest: rows carry category, status, score,
 * and producer identity; each category's weight and the sealed headline are
 * derived with the same arithmetic the differ recomputes (`headlineFromRows`),
 * so a fabricated pair behaves like two sealed runs for the differ's purposes.
 */
import { CONTRACT_VERSION, type ReportEnvelope, type RowStatus } from '@leapscore/contracts';
import { headlineFromRows, type DiffRow } from '../../diff';

export type RowSpec = {
  id: string;
  status: RowStatus;
  score?: number;
  /** Category id; defaults to ARCH. */
  category?: string;
  name?: string;
  /** Producing tool identity + version (per-row comparability input). */
  tool?: string;
  toolVersion?: string;
  reason?: string;
  pointers?: Array<{ file?: string; line?: number; detail?: string }>;
};

export type EnvelopeSpec = {
  rows: RowSpec[];
  /** Category weights; defaults to { ARCH: 100 }. */
  weights?: Record<string, number>;
  /** meta.repoSlug (subject identity); defaults to acme/app. */
  subject?: string;
  fingerprintVersion?: number;
  rubricVersion?: string;
  /** Omit to simulate a pre-field envelope (reconstruction path). */
  requested?: string[];
  scorePolicy?: string;
  engineSha7?: string;
  engineVersion?: string;
  /** Sealed headline; defaults to headlineFromRows over the rows. */
  score?: number;
  suppressed?: boolean;
  fingerprint?: string;
  runId?: string;
};

export function rowsOfSpec(spec: RowSpec[]): DiffRow[] {
  return spec.map((r) => ({
    id: r.id,
    name: r.name ?? r.id,
    category_id: r.category ?? 'ARCH',
    status: r.status,
    ...(r.score != null ? { score: r.score } : {}),
    ...(r.reason ? { reason: r.reason } : {}),
    evidence: {
      ...(r.tool ? { tool: r.tool } : {}),
      ...(r.toolVersion ? { tool_version: r.toolVersion } : {}),
      ...(r.pointers ? { pointers: r.pointers } : {}),
    },
  }));
}

export function makeEnvelope(spec: EnvelopeSpec): ReportEnvelope {
  const weights = spec.weights ?? { ARCH: 100 };
  const rows = rowsOfSpec(spec.rows);
  const policy = spec.scorePolicy ?? 'frozen';
  const cats = new Map<string, DiffRow[]>();
  for (const r of rows) {
    const c = String(r.category_id ?? '');
    if (!cats.has(c)) cats.set(c, []);
    cats.get(c)!.push(r);
  }
  const categories = [...cats.entries()].map(([id, rs]) => ({
    id,
    name: id,
    weight: weights[id] ?? 0,
    applicable: rs.length,
    indicator_rows: rs,
  }));
  const score = spec.score ?? headlineFromRows(rows, policy, weights);
  return {
    report: {
      headline: {
        score,
        tier: 'Moderate',
        score_policy: policy,
        ...(spec.suppressed ? { suppressed: true, verdict: 'insufficient-signal' } : {}),
      },
      categories,
      full_table: rows,
    },
    meta: {
      repo: spec.subject ?? 'acme/app',
      repoUrl: `https://github.com/${spec.subject ?? 'acme/app'}`,
      repoSlug: spec.subject ?? 'acme/app',
      engineSha7: spec.engineSha7 ?? 'abc1234',
      runId: spec.runId ?? 'acme__app__abc1234__2026-08-12T000000-000Z',
      ranAt: '2026-08-12T00:00:00.000Z',
      durationMs: 1,
      budgetMs: 60_000,
      repoSha: 'deadbeef',
      score,
      tier: 'Moderate',
      status: 'complete',
      engine_version: spec.engineVersion ?? 'unified/1.0',
      rubric_version: spec.rubricVersion ?? 'docs/rubric@test',
      filename: 'acme__app__abc1234__2026-08-12T000000-000Z.json',
      coverage: { measured: 0, estimated: 0, unknown: 0 },
      contractVersion: CONTRACT_VERSION,
      fingerprint_version: spec.fingerprintVersion ?? 2,
      ...(spec.fingerprint ? { score_fingerprint: spec.fingerprint } : {}),
      ...(spec.requested ? { requested_indicators: spec.requested } : {}),
      score_policy: policy,
    },
    trace: [],
    contractVersion: CONTRACT_VERSION,
  } as unknown as ReportEnvelope;
}

export const row = (id: string, status: RowStatus, score?: number, extra: Partial<RowSpec> = {}): RowSpec => ({
  id,
  status,
  ...(score != null ? { score } : {}),
  ...extra,
});
