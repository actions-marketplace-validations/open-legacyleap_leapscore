/** packages/engine/ingest.ts — GitHub URL ingestion and validation (spec: GitHub URL ingestion) */
import { GhRateLimitError } from './gh';
import type { RateLimitedGhClient } from './detector';

export type IngestResult =
  | { ok: true; owner: string; repo: string; normalized: string }
  | { ok: false; reason: 'unsupported_host' | 'invalid_url' | 'not_found' | 'private_requires_app'; detail: string };

const GITHUB_HOSTS = new Set(['github.com', 'www.github.com']);

export function normalizeRepoUrl(raw: string): { owner: string; repo: string } | null {
  if (!raw || typeof raw !== 'string') return null;
  let url: URL;
  try {
    const withProto = raw.match(/^https?:\/\//) ? raw : `https://${raw}`;
    url = new URL(withProto);
  } catch {
    return null;
  }
  if (!GITHUB_HOSTS.has(url.hostname.toLowerCase())) return null;
  const parts = url.pathname.split('/').filter(Boolean);
  if (parts.length < 2) return null;
  let [owner, repo] = parts;
  if (!owner || !repo) return null;
  repo = repo.replace(/\.git$/, '');
  if (!/^[\w.-]+$/.test(owner) || !/^[\w.-]+$/.test(repo)) return null;
  return { owner, repo };
}

export async function ingestRepoUrl(
  raw: string,
  gh: RateLimitedGhClient,
  opts: { signal?: AbortSignal } = {},
): Promise<IngestResult> {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, reason: 'invalid_url', detail: 'empty url' };
  // Host check before any network call
  let parsed: { owner: string; repo: string } | null = null;
  try {
    // Allow github.com/{o}/{r} + tails (.git, trailing slash, tree/{ref})
    parsed = normalizeRepoUrl(trimmed);
  } catch {}
  if (!parsed) {
    const maybeUrl = (() => {
      try { return new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`); } catch { return null; }
    })();
    if (maybeUrl && !GITHUB_HOSTS.has(maybeUrl.hostname.toLowerCase())) {
      return { ok: false, reason: 'unsupported_host', detail: `host ${maybeUrl.hostname} not supported` };
    }
    return { ok: false, reason: 'invalid_url', detail: `cannot parse github url: ${trimmed.slice(0, 80)}` };
  }
  const { owner, repo } = parsed;
  const normalized = `${owner}/${repo}`;
  // Existence / visibility check: GET /repos/{o}/{r}
  try {
    const data = await gh.request(`/repos/${owner}/${repo}`, undefined, { signal: opts.signal });
    // If GH returns a repo object with private:true -> treat as private_requires_app
    if (data && typeof data === 'object' && (data as Record<string, unknown>).private === true) {
      // For now, public freemium only: private repos require App flow (08)
      // We still return not ok so caller can surface correct reason.
      return { ok: false, reason: 'private_requires_app', detail: `${normalized} is private` };
    }
    return { ok: true, owner, repo, normalized };
  } catch (e) {
    if (e instanceof GhRateLimitError) {
      // Rate limit on ingest is not a not_found — propagate as crash so orchestrator can degrade
      throw e;
    }
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes(' 404 ') || msg.includes('"message":"Not Found"') || msg.includes('404')) {
      return { ok: false, reason: 'not_found', detail: `${normalized} not found` };
    }
    if (msg.includes(' 403 ') && msg.includes('private')) {
      return { ok: false, reason: 'private_requires_app', detail: `${normalized} requires auth` };
    }
    if (msg.includes('Aborted') || msg.includes('AbortError')) throw e;
    // Other GH errors -> treat as not_found for now
    if (msg.startsWith('GH ')) return { ok: false, reason: 'not_found', detail: msg.slice(0, 120) };
    throw e;
  }
}
