/** band-path change verification — derivation (tasks 2.1–2.5). */
import { describe, it, expect } from 'vitest';
import {
  bandPathRegistryFromRubric,
  costClassForEffort,
  deriveNextBandPath,
} from '../scoring/bandpath';

type Row = {
  id: string;
  name: string;
  category_id: string;
  status: string;
  score?: number;
  effort?: string;
  remediation?: { quick_win: string } | unknown;
  not_applicable?: boolean;
};

function row(over: Partial<Row> & { id: string }): Row {
  return { name: over.id, category_id: 'SEC', status: 'measured', ...over };
}

function category(id: string, weight: number, applicable: number, rows: Row[]) {
  return { id, weight, applicable, indicator_rows: rows };
}

describe('2.1 destination and distance arithmetic', () => {
  it('a High seal names Moderate 53 with points_needed 5', () => {
    const path = deriveNextBandPath({
      score: 48,
      categories: [
        category('SEC', 50, 10, [row({ id: 'SEC-01', score: 1, effort: '🔶 ~2–4 h' })]),
      ],
    });
    expect(path).toBeDefined();
    expect(path!.destination).toBe('Moderate');
    expect(path!.threshold).toBe(53);
    expect(path!.points_needed).toBe(5);
    expect(path!.terminal).toBe(false);
    // The one graded row scores 1 → (3−1)×50/(3×10) ≈ 3.33pp recoverable.
    expect(path!.classes).toHaveLength(1);
    expect(path!.classes[0].class).toBe('quarter');
    expect(path!.classes[0].steps[0].row).toBe('SEC-01');
    expect(path!.classes[0].steps[0].recoverable_pp).toBeCloseTo(10 / 3, 10);
  });
});

describe('2.2 step candidacy from graded rows', () => {
  it('only measured/estimated rows scoring 0–2 become steps; unreached excludes not-applicable', () => {
    const secRows = [
      row({ id: 'SEC-01', score: 0, effort: '⚡ ≤30 min', remediation: { quick_win: 'rotate the key' } }),
      row({ id: 'SEC-02', score: 3, effort: '🔶 ~2–4 h' }), // Green — no step
      row({ id: 'SEC-04', status: 'estimated', score: 2, effort: '🔷 ~1–2 days' }),
      row({ id: 'SEC-05', status: 'unknown', effort: '⚡ ≤30 min' }),
      row({ id: 'SEC-06', status: 'unknown', effort: '⚡ ≤30 min' }),
      row({ id: 'SEC-03', status: 'not_applicable', not_applicable: true, effort: '⚡ ≤30 min' }),
    ];
    const fullTable = [...secRows, row({ id: 'API-09', category_id: 'API', status: 'not_implemented' })];
    const path = deriveNextBandPath({
      score: 48,
      categories: [category('SEC', 30, 5, secRows)],
      rows: fullTable,
    });
    const steps = path!.classes.flatMap((c) => c.steps);
    expect(steps.map((s) => s.row).sort()).toEqual(['SEC-01', 'SEC-04']);
    // Green rows, unknown rows, and not-applicable rows contribute no step.
    expect(steps.some((s) => s.row === 'SEC-02')).toBe(false);
    // 2 unknown + 1 not_implemented disclosed; the N/A row is correctly excluded.
    expect(path!.unreached_rows).toBe(3);
    // Step carries cost and payoff: ⚡ row exposes its quick win, estimated row its 🔷 tag.
    const sec01 = steps.find((s) => s.row === 'SEC-01')!;
    expect(sec01.effort).toBe('⚡ ≤30 min');
    expect(sec01.quick_win).toBe('rotate the key');
    expect(sec01.recoverable_pp).toBeCloseTo((3 * 30) / (3 * 5), 10);
    expect(steps.find((s) => s.row === 'SEC-04')!.effort).toBe('🔷 ~1–2 days');
  });

  it('falls back to the category rows when no explicit sealed table is provided', () => {
    const path = deriveNextBandPath({
      score: 48,
      categories: [
        category('SEC', 30, 3, [
          row({ id: 'SEC-01', score: 1, effort: '⚡ ≤30 min' }),
          row({ id: 'SEC-05', status: 'unknown', effort: '⚡ ≤30 min' }),
          row({ id: 'SEC-03', status: 'not_applicable', not_applicable: true, effort: '⚡ ≤30 min' }),
        ]),
      ],
    });
    expect(path!.classes.flatMap((c) => c.steps).map((s) => s.row)).toEqual(['SEC-01']);
    expect(path!.unreached_rows).toBe(1);
  });

  it('registry backstops effort and quick win only when the row lacks them', () => {
    const registry = bandPathRegistryFromRubric({
      indicators: [
        { id: 'SEC-01', effort: '⚡ ≤30 min', remediation: { quick_win: 'from registry' } },
        { id: 'SEC-02', effort: '🔶 ~2–4 h', remediation: { quick_win: 'registry two' } },
      ],
    });
    const path = deriveNextBandPath({
      score: 48,
      registry,
      categories: [
        category('SEC', 30, 6, [
          row({ id: 'SEC-01', score: 1 }), // row carries neither → registry wins
          row({ id: 'SEC-02', score: 1, effort: '🔷 ~1–2 days', remediation: { quick_win: 'row wins' } }),
        ]),
      ],
    });
    const steps = path!.classes.flatMap((c) => c.steps);
    const sec01 = steps.find((s) => s.row === 'SEC-01')!;
    expect(sec01.effort).toBe('⚡ ≤30 min');
    expect(sec01.quick_win).toBe('from registry');
    const sec02 = steps.find((s) => s.row === 'SEC-02')!;
    expect(sec02.effort).toBe('🔷 ~1–2 days');
    expect(sec02.quick_win).toBe('row wins');
  });
});

