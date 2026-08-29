/*
 * Live Phase-1 ReportProvider — GH-API-only scan behind ?live=1.
 * Maps engine FactRecords -> site Report shape (06 contract).
 * Falls back to SampleReportProvider when GH_TOKEN absent or flag off.
 */

import type { Report, ReportQuery, CategoryScore, IndicatorRow, Gate } from '@/lib/types';
import { BASE_WEIGHTS, tierForScore, buildDeepDiveScope, coverageCounts, scoreSystem } from '@/lib/scoring';
import { INDICATOR_REGISTRY, getIndicatorName, getIndicatorEffort } from '@/lib/generated/rubric';

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

    // Build IndicatorRows for the 6 Phase-1 indicators from facts — normalize to registry titles
    const rawRows: IndicatorRow[] = phase1.categories.flatMap((c) => c.indicator_rows);
    // Normalize engine rows to registry (engine may emit short/legacy names for GH-only scan)
    const rows: IndicatorRow[] = rawRows.map((r) => {
      const reg = INDICATOR_REGISTRY[r.id];
      if (!reg) { console.warn(`Unknown indicator ${r.id}`); return { ...r, name: `Unknown indicator (${r.id})` }; }
      return { ...r, name: reg.name, effort: reg.effort, category_id: reg.category };
    });
    // Build full_table: phase-1 rows + 96 unknown placeholders for remaining indicators
    const fullTable = this.buildFullTable(rows);

    // Build categories for site's scoring (reuse engine's categories but ensure shape matches site types + normalize row names)
    const categories = (phase1.categories as unknown as CategoryScore[]).map((c) => ({
      ...c,
      indicator_rows: c.indicator_rows.map((r) => {
        const reg = INDICATOR_REGISTRY[r.id];
        if (!reg) return { ...r, name: `Unknown indicator (${r.id})` } as IndicatorRow;
        return { ...r, name: reg.name, effort: reg.effort, category_id: reg.category } as IndicatorRow;
      }),
    }));
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
    const out: Array<{ row: string; name: string; points_lost: number; weight_pp: string; summary: string }> = [];
    for (const c of categories) {
      if (!c.applicable) continue;
      const pointValue = (100 * c.weight) / (3 * c.applicable) / 100;
      for (const r of c.indicator_rows as IndicatorRow[]) {
        if (r.status === 'unknown' || r.not_applicable || r.score == null) continue;
        const lost = 3 - r.score;
        if (lost <= 0) continue;
        const name = INDICATOR_REGISTRY[r.id]?.name ?? r.name;
        out.push({ row: r.id, name, points_lost: lost, weight_pp: `${(lost * pointValue).toFixed(2)}pp`, summary: r.reason ?? '' });
      }
    }
    out.sort((a, b) => parseFloat(b.weight_pp) - parseFloat(a.weight_pp));
    return out.slice(0, 5);
  }

  private buildFullTable(phase1Rows: IndicatorRow[]): IndicatorRow[] {
    const knownIds = new Set(phase1Rows.map((r) => r.id));
    const placeholders: IndicatorRow[] = Object.values(INDICATOR_REGISTRY)
      .filter((meta) => !knownIds.has(meta.id))
      .map((meta) => ({
        id: meta.id,
        name: getIndicatorName(meta.id),
        category_id: meta.category,
        status: 'unknown' as const,
        unknown_measure_path: meta.id.startsWith('FE-') ? 'No user-facing client — N/A in Phase 1' : 'what it takes: Phase 2 clone + heavy analyzers',
        effort: getIndicatorEffort(meta.id),
        not_applicable: meta.id.startsWith('FE-') ? true : undefined,
      }));
    // Normalize known rows to registry names/effort as well (fact-passthrough may carry stale/short names)
    const normalizedKnown: IndicatorRow[] = phase1Rows.map((r) => {
      const reg = INDICATOR_REGISTRY[r.id];
      if (!reg) {
        console.warn(`Unknown indicator ${r.id}`);
        return { ...r, name: `Unknown indicator (${r.id})` };
      }
      return { ...r, name: reg.name, effort: reg.effort, category_id: reg.category };
    });
    return [...normalizedKnown, ...placeholders];
  }

  private buildDeepDive(rows: IndicatorRow[], fullTable: IndicatorRow[]) {
    const direct = rows.filter((r) => r.status === 'unknown').map((r) => ({ row: r.id, name: INDICATOR_REGISTRY[r.id]?.name ?? r.name, what_it_takes: r.unknown_measure_path ?? '' }));
    const placeholders = fullTable.filter((r) => r.status === 'unknown' && !rows.find((x) => x.id === r.id)).slice(0, 5).map((r) => ({ row: r.id, name: INDICATOR_REGISTRY[r.id]?.name ?? r.name, what_it_takes: r.unknown_measure_path ?? '' }));
    return [...direct, ...placeholders];
  }
}

export function shouldUseLive(query: { live?: string | null }, envToken?: string): boolean {
  const flag = query.live === '1' || query.live === 'true';
  const tokenPresent = !!(envToken ?? process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN);
  return flag && tokenPresent;
}
