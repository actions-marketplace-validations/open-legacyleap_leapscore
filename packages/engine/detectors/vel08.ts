import type { Phase1ScanContext, RawFact } from '../detector';
import { ghErrorKind, makeProvenance } from './common';
import { GhRateLimitError } from '../gh';

function hasPattern(text: string, re: RegExp): boolean { return re.test(text); }

export async function detectVel08(ctx: Phase1ScanContext): Promise<RawFact> {
  const start = Date.now();
  const { owner, repo, gh, signal } = ctx;
  if (signal.aborted) {
    return { detectorId: 'VEL-08', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: makeProvenance('/repos/{o}/{r}/contents/.github/workflows', 0), truncated: true, error: { kind: 'cap', detail: 'aborted' } };
  }
  try {
    // List workflow files
    let files: Array<{ name: string; download_url: string | null; type: string }> = [];
    try {
      const listing = (await gh.request(`/repos/${owner}/${repo}/contents/.github/workflows`, undefined, { signal })) as unknown;
      if (Array.isArray(listing)) files = listing as typeof files;
      else if (listing && typeof listing === 'object' && 'message' in (listing as Record<string, unknown>)) files = [];
    } catch (e) {
      // 404 means no workflows
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('404')) files = [];
      else throw e;
    }
    let combined = '';
    const pointers: Array<{ endpoint: string; detail: string }> = [];
    for (const f of files.slice(0, 5)) {
      if (f.type !== 'file' || !f.name.endsWith('.yml') && !f.name.endsWith('.yaml')) continue;
      try {
        const c = (await gh.request(`/repos/${owner}/${repo}/contents/.github/workflows/${f.name}`, undefined, { signal })) as { content?: string; encoding?: string };
        if (c.content && c.encoding === 'base64') {
          const text = Buffer.from(c.content, 'base64').toString('utf-8');
          combined += '\n' + text;
          pointers.push({ endpoint: `/repos/${owner}/${repo}/contents/.github/workflows/${f.name}`, detail: f.name });
        }
      } catch {
        // ignore per-file failures
      }
    }
    const hasBuild = hasPattern(combined, /build/i);
    const hasDeploy = hasPattern(combined, /deploy/i);
    const hasEnv = hasPattern(combined, /environment:/i);
    const hasRegistry = hasPattern(combined, /registry|docker.*push|ghcr|ecr/i);
    const hasRollback = hasPattern(combined, /rollback/i);
    const cd_chain = { build: hasBuild, registry_push: hasRegistry, deploy_job: hasDeploy && hasEnv };
    const facts = { cd_chain, release_automation: { tool: null }, rollback_target: hasRollback, manual_procedure_steps_est: hasDeploy ? 1 : 4, prod_direct_edit_smells: [] };
    return {
      detectorId: 'VEL-08',
      schemaVersion: '1.0.0',
      facts: { vel08: facts } as unknown as Record<string, unknown>,
      evidencePointers: pointers.length ? pointers : [{ endpoint: `/repos/${owner}/${repo}/contents/.github/workflows`, detail: files.length ? `${files.length} files` : 'no workflows' }],
      provenance: makeProvenance(`/repos/${owner}/${repo}/contents/.github/workflows`, start),
      truncated: false,
    };
  } catch (e) {
    if (e instanceof GhRateLimitError) {
      return { detectorId: 'VEL-08', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: makeProvenance(`/repos/${owner}/${repo}/contents/.github/workflows`, start), truncated: true, error: { kind: 'rate-limit', detail: (e as Error).message.slice(0, 300) } };
    }
    const err = ghErrorKind(e);
    return { detectorId: 'VEL-08', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: makeProvenance(`/repos/${owner}/${repo}/contents/.github/workflows`, start), truncated: true, error: err };
  }
}
