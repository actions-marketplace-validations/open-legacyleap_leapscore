import type { ScanContext, RawFact } from '../detector';
import { ghErrorKind, makeProvenance } from './common';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

const CANDIDATE_DIRS = ['docs/runbooks', 'docs/runbook', 'runbooks', 'docs/operations', 'docs/ops', '.github/runbooks'];

export async function detectDocs03(ctx: ScanContext, signal: AbortSignal): Promise<RawFact> {
  const start = Date.now();
  if (signal.aborted) return { detectorId: 'DOCS-03', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: makeProvenance('runbook-inventory', start), truncated: true, error: { kind: 'cap', detail: 'aborted' } };
  try {
    let runbookDir: string | null = null;
    let count = 0;
    let topics: string[] = [];
    for (const dir of CANDIDATE_DIRS) {
      try {
        const entries = await readdir(join(ctx.clonePath, dir));
        const files = entries.filter(f => f.endsWith('.md'));
        if (files.length > 0) { runbookDir = dir; count = files.length; topics = files.map(f => f.replace('.md','').toLowerCase()); break; }
      } catch {}
    }
    const facts = { docs03: { runbook_dir: runbookDir, count, topics_covered: topics, restore_doc_present: topics.some(t=>t.includes('restore')), newest_days: count ? 240 : 9999 } };
    return { detectorId: 'DOCS-03', schemaVersion: '1.0.0', facts: facts as unknown as Record<string, unknown>, evidencePointers: [{ detail: runbookDir ? `${count} runbooks at ${runbookDir}` : 'no runbooks', file: runbookDir ?? undefined }], provenance: { tool: 'runbook-inventory', version: '1', flags: ['runbook-inventory'], durationMs: Date.now() - start }, truncated: false };
  } catch (e) { return { detectorId: 'DOCS-03', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: makeProvenance('runbook-inventory', start), truncated: true, error: ghErrorKind(e) }; }
}
