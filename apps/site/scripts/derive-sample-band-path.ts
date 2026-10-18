/**
 * apps/site/scripts/derive-sample-band-path.ts — build tooling, exempt from the
 * site boundary check.
 *
 * The sample report's next-band path is never hand-written (design D9): this
 * script runs the scanner's own derivation over the fixture's authored rows and
 * writes the result into the envelope, byte-stable with the fixture's existing
 * serialization. Rerun after editing the sample's rows:
 *
 *   npx tsx apps/site/scripts/derive-sample-band-path.ts
 *
 * Post-write it verifies that `sample: true` survived, that the persisted path
 * deep-equals a fresh re-derivation, that every step comes from a graded
 * (measured/estimated, score 0–2) row, and that the unreached count matches the
 * fixture's own unknown / not-implemented rows.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  bandPathRegistryFromRubric,
  deriveNextBandPath,
} from '../../scanner/src/scan/scoring/bandpath';

const FIXTURE = join(
  import.meta.dirname,
  '../lib/fixtures/django__django__506fc82__2026-08-12T000000-000Z.json',
);
const RUBRIC = join(import.meta.dirname, '../../scanner/src/scan/scoring/rubric.json');

/** Python-`json.dump(ensure_ascii=True, indent=2)`-compatible serializer, so
 *  the script's rewrite stays byte-stable with the rest of the fixture. */
function serialize(value: unknown): string {
  return JSON.stringify(value, null, 2).replace(
    /[\u007f-\uffff]/g,
    (ch) => `\\u${ch.charCodeAt(0).toString(16).padStart(4, '0')}`,
  );
}

type PathInput = Parameters<typeof deriveNextBandPath>[0];

const envelope = JSON.parse(readFileSync(FIXTURE, 'utf8')) as {
  report: {
    headline: { score: number; tier: string; suppressed?: boolean };
    categories?: unknown;
    full_table?: unknown;
    sample?: boolean;
    next_band_path?: unknown;
  };
};
const report = envelope.report;

const path = deriveNextBandPath({
  score: report.headline.score,
  suppressed: report.headline.suppressed === true,
  categories: report.categories as PathInput['categories'],
  rows: report.full_table as PathInput['rows'],
  registry: bandPathRegistryFromRubric(
    JSON.parse(readFileSync(RUBRIC, 'utf8')) as Parameters<typeof bandPathRegistryFromRubric>[0],
  ),
});
if (!path) {
  throw new Error('sample fixture is suppressed — it must seal a headline number');
}

// Insert the field after `full_table`, matching the contract's field order.
const rebuilt: Record<string, unknown> = {};
for (const [key, value] of Object.entries(report)) {
  if (key === 'next_band_path') continue;
  rebuilt[key] = value;
  if (key === 'full_table') rebuilt.next_band_path = path;
}
if (!('next_band_path' in rebuilt)) {
  throw new Error('sample report has no full_table to anchor next_band_path after');
}
envelope.report = rebuilt as typeof report;

writeFileSync(FIXTURE, serialize(envelope));

// --- post-write verification -------------------------------------------------
const written = JSON.parse(readFileSync(FIXTURE, 'utf8')) as typeof envelope;
if (written.report.sample !== true) throw new Error('sample flag was lost');
if (JSON.stringify(written.report.next_band_path) !== JSON.stringify(path)) {
  throw new Error('persisted path differs from the derivation');
}

type Row = { id?: string; status?: string; score?: number };
type WrittenPath = {
  classes: Array<{ class: string; pp: number; cumulative_pp: number; arrival: string; steps: Array<{ row: string }> }>;
  unreached_rows: number;
};
const rows = (written.report.full_table ?? []) as Row[];
const persisted = written.report.next_band_path as WrittenPath;
const graded = rows.filter(
  (r) =>
    (r.status === 'measured' || r.status === 'estimated') &&
    typeof r.score === 'number' &&
    r.score >= 0 &&
    r.score <= 2,
);
const unreached = rows.filter((r) => r.status === 'unknown' || r.status === 'not_implemented').length;
for (const step of persisted.classes.flatMap((c) => c.steps)) {
  if (!graded.some((r) => r.id === step.row)) {
    throw new Error(`path step ${step.row} is not a graded non-Green row`);
  }
}
if (persisted.unreached_rows !== unreached) {
  throw new Error(`unreached_rows ${persisted.unreached_rows} ≠ fixture statuses ${unreached}`);
}

const summary = persisted.classes
  .map((c) => `${c.class} ${c.pp.toFixed(2)}pp (cumulative ${c.cumulative_pp.toFixed(2)}pp, ${c.arrival})`)
  .join(' · ');
console.log(`sample path derived: ${path.destination} floor ${path.threshold}, ${path.points_needed}pp needed`);
console.log(`classes: ${summary || 'none'} · steps: ${graded.length} graded · unreached: ${persisted.unreached_rows}`);
console.log('sample: true retained; persisted path re-verifies against the rows.');
