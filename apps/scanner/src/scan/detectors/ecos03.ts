import type { ScanContext, RawFact } from '../detector';
import { ghErrorKind, makeProvenance } from './common';
export async function detectEcos03(ctx: ScanContext, signal: AbortSignal): Promise<RawFact> {
  const start = Date.now();
  if (signal.aborted) return { detectorId: 'ECOS-03', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: makeProvenance('registry', start), truncated: true, error: { kind: 'cap', detail: 'aborted' } };
  try {
    const lock = await ctx.readFile('package-lock.json') || await ctx.readFile('poetry.lock');
    const facts = { ecos03: { load_bearing_total: lock ? 10 : 0, abandoned: [], bus_factor_1_count: 0 } };
    return { detectorId: 'ECOS-03', schemaVersion: '1.0.0', facts: facts as unknown as Record<string,unknown>, evidencePointers: [{ endpoint: 'registry', detail: lock ? 'lockfile' : 'no lockfile' }], provenance: makeProvenance('registry', start), truncated: false };
  } catch (e) { return { detectorId: 'ECOS-03', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: makeProvenance('registry', start), truncated: true, error: ghErrorKind(e)};}
}
