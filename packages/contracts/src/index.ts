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
  /** Version of the producer that emitted the fact, from the single runnable-producer registry. */
  tool_version?: string;
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

// ---------------------------------------------------------------------------
// Next-band path (band-path) — derived at seal time, consumed unchanged by
// every report surface. Never scored: excluded from the score fingerprint.
// ---------------------------------------------------------------------------

/** Cost class of a path step, from the row's verify-effort tag (band-path D3):
 *  ⚡ → sprint, 🔶 → quarter, 🔷 → structural. */
export type BandPathCostClass = "sprint" | "quarter" | "structural";

/** Whether a cost class reaches the destination on its own, only combined with
 *  the classes ordered before it, or not at all. */
export type BandPathArrival = "alone" | "combined" | "not-reached";

export interface BandPathStep {
  row: string;
  name: string;
  /** Recoverable headline points if this row reached the maximum score. */
  recoverable_pp: number;
  /** The row's verify-effort tag, verbatim from the compiled registry. */
  effort: string;
  /** Registry remediation quick win where the unified indicator defines one. */
  quick_win?: string;
}

export interface BandPathClass {
  class: BandPathCostClass;
  /** Recoverable points within this class alone. */
  pp: number;
  /** Recoverable points through this class and every class before it. */
  cumulative_pp: number;
  arrival: BandPathArrival;
  steps: BandPathStep[];
}

/** Derived path from the sealed score to the next public band. Classes with no
 *  steps are omitted; `arrival` is evaluated over the classes present. */
export interface NextBandPath {
  /** Destination band (Low/Moderate/High), or null when the path is terminal. */
  destination: string | null;
  /** Destination band's contract threshold, or null when terminal. */
  threshold: number | null;
  /** threshold − sealed score, or null when terminal. */
  points_needed: number | null;
  /** Steps grouped by cost class, in sprint, quarter, structural order. */
  classes: BandPathClass[];
  /** Sealed rows the path could not reach (unknown / not implemented). */
  unreached_rows: number;
  /** True when the sealed score already sits in the highest band. */
  terminal: boolean;
}

// ---------------------------------------------------------------------------
// Target identity (capability `report-identity`) — what the scanned code *is*.
//
// Derived at scan time and excluded from grading exactly like `next_band_path`:
// no identity value enters a row score, a category score, the headline, a tier,
// a gate, the coverage counts, the next-band path, or `score_fingerprint`.
// Membership rule: an identity field never carries a fact an indicator row
// grades (dependency mass is ECOS-06, test surface is TEST-03, per-file line
// distribution is ARCH-01, comment density is DOCS-06).
// ---------------------------------------------------------------------------

/** The three answers an identity measurement can give. `estimated` means an
 *  extrapolated magnitude — never the scoring clamp that restricts estimated
 *  indicator rows, because identity carries no score to clamp. */
export type IdentityStatus = "measured" | "estimated" | "unknown";

/** One identity value: the status the producer emitted plus the disclosure that
 *  makes an estimate or an absence honest. Presentation (`~` marker and
 *  two-significant-figure rounding) derives from `status` at render — it is
 *  never stored, and a consumer never infers the status from `method` or
 *  `covered`. */
export interface IdentityItem {
  status: IdentityStatus;
  /** Stored magnitude; absent exactly when `status` is `unknown`. */
  value?: number;
  /** Why a value could not be measured (the lane or limit responsible). */
  reason?: string;
  /** How the value was obtained — disclosure only, never an input to status. */
  method?: string;
  /** Sample disclosure: files read against files in scope. */
  covered?: { files_read: number; files_in_scope: number };
  /** Identifier of the counting rule (`source-v1`), so a rule change is
   *  distinguishable from a change in the target. */
  scope?: string;
}

/** Whole-tree shape plus the single line magnitude. */
export interface IdentitySize {
  /** Status of the tree counts; `lines` carries its own status. */
  status: IdentityStatus;
  files?: number;
  directories?: number;
  reason?: string;
  /** At most one line magnitude, never decomposed and never distributed. */
  lines?: IdentityItem;
}

/** One language's share of the tree's in-scope source files. */
export interface IdentityLanguage {
  name: string;
  /** Share of in-scope source files, 0–1. */
  share: number;
  files: number;
}

/** The sealed target-identity block: subject, shape, size, stack — no other
 *  axis, and no value an indicator row grades. */
export interface ReportIdentity {
  /** What the target is. */
  subject: {
    repo: string;
    /** Full commit sha, or the literal `unknown`. */
    commit: string;
    scanned_at: string;
  };
  /** How it is shaped. */
  shape: {
    status: IdentityStatus;
    archetype: string;
    confidence?: string;
    planes?: Record<string, boolean>;
    plane_evidence?: Record<string, string[]>;
    /** Per-root entries when the target has more than one root. */
    per_root?: Array<{
      root: string;
      archetype: string;
      confidence?: string;
      planes?: Record<string, boolean>;
    }>;
    reason?: string;
  };
  /** How big it is. */
  size: IdentitySize;
  /** What it is built from. */
  stack: {
    status: IdentityStatus;
    languages: IdentityLanguage[];
    primary_language?: string;
    ecosystems: string[];
    /** Presence-only framework names: no version, no support status. */
    frameworks: string[];
    /** Legacy-stack census (VB6/Delphi), presence-only. */
    legacy_stacks?: Array<{ id: string; detected: boolean; files: number }>;
    reason?: string;
  };
}

