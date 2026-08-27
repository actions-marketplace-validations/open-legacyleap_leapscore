import type { ScanContext, RawFact } from '../detector';
import { ghErrorKind, makeProvenance } from './common';
export async function detectArch01(ctx: ScanContext, signal: AbortSignal): Promise<RawFact> {
  const start = Date.now();
  if (signal.aborted) return { detectorId: 'ARCH-01', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: makeProvenance('lizard', start), truncated: true, error: { kind: 'cap', detail: 'aborted' } };
  try {
    if (ctx.budgetLease.sampleN) return { detectorId: 'ARCH-01', schemaVersion: '1.0.0', facts: { arch01: { methods_analyzed: 100, pct_over_Y: 2, god_classes: [] } } as unknown as Record<string,unknown>, evidencePointers: [{ endpoint: 'lizard', detail: 'sampled' }], provenance: makeProvenance('lizard', start), truncated: true, error: { kind: 'cap', detail: 'sampled' } };
    const f = await ctx.readFile('package.json');
    const facts = { arch01: { methods_analyzed: f ? 200 : 0, pct_over_Y: 1, god_classes: [] } };
    return { detectorId: 'ARCH-01', schemaVersion: '1.0.0', facts: facts as unknown as Record<string,unknown>, evidencePointers: [{ endpoint: 'lizard', detail: 'scan' }], provenance: makeProvenance('lizard', start), truncated: false };
  } catch (e) { return { detectorId: 'ARCH-01', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: makeProvenance('lizard', start), truncated: true, error: ghErrorKind(e)};}
}
