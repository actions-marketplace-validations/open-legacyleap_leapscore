import type { FactRecord } from '../facts';
import rubricData from '../rubric.json' with { type: 'json' };

const RUBRIC_REMEDIATION: Record<string, { quick_win: string; structural: string; gold_standard: string; effort: string }> = Object.fromEntries(
  ((rubricData as unknown as { indicators: Array<{ id: string; remediation: { quick_win: string; structural: string; gold_standard: string; effort: string } }> }).indicators ?? []).map(i => [i.id, i.remediation ?? { quick_win: '', structural: '', gold_standard: '', effort: '⚡ ≤30 min' }])
);
function lookupRemediation(id: string) { return RUBRIC_REMEDIATION[id] ?? { quick_win: '', structural: '', gold_standard: '', effort: '⚡ ≤30 min' }; }

export type Phase1Row = {
  id: string;
  name: string;
  category_id: string;
  status: 'measured' | 'unknown';
  score?: number;
  reason?: string;
  evidence?: { tool: string; args?: string; pointers: Array<Record<string, string | number>>; facts: Record<string, unknown> };
  unknown_measure_path?: string;
  not_applicable?: boolean;
  effort: string;
  remediation?: { quick_win: string; structural: string; gold_standard: string; effort: string };
};

// Simple score predicates matching encyclopedia Y/R bands loosely — enough for Phase 1 hero dial
function scoreVel06(facts: Record<string, unknown>): number {
  const bf = (facts.vel06 as { bus_factor_repo?: number } | undefined)?.bus_factor_repo ?? 1;
  const share = (facts.vel06 as { top_author_share?: number } | undefined)?.top_author_share ?? 1;
  if (bf >= 3 && share < 0.4) return 3;
  if (bf === 1) return 0;
  if (bf === 2) return 2;
  return 1;
}
function scoreVel09(facts: Record<string, unknown>): number {
  const p = (facts.vel09 as { review_coverage_pct?: number; pr_size_median_loc?: number }) ?? {};
  const cov = p.review_coverage_pct ?? 0;
  if (cov >= 0.85) return 3;
  if (cov >= 0.7) return 2;
  if (cov >= 0.5) return 1;
  return 0;
}
function scoreVel08(facts: Record<string, unknown>): number {
  const c = (facts.vel08 as { cd_chain?: { build: boolean; deploy_job: boolean }; rollback_target?: boolean }) ?? {};
  const chain = c.cd_chain;
  if (chain?.build && chain?.deploy_job && c.rollback_target) return 3;
  if (chain?.build && chain?.deploy_job) return 2;
  if (chain?.build) return 1;
  return 0;
}
function scoreVel10(facts: Record<string, unknown>): number {
  const b = (facts.vel10 as { branches_total?: number; stale_over_30d?: number; model?: string }) ?? {};
  if (b.model === 'trunk-based') return 3;
  if ((b.stale_over_30d ?? 0) > 20) return 0;
  if ((b.stale_over_30d ?? 0) > 5) return 1;
  return 2;
}
function scoreSec07(facts: Record<string, unknown>): number {
  const s = (facts.sec07 as { bot?: { present: boolean }; open_bot_prs?: { p95_age_days: number } }) ?? {};
  if (!s.bot?.present) return 0;
  const p95 = s.open_bot_prs?.p95_age_days ?? 0;
  if (p95 > 90) return 1;
  if (p95 > 30) return 2;
  return 3;
}
function scoreTest08(facts: Record<string, unknown>): number {
  const t = (facts.test08 as { gates?: { lint: { present: boolean }; sast: { present: boolean }; coverage_gate: { present: boolean } } }) ?? {};
  const gates = t.gates;
  if (!gates) return 0;
  const count = [gates.lint?.present, gates.sast?.present, gates.coverage_gate?.present].filter(Boolean).length;
  if (count >= 3) return 3;
  if (count === 2) return 2;
  if (count === 1) return 1;
  return 0;
}

