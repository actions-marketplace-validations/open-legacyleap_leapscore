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
  gh: RateLimitedGhClient;
  manifests: EcosystemManifest[];
  budgetLease: { timeoutMs: number; byteCap: number; sampleN?: number };
  cache: FactCache;
  toolVersions: Map<string, string>;
  llm?: LlmProxy;
  readFile(path: string): Promise<Buffer | null>;
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
};

export type Evidence = { file?: string; line?: number; detail?: string; commit?: string; endpoint?: string };
export type RateLimitedGhClient = { request(path: string, params?: Record<string, string>): Promise<unknown> };
export type FactCache = { get(key: string): unknown; set(key: string, value: unknown): void };
export type LlmProxy = { complete(prompt: string, opts?: { maxTokens?: number }): Promise<{ text: string; promptHash: string; model: string; tokens: number }> };
