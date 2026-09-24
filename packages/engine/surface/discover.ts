/** packages/engine/surface/discover.ts — label-scoped discovery map (plan 15 §7) */
import { parseToken } from './identity';
import type { SurfaceRestClient, TrackedIssue } from './rest';

export type DiscoveredIssue = TrackedIssue & { indicator: string };

export type DiscoveryResult = {
  /** indicator → issue; first-match wins, duplicates recorded in warnings. */
  map: Map<string, DiscoveredIssue>;
  warnings: string[];
};

/**
 * Build the dedup map for one target: paginated label listing (`leapscore` +
 * `leapscore:target-<slug>`, state=all), token parse per body, token `target=`
 * authoritative over the label prefilter. Tokenless issues are ignored.
 */
export async function buildDiscoveryMap(
  client: SurfaceRestClient,
  owner: string,
  repo: string,
  slug: string,
  target: string,
): Promise<DiscoveryResult> {
  const labels = ['leapscore', `leapscore:target-${slug}`];
  const map = new Map<string, DiscoveredIssue>();
  const warnings: string[] = [];
  let page = 1;
  for (;;) {
    const issues = await client.listIssues(owner, repo, labels, page);
    for (const issue of issues) {
      const token = parseToken(issue.body);
      if (!token) continue;
      if (token.target !== target) continue;
      const existing = map.get(token.indicator);
      if (existing) {
        warnings.push(
          `duplicate token ${token.indicator} for ${target}: #${existing.number} wins, #${issue.number} ignored`,
        );
        continue;
      }
      map.set(token.indicator, { ...issue, indicator: token.indicator });
    }
    if (issues.length < 100) break;
    page += 1;
  }
  return { map, warnings };
}
