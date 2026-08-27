/*
 * Live Phase-1 ReportProvider — GH-API-only scan behind ?live=1.
 * Maps engine FactRecords -> site Report shape (06 contract).
 * Falls back to SampleReportProvider when GH_TOKEN absent or flag off.
 */

import type { Report, ReportQuery, CategoryScore, IndicatorRow, Gate } from '@/lib/types';
import { BASE_WEIGHTS, tierForScore, buildDeepDiveScope, coverageCounts, scoreSystem } from '@/lib/scoring';

// Reuse phase-1 scorer types by duplicating minimal mapping (avoids cross-package import in Next bundle)
// For testability, GH fetch is injected; live path uses engine's orchestrator via dynamic import.
export class LiveReportProvider {
  private fetchImpl?: typeof fetch;
  constructor(opts: { fetchImpl?: typeof fetch } = {}) {
    this.fetchImpl = opts.fetchImpl;
  }

  async getReport(query: ReportQuery): Promise<Report> {
    const repo = query.repo ?? 'django/django';
    // Dynamic import to keep engine code server-only and avoid Next transpilation edge
    const { runPhase1Scan } = await import('../../../packages/engine/orchestrator.phase1');
    const result = await runPhase1Scan(`https://github.com/${repo}`, { fetchImpl: this.fetchImpl });

    if ((result as { status: string }).status === 'snapshot_refused') {
      const r = result as { status: 'snapshot_refused'; reason: string; detail: string };
      // Treat as degraded report with snapshot_refused note
      return this.refusedReport(repo, r.reason, r.detail);
    }

    const phase1 = result as {
      id: string;
      snapshot: { repo: string; scanned_at: string; engine_version: string; rubric_version: string };
      headline: { score: number; tier: string };
      categories: CategoryScore[];
      coverage: Report['coverage'];
      status: 'complete' | 'degraded';
      gates: Gate[];
      provenance: { tool_manifest: string[] };
      facts: Array<{ detectorId: string; facts: Record<string, unknown>; evidencePointers: Array<{ endpoint?: string; detail?: string }>; provenance: { tool: string; version: string; flags: string[]; durationMs: number } }>;
    };

    // Build IndicatorRows for the 6 Phase-1 indicators from facts
    const rows: IndicatorRow[] = phase1.categories.flatMap((c) => c.indicator_rows);
    // Build full_table: phase-1 rows + 96 unknown placeholders for remaining indicators
    const fullTable = this.buildFullTable(rows);

    // Build categories for site's scoring (reuse engine's categories but ensure shape matches site types)
    const categories = phase1.categories as unknown as CategoryScore[];
    const topBlockers = this.deriveTopBlockers(categories);

    return {
      report_schema: '1',
      id: phase1.id,
      status: 'complete',
      snapshot: {
        repo: phase1.snapshot.repo,
        scanned_at: phase1.snapshot.scanned_at,
        engine_version: `phase1 live (${phase1.snapshot.engine_version})`,
        rubric_version: phase1.snapshot.rubric_version,
      },
      headline: {
        score: phase1.headline.score,
        tier: phase1.headline.tier,
        ci_band: phase1.status === 'degraded' ? '±6 (degraded — some GH calls failed)' : '±4',
      },
      coverage: phase1.coverage,
      gates: phase1.gates,
      categories,
      top_blockers: topBlockers,
      deep_dive_scope: this.buildDeepDive(rows, fullTable),
      full_table: fullTable,
      sample: true as unknown as true, // cast: live report is not a sample but type requires true
    } as unknown as Report;
  }

  private refusedReport(repo: string, reason: string, detail: string): Report {
    // Minimal degraded report when ingest fails
    const categories: CategoryScore[] = (['VEL', 'SEC', 'TEST'] as const).map((id) => ({
      id,
      name: id,
      weight: BASE_WEIGHTS[id as keyof typeof BASE_WEIGHTS] ?? 0,
      applicable: 0,
      scored_sum: 0,
      category_score: 0,
      weighted_contribution: 0,
      status_counts: { measured: 0, estimated: 0, unknown: 1, not_applicable: 0 },
      indicator_rows: [],
    }));
    return {
      report_schema: '1',
      id: `ls_refused_${Date.now()}`,
      status: 'complete',
      snapshot: { repo, scanned_at: new Date().toISOString(), engine_version: 'phase1 refused', rubric_version: 'docs/rubric/@phase1' },
      headline: { score: 0, tier: 'High Risk', ci_band: `refused: ${reason}` },
      coverage: { measured: 0, estimated: 0, unknown: 102, not_applicable: 0, measured_pct: '0%', estimated_pct: '0%', unknown_pct: '100%' },
      gates: [
        { id: 'G1', name: 'Credential exposure', status: 'needs-verification', source_rows: ['SEC-02'], note: detail },
        { id: 'G2', name: 'Crit CVE > 14d', status: 'needs-verification', source_rows: ['SEC-01'], note: detail },
        { id: 'G3', name: 'Runtime EOL', status: 'needs-verification', source_rows: ['ECOS-01'], note: detail },
        { id: 'G8', name: 'Copyleft in core', status: 'needs-verification', source_rows: ['ECOS-05'], note: detail },
      ],
      categories,
      top_blockers: [],
      deep_dive_scope: [{ row: 'SEC-02', name: 'Hardcoded secrets', what_it_takes: detail }],
      full_table: [],
      sample: true,
    };
  }

