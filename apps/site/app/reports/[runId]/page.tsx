import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { readReportEnvelope, isValidRunId } from "@/lib/reports";
import { ReportView } from "@/components/report-view";
import { PersistedReportFooter, PersistedReportHeaderActions, PersistedReportSubtitle } from "@/components/persisted-report-header";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ runId: string }> }): Promise<Metadata> {
  const { runId } = await params;
  const decoded = decodeURIComponent(runId);
  if (!isValidRunId(decoded)) return { title: "Report not found" };
  const env = await readReportEnvelope(decoded);
  if (!env) return { title: "Report not found" };
  return { title: `${env.meta.repo} · ${env.meta.score} · LeapScore` };
}

export default async function ReportDetailPage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId: raw } = await params;
  const runId = decodeURIComponent(raw);

  if (!isValidRunId(runId)) {
    notFound();
  }

  const envelope = await readReportEnvelope(runId);
  if (!envelope) {
    notFound();
  }

  const { report, meta, trace } = envelope;

  return (
    <div>
      <ReportView report={report} title="Persisted report" persistedMeta={meta} />
      {trace && trace.length > 0 && (
        <div className="mx-auto max-w-5xl px-4 pb-10">
          <div className="instrument-panel overflow-hidden rounded-lg border border-hairline">
            <div className="px-4 py-3">
              <h2 className="text-sm font-medium text-ink">Scan trace</h2>
              <p className="mt-0.5 text-xs text-faint">{trace.length} steps · persisted with report</p>
            </div>
            <ol className="border-t border-hairline px-4 py-3 space-y-1.5">
              {trace.map((e, idx) => (
                <li key={idx} className="flex gap-3 font-mono text-xs">
                  <span className="w-12 shrink-0 text-faint tabular-nums">{(e.ts / 1000).toFixed(1)}s</span>
                  <span className="text-muted">{e.label}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
