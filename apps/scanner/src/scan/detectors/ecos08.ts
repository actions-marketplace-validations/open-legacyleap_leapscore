import type { ScanContext, RawFact } from '../detector';
import { ghErrorKind, filePointer, basisPointer, measuredFact, unknownFact } from './common';
import { scanDependencies, uniqueDirect, type DirectDep } from '../deps';
import { resolveFramework, snapshotVersions, SNAPSHOT_REFRESH_HINT } from '../snapshots';
import { cachedSourceImports, couplingFor } from '../sourcefiles';

const WHAT_IT_TAKES =
  'detect a framework-class dependency in the parsed manifests and resolve its lifecycle from the vendored framework/EOL snapshot (niche/vendor frameworks need a status source the snapshot lacks)';

/** Framework-class dependency names, keyed to the vendored framework table
 * (spec ecos-08 §1 allowlist). Names not resolvable against the snapshot table
 * are not treated as framework-class. */
const FRAMEWORK_ALIASES: Record<string, string> = {
  '@angular/core': 'angular',
  'spring-boot-starter-web': 'spring-boot',
  'org.springframework.boot:spring-boot-starter-web': 'spring-boot',
  'github.com/gin-gonic/gin': 'gin',
  'laravel/framework': 'laravel',
};

function frameworkNameOf(dep: DirectDep): string | null {
  const lower = dep.name.toLowerCase();
  if (FRAMEWORK_ALIASES[lower]) return FRAMEWORK_ALIASES[lower];
  const candidates = [lower, lower.split(':').pop()!, lower.split('/').pop()!];
  for (const cand of candidates) if (cand && resolveFramework(cand, '') != null) return cand;
  return null;
}

/** A spec that resolves a framework from a git URL/fork rather than the canonical
 * registry (spec ecos-08 §2.4). Canonical upstream URLs are excluded. */
const CANONICAL_URL = /github\.com\/(expressjs|facebook\/react|vuejs|angular|sveltejs|vercel\/next\.js|nuxt|nestjs|emberjs|django|pallets\/flask|tiangolo\/fastapi|rails\/rails|spring-projects|quarkusio|gin-gonic)/i;

/**
 * ECOS-08 — framework lock-in / monoculture risk (detector-honesty 2.4; spec
 * ecos-08). Frameworks come from the parsed manifests, their lifecycle status
 * from the vendored EOL snapshot; the coupling share is a real read of the source
 * import graph. No framework-class dependency → the row is not_applicable (scorer);
 * a framework the snapshot does not cover → `unknown`.
 */
export async function detectEcos08(ctx: ScanContext, signal: AbortSignal): Promise<RawFact> {
  const started = Date.now();
  try {
    if (signal.aborted) return unknownFact('ECOS-08', 'eol-snapshot', started, WHAT_IT_TAKES);
    const scan = await scanDependencies(ctx);
    if (scan.manifests === 0) {
      return unknownFact('ECOS-08', 'eol-snapshot', started, `${WHAT_IT_TAKES}; no dependency manifest found`);
    }
    const direct = uniqueDirect(scan.direct);
    const frameworks: Array<Record<string, unknown>> = [];
    const unresolvable: string[] = [];
    const names: string[] = [];
    const ecosystems = new Set<string>();
    let forkPinned = false;
    for (const d of direct as DirectDep[]) {
      const fname = frameworkNameOf(d);
      if (!fname) continue;
      names.push(d.name);
      ecosystems.add(d.ecosystem);
      if (/^(git\+|git:|github:|https?:\/\/)/.test(d.spec) && !CANONICAL_URL.test(d.spec)) forkPinned = true;
      const version = d.version ?? d.spec ?? '';
      const res = resolveFramework(fname, version);
      if (!res) { unresolvable.push(d.name); continue; }
      frameworks.push({ name: res.name, version: res.version || version || 'unknown', support_status: res.support_status, eol_date: res.eol_date });
    }
    frameworks.sort((a, b) => String(a.name).localeCompare(String(b.name)));

    const imports = await cachedSourceImports(ctx, signal);
    const { share, facade } = couplingFor(imports, names);

    const facts = {
      ecos08: { frameworks, coupling_share: share, facade_layer_detected: facade, fork_pinned: forkPinned },
    };
    const pointers = [
      ...[...ecosystems].sort().map((eco) => filePointer(`manifest:${eco}`, 'framework dependency declared here')),
      basisPointer('eol-snapshot', `framework lifecycle from snapshot ${snapshotVersions()['eol-snapshot']}`),
    ];

    // na_when: no framework-class dependency detected — the scorer marks this
    // not_applicable; the fact is a real enumeration, not a constant.
    if (frameworks.length === 0 && unresolvable.length === 0) {
      return measuredFact({
        detectorId: 'ECOS-08',
        producer: 'eol-snapshot',
        started,
        facts: facts as unknown as Record<string, unknown>,
        pointers,
        measurement: { status: 'measured', confidence: 'medium' },
      });
    }
    if (frameworks.length === 0) {
      return unknownFact('ECOS-08', 'eol-snapshot', started,
        `${WHAT_IT_TAKES}; framework(s) ${unresolvable.join(', ')} are absent from the snapshot — ${SNAPSHOT_REFRESH_HINT}`,
        { pointers, facts: facts as unknown as Record<string, unknown> });
    }
    const measurement = imports.truncated
      ? { status: 'estimated' as const, confidence: 'low' as const, scopeLimited: true }
      : { status: 'measured' as const, confidence: 'medium' as const };
    return measuredFact({
      detectorId: 'ECOS-08',
      producer: 'eol-snapshot',
      started,
      facts: facts as unknown as Record<string, unknown>,
      pointers,
      measurement,
      truncated: imports.truncated,
    });
  } catch (e) {
    return { detectorId: 'ECOS-08', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: { tool: 'eol-snapshot', version: '1.0', flags: ['eol-snapshot'], durationMs: Date.now() - started }, truncated: true, error: ghErrorKind(e) };
  }
}
