import type { ScanContext, RawFact } from '../detector';
import { ghErrorKind, makeProvenance } from './common';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

export async function detectDocs09(ctx: ScanContext, signal: AbortSignal): Promise<RawFact> {
  const start = Date.now();
  if (signal.aborted) return { detectorId: 'DOCS-09', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: makeProvenance('docs-ci-inventory', start), truncated: true, error: { kind: 'cap', detail: 'aborted' } };
  try {
    const cacheKey = 'docs09:workflows';
    let workflowContents: string[] = ctx.cache.get(cacheKey) as string[] | undefined ?? [];
    if (workflowContents.length === 0) {
      try {
        const wfDir = join(ctx.clonePath, '.github/workflows');
        const files = await readdir(wfDir);
        for (const f of files.filter(x=> x.endsWith('.yml')||x.endsWith('.yaml'))) {
          const buf = await ctx.readFile(`.github/workflows/${f}`);
          if (buf) workflowContents.push(buf.toString());
          ctx.cache.set(cacheKey, workflowContents);
        }
      } catch {}
    }
    const haystack = workflowContents.join('\n').toLowerCase();
    const hasBuild = /docs.*build|build.*docs|mkdocs|docusaurus/.test(haystack);
    const hasLinkChecker = /link.*check|lychee|markdown.*link/.test(haystack);
    const hasApiGen = /openapi.*gen|swagger.*gen|redoc/.test(haystack);
    const hasStalenessGate = /stale.*doc|doc.*stale|vale/.test(haystack);
    const steps: Array<Record<string,unknown>> = [];
    if (hasBuild) steps.push({ kind: 'build', tool: 'mkdocs', blocking: false });
    if (hasLinkChecker) steps.push({ kind: 'link-check', tool: 'lychee', blocking: false });
    const facts = { docs09: { doc_ci_steps: steps, link_checker: hasLinkChecker, api_gen_wired: hasApiGen, staleness_gate: hasStalenessGate } };
    return { detectorId: 'DOCS-09', schemaVersion: '1.0.0', facts: facts as unknown as Record<string, unknown>, evidencePointers: [{ detail: steps.length ? `${steps.length} docs CI steps` : 'no docs CI', file: '.github/workflows' }], provenance: { tool: 'docs-ci-inventory', version: '1', flags: ['docs-ci-inventory'], durationMs: Date.now() - start }, truncated: false };
  } catch (e) { return { detectorId: 'DOCS-09', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: makeProvenance('docs-ci-inventory', start), truncated: true, error: ghErrorKind(e) }; }
}
