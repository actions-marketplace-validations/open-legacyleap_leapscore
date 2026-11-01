/** tooling/checks/diagrams.ts — the committed diagram set is curated, paired, and pinned (documentation-structure spec) */
// Architecture diagrams live under docs/diagrams/ as matched <type>-<slug>.html/.json pairs.
// This guard enforces only what is readable without archify (design D5):
//   1. matched stems in both directions;
//   2. no timestamp or non-kebab path segment;
//   3. no receipt-shaped filename;
//   4. the index links every pair and states the illustrative framing, the pinned revision,
//      and the regeneration command;
//   5. index revision == spec meta.repository.revision == HTML source-evidence revision;
//   6. .archify/ (the tool's working directory) is ignored;
//   7. no site route or published asset references docs/diagrams/.
// It does NOT re-render: re-rendering would make archify a repository dependency for a
// contributor-only artifact. docs/diagrams/refresh.sh is the documented regeneration path.
// Run from the repository root: npm run check:diagrams.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname ?? '.', '../..');
const DIAGRAMS = join(ROOT, 'docs/diagrams');
const INDEX = join(DIAGRAMS, 'README.md');

const TYPES = ['architecture', 'class', 'dataflow', 'erd', 'lifecycle', 'sequence', 'tree', 'timeline', 'waterfall', 'workflow'];
const STEM = /^(architecture|class|dataflow|erd|lifecycle|sequence|tree|timeline|waterfall|workflow)-[a-z0-9]+(?:-[a-z0-9]+)*$/;
const RECEIPT = /\.(delivery|finalize|finalize-summary|browser-check)\.json$/;
const TIMESTAMP = /-\d{8}-\d{6}/;
const NON_DIAGRAM_ENTRIES = new Set(['README.md', 'refresh.sh']);

const violations: string[] = [];

function relative(path: string): string {
  return path.startsWith(ROOT + '/') ? path.slice(ROOT.length + 1) : path;
}

// ---------------------------------------------------------------------------
// 1–3. Pairing, naming, receipts.
// ---------------------------------------------------------------------------
const entries = existsSync(DIAGRAMS) ? readdirSync(DIAGRAMS, { withFileTypes: true }) : [];
if (!existsSync(DIAGRAMS)) violations.push('docs/diagrams: missing — the index and its pairs are the published set');

const stems = new Set<string>();
const htmls: string[] = [];
const jsons: string[] = [];
for (const entry of entries) {
  const path = join(DIAGRAMS, entry.name);
  if (entry.isDirectory()) {
    violations.push(`${relative(path)}: stray directory — the diagram set is flat`);
    continue;
  }
  if (NON_DIAGRAM_ENTRIES.has(entry.name)) continue;

  if (RECEIPT.test(entry.name)) {
    violations.push(`${relative(path)}: delivery receipt — receipts carry machine-local paths and timestamps and are byte-bound to one render; the durable fact belongs in the index`);
    continue;
  }
  if (TIMESTAMP.test(entry.name)) {
    violations.push(`${relative(path)}: name carries a generation timestamp — the revision pin dates the content`);
    continue;
  }
  if (entry.name.endsWith('.html')) htmls.push(path);
  else if (entry.name.endsWith('.json')) jsons.push(path);
  else {
    violations.push(`${relative(path)}: unexpected file — the set is README.md, refresh.sh, and <type>-<slug>.html/.json pairs`);
    continue;
  }
  const stem = entry.name.replace(/\.(html|json)$/, '');
  if (!STEM.test(stem)) {
    violations.push(`${relative(path)}: stem "${stem}" is not <type>-<kebab-slug> with a known archify type (${TYPES.join(', ')})`);
    continue;
  }
  stems.add(stem);
}

for (const stem of stems) {
  for (const ext of ['.html', '.json']) {
    if (!existsSync(join(DIAGRAMS, stem + ext))) {
      const sibling = ext === '.html' ? '.json' : '.html';
      violations.push(`docs/diagrams/${stem}${ext}: unpaired — no same-stem ${sibling} for this pair`);
    }
  }
}
if (!htmls.length && !jsons.length) violations.push('docs/diagrams: no diagram pairs committed');

