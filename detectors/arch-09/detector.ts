/** detectors/arch-09/detector.ts — ARCH-09 Agentic Operability (AI, estimated-only Q3) */
import type { Detector, ScanContext, RawFact } from '../../engine/detector';
export const detector: Detector = {
  id: 'ARCH-09',
  tier: 'A',
  budget: 'fast',
  planes: ['static-src', 'ecosystem'],
  ecosystems: 'all',
  nonDeterministic: true, // -> estimated only, exempt from bit-for-bit replay
  async detect(ctx: ScanContext, abort: AbortSignal): Promise<RawFact> {
    const t0 = Date.now();
    if (!ctx.llm) return { detectorId: 'ARCH-09', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: { tool: 'llm', version: 'unknown', flags: [], durationMs: 0 }, truncated: false, error: { kind: 'crash', detail: 'llm proxy unavailable' } };
    if (abort.aborted) return { detectorId: 'ARCH-09', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: { tool: 'llm', version: 'unknown', flags: [], durationMs: 0 }, truncated: true, error: { kind: 'timeout', detail: 'aborted' } };
    // Pre-sharded files via ctx.readFile; send chunks via ctx.llm (logs promptHash+cost)
    // const { text, promptHash, model, tokens } = await ctx.llm('assess agentic operability...');
    return { detectorId: 'ARCH-09', schemaVersion: '1.0.0', facts: { agentic_score: 1, basis: 'stub' }, evidencePointers: [], provenance: { tool: 'llm', version: 'stub', flags: [], durationMs: Date.now() - t0, promptHash: 'stub', model: 'stub', tokens: 0 }, truncated: false };
  },
};
