"use client";
import Link from "next/link";
import { DeepDiveScope, TopBlockers } from "@/components/blockers";
import { CategorySection } from "@/components/category-section";
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

  const perRoot = (report.snapshot as unknown as { perRoot?: Array<{ root: string; archetype: string }> }).perRoot;
  const archetype = (report.snapshot as unknown as { archetype?: string }).archetype;
  const archetypeConf = (report.snapshot as unknown as { archetype_confidence?: string }).archetype_confidence;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs tracking-wider text-faint uppercase">{title}</p>
            <h1 className="mt-1 flex flex-wrap items-center gap-2 font-mono text-2xl font-semibold tracking-tight">
              {report.snapshot.repo}
              <span className="rounded border border-hairline px-1.5 py-0.5 text-xs font-normal text-faint">
                {report.coverage.not_applicable} N/A rows
              </span>
              <span className={`rounded px-1.5 py-0.5 text-xs font-normal ${report.status === "complete" ? "bg-foreground text-background" : "border border-hairline text-faint"}`}>
                {report.status}
              </span>
            </h1>
          </div>
          <div className="shrink-0 pt-1">{effectiveHeaderActions}</div>
        </div>

        {archetype ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded bg-panel px-2 py-1 font-mono text-xs text-muted">Detected: {archetype} <span className="text-faint">({archetypeConf ?? 'low'})</span></span>
            {perRoot && perRoot.length > 0 ? (
              <span className="flex flex-wrap items-center gap-1.5">
                {perRoot.slice(0,4).map((r) => (
                  <span key={r.root} className="rounded bg-zinc-900 px-1.5 py-0.5 font-mono text-xs text-muted">
                    {r.root === '.' ? 'root' : r.root}: {r.archetype}
                  </span>
                ))}
                {perRoot.length > 4 ? <span className="text-xs text-faint">+{perRoot.length - 4} more</span> : null}
              </span>
            ) : (
              <span className="text-xs text-faint">{((report.snapshot as unknown as { archetype_evidence?: string[] }).archetype_evidence ?? []).slice(0,2).join(' · ')}</span>
            )}
          </div>
        ) : null}

        {persistedMeta ? (
          <div className="mt-4 grid gap-3 rounded-lg border border-hairline bg-panel/30 p-3 text-xs lg:grid-cols-[1fr_auto]">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-4">
              <div><span className="text-faint">SCHEMA</span> <span className="ml-2 font-mono text-muted">{report.report_schema}</span></div>
              <div><span className="text-faint">RUBRIC</span> <span className="ml-2 font-mono text-muted">{report.snapshot.rubric_version}</span></div>
              <div><span className="text-faint">ENGINE</span> <span className="ml-2 font-mono text-muted">{persistedMeta.engineSha7} <span className="text-faint">/</span> {report.snapshot.engine_version}</span></div>
              <div><span className="text-faint">COMMIT</span> <span className="ml-2 font-mono text-muted">{persistedMeta.repoSha === 'unknown' ? 'unknown' : persistedMeta.repoSha.slice(0,7)}</span></div>
              <div className="col-span-2 sm:col-span-2"><span className="text-faint">RUN</span> <span className="ml-2 font-mono text-[11px] text-muted break-all">{persistedMeta.runId}</span></div>
              <div><span className="text-faint">DURATION</span> <span className="ml-2 font-mono text-muted">{Math.round(persistedMeta.durationMs/1000)}s <span className="text-faint">/ {Math.round(persistedMeta.budgetMs/1000)}s</span></span></div>
              <div><span className="text-faint">RAN</span> <span className="ml-2 font-mono text-muted">{persistedMeta.ranAt.slice(0,19)}Z</span></div>
            </div>
            <div className="flex shrink-0 items-start gap-2 lg:flex-col lg:items-end">
              <a href={`/api/reports/${encodeURIComponent(persistedMeta.runId)}`} className="rounded border border-hairline bg-background px-2.5 py-1 font-mono text-xs text-muted hover:text-foreground">raw JSON</a>
              <Link href={`/live?repo=${encodeURIComponent(persistedMeta.repo)}`} className="rounded bg-foreground px-2.5 py-1 text-xs font-medium text-background hover:opacity-90">rerun</Link>
            </div>
          </div>
        ) : (
          <div className="mt-2 text-xs text-faint">{effectiveSubtitle}</div>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        <div className="flex flex-col items-center">
          <DialGauge score={report.headline.score} tierColor={tier.color} label="system score" />
          <div className="mt-2 text-center">
            <div className="font-mono text-4xl font-semibold tabular-nums">{report.headline.score}</div>
            <div className={`text-sm ${tierLabel(tier.color)}`}>{report.headline.tier}</div>
            <div className="mt-1 text-xs text-faint">{report.headline.ci_band}</div>
          </div>
          <div className="mt-6 w-full rounded-lg border border-hairline bg-panel/40 p-3">
            <p className="text-xs font-medium uppercase tracking-wider text-faint">Breakdown</p>
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted"><span className="h-2 w-2 rounded-sm bg-white" /> Measured</span>
                <span className="font-mono text-sm font-medium text-foreground">{report.coverage.measured} <span className="text-xs font-normal text-faint">/ 102</span></span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted"><span className="h-2 w-2 rounded-sm bg-amber-400" /> Estimated</span>
                <span className="font-mono text-sm text-muted">{report.coverage.estimated} <span className="text-xs text-faint">/ 102</span></span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted"><span className="h-2 w-2 rounded-sm bg-zinc-500" /> Unknown</span>
                <span className="font-mono text-sm text-muted">{report.coverage.unknown} <span className="text-xs text-faint">/ 102</span></span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted"><span className="h-2 w-2 rounded-sm bg-zinc-700 border border-zinc-600" /> Not applicable</span>
                <span className="font-mono text-sm text-muted">{report.coverage.not_applicable} <span className="text-xs text-faint">/ 102</span></span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted"><span className="h-2 w-2 rounded-sm bg-transparent border border-dashed border-zinc-600" /> Not implemented</span>
                <span className="font-mono text-sm text-muted">{report.coverage.not_implemented ?? 0} <span className="text-xs text-faint">/ 102</span></span>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-6">
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
