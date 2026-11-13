import type { Metadata } from "next";
import Link from "next/link";

import { assessmentAttribution, assessmentBookingHref } from "@/lib/assessment";
import { ASSESSMENT_BASE_URL } from "@leapscore/contracts";

export const metadata: Metadata = {
  title: "The $0 Assessment",
  description:
    "Book the $0 Assessment: what it is, how the local scan works, what report data is requested, and how it is handled.",
};

/**
 * The assessment destination every report CTA points at. Data-handling copy
 * renders before the booking link, so a visitor knows what is asked for and how
 * it is handled before submitting anything.
 */
export default async function AssessmentPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const attribution = assessmentAttribution(params);
  const booking = assessmentBookingHref(params);
  const attributionLabel = [
    `campaign ${attribution.campaign}`,
    attribution.band ? `band ${attribution.band}` : null,
    attribution.verdict ? `verdict ${attribution.verdict}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-xs tracking-wider text-faint uppercase">Next step</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">
        The $0 Assessment
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        A 30-minute conversation about the report you already have. LeapScore
        answers <em>what is structurally risky</em>; the assessment is where we
        read the result together and scope what a fix would involve. It is free
        and does not require a code upload.
      </p>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">The scan runs locally</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          You run <span className="font-mono text-xs">npx leapscore-scan .</span>{" "}
          on your own machine. The scanner makes no network requests for a local
          path scan, sends no code, paths, or repository names, and requires no
          code upload. <span className="font-mono text-xs">--repo owner/repo</span>{" "}
          is a separate, explicit public-repository scan; it is never implied.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">What we ask for, and how it is handled</h2>
        <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted">
          <li>
            A copy of the report you choose to share — the self-contained{" "}
            <span className="font-mono text-xs">report.html</span>,{" "}
            <span className="font-mono text-xs">report.md</span>, or{" "}
            <span className="font-mono text-xs">report.json</span> — or a short
            screen share instead.
          </li>
          <li>
            You choose whether to share it. The report is a file, not a hosted
            permalink; it is stored for the assessment conversation and not
            republished.
          </li>
          <li>
            The report file itself is not code. Do not attach source code unless
            you want it discussed; the assessment does not require it.
          </li>
          <li>
            Booking attribution carries the campaign and, when the report had
            one, the band or the suppressed verdict. It carries no repository
            name, code, or absolute path.
          </li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Deeper work needs separate consent</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          MCM (Modernisation and Capability Mapping) or any deeper engagement is
          separate from the $0 Assessment. It requires its own consent, scope,
          and process — nothing beyond the free assessment starts automatically,
          and no code or repository access is assumed.
        </p>
      </section>

      <section className="mt-10 rounded-lg border border-hairline bg-panel/30 p-5">
        <h2 className="text-lg font-semibold">Book the assessment</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {booking.kind === "mailto"
            ? "The booking vendor is not configured yet, so this opens a pre-addressed email. Your attribution travels with the request; nothing is submitted until you send it."
            : "This opens the booking page with your report's attribution attached. Nothing is submitted until you confirm there."}
        </p>
        {attributionLabel ? (
          <p className="mt-1 text-xs text-faint">Attribution carried: {attributionLabel}</p>
        ) : null}
        <a
          href={booking.href}
          className="mt-4 inline-block rounded bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
        >
          Book the $0 Assessment
        </a>
        <p className="mt-3 text-xs text-faint">
          You can also read the{" "}
          <Link href="/method" className="underline underline-offset-2 hover:text-foreground">
            method
          </Link>{" "}
          or run the{" "}
          <Link href="/report/sample" className="underline underline-offset-2 hover:text-foreground">
            sample report
          </Link>{" "}
          first.
        </p>
      </section>
    </div>
  );
}
