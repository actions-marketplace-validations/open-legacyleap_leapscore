/** detectors/sec-02/detector.ts — SEC-02 Hardcoded Secrets (EXAMPLE — copy as template) */
import type { Detector, ScanContext, RawFact } from '../../engine/detector';

export const detector: Detector = {
  id: 'SEC-02',
  tier: 'A',
  budget: 'fast',
  planes: ['git', 'gh-api', 'static-src'],
  ecosystems: 'all',
  async detect(ctx: ScanContext, abort: AbortSignal): Promise<RawFact> {
    const t0 = Date.now();
    if (abort.aborted) return { detectorId: 'SEC-02', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: { tool: 'gitleaks', version: ctx.toolVersions.get('gitleaks') ?? 'unknown', flags: ['--no-git'], durationMs: 0 }, truncated: true, error: { kind: 'timeout', detail: 'aborted' } };
    // Example: hydrate sample files via ctx.readFile (orchestrator sharding already applied via ctx.budgetLease.sampleN)
    // const buf = await ctx.readFile('src/config/app.yml');
    // Real impl: run gitleaks via ToolAdapter, parse JSON, map to schema.json facts
    return {
      detectorId: 'SEC-02',
      schemaVersion: '1.0.0',
      facts: { verified_secrets_count: 0, in_history_count: 0 },
      evidencePointers: [],
      provenance: { tool: 'gitleaks', version: ctx.toolVersions.get('gitleaks') ?? '8.18.0', flags: ['--path', ctx.clonePath], durationMs: Date.now() - t0 },
      truncated: false,
    };
  },
};
