/**
 * tooling/lib/rubric-catalog.ts — the single derivation of the rubric's category table.
 *
 * The tree is the manifest: `docs/rubric/indicators/<NN-slug>/` carries category order,
 * `<NN-slug>/README.md` (the charter) carries the label, and the `<ID>-<slug>.md` files
 * carry indicator identity. Nothing else may restate that structure (design D2/D3/D5).
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const RUBRIC_DIR = join(import.meta.dirname ?? '.', '../..', 'docs/rubric');
export const INDICATORS_DIR = join(RUBRIC_DIR, 'indicators');
export const MODEL_DIR = join(RUBRIC_DIR, 'model');
export const SHEETS_DIR = join(RUBRIC_DIR, 'sheets');
export const CONFIG_FILE = join(MODEL_DIR, 'config.md');

/** `NN-slug`: two-digit order prefix, then lowercase kebab-case. */
export const CATEGORY_DIR_PATTERN = /^(\d{2})-([a-z0-9]+(?:-[a-z0-9]+)*)$/;
/** `<CODE>-<NN>-<slug>.md`: padded ID prefix, then lowercase kebab-case. */
export const INDICATOR_FILE_PATTERN = /^([A-Z]+-\d{2})-([a-z0-9]+(?:-[a-z0-9]+)*)\.md$/;
/** The identity heading every indicator file carries: `# <ID> — <Name>`. */
export const INDICATOR_HEADING = /^#\s+([A-Z]+-\d+)\s+[—-]\s+([^\n]+)$/m;
/** The charter heading: `# <NN> — <Label>`, optionally annotated in parentheses. */
export const CHARTER_HEADING = /^#\s+(\d{2})\s+[—-]\s+([^\n]+)$/m;

export type RubricIndicator = {
  id: string;
  name: string;
  file: string;
  path: string;
  text: string;
};

export type RubricCategory = {
  /** Two-digit order prefix carried by the directory name and by nothing else. */
  order: string;
  /** Directory name, e.g. `01-dependency-ecosystem`. */
  dir: string;
  /** Category code token from the leading ID segment, e.g. `ECOS`. */
  code: string;
  /** Category label from the charter H1, e.g. `Dependency & Ecosystem Health`. */
  label: string;
  /** Absolute path of the charter (`<dir>/README.md`). */
  charterPath: string;
  charter: string;
  indicators: RubricIndicator[];
};

/** Entries in `indicators/` that do not satisfy the layout grammar. */
export type MalformedEntry = { path: string; reason: string };

function read(path: string): string {
  return readFileSync(path, 'utf-8');
}

/** Strip a trailing parenthetical annotation from a charter H1 label. */
function charterLabel(heading: string): string {
  return heading.replace(/\s*\([^)]*\)\s*$/, '').trim();
}

/**
 * The category code is the leading token of the IDs in the directory. Taking the dominant
 * token (rather than the first file's) means one stray foreign-prefix file is reported as
 * "does not share the prefix" instead of silently redefining the whole category.
 */
function dominantCode(indicators: RubricIndicator[]): string {
  const counts = new Map<string, number>();
  for (const indicator of indicators) {
    const code = indicator.id.split('-')[0];
    counts.set(code, (counts.get(code) ?? 0) + 1);
  }
  let best = '';
  let bestCount = 0;
  for (const [code, count] of counts) {
    if (count > bestCount) {
      best = code;
      bestCount = count;
    }
  }
  return best;
}

/**
 * Derive the category table from the tree. Order comes from the `NN-` prefix (directory
 * listing is sorted, so no numeric comparator is needed), the label from the charter H1,
 * and the category code from the leading token of the indicator IDs inside the directory.
 */
export function loadCatalog(): RubricCategory[] {
  const categories: RubricCategory[] = [];
  if (!existsSync(INDICATORS_DIR)) return categories;

  const entries = readdirSync(INDICATORS_DIR).sort();
  for (const dir of entries) {
    const match = dir.match(CATEGORY_DIR_PATTERN);
    if (!match) continue;
    const categoryDir = join(INDICATORS_DIR, dir);
    const charterPath = join(categoryDir, 'README.md');
    const charter = existsSync(charterPath) ? read(charterPath) : '';
    const heading = charter.match(CHARTER_HEADING);
    const indicators: RubricIndicator[] = [];
    for (const file of readdirSync(categoryDir).sort()) {
      if (file === 'README.md' || !file.endsWith('.md')) continue;
      const path = join(categoryDir, file);
      const text = read(path);
      const title = text.match(INDICATOR_HEADING);
      indicators.push({
        id: title?.[1] ?? file.replace(/\.md$/, ''),
        name: title?.[2]?.trim() ?? '',
        file,
        path,
        text,
      });
    }
    categories.push({
      order: match[1],
      dir,
      code: dominantCode(indicators),
      label: heading ? charterLabel(heading[2]) : '',
      charterPath,
      charter,
      indicators,
    });
  }
  return categories.sort((a, b) => a.order.localeCompare(b.order));
}

/**
 * Entries under `indicators/` that the derivation silently skipped. Callers assert this is
 * empty so a typo fails loudly instead of producing a shorter category list.
 */
export function findMalformedEntries(): MalformedEntry[] {
  const malformed: MalformedEntry[] = [];
  if (!existsSync(INDICATORS_DIR)) return malformed;
  for (const entry of readdirSync(INDICATORS_DIR).sort()) {
    const path = join(INDICATORS_DIR, entry);
    if (entry.endsWith('.md')) {
      malformed.push({ path, reason: 'loose markdown file in indicators/ — no category directory owns it' });
      continue;
    }
    if (!CATEGORY_DIR_PATTERN.test(entry)) {
      malformed.push({ path, reason: 'category directory is not <NN>-<kebab-case>' });
      continue;
    }
    for (const file of readdirSync(path).sort()) {
      if (file === 'README.md') continue;
      if (!INDICATOR_FILE_PATTERN.test(file)) {
        malformed.push({ path: join(path, file), reason: 'indicator file is not <ID>-<kebab-case>.md' });
      }
    }
  }
  return malformed;
}
