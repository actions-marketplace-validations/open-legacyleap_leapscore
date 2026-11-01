/** scanner/scan/scoring/scorer/index.ts — pure Facts[] + RubricVersion -> Report (05 §7, 06:§2, Q6) */
// Steps: N/A (unified indicator §5 na_when, exhaustive-only) -> status (unified indicator §8 measured/estimated/unknown + clamp 1-2 + confidence) -> score predicates (unified indicator §8) -> rollup (11:§2) -> gates (unified indicator §9).
// estimated rows never 0/3; AI never measured (Q3). deep-dive fold B4. FE-active ×0.9. Views: standard vs measured-only (estimated->unknown re-rollup, 06:§6).
// Stub.

import type { FactRecord } from '../../facts';
import type { Report as ContractReport } from '@leapscore/contracts';
export type Report = ContractReport;
export function score(_facts: FactRecord[], _rubricVersion: string): Report {
  return {
    report_schema: '1',
    id: 'ls_stub',
    status: 'degraded',
    snapshot: { repo: 'unknown/unknown', scanned_at: new Date().toISOString(), engine_version: 'stub', rubric_version: _rubricVersion },
    headline: { score: 0, tier: 'unknown', ci_band: 'stub' },
    coverage: { measured: 0, estimated: 0, unknown: 0, not_applicable: 0, measured_pct: '0%', estimated_pct: '0%', unknown_pct: '0%' },
    gates: [],
    categories: [],
    top_blockers: [],
    deep_dive_scope: [],
    full_table: [],
  };
}
