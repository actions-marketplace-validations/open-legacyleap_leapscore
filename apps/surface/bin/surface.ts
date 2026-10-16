#!/usr/bin/env tsx
/** apps/surface/src/../bin/surface.ts — standalone surface CLI (envelope file in → issues out). */
import { readFile, appendFile } from 'node:fs/promises';
import { normalizeTargetSlug } from '../src/slug';
import { createSurfaceRestClient } from '../src/rest';
import type { SurfaceRestClient } from '../src/rest';
import { runSurface } from '../src/sync';
import { formatSummaryLine, zeroCounts } from '../src/summary';

export const USAGE = `surface --from <envelope.json> --repo <owner/repo> [--repo-a <owner/repo>] [--run-url <url>]

  --from <path>       Sealed envelope file ({ report: { full_table, gates }, meta })
  --repo <owner/repo> Scan subject as owner/repo (default: meta.repo in the envelope)
  --repo-a <owner/repo> Runner repo hosting issues (default: --repo)
  --run-url <url>     Workflow run link for ticket provenance (else GITHUB_* env or n/a)
  --help              Print this usage

Warn-only: write shortfalls print as "surface warn:" lines and exit 0.
Exit 2 only for an invalid envelope file or invalid --repo/--repo-a.`;

export type ParsedArgs = {
  from?: string;
  repo?: string;
  repoA?: string;
  runUrl?: string;
  help?: boolean;
};

export function parseArgs(argv: string[]): ParsedArgs {
  const out: ParsedArgs = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') out.help = true;
    else if (a === '--from') out.from = argv[++i];
    else if (a === '--repo') out.repo = argv[++i];
    else if (a === '--repo-a') out.repoA = argv[++i];
    else if (a === '--run-url') out.runUrl = argv[++i];
    else if (a.startsWith('--from=')) out.from = a.slice('--from='.length);
    else if (a.startsWith('--repo=')) out.repo = a.slice('--repo='.length);
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

/** `--from` path: surface an envelope file, always exit 0 on sealed input. */
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
  if (!args.from) {
    stderr(`missing --from <envelope.json>\n${USAGE}`);
    return 2;
  }
  const token = env.SURFACE_TOKEN ?? env.GH_TOKEN ?? env.GITHUB_TOKEN;
  return surfaceFromFile(args.from, args, env, stdout, stderr, opts.surfaceClientFactory, token);
}

const invokedDirectly = (() => {
  try {
    const entry = process.argv[1] ?? '';
    return entry.endsWith('/bin/surface.ts') || entry.endsWith('\\bin\\surface.ts') || entry.endsWith('/bin/surface.js') || entry === 'surface';
  } catch {
    return false;
  }
})();

if (invokedDirectly) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (e) => {
      process.stderr.write(`surface warn: ${(e instanceof Error ? e.message : String(e)).slice(0, 300)}\n`);
      process.stdout.write(formatSummaryLine(zeroCounts()) + '\n');
      process.exit(0);
    },
  );
}
