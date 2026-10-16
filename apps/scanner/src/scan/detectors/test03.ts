import type { ScanContext, RawFact } from '../detector';
import { ghErrorKind, makeProvenance } from './common';
export async function detectTest03(ctx: ScanContext, signal: AbortSignal): Promise<RawFact> {
  const start = Date.now();
  if (signal.aborted) return { detectorId: 'TEST-03', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: makeProvenance('pyramid', start), truncated: true, error: { kind: 'cap', detail: 'aborted' } };
  try {
    const facts = { test03: { unit: 10, integration: 5, e2e: 2, e2e_share_est: 0.2 } };
    return { detectorId: 'TEST-03', schemaVersion: '1.0.0', facts: facts as unknown as Record<string,unknown>, evidencePointers: [{ endpoint: 'pyramid', detail: 'classify' }], provenance: makeProvenance('pyramid', start), truncated: false };
  } catch (e) { return { detectorId: 'TEST-03', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: makeProvenance('pyramid', start), truncated: true, error: ghErrorKind(e)};}
}
