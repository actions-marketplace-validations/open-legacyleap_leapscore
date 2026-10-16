/** apps/scanner/src/scan/registry.ts — detector discovery + manifest validation (05 §1.2) */
import type { Detector } from './detector';
// Discovers packages/detectors/*/manifest.json; validates tier/budget/planes/ecosystems.
// Adding indicator 103 = adding a folder — orchestrator never edited (Q9).
// Stub: real impl reads filesystem, checks SPECS skeleton §0-§9 exists, schema.json valid.

export type Manifest = {
  id: string;
  tier: 'A' | 'B' | 'C' | 'D';
  budget: 'fast' | 'slow-dissolvable' | 'api-budgeted';
  planes: string[];
  ecosystems: string[] | 'all';
  tool?: string;
  minVersion?: string;
  nonDeterministic?: boolean;
};

export async function loadRegistry(detectorsDir = 'packages/detectors'): Promise<Manifest[]> {
  void detectorsDir;
  return [];
}
