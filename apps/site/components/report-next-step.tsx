"use client";

import {
  POSITIONING_LINE,
  assessmentNextStep,
  type AssessmentHeadline,
} from "@leapscore/contracts";

import { publicTierLabel } from "@/lib/scoring";

/**
 * Closing next-step band on every site report surface (spec: release-funnel).
 * Renders, in order: the verdict-specific sentence, the tracked assessment
 * link, and the positioning line — all from the shared contracts helper, so
 * the site and the CLI reports cannot drift. A suppressed headline gets the
 * coverage-limit sentence and a link that carries no band parameter. The
 * tracked URL appears once, as the link target.
 */
export function ReportNextStep({ headline }: { headline: AssessmentHeadline }) {
  // A stored envelope may still carry a one-release legacy alias; normalize it
  // to the public band before the contract resolves the next step.
  const step = assessmentNextStep({
    tier: publicTierLabel(headline.tier) ?? headline.tier,
    suppressed: headline.suppressed,
    verdict: headline.verdict,
  });
  return (
    <section
      className="mt-10 rounded-lg border border-hairline bg-panel/30 p-5"
      aria-label="Next step"
    >
      <p className="text-sm text-muted">{step.sentence}</p>
      <a
        href={step.url}
        className="mt-2 inline-block text-sm font-medium text-ink underline underline-offset-2 hover:text-foreground"
      >
        Continue to the assessment
      </a>
      <p className="mt-4 text-xs text-faint">{POSITIONING_LINE}</p>
    </section>
  );
}
