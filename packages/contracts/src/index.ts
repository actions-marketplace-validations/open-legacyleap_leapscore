/**
 * packages/contracts — single producer-owned definition of the report
 * envelope, sealed report shape, runId grammar, and contract version.
 * Consumers (engine, scanner, site, workflow CLI) import from here;
 * no second definition may exist elsewhere.
 */

export const CONTRACT_VERSION = 1;

export const PROTOCOL_VERSION = 1;

/** Report wire shape (producer-owned). Render-only fields stay on the site. */
export type RowStatus =
  | "measured"
  | "estimated"
  | "unknown"
  | "not_applicable"
  | "not_implemented";

export type RowScore = 0 | 1 | 2 | 3;

export type GateStatus =
  | "proven"
  | "not-proven"
  | "needs-verification"
  | "unevaluable"
  | "not_applicable"
  | "not_implemented";

export interface EvidencePointer {
  file?: string;
  line?: number;
  detail?: string;
  commit?: string;
  branch?: string;
}

export interface Evidence {
  tool: string;
  args?: string;
  pointers: EvidencePointer[];
  facts: Record<string, string | number | boolean>;
}

export interface Basis {
  pattern: string;
  sample?: string;
  confidence: "low" | "medium";
}

export interface Remediation {
  quick_win: string;
  structural: string;
  gold_standard: string;
  effort: string;
}

export interface IndicatorRow {
  id: string;
  name: string;
  category_id: string;
  status: RowStatus;
  score?: RowScore;
  verdict_text?: string;
  score_confidence?: "low" | "medium";
  reason?: string;
  evidence?: Evidence;
  basis?: Basis;
  unknown_measure_path?: string;
  remediation?: Remediation;
  not_applicable?: boolean;
  effort: string;
}

export interface CategoryScore {
  id: string;
  name: string;
  weight: number;
  applicable: number;
  scored_sum: number;
  category_score: number | null;
  weighted_contribution: number;
  status_counts: {
    measured: number;
    estimated: number;
    unknown: number;
    not_applicable: number;
    not_implemented?: number;
  };
  indicator_rows: IndicatorRow[];
}

export interface Gate {
  id: string;
  name: string;
  status: GateStatus;
  source_rows: string[];
  note: string;
}

export interface CoverageCounts {
  measured: number;
  estimated: number;
  unknown: number;
  not_applicable: number;
  not_implemented?: number;
  measured_pct: string;
  estimated_pct: string;
  unknown_pct: string;
  not_applicable_pct?: string;
  not_implemented_pct?: string;
}

export interface TopBlocker {
  row: string;
  name: string;
  points_lost: number;
  weight_pp: string;
  summary: string;
  evidence_file?: string;
  rule?: string;
}

export interface DeepDiveScopeEntry {
  row: string;
  name: string;
  what_it_takes: string;
}

export interface Report {
  report_schema: string;
  id: string;
  status: string;
  snapshot: {
    repo: string;
    scanned_at: string;
    engine_version: string;
    rubric_version: string;
    scanned_commit?: string;
    archetype?: string;
    archetype_confidence?: string;
    planeInventory?: Record<string, unknown>;
    archetype_evidence?: string[];
    perRoot?: unknown[];
    archetype_source?: string;
  };
  headline: {
    score: number;
    canonical_score?: number;
    /** Legacy renormalized computation — reference only, never gated on. */
    renormalized_score?: number;
    /** Headline policy that sealed this score (frozen default, legacy escape hatch). */
    score_policy?: string;
    /** True when measured rows fell below the coverage floor: no headline number
     * is presented; reference scores stay in JSON for diagnosis. */
    suppressed?: boolean;
    /** Explicit verdict when the headline is suppressed (`insufficient-signal`). */
    verdict?: string;
    tier: string;
    tier_legacy?: string;
    ci_band: string;
  };
  coverage: CoverageCounts;
  gates: Gate[];
  categories: CategoryScore[];
  top_blockers: TopBlocker[];
  deep_dive_scope: DeepDiveScopeEntry[];
  full_table: IndicatorRow[];
  sample: true;
}