/** Every field name the identity block declares (top level and nested). The
 *  membership rule is checkable rather than a matter of taste: no name here may
 *  be a metric an indicator row grades. */
export const IDENTITY_FIELD_NAMES = [
  "subject",
  "shape",
  "size",
  "stack",
  "repo",
  "commit",
  "scanned_at",
  "status",
  "archetype",
  "confidence",
  "planes",
  "plane_evidence",
  "per_root",
  "root",
  "files",
  "directories",
  "reason",
  "lines",
  "value",
  "method",
  "covered",
  "scope",
  "languages",
  "name",
  "share",
  "primary_language",
  "ecosystems",
  "frameworks",
  "legacy_stacks",
  "id",
  "detected",
  "files_read",
  "files_in_scope",
] as const;

/** Round to two significant figures. The producer stores what the renderer
 *  prints for `estimated` values, so nobody quotes false precision out of the
 *  JSON. */
export function twoSignificantFigures(value: number): number {
  if (!Number.isFinite(value) || value === 0) return 0;
  const magnitude = Math.pow(10, Math.floor(Math.log10(Math.abs(value))) - 1);
  return Math.round(value / magnitude) * magnitude;
}

/** Compact magnitude at two significant figures: `420000` → `420k`,
 *  `1247` → `1.2k`, `58` → `58`. Display only — sealed values stay exact. */
function compactMagnitude(value: number): string {
  const abs = Math.abs(value);
  if (abs < 1000) return String(Math.round(abs));
  const units = [
    { div: 1e3, suffix: "k" },
    { div: 1e6, suffix: "M" },
    { div: 1e9, suffix: "B" },
  ];
  let index = 0;
  for (let i = 0; i < units.length; i++) if (abs >= units[i].div) index = i;
  let scaled = twoSignificantFigures(abs / units[index].div);
  if (scaled >= 1000 && index < units.length - 1) {
    index += 1;
    scaled = twoSignificantFigures(abs / units[index].div);
  }
  return `${String(Number(scaled.toFixed(2)))}${units[index].suffix}`;
}

/** The one display string for an identity value. `measured` prints the rounded
 *  magnitude with no marker; `estimated` prints the same magnitude behind the
 *  approximation marker; `unknown` states that the value was not measured and
 *  names the reason. Every surface calls this — site, CLI markdown, CLI HTML —
 *  so an approximation marker can never be hand-written into a fixture. */
export function identityValueLabel(item: IdentityItem): string {
  if (item.status === "unknown" || typeof item.value !== "number" || !Number.isFinite(item.value)) {
    const reason = String(item.reason ?? "").trim();
    return reason ? `not measured — ${reason}` : "not measured";
  }
  const text = compactMagnitude(item.value);
  return item.status === "estimated" ? `~${text}` : text;
}

/** The status word beside an identity value, from the emitted status alone. */
export function identityStatusLabel(item: IdentityItem): string {
  if (item.status === "measured") return "measured";
  if (item.status === "estimated") return "estimated";
  return "not measured";
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
    /** True when a proven kill-switch gate capped the band (Gates G1–G8): the
     * tier was lowered to the cap regardless of the score. The score itself is
     * never altered — a capped run reports its honest number with a capped band. */
    gate_capped?: boolean;
    /** The band the score alone would have earned, kept when `gate_capped` is
     * true so a reader can see what the cap displaced. Never set otherwise. */
    uncapped_tier?: string;
    /** The proven gates that fired the cap (ids), ordered as sealed. */
    capped_by_gates?: string[];
  };
  coverage: CoverageCounts;
  gates: Gate[];
  categories: CategoryScore[];
  top_blockers: TopBlocker[];
  deep_dive_scope: DeepDiveScopeEntry[];
  full_table: IndicatorRow[];
  /** Derived next-band path (band-path): present unless the headline was
   * suppressed; derived from the sealed rows, never scored. */
  next_band_path?: NextBandPath;
  /** Target identity (report-identity): what the scanned code is. Optional so
   * envelopes written before it existed stay valid; absent means "the identity
   * pass did not run", never "no identity to report". Never fingerprinted. */
  identity?: ReportIdentity;
  /** Provenance of the sealed run (report-envelope): the producers that actually
   * ran and the vendored snapshot version ids that joined the fingerprint. */
  provenance?: {
    tool_manifest: Array<{ tool: string; version: string }>;
    snapshot_versions?: Record<string, string>;
  };
  /** True only for authored demo/sample data; a scan of a real target omits it
   * or sets it false (detector-honesty report self-description). */
  sample?: boolean;
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
  /** Comparability input (report-envelope: comparability inputs on the envelope):
   * the indicator ids this run's slice requested — every full-table row that is
   * not `not_implemented`. Absent (never `[]`) on envelopes written before the
   * field existed, so absence stays distinguishable from an empty set; such an
   * envelope is reconstructed by `resolveRequestedIndicators`. */
  requested_indicators?: string[];
  /** Comparability input: the headline score policy that sealed this run
   * (`frozen` | `legacy`). Already a fingerprinted input; recorded here so a
   * differ can read it from `meta` without opening the report body. */
  score_policy?: string;
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

