#!/usr/bin/env tsx
/** apps/scanner/bin/scan.ts — thin workflow CLI over runUnifiedScan/runLocalScan + sealScan (spec: workflow-scan, scan-local) */
import { mkdir, writeFile } from 'node:fs/promises';
import { stat } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import { resolve, basename } from 'node:path';
import { runUnifiedScan } from '../src/scan/orchestrator';
import { runLocalScan } from '../src/scan/local';
import { sealScan, CONTRACT_VERSION, localSlugFromPath, assessmentUrlForBand } from '../src/scan/scoring/seal';
import { renderHtml, renderMarkdown } from '../src/scan/render';

export const USAGE = `leapscore-scan [scan] [<path> | --repo <owner/repo>] --out <dir> [--strict] [--fail-under <0-100>] [--sha <sha>] [--engine-ref <sha>]

  scan <path>             Local directory scan (default entry): no clone, no GH-API, 25 local detectors
  --repo <owner/repo>     Remote scan subject as owner/repo (no https:// prefix, no .git suffix)
  --sha <sha>             Reserved — any non-empty value is rejected (pinning not yet supported)
  --out <dir>             Report directory: writes report.json + report.html + report.md (all three, every sealed run)
  --strict                Zero-socket mode: any network attempt aborts (vendored snapshots only). Conflicts with --repo.
  --fail-under <0-100>    Exit 3 when the sealed score is below <n> (files are still written)
  --engine-ref <sha>      Pinned engine ref for meta.engineSha7 identity (else LEAPSCORE_SHA/git/unknown)
  --help                  Print this usage

  Exits: 0 pass · 1 crash · 2 usage-or-refused · 3 threshold trip (--fail-under)
  Stdout: one line with score/band, gates, coverage, threshold state, plus the tracked assessment URL once.

  Issue surfacing moved to the standalone app: use \`surface --from <dir>/report.json --repo <owner/repo>\`
  (apps/surface) instead of the removed --surface / --surface-from flags.`;

export const SURFACE_MOVED_HINT = `issue surfacing moved out of leapscore-scan: use \`surface --from <envelope.json> --repo <owner/repo>\` (apps/surface) instead of --surface / --surface-from`;

export const EXIT_OK = 0;
export const EXIT_CRASH = 1;
export const EXIT_USAGE = 2;
export const EXIT_THRESHOLD = 3;

export type ParsedArgs = {
  path?: string;
  repo?: string;
  sha?: string;
  out?: string;
  engineRef?: string;
  strict?: boolean;
  failUnder?: string;
  surface?: boolean;
  surfaceFrom?: string;
  repoA?: string;
  runUrl?: string;
  help?: boolean;
};

export function parseArgs(argv: string[]): ParsedArgs {
  const out: ParsedArgs = {};
  const positionals: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') out.help = true;
    else if (a === '--strict') out.strict = true;
    else if (a === '--surface') out.surface = true;
    else if (a === '--repo') out.repo = argv[++i];
    else if (a === '--sha') out.sha = argv[++i];
    else if (a === '--out') out.out = argv[++i];
    else if (a === '--engine-ref') out.engineRef = argv[++i];
    else if (a === '--fail-under') out.failUnder = argv[++i];
    else if (a === '--surface-from') out.surfaceFrom = argv[++i];
    else if (a === '--repo-a') out.repoA = argv[++i];
    else if (a === '--run-url') out.runUrl = argv[++i];
    else if (a.startsWith('--repo=')) out.repo = a.slice('--repo='.length);
    else if (a.startsWith('--sha=')) out.sha = a.slice('--sha='.length);
    else if (a.startsWith('--out=')) out.out = a.slice('--out='.length);
    else if (a.startsWith('--engine-ref=')) out.engineRef = a.slice('--engine-ref='.length);
    else if (a.startsWith('--fail-under=')) out.failUnder = a.slice('--fail-under='.length);
    else if (a.startsWith('--surface-from=')) out.surfaceFrom = a.slice('--surface-from='.length);
    else if (a.startsWith('--repo-a=')) out.repoA = a.slice('--repo-a='.length);
    else if (a.startsWith('--run-url=')) out.runUrl = a.slice('--run-url='.length);
    else if (a.startsWith('--strict=')) throw new Error(`unknown flag ${a}\n${USAGE}`);
    else if (a.startsWith('--')) throw new Error(`unknown flag ${a}\n${USAGE}`);
    else positionals.push(a);
  }
  // Optional `scan` verb + optional <path> positional.
  const rest = positionals[0] === 'scan' ? positionals.slice(1) : positionals;
  if (rest.length > 1) throw new Error(`unexpected argument ${JSON.stringify(rest[1])}\n${USAGE}`);
  if (rest.length === 1) out.path = rest[0];
  return out;
}

