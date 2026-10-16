import { permanentRedirect } from "next/navigation";
import { listReportMetas } from "@/lib/reports";

export const metadata = {
  title: "Sample report",
};

// Committed sample runId — a static site-owned fixture (not a scanner permalink)
const SAMPLE_RUN_ID = "django__django__506fc82__2026-08-12T000000-000Z";

export default async function SampleRedirectPage() {
  // Fast path: use known fixture id (no history read needed for happy path)
  // Verify it still exists via listReportMetas fallback for robustness if the fixture ever changes
  const metas = await listReportMetas();
  const known = metas.find((m) => m.runId === SAMPLE_RUN_ID);
  if (known) {
    permanentRedirect(`/reports/${encodeURIComponent(known.runId)}`);
  }
  const sample = metas.find((m) => m.repo === "django/django");
  if (sample) {
    permanentRedirect(`/reports/${encodeURIComponent(sample.runId)}`);
  }

  // Fallback: redirect to reports list
  permanentRedirect("/reports");
}
