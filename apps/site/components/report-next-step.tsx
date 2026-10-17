"use client";

import {
  POSITIONING_LINE,
  assessmentCtaForBand,
  assessmentUrlForBand,
} from "@leapscore/contracts";

import { publicTierLabel, tierForScore } from "@/lib/scoring";

/**
 * Closing next-step band on every site report surface (spec: release-funnel).
 * Renders, in order: the band-specific sentence, the tracked assessment link,
 * and the positioning line — all from the shared contracts helpers, so the
 * site and the CLI reports cannot drift. The tracked URL appears once, as the
 * link target.
 */
export function ReportNextStep({
  tier,
  score,
}: {
  tier?: string;
  score: number;
}) {
  const band = publicTierLabel(tier) ?? tierForScore(score).label;
  const sentence = assessmentCtaForBand(band);
  const url = assessmentUrlForBand(band);
  return (
    <section
      className="mt-10 rounded-lg border border-hairline bg-panel/30 p-5"
      aria-label="Next step"
    >
      <p className="text-sm text-muted">{sentence}</p>
      <a
        href={url}
        className="mt-2 inline-block text-sm font-medium text-ink underline underline-offset-2 hover:text-foreground"
      >
        Continue to the assessment
      </a>
      <p className="mt-4 text-xs text-faint">{POSITIONING_LINE}</p>
    </section>
  );
}
