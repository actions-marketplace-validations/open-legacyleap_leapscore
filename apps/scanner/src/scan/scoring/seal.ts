/** apps/scanner/src/scan/seal.ts — shared terminal composer (scanner service + workflow CLI) */
import { scoreMvp } from './scorer/mvp';
import { computeScoreFingerprint, FINGERPRINT_VERSION } from './fingerprint';
import { bandPathRegistryFromRubric, deriveNextBandPath } from './bandpath';
import type { FactRecord } from '../facts';
import rubricData from './rubric.json' with { type: 'json' };
// Single producer-owned contract: runId grammar, envelope, provenance.
import {
  CONTRACT_VERSION,
  normalizeRepoForSlug,
  repoSlugFromNormalized,
  repoSlugFromUrl,
  normalizeTs,
  buildRunId,
  resolveEngineSha7,
  tierForScore,
  tierLegacyFor,
  localSlugFromPath,
  assessmentUrlForBand,
  assessmentCtaForBand,
  formatBandPathClause,
  ASSESSMENT_BASE_URL,
  ASSESSMENT_CAMPAIGN,
  ALLOWED_NETWORK_HOSTS,
  NETWORK_NEVER_SEND_RULE,
  type NextBandPath,
  type Report as ContractReport,
  type EnvelopeMeta as ContractMeta,
  type TraceEntry as ContractTrace,
  type ReportEnvelope as ContractEnvelope,
} from '@leapscore/contracts';

export type SealTraceEntry = ContractTrace;
export type SealMeta = Omit<ContractMeta, 'contractVersion'> & { coverage?: unknown };
export type ReportEnvelope = ContractEnvelope;
export {
  CONTRACT_VERSION,
  normalizeRepoForSlug,
  repoSlugFromNormalized,
  repoSlugFromUrl,
  normalizeTs,
  buildRunId,
  resolveEngineSha7,
  tierForScore,
  tierLegacyFor,
  localSlugFromPath,
  assessmentUrlForBand,
  assessmentCtaForBand,
  ASSESSMENT_BASE_URL,
  ASSESSMENT_CAMPAIGN,
  ALLOWED_NETWORK_HOSTS,
  NETWORK_NEVER_SEND_RULE,
};

const ARCH_ALLOW = new Set(['library', 'service', 'cli', 'infra', 'docs', 'agent-skills', 'mixed', 'unknown']);

/** The requested indicator set recorded on `meta` (report-envelope:
 *  comparability inputs). A row is requested precisely when it is not
 *  `not_implemented` — the slice builds it and may grade it, mark it N/A, or
 *  leave it unknown — which is the same rule a differ applies when
 *  reconstructing a pre-field envelope (run-diff D3), so the recorded and the
 *  reconstructed set can never disagree. Derived from the sealed table, never
 *  from a static list. */
function requestedIndicatorsFromRows(rows: Array<{ id: string; status: string }>): string[] {
  return [...new Set(rows.filter((r) => r.status !== 'not_implemented').map((r) => r.id))].sort();
}

/** The runnable-producer manifest (report-envelope / detector-honesty 1.3):
 * every producer that produced a graded row's evidence, each with its version,
 * derived from the sealed rows themselves so it can never be a stale static list. */
function buildToolManifest(rows: Array<{ evidence?: { tool?: string; tool_version?: string } }>): Array<{ tool: string; version: string }> {
  const seen = new Map<string, string>();
  for (const r of rows) {
    const tool = r.evidence?.tool;
    if (!tool || seen.has(tool)) continue;
    seen.set(tool, r.evidence?.tool_version ?? '');
  }
  return [...seen.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([tool, version]) => ({ tool, version }));
}

function deriveTopBlockers(cats: unknown): Array<{ row: string; name: string; points_lost: number; weight_pp: string; summary: string; evidence_file?: string; rule?: string }> {
  const out: Array<{ row: string; name: string; points_lost: number; weight_pp: string; summary: string; evidence_file?: string; rule?: string }> = [];
  for (const c of cats as Array<{
    id: string; name: string; weight: number; applicable: number;
    indicator_rows: Array<{ id: string; name: string; status: string; not_applicable?: boolean; score?: number; reason?: string; evidence?: { tool?: string; pointers?: Array<{ file?: string; detail?: string }> } }>;
  }>) {
    if (!c.applicable) continue;
    const pointValue = ((100 * c.weight) / (3 * c.applicable)) / 100;
    for (const r of c.indicator_rows) {
      if (r.status === 'unknown' || r.not_applicable || r.score == null) continue;
      const lost = 3 - r.score;
      if (lost <= 0) continue;
      const firstPointer = r.evidence?.pointers?.[0];
      out.push({
        row: r.id,
        name: r.name,
        points_lost: lost,
        weight_pp: `${(lost * pointValue).toFixed(2)}pp`,
        summary: r.reason ?? '',
        evidence_file: firstPointer?.file ?? firstPointer?.detail,
        rule: r.evidence?.tool ?? r.id,
      });
    }
  }
  out.sort((a, b) => parseFloat(b.weight_pp) - parseFloat(a.weight_pp));
  return out.slice(0, 5);
}