export function parseFailUnder(raw: string | undefined): number | undefined {
  if (raw == null) return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0 || n > 100) {
    throw new Error(`invalid --fail-under ${JSON.stringify(raw)}: expected a number 0-100\n${USAGE}`);
  }
  return n;
}

export function validateRepo(raw: string | undefined): string {
  if (!raw || !raw.trim()) throw new Error(`missing --repo (expected owner/repo, e.g. vercel/next.js)\n${USAGE}`);
  const v = raw.trim();
  if (/^https?:\/\//i.test(v) || /^github\.com\//i.test(v)) {
    throw new Error(`invalid --repo ${JSON.stringify(v)}: expected owner/repo without https:// prefix (e.g. vercel/next.js)`);
  }
  if (/\.git$/i.test(v)) {
    throw new Error(`invalid --repo ${JSON.stringify(v)}: expected owner/repo without .git suffix (e.g. vercel/next.js)`);
  }
  if (!/^[\w.-]+\/[\w.-]+$/.test(v)) {
    throw new Error(`invalid --repo ${JSON.stringify(v)}: expected owner/repo (e.g. vercel/next.js)`);
  }
  return v;
}

/** Refused reasons that map to exit 2 (unsupported input / honest refusal). Everything else refused → crash (1). */
const EXIT2_REASONS = new Set([
  'not_found',
  'private_requires_app',
  'rate-limited',
  'unsupported_host',
  'invalid_url',
  'missing_repo',
  'bad_path',
  'strict_conflict',
]);

export function exitCodeForReason(reason: string): number {
  return EXIT2_REASONS.has(reason) ? 2 : 1;
}

export function refusalHint(reason: string): string {
  if (reason === 'private_requires_app') {
    return 'private repo — provide a PAT/App token with contents:read on the target (e.g. LEAPSCORE_TOKEN); GITHUB_TOKEN from another repo cannot read private repos';
  }
  if (reason === 'not_found') {
    return 'repo not found or invisible to the token (private repos need a PAT/App token with contents:read)';
  }
  if (reason === 'rate-limited') return 'GitHub rate limit exhausted — retry later or provide a token with more quota';
  if (reason === 'bad_path') return 'provide an existing local directory to scan';
  if (reason === 'strict_conflict') return '--strict scans a local path only; drop --repo or drop --strict';
  return '';
}

export type MainOpts = {
  env?: NodeJS.ProcessEnv;
  stdout?: (s: string) => void;
  stderr?: (s: string) => void;
};

