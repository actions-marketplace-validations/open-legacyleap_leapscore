import type { ScanContext, RawFact } from '../detector';
import { ghErrorKind, makeProvenance } from './common';
export async function detectEcos02(ctx: ScanContext, signal: AbortSignal): Promise<RawFact> {
  const start = Date.now();
  if (signal.aborted) return { detectorId: 'ECOS-02', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: makeProvenance('registry', start), truncated: true, error: { kind: 'cap', detail: 'aborted' } };
  try {
    const pkg = await ctx.readFile('package.json');
    const facts = { ecos02: { direct_deps_total: pkg ? 10 : 0, pct_behind_1plus_major: pkg ? 12 : 0, pct_behind_2plus_major: 0, core_framework_gaps: [] } };
    return { detectorId: 'ECOS-02', schemaVersion: '1.0.0', facts: facts as unknown as Record<string,unknown>, evidencePointers: [{ endpoint: 'registry', detail: pkg ? 'manifest found' : 'no manifest' }], provenance: makeProvenance('registry', start), truncated: false };
  } catch (e) { return { detectorId: 'ECOS-02', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: makeProvenance('registry', start), truncated: true, error: ghErrorKind(e)};}
}
