import type { Metadata } from "next";

import { CATEGORIES, weightFor } from "@/lib/categories";
import { TIERS } from "@/lib/scoring";

export const metadata: Metadata = {
  title: "Method",
};

export default function MethodPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">
        How a score is made
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        LeapScore reads a repo against a written rubric of 102 indicators across
        10 categories. Up to 31 indicators have a detector today (25 on a local
        scan); the rest are disclosed as not implemented. Each detector grades to
        a four-level taxonomy (0–3), every category rolls up, and the system
        score is the weighted sum — exactly, no guestimates in the arithmetic.
      </p>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Scoring model</h2>
        <dl className="mt-4 space-y-4 text-sm text-muted">
          <div>
            <dt className="font-medium text-foreground">Category score</dt>
            <dd className="mt-1 leading-relaxed">
              The sum of the applicable row scores, divided by (applicable rows
              × 3), scaled to 100. The sealed headline uses the frozen
              denominator: <span className="font-mono text-xs">unknown</span>{" "}
              rows stay in the denominator as disclosed-unscored, while{" "}
              <span className="font-mono text-xs">not_applicable</span> and{" "}
              <span className="font-mono text-xs">not_implemented</span> rows are
              excluded from both sides. A category with everything unknown
              therefore does not silently score zero — it lowers coverage, not
              the reported quality.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Coverage floor</dt>
            <dd className="mt-1 leading-relaxed">
              If fewer than half of the attempted rows are gradeable (measured
              plus estimated), the headline is suppressed with the{" "}
              <span className="font-mono text-xs">insufficient-signal</span>{" "}
              verdict instead of publishing a number. Reference scores stay in
              the JSON for diagnosis; no band is shown, and the next step is the
              coverage-limit sentence rather than a band CTA.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">System score</dt>
            <dd className="mt-1 leading-relaxed">
              The weighted sum of the category scores. Weights represent how
              strongly each category predicts maintenance cost, and are a fixed
              configuration — the exact numbers are on the rubric sheet.
            </dd>
          </div>
        </dl>

        <h3 className="mt-8 text-sm font-semibold tracking-wider text-faint uppercase">
          Category weights
        </h3>
        <table className="mt-3 w-full text-sm">
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
        <h2 className="text-lg font-semibold">Tiers</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {TIERS.map((t) => (
            <div
              key={t.label}
              className="instrument-panel flex items-center gap-3 rounded-lg p-4"
            >
              <span className={`h-2.5 w-2.5 rounded-full bg-tier-${t.color}`} />
              <div>
                <div className="text-sm font-medium">{t.label}</div>
                <div className="font-mono text-xs text-faint">≥ {t.min}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Kill-switch gates</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Eight gates describe conditions that must never be true — exposed
          credentials, a critical CVE sitting unpatched, a runtime past end of
          life, strong copyleft in a closed distribution. A gate is reported as{" "}
          <span className="font-mono text-xs">proven</span>,{" "}
          <span className="font-mono text-xs">not-proven</span>,{" "}
          <span className="font-mono text-xs">needs-verification</span>, or{" "}
          <span className="font-mono text-xs">unevaluable</span>, and only a{" "}
          <span className="font-mono text-xs">proven</span> gate acts.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          A proven gate caps the verdict at <strong>High</strong> whatever the
          average says: a codebase with a live secret in it is not “Moderate”
          because the rest scored well. The cap lowers the <em>band</em> and
          never the score — the report keeps its honest number and states which
          gates fired and what the score alone earned. A score already in{" "}
          <strong>Critical</strong> stays there: the cap is a ceiling, never a
          floor. A gate whose source rows are all unknown is{" "}
          <span className="font-mono text-xs">unevaluable</span> and is disclosed
          as such rather than silently counted as clear.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">What the number is not</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted">
          <li>
            Not a code smell score — it is a weighted cost-of-maintenance read.
          </li>
          <li>
            Not static-only — it mixes measured evidence, stated estimates, and
            explicit unknowns.
          </li>
          <li>
            Not proportional to fixing effort — remediation is ordered by score
            impact, with a verify-effort tag on each row. The tag is verification
            effort, not a remediation-hour estimate.
          </li>
          <li>
            Not secret — every graded point links to its rationale; the rubric is
            public.
          </li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Evidence surfaces</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          The JSON report carries evidence pointers — tool, file, line, and the
          fact the row was graded from — so the number can be re-derived. The
          HTML and Markdown reports carry human-readable summaries of the same
          rows, meant to be pasted into a ticket or forwarded to a budget holder.
          Neither surface invents evidence the other has.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Where we are now</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Two scan paths are available today: the{" "}
          <span className="font-mono text-ink">local CLI scan</span> (runs
          against a checkout on your machine and writes the JSON, HTML, and
          Markdown reports) and the{" "}
          <span className="font-mono text-ink">CI scan</span> (the GitHub Action
          runs the same scanner in your pipeline and surfaces labelled issues).
          Sample surfaces on this site stay illustrative — every sample is
          stamped{" "}
          <span className="font-mono text-xs text-faint">
            illustrative sample
          </span>{" "}
          on every view, and the site itself never runs a scan.
        </p>
      </section>
    </div>
  );
}
