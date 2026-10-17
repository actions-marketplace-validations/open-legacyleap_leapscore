import type { ScanContext, RawFact } from '../detector';
import { ghErrorKind, filePointer, basisPointer, measuredFact, unknownFact, readBudgetNote, readText, makeReadBudgetTracker } from './common';
import { walkSortedTree } from '../tree';
import { scanDependencies, uniqueDirect, type DirectDep } from '../deps';
import { lookupPackage, snapshotVersions } from '../snapshots';
import { cachedWorkflows } from '../sourcefiles';

const WHAT_IT_TAKES =
  'resolve direct-dependency licenses from the vendored package-metadata table (transitive licenses need an SBOM scanner the offline release does not ship)';

type LicenseClass = 'strong' | 'weak' | 'permissive' | 'unknown';

/** Classify a license string (encyclopedia §ECOS-05): strong copyleft (GPL/AGPL),
 * weak copyleft (LGPL/MPL/EPL/CDDL), permissive, or unknown. */
export function classifyLicense(license: string | null | undefined): LicenseClass {
  if (!license) return 'unknown';
  const s = license.toUpperCase();
  if (/AGPL/.test(s)) return 'strong';
  if (/(^|[^L])GPL/.test(s)) return 'strong'; // GPL but not LGPL
  if (/LGPL|MPL|EPL|CDDL/.test(s)) return 'weak';
  if (/MIT|APACHE|BSD|ISC|WTFPL|ZLIB|UNLICENSE|0BSD|PUBLIC DOMAIN|PYTHON-2/.test(s)) return 'permissive';
  return 'unknown';
}

const SBOM_PATH = /(^|\/)(sbom|bom)(\.|$)|\.cdx\.json$|cyclonedx/i;

/**
 * ECOS-05 — license compliance (detector-honesty 2.4; spec ecos-05). Licenses
 * for the direct-dependency surface come from the vendored package-metadata
 * table — never guessed; a package the table does not cover is counted
 * `license_unknown_count` and named in `license_unknown_names`. The row is
 * `estimated` (clamp [1,2]): the direct
 * license surface is exhaustive but transitive licenses need an SBOM scanner
 * this build does not run. G8 reads `copyleft_strong` + `closed_source_distribution_likely`.
 */
