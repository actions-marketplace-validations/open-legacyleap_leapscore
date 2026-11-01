/** tooling/scripts/compile-rubric.ts — canonical markdown -> apps/scanner rubric.json + generated registry */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createHash } from 'node:crypto';

const ROOT = join(import.meta.dirname ?? '.', '../..');
const RUBRIC_DIR = join(ROOT, 'docs/rubric');
const INDICATORS_DIR = join(RUBRIC_DIR, 'indicators');
const OUT_JSON = join(ROOT, 'apps/scanner/src/scan/scoring/rubric.json');
const OUT_TS = join(ROOT, 'apps/site/lib/generated/rubric.ts');

type Remediation = {
  quick_win: string;
  structural: string;
  gold_standard: string;
  effort: string;
};

type Indicator = {
  id: string;
  category: string;
  name: string;
  tier: string;
  default_status: string;
  effort: string;
  raw_effort: string;
  remediation: Remediation;
};

const CATEGORY_FILES: Array<{ file: string; dir: string; cat: string; label: string }> = [
  { file: '01_DEPENDENCY_ECOSYSTEM.md', dir: '01_DEPENDENCY_ECOSYSTEM', cat: 'ECOS', label: 'Dependency & Ecosystem Health' },
  { file: '02_ARCHITECTURE_CODE.md', dir: '02_ARCHITECTURE_CODE', cat: 'ARCH', label: 'Architecture & Code Quality' },
  { file: '03_TESTING_QUALITY.md', dir: '03_TESTING_QUALITY', cat: 'TEST', label: 'Testing & Quality Engineering' },
  { file: '04_SECURITY_COMPLIANCE.md', dir: '04_SECURITY_COMPLIANCE', cat: 'SEC', label: 'Security, Compliance & Vulnerability' },
  { file: '05_DATA_SCHEMA.md', dir: '05_DATA_SCHEMA', cat: 'DATA', label: 'Data & Schema Evolution' },
  { file: '06_API_INTEGRATION.md', dir: '06_API_INTEGRATION', cat: 'API', label: 'API & Integration Surface' },
  { file: '07_VELOCITY_OPERATIONAL.md', dir: '07_VELOCITY_OPERATIONAL', cat: 'VEL', label: 'Developer Velocity & Operational Drag' },
  { file: '08_PERFORMANCE_CLOUD.md', dir: '08_PERFORMANCE_CLOUD', cat: 'PERF', label: 'Performance & Cloud/Infrastructure Fit' },
  { file: '09_DOCS_KNOWLEDGE.md', dir: '09_DOCS_KNOWLEDGE', cat: 'DOCS', label: 'Documentation & Knowledge Continuity' },
  { file: '10_FRONTEND_CLIENT.md', dir: '10_FRONTEND_CLIENT', cat: 'FE', label: 'Frontend & Client Health' },
];

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(CATEGORY_FILES.map(f => [f.cat, f.label]));

/** Read one field from the §1 Identity table (`| field | value |`). */
function identityField(text: string, field: string): string {
  const match = text.match(new RegExp(`^\\|\\s*${field}\\s*\\|\\s*([^|]*?)\\s*\\|\\s*$`, 'm'));
  return match ? match[1].trim() : '';
}

function numericId(id: string): number {
  return parseInt(id.split('-')[1] ?? '0', 10);
}

/**
 * Enumerate the canonical unified indicator files under docs/rubric/indicators/ in
 * deterministic category/numeric order. Each file is the single source of identity,
 * remediation, and the implementation contract; the category pages are navigation only.
 */
