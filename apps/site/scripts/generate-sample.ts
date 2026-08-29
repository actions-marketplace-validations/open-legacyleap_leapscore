import { SampleReportProvider } from "../lib/provider";
import { 
  buildMeta, 
  buildRunId, 
  normalizeTs, 
  resolveEngineSha7,
  writeReportEnvelope,
  repoSlugFromUrl,
  ReportEnvelope 
} from "../lib/reports";
import { execSync } from "node:child_process";

async function generate() {
  const provider = new SampleReportProvider();
  const report = await provider.getReport({ repo: "django/django" });
  
  // Get current git SHA for engineSha7
  const engineSha7 = execSync("git rev-parse --short HEAD", { encoding: "utf8", cwd: process.cwd() }).trim().slice(0, 7);
  console.log("engineSha7:", engineSha7);
  
  const repoSlug = repoSlugFromUrl("django/django");
  console.log("repoSlug:", repoSlug);
  
  // Fix timestamp to include milliseconds for normalizeTs
  let ranAt = report.snapshot.scanned_at;
  if (!ranAt.includes(".")) {
    ranAt = ranAt.replace("Z", ".000Z");
  }
  const ts = normalizeTs(ranAt);
  console.log("ts:", ts);
  
  const runId = buildRunId(repoSlug, engineSha7, ts);
  console.log("runId:", runId);
  
  const durationMs = 0; // Sample is instant
  
  const meta = buildMeta({
    repo: "django/django",
    repoSlug,
    engineSha7,
    runId,
    ranAt,
    durationMs,
    budgetMs: 0, // Sample has no budget
    repoSha: engineSha7, // Use engine SHA as repo SHA for sample
    report: report as any,
  });
  
  const envelope: ReportEnvelope = { meta, report: report as any, trace: [] };
  
  const filePath = await writeReportEnvelope(envelope);
  console.log("Written to:", filePath);
  
  // Verify
  const { listReportMetas, isValidRunId } = await import("../lib/reports");
  const metas = await listReportMetas();
  console.log("Listed metas:", metas.length);
  const found = metas.find(m => m.runId === runId);
  console.log("Found:", found ? "YES" : "NO");
  console.log("isValidRunId:", isValidRunId(runId));
}

generate().catch(console.error);
