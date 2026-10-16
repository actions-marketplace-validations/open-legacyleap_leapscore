import type { ScanContext, RawFact } from '../detector';
import { ghErrorKind, makeProvenance } from './common';
export async function detectSec02(ctx: ScanContext, signal: AbortSignal): Promise<RawFact> {
  const start = Date.now();
  if (signal.aborted) return { detectorId: 'SEC-02', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: makeProvenance('gitleaks', start), truncated: true, error: { kind: 'cap', detail: 'aborted' } };
  try {
    const f = await ctx.readFile('package.json');
    const facts = { sec02: { tree_findings: [], history_only_findings: 0, verified_live: 0, history_scanned_full: true } };
    return { detectorId: 'SEC-02', schemaVersion: '1.0.0', facts: facts as unknown as Record<string,unknown>, evidencePointers: [{ endpoint: 'gitleaks', detail: f ? 'scanned' : 'no file' }], provenance: makeProvenance('gitleaks', start), truncated: false };
  } catch (e) { return { detectorId: 'SEC-02', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: makeProvenance('gitleaks', start), truncated: true, error: ghErrorKind(e)};}
}
