/**
 * Filtering for the rubric index island (design D3).
 *
 * This module imports the entry *type* only: the client bundle never reaches the
 * generated registry or its prose. The page passes the classification payload in.
 */
import type { RubricIndexEntry } from "./rubric-index";

export type RubricFilter = {
  term?: string;
  tier?: string;
  status?: string;
  /** A gate ID (`G1`…`G8`) or `none` for rows that feed no gate. */
  gate?: string;
};

/** Apply the index filters; an empty filter returns the full catalog. */
export function filterRubricIndex(
  entries: readonly RubricIndexEntry[],
  filter: RubricFilter,
): RubricIndexEntry[] {
  const needle = (filter.term ?? "").trim().toLowerCase();
  return entries.filter((entry) => {
    if (needle && !`${entry.id} ${entry.name}`.toLowerCase().includes(needle)) {
      return false;
    }
    if (filter.tier && entry.tier !== filter.tier) return false;
    if (filter.status && entry.status !== filter.status) return false;
    if (filter.gate === "none" && entry.gates.length > 0) return false;
    if (filter.gate && filter.gate !== "none" && !entry.gates.includes(filter.gate)) {
      return false;
    }
    return true;
  });
}

export type RubricFacets = {
  tiers: Record<string, number>;
  statuses: Record<string, number>;
  gates: Record<string, number>;
  noGate: number;
};

/** How many indicators each filter option would leave, before other filters apply. */
export function rubricFacets(entries: readonly RubricIndexEntry[]): RubricFacets {
  const facets: RubricFacets = { tiers: {}, statuses: {}, gates: {}, noGate: 0 };
  for (const entry of entries) {
    facets.tiers[entry.tier] = (facets.tiers[entry.tier] ?? 0) + 1;
    facets.statuses[entry.status] = (facets.statuses[entry.status] ?? 0) + 1;
    if (entry.gates.length === 0) facets.noGate += 1;
    for (const gate of entry.gates) {
      facets.gates[gate] = (facets.gates[gate] ?? 0) + 1;
    }
  }
  return facets;
}
