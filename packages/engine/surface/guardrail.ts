/** packages/engine/surface/guardrail.ts — private-target visibility guard (plan 15 §4) */

export type GuardrailInput = {
  isSelf: boolean;
  runnerPrivate: boolean;
  targetPrivate: boolean;
};

export type GuardrailResult = { allowed: true } | { allowed: false; reason: string };

export const GUARDRAIL_SKIP_REASON = 'private-target/public-runner';

/**
 * Private evidence must never be copied into a public runner repo.
 * Self-scans and private runners are always allowed; public targets always allowed.
 */
export function checkSurfaceAllowed(v: GuardrailInput): GuardrailResult {
  if (v.isSelf) return { allowed: true };
  if (v.targetPrivate && !v.runnerPrivate) return { allowed: false, reason: GUARDRAIL_SKIP_REASON };
  return { allowed: true };
}
