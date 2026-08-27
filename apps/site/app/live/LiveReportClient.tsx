"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";

import { DeepDiveScope, TopBlockers } from "@/components/blockers";
import { CategorySection } from "@/components/category-section";
import { CoverageStrip } from "@/components/coverage-strip";
import { DialGauge } from "@/components/dial-gauge";
import { GatesTable } from "@/components/gates-table";
import { tierForScore } from "@/lib/scoring";
import { SampleFullTable } from "@/components/sample-full-table";
import type { Report } from "@/lib/types";

type Step = { id: string; label: string; status: "pending" | "active" | "done" };

const STEPS: Step[] = [
  { id: "ingest", label: "Ingesting URL", status: "pending" },
  { id: "fetch", label: "Fetching repo", status: "pending" },
  { id: "checks", label: "Running 6 checks (VEL-06, VEL-09, VEL-08, VEL-10, SEC-07, TEST-08)", status: "pending" },
  { id: "scoring", label: "Scoring", status: "pending" },
];

export function LiveReportClient({ repo: initialRepo }: { repo: string }) {
  const [steps, setSteps] = useState<Step[]>(STEPS);
  const [elapsed, setElapsed] = useState(0);
  const [report, setReport] = useState<Report | null>(null);
  const [refused, setRefused] = useState<{ reason: string; detail: string; repo: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const start = Date.now();
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 200);

    async function run() {
      try {
        const res = await fetch(`/api/scan?repo=${encodeURIComponent(initialRepo)}`, { cache: "no-store" });
        if (!res.ok && !res.body) {
          const txt = await res.text();
          throw new Error(txt.slice(0, 500));
        }
        if (!res.body) {
          const json = await res.json();
          if (json.type === "report") setReport(json.report as Report);
          else if (json.type === "refused") setRefused({ reason: json.reason, detail: json.detail, repo: json.repo ?? initialRepo });
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
              if ((evt as { step?: string }).step) {
                const stepId = (evt as { step: string }).step;
                const status = (evt as { status: string }).status;
                setSteps((prev) =>
                  prev.map((s) => (s.id === stepId ? { ...s, status: status === "start" ? "active" : status === "done" ? "done" : s.status } : s)),
                );
              }
              if ((evt as { type?: string }).type === "report") {
                setSteps((prev) => prev.map((p) => ({ ...p, status: "done" })));
                setReport((evt as { report: Report }).report);
              }
              if ((evt as { type?: string }).type === "refused") {
                const e = evt as { reason: string; detail: string; repo: string };
                setSteps((prev) => prev.map((p) => ({ ...p, status: "done" })));
                setRefused({ reason: e.reason, detail: e.detail, repo: e.repo ?? initialRepo });
              }
            } catch {}
          }
        }
        if (buf.trim()) {
          try {
            const evt = JSON.parse(buf) as Record<string, unknown>;
            if ((evt as { type?: string }).type === "report") setReport((evt as { report: Report }).report);
            if ((evt as { type?: string }).type === "refused") {
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
      clearInterval(timer);
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
        <p className="mt-8 text-xs text-faint">Live engine phase1 refused · docs/rubric/@phase1 · elapsed {elapsed}s</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-8">
          <p className="text-xs tracking-wider text-faint uppercase">Live report — Phase 1 (GH-API, 6 rows)</p>
          <h1 className="mt-1 font-mono text-2xl font-semibold tracking-tight">{initialRepo}</h1>
          <p className="mt-1 text-xs text-faint">Scanning… elapsed {elapsed}s · share: <code className="font-mono">/live?repo={initialRepo}</code></p>
        </div>
        <div className="instrument-panel rounded-lg p-4">
          <h3 className="text-sm font-medium text-ink">Progress</h3>
          <ul className="mt-3 space-y-2">
            {steps.map((s) => (
              <li key={s.id} className="flex items-center gap-2 text-sm">
                <span className={`h-2 w-2 rounded-full ${s.status === "done" ? "bg-foreground" : s.status === "active" ? "bg-tier-moderate animate-pulse" : "bg-faint"}`} />
                <span className={s.status === "active" ? "text-foreground font-medium" : s.status === "done" ? "text-muted line-through" : "text-faint"}>{s.label}</span>
                <span className="ml-auto font-mono text-xs text-faint">{s.status}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-faint">Running 6 checks under 10s budget — hero dial appears when scoring seals.</p>
        </div>
      </div>
    );
  }

  const tier = tierForScore(report.headline.score);
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs tracking-wider text-faint uppercase">Live report — Phase 1 (GH-API, 6 rows) · {elapsed}s</p>
          <h1 className="mt-1 flex items-center gap-3 font-mono text-2xl font-semibold tracking-tight">
            {report.snapshot.repo}
            <span className="rounded border border-hairline px-1.5 py-0.5 text-xs text-faint">{report.coverage.not_applicable} N/A rows</span>
            <span className={`rounded px-1.5 py-0.5 text-xs ${report.coverage.measured === 6 ? "bg-foreground text-background" : "border border-hairline text-faint"}`}>{report.coverage.measured === 6 ? "live" : "degraded"}</span>
          </h1>
          <p className="mt-1 text-xs text-faint">
            schema {report.report_schema} · {report.snapshot.rubric_version} · {report.snapshot.scanned_at.slice(0, 10)} · share: <code className="font-mono">/live?repo={report.snapshot.repo}</code>
          </p>
        </div>
        <p className="text-xs text-muted">
          Live GH-API scan — <Link className="underline underline-offset-2 hover:text-foreground" href="/method">see method</Link> · <Link className="underline underline-offset-2 hover:text-foreground" href="/report/sample">view sample</Link>
        </p>
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
          <span className="text-xs text-faint">weights from the rubric — base set · Phase 1: VEL 4 + SEC 1 + TEST 1</span>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {report.categories.map((c) => (
            <CategorySection key={c.id} category={c} />
          ))}
        </div>
      </div>

      <SampleFullTable rows={report.full_table} />
      <div className="mt-10 border-t border-hairline pt-8">
        <DeepDiveScope scope={report.deep_dive_scope} />
      </div>
      <p className="mt-8 text-xs text-faint">
        Live report {report.snapshot.scanned_at} · engine {report.snapshot.engine_version} · provenance {report.snapshot.rubric_version} · {elapsed}s
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
