/** apps/scanner/src/scan/git.ts — bounded git-history reads (detector-honesty 2.1/2.2).
 *
 * The only external binary the engine spawns is `git`. These helpers run it with
 * hard bounds (window, max commits, timeout, maxBuffer) and degrade to `null`
 * when the target is not a git repo or history is unavailable — callers then
 * report `unknown` rather than a guess. Evidence pointers for git-derived facts
 * name the git-history basis (e.g. `git log --since=<iso>`), not a file.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const MAX_BUFFER = 64 * 1024 * 1024;

export type GitRun = { stdout: string } | null;

async function runGit(root: string, args: string[], opts: { signal?: AbortSignal; timeoutMs?: number } = {}): Promise<GitRun> {
  try {
    const { stdout } = await execFileAsync('git', ['-C', root, ...args], {
      maxBuffer: MAX_BUFFER,
      timeout: opts.timeoutMs ?? 20_000,
      signal: opts.signal,
    });
    return { stdout };
  } catch {
    return null;
  }
}

export async function isGitRepo(root: string, opts: { signal?: AbortSignal; timeoutMs?: number } = {}): Promise<boolean> {
  const r = await runGit(root, ['rev-parse', '--is-inside-work-tree'], opts);
  return r != null && r.stdout.trim() === 'true';
}

export type GitChurn = {
  commitsAnalyzed: number;
  windowDays: number;
  /** file path -> number of commits touching it in the window */
  fileCommits: Map<string, number>;
  /** file path -> number of bugfix commits touching it in the window */
  fileBugfixCommits: Map<string, number>;
  historyTruncated: boolean;
  sinceIso: string;
};

function bump(m: Map<string, number>, k: string): void {
  m.set(k, (m.get(k) ?? 0) + 1);
}

/** Bounded `git log --name-only` churn + bugfix-subject proxy (ARCH-05).
 * `null` when history is unavailable. */
export async function gitChurn(
  root: string,
  opts: { sinceDays?: number; maxCommits?: number; signal?: AbortSignal; timeoutMs?: number; nowMs?: number } = {},
): Promise<GitChurn | null> {
  const windowDays = opts.sinceDays ?? 365;
  const maxCommits = opts.maxCommits ?? 4000;
  const nowMs = opts.nowMs ?? Date.now();
  const sinceIso = new Date(nowMs - windowDays * 86_400_000).toISOString();
  const r = await runGit(
    root,
    ['log', `--since=${sinceIso}`, `--max-count=${maxCommits}`, '--name-only', '--pretty=format:\u0001%ct\u001f%s'],
    opts,
  );
  if (!r) return null;

  const fileCommits = new Map<string, number>();
  const fileBugfixCommits = new Map<string, number>();
  let commits = 0;
  let curBug = false;
  for (const raw of r.stdout.split('\n')) {
    if (raw.startsWith('\u0001')) {
      const rest = raw.slice(1);
      const sep = rest.indexOf('\u001f');
      const subject = sep >= 0 ? rest.slice(sep + 1) : '';
      curBug = /^(fix|bug|hotfix|revert|crash)/i.test(subject.trim());
      commits++;
      continue;
    }
    const file = raw.trim();
    if (!file) continue;
    bump(fileCommits, file);
    if (curBug) bump(fileBugfixCommits, file);
  }
  return {
    commitsAnalyzed: commits,
    windowDays,
    fileCommits,
    fileBugfixCommits,
    historyTruncated: commits >= maxCommits,
    sinceIso,
  };
}

/** Whole days from the scan instant to the repository's root commit (oldest). */
export async function gitRepoAgeDays(root: string, nowMs: number, opts: { signal?: AbortSignal; timeoutMs?: number } = {}): Promise<number | null> {
  const r = await runGit(root, ['log', '--format=%ct', '--max-parents=0', 'HEAD'], opts);
  if (!r) return null;
  const stamps = r.stdout.split('\n').map((l) => Number(l.trim())).filter((n) => Number.isFinite(n) && n > 0);
  if (!stamps.length) return null;
  const oldest = Math.min(...stamps) * 1000;
  return Math.floor((nowMs - oldest) / 86_400_000);
}

/** Unix ms of the last commit touching `path` (staleness), or `null`. */
export async function gitFileLastCommitMs(root: string, path: string, opts: { signal?: AbortSignal; timeoutMs?: number } = {}): Promise<number | null> {
  const r = await runGit(root, ['log', '-1', '--format=%ct', '--', path], opts);
  if (!r) return null;
  const n = Number(r.stdout.trim().split('\n')[0]);
  return Number.isFinite(n) && n > 0 ? n * 1000 : null;
}

/** Introduction age (days) of a specific line, via blame. `null` when unavailable. */
export async function gitBlameLineAgeDays(
  root: string,
  path: string,
  line: number,
  nowMs: number,
  opts: { signal?: AbortSignal; timeoutMs?: number } = {},
): Promise<number | null> {
  const r = await runGit(root, ['blame', '--porcelain', '-L', `${line},${line}`, '--', path], opts);
  if (!r) return null;
  const m = /^author-time (\d+)$/m.exec(r.stdout);
  if (!m) return null;
  return Math.floor((nowMs - Number(m[1]) * 1000) / 86_400_000);
}

/** Tracked file list (`git ls-files`) in canonical sorted order, or `null`. */
export async function gitTrackedFiles(root: string, opts: { signal?: AbortSignal; timeoutMs?: number } = {}): Promise<string[] | null> {
  const r = await runGit(root, ['ls-files'], opts);
  if (!r) return null;
  return r.stdout.split('\n').map((l) => l.trim()).filter(Boolean).sort();
}

/** Total commit count (bounded) — used with gitRepoAgeDays for ARCH-05 applicability. */
export async function gitCommitCount(root: string, opts: { signal?: AbortSignal; timeoutMs?: number } = {}): Promise<number | null> {
  const r = await runGit(root, ['rev-list', '--count', 'HEAD'], opts);
  if (!r) return null;
  const n = Number(r.stdout.trim());
  return Number.isFinite(n) ? n : null;
}

export type GitPatch = { patch: string; commits: number; truncated: boolean };

/** Bounded `git log -p --all` added-line patch for history scanning (SEC-02).
 * `null` when the target is not a git repo / history is unavailable. */
export async function gitLogPatch(
  root: string,
  opts: { maxCommits?: number; signal?: AbortSignal; timeoutMs?: number } = {},
): Promise<GitPatch | null> {
  const maxCommits = opts.maxCommits ?? 200;
  const r = await runGit(root, ['log', '-p', '--all', '--no-merges', `--max-count=${maxCommits}`, '--format=\u0001%H'], opts);
  if (!r) return null;
  const commits = (r.stdout.match(/^\u0001[0-9a-f]{4,40}$/gm) ?? []).length;
  return { patch: r.stdout, commits, truncated: commits >= maxCommits };
}
