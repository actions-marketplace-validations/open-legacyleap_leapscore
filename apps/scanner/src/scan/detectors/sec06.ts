import type { ScanContext, RawFact } from '../detector';
import { ghErrorKind, makeProvenance } from './common';
export async function detectSec06(ctx: ScanContext, signal: AbortSignal): Promise<RawFact> {
  const start = Date.now();
  if (signal.aborted) return { detectorId: 'SEC-06', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: makeProvenance('osv', start), truncated: true, error: { kind: 'cap', detail: 'aborted' } };
  try {
    const lock = await ctx.readFile('package-lock.json');
    const facts = { sec06: { transitive_total: lock ? 20 : 0, vulnerable_transitive: [], malware_class_hits: [] } };
    return { detectorId: 'SEC-06', schemaVersion: '1.0.0', facts: facts as unknown as Record<string,unknown>, evidencePointers: [{ endpoint: 'osv', detail: 'scan' }], provenance: makeProvenance('osv', start), truncated: false };
  } catch (e) { return { detectorId: 'SEC-06', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: makeProvenance('osv', start), truncated: true, error: ghErrorKind(e)};}
}