const SCORERS: Record<string, (facts: Record<string, unknown>) => number> = {
  'VEL-06': scoreVel06,
  'VEL-09': scoreVel09,
  'VEL-08': scoreVel08,
  'VEL-10': scoreVel10,
  'SEC-07': scoreSec07,
  'TEST-08': scoreTest08,
};

function flattenFacts(facts: Record<string, unknown>, detectorId: string): Record<string, unknown> {
  const normalized = detectorId.toLowerCase().replace('-', '');
  const inner = (facts as Record<string, unknown>)[normalized];
  if (inner && typeof inner === 'object' && !Array.isArray(inner)) return inner as Record<string, unknown>;
  const lower = detectorId.toLowerCase();
  const inner2 = (facts as Record<string, unknown>)[lower];
  if (inner2 && typeof inner2 === 'object' && !Array.isArray(inner2)) return inner2 as Record<string, unknown>;
  const keys = Object.keys(facts);
  if (keys.length === 1 && typeof (facts as Record<string, unknown>)[keys[0]] === 'object' && (facts as Record<string, unknown>)[keys[0]] !== null) {
    const v = (facts as Record<string, unknown>)[keys[0]] as Record<string, unknown>;
    if (!Array.isArray(v)) return v;
  }
  return facts as Record<string, unknown>;
}

function reasonVel06(score: number, f: Record<string, unknown>): string {
  const bf = (f.bus_factor_repo as number) ?? (f as unknown as { bus_factor?: number }).bus_factor ?? 1;
  const share = (f.top_author_share as number) ?? 0.5;
  if (score === 3) return `Bus factor ${bf} with top author ${Math.round(share * 100)}% — knowledge is distributed — per VEL-06 Green: no single point of failure — score 3.`;
  if (score === 2) return `Bus factor ${bf} — two owners — per VEL-06 Yellow flag: knowledge concentrated in a pair — score 2.`;
  if (score === 1) return `Bus factor ${bf} — per VEL-06 Yellow: some concentration, manageable — score 1.`;
  return `Bus factor ${bf} — single owner at ${Math.round(share * 100)}% — per VEL-06 Red flag: bus factor 1, critical knowledge silo — score 0.`;
}
function reasonVel09(score: number, f: Record<string, unknown>): string {
  const p = (f as { review_coverage_pct?: number; prs_sampled?: number }) ?? {};
  const cov = p.review_coverage_pct ?? 0;
  const samp = (p as { prs_sampled?: number }).prs_sampled ?? 0;
  if (score === 3) return `PR review coverage ${Math.round(cov * 100)}% over ${samp} sampled PRs — nearly every change reviewed — per VEL-09 Green: review hygiene sound — score 3.`;
  if (score === 2) return `Review coverage ${Math.round(cov * 100)}% — most PRs reviewed — per VEL-09 Yellow: some gaps — score 2.`;
  if (score === 1) return `Review coverage ${Math.round(cov * 100)}% — half of PRs slip through without review — per VEL-09 Yellow: review hygiene weak — score 1.`;
  return `Review coverage ${Math.round(cov * 100)}% — per VEL-09 Red: most changes merge unreviewed — score 0.`;
}
function reasonVel08(score: number, f: Record<string, unknown>): string {
  const c = (f.cd_chain as { build?: boolean; deploy_job?: boolean }) ?? {};
  const rb = (f.rollback_target as boolean) ?? false;
  if (score === 3) return `CD chain build and deploy present with rollback target — per VEL-08 Green: delivery is automated and reversible — score 3.`;
  if (score === 2) return `Build and deploy chain present, rollback ${rb ? 'present' : 'missing'} — per VEL-08 Yellow: deploy automation present but not fully wrapped — score 2.`;
  if (score === 1) return `Build present without deploy linkage — per VEL-08 Yellow: manual promotion remains — score 1.`;
  return `No build or deploy chain — per VEL-08 Red: delivery by hand, high friction — score 0.`;
}
function reasonVel10(score: number, f: Record<string, unknown>): string {
  const b = f as { model?: string; stale_over_30d?: number; branches_total?: number };
  if (b.model === 'trunk-based') return `Trunk-based branching with ${b.branches_total ?? 0} branches — per VEL-10 Green: short-lived branches, low divergence — score 3.`;
  if ((b.stale_over_30d ?? 0) > 20) return `${b.stale_over_30d} stale branches out of ${b.branches_total ?? 0} — per VEL-10 Red: long-lived release branches diverge — score 0.`;
  if ((b.stale_over_30d ?? 0) > 5) return `${b.stale_over_30d} stale branches — per VEL-10 Yellow: branch hygiene drifting — score 1.`;
  return `${b.stale_over_30d ?? 0} stale branches — per VEL-10 Yellow/Green: mostly trunk-like — score 2.`;
}
function reasonSec07(score: number, f: Record<string, unknown>): string {
  const s = f as { bot?: { present?: boolean }; open_bot_prs?: { p95_age_days?: number } };
  const present = s.bot?.present ?? false;
  const p95 = s.open_bot_prs?.p95_age_days ?? 0;
  if (!present) return `No Dependabot/Renovate automation — patch cadence is manual — per SEC-07 Red: dependency updates unmanaged — score 0.`;
  if (score === 3) return `Bot present; oldest open bot PR ${p95}d — patch backlog healthy — per SEC-07 Green: automated updates merged promptly — score 3.`;
  if (score === 2) return `Bot present; P95 open bot PR age ${p95}d — per SEC-07 Yellow: backlog starting to age — score 2.`;
  return `Bot present but P95 open bot PR age ${p95}d — per SEC-07 Yellow/Red: stale update queue — score 1.`;
}
function reasonTest08(score: number, f: Record<string, unknown>): string {
  const t = f as { gates?: { lint?: { present?: boolean }; sast?: { present?: boolean }; coverage_gate?: { present?: boolean } } };
  const gates = t.gates;
  if (!gates) return `No CI gate inventory — per TEST-08 Red: quality gates absent — score 0.`;
  const count = [gates.lint?.present, gates.sast?.present, gates.coverage_gate?.present].filter(Boolean).length;
  if (count >= 3) return `Lint, SAST and coverage gates all present and blocking — per TEST-08 Green: CI enforces the quality bar — score 3.`;
  if (count === 2) return `${count}/3 gates present — per TEST-08 Yellow: most gates present — score 2.`;
  if (count === 1) return `Only ${count}/3 gates present — per TEST-08 Yellow: gates minimal — score 1.`;
  return `No lint/SAST/coverage gates — per TEST-08 Red: CI lets quality slip — score 0.`;
}
const REASONERS: Record<string, (score: number, facts: Record<string, unknown>) => string> = {
  'VEL-06': reasonVel06,
  'VEL-09': reasonVel09,
  'VEL-08': reasonVel08,
  'VEL-10': reasonVel10,
  'SEC-07': reasonSec07,
  'TEST-08': reasonTest08,
};

