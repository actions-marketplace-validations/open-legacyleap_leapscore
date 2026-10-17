import type { ScanContext, RawFact } from '../detector';
import { ghErrorKind, filePointer, basisPointer, measuredFact, unknownFact } from './common';
import { scanDependencies, uniqueDirect, majorOf, type DirectDep } from '../deps';
import { lookupPackage, snapshotVersions } from '../snapshots';

const WHAT_IT_TAKES =
  'parse dependency manifests + lockfiles so direct-dep versions resolve against the vendored package metadata (latest major)';

/** Framework-class packages whose own major gap is a "core framework gap" (spec ecos-02 §2.4). */
const CORE_FRAMEWORKS = new Set([
  'react', 'vue', 'angular', 'svelte', 'next', 'nuxt', 'express', 'nestjs', 'ember', 'react-native', '@angular/core',
  'django', 'flask', 'fastapi',
  'rails',
  'spring-boot', 'spring-boot-starter-web', 'org.springframework.boot:spring-boot-starter-web', 'quarkus',
  'laravel/framework',
  'github.com/gin-gonic/gin', 'gin',
]);

/**
 * ECOS-02 — major package drift, measured from manifests + lockfiles resolved
 * against the vendored package-metadata table (detector-honesty 2.3/2.4;
 * spec ecos-02). Behind-majors needs snapshot metadata; a package absent from the
 * table is counted unresolvable (never guessed), and the ratio rules decide the
 * status (measured ≥0.8 resolvable, estimated partial, unknown none).
 */
export async function detectEcos02(ctx: ScanContext, signal: AbortSignal): Promise<RawFact> {
  const started = Date.now();
  try {
    if (signal.aborted) return unknownFact('ECOS-02', 'lockfile-parse', started, WHAT_IT_TAKES);
    const scan = await scanDependencies(ctx);
    if (scan.manifests === 0) {
      return unknownFact('ECOS-02', 'lockfile-parse', started, `${WHAT_IT_TAKES}; no dependency manifest was found in the tree (na_when clause-b)`);
    }

    let direct = uniqueDirect(scan.direct, 'prod');
    if (direct.length === 0) direct = uniqueDirect(scan.direct);
    const directTotal = direct.length;

    let resolvable = 0;
    let behind1 = 0;
    let behind2 = 0;
    const coreGaps: Array<{ name: string; current: string; latest_major: number; majors_behind: number }> = [];
    const pointers = [];
    for (const d of direct as DirectDep[]) {
      const currentMajor = majorOf(d.version);
      const meta = lookupPackage(d.ecosystem, d.name);
      if (currentMajor == null || !meta) continue;
      const behind = meta.latest_major - currentMajor;
      if (behind < 0) continue; // ahead of the snapshot — not drift
      resolvable++;
      if (behind >= 1) behind1++;
      if (behind >= 2) behind2++;
      if (behind >= 1 && CORE_FRAMEWORKS.has(d.name)) {
        coreGaps.push({ name: d.name, current: d.version ?? String(currentMajor), latest_major: meta.latest_major, majors_behind: behind });
      }
    }
    coreGaps.sort((a, b) => b.majors_behind - a.majors_behind || a.name.localeCompare(b.name));

    const ratio = directTotal ? resolvable / directTotal : 0;
    const facts = {
      ecos02: {
        direct_deps_total: directTotal,
        unresolvable: directTotal - resolvable,
        resolvable_ratio: Math.round(ratio * 1000) / 1000,
        pct_behind_1plus_major: resolvable ? Math.round((behind1 / resolvable) * 1000) / 10 : 0,
        pct_behind_2plus_major: resolvable ? Math.round((behind2 / resolvable) * 1000) / 10 : 0,
        core_framework_gaps: coreGaps,
      },
    };
    const lockPaths = [...new Set(scan.lockfiles.map((l) => l.path))].slice(0, 5);
    for (const p of lockPaths) pointers.push(filePointer(p, 'direct-dep versions resolved from this lockfile'));
    pointers.push(basisPointer('lockfile-parse', `package metadata snapshot ${snapshotVersions()['eol-snapshot']}`));

    if (resolvable === 0) {
      return unknownFact('ECOS-02', 'lockfile-parse', started,
        `every direct dependency is unresolvable against the vendored package table (${directTotal} deps, fully private ecosystem)`,
        { pointers, facts: facts as unknown as Record<string, unknown> });
    }
    const measurement = ratio >= 0.8
      ? { status: 'measured' as const, confidence: 'medium' as const }
      : { status: 'estimated' as const, confidence: 'low' as const, scopeLimited: true };
    return measuredFact({
      detectorId: 'ECOS-02',
      producer: 'lockfile-parse',
      started,
      facts: facts as unknown as Record<string, unknown>,
      pointers,
      measurement,
      truncated: ratio < 0.8,
    });
  } catch (e) {
    return { detectorId: 'ECOS-02', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: { tool: 'lockfile-parse', version: '1.0', flags: ['lockfile-parse'], durationMs: Date.now() - started }, truncated: true, error: ghErrorKind(e) };
  }
}