function parseIndicators(): Indicator[] {
  const indicators: Indicator[] = [];
  for (const { dir, cat } of CATEGORY_FILES) {
    const categoryDir = join(INDICATORS_DIR, dir);
    const files = readdirSync(categoryDir)
      .filter((file) => file.endsWith('.md'))
      .sort((a, b) => numericId(a) - numericId(b));
    for (const file of files) {
      const text = readFileSync(join(categoryDir, file), 'utf-8');
      // H1 like "# ECOS-01 — Runtime/Language EOL"
      const heading = text.match(/^#\s+([A-Z]+-\d+)\s+[—-]\s+([^\n]+)$/m);
      if (!heading) throw new Error(`${dir}/${file}: missing "# <ID> — <Name>" heading`);
      const id = heading[1].trim();
      const name = heading[2].trim();

      // tier: | Engine tier | A |
      const tier = identityField(text, 'Engine tier').match(/\b([A-D])\b/)?.[1] ?? 'B';
      const statusValue = identityField(text, 'Default status');
      const default_status = (statusValue.match(/\b(measured|estimated|unknown)\b/)?.[1] ?? 'unknown').toLowerCase();
      const effortValue = identityField(text, 'Verify effort');
      let raw = effortValue.split('—')[0].trim();
      // Normalize effort to symbols
      let effort = raw;
      if (raw.includes('⚡')) effort = '⚡ ≤30 min';
      else if (raw.includes('🔶')) effort = '🔶 ~2–4 h';
      else if (raw.includes('🔷')) effort = '🔷 ~1–2 days';

      // Parse remediation playbook: "Quick win: ... Structural fix: ..." + Gold standard
      let quick_win = '';
      let structural = '';
      let gold_standard = '';
      let fallback = false;
      const playbookMatch = text.match(/\*\*Remediation playbook:\*\*\s*([\s\S]*?)(?=\n- \*\*Gold|\n- \*\*Scoring|\n###\s+[A-Z]+-\d+|\n##\s|$)/);
      if (playbookMatch) {
        const rawPlaybook = playbookMatch[1].replace(/\s+/g, ' ').trim();
        // Try split on Quick win: ... Structural fix: ...
        const qwSplit = rawPlaybook.match(/Quick\s*win\s*:\s*(.*?)(?:\s*Structural\s*fix\s*:\s*(.*))?$/i);
        if (qwSplit && qwSplit[1]) {
          quick_win = qwSplit[1].trim();
          structural = (qwSplit[2] ?? '').trim();
          // If quick_win captured but structural marker was absent and raw contained Structural, it would be in quick_win — detect
          if (!structural && /Structural\s*fix\s*:/i.test(rawPlaybook)) {
            const alt = rawPlaybook.split(/Structural\s*fix\s*:/i);
            if (alt.length === 2) {
              quick_win = alt[0].replace(/^\s*Quick\s*win\s*:\s*/i, '').trim();
              structural = alt[1].trim();
            }
          }
        } else if (/Structural\s*fix\s*:/i.test(rawPlaybook)) {
          const parts = rawPlaybook.split(/Structural\s*fix\s*:/i);
          if (parts.length === 2) {
            quick_win = parts[0].replace(/^\s*Quick\s*win\s*:\s*/i, '').trim();
            structural = parts[1].trim();
          } else {
            quick_win = rawPlaybook;
            fallback = true;
          }
        } else {
          quick_win = rawPlaybook;
          if (quick_win.length > 10 && !/Quick\s*win/i.test(quick_win)) fallback = true;
        }
      } else {
        fallback = true;
      }
      const goldMatch = text.match(/\*\*Gold standard[^:]*:\*\*\s*([^\n]+)/);
      if (goldMatch) gold_standard = goldMatch[1].trim();
      if (fallback && quick_win) {
        // still keep playbook as quick_win, warn later in doCheck
      }
      const remediation: Remediation = { quick_win, structural, gold_standard, effort };
      indicators.push({ id, category: id.split('-')[0] ?? cat, name, tier, default_status, effort, raw_effort: raw, remediation });
    }
  }
  // Sort by category order then numeric
  const catOrder = CATEGORY_FILES.map(f => f.cat);
  indicators.sort((a, b) => {
    const ai = catOrder.indexOf(a.category);
    const bi = catOrder.indexOf(b.category);
    if (ai !== bi) return ai - bi;
    return numericId(a.id) - numericId(b.id);
  });
  return indicators;
}

function buildWeights() {
  // keep canonical from 11_WEIGHTS_THRESHOLDS_CONFIG.md — hardcoded but validated by consistency check
  return {
    base: { SEC: 20, ARCH: 15, ECOS: 10, TEST: 10, DATA: 10, API: 10, VEL: 10, PERF: 10, DOCS: 5 },
    feActive: { SEC: 18, ARCH: 13.5, ECOS: 9, TEST: 9, DATA: 9, API: 9, VEL: 9, PERF: 9, DOCS: 4.5, FE: 10 },
  };
}

function buildApplicability(): Record<string, Record<string, 'required' | 'relevant' | 'irrelevant'>> {
  // Per-indicator tier per archetype. Default for any unlisted pair is 'relevant' (see spec: "Default for any unlisted indicator/archetype pair SHALL be relevant").
  // 'required' = never N/A, 'relevant' = N/A iff plane absent + exhaustive proof, 'irrelevant' = always N/A for that archetype.
  const table: Record<string, Record<string, 'required' | 'relevant' | 'irrelevant'>> = {};

  const requiredIds = ['SEC-02', 'SEC-01', 'ECOS-05', 'ECOS-01'];
  for (const id of requiredIds) {
    table[id] = { library: 'required', service: 'required', cli: 'required', infra: 'required', docs: 'required', 'agent-skills': 'required', mixed: 'required', unknown: 'required' };
  }

  // docs: API, DATA, PERF are irrelevant (no server/data/deploy planes expected)
  const docsIrrelevant = [
    ...Array.from({ length: 10 }, (_, i) => `API-${String(i + 1).padStart(2, '0')}`),
    ...Array.from({ length: 10 }, (_, i) => `DATA-${String(i + 1).padStart(2, '0')}`),
    ...Array.from({ length: 10 }, (_, i) => `PERF-${String(i + 1).padStart(2, '0')}`),
    'VEL-03', 'VEL-04',
  ];
  for (const id of docsIrrelevant) {
    if (requiredIds.includes(id)) continue;
    table[id] = { ...(table[id] ?? {}), docs: 'irrelevant' };
  }

  // agent-skills: same as docs plus infra-heavy PERF/DATA
  const agentIrrelevant = [
    ...Array.from({ length: 10 }, (_, i) => `DATA-${String(i + 1).padStart(2, '0')}`),
    ...Array.from({ length: 10 }, (_, i) => `PERF-${String(i + 1).padStart(2, '0')}`),
    ...Array.from({ length: 10 }, (_, i) => `API-${String(i + 1).padStart(2, '0')}`),
    'VEL-01', 'VEL-03', 'VEL-04',
  ];
  for (const id of agentIrrelevant) {
    if (requiredIds.includes(id)) continue;
    table[id] = { ...(table[id] ?? {}), 'agent-skills': 'irrelevant' };
  }

  // infra: API is largely irrelevant (infra is not a service API), DATA mostly irrelevant
  const infraIrrelevant = [
    ...Array.from({ length: 8 }, (_, i) => `API-${String(i + 1).padStart(2, '0')}`),
    'DATA-02', 'DATA-03', 'DATA-07', 'DATA-08', 'DATA-09',
  ];
  for (const id of infraIrrelevant) {
    if (requiredIds.includes(id)) continue;
    table[id] = { ...(table[id] ?? {}), infra: 'irrelevant' };
  }

  // API-01 is the explicit spec example: irrelevant for docs
  table['API-01'] = { ...(table['API-01'] ?? {}), docs: 'irrelevant' };

  return table;
}

function buildPayload(indicators: Indicator[]) {
  const weights = buildWeights();
  const applicability = buildApplicability();
  const tiers = { healthy: 80, moderate: [53, 79], highRisk: [27, 52], critical: 27 };
  const gates = ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8'];
  const rubricVersion = createHash('sha256').update(JSON.stringify(indicators)).digest('hex').slice(0, 7);
  return {
    _comment: 'COMPILED from docs/rubric/indicators/<NN_CATEGORY>/*.md + 11_WEIGHTS_THRESHOLDS_CONFIG.md — do not hand-edit. Run npm run compile:rubric.',
    rubricVersion,
    weights,
    applicability,
    tiers,
    gates,
    indicators,
    categories: CATEGORY_FILES.map(f => ({ id: f.cat, name: f.label, weight_base: (weights.base as Record<string, number>)[f.cat] ?? (f.cat === 'FE' ? 0 : 0), weight_fe: (weights.feActive as Record<string, number>)[f.cat] ?? (f.cat === 'FE' ? 10 : 0) })),
  };
}

/** Read the canonical category indexes and shared configuration, and fail on drift. */
function validateSources(indicators: Indicator[]): string[] {
  const problems: string[] = [];
  const idPattern = /^([A-Z]+)-(\d{2})$/;
  const byCategory = new Map<string, string[]>();

  // 1. Canonical file enumeration: one file per ID, category membership, filename identity.
  const seen = new Map<string, string>();
  for (const { dir, cat, file } of CATEGORY_FILES) {
    const categoryDir = join(INDICATORS_DIR, dir);
    if (!existsSync(categoryDir)) {
      problems.push(`missing canonical directory docs/rubric/indicators/${dir}`);
      continue;
    }
    const files = readdirSync(categoryDir).filter((f) => f.endsWith('.md')).sort((a, b) => numericId(a) - numericId(b));
    if (!files.length) problems.push(`docs/rubric/indicators/${dir} has no indicator files`);
    const ids: string[] = [];
    for (const canonicalFile of files) {
      const text = readFileSync(join(categoryDir, canonicalFile), 'utf-8');
      const heading = text.match(/^#\s+([A-Z]+-\d+)\s+[—-]\s+([^\n]+)$/m);
      if (!heading) {
        problems.push(`${dir}/${canonicalFile}: missing "# <ID> — <Name>" heading`);
        continue;
      }
      const id = heading[1].trim();
      const fileId = canonicalFile.split('_')[0]?.toUpperCase();
      if (!idPattern.test(id)) problems.push(`${dir}/${canonicalFile}: malformed ID ${id}`);
      if (fileId !== id) problems.push(`${dir}/${canonicalFile}: filename ID ${fileId} does not match heading ID ${id}`);
      if (id.split('-')[0] !== cat) problems.push(`${dir}/${canonicalFile}: ID ${id} does not belong to category ${cat}`);
      const previous = seen.get(id);
      if (previous) problems.push(`duplicate ID ${id}: ${previous} and ${dir}/${canonicalFile}`);
      seen.set(id, `${dir}/${canonicalFile}`);
      ids.push(id);
    }
    byCategory.set(file, ids);
  }
  if (seen.size !== 102) problems.push(`expected exactly 102 unique IDs, found ${seen.size}`);

  // 2. Unified metadata: identity fields parse, and match the compiled indicator.
  const compiled = new Map(indicators.map((indicator) => [indicator.id, indicator]));
  for (const [id, path] of seen) {
    const indicator = compiled.get(id);
    if (!indicator) {
      problems.push(`${id}: canonical file not parsed into the registry (${path})`);
      continue;
    }
    const text = readFileSync(join(INDICATORS_DIR, path), 'utf-8');
    const identity = {
      ID: identityField(text, 'ID'),
      Name: identityField(text, 'Name'),
      Tier: identityField(text, 'Engine tier'),
      Status: identityField(text, 'Default status'),
      Effort: identityField(text, 'Verify effort'),
    };
    if (identity.ID !== id) problems.push(`${path}: identity table ID "${identity.ID}" does not match ${id}`);
    if (identity.Name !== indicator.name) problems.push(`${path}: identity table name "${identity.Name}" does not match H1 "${indicator.name}"`);
    if (!/^[A-D]$/.test(identity.Tier)) problems.push(`${path}: malformed engine tier "${identity.Tier}"`);
    if (!/^(measured|estimated|unknown)$/.test(identity.Status)) problems.push(`${path}: malformed default status "${identity.Status}"`);
    if (!identity.Effort) problems.push(`${path}: missing verify effort`);
    if (indicator.tier !== identity.Tier) problems.push(`${path}: compiled tier "${indicator.tier}" does not match identity "${identity.Tier}"`);
    if (indicator.default_status !== identity.Status) problems.push(`${path}: compiled status "${indicator.default_status}" does not match identity "${identity.Status}"`);
  }

  // 3. Category indexes enumerate exactly the canonical IDs, in order.
  for (const { file, cat, dir } of CATEGORY_FILES) {
    const indexPath = join(RUBRIC_DIR, file);
    if (!existsSync(indexPath)) {
      problems.push(`missing category index ${file}`);
      continue;
    }
    const indexText = readFileSync(indexPath, 'utf-8');
    const indexIds = [...indexText.matchAll(/^\|\s*([A-Z]+-\d+)\s*\|/gm)].map((m) => m[1]);
    const canonicalIds = byCategory.get(file) ?? [];
    if (indexIds.join(',') !== canonicalIds.join(',')) {
      problems.push(`${file}: index IDs [${indexIds.join(',')}] do not match canonical ${cat} files [${canonicalIds.join(',')}]`);
    }
    for (const id of canonicalIds) {
      const slug = seen.get(id)?.split('/')[1];
      if (slug && !indexText.includes(`./indicators/${dir}/${slug}`)) problems.push(`${file}: missing link to ${slug}`);
    }
  }

  // 4. Shared configuration: weights, tiers, and gates in 11/00 match the compiled payload.
  const expected = buildPayload(indicators);
  const configText = readFileSync(join(RUBRIC_DIR, '11_WEIGHTS_THRESHOLDS_CONFIG.md'), 'utf-8');
  const weightTable = (heading: string): Record<string, number> => {
    const start = configText.indexOf(heading);
    if (start === -1) return {};
    const end = configText.indexOf('\n### ', start + 1);
    const block = configText.slice(start, end === -1 ? configText.length : end);
    const table: Record<string, number> = {};
    for (const match of block.matchAll(/^\|\s*([^|*]+?)\s*\|\s*([\d.]+)%\s*\|/gm)) {
      const label = match[1].trim();
      const category = CATEGORY_FILES.find((entry) => entry.label === label)?.cat;
      if (category) table[category] = Number(match[2]);
    }
    return table;
  };
  const base = weightTable('### Base weight set');
  const feActive = weightTable('### FE-active weight set');
  for (const { cat } of CATEGORY_FILES) {
    if (cat !== 'FE') {
      if (base[cat] == null) problems.push(`11 base weights: missing category ${cat}`);
      else if (base[cat] !== expected.weights.base[cat as keyof typeof expected.weights.base]) problems.push(`11 base weight for ${cat}: ${base[cat]} vs compiled ${expected.weights.base[cat as keyof typeof expected.weights.base]}`);
    } else if (base[cat] != null) {
      problems.push(`11 base weights: FE must be absent from the base set (FE is conditional)`);
    }
    if (feActive[cat] == null) problems.push(`11 FE-active weights: missing category ${cat}`);
    else if (feActive[cat] !== expected.weights.feActive[cat as keyof typeof expected.weights.feActive]) problems.push(`11 FE-active weight for ${cat}: ${feActive[cat]} vs compiled ${expected.weights.feActive[cat as keyof typeof expected.weights.feActive]}`);
  }
  const low = configText.match(/^\|\s*Low\s*\|\s*≥\s*(\d+)%/m)?.[1];
  const moderate = configText.match(/^\|\s*Moderate\s*\|\s*(\d+)–(\d+)%/m);
  const high = configText.match(/^\|\s*High\s*\|\s*(\d+)–(\d+)%/m);
  const critical = configText.match(/^\|\s*Critical\s*\|\s*<\s*(\d+)%/m)?.[1];
  if (Number(low) !== expected.tiers.healthy) problems.push(`11 tier threshold Low: ${low} vs compiled ${expected.tiers.healthy}`);
  if (!moderate || [Number(moderate[1]), Number(moderate[2])].join(',') !== expected.tiers.moderate.join(',')) problems.push(`11 tier threshold Moderate does not match compiled ${expected.tiers.moderate.join('–')}`);
  if (!high || [Number(high[1]), Number(high[2])].join(',') !== expected.tiers.highRisk.join(',')) problems.push(`11 tier threshold High does not match compiled ${expected.tiers.highRisk.join('–')}`);
  if (Number(critical) !== expected.tiers.critical) problems.push(`11 tier threshold Critical: ${critical} vs compiled ${expected.tiers.critical}`);
  const executive = readFileSync(join(RUBRIC_DIR, '00_EXECUTIVE_RUBRIC.md'), 'utf-8');
  const gateRows = [...executive.matchAll(/^\|\s*(G\d+)\s*\|/gm)].map((m) => m[1]);
  if (gateRows.length !== expected.gates.length || gateRows.some((gate, index) => gate !== expected.gates[index])) {
    problems.push(`00 gate roster [${gateRows.join(',')}] does not match compiled [${expected.gates.join(',')}]`);
  }

  return problems;
}

function writeJson(payload: ReturnType<typeof buildPayload>) {
  writeFileSync(OUT_JSON, JSON.stringify(payload, null, 2) + '\n', 'utf-8');
  console.log(`wrote ${OUT_JSON} (${payload.indicators.length} indicators, version ${payload.rubricVersion})`);
}

function writeGeneratedTs(indicators: Indicator[]) {
  const dir = dirname(OUT_TS);
  mkdirSync(dir, { recursive: true });
  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
  const lines: string[] = [];
  lines.push('// Generated by tooling/scripts/compile-rubric.ts — do not hand-edit. Source: docs/rubric/indicators/*');
  lines.push('export type RemediationMeta = { quick_win: string; structural: string; gold_standard: string; effort: string };');
  lines.push('export type IndicatorMeta = { id: string; category: string; name: string; tier: string; default_status: string; effort: string; remediation: RemediationMeta };');
  lines.push('export const INDICATOR_REGISTRY: Record<string, IndicatorMeta> = {');
  for (const ind of indicators) {
    lines.push(`  "${ind.id}": { id: "${ind.id}", category: "${ind.category}", name: "${esc(ind.name)}", tier: "${ind.tier}", default_status: "${ind.default_status}", effort: "${esc(ind.effort)}", remediation: { quick_win: "${esc(ind.remediation.quick_win)}", structural: "${esc(ind.remediation.structural)}", gold_standard: "${esc(ind.remediation.gold_standard)}", effort: "${esc(ind.remediation.effort)}" } },`);
  }
  lines.push('};');
  lines.push('');
  lines.push('export const CATEGORY_LABELS: Record<string, string> = {');
  for (const [k, v] of Object.entries(CATEGORY_LABELS)) {
    lines.push(`  "${k}": "${v.replace(/"/g, '\\"')}",`);
  }
  lines.push('};');
  lines.push('');
  lines.push('export const CATEGORY_ORDER = ["ECOS","ARCH","TEST","SEC","DATA","API","VEL","PERF","DOCS","FE"] as const;');
  lines.push('export function getIndicatorName(id: string): string {');
  lines.push('  const e = INDICATOR_REGISTRY[id];');
  lines.push('  if (!e) { console.warn(`Unknown indicator ${id}`); return `Unknown indicator (${id})`; }');
  lines.push('  return e.name;');
  lines.push('}');
  lines.push('export function getIndicatorEffort(id: string): string { return INDICATOR_REGISTRY[id]?.effort ?? "⚡ ≤30 min"; }');
  lines.push('export function getIndicatorRemediation(id: string) { return INDICATOR_REGISTRY[id]?.remediation ?? { quick_win: "", structural: "", gold_standard: "", effort: "⚡ ≤30 min" }; }');
  lines.push('export function getCategoryName(id: string): string { return CATEGORY_LABELS[id] ?? id; }');
  writeFileSync(OUT_TS, lines.join('\n') + '\n', 'utf-8');
  console.log(`wrote ${OUT_TS} (${indicators.length} entries)`);
}

function doCompile() {
  let indicators: Indicator[];
  try {
    indicators = parseIndicators();
  } catch (error) {
    console.error(`compile:rubric failed — cannot read canonical indicator files: ${(error as Error).message}`);
    process.exit(1);
  }
  const sourceProblems = validateSources(indicators);
  if (sourceProblems.length) {
    console.error('compile:rubric failed — canonical source validation:');
    for (const problem of sourceProblems.slice(0, 40)) console.error('  - ' + problem);
    if (sourceProblems.length > 40) console.error(`  ... and ${sourceProblems.length - 40} more`);
    process.exit(1);
  }
  const payload = buildPayload(indicators);
  writeJson(payload);
  writeGeneratedTs(indicators);
}

function doCheck() {
  let indicators: Indicator[];
  try {
    indicators = parseIndicators();
  } catch (error) {
    console.error(`check:rubric-consistency failed — cannot read canonical indicator files: ${(error as Error).message}`);
    process.exit(1);
  }
  const sourceProblems = validateSources(indicators);
  if (sourceProblems.length) {
    console.error('check:rubric-consistency failed — canonical source validation:');
    for (const problem of sourceProblems.slice(0, 40)) console.error('  - ' + problem);
    if (sourceProblems.length > 40) console.error(`  ... and ${sourceProblems.length - 40} more`);
    process.exit(1);
  }
  const expected = buildPayload(indicators);
  if (!existsSync(OUT_JSON)) {
    console.error('check:rubric-consistency failed — rubric.json missing; run npm run compile:rubric');
    process.exit(1);
  }
  const actualText = readFileSync(OUT_JSON, 'utf-8');
  let actual: unknown;
  try { actual = JSON.parse(actualText); } catch { console.error('check failed — rubric.json invalid JSON'); process.exit(1); }
  const a = actual as { indicators?: unknown[]; rubricVersion?: string };
  if (!a.indicators || (a.indicators as unknown[]).length !== expected.indicators.length) {
    console.error(`check:rubric-consistency failed — indicator count mismatch: expected ${expected.indicators.length} got ${(a.indicators as unknown[] | undefined)?.length ?? 0}`);
    console.error('run npm run compile:rubric to regenerate');
    process.exit(1);
  }
  // deep compare indicators (id/name/effort/tier)
  const expMap = new Map(expected.indicators.map(i => [i.id, i]));
  let mismatches: string[] = [];
  for (const ind of a.indicators as Indicator[]) {
    const e = expMap.get(ind.id);
    if (!e) mismatches.push(`extra indicator ${ind.id}`);
    else if (e.name !== ind.name) mismatches.push(`${ind.id} name mismatch: expected "${e.name}" got "${ind.name}"`);
    else if (e.effort !== ind.effort) mismatches.push(`${ind.id} effort mismatch: expected "${e.effort}" got "${ind.effort}"`);
  }
  if (mismatches.length) {
    console.error('check:rubric-consistency failed — mismatches:');
    for (const mm of mismatches.slice(0, 20)) console.error('  - ' + mm);
    if (mismatches.length > 20) console.error(`  ... and ${mismatches.length - 20} more`);
    process.exit(1);
  }
  // also check generated TS exists and matches
  if (!existsSync(OUT_TS)) {
    console.error('check:rubric-consistency failed — generated rubric.ts missing; run npm run compile:rubric');
    process.exit(1);
  }
  const genText = readFileSync(OUT_TS, 'utf-8');
  for (const ind of expected.indicators) {
    if (!genText.includes(`"${ind.id}":`) || !genText.includes(`"${ind.name.replace(/"/g, '\\"')}"`)) {
      console.error(`check failed — generated rubric.ts missing ${ind.id} "${ind.name}"`);
      process.exit(1);
    }
  }
  // remediation presence warning (allow ≤5% fallback/missing)
  const emptyRemediation = expected.indicators.filter(i => !i.remediation.quick_win);
  if (emptyRemediation.length) {
    const pct = (emptyRemediation.length / expected.indicators.length) * 100;
    const msg = `rubric-consistency warning — remediation missing for ${emptyRemediation.length}/${expected.indicators.length} (${pct.toFixed(1)}%): ${emptyRemediation.map(i => i.id).slice(0, 10).join(', ')}`;
    if (emptyRemediation.length > Math.ceil(expected.indicators.length * 0.05)) {
      console.error(msg);
      console.error('too many indicators without remediation — fix docs/rubric playbooks');
      process.exit(1);
    } else {
      console.warn(msg);
    }
  }
  // also warn when generated TS lacks remediation field
  if (!genText.includes('remediation')) {
    console.warn('rubric-consistency warning — generated rubric.ts missing remediation field; run compile:rubric');
  }
  // optional sample.ts drift check — if sample imports registry, runtime overrides hard-coded names, so text drift is non-blocking
  const samplePath = join(ROOT, 'apps/site/lib/sample.ts');
  let driftWarnings: string[] = [];
  if (existsSync(samplePath)) {
    const sampleText = readFileSync(samplePath, 'utf-8');
    const usesRegistry = sampleText.includes('INDICATOR_REGISTRY');
    if (!usesRegistry) {
      for (const ind of expected.indicators) {
        const idMarker = `id: "${ind.id}"`;
        const idx = sampleText.indexOf(idMarker);
        if (idx !== -1) {
          const snippet = sampleText.slice(idx, idx + 600);
          const nameMatch = snippet.match(/name:\s*"([^"]+)"/);
          const sampleName = nameMatch ? nameMatch[1] : '';
          if (sampleName && sampleName.toLowerCase() !== ind.name.toLowerCase() && !ind.name.toLowerCase().startsWith(sampleName.toLowerCase().slice(0, 8))) {
            driftWarnings.push(`${ind.id}: sample "${sampleName}" vs rubric "${ind.name}"`);
          }
        }
      }
      if (driftWarnings.length) {
        console.warn(`rubric-consistency warning — sample.ts drift (${driftWarnings.length}):`);
        for (const w of driftWarnings.slice(0, 10)) console.warn('  - ' + w);
        if (driftWarnings.length > 10) console.warn(`  ... and ${driftWarnings.length - 10} more (will be strict after 2.5)`);
      }
    } else {
      // runtime overrides — no text check needed
    }
  }
  console.log(`rubric-consistency: ok (${expected.indicators.length} indicators, ${expected.rubricVersion})`);
}

const check = process.argv.includes('--check');
if (check) doCheck(); else doCompile();
