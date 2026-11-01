/** tooling/checks/documentation-structure.ts — layered rubric catalog + docs-tree structure */
// Proves the documentation tree's invariants:
//   - docs/rubric/ holds exactly three layers (indicators/, model/, sheets/) plus its README;
//   - ten category directories, contiguous 01–10, each with a charter and ≥1 indicator;
//   - exactly 102 canonical indicator files under docs/rubric/indicators/<NN-slug>/;
//   - each file has the full ten-section skeleton, or the approved reduced form for rows
//     that can only emit `unknown`, and declares its §1–§4 / §5–§10 half boundary;
//   - each category charter enumerates and links every canonical file (102 unique IDs);
//   - generated documents live only in sheets/, and carry a provenance header;
//   - no path in docs/ is a redirect-only alias or a retired path stub;
//   - local Markdown links resolve;
//   - repository paths cited in openspec/specs/ resolve (and line suffixes land inside the file).
// Run from the repository root: npm run check:documentation-structure.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import {
  INDICATORS_DIR as INDICATORS,
  MODEL_DIR,
  RUBRIC_DIR as RUBRIC,
  SHEETS_DIR,
  findMalformedEntries,
  loadCatalog,
} from '../lib/rubric-catalog';

const ROOT = join(import.meta.dirname ?? '.', '../..');

/** The category table is derived from the tree; nothing here restates it (design D5). */
const CATEGORIES = loadCatalog();

const FULL_SECTIONS = [
  '## 1. Identity',
  '## 2. Definition and impact',
  '## 3. Scoring semantics',
  '## 4. Remediation',
  '## 5. Applicability and inputs',
  '## 6. Detection recipe',
  '## 7. Fact schema',
  '## 8. Status and score mapping',
  '## 9. Gate, failure, and budget behavior',
  '## 10. Evidence and output',
];

const IDENTITY_FIELDS = [
  'ID', 'Name', 'Category', 'Engine tier', 'Default status', 'v1 flag',
  'Gates fed', 'Rollup / deep-dive', 'Verify effort',
];

const FULL_FIELDS: Array<{ section: string; fields: string[] }> = [
  { section: '## 2. Definition and impact', fields: ['Definition', 'Why', 'Where', 'Objective metric', 'Yellow flag', 'Red flag', 'Example symptom', 'Blast radius'] },
  { section: '## 3. Scoring semantics', fields: ['Scoring criteria'] },
  { section: '## 4. Remediation', fields: ['Remediation playbook', 'Gold standard'] },
  { section: '## 5. Applicability and inputs', fields: ['Planes', 'Tools', 'Applicability'] },
  { section: '## 6. Detection recipe', fields: ['Detection'] },
  { section: '## 7. Fact schema', fields: ['{'] },
  { section: '## 8. Status and score mapping', fields: ['Statusing rules', 'Score mapping'] },
  { section: '## 9. Gate, failure, and budget behavior', fields: ['Gate hooks', 'Failure and budget semantics'] },
  { section: '## 10. Evidence and output', fields: ['Evidence string', 'Scope/overlaps'] },
];

// Reduced rows ship Identity + emission text + Scope echo; they declare an unknown-only
// contract and must not invent a score path.
const REDUCED_FIELDS: Array<{ section: string; fields: string[] }> = [
  { section: '## 1. Identity', fields: ['ID', 'Name', 'Engine tier', 'Default status', 'Verify effort'] },
  { section: '## 10. Evidence and output', fields: ['Report-facing emission text', 'Scope/overlaps'] },
];

/** The provenance marker every generated rubric document must carry. */
const GENERATED_MARKER = 'GENERATED FILE — do not hand-edit';

const violations: string[] = [];

function read(path: string): string {
  return readFileSync(path, 'utf-8');
}

function relative(path: string): string {
  return path.slice(ROOT.length + 1);
}

