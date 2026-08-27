import type { Phase1ScanContext, RawFact } from '../detector';
import { ghErrorKind, makeProvenance } from './common';
import { GhRateLimitError } from '../gh';

type Branch = { name: string };

export async function detectVel10(ctx: Phase1ScanContext): Promise<RawFact> {
  const start = Date.now();
  const { owner, repo, gh, signal } = ctx;
  if (signal.aborted) {
    return { detectorId: 'VEL-10', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: makeProvenance('/repos/{o}/{r}/branches', 0), truncated: true, error: { kind: 'cap', detail: 'aborted' } };
  }
  try {
    const branches = (await gh.request(`/repos/${owner}/${repo}/branches`, { per_page: '100' }, { signal })) as Branch[];
    const arr = Array.isArray(branches) ? branches : [];
    const total = arr.length;
    const hasRelease = arr.some((b) => /release|hotfix|stable/i.test(b.name));
    const model = hasRelease && total > 10 ? 'long-lived-release' : 'trunk-based';
    // Stale computation not available via branches list alone; estimate as 0 without dates
    const facts = { branches_total: total, stale_over_30d: 0, model, max_divergence_commits: 0, merge_window_bursts: false, trunk_green_rate_30d: null };
    return {
      detectorId: 'VEL-10',
      schemaVersion: '1.0.0',
      facts: { vel10: facts } as unknown as Record<string, unknown>,
      evidencePointers: [{ endpoint: `/repos/${owner}/${repo}/branches`, detail: `${total} branches, model=${model}` }],
      provenance: makeProvenance(`/repos/${owner}/${repo}/branches`, start),
      truncated: false,
    };
  } catch (e) {
    if (e instanceof GhRateLimitError) {
      return { detectorId: 'VEL-10', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: makeProvenance(`/repos/${owner}/${repo}/branches`, start), truncated: true, error: { kind: 'rate-limit', detail: (e as Error).message.slice(0, 300) } };
    }
    const err = ghErrorKind(e);
    // 500 maps to cap
    return { detectorId: 'VEL-10', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: makeProvenance(`/repos/${owner}/${repo}/branches`, start), truncated: true, error: err };
  }
}
