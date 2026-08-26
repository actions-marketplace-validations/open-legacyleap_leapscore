/** engine/orchestrator.ts — pipeline stages 1-5 (05 §1.2, §4) */
import type { FactRecord } from './facts';
// Stages: ingest -> fetch -> detect-ecosystem -> static-phase (scheduler+runner under budget) -> fact-store -> scorer -> emission -> seal.
// Orchestrator owns policy (budget, ecosystem fan-out, fact validation); never scores (Q2/Q6).
// Stub — wiring point.

export type ScanRequest = { repoUrl: string };
export type ScanResult = { scanId: string; facts: FactRecord[]; rubricVersion: string };

export async function runScan(_req: ScanRequest): Promise<ScanResult> {
  throw new Error('stub: orchestrator not yet implemented');
}
