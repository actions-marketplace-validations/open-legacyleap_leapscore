#!/usr/bin/env tsx
/** packages/engine/bin/scan.ts — thin workflow CLI over runUnifiedScan + sealScan (spec: workflow-scan) */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { runUnifiedScan } from '../orchestrator';
import { sealScan } from '../seal';

export const USAGE = `leapscore-scan --repo <owner/repo> [--sha <sha>] --out <path> [--engine-ref <sha>]

  --repo <owner/repo>   Scan subject as owner/repo (no https:// prefix, no .git suffix)
  --sha <sha>           Reserved — any non-empty value is rejected (pinning not yet supported)
  --out <path>          Envelope output path (JSON { report, meta, trace })
  --engine-ref <sha>    Pinned engine ref for meta.engineSha7 identity (else LEAPSCORE_SHA/git/unknown)
  --help                Print this usage`;

export type ParsedArgs = {
  repo?: string;
  sha?: string;
  out?: string;
  engineRef?: string;
  help?: boolean;
};

export function parseArgs(argv: string[]): ParsedArgs {
  const out: ParsedArgs = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') out.help = true;
    else if (a === '--repo') out.repo = argv[++i];
    else if (a === '--sha') out.sha = argv[++i];
    else if (a === '--out') out.out = argv[++i];
    else if (a === '--engine-ref') out.engineRef = argv[++i];
    else if (a.startsWith('--repo=')) out.repo = a.slice('--repo='.length);
    else if (a.startsWith('--sha=')) out.sha = a.slice('--sha='.length);
    else if (a.startsWith('--out=')) out.out = a.slice('--out='.length);
    else if (a.startsWith('--engine-ref=')) out.engineRef = a.slice('--engine-ref='.length);
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

export async function main(argv: string[], opts: { env?: NodeJS.ProcessEnv; stdout?: (s: string) => void; stderr?: (s: string) => void } = {}): Promise<number> {
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
