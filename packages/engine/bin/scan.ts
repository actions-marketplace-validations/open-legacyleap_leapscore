#!/usr/bin/env tsx
/** packages/engine/bin/scan.ts — thin workflow CLI over runUnifiedScan + sealScan (spec: workflow-scan) */
import { mkdir, writeFile, readFile, appendFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { runUnifiedScan } from '../orchestrator';
import { sealScan } from '../seal';
import { normalizeTargetSlug } from '../surface/slug';
import { createSurfaceRestClient } from '../surface/rest';
import type { SurfaceRestClient } from '../surface/rest';
import { runSurface } from '../surface/sync';
import { formatSummaryLine, zeroCounts } from '../surface/summary';

export const USAGE = `leapscore-scan --repo <owner/repo> [--sha <sha>] --out <path> [--engine-ref <sha>]
                  [--surface] [--surface-from <envelope.json>] [--repo-a <owner/repo>] [--run-url <url>]

  --repo <owner/repo>   Scan subject as owner/repo (no https:// prefix, no .git suffix)
  --sha <sha>           Reserved — any non-empty value is rejected (pinning not yet supported)
  --out <path>          Envelope output path (JSON { report, meta, trace })
  --engine-ref <sha>    Pinned engine ref for meta.engineSha7 identity (else LEAPSCORE_SHA/git/unknown)
  --surface             After sealing, sync issues into the runner repo (see --repo-a)
  --surface-from <path> Skip scanning; surface the envelope file at <path> (warn-only, exit 0)
  --repo-a <owner/repo> Runner repo hosting issues (default: --repo)
  --run-url <url>       Workflow run link for ticket provenance (else GITHUB_* env or n/a)
  --help                Print this usage
  (--surface-from takes precedence over --surface: file in, issues out, no scan)`;

export type ParsedArgs = {
  repo?: string;
  sha?: string;
  out?: string;
  engineRef?: string;
  surface?: boolean;
  surfaceFrom?: string;
  repoA?: string;
  runUrl?: string;
  help?: boolean;
};

export function parseArgs(argv: string[]): ParsedArgs {
  const out: ParsedArgs = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') out.help = true;
    else if (a === '--surface') out.surface = true;
    else if (a === '--repo') out.repo = argv[++i];
    else if (a === '--sha') out.sha = argv[++i];
    else if (a === '--out') out.out = argv[++i];
    else if (a === '--engine-ref') out.engineRef = argv[++i];
    else if (a === '--surface-from') out.surfaceFrom = argv[++i];
    else if (a === '--repo-a') out.repoA = argv[++i];
    else if (a === '--run-url') out.runUrl = argv[++i];
    else if (a.startsWith('--repo=')) out.repo = a.slice('--repo='.length);
    else if (a.startsWith('--sha=')) out.sha = a.slice('--sha='.length);
    else if (a.startsWith('--out=')) out.out = a.slice('--out='.length);
    else if (a.startsWith('--engine-ref=')) out.engineRef = a.slice('--engine-ref='.length);
    else if (a.startsWith('--surface-from=')) out.surfaceFrom = a.slice('--surface-from='.length);
    else if (a.startsWith('--repo-a=')) out.repoA = a.slice('--repo-a='.length);
    else if (a.startsWith('--run-url=')) out.runUrl = a.slice('--run-url='.length);
    else if (a.startsWith('--')) throw new Error(`unknown flag ${a}\n${USAGE}`);
    else throw new Error(`unexpected argument ${a}\n${USAGE}`);
  }
  return out;
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
  return '';
}

export type SurfaceClientFactory = (token: string | undefined) => SurfaceRestClient;

export type MainOpts = {
  env?: NodeJS.ProcessEnv;
  stdout?: (s: string) => void;
  stderr?: (s: string) => void;
  /** Injectable surface client factory (tests stub the network). */
  surfaceClientFactory?: SurfaceClientFactory;
};

function splitOwnerRepo(repo: string): [string, string] {
  const [owner, name] = repo.split('/');
  return [owner, name];
}

function resolveRunUrl(args: ParsedArgs, env: NodeJS.ProcessEnv): string | undefined {
  if (args.runUrl) return args.runUrl;
  const server = env.GITHUB_SERVER_URL;
  const repo = env.GITHUB_REPOSITORY;
  const runId = env.GITHUB_RUN_ID;
  if (server && repo && runId) return `${server}/${repo}/actions/runs/${runId}`;
  return undefined;
}

async function appendStepSummary(env: NodeJS.ProcessEnv, markdown: string): Promise<void> {
  const file = env.GITHUB_STEP_SUMMARY;
  if (!file) return;
  try {
    await appendFile(file, markdown + '\n', 'utf8');
  } catch {
    // Step-summary is best-effort; the stdout line already carries the counts.
  }
}

