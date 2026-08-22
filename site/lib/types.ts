/*
 * Report contract — mirrors PLANS/06_DATA_MODEL_API.md §2–§5.
 * The ReportProvider returns exactly this shape; the UI renders it and
 * never reaches past it. A live adapter replaces the mock at the same seam.
 */

export type RowStatus = "measured" | "estimated" | "unknown";

export type RowScore = 0 | 1 | 2 | 3;

export type GateStatus = "proven" | "not-proven" | "needs-verification";

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
  /** present only for measured/estimated; unknown rows never score */
  score?: RowScore;
  verdict_text?: string;
  score_confidence?: "low" | "medium";
  /** reason written by the scorer from facts — never generic */
  reason?: string;
  /** measured ⇒ non-empty */
  evidence?: Evidence;
  /** estimated ⇒ present + confidence, score clamped to {1,2} */
  basis?: Basis;
  /** unknown ⇒ "what it takes to make this measured" */
  unknown_measure_path?: string;
  /** rubric-derived remediation; present on rows the UI expands */
  remediation?: Remediation;
  /** extension beyond 06 (which has no N/A): FE rows on a non-FE repo */
  not_applicable?: boolean;
  effort: string;
}

export interface CategoryScore {
  id: string;
  name: string;
  /** percent, from CODEDEBT_AUDIT_RUBRIC/11 §1 (base set) */
  weight: number;
  /** rows in the denominator (standard rows minus unknown/N-A) */
  applicable: number;
  scored_sum: number;
  /** (Σ scores ÷ applicable×3) × 100, derived — never hand-typed */
  category_score: number;
  /** category% × weight, in percentage points */
  weighted_contribution: number;
  status_counts: {
    measured: number;
    estimated: number;
    unknown: number;
    not_applicable: number;
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
  /** display percentages over the 76 standard rows, e.g. "65%" */
  measured_pct: string;
  estimated_pct: string;
  unknown_pct: string;
}

export interface TopBlocker {
  row: string;
  name: string;
  points_lost: number;
  /** percentage points recoverable if this row hit 3 */
  weight_pp: string;
  summary: string;
}

export interface DeepDiveScopeEntry {
  row: string;
  name: string;
  what_it_takes: string;
}

export interface Report {
  report_schema: string;
  id: string;
  status: "complete";
  snapshot: {
    repo: string;
    scanned_at: string;
    engine_version: string;
    rubric_version: string;
  };
  headline: {
    score: number;
    /** display tier, top of band for readability */
    tier: string;
    ci_band: string;
  };
  coverage: CoverageCounts;
  gates: Gate[];
  categories: CategoryScore[];
  top_blockers: TopBlocker[];
  deep_dive_scope: DeepDiveScopeEntry[];
  /**
   * Extension beyond 06: the flattened 102-row audit view (standard + deep-dive
   * + FE annex) for the "inspect all 102" toggle. Deep-dive/FE rows carry
   * `unknown`/`not_applicable` and fold into no denominator — a render
   * affordance only, never math.
   */
  full_table: IndicatorRow[];
  sample: true;
}

export interface ReportQuery {
  repo?: string;
}
