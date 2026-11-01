/** tooling/checks/documentation-structure.ts — unified catalog + compatibility structure */
// Proves the documentation migration's invariants:
//   - exactly 102 canonical unified indicator files under docs/rubric/indicators/;
//   - each file has the full ten-section skeleton, or the approved reduced form for rows
//     that can only emit `unknown`;
//   - category indexes enumerate and link every canonical file (102 unique IDs);
//   - docs/specs/ files are alias-only (ID + canonical target + deprecation notice, no
//     contract body), and docs/specs/README.md is a compatibility guide;
//   - docs/plans/ is a retirement notice plus path-level stubs that link to replacements;
//   - local Markdown links resolve.
// Run from the repository root: npm run check:documentation-structure.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const ROOT = join(import.meta.dirname ?? '.', '../..');
const RUBRIC = join(ROOT, 'docs/rubric');
const INDICATORS = join(RUBRIC, 'indicators');
const SPECS = join(ROOT, 'docs/specs');
const PLANS = join(ROOT, 'docs/plans');

const CATEGORIES = [
  { cat: 'ECOS', dir: '01_DEPENDENCY_ECOSYSTEM', index: '01_DEPENDENCY_ECOSYSTEM.md' },
  { cat: 'ARCH', dir: '02_ARCHITECTURE_CODE', index: '02_ARCHITECTURE_CODE.md' },
  { cat: 'TEST', dir: '03_TESTING_QUALITY', index: '03_TESTING_QUALITY.md' },
  { cat: 'SEC', dir: '04_SECURITY_COMPLIANCE', index: '04_SECURITY_COMPLIANCE.md' },
  { cat: 'DATA', dir: '05_DATA_SCHEMA', index: '05_DATA_SCHEMA.md' },
  { cat: 'API', dir: '06_API_INTEGRATION', index: '06_API_INTEGRATION.md' },
  { cat: 'VEL', dir: '07_VELOCITY_OPERATIONAL', index: '07_VELOCITY_OPERATIONAL.md' },
  { cat: 'PERF', dir: '08_PERFORMANCE_CLOUD', index: '08_PERFORMANCE_CLOUD.md' },
  { cat: 'DOCS', dir: '09_DOCS_KNOWLEDGE', index: '09_DOCS_KNOWLEDGE.md' },
  { cat: 'FE', dir: '10_FRONTEND_CLIENT', index: '10_FRONTEND_CLIENT.md' },
];

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
// 1. Canonical indicator files
// ---------------------------------------------------------------------------
const canonical = new Map<string, { path: string; text: string; cat: string }>();
for (const { cat, dir, index } of CATEGORIES) {
  const categoryDir = join(INDICATORS, dir);
  if (!existsSync(categoryDir)) {
    violations.push(`missing canonical directory docs/rubric/indicators/${dir}`);
    continue;
  }
  const files = readdirSync(categoryDir).filter((file) => file.endsWith('.md')).sort();
  if (!files.length) violations.push(`docs/rubric/indicators/${dir} has no indicator files`);
  for (const file of files) {
    const path = join(categoryDir, file);
    const text = read(path);
    const heading = text.match(/^#\s+([A-Z]+-\d+)\s+[—-]\s+([^\n]+)$/m);
    if (!heading) {
      violations.push(`${relative(path)}: missing "# <ID> — <Name>" heading`);
      continue;
    }
    const id = heading[1];
    if (!file.startsWith(`${id}_`)) violations.push(`${relative(path)}: filename does not start with ${id}_`);
    if (id.split('-')[0] !== cat) violations.push(`${relative(path)}: ${id} is not a ${cat} indicator`);
    if (canonical.has(id)) violations.push(`${relative(path)}: duplicate canonical ID ${id} (also ${relative(canonical.get(id)!.path)})`);
    canonical.set(id, { path, text, cat });

    // Skeleton: full form, or the approved reduced form for unknown-only rows.
    const reduced = isReduced(text);
    const required = reduced ? REDUCED_FIELDS : FULL_FIELDS;
    if (!reduced) {
      for (const headingText of FULL_SECTIONS) {
        if (!text.includes(headingText)) violations.push(`${relative(path)}: missing required section "${headingText}"`);
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
// 2. Category indexes: exactly the canonical IDs of that category, each linked.
// ---------------------------------------------------------------------------
let indexed = 0;
for (const { cat, dir, index } of CATEGORIES) {
  const indexPath = join(RUBRIC, index);
  if (!existsSync(indexPath)) {
    violations.push(`missing category index docs/rubric/${index}`);
    continue;
  }
  const text = read(indexPath);
  const indexIds = [...text.matchAll(/^\|\s*([A-Z]+-\d+)\s*\|/gm)].map((match) => match[1]);
  const expectedIds = [...canonical.entries()].filter(([, value]) => value.cat === cat).map(([id]) => id);
  if (indexIds.join(',') !== expectedIds.join(',')) {
    violations.push(`${index}: index IDs [${indexIds.join(',')}] do not match canonical ${cat} files [${expectedIds.join(',')}]`);
  }
  for (const id of expectedIds) {
    const file = canonical.get(id)!.path.slice(join(INDICATORS, dir).length + 1);
    if (!text.includes(`./indicators/${dir}/${file}`)) violations.push(`${index}: missing link to ${id} (${file})`);
    indexed++;
  }
  if (/^###\s+[A-Z]+-\d+\s+[—-]\s+/m.test(text)) violations.push(`${index}: category index contains a full indicator entry — the canonical body must live in indicators/`);
}
if (indexed !== 102) violations.push(`category indexes enumerate ${indexed} IDs, expected 102`);

// ---------------------------------------------------------------------------
// 3. docs/specs compatibility aliases
// ---------------------------------------------------------------------------
const ALIAS_FORBIDDEN = [
  '## 0. Identity', '## 1. Inputs', '## 2. Detection recipe', '## 3. Fact schema',
  '## 4. Statusing', '## 5. Score mapping', '## 6. Gate hooks',
  '## 7. Failure', '## 8. Evidence string', '## 9. Scope',
  '## 7. Fact schema', '## 8. Status and score mapping',
];
if (!existsSync(join(SPECS, 'README.md'))) {
  violations.push('docs/specs/README.md compatibility guide is missing');
} else {
  const guide = read(join(SPECS, 'README.md'));
  if (!/compatib/i.test(guide) || !guide.includes('docs/rubric/indicators/')) {
    violations.push('docs/specs/README.md is not a compatibility guide pointing at docs/rubric/indicators/');
  }
}
let aliases = 0;
const aliasIds = new Set<string>();
for (const { dir } of CATEGORIES) {
  const specDir = join(SPECS, dir);
  if (!existsSync(specDir)) {
    violations.push(`missing compatibility alias directory docs/specs/${dir}`);
    continue;
  }
  for (const file of readdirSync(specDir).filter((entry) => entry.endsWith('.md'))) {
    const path = join(specDir, file);
    const text = read(path);
    const id = text.match(/^ID:\s*([A-Z]+-\d+)$/m)?.[1];
    if (!id) {
      violations.push(`${relative(path)}: alias is missing an "ID: <ID>" line`);
      continue;
    }
    aliases++;
    aliasIds.add(id);
    const target = text.match(/^Canonical target:\s*`([^`]+)`$/m)?.[1];
    if (!target) {
      violations.push(`${relative(path)}: alias is missing "Canonical target: <path>"`);
    } else {
      const absoluteTarget = join(ROOT, target);
      if (!existsSync(absoluteTarget)) violations.push(`${relative(path)}: canonical target does not exist — ${target}`);
      else if (!absoluteTarget.startsWith(INDICATORS)) violations.push(`${relative(path)}: canonical target is outside docs/rubric/indicators/ — ${target}`);
      const canonicalEntry = canonical.get(id);
      if (canonicalEntry && relative(canonicalEntry.path) !== target) violations.push(`${relative(path)}: ${id} points at ${target}, expected ${relative(canonicalEntry.path)}`);
    }
    if (!/deprecat/i.test(text) || !/compatibility alias/i.test(text)) {
      violations.push(`${relative(path)}: alias must state the deprecation and compatibility-alias policy`);
    }
    for (const forbidden of ALIAS_FORBIDDEN) {
      if (text.includes(forbidden)) violations.push(`${relative(path)}: alias contains contract section "${forbidden}"`);
    }
    if (text.split('\n').length > 25) violations.push(`${relative(path)}: alias is longer than 25 lines — contract content may have crept in`);
  }
}
if (aliases !== 102) violations.push(`expected 102 compatibility aliases under docs/specs/, found ${aliases}`);
for (const id of canonical.keys()) {
  if (!aliasIds.has(id)) violations.push(`${id}: canonical indicator has no docs/specs compatibility alias`);
}

// ---------------------------------------------------------------------------
// 4. docs/plans retirement stubs
// ---------------------------------------------------------------------------
const PLAN_STUBS = [
  '00_MASTER_INDEX.md', '01_PRODUCT_SPEC.md', '02_TRUST_SCORING_MODEL.md',
  '03_ENGINEERABILITY_MATRIX.md', '04_V1_SCOPE.md', '05_DETECTION_ENGINE_BLUEPRINT.md',
  '06_DATA_MODEL_API.md', '07_COMPETITIVE_LANDSCAPE.md', '08_SECURITY_ACCESS_MODEL.md',
  '09_MONETIZATION_TIERS.md', '10_ROADMAP.md', '11_WEBSITE_SPEC.md',
  '12_GITHUB_SURFACE_PLAN.md', '13_MVP_SLICE.md', '14_WORKFLOW_SCAN_V1.md',
  '15_PROJECT_SURFACE_V1.md', '16_PROJECT_SURFACE_V2.md',
];
if (!existsSync(join(PLANS, 'README.md'))) {
  violations.push('docs/plans/README.md retirement notice is missing');
} else {
  const notice = read(join(PLANS, 'README.md'));
  if (!/retire/i.test(notice) || !/openspec/.test(notice)) {
    violations.push('docs/plans/README.md is not a retirement notice pointing at OpenSpec/current docs');
  }
}
for (const file of PLAN_STUBS) {
  const path = join(PLANS, file);
  if (!existsSync(path)) {
    violations.push(`docs/plans/${file}: required path stub is missing`);
    continue;
  }
  const text = read(path);
  if (!/retired/i.test(text)) violations.push(`docs/plans/${file}: missing retirement marker`);
  if (!/\]\([^)]*(openspec|rubric\/|PRODUCT|apps\/|README\.md|changes\/archive)/.test(text)) {
    violations.push(`docs/plans/${file}: missing a current replacement link`);
  }
  if (text.split('\n').length > 40) violations.push(`docs/plans/${file}: stub is longer than 40 lines — plan prose may have been retained`);
}
for (const file of readdirSync(PLANS).filter((entry) => entry.endsWith('.md'))) {
  if (!PLAN_STUBS.includes(file) && file !== 'README.md') violations.push(`docs/plans/${file}: unexpected authored plan file (expected a retirement stub)`);
}

// ---------------------------------------------------------------------------
// 5. Local Markdown links
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

if (violations.length) {
  console.error('documentation-structure violations:');
  for (const violation of violations.slice(0, 60)) console.error('  - ' + violation);
  if (violations.length > 60) console.error(`  ... and ${violations.length - 60} more`);
  process.exit(1);
}
console.log(`documentation-structure: ok (${canonical.size} canonical indicators, ${aliases} aliases, ${PLAN_STUBS.length} plan stubs, ${linksChecked} local links)`);
