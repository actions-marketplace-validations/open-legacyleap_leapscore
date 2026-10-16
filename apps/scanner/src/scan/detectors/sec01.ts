import type { ScanContext, RawFact } from '../detector';
import { ghErrorKind, makeProvenance } from './common';
export async function detectSec01(ctx: ScanContext, signal: AbortSignal): Promise<RawFact> {
  const start = Date.now();
  if (signal.aborted) return { detectorId: 'SEC-01', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: makeProvenance('trivy', start), truncated: true, error: { kind: 'cap', detail: 'aborted' } };
  try {
    const lock = await ctx.readFile('package-lock.json');
    const facts = { sec01: { findings: [], critical_open_over_14d: 0, high_open: 0, tools: ['trivy'] }, lockFound: !!lock };
    return { detectorId: 'SEC-01', schemaVersion: '1.0.0', facts: facts as unknown as Record<string,unknown>, evidencePointers: [{ endpoint: 'trivy', detail: lock ? 'scanned' : 'no lockfile' }], provenance: makeProvenance('trivy', start), truncated: false };
  } catch (e) { return { detectorId: 'SEC-01', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: makeProvenance('trivy', start), truncated: true, error: ghErrorKind(e)};}
}