/** The band a proven kill-switch gate caps to: any proven gate caps the verdict
 * at `High`; a score already in `Critical` stays there (the cap is a ceiling,
 * never a floor). Single definition — the sealed verdict and every surface read
 * this, so no display can disagree with the seal. */
export const GATE_CAPPED_TIER: string = "High";

/** Apply the kill-switch cap to a band. Returns the band plus the disclosure
 * fields (what the score alone earned, which gates fired) when the cap moved it. */
export function gateCapForTier(
  tier: string,
  provenGateIds: readonly string[],
): { tier: string; capped: boolean; uncappedTier?: string; cappedByGates: string[] } {
  const fired = provenGateIds.filter((id) => String(id).trim() !== "");
  if (fired.length === 0) return { tier, capped: false, cappedByGates: [] };
  if (tier === "Critical") return { tier, capped: false, cappedByGates: fired };
  const capped = tier !== GATE_CAPPED_TIER;
  return capped
    ? { tier: GATE_CAPPED_TIER, capped: true, uncappedTier: tier, cappedByGates: fired }
    : { tier, capped: false, cappedByGates: fired };
}

export function tierLegacyFor(tier: string): string {
  if (tier === "Low") return "Healthy";
  if (tier === "High") return "High Risk";
  return tier;
}

/** Public band floors — Critical 0 · High 27 · Moderate 53 · Low 80. Derived
 * from the one threshold table above, so a band gate can never drift from the
 * vocabulary the report renders (band-path D4). */
export const BAND_FLOORS = {
  critical: 0,
  high: TIER_THRESHOLDS.high,
  moderate: TIER_THRESHOLDS.moderate,
  low: TIER_THRESHOLDS.low,
} as const;

export type PublicBandName = keyof typeof BAND_FLOORS;

/** Contract threshold for a public band name; undefined when the name is not
 * part of the public band vocabulary. */
export function bandThresholdFor(name: string | null | undefined): number | undefined {
  const key = String(name ?? "").trim().toLowerCase() as PublicBandName;
  return Object.prototype.hasOwnProperty.call(BAND_FLOORS, key) ? BAND_FLOORS[key] : undefined;
}

/** The next band above a sealed score: its public label and contract
 * threshold, or null when the score already sits in the highest band. */
export function nextBandForScore(score: number): { band: string; threshold: number } | null {
  let best: { band: string; threshold: number } | null = null;
  for (const floor of Object.values(BAND_FLOORS)) {
    if (floor > score && (best === null || floor < best.threshold)) {
      best = { band: tierForScore(floor), threshold: floor };
    }
  }
  return best;
}

/** The next band above a sealed score: the nearest band threshold the score has
 * not already reached, walking the contract's band vocabulary. `scoreTier` is the
 * sealed (possibly gate-capped) band and is never offered back as its own
 * destination. Returns null at the top band, so no destination is invented. */
export function nextBandForTier(
  score: number,
  scoreTier?: string,
): { band: string; threshold: number } | null {
  const normalized = String(scoreTier ?? "").trim().toLowerCase();
  let best: { band: string; threshold: number } | null = null;
  for (const [name, floor] of Object.entries(BAND_FLOORS) as Array<[PublicBandName, number]>) {
    if (name.toLowerCase() === normalized) continue;
    if (floor <= score) continue;
    if (best === null || floor < best.threshold) best = { band: tierForScore(floor), threshold: floor };
  }
  return best;
}

/** Distance from a sealed verdict to the next band: `threshold − score`, exactly
 * as the band-path spec pins it. A kill-switch cap caps the *band*; the score
 * keeps its honest value, so the ground to cover stays `threshold − score` even
 * when a proven gate lowered the band. Clamped at 0: a path never claims
 * negative ground to cover. */
export function bandPathDistance(
  threshold: number,
  score: number,
  _scoreTier?: string,
): number {
  return Math.max(0, threshold - score);
}

/** Percentage-point display for a derived path: two decimals, trailing zeros
 * trimmed (6.1, 2.22). Display only — the sealed values stay exact. */
export function formatPp(pp: number): string {
  return String(Number(pp.toFixed(2)));
}

