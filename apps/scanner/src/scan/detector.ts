/** engine/detector.ts — Detector contract (05 §1.1, Q2) */
export type IndicatorId = string; // e.g. "SEC-02"
export type Tier = 'A' | 'B' | 'C' | 'D';
export type BudgetClass = 'fast' | 'slow-dissolvable' | 'api-budgeted';
export type DataPlane = 'git' | 'gh-api' | 'ecosystem' | 'static-src';
export type Ecosystem = 'js' | 'py' | 'go' | 'java' | 'ruby' | 'php' | 'csharp' | 'rust';

export interface Detector {
  id: IndicatorId;
  tier: Tier;
  budget: BudgetClass;
  planes: DataPlane[];
  ecosystems: Ecosystem[] | 'all';
  /** AI detectors must set true -> exempt from bit-for-bit replay (05 §7, Q3) */
  nonDeterministic?: boolean;
  detect(ctx: ScanContext, abort: AbortSignal): Promise<RawFact>;
}

export type ScanContext = {
  clonePath: string;
  commitSha: string;
  gh?: RateLimitedGhClient;
  manifests: EcosystemManifest[];
  budgetLease: { timeoutMs: number; byteCap: number; sampleN?: number };
  cache: FactCache;
  toolVersions: Map<string, string>;
  llm?: LlmProxy;
  readFile(path: string): Promise<Buffer | null>;
  /** Deterministic scan instant (ms epoch) — the reference point for date-derived
   * facts (EOL days, staleness, abandonment). Defaults to `Date.now()` when the
   * orchestrator does not thread it (detector-honesty: repeat-run determinism). */
  scanMs?: number;
};

export type EcosystemManifest = { root: string; ecosystem: Ecosystem; lockfile: string; manifest: string };

export type RawFact = {
  detectorId: IndicatorId;
  schemaVersion: string;
  facts: Record<string, unknown>;
  evidencePointers: Evidence[];
  provenance: { tool: string; version: string; flags: string[]; durationMs: number; promptHash?: string; model?: string; tokens?: number };
  truncated: boolean;
  error?: { kind: 'timeout' | 'cap' | 'crash' | 'rate-limit'; detail: string };
  /** "What it takes to measure" — set when a detector could not derive the
   * magnitude from tree/git/snapshot and the row must be `unknown` (detector-honesty). */
  unknownMeasurePath?: string;
  /** Detector-declared measurement status (detector-honesty measure-or-unknown).
   * The scorer owns the final status; this only carries the detector's verdict.
   * `measured` = produced by a named producer that ran over this target;
   * `estimated` = clamped heuristic the indicator's own spec defines;
   * `unknown` = not derivable from tree ∪ git ∪ vendored snapshots. */
  measurement?: {
    status: 'measured' | 'estimated' | 'unknown';
    confidence?: 'low' | 'medium';
    scopeLimited?: boolean;
  };
};

export type Evidence = { file?: string; line?: number; detail?: string; commit?: string; endpoint?: string };
export type RateLimitedGhClient = {
  request(path: string, params?: Record<string, string>, opts?: { signal?: AbortSignal; headers?: Record<string, string> }): Promise<unknown>;
  getRepo?(owner: string, repo: string, opts?: { signal?: AbortSignal }): Promise<unknown>;
  fetchJson?(path: string, opts?: { signal?: AbortSignal }): Promise<{ data: unknown; headers: Headers }>;
  lastState?(): { remaining?: number; reset?: number; retryAfterMs?: number };
};
export type FactCache = { get(key: string): unknown; set(key: string, value: unknown): void };
export type LlmProxy = { complete(prompt: string, opts?: { maxTokens?: number }): Promise<{ text: string; promptHash: string; model: string; tokens: number }> };

/** Phase-1-only context — no clone, no ecosystem fan-out. Used by runPhase1Scan. */
export type Phase1ScanContext = {
  owner: string;
  repo: string;
  gh: RateLimitedGhClient;
  signal: AbortSignal;
  toolVersions: Map<string, string>;
  /** Optional commit SHA when repo meta already fetched */
  commitSha?: string;
};

/** Helper to adapt Phase1 context to full ScanContext shape when reusing detectors */
export function toScanContext(phase1: Phase1ScanContext, opts: Partial<ScanContext> = {}): ScanContext {
  return {
    clonePath: '',
    commitSha: phase1.commitSha ?? 'unknown',
    gh: phase1.gh,
    manifests: [],
    budgetLease: { timeoutMs: 10_000, byteCap: 0 },
    cache: { get: () => undefined, set: () => {} },
    toolVersions: phase1.toolVersions,
    readFile: async () => null,
    scanMs: Date.now(),
    ...opts,
  };
}
