import type { ScanContext, RawFact } from '../detector';
import { ghErrorKind, filePointer, basisPointer, measuredFact, unknownFact, readBudgetNote } from './common';
import { scanDependencies } from '../deps';
import { matchAdvisories, advisoryCoveredEcosystems, advisoryAgeDays, snapshotVersions } from '../snapshots';
import { cachedSourceImports, isDependencyImported } from '../sourcefiles';

const WHAT_IT_TAKES =
  'resolve locked dependency versions and join them to a known-vulnerability source (the vendored advisory snapshot covers a curated subset; an uncovered ecosystem needs advisory data the snapshot lacks)';

/**
 * SEC-01 — unpatched vulnerabilities (detector-honesty 3.2; spec sec-01). Locked
 * versions from the parsed lockfiles are joined to the vendored advisory snapshot
 * (advisory ids named); reachability is a real read of the source import graph.
 * No lockfile / no locked versions / no covered ecosystem → `unknown` (never a
 * permissive "clean").
 */
export async function detectSec01(ctx: ScanContext, signal: AbortSignal): Promise<RawFact> {
  const started = Date.now();
  const nowMs = ctx.scanMs ?? Date.now();
  try {
    if (signal.aborted) return unknownFact('SEC-01', 'advisory-snapshot', started, WHAT_IT_TAKES);
    const scan = await scanDependencies(ctx);
    if (scan.readBudgetExhausted) {
      return unknownFact('SEC-01', 'advisory-snapshot', started, readBudgetNote(scan.manifests, scan.manifestsTotal, 'dependency manifests'));
    }
    if (scan.manifests === 0) {
      return unknownFact('SEC-01', 'advisory-snapshot', started, `${WHAT_IT_TAKES}; no dependency manifest found (na_when clause-b)`);
    }
    if (scan.lockfiles.length === 0) {
      return unknownFact('SEC-01', 'advisory-snapshot', started, `${WHAT_IT_TAKES}; no lockfile found — versions are unpinned so advisories cannot be matched`);
    }
    if (scan.locked.size === 0) {
      return unknownFact('SEC-01', 'advisory-snapshot', started, `${WHAT_IT_TAKES}; the lockfile records no resolved package version to check`);
    }

    const covered = advisoryCoveredEcosystems();
    const presentEcosystems = [...new Set([...scan.locked.keys()].map((k) => k.split(':')[0]))].sort();
    const uncovered = presentEcosystems.filter((e) => !covered.includes(e));
    const pointers: ReturnType<typeof filePointer>[] = [
      ...scan.lockfiles.slice(0, 5).map((l) => filePointer(l.path, `${l.packages} locked entries joined to the advisory snapshot`)),
      basisPointer('advisory-snapshot', `vendored advisory dataset ${snapshotVersions()['advisory-snapshot']}; covered ecosystems: ${covered.join(', ') || 'none'}`),
    ];

    if (uncovered.length === presentEcosystems.length) {
      return unknownFact('SEC-01', 'advisory-snapshot', started,
        `${WHAT_IT_TAKES}; the advisory snapshot covers none of the parsed ecosystems (${presentEcosystems.join(', ')}) — covered: ${covered.join(', ') || 'none'}`,
        { pointers });
    }

    const imports = await cachedSourceImports(ctx, signal);
    const findings: Array<Record<string, unknown>> = [];
    for (const [key, version] of scan.locked) {
      const i = key.indexOf(':');
      const eco = key.slice(0, i);
      const name = key.slice(i + 1);
      for (const adv of matchAdvisories(eco, name, version)) {
        findings.push({
          id: adv.id,
          pkg: name,
          version,
          severity: adv.severity,
          age_days: advisoryAgeDays(adv.published, nowMs),
          fix_available: !!adv.fixed,
          in_core_import_closure: isDependencyImported(imports, name),
        });
      }
    }
    findings.sort((a, b) => String(a.id).localeCompare(String(b.id)) || String(a.pkg).localeCompare(String(b.pkg)));
    const critical_open_over_14d = findings.filter((f) => f.severity === 'CRITICAL' && ((f.age_days as number) ?? 0) > 14).length;
    const high_open = findings.filter((f) => f.severity === 'HIGH').length;

    const facts = {
      sec01: {
        findings,
        critical_open_over_14d,
        high_open,
        tools: [`advisory-snapshot ${snapshotVersions()['advisory-snapshot']}`],
        ecosystems_scanned: presentEcosystems.filter((e) => covered.includes(e)),
        ecosystems_uncovered: uncovered,
        advisory_snapshot_version: snapshotVersions()['advisory-snapshot'],
      },
    };
    const measurement = uncovered.length > 0
      ? { status: 'estimated' as const, confidence: 'low' as const, scopeLimited: true }
      : imports.truncated
        ? { status: 'measured' as const, confidence: 'low' as const, scopeLimited: true }
        : { status: 'measured' as const, confidence: 'medium' as const };
    return measuredFact({
      detectorId: 'SEC-01',
      producer: 'advisory-snapshot',
      started,
      facts: facts as unknown as Record<string, unknown>,
      pointers,
      measurement,
      truncated: uncovered.length > 0 || imports.truncated,
    });
  } catch (e) {
    return { detectorId: 'SEC-01', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: { tool: 'advisory-snapshot', version: '1.0', flags: ['advisory-snapshot'], durationMs: Date.now() - started }, truncated: true, error: ghErrorKind(e) };
  }
}