/** The gate-cap disclosure as a sentence: what fired, what the score alone
 * earned, and that the cap lifts when the gate clears. Rendered beside the
 * path, so a capped reader is never told to "reach" the band the report says
 * they are already in. */
export function gateCapStatement(cappedByGates: readonly string[], uncappedTier: string): string {
  const gates = cappedByGates.filter((id) => String(id).trim() !== "").join(", ");
  const plural = cappedByGates.length === 1 ? "" : "s";
  return `Proven gate${plural} ${gates || "—"} cap${plural === "" ? "s" : ""} this verdict at ${GATE_CAPPED_TIER} — the score alone earned ${uncappedTier}, and the cap lifts when the gate clears.`;
}

// ---------------------------------------------------------------------------
// Band palette — the one owner of band → hex (score-badge D8). The values are
// the site's tier tokens (`apps/site/app/globals.css`); an SVG cannot read a CSS
// custom property, so the mapping lives here beside the band vocabulary and
// every badge renderer consumes it instead of hardcoding four hexes.
// ---------------------------------------------------------------------------

export const BAND_PALETTE = {
  Low: "#22c55e",
  Moderate: "#e0a00a",
  High: "#ef4444",
  Critical: "#9f1d2c",
} as const;

export type BandPaletteName = keyof typeof BAND_PALETTE;

/** Tier color for a public band name, case-insensitive. An unrecognised name
 * falls back to the most severe band so a badge claim is never left untinted. */
export function bandColorFor(tier: string | null | undefined): string {
  const key = String(tier ?? "").trim().toLowerCase();
  for (const name of Object.keys(BAND_PALETTE) as BandPaletteName[]) {
    if (name.toLowerCase() === key) return BAND_PALETTE[name];
  }
  return BAND_PALETTE.Critical;
}

/** Local subject slug: normalized directory basename (lowercased, unsafe chars → `-`). */
export function localSlugFromPath(raw: string): string {
  const base = raw.replace(/[/\\]+$/, "").split(/[/\\]/).filter(Boolean).pop() ?? "scan";
  const slug = base.toLowerCase().replace(/[^a-z0-9.\-]+/g, "-").replace(/^-+|-+$/g, "");
  return slug || "scan";
}

// ---------------------------------------------------------------------------
// Score badge — a derived view over an already-sealed envelope (capability
// score-badge). The badge states four facts (score, band, coverage, scan month)
// and never introduces, recomputes, or reinterprets a graded quantity. Design
// rationale: openspec/specs/score-badge/.
// ---------------------------------------------------------------------------

/** Coverage floor for headline suppression: the headline is withheld when fewer
 * than this fraction of attempted rows are gradeable (measured + estimated).
 * One constant, one quantity — the badge's displayed coverage is the same ratio,
 * so a printed percentage and a printed score can never come from different
 * definitions (score-badge D2). */
export const COVERAGE_FLOOR = 0.5;

/** The badge's coverage: gradeable rows over attempted rows.
 *
 *   (measured + estimated) / (measured + estimated + unknown)
 *
 * `not_applicable` and `not_implemented` rows are already absent from the
 * counts, so an unimplemented detector is never presented as the scanned
 * subject's deficiency. Returns a ratio in `[0, 1]` — the exact quantity the
 * suppression floor compares — and `0` when nothing was attempted. */
export function badgeCoverage(
  coverage: { measured?: number; estimated?: number; unknown?: number } | null | undefined,
): number {
  const count = (v: unknown): number => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : 0;
  };
  const measured = count(coverage?.measured);
  const estimated = count(coverage?.estimated);
  const unknown = count(coverage?.unknown);
  const attempted = measured + estimated + unknown;
  if (attempted === 0) return 0;
  return (measured + estimated) / attempted;
}

/** Sealed-report permalink base. The badge links to the run's sealed report,
 * not to the marketing surface; the assessment next-step link stays
 * single-sourced by `release-funnel`. */
export const REPORT_BASE_URL = "https://leapscore.dev/reports";

/** Site origin, and the methodology path every report closes with
 * (release-funnel: "Methodology link resolves in-repo"). The emitters compose
 * these two rather than typing a URL, so the CLI's link and the site's route
 * cannot drift apart into a dead path. */
export const SITE_BASE_URL = "https://leapscore.dev";
export const METHODOLOGY_PATH = "/methodology";
export const METHODOLOGY_URL = `${SITE_BASE_URL}${METHODOLOGY_PATH}`;

/** Build the citation target for a sealed run. Shared so the CLI emitter and
 * any later surface cannot drift on the route (score-badge D9). */
export function reportPermalinkFor(runId: string): string {
  return `${REPORT_BASE_URL}/${encodeURIComponent(String(runId ?? ""))}`;
}

/** Constant label segment: the same badge, whichever state it discloses. */
export const BADGE_LABEL = "leapscore";

