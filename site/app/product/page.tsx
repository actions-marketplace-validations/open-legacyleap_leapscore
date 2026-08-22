import type { Metadata } from "next";

import { UrlBox } from "@/components/url-box";
import { WaitlistForm } from "@/components/waitlist-form";
import { CATEGORIES, weightFor } from "@/lib/categories";

export const metadata: Metadata = {
  title: "Product",
};

export default function ProductPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">
        A report for your repo. Every point explained.
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        A LeapScore report is three things: a score for how bad the codebase is,
        the evidence behind every point of that score, and the remediation to
        raise it — ordered by how much it moves the number.{" "}
        <a
          href="/report/sample"
          className="text-ink transition-colors hover:text-foreground"
        >
          See one done →
        </a>
      </p>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">What you get</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="instrument-panel rounded-lg p-4">
            <h3 className="text-sm font-medium">The score</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              One 0–100 number, banded into a tier. Rolled up from ten weighted
              categories, not a vibe.
            </p>
          </div>
          <div className="instrument-panel rounded-lg p-4">
            <h3 className="text-sm font-medium">The evidence</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              Every point links to a tool output, a file, or a stated proxy.
              Nothing is asserted without a reason.
            </p>
          </div>
          <div className="instrument-panel rounded-lg p-4">
            <h3 className="text-sm font-medium">The fix plan</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              The highest-return remediation first: scorer points gained per
              hour invested, computed from the evidence.
            </p>
          </div>
        </div>
        <p className="mt-3 text-xs text-faint">
          All three are rendered in the{" "}
          <a
            href="/report/sample"
            className="text-ink transition-colors hover:text-foreground"
          >
            sample report
          </a>
          .
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">What it reads</h2>
        <p className="mt-2 text-sm text-muted">
          Ten categories, each a set of indicators with an explicit weight.
        </p>
        <table className="mt-4 w-full text-sm">
          <tbody>
            {CATEGORIES.map((c) => {
              const w = weightFor(c.id);
              return (
                <tr
                  key={c.id}
                  className="border-b border-hairline last:border-0"
                >
                  <td className="w-20 py-2 font-mono text-xs text-faint">
                    {c.id}
                  </td>
                  <td className="py-2 text-muted">{c.name}</td>
                  <td className="hidden py-2 text-xs text-faint sm:table-cell">
                    {c.one_liner}
                  </td>
                  <td className="w-16 py-2 text-right font-mono text-ink">
                    {w ?? "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-faint">
          Weights are percent; the FE category is scored only when a repo has a
          real client.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Who it&apos;s for</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="instrument-panel rounded-lg p-4">
            <h3 className="text-sm font-medium">
              The engineer who owns the repo
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              Score your own codebase, prove the case with evidence, and get the
              work list your lead will sign off on.
            </p>
          </div>
          <div className="instrument-panel rounded-lg p-4">
            <h3 className="text-sm font-medium">The curious developer</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              Benchmark a library, check a dependency, or read how good code
              reads. Every report is a lesson in what maintenance costs.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Why the number can be trusted</h2>
        <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted">
          <li className="flex gap-2">
            <span className="font-mono text-xs text-faint">measured</span>
            <span>
              rows are backed by a tool run or a file read. This is the truth
              the report hangs on.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-mono text-xs text-faint">estimated</span>
            <span>
              rows are stated inferences, capped and confidence-tagged — never
              dressed up as fact.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-mono text-xs text-faint">unknown</span>
            <span>
              rows are surfaced, not hidden. They are the list of what a deeper
              scan would measure — a feature, not a gap.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-mono text-xs text-faint">gates G1–G8</span>
            <span>
              hard kill-switches for what must never be red — portfolio-risking
              issues cap the verdict no matter the score.
            </span>
          </li>
        </ul>
        <p className="mt-3 text-xs text-faint">
          The whole model is on the{" "}
          <a
            href="/method"
            className="text-ink transition-colors hover:text-foreground"
          >
            method
          </a>{" "}
          page; the rubric it runs against is{" "}
          <a
            href="../CODEDEBT_AUDIT_RUBRIC/README.md"
            className="text-ink transition-colors hover:text-foreground"
          >
            published, all 102 indicators
          </a>
          .
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">What it is not</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted">
          <li>
            Not a meanness contest — it is a weighted cost-of-maintenance read.
          </li>
          <li>
            Not proportional to fix effort — remediation is ordered separately.
          </li>
          <li>
            Not static-only — it mixes measured evidence, stated estimates, and
            explicit unknowns.
          </li>
        </ul>
        <p className="mt-3 text-xs text-faint">
          The full arithmetic lives on the{" "}
          <a
            href="/method"
            className="text-ink transition-colors hover:text-foreground"
          >
            method
          </a>{" "}
          page.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Where we are now</h2>
        <ol className="mt-4 space-y-3 text-sm leading-relaxed text-muted">
          <li className="flex gap-2">
            <span className="font-mono text-xs text-faint">today</span>
            <span>
              the sample report is live and fully rendered — real rubric, real
              math, authored evidence.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-mono text-xs text-faint">next</span>
            <span>
              the live engine that turns any pasted URL into a scored report —
              in development behind the waitlist.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-mono text-xs text-faint">later</span>
            <span>
              deep scans that convert{" "}
              <span className="font-mono text-xs">unknown</span> into{" "}
              <span className="font-mono text-xs">measured</span> by running
              your tests and probing the environment.
            </span>
          </li>
        </ol>
      </section>

      <section className="mt-12 flex flex-col items-center gap-4 border-t border-hairline py-12 text-center">
        <p className="text-sm text-muted">
          Score one for yourself — sample first, live when ready.
        </p>
        <UrlBox />
        <p className="text-xs text-faint">
          Free reports stay free — Deep Scan is the only way to convert{" "}
          <span className="font-mono">unknown</span> into{" "}
          <span className="font-mono">measured</span>.
        </p>
        <WaitlistForm />
      </section>
    </div>
  );
}
