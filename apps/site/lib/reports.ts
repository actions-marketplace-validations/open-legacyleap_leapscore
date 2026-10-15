import path from "node:path";
import { readdir, readFile } from "node:fs/promises";
import type { Report } from "@/lib/types";
// Single producer-owned grammar + envelope: no second implementation here.
import {
  normalizeRepoForSlug,
  repoSlugFromNormalized,
  repoSlugFromUrl,
  normalizeTs,
  denormalizeTs,
  buildRunId,
  parseRunId,
  repoFromSlug,
  isValidRunId,
  assertContractVersion,
  CONTRACT_VERSION,
  type ReportMeta as ContractReportMeta,
  type ReportEnvelope as ContractEnvelope,
  type TraceEntry as ContractTrace,
} from "@leapscore/contracts";

export {
  normalizeRepoForSlug,
  repoSlugFromNormalized,
  repoSlugFromUrl,
  normalizeTs,
  denormalizeTs,
  buildRunId,
  parseRunId,
  repoFromSlug,
  isValidRunId,
  assertContractVersion,
  CONTRACT_VERSION,
};

// ---------------------------------------------------------------------------
// Reports build-input helpers (read-only; the website never writes envelopes)
// ---------------------------------------------------------------------------

export function getReportsDir(): string {
  return path.join(process.cwd(), "reports");
}

export type ReportMeta = ContractReportMeta;
export type TraceEntry = ContractTrace;
export type ReportEnvelope = ContractEnvelope;

export function buildMeta(args: {
  repo: string;
  repoSlug: string;
  engineSha7: string;
  runId: string;
  ranAt: string;
  durationMs: number;
  budgetMs: number;
  repoSha: string;
  report: Report;
}): ReportMeta {
  const { repo, repoSlug, engineSha7, runId, ranAt, durationMs, budgetMs, repoSha, report } = args;
  return {
    repo,
    repoUrl: `https://github.com/${repo}`,
    repoSlug,
    engineSha7,
    runId,
    ranAt,
    durationMs,
    budgetMs,
    repoSha: repoSha || "unknown",
    score: report.headline.score,
    tier: report.headline.tier,
    status: report.status,
    engine_version: report.snapshot.engine_version,
    rubric_version: report.snapshot.rubric_version,
    filename: `${runId}.json`,
    coverage: report.coverage,
    contractVersion: CONTRACT_VERSION,
  };
}

export async function readReportEnvelope(runId: string): Promise<ReportEnvelope | null> {
  if (!isValidRunId(runId)) return null;
  const dir = getReportsDir();
  const filePath = path.join(dir, `${runId}.json`);
  const resolved = path.resolve(filePath);
  const resolvedDir = path.resolve(dir);
  if (!resolved.startsWith(resolvedDir + path.sep)) return null;
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as ReportEnvelope;
    if (!parsed.meta || !parsed.report) return null;
    try {
      assertContractVersion(parsed);
    } catch (e) {
      console.warn(`[reports] skipping unsupported-version envelope ${runId}: ${(e as Error).message}`);
      return null;
    }
    if (!Array.isArray(parsed.trace)) parsed.trace = [];
    return parsed;
  } catch {
    return null;
  }
}

export async function listReportMetas(): Promise<ReportMeta[]> {
  const dir = getReportsDir();
  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch {
    return [];
  }
  const metas: ReportMeta[] = [];
  for (const name of entries) {
    if (!name.endsWith(".json")) continue;
    const runId = name.slice(0, -5);
    if (!isValidRunId(runId)) continue;
    try {
      const raw = await readFile(path.join(dir, name), "utf8");
      const parsed = JSON.parse(raw) as ReportEnvelope;
      if (parsed.meta && parsed.meta.runId) {
        try {
          assertContractVersion(parsed);
        } catch (e) {
          console.warn(`[reports] skipping unsupported-version file ${name}: ${(e as Error).message}`);
          continue;
        }
        metas.push(parsed.meta);
      }
    } catch (e) {
      console.warn(`[reports] skipping invalid file ${name}: ${(e as Error).message}`);
      continue;
    }
  }
  metas.sort((a, b) => new Date(b.ranAt).getTime() - new Date(a.ranAt).getTime());
  return metas;
}
