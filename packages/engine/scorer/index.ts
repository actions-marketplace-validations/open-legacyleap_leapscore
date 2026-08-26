/** engine/scorer/index.ts — pure Facts[] + RubricVersion -> Report (05 §7, 06:§2, Q6) */
// Steps: N/A (SPECS §1 na_when, exhaustive-only) -> status (SPECS §4 measured/estimated/unknown + clamp 1-2 + confidence) -> score predicates (SPECS §5) -> rollup (11:§2) -> gates (SPECS §6).
// estimated rows never 0/3; AI never measured (Q3). deep-dive fold B4. FE-active ×0.9. Views: standard vs measured-only (estimated->unknown re-rollup, 06:§6).
// Stub.

import type { FactRecord } from '../facts';
export type Report = { headline: { score: number; tier: string }; coverage: unknown; categories: unknown[]; gates: unknown[] };
export function score(_facts: FactRecord[], _rubricVersion: string): Report {
  return { headline: { score: 0, tier: 'unknown' }, coverage: {}, categories: [], gates: [] };
}