/** The badge's disclosure states. `absent` is the fixture refusal — no badge is
 * produced — and is never returned by `badgeViewModel` (score-badge D3). */
export type BadgeState = "scored" | "suppressed" | "incomplete" | "not-scanned" | "absent";

/** Render-agnostic badge model: the emitters own markup only, so the SVG and
 * the embed snippet cannot disagree on a fact, a label, or a sentence. */
export interface BadgeViewModel {
  state: Exclude<BadgeState, "absent">;
  /** Fixed label segment (`leapscore`). */
  label: string;
  /** Full value segment, e.g. `62 Moderate · 61% · 2026-10`. */
  value: string;
  /** Primary claim — the tinted segment: `62 Moderate`, `unscored`, `not scanned`. */
  claim: string;
  /** Subordinate qualifier — coverage, month, and any disclosure marker. */
  qualifier: string;
  /** Full accessible sentence (aria-label / alt text). */
  accessibleName: string;
  /** The run's sealed-report URL. */
  permalink: string;
  /** Public band for the claim tint; null when the badge states no band. */
  band: string | null;
}

/** A badge request that cannot produce an honest artifact. The message names
 * which refusal fired (fixture vs delta) so the caller can report it. */
export class BadgeRefusalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BadgeRefusalError";
  }
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/** A sealed scan whose verdict is not `complete` is incomplete: a surface was
 * truncated, unreadable, or out of root, so the sealed number is a floor rather
 * than a clean measurement. `complete`/`degraded` is the contract's status
 * vocabulary; the badge discloses the non-complete verdict rather than hiding
 * it. */
export function isIncompleteScanStatus(status: string | null | undefined): boolean {
  const s = String(status ?? "").trim().toLowerCase();
  return s !== "" && s !== "complete";
}

/** `scanned_at` truncated to `YYYY-MM` in UTC — the badge's only time-derived
 * content, read from the envelope and never from generation time (D6). */
