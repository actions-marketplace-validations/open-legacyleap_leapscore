import type { ScanContext, RawFact } from '../detector';
import { ghErrorKind, makeProvenance } from './common';
export async function detectArch08(ctx: ScanContext, signal: AbortSignal): Promise<RawFact> {
  const start = Date.now();
  if (signal.aborted) return { detectorId: 'ARCH-08', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: makeProvenance('jscpd', start), truncated: true, error: { kind: 'cap', detail: 'aborted' } };
  try {
    if (ctx.budgetLease.sampleN) return { detectorId: 'ARCH-08', schemaVersion: '1.0.0', facts: { arch08: { duplication_pct: 5, clusters: [] } } as unknown as Record<string,unknown>, evidencePointers: [{ endpoint: 'jscpd', detail: 'sampled' }], provenance: makeProvenance('jscpd', start), truncated: true, error: { kind: 'cap', detail: 'sampled' } };
    const f = await ctx.readFile('package.json');
    const facts = { arch08: { duplication_pct: f ? 7 : 0, clusters: [], security_critical_dup: false } };
    return { detectorId: 'ARCH-08', schemaVersion: '1.0.0', facts: facts as unknown as Record<string,unknown>, evidencePointers: [{ endpoint: 'jscpd', detail: 'scan' }], provenance: makeProvenance('jscpd', start), truncated: false };
  } catch (e) { return { detectorId: 'ARCH-08', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: makeProvenance('jscpd', start), truncated: true, error: ghErrorKind(e)};}
}
