/** packages/engine/seal.ts — shared terminal composer (website route + workflow CLI) */
import { execSync } from 'node:child_process';
import { scoreMvp } from './scorer/mvp';
import type { FactRecord } from './facts';
import rubricData from './rubric.json' with { type: 'json' };

export type SealTraceEntry = {
  ts: number;
  label: string;
  type?: string;
  pct?: number;
  elapsedMs?: number;
  remainingMs?: number;
  completedIds?: string[];
  phase?: string;
  detectorId?: string;
  durationMs?: number;
  status?: string;
  errorKind?: string;
};

export type SealMeta = {
  repo: string;
  repoUrl: string;
  repoSlug: string;
  engineSha7: string;
  runId: string;
  ranAt: string;
  durationMs: number;
  budgetMs: number;
  repoSha: string;
  score: number;
  tier: string;
  status: string;
  engine_version: string;
  rubric_version: string;
  filename: string;
  coverage?: unknown;
};

// --- runId grammar (mirrors apps/site/lib/reports.ts; duplicated so CLI has no site dep) ---

export function normalizeRepoForSlug(raw: string | null | undefined): string {
  if (!raw) return 'django/django';
  const cleaned = raw
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/^github\.com\//i, '')
    .replace(/\.git$/i, '');
  const withoutQuery = cleaned.split(/[?#]/)[0];
  const parts = withoutQuery.split('/').filter(Boolean);
  if (parts.length < 2) return 'django/django';
  const owner = parts[0];
  const repo = parts[1];
  if (!owner || !repo) return 'django/django';
  return `${owner}/${repo}`;
}

export function repoSlugFromNormalized(normalized: string): string {
  const lower = normalized.toLowerCase();
  const [owner, repo] = lower.split('/');
  if (!owner || !repo) return 'unknown__unknown';
  return `${owner}__${repo}`;
}

export function repoSlugFromUrl(raw: string | null | undefined): string {
  return repoSlugFromNormalized(normalizeRepoForSlug(raw));
}

export function normalizeTs(iso: string): string {
  return iso.replace(/:/g, '').replace('.', '-');
}

export function buildRunId(repoSlug: string, engineSha7: string, ts: string): string {
  const safeEngine = engineSha7 && engineSha7.trim() ? engineSha7.trim().slice(0, 7) : 'unknown';
  return `${repoSlug}__${safeEngine}__${ts}`;
}

export function resolveEngineSha7(opts: {
  env?: NodeJS.ProcessEnv;
  engineRef?: string;
  execImpl?: (cmd: string) => string;
} = {}): string {
  const env = opts.env ?? process.env;
  const cands = [env.LEAPSCORE_SHA, opts.engineRef, env.LEAPSCORE_ENGINE_REF, env.VERCEL_GIT_COMMIT_SHA];
  for (const c of cands) {
    if (c && String(c).trim()) return String(c).trim().slice(0, 7);
  }
  try {
    const exec = opts.execImpl ?? ((cmd: string) => execSync(cmd, { encoding: 'utf8', timeout: 1500, stdio: ['ignore', 'pipe', 'ignore'] }).trim());
    const out = exec('git rev-parse --short HEAD');
    if (out && out.trim()) return out.trim().slice(0, 7);
  } catch {
    // ignore
  }
  return 'unknown';
}

export function tierForScore(score: number): string {
  return score >= 80 ? 'Healthy' : score >= 53 ? 'Moderate' : score >= 27 ? 'High Risk' : 'Critical';
}

const ARCH_ALLOW = new Set(['library', 'service', 'cli', 'infra', 'docs', 'agent-skills', 'mixed', 'unknown']);

function deriveTopBlockers(cats: unknown): Array<{ row: string; name: string; points_lost: number; weight_pp: string; summary: string }> {
  const out: Array<{ row: string; name: string; points_lost: number; weight_pp: string; summary: string }> = [];
  for (const c of cats as Array<{
    id: string; name: string; weight: number; applicable: number;
    indicator_rows: Array<{ id: string; name: string; status: string; not_applicable?: boolean; score?: number; reason?: string }>;
  }>) {
    if (!c.applicable) continue;
    const pointValue = ((100 * c.weight) / (3 * c.applicable)) / 100;
    for (const r of c.indicator_rows) {
      if (r.status === 'unknown' || r.not_applicable || r.score == null) continue;
      const lost = 3 - r.score;
      if (lost <= 0) continue;
      out.push({ row: r.id, name: r.name, points_lost: lost, weight_pp: `${(lost * pointValue).toFixed(2)}pp`, summary: r.reason ?? '' });
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

export function formatStdout(report: { headline: { score: number; tier: string }; gates: unknown[]; coverage: { measured: number; estimated: number; unknown: number } }): string {
  const fired = (report.gates as Array<{ status?: string }>).filter((g) => g.status === 'fired' || (g as unknown as { fired?: boolean }).fired).length;
  return `${report.headline.score}/${report.headline.tier} gates:${fired}/${report.gates.length} coverage:${report.coverage.measured}m/${report.coverage.estimated}e/${report.coverage.unknown}u`;
}

export type SealInput = {
  facts: FactRecord[];
  snapshot: Record<string, unknown>;
  budgetMs: number;
  startMs: number;
  trace: SealTraceEntry[];
  archetypeOverride?: string | null;
  engineRef?: string;
  env?: NodeJS.ProcessEnv;
  execImpl?: (cmd: string) => string;
  scanId?: string;
  repo?: string;
};

export type SealOutput = {
  report: Record<string, unknown> & {
    headline: { score: number; canonical_score: number; tier: string; ci_band: string };
    snapshot: Record<string, unknown>;
  };
  meta: SealMeta;
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
      score: Math.round(mvp.score * 100) / 100,
      canonical_score: Math.round(((mvp as unknown as { canonical_score?: number }).canonical_score ?? mvp.score) * 100) / 100,
      tier: tierForScore(mvp.score),
      ci_band: mvp.status === 'complete' ? 'complete' : 'degraded',
    },
    categories: mvp.categories,
    coverage: mvp.coverage,
    status: mvp.status,
    gates: mvp.gates,
    provenance: { tool_manifest: [] },
    top_blockers: topBlockers,
    deep_dive_scope: deepDiveScope,
    full_table: mvp.rows,
    report_schema: '1',
    sample: true,
  } as SealOutput['report'];

  const trace: SealTraceEntry[] = [...input.trace];
  const pushTrace = (label: string, extra: Partial<SealTraceEntry> = {}) => {
    trace.push({ ts: Date.now() - input.startMs, elapsedMs: Date.now() - input.startMs, label, ...extra });
  };
  pushTrace('Scoring — gates evaluated', { type: 'scoring' });
  const sealedLabel = `Sealed — ${mvp.status} · ${mvp.coverage.measured}/${mvp.coverage.measured + mvp.coverage.unknown + mvp.coverage.estimated} measured`;
  pushTrace(sealedLabel, { type: 'sealed', pct: 100 });
  const traceToPersist = truncateTrace(trace);

  const repoSlug = repoSlugFromUrl(normalizedRepo);
  const ts = normalizeTs(scannedAt);
  const engineSha7 = resolveEngineSha7({ env: input.env, engineRef: input.engineRef });
  const runId = buildRunId(repoSlug, engineSha7, ts);
  const durationMs = Date.now() - input.startMs;
  const meta: SealMeta = {
    repo: normalizedRepo,
    repoUrl: `https://github.com/${normalizedRepo}`,
    repoSlug,
    engineSha7,
    runId,
    ranAt: scannedAt,
    durationMs,
    budgetMs: input.budgetMs,
    repoSha: String(repoSha),
    score: report.headline.score,
    tier: report.headline.tier,
    status: report.status as string,
    engine_version: (report.snapshot.engine_version as string) ?? 'unified/1.0',
    rubric_version: (report.snapshot.rubric_version as string) ?? 'docs/rubric@tranche-a',
    filename: `${runId}.json`,
    coverage: report.coverage as unknown,
  };

  return { report, meta, traceToPersist, stdoutLine: formatStdout(report as never), durationMs, runId, repoSha: String(repoSha) };
}
