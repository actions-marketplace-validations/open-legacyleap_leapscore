"use client";
import Link from "next/link";
import { DeepDiveScope, TopBlockers } from "@/components/blockers";
import { CategorySection } from "@/components/category-section";
import { CoverageStrip } from "@/components/coverage-strip";
import { DialGauge } from "@/components/dial-gauge";
import { GatesTable } from "@/components/gates-table";
import { SampleFullTable } from "@/components/sample-full-table";
import { tierForScore } from "@/lib/scoring";
import type { Report } from "@/lib/types";
import type { ReportMeta } from "@/lib/reports";

function tierLabel(color: ReturnType<typeof tierForScore>["color"]): string {
  const map: Record<string, string> = {
    healthy: "text-tier-healthy",
    moderate: "text-tier-moderate",
    high: "text-tier-high",
    critical: "text-tier-critical",
  };
  return map[color];
}

export function ReportView({
  report,
  title,
  subtitle,
  footerExtra,
  headerActions,
  persistedMeta,
}: {
  report: Report;
  title: string;
  subtitle?: React.ReactNode;
  footerExtra?: React.ReactNode;
  headerActions?: React.ReactNode;
  persistedMeta?: ReportMeta;
}) {
  const tier = tierForScore(report.headline.score);

  // When persistedMeta is provided (from server), render persisted variants inside
  // the client boundary to avoid passing Link-containing ReactNodes across RSC.
  const effectiveSubtitle = persistedMeta ? (
    <div className="mt-1 space-y-0.5 text-xs text-faint">
      <div>
        schema {report.report_schema} · {report.snapshot.rubric_version} · {report.snapshot.scanned_at.slice(0, 10)} ·{" "}
        <Link href="/reports" className="underline underline-offset-2 hover:text-foreground">
          all reports
        </Link>
      </div>
      <div>
        run {persistedMeta.runId} · engine {persistedMeta.engineSha7} · repo commit{" "}
        <span className="font-mono">{persistedMeta.repoSha === "unknown" ? "unknown" : persistedMeta.repoSha.slice(0, 7)}</span> · duration{" "}
        {Math.round(persistedMeta.durationMs / 1000)}s / {Math.round(persistedMeta.budgetMs / 1000)}s budget · ran {persistedMeta.ranAt}
      </div>
    </div>
  ) : (
    subtitle ?? (
      <p className="mt-1 text-xs text-faint">
        schema {report.report_schema} · {report.snapshot.rubric_version} · {report.snapshot.scanned_at.slice(0, 10)}
      </p>
    )
  );

  const effectiveFooterExtra = persistedMeta ? (
    <span>
      Persisted {persistedMeta.ranAt} · engine {report.snapshot.engine_version} · rubric {report.snapshot.rubric_version} ·{" "}
      <a href={`/api/reports/${encodeURIComponent(persistedMeta.runId)}`} className="underline underline-offset-2 hover:text-foreground">
        raw JSON
      </a>
      <span> · </span>
      <Link href={`/live?repo=${encodeURIComponent(persistedMeta.repo)}`} className="underline underline-offset-2 hover:text-foreground">
        rerun
      </Link>
    </span>
  ) : (
    footerExtra
  );

  const effectiveHeaderActions = persistedMeta ? (
    <p className="text-xs text-muted">
      <Link href="/reports" className="underline underline-offset-2 hover:text-foreground">
        ← all reports
      </Link>
      <span> · </span>
      <Link href="/method" className="underline underline-offset-2 hover:text-foreground">
        see method
      </Link>
    </p>
  ) : (
    headerActions ?? (
      <p className="text-xs text-muted">
        <Link key="method" className="underline underline-offset-2 hover:text-foreground" href="/method">
          see method
        </Link>
        <span key="sep"> · </span>
        <Link key="sample" className="underline underline-offset-2 hover:text-foreground" href="/report/sample">
          view sample
        </Link>
      </p>
    )
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs tracking-wider text-faint uppercase">{title}</p>
          <h1 className="mt-1 flex items-center gap-3 font-mono text-2xl font-semibold tracking-tight">
            {report.snapshot.repo}
            <span className="rounded border border-hairline px-1.5 py-0.5 text-xs text-faint">
              {report.coverage.not_applicable} N/A rows
            </span>
            <span
              className={`rounded px-1.5 py-0.5 text-xs ${report.status === "complete" ? "bg-foreground text-background" : "border border-hairline text-faint"}`}
            >
              {report.status}
            </span>
          </h1>
          {effectiveSubtitle}
          {effectiveFooterExtra ? <div className="mt-2 text-xs text-faint">{effectiveFooterExtra}</div> : null}
        </div>
        {effectiveHeaderActions}
      </div>

      <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        <div className="flex flex-col items-center">
          <DialGauge score={report.headline.score} tierColor={tier.color} label="system score" />
          <div className="mt-2 text-center">
            <div className="font-mono text-4xl font-semibold tabular-nums">{report.headline.score}</div>
            <div className={`text-sm ${tierLabel(tier.color)}`}>{report.headline.tier}</div>
            <div className="mt-1 text-xs text-faint">{report.headline.ci_band}</div>
          </div>
        </div>
        <div className="space-y-6">
          <CoverageStrip coverage={report.coverage} />
          <TopBlockers blockers={report.top_blockers ?? []} />
        </div>
      </div>

      <div className="mt-10 space-y-6">
        <GatesTable gates={report.gates} />
      </div>

      <div className="mt-10">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Category scorecard</h2>
          <span className="text-xs text-faint">weights from the rubric — base set</span>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {report.categories
            .filter((c) => c.indicator_rows.length > 0)
            .map((c) => (
              <CategorySection key={c.id} category={c} />
            ))}
        </div>
      </div>

      <SampleFullTable rows={report.full_table} />
      <div className="mt-10 border-t border-hairline pt-8">
        <DeepDiveScope scope={report.deep_dive_scope} />
      </div>
      <p className="mt-8 text-xs text-faint">
        {report.snapshot.scanned_at} · engine {report.snapshot.engine_version} · {report.snapshot.rubric_version}
        {(report.snapshot as unknown as { scanned_commit?: string }).scanned_commit
          ? ` · commit ${(report.snapshot as unknown as { scanned_commit: string }).scanned_commit.slice(0, 7)}`
          : ""}
      </p>
    </div>
  );
}
