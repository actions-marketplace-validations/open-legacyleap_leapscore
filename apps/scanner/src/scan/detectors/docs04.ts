import type { ScanContext, RawFact } from '../detector';
import { ghErrorKind, makeProvenance, toolVersion } from './common';

const CANDIDATES = ['CONTRIBUTING.md', 'CONTRIBUTING.adoc', 'docs/CONTRIBUTING.md', 'GETTING_STARTED.md', 'docs/GETTING_STARTED.md', 'DEVELOPMENT.md'];

export async function detectDocs04(ctx: ScanContext, signal: AbortSignal): Promise<RawFact> {
  const start = Date.now();
  if (signal.aborted) return { detectorId: 'DOCS-04', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: makeProvenance('onboarding-inventory', start), truncated: true, error: { kind: 'cap', detail: 'aborted' } };
  try {
    const docsPresent: string[] = [];
    for (const p of CANDIDATES) {
      const buf = await ctx.readFile(p);
      if (buf) docsPresent.push(p);
      if (signal.aborted) break;
    }
    const readme = await ctx.readFile('README.md');
    if (readme && readme.toString().toLowerCase().includes('setup')) docsPresent.push('README.md#setup');
    const facts = { docs04: { docs_present: docsPresent, stages_covered: docsPresent.length ? ['setup'] : [], stages_missing: docsPresent.length ? ['deploy'] : ['setup','run','test'], undefined_commands: [], last_verified_days: docsPresent.length ? 300 : 9999 } };
    return { detectorId: 'DOCS-04', schemaVersion: '1.0.0', facts: facts as unknown as Record<string, unknown>, evidencePointers: [{ detail: docsPresent.length ? docsPresent.join(', ') : 'no onboarding docs' }], provenance: { tool: 'onboarding-inventory', version: toolVersion('onboarding-inventory'), flags: ['onboarding-inventory'], durationMs: Date.now() - start }, truncated: false };
  } catch (e) { return { detectorId: 'DOCS-04', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: makeProvenance('onboarding-inventory', start), truncated: true, error: ghErrorKind(e) }; }
}
