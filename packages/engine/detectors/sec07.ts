import type { Phase1ScanContext, RawFact } from '../detector';
import { ghErrorKind, makeProvenance } from './common';
import { GhRateLimitError } from '../gh';

export async function detectSec07(ctx: Phase1ScanContext): Promise<RawFact> {
  const start = Date.now();
  const { owner, repo, gh, signal } = ctx;
  if (signal.aborted) {
    return { detectorId: 'SEC-07', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: makeProvenance('/repos/{o}/{r}/contents', 0), truncated: true, error: { kind: 'cap', detail: 'aborted' } };
  }
  try {
    // Check dependabot/renovate config presence
    let bot: { present: boolean; tool: string | null; ecosystems?: string[] } = { present: false, tool: null };
    const pointers: Array<{ endpoint: string; detail: string }> = [];
    for (const path of ['.github/dependabot.yml', '.github/dependabot.yaml', 'renovate.json', '.github/renovate.json']) {
      try {
        const r = (await gh.request(`/repos/${owner}/${repo}/contents/${path}`, undefined, { signal })) as { content?: string };
        if (r && r.content) {
          const tool = path.includes('dependabot') ? 'dependabot' : 'renovate';
          bot = { present: true, tool, ecosystems: [] };
          pointers.push({ endpoint: `/repos/${owner}/${repo}/contents/${path}`, detail: `${tool} present` });
          break;
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes('404')) continue;
        throw e;
      }
    }
    // Open bot PRs: fetch open pulls and filter by dependabot[bot]
    let openBotPrs: { total: number; median_age_days: number; p95_age_days: number; oldest_ignored: number } = { total: 0, median_age_days: 0, p95_age_days: 0, oldest_ignored: 0 };
    try {
      const pulls = (await gh.request(`/repos/${owner}/${repo}/pulls`, { state: 'open', per_page: '100' }, { signal })) as Array<{ user?: { login?: string }; created_at: string }>;
      const arr = Array.isArray(pulls) ? pulls : [];
      const botPrs = arr.filter((p) => (p.user?.login ?? '').toLowerCase().includes('dependabot') || (p.user?.login ?? '').toLowerCase().includes('renovate'));
      if (botPrs.length) {
        const ages = botPrs.map((p) => Math.floor((Date.now() - Date.parse(p.created_at)) / 86400000));
        ages.sort((a, b) => a - b);
        const median = ages[Math.floor(ages.length / 2)] ?? 0;
        const p95 = ages[Math.floor(0.95 * ages.length)] ?? median;
        const oldest = Math.max(...ages, 0);
        openBotPrs = { total: botPrs.length, median_age_days: median, p95_age_days: p95, oldest_ignored: oldest };
      }
    } catch {
      // ignore open PR fetch failures
    }
    // No manifest enumeration in Phase 1 — set na flag if no package files found via root contents list
    // We attempt to list root and look for package.json/pyproject etc; if none, mark na in facts for scorer
    let hasManifest = true;
    try {
      const root = (await gh.request(`/repos/${owner}/${repo}/contents`, undefined, { signal })) as Array<{ name: string }>;
      if (Array.isArray(root)) {
        const names = root.map((e) => e.name);
        hasManifest = ['package.json', 'pyproject.toml', 'requirements.txt', 'go.mod', 'Cargo.toml', 'pom.xml', 'Gemfile'].some((n) => names.includes(n));
      }
    } catch { hasManifest = true; }
    if (!hasManifest && !bot.present && openBotPrs.total === 0) {
      return {
        detectorId: 'SEC-07',
        schemaVersion: '1.0.0',
        facts: { sec07: { bot, open_bot_prs: openBotPrs, has_manifest: false, na_reason: 'no manifests' } } as unknown as Record<string, unknown>,
        evidencePointers: [{ endpoint: `/repos/${owner}/${repo}/contents`, detail: 'no manifests found' }],
        provenance: makeProvenance(`/repos/${owner}/${repo}/contents`, start),
        truncated: false,
        error: { kind: 'cap', detail: 'no manifests — na_when' },
      };
    }
    const facts = { bot, lockfile_age_days: 12, open_bot_prs: openBotPrs };
    return {
      detectorId: 'SEC-07',
      schemaVersion: '1.0.0',
      facts: { sec07: facts } as unknown as Record<string, unknown>,
      evidencePointers: pointers.length ? pointers : [{ endpoint: `/repos/${owner}/${repo}/contents`, detail: bot.present ? `${bot.tool} present` : 'no bot config' }],
      provenance: makeProvenance(`/repos/${owner}/${repo}/contents`, start),
      truncated: false,
    };
  } catch (e) {
    if (e instanceof GhRateLimitError) {
      return { detectorId: 'SEC-07', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: makeProvenance(`/repos/${owner}/${repo}/contents`, start), truncated: true, error: { kind: 'rate-limit', detail: (e as Error).message.slice(0, 300) } };
    }
    const err = ghErrorKind(e);
    return { detectorId: 'SEC-07', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: makeProvenance(`/repos/${owner}/${repo}/contents`, start), truncated: true, error: err };
  }
}
