import { mkdir, writeFile } from "node:fs/promises";
import { execSync } from "node:child_process";
import path from "node:path";
import { SampleReportProvider } from "../lib/provider";
import { buildMeta, repoSlugFromUrl } from "../lib/reports";
import {
  buildRunId,
  normalizeTs,
  resolveEngineSha7,
  isValidRunId,
  type ReportEnvelope,
} from "@leapscore/contracts";

async function generate() {
  const provider = new SampleReportProvider();
  const report = await provider.getReport({ repo: "django/django" });

  // Build-time provenance: explicit env first, then checkout, then unknown.
  // (No website request-time resolver remains; see scanner-service spec.)
  const engineSha7 = resolveEngineSha7({
    env: process.env,
    execImpl: (cmd: string) => execSync(cmd, { encoding: "utf8", cwd: process.cwd() }).trim().slice(0, 7),
  });
  console.log("engineSha7:", engineSha7);

  const repoSlug = repoSlugFromUrl("django/django");
  console.log("repoSlug:", repoSlug);

  let ranAt = report.snapshot.scanned_at;
  if (!ranAt.includes(".")) {
    ranAt = ranAt.replace("Z", ".000Z");
  }
  const ts = normalizeTs(ranAt);
  console.log("ts:", ts);

  const runId = buildRunId(repoSlug, engineSha7, ts);
  console.log("runId:", runId);

  const meta = buildMeta({
    repo: "django/django",
    repoSlug,
    engineSha7,
    runId,
    ranAt,
    durationMs: 0,
    budgetMs: 0,
    repoSha: engineSha7,
    report: report as never,
  });

  const envelope: ReportEnvelope = { meta, report: report as never, trace: [], contractVersion: 1 };

  // Build tooling writes the committed sample envelope (the website itself
  // has no write path); traversal-safe by construction via grammar check.
  if (!isValidRunId(runId)) throw new Error(`invalid runId: ${runId}`);
  const dir = path.join(process.cwd(), "reports");
  await mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `${runId}.json`);
  await writeFile(filePath, JSON.stringify(envelope, null, 2), "utf8");
  console.log("Written to:", filePath);

  const { listReportMetas } = await import("../lib/reports");
  const metas = await listReportMetas();
  console.log("Listed metas:", metas.length);
  const found = metas.find((m) => m.runId === runId);
  console.log("Found:", found ? "YES" : "NO");
  console.log("isValidRunId:", isValidRunId(runId));
}

generate().catch(console.error);
