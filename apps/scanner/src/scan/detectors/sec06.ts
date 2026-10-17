import type { ScanContext, RawFact } from '../detector';
import { unknownFact } from './common';

const WHAT_IT_TAKES =
  'resolve depth≥2 transitive chains out of the lockfile against an advisory source with import-closure reachability — the offline release ships no transitive-chain resolver (depth≤1 vulns are SEC-01)';

/**
 * SEC-06 — insecure transitive chains. Demoted to `unknown` (detector-honesty D2):
 * no depth≥2 resolver is shipped in v1, so no constant is graded.
 */
export async function detectSec06(ctx: ScanContext, signal: AbortSignal): Promise<RawFact> {
  const started = Date.now();
  void ctx;
  void signal;
  return unknownFact('SEC-06', 'scan', started, WHAT_IT_TAKES);
}