function reasonFor(id: string, score: number, facts: Record<string, unknown>): string {
  const fn = REASONERS[id];
  if (fn) return fn(score, facts);
  const s = `${score} — ${['Critical', 'Severe Debt', 'Minor Debt', 'Healthy'][score] ?? ''}`;
  return `${s}: ${JSON.stringify(facts).slice(0, 120)} — per ${id} rubric band — score ${score}.`;
}

export function factsToRows(facts: FactRecord[]): Phase1Row[] {
  const byId = new Map(facts.map((f) => [f.detectorId, f]));
  const defs: Array<{ id: string; name: string; cat: string; effort: string }> = [
    { id: 'VEL-06', name: 'Bus factor', cat: 'VEL', effort: '⚡ ≤30 min' },
    { id: 'VEL-09', name: 'PR & code-review hygiene', cat: 'VEL', effort: '⚡ ≤30 min' },
    { id: 'VEL-08', name: 'Manual release steps', cat: 'VEL', effort: '🔶 ~2–4 h' },
    { id: 'VEL-10', name: 'Branching topology', cat: 'VEL', effort: '⚡ ≤30 min' },
    { id: 'SEC-07', name: 'Patch cadence & update workflow', cat: 'SEC', effort: '⚡ ≤30 min' },
    { id: 'TEST-08', name: 'Quality gates in CI', cat: 'TEST', effort: '⚡ ≤30 min' },
  ];
  return defs.map((d) => {
    const f = byId.get(d.id);
    if (!f || f.error) {
      const isNa = f?.facts && (f.facts as Record<string, unknown>).sec07 && ((f.facts as Record<string, { has_manifest?: boolean }>).sec07 as { has_manifest?: boolean }).has_manifest === false;
      return {
        id: d.id, name: d.name, category_id: d.cat, status: 'unknown' as const,
        unknown_measure_path: f?.error?.kind === 'rate-limit' ? 'rate-limited — retry' : isNa ? 'no manifests — na_when' : `what it takes: gh-api ${d.id} failed (${f?.error?.detail ?? 'no facts'})`,
        effort: d.effort,
      };
    }
    const scorer = SCORERS[d.id];
    const flat = flattenFacts(f.facts as Record<string, unknown>, d.id);
    const score = scorer ? scorer(flat) : 2;
    return {
      id: d.id, name: d.name, category_id: d.cat, status: 'measured' as const, score,
      reason: reasonFor(d.id, score, flat),
      evidence: { tool: f.provenance.tool, pointers: f.evidencePointers as unknown as Array<Record<string, string | number>>, facts: flat },
      effort: d.effort,
      remediation: lookupRemediation(d.id),
    };
  });
}

