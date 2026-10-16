/** apps/surface/src/labels.ts — fixed label taxonomy (plan 15 §8) */
import { categoryOf } from './rows';
import type { EnvelopeRow } from './rows';

export const NAMESPACE_LABEL = 'leapscore';

const CATEGORY_LABELS: Record<string, string> = {
  ECOS: 'ecos',
  ARCH: 'arch',
  TEST: 'test',
  SEC: 'sec',
  DATA: 'data',
  API: 'api',
  VEL: 'vel',
  PERF: 'perf',
  DOCS: 'docs',
  FE: 'fe',
};

export function categoryLabel(row: EnvelopeRow): string {
  const cat = categoryOf(row);
  return `leapscore:${CATEGORY_LABELS[cat] ?? cat.toLowerCase()}`;
}

export function severityLabel(score: number): string {
  return `leapscore:${score <= 1 ? 'red' : 'yellow'}`;
}

export type LabelContext = {
  row: EnvelopeRow;
  slug: string;
  inGate: boolean;
};

/** Full label set, recomputed every sync: namespace + severity + category + gate? + target. */
export function labelsFor(ctx: LabelContext): string[] {
  const labels = [NAMESPACE_LABEL, severityLabel(ctx.row.score ?? 0), categoryLabel(ctx.row), `leapscore:target-${ctx.slug}`];
  if (ctx.inGate) labels.push('leapscore:gate');
  return labels;
}
