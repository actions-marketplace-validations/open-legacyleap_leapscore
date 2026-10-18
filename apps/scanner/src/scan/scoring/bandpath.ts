/** apps/scanner/src/scan/scoring/bandpath.ts — derived next-band path (band-path capability).
 *
 * Pure derivation over an already-sealed score: the sealed row table carries
 * every input (per-row status/score/effort/remediation), the sealed category
 * scores carry the weight/applicable arithmetic, and the compiled registry
 * backstops rows that predate a row-level field. Derived once at seal time and
 * consumed unchanged by every surface — never scored, and excluded from the
 * score fingerprint by construction (design D1/D2).
 */
import {
  nextBandForScore,
  type BandPathArrival,
  type BandPathClass,
  type BandPathCostClass,
  type BandPathStep,
  type NextBandPath,
} from '@leapscore/contracts';

/** ⚡ ≤30 min → sprint · 🔶 2–4 h → quarter · 🔷 1–2 days → structural
 *  (design D3). Any tag we do not recognize falls back to structural so the
 *  path never undersells the cost of a fix. */
export function costClassForEffort(effort: string | null | undefined): BandPathCostClass {
  const tag = String(effort ?? '');
  if (tag.includes('⚡')) return 'sprint';
  if (tag.includes('🔶')) return 'quarter';
  return 'structural';
}

const CLASS_ORDER: BandPathCostClass[] = ['sprint', 'quarter', 'structural'];

/** Registry backstop (id → effort tag / remediation quick win) built from the
 *  compiled rubric; the sealed row itself wins when it carries the values. */
export type BandPathRegistry = Record<string, { effort?: string; quick_win?: string }>;

export function bandPathRegistryFromRubric(rubric: {
  indicators?: Array<{ id?: string; effort?: string; remediation?: { quick_win?: string } | null }>;
}): BandPathRegistry {
  const registry: BandPathRegistry = {};
  for (const indicator of rubric.indicators ?? []) {
    if (!indicator?.id) continue;
    registry[indicator.id] = {
      ...(indicator.effort ? { effort: indicator.effort } : {}),
      ...(indicator.remediation?.quick_win ? { quick_win: indicator.remediation.quick_win } : {}),
    };
  }
  return registry;
}

type SealedPathRow = {
  id?: string;
  name?: string;
  category_id?: string;
  status?: string;
  score?: number;
  not_applicable?: boolean;
  effort?: string;
  remediation?: { quick_win?: string } | unknown;
};

type SealedPathCategory = {
  id?: string;
  weight?: number;
  applicable?: number;
  indicator_rows?: SealedPathRow[];
};

export type DeriveNextBandPathInput = {
  /** Sealed headline score. */
  score: number;
  /** Suppressed headlines have no stated score to measure a distance from. */
  suppressed?: boolean;
  /** Sealed category scores — carry the weight/applicable arithmetic. */
  categories?: SealedPathCategory[];
  /** Sealed row table (`full_table`); falls back to the union of category rows. */
  rows?: SealedPathRow[];
  registry?: BandPathRegistry;
};

/** The sealed row table the path reads: the explicit table when present, the
 *  category rows when it is not (older or reduced envelopes). */
function sealedRowSource(input: DeriveNextBandPathInput): SealedPathRow[] {
  if (input.rows && input.rows.length > 0) return input.rows;
  return (input.categories ?? []).flatMap((category) => category?.indicator_rows ?? []);
}

function quickWinFor(row: SealedPathRow, registry?: BandPathRegistry): string | undefined {
  const rowWin = (row.remediation as { quick_win?: string } | undefined)?.quick_win;
  const win = rowWin?.trim() ? rowWin : registry?.[row.id ?? '']?.quick_win;
  return win?.trim() ? win : undefined;
}

export function deriveNextBandPath(input: DeriveNextBandPathInput): NextBandPath | undefined {
  // No stated score → no distance to measure (spec: Suppressed headline produces no path).
  if (input.suppressed) return undefined;
  const next = nextBandForScore(input.score);
  const sealedRows = sealedRowSource(input);
  // Ungraded debt is disclosed, never presented as absent: `unknown` and
  // `not_implemented` rows are unreached; `not_applicable` is correctly
  // excluded rather than unmeasured (spec: Not-applicable rows are not steps).
  const unreachedRows = sealedRows.filter(
    (row) => row.status === 'unknown' || row.status === 'not_implemented',
  ).length;
  if (!next) {
    // Highest band: terminal marker only; no destination is invented.
    return {
      destination: null,
      threshold: null,
      points_needed: null,
      classes: [],
      unreached_rows: unreachedRows,
      terminal: true,
    };
  }
  const pointsNeeded = next.threshold - input.score;
  const categoryById = new Map<string, SealedPathCategory>();
  for (const category of input.categories ?? []) {
    if (category?.id) categoryById.set(category.id, category);
  }
  // Step candidacy: graded rows (measured/estimated) scoring below the maximum.
  // The recoverable share of a row is (3 − score) × weight / (3 × applicable)
  // with the sealed category's own weight and applicable count — the same
  // arithmetic the headline already seals with, so contributions are additive.
  const byClass: Record<BandPathCostClass, BandPathStep[]> = { sprint: [], quarter: [], structural: [] };
  for (const row of sealedRows) {
    if (row.not_applicable) continue;
    if (row.status !== 'measured' && row.status !== 'estimated') continue;
    const rowScore = row.score;
    if (typeof rowScore !== 'number' || rowScore < 0 || rowScore > 2) continue;
    const category = row.category_id ? categoryById.get(row.category_id) : undefined;
    const weight = typeof category?.weight === 'number' ? category.weight : 0;
    const applicable = typeof category?.applicable === 'number' ? category.applicable : 0;
    if (weight <= 0 || applicable <= 0) continue;
    const recoverablePp = ((3 - rowScore) * weight) / (3 * applicable);
    if (recoverablePp <= 0) continue;
    const step: BandPathStep = {
      row: row.id ?? '',
      name: row.name ?? row.id ?? '',
      recoverable_pp: recoverablePp,
      effort: row.effort ?? input.registry?.[row.id ?? '']?.effort ?? '',
    };
    const quickWin = quickWinFor(row, input.registry);
    if (quickWin) step.quick_win = quickWin;
    byClass[costClassForEffort(step.effort)].push(step);
  }
  const classes: BandPathClass[] = [];
  let cumulativePp = 0;
  for (const costClass of CLASS_ORDER) {
    const steps = byClass[costClass];
    if (steps.length === 0) continue; // a class with no steps is omitted
    // Descending recoverable weight within a class; row id breaks ties so the
    // sealed order never depends on input order.
    steps.sort((a, b) => b.recoverable_pp - a.recoverable_pp || a.row.localeCompare(b.row));
    const pp = steps.reduce((sum, step) => sum + step.recoverable_pp, 0);
    cumulativePp += pp;
    const arrival: BandPathArrival =
      pp >= pointsNeeded ? 'alone' : cumulativePp >= pointsNeeded ? 'combined' : 'not-reached';
    classes.push({ class: costClass, pp, cumulative_pp: cumulativePp, arrival, steps });
  }
  return {
    destination: next.band,
    threshold: next.threshold,
    points_needed: pointsNeeded,
    classes,
    unreached_rows: unreachedRows,
    terminal: false,
  };
}
