/** engine/facts.ts — FactRecord envelope + validation (05 §6, Q5) */
import type { IndicatorId, RawFact } from './detector';

export type FactRecord = RawFact & {
  id: IndicatorId;
  root: string; // path-scoped fan-out (Q4)
};

// Validate facts against packages/detectors/<ID>/schema.json at emission + replay.
// Detector must not emit score/status/confidence — scorer owns those (SPECS §4/§5).
export function validateFact(record: FactRecord, schema: unknown): { ok: boolean; errors?: string[] } {
  // stub — wiring point for zod/json-schema; real impl loads packages/detectors/<ID>/schema.json
  void record; void schema;
  return { ok: true };
}
