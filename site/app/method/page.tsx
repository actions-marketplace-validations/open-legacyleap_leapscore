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
        10 categories. Each indicator is scored to a four-level taxonomy (0–3),
        every category rolls up, and the system score is the weighted sum —
        exactly, no guestimates in the arithmetic.
      </p>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Scoring model</h2>
        <dl className="mt-4 space-y-4 text-sm text-muted">
          <div>
            <dt className="font-medium text-foreground">Category score</dt>
            <dd className="mt-1 leading-relaxed">
              The sum of the applicable row scores, divided by (applicable rows
              × 3), scaled to 100. Unknown (not-run) rows and N/A rows are
              excluded from both the numerator and the denominator — a category
              with everything unknown does not silently score zero.
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
            Not proportional to fixing effort — remediation is ordered
            separately, by score-points per hour.
          </li>
          <li>
            Not secret — every point links to its rationale; the rubric is
            public.
          </li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Where we are now</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          The site runs on sample data today (an authored, evidence-backed read
          of <span className="font-mono text-ink">django/django</span>). The
          live detection engine — the part that turns a pasted URL into scored
          rows — is in development behind the waitlist. The sample report is
          honest about this: it is stamped{" "}
          <span className="font-mono text-xs text-faint">
            illustrative sample
          </span>{" "}
          on every view.
        </p>
      </section>
    </div>
  );
}
