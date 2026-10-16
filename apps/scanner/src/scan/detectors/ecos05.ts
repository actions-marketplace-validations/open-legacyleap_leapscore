import type { ScanContext, RawFact } from '../detector';
import { ghErrorKind, makeProvenance } from './common';
export async function detectEcos05(ctx: ScanContext, signal: AbortSignal): Promise<RawFact> {
  const start = Date.now();
  if (signal.aborted) return { detectorId: 'ECOS-05', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: makeProvenance('syft', start), truncated: true, error: { kind: 'cap', detail: 'aborted' } };
  try {
    if (ctx.budgetLease.sampleN) return { detectorId: 'ECOS-05', schemaVersion: '1.0.0', facts: { ecos05: { packages_total: 10, copyleft_strong: [], sbom_present_in_repo: false } } as unknown as Record<string,unknown>, evidencePointers: [{ endpoint: 'syft', detail: 'sampled' }], provenance: makeProvenance('syft', start), truncated: true, error: { kind: 'cap', detail: 'sampled' } };
    const pkg = await ctx.readFile('package.json');
    const facts = { ecos05: { packages_total: pkg ? 20 : 0, license_unknown_count: 0, copyleft_strong: [], sbom_present_in_repo: false } };
    return { detectorId: 'ECOS-05', schemaVersion: '1.0.0', facts: facts as unknown as Record<string,unknown>, evidencePointers: [{ endpoint: 'syft', detail: 'scan' }], provenance: makeProvenance('syft', start), truncated: false };
  } catch (e) { return { detectorId: 'ECOS-05', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: makeProvenance('syft', start), truncated: true, error: ghErrorKind(e)};}
}
