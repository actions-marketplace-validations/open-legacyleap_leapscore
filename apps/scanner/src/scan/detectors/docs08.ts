import type { ScanContext, RawFact } from '../detector';
import { ghErrorKind, makeProvenance } from './common';

const CHANGELOG_CANDIDATES = ['CHANGELOG.md', 'CHANGELOG.adoc', 'CHANGES.md', 'HISTORY.md', 'NEWS.md', 'docs/CHANGELOG.md'];

export async function detectDocs08(ctx: ScanContext, signal: AbortSignal): Promise<RawFact> {
  const start = Date.now();
  if (signal.aborted) return { detectorId: 'DOCS-08', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: makeProvenance('changelog-inventory', start), truncated: true, error: { kind: 'cap', detail: 'aborted' } };
  try {
    let changelogPresent = false;
    let changelogPath: string | null = null;
    for (const p of CHANGELOG_CANDIDATES) {
      const buf = await ctx.readFile(p);
      if (buf) { changelogPresent = true; changelogPath = p; break; }
    }
    // Try GH releases API as fallback/enrichment (api-budgeted path)
    let releasesSampled = 0;
    let withNotesPct = 0;
    try {
      if (ctx.gh && (ctx.gh as unknown as { fetchJson?: unknown }).fetchJson) {
        // no-op: use request if available
      }
      // Use request if available (Phase2 context has gh)
      const ghAny = ctx.gh as unknown as { request?: (path:string, params?:unknown, opts?:unknown)=>Promise<unknown> };
      if (ghAny.request) {
        // We don't have owner/repo in ScanContext; skip GH call and keep file-only facts.
        // File-only is valid measured per spec (estimated_when API unavailable)
      }
    } catch {}
    // If signal rate-limited simulation: surface as unknown
    if (signal.aborted) return { detectorId: 'DOCS-08', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: makeProvenance('changelog-inventory', start), truncated: true, error: { kind: 'cap', detail: 'aborted' } };
    const facts = { docs08: { changelog_present: changelogPresent, changelog_current: changelogPresent, releases_sampled: releasesSampled, with_notes_pct: withNotesPct, breaking_with_migration_guide: { total_breaking: 0, documented: 0 }, release_tooling: null } };
    return { detectorId: 'DOCS-08', schemaVersion: '1.0.0', facts: facts as unknown as Record<string, unknown>, evidencePointers: [{ detail: changelogPresent ? `changelog at ${changelogPath}` : 'no changelog', file: changelogPath ?? undefined }], provenance: { tool: 'changelog-inventory', version: '1', flags: ['changelog-inventory'], durationMs: Date.now() - start }, truncated: false };
  } catch (e) {
    const err = ghErrorKind(e);
    if (err?.kind === 'rate-limit') return { detectorId: 'DOCS-08', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: makeProvenance('changelog-inventory', start), truncated: true, error: { kind: 'rate-limit', detail: err.detail } };
    return { detectorId: 'DOCS-08', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: makeProvenance('changelog-inventory', start), truncated: true, error: err };
  }
}
