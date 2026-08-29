import path from "node:path";
import { execSync } from "node:child_process";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import type { Report } from "@/lib/types";

// ---------------------------------------------------------------------------
// repoSlug / runId grammar
// ---------------------------------------------------------------------------

export function normalizeRepoForSlug(raw: string | null | undefined): string {
  if (!raw) return "django/django";
  const cleaned = raw
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/^github\.com\//i, "")
    .replace(/\.git$/i, "");
  const withoutQuery = cleaned.split(/[?#]/)[0];
  const parts = withoutQuery.split("/").filter(Boolean);
  if (parts.length < 2) return "django/django";
  const owner = parts[0];
  const repo = parts[1];
  if (!owner || !repo) return "django/django";
  return `${owner}/${repo}`;
}

export function repoSlugFromNormalized(normalized: string): string {
  const lower = normalized.toLowerCase();
  const [owner, repo] = lower.split("/");
  if (!owner || !repo) return "unknown__unknown";
  return `${owner}__${repo}`;
}

export function repoSlugFromUrl(raw: string | null | undefined): string {
  return repoSlugFromNormalized(normalizeRepoForSlug(raw));
}

export function normalizeTs(iso: string): string {
  // 2026-08-29T05:33:00.123Z -> 2026-08-29T053000-123Z
  return iso.replace(/:/g, "").replace(".", "-");
}

export function denormalizeTs(ts: string): string {
  // reverse of normalizeTs for display: 2026-08-29T053000-123Z -> 2026-08-29T05:30:00.123Z
  const m = ts.match(/^(\d{4}-\d{2}-\d{2}T)(\d{2})(\d{2})(\d{2})-(\d+)Z$/);
  if (!m) return ts;
  return `${m[1]}${m[2]}:${m[3]}:${m[4]}.${m[5]}Z`;
}

export function buildRunId(repoSlug: string, engineSha7: string, ts: string): string {
  const safeEngine = engineSha7 && engineSha7.trim() ? engineSha7.trim().slice(0, 7) : "unknown";
  return `${repoSlug}__${safeEngine}__${ts}`;
}

export function parseRunId(runId: string): { repoSlug: string; engineSha7: string; ts: string } | null {
  if (!isValidRunId(runId)) return null;
  const parts = runId.split("__");
  if (parts.length < 3) return null;
  const ts = parts[parts.length - 1];
  const engineSha7 = parts[parts.length - 2];
  const repoSlug = parts.slice(0, parts.length - 2).join("__");
  return { repoSlug, engineSha7, ts };
}

export function repoFromSlug(slug: string): string {
  const [owner, repo] = slug.split("__");
  if (!owner || !repo) return slug;
  return `${owner}/${repo}`;
}

// runId grammar: single segment, no / or .., exactly repoSlug__engineSha__ts
const RUN_ID_RE = /^[\w.\-]+__[\w.\-]+__\d{4}-\d{2}-\d{2}T\d{6}-\d{3}Z$/;

export function isValidRunId(runId: string): boolean {
  if (!runId || runId.includes("/") || runId.includes("\\") || runId.includes("..")) return false;
  return RUN_ID_RE.test(runId);
}

// ---------------------------------------------------------------------------
// engineSha7 resolver
// ---------------------------------------------------------------------------

export function resolveEngineSha7(opts: { env?: NodeJS.ProcessEnv; execImpl?: (cmd: string) => string } = {}): string {
  const env = opts.env ?? process.env;
  const cands = [env.LEAPSCORE_SHA, env.VERCEL_GIT_COMMIT_SHA];
  for (const c of cands) {
    if (c && c.trim()) return c.trim().slice(0, 7);
  }
  try {
    const exec = opts.execImpl ?? ((cmd: string) => execSync(cmd, { encoding: "utf8", timeout: 1500 }).trim());
    const out = exec("git rev-parse --short HEAD");
    if (out && out.trim()) return out.trim().slice(0, 7);
  } catch {
    // ignore
  }
  return "unknown";
}

// ---------------------------------------------------------------------------
// Reports dir helpers
// ---------------------------------------------------------------------------

export function getReportsDir(): string {
  return path.join(process.cwd(), "reports");
}

export interface ReportMeta {
  repo: string; // owner/repo
  repoUrl: string;
  repoSlug: string;
  engineSha7: string;
  runId: string;
  ranAt: string; // ISO
  durationMs: number;
  budgetMs: number;
  repoSha: string;
  score: number;
  tier: string;
  status: string;
  engine_version: string;
  rubric_version: string;
  filename: string;
  coverage?: Report["coverage"];
}

export type TraceEntry = {
  ts: number; // ms since scan start
  label: string;
  type?: string;
  pct?: number;
  elapsedMs?: number;
  remainingMs?: number;
  completedIds?: string[];
};

export interface ReportEnvelope {
  meta: ReportMeta;
  report: Report;
  trace?: TraceEntry[];
}

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
  };
}

export async function ensureReportsDir(): Promise<string> {
  const dir = getReportsDir();
  await mkdir(dir, { recursive: true });
  return dir;
}

export async function writeReportEnvelope(envelope: ReportEnvelope): Promise<string> {
  const dir = await ensureReportsDir();
  if (!isValidRunId(envelope.meta.runId)) {
    throw new Error(`invalid runId: ${envelope.meta.runId}`);
  }
  const filePath = path.join(dir, `${envelope.meta.runId}.json`);
  // Defensive: ensure resolved path stays under dir
  const resolved = path.resolve(filePath);
  const resolvedDir = path.resolve(dir);
  if (!resolved.startsWith(resolvedDir + path.sep) && resolved !== resolvedDir) {
    throw new Error("path traversal rejected");
  }
  await writeFile(filePath, JSON.stringify(envelope, null, 2), "utf8");
  return filePath;
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
