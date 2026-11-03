"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";

import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { ReportView } from "@/components/report-view";
import { ScanTraceView } from "@/components/scan-trace-view";
import type { Report } from "@/lib/types";
import type { TraceEntry } from "@/lib/reports";
import { refusedCopy, scannerScanUrl } from "@/lib/scanner";

type TimelineEntry = { ts: number; label: string };

// StrictMode double-mount guard: in dev React mounts/unmounts/mounts,
const inflightScans = new Map<string, AbortController>();

export function LiveReportClient({ repo: initialRepo }: { repo: string }) {
  const [budgetMs, setBudgetMs] = useState<number | null>(null);
  const [indicatorCount, setIndicatorCount] = useState<number | null>(null);
  const [pct, setPct] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [persistedMeta, setPersistedMeta] = useState<{ runId: string } | null>(null);
  const [pendingRunId, setPendingRunId] = useState<string | null>(null);
  const [refused, setRefused] = useState<{ reason: string; detail: string; repo: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sealed, setSealed] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(true);
  const [detectorTraceOpen, setDetectorTraceOpen] = useState(false);
  const [traces, setTraces] = useState<TraceEntry[]>([]);

  const startRef = useRef<number>(0);
  const budgetRef = useRef<number | null>(null);
  const sealedRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevCompletedRef = useRef<Set<string>>(new Set());
  const timelineRef = useRef<TimelineEntry[]>([]);
  const tracesRef = useRef<TraceEntry[]>([]);

  function appendTimeline(label: string) {
    const elapsed = Date.now() - startRef.current;
    const entry: TimelineEntry = { ts: elapsed, label };
    timelineRef.current = [...timelineRef.current, entry];
    setTimeline([...timelineRef.current]);
  }

  function appendTrace(entry: TraceEntry) {
    tracesRef.current = [...tracesRef.current, entry];
    setTraces([...tracesRef.current]);
  }

  useEffect(() => {
    let cancelled = false;
    const prev = inflightScans.get(initialRepo);
    if (prev) {
      prev.abort();
      inflightScans.delete(initialRepo);
    }
    const abortController = new AbortController();
    inflightScans.set(initialRepo, abortController);

    startRef.current = Date.now();
    sealedRef.current = false;
    timelineRef.current = [];
    tracesRef.current = [];
    prevCompletedRef.current = new Set();

    const initLabel = `Starting scan — ${initialRepo}`;
    timelineRef.current = [{ ts: 0, label: initLabel }];
    setTimeline([...timelineRef.current]);
    tracesRef.current = [{ ts: 0, elapsedMs: 0, label: initLabel, phase: "ingest" }];
    setTraces([...tracesRef.current]);

    intervalRef.current = setInterval(() => {
      if (sealedRef.current) return;
      const elapsed = Date.now() - startRef.current;
      setElapsedMs(elapsed);
      const b = budgetRef.current;
      if (b !== null) {
        setRemainingMs(Math.max(0, b - elapsed));
        setPct((prev) => {
          if (prev >= 99) return prev;
          const timePct = Math.min(99, Math.round((elapsed / b) * 100));
          return Math.max(prev, timePct);
        });
      }
    }, 200);

    async function run() {
      try {
        // Cross-origin scanner scan API — no same-origin proxy exists.
        const res = await fetch(scannerScanUrl(initialRepo), { cache: "no-store", signal: abortController.signal });
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
            const meta = (json as { meta?: { runId?: string } }).meta;
            const tr = (json as { trace?: TraceEntry[] }).trace;
            if (tr && Array.isArray(tr)) {
              tracesRef.current = tr as TraceEntry[];
              setTraces([...tracesRef.current]);
            }
            appendTimeline(`Scoring — gates evaluated`);
            appendTimeline(`Sealed — ${rep.status} · ${rep.coverage.measured}/${(rep.coverage.measured + rep.coverage.unknown + rep.coverage.estimated)} measured`);
            setReport(rep);
            if (meta?.runId) {
              setPersistedMeta({ runId: meta.runId });
              setPendingRunId(meta.runId);
            }
            // Rendered in place from the terminal frame — no navigation.
          } else if ((json as { type?: string }).type === "refused") {
            sealedRef.current = true; setSealed(true);
            if (intervalRef.current) clearInterval(intervalRef.current);
            const e = json as { reason: string; detail: string; repo: string };
            setRefused({ reason: e.reason, detail: e.detail, repo: e.repo ?? initialRepo });
          }
          // Unknown single-shot frame types are ignored without failing.
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
              } else if (type === "trace") {
                const label = String((evt as { label?: string }).label ?? "");
                if (!label.trim()) continue;
                const entry: TraceEntry = {
                  ts: (evt as { ts?: number }).ts ?? (evt as { elapsedMs?: number }).elapsedMs ?? Date.now() - startRef.current,
                  elapsedMs: (evt as { elapsedMs?: number }).elapsedMs,
                  label,
                  phase: (evt as { phase?: string }).phase as TraceEntry["phase"],
                  detectorId: (evt as { detectorId?: string }).detectorId,
                  durationMs: (evt as { durationMs?: number }).durationMs,
                  status: (evt as { status?: string }).status as TraceEntry["status"],
                  errorKind: (evt as { errorKind?: string }).errorKind as TraceEntry["errorKind"],
                };
                appendTrace(entry);
              } else if (type === "report") {
                sealedRef.current = true; setSealed(true);
                if (intervalRef.current) clearInterval(intervalRef.current);
                const rep = (evt as { report: Report }).report;
                const meta = (evt as { meta?: { runId?: string } }).meta;
                const tr = (evt as { trace?: TraceEntry[] }).trace;
                if (tr && Array.isArray(tr) && tr.length > 0) {
                  // Prefer full trace from terminal report if we missed frames
                  tracesRef.current = tr as TraceEntry[];
                  setTraces([...tracesRef.current]);
                } else {
                  appendTimeline(`Scoring — gates evaluated`);
                  const total = rep.coverage.measured + rep.coverage.unknown + rep.coverage.estimated + rep.coverage.not_applicable;
                  const measured = rep.coverage.measured;
                  appendTimeline(`Sealed — ${rep.status} · ${measured}/${indicatorCount ?? total} measured`);
                }
                setPct(100);
                setRemainingMs(0);
                setReport(rep);
                // Terminal report frame is self-sufficient: render in place,
                // no navigation, no store round trip.
                if (meta?.runId) {
                  setPersistedMeta({ runId: meta.runId });
                  setPendingRunId(meta.runId);
                }
              } else if (type === "refused") {
                sealedRef.current = true; setSealed(true);
                if (intervalRef.current) clearInterval(intervalRef.current);
                const e = evt as { reason: string; detail: string; repo: string };
                setRefused({ reason: e.reason, detail: e.detail, repo: e.repo ?? initialRepo });
              }
              // Unknown frame types are additive: skip without failing.
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
              const meta = (evt as { meta?: { runId?: string } }).meta;
              const tr = (evt as { trace?: TraceEntry[] }).trace;
              if (tr && Array.isArray(tr) && tr.length > 0) {
                tracesRef.current = tr as TraceEntry[];
                setTraces([...tracesRef.current]);
              } else {
                appendTimeline(`Scoring — gates evaluated`);
                const total = rep.coverage.measured + rep.coverage.unknown + rep.coverage.estimated + rep.coverage.not_applicable;
                appendTimeline(`Sealed — ${rep.status} · ${rep.coverage.measured}/${indicatorCount ?? total} measured`);
              }
              setReport((evt as { report: Report }).report);
              setPct(100); setRemainingMs(0);
              if (meta?.runId) {
                setPersistedMeta({ runId: meta.runId });
                setPendingRunId(meta.runId);
              }
            } else if (type === "refused") {
              sealedRef.current = true; setSealed(true);
              if (intervalRef.current) clearInterval(intervalRef.current);
              const e = evt as { reason: string; detail: string; repo: string };
              setRefused({ reason: e.reason, detail: e.detail, repo: e.repo ?? initialRepo });
            }
            // Unknown frame types are additive: skip without failing.
          } catch {}
        }
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        if (!cancelled) setError(e instanceof Error ? e.message.slice(0, 500) : String(e));
      } finally {
        inflightScans.delete(initialRepo);
      }
    }
    run();
    return () => {
      cancelled = true;
      sealedRef.current = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
      abortController.abort();
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
    const copy = refusedCopy(refused.reason);
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-8">
          <p className="text-xs tracking-wider text-faint uppercase">Live report</p>
          <h1 className="mt-1 font-mono text-2xl font-semibold tracking-tight">{refused.repo}</h1>
          <p className="mt-2 rounded border border-hairline bg-panel px-4 py-3 text-sm text-muted">
            {copy.title} — {copy.body} {refused.detail.slice(0, 300)}
            <br />
            Try a public GitHub URL like <code className="font-mono">vercel/next.js</code>.
          </p>
          <div className="mt-4 flex gap-4">
            <Link href={`/live?repo=${encodeURIComponent(refused.repo)}`} className="text-sm underline underline-offset-2 hover:text-foreground">
              Retry scan
            </Link>
            <Link href="/" className="text-sm underline underline-offset-2 hover:text-foreground">
              ← Back to home
            </Link>
          </div>
        </div>
        <p className="mt-8 text-xs text-faint">Scanner refused ({refused.reason}) · timer frozen at {Math.floor(elapsedMs/1000)}s · no score</p>
      </div>
    );
  }

  // Derived grouping: milestones primary, detector secondary
  const milestoneRows = traces.filter(t => t.phase !== "detector");
  const detectorRows = traces.filter(t => t.phase === "detector");
  const hasTraceStream = traces.length > 1; // beyond init

  function renderTimelineList(entries: Array<{ ts: number; label: string }>) {
    return (
      <ol className="mt-3 space-y-1.5">
        {entries.map((e, idx) => (
          <li key={idx} className="flex gap-3 font-mono text-xs">
            <span className="w-12 shrink-0 text-faint tabular-nums">{(e.ts / 1000).toFixed(1)}s</span>
            <span className="text-muted">{e.label}</span>
          </li>
        ))}
      </ol>
    );
  }

  // Sealed — render the report in place from the terminal frame.
  // No navigation: the scanner keeps no store, so a sealed run has no
  // retrievable page. The terminal frame is the sole artefact.
  if (report) {
    const runId = persistedMeta?.runId ?? pendingRunId;
    return (
      <SealedLiveReport
        report={report}
        traces={traces}
        elapsedMs={elapsedMs}
        indicatorCount={indicatorCount}
        runId={runId}
      />
    );
  }

  if (!report) {
    const elapsedS = Math.floor(elapsedMs / 1000);
    const remainingS = remainingMs !== null ? Math.max(0, Math.ceil(remainingMs / 1000)) : null;
    const totalS = budgetMs !== null ? Math.ceil(budgetMs / 1000) : null;
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
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
        </div>
        <div className="instrument-panel rounded-lg border border-hairline bg-panel/50 p-4">
          <h2 className="text-sm font-medium text-ink">Scan timeline</h2>
          <p className="mt-0.5 text-xs text-faint">
            {hasTraceStream ? `${traces.length} steps · live` : timeline.length > 0 ? `${timeline.length} steps · live` : "Preparing scan…"}
          </p>
          {hasTraceStream ? (
            <>
              <ol className="mt-3 max-h-64 space-y-1.5 overflow-auto pr-1">
                {milestoneRows.map((e, idx) => (
                  <li key={`m-${idx}`} className="flex gap-3 font-mono text-xs">
                    <span className="w-12 shrink-0 text-faint tabular-nums">{(e.ts / 1000).toFixed(1)}s</span>
                    <span className="text-muted">{e.label}</span>
                  </li>
                ))}
              </ol>
              {detectorRows.length > 0 && (
                <Collapsible open={detectorTraceOpen} onOpenChange={setDetectorTraceOpen} className="mt-3">
                  <CollapsibleTrigger className="flex w-full items-center justify-between rounded border border-hairline px-3 py-2 text-left hover:bg-panel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <span className="text-xs font-medium text-ink">Detector trace ({detectorRows.length})</span>
                    <span className="text-xs text-faint">{detectorTraceOpen ? "Hide" : "Show"}</span>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <ol className="mt-2 max-h-64 space-y-1 overflow-auto pr-1">
                      {detectorRows.map((e, idx) => (
                        <li key={`d-${idx}`} className="flex gap-3 font-mono text-xs">
                          <span className="w-12 shrink-0 text-faint tabular-nums">{(e.ts / 1000).toFixed(1)}s</span>
                          <span className="text-muted">{e.label}</span>
                          {e.durationMs != null && <span className="text-faint">· {e.durationMs}ms</span>}
                        </li>
                      ))}
                    </ol>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </>
          ) : (
            <>
              <ol className="mt-3 max-h-64 space-y-1.5 overflow-auto pr-1">
                {timeline.map((e, idx) => (
                  <li key={idx} className="flex gap-3 font-mono text-xs">
                    <span className="w-12 shrink-0 text-faint tabular-nums">{(e.ts / 1000).toFixed(1)}s</span>
                    <span className="text-muted">{e.label}</span>
                  </li>
                ))}
                {timeline.length === 0 && <li className="text-xs text-faint">Waiting for ingest…</li>}
              </ol>
            </>
          )}
          <p className="mt-3 font-mono text-xs text-faint">{pct}% · {elapsedS}s elapsed{remainingS !== null ? ` · ${remainingS}s remaining` : ""}</p>
        </div>
      </div>
    );
  }

  return null;
}

