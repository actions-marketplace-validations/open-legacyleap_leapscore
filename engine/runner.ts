/** engine/runner.ts — worker isolation + hydration + proxied network (05 §5, Q8) */
// worker_threads / child-process pool with cgroup/mem limit, abortable.
// clonePath is read-only; reads via ctx.readFile hydration proxy against byteCap.
// Network allow-list: gh + registry + ctx.llm() only — direct fetch banned (check:detector-isolation).
// Stub.

export async function runDetector(_detectorId: string, _ctx: unknown, _abort: AbortSignal): Promise<unknown> {
  throw new Error('stub: runner not yet implemented');
}