export interface EnvelopeMeta {
  repo: string;
  repoUrl: string;
  repoSlug: string;
  engineSha7: string;
  runId: string;
  ranAt: string;
  durationMs: number;
  budgetMs: number;
  repoSha: string;
  score: number;
  tier: string;
  tier_legacy?: string;
  status: string;
  engine_version: string;
  rubric_version: string;
  filename: string;
  coverage?: CoverageCounts;
  contractVersion: number;
  /** Deterministic score fingerprint (deterministic-scoring 2.2): identical for
   * identical target content + scanner release + flags; runId/scanned_at differ. */
  score_fingerprint?: string;
  fingerprint_version?: number;
}

export type TracePhase =
  | "ingest"
  | "gh"
  | "clone"
  | "sniff"
  | "detector"
  | "scoring"
  | "budget"
  | "seal"
  | "milestone"
  | "start"
  | "meta"
  | "progress"
  | "scoring-old"
  | "sealed";

export interface TraceEntry {
  ts: number;
  label: string;
  type?: string;
  pct?: number;
  elapsedMs?: number;
  remainingMs?: number;
  completedIds?: string[];
  phase?: TracePhase;
  detectorId?: string;
  durationMs?: number;
  status?: "measured" | "estimated" | "unknown" | "error" | "complete" | "degraded";
  errorKind?: "cap" | "crash" | "rate-limit";
}

export interface ReportEnvelope {
  meta: EnvelopeMeta;
  report: Report;
  trace: TraceEntry[];
  contractVersion: number;
}

// ---------------------------------------------------------------------------
// runId grammar — single implementation owned by the producer
// ---------------------------------------------------------------------------

