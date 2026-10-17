import type { ScanContext, RawFact } from '../detector';
import { ghErrorKind, filePointer, measuredFact, unknownFact, readBudgetNote } from './common';
import { scanDependencies } from '../deps';

const WHAT_IT_TAKES =
  'parse the lockfile graph for transitive counts and duplicate versions (unused-direct detection needs a dead-dependency analyser this build does not run)';

/** Security-critical package families whose duplicate versions are the ECOS-06
 * red flag (crypto/auth/http-client surface). */
const SECURITY_CRITICAL = /^(crypto-js|node-forge|jsonwebtoken|jose|bcrypt|passport|express-jwt|helmet|axios|node-fetch|got|request|superagent|urllib3|requests|cryptography|pyjwt|oauthlib|python-jose|golang\.org\/x\/crypto|org\.bouncycastle)/i;

/** ECOS-06 — dependency bloat (detector-honesty 2.3; spec ecos-06). Transitive
 * counts and duplicate versions are exhaustive parsed facts; the unused-direct
 * percentage needs a dead-dep tool the release does not ship, so it is `null`
 * (absent signal, not an estimate). No lockfile → `unknown`. */
export async function detectEcos06(ctx: ScanContext, signal: AbortSignal): Promise<RawFact> {
  const started = Date.now();
  try {
    if (signal.aborted) return unknownFact('ECOS-06', 'lockfile-parse', started, WHAT_IT_TAKES);
    const scan = await scanDependencies(ctx);
    if (scan.readBudgetExhausted) {
      return unknownFact('ECOS-06', 'lockfile-parse', started, readBudgetNote(scan.manifests, scan.manifestsTotal, 'dependency manifests'));
    }
    if (scan.manifests === 0) {
      return unknownFact('ECOS-06', 'lockfile-parse', started, `${WHAT_IT_TAKES}; no dependency manifest found (na_when clause-b)`);
    }
    if (scan.lockfiles.length === 0) {
      return unknownFact('ECOS-06', 'lockfile-parse', started, `${WHAT_IT_TAKES}; no lockfile found — transitive counts are unknowable`);
    }

    const byName = new Map<string, Set<string>>();
    for (const l of scan.lockfiles) {
      for (const [name, versions] of Object.entries(l.versions)) {
        const set = byName.get(name) ?? new Set<string>();
        for (const v of versions) set.add(v);
        byName.set(name, set);
      }
    }
    const duplicates = [...byName.entries()]
      .filter(([, s]) => s.size > 1)
      .map(([name, s]) => ({ name, versions: [...s].sort() }))
      .sort((a, b) => a.name.localeCompare(b.name));
    const duplicateSecurityCritical = duplicates.some((d) => SECURITY_CRITICAL.test(d.name));

    const facts = {
      ecos06: {
        transitive_total: scan.transitiveTotal,
        direct_unused: [] as string[],
        pct_direct_unused: null as number | null,
        duplicates,
        duplicate_security_critical: duplicateSecurityCritical,
        lockfiles_parsed: scan.lockfiles.length,
      },
    };
    const pointers = scan.lockfiles
      .slice(0, 4)
      .map((l) => filePointer(l.path, `${l.packages} transitive entries; ${l.integrity ? 'integrity hashes present' : 'no integrity hashes'}`));
    return measuredFact({
      detectorId: 'ECOS-06',
      producer: 'lockfile-parse',
      started,
      facts: facts as unknown as Record<string, unknown>,
      pointers,
      measurement: { status: 'measured', confidence: 'medium' },
    });
  } catch (e) {
    return { detectorId: 'ECOS-06', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: { tool: 'lockfile-parse', version: '1.0', flags: ['lockfile-parse'], durationMs: Date.now() - started }, truncated: true, error: ghErrorKind(e) };
  }
}
