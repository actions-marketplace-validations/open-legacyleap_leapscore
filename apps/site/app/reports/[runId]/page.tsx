import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listReportMetas, readReportEnvelope, isValidRunId } from "@/lib/reports";
import { ReportView } from "@/components/report-view";
import { ScanTraceView } from "@/components/scan-trace-view";

// Build-time prerender: exactly the site-owned history runIds. A grammatically
// valid but unretained runId 404s at the edge; traversal is rejected 404 before
// any history access. No request-time filesystem read, no scanner contact.
export const dynamicParams = false;

export async function generateStaticParams(): Promise<{ runId: string }[]> {
  const metas = await listReportMetas();
  return metas.map((m) => ({ runId: m.runId }));
}

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
      <ScanTraceView trace={trace ?? []} />
    </div>
  );
}
