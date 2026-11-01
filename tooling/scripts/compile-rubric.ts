/** tooling/scripts/compile-rubric.ts — canonical markdown -> apps/scanner rubric.json + generated registry */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import {
  CONFIG_FILE,
  INDICATORS_DIR,
  RUBRIC_DIR,
  SHEETS_DIR,
  findMalformedEntries,
  loadCatalog,
  type RubricCategory,
} from '../lib/rubric-catalog';

const ROOT = join(import.meta.dirname ?? '.', '../..');
const MODEL_DIR_PATH = join(RUBRIC_DIR, 'model');
const OUT_JSON = join(ROOT, 'apps/scanner/src/scan/scoring/rubric.json');
const OUT_TS = join(ROOT, 'apps/site/lib/generated/rubric.ts');
const OUT_SCORE_SHEET = join(SHEETS_DIR, 'score-sheet.md');
const OUT_SERVICE_TEMPLATE = join(SHEETS_DIR, 'service-score-sheet.md');
const OUT_SYSTEM_TEMPLATE = join(SHEETS_DIR, 'system-score-sheet.md');

/** Order, directory, code, and label all come from the tree (design D5); none are restated here. */
const CATEGORIES: RubricCategory[] = loadCatalog();
const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(CATEGORIES.map((category) => [category.code, category.label]));

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

/**
 * Documentation-only facts parsed from the canonical files. Kept out of `Indicator`
 * on purpose: nothing here is read at runtime, and adding it to the payload would grow
 * the registry — and therefore the inlined `dist/leapscore-scan.mjs` — for no consumer (design D3).
 */
type DocFacts = {
  rollup: 'standard' | 'deep-dive';
  gates: string[];
  yellow_flag: string;
  red_flag: string;
};

/** A row of `model/config.md` §3's canonical gate roster. */
type GateRow = { id: string; name: string; trigger: string; sources: string[] };
/** A row of `model/config.md` §3's canonical band table. */
type TierRow = { tier: string; score: string; verdict: string };


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
 * remediation, and the implementation contract; the category charters are navigation only.
 */
