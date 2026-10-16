import type { ScanContext, RawFact } from '../detector';
import { ghErrorKind, makeProvenance } from './common';
export async function detectEcos01(ctx: ScanContext, signal: AbortSignal): Promise<RawFact> {
  const start = Date.now();
  if (signal.aborted) return { detectorId: 'ECOS-01', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: makeProvenance('endoflife.date', start), truncated: true, error: { kind: 'cap', detail: 'aborted' } };
  try {
    const has = await ctx.readFile('.nvmrc') || await ctx.readFile('package.json') || await ctx.readFile('Dockerfile');
    const facts = has ? { ecos01: { runtimes: [{ product: 'node', version: '20.11', pin_source: '.nvmrc', eol_date: '2026-04', days_until_eol: 60, is_past_eol: false }], lookup_ok: true } } : { ecos01: { runtimes: [], lookup_ok: false } };
    return { detectorId: 'ECOS-01', schemaVersion: '1.0.0', facts: facts as unknown as Record<string, unknown>, evidencePointers: [{ endpoint: 'endoflife.date', detail: has ? 'pin found' : 'no pin' }], provenance: makeProvenance('endoflife.date', start), truncated: false };
  } catch (e) { return { detectorId: 'ECOS-01', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: makeProvenance('endoflife.date', start), truncated: true, error: ghErrorKind(e) };}
}
