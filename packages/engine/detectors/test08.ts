import type { Phase1ScanContext, RawFact } from '../detector';
import { ghErrorKind, makeProvenance } from './common';
import { GhRateLimitError } from '../gh';

function has(text: string, re: RegExp): boolean { return re.test(text); }

export async function detectTest08(ctx: Phase1ScanContext): Promise<RawFact> {
  const start = Date.now();
  const { owner, repo, gh, signal } = ctx;
  if (signal.aborted) {
    return { detectorId: 'TEST-08', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: makeProvenance('/repos/{o}/{r}/contents/.github/workflows', 0), truncated: true, error: { kind: 'cap', detail: 'aborted' } };
  }
  try {
    let files: Array<{ name: string; type: string }> = [];
    try {
      const listing = (await gh.request(`/repos/${owner}/${repo}/contents/.github/workflows`, undefined, { signal })) as unknown;
      if (Array.isArray(listing)) files = listing as typeof files;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('404')) files = [];
      else throw e;
    }
    if (!files.length) {
      return {
        detectorId: 'TEST-08',
        schemaVersion: '1.0.0',
        facts: { test08: { ci_files: [], gates: { lint: { present: false, blocking: false }, sast: { present: false }, coverage_gate: { present: false, blocking: false }, typecheck: { present: false } }, advisory_only_sites: 0 } } as unknown as Record<string, unknown>,
        evidencePointers: [{ endpoint: `/repos/${owner}/${repo}/contents/.github/workflows`, detail: 'no workflows' }],
        provenance: makeProvenance(`/repos/${owner}/${repo}/contents/.github/workflows`, start),
        truncated: false,
      };
    }
    let combined = '';
    const pointers: Array<{ endpoint: string; detail: string }> = [];
    for (const f of files.slice(0, 5)) {
      if (f.type !== 'file') continue;
      if (!f.name.endsWith('.yml') && !f.name.endsWith('.yaml')) continue;
      try {
        const c = (await gh.request(`/repos/${owner}/${repo}/contents/.github/workflows/${f.name}`, undefined, { signal })) as { content?: string; encoding?: string };
        if (c.content && c.encoding === 'base64') {
          const text = Buffer.from(c.content, 'base64').toString('utf-8');
          combined += '\n' + text;
          pointers.push({ endpoint: `/repos/${owner}/${repo}/contents/.github/workflows/${f.name}`, detail: f.name });
        }
      } catch { /* ignore */ }
    }
    const ciFiles = files.filter((f) => f.type === 'file').map((f) => `.github/workflows/${f.name}`);
    const lint = has(combined, /lint|eslint|flake8|rubocop/i);
    const sast = has(combined, /sast|semgrep|codeql|sonar|security/i);
    const coverage = has(combined, /coverage|codecov|coveralls|fail_under|threshold/i);
    const typecheck = has(combined, /typecheck|mypy|pyright|tsc --noEmit|tsc/i);
    const advisory = has(combined, /continue-on-error:\s*true|\|\|\s*true/i) ? 1 : 0;
    const facts = { ci_files: ciFiles, gates: { lint: { present: lint, blocking: lint && advisory === 0 }, typecheck: { present: typecheck }, coverage_gate: { present: coverage, blocking: coverage && advisory === 0, threshold: coverage ? 70 : undefined }, sast: { present: sast } }, advisory_only_sites: advisory, branch_protection_known: false };
    return {
      detectorId: 'TEST-08',
      schemaVersion: '1.0.0',
      facts: { test08: facts } as unknown as Record<string, unknown>,
      evidencePointers: pointers.length ? pointers : [{ endpoint: `/repos/${owner}/${repo}/contents/.github/workflows`, detail: `${ciFiles.length} files` }],
      provenance: makeProvenance(`/repos/${owner}/${repo}/contents/.github/workflows`, start),
      truncated: false,
    };
  } catch (e) {
    if (e instanceof GhRateLimitError) {
      return { detectorId: 'TEST-08', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: makeProvenance(`/repos/${owner}/${repo}/contents/.github/workflows`, start), truncated: true, error: { kind: 'rate-limit', detail: (e as Error).message.slice(0, 300) } };
    }
    const err = ghErrorKind(e);
    return { detectorId: 'TEST-08', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: makeProvenance(`/repos/${owner}/${repo}/contents/.github/workflows`, start), truncated: true, error: err };
  }
}
