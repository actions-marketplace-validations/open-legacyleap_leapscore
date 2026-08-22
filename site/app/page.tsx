import Link from "next/link";

import { DialGauge } from "@/components/dial-gauge";
import { UrlBox } from "@/components/url-box";
import { WaitlistForm } from "@/components/waitlist-form";
import { tierForScore } from "@/lib/scoring";
import { getReportProvider } from "@/lib/provider";

export default async function Home() {
  const report = await getReportProvider().getReport({ repo: "django/django" });
  const tier = tierForScore(report.headline.score);

  return (
    <section className="dot-grid">
      <div className="mx-auto max-w-5xl px-4">
        <div className="flex flex-col items-center gap-6 py-20 text-center sm:py-28">
          <span className="rounded-full border border-hairline px-3 py-1 text-xs text-muted">
            Live scanning: coming · sample audit below
          </span>
          <h1 className="max-w-3xl text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
            How bad is your codebase?
            <br />
            <span className="text-muted">And what is it costing to fix?</span>
          </h1>
          <p className="max-w-xl text-base text-muted sm:text-lg">
            Paste any public GitHub repo. LeapScore reads it against a
            102-indicator rubric, scores each one with the evidence behind the
            number, and lays out the remediation — ordered by how much it raises
            the score.
          </p>
          <UrlBox />
        </div>

        <div className="grid items-center gap-8 pb-20 lg:grid-cols-[250px_minmax(0,1fr)]">
          <DialGauge
            score={report.headline.score}
            tierColor={tier.color}
            label="system score"
          />
          <div>
            <div className="flex items-baseline gap-2">
              <h2 className="text-lg font-semibold">{report.snapshot.repo}</h2>
              <span className="text-xs text-faint">illustrative sample</span>
            </div>
            <p className="mt-1 text-sm text-muted">
              {report.headline.score}/100 — {report.headline.tier}. A
              representative read against the 10-category rubric; the same
              document a real scan produces, seeded with authored evidence (
              {report.coverage.measured} directly measured rows).
            </p>
            <p className="mt-1 text-xs text-faint">{report.headline.ci_band}</p>
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
          </div>
        </div>

        <div className="border-t border-hairline py-16">
          <div className="grid gap-10 text-sm text-muted md:grid-cols-3">
            <div>
              <h3 className="mb-2 font-medium text-foreground">
                Evidence per point
              </h3>
              <p>
                Every score is traceable to a tool output, a file, or a stated
                proxy. No vibes, no gut-calls — the reason is in the report.
              </p>
            </div>
            <div>
              <h3 className="mb-2 font-medium text-foreground">
                One number, 102 inputs
              </h3>
              <p>
                Ten categories weighted by how much they predict maintenance
                cost. Head-line ties to the exact rubric formula.
              </p>
            </div>
            <div>
              <h3 className="mb-2 font-medium text-foreground">
                Remediation, ordered
              </h3>
              <p>
                Blocker rows rank by points gained per hour invested, so the
                plan is the highest return first.
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
              Score it, prove the case to your lead with the evidence, and ship
              the fix list — ordered by points gained per hour.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-hairline py-10 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">
            Built on a written 102-indicator rubric — not a black box.
          </p>
          <nav className="flex flex-wrap gap-5 text-sm">
            <a
              href="../CODEDEBT_AUDIT_RUBRIC/README.md"
              className="text-ink transition-colors hover:text-foreground"
            >
              Read the rubric
            </a>
            <Link
              href="/method"
              className="text-ink transition-colors hover:text-foreground"
            >
              The method
            </Link>
            <Link
              href="/product"
              className="text-ink transition-colors hover:text-foreground"
            >
              The whole pitch
            </Link>
          </nav>
        </div>

        <div className="flex flex-col items-center gap-4 border-t border-hairline py-16 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">
            Get the number when it&apos;s live
          </h2>
          <p className="max-w-md text-sm text-muted">
            Join the waitlist for the first public scans. No spam, an email when
            open.
          </p>
          <p className="max-w-md text-xs text-faint">
            Free reports stay free — Deep Scan is the only way to convert{" "}
            <span className="font-mono">unknown</span> into{" "}
            <span className="font-mono">measured</span>.
          </p>
          <WaitlistForm />
        </div>
      </div>
    </section>
  );
}
