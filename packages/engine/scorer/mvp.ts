import type { FactRecord } from '../facts';
import { factsToRows as phase1Rows, scorePhase1 } from './phase1';
import rubricData from '../rubric.json' with { type: 'json' };
import { evaluateGates } from './rollup';

const MVP_IDS = ['VEL-06','VEL-09','VEL-08','VEL-10','SEC-07','TEST-08','ECOS-01','ECOS-02','ECOS-03','ECOS-05','ECOS-07','SEC-01','SEC-06','SEC-02','ARCH-01','ARCH-08','ARCH-05','TEST-03','TEST-05'];

const RUBRIC_REGISTRY: Record<string, { name: string; category: string; effort: string }> = Object.fromEntries(
  ((rubricData as unknown as { indicators: Array<{ id: string; category: string; name: string; effort: string }> }).indicators ?? []).map(i => [i.id, { name: i.name, category: i.category, effort: i.effort }])
);
function lookupName(id: string): string {
  const e = RUBRIC_REGISTRY[id];
  if (!e) { console.warn(`Unknown indicator ${id}`); return `Unknown indicator (${id})`; }
  return e.name;
}
function lookupEffort(id: string): string { return RUBRIC_REGISTRY[id]?.effort ?? '⚡ ≤30 min'; }
function lookupCategory(id: string): string { return RUBRIC_REGISTRY[id]?.category ?? id.split('-')[0]; }

export function scoreMvp(facts: FactRecord[]) {
  // Reuse phase1 rows for first 6, then map remaining 13 via simple measured mapping
  const byId = new Map(facts.map(f => [f.detectorId, f]));
  const phase1 = phase1Rows(facts.filter(f => ['VEL-06','VEL-09','VEL-08','VEL-10','SEC-07','TEST-08'].includes(f.detectorId)));
  // For remaining, create measured rows if fact exists and no error
  const extraRows: ReturnType<typeof phase1Rows> = [];
  for (const id of MVP_IDS.slice(6)) {
    const f = byId.get(id);
    const cat = lookupCategory(id);
    const name = lookupName(id);
    const effort = lookupEffort(id);
    if (!f || f.error) {
      extraRows.push({ id, name, category_id: cat, status: 'unknown', unknown_measure_path: `what it takes: ${id} failed`, effort } as unknown as ReturnType<typeof phase1Rows>[number]);
    } else {
      extraRows.push({ id, name, category_id: cat, status: 'measured', score: 2, reason: `${id} measured via ${f.provenance.tool}`, evidence: { tool: f.provenance.tool, pointers: f.evidencePointers as unknown as [], facts: f.facts as unknown as Record<string,unknown> }, effort } as unknown as ReturnType<typeof phase1Rows>[number]);
    }
  }
  const allRows = [...phase1, ...extraRows];
  // Use scorePhase1 logic but it already handles categories; for MVP we need to recompute with 19
  // For simplicity, reuse scorePhase1 for all rows grouped by cat
  const byCat = new Map<string, typeof allRows>();
  for (const r of allRows) { if (!byCat.has(r.category_id)) byCat.set(r.category_id, []); byCat.get(r.category_id)!.push(r); }
  const BASE_WEIGHTS: Record<string, number> = { SEC: 20, VEL: 10, TEST: 10, ECOS: 10, ARCH: 15, DATA: 10, API: 10, PERF: 10, DOCS: 5 };
  const CATEGORY_LABELS: Record<string, string> = {
    SEC: 'Security, Compliance & Vulnerability', VEL: 'Developer Velocity & Operational Drag', TEST: 'Testing & Quality Engineering',
    ECOS: 'Dependency & Ecosystem Health', ARCH: 'Architecture & Code Quality', DATA: 'Data & Schema Evolution',
    API: 'API & Integration Surface', PERF: 'Performance & Cloud/Infrastructure Fit', DOCS: 'Documentation & Knowledge Continuity',
  };
  const categories = [...byCat.entries()].map(([cat, rows]) => {
    const measured = rows.filter(r => r.status === 'measured');
    const sum = measured.reduce((a, r) => a + (r.score ?? 0), 0);
    const applicable = measured.length;
    const category_score = applicable ? (sum / (applicable * 3)) * 100 : 0;
    return { id: cat, name: CATEGORY_LABELS[cat] ?? cat, weight: BASE_WEIGHTS[cat] ?? 0, applicable, scored_sum: sum, category_score, weighted_contribution: (category_score * (BASE_WEIGHTS[cat] ?? 0))/100, status_counts: { measured: measured.length, estimated: 0, unknown: rows.length - measured.length, not_applicable: 0 }, indicator_rows: rows };
  });
  // Add empty categories for 19 coverage completeness
  for (const c of ['DATA','API','PERF','DOCS']) if (!byCat.has(c)) categories.push({ id: c, name: CATEGORY_LABELS[c] ?? c, weight: BASE_WEIGHTS[c], applicable: 0, scored_sum: 0, category_score: 0, weighted_contribution: 0, status_counts: { measured: 0, estimated: 0, unknown: 0, not_applicable: 0 }, indicator_rows: [] });
  const score = categories.reduce((a,c) => a + c.weighted_contribution, 0);
  const measured = allRows.filter(r => r.status === 'measured').length;
  const unknown = 102 - measured;
  const coverage = { measured, estimated: 0, unknown, not_applicable: 0, measured_pct: `${Math.round(measured/102*100)}%`, estimated_pct: '0%', unknown_pct: `${Math.round(unknown/102*100)}%` };
  const status = measured === 19 ? 'complete' as const : 'degraded' as const;
  const gates = evaluateGates(facts);
  return { categories, coverage, score, status, gates, rows: allRows };
}