describe('2.3 cost classification and cumulative arrival', () => {
  it('sprint falls short alone and sprint+quarter crosses; totals accumulate in class order', () => {
    // weight 60 / applicable 30 → 2/3pp per lost point. Sprint = 2 + 4/3,
    // quarter = 2 → alone short (3.33 < 5), cumulative crosses (5.33 ≥ 5).
    const path = deriveNextBandPath({
      score: 48,
      categories: [
        category('SEC', 60, 30, [
          row({ id: 'SEC-01', score: 0, effort: '⚡ ≤30 min' }),
          row({ id: 'SEC-02', score: 1, effort: '⚡ ≤30 min' }),
          row({ id: 'SEC-04', score: 0, effort: '🔶 ~2–4 h' }),
        ]),
      ],
    });
    expect(path!.classes.map((c) => c.class)).toEqual(['sprint', 'quarter']);
    const [sprint, quarter] = path!.classes;
    expect(sprint.pp).toBeCloseTo(2 + 4 / 3, 10);
    expect(sprint.cumulative_pp).toBeCloseTo(2 + 4 / 3, 10);
    expect(sprint.arrival).toBe('not-reached');
    expect(quarter.pp).toBeCloseTo(2, 10);
    expect(quarter.cumulative_pp).toBeCloseTo(16 / 3, 10);
    expect(quarter.arrival).toBe('combined');
    // Descending recoverable weight within the class.
    expect(sprint.steps.map((s) => s.row)).toEqual(['SEC-01', 'SEC-02']);
  });

  it('a class whose own total crosses is marked alone; class order is sprint, quarter, structural', () => {
    // weight 90 / applicable 30 → 1pp per lost point. Sprint totals 8 ≥ 5.
    const path = deriveNextBandPath({
      score: 48,
      categories: [
        category('SEC', 90, 30, [
          row({ id: 'SEC-01', score: 0, effort: '⚡ ≤30 min' }),
          row({ id: 'SEC-02', score: 0, effort: '⚡ ≤30 min' }),
          row({ id: 'SEC-03', score: 1, effort: '🔶 ~2–4 h' }),
          row({ id: 'SEC-04', score: 2, effort: '🔷 ~1–2 days' }),
        ]),
      ],
    });
    expect(path!.classes.map((c) => c.class)).toEqual(['sprint', 'quarter', 'structural']);
    expect(path!.classes[0].arrival).toBe('alone');
    expect(path!.classes[0].cumulative_pp).toBeCloseTo(6, 10);
    expect(path!.classes[1].arrival).toBe('combined');
    expect(path!.classes[2].cumulative_pp).toBeCloseTo(9, 10);
  });

  it('cost classes map from the verify-effort tag; unrecognized tags never undersell cost', () => {
    expect(costClassForEffort('⚡ ≤30 min')).toBe('sprint');
    expect(costClassForEffort('🔶 ~2–4 h')).toBe('quarter');
    expect(costClassForEffort('🔷 ~1–2 days')).toBe('structural');
    expect(costClassForEffort('')).toBe('structural');
    expect(costClassForEffort(undefined)).toBe('structural');
    expect(costClassForEffort('some future tag')).toBe('structural');
  });
});

describe('2.4 terminal band', () => {
  it('the highest band marks terminal with no destination and no steps', () => {
    const path = deriveNextBandPath({
      score: 85,
      categories: [
        category('SEC', 30, 6, [row({ id: 'SEC-01', score: 1, effort: '⚡ ≤30 min' })]),
      ],
    });
    expect(path).toEqual({
      destination: null,
      threshold: null,
      points_needed: null,
      classes: [],
      unreached_rows: 0,
      terminal: true,
    });
  });
});

describe('2.5 suppressed headline', () => {
  it('an insufficient-signal verdict produces no path at all (absent, not empty)', () => {
    const path = deriveNextBandPath({
      score: 0,
      suppressed: true,
      categories: [
        category('SEC', 30, 6, [row({ id: 'SEC-01', score: 1, effort: '⚡ ≤30 min' })]),
      ],
    });
    expect(path).toBeUndefined();
  });
});
