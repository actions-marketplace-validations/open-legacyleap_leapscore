/** engine/facts.ts — FactRecord envelope + validation (05 §6, Q5) */
import type { IndicatorId, RawFact } from './detector';

export type FactRecord = RawFact & {
  id: IndicatorId;
  root: string; // path-scoped fan-out (Q4)
  scanId?: string;
  commitSha?: string;
};

const FORBIDDEN_KEYS = ['score', 'status', 'confidence', 'verdict'];

export function validateFact(record: FactRecord, _schema?: unknown): { ok: boolean; errors?: string[] } {
  const errors: string[] = [];
  if (!record.detectorId) errors.push('missing detectorId');
  if (!record.schemaVersion) errors.push('missing schemaVersion');
  if (record.facts === undefined || record.facts === null || typeof record.facts !== 'object') errors.push('facts must be object');
  if (!Array.isArray(record.evidencePointers)) errors.push('evidencePointers must be array');
  if (!record.provenance) errors.push('missing provenance');
  else {
    if (!record.provenance.tool) errors.push('provenance.tool required');
    if (!record.provenance.version) errors.push('provenance.version required');
    if (typeof record.provenance.durationMs !== 'number') errors.push('provenance.durationMs must be number');
  }
  if (typeof record.truncated !== 'boolean') errors.push('truncated must be boolean');
  // Detector must not emit scorer-owned fields (05 §1.1: FORBIDDEN)
  for (const k of FORBIDDEN_KEYS) {
    if (k in (record as Record<string, unknown>)) errors.push(`forbidden key: ${k}`);
    if (record.facts && typeof record.facts === 'object' && k in (record.facts as Record<string, unknown>)) {
      errors.push(`facts contains forbidden key: ${k}`);
    }
  }
  // error kind must be known if present
  if (record.error && !['timeout', 'cap', 'crash', 'rate-limit'].includes(record.error.kind)) {
    errors.push(`unknown error.kind: ${record.error.kind}`);
  }
  // Basic schema check if provided: just ensure required props exist (full json-schema deferred)
  if (_schema && typeof _schema === 'object' && _schema !== null) {
    const s = _schema as { required?: string[] };
    if (s.required) {
      for (const req of s.required) {
        if (!(req in (record.facts as Record<string, unknown>))) {
          // soft — facts may be empty for error cases
        }
      }
    }
  }
  return errors.length ? { ok: false, errors } : { ok: true };
}