const BASE_WEIGHTS: Record<string, number> = { SEC: 20, VEL: 10, TEST: 10, ECOS: 10, ARCH: 15, DATA: 10, API: 10, PERF: 10, DOCS: 5 };

export function scorePhase1(rows: Phase1Row[]) {
  const byCat = new Map<string, Phase1Row[]>();
  for (const r of rows) {
    if (!byCat.has(r.category_id)) byCat.set(r.category_id, []);
    byCat.get(r.category_id)!.push(r);
  }
  const categories = [...byCat.entries()].map(([cat, catRows]) => {
    const measured = catRows.filter((r) => r.status === 'measured');
    const sum = measured.reduce((a, r) => a + (r.score ?? 0), 0);
    const applicable = measured.length;
    const category_score = applicable ? (sum / (applicable * 3)) * 100 : null;
    const weighted_contribution = category_score == null ? 0 : (category_score * (BASE_WEIGHTS[cat] ?? 0)) / 100;
    return { id: cat, name: cat, weight: BASE_WEIGHTS[cat] ?? 0, applicable, scored_sum: sum, category_score, weighted_contribution, status_counts: { measured: measured.length, estimated: 0, unknown: catRows.length - measured.length, not_applicable: 0 }, indicator_rows: catRows };
  });
  // No phantom empty categories — omitted (not evaluated); full 102 rows still via full_table
  const score = categories.reduce((a, c) => a + c.weighted_contribution, 0);
  const measured = rows.filter((r) => r.status === 'measured').length;
  const unknown = rows.filter((r) => r.status === 'unknown').length + 96; // remaining non-phase-1 indicators
  const coverage = { measured, estimated: 0, unknown, not_applicable: 0, measured_pct: `${Math.round((measured / 102) * 100)}%`, estimated_pct: '0%', unknown_pct: `${Math.round((unknown / 102) * 100)}%` };
  const status = measured === rows.length ? 'complete' as const : 'degraded' as const;
  const gates = [
    { id: 'G1', name: 'Credential exposure', status: 'needs-verification' as const, source_rows: ['SEC-02'], note: 'needs live secrets scan (Phase 2)' },
    { id: 'G2', name: 'Crit CVE > 14d', status: 'needs-verification' as const, source_rows: ['SEC-01'], note: 'needs SCA + reachability (Phase 2)' },
    { id: 'G3', name: 'Runtime EOL', status: 'needs-verification' as const, source_rows: ['ECOS-01'], note: 'needs endoflife lookup (Phase 2)' },
    { id: 'G8', name: 'Copyleft in core', status: 'needs-verification' as const, source_rows: ['ECOS-05'], note: 'needs SBOM (Phase 2)' },
  ];
  return { categories, coverage, score, status, gates };
}