export type SurfacePhaseInput = {
  envelope: { report: { full_table: unknown; gates: unknown }; meta: { repoSha: string; engineSha7: string } };
  repo: string;
  repoA: string;
  runUrl?: string;
  token?: string;
  clientFactory?: SurfaceClientFactory;
  stdout: (s: string) => void;
  stderr: (s: string) => void;
  env: NodeJS.ProcessEnv;
};

/**
 * Warn-only surface phase: every failure path prints a zero/shortfall summary
 * and returns normally — it must never rewrite a sealed scan verdict.
 */
export async function runSurfacePhase(input: SurfacePhaseInput): Promise<void> {
  const { envelope, repo, repoA, runUrl, token, stdout, stderr, env } = input;
  const client = (input.clientFactory ?? ((t) => createSurfaceRestClient({ token: t })))(token);
  const zero = () => {
    stdout(formatSummaryLine(zeroCounts()));
  };
  try {
    const [tOwner, tRepo] = splitOwnerRepo(repo);
    const [aOwner, aRepo] = splitOwnerRepo(repoA);
    const runnerPrivate = await client.getRepoPrivate(aOwner, aRepo);
    const same = `${aOwner}/${aRepo}`.toLowerCase() === `${tOwner}/${tRepo}`.toLowerCase();
    const targetPrivate = same ? runnerPrivate : await client.getRepoPrivate(tOwner, tRepo);
    const res = await runSurface({
      report: envelope.report,
      meta: envelope.meta,
      runner: { owner: aOwner, repo: aRepo, private: runnerPrivate },
      target: { normalized: repo, slug: normalizeTargetSlug(repo), private: targetPrivate },
      client,
      runUrl,
    });
    stdout(res.summaryLine);
    if (res.skippedReason) stdout(`surface-skipped: ${res.skippedReason}`);
    for (const w of res.warnings) stderr(`surface warn: ${w}`);
    await appendStepSummary(env, res.stepSummary);
  } catch (e) {
    stderr(`surface warn: ${(e instanceof Error ? e.message : String(e)).slice(0, 300)}`);
    zero();
  }
}

/** `--surface-from` path: no scan, no envelope write — surface a file, always exit 0. */
export async function surfaceFromFile(
  path: string,
  args: ParsedArgs,
  env: NodeJS.ProcessEnv,
  stdout: (s: string) => void,
  stderr: (s: string) => void,
  clientFactory?: SurfaceClientFactory,
  token?: string,
): Promise<number> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(await readFile(path, 'utf8'));
  } catch (e) {
    stderr(`invalid envelope file ${path}: ${(e instanceof Error ? e.message : String(e)).slice(0, 200)}`);
    return 2;
  }
  const env1 = parsed as { report?: { full_table?: unknown; gates?: unknown }; meta?: { repo?: string; repoSha?: string; engineSha7?: string } };
  if (!env1 || typeof env1 !== 'object' || !env1.report || !Array.isArray(env1.report.full_table) || !env1.meta) {
    stderr(`invalid envelope file ${path}: expected { report: { full_table: [...] }, meta: {...} }`);
    return 2;
  }
  let repo: string;
  try {
    repo = args.repo ? validateRepo(args.repo) : validateRepo(String(env1.meta.repo ?? ''));
  } catch (e) {
    stderr(e instanceof Error ? e.message : String(e));
    return 2;
  }
  let repoA: string;
  try {
    repoA = args.repoA ? validateRepo(args.repoA) : repo;
  } catch (e) {
    stderr(e instanceof Error ? e.message : String(e));
    return 2;
  }
  await runSurfacePhase({
    envelope: {
      report: { full_table: env1.report.full_table, gates: env1.report.gates },
      meta: { repoSha: String(env1.meta.repoSha ?? 'unknown'), engineSha7: String(env1.meta.engineSha7 ?? 'unknown') },
    },
    repo,
    repoA,
    runUrl: resolveRunUrl(args, env),
    token,
    clientFactory,
    stdout,
    stderr,
    env,
  });
  return 0;
}

