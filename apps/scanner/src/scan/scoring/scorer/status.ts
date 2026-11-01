/** scanner/scan/scoring/scorer/status.ts — statusing (unified indicator §8, 02:§2) */
// measured_when / estimated_when / unknown_when + scope_limited + clamp [1,2] + confidence low|medium (≥2 surfaces or exhaustive).
// N/A only structural or exhaustive enumeration (unified indicator §5).
// Stub.
export function deriveStatus(_facts: unknown, _spec: unknown): { status: 'measured'|'estimated'|'unknown'; confidence?: 'low'|'medium'; scopeLimited?: boolean } { return { status: 'unknown' }; }
