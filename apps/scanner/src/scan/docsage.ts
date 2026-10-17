/** apps/scanner/src/scan/docsage.ts — real age reads for doc-staleness residuals
 * (detector-honesty 2.5).
 *
 * DOCS-01/03/04 previously carried literal magnitudes (`newest_adr_days`,
 * `newest_days`, `last_verified_days`). The age now comes from the target: the
 * git last-commit date when history exists, else the file mtime. When no file can
 * be dated the caller omits the magnitude (never a placeholder).
 */
import { stat } from 'node:fs/promises';
import { join } from 'node:path';
import { isGitRepo, gitFileLastCommitMs } from './git';
import type { ScanContext } from './detector';

const DAY_MS = 86_400_000;

/** Whole days from `nowMs` to the newest of `files` (git commit date, else
 * mtime). `null` when no file could be dated. */
export async function newestFileAgeDays(
  ctx: ScanContext,
  files: string[],
  nowMs: number,
  signal?: AbortSignal,
): Promise<number | null> {
  if (files.length === 0) return null;
  const git = await isGitRepo(ctx.clonePath, { signal });
  let newest: number | null = null;
  for (const f of files.slice(0, 200)) {
    let ms: number | null = null;
    if (git) ms = await gitFileLastCommitMs(ctx.clonePath, f, { signal });
    if (ms == null) {
      try {
        ms = (await stat(join(ctx.clonePath, f))).mtimeMs;
      } catch {
        ms = null;
      }
    }
    if (ms != null && (newest == null || ms > newest)) newest = ms;
  }
  if (newest == null) return null;
  return Math.max(0, Math.floor((nowMs - newest) / DAY_MS));
}
