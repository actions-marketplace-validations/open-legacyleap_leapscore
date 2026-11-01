/** detectors/sec-03/detector.ts — SEC-03 Missing Web Security Controls (C/unknown stub) */
import type { Detector, ScanContext, RawFact } from '../../engine/detector';
export const detector: Detector = {
  id: 'SEC-03',
  tier: 'C',
  budget: 'api-budgeted',
  planes: ['static-src'],
  ecosystems: 'all',
  async detect(_ctx: ScanContext, _abort: AbortSignal): Promise<RawFact> {
    // C-tier: no URL-provable signal — return empty facts; scorer emits unknown + whatItTakes (unified reduced form)
    return { detectorId: 'SEC-03', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: { tool: 'none', version: '0', flags: [], durationMs: 0 }, truncated: false };
  },
};
