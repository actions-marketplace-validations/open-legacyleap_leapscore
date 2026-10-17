import type { Evidence, RawFact, ScanContext } from '../detector';
import { GhRateLimitError } from '../gh';

/** Read a target file as UTF-8 through the byte-capped `ctx.readFile`, or `null`. */
export async function readText(ctx: Pick<ScanContext, 'readFile'>, path: string, maxBytes = 4 * 1024 * 1024): Promise<string | null> {
  try {
    const buf = await ctx.readFile(path);
    if (!buf) return null;
    return buf.subarray(0, maxBytes).toString('utf8');
  } catch {
    return null;
  }
}

/**
 * The runnable-producer registry — the single source for evidence tool names and
 * versions (detector-honesty 1.2). A name lives here **only** if this build can
 * actually run that producer over the target (tree ∪ git history ∪ vendored
 * snapshots) with no external binary and no network. Names that implied an
 * unrun binary (`lizard`, `jscpd`, `syft`, `trivy`, `pyramid`, `gitleaks`,
 * `endoflife.date`, `lockfile+rg`) are removed; the tools that actually run are
 * renamed to what ran (`lockfile-parse`, `eol-snapshot`, `advisory-snapshot`,
 * `secret-rules`, `test-classify`, `test-scan`).
 *
 * Every detector edit MUST bump its producer's version here — the map feeds both
 * ctx.toolVersions and provenance.version, and joins the score fingerprint.
 */
export const PRODUCER_REGISTRY: Record<string, string> = {
  // remote producers (GH-API lane; genuinely run in remote scans)
  'gh-api': '1.0',
  // local producers this build runs directly (tree ∪ git history ∪ vendored snapshots)
  'git': '1.1',
  'adr-inventory': '1.1',
  'runbook-inventory': '1.1',
  'onboarding-inventory': '1.0',
  'changelog-inventory': '1.0',
  'docs-ci-inventory': '1.1',
  'deploy-inventory': '1.1',
  'iac-inventory': '1.1',
  'migration-inventory': '1.1',
  'lockfile-parse': '1.0',
  'eol-snapshot': '1.0',
  'advisory-snapshot': '1.0',
  'test-classify': '1.0',
  'test-scan': '1.0',
  'secret-rules': '1.0',
  'fuzz-inventory': '1.1',
  'sec-ci-inventory': '1.1',
  // the scan itself — the honest producer for a row the build determined it
  // cannot measure (demotion to `unknown`); never a fabricated tool name
  'scan': '1.0',
  // scan-internal producers (coordinator/budget paths — never graded)
  'phase2': '1.0',
  'budget': '1.0',
};

/** Back-compat alias — `PRODUCER_REGISTRY` is the canonical name (detector-honesty 1.2). */
export const DETECTOR_TOOL_VERSIONS = PRODUCER_REGISTRY;

/** The set of producers runnable in this build — the provenance-registry allowlist. */
export const RUNNABLE_PRODUCERS: ReadonlySet<string> = new Set(Object.keys(PRODUCER_REGISTRY));

/** True when `tool` is a producer this build can actually run. */
export function isRunnableProducer(tool: string): boolean {
  return RUNNABLE_PRODUCERS.has(tool);
}

/** Resolve the version for a provenance tool name. */
export function toolVersion(tool: string): string {
  return PRODUCER_REGISTRY[tool] ?? '1.0';
}

/** Build the per-detector toolVersions map for a scan context (replaces hardcoded phase2:1.0). */
export function buildToolVersions(): Map<string, string> {
  return new Map(Object.entries(PRODUCER_REGISTRY));
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

/**
 * Provenance for a detector fact (detector-honesty 1.1/1.2).
 *
 * `producer` is either a GH-API endpoint path (starts with `/`) — the producer is
 * then `gh-api` and the endpoint is recorded as a flag — or the real local
 * producer name (`git`, `lockfile-parse`, `eol-snapshot`, …). The `tool` is never a
 * hardcoded `gh-api` for a local producer.
 */
export function makeProvenance(producer: string, started: number) {
  const tool = producer.startsWith('/') ? 'gh-api' : producer;
  return {
    tool,
    version: toolVersion(tool),
    flags: [producer],
    durationMs: Date.now() - started,
  };
}

/** Evidence pointer for a fact derived from a file in the target tree
 * (detector-honesty 1.5): the enumerated path is always recorded. */
export function filePointer(file: string, detail?: string, line?: number): Evidence {
  return { file, ...(detail ? { detail } : {}), ...(line ? { line } : {}) };
}

/** Evidence pointer for a fact derived from a non-file basis (detector-honesty 1.5):
 * git history, a vendored snapshot, or an enumerated directory. The detail names
 * the basis explicitly so a reader can reproduce it. */
export function basisPointer(endpoint: string, detail: string): Evidence {
  return { endpoint, detail };
}

/** Build a RawFact envelope from a real measurement. `measurement.status` defaults
 * to `measured`; pass `estimated` for the clamped heuristics an indicator's own
 * spec defines (TEST-03, ECOS-05). `truncated` marks a deterministic bound hit
 * (sampleN/byte cap), which the scorer turns into `unknown`. */
export function measuredFact(opts: {
  detectorId: string;
  producer: string;
  started: number;
  facts: Record<string, unknown>;
  pointers?: Evidence[];
  measurement?: RawFact['measurement'];
  truncated?: boolean;
}): RawFact {
  const measurement = opts.measurement ?? { status: 'measured' as const };
  return {
    detectorId: opts.detectorId,
    schemaVersion: '1.0.0',
    facts: opts.facts,
    evidencePointers: opts.pointers ?? [],
    provenance: makeProvenance(opts.producer, opts.started),
    truncated: opts.truncated ?? false,
    measurement,
  };
}

/** The honest "cannot measure" result (measure-or-unknown): no fabricated
 * magnitude, `unknown` status, and a what-it-takes note. */
export function unknownFact(
  detectorId: string,
  producer: string,
  started: number,
  whatItTakes: string,
  opts: { pointers?: Evidence[]; facts?: Record<string, unknown>; confidence?: 'low' | 'medium' } = {},
): RawFact {
  return {
    detectorId,
    schemaVersion: '1.0.0',
    facts: opts.facts ?? {},
    evidencePointers: opts.pointers ?? [],
    provenance: makeProvenance(producer, started),
    truncated: true,
    unknownMeasurePath: whatItTakes,
    measurement: { status: 'unknown', confidence: opts.confidence ?? 'low' },
    error: { kind: 'cap', detail: whatItTakes },
  };
}