function parseIndicators(): Indicator[] {
  const indicators: Indicator[] = [];
  for (const { indicators: canonical } of CATEGORIES) {
    for (const { path, text } of canonical) {
      const pathLabel = path.slice(INDICATORS_DIR.length + 1);
      // H1 like "# ECOS-01 — Runtime/Language EOL"
      const heading = text.match(/^#\s+([A-Z]+-\d+)\s+[—-]\s+([^\n]+)$/m);
      if (!heading) throw new Error(`${pathLabel}: missing "# <ID> — <Name>" heading`);
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
      indicators.push({ id, category: id.split('-')[0] ?? '', name, tier, default_status, effort, raw_effort: raw, remediation });
    }
  }
  // Sort by category order (already the catalog's directory order) then numeric
  const catOrder = CATEGORIES.map((category) => category.code);
  indicators.sort((a, b) => {
    const ai = catOrder.indexOf(a.category);
    const bi = catOrder.indexOf(b.category);
    if (ai !== bi) return ai - bi;
    return numericId(a.id) - numericId(b.id);
  });
  return indicators;
}

const FLAG_LABELS = { yellow: 'Yellow flag (warning)', red: 'Red flag (critical)' } as const;
const UNKNOWN_ONLY_CELL = '— *(unknown-only: reduced form carries no §2 criteria)*';

function stripRationale(value: string): string {
  // The only transformation the echo is allowed to make (design D2): drop the trailing
  // italicised "*(Rationale: …)*" aside. Nothing else — no truncation, no paraphrase.
  return value.replace(/\s*\*\(Rationale:[\s\S]*\)\*\s*$/, '').trim();
}

function flagBullet(text: string, label: string, path: string): string {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matches = [...text.matchAll(new RegExp(`^- \\*\\*${escaped}:\\*\\*\\s*(.+)$`, 'gm'))];
  if (matches.length !== 1) {
    throw new Error(`${path}: expected exactly one "- **${label}:**" bullet, found ${matches.length}`);
  }
  const value = stripRationale(matches[0][1]);
  if (!value) throw new Error(`${path}: "- **${label}:**" bullet is empty after removing the rationale aside`);
  return value;
}

/**
 * A gate's source indicators are the rows whose §1 "Gates fed" cell opens with a bold gate
 * ID. Conditional mentions ("co-drives **G3** with ECOS-01 when …") are deliberately not
 * sources — they describe a co-drive, not a feed.
 */
function gateTokens(gatesFed: string): string[] {
  const match = gatesFed.match(/^\*\*(G[1-8])\*\*/);
  return match ? [match[1]] : [];
}

function isReducedForm(text: string): boolean {
  // The approved reduced form (README "Full and reduced forms") is Identity + report-facing
  // emission text + Scope/overlaps only; it has no scoring-semantics section. §8 statusing is
  // not a reliable signal — many full rows legitimately emit `unknown` for the current release.
  return !/^## 3\. Scoring semantics/m.test(text);
}

/** Escape a value for a Markdown table cell. */
function cell(value: string): string {
  return value.replace(/\|/g, '\\|');
}

/**
 * Parse the documentation-only facts: §1 rollup classification and "Gates fed", plus the
 * two §2 flag bullets. The whole catalog carries exactly one of each today, so parsing is
 * total; a full-form file that loses a bullet fails the compile rather than emitting a
 * silently empty cell.
 */
function parseDocFacts(): Map<string, DocFacts> {
  const facts = new Map<string, DocFacts>();
  for (const { indicators: canonical } of CATEGORIES) {
    for (const { path, text } of canonical) {
      const pathLabel = path.slice(INDICATORS_DIR.length + 1);
      const heading = text.match(/^#\s+([A-Z]+-\d+)\s+[—-]\s+([^\n]+)$/m);
      if (!heading) throw new Error(`${pathLabel}: missing "# <ID> — <Name>" heading`);
      const id = heading[1].trim();
      const rollupValue = identityField(text, 'Rollup / deep-dive');
      if (!/^(standard|deep-dive)\b/.test(rollupValue)) {
        throw new Error(`${path}: "Rollup / deep-dive" must start with "standard" or "deep-dive", got "${rollupValue}"`);
      }
      const reduced = isReducedForm(text);
      const entry: DocFacts = {
        rollup: rollupValue.startsWith('deep-dive') ? 'deep-dive' : 'standard',
        gates: gateTokens(identityField(text, 'Gates fed')),
        // The reduced form declares an unknown-only contract and carries no §2 criteria:
        // the sheet says so explicitly instead of inventing or leaving a blank cell.
        yellow_flag: reduced ? UNKNOWN_ONLY_CELL : flagBullet(text, FLAG_LABELS.yellow, path),
        red_flag: reduced ? UNKNOWN_ONLY_CELL : flagBullet(text, FLAG_LABELS.red, path),
      };
      const previous = facts.get(id);
      if (previous) throw new Error(`duplicate ID ${id} while reading §2 criteria (${path})`);
      facts.set(id, entry);
    }
  }
  return facts;
}

/** Read the canonical G1–G8 roster from `model/config.md` §3. */
function readGateRoster(configText: string): GateRow[] {
  const heading = '### Gate roster (G1–G8)';
  const start = configText.indexOf(heading);
  if (start === -1) {
    throw new Error(`docs/rubric/model/config.md: missing "${heading}" — gate rules have no canonical home`);
  }
  const rest = configText.slice(start + heading.length);
  const next = rest.search(/\n#{2,3} /);
  const block = next === -1 ? rest : rest.slice(0, next);
  const rows: GateRow[] = [];
  for (const line of block.split('\n')) {
    const match = line.match(/^\|\s*(G[1-8])\s*\|([^|]*)\|([^|]*)\|([^|]*)\|\s*$/);
    if (!match) continue;
    rows.push({
      id: match[1],
      name: match[2].trim(),
      trigger: match[3].trim(),
      sources: match[4].split(',').map((source) => source.trim()).filter(Boolean),
    });
  }
  return rows;
}

/** Read the canonical band table from `model/config.md` §3. */
function readTierRows(configText: string): TierRow[] {
  const rows: TierRow[] = [];
  for (const line of configText.split('\n')) {
    const match = line.match(/^\|\s*(Low|Moderate|High|Critical)\s*\|\s*([^|]*?)\s*\|\s*([^|]*?)\s*\|\s*$/);
    if (match) rows.push({ tier: match[1], score: match[2].trim(), verdict: match[3].trim() });
  }
  return rows;
}

function readConfig(): string {
  return readFileSync(CONFIG_FILE, 'utf-8');
}

/** Category weights, read from the compiled payload so the headings cannot drift from §1. */
function weightLabel(cat: string, weights: ReturnType<typeof buildWeights>): string {
  const base = (weights.base as Record<string, number>)[cat];
  const fe = (weights.feActive as Record<string, number>)[cat];
  return base == null ? `conditional · FE-active weight ${fe}% (no base weight)` : `weight ${base}% (FE-active ${fe}%)`;
}

function weightPair(cat: string, weights: ReturnType<typeof buildWeights>): string {
  const base = (weights.base as Record<string, number>)[cat];
  const fe = (weights.feActive as Record<string, number>)[cat];
  return `${base == null ? '—' : `${base}%`} / ${fe == null ? '—' : `${fe}%`}`;
}

function buildWeights() {
  // Mirror of docs/rubric/model/config.md §1 — hardcoded but validated by the consistency check.
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
    _comment: 'COMPILED from docs/rubric/indicators/<NN-slug>/<ID>-<slug>.md + docs/rubric/model/config.md — do not hand-edit. Run npm run compile:rubric.',
    rubricVersion,
    weights,
    applicability,
    tiers,
    gates,
    indicators,
    categories: CATEGORIES.map((category) => ({ id: category.code, name: category.label, weight_base: (weights.base as Record<string, number>)[category.code] ?? 0, weight_fe: (weights.feActive as Record<string, number>)[category.code] ?? 0 })),
  };
}

/** Read the canonical category indexes and shared configuration, and fail on drift. */
function validateSources(
  indicators: Indicator[],
  facts: Map<string, DocFacts>,
  gateRoster: GateRow[],
  tierRows: TierRow[],
): string[] {
  const problems: string[] = [];
  const idPattern = /^([A-Z]+)-(\d{2})$/;
  const byCategory = new Map<string, string[]>();

  // 1. Canonical file enumeration: one file per ID, category membership, filename identity.
  const seen = new Map<string, string>();
  for (const malformed of findMalformedEntries()) {
    problems.push(`${malformed.path.slice(ROOT.length + 1)}: ${malformed.reason}`);
  }
  for (const { dir, code, indicators: canonical } of CATEGORIES) {
    if (!canonical.length) problems.push(`docs/rubric/indicators/${dir} has no indicator files`);
    const ids: string[] = [];
    for (const { file: canonicalFile, text } of canonical) {
      const path = `${dir}/${canonicalFile}`;
      const heading = text.match(/^#\s+([A-Z]+-\d+)\s+[—-]\s+([^\n]+)$/m);
      if (!heading) {
        problems.push(`${path}: missing "# <ID> — <Name>" heading`);
        continue;
      }
      const id = heading[1].trim();
      const fileId = canonicalFile.split('-').slice(0, 2).join('-');
      if (!idPattern.test(id)) problems.push(`${path}: malformed ID ${id}`);
      if (fileId !== id) problems.push(`${path}: filename ID ${fileId} does not match heading ID ${id}`);
      if (id.split('-')[0] !== code) problems.push(`${path}: ID ${id} does not belong to category ${code}`);
      const previous = seen.get(id);
      if (previous) problems.push(`duplicate ID ${id}: ${previous} and ${path}`);
      seen.set(id, path);
      ids.push(id);
    }
    byCategory.set(dir, ids);
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

  // 3. Category charters enumerate exactly the canonical IDs of their directory, in order.
  for (const { dir, code, charterPath, charter } of CATEGORIES) {
    const relative = charterPath.slice(ROOT.length + 1);
    if (!existsSync(charterPath)) {
      problems.push(`missing category charter docs/rubric/indicators/${dir}/README.md`);
      continue;
    }
    const indexIds = [...charter.matchAll(/^\|\s*([A-Z]+-\d+)\s*\|/gm)].map((m) => m[1]);
    const canonicalIds = byCategory.get(dir) ?? [];
    if (indexIds.join(',') !== canonicalIds.join(',')) {
      problems.push(`${relative}: charter IDs [${indexIds.join(',')}] do not match canonical ${code} files [${canonicalIds.join(',')}]`);
    }
    for (const id of canonicalIds) {
      const file = seen.get(id)?.split('/')[1];
      if (file && !charter.includes(`](./${file})`)) problems.push(`${relative}: missing link to ${file}`);
    }
  }

  // 4. Shared configuration: weights and tiers in model/config.md match the compiled payload.
  const expected = buildPayload(indicators);
  const configText = readFileSync(CONFIG_FILE, 'utf-8');
  const weightTable = (heading: string): Record<string, number> => {
    const start = configText.indexOf(heading);
    if (start === -1) return {};
    const end = configText.indexOf('\n### ', start + 1);
    const block = configText.slice(start, end === -1 ? configText.length : end);
    const table: Record<string, number> = {};
    for (const match of block.matchAll(/^\|\s*([^|*]+?)\s*\|\s*([\d.]+)%\s*\|/gm)) {
      const label = match[1].trim();
      const category = CATEGORIES.find((entry) => entry.label === label)?.code;
      if (category) table[category] = Number(match[2]);
    }
    return table;
  };
  const base = weightTable('### Base weight set');
  const feActive = weightTable('### FE-active weight set');
  for (const { code: cat } of CATEGORIES) {
    if (cat !== 'FE') {
      if (base[cat] == null) problems.push(`model/config.md base weights: missing category ${cat}`);
      else if (base[cat] !== expected.weights.base[cat as keyof typeof expected.weights.base]) problems.push(`model/config.md base weight for ${cat}: ${base[cat]} vs compiled ${expected.weights.base[cat as keyof typeof expected.weights.base]}`);
    } else if (base[cat] != null) {
      problems.push(`model/config.md base weights: FE must be absent from the base set (FE is conditional)`);
    }
    if (feActive[cat] == null) problems.push(`model/config.md FE-active weights: missing category ${cat}`);
    else if (feActive[cat] !== expected.weights.feActive[cat as keyof typeof expected.weights.feActive]) problems.push(`model/config.md FE-active weight for ${cat}: ${feActive[cat]} vs compiled ${expected.weights.feActive[cat as keyof typeof expected.weights.feActive]}`);
  }
  const low = configText.match(/^\|\s*Low\s*\|\s*≥\s*(\d+)%/m)?.[1];
  const moderate = configText.match(/^\|\s*Moderate\s*\|\s*(\d+)–(\d+)%/m);
  const high = configText.match(/^\|\s*High\s*\|\s*(\d+)–(\d+)%/m);
  const critical = configText.match(/^\|\s*Critical\s*\|\s*<\s*(\d+)%/m)?.[1];
  if (Number(low) !== expected.tiers.healthy) problems.push(`model/config.md tier threshold Low: ${low} vs compiled ${expected.tiers.healthy}`);
  if (!moderate || [Number(moderate[1]), Number(moderate[2])].join(',') !== expected.tiers.moderate.join(',')) problems.push(`model/config.md tier threshold Moderate does not match compiled ${expected.tiers.moderate.join('–')}`);
  if (!high || [Number(high[1]), Number(high[2])].join(',') !== expected.tiers.highRisk.join(',')) problems.push(`model/config.md tier threshold High does not match compiled ${expected.tiers.highRisk.join('–')}`);
  if (Number(critical) !== expected.tiers.critical) problems.push(`model/config.md tier threshold Critical: ${critical} vs compiled ${expected.tiers.critical}`);
  // 5. Gate rules: the roster lives canonically in model/config.md §3, and its source column must agree
  //    with the indicators' own §1 "Gates fed" rows. Neither derived document is consulted.
  if (expected.indicators.length !== facts.size) {
    problems.push(`§2 criteria parsed for ${facts.size} indicators, expected ${expected.indicators.length}`);
  }
  const rosterIds = gateRoster.map((row) => row.id);
  if (rosterIds.length !== expected.gates.length || rosterIds.some((gate, index) => gate !== expected.gates[index])) {
    problems.push(`model/config.md §3 gate roster [${rosterIds.join(',')}] does not match compiled [${expected.gates.join(',')}]`);
  }
  const derivedSources = new Map<string, string[]>(expected.gates.map((gate) => [gate, []]));
  for (const [id, fact] of facts) {
    for (const gate of fact.gates) derivedSources.get(gate)?.push(id);
  }
  for (const row of gateRoster) {
    const wanted = [...(derivedSources.get(row.id) ?? [])].sort();
    const stated = [...row.sources].sort();
    if (stated.join(',') !== wanted.join(',')) {
      problems.push(`model/config.md §3 ${row.id} source indicators [${stated.join(', ')}] do not match the "Gates fed" rows [${wanted.join(', ')}]`);
    }
  }

  // 6. Band table: exactly the four canonical bands, in order.
  const bandNames = tierRows.map((row) => row.tier);
  if (bandNames.join(',') !== 'Low,Moderate,High,Critical') {
    problems.push(`model/config.md §3 band table [${bandNames.join(',')}] must list Low, Moderate, High, Critical`);
  }

  // 7. The canonical configuration must not defer a weight, threshold, band, or gate rule to a
  //    derived document — that is the circularity this check exists to prevent.
  for (const derivedDoc of ['sheets/score-sheet', 'model/scale', 'sheets/service-score-sheet', 'sheets/system-score-sheet']) {
    const deferral = configText.match(new RegExp(`\\b(?:see|per|refer to|defined in|documented in)\\b[^\\n]{0,60}${derivedDoc}`, 'i'));
    if (deferral) {
      problems.push(`model/config.md defers to the derived document ${derivedDoc} — "${deferral[0].trim()}" — weights, thresholds, bands, and gate rules are defined here`);
    }
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
  lines.push('// Generated by tooling/scripts/compile-rubric.ts — do not hand-edit. Source: docs/rubric/indicators/** + docs/rubric/model/config.md');
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
  lines.push(`export const CATEGORY_ORDER = [${CATEGORIES.map((category) => `"${category.code}"`).join(',')}] as const;`);
  lines.push('');
  lines.push('export type CategoryWeight = { base: number | null; feActive: number | null };');
  lines.push('// Canonical source: docs/rubric/model/config.md §1. `base: null` marks a conditional category.');
  lines.push('export const CATEGORY_WEIGHTS: Record<string, CategoryWeight> = {');
  const weights = buildWeights();
  for (const { code } of CATEGORIES) {
    const base = (weights.base as Record<string, number>)[code];
    const fe = (weights.feActive as Record<string, number>)[code];
    lines.push(`  "${code}": { base: ${base == null ? 'null' : base}, feActive: ${fe == null ? 'null' : fe} },`);
  }
  lines.push('};');
  lines.push('');
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

const GENERATED_BANNER = [
  '> **GENERATED FILE — do not hand-edit.** Written by `tooling/scripts/compile-rubric.ts`',
  '> (`npm run compile:rubric`) from `docs/rubric/indicators/**` and',
  '> `docs/rubric/model/config.md`. `npm run check:rubric-consistency` fails on any hand edit.',
].join('\n');

type DerivedDoc = { path: string; content: string };

/**
 * Emit the rubric's derived documents. One writer per file: these three carry nothing that
 * is not parsed out of the canonical catalog or the shared configuration.
 */
function buildDerivedDocs(
  indicators: Indicator[],
  facts: Map<string, DocFacts>,
  gates: GateRow[],
  tiers: TierRow[],
  weights: ReturnType<typeof buildWeights>,
): DerivedDoc[] {
  return [
    { path: OUT_SCORE_SHEET, content: scoreSheet(indicators, facts, gates, tiers, weights) },
    { path: OUT_SERVICE_TEMPLATE, content: serviceTemplate(indicators, facts, gates, weights) },
    { path: OUT_SYSTEM_TEMPLATE, content: systemTemplate(gates, tiers, weights) },
  ];
}

function scoreSheet(
  indicators: Indicator[],
  facts: Map<string, DocFacts>,
  gates: GateRow[],
  tiers: TierRow[],
  weights: ReturnType<typeof buildWeights>,
): string {
  const standard = indicators.filter((indicator) => facts.get(indicator.id)?.rollup === 'standard').length;
  const deepDive = indicators.length - standard;
  const lines: string[] = [
    '# Score Sheet *(generated)*',
    '',
    GENERATED_BANNER,
    '',
    'Print this sheet and write on it. Each row echoes its canonical file\'s §2 Yellow and Red flag',
    'verbatim, with only the parenthetical rationale removed — no paraphrase, no truncation. The 0–3',
    'scale and the core-path taxonomy live in [`model/scale.md`](../model/scale.md);',
    'weights, formulas, bands, and the gate roster are canonical in',
    '[`model/config.md`](../model/config.md).',
    '',
    `**Rows:** ${indicators.length} indicators (${standard} standard · ${deepDive} deep-dive) · **Gates:** ${gates.length} · **Bands:** ${tiers.length}`,
    '',
    '---',
    '',
    '## Part A — Gate roster (G1–G8)',
    '',
    'Restated from [`model/config.md`](../model/config.md) §3, which also',
    'carries the trigger text and the escalation semantics.',
    '',
    '| # | Gate | Red Flag trigger | Source indicator |',
    '|---|------|------------------|--------------------|',
    ...gates.map((gate) => `| ${gate.id} | ${cell(gate.name)} | ${cell(gate.trigger)} | ${gate.sources.join(', ')} |`),
    '',
    '---',
    '',
    '## Part B — Bands',
    '',
    'Thresholds and verdict guidance are canonical in',
    '[`model/config.md`](../model/config.md) §3.',
    '',
    '| Tier | Score | Verdict |',
    '|------|-------|---------|',
    ...tiers.map((tier) => `| ${tier.tier} | ${tier.score} | ${cell(tier.verdict)} |`),
    '',
    '---',
    '',
    '## Part C — Indicator criteria (all rows, grouped by category)',
    '',
    'Headings show the base and FE-active weights; use the FE-active column when the repo has a client.',
    '',
  ];
  let position = 0;
  for (const { code: cat, label } of CATEGORIES) {
    const rows = indicators.filter((indicator) => indicator.category === cat);
    if (!rows.length) continue;
    position++;
    lines.push(`### ${position}. ${label} — ${weightLabel(cat, weights)}`, '');
    lines.push('| ID | Indicator | Rollup | Yellow flag (1–2 pts) | Red flag (0 pts) |');
    lines.push('|----|-----------|--------|----------------------|------------------|');
    for (const indicator of rows) {
      const fact = facts.get(indicator.id);
      if (!fact) throw new Error(`${indicator.id}: no §2 criteria parsed for the score sheet`);
      const glyph = indicator.effort.split(' ')[0] ?? '';
      lines.push(`| ${indicator.id} | ${cell(indicator.name)} ${glyph} | ${fact.rollup} | ${cell(fact.yellow_flag)} | ${cell(fact.red_flag)} |`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

function serviceTemplate(
  indicators: Indicator[],
  facts: Map<string, DocFacts>,
  gates: GateRow[],
  weights: ReturnType<typeof buildWeights>,
): string {
  const lines: string[] = [
    '# Service Score Sheet — <Service Name>',
    '',
    GENERATED_BANNER,
    '',
    '**System:** ______ · **Service:** ______ · **Criticality:** ☐ Critical path (×3) ☐ Supporting (×1) · **Auditor:** ______ · **Date:** ______ · **Audit type:** ☐ Screen ☐ Standard ☐ Deep',
    '',
    '**Scoring legend:** 3 = Healthy (no flags) · 2 = Minor debt (yellow in non-core paths) · 1 = Severe debt (yellow in core OR red in isolated paths) · 0 = Critical (red in core OR across multiple paths) · **N/A** = not applicable (reason recorded; excluded) · **Unknown** = applicable but unmeasurable (unscored; included in the frozen denominator) · **Not implemented** = no detector in this scanner release (excluded).',
    '',
    '**Core-path rule:** core = files reachable from public entry points touching money / auth / PII / compliance (global taxonomy — [`model/scale.md`](../model/scale.md) §2). Per-indicator criteria live in its canonical file under [`indicators/`](../indicators/).',
    '',
    '**Category %** is the frozen-denominator formula in [`model/config.md`](../model/config.md) §2a: unknown rows add denominator without numerator points; N/A and not-implemented rows are excluded; deep-dive rows fold in only when run and applicable.',
    '',
    'When a row is applicable but cannot be measured, leave its score blank and record `Unknown` in Notes/Evidence; include it in the applicable count. Record `Not implemented` distinctly and exclude it from the count.',
    '',
    '---',
    '',
  ];
  let position = 0;
  for (const { code: cat, label } of CATEGORIES) {
    const rows = indicators.filter((indicator) => indicator.category === cat);
    if (!rows.length) continue;
    position++;
    const baseWeight = (weights.base as Record<string, number>)[cat];
    const heading = baseWeight == null
      ? `*(annex — FE-active only · weight ${(weights.feActive as Record<string, number>)[cat]}%)*`
      : `(weight ${baseWeight}% / ${(weights.feActive as Record<string, number>)[cat]}% FE-active)`;
    const standardRows = rows.filter((indicator) => facts.get(indicator.id)?.rollup === 'standard');
    const deepRows = rows.filter((indicator) => facts.get(indicator.id)?.rollup === 'deep-dive');
    lines.push(`## ${position}. ${label} ${heading}`, '');
    lines.push('| ID | Indicator | Score (0–3 / N/A) | Notes / Evidence |');
    lines.push('|----|-----------|:-----------------:|------------------|');
    for (const indicator of standardRows) {
      lines.push(`| ${indicator.id} | ${cell(indicator.name)} | | |`);
    }
    lines.push('| | **Subtotal** | **___ / ___ applicable** | **Category % = ___%** |', '');
    if (deepRows.length) {
      lines.push(`Deep-dive: ${deepRows.map((indicator) => `${indicator.id} ☐ score __`).join(' · ')} *— folded in when run*`, '');
    } else {
      lines.push('Deep-dive: none — this category has no deep-dive rows.', '');
    }
    lines.push('---', '');
  }
  lines.push('## Service rollup', '');
  lines.push('| Category | Category % | Weight (base / FE-active) | Weighted |');
  lines.push('|----------|-----------:|:-------------------------:|---------:|');
  for (const { code: cat, label } of CATEGORIES) {
    const name = cat === 'FE' ? `${label} *(FE-active only)*` : label;
    lines.push(`| ${cell(name)} | __% | ${weightPair(cat, weights)} | __% |`);
  }
  lines.push('| **Service weighted score** | | | **__%** |', '');
  lines.push('> ✓ pick the weight column matching whether this system has a client.', '');
  lines.push(`**Gates triggered by this service:** ☐ none${gates.map((gate) => ` ☐ ${gate.id} ${gate.name}`).join('')}`, '');
  lines.push('**Top 3 modernization blockers found in this service:**', '1. ______', '2. ______', '3. ______', '');
  return lines.join('\n');
}

function systemTemplate(
  gates: GateRow[],
  tiers: TierRow[],
  weights: ReturnType<typeof buildWeights>,
): string {
  const lines: string[] = [
    '# System Score Sheet — <System Name>',
    '',
    GENERATED_BANNER,
    '',
    '**System:** ______ · **Auditor:** ______ · **Date:** ______ · **Audit type:** ☐ Screen (1 day) ☐ Standard (2–3 days) ☐ Deep (1–2 weeks)',
    '',
    '**Scoring legend:** 3 = Healthy · 2 = Minor debt · 1 = Severe debt · 0 = Critical · N/A = not applicable (excluded, reason in notes) · Unknown = applicable but unmeasurable (unscored, included in the frozen denominator) · Not implemented = no detector in this scanner release (excluded). Category % is the frozen-denominator formula in [`model/config.md`](../model/config.md) §2a. Deep-dive rows are recorded on the service sheets and fold into category % when run and applicable. Weights come from [`model/config.md`](../model/config.md) §1 — use the **FE-active** column if the system has a client.',
    '',
    '**Instructions:** Fill one [`service-score-sheet.md`](./service-score-sheet.md) per service. Enter each service\'s weighted score and criticality below, then compute the system rollup.',
    '',
    '---',
    '',
    '## Part A — Gate check (read first, decide first)',
    '',
    '| # | Gate | Red Flag? | Evidence |',
    '|---|------|:---------:|----------|',
    ...gates.map((gate) => `| ${gate.id} | ${cell(gate.name)} (${gate.sources.join(', ')}) | ☐ Y ☐ N | |`),
    '',
    '> Any ☐ Y → see the escalation semantics in [`model/config.md`](../model/config.md) §3.',
    '',
    '---',
    '',
    '## Part B — Per-service scores',
    '',
    '| Service | Criticality (×3 / ×1) | Weighted score % | Weighted score × criticality |',
    '|---------|:---------------------:|:----------------:|:---------------------------:|',
  ];
  for (let index = 1; index <= 8; index++) {
    lines.push(`| ${index}. ______ | ☐ 3 ☐ 1 | __% | __ |`);
  }
  lines.push('| **Totals** | Σ weights = ____ | | **Σ weighted = ____** |', '');
  lines.push('> **Note:** If you scored categories per-service, roll up **per category** instead (use the category % columns from each service sheet), then apply Part C weights.', '');
  lines.push('---', '');
  lines.push('## Part C — System rollup', '');
  lines.push('**Weights:** from [`model/config.md`](../model/config.md) §1. Mark which set applies: ☐ Base (no client) ☐ FE-active (client present).', '');
  lines.push('| Category | System category % | Weight | Weighted |');
  lines.push('|----------|:-----------------:|:------:|:--------:|');
  for (const { code: cat, label } of CATEGORIES) {
    const name = cat === 'FE' ? `${label} *(FE-active only)*` : label;
    lines.push(`| ${cell(name)} | __% | ${weightPair(cat, weights)} | __% |`);
  }
  lines.push('| **SYSTEM SCORE** | | | **____%** |', '');
  lines.push('**Option 2 — service-level rollup (quick):** System score = Σ weighted ÷ Σ criticality weights (from Part B) = **____%** *(approximation; ignores FE renormalization)*.', '');
  lines.push('---', '');
  lines.push('## Part D — Verdict', '');
  lines.push('Band labels follow the canonical [`model/config.md`](../model/config.md) §3.', '');
  lines.push('| Tier | Threshold | Result |');
  lines.push('|------|-----------|:------:|');
  for (const tier of tiers) lines.push(`| ${tier.tier} | ${tier.score} | ☐ |`);
  lines.push(`| **Gate override** (any G1–G8 Red Flag → see [\`model/config.md\`](../model/config.md) §3) | | ☐ Applied ☐ Not applicable |`, '');
  lines.push('**FINAL VERDICT:** ______', '');
  lines.push('---', '');
  lines.push('## Part E — Modernization decision', '');
  lines.push('- ☐ **Maintain:** continuous refactoring + incremental dependency updates.');
  lines.push('- ☐ **Refactor:** dedicated sprints; priority = security + EOL dependencies + highest-risk gates.');
  lines.push('- ☐ **Modernize (isolate + rebuild):** facade around core domain; migrate module-by-module; treat as initiative.');
  lines.push('- ☐ **Rewrite / Rescue:** critical risk; scope a rescue or containment strategy; freeze new debt.', '');
  lines.push('**Recommended first 90 days (top blockers, one line each):**', '1. ______', '2. ______', '3. ______', '');
  lines.push('**Required before next audit (verification):** ______', '');
  lines.push('**Calibration feedback:** ☐ Any threshold here misclassified reality? If so, record it in [`model/config.md`](../model/config.md) §5.', '');
  return lines.join('\n');
}

function writeDerivedDocs(docs: DerivedDoc[]) {
  for (const doc of docs) {
    mkdirSync(dirname(doc.path), { recursive: true });
    writeFileSync(doc.path, doc.content, 'utf-8');
    console.log(`wrote ${doc.path}`);
  }
}

function loadCanonical() {
  const indicators = parseIndicators();
  const facts = parseDocFacts();
  const configText = readConfig();
  const gates = readGateRoster(configText);
  const tiers = readTierRows(configText);
  return { indicators, facts, gates, tiers, configText };
}

function doCompile() {
  let sources: ReturnType<typeof loadCanonical>;
  try {
    sources = loadCanonical();
  } catch (error) {
    console.error(`compile:rubric failed — cannot read canonical indicator files: ${(error as Error).message}`);
    process.exit(1);
  }
  const sourceProblems = validateSources(sources.indicators, sources.facts, sources.gates, sources.tiers);
  if (sourceProblems.length) {
    console.error('compile:rubric failed — canonical source validation:');
    for (const problem of sourceProblems.slice(0, 40)) console.error('  - ' + problem);
    if (sourceProblems.length > 40) console.error(`  ... and ${sourceProblems.length - 40} more`);
    process.exit(1);
  }
  const payload = buildPayload(sources.indicators);
  writeJson(payload);
  writeGeneratedTs(sources.indicators);
  writeDerivedDocs(buildDerivedDocs(sources.indicators, sources.facts, sources.gates, sources.tiers, payload.weights));
}

function doCheck() {
  let sources: ReturnType<typeof loadCanonical>;
  try {
    sources = loadCanonical();
  } catch (error) {
    console.error(`check:rubric-consistency failed — cannot read canonical indicator files: ${(error as Error).message}`);
    process.exit(1);
  }
  const indicators = sources.indicators;
  const sourceProblems = validateSources(indicators, sources.facts, sources.gates, sources.tiers);
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
  // Derived documents are generated, not authored: byte-equality against a fresh compile.
  // A hand edit fails here, naming the file and the first differing line (design D5).
  const derivedProblems: string[] = [];
  for (const doc of buildDerivedDocs(indicators, sources.facts, sources.gates, sources.tiers, expected.weights)) {
    const relative = doc.path.slice(ROOT.length + 1);
    if (!existsSync(doc.path)) {
      derivedProblems.push(`${relative}: missing generated document — run npm run compile:rubric`);
      continue;
    }
    const actualDoc = readFileSync(doc.path, 'utf-8');
    if (actualDoc === doc.content) continue;
    const wanted = doc.content.split('\n');
    const found = actualDoc.split('\n');
    let line = 0;
    while (line < wanted.length && line < found.length && wanted[line] === found[line]) line++;
    derivedProblems.push(`${relative}:${line + 1}: hand-edited or stale — run npm run compile:rubric`);
    derivedProblems.push(`    expected: ${(wanted[line] ?? '<end of file>').slice(0, 160)}`);
    derivedProblems.push(`    actual:   ${(found[line] ?? '<end of file>').slice(0, 160)}`);
  }

  // Scoring rules have exactly one home: `model/config.md`. The authored scale, every
  // category charter, and the rubric entry README may link those rules but never restate a
  // value (spec: "Rubric directory declares its layers", design D4). The message says where
  // the duplicated rule belongs.
  const VALUE_RULES: Array<{ rule: string; pattern: RegExp; home: string }> = [
    { rule: 'category weight percentage', pattern: /\bweight\s*:?\s*\d+(?:\.\d+)?\s*%/i, home: 'model/config.md §1' },
    { rule: 'category weight percentage', pattern: /^\|[^|\n]*\|\s*\d+(?:\.\d+)?\s*%\s*\|/m, home: 'model/config.md §1' },
    { rule: 'band threshold literal', pattern: /\b(?:80|53|27)\s*%|\d+(?:\.\d+)?\s*–\s*\d+(?:\.\d+)?\s*%/, home: 'model/config.md §3' },
    { rule: 'gate roster row', pattern: /^\|\s*G[1-8]\b/m, home: 'model/config.md §3' },
  ];
  const SCALE_RULES: Array<{ rule: string; pattern: RegExp; home: string }> = [
    { rule: 'per-indicator table row', pattern: /^\|\s*[A-Z]+-\d+\s*\|/m, home: 'sheets/score-sheet.md Part C or the indicator file' },
    ...VALUE_RULES,
    { rule: 'rollup formula block', pattern: /```[^`]*?(?:Category%|System score|System category%)[^`]*?```/s, home: 'model/config.md §2' },
  ];
  const RESTATEMENT_SOURCES: Array<{ path: string; rules: typeof SCALE_RULES; missing: string }> = [
    { path: join(MODEL_DIR_PATH, 'scale.md'), rules: SCALE_RULES, missing: 'model/scale.md: missing authored scale' },
    { path: join(RUBRIC_DIR, 'README.md'), rules: VALUE_RULES, missing: 'docs/rubric/README.md: missing rubric entry point' },
  ];
  for (const { dir, charterPath } of CATEGORIES) {
    RESTATEMENT_SOURCES.push({ path: charterPath, rules: VALUE_RULES, missing: `docs/rubric/indicators/${dir}/README.md: missing category charter` });
  }
  for (const source of RESTATEMENT_SOURCES) {
    const relative = source.path.slice(ROOT.length + 1);
    if (!existsSync(source.path)) {
      derivedProblems.push(source.missing);
      continue;
    }
    const text = readFileSync(source.path, 'utf-8');
    for (const { rule, pattern, home } of source.rules) {
      const match = text.match(pattern);
      if (match) derivedProblems.push(`${relative}: duplicated ${rule} — "${match[0].trim().replace(/\s+/g, ' ').slice(0, 80)}" (canonical home: ${home})`);
    }
  }
  if (derivedProblems.length) {
    console.error('check:rubric-consistency failed — derived rubric documents:');
    for (const problem of derivedProblems) console.error('  - ' + problem);
    process.exit(1);
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
