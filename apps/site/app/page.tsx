import Link from "next/link";

import { DialGauge } from "@/components/dial-gauge";
import { listSamples } from "@/lib/samples";
import { tierForScore } from "@/lib/scoring";

export default function Home() {
  const [sample] = listSamples();
  const report = sample?.envelope.report;
  const suppressed = report?.headline.suppressed === true;

  return (
    <section className="dot-grid">
      <div className="mx-auto max-w-5xl px-4">
        <div className="flex flex-col items-center gap-6 py-20 text-center sm:py-28">
          <span className="rounded-full border border-hairline px-3 py-1 text-xs text-muted">
            Local-first · Apache-2.0 · no telemetry
          </span>
          <h1 className="max-w-3xl text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
            How much legacy risk is your codebase carrying?
          </h1>
          <p className="max-w-xl text-base text-muted sm:text-lg">
            Run the scan on your own machine. It grades structural legacy risk
            against a published rubric, discloses how much it could grade, and
            writes JSON, HTML, and Markdown reports. Your code does not leave
            the building.
          </p>

          <div className="w-full max-w-xl rounded-lg border border-hairline bg-panel/40 p-4 text-left">
            <p className="text-xs tracking-wider text-faint uppercase">
              Run it
            </p>
            <pre className="mt-2 overflow-x-auto font-mono text-sm text-foreground">
              <code>npx leapscore-scan . --out leapscore-report</code>
            </pre>
            <p className="mt-2 text-xs text-muted">
              Node.js 20 or newer. A local scan makes no network requests and
              sends no code, paths, or repository names.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
            <Link
              href="/samples"
              className="rounded border border-hairline px-4 py-2 font-medium text-ink transition-colors hover:bg-panel"
            >
              See illustrative samples
            </Link>
            <Link
              href="/rubric"
              className="text-muted underline underline-offset-2 hover:text-foreground"
            >
              Browse the 102-indicator rubric
            </Link>
          </div>

          <p className="max-w-2xl text-xs leading-relaxed text-faint">
            Coverage, v1.0.2 (November 2026): up to 31 indicators have a
            detector today, 25 on a local scan, out of 102. The rest are
            disclosed as not implemented — never scored as if they had run. The
            score is not a peer benchmark.
          </p>
        </div>

        <div className="grid items-center gap-8 pb-20 lg:grid-cols-[250px_minmax(0,1fr)]">
          {report ? (
            <>
              {suppressed ? (
                <div className="instrument-panel rounded-lg p-4 text-center">
                  <p className="text-xs font-medium tracking-wider text-faint uppercase">
                    Sample verdict
                  </p>
                  <p className="mt-2 font-mono text-lg font-semibold">
                    insufficient signal
                  </p>
                </div>
              ) : (
                <DialGauge
                  score={report.headline.score}
                  tierColor={tierForScore(report.headline.score).color}
                  label="system score"
                />
              )}
              <div>
                <div className="flex flex-wrap items-baseline gap-2">
                  <h2 className="text-lg font-semibold">
                    {report.snapshot.repo}
                  </h2>
                  <span className="rounded border border-hairline px-1.5 py-0.5 text-xs text-faint">
                    illustrative sample
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted">
                  {suppressed
                    ? "This scan could not grade enough of the estate to publish a headline. That is a coverage limit, not a clean bill of health."
                    : `${report.headline.score}/100 — ${report.headline.tier}.`}{" "}
                  A real scan of a checked-in synthetic legacy fixture, produced
                  by the shipped scanner (engine{" "}
                  {report.snapshot.engine_version}, rubric{" "}
                  {report.snapshot.rubric_version}). Coverage:{" "}
                  {report.coverage.measured} measured,{" "}
                  {report.coverage.estimated} estimated,{" "}
                  {report.coverage.unknown} unknown,{" "}
                  {report.coverage.not_applicable} not applicable.
                </p>
                {report.top_blockers.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {report.top_blockers.slice(0, 3).map((b) => (
                      <span
                        key={b.row}
                        className="rounded border border-hairline px-2 py-1 font-mono text-xs text-muted"
                      >
                        {b.row} · +{b.weight_pp}
                      </span>
                    ))}
                  </div>
                ) : null}
                <Link
                  href="/samples"
                  className="mt-4 inline-block text-sm underline underline-offset-2 hover:text-foreground"
                >
                  See all illustrative samples
                </Link>
              </div>
            </>
          ) : null}
        </div>

        <div className="border-t border-hairline py-16">
          <div className="grid gap-10 text-sm text-muted md:grid-cols-3">
            <div>
              <h3 className="mb-2 font-medium text-foreground">
                Evidence per graded row
              </h3>
              <p>
                A graded row is traceable to a tool output, a file, or a stated
                proxy. Unknown rows are listed with what it would take to
                measure them.
              </p>
            </div>
            <div>
              <h3 className="mb-2 font-medium text-foreground">
                Coverage is part of the claim
              </h3>
              <p>
                The rubric has 102 indicators; up to 31 have a detector today
                (25 on a local scan), and the rest are disclosed as not
                implemented. Fewer than half of attempted rows gradeable means
                the headline is suppressed as{" "}
                <span className="font-mono text-xs">insufficient-signal</span>.
              </p>
            </div>
            <div>
              <h3 className="mb-2 font-medium text-foreground">
                Remediation, ordered by impact
              </h3>
              <p>
                Blockers rank by the score impact of fixing them, with a
                verify-effort tag on each row. No remediation-hour model is
                published.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-start gap-3 border-t border-hairline py-10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-medium">
              For the engineer who owns the repo
            </h3>
            <p className="mt-1 text-sm text-muted">
              Score it locally, forward the self-contained report, and keep the
              scan in CI to catch drift.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-hairline py-10 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">
            Built on a written 102-indicator rubric — not a black box.
          </p>
          <nav className="flex flex-wrap gap-5 text-sm">
            <Link
              href="/rubric"
              className="text-ink transition-colors hover:text-foreground"
            >
              Read the rubric
            </Link>
            <Link
              href="/method"
              className="text-ink transition-colors hover:text-foreground"
            >
              The method
            </Link>
            <Link
              href="/samples"
              className="text-ink transition-colors hover:text-foreground"
            >
              Samples
            </Link>
          </nav>
        </div>
      </div>
    </section>
  );
}
