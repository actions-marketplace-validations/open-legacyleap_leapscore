/** tooling/checks/schemas.ts — per-indicator schema validation (Q5) */
// Asserts every packages/detectors/<id>/schema.json maps to exactly one canonical unified
// indicator file under docs/rubric/indicators/ and that the indicator still carries a §7
// fact schema.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname ?? '.', '../..');
const RUBRIC = join(ROOT, 'docs/rubric');
const INDICATORS = join(RUBRIC, 'indicators');
const DETECTORS = join(ROOT, 'packages/detectors');

const violations: string[] = [];

function canonicalFiles(): Map<string, { path: string; text: string }> {
  const files = new Map<string, { path: string; text: string }>();
  for (const dir of readdirSync(INDICATORS).filter((entry) => /^\d\d_/.test(entry))) {
    for (const file of readdirSync(join(INDICATORS, dir)).filter((entry) => entry.endsWith('.md'))) {
      const path = join(INDICATORS, dir, file);
      const text = readFileSync(path, 'utf-8');
      const id = text.match(/^#\s+([A-Z]+-\d+)\s+[—-]\s+/m)?.[1];
      if (!id) {
        violations.push(`${relative(path)}: missing canonical H1 identity`);
        continue;
      }
      if (files.has(id)) violations.push(`${id}: more than one canonical file — ${relative(files.get(id)!.path)} and ${relative(path)}`);
      files.set(id, { path, text });
    }
  }
  return files;
}

function relative(path: string): string {
  return path.slice(ROOT.length + 1);
}

function factSchema(text: string): string {
  const start = text.indexOf('## 7. Fact schema');
  if (start === -1) return '';
  const next = text.indexOf('\n## 8.', start);
  return text.slice(start, next === -1 ? text.length : next).trim();
}

const canonical = canonicalFiles();
if (canonical.size !== 102) violations.push(`expected 102 canonical indicator files, found ${canonical.size}`);

const seen = new Set<string>();
const detectorDirs = readdirSync(DETECTORS, { withFileTypes: true }).filter((entry) => entry.isDirectory());
for (const entry of detectorDirs) {
  const dir = join(DETECTORS, entry.name);
  const manifestPath = join(dir, 'manifest.json');
  const schemaPath = join(dir, 'schema.json');
  if (!existsSync(manifestPath) || !existsSync(schemaPath)) {
    violations.push(`${entry.name}: manifest.json and schema.json are both required`);
    continue;
  }
  let manifest: { id?: string; schemaVersion?: string };
  let schema: { title?: string };
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    schema = JSON.parse(readFileSync(schemaPath, 'utf-8'));
  } catch (error) {
    violations.push(`${entry.name}: invalid JSON — ${(error as Error).message}`);
    continue;
  }
  const id = manifest.id;
  if (!id) {
    violations.push(`${entry.name}: manifest has no id`);
    continue;
  }
  if (seen.has(id)) violations.push(`${id}: more than one detector folder claims the id`);
  seen.add(id);
  if (!manifest.schemaVersion) violations.push(`${entry.name}: manifest has no schemaVersion`);
  if (schema.title !== id) violations.push(`${entry.name}: schema title "${schema.title ?? ''}" does not match manifest id ${id}`);

  const indicator = canonical.get(id);
  if (!indicator) {
    violations.push(`${entry.name}: no canonical unified indicator file for ${id}`);
    continue;
  }
  const section = factSchema(indicator.text);
  if (!section) violations.push(`${entry.name}: ${relative(indicator.path)} has no §7 Fact schema`);
  else if (section.replace('## 7. Fact schema', '').trim().length < 10) {
    violations.push(`${entry.name}: ${relative(indicator.path)} §7 Fact schema is empty`);
  }
}

// Every canonical indicator must have a detector registry entry: the schema contract is
// the fact envelope for that ID. Missing folders mean the registry and catalog diverged.
for (const id of canonical.keys()) {
  if (!seen.has(id)) violations.push(`${id}: canonical indicator has no packages/detectors/${id.toLowerCase()} entry`);
}

if (violations.length) {
  console.error('schemas violations:\n' + violations.map((violation) => `  - ${violation}`).join('\n'));
  process.exit(1);
}
console.log(`schemas: ok (${seen.size} detector schemas matched to ${canonical.size} canonical fact schemas)`);
