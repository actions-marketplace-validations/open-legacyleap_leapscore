/** apps/scanner/src/scan/stackcensus.ts — VB6/Delphi stack census
 * (legacy-stacks 1.2, design D2).
 *
 * VB6 and Delphi have no package manager: they are recognized as *stacks* from
 * project/source-file evidence over the canonical sorted walk, and the census is
 * a separate signal that MUST NOT be reported as a dependency manifest. Modelling
 * on `cachedSourceImports`, the census is memoised per scan so pins (ECOS-01),
 * plane evidence and disclosures share one traversal.
 */
import { walkSortedTree } from './tree';
import type { ScanContext } from './detector';

export type StackCensusEntry = {
  id: 'vb6' | 'delphi';
  detected: boolean;
  /** Project-level evidence files (`.vbp`; `.dpr`/`.dproj`/`.dof`). */
  project_files: string[];
  /** Bounded evidence-path sample in canonical order. */
  evidence: string[];
  /** Total matched files of the stack's extensions. */
  file_count: number;
};

export type StackCensus = {
  vb6: StackCensusEntry;
  delphi: StackCensusEntry;
  /** True when the walk itself could not complete over the tree. */
  truncated: boolean;
};

const MAX_EVIDENCE_PATHS = 20;

const VB6_EXTS = new Set(['.vbp', '.frm', '.bas', '.cls', '.ctl']);
const DELPHI_EXTS = new Set(['.dpr', '.pas', '.dfm', '.dproj', '.dof']);
const VB6_PROJECT = /\.vbp$/i;
const DELPHI_PROJECT = /\.(dpr|dproj|dof)$/i;

function extOf(path: string): string {
  const base = path.slice(path.lastIndexOf('/') + 1);
  const dot = base.lastIndexOf('.');
  return dot < 0 ? '' : base.slice(dot).toLowerCase();
}

function emptyEntry(id: 'vb6' | 'delphi'): StackCensusEntry {
  return { id, detected: false, project_files: [], evidence: [], file_count: 0 };
}

/** Census over the canonical sorted walk: deterministic, read-free (paths only).
 *
 * `opts.paths` lets a caller that already walked the tree hand its list in, so a
 * scan that derives identity reuses one traversal instead of adding another
 * (report-identity design D9). Detectors keep calling without it — their read
 * accounting is unchanged. */
export async function scanStackCensus(
  ctx: Pick<ScanContext, 'clonePath'>,
  signal?: AbortSignal,
  opts: { paths?: readonly string[] } = {},
): Promise<StackCensus> {
  let paths: string[] = [];
  let truncated = false;
  if (opts.paths) {
    paths = opts.paths.filter((p) => !p.endsWith('/'));
  } else {
    try {
      const walk = await walkSortedTree(ctx.clonePath);
      paths = walk.paths.filter((p) => !p.endsWith('/'));
    } catch {
      truncated = true;
    }
  }
  if (signal?.aborted) truncated = true;
  paths.sort();

  const vb6 = emptyEntry('vb6');
  const delphi = emptyEntry('delphi');
  for (const path of paths) {
    const ext = extOf(path);
    const entry = VB6_EXTS.has(ext) ? vb6 : DELPHI_EXTS.has(ext) ? delphi : null;
    if (!entry) continue;
    entry.file_count++;
    if (entry.evidence.length < MAX_EVIDENCE_PATHS) entry.evidence.push(path);
    if (VB6_PROJECT.test(path) || (entry === delphi && DELPHI_PROJECT.test(path))) entry.project_files.push(path);
  }
  vb6.detected = vb6.file_count > 0;
  delphi.detected = delphi.file_count > 0;
  return { vb6, delphi, truncated };
}

const STACK_CENSUS_CACHE_KEY = 'stackcensus:census';

/** Memoized census shared by ECOS-01 pins, plane evidence and disclosures. */
export async function cachedStackCensus(
  ctx: ScanContext,
  signal?: AbortSignal,
  opts: { paths?: readonly string[] } = {},
): Promise<StackCensus> {
  const cached = ctx.cache.get(STACK_CENSUS_CACHE_KEY);
  if (cached) return cached as StackCensus;
  const census = await scanStackCensus(ctx, signal, opts);
  ctx.cache.set(STACK_CENSUS_CACHE_KEY, census);
  return census;
}
