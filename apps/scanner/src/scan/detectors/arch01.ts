import type { ScanContext, RawFact } from '../detector';
import { unknownFact } from './common';

const WHAT_IT_TAKES =
  'run a complexity analyzer (cyclomatic complexity + LOC per method, e.g. lizard/radon) over non-vendored source and join offenders to the core-path set — the offline release ships no such analyzer';

/**
 * ARCH-01 — cognitive complexity / god classes. Demoted to `unknown` with a
 * what-it-takes note (detector-honesty D2): the build does not run a complexity
 * analyzer, so no magnitude may be graded from a constant.
 */
export async function detectArch01(ctx: ScanContext, signal: AbortSignal): Promise<RawFact> {
  const started = Date.now();
  void ctx;
  void signal;
  return unknownFact('ARCH-01', 'scan', started, WHAT_IT_TAKES);
}
