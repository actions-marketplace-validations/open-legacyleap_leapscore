import type { Metadata } from "next";
import Link from "next/link";

import { DeepDiveScope, TopBlockers } from "@/components/blockers";
import { CategorySection } from "@/components/category-section";
import { CoverageStrip } from "@/components/coverage-strip";
import { DialGauge } from "@/components/dial-gauge";
import { GatesTable } from "@/components/gates-table";
import { tierForScore } from "@/lib/scoring";
import { getReportProvider } from "@/lib/provider";
import { SampleFullTable } from "@/components/sample-full-table";

export const metadata: Metadata = {
  title: "Sample report",
};

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ repo?: string; live?: string }>;
}) {
  const { repo, live } = await searchParams;
  const provider = getReportProvider({ live });
  const report = await provider.getReport({ repo });
  const tier = tierForScore(report.headline.score);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs tracking-wider text-faint uppercase">
            Sample report
          </p>
          <h1 className="mt-1 flex items-center gap-3 font-mono text-2xl font-semibold tracking-tight">
            {report.snapshot.repo}
            <span className="rounded border border-hairline px-1.5 py-0.5 text-xs text-faint">
              {report.coverage.not_applicable} N/A rows
            </span>
          </h1>
          <p className="mt-1 text-xs text-faint">
            schema {report.report_schema} · {report.snapshot.rubric_version} ·{" "}
            {report.snapshot.scanned_at.slice(0, 10)}
          </p>
        </div>
        <p className="text-xs text-muted">
          Illustrative sample —{" "}
          <Link
            className="underline underline-offset-2 hover:text-foreground"
            href="/method"
          >
            see method
          </Link>
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        <div className="flex flex-col items-center">
          <DialGauge
            score={report.headline.score}
            tierColor={tier.color}
            label="system score"
          />
          <div className="mt-2 text-center">
            <div className="font-mono text-4xl font-semibold tabular-nums">
              {report.headline.score}
            </div>
            <div className={`text-sm ${tierLabel(tier.color)}`}>
              {report.headline.tier}
            </div>
            <div className="mt-1 text-xs text-faint">
              {report.headline.ci_band}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <CoverageStrip coverage={report.coverage} />
          <TopBlockers blockers={report.top_blockers} />
        </div>
      </div>

      <div className="mt-10 space-y-6">
        <GatesTable gates={report.gates} />
      </div>

      <div className="mt-10">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Category scorecard</h2>
          <span className="text-xs text-faint">
            weights from the rubric — base set
          </span>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {report.categories.filter((c) => c.indicator_rows.length > 0).map((c) => (
            <CategorySection key={c.id} category={c} />
          ))}
        </div>
      </div>

      <SampleFullTable rows={report.full_table} />

      <div className="mt-10 border-t border-hairline pt-8">
        <DeepDiveScope scope={report.deep_dive_scope} />
      </div>

      <p className="mt-8 text-xs text-faint">
        Sample generated {report.snapshot.scanned_at} · engine{" "}
        {report.snapshot.engine_version}
      </p>
    </div>
  );
}

function tierLabel(color: ReturnType<typeof tierForScore>["color"]): string {
  const map: Record<string, string> = {
    healthy: "text-tier-healthy",
    moderate: "text-tier-moderate",
    high: "text-tier-high",
    critical: "text-tier-critical",
  };
  return map[color];
}