export async function main(argv: string[], opts: MainOpts = {}): Promise<number> {
  const env = opts.env ?? process.env;
  const stdout = opts.stdout ?? ((s: string) => process.stdout.write(s + '\n'));
  const stderr = opts.stderr ?? ((s: string) => process.stderr.write(s + '\n'));

  let args: ParsedArgs;
  try {
    args = parseArgs(argv);
  } catch (e) {
    stderr(e instanceof Error ? e.message : String(e));
    return 2;
  }
  if (args.help) {
    stdout(USAGE);
    return 0;
  }
  // --surface-from takes precedence over --surface: file in, issues out, no scan.
  if (args.surfaceFrom) {
    const token = env.GH_TOKEN ?? env.GITHUB_TOKEN;
    return surfaceFromFile(args.surfaceFrom, args, env, stdout, stderr, opts.surfaceClientFactory, token);
  }
  let repo: string;
  try {
    repo = validateRepo(args.repo);
  } catch (e) {
    stderr(e instanceof Error ? e.message : String(e));
    return 2;
  }
  if (args.sha != null && args.sha !== '') {
    stderr(`--sha pinning not yet supported (got ${JSON.stringify(args.sha)}); re-run without --sha to scan default-branch HEAD`);
    return 2;
  }
  if (!args.out) {
    stderr(`missing --out <path>\n${USAGE}`);
    return 2;
  }
  let repoA: string;
  try {
    repoA = args.repoA ? validateRepo(args.repoA) : repo;
  } catch (e) {
    stderr(e instanceof Error ? e.message : String(e));
    return 2;
  }

  const repoUrl = `https://github.com/${repo}`;
  const token = env.GH_TOKEN ?? env.GITHUB_TOKEN;
  const startMs = Date.now();
  const trace: Array<{ ts: number; elapsedMs: number; label: string; type?: string }> = [
    { ts: 0, elapsedMs: 0, label: `Starting scan — ${repo}`, type: 'start' },
  ];

  let budgetMs = 0;
  let facts: never[] | unknown[] = [];
  let snapshot: unknown = null;
  let scanId: string | undefined;
  try {
    const gen = runUnifiedScan(repoUrl, token ? { token } : {});
    for await (const evt of gen) {
      if (evt.type === 'meta') {
        budgetMs = evt.budgetMs ?? 0;
        trace.push({ ts: Date.now() - startMs, elapsedMs: Date.now() - startMs, label: (evt as { milestone?: string }).milestone ?? `Budget ${Math.ceil(budgetMs / 1000)}s`, type: 'meta' });
      } else if (evt.type === 'progress') {
        const m = (evt as { milestone?: string }).milestone;
        if (m) trace.push({ ts: Date.now() - startMs, elapsedMs: Date.now() - startMs, label: m, type: 'progress' });
      } else if (evt.type === 'trace') {
        trace.push({
          ts: (evt.elapsedMs as number) ?? Date.now() - startMs,
          elapsedMs: (evt.elapsedMs as number) ?? Date.now() - startMs,
          label: (evt.label as string) ?? '',
          type: 'trace',
        });
      } else if (evt.type === 'refused') {
        const reason = String((evt as { reason?: string }).reason ?? 'crash');
        const detail = String((evt as { detail?: string }).detail ?? '').slice(0, 500);
        const hint = refusalHint(reason);
        stderr(`refused (${reason}): ${detail}${hint ? ` — ${hint}` : ''}`);
        return exitCodeForReason(reason);
      } else if (evt.type === 'done') {
        facts = (evt.facts as unknown[]) ?? [];
        snapshot = evt.snapshot ?? null;
        scanId = evt.id as string | undefined;
        break;
      }
    }
  } catch (e) {
    stderr(`crash: ${(e instanceof Error ? e.message : String(e)).slice(0, 500)}`);
    return 1;
  }

  if (!snapshot) {
    stderr('crash: scan ended without facts');
    return 1;
  }

  const sealed = sealScan({
    facts: facts as never,
    snapshot: snapshot as Record<string, unknown>,
    budgetMs,
    startMs,
    trace: trace as never,
    engineRef: args.engineRef,
    env: env as NodeJS.ProcessEnv,
    scanId,
    repo,
  });

  await mkdir(dirname(args.out), { recursive: true });
  await writeFile(args.out, JSON.stringify({ report: sealed.report, meta: sealed.meta, trace: sealed.traceToPersist }, null, 2), 'utf8');
  stdout(sealed.stdoutLine);
  if (args.surface) {
    await runSurfacePhase({
      envelope: {
        report: { full_table: (sealed.report as unknown as { full_table: unknown }).full_table, gates: (sealed.report as unknown as { gates: unknown }).gates },
        meta: { repoSha: String(sealed.meta.repoSha), engineSha7: String(sealed.meta.engineSha7) },
      },
      repo,
      repoA,
      runUrl: resolveRunUrl(args, env),
      token,
      clientFactory: opts.surfaceClientFactory,
      stdout,
      stderr,
      env,
    });
  }
  return 0;
}

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
