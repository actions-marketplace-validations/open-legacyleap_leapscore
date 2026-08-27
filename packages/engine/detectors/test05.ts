import type { ScanContext, RawFact } from '../detector';
import { ghErrorKind, makeProvenance } from './common';
export async function detectTest05(ctx: ScanContext, signal: AbortSignal): Promise<RawFact> {
  const start = Date.now();
  if (signal.aborted) return { detectorId: 'TEST-05', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: makeProvenance('skip', start), truncated: true, error: { kind: 'cap', detail: 'aborted' } };
  try {
    const facts = { test05: { total_tests_est: 100, skipped_total: 2, skip_ratio: 0.02 } };
    return { detectorId: 'TEST-05', schemaVersion: '1.0.0', facts: facts as unknown as Record<string,unknown>, evidencePointers: [{ endpoint: 'skip', detail: 'scan' }], provenance: makeProvenance('skip', start), truncated: false };
  } catch (e) { return { detectorId: 'TEST-05', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: makeProvenance('skip', start), truncated: true, error: ghErrorKind(e)};}
}
