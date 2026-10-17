/** tooling/scripts/refresh-snapshots.ts — build the vendored offline datasets
 * (detector-honesty 3.1/3.2, design D3).
 *
 * Documentation (the reproducible refresh procedure):
 *   1. Edit the curated source in tooling/scripts/snapshot-data.ts (never the JSON).
 *   2. Run:  npx tsx tooling/scripts/refresh-snapshots.ts
 *   3. The script writes apps/scanner/src/scan/snapshots/{eol,advisories}.json with
 *      a fresh content-hash version id and prints the ids.
 *   4. Commit the regenerated files. The version id is an input to the score
 *      fingerprint, so a refresh is a deliberate, visible score input.
 *
 * Deterministic: the payload is serialized with sorted keys and the version id is
 * the first 12 hex chars of the sha256 of the stable payload (excluding version
 * and generated_at). Pass --now <ISO> to pin generated_at; otherwise it is the
 * current time (the fingerprint uses the version id, never generated_at).
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { EOL_SOURCE, ADVISORY_SOURCE } from './snapshot-data';

const ROOT = join(import.meta.dirname ?? '.', '../..');
const OUT_DIR = join(ROOT, 'apps/scanner/src/scan/snapshots');

function stableStringify(v: unknown): string {
  if (v === null || v === undefined) return 'null';
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(',')}]`;
  if (typeof v === 'object') {
    const keys = Object.keys(v as Record<string, unknown>).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify((v as Record<string, unknown>)[k])}`).join(',')}}`;
  }
  return JSON.stringify(v);
}

function contentVersion(prefix: string, payload: unknown): string {
  const hash = createHash('sha256').update(stableStringify(payload)).digest('hex').slice(0, 12);
  return `${prefix}-${hash}`;
}

function main(): void {
  const argv = process.argv.slice(2);
  const nowIdx = argv.indexOf('--now');
  const generatedAt = nowIdx >= 0 && argv[nowIdx + 1] ? argv[nowIdx + 1] : new Date().toISOString();

  const eolPayload = {
    source: EOL_SOURCE.source,
    data_date: EOL_SOURCE.data_date,
    runtimes: EOL_SOURCE.runtimes,
    frameworks: EOL_SOURCE.frameworks,
    packages: EOL_SOURCE.packages,
  };
  const eolVersion = contentVersion('eol-2026.10', eolPayload);
  const eolDoc = { version: eolVersion, generated_at: generatedAt, ...eolPayload };

  const advPayload = {
    source: ADVISORY_SOURCE.source,
    data_date: ADVISORY_SOURCE.data_date,
    advisories: ADVISORY_SOURCE.advisories,
  };
  const advVersion = contentVersion('adv-2026.10', advPayload);
  const advDoc = { version: advVersion, generated_at: generatedAt, ...advPayload };

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(join(OUT_DIR, 'eol.json'), JSON.stringify(eolDoc, null, 2) + '\n');
  writeFileSync(join(OUT_DIR, 'advisories.json'), JSON.stringify(advDoc, null, 2) + '\n');
  console.log(`snapshots refreshed:\n  eol-snapshot       ${eolVersion}\n  advisory-snapshot  ${advVersion}`);
}

main();
