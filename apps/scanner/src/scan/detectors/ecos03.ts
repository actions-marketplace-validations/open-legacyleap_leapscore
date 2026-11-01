import type { ScanContext, RawFact } from '../detector';
import { ghErrorKind, filePointer, basisPointer, measuredFact, unknownFact, readBudgetNote } from './common';
import { scanDependencies, uniqueDirect, type DirectDep } from '../deps';
import { lookupPackage, snapshotVersions } from '../snapshots';
import { cachedSourceImports, isDependencyImported } from '../sourcefiles';

const WHAT_IT_TAKES =
  'resolve each load-bearing dependency to its last-release date from a package-metadata source (the vendored snapshot ships last_release for a curated subset)';

const MONTH_MS = 30 * 86_400_000;
/** Red/Y thresholds (unified ECOS-03 §3): unmaintained > R months is the fire;
 * 12–R months is the warning band. */
const R_MONTHS = 24;
const Y_MONTHS = 12;

function monthsSince(iso: string, nowMs: number): number {
  const t = Date.parse(iso.length === 10 ? `${iso}T00:00:00Z` : iso);
  return Number.isFinite(t) ? Math.floor((nowMs - t) / MONTH_MS) : 0;
}

/**
 * ECOS-03 — abandoned / unmaintained libraries (detector-honesty 2.3/2.4;
 * spec ecos-03). Last-release dates come from the vendored package-metadata
 * table joined to the parsed lockfile/direct surface; a dependency absent from
 * the table is counted `unresolvable` and never guessed. The `in_core_path`
 * join is a real read of the source import graph (a dependency no source file
 * imports is isolated), not a constant.
 */
export async function detectEcos03(ctx: ScanContext, signal: AbortSignal): Promise<RawFact> {
  const started = Date.now();
  const nowMs = ctx.scanMs ?? Date.now();
  try {
    if (signal.aborted) return unknownFact('ECOS-03', 'lockfile-parse', started, WHAT_IT_TAKES);
    const scan = await scanDependencies(ctx);
    if (scan.readBudgetExhausted) {
      return unknownFact('ECOS-03', 'lockfile-parse', started, readBudgetNote(scan.manifests, scan.manifestsTotal, 'dependency manifests'));
    }
    if (scan.manifests === 0) {
      return unknownFact('ECOS-03', 'lockfile-parse', started, `${WHAT_IT_TAKES}; no dependency manifest was found (na_when clause-b)`);
    }
    if (scan.lockfiles.length === 0) {
      return unknownFact('ECOS-03', 'lockfile-parse', started,
        `${WHAT_IT_TAKES}; no lockfile found — pin your dependencies so per-version abandonment is knowable`);
    }

    // Load-bearing set = production direct deps (prod scope wins), the surface
    // whose last-release date decides the row.
    let loadBearing = uniqueDirect(scan.direct, 'prod');
    if (loadBearing.length === 0) loadBearing = uniqueDirect(scan.direct);
    if (loadBearing.length === 0) {
      return unknownFact('ECOS-03', 'lockfile-parse', started, `${WHAT_IT_TAKES}; the lockfile records no load-bearing dependency`);
    }

    const imports = await cachedSourceImports(ctx, signal);
    const abandoned: Array<Record<string, unknown>> = [];
    const unresolvable: string[] = [];
    for (const d of loadBearing as DirectDep[]) {
      const meta = lookupPackage(d.ecosystem, d.name);
      if (!meta?.last_release) { unresolvable.push(d.name); continue; }
      const months = monthsSince(meta.last_release, nowMs);
      if (months > R_MONTHS) {
        abandoned.push({
          name: d.name,
          version: scan.locked.get(`${d.ecosystem}:${d.name}`) ?? d.version ?? null,
          months_since_release: months,
          archived: false,
          in_core_path: isDependencyImported(imports, d.name),
        });
      }
    }
    abandoned.sort((a, b) => (b.months_since_release as number) - (a.months_since_release as number) || String(a.name).localeCompare(String(b.name)));

    const total = loadBearing.length;
    const resolvable = total - unresolvable.length;
    const ratio = total ? resolvable / total : 0;
    const facts = {
      ecos03: {
        load_bearing_total: total,
        abandoned,
        bus_factor_1_count: 0,
        unresolvable: unresolvable.length,
        unresolvable_names: unresolvable.slice().sort((a, b) => a.localeCompare(b)),
        resolvable_ratio: Math.round(ratio * 1000) / 1000,
      },
    };
    const pointers = [
      ...scan.lockfiles.map((l) => filePointer(l.path, `${l.packages} lockfile package entries resolved against the package-metadata table`)).slice(0, 3),
      basisPointer('eol-snapshot', `last-release metadata from snapshot ${snapshotVersions()['eol-snapshot']}`),
    ];
    if (resolvable === 0) {
      return unknownFact('ECOS-03', 'lockfile-parse', started,
        `every load-bearing dependency is unresolvable against the vendored package-metadata table (${total} deps)`,
        { pointers, facts: facts as unknown as Record<string, unknown> });
    }
    const measurement = ratio >= 0.7 && !imports.truncated
      ? { status: 'measured' as const, confidence: 'medium' as const }
      : { status: 'estimated' as const, confidence: 'low' as const, scopeLimited: true };
    return measuredFact({
      detectorId: 'ECOS-03',
      producer: 'lockfile-parse',
      started,
      facts: facts as unknown as Record<string, unknown>,
      pointers,
      measurement,
      truncated: ratio < 0.7 || imports.truncated,
    });
  } catch (e) {
    return { detectorId: 'ECOS-03', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: { tool: 'lockfile-parse', version: '1.0', flags: ['lockfile-parse'], durationMs: Date.now() - started }, truncated: true, error: ghErrorKind(e) };
  }
}