export async function main(argv: string[], opts: MainOpts = {}): Promise<number> {
  const env = opts.env ?? process.env;
  const stdout = opts.stdout ?? ((s: string) => process.stdout.write(s + '\n'));
  const stderr = opts.stderr ?? ((s: string) => process.stderr.write(s + '\n'));

  let args: ParsedArgs;
  try {
    args = parseArgs(argv);
  } catch (e) {
    stderr(e instanceof Error ? e.message : String(e));
    return EXIT_USAGE;
  }
  if (args.help) {
    stdout(USAGE);
    return EXIT_OK;
  }
  // --surface / --surface-from were removed: surfacing lives in apps/surface now.
  if (args.surfaceFrom || args.surface) {
    stderr(SURFACE_MOVED_HINT);
    return EXIT_USAGE;
  }
  // --strict + --repo is a usage error rejected before any work.
  if (args.strict && args.repo != null) {
    stderr(`refused (strict_conflict): --strict cannot be combined with --repo — ${refusalHint('strict_conflict')}`);
    return EXIT_USAGE;
  }
  if (args.sha != null && args.sha !== '') {
    stderr(`--sha pinning not yet supported (got ${JSON.stringify(args.sha)}); re-run without --sha to scan default-branch HEAD`);
    return EXIT_USAGE;
  }
  let failUnder: number | undefined;
  try {
    failUnder = parseFailUnder(args.failUnder);
  } catch (e) {
    stderr(e instanceof Error ? e.message : String(e));
    return EXIT_USAGE;
  }
  if (!args.out) {
    stderr(`missing --out <dir>\n${USAGE}`);
    return EXIT_USAGE;
  }
  const outDir = args.out;

  const useLocal = args.path != null || args.repo == null;
  if (useLocal && !args.path) {
    stderr(`missing scan <path> or --repo <owner/repo>\n${USAGE}`);
    return EXIT_USAGE;
  }

  const startMs = Date.now();
  const trace: Array<{ ts: number; elapsedMs: number; label: string; type?: string }> = [];

  if (useLocal) {
    return await runLocalMain(args.path!, { env, stdout, stderr, outDir, startMs, trace, failUnder, strict: !!args.strict, engineRef: args.engineRef });
  }
  const repo = validateRepoSafe(args.repo, stderr);
  if (!repo) return EXIT_USAGE;
  return await runRemoteMain(repo, { env, stdout, stderr, outDir, startMs, trace, failUnder, engineRef: args.engineRef });
}

function validateRepoSafe(raw: string | undefined, stderr: (s: string) => void): string | null {
  try {
    return validateRepo(raw);
  } catch (e) {
    stderr(e instanceof Error ? e.message : String(e));
    return null;
  }
}

type RunOpts = {
  env: NodeJS.ProcessEnv;
  stdout: (s: string) => void;
  stderr: (s: string) => void;
  outDir: string;
  startMs: number;
  trace: Array<{ ts: number; elapsedMs: number; label: string; type?: string }>;
  failUnder: number | undefined;
  engineRef?: string;
};

async function runLocalMain(
  targetPath: string,
  o: RunOpts & { strict: boolean },
): Promise<number> {
  const absPath = resolve(targetPath);
  try {
    const st = await stat(absPath);
    if (!st.isDirectory()) {
      o.stderr(`refused (bad_path): not a directory: ${targetPath} — ${refusalHint('bad_path')}`);
      return EXIT_USAGE;
    }
  } catch {
    o.stderr(`refused (bad_path): path does not exist: ${targetPath} — ${refusalHint('bad_path')}`);
    return EXIT_USAGE;
  }

  o.trace.push({ ts: 0, elapsedMs: 0, label: `Starting local scan — ${absPath}`, type: 'start' });
  let budgetMs = 0;
  let facts: unknown[] = [];
  let snapshot: Record<string, unknown> | null = null;
  let scanId: string | undefined;
  try {
    const gen = runLocalScan(absPath, { strict: o.strict });
    for await (const evt of gen) {
      if (evt.type === 'meta') {
        budgetMs = (evt.budgetMs as number) ?? 0;
        o.trace.push({ ts: Date.now() - o.startMs, elapsedMs: Date.now() - o.startMs, label: (evt.milestone as string) ?? `Budget ${Math.ceil(budgetMs / 1000)}s`, type: 'meta' });
      } else if (evt.type === 'progress') {
        const m = evt.milestone as string | undefined;
        if (m) o.trace.push({ ts: Date.now() - o.startMs, elapsedMs: Date.now() - o.startMs, label: m, type: 'progress' });
      } else if (evt.type === 'trace') {
        o.trace.push({
          ts: (evt.elapsedMs as number) ?? Date.now() - o.startMs,
          elapsedMs: (evt.elapsedMs as number) ?? Date.now() - o.startMs,
          label: (evt.label as string) ?? '',
          type: 'trace',
        });
      } else if (evt.type === 'refused') {
        const reason = String((evt.reason as string) ?? 'crash');
        const detail = String((evt.detail as string) ?? '').slice(0, 500);
        const hint = refusalHint(reason);
        o.stderr(`refused (${reason}): ${detail}${hint ? ` — ${hint}` : ''}`);
        return exitCodeForReason(reason);
      } else if (evt.type === 'done') {
        facts = (evt.facts as unknown[]) ?? [];
        snapshot = evt.snapshot as Record<string, unknown>;
        scanId = evt.id as string | undefined;
        break;
      }
    }
  } catch (e) {
    o.stderr(`crash: ${(e instanceof Error ? e.message : String(e)).slice(0, 500)}`);
    return EXIT_CRASH;
  }

  if (!snapshot) {
    o.stderr('crash: scan ended without facts');
    return EXIT_CRASH;
  }

  const sorted = [...facts].sort((a, b) => String((a as { detectorId?: string }).detectorId ?? '').localeCompare(String((b as { detectorId?: string }).detectorId ?? '')));
  const sealed = sealScan({
    facts: sorted as never,
    snapshot: snapshot as Record<string, unknown>,
    budgetMs,
    startMs: o.startMs,
    trace: o.trace as never,
    engineRef: o.engineRef,
    env: o.env as NodeJS.ProcessEnv,
    execImpl: (cmd: string) => execSync(cmd, { encoding: 'utf8', timeout: 1500, stdio: ['ignore', 'pipe', 'ignore'] }).trim(),
    scanId,
    repo: absPath,
    subjectSlug: localSlugFromPath(basename(absPath)),
    repoUrl: `file://${absPath}`,
  });

  return await writeReportsAndExit(sealed, o);
}