// ---------------------------------------------------------------------------
// 4–5. The index: completeness, required statements, revision agreement.
// ---------------------------------------------------------------------------
type Pair = { stem: string; type: string; specRevision: string; htmlRevision: string };
const pairs: Pair[] = [];
for (const path of jsons) {
  const stem = path.slice(DIAGRAMS.length + 1).replace(/\.json$/, '');
  let spec: any;
  try {
    spec = JSON.parse(readFileSync(path, 'utf-8'));
  } catch (error) {
    violations.push(`${relative(path)}: unreadable spec JSON (${(error as Error).message})`);
    continue;
  }
  const revision = spec?.meta?.repository?.revision;
  if (typeof revision !== 'string' || !/^[0-9a-f]{7,40}$/.test(revision)) {
    violations.push(`${relative(path)}: meta.repository.revision is missing or not a git revision`);
    continue;
  }
  const htmlPath = join(DIAGRAMS, stem + '.html');
  if (!existsSync(htmlPath)) continue; // reported as unpaired above
  const html = readFileSync(htmlPath, 'utf-8');
  const evidence = html.match(/archify-source-evidence-data"\s+type="application\/json">([\s\S]*?)<\/script>/)?.[1];
  let htmlRevision: string | undefined;
  if (evidence) {
    try {
      htmlRevision = JSON.parse(evidence)?.repository?.revision;
    } catch {
      violations.push(`${relative(htmlPath)}: embedded source evidence is not valid JSON`);
    }
  }
  if (!htmlRevision) {
    violations.push(`${relative(htmlPath)}: missing archify source-evidence revision — the committed viewer must carry the revision it was verified against`);
    continue;
  }
  if (htmlRevision !== revision) {
    violations.push(`${relative(htmlPath)}: source-evidence revision ${htmlRevision} disagrees with ${relative(path)} meta.repository.revision ${revision}`);
  }
  pairs.push({ stem, type: stem.slice(0, stem.indexOf('-')), specRevision: revision, htmlRevision });
}

const index = existsSync(INDEX) ? readFileSync(INDEX, 'utf-8') : null;
if (index == null) {
  violations.push('docs/diagrams/README.md: missing index — every committed pair must be linked and dated');
} else {
  if (!/illustrative/i.test(index) || !/not a requirements source/i.test(index)) {
    violations.push('docs/diagrams/README.md: does not state the illustrative, not-a-requirements-source framing');
  }
  if (!/refresh\.sh/.test(index)) {
    violations.push('docs/diagrams/README.md: does not state the regeneration command (refresh.sh)');
  }

  const indexRows = new Map<string, string | null>();
  for (const line of index.split('\n')) {
    for (const pair of pairs) {
      if (!line.includes(`](./${pair.stem}.html)`)) continue;
      const revisionCell = line
        .split('|')
        .map((cell) => cell.trim())
        .find((cell) => /^`[0-9a-f]{7,40}`$/.test(cell));
      indexRows.set(pair.stem, revisionCell ? revisionCell.replace(/`/g, '') : null);
    }
  }

  for (const stem of stems) {
    for (const ext of ['.html', '.json']) {
      if (!index.includes(`](./${stem}${ext})`)) {
        violations.push(`docs/diagrams/README.md: does not link ${stem}${ext} — every committed pair is indexed`);
      }
    }
  }
  for (const pair of pairs) {
    if (!indexRows.has(pair.stem)) {
      violations.push(`docs/diagrams/README.md: no revision row for ${pair.stem} — the index restates each diagram's pin`);
      continue;
    }
    const row = indexRows.get(pair.stem);
    if (row == null) {
      violations.push(`docs/diagrams/README.md: row for ${pair.stem} has no revision — state the pinned revision`);
      continue;
    }
    if (!pair.specRevision.startsWith(row)) {
      violations.push(`docs/diagrams/README.md: ${pair.stem} index revision ${row} disagrees with spec ${pair.specRevision}`);
    }
  }
}

// ---------------------------------------------------------------------------
// 6. The working directory stays ignored.
// ---------------------------------------------------------------------------
const gitignorePath = join(ROOT, '.gitignore');
const ignoreLines = existsSync(gitignorePath)
  ? readFileSync(gitignorePath, 'utf-8').split('\n').map((line) => line.trim())
  : [];
if (!ignoreLines.some((line) => line === '.archify/' || line === '.archify' || line === '/.archify/' || line === '/.archify')) {
  violations.push('.gitignore: .archify/ is not ignored — the archify working directory would become committable; restore the ignore rule');
}

// ---------------------------------------------------------------------------
// 7. Contributor-only: the site never references or publishes the set.
// ---------------------------------------------------------------------------
const SITE = join(ROOT, 'apps/site');
const published = join(SITE, 'public/diagrams');
if (existsSync(published)) {
  violations.push(`${relative(published)}: published asset directory — diagrams are contributor material with no public-serving contract`);
}

function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === 'out' || entry.name === 'dist') continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(path));
    else if (/\.(ts|tsx|js|jsx|mjs|json|md|css)$/.test(entry.name)) out.push(path);
  }
  return out;
}
for (const file of walk(SITE)) {
  const text = readFileSync(file, 'utf-8');
  if (text.includes('docs/diagrams')) {
    violations.push(`${relative(file)}: site source references docs/diagrams — the diagrams are never served, linked, or published`);
  }
}

// ---------------------------------------------------------------------------
// Report.
// ---------------------------------------------------------------------------
if (violations.length) {
  console.error('diagrams violations:\n' + violations.map((v) => `  - ${v}`).join('\n'));
  process.exit(1);
}
const revision = pairs[0]?.specRevision.slice(0, 7) ?? 'none';
console.log(`diagrams: ok (${pairs.length} pairs, ${pairs.length} index rows, ${revision} pinned, .archify/ ignored, site-clean)`);