export function normalizeRepoForSlug(raw: string | null | undefined): string {
  if (!raw) return "django/django";
  const cleaned = raw
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/^github\.com\//i, "")
    .replace(/\.git$/i, "");
  const withoutQuery = cleaned.split(/[?#]/)[0];
  const parts = withoutQuery.split("/").filter(Boolean);
  if (parts.length < 2) return "django/django";
  const owner = parts[0];
  const repo = parts[1];
  if (!owner || !repo) return "django/django";
  return `${owner}/${repo}`;
}

export function repoSlugFromNormalized(normalized: string): string {
  const lower = normalized.toLowerCase();
  const [owner, repo] = lower.split("/");
  if (!owner || !repo) return "unknown__unknown";
  return `${owner}__${repo}`;
}

export function repoSlugFromUrl(raw: string | null | undefined): string {
  return repoSlugFromNormalized(normalizeRepoForSlug(raw));
}

export function normalizeTs(iso: string): string {
  return iso.replace(/:/g, "").replace(".", "-");
}

export function denormalizeTs(ts: string): string {
  const m = ts.match(/^(\d{4}-\d{2}-\d{2}T)(\d{2})(\d{2})(\d{2})-(\d+)Z$/);
  if (!m) return ts;
  return `${m[1]}${m[2]}:${m[3]}:${m[4]}.${m[5]}Z`;
}

export function buildRunId(repoSlug: string, engineSha7: string, ts: string): string {
  const safeEngine = engineSha7 && engineSha7.trim() ? engineSha7.trim().slice(0, 7) : "unknown";
  return `${repoSlug}__${safeEngine}__${ts}`;
}

export function parseRunId(runId: string): { repoSlug: string; engineSha7: string; ts: string } | null {
  if (!isValidRunId(runId)) return null;
  const parts = runId.split("__");
  if (parts.length < 3) return null;
  const ts = parts[parts.length - 1];
  const engineSha7 = parts[parts.length - 2];
  const repoSlug = parts.slice(0, parts.length - 2).join("__");
  return { repoSlug, engineSha7, ts };
}

export function repoFromSlug(slug: string): string {
  const [owner, repo] = slug.split("__");
  if (!owner || !repo) return slug;
  return `${owner}/${repo}`;
}

const RUN_ID_RE = /^[\w.\-]+__[\w.\-]+__\d{4}-\d{2}-\d{2}T\d{6}-\d{3}Z$/;

export function isValidRunId(runId: string): boolean {
  if (!runId || runId.includes("/") || runId.includes("\\") || runId.includes("..")) return false;
  return RUN_ID_RE.test(runId);
}

// ---------------------------------------------------------------------------
// Display tiers — Low / Moderate / High / Critical (thresholds 80/53/27).
// Legacy aliases (Healthy for Low, High Risk for High) are carried as
// `tier_legacy` for one release.
// ---------------------------------------------------------------------------

export const TIER_THRESHOLDS = { low: 80, moderate: 53, high: 27 } as const;

export function tierForScore(score: number): string {
  if (score >= TIER_THRESHOLDS.low) return "Low";
  if (score >= TIER_THRESHOLDS.moderate) return "Moderate";
  if (score >= TIER_THRESHOLDS.high) return "High";
  return "Critical";
}

export function tierLegacyFor(tier: string): string {
  if (tier === "Low") return "Healthy";
  if (tier === "High") return "High Risk";
  return tier;
}

/** Local subject slug: normalized directory basename (lowercased, unsafe chars → `-`). */
export function localSlugFromPath(raw: string): string {
  const base = raw.replace(/[/\\]+$/, "").split(/[/\\]/).filter(Boolean).pop() ?? "scan";
  const slug = base.toLowerCase().replace(/[^a-z0-9.\-]+/g, "-").replace(/^-+|-+$/g, "");
  return slug || "scan";
}

// ---------------------------------------------------------------------------
// Assessment funnel — the only telemetry is the click on this tracked link.
// ---------------------------------------------------------------------------

export const ASSESSMENT_BASE_URL = "https://leapscore.dev/assessment";
export const ASSESSMENT_CAMPAIGN = "cli-scan-v1";

const BAND_CTA: Record<string, string> = {
  Low: "Keep this scan in CI to catch drift early — a $0 Assessment benchmarks you against peers.",
  Moderate:
    "Risk is concentrated in a few areas — a $0 Assessment clarifies what to fix first.",
  High: "Significant modernisation risk — book a $0 Assessment to scope the fix.",
  Critical: "Significant modernisation risk — book a $0 Assessment to scope the fix.",
};

export function assessmentUrlForBand(tier: string): string {
  const band = tier.toLowerCase();
  return `${ASSESSMENT_BASE_URL}?utm_campaign=${ASSESSMENT_CAMPAIGN}&band=${band}`;
}

export function assessmentCtaForBand(tier: string): string {
  return BAND_CTA[tier] ?? BAND_CTA.Moderate;
}

// ---------------------------------------------------------------------------
// Network posture — allowlisted open-internet GET hosts for default (non-strict)
// local scans. Code, file paths, and repository names are never transmitted.
// ---------------------------------------------------------------------------

export const ALLOWED_NETWORK_HOSTS = [
  "registry.npmjs.org",
  "pypi.org",
  "proxy.golang.org",
  "repo.maven.apache.org",
  "packagist.org",
  "crates.io",
  "endoflife.date",
  "osv.dev",
] as const;

export const NETWORK_NEVER_SEND_RULE =
  "Code, file paths, and repository names never leave the machine: allowlisted hosts receive only registry/package identifiers and version strings via GET.";

export function resolveEngineSha7(opts: {
  env?: Record<string, string | undefined>;
  engineRef?: string;
  execImpl?: (cmd: string) => string;
} = {}): string {
  // Explicit-reference path only: LEAPSCORE_SHA / engineRef /
  // LEAPSCORE_ENGINE_REF → injected checkout resolver → literal unknown.
  // Pure: no process/require access here; Node callers pass env + execImpl.
  // Never consult a consumer's working directory.
  const env = opts.env ?? {};
  const cands = [env.LEAPSCORE_SHA, opts.engineRef, env.LEAPSCORE_ENGINE_REF, env.VERCEL_GIT_COMMIT_SHA];
  for (const c of cands) {
    if (c && String(c).trim()) return String(c).trim().slice(0, 7);
  }
  if (opts.execImpl) {
    try {
      const out = opts.execImpl("git rev-parse --short HEAD");
      if (out && out.trim()) return out.trim().slice(0, 7);
    } catch {
      // ignore
    }
  }
  return "unknown";
}

// ---------------------------------------------------------------------------
// Version check
// ---------------------------------------------------------------------------

export class UnsupportedContractVersionError extends Error {
  constructor(
    public readonly found: number,
    public readonly supported: number,
  ) {
    super(`unsupported contract version ${found} (supports <= ${supported})`);
    this.name = "UnsupportedContractVersionError";
  }
}

/** Throw when an envelope's contract version is newer than understood. */
export function assertContractVersion(envelope: { contractVersion?: number; meta?: { contractVersion?: number } }): void {
  const v = envelope.contractVersion ?? envelope.meta?.contractVersion ?? CONTRACT_VERSION;
  if (v > CONTRACT_VERSION) throw new UnsupportedContractVersionError(v, CONTRACT_VERSION);
}
