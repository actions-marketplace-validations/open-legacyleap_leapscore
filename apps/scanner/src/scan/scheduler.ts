/** engine/scheduler.ts — DAG by plane + ecosystem fan-out (05 §1.2, §3, Q4) */
// Selects detectors by (plane + ecosystem match per root). Agnostic planes always run; gated fan out per root.
// Stub.

export type Schedule = { root: string; detectorId: string; budgetLease: { timeoutMs: number; byteCap: number; sampleN?: number } };
export function schedule(_manifests: unknown[], _detectors: unknown[]): Schedule[] { return []; }
