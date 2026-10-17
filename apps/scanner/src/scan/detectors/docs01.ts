import type { ScanContext, RawFact } from '../detector';
import { ghErrorKind, makeProvenance, toolVersion, filePointer } from './common';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { newestFileAgeDays } from '../docsage';

const CANDIDATE_DIRS = ['docs/adr', 'doc/adr', 'decisions', 'decisions/adr', 'rfcs', 'architecture-decisions', 'adr'];

export async function detectDocs01(ctx: ScanContext, signal: AbortSignal): Promise<RawFact> {
  const start = Date.now();
  const nowMs = ctx.scanMs ?? Date.now();
  if (signal.aborted) return { detectorId: 'DOCS-01', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: makeProvenance('adr-inventory', start), truncated: true, error: { kind: 'cap', detail: 'aborted' } };
  try {
    let adrDir: string | null = null;
    let adrCount = 0;
    let adrFiles: string[] = [];
    for (const dir of CANDIDATE_DIRS) {
      try {
        const entries = (await readdir(join(ctx.clonePath, dir))).sort();
        const mdFiles = entries.filter(f => f.endsWith('.md'));
        if (mdFiles.length > 0) { adrDir = dir; adrCount = mdFiles.length; adrFiles = mdFiles.map(f => `${dir}/${f}`); break; }
        if (entries.length > 0 && adrDir === null) { adrDir = dir; adrCount = entries.length; adrFiles = entries.map(f => `${dir}/${f}`); }
      } catch {}
      if (signal.aborted) break;
    }
    // Also probe single ADR file candidates
    if (!adrDir) {
      for (const file of ['docs/adr/README.md', 'ADR.md', 'decisions/README.md']) {
        const buf = await ctx.readFile(file);
        if (buf) { adrDir = file; adrCount = 1; adrFiles = [file]; break; }
      }
    }
    // Real staleness read (detector-honesty 2.5): newest ADR age from git/mtime.
    const newestAdrDays = adrFiles.length ? await newestFileAgeDays(ctx, adrFiles, nowMs, signal) : null;
    const facts = { docs01: { adr_dir: adrDir ?? null, adr_count: adrCount, newest_adr_days: newestAdrDays } };
    const tool = 'adr-inventory';
    const pointers = adrDir
      ? [filePointer(adrDir, `${adrCount} ADRs enumerated${newestAdrDays == null ? '' : `; newest ${newestAdrDays}d`}`)]
      : [{ detail: 'no ADR dir found' }];
    return { detectorId: 'DOCS-01', schemaVersion: '1.0.0', facts: facts as unknown as Record<string, unknown>, evidencePointers: pointers, provenance: { tool, version: toolVersion(tool), flags: [tool], durationMs: Date.now() - start }, truncated: false };
  } catch (e) { return { detectorId: 'DOCS-01', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: makeProvenance('adr-inventory', start), truncated: true, error: ghErrorKind(e) }; }
}
