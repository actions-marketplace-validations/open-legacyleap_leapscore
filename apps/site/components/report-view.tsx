"use client";
import Link from "next/link";
import { BandPath } from "@/components/band-path";
import { gateCapStatement } from "@leapscore/contracts";
import { DeepDiveScope, TopBlockers } from "@/components/blockers";
import { CategorySection } from "@/components/category-section";
import { DialGauge } from "@/components/dial-gauge";
import { GatesTable } from "@/components/gates-table";
import { IdentityCard } from "@/components/identity-card";
import { ReportNextStep } from "@/components/report-next-step";
import { SampleFullTable } from "@/components/sample-full-table";
import { tierForScore } from "@/lib/scoring";
import type { Report } from "@/lib/types";
import type { ReportMeta } from "@/lib/reports";

function rawJsonUrl(runId: string): string {
  return `/reports/${encodeURIComponent(runId)}/raw`;
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

/** The measure paths a suppressed scan points to (design D2): the rows that
 *  would make the estate gradeable, with the producer's stated measure path.
 *  No band, no score — suppression is a result, not a low score. */
function SuppressedMeasurePaths({ report }: { report: Report }) {
  const rows = (report.full_table ?? [])
    .filter((r) => r.status === "unknown" && !r.not_applicable)
    .slice(0, 8);
  return (
    <div className="instrument-panel rounded-lg p-4" data-testid="measure-paths">
      <h3 className="text-sm font-medium text-ink">What would make it measurable</h3>
      <p className="mt-0.5 text-xs text-faint">
        Unknown rows stay in the denominator as disclosed-unscored. Grading these
        moves the scan above the coverage floor.
      </p>
      <ul className="mt-3 space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="text-xs">
            <span className="font-mono text-faint">{r.id}</span>{" "}
            <span className="text-muted">{r.name}</span>
            <span className="block pl-6 text-faint">
              {r.unknown_measure_path ?? r.reason ?? "Not measured in this run."}
            </span>
          </li>
        ))}
        {rows.length === 0 && (
          <li className="text-xs text-faint">
            Every attempted row was graded; the headline was withheld for another
            reason stated beside the verdict.
          </li>
        )}
      </ul>
    </div>
  );
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
  // Suppression is a presentation state, not a reference score (design D2): a
  // suppressed headline never renders a dial, a number, a tier, or a CI band as
  // a verdict. Only a scored headline computes a display tier.
  const suppressed =
    report.headline.suppressed === true ||
    String(report.headline.verdict ?? "").trim().toLowerCase() === "insufficient-signal";
  const tier = suppressed ? null : tierForScore(report.headline.score);

  // Provenance is demoted, never deleted (report-rendering): the instrument's
  // receipt renders in a collapsed band below the evidence sections. Only the
  // header actions stay in the chrome.
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

  // Kill-switch cap: a proven gate lowered the band, and the report says so next
  // to the number the cap displaced. Wording comes from the contract, so the site
  // and the CLI reports state it identically.
  const gateCapped = report.headline.gate_capped === true;
  const uncappedTier = report.headline.uncapped_tier;
  const cappedByGates = report.headline.capped_by_gates ?? [];

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
                {perRoot.slice(0,4).map((r, i) => (
                  <span key={`${r.root}-${r.archetype}-${i}`} className="rounded bg-zinc-900 px-1.5 py-0.5 font-mono text-xs text-muted">
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
      </div>

      {/* Subject band: what the code is, before what the verdict says about it. */}
      <IdentityCard report={report} />

      <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        <div className="flex flex-col items-center">
          {suppressed ? (
            <div
              className="w-full rounded-lg border border-hairline bg-panel/40 p-4 text-center"
              data-testid="suppressed-verdict"
            >
              <p className="text-xs font-medium uppercase tracking-wider text-faint">Verdict</p>
              <p className="mt-2 font-mono text-lg font-semibold">insufficient signal</p>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                The scan could not grade enough of the estate to publish a headline.
                This is a coverage limit, not a clean bill of health — see the
                measure paths beside it.
              </p>
            </div>
          ) : (
            <>
              <DialGauge score={report.headline.score} tierColor={tier!.color} label="system score" />
              <div className="mt-2 text-center">
                <div className="font-mono text-4xl font-semibold tabular-nums">{report.headline.score}</div>
                <div className={`text-sm ${tierLabel(tier!.color)}`}>{report.headline.tier}</div>
                <div className="mt-1 text-xs text-faint">{report.headline.ci_band}</div>
              </div>
            </>
          )}
          {gateCapped && uncappedTier && !suppressed ? (
            <p
              className="mt-3 rounded-lg border border-tier-critical/40 bg-panel/40 p-2.5 text-xs leading-relaxed text-muted"
              role="note"
            >
              <span className="font-medium text-foreground">Verdict capped at {report.headline.tier}.</span>{" "}
              {gateCapStatement(cappedByGates, uncappedTier)}{" "}
              <span className="text-faint">The score itself is unchanged.</span>
            </p>
          ) : null}
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
          {suppressed ? (
            <SuppressedMeasurePaths report={report} />
          ) : (
            <BandPath
              path={report.next_band_path}
              tier={report.headline.tier}
              score={report.headline.score}
            />
          )}
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

      {/* Provenance band: the instrument's receipt, below the evidence sections
          and collapsed by default. Every value survives; nothing here is chrome. */}
      <details className="mt-10 rounded-lg border border-hairline bg-panel/20 p-4" data-testid="provenance-band">
        <summary className="cursor-pointer text-xs font-medium tracking-wider text-faint uppercase">
          Provenance — the instrument&apos;s receipt
        </summary>
        <div className="mt-3 grid gap-3 text-xs lg:grid-cols-[1fr_auto]">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-4">
            <div><span className="text-faint">SCHEMA</span> <span className="ml-2 font-mono text-muted">{report.report_schema}</span></div>
            <div><span className="text-faint">RUBRIC</span> <span className="ml-2 font-mono text-muted">{report.snapshot.rubric_version}</span></div>
            <div className="col-span-2 sm:col-span-2"><span className="text-faint">ENGINE</span> <span className="ml-2 font-mono text-muted">{persistedMeta ? `${persistedMeta.engineSha7} / ` : ""}{report.snapshot.engine_version}</span></div>
            {!report.identity && (persistedMeta?.repoSha ?? report.snapshot.scanned_commit) ? (
              <div>
                <span className="text-faint">COMMIT</span>{" "}
                <span className="ml-2 font-mono text-muted">
                  {(() => {
                    const sha = persistedMeta?.repoSha ?? report.snapshot.scanned_commit ?? "unknown";
                    return sha === "unknown" ? "unknown" : sha.slice(0, 7);
                  })()}
                </span>
              </div>
            ) : null}
            {persistedMeta ? (
              <>
                <div className="col-span-2"><span className="text-faint">RUN</span> <span className="ml-2 font-mono text-[11px] break-all text-muted">{persistedMeta.runId}</span></div>
                <div><span className="text-faint">DURATION</span> <span className="ml-2 font-mono text-muted">{Math.round(persistedMeta.durationMs / 1000)}s <span className="text-faint">/ {Math.round(persistedMeta.budgetMs / 1000)}s</span></span></div>
                <div><span className="text-faint">RAN</span> <span className="ml-2 font-mono text-muted">{persistedMeta.ranAt.slice(0, 19)}Z</span></div>
              </>
            ) : (
              <div className="col-span-2 sm:col-span-2"><span className="text-faint">SCAN TIME</span> <span className="ml-2 font-mono text-muted">{report.snapshot.scanned_at}</span></div>
            )}
          </div>
          <div className="flex shrink-0 items-start gap-2 lg:flex-col lg:items-end">
            {persistedMeta ? (
              <>
                <a href={rawJsonUrl(persistedMeta.runId)} className="rounded border border-hairline bg-background px-2.5 py-1 font-mono text-xs text-muted hover:text-foreground">raw JSON</a>
                <Link href={`/live?repo=${encodeURIComponent(persistedMeta.repo)}`} className="rounded bg-foreground px-2.5 py-1 text-xs font-medium text-background hover:opacity-90">rerun</Link>
              </>
            ) : (
              footerExtra
            )}
          </div>
        </div>
        {subtitle ? <div className="mt-2 text-xs text-faint">{subtitle}</div> : null}
      </details>

      <ReportNextStep headline={report.headline} />
    </div>
  );
}
