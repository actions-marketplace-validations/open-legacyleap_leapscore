import type { Phase1ScanContext, RawFact } from '../detector';
import { ghErrorKind, makeProvenance } from './common';
import { GhRateLimitError } from '../gh';

export async function detectVel06(ctx: Phase1ScanContext): Promise<RawFact> {
  const start = Date.now();
  const { owner, repo, gh, signal } = ctx;
  if (signal.aborted) {
    return { detectorId: 'VEL-06', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: makeProvenance('/repos/{o}/{r}/commits', 0), truncated: true, error: { kind: 'cap', detail: signal.reason ? String(signal.reason) : 'aborted' } };
  }
  try {
    // Fetch last 200 commits (single page per_page=100 x2 if available; we fetch 100 for Phase1 speed)
    const commits = (await gh.request(`/repos/${owner}/${repo}/commits`, { per_page: '100' }, { signal })) as Array<{ author?: { login?: string } | null; commit?: { author?: { name?: string } } }>;
    const arr = Array.isArray(commits) ? commits : [];
    const counts = new Map<string, number>();
    for (const c of arr) {
      const author = c.author?.login ?? c.commit?.author?.name ?? 'unknown';
      counts.set(author, (counts.get(author) ?? 0) + 1);
    }
    const total = arr.length;
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    let cum = 0;
    let busFactor = sorted.length;
    for (let i = 0; i < sorted.length; i++) {
      cum += sorted[i][1];
      if (cum / Math.max(1, total) >= 0.8) { busFactor = i + 1; break; }
    }
    const top = sorted[0];
    const worst = { path: 'repo', bus_factor: busFactor, top_author_share: total ? (top?.[1] ?? 0) / total : 0 };
    const facts = { bus_factor_repo: busFactor, committers: sorted.length, top_author: top?.[0] ?? 'unknown', top_author_share: worst.top_author_share, worst_modules: [worst], window_days: 365 };
    return {
      detectorId: 'VEL-06',
      schemaVersion: '1.0.0',
      facts: { vel06: facts } as unknown as Record<string, unknown>,
      evidencePointers: [{ endpoint: `/repos/${owner}/${repo}/commits`, detail: `sampled ${total} commits, ${sorted.length} committers` }],
      provenance: makeProvenance(`/repos/${owner}/${repo}/commits`, start),
      truncated: false,
    };
  } catch (e) {
    if (e instanceof GhRateLimitError) {
      return { detectorId: 'VEL-06', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: makeProvenance(`/repos/${owner}/${repo}/commits`, start), truncated: true, error: { kind: 'rate-limit', detail: (e as Error).message.slice(0, 300) } };
    }
    const err = ghErrorKind(e);
    return { detectorId: 'VEL-06', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: makeProvenance(`/repos/${owner}/${repo}/commits`, start), truncated: true, error: err };
  }
}
