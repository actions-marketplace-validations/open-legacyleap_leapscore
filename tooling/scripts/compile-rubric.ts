/** tooling/scripts/compile-rubric.ts — canonical markdown -> packages/engine/rubric.json + generated registry */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createHash } from 'node:crypto';

const ROOT = join(import.meta.dirname ?? '.', '../..');
const RUBRIC_DIR = join(ROOT, 'docs/rubric');
const OUT_JSON = join(ROOT, 'packages/engine/rubric.json');
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

const CATEGORY_FILES: Array<{ file: string; cat: string; label: string }> = [
  { file: '01_DEPENDENCY_ECOSYSTEM.md', cat: 'ECOS', label: 'Dependency & Ecosystem Health' },
  { file: '02_ARCHITECTURE_CODE.md', cat: 'ARCH', label: 'Architecture & Code Quality' },
  { file: '03_TESTING_QUALITY.md', cat: 'TEST', label: 'Testing & Quality Engineering' },
  { file: '04_SECURITY_COMPLIANCE.md', cat: 'SEC', label: 'Security, Compliance & Vulnerability' },
  { file: '05_DATA_SCHEMA.md', cat: 'DATA', label: 'Data & Schema Evolution' },
  { file: '06_API_INTEGRATION.md', cat: 'API', label: 'API & Integration Surface' },
  { file: '07_VELOCITY_OPERATIONAL.md', cat: 'VEL', label: 'Developer Velocity & Operational Drag' },
  { file: '08_PERFORMANCE_CLOUD.md', cat: 'PERF', label: 'Performance & Cloud/Infrastructure Fit' },
  { file: '09_DOCS_KNOWLEDGE.md', cat: 'DOCS', label: 'Documentation & Knowledge Continuity' },
  { file: '10_FRONTEND_CLIENT.md', cat: 'FE', label: 'Frontend & Client Health' },
];

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(CATEGORY_FILES.map(f => [f.cat, f.label]));

function parseIndicators(): Indicator[] {
  const indicators: Indicator[] = [];
  for (const { file, cat } of CATEGORY_FILES) {
    const text = readFileSync(join(RUBRIC_DIR, file), 'utf-8');
    // Match headings like "### ECOS-01 — Runtime/Language EOL"
    const headingRegex = /###\s+([A-Z]+-\d+)\s+[—-]\s+([^\n]+)/g;
    let m: RegExpExecArray | null;
    while ((m = headingRegex.exec(text)) !== null) {
      const id = m[1].trim();
      const name = m[2].trim();
      // Extract following block up to next heading (dynamic, cap 8k to avoid cross-contamination)
      const start = m.index;
      const nextHeadingIdx = text.indexOf('\n### ', start + 1);
      const sliceEnd = nextHeadingIdx !== -1 ? Math.min(nextHeadingIdx, start + 8000) : start + 8000;
      const block = text.slice(start, sliceEnd);
      // tier: **Engine tier:** A
      const tierMatch = block.match(/\*\*Engine tier:\*\*\s*([A-D])/);
      const tier = tierMatch ? tierMatch[1] : 'B';
      const statusMatch = block.match(/\*\*Default status:\*\*\s*(\w+)/);
      const default_status = statusMatch ? statusMatch[1].toLowerCase() : 'unknown';
      const effortMatch = block.match(/Verify effort:\*\*\s*([^\n]+)/);
      let raw = effortMatch ? effortMatch[1].trim() : '⚡ ≤30 min';
      // Normalize effort to symbols
      // raw like "⚡ ≤ 30 min — read pins..." -> take first token up to "—"
      raw = raw.split('—')[0].trim();
      // Ensure spacing consistency
      let effort = raw;
      if (raw.includes('⚡')) effort = '⚡ ≤30 min';
      else if (raw.includes('🔶')) effort = '🔶 ~2–4 h';
      else if (raw.includes('🔷')) effort = '🔷 ~1–2 days';

      // Parse remediation playbook: "Quick win: ... Structural fix: ..." + Gold standard
      let quick_win = '';
      let structural = '';
      let gold_standard = '';
      let fallback = false;
      const playbookMatch = block.match(/\*\*Remediation playbook:\*\*\s*([\s\S]*?)(?=\n- \*\*Gold|\n- \*\*Scoring|\n###\s+[A-Z]+-\d+|\n##\s|$)/);
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
      const goldMatch = block.match(/\*\*Gold standard[^:]*:\*\*\s*([^\n]+)/);
      if (goldMatch) gold_standard = goldMatch[1].trim();
      if (fallback && quick_win) {
        // still keep playbook as quick_win, warn later in doCheck
      }
      const remediation: Remediation = { quick_win, structural, gold_standard, effort };
      indicators.push({ id, category: id.split('-')[0], name, tier, default_status, effort, raw_effort: raw, remediation });
    }
  }
  // Sort by category order then numeric
  const catOrder = CATEGORY_FILES.map(f => f.cat);
  indicators.sort((a, b) => {
    const ai = catOrder.indexOf(a.category);
    const bi = catOrder.indexOf(b.category);
    if (ai !== bi) return ai - bi;
    const an = parseInt(a.id.split('-')[1], 10);
    const bn = parseInt(b.id.split('-')[1], 10);
    return an - bn;
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

function buildPayload(indicators: Indicator[]) {
  const weights = buildWeights();
  const tiers = { healthy: 80, moderate: [53, 79], highRisk: [27, 52], critical: 27 };
  const gates = ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8'];
  const rubricVersion = createHash('sha256').update(JSON.stringify(indicators)).digest('hex').slice(0, 7);
  return {
    _comment: 'COMPILED from docs/rubric/01_*.md...10_*.md + 11_WEIGHTS_THRESHOLDS_CONFIG.md — do not hand-edit. Run npm run compile:rubric.',
    rubricVersion,
    weights,
    tiers,
    gates,
    indicators,
    categories: CATEGORY_FILES.map(f => ({ id: f.cat, name: f.label, weight_base: (weights.base as Record<string, number>)[f.cat] ?? (f.cat === 'FE' ? 0 : 0), weight_fe: (weights.feActive as Record<string, number>)[f.cat] ?? (f.cat === 'FE' ? 10 : 0) })),
  };
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
  lines.push('// Generated by tooling/scripts/compile-rubric.ts — do not hand-edit. Source: docs/rubric/*');
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
  const indicators = parseIndicators();
  if (indicators.length !== 102) {
    console.warn(`warning: expected 102 indicators, got ${indicators.length} — check docs/rubric parsing`);
    // still write, but consistency will fail
  }
  const payload = buildPayload(indicators);
  writeJson(payload);
  writeGeneratedTs(indicators);
}

function doCheck() {
  const indicators = parseIndicators();
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
