import type { ScanContext, RawFact } from '../detector';
import { ghErrorKind, basisPointer, filePointer, measuredFact, unknownFact } from './common';
import { isGitRepo, gitChurn, gitRepoAgeDays, gitCommitCount } from '../git';

const MIN_COMMITS = 200;
const MIN_AGE_DAYS = 180;
const WINDOW_DAYS = 365;
const MAX_HOTSPOTS = 10;

const NON_CORE = /(^|\/)(tests?|spec|docs?|examples?|fixtures?|e2e|mocks?)(\/|$)/i;

/**
 * ARCH-05 — code churn vs. defect hot spots, measured from `git log --name-only`
 * with a bugfix-subject proxy (detector-honesty 2.1; spec arch-05 §2/§4/§5).
 * Non-git targets and thin history (<200 commits or <6 months) are `unknown`,
 * never N/A — history exists or it does not (spec na_when: never).
 */
export async function detectArch05(ctx: ScanContext, signal: AbortSignal): Promise<RawFact> {
  const started = Date.now();
  const nowMs = ctx.scanMs ?? Date.now();
  const whatItTakes = 'run a git hot-spot analysis over ≥200 commits and ≥6 months of history (git log --name-only + bugfix subject correlation)';
  try {
    if (signal.aborted) return unknownFact('ARCH-05', 'git', started, whatItTakes);
    if (!(await isGitRepo(ctx.clonePath, { signal }))) {
      return unknownFact('ARCH-05', 'git', started, `${whatItTakes}; the target is not a git work tree so no history exists`);
    }
    const [commits, ageDays] = await Promise.all([
      gitCommitCount(ctx.clonePath, { signal }),
      gitRepoAgeDays(ctx.clonePath, nowMs, { signal }),
    ]);
    if (commits == null || ageDays == null) return unknownFact('ARCH-05', 'git', started, whatItTakes);
    if (commits < MIN_COMMITS || ageDays < MIN_AGE_DAYS) {
      return unknownFact('ARCH-05', 'git', started,
        `history too thin: ${commits} commits / ${ageDays}d (< ${MIN_COMMITS} commits or < ${MIN_AGE_DAYS}d) — ${whatItTakes}`);
    }
    const churn = await gitChurn(ctx.clonePath, { sinceDays: WINDOW_DAYS, signal, nowMs });
    if (!churn || churn.commitsAnalyzed === 0) return unknownFact('ARCH-05', 'git', started, whatItTakes);

    const entries = [...churn.fileCommits.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    const totalTouch = entries.reduce((a, [, n]) => a + n, 0);
    const decile = Math.max(1, Math.ceil(entries.length / 10));
    const topFiles = entries.slice(0, decile);
    const topShare = totalTouch ? Math.round((topFiles.reduce((a, [, n]) => a + n, 0) / totalTouch) * 1000) / 1000 : 0;
    const churnRank = new Map(entries.map(([f], i) => [f, i + 1]));

    const bugEntries = [...churn.fileBugfixCommits.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    const bugDecile = Math.max(1, Math.ceil(entries.length / 10));
    const bugTop = new Set(bugEntries.slice(0, bugDecile).map(([f]) => f));
    const defectRank = new Map(bugEntries.map(([f], i) => [f, i + 1]));

    const hotspots = topFiles
      .filter(([f]) => bugTop.has(f))
      .map(([f]) => ({ file: f, churn_rank: churnRank.get(f)!, defect_rank: defectRank.get(f) ?? 0, in_core_path: !NON_CORE.test(f) }))
      .slice(0, MAX_HOTSPOTS);

    const facts = {
      arch05: {
        commits_analyzed: churn.commitsAnalyzed,
        window_days: churn.windowDays,
        churn_top10_share: topShare,
        hotspots,
        history_truncated: churn.historyTruncated,
      },
    };
    const pointers = [
      basisPointer('git', `git log --since=${churn.sinceIso} --name-only: ${churn.commitsAnalyzed} commits/${churn.windowDays}d; top10% absorb ${Math.round(topShare * 100)}% of churn${churn.historyTruncated ? ' (history truncated)' : ''}`),
      ...hotspots.slice(0, 5).map((h) => filePointer(h.file, `churn_rank ${h.churn_rank}, defect_rank ${h.defect_rank}`)),
    ];
    return measuredFact({
      detectorId: 'ARCH-05',
      producer: 'git',
      started,
      facts: facts as unknown as Record<string, unknown>,
      pointers,
      measurement: churn.historyTruncated ? { status: 'estimated', confidence: 'low', scopeLimited: true } : { status: 'measured', confidence: 'medium' },
      truncated: churn.historyTruncated,
    });
  } catch (e) {
    return { detectorId: 'ARCH-05', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: { tool: 'git', version: '1.1', flags: ['git'], durationMs: Date.now() - started }, truncated: true, error: ghErrorKind(e) };
  }
}