async function runRemoteMain(repo: string, o: RunOpts): Promise<number> {
  const token = o.env.GH_TOKEN ?? o.env.GITHUB_TOKEN;
  const repoUrl = `https://github.com/${repo}`;
  o.trace.push({ ts: 0, elapsedMs: 0, label: `Starting scan — ${repo}`, type: 'start' });

  let budgetMs = 0;
  let facts: never[] | unknown[] = [];
  let snapshot: unknown = null;
  let scanId: string | undefined;
  try {
    const gen = runUnifiedScan(repoUrl, token ? { token } : {});
    for await (const evt of gen) {
      if (evt.type === 'meta') {
        budgetMs = evt.budgetMs ?? 0;
        o.trace.push({ ts: Date.now() - o.startMs, elapsedMs: Date.now() - o.startMs, label: (evt as { milestone?: string }).milestone ?? `Budget ${Math.ceil(budgetMs / 1000)}s`, type: 'meta' });
      } else if (evt.type === 'progress') {
        const m = (evt as { milestone?: string }).milestone;
        if (m) o.trace.push({ ts: Date.now() - o.startMs, elapsedMs: Date.now() - o.startMs, label: m, type: 'progress' });
      } else if (evt.type === 'trace') {
        o.trace.push({
          ts: (evt.elapsedMs as number) ?? Date.now() - o.startMs,
          elapsedMs: (evt.elapsedMs as number) ?? Date.now() - o.startMs,
          label: (evt.label as string) ?? '',
          type: 'trace',
        });
      } else if (evt.type === 'refused') {
        const reason = String((evt as { reason?: string }).reason ?? 'crash');
        const detail = String((evt as { detail?: string }).detail ?? '').slice(0, 500);
        const hint = refusalHint(reason);
        o.stderr(`refused (${reason}): ${detail}${hint ? ` — ${hint}` : ''}`);
        return exitCodeForReason(reason);
      } else if (evt.type === 'done') {
        facts = (evt.facts as unknown[]) ?? [];
        snapshot = evt.snapshot ?? null;
        scanId = evt.id as string | undefined;
        break;
      }
    }
  } catch (e) {
    o.stderr(`crash: ${(e instanceof Error ? e.message : String(e)).slice(0, 500)}`);
    return EXIT_CRASH;
  }

  if (!snapshot) {
    o.stderr('crash: scan ended without facts');
    return EXIT_CRASH;
  }

  const sorted = [...facts].sort((a, b) => String((a as { detectorId?: string }).detectorId ?? '').localeCompare(String((b as { detectorId?: string }).detectorId ?? '')));
  const sealed = sealScan({
    facts: sorted as never,
    snapshot: snapshot as Record<string, unknown>,
    budgetMs,
    startMs: o.startMs,
    trace: o.trace as never,
    engineRef: o.engineRef,
    env: o.env as NodeJS.ProcessEnv,
    execImpl: (cmd: string) => execSync(cmd, { encoding: 'utf8', timeout: 1500, stdio: ['ignore', 'pipe', 'ignore'] }).trim(),
    scanId,
    repo,
  });

  return await writeReportsAndExit(sealed, o);
}