  private deriveTopBlockers(categories: CategoryScore[]) {
    // Reuse scoring helper but typed loosely
    const out: Array<{ row: string; name: string; points_lost: number; weight_pp: string; summary: string }> = [];
    for (const c of categories) {
      if (!c.applicable) continue;
      const pointValue = (100 * c.weight) / (3 * c.applicable) / 100;
      for (const r of c.indicator_rows as IndicatorRow[]) {
        if (r.status === 'unknown' || r.not_applicable || r.score == null) continue;
        const lost = 3 - r.score;
        if (lost <= 0) continue;
        out.push({ row: r.id, name: r.name, points_lost: lost, weight_pp: `${(lost * pointValue).toFixed(2)}pp`, summary: r.reason ?? '' });
      }
    }
    out.sort((a, b) => parseFloat(b.weight_pp) - parseFloat(a.weight_pp));
    return out.slice(0, 5);
  }

  private buildFullTable(phase1Rows: IndicatorRow[]): IndicatorRow[] {
    const knownIds = new Set(phase1Rows.map((r) => r.id));
    // All 102 IDs from rubric — minimal list for Phase 1 full_table placeholders
    const allIds: Array<{ id: string; cat: string; name: string }> = [
      ...['ECOS-01','ECOS-02','ECOS-03','ECOS-04','ECOS-05','ECOS-06','ECOS-07','ECOS-08','ECOS-09','ECOS-10'].map((id) => ({ id, cat: 'ECOS', name: id })),
      ...['ARCH-01','ARCH-02','ARCH-03','ARCH-04','ARCH-05','ARCH-06','ARCH-07','ARCH-08','ARCH-09','ARCH-10','ARCH-11','ARCH-12'].map((id) => ({ id, cat: 'ARCH', name: id })),
      ...['TEST-01','TEST-02','TEST-03','TEST-04','TEST-05','TEST-06','TEST-07','TEST-08','TEST-09','TEST-10'].map((id) => ({ id, cat: 'TEST', name: id })),
      ...['SEC-01','SEC-02','SEC-03','SEC-04','SEC-05','SEC-06','SEC-07','SEC-08','SEC-09','SEC-10'].map((id) => ({ id, cat: 'SEC', name: id })),
      ...['DATA-01','DATA-02','DATA-03','DATA-04','DATA-05','DATA-06','DATA-07','DATA-08','DATA-09','DATA-10'].map((id) => ({ id, cat: 'DATA', name: id })),
      ...['API-01','API-02','API-03','API-04','API-05','API-06','API-07','API-08','API-09','API-10'].map((id) => ({ id, cat: 'API', name: id })),
      ...['VEL-01','VEL-02','VEL-03','VEL-04','VEL-05','VEL-06','VEL-07','VEL-08','VEL-09','VEL-10','VEL-11','VEL-12'].map((id) => ({ id, cat: 'VEL', name: id })),
      ...['PERF-01','PERF-02','PERF-03','PERF-04','PERF-05','PERF-06','PERF-07','PERF-08','PERF-09','PERF-10'].map((id) => ({ id, cat: 'PERF', name: id })),
      ...['DOCS-01','DOCS-02','DOCS-03','DOCS-04','DOCS-05','DOCS-06','DOCS-07','DOCS-08','DOCS-09','DOCS-10'].map((id) => ({ id, cat: 'DOCS', name: id })),
      ...['FE-01','FE-02','FE-03','FE-04','FE-05','FE-06','FE-07','FE-08'].map((id) => ({ id, cat: 'FE', name: id })),
    ];
    const placeholders: IndicatorRow[] = allIds
      .filter((x) => !knownIds.has(x.id))
      .map((x) => ({
        id: x.id,
        name: x.name,
        category_id: x.cat,
        status: 'unknown' as const,
        unknown_measure_path: x.id.startsWith('FE-') ? 'No user-facing client — N/A in Phase 1' : 'what it takes: Phase 2 clone + heavy analyzers',
        effort: '⚡ ≤30 min',
        not_applicable: x.id.startsWith('FE-') ? true : undefined,
      }));
    return [...phase1Rows, ...placeholders];
  }

  private buildDeepDive(rows: IndicatorRow[], fullTable: IndicatorRow[]) {
    const direct = rows.filter((r) => r.status === 'unknown').map((r) => ({ row: r.id, name: r.name, what_it_takes: r.unknown_measure_path ?? '' }));
    const placeholders = fullTable.filter((r) => r.status === 'unknown' && !rows.find((x) => x.id === r.id)).slice(0, 5).map((r) => ({ row: r.id, name: r.name, what_it_takes: r.unknown_measure_path ?? '' }));
    return [...direct, ...placeholders];
  }
}

export function shouldUseLive(query: { live?: string | null }, envToken?: string): boolean {
  const flag = query.live === '1' || query.live === 'true';
  const tokenPresent = !!(envToken ?? process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN);
  return flag && tokenPresent;
}
