import type { ScanContext, RawFact } from '../detector';
import { unknownFact } from './common';

const WHAT_IT_TAKES =
  'run a token-based duplication analyzer (min-tokens 50, e.g. jscpd) over non-vendored source to compute duplication_pct and security-critical duplicate clusters — the offline release ships no such analyzer';

/**
 * ARCH-08 — duplication debt. Demoted to `unknown` with a what-it-takes note
 * (detector-honesty D2): no duplication analyzer runs, so no percentage is graded.
 */
export async function detectArch08(ctx: ScanContext, signal: AbortSignal): Promise<RawFact> {
  const started = Date.now();
  void ctx;
  void signal;
  return unknownFact('ARCH-08', 'scan', started, WHAT_IT_TAKES);
}
