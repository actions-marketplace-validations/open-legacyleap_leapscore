import type { RawFact } from '../detector';
import { GhRateLimitError } from '../gh';

/**
 * Per-detector tool versions (deterministic-scoring 2.1). Every detector edit
 * MUST bump its tool's version here — the map feeds both ctx.toolVersions and
 * provenance.version, and joins the score fingerprint.
 */
export const DETECTOR_TOOL_VERSIONS: Record<string, string> = {
  // phase-1 / gh-api detectors
  'gh-api': '1.0',
  // local detectors (tool name → version)
  'adr-inventory': '1.1',
  'runbook-inventory': '1.1',
  'onboarding-inventory': '1.0',
  'changelog-inventory': '1.0',
  'docs-ci-inventory': '1.1',
  'deploy-inventory': '1.1',
  'iac-inventory': '1.1',
  'migration-inventory': '1.1',
  'lockfile+rg': '1.0',
  'endoflife.date': '1.0',
  'fuzz-inventory': '1.1',
  'sec-ci-inventory': '1.1',
  'lizard': '1.1',
  'jscpd': '1.1',
  'syft': '1.1',
  'gitleaks': '1.0',
  'trivy': '1.0',
  'registry': '1.0',
  'lockfile': '1.0',
  'git': '1.0',
  'pyramid': '1.0',
  'skip': '1.0',
  // synthetic provenance tools (budget/killer paths)
  'phase2': '1.0',
  'budget': '1.0',
};

/** Resolve the version for a provenance tool name. */
export function toolVersion(tool: string): string {
  return DETECTOR_TOOL_VERSIONS[tool] ?? '1.0';
}

/** Build the per-detector toolVersions map for a scan context (replaces hardcoded phase2:1.0). */
export function buildToolVersions(): Map<string, string> {
  return new Map(Object.entries(DETECTOR_TOOL_VERSIONS));
}

export function ghErrorKind(e: unknown): RawFact['error'] | undefined {
  if (e instanceof GhRateLimitError) return { kind: 'rate-limit', detail: e.message.slice(0, 300) };
  if (e instanceof DOMException) {
    if (e.name === 'AbortError' || e.name === 'TimeoutError') return { kind: 'cap', detail: e.message.slice(0, 200) };
  }
  if (e instanceof Error) {
    const m = e.message;
    if (m.includes(' 429 ') || /rate limit/i.test(m)) return { kind: 'rate-limit', detail: m.slice(0, 300) };
    if (m.includes('timeout') || m.includes('Abort')) return { kind: 'cap', detail: m.slice(0, 300) };
    if (m.includes('GH 5')) return { kind: 'cap', detail: m.slice(0, 300) };
    return { kind: 'crash', detail: m.slice(0, 300) };
  }
  return { kind: 'crash', detail: String(e).slice(0, 300) };
}

export function makeProvenance(endpoint: string, started: number) {
  return {
    tool: 'gh-api',
    version: toolVersion(endpoint),
    flags: [endpoint],
    durationMs: Date.now() - started,
  };
}

/** Provenance for local detectors: real tool name + its version from the map. */
export function makeDetectorProvenance(tool: string, started: number) {
  return {
    tool,
    version: toolVersion(tool),
    flags: [tool],
    durationMs: Date.now() - started,
  };
}