function buildDeepDiveScope(mvpRows: Array<{ id: string; name: string; status: string; unknown_measure_path?: string }>): Array<{ row: string; name: string; what_it_takes: string }> {
  const rubric = rubricData as { indicators: Array<{ id: string; name: string }> };
  const known = new Set(mvpRows.map((r) => r.id));
  const unknownIndicators = rubric.indicators.filter((i) => !known.has(i.id));
  let scope = unknownIndicators.slice(0, 18).map((i) => ({ row: i.id, name: i.name, what_it_takes: 'Not run in this scan — deep-dive row' }));
  const unknownRows = mvpRows.filter((r) => r.status === 'unknown');
  if (unknownRows.length) {
    scope = unknownRows.slice(0, 18).map((r) => ({ row: r.id, name: r.name, what_it_takes: r.unknown_measure_path ?? 'Not run' }));
  }
  return scope;
}

export function truncateTrace(trace: SealTraceEntry[]): SealTraceEntry[] {
  if (trace.length <= 200) return trace;
  const sealIdx = trace.findIndex((t) => t.type === 'sealed');
  const sealEntry = sealIdx >= 0 ? trace[sealIdx] : null;
  const withoutSeal = sealIdx >= 0 ? trace.filter((_, i) => i !== sealIdx) : trace;
  const toDrop = withoutSeal.length - 199;
  const kept = withoutSeal.slice(toDrop);
  const sentinel: SealTraceEntry = {
    ts: kept[0]?.ts ?? 0,
    elapsedMs: kept[0]?.elapsedMs ?? 0,
    label: `… ${toDrop} earlier entries truncated`,
    phase: 'budget',
  };
  return sealEntry ? [sentinel, ...kept, sealEntry] : [sentinel, ...kept];
}

/** Single stdout composer. One line: status fields (score/band, gates, coverage,
 * threshold state when a threshold is set), then the compact next-band path
 * clause when the sealed report carries one, then the band-specific next-step
 * sentence and the tracked assessment URL as the final token — exactly once. */
export function formatStdout(
  report: { headline: { score: number; tier: string; suppressed?: boolean; verdict?: string }; gates: unknown[]; coverage: { measured: number; estimated: number; unknown: number }; next_band_path?: NextBandPath },
  opts: { thresholdState?: string } = {},
): string {
  const gates = report.gates as Array<{ status?: string }>;
  const fired = gates.filter((g) => g.status === 'fired' || (g as unknown as { fired?: boolean }).fired || (g as unknown as { status?: string }).status === 'proven').length;
  const unevaluable = gates.filter((g) => g.status === 'unevaluable').length;
  const gatePart = unevaluable ? `gates:${fired}/${report.gates.length} unevaluable:${unevaluable}/${report.gates.length}` : `gates:${fired}/${report.gates.length}`;
  const thresholdPart = opts.thresholdState ?? '';
  const coveragePart = `coverage:${report.coverage.measured}m/${report.coverage.estimated}e/${report.coverage.unknown}u`;
  // Band-path D7: the clause slots between the status fields and the band
  // sentence, so the funnel sentence and tracked URL keep their anchors.
  const pathPart = report.next_band_path ? ` ${formatBandPathClause(report.next_band_path, report.headline.tier)}` : '';
  const prefix = report.headline.suppressed
    ? `insufficient-signal ${gatePart} ${coveragePart}${thresholdPart}`
    : `${report.headline.score}/${report.headline.tier} ${gatePart} ${coveragePart}${thresholdPart}${pathPart}`;
  return `${prefix} — ${assessmentCtaForBand(report.headline.tier)} ${assessmentUrlForBand(report.headline.tier)}`;
}

