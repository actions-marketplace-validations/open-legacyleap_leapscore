/** packages/engine/__tests__/detector.contract.test.ts — contract tests for 102 detectors (Q10) */
// Iterates packages/detectors/*/manifest.json:
// - detect() returns envelope matching schema.json, never score/status/confidence
// - respects abort within 50ms
// - AI detectors have nonDeterministic:true and are estimated-only
// - isolation: no raw fs/fetch outside packages/engine/runner.ts (tooling/checks:detector-isolation)
// Stub — wiring point.

describe('detector contract', () => {
  it('stub: iterates 102 manifests', () => {
    // real impl: for (const id of registry.manifests) { ... }
  });
});
