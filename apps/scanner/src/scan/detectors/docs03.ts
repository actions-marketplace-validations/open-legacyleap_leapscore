import type { ScanContext, RawFact } from '../detector';
import { ghErrorKind, makeProvenance, toolVersion, filePointer } from './common';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { newestFileAgeDays } from '../docsage';

const CANDIDATE_DIRS = ['docs/runbooks', 'docs/runbook', 'runbooks', 'docs/operations', 'docs/ops', '.github/runbooks'];

export async function detectDocs03(ctx: ScanContext, signal: AbortSignal): Promise<RawFact> {
  const start = Date.now();
  const nowMs = ctx.scanMs ?? Date.now();
  if (signal.aborted) return { detectorId: 'DOCS-03', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: makeProvenance('runbook-inventory', start), truncated: true, error: { kind: 'cap', detail: 'aborted' } };
  try {
    let runbookDir: string | null = null;
    let count = 0;
    let topics: string[] = [];
    let files: string[] = [];
    for (const dir of CANDIDATE_DIRS) {
      try {
        const entries = (await readdir(join(ctx.clonePath, dir))).sort();
        const mdFiles = entries.filter(f => f.endsWith('.md'));
        if (mdFiles.length > 0) { runbookDir = dir; count = mdFiles.length; topics = mdFiles.map(f => f.replace('.md','').toLowerCase()); files = mdFiles.map(f => `${dir}/${f}`); break; }
      } catch {}
      if (signal.aborted) break;
    }
    // Real staleness read (detector-honesty 2.5): newest runbook age from git/mtime.
    const newestDays = files.length ? await newestFileAgeDays(ctx, files, nowMs, signal) : null;
    const facts = { docs03: { runbook_dir: runbookDir, count, topics_covered: topics, restore_doc_present: topics.some(t=>t.includes('restore')), newest_days: newestDays } };
    const pointers = runbookDir
      ? [filePointer(runbookDir, `${count} runbooks enumerated${newestDays == null ? '' : `; newest ${newestDays}d`}`)]
      : [{ detail: 'no runbooks' }];
    return { detectorId: 'DOCS-03', schemaVersion: '1.0.0', facts: facts as unknown as Record<string, unknown>, evidencePointers: pointers, provenance: { tool: 'runbook-inventory', version: toolVersion('runbook-inventory'), flags: ['runbook-inventory'], durationMs: Date.now() - start }, truncated: false };
  } catch (e) { return { detectorId: 'DOCS-03', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: makeProvenance('runbook-inventory', start), truncated: true, error: ghErrorKind(e) }; }
}
