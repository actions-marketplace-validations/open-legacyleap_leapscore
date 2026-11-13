import type { Metadata } from "next";
import Link from "next/link";
import { listReportMetas } from "@/lib/reports";
import { publicTierLabel } from "@/lib/scoring";

export const metadata: Metadata = {
  title: "Sample reports · LeapScore",
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function fmtDuration(ms: number): string {
  return `${Math.round(ms / 1000)}s`;
}

function tierColor(tier: string): string {
  // Legacy alias keys stay valid for stored envelopes; display labels are public.
  const map: Record<string, string> = {
    Low: "text-tier-healthy",
    Healthy: "text-tier-healthy",
    Moderate: "text-tier-moderate",
    High: "text-tier-high",
    "High Risk": "text-tier-high",
    Critical: "text-tier-critical",
  };
  return map[tier] ?? "text-muted";
}

export default async function ReportsPage() {
  const metas = await listReportMetas();

  if (metas.length === 0) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <p className="text-xs tracking-wider text-faint uppercase">
          Site-owned sample
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          No illustrative sample retained
        </h1>
        <p className="mt-2 text-sm text-muted">
          This surface shows LeapScore&apos;s own committed illustrative sample.
          It is not a store of visitor scans. Run the scan locally to produce
          your own report, or see the{" "}
          <Link href="/report/sample" className="underline underline-offset-2 hover:text-foreground">
            sample report
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs tracking-wider text-faint uppercase">
            Site-owned sample
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Illustrative sample report
          </h1>
          <p className="mt-1 max-w-2xl text-xs text-faint">
            A committed report from a real scan of a checked-in synthetic
            legacy fixture. It is illustrative, not a scan of a visitor&apos;s
            repository, and the reports page stores no visitor scans.
          </p>
        </div>
        <Link href="/" className="text-sm underline underline-offset-2 hover:text-foreground">
          ← Home
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-hairline">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-panel/50 text-xs text-faint">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Repo</th>
              <th className="px-3 py-2 text-left font-medium">Score</th>
              <th className="px-3 py-2 text-left font-medium">Tier</th>
              <th className="px-3 py-2 text-left font-medium">Ran at</th>
              <th className="px-3 py-2 text-left font-medium">Duration</th>
              <th className="px-3 py-2 text-left font-medium">Engine</th>
              <th className="px-3 py-2 text-left font-medium">Commit</th>
              <th className="px-3 py-2 text-left font-medium">Status</th>
              <th className="px-3 py-2 text-right font-medium">Link</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {metas.map((m) => (
              <tr key={m.runId} className="hover:bg-panel/30">
                <td className="px-3 py-2 font-mono text-xs text-foreground">
                  <span className="rounded border border-hairline px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-faint">
                    illustrative sample
                  </span>{" "}
                  {m.repo}
                </td>
                <td className="px-3 py-2 font-mono tabular-nums">{m.score}</td>
                <td className={`px-3 py-2 text-xs ${tierColor(m.tier)}`}>{publicTierLabel(m.tier) ?? m.tier}</td>
                <td className="px-3 py-2 text-xs text-muted" title={m.ranAt}>
                  {relativeTime(m.ranAt)}
                </td>
                <td className="px-3 py-2 text-xs text-muted">
                  {fmtDuration(m.durationMs)} / {fmtDuration(m.budgetMs)}
                </td>
                <td className="px-3 py-2 font-mono text-xs text-faint">{m.engineSha7}</td>
                <td className="px-3 py-2 font-mono text-xs text-faint">
                  {m.repoSha && m.repoSha !== "unknown" ? m.repoSha.slice(0, 7) : "unknown"}
                </td>
                <td className="px-3 py-2 text-xs text-faint">{m.status}</td>
                <td className="px-3 py-2 text-right">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/reports/${encodeURIComponent(m.runId)}`}
                      className="rounded border border-hairline px-2 py-0.5 text-xs hover:bg-panel"
                    >
                      View
                    </Link>
                    <a
                      href={`/reports/${encodeURIComponent(m.runId)}/raw`}
                      className="rounded border border-hairline px-2 py-0.5 text-xs text-faint hover:text-foreground"
                    >
                      JSON
                    </a>
                    <Link
                      href={`/live?repo=${encodeURIComponent(m.repo)}`}
                      className="rounded bg-foreground px-2 py-0.5 text-xs text-background hover:opacity-90"
                    >
                      Rerun public demo
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