function sectionBody(text: string, heading: string): string {
  const start = text.indexOf(heading);
  if (start === -1) return '';
  const rest = text.slice(start + heading.length);
  const next = rest.search(/\n## /);
  return (next === -1 ? rest : rest.slice(0, next)).trim();
}

function identityField(text: string, field: string): string {
  return text.match(new RegExp(`^\\|\\s*${field}\\s*\\|\\s*([^|]*?)\\s*\\|\\s*$`, 'm'))?.[1]?.trim() ?? '';
}

function isReduced(text: string): boolean {
  const status = sectionBody(text, '## 8. Status and score mapping');
  return /unknown_when:\s*always/i.test(status) || /measured_when:\s*never/i.test(status);
}

// ---------------------------------------------------------------------------
// 0. Tree shape: three layers, ten contiguous categories, kebab-case paths.
// ---------------------------------------------------------------------------
if (!existsSync(RUBRIC)) violations.push('missing docs/rubric');
for (const [label, path] of [['indicators/', INDICATORS], ['model/', MODEL_DIR], ['sheets/', SHEETS_DIR]] as const) {
  if (!existsSync(path)) violations.push(`missing rubric layer ${label} (docs/rubric/${label})`);
}

if (existsSync(RUBRIC)) {
  const allowed = new Set(['README.md', 'indicators', 'model', 'sheets']);
  for (const entry of readdirSync(RUBRIC)) {
    if (allowed.has(entry)) continue;
    violations.push(`docs/rubric/${entry}: stray entry at the rubric root — the root holds README.md and the three layer directories only (a numbered file, ordering manifest, or stray document would duplicate structure the tree already carries)`);
  }
}

for (const malformed of findMalformedEntries()) {
  violations.push(`${relative(malformed.path)}: ${malformed.reason}`);
}

const expectedOrder = Array.from({ length: 10 }, (_, index) => String(index + 1).padStart(2, '0'));
const actualOrder = CATEGORIES.map((category) => category.order);
if (actualOrder.join(',') !== expectedOrder.join(',')) {
  violations.push(`category directories [${actualOrder.join(',')}] must be exactly the contiguous 01–10 directories (a gap or an eleventh category is a malformed tree)`);
}
for (const category of CATEGORIES) {
  if (!category.charter) violations.push(`docs/rubric/indicators/${category.dir}: missing category charter README.md`);
  if (!category.indicators.length) violations.push(`docs/rubric/indicators/${category.dir}: category has no indicator files`);
  if (!category.code) violations.push(`docs/rubric/indicators/${category.dir}: cannot derive a category code (no indicator files)`);
  for (const indicator of category.indicators) {
    if (indicator.id.split('-')[0] !== category.code) {
      violations.push(`${relative(indicator.path)}: ${indicator.id} does not share the ${category.code} prefix of its directory`);
    }
  }
}

// ---------------------------------------------------------------------------
// 1. Canonical indicator files: skeleton, identity, half boundary.
// ---------------------------------------------------------------------------
const canonical = new Map<string, { path: string; text: string; code: string }>();
for (const category of CATEGORIES) {
  for (const indicator of category.indicators) {
    const path = indicator.path;
    const text = indicator.text;
    const heading = text.match(/^#\s+([A-Z]+-\d+)\s+[—-]\s+([^\n]+)$/m);
    if (!heading) {
      violations.push(`${relative(path)}: missing "# <ID> — <Name>" heading`);
      continue;
    }
    const id = heading[1];
    // Identity is carried by the filename prefix and by nothing else (design D3).
    const fileId = indicator.file.split('-').slice(0, 2).join('-');
    if (fileId !== id) violations.push(`${relative(path)}: filename prefix ${fileId} does not match heading ID ${id}`);
    if (canonical.has(id)) violations.push(`${relative(path)}: duplicate canonical ID ${id} (also ${relative(canonical.get(id)!.path)})`);
    canonical.set(id, { path, text, code: category.code });

    // Skeleton: full form, or the approved reduced form for unknown-only rows.
    const reduced = isReduced(text);
    const required = reduced ? REDUCED_FIELDS : FULL_FIELDS;
    if (!reduced) {
      for (const headingText of FULL_SECTIONS) {
        if (!text.includes(headingText)) violations.push(`${relative(path)}: missing required section "${headingText}"`);
      }
      // The two halves must be declared, not split: §1–§4 semantics, §5–§10 detector contract.
      if (!/§1[–-]§4\s+carry rubric semantics/i.test(text) || !/§5[–-]§10\s+carry the detector contract/i.test(text)) {
        violations.push(`${relative(path)}: full-form indicator does not declare its §1–§4 / §5–§10 half boundary`);
      }
    } else {
      if (!text.includes('## 1. Identity')) violations.push(`${relative(path)}: reduced form requires §1 Identity`);
      if (!text.includes('## 10. Evidence and output')) violations.push(`${relative(path)}: reduced form requires §10 Evidence and output`);
    }
    for (const field of IDENTITY_FIELDS) {
      if (!identityField(text, field)) violations.push(`${relative(path)}: identity table is missing "${field}"`);
    }
    for (const { section, fields } of required) {
      const body = sectionBody(text, section);
      if (!body) {
        violations.push(`${relative(path)}: required section "${section}" is empty`);
        continue;
      }
      for (const field of fields) {
        if (!body.includes(field)) violations.push(`${relative(path)}: "${section}" is missing "${field}"`);
      }
    }
    if (reduced && /^\s*(thresholds?|score mapping predicates)\s*:/im.test(sectionBody(text, '## 3. Scoring semantics')) && /unknown_when:\s*always/i.test(sectionBody(text, '## 8. Status and score mapping'))) {
      // Reduced rows may cite criteria, but must not claim a measurable score path.
      if (/\bmeasured_when:\s*(?!never)/i.test(sectionBody(text, '## 8. Status and score mapping'))) {
        violations.push(`${relative(path)}: reduced row claims a measured path`);
      }
    }
  }
}
if (canonical.size !== 102) violations.push(`expected exactly 102 canonical indicators, found ${canonical.size}`);

// ---------------------------------------------------------------------------
// 2. Category charters: exactly the canonical IDs of that directory, each linked.
// ---------------------------------------------------------------------------
let indexed = 0;
for (const category of CATEGORIES) {
  const charterPath = category.charterPath;
  if (!existsSync(charterPath)) continue; // reported by the tree-shape pass above
  const text = read(charterPath);
  const charterIds = [...text.matchAll(/^\|\s*([A-Z]+-\d+)\s*\|/gm)].map((match) => match[1]);
  const expectedIds = [...canonical.entries()].filter(([, value]) => value.code === category.code).map(([id]) => id);
  if (charterIds.join(',') !== expectedIds.join(',')) {
    violations.push(`${relative(charterPath)}: charter IDs [${charterIds.join(',')}] do not match canonical ${category.code} files [${expectedIds.join(',')}]`);
  }
  for (const id of expectedIds) {
    const file = basename(canonical.get(id)!.path);
    if (!text.includes(`](./${file})`)) violations.push(`${relative(charterPath)}: missing link to ${id} (${file})`);
    indexed++;
  }
  if (/^###\s+[A-Z]+-\d+\s+[—-]\s+/m.test(text)) {
    violations.push(`${relative(charterPath)}: charter contains a full indicator entry — the canonical body must live in the indicator file`);
  }
}
if (indexed !== 102) violations.push(`category charters enumerate ${indexed} IDs, expected 102`);

// ---------------------------------------------------------------------------
// 3. Layers: the entry point reaches them, and "generated" is a directory property.
// ---------------------------------------------------------------------------
const ENTRY = join(RUBRIC, 'README.md');
if (!existsSync(ENTRY)) {
  violations.push('missing rubric entry point docs/rubric/README.md');
} else {
  const entry = read(ENTRY);
  for (const layer of ['indicators/', 'model/', 'sheets/']) {
    if (!entry.includes(`](./${layer})`)) violations.push(`docs/rubric/README.md: does not link the ${layer} layer`);
  }
  for (const statement of ['what an indicator is', 'what the rubric is', 'what the rubric is not']) {
    if (!new RegExp(statement, 'i').test(entry)) violations.push(`docs/rubric/README.md: does not state ${statement.replace(/^what /, '"what ')}"`);
  }
}

// Generated documents are generated by placement, not by an in-file banner: every markdown
// file under docs/rubric/ either lives in sheets/ and carries the provenance header, or
// carries no provenance header at all.
function rubricMarkdown(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) rubricMarkdown(path, out);
    else if (entry.name.endsWith('.md')) out.push(path);
  }
  return out;
}
for (const file of rubricMarkdown(RUBRIC)) {
  const inSheets = dirname(file) === SHEETS_DIR || dirname(file).startsWith(SHEETS_DIR + '/');
  const text = read(file);
  if (inSheets) {
    if (!text.includes(GENERATED_MARKER)) violations.push(`${relative(file)}: generated sheet is missing its provenance header naming tooling/scripts/compile-rubric.ts`);
    if (!text.includes('npm run compile:rubric')) violations.push(`${relative(file)}: generated sheet header does not name the regeneration command`);
  } else if (text.includes(GENERATED_MARKER)) {
    violations.push(`${relative(file)}: generated document outside sheets/ — every generated rubric document lives under docs/rubric/sheets/`);
  }
}

