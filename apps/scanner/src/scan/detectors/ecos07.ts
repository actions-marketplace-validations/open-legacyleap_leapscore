import type { ScanContext, RawFact } from '../detector';
import { ghErrorKind, filePointer, basisPointer, measuredFact, unknownFact } from './common';
import { scanDependencies, uniqueDirect, pinRatio } from '../deps';
import { isGitRepo, gitFileLastCommitMs } from '../git';
import { cachedWorkflows } from '../sourcefiles';

const WHAT_IT_TAKES =
  'enumerate lockfiles and manifests so lockfile presence, pin ratio and CI install immutability are decidable — the release cannot decide a tree with no manifest at all';

const IMMUTABLE = [
  { re: /\bnpm\s+ci\b/, label: 'npm ci' },
  { re: /\byarn\s+install\b[^\n]*--(frozen-lockfile|immutable)\b|--immutable\b/, label: 'yarn --immutable' },
  { re: /\bpnpm\s+(install|i)\b[^\n]*--frozen-lockfile\b/, label: 'pnpm --frozen-lockfile' },
  { re: /\bpip\s+install\b[^\n]*--require-hashes\b/, label: 'pip --require-hashes' },
  { re: /\bgo\s+mod\s+download\b/, label: 'go mod download' },
];
const MUTABLE = [
  { re: /\bnpm\s+install\b/, label: 'npm install' },
  { re: /\byarn\s+install\b/, label: 'yarn install' },
  { re: /\bpnpm\s+(install|i)\b/, label: 'pnpm install' },
  { re: /\bpip\s+install\b/, label: 'pip install' },
];

/**
 * ECOS-07 — build reproducibility / lockfile integrity (detector-honesty 2.3;
 * spec ecos-07). Lockfile presence, integrity hashes, pin ratio and CI install
 * immutability are parsed facts; staleness is a git-history read when history
 * is available (dropped, with a note, otherwise). No manifest → `unknown`.
 */
export async function detectEcos07(ctx: ScanContext, signal: AbortSignal): Promise<RawFact> {
  const started = Date.now();
  try {
    if (signal.aborted) return unknownFact('ECOS-07', 'lockfile-parse', started, WHAT_IT_TAKES);
    const scan = await scanDependencies(ctx);
    if (scan.manifests === 0) {
      return unknownFact('ECOS-07', 'lockfile-parse', started, `${WHAT_IT_TAKES}; no manifest found (na_when clause-b)`);
    }

    const git = await isGitRepo(ctx.clonePath, { signal });
    const lockfiles: Array<Record<string, unknown>> = [];
    for (const l of scan.lockfiles) {
      let stale = false;
      let stalenessChecked = false;
      if (git) {
        const manifestForRoot = ctx.manifests.find((m) => l.path.startsWith(`${m.root === '.' ? '' : m.root}/`) || m.root === '.');
        const lockMs = await gitFileLastCommitMs(ctx.clonePath, l.path, { signal });
        const manifestMs = manifestForRoot ? await gitFileLastCommitMs(ctx.clonePath, `${manifestForRoot.root === '.' ? '' : `${manifestForRoot.root}/`}${manifestForRoot.manifest}`, { signal }) : null;
        if (lockMs != null && manifestMs != null) { stalenessChecked = true; stale = lockMs < manifestMs; }
      }
      lockfiles.push({ path: l.path, ecosystem: l.ecosystem, stale, staleness_checked: stalenessChecked, integrity_hashes: l.integrity, packages: l.packages });
    }

    const { text: wfText, files: wfFiles } = await cachedWorkflows(ctx, signal);
    const immutableHit = IMMUTABLE.find((c) => c.re.test(wfText));
    const mutableSites = MUTABLE.filter((c) => c.re.test(wfText)).map((c) => c.label);
    const ciImmutable = { enforced: immutableHit != null, evidence: immutableHit ? `${immutableHit.label} in ${wfFiles[0] ?? '.github/workflows'}` : 'no immutable install command found in CI' };

    const direct = uniqueDirect(scan.direct);
    const facts = {
      ecos07: {
        lockfiles,
        pin_ratio: pinRatio(direct),
        ci_immutable_install: ciImmutable,
        mutable_install_sites: mutableSites,
        manifests_total: scan.manifests,
      },
    };
    const pointers = [
      ...lockfiles.slice(0, 4).map((l) => filePointer(String(l.path), `${l.integrity_hashes ? 'integrity hashes present' : 'no integrity hashes'}${l.stale ? '; lockfile older than manifest' : ''}`)),
      ...(git ? [basisPointer('git', 'lockfile staleness from git last-commit dates')] : [basisPointer('scan', 'no git history — staleness check dropped, presence facts stand')]),
    ];
    return measuredFact({
      detectorId: 'ECOS-07',
      producer: 'lockfile-parse',
      started,
      facts: facts as unknown as Record<string, unknown>,
      pointers,
      measurement: { status: 'measured', confidence: git ? 'medium' : 'low' },
    });
  } catch (e) {
    return { detectorId: 'ECOS-07', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: { tool: 'lockfile-parse', version: '1.0', flags: ['lockfile-parse'], durationMs: Date.now() - started }, truncated: true, error: ghErrorKind(e) };
  }
}
