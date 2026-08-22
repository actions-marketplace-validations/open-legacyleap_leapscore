/*
 * Scoring math — mirrors CODEDEBT_AUDIT_RUBRIC/11 §1–§3.
 *   Category% = (Σ applicable row scores ÷ applicable × 3) × 100
 *   System    = Σ (category% × weight)
 * Exact by construction: contributions are computed over a shared integer
 * denominator, so the recompute lands on 58.00 (see lib/score.consistency.test.ts).
 * deep-dive rows fold into a category only when run; here (standard audit)
 * they carry status `unknown` and are excluded from both numerator and
 * denominator, as are `not_applicable` (FE) rows.
 */

import type {
  CategoryScore,
  IndicatorRow,
  Report,
  TopBlocker,
} from "@/lib/types";

export type CategoryId =
  "ECOS" | "ARCH" | "TEST" | "SEC" | "DATA" | "API" | "VEL" | "PERF" | "DOCS";

/** Base weight set — canonical source: CODEDEBT_AUDIT_RUBRIC/11 §1. */
export const BASE_WEIGHTS: Record<CategoryId, number> = {
  ECOS: 10,
  ARCH: 15,
  TEST: 10,
  SEC: 20,
  DATA: 10,
  API: 10,
  VEL: 10,
  PERF: 10,
  DOCS: 5,
};

export const TIERS = [
  { label: "Healthy", min: 80, color: "healthy" },
  { label: "Moderate", min: 53, color: "moderate" },
  { label: "High Risk", min: 27, color: "high" },
  { label: "Critical", min: 0, color: "critical" },
] as const;

export type TierColor = (typeof TIERS)[number]["color"];

export function tierForScore(score: number): (typeof TIERS)[number] {
  for (const t of TIERS) {
    if (score >= t.min) return t;
  }
  return TIERS[TIERS.length - 1];
}

function gcd(a: bigint, b: bigint): bigint {
  while (b) {
    [a, b] = [b, a % b];
  }
  return a;
}

/** rows that participate in the category denominator */
function scoredRows(rows: IndicatorRow[]): IndicatorRow[] {
  return rows.filter((r) => !r.not_applicable && r.status !== "unknown");
}

function applicableCount(rows: IndicatorRow[]): number {
  return scoredRows(rows).length;
}

function scoredSum(rows: IndicatorRow[]): number {
  return scoredRows(rows).reduce((s, r) => s + (r.score ?? 0), 0);
}

function statusCounts(rows: IndicatorRow[]): CategoryScore["status_counts"] {
  return {
    measured: rows.filter((r) => r.status === "measured").length,
    estimated: rows.filter((r) => r.status === "estimated").length,
    unknown: rows.filter((r) => r.status === "unknown" && !r.not_applicable)
      .length,
    not_applicable: rows.filter((r) => r.not_applicable).length,
  };
}

export interface ScoredCategory {
  category: CategoryScore;
}

/**
 * Roll a category up. `weight` in percent. category_score rounded to ⅓%
 * granularity for display; weighted_contribution kept to 3 decimals so the
 * exact system total stays derivable.
 */
export function scoreCategory(
  meta: { id: string; name: string; weight: number },
  rows: IndicatorRow[],
): CategoryScore {
  const applicable = applicableCount(rows);
  const sum = scoredSum(rows);
  const percent = applicable ? (sum / (3 * applicable)) * 100 : 0;
  return {
    id: meta.id,
    name: meta.name,
    weight: meta.weight,
    applicable,
    scored_sum: sum,
    category_score: percent,
    weighted_contribution: (percent * meta.weight) / 100,
    status_counts: statusCounts(rows),
    indicator_rows: rows,
  };
}

export interface ScoreResult {
  /** displayed headline, exact to the cent (e.g. 58) */
  score: number;
  cents: number;
  categories: CategoryScore[];
}

/**
 * System score in exact cents (0–100 × 100). All per-point contributions are
 * integer multiples of den (a common denominator of every 3·applicable), so
 * the sum is exact int arithmetic — no float drift.
 */
export function scoreSystem(
  categories: {
    meta: { id: string; name: string; weight: number };
    rows: IndicatorRow[];
  }[],
): ScoreResult {
  const applicable = categories.map((c) => applicableCount(c.rows));
  const den = applicable
    .filter((a) => a > 0)
    .reduce<bigint>((d, a) => {
      const k = BigInt(3 * a);
      return (d / gcd(d, k)) * k; // lcm
    }, BigInt(1));

  let centsScaled = BigInt(0);
  const scored = categories.map(({ meta, rows }) => {
    const app = applicableCount(rows);
    const sum = scoredSum(rows);
    if (app > 0) {
      centsScaled +=
        BigInt(sum) * BigInt(meta.weight * 100) * (den / BigInt(3 * app));
    }
    return scoreCategory(meta, rows);
  });

  const cents = Number(centsScaled / den);
  return { score: cents / 100, cents, categories: scored };
}

export function coverageCounts(
  groups: { indicator_rows: IndicatorRow[] }[],
): Report["coverage"] {
  const rows = groups.flatMap((c) => c.indicator_rows);
  const na = rows.filter((r) => r.not_applicable).length;
  const nonNa = rows.filter((r) => !r.not_applicable);
  const m = nonNa.filter((r) => r.status === "measured").length;
  const e = nonNa.filter((r) => r.status === "estimated").length;
  const u = nonNa.filter((r) => r.status === "unknown").length;
  const total = m + e + u;
  return {
    measured: m,
    estimated: e,
    unknown: u,
    not_applicable: na,
    measured_pct: pct(m, total),
    estimated_pct: pct(e, total),
    unknown_pct: pct(u, total),
  };
}

function pct(n: number, total: number): string {
  if (!total) return "0%";
  return `${Math.round((n / total) * 100)}%`;
}

/**
 * Top blockers — ranked by percentage points recoverable if the row hit 3
 * (points_lost × category point value), ties broken by ascending score then id.
 */
export function topBlockers(
  categories: CategoryScore[],
  limit = 5,
): TopBlocker[] {
  const out: TopBlocker[] = [];
  for (const c of categories) {
    if (!c.applicable) continue;
    const pointValue = (100 * c.weight) / (3 * c.applicable) / 100; // pp per row point
    for (const r of c.indicator_rows) {
      if (r.status === "unknown" || r.not_applicable || r.score == null)
        continue;
      const lost = 3 - r.score;
      if (lost <= 0) continue;
      out.push({
        row: r.id,
        name: r.name,
        points_lost: lost,
        weight_pp: `${(lost * pointValue).toFixed(2)}pp`,
        summary: r.reason ?? "",
      });
    }
  }
  out.sort((a, b) => {
    const pp = parseFloat(b.weight_pp) - parseFloat(a.weight_pp);
    if (pp !== 0) return pp;
    return a.row.localeCompare(b.row);
  });
  return out.slice(0, limit);
}

export function buildDeepDiveScope(
  categories: CategoryScore[],
): Report["deep_dive_scope"] {
  return categories
    .flatMap((c) => c.indicator_rows)
    .filter((r) => r.status === "unknown" && !r.not_applicable)
    .map((r) => ({
      row: r.id,
      name: r.name,
      what_it_takes: r.unknown_measure_path ?? "",
    }));
}
