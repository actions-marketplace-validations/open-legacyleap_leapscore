/** One-off dogfood for legacy-stacks 5.1: skip-dir effect on the leapscore repo. */
import { walkSortedTree } from '../../apps/scanner/src/scan/tree';
import { readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const NEW_DIRS = ['obj', 'target', '.gradle', '.vs', '__history', '__recovery'];

async function countFiles(dir: string): Promise<number> {
  let n = 0;
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return 0;
  }
  for (const e of entries) {
    if (e.isDirectory()) n += await countFiles(join(dir, e.name));
    else if (e.isFile()) n++;
  }
  return n;
}

main();
async function main() {
  const walkResult = await walkSortedTree(ROOT);
  const perDir: Record<string, number> = {};
  let skippedTotal = 0;
  for (const d of NEW_DIRS) {
    const n = await countFiles(join(ROOT, d));
    perDir[d] = n;
    skippedTotal += n;
  }
  console.log(JSON.stringify({
    repo: relative(process.cwd(), ROOT) || '.',
    afterFileCount: walkResult.fileCount,
    afterPathEntries: walkResult.paths.length,
    newlySkippedDirs: perDir,
    newlySkippedFiles: skippedTotal,
    beforeFileCount: walkResult.fileCount + skippedTotal,
  }, null, 2));
  return walkResult;
}
