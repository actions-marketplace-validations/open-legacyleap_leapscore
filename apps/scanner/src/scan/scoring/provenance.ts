/** apps/scanner/src/scan/scoring/provenance.ts — provenance-registry invariant (detector-honesty 1.4)
 *
 * The sealed report must not cite a producer that this build cannot run, and
 * every cited producer must appear in `report.provenance.tool_manifest`. This is
 * a pure check (no runtime enforcement) so the invariants are asserted by the
 * provenance-registry test over a real fixture scan and over a fabricated row.
 */
import { isRunnableProducer } from '../detectors/common';

export type ProventRow = {
  id: string;
  evidence?: { tool?: string; tool_version?: string };
};

export type ToolManifestEntry = { tool: string; version: string };

/**
 * Return one message per provenance violation. Empty array == truthful report.
 * A fabricated/absent producer and a manifest that omits a cited producer both fail.
 */
export function checkProvenanceRegistry(rows: ProventRow[], manifest: ToolManifestEntry[]): string[] {
  const errors: string[] = [];
  const manifestTools = new Set(manifest.map((m) => m.tool));
  for (const r of rows) {
    const tool = r.evidence?.tool;
    if (!tool) continue;
    if (!isRunnableProducer(tool)) {
      errors.push(`${r.id}: evidence producer "${tool}" is not in the runnable-producer registry`);
    }
    if (!manifestTools.has(tool)) {
      errors.push(`${r.id}: evidence producer "${tool}" is missing from report.provenance.tool_manifest`);
    }
    if (!r.evidence?.tool_version) {
      errors.push(`${r.id}: evidence producer "${tool}" has no tool_version`);
    }
  }
  return errors;
}
