/** engine/scorer/applicability.ts — required/relevant/irrelevant tier + N/A evaluation */
import rubricData from '../rubric.json' with { type: 'json' };

type Tier = 'required' | 'relevant' | 'irrelevant';
type Archetype = 'library' | 'service' | 'cli' | 'infra' | 'docs' | 'agent-skills' | 'mixed' | 'unknown';

const applicabilityTable: Record<string, Record<string, Tier>> = (rubricData as unknown as { applicability?: Record<string, Record<string, Tier>> }).applicability ?? {};

export function getTier(indicatorId: string, archetype: string): Tier {
  const entry = applicabilityTable[indicatorId];
  if (entry && entry[archetype]) return entry[archetype];
  // also check if indicator has no specific archetype entry but has some — default relevant
  return 'relevant';
}

export interface PlaneInventory {
  has_server: boolean;
  has_data: boolean;
  has_deploy: boolean;
  has_client: boolean;
  has_test: boolean;
}

function planeForIndicator(id: string): keyof PlaneInventory | null {
  const cat = id.split('-')[0];
  if (cat === 'DATA') return 'has_data';
  if (cat === 'PERF') return 'has_deploy';
  if (cat === 'API') return 'has_server';
  if (id === 'VEL-01' || id === 'VEL-04' || id === 'VEL-03') return 'has_deploy';
  if (id.startsWith('FE-')) return 'has_client';
  if (cat === 'TEST') return 'has_test';
  return null;
}

/**
 * Evaluate whether indicator is not_applicable given archetype + planeInventory.
 * Returns { notApplicable: boolean, reason: string, evidence: string[] }
 * - required => never N/A
 * - irrelevant => always N/A for that archetype (no plane check)
 * - relevant => N/A iff plane absent + exhaustive proof (we treat has_* false as exhaustive proof)
 */
export function evaluateApplicability(
  indicatorId: string,
  archetype: Archetype,
  plane: PlaneInventory
): { notApplicable: boolean; reason: string; evidence: string[] } {
  const tier = getTier(indicatorId, archetype);
  if (tier === 'required') {
    return { notApplicable: false, reason: '', evidence: [] };
  }
  if (tier === 'irrelevant') {
    return {
      notApplicable: true,
      reason: `irrelevant for ${archetype} archetype`,
      evidence: [`tier irrelevant for ${archetype}`],
    };
  }
  // relevant: check plane
  const planeKey = planeForIndicator(indicatorId);
  if (!planeKey) {
    // no specific plane — check archetype-level irrelevant already handled, so relevant stays applicable
    return { notApplicable: false, reason: '', evidence: [] };
  }
  const hasPlane = plane[planeKey];
  if (!hasPlane) {
    // exhaustive proof is has_* false which already carries tree-scan evidence
    const planeName = planeKey.replace('has_', '');
    return {
      notApplicable: true,
      reason: `no ${planeName} plane detected (no ${planeKey} evidence, archetype ${archetype})`,
      evidence: [`tree scan: 0 matches for ${planeName}`],
    };
  }
  return { notApplicable: false, reason: '', evidence: [] };
}

/** Compute renormalized weights over applicable categories (proportional). */
export function renormalizeWeights(
  applicableCategoryIds: string[],
  baseWeights: Record<string, number>
): Record<string, number> {
  const totalApplicable = applicableCategoryIds.reduce((sum, id) => sum + (baseWeights[id] ?? 0), 0);
  const totalAll = Object.values(baseWeights).reduce((a, b) => a + b, 0);
  if (totalApplicable === 0 || totalApplicable === totalAll) return baseWeights;
  const out: Record<string, number> = {};
  for (const id of applicableCategoryIds) {
    const w = baseWeights[id] ?? 0;
    out[id] = (w / totalApplicable) * 100;
  }
  return out;
}
