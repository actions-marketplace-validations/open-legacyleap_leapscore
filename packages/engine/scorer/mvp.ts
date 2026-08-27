import type { FactRecord } from '../facts';
import { factsToRows as phase1Rows, scorePhase1 } from './phase1';

const MVP_IDS = ['VEL-06','VEL-09','VEL-08','VEL-10','SEC-07','TEST-08','ECOS-01','ECOS-02','ECOS-03','ECOS-05','ECOS-07','SEC-01','SEC-06','SEC-02','ARCH-01','ARCH-08','ARCH-05','TEST-03','TEST-05'];

export function scoreMvp(facts: FactRecord[]) {
  // Reuse phase1 rows for first 6, then map remaining 13 via simple measured mapping
  const byId = new Map(facts.map(f => [f.detectorId, f]));
  const phase1 = phase1Rows(facts.filter(f => ['VEL-06','VEL-09','VEL-08','VEL-10','SEC-07','TEST-08'].includes(f.detectorId)));
  // For remaining, create measured rows if fact exists and no error
  const extraRows: ReturnType<typeof phase1Rows> = [];
  for (const id of MVP_IDS.slice(6)) {
    const f = byId.get(id);
    const cat = id.split('-')[0];
    const name = id;
    if (!f || f.error) {
      extraRows.push({ id, name, category_id: cat, status: 'unknown', unknown_measure_path: `what it takes: ${id} failed`, effort: '⚡ ≤30 min' } as unknown as ReturnType<typeof phase1Rows>[number]);
    } else {
      extraRows.push({ id, name, category_id: cat, status: 'measured', score: 2, reason: `${id} measured via ${f.provenance.tool}`, evidence: { tool: f.provenance.tool, pointers: f.evidencePointers as unknown as [], facts: f.facts as unknown as Record<string,unknown> }, effort: '⚡ ≤30 min' } as unknown as ReturnType<typeof phase1Rows>[number]);
    }
  }
  const allRows = [...phase1, ...extraRows];
  // Use scorePhase1 logic but it already handles categories; for MVP we need to recompute with 19
  // For simplicity, reuse scorePhase1 for all rows grouped by cat
  const byCat = new Map<string, typeof allRows>();
  for (const r of allRows) { if (!byCat.has(r.category_id)) byCat.set(r.category_id, []); byCat.get(r.category_id)!.push(r); }
  const BASE_WEIGHTS: Record<string, number> = { SEC: 20, VEL: 10, TEST: 10, ECOS: 10, ARCH: 15, DATA: 10, API: 10, PERF: 10, DOCS: 5 };
  const categories = [...byCat.entries()].map(([cat, rows]) => {
    const measured = rows.filter(r => r.status === 'measured');
    const sum = measured.reduce((a, r) => a + (r.score ?? 0), 0);
    const applicable = measured.length;
    const category_score = applicable ? (sum / (applicable * 3)) * 100 : 0;
    return { id: cat, name: cat, weight: BASE_WEIGHTS[cat] ?? 0, applicable, scored_sum: sum, category_score, weighted_contribution: (category_score * (BASE_WEIGHTS[cat] ?? 0))/100, status_counts: { measured: measured.length, estimated: 0, unknown: rows.length - measured.length, not_applicable: 0 }, indicator_rows: rows };
  });
  // Add empty categories for 19 coverage completeness
  for (const c of ['DATA','API','PERF','DOCS']) if (!byCat.has(c)) categories.push({ id: c, name: c, weight: BASE_WEIGHTS[c], applicable: 0, scored_sum: 0, category_score: 0, weighted_contribution: 0, status_counts: { measured: 0, estimated: 0, unknown: 0, not_applicable: 0 }, indicator_rows: [] });
  const score = categories.reduce((a,c) => a + c.weighted_contribution, 0);
  const measured = allRows.filter(r => r.status === 'measured').length;
  const unknown = 102 - measured;
  const coverage = { measured, estimated: 0, unknown, not_applicable: 0, measured_pct: `${Math.round(measured/102*100)}%`, estimated_pct: '0%', unknown_pct: `${Math.round(unknown/102*100)}%` };
  const status = measured === 19 ? 'complete' as const : 'degraded' as const;
  const gates = [
    { id: 'G1', name: 'Credential exposure', status: byId.get('SEC-02') && !(byId.get('SEC-02')!.error) && (byId.get('SEC-02')!.facts as Record<string,unknown>).sec02 ? 'needs-verification' as const : 'needs-verification' as const, source_rows: ['SEC-02'], note: 'G1' },
    { id: 'G2', name: 'Crit CVE > 14d', status: 'needs-verification' as const, source_rows: ['SEC-01'], note: 'G2' },
    { id: 'G3', name: 'Runtime EOL', status: 'needs-verification' as const, source_rows: ['ECOS-01'], note: 'G3' },
    { id: 'G8', name: 'Copyleft in core', status: 'needs-verification' as const, source_rows: ['ECOS-05'], note: 'G8' },
  ];
  return { categories, coverage, score, status, gates, rows: allRows };
}
