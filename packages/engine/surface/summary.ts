/** packages/engine/surface/summary.ts — summary contract (plan 15 §9–§10) */

export type SurfaceCounts = {
  opened: number;
  commented: number;
  closed: number;
  skipped: number;
};

export const zeroCounts = (): SurfaceCounts => ({ opened: 0, commented: 0, closed: 0, skipped: 0 });

/** One human line: `surface: 3 opened / 5 commented / 1 closed / 0 skipped`. */
export function formatSummaryLine(c: SurfaceCounts): string {
  return `surface: ${c.opened} opened / ${c.commented} commented / ${c.closed} closed / ${c.skipped} skipped`;
}

export type StepSummaryInput = {
  counts: SurfaceCounts;
  firstScan: boolean;
  warnings: string[];
  skippedReason?: string;
};

/** Step-summary markdown: counts + burst notes + warnings + skip reasons. */
export function formatStepSummary(input: StepSummaryInput): string {
  const lines = [`## LeapScore surface`, '', formatSummaryLine(input.counts), ''];
  if (input.firstScan && input.counts.opened > 0) {
    lines.push(
      `First-scan burst: ${input.counts.opened} issues opened. GitHub offers no notify-free issue creation — this burst happens once; steady state is newly-degraded rows only.`,
      '',
    );
  }
  if (input.skippedReason) {
    lines.push(`surface-skipped: ${input.skippedReason}`, '');
  }
  for (const w of input.warnings) lines.push(`- Warning: ${w}`);
  if (input.warnings.length) lines.push('');
  return lines.join('\n');
}
