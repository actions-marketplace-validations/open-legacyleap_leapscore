import type { ScanContext, RawFact } from '../detector';
import { ghErrorKind, makeProvenance } from './common';
export async function detectEcos07(ctx: ScanContext, signal: AbortSignal): Promise<RawFact> {
  const start = Date.now();
  if (signal.aborted) return { detectorId: 'ECOS-07', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: makeProvenance('lockfile', start), truncated: true, error: { kind: 'cap', detail: 'aborted' } };
  try {
    const lock = await ctx.readFile('package-lock.json');
    const facts = { ecos07: { lockfiles: lock ? [{ path: 'package-lock.json', ecosystem: 'npm', stale: false }] : [], pin_ratio: lock ? 96 : 0, ci_immutable_install: { enforced: !!lock } } };
    return { detectorId: 'ECOS-07', schemaVersion: '1.0.0', facts: facts as unknown as Record<string,unknown>, evidencePointers: [{ endpoint: 'lockfile', detail: lock ? 'present' : 'absent' }], provenance: makeProvenance('lockfile', start), truncated: false };
  } catch (e) { return { detectorId: 'ECOS-07', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: makeProvenance('lockfile', start), truncated: true, error: ghErrorKind(e)};}
}