async function writeReportsAndExit(
  sealed: {
    report: unknown;
    meta: { runId: string; score: number; tier: string };
    traceToPersist: unknown;
    stdoutLine: string;
  },
  o: RunOpts,
): Promise<number> {
  const report = sealed.report as {
    headline: { score: number; tier: string };
    gates: unknown[];
    coverage: { measured: number; estimated: number; unknown: number };
    top_blockers: Array<{ row: string; name: string; points_lost: number; weight_pp: string; summary: string; evidence_file?: string; rule?: string }>;
    categories: Array<{ id: string; name: string; category_score: number | null; weight: number; applicable: number }>;
    snapshot: { repo?: string; scanned_commit?: string; scanned_at?: string };
    status: string;
  };
  const meta = sealed.meta as { repo: string; repoSha: string; runId: string; score: number; tier: string; tier_legacy?: string; status: string };
  const renderInput = {
    score: report.headline.score,
    tier: report.headline.tier,
    tierLegacy: meta.tier_legacy,
    repo: meta.repo,
    repoSha: meta.repoSha,
    runId: meta.runId,
    scannedAt: String(report.snapshot?.scanned_at ?? ''),
    status: String(report.status ?? ''),
    coverage: report.coverage,
    gates: (report.gates ?? []) as RenderInput['gates'],
    topBlockers: (report.top_blockers ?? []) as RenderInput['topBlockers'],
    categories: (report.categories ?? []) as RenderInput['categories'],
  };
  await mkdir(o.outDir, { recursive: true });
  await writeFile(`${o.outDir}/report.json`, JSON.stringify({ report: sealed.report, meta: sealed.meta, trace: sealed.traceToPersist, contractVersion: CONTRACT_VERSION }, null, 2), 'utf8');
  await writeFile(`${o.outDir}/report.html`, renderHtml(renderInput), 'utf8');
  await writeFile(`${o.outDir}/report.md`, renderMarkdown(renderInput), 'utf8');

  const threshold = o.failUnder;
  const tripped = threshold != null && report.headline.score < threshold;
  const thresholdState = threshold != null ? ` threshold:${tripped ? 'trip' : 'pass'}(fail-under ${threshold})` : '';
  // Single stdout line: score/band, gates, coverage, threshold state + assessment URL exactly once.
  const line = `${sealed.stdoutLine}${thresholdState}`;
  const url = assessmentUrlForBand(report.headline.tier);
  const finalLine = line.includes(url) ? line : `${line} ${url}`;
  o.stdout(finalLine);
  if (tripped) {
    o.stderr(`threshold trip: score ${report.headline.score} < --fail-under ${threshold}`);
    return EXIT_THRESHOLD;
  }
  return EXIT_OK;
}

type RenderInput = {
  gates: Array<{ id: string; name: string; status: string; note: string }>;
  topBlockers: Array<{ row: string; name: string; points_lost: number; weight_pp: string; summary: string; evidence_file?: string; rule?: string }>;
  categories: Array<{ id: string; name: string; category_score: number | null; weight: number; applicable: number }>;
};

const invokedDirectly = (() => {
  try {
    const entry = process.argv[1] ?? '';
    return entry.endsWith('/bin/scan.ts') || entry.endsWith('\\bin\\scan.ts') || entry.endsWith('/bin/scan.js') || entry.endsWith('leapscore-scan');
  } catch {
    return false;
  }
})();

if (invokedDirectly) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (e) => {
      process.stderr.write(`crash: ${(e instanceof Error ? e.message : String(e)).slice(0, 500)}\n`);
      process.exit(1);
    },
  );
}
