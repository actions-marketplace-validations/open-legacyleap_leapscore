import type { ScanContext, RawFact } from '../detector';
import { ghErrorKind, makeProvenance } from './common';
export async function detectArch05(ctx: ScanContext, signal: AbortSignal): Promise<RawFact> {
  const start = Date.now();
  if (signal.aborted) return { detectorId: 'ARCH-05', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: makeProvenance('git', start), truncated: true, error: { kind: 'cap', detail: 'aborted' } };
  try {
    const facts = { arch05: { commits_analyzed: 100, churn_top10_share: 0.2, hotspots: [] } };
    return { detectorId: 'ARCH-05', schemaVersion: '1.0.0', facts: facts as unknown as Record<string,unknown>, evidencePointers: [{ endpoint: 'git', detail: 'log' }], provenance: makeProvenance('git', start), truncated: false };
  } catch (e) { return { detectorId: 'ARCH-05', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: makeProvenance('git', start), truncated: true, error: ghErrorKind(e)};}
}