function tierLabel(color: string): string {
  const map: Record<string, string> = {
    healthy: "text-tier-healthy",
    moderate: "text-tier-moderate",
    high: "text-tier-high",
    critical: "text-tier-critical",
  };
  return map[color] ?? "text-muted";
}

/**
 * The revealed (sealed) live state. Exported so the placement invariant — subject
 * band above the verdict, provenance only in the collapsed receipt — is testable
 * without mounting the scan stream (report-rendering: live chrome is minimal).
 */
export function SealedLiveReport({
  report,
  traces,
  elapsedMs,
  indicatorCount,
  runId,
}: {
  report: Report;
  traces: TraceEntry[];
  elapsedMs: number;
  indicatorCount: number | null;
  runId: string | null | undefined;
}) {
  const measured = report.coverage.measured;
  const totalForLabel =
    indicatorCount ??
    report.coverage.measured + report.coverage.unknown + report.coverage.estimated + report.coverage.not_applicable;
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
            {runId ? ` · ${runId.slice(0, 32)}…` : ""}
          </p>
        </div>
      </div>
      <div className="mt-6" />

      <ReportView report={report} title="Live report" />
      <div className="mt-6">
        <ScanTraceView trace={traces} />
      </div>

      <p className="mt-6 text-center text-xs text-faint">
        {runId ? (
          <>
            Sealed as <span className="font-mono">{runId}</span> · re-run to see this report again
          </>
        ) : (
          <>Report sealed · re-run to see this report again</>
        )}
      </p>
    </div>
  );
}