export async function detectEcos05(ctx: ScanContext, signal: AbortSignal): Promise<RawFact> {
  const started = Date.now();
  try {
    if (signal.aborted) return unknownFact('ECOS-05', 'lockfile-parse', started, WHAT_IT_TAKES);
    const scan = await scanDependencies(ctx);
    if (scan.readBudgetExhausted) {
      return unknownFact('ECOS-05', 'lockfile-parse', started, readBudgetNote(scan.manifests, scan.manifestsTotal, 'dependency manifests'));
    }
    if (scan.manifests === 0) {
      return unknownFact('ECOS-05', 'lockfile-parse', started, `${WHAT_IT_TAKES}; no dependency manifest found (na_when clause-b)`);
    }
    let direct = uniqueDirect(scan.direct, 'prod');
    if (direct.length === 0) direct = uniqueDirect(scan.direct);

    let packagesTotal = 0;
    let licenseUnknownCount = 0;
    let copyleftWeakCount = 0;
    const licenseUnknownNames: string[] = [];
    const copyleftStrong: Array<{ name: string; version: string | null; license: string; direct: boolean }> = [];
    for (const d of direct as DirectDep[]) {
      packagesTotal++;
      const meta = lookupPackage(d.ecosystem, d.name);
      const cls = classifyLicense(meta?.license);
      if (cls === 'unknown') { licenseUnknownCount++; licenseUnknownNames.push(d.name); continue; }
      if (cls === 'weak') copyleftWeakCount++;
      if (cls === 'strong') copyleftStrong.push({ name: d.name, version: d.version ?? null, license: meta!.license, direct: true });
    }
    copyleftStrong.sort((a, b) => a.name.localeCompare(b.name));

    let paths: string[] = [];
    try {
      paths = (await walkSortedTree(ctx.clonePath)).paths.filter((p) => !p.endsWith('/'));
    } catch { paths = []; }
    const sbomPresent = paths.some((p) => SBOM_PATH.test(p));

    const { text: wfText } = await cachedWorkflows(ctx, signal);
    const ciLicenseGate = /(license|scancode|licensee|pip-licenses)/i.test(wfText) && /(check|audit|scan|compliance)/i.test(wfText);

    // Closed-source distribution posture: a packaging config that ships a
    // built/binary artifact, unless the repo's own LICENSE is copyleft (an OSS
    // AGPL/GPL release is copyleft-compatible). These supplementary reads feed a
    // G8-relevant signal, so a read-budget-blocked read must be disclosed, not
    // silently read as "absent" (legacy-stacks 8.3).
    const suppReads = makeReadBudgetTracker();
    const read = (p: string) => readText(ctx, p, suppReads);
    const pkgRaw = await read('package.json');
    let hasBinaryPackaging = false;
    if (pkgRaw) { try { hasBinaryPackaging = 'bin' in (JSON.parse(pkgRaw) as Record<string, unknown>); } catch { /* ignore */ } }
    if (!hasBinaryPackaging) {
      const dockerfiles = paths.filter((p) => /(^|\/)Dockerfile(\.[\w.-]+)?$/.test(p)).slice(0, 3);
      for (const df of dockerfiles) {
        const text = await read(df);
        if (text && (/^\s*FROM\s+scratch/im.test(text) || /COPY\s+--from=/i.test(text))) { hasBinaryPackaging = true; break; }
      }
    }
    if (!hasBinaryPackaging) {
      const pyproject = await read('pyproject.toml');
      if (pyproject && /\[build-system\]/.test(pyproject)) hasBinaryPackaging = true;
    }
    const licenseText = (await read('LICENSE')) ?? (await read('LICENSE.md')) ?? (await read('LICENSE.txt')) ?? '';
    const repoIsCopyleft = /\b(AGPL|GPL)\b/i.test(licenseText);
    if (suppReads.budgetBlocked > 0) {
      return unknownFact('ECOS-05', 'lockfile-parse', started,
        readBudgetNote(suppReads.reads, suppReads.reads + suppReads.budgetBlocked, 'license supplementary reads'));
    }
    const closedSourceDistributionLikely = hasBinaryPackaging && !repoIsCopyleft;

    const facts = {
      ecos05: {
        packages_total: packagesTotal,
        license_unknown_count: licenseUnknownCount,
        license_unknown_names: licenseUnknownNames.slice().sort((a, b) => a.localeCompare(b)),
        copyleft_strong: copyleftStrong,
        copyleft_weak_count: copyleftWeakCount,
        sbom_present_in_repo: sbomPresent,
        ci_license_gate_present: ciLicenseGate,
        closed_source_distribution_likely: closedSourceDistributionLikely,
      },
    };
    const pointers = [
      ...direct.slice(0, 4).map((d) => filePointer(`manifest:${d.ecosystem}`, `${d.name} license classified from package metadata`)),
      basisPointer('eol-snapshot', `license metadata from snapshot ${snapshotVersions()['eol-snapshot']}`),
    ];
    if (packagesTotal === 0) {
      return unknownFact('ECOS-05', 'lockfile-parse', started,
        `${WHAT_IT_TAKES}; the manifest declares no direct dependency to license`,
        { pointers, facts: facts as unknown as Record<string, unknown> });
    }
    if (licenseUnknownCount === packagesTotal) {
      return unknownFact('ECOS-05', 'lockfile-parse', started,
        `${WHAT_IT_TAKES}; none of the ${packagesTotal} direct dependencies is covered by the package-metadata table`,
        { pointers, facts: facts as unknown as Record<string, unknown> });
    }
    return measuredFact({
      detectorId: 'ECOS-05',
      producer: 'lockfile-parse',
      started,
      facts: facts as unknown as Record<string, unknown>,
      pointers,
      measurement: { status: 'estimated', confidence: 'low', scopeLimited: licenseUnknownCount > 0 },
      truncated: licenseUnknownCount > 0,
    });
  } catch (e) {
    return { detectorId: 'ECOS-05', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: { tool: 'lockfile-parse', version: '1.0', flags: ['lockfile-parse'], durationMs: Date.now() - started }, truncated: true, error: ghErrorKind(e) };
  }
}
