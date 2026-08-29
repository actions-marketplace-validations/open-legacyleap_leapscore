"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";

import { DeepDiveScope, TopBlockers } from "@/components/blockers";
import { CategorySection } from "@/components/category-section";
import { CoverageStrip } from "@/components/coverage-strip";
import { DialGauge } from "@/components/dial-gauge";
import { GatesTable } from "@/components/gates-table";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { tierForScore } from "@/lib/scoring";
import { SampleFullTable } from "@/components/sample-full-table";
import type { Report } from "@/lib/types";

type TimelineEntry = { ts: number; label: string };

export function LiveReportClient({ repo: initialRepo }: { repo: string }) {
  const [budgetMs, setBudgetMs] = useState<number | null>(null);
  const [indicatorCount, setIndicatorCount] = useState<number | null>(null);
  const [pct, setPct] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [refused, setRefused] = useState<{ reason: string; detail: string; repo: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sealed, setSealed] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(true);

  const startRef = useRef<number>(Date.now());
  const budgetRef = useRef<number | null>(null);
  const sealedRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevCompletedRef = useRef<Set<string>>(new Set());
  const timelineRef = useRef<TimelineEntry[]>([]);

  function appendTimeline(label: string) {
    const elapsed = Date.now() - startRef.current;
    const entry: TimelineEntry = { ts: elapsed, label };
    timelineRef.current = [...timelineRef.current, entry];
    setTimeline([...timelineRef.current]);
  }

  useEffect(() => {
    let cancelled = false;
    startRef.current = Date.now();
    sealedRef.current = false;
    timelineRef.current = [];
    prevCompletedRef.current = new Set();
    setSealed(false);
    setShowReport(false);
    setTimelineOpen(true);
    setTimeline([]);
    setPct(0);
    setElapsedMs(0);
    setRemainingMs(null);
    setCompletedIds([]);
    setReport(null);
    setRefused(null);
    setError(null);
    setBudgetMs(null);
    setIndicatorCount(null);

    // initial entry
    const initLabel = `Starting scan — ${initialRepo}`;
    timelineRef.current = [{ ts: 0, label: initLabel }];
    setTimeline([...timelineRef.current]);

    // local tick for smooth elapsed/remaining between progress frames
    intervalRef.current = setInterval(() => {
      if (sealedRef.current) return;
      const elapsed = Date.now() - startRef.current;
      setElapsedMs(elapsed);
      const b = budgetRef.current;
      if (b !== null) {
        setRemainingMs(Math.max(0, b - elapsed));
        // time-only fallback pct if no progress frame yet
        setPct((prev) => {
          if (prev >= 99) return prev;
          const timePct = Math.min(99, Math.round((elapsed / b) * 100));
          return Math.max(prev, timePct);
        });
      }
    }, 200);

    async function run() {
      try {
        const res = await fetch(`/api/scan?repo=${encodeURIComponent(initialRepo)}`, { cache: "no-store" });
        if (!res.ok && !res.body) {
          const txt = await res.text();
          throw new Error(txt.slice(0, 500));
        }
        if (!res.body) {
          const json = await res.json() as Record<string, unknown>;
          if ((json as { type?: string }).type === "report") {
            sealedRef.current = true; setSealed(true);
            if (intervalRef.current) clearInterval(intervalRef.current);
            const rep = (json as { report: Report }).report;
            appendTimeline(`Scoring — gates evaluated`);
            appendTimeline(`Sealed — ${rep.status} · ${rep.coverage.measured}/${(rep.coverage.measured + rep.coverage.unknown + rep.coverage.estimated)} measured`);
            setReport(rep);
            // auto-reveal fallback if background tab
            if (typeof document !== "undefined" && document.hidden) {
              setTimeout(() => { if (!cancelled) setShowReport(true); }, 2000);
            }
          } else if ((json as { type?: string }).type === "refused") {
            sealedRef.current = true; setSealed(true);
            if (intervalRef.current) clearInterval(intervalRef.current);
            const e = json as { reason: string; detail: string; repo: string };
            setRefused({ reason: e.reason, detail: e.detail, repo: e.repo ?? initialRepo });
          }
          return;
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const evt = JSON.parse(line) as Record<string, unknown>;
              if (cancelled) break;
              const type = (evt as { type?: string }).type;
              if (type === "meta") {
                const b = (evt as { budgetMs: number }).budgetMs;
                const ic = (evt as { indicatorCount: number }).indicatorCount;
                budgetRef.current = b;
                setBudgetMs(b);
                setIndicatorCount(ic);
                setRemainingMs(Math.max(0, b - (Date.now() - startRef.current)));
                const mins = Math.ceil(b / 1000);
                appendTimeline(`Ingested ${initialRepo} — budget ${mins}s, ${ic} indicators`);
                const milestone = (evt as { milestone?: string }).milestone;
                if (milestone) appendTimeline(milestone);
              } else if (type === "progress") {
                const p = (evt as { pct: number }).pct;
                const em = (evt as { elapsedMs: number }).elapsedMs;
                const rm = (evt as { remainingMs: number }).remainingMs;
                const ids = (evt as { completedIds: string[] }).completedIds;
                const milestone = (evt as { milestone?: string }).milestone;
                if (typeof p === 'number') setPct(Math.min(100, Math.max(0, p)));
                if (typeof em === 'number') setElapsedMs(em);
                if (typeof rm === 'number') setRemainingMs(rm);
                if (Array.isArray(ids)) {
                  setCompletedIds(ids);
                  // delta append
                  const prev = prevCompletedRef.current;
                  const news = ids.filter((id) => !prev.has(id));
                  if (news.length > 0) {
                    if (news.length <= 3) {
                      for (const nid of news) appendTimeline(`Measured ${nid}`);
                    } else {
                      appendTimeline(`Measured ${news.length} indicators — ${news.slice(0, 3).join(", ")} …`);
                    }
                    prevCompletedRef.current = new Set(ids);
                  }
                }
                if (typeof milestone === "string" && milestone.trim()) {
                  appendTimeline(milestone);
                }
              } else if (type === "report") {
                sealedRef.current = true; setSealed(true);
                if (intervalRef.current) clearInterval(intervalRef.current);
                const rep = (evt as { report: Report }).report;
                setPct(100);
                setRemainingMs(0);
                appendTimeline(`Scoring — gates evaluated`);
                const total = rep.coverage.measured + rep.coverage.unknown + rep.coverage.estimated + rep.coverage.not_applicable;
                const measured = rep.coverage.measured;
                appendTimeline(`Sealed — ${rep.status} · ${measured}/${indicatorCount ?? total} measured`);
                setReport(rep);
                if (typeof document !== "undefined" && document.hidden) {
                  setTimeout(() => { if (!cancelled) setShowReport(true); }, 2000);
                }
              } else if (type === "refused") {
                sealedRef.current = true; setSealed(true);
                if (intervalRef.current) clearInterval(intervalRef.current);
                const e = evt as { reason: string; detail: string; repo: string };
                setRefused({ reason: e.reason, detail: e.detail, repo: e.repo ?? initialRepo });
              }
            } catch {}
          }
        }
        if (buf.trim()) {
          try {
            const evt = JSON.parse(buf) as Record<string, unknown>;
            const type = (evt as { type?: string }).type;
            if (type === "report") {
              sealedRef.current = true; setSealed(true);
              if (intervalRef.current) clearInterval(intervalRef.current);
              const rep = (evt as { report: Report }).report;
              appendTimeline(`Scoring — gates evaluated`);
              const total = rep.coverage.measured + rep.coverage.unknown + rep.coverage.estimated + rep.coverage.not_applicable;
              appendTimeline(`Sealed — ${rep.status} · ${rep.coverage.measured}/${indicatorCount ?? total} measured`);
              setReport((evt as { report: Report }).report);
              setPct(100); setRemainingMs(0);
              if (typeof document !== "undefined" && document.hidden) {
                setTimeout(() => { if (!cancelled) setShowReport(true); }, 2000);
              }
            } else if (type === "refused") {
              sealedRef.current = true; setSealed(true);
              if (intervalRef.current) clearInterval(intervalRef.current);
              const e = evt as { reason: string; detail: string; repo: string };
              setRefused({ reason: e.reason, detail: e.detail, repo: e.repo ?? initialRepo });
            }
          } catch {}
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message.slice(0, 500) : String(e));
      }
    }
    run();
    return () => {
      cancelled = true;
      sealedRef.current = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [initialRepo]);

  if (error) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <p className="text-xs tracking-wider text-faint uppercase">Live report</p>
        <h1 className="mt-1 font-mono text-2xl font-semibold tracking-tight">{initialRepo}</h1>
        <p className="mt-2 rounded border border-hairline bg-panel px-4 py-3 text-sm text-tier-high">Error — {error}</p>
      </div>
    );
  }

  if (refused) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-8">
          <p className="text-xs tracking-wider text-faint uppercase">Live report</p>
          <h1 className="mt-1 font-mono text-2xl font-semibold tracking-tight">{refused.repo}</h1>
          <p className="mt-2 rounded border border-hairline bg-panel px-4 py-3 text-sm text-muted">
            Snapshot refused — {refused.reason}
            {refused.reason === "rate-limited" ? " — set GH_TOKEN and retry." : ""} {refused.detail.slice(0, 300)}
            <br />
            Try a public GitHub URL like <code className="font-mono">vercel/next.js</code>.
          </p>
          <p className="mt-4 text-xs text-faint">
            Shareable URL: <code className="font-mono">/live?repo={refused.repo}</code> · alias <code className="font-mono">/report/live?repo=...</code>
          </p>
          <Link href="/" className="mt-4 inline-block text-sm underline underline-offset-2 hover:text-foreground">
            ← Back to home
          </Link>
        </div>
        <p className="mt-8 text-xs text-faint">Live engine refused · elapsed {Math.floor(elapsedMs/1000)}s</p>
      </div>
    );
  }

  // Sealed but not yet revealed — show timeline + reveal CTA (no hard swap)
  if (report && !showReport) {
    const isDegraded = report.status !== "complete";
    const measured = report.coverage.measured;
    const totalForLabel = indicatorCount ?? (report.coverage.measured + report.coverage.unknown + report.coverage.estimated + report.coverage.not_applicable);
    const ctaLabel = isDegraded ? `Reveal partial report — ${measured}/${totalForLabel} measured` : "Reveal report";
    const elapsedS = Math.floor(elapsedMs / 1000);
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="sticky top-0 z-10 -mx-4 border-b border-hairline bg-background/80 px-4 py-3 backdrop-blur">
          <div className="mx-auto max-w-5xl">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs tracking-wider text-faint uppercase">Live report — sealed · {elapsedS}s</p>
              <p className="font-mono text-xs text-muted">100% · sealed</p>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded bg-panel">
              <div className="h-full bg-foreground" style={{ width: `100%` }} />
            </div>
            <p className="mt-1 text-xs text-faint">
              {measured} of {totalForLabel} indicators measured · {report.status}
            </p>
          </div>
        </div>
        <div className="mb-8 mt-6">
          <h1 className="mt-1 font-mono text-2xl font-semibold tracking-tight">{report.snapshot.repo}</h1>
          <p className="mt-1 text-xs text-faint">Sealed · share: <code className="font-mono">/live?repo={report.snapshot.repo}</code></p>
        </div>

        <div className="instrument-panel rounded-lg border border-hairline bg-panel/50 p-4">
          <h2 className="text-sm font-medium text-ink">Scan timeline</h2>
          <p className="mt-0.5 text-xs text-faint">{timeline.length} steps · {elapsedS}s elapsed</p>
          <ol className="mt-3 space-y-1.5">
            {timeline.map((e, idx) => (
              <li key={idx} className="flex gap-3 font-mono text-xs">
                <span className="w-12 shrink-0 text-faint tabular-nums">{(e.ts / 1000).toFixed(1)}s</span>
                <span className="text-muted">{e.label}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-6 flex justify-center">
          <button
            onClick={() => setShowReport(true)}
            className="rounded-md bg-foreground px-6 py-3 text-sm font-medium text-background hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {ctaLabel}
          </button>
        </div>
        <p className="mt-2 text-center text-xs text-faint">Timeline stays available after reveal as “Show scan log”</p>
      </div>
    );
  }

  if (!report) {
    const elapsedS = Math.floor(elapsedMs / 1000);
    const remainingS = remainingMs !== null ? Math.max(0, Math.ceil(remainingMs / 1000)) : null;
    const totalS = budgetMs !== null ? Math.ceil(budgetMs / 1000) : null;
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        {/* Unified top progress bar */}
        <div className="sticky top-0 z-10 -mx-4 border-b border-hairline bg-background/80 px-4 py-3 backdrop-blur">
          <div className="mx-auto max-w-5xl">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs tracking-wider text-faint uppercase">Live report — scanning</p>
              <p className="font-mono text-xs text-muted">
                {elapsedS}s{totalS !== null ? ` / ${totalS}s` : ""}{remainingS !== null ? ` · ${remainingS}s remaining` : ""} · {pct}%
              </p>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded bg-panel">
              <div className="h-full bg-foreground transition-all duration-300" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-1 text-xs text-faint">
              {indicatorCount !== null && completedIds.length > 0 ? `${completedIds.length} of ${indicatorCount} indicators complete` : indicatorCount !== null ? `0 of ${indicatorCount} indicators complete` : "Preparing scan…"}
              {budgetMs !== null ? ` · budget ${Math.ceil(budgetMs/1000)}s` : ""}
              {remainingS !== null ? ` · ${remainingS}s left` : ""}
            </p>
          </div>
        </div>
        <div className="mb-8 mt-6">
          <h1 className="mt-1 font-mono text-2xl font-semibold tracking-tight">{initialRepo}</h1>
          <p className="mt-1 text-xs text-faint">Scanning… share: <code className="font-mono">/live?repo={initialRepo}</code></p>
        </div>
        <div className="instrument-panel rounded-lg border border-hairline bg-panel/50 p-4">
          <h2 className="text-sm font-medium text-ink">Scan timeline</h2>
          <p className="mt-0.5 text-xs text-faint">
            {timeline.length > 0 ? `${timeline.length} steps · live` : "Preparing scan…"}
          </p>
          <ol className="mt-3 max-h-64 space-y-1.5 overflow-auto pr-1">
            {timeline.map((e, idx) => (
              <li key={idx} className="flex gap-3 font-mono text-xs">
                <span className="w-12 shrink-0 text-faint tabular-nums">{(e.ts / 1000).toFixed(1)}s</span>
                <span className="text-muted">{e.label}</span>
              </li>
            ))}
            {timeline.length === 0 && <li className="text-xs text-faint">Waiting for ingest…</li>}
          </ol>
          <p className="mt-3 font-mono text-xs text-faint">{pct}% · {elapsedS}s elapsed{remainingS !== null ? ` · ${remainingS}s remaining` : ""}</p>
        </div>
      </div>
    );
  }

  const tier = tierForScore(report.headline.score);
  const sealedElapsedS = Math.floor(elapsedMs / 1000);
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs tracking-wider text-faint uppercase">Live report · {sealedElapsedS}s {sealed ? "· sealed" : ""}</p>
          <h1 className="mt-1 flex items-center gap-3 font-mono text-2xl font-semibold tracking-tight">
            {report.snapshot.repo}
            <span className="rounded border border-hairline px-1.5 py-0.5 text-xs text-faint">{report.coverage.not_applicable} N/A rows</span>
            <span className={`rounded px-1.5 py-0.5 text-xs ${report.status === "complete" ? "bg-foreground text-background" : "border border-hairline text-faint"}`}>{report.status}</span>
          </h1>
          <p className="mt-1 text-xs text-faint">
            schema {report.report_schema} · {report.snapshot.rubric_version} · {report.snapshot.scanned_at.slice(0, 10)} · share: <code className="font-mono">/live?repo={report.snapshot.repo}</code>
          </p>
        </div>
        <p className="text-xs text-muted">
          <Link className="underline underline-offset-2 hover:text-foreground" href="/method">see method</Link> · <Link className="underline underline-offset-2 hover:text-foreground" href="/report/sample">view sample</Link>
        </p>
      </div>

      {/* Report — animated in after reveal, timeline collapsible above */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 motion-reduce:animate-none motion-reduce:transition-none">
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
          Live report {report.snapshot.scanned_at} · engine {report.snapshot.engine_version} · provenance {report.snapshot.rubric_version} · {sealedElapsedS}s
        </p>
      </div>

      {/* Collapsed timeline after reveal */}
      <div className="mt-10 instrument-panel overflow-hidden rounded-lg border border-hairline">
        <Collapsible open={timelineOpen} onOpenChange={setTimelineOpen}>
          <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-panel/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <span className="text-sm font-medium text-ink">Scan log</span>
            <span className="text-xs text-faint">{timeline.length} steps · {showReport ? "Show scan log" : "Hide"} · {sealedElapsedS}s</span>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ol className="border-t border-hairline px-4 py-3 space-y-1.5">
              {timeline.map((e, idx) => (
                <li key={idx} className="flex gap-3 font-mono text-xs">
                  <span className="w-12 shrink-0 text-faint tabular-nums">{(e.ts / 1000).toFixed(1)}s</span>
                  <span className="text-muted">{e.label}</span>
                </li>
              ))}
            </ol>
          </CollapsibleContent>
        </Collapsible>
      </div>
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
