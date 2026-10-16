/** apps/surface/src/rows.ts — ticket scope from the sealed envelope (plan 15 §5) */

export type EnvelopeRow = {
  id: string;
  name: string;
  category_id?: string;
  category?: string;
  status: string;
  score?: number;
  reason?: string;
  evidence?: {
    tool?: string;
    pointers?: Array<Record<string, string | number>>;
    facts?: Record<string, unknown>;
  };
  effort?: string;
  remediation?: {
    quick_win?: string;
    structural?: string;
    gold_standard?: string;
    effort?: string;
  };
  not_applicable?: boolean;
  [k: string]: unknown;
};

/** Uppercase category for a row: explicit field first, indicator prefix as fallback. */
export function categoryOf(row: EnvelopeRow): string {
  const raw = row.category_id || row.category || row.id.split('-')[0] || '';
  return String(raw).toUpperCase();
}

function isTicketableScore(score: unknown): score is number {
  return Number.isInteger(score) && (score as number) >= 0 && (score as number) <= 2;
}

/**
 * All applicable non-Green rows mint/update tickets: status measured|estimated,
 * integer score 0–2. Unknown, not-applicable, Green (3), and scoreless rows never mint.
 */
export function selectSurfaceRows(fullTable: unknown): EnvelopeRow[] {
  if (!Array.isArray(fullTable)) return [];
  return (fullTable as EnvelopeRow[]).filter(
    (r) =>
      r &&
      typeof r.id === 'string' &&
      (r.status === 'measured' || r.status === 'estimated') &&
      !r.not_applicable &&
      isTicketableScore(r.score),
  );
}
