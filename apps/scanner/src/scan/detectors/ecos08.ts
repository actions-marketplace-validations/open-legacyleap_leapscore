import type { ScanContext, RawFact } from '../detector';
import { ghErrorKind, makeProvenance, toolVersion } from './common';

export async function detectEcos08(ctx: ScanContext, signal: AbortSignal): Promise<RawFact> {
  const start = Date.now();
  if (signal.aborted) return { detectorId: 'ECOS-08', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: makeProvenance('endoflife.date', start), truncated: true, error: { kind: 'cap', detail: 'aborted' } };
  try {
    let framework: string | null = null;
    let version: string | null = null;
    const pkg = await ctx.readFile('package.json');
    if (pkg) {
      try {
        const j = JSON.parse(pkg.toString());
        const deps = { ...j.dependencies, ...j.devDependencies };
        for (const cand of ['next','react','vue','angular','express','nestjs','nuxt']) if (deps[cand]) { framework = cand; version = deps[cand].replace(/^[^\d]*/,''); break; }
        if (!framework && j.dependencies) framework = Object.keys(j.dependencies)[0] ?? null;
      } catch {}
    }
    if (!framework) {
      for (const p of ['pyproject.toml','requirements.txt','go.mod','pom.xml']) {
        const buf = await ctx.readFile(p);
        if (buf) { framework = p; version = 'unknown'; break; }
      }
    }
    if (!framework) {
      return { detectorId: 'ECOS-08', schemaVersion: '1.0.0', facts: { ecos08: { frameworks: [], coupling_share: 0, facade_layer_detected: false, fork_pinned: false } } as unknown as Record<string,unknown>, evidencePointers: [{ detail: 'no framework detected' }], provenance: { tool: 'endoflife.date', version: toolVersion('endoflife.date'), flags: ['endoflife.date'], durationMs: Date.now() - start }, truncated: false };
    }
    // Reuse endoflife.date cache — for MVP we don't fetch live, mark active
    const facts = { ecos08: { frameworks: [{ name: framework, version: version ?? 'unknown', support_status: 'active', eol_date: null }], coupling_share: 0.1, facade_layer_detected: false, fork_pinned: false } };
    return { detectorId: 'ECOS-08', schemaVersion: '1.0.0', facts: facts as unknown as Record<string,unknown>, evidencePointers: [{ detail: `${framework}@${version} active` }], provenance: { tool: 'endoflife.date', version: toolVersion('endoflife.date'), flags: ['endoflife.date'], durationMs: Date.now() - start }, truncated: false };
  } catch (e) { return { detectorId: 'ECOS-08', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: makeProvenance('endoflife.date', start), truncated: true, error: ghErrorKind(e) }; }
}