// ---------------------------------------------------------------------------
// 5. No redirect-only paths
// ---------------------------------------------------------------------------
// The documentation tree keeps no path whose job is to point elsewhere. The two
// grammars the retired alias and plan-stub trees used are rejected outright, so a
// future redirect layer cannot return by adding files back.
const redirectFiles: string[] = [];
walk(join(ROOT, 'docs'), redirectFiles);
for (const file of redirectFiles) {
  const text = read(file).replace(/```[\s\S]*?```/g, '');
  if (/^ID:\s*[A-Z]+-\d+\s*$/m.test(text) && /^Canonical target:/m.test(text)) {
    violations.push(`${relative(file)}: redirect-only alias — an ID + "Canonical target:" pointer is not documentation`);
    continue;
  }
  const heading = text.match(/^#\s+([^\n]+)$/m)?.[1] ?? '';
  if (/\bretired\b/i.test(heading)) {
    violations.push(`${relative(file)}: heading marks a retired path stub — remove the path or carry its content, do not redirect`);
  }
}

// ---------------------------------------------------------------------------
// 6. Local Markdown links
// ---------------------------------------------------------------------------
const LINK_ROOTS = [
  join(ROOT, 'docs'),
  join(ROOT, 'README.md'),
  join(ROOT, 'AGENTS.md'),
  join(ROOT, 'CONTRIBUTING.md'),
];
for (const entry of ['apps', 'packages', 'action']) {
  const dir = join(ROOT, entry);
  if (!existsSync(dir)) continue;
  for (const child of readdirSync(dir, { withFileTypes: true })) {
    if (!child.isDirectory()) continue;
    const readme = join(dir, child.name, 'README.md');
    if (existsSync(readme)) LINK_ROOTS.push(readme);
  }
}

function walk(path: string, files: string[]): void {
  if (!existsSync(path)) return;
  const stat = statSync(path);
  if (stat.isFile()) {
    if (path.endsWith('.md')) files.push(path);
    return;
  }
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === 'dist') continue;
    walk(join(path, entry.name), files);
  }
}