export type SealInput = {
  facts: FactRecord[];
  snapshot: Record<string, unknown>;
  budgetMs: number;
  startMs: number;
  trace: SealTraceEntry[];
  archetypeOverride?: string | null;
  engineRef?: string;
  env?: Record<string, string | undefined>;
  execImpl?: (cmd: string) => string;
  scanId?: string;
  repo?: string;
  /** Local-subject overrides (spec: report-envelope runId grammar). */
  subjectSlug?: string;
  repoUrl?: string;
  /** Semantic flag joining the score fingerprint (deterministic-scoring 2.2). */
  strict?: boolean;
  /** Headline policy (4.2): frozen (default) or legacy escape hatch. Joins the fingerprint. */
  scorePolicy?: 'frozen' | 'legacy';
};

export type SealOutput = {
  report: ContractReport;
  meta: ContractMeta;
  traceToPersist: SealTraceEntry[];
  stdoutLine: string;
  durationMs: number;
  runId: string;
  repoSha: string;
};

/** Single terminal scoring — shared by website route and workflow CLI. */
export function sealScan(input: SealInput): SealOutput {
  const rawSnapshot = (input.snapshot ?? {}) as Record<string, unknown>;
  const arch = (rawSnapshot.archetype as string) ?? 'unknown';
  const plane = rawSnapshot.planeInventory as { has_server: boolean; has_data: boolean; has_deploy: boolean; has_client: boolean; has_test: boolean } | undefined;
  const effectiveArch =
    input.archetypeOverride && ARCH_ALLOW.has(input.archetypeOverride) ? input.archetypeOverride : arch;
  const mvp = scoreMvp(input.facts as never, { archetype: effectiveArch, planeInventory: plane });

  const snapSha = rawSnapshot.scanned_commit as string | undefined;
  const factSha = input.facts.find(
    (f) => (f as unknown as { commitSha?: string }).commitSha && (f as unknown as { commitSha: string }).commitSha !== 'unknown',
  );
  const repoSha =
    (snapSha && snapSha !== 'unknown' ? snapSha : (factSha as unknown as { commitSha?: string } | undefined)?.commitSha) ?? 'unknown';
  const normalizedRepo = String((rawSnapshot.repo as string) ?? input.repo ?? 'unknown/unknown');
  const scannedAt = String((rawSnapshot.scanned_at as string) ?? new Date().toISOString());

  const topBlockers = deriveTopBlockers(mvp.categories);
  const deepDiveScope = buildDeepDiveScope(mvp.rows as Array<{ id: string; name: string; status: string; unknown_measure_path?: string }>);
  // Score policy (4.2): legacy escape hatch seals the renormalized reference as
  // the headline; frozen (default) seals the frozen denominator.
  const policy = input.scorePolicy ?? 'frozen';
  const headlineScore = policy === 'legacy'
    ? Math.round((((mvp as unknown as { renormalized_score?: number }).renormalized_score ?? mvp.score)) * 100) / 100
    : Math.round(mvp.score * 100) / 100;
  const tier = tierForScore(headlineScore);
  const tierLegacy = tierLegacyFor(tier);

  // Derived next-band path (band-path D1): computed once, at seal time, so the
  // site views, CLI HTML/MD, and stdout all read the same sealed field. It is a
  // view over already-sealed rows and never feeds back into sealing.
  const nextBandPath = deriveNextBandPath({
    score: headlineScore,
    suppressed: (mvp as unknown as { suppressed?: boolean }).suppressed ?? false,
    categories: mvp.categories as never,
    rows: mvp.rows as never,
    registry: bandPathRegistryFromRubric(rubricData),
  });

  const report = {
    id: input.scanId ?? `ls_${Date.now().toString(36)}`,
    snapshot: {
      ...rawSnapshot,
      archetype: effectiveArch,
      scanned_commit: repoSha,
      repo: normalizedRepo,
      scanned_at: scannedAt,
      archetype_source: input.archetypeOverride ? 'override' : 'auto',
      archetype_override_from: input.archetypeOverride ? arch : undefined,
    },
    headline: {
      // Frozen denominator (3.1): unknowns disclosed as unscored. canonical_score
      // is the defined CI-gating number (--fail-under targets it); the legacy
      // renormalized value stays in JSON as reference only.
      score: headlineScore,
      canonical_score: headlineScore,
      renormalized_score: Math.round(((mvp as unknown as { renormalized_score?: number }).renormalized_score ?? mvp.score) * 100) / 100,
      score_policy: policy,
      suppressed: (mvp as unknown as { suppressed?: boolean }).suppressed ?? false,
      verdict: (mvp as unknown as { verdict?: string }).verdict,
      tier,
      tier_legacy: tierLegacy,
      ci_band: (mvp as unknown as { verdict?: string }).verdict === 'insufficient-signal' ? 'insufficient-signal' : mvp.status === 'complete' ? 'complete' : 'degraded',
    },
    categories: mvp.categories,
    coverage: mvp.coverage,
    status: mvp.status,
    gates: mvp.gates,
    provenance: {
      tool_manifest: buildToolManifest(mvp.rows as Array<{ evidence?: { tool?: string; tool_version?: string } }>),
      snapshot_versions: (rawSnapshot.snapshot_versions as Record<string, string> | undefined) ?? {},
    },
    top_blockers: topBlockers,
    deep_dive_scope: deepDiveScope,
    full_table: mvp.rows,
    // Derived view over the sealed rows; the key is absent (not empty) when the
    // headline was suppressed and there is no stated score to measure from.
    ...(nextBandPath ? { next_band_path: nextBandPath } : {}),
    report_schema: '1',
  } as unknown as SealOutput['report'];

  const trace: SealTraceEntry[] = [...input.trace];
  const pushTrace = (label: string, extra: Partial<SealTraceEntry> = {}) => {
    trace.push({ ts: Date.now() - input.startMs, elapsedMs: Date.now() - input.startMs, label, ...extra });
  };
  pushTrace('Scoring — gates evaluated', { type: 'scoring' });
  const sealedLabel = `Sealed — ${mvp.status} · ${mvp.coverage.measured}/${mvp.coverage.measured + mvp.coverage.unknown + mvp.coverage.estimated} measured`;
  pushTrace(sealedLabel, { type: 'sealed', pct: 100 });
  const traceToPersist = truncateTrace(trace);

  const repoSlug = input.subjectSlug ?? repoSlugFromUrl(normalizedRepo);
  const ts = normalizeTs(scannedAt);
  const engineSha7 = resolveEngineSha7({ env: input.env, engineRef: input.engineRef, execImpl: input.execImpl });
  const runId = buildRunId(repoSlug, engineSha7, ts);
  const durationMs = Date.now() - input.startMs;
  const engineVersion = (report.snapshot.engine_version as string) ?? 'unified/1.0';
  const rubricVersion = (report.snapshot.rubric_version as string) ?? 'docs/rubric@tranche-a';
  // Deterministic fingerprint (2.2): scored payload only — runId/scanned_at/durations excluded.
  const scoreFingerprint = computeScoreFingerprint({
    facts: input.facts,
    rubricVersion,
    engineVersion,
    engineSha7,
    snapshotVersions: (rawSnapshot.snapshot_versions as Record<string, unknown> | undefined) ?? {},
    strict: !!input.strict,
    indicatorSet: input.facts.map((f) => String((f as unknown as { detectorId?: string }).detectorId ?? '')),
    archetype: effectiveArch,
    scorePolicy: policy,
  });
  const meta: ContractMeta = {
    repo: normalizedRepo,
    repoUrl: input.repoUrl ?? `https://github.com/${normalizedRepo}`,
    repoSlug,
    engineSha7,
    runId,
    ranAt: scannedAt,
    durationMs,
    budgetMs: input.budgetMs,
    repoSha: String(repoSha),
    score: report.headline.score,
    tier: report.headline.tier,
    tier_legacy: tierLegacy,
    status: report.status as string,
    engine_version: engineVersion,
    rubric_version: rubricVersion,
    filename: `${runId}.json`,
    coverage: report.coverage as unknown as ContractMeta['coverage'],
    contractVersion: CONTRACT_VERSION,
    score_fingerprint: scoreFingerprint,
    fingerprint_version: FINGERPRINT_VERSION,
    // Comparability inputs (report-envelope): both are declared views of inputs
    // that already join the fingerprint (`indicator_set`, `score_policy`), so
    // recording them changes no fingerprint. Never `[]` for "unknown".
    requested_indicators: requestedIndicatorsFromRows(mvp.rows as Array<{ id: string; status: string }>),
    score_policy: policy,
  };

  return { report, meta, traceToPersist, stdoutLine: formatStdout(report as never), durationMs, runId, repoSha: String(repoSha) };
}