export function badgeMonth(scannedAt: string): string {
  const date = new Date(scannedAt);
  if (Number.isNaN(date.getTime())) {
    throw new BadgeRefusalError(
      `refusing to mint a badge: report.snapshot.scanned_at is not a parseable timestamp (got ${JSON.stringify(scannedAt)})`,
    );
  }
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** The month's display name for the accessible sentence, from `YYYY-MM`. */
function monthName(month: string): string {
  const index = Number(month.slice(5, 7)) - 1;
  const name = MONTH_NAMES[index];
  return name ? `${name} ${month.slice(0, 4)}` : month;
}

/**
 * Derive the badge view model from a sealed envelope.
 *
 * Reads only `report.headline`, `report.coverage`, `report.status`,
 * `report.snapshot.scanned_at`, and `meta` — no second threshold table, no
 * recomputation of a graded quantity. Refuses (throws `BadgeRefusalError`) a
 * fixture (`report.sample === true`) and a run-diff delta document, naming
 * which refusal fired (D10).
 */
export function badgeViewModel(envelope: unknown): BadgeViewModel {
  if (isDeltaDocument(envelope)) {
    throw new BadgeRefusalError(
      "refusing to mint a badge from a run-diff delta document: a delta is not a sealed envelope and states no sealed score — pass the report.json envelope it was derived from",
    );
  }
  const env = envelope as Partial<ReportEnvelope> | null | undefined;
  const report = env?.report as Report | undefined;
  const meta = env?.meta as EnvelopeMeta | undefined;
  if (!report || typeof report !== "object" || !meta || typeof meta !== "object") {
    throw new BadgeRefusalError(
      "refusing to mint a badge: not a sealed report envelope (missing meta or report)",
    );
  }
  if (report.sample === true) {
    throw new BadgeRefusalError(
      "refusing to mint a badge from a sample fixture (report.sample is true): an authored fixture has no measured run to cite — scan the repository to seal a real envelope",
    );
  }
  const runId = typeof meta.runId === "string" ? meta.runId.trim() : "";
  if (!runId) {
    throw new BadgeRefusalError("refusing to mint a badge: sealed envelope has no meta.runId to cite");
  }

  const month = badgeMonth(String(report.snapshot?.scanned_at ?? ""));
  const ratio = badgeCoverage(report.coverage);
  const attempted = (report.coverage?.measured ?? 0) + (report.coverage?.estimated ?? 0) + (report.coverage?.unknown ?? 0);
  const coveragePct = Math.round(ratio * 100);
  const suppressed = report.headline?.suppressed === true;
  const incomplete = isIncompleteScanStatus(report.status);
  const tier = typeof report.headline?.tier === "string" ? report.headline.tier.trim() : "";
  const score = Number(report.headline?.score);
  // Integer score display: floor keeps the printed number inside the same band
  // the report sealed (53–79 Moderate etc.), so a rounded score can never read
  // as a band it does not have.
  const displayScore = Number.isFinite(score) ? Math.floor(score) : 0;
  const band = !suppressed && attempted > 0 && tier !== "" ? tier : null;

  let state: BadgeViewModel["state"];
  let claim: string;
  let qualifier: string;

  if (attempted === 0) {
    state = "not-scanned";
    claim = "not scanned";
    qualifier = month;
  } else if (suppressed) {
    state = "suppressed";
    claim = "unscored";
    qualifier = `${coveragePct}% · ${month}${incomplete ? " · incomplete" : ""}`;
  } else {
    state = incomplete ? "incomplete" : "scored";
    claim = `${displayScore} ${band ?? ""}`.trim();
    qualifier = `${coveragePct}% · ${month}${incomplete ? " · incomplete" : ""}`;
  }

  const value = `${claim} · ${qualifier}`;

  const accessibleName =
    state === "not-scanned"
      ? `LeapScore badge: not scanned, measured ${monthName(month)}.`
      : state === "suppressed"
        ? `LeapScore badge: unscored — insufficient signal, ${coveragePct}% gradeable, measured ${monthName(month)}.${incomplete ? " Scan incomplete." : ""}`
        : `LeapScore badge: score ${displayScore}, band ${band}, ${coveragePct}% gradeable, measured ${monthName(month)}.${incomplete ? " Scan incomplete." : ""}`;

  return {
    state,
    label: BADGE_LABEL,
    value,
    claim,
    qualifier,
    accessibleName,
    permalink: reportPermalinkFor(runId),
    band,
  };
}

// ---------------------------------------------------------------------------
// Assessment funnel — the only telemetry is the click on this tracked link.
// ---------------------------------------------------------------------------

/**
 * Positioning line — the single source for the sentence every human-readable
 * report ends with (CLI report.html/report.md and site report surfaces).
 * Verbatim, never re-typed in an emitter or component.
 */
export const POSITIONING_LINE =
  "LeapScore sees the structure. The assessment understands what the code does.";

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
// Next-band path block — one grammar for every surface that renders the derived
// path (site report views, CLI report.html, CLI report.md, CLI stdout). The
// emitters own markup only; the wording lives here so a surface cannot drift
// from the sealed field (report-envelope: no duplicated grammar).
// ---------------------------------------------------------------------------

const BAND_PATH_CLASS_META: Record<BandPathCostClass, { label: string; effort: string }> = {
  sprint: { label: "Sprint", effort: "⚡ ≤30 min" },
  quarter: { label: "Quarter", effort: "🔶 2–4 h" },
  structural: { label: "Structural", effort: "🔷 1–2 days" },
};

export interface BandPathBlockStep {
  row: string;
  name: string;
  /** Signed recoverable points, e.g. `+2.22pp`. */
  pp: string;
  effort: string;
  quick_win?: string;
}

export interface BandPathBlockClass {
  label: string;
  effort: string;
  /** Recoverable points within this class alone, e.g. `4.2pp`. */
  total: string;
  /** Recoverable points through this class and every class before it. */
  cumulative: string;
  /** Arrival state as a sentence naming the destination. */
  arrival: string;
  steps: BandPathBlockStep[];
}

/** Render-agnostic model of the sealed path block: emitters map it to markup. */
export interface BandPathBlock {
  heading: string;
  /** Destination-and-distance sentence, or the terminal statement. */
  statement: string;
  classes: BandPathBlockClass[];
  /** Present only when no class reaches the destination. */
  shortfall: string | null;
  /** Disclosure of rows the path could not reach; null when it reached all. */
  unreached: string | null;
  /** What the recoverable-points arithmetic assumes (band-path D8). */
  assumption: string;
}

export function bandPathBlock(path: NextBandPath, opts: { tier: string; score: number }): BandPathBlock {
  const unreached =
    path.unreached_rows > 0
      ? `${path.unreached_rows} row${path.unreached_rows === 1 ? "" : "s"} could not be reached by this path (unknown or not implemented).`
      : null;
  const assumption =
    "Assumes applicability is unchanged — a fix that adds or removes a plane can move the denominators.";
  const heading = "Path to the next band";
  if (path.terminal) {
    return {
      heading,
      statement: `Already at the highest band (${opts.tier}) — no next band to reach.`,
      classes: [],
      shortfall: null,
      unreached,
      assumption,
    };
  }
  const destination = path.destination ?? "";
  const needed = path.points_needed ?? 0;
  const classes: BandPathBlockClass[] = path.classes.map((c) => {
    const meta = BAND_PATH_CLASS_META[c.class];
    const arrival =
      c.arrival === "alone"
        ? `${meta.label} alone reaches ${destination}`
        : c.arrival === "combined"
          ? `${meta.label} crosses only with the classes before it`
          : `${meta.label} stays short of ${destination}`;
    return {
      label: meta.label,
      effort: meta.effort,
      total: `${formatPp(c.pp)}pp`,
      cumulative: `${formatPp(c.cumulative_pp)}pp`,
      arrival,
      steps: c.steps.map((s) => ({
        row: s.row,
        name: s.name,
        pp: `+${formatPp(s.recoverable_pp)}pp`,
        effort: s.effort,
        ...(s.quick_win ? { quick_win: s.quick_win } : {}),
      })),
    };
  });
  const last = path.classes[path.classes.length - 1];
  const reaches = last !== undefined && last.cumulative_pp >= needed;
  const shortfall = reaches
    ? null
    : `No combination of graded deductions reaches ${destination} — ${formatPp(needed - (last?.cumulative_pp ?? 0))}pp short${
        path.unreached_rows > 0
          ? `, and ${path.unreached_rows} row${path.unreached_rows === 1 ? "" : "s"} this path could not reach would have to be graded first`
          : ""
      }.`;
  return {
    heading,
    statement: `Reach ${destination} — ${formatPp(needed)}pp needed (band floor ${path.threshold}, sealed ${opts.score}).`,
    classes,
    shortfall,
    unreached,
    assumption,
  };
}

/** Compact stdout clause (band-path D7): destination, distance, and the class
 * that crosses — or the honest non-arrival / terminal state. */
export function formatBandPathClause(path: NextBandPath, tier: string): string {
  if (path.terminal) return `next:none (at ${tier})`;
  const head = `next:${path.destination} +${formatPp(path.points_needed ?? 0)}pp`;
  const crossing = path.classes.find((c) => c.arrival !== "not-reached");
  if (!crossing) return `${head} unreachable`;
  if (crossing.arrival === "alone") return `${head} via ${crossing.class}`;
  const chain = path.classes.filter((c) => c.cumulative_pp <= crossing.cumulative_pp).map((c) => c.class);
  return `${head} via ${chain.join("+")}`;
}

// ---------------------------------------------------------------------------
// run-diff — the derived delta document (capability `run-diff`).
//
// Defined exactly once, here: the CLI and any later consumer import this
// definition. A delta is NOT an envelope — it carries no score fingerprint, is
// not accepted by ingest, and modifies neither input envelope.
// ---------------------------------------------------------------------------

/** Document marker for the derived comparison artifact written beside the
 *  sealed trio as `report.delta.json`. */
export const DELTA_DOCUMENT = "run-delta";

/** Schema version of the delta document itself (independent of the envelope's
 *  `contractVersion`: a delta is a derived view, never a sealed report). */
export const DELTA_SCHEMA_VERSION = 1;

/** Every reported row difference carries exactly one kind
 *  (`run-diff`: delta-kind taxonomy with attribution precedence). */
export type DeltaKind =
  | "scored-change"
  | "coverage-change"
  | "applicability-change"
  | "implementation-change"
  | "model-change";

/** A row that entered or left the graded set between the two runs, or whose
 *  applicability flipped. Emitted instead of a score delta for its case. */
export type DeltaTransition =
  | "became-graded"
  | "became-ungraded"
  | "became-applicable"
  | "became-not-applicable"
  | "became-implemented";

/** Report-level comparability verdict, computed before any delta
 *  (`run-diff`: comparability verdict before any delta). */
export type ComparabilityVerdict =
  | "comparable"
  | "comparable-with-coverage-change"
  | "comparable-with-row-exclusions"
  | "incomparable";

/** Why an `incomparable` verdict refused the comparison. */
export type ComparabilityBlockingCause =
  | "subject-mismatch"
  | "fingerprint-era-mismatch"
  | "rubric-version-mismatch"
  | "missing-comparability-inputs";

/** The inputs a comparability verdict is computed from; each is reported as
 *  matched or differed so a reader can tell what was held constant. Engine
 *  identity is listed but never blocking (design D1). */
export type ComparabilityInputName =
  | "subject"
  | "fingerprint-era"
  | "rubric-version"
  | "requested-indicators"
  | "producer-versions"
  | "engine-identity"
  | "score-policy";

export interface ComparabilityInputReport {
  name: ComparabilityInputName;
  matched: boolean;
  /** What was compared, named concretely (values or counts). */
  detail: string;
}

export interface DeltaProducerExclusion {
  tool: string;
  baseline_version: string;
  current_version: string;
}

export interface DeltaVerdict {
  status: ComparabilityVerdict;
  /** Present exactly when `status === "incomparable"`. */
  cause?: ComparabilityBlockingCause;
  /** Which fingerprinted inputs the rows were withheld for; empty unless the
   *  verdict is `comparable-with-row-exclusions`. */
  row_exclusions?: { rows: string[]; producers: DeltaProducerExclusion[] };
  /** Every comparability input this verdict was computed from. */
  inputs: ComparabilityInputReport[];
}

/** One side of a comparison: enough identity to re-read or re-baseline it. */
export interface DeltaRunReference {
  runId: string;
  /** Sealed headline score, or `null` when the headline was suppressed. */
  score: number | null;
  tier: string;
  suppressed: boolean;
  score_fingerprint?: string;
  fingerprint_version?: number;
  /** Run-scoped identity, so baseline age is visible in the artifact. */
  ranAt?: string;
  repoSha?: string;
  rubric_version?: string;
  engine_version?: string;
  engineSha7?: string;
}

export interface DeltaRowDifference {
  row: string;
  name?: string;
  category?: string;
  kind: DeltaKind;
  from: { status: RowStatus; score?: number };
  to: { status: RowStatus; score?: number };
  /** Signed row-score movement; present only for rows graded in both runs. */
  score_delta?: number;
  /** Present instead of a score delta for a row graded in only one run. */
  transition?: DeltaTransition;
  /** The row's own recorded reason for an applicability transition
   *  (`reason` / `unknown_measure_path` of the run the row entered). */
  transition_reason?: string;
  /** Evidence pointers the transitioned row recorded, when it carried any. */
  transition_evidence?: string[];
  /** Set when the producing tool's identity or version differs per row. */
  producer?: { tool: string; from: string; to: string };
}

export interface DeltaTransitionEntry {
  row: string;
  transition: DeltaTransition;
  kind: DeltaKind;
  reason?: string;
  evidence?: string[];
}

/** Headline movement decomposed by delta kind (`run-diff`: headline
 *  decomposition). Parts are ∈ {code, coverage, model} plus a disclosed
 *  residual; `statement` is the one-sentence reading of the decomposition. */
export interface DeltaHeadlineDecomposition {
  baseline: number;
  current: number;
  /** current − baseline, from the two sealed headlines. */
  movement: number;
  code_attributable: number;
  coverage_attributable: number;
  model_attributable: number;
  /** Residual that could not be attributed — disclosed, never absorbed. */
  unattributable: number;
  /** Headline policy the decomposition was computed under. */
  policy: string;
  /** True when the code-attributable part is zero and the headline moved. */
  no_code_change_measured: boolean;
  statement: string;
  /** Rows withheld from code attribution and why. */
  attribution_notes: string[];
}

/** The derived comparison document (`report.delta.json`): two run references,
 *  the verdict with its blocking cause, the headline decomposition, the per-row
 *  differences with their kinds, and the transition list. Never sealed. */
export interface DeltaDocument {
  document: typeof DELTA_DOCUMENT;
  delta_schema: number;
  baseline: DeltaRunReference;
  current: DeltaRunReference;
  verdict: DeltaVerdict;
  /** Absent for an `incomparable` verdict: no numbers are emitted at all. */
  headline?: DeltaHeadlineDecomposition;
  rows: DeltaRowDifference[];
  transitions: DeltaTransitionEntry[];
}

/** True when a parsed JSON document is a run-diff delta rather than a sealed
 *  envelope. Ingest uses this to skip a delta explicitly (design D9). */
export function isDeltaDocument(value: unknown): value is DeltaDocument {
  if (!value || typeof value !== "object") return false;
  const doc = value as Partial<DeltaDocument>;
  return (
    doc.document === DELTA_DOCUMENT &&
    typeof doc.delta_schema === "number" &&
    !!doc.baseline &&
    typeof doc.baseline === "object" &&
    !!doc.current &&
    typeof doc.current === "object" &&
    !!doc.verdict &&
    typeof doc.verdict === "object"
  );
}

export type RequestedIndicatorsResolution =
  | { ok: true; indicators: string[]; source: "recorded" | "reconstructed" }
  | { ok: false; reason: "missing-comparability-inputs"; detail: string };

/** Resolve a run's requested indicator set for comparison (design D3).
 *
 *  Recorded when `meta.requested_indicators` is present — an empty array is a
 *  recorded empty set, so absence is never read as "nothing was requested".
 *  Otherwise reconstructed from the report's full table: a row is requested
 *  precisely when it is not `not_implemented`, which is exact because
 *  `not_implemented` already means "the rubric lists it and this slice does not
 *  build it". Refuses only when neither input exists. */
export function resolveRequestedIndicators(input: {
  meta?: { requested_indicators?: unknown } | null;
  report?: { full_table?: unknown } | null;
}): RequestedIndicatorsResolution {
  const recorded = input.meta?.requested_indicators;
  if (Array.isArray(recorded)) {
    const ids = [...new Set(recorded.map((id) => String(id)))].sort();
    return { ok: true, indicators: ids, source: "recorded" };
  }
  const table = input.report?.full_table;
  if (Array.isArray(table) && table.length > 0) {
    const ids = [
      ...new Set(
        table
          .filter((r) => (r as { status?: string })?.status !== "not_implemented")
          .map((r) => String((r as { id?: unknown })?.id ?? ""))
          .filter((id) => id !== ""),
      ),
    ].sort();
    return { ok: true, indicators: ids, source: "reconstructed" };
  }
  return {
    ok: false,
    reason: "missing-comparability-inputs",
    detail:
      "no requested_indicators on meta and no full table to reconstruct from — request the set explicitly by re-sealing rather than assuming a comparison",
  };
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