let linksChecked = 0;
for (const root of LINK_ROOTS) {
  const files: string[] = [];
  walk(root, files);
  for (const file of files) {
    // Links inside fenced code blocks are examples/snippets, not documentation links.
    const text = read(file).replace(/```[\s\S]*?```/g, '');
    for (const match of text.matchAll(/\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
      const href = match[1];
      if (/^(https?:|mailto:|#)/.test(href)) continue;
      const target = href.split('#')[0];
      if (!target) continue;
      linksChecked++;
      const resolved = target.startsWith('/') ? join(ROOT, target) : resolve(dirname(file), target);
      if (!existsSync(resolved)) violations.push(`${relative(file)}: broken local link ${href}`);
    }
  }
}

// ---------------------------------------------------------------------------
// 7. Citations in current specifications
// ---------------------------------------------------------------------------
// A code span that names a repository path inside openspec/specs/** must resolve,
// and a :NN (or :NN-MM) line suffix must land inside the cited file. Archived
// changes are exempt because they record the tree as it was. Only backticked
// spans under a known repository root are citations; fenced blocks, globs, path
// templates (`<...>`), and URLs are examples, not references.
const CITATION_ROOTS = ['docs/', 'apps/', 'packages/', 'openspec/', 'action/', 'tooling/'];
let citationsChecked = 0;
const specFiles: string[] = [];
walk(join(ROOT, 'openspec/specs'), specFiles);
for (const file of specFiles) {
  const text = read(file).replace(/```[\s\S]*?```/g, '');
  for (const match of text.matchAll(/`([^`\n]+)`/g)) {
    const span = match[1].trim();
    if (!CITATION_ROOTS.some((prefix) => span.startsWith(prefix))) continue;
    if (/[*?{}<>\s]|\.\.\./.test(span)) continue;
    const [, rawPath, rawSuffix] = span.match(/^([^:]+)(?::(.+))?$/) ?? [];
    const target = (rawPath ?? span).replace(/[.,;]+$/, '');
    // A :NN or :NN-MM suffix is a line citation; any other suffix is a symbol anchor.
    const lines = rawSuffix && /^\d+(?:-\d+)?$/.test(rawSuffix) ? rawSuffix : undefined;
    citationsChecked++;
    const absolute = join(ROOT, target);
    if (!existsSync(absolute)) {
      violations.push(`${relative(file)}: citation does not resolve — ${span}`);
      continue;
    }
    if (!lines) continue;
    const lastLine = Number(lines.split('-').pop());
    const length = read(absolute).split('\n').length;
    if (lastLine > length) violations.push(`${relative(file)}: citation ${span} points past the end of ${target} (${length} lines)`);
  }
}

if (violations.length) {
  console.error('documentation-structure violations:');
  for (const violation of violations.slice(0, 60)) console.error('  - ' + violation);
  if (violations.length > 60) console.error(`  ... and ${violations.length - 60} more`);
  process.exit(1);
}
console.log(`documentation-structure: ok (${canonical.size} canonical indicators, ${redirectFiles.length} docs files, ${citationsChecked} citations, ${linksChecked} local links)`);
