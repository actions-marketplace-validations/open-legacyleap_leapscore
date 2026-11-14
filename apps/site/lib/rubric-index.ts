/**
 * The rubric index the site renders (design D3/D4).
 *
 * Server components read the full compiled registry; the search island receives
 * only `RubricIndexEntry` — ID, name, category, tier, default status, gates, effort.
 * No prose field crosses into a client module.
 */
import {
  CATEGORY_CHARTERS,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  CATEGORY_WEIGHTS,
  INDICATOR_REGISTRY,
  type IndicatorMeta,
} from "./generated/rubric";
import {
  COVERAGE_TOTAL,
  isIndicatorImplemented,
} from "./generated/coverage";
import { categoryPrefix } from "./rubric-links";

/** The index payload: classification only, never prose (design D3). */
export type RubricIndexEntry = {
  id: string;
  name: string;
  category: string;
  tier: string;
  status: string;
  gates: string[];
  effort: string;
};

export type RubricStatus = "measured" | "estimated" | "unknown" | "not_implemented";

function categoryPosition(code: string): number {
  return CATEGORY_ORDER.indexOf(code as (typeof CATEGORY_ORDER)[number]);
}

function numericId(id: string): number {
  return Number(id.split("-")[1] ?? 0);
}

/** Every registry row in category order, then numeric ID order. */
export function registryEntries(): IndicatorMeta[] {
  return Object.values(INDICATOR_REGISTRY).sort(
    (a, b) =>
      categoryPosition(a.category) - categoryPosition(b.category) ||
      numericId(a.id) - numericId(b.id),
  );
}

/** The serializable index the client island filters. */
export const RUBRIC_INDEX: RubricIndexEntry[] = registryEntries().map((entry) => ({
  id: entry.id,
  name: entry.name,
  category: entry.category,
  tier: entry.tier,
  status: entry.default_status,
  gates: entry.gates,
  effort: entry.effort,
}));

/** The status this release can actually put on a row. */
export function releaseStatus(id: string): RubricStatus {
  if (!isIndicatorImplemented(id)) return "not_implemented";
  return INDICATOR_REGISTRY[id]?.default_status as RubricStatus;
}

export type StatusCounts = Record<RubricStatus, number> & {
  total: number;
};

/** Release coverage in the vocabulary the report uses — sums to the rubric denominator. */
export function releaseStatusCounts(): StatusCounts {
  const counts: StatusCounts = {
    measured: 0,
    estimated: 0,
    unknown: 0,
    not_implemented: 0,
    total: COVERAGE_TOTAL,
  };
  for (const entry of RUBRIC_INDEX) counts[releaseStatus(entry.id)] += 1;
  return counts;
}

export type DefaultStatusCounts = {
  measured: number;
  estimated: number;
  unknown: number;
  total: number;
};

/** The rubric's declared measurement mode — a catalog property, not release coverage. */
export function defaultStatusCounts(entries: readonly IndicatorMeta[] = registryEntries()): DefaultStatusCounts {
  const counts: DefaultStatusCounts = { measured: 0, estimated: 0, unknown: 0, total: entries.length };
  for (const entry of entries) {
    if (entry.default_status === "measured") counts.measured += 1;
    else if (entry.default_status === "estimated") counts.estimated += 1;
    else counts.unknown += 1;
  }
  return counts;
}

export type TierCounts = { A: number; B: number; C: number; D: number };

export function tierCounts(entries: readonly IndicatorMeta[]): TierCounts {
  const counts: TierCounts = { A: 0, B: 0, C: 0, D: 0 };
  for (const entry of entries) {
    const tier = entry.tier as keyof TierCounts;
    if (tier in counts) counts[tier] += 1;
  }
  return counts;
}

export type CategorySummary = {
  code: string;
  name: string;
  prefix: string;
  thesis: string;
  summary: string;
  baseWeight: number | null;
  feActiveWeight: number | null;
  entries: IndicatorMeta[];
  count: number;
  tiers: TierCounts;
  defaultStatus: DefaultStatusCounts;
};

/** One row per category for the index page. */
export function categorySummaries(): CategorySummary[] {
  return CATEGORY_ORDER.map((code) => {
    const entries = registryEntries().filter((entry) => entry.category === code);
    const weights = CATEGORY_WEIGHTS[code];
    const charter = CATEGORY_CHARTERS[code];
    return {
      code,
      name: CATEGORY_LABELS[code] ?? code,
      prefix: categoryPrefix(code),
      thesis: charter?.thesis ?? "",
      summary: charter?.summary ?? "",
      baseWeight: weights?.base ?? null,
      feActiveWeight: weights?.feActive ?? null,
      entries,
      count: entries.length,
      tiers: tierCounts(entries),
      defaultStatus: defaultStatusCounts(entries),
    };
  });
}

/** The indicators of one category, in registry order. */
export function categoryEntries(code: string): IndicatorMeta[] {
  return registryEntries().filter((entry) => entry.category === code);
}

/** The category code for a two-digit route prefix, or null when the prefix is unknown. */
export function codeForPrefix(prefix: string): string | null {
  return (
    CATEGORY_ORDER.find((code) => categoryPrefix(code) === prefix) ?? null
  );
}

export type SampleRowLink = { slug: string; anchor: string };

/** The first committed sample row that exercised an indicator, or null (no fabricated link). */
export function firstRowLink(
  index: Record<string, SampleRowLink[]>,
  id: string,
): SampleRowLink | null {
  return index[id]?.[0] ?? null;
}
