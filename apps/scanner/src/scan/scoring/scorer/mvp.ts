import type { FactRecord } from '../../facts';
import { factsToRows as phase1Rows, scorePhase1 } from './phase1';
import rubricData from '../rubric.json' with { type: 'json' };
import { evaluateGates } from './rollup';
import { evaluateApplicability, renormalizeWeights } from './applicability';

function flattenFacts(facts: Record<string, unknown>, detectorId: string): Record<string, unknown> {
  const normalized = detectorId.toLowerCase().replace('-', '');
  const inner = (facts as Record<string, unknown>)[normalized];
  if (inner && typeof inner === 'object' && !Array.isArray(inner)) return inner as Record<string, unknown>;
  const lower = detectorId.toLowerCase();
  const inner2 = (facts as Record<string, unknown>)[lower];
  if (inner2 && typeof inner2 === 'object' && !Array.isArray(inner2)) return inner2 as Record<string, unknown>;
  // already flat or unrecognized nesting — return as-is but strip any single-key wrapper that is an object
  const keys = Object.keys(facts);
  if (keys.length === 1 && typeof (facts as Record<string, unknown>)[keys[0]] === 'object' && (facts as Record<string, unknown>)[keys[0]] !== null) {
    const v = (facts as Record<string, unknown>)[keys[0]] as Record<string, unknown>;
    // ensure it's not already a primitive map disguised — if inner has known nested shape, flatten
    if (!Array.isArray(v)) return v;
  }
  return facts as Record<string, unknown>;
}

// --- Score + reason helpers per indicator (spec §5 + encyclopedia rationale) ---

function scoreDocs01(f: Record<string, unknown>): number {
  const c = (f.adr_count as number) ?? 0;
  const newest = (f.newest_adr_days as number) ?? 9999;
  if (c === 0) return 0;
  if (c >= 5 && newest < 180) return 3;
  if (c >= 1 && newest < 365) return 2;
  return 1;
}
function reasonDocs01(score: number, f: Record<string, unknown>): string {
  const c = (f.adr_count as number) ?? 0;
  const dir = (f.adr_dir as string | null) ?? 'no ADR dir';
  const newest = (f.newest_adr_days as number) ?? 9999;
  if (score === 0) return `No decision records — no ADR directory found; architecture changes are undocumented — per DOCS-01 Red flag: decisions live only in heads, onboarding requires a listening tour — score 0.`;
  if (score === 3) return `${c} ADRs at ${dir}; newest ${newest}d — decision process exists and is current — per DOCS-01 Green: consequential changes have ADRs — score 3.`;
  if (score === 2) return `${c} ADRs at ${dir}; newest ${newest}d — ADRs exist but stale or recent majors lack ADRs — per DOCS-01 Yellow flag: process exists but not current — score 2.`;
  return `${c} ADRs at ${dir}; scattered docs without a consistent ADR location — per DOCS-01 Yellow flag: decision docs exist but lack convention — score 1.`;
}

function scoreDocs03(f: Record<string, unknown>): number {
  const c = (f.count as number) ?? 0;
  const restore = (f.restore_doc_present as boolean) ?? false;
  const newest = (f.newest_days as number) ?? 9999;
  if (c === 0) return 0;
  if (c >= 4 && restore && newest < 180) return 3;
  if (c >= 2 && newest < 365) return 2;
  return 1;
}
function reasonDocs03(score: number, f: Record<string, unknown>): string {
  const c = (f.count as number) ?? 0;
  const dir = (f.runbook_dir as string | null) ?? 'searched docs/runbooks, runbooks, docs/operations etc.';
  const topics = ((f.topics_covered as string[]) ?? []).join(', ') || 'no topics';
  const restore = (f.restore_doc_present as boolean) ?? false;
  if (score === 0) return `No runbooks — searched ${dir}; zero files found — per DOCS-03 Red flag: incidents recovered by heroics, every lesson repeated — score 0.`;
  if (score === 3) return `${c} runbooks at ${dir}; topics ${topics}; restore ${restore ? 'present' : 'missing'} — runbooks cover top operational classes including restore and are current — per DOCS-03 Green: every incident class has a drilled runbook — score 3.`;
  if (score === 2) return `${c} runbooks at ${dir}; topics ${topics}; restore ${restore ? 'present' : 'absent'} — partial coverage of core classes — per DOCS-03 Yellow flag: fires you planned for are fine, others are a gamble — score 2.`;
  return `${c} runbooks at ${dir}; topics ${topics} — sparse or stale, restore/incident missing — per DOCS-03 Yellow flag: sparse runbooks, heroics still required — score 1.`;
}

function scoreDocs04(f: Record<string, unknown>): number {
  const docs = (f.docs_present as string[]) ?? [];
  const covered = (f.stages_covered as string[]) ?? [];
  const last = (f.last_verified_days as number) ?? 9999;
  if (docs.length === 0) return 0;
  if (docs.length >= 2 && covered.includes('setup') && covered.includes('run') && covered.includes('test') && last < 180) return 3;
  if (docs.length >= 1 && covered.includes('setup')) return 2;
  return 1;
}
function reasonDocs04(score: number, f: Record<string, unknown>): string {
  const docs = (f.docs_present as string[]) ?? [];
  const missing = (f.stages_missing as string[]) ?? [];
  const covered = (f.stages_covered as string[]) ?? [];
  if (score === 0) return `No onboarding guide — no CONTRIBUTING.md / GETTING_STARTED.md and README has no setup section; stages missing: setup, run, test — per DOCS-04 Red flag: no documentation, new hires rely on tribal knowledge — score 0.`;
  if (score === 3) return `Onboarding docs ${docs.join(', ')}; stages ${covered.join(', ')} all covered and current — per DOCS-04 Green: golden path verified and maintained — score 3.`;
  if (score === 2) return `Onboarding docs ${docs.join(', ')}; stages covered ${covered.join(', ') || 'setup'}; gaps ${missing.join(', ') || 'none'} — per DOCS-04 Yellow flag: covers setup+run+test, contrib/deploy gaps remain — score 2.`;
  return `Onboarding docs ${docs.join(', ')}; stages missing ${missing.join(', ')} — minimal or stale guide — per DOCS-04 Yellow flag: partial guide, broken references — score 1.`;
}

function scoreDocs08(f: Record<string, unknown>): number {
  const present = (f.changelog_present as boolean) ?? false;
  const current = (f.changelog_current as boolean) ?? false;
  const pct = (f.with_notes_pct as number) ?? 0;
  if (!present && pct === 0) return 0;
  if (present && current && pct >= 0.5) return 3;
  if (present && pct >= 0.2) return 2;
  return 1;
}
function reasonDocs08(score: number, f: Record<string, unknown>): string {
  const present = (f.changelog_present as boolean) ?? false;
  const pct = (f.with_notes_pct as number) ?? 0;
  const n = (f.releases_sampled as number) ?? 0;
  const breaking = f.breaking_with_migration_guide as { total_breaking?: number; documented?: number } | undefined;
  if (score === 0) return `No CHANGELOG.md found at any of 6 candidate paths; ${Math.round(pct * 100)}% of ${n} sampled releases carry notes — per DOCS-08 Red flag: breaking changes ship unannounced, consumers learn from failures — score 0.`;
  if (score === 3) return `CHANGELOG present and current; ${Math.round(pct * 100)}% of ${n} releases carry substantive notes; breaking docs ${breaking?.documented ?? 0}/${breaking?.total_breaking ?? 0} — per DOCS-08 Green: automated notes + migration guides — score 3.`;
  if (score === 2) return `Changelog present but lagging or notes thin — ${Math.round(pct * 100)}% of ${n} releases with notes — per DOCS-08 Yellow flag: changelog sporadic, migration guides partial — score 2.`;
  return `Notes sporadic — changelog ${present ? 'present' : 'absent'}, ${Math.round(pct * 100)}% releases with notes; breaking changes often undocumented — per DOCS-08 Yellow flag: release communication inconsistent — score 1.`;
}

function scoreDocs09(f: Record<string, unknown>): number {
  const steps = (f.doc_ci_steps as unknown[]) ?? [];
  const link = (f.link_checker as boolean) ?? false;
  const gen = (f.api_gen_wired as boolean) ?? false;
  const stale = (f.staleness_gate as boolean) ?? false;
  if (steps.length === 0 && !link && !gen && !stale) return 0;
  if (steps.length >= 1 && link && gen && stale) return 3;
  if (steps.length >= 1 && (link || gen || stale)) return 2;
  return 1;
}
function reasonDocs09(score: number, f: Record<string, unknown>): string {
  const steps = (f.doc_ci_steps as Array<{ kind?: string }>) ?? [];
  const kinds = steps.map((s) => s.kind ?? 'step').join(', ') || 'no steps';
  const link = (f.link_checker as boolean) ? 'link-check present' : 'no link-check';
  const gen = (f.api_gen_wired as boolean) ? 'API generation wired' : 'no API generation';
  const stale = (f.staleness_gate as boolean) ? 'staleness gate present' : 'no staleness gate';
  if (score === 0) return `No docs-as-code automation — zero CI steps; ${link}; ${gen} — per DOCS-09 Red flag: docs are wiki-only, drift unverified — score 0.`;
  if (score === 3) return `Docs CI steps ${kinds}; ${link}; ${gen}; ${stale} — build, lint/link, generation and freshness all enforced — per DOCS-09 Green: docs build and staleness gated — score 3.`;
  if (score === 2) return `Docs automation present (${kinds}); ${link}; ${gen}; ${stale} — gaps remain in gates/checkers — per DOCS-09 Yellow flag: automation partial — score 2.`;
  return `Single advisory docs step (${kinds}) — per DOCS-09 Yellow flag: docs pipeline minimal — score 1.`;
}

function scorePerf02(f: Record<string, unknown>): number {
  const model = (f.model as string) ?? 'none-declared';
  if (model === 'orchestrated') return 3;
  if (model === 'containerized') return 2;
  if (model === 'mixed-vm-container') return 1;
  if (model === 'vm-scripts') return 0;
  return 0; // none-declared
}
function reasonPerf02(score: number, f: Record<string, unknown>): string {
  const model = (f.model as string) ?? 'none-declared';
  const arts = ((f.artifacts as Array<{ path?: string }>) ?? []).map((a) => a.path ?? '').filter(Boolean).join(', ') || 'no artifacts';
  if (score === 3) return `Orchestrated/containerized deployment (${model}); artifacts ${arts} — per PERF-02 Green: image-built and orchestrated — score 3.`;
  if (score === 2) return `Containerized without orchestration (${model}); ${arts} — per PERF-02 Yellow: containerized but not yet orchestrated — score 2.`;
  if (score === 1) return `Mixed VM + container (${model}); ${arts} — per PERF-02 Yellow: migration in progress, partial automation — score 1.`;
  return `VM-scripts or no declared deploy path (${model}); ${arts} — per PERF-02 Red flag: hand-run provisioning, no declared target — score 0.`;
}

function scorePerf06(f: Record<string, unknown>): number {
  const fws = (f.iac_frameworks as string[]) ?? [];
  const undeclared = (f.undeclared_classes as string[]) ?? [];
  if (fws.length === 0) return 1;
  if (undeclared.length === 0) return 2;
  return 1;
}
function reasonPerf06(score: number, f: Record<string, unknown>): string {
  const fws = ((f.iac_frameworks as string[]) ?? []).join(', ') || 'no IaC framework';
  const undeclared = ((f.undeclared_classes as string[]) ?? []).join(', ') || 'none';
  if (score === 2) return `IaC ${fws}; all implied classes declared; drift gate absent — per PERF-06 estimated 2: coverage heuristic passes, true drift needs cloud creds — score 2.`;
  return `IaC ${fws}; undeclared implied classes: ${undeclared} — per PERF-06 estimated 1: IaC absent or major undeclared — score 1.`;
}

function scoreData01(f: Record<string, unknown>): number {
  const n = (f.migration_count as number) ?? 0;
  const cycles = (f.graph_cycles as number) ?? 0;
  const replayable = (f.chain_replayable as boolean) ?? true;
  const destructive = (f.destructive_ops as unknown[]) ?? [];
  if (cycles > 0 || (!replayable && destructive.length > 0)) return 0;
  if (destructive.length > 0) return 1;
  if (n > 0) return 3; // clean chain, with backlog pressure still 2 vs 3 — simplify to 3 when clean
  return 1; // 0 migrations but persistence suspected
}
function reasonData01(score: number, f: Record<string, unknown>): string {
  const n = (f.migration_count as number) ?? 0;
  const fw = (f.framework as string) ?? 'unknown';
  const des = ((f.destructive_ops as Array<{ file?: string }>) ?? []).length;
  const raw = (f.raw_sql_share as number) ?? 0;
  if (score === 0) return `${n} migrations (${fw}); unreplayable chain with cycles or destructive ops on core — per DATA-01 Red flag: migration hell, replay fails — score 0.`;
  if (score === 1) return `${n} migrations; ${des} destructive ops; raw-sql ${Math.round(raw * 100)}% — per DATA-01 Yellow: destructive/manual ops present — score 1.`;
  if (n === 0) return `No migrations found but persistence suspected — per DATA-01 unknown/estimated band — score 1.`;
  return `${n} migrations (${fw}); replayable, no destructive ops, raw-sql ${Math.round(raw * 100)}% — per DATA-01 Green: linear replayable chain — score 3.`;
}

function scoreEcos06(f: Record<string, unknown>): number {
  if ((f.duplicate_security_critical as boolean) === true) return 0;
  const total = (f.transitive_total as number) ?? 0;
  const dups = (f.duplicates as unknown[]) ?? [];
  const pct = (f.pct_direct_unused as number | null) ?? 0;
  if (total > 500 || dups.length > 3) return 1;
  if (total > 200 || (pct ?? 0) > 10) return 2;
  return 3;
}
function reasonEcos06(score: number, f: Record<string, unknown>): string {
  const t = (f.transitive_total as number) ?? 0;
  const dups = ((f.duplicates as Array<{ name?: string }>) ?? []).length;
  const pct = (f.pct_direct_unused as number | null) ?? 0;
  const crit = (f.duplicate_security_critical as boolean) ?? false;
  if (score === 0) return `${t} transitives; duplicate security-critical present — per ECOS-06 Red: unremovable security dupe — score 0.`;
  if (score === 1) return `${t} transitives; ${dups} duplicate versions — per ECOS-06 Red/Yellow: heavy bloat/duplication — score 1.`;
  if (score === 2) return `${t} transitives; ${pct}% direct unused; ${dups} duplicates — per ECOS-06 Yellow: bloat band — score 2.`;
  return `${t} transitives; no security-critical duplicates — per ECOS-06 Green: graph within budget — score 3.`;
}

function scoreEcos08(f: Record<string, unknown>): number {
  const fws = (f.frameworks as Array<{ support_status?: string }>) ?? [];
  if (fws.length === 0) return 2; // treat no-framework as neutral per na_when elsewhere, but here measured
  const anyEol = fws.some((x) => x.support_status === 'eol');
  const anyMaint = fws.some((x) => x.support_status === 'maintenance');
  const coupling = (f.coupling_share as number) ?? 0;
  const facade = (f.facade_layer_detected as boolean) ?? false;
  if (anyEol && coupling > 0.5 && !facade) return 0;
  if (anyEol) return 1;
  if (anyMaint) return 2;
  return 3;
}
function reasonEcos08(score: number, f: Record<string, unknown>): string {
  const fws = (f.frameworks as Array<{ name?: string; version?: string; support_status?: string }>) ?? [];
  const coupling = (f.coupling_share as number) ?? 0;
  const facade = (f.facade_layer_detected as boolean) ?? false;
  const desc = fws.map((x) => `${x.name}@${x.version} ${x.support_status}`).join(', ') || 'no framework';
  if (score === 0) return `${desc}; coupling ${Math.round(coupling * 100)}% with no facade — per ECOS-08 Red: EOL framework with high coupling — score 0.`;
  if (score === 1) return `${desc}; coupling ${Math.round(coupling * 100)}% — per ECOS-08 Yellow: EOL confined to non-core — score 1.`;
  if (score === 2) return `${desc} — maintenance with ${facade ? 'facade present' : 'no facade'} — per ECOS-08 Yellow: needs migration evidence — score 2.`;
  return `${desc}; all active — per ECOS-08 Green: supported lifecycle — score 3.`;
}

// --- detector-honesty rows: spec §5 predicates (no constant grading) ---

/** ECOS-01 — runtime EOL. Encyclopedia §ECOS-01; YELLOW_MARGIN 180d. */
const ECOS01_YELLOW_MARGIN_DAYS = 180;
const ECOS01_CORE_PIN = /dockerfile|workflow|ci|\.github/i;
function scoreEcos01(f: Record<string, unknown>): number {
  const runtimes = (f.runtimes as Array<{ days_until_eol?: number | null; is_past_eol?: boolean; pin_source?: string }>) ?? [];
  if (runtimes.length === 0) return 2;
  const past = runtimes.filter((r) => r.is_past_eol === true);
  if (past.length) return past.some((r) => ECOS01_CORE_PIN.test(String(r.pin_source ?? ''))) ? 0 : 1;
  const near = runtimes.some((r) => typeof r.days_until_eol === 'number' && r.days_until_eol <= ECOS01_YELLOW_MARGIN_DAYS);
  return near ? 2 : 3;
}
function reasonEcos01(score: number, f: Record<string, unknown>): string {
  const runtimes = (f.runtimes as Array<{ product?: string; version?: string; cycle?: string; days_until_eol?: number | null; is_past_eol?: boolean; pin_source?: string }>) ?? [];
  const desc = runtimes.map((r) => `${r.product}@${r.version} (cycle ${r.cycle}, EOL ${r.is_past_eol ? 'PASSED' : `${r.days_until_eol}d`}, pin ${r.pin_source})`).join(', ') || 'no runtime pinned';
  if (score === 0) return `${desc}; EOL runtime pinned on the core deploy path — per ECOS-01 Red flag: unpatched runtime in core logic (G3) — score 0.`;
  if (score === 1) return `${desc}; EOL runtime confined outside core — per ECOS-01 Yellow flag: EOL in an isolated path — score 1.`;
  if (score === 2) return `${desc}; within ${ECOS01_YELLOW_MARGIN_DAYS}d of EOL — per ECOS-01 Yellow flag: active version near EOL — score 2.`;
  return `${desc}; all runtimes within support — per ECOS-01 Green: runtime current — score 3.`;
}

/** ECOS-02 — major package drift. Encyclopedia §ECOS-02; Y1 30 / R1 50. */
const ECOS02_Y1 = 30;
const ECOS02_R1 = 50;
function scoreEcos02(f: Record<string, unknown>): number {
  const pct1 = (f.pct_behind_1plus_major as number) ?? 0;
  const gaps = (f.core_framework_gaps as Array<{ majors_behind?: number }>) ?? [];
  const maxGap = gaps.reduce((a, g) => Math.max(a, g.majors_behind ?? 0), 0);
  if (maxGap >= 3) return 0;
  if (maxGap === 2 || pct1 >= ECOS02_R1) return 1;
  if (pct1 >= ECOS02_Y1) return 2;
  return 3;
}
function reasonEcos02(score: number, f: Record<string, unknown>): string {
  const pct1 = (f.pct_behind_1plus_major as number) ?? 0;
  const pct2 = (f.pct_behind_2plus_major as number) ?? 0;
  const gaps = (f.core_framework_gaps as Array<{ name?: string; majors_behind?: number }>) ?? [];
  const worst = gaps.length ? `; worst core gap ${gaps[0].name} ${gaps[0].majors_behind} major(s)` : '';
  if (score === 0) return `${pct1}% ≥1 major behind, ${pct2}% ≥2${worst} — per ECOS-02 Red flag: core framework stuck ≥2 majors — score 0.`;
  if (score === 1) return `${pct1}% ≥1 major behind, ${pct2}% ≥2${worst} — per ECOS-02 Red/Yellow: deep drift or core framework 2 majors behind — score 1.`;
  if (score === 2) return `${pct1}% ≥1 major behind${worst} — per ECOS-02 Yellow flag: 30–50% drifting — score 2.`;
  return `${pct1}% ≥1 major behind; core framework within a major — per ECOS-02 Green: minor drift only — score 3.`;
}

/** ECOS-03 — abandoned libraries. Encyclopedia §ECOS-03; Y 12mo / R 24mo. */
const ECOS03_Y_MONTHS = 12;
const ECOS03_R_MONTHS = 24;
function scoreEcos03(f: Record<string, unknown>): number {
  const abandoned = (f.abandoned as Array<{ months_since_release?: number; archived?: boolean; in_core_path?: boolean }>) ?? [];
  if (abandoned.length === 0) return 3;
  const coreFire = abandoned.some((a) => a.in_core_path === true && (a.archived === true || (a.months_since_release ?? 0) > ECOS03_R_MONTHS));
  if (coreFire) return 0;
  const bus = (f.bus_factor_1_count as number) ?? 0;
  const peripheralBand = abandoned.some((a) => a.in_core_path !== true && (a.months_since_release ?? 0) >= ECOS03_Y_MONTHS && (a.months_since_release ?? 0) <= ECOS03_R_MONTHS);
  if (peripheralBand || (bus > 0 && abandoned.every((a) => a.in_core_path !== true))) return 2;
  return 1;
}
function reasonEcos03(score: number, f: Record<string, unknown>): string {
  const abandoned = (f.abandoned as Array<{ name?: string; months_since_release?: number; in_core_path?: boolean }>) ?? [];
  const total = (f.load_bearing_total as number) ?? 0;
  const names = abandoned.slice(0, 4).map((a) => `${a.name} (${a.months_since_release}mo${a.in_core_path ? ', core' : ''})`).join(', ');
  if (score === 0) return `${abandoned.length}/${total} load-bearing deps abandoned; core: ${names} — per ECOS-03 Red flag: unmaintained >24mo or archived in core — score 0.`;
  if (score === 2) return `${abandoned.length}/${total} abandoned in peripheral scope: ${names} — per ECOS-03 Yellow flag: 12–24mo peripheral — score 2.`;
  if (score === 1) return `${abandoned.length}/${total} abandoned: ${names} — per ECOS-03 Yellow flag: isolated/very-old abandonment — score 1.`;
  return `all ${total} load-bearing deps maintained — per ECOS-03 Green: no abandonment — score 3.`;
}

/** ECOS-05 — license compliance. Encyclopedia §ECOS-05 (G8 reads copyleft+closed). */
function scoreEcos05(f: Record<string, unknown>): number {
  const strong = (f.copyleft_strong as unknown[]) ?? [];
  const unknown = (f.license_unknown_count as number) ?? 0;
  const sbom = (f.sbom_present_in_repo as boolean) ?? false;
  const closed = (f.closed_source_distribution_likely as boolean) ?? false;
  if (strong.length > 0 && closed) return 0;
  if (strong.length > 0 || unknown > 0) return 1;
  return sbom ? 3 : 2;
}
function reasonEcos05(score: number, f: Record<string, unknown>): string {
  const strong = (f.copyleft_strong as Array<{ name?: string; license?: string }>) ?? [];
  const unknown = (f.license_unknown_count as number) ?? 0;
  const total = (f.packages_total as number) ?? 0;
  const sbom = (f.sbom_present_in_repo as boolean) ?? false;
  const closed = (f.closed_source_distribution_likely as boolean) ?? false;
  if (score === 0) return `${strong.length} strong-copyleft of ${total} with closed-source distribution (${strong.map((s) => `${s.name} ${s.license}`).join(', ')}) — per ECOS-05 Red flag: copyleft in closed distribution (G8) — score 0.`;
  if (score === 1) return `${unknown} unknown-license + ${strong.length} strong-copyleft of ${total} direct deps — per ECOS-05 Yellow flag: unknown/copyleft present — score 1 (estimated clamp [1,2]).`;
  return `${total} direct deps, ${unknown} unknown, no strong copyleft; SBOM ${sbom ? 'present' : 'absent'} — per ECOS-05 ${sbom ? 'Green' : 'Yellow'}: ${sbom ? 'compliant' : 'clean but no SBOM'} — score ${score} (estimated clamp [1,2]).`;
}

/** ECOS-07 — lockfile integrity. Encyclopedia §ECOS-07; R_PIN 50. */
const ECOS07_R_PIN = 50;
function scoreEcos07(f: Record<string, unknown>): number {
  const locks = (f.lockfiles as Array<{ stale?: boolean }>) ?? [];
  const pin = (f.pin_ratio as number) ?? 0;
  const enforced = (f.ci_immutable_install as { enforced?: boolean } | undefined)?.enforced ?? false;
  const manifests = (f.manifests_total as number) ?? 0;
  if (locks.length === 0 || pin < ECOS07_R_PIN) return 0;
  if (locks.length < manifests) return 1;
  const anyStale = locks.some((l) => l.stale === true);
  return !anyStale && enforced ? 3 : 2;
}
function reasonEcos07(score: number, f: Record<string, unknown>): string {
  const locks = (f.lockfiles as Array<{ path?: string; stale?: boolean; integrity_hashes?: boolean }>) ?? [];
  const pin = (f.pin_ratio as number) ?? 0;
  const enforced = (f.ci_immutable_install as { enforced?: boolean; evidence?: string } | undefined);
  const manifests = (f.manifests_total as number) ?? 0;
  const desc = locks.map((l) => `${l.path}${l.stale ? ' (stale)' : ''}${l.integrity_hashes ? '' : ' (no integrity)'}`).join(', ') || 'no lockfile';
  if (score === 0) return `${desc}; pin_ratio ${pin}% — per ECOS-07 Red flag: no lockfile or floating pins — score 0.`;
  if (score === 1) return `${locks.length}/${manifests} manifests locked (${desc}); pin_ratio ${pin}% — per ECOS-07 Yellow flag: partial coverage — score 1.`;
  if (score === 2) return `${desc}; pin_ratio ${pin}%; CI immutable install ${enforced?.enforced ? 'enforced' : 'not enforced'} — per ECOS-07 Yellow flag: locked but stale/not enforced — score 2.`;
  return `${desc}; pin_ratio ${pin}%; CI immutable (${enforced?.evidence}) — per ECOS-07 Green: lockfile + immutable CI — score 3.`;
}

/** ARCH-05 — churn vs defect hot spots. Encyclopedia §ARCH-05; Y_SHARE 0.5. */
const ARCH05_Y_SHARE = 0.5;
function scoreArch05(f: Record<string, unknown>): number {
  const hotspots = (f.hotspots as Array<{ in_core_path?: boolean }>) ?? [];
  if (hotspots.length === 0) return 3;
  if (hotspots.some((h) => h.in_core_path === true)) return 0;
  if (hotspots.length === 1) return 1;
  const share = (f.churn_top10_share as number) ?? 0;
  return share > ARCH05_Y_SHARE ? 2 : 2;
}
function reasonArch05(score: number, f: Record<string, unknown>): string {
  const hotspots = (f.hotspots as Array<{ file?: string; churn_rank?: number; defect_rank?: number; in_core_path?: boolean }>) ?? [];
  const share = (f.churn_top10_share as number) ?? 0;
  const commits = (f.commits_analyzed as number) ?? 0;
  const windowDays = (f.window_days as number) ?? 0;
  const desc = hotspots.slice(0, 4).map((h) => `${h.file} (#${h.churn_rank} churn/#${h.defect_rank} defect${h.in_core_path ? ', core' : ''})`).join(', ');
  if (score === 0) return `${commits} commits/${windowDays}d; top10% share ${share}; core hot spot(s): ${desc} — per ARCH-05 Red flag: hot spot on core path — score 0.`;
  if (score === 1) return `${commits} commits/${windowDays}d; single isolated hot spot: ${desc} — per ARCH-05 Yellow flag: isolated hot spot — score 1.`;
  if (score === 2) return `${commits} commits/${windowDays}d; top10% share ${share}; non-core hot spots: ${desc} — per ARCH-05 Yellow flag: churn concentrated, defect correlation mild — score 2.`;
  return `${commits} commits/${windowDays}d; top10% share ${share}; no churn∩defect intersection — per ARCH-05 Green: no hot spots — score 3.`;
}

/** TEST-03 — pyramid inversion. Estimated-only: score ∈ {1,2} (spec §5). */
function scoreTest03(f: Record<string, unknown>): number {
  const unit = (f.unit as number) ?? 0;
  const e2e = (f.e2e as number) ?? 0;
  const share = (f.e2e_share_est as number) ?? 0;
  if (unit === 0 || (e2e > 0 && unit < e2e) || share > 0.5) return 1;
  return 2;
}
function reasonTest03(score: number, f: Record<string, unknown>): string {
  const unit = (f.unit as number) ?? 0;
  const integration = (f.integration as number) ?? 0;
  const e2e = (f.e2e as number) ?? 0;
  const share = (f.e2e_share_est as number) ?? 0;
  const desc = `unit/integration/e2e = ${unit}/${integration}/${e2e}; e2e share ~${Math.round(share * 100)}%`;
  if (score === 1) return `${desc} — per TEST-03 Yellow/Red: E2E-dominant or no unit layer — score 1 (estimated clamp [1,2]).`;
  return `${desc} — per TEST-03 Yellow flag: overweight E2E but unit layer exists — score 2 (estimated clamp [1,2]; 3 unreachable by construction).`;
}

/** TEST-05 — skipped tests. Encyclopedia §TEST-05; gold <2%, yellow 5–10%, red >10% or aged >6mo. */
const TEST05_GOLD_RATIO = 0.02;
const TEST05_RED_RATIO = 0.10;
const TEST05_AGED_DAYS = 180;
function scoreTest05(f: Record<string, unknown>): number {
  const ratio = (f.skip_ratio as number) ?? 0;
  const aged = (f.aged_skips as Array<{ age_days?: number }>) ?? [];
  if (ratio > TEST05_RED_RATIO || aged.some((a) => (a.age_days ?? 0) > TEST05_AGED_DAYS)) return 1;
  if (ratio < TEST05_GOLD_RATIO) return 3;
  return 2;
}
function reasonTest05(score: number, f: Record<string, unknown>): string {
  const total = (f.total_tests_est as number) ?? 0;
  const skipped = (f.skipped_total as number) ?? 0;
  const ratio = (f.skip_ratio as number) ?? 0;
  const aged = (f.aged_skips as Array<{ age_days?: number }>) ?? [];
  const agedMax = aged.reduce((a, x) => Math.max(a, x.age_days ?? 0), 0);
  const desc = `${skipped}/${total} skipped (${Math.round(ratio * 100)}%${agedMax ? `, oldest ${agedMax}d` : ''})`;
  if (score === 1) return `${desc} — per TEST-05 Red flag: >10% skipped or skips aged >6mo — score 1.`;
  if (score === 3) return `${desc} — per TEST-05 Green: <2% skipped — score 3.`;
  return `${desc} — per TEST-05 Yellow flag: 2–10% skipped — score 2.`;
}

/** SEC-01 — unpatched vulnerabilities. Encyclopedia §SEC-01 (G2 reads critical>14d reachable). */
const SEC01_CRITICAL_DAYS = 14;
const SEC01_HIGH_YELLOW_DAYS = 30;
function scoreSec01(f: Record<string, unknown>): number {
  const findings = (f.findings as Array<{ severity?: string; age_days?: number; in_core_import_closure?: boolean }>) ?? [];
  const crits = findings.filter((x) => x.severity === 'CRITICAL');
  const critFire = crits.some((c) => (c.age_days ?? 0) > SEC01_CRITICAL_DAYS && c.in_core_import_closure !== false);
  if (critFire) return 0;
  if (crits.length > 0) return 1;
  const highs = findings.filter((x) => x.severity === 'HIGH');
  if (highs.length === 0) return 3;
  return highs.some((h) => (h.age_days ?? 0) > SEC01_HIGH_YELLOW_DAYS) ? 1 : 2;
}
function reasonSec01(score: number, f: Record<string, unknown>): string {
  const findings = (f.findings as Array<{ id?: string; pkg?: string; severity?: string; age_days?: number; fix_available?: boolean; in_core_import_closure?: boolean }>) ?? [];
  const desc = findings.slice(0, 4).map((x) => `${x.id} on ${x.pkg} (${x.severity}, ${x.age_days}d${x.in_core_import_closure ? ', core-reachable' : ''})`).join(', ') || 'no findings';
  const crits = findings.filter((x) => x.severity === 'CRITICAL').length;
  const highs = findings.filter((x) => x.severity === 'HIGH').length;
  if (score === 0) return `${crits} critical, ${highs} high open: ${desc} — per SEC-01 Red flag: exposed critical >14d (G2) — score 0.`;
  if (score === 1) return `${crits} critical, ${highs} high open: ${desc} — per SEC-01 Yellow flag: critical isolated or aged highs — score 1.`;
  if (score === 2) return `${highs} high open within 30d: ${desc} — per SEC-01 Yellow flag: high within band — score 2.`;
  return `zero open high/critical — per SEC-01 Green: SLAs met — score 3.`;
}

/** SEC-02 — hardcoded secrets. Encyclopedia §SEC-02 (G1 reads verified/tree/history). */
const SEC02_CORE_PATH = /(^|\/)(config|conf|env|deploy|deployment|k8s|helm|terraform|secrets?|\.env|auth|ci|\.github)(\/|\.|$)/i;
function scoreSec02(f: Record<string, unknown>): number {
  const tree = (f.tree_findings as Array<{ file?: string; verified?: boolean }>) ?? [];
  const hist = (f.history_only_findings as number) ?? 0;
  const verified = (f.verified_live as number) ?? 0;
  if (verified > 0) return 0;
  if (tree.length === 0) return hist > 0 ? 2 : 3;
  if (tree.some((t) => SEC02_CORE_PATH.test(String(t.file ?? '')))) return 0;
  return 1;
}
function reasonSec02(score: number, f: Record<string, unknown>): string {
  const tree = (f.tree_findings as Array<{ rule?: string; file?: string }>) ?? [];
  const hist = (f.history_only_findings as number) ?? 0;
  const verified = (f.verified_live as number) ?? 0;
  const desc = tree.slice(0, 4).map((t) => `${t.rule}@${t.file}`).join(', ') || 'clean tree';
  if (score === 0) return `${tree.length} tree finding(s) (${verified} verified-live): ${desc} — per SEC-02 Red flag: active secret in core/prod (G1) — score 0.`;
  if (score === 2) return `clean tree; ${hist} history-only finding(s) — per SEC-02 Yellow flag: rotated secrets in history — score 2.`;
  if (score === 1) return `${tree.length} unverified finding(s) in isolated paths: ${desc} — per SEC-02 Yellow flag: isolated unverified secret — score 1.`;
  return `zero findings (clean tree + history) — per SEC-02 Green: no secrets — score 3.`;
}

function scoreSec09(f: Record<string, unknown>): number {
  const parsers = (f.parser_surface_detected as unknown[]) ?? [];
  const harnesses = (f.harnesses as unknown[]) ?? [];
  const sanit = (f.sanitizers_in_build as boolean) ?? false;
  const cont = (f.continuous_fuzzing as { oss_fuzz?: boolean }) ?? {};
  if (parsers.length > 0 && harnesses.length === 0 && !sanit) return 0;
  if (harnesses.length > 0 && sanit && cont.oss_fuzz) return 3;
  if (harnesses.length > 0) return 2;
  if (sanit) return 1;
  return 0;
}
function reasonSec09(score: number, f: Record<string, unknown>): string {
  const h = ((f.harnesses as Array<{ engine?: string }>) ?? []).length;
  const surf = ((f.parser_surface_detected as string[]) ?? []).join(', ') || 'unknown surface';
  const sanit = (f.sanitizers_in_build as boolean) ? 'sanitizers present' : 'no sanitizers';
  const cont = (f.continuous_fuzzing as { oss_fuzz?: boolean })?.oss_fuzz ? 'continuous fuzzing' : 'no continuous fuzzing';
  if (score === 0) return `Parsing surface ${surf}; zero harnesses; ${sanit} — per SEC-09 Red: input robustness untested — score 0 (presence-only caveat).`;
  if (score === 3) return `${h} harness(es); ${sanit}; ${cont} — per SEC-09 Green: harnesses + sanitizers + continuous — score 3.`;
  if (score === 2) return `${h} harness(es); ${sanit} — per SEC-09 Yellow: harnesses present, coverage partial — score 2.`;
  return `${sanit}; single or stale harness — per SEC-09 Yellow: sanitizers only — score 1.`;
}

function scoreSec10(f: Record<string, unknown>): number {
  const jobs = (f.security_jobs as unknown[]) ?? [];
  if (jobs.length === 0) return 0;
  const classes = (f.classes_present as string[]) ?? [];
  const hist = (f.secret_scan_covers_history as boolean) ?? false;
  const img = (f.image_scan_on_build as boolean) ?? false;
  if (classes.includes('sast') && hist && img && (jobs as Array<{ blocking?: boolean }>).every((j) => j.blocking)) return 3;
  if (classes.length >= 2) return 2;
  return 1;
}
function reasonSec10(score: number, f: Record<string, unknown>): string {
  const classes = ((f.classes_present as string[]) ?? []).join(', ') || 'none';
  const jobs = ((f.security_jobs as Array<{ name?: string }>) ?? []).map((j) => j.name).join(', ') || 'none';
  if (score === 0) return `No security CI jobs — classes ${classes}; jobs ${jobs} — per SEC-10 Red: no SAST/deps/secret/image gates — score 0.`;
  if (score === 3) return `Security classes ${classes}; jobs ${jobs} all blocking — per SEC-10 Green: SAST + secret(history) + deps + image present — score 3.`;
  if (score === 2) return `Classes ${classes}; jobs ${jobs} — per SEC-10 Yellow: core classes present, partial blocking — score 2.`;
  return `Single class ${classes} — per SEC-10 Yellow: advisory-only gate — score 1.`;
}

const TRANCHE_SCORERS: Record<string, (f: Record<string, unknown>) => number> = {
  'ECOS-01': scoreEcos01,
  'ECOS-02': scoreEcos02,
  'ECOS-03': scoreEcos03,
  'ECOS-05': scoreEcos05,
  'ECOS-07': scoreEcos07,
  'SEC-01': scoreSec01,
  'SEC-02': scoreSec02,
  'ARCH-05': scoreArch05,
  'TEST-03': scoreTest03,
  'TEST-05': scoreTest05,
  'DOCS-01': scoreDocs01,
  'DOCS-03': scoreDocs03,
  'DOCS-04': scoreDocs04,
  'DOCS-08': scoreDocs08,
  'DOCS-09': scoreDocs09,
  'PERF-02': scorePerf02,
  'PERF-06': scorePerf06,
  'DATA-01': scoreData01,
  'ECOS-06': scoreEcos06,
  'ECOS-08': scoreEcos08,
  'SEC-09': scoreSec09,
  'SEC-10': scoreSec10,
};
const TRANCHE_REASONS: Record<string, (score: number, f: Record<string, unknown>) => string> = {
  'ECOS-01': reasonEcos01,
  'ECOS-02': reasonEcos02,
  'ECOS-03': reasonEcos03,
  'ECOS-05': reasonEcos05,
  'ECOS-07': reasonEcos07,
  'SEC-01': reasonSec01,
  'SEC-02': reasonSec02,
  'ARCH-05': reasonArch05,
  'TEST-03': reasonTest03,
  'TEST-05': reasonTest05,
  'DOCS-01': reasonDocs01,
  'DOCS-03': reasonDocs03,
  'DOCS-04': reasonDocs04,
  'DOCS-08': reasonDocs08,
  'DOCS-09': reasonDocs09,
  'PERF-02': reasonPerf02,
  'PERF-06': reasonPerf06,
  'DATA-01': reasonData01,
  'ECOS-06': reasonEcos06,
  'ECOS-08': reasonEcos08,
  'SEC-09': reasonSec09,
  'SEC-10': reasonSec10,
};

/** Clamp applied when a detector declares `measurement.status === 'estimated'`
 * (spec clamp [1,2]): an estimate may not claim the Green or the Red end. */
const ESTIMATED_CLAMP: Record<string, [number, number]> = {
  'ECOS-01': [1, 2],
  'ECOS-02': [1, 2],
  'ECOS-03': [1, 2],
  'ECOS-05': [1, 2],
  'ECOS-06': [1, 2],
  'ECOS-08': [1, 2],
  'SEC-01': [1, 2],
  'TEST-03': [1, 2],
  'ARCH-05': [1, 2],
};

const MVP_IDS = ['VEL-06','VEL-09','VEL-08','VEL-10','SEC-07','TEST-08','ECOS-01','ECOS-02','ECOS-03','ECOS-05','ECOS-07','SEC-01','SEC-06','SEC-02','ARCH-01','ARCH-08','ARCH-05','TEST-03','TEST-05'];
export const TRANCHE_A_IDS = ['DOCS-01','DOCS-03','DOCS-04','DOCS-08','DOCS-09','PERF-02','PERF-06','DATA-01','ECOS-06','ECOS-08','SEC-09','SEC-10'];
export const ALL_MEASURED_IDS = [...MVP_IDS, ...TRANCHE_A_IDS];

/** Coverage floor for headline suppression (3.2): the headline is suppressed with
 * an `insufficient-signal` verdict when fewer than this fraction of requested
 * rows are measured. A constant — tunable without changing specs or tasks. */
export const COVERAGE_FLOOR = 0.5;

const RUBRIC_REGISTRY: Record<string, { name: string; category: string; effort: string; remediation: { quick_win: string; structural: string; gold_standard: string; effort: string } }> = Object.fromEntries(
  ((rubricData as unknown as { indicators: Array<{ id: string; category: string; name: string; effort: string; remediation: { quick_win: string; structural: string; gold_standard: string; effort: string } }> }).indicators ?? []).map(i => [i.id, { name: i.name, category: i.category, effort: i.effort, remediation: i.remediation }])
);
function lookupName(id: string): string {
  const e = RUBRIC_REGISTRY[id];
  if (!e) { console.warn(`Unknown indicator ${id}`); return `Unknown indicator (${id})`; }
  return e.name;
}
function lookupEffort(id: string): string { return RUBRIC_REGISTRY[id]?.effort ?? '⚡ ≤30 min'; }
function lookupCategory(id: string): string { return RUBRIC_REGISTRY[id]?.category ?? id.split('-')[0]; }
function lookupRemediation(id: string) { return RUBRIC_REGISTRY[id]?.remediation ?? { quick_win: '', structural: '', gold_standard: '', effort: '⚡ ≤30 min' }; }

export function scoreMvp(facts: FactRecord[], opts: { archetype?: string; planeInventory?: { has_server: boolean; has_data: boolean; has_deploy: boolean; has_client: boolean; has_test: boolean } } = {}) {
  const archetype = (opts.archetype ?? 'unknown') as 'library' | 'service' | 'cli' | 'infra' | 'docs' | 'agent-skills' | 'mixed' | 'unknown';
  const plane = opts.planeInventory ?? { has_server: true, has_data: true, has_deploy: true, has_client: true, has_test: true };
  // Reuse phase1 rows for first 6, then map remaining via simple measured mapping; supports both 19 and 31
  const byId = new Map(facts.map(f => [f.detectorId, f]));
  const rawPhase1 = phase1Rows(facts.filter(f => ['VEL-06','VEL-09','VEL-08','VEL-10','SEC-07','TEST-08'].includes(f.detectorId)));
  const phase1 = rawPhase1.map(r => r.status === 'measured' ? { ...r, remediation: lookupRemediation(r.id) } as unknown as typeof r : r);
  // For remaining, create measured rows if fact exists and no error — include tranche A (31 total); tranche rows become unknown placeholders when not requested
  const extraIds = [...MVP_IDS.slice(6), ...TRANCHE_A_IDS];
  const extraRows: ReturnType<typeof phase1Rows> = [];
  for (const id of extraIds) {
    const f = byId.get(id);
    const cat = lookupCategory(id);
    const name = lookupName(id);
    const effort = lookupEffort(id);
    const scorer = TRANCHE_SCORERS[id];
    // No fact, an errored fact, or no scorer → `unknown` (never a constant
    // fallback: a row the slice cannot grade must not be graded from `2`).
    if (!f || f.error || !scorer) {
      const whatItTakes = (f as unknown as { unknownMeasurePath?: string } | undefined)?.unknownMeasurePath
        ?? `what it takes: ${id} failed`;
      extraRows.push({ id, name, category_id: cat, status: 'unknown', unknown_measure_path: whatItTakes, effort } as unknown as ReturnType<typeof phase1Rows>[number]);
      continue;
    }
    const flat = flattenFacts(f.facts as Record<string, unknown>, id);
    const reasonFn = TRANCHE_REASONS[id];
    // Detector-declared measurement status (detector-honesty measure-or-unknown):
    // `estimated` rows carry the spec's clamp so an estimate cannot claim Green/Red.
    const measurementStatus = (f as unknown as { measurement?: { status?: string } }).measurement?.status ?? 'measured';
    let score = scorer(flat);
    if (measurementStatus === 'estimated') {
      const clamp = ESTIMATED_CLAMP[id];
      if (clamp) score = Math.min(clamp[1], Math.max(clamp[0], score));
    }
    const status = measurementStatus === 'estimated' ? ('estimated' as const) : ('measured' as const);
    const reason = reasonFn ? reasonFn(score, flat) : `${name} — evidence via ${f.provenance.tool} — score ${score}.`;
    const remediation = lookupRemediation(id);
    extraRows.push({ id, name, category_id: cat, status, score, reason, evidence: { tool: f.provenance.tool, tool_version: f.provenance.version, pointers: f.evidencePointers as unknown as [], facts: flat }, effort, remediation } as unknown as ReturnType<typeof phase1Rows>[number]);
  }
  // Data-dependent N/A (detector-honesty D6): ECOS-08 with zero detected
  // frameworks has no support surface to grade (spec `na_when`). Every other
  // absent-data case (no manifest / unsupported ecosystem) stays `unknown`.
  const dataNotApplicable = new Set<string>();
  {
    const ecos08 = extraRows.find(r => r.id === 'ECOS-08') as unknown as { evidence?: { facts?: { frameworks?: unknown[] } } } | undefined;
    const frameworks = ecos08?.evidence?.facts?.frameworks;
    if (Array.isArray(frameworks) && frameworks.length === 0) dataNotApplicable.add('ECOS-08');
  }
  // 5-state precedence: not_implemented > not_applicable > unknown > estimated > measured
  const IMPLEMENTED_SET = new Set(ALL_MEASURED_IDS);
  const allRowsWithApplicability = [...phase1, ...extraRows].map(r => {
    if (!IMPLEMENTED_SET.has(r.id)) {
      return { ...r, status: 'not_implemented' as const, score: undefined, reason: 'detector not implemented in this slice', unknown_measure_path: `What it takes: ${r.id} — detector pending; see rubric`, evidence: undefined, not_applicable: false };
    }
    if (dataNotApplicable.has(r.id)) {
      const why = 'no framework/support surface detected — ECOS-08 not applicable for this target';
      return { ...r, status: 'not_applicable' as const, score: undefined, reason: why, unknown_measure_path: why, evidence: undefined, not_applicable: true };
    }
    const evalRes = evaluateApplicability(r.id, archetype, plane as never);
    if (evalRes.notApplicable) {
      return { ...r, not_applicable: true, status: 'not_applicable' as const, score: undefined, reason: evalRes.reason, unknown_measure_path: evalRes.reason, evidence: undefined };
    }
    return r;
  });
  // Expand to full 102 for coverage.not_implemented accounting (append stub rows for non-implemented indicators)
  const allIds102 = (rubricData as unknown as { indicators: Array<{ id: string; category: string }> }).indicators.map(i => i.id);
  const existingIds = new Set(allRowsWithApplicability.map(r => r.id));
  const notImplementedStubs = allIds102.filter(id => !existingIds.has(id)).map(id => {
    const cat = lookupCategory(id);
    const name = lookupName(id);
    const effort = lookupEffort(id);
    return { id, name, category_id: cat, status: 'not_implemented' as const, reason: 'detector not implemented in this slice', unknown_measure_path: `Not implemented — ${id} requires a detector (see rubric)`, effort, not_applicable: false };
  });
  const allRowsForCoverage = [...allRowsWithApplicability, ...notImplementedStubs];
  // For required rows, ensure not_applicable never happens (evaluateApplicability already guarantees, but enforce) — keep 5-state table for categories
  // Explicit row type: the mapped union above infers too narrowly (loses the
  // measured/estimated variants), so downstream status/score/narrowing fails.
  // This cast is type-only; runtime values are untouched.
  type MvpRow = {
    id: string;
    name: string;
    category_id: string;
    status: 'measured' | 'estimated' | 'unknown' | 'not_applicable' | 'not_implemented';
    score?: number;
    reason?: string;
    unknown_measure_path?: string;
    evidence?: unknown;
    effort?: string;
    remediation?: unknown;
    not_applicable?: boolean;
  };
  const allRows = allRowsForCoverage as MvpRow[];
  // Use scorePhase1 logic but it already handles categories; for MVP we need to recompute
  const byCat = new Map<string, typeof allRows>();
  for (const r of allRows) { if (!byCat.has(r.category_id)) byCat.set(r.category_id, []); byCat.get(r.category_id)!.push(r); }
  const BASE_WEIGHTS: Record<string, number> = { SEC: 20, VEL: 10, TEST: 10, ECOS: 10, ARCH: 15, DATA: 10, API: 10, PERF: 10, DOCS: 5 };
  const CATEGORY_LABELS: Record<string, string> = {
    SEC: 'Security, Compliance & Vulnerability', VEL: 'Developer Velocity & Operational Drag', TEST: 'Testing & Quality Engineering',
    ECOS: 'Dependency & Ecosystem Health', ARCH: 'Architecture & Code Quality', DATA: 'Data & Schema Evolution',
    API: 'API & Integration Surface', PERF: 'Performance & Cloud/Infrastructure Fit', DOCS: 'Documentation & Knowledge Continuity',
  };
  // Determine applicable categories (those with at least one implemented-and-applicable row that is measured/estimated)
  const applicableCats = [...byCat.entries()].filter(([, rows]) => rows.some(r => r.status === 'measured' || r.status === 'estimated')).map(([cat]) => cat);
  const renormWeights = renormalizeWeights(applicableCats, BASE_WEIGHTS);
  // Legacy (renormalized) headline — retained as a reference field (deterministic-scoring 3.1).
  // Unknowns vanish from its denominator; machine-speed-dependent, never gated on.
  const legacyScore = (() => {
    let s = 0;
    for (const [cat, rows] of byCat.entries()) {
      const measured = rows.filter(r => !r.not_applicable && (r.status === 'measured' || r.status === 'estimated'));
      const sum = measured.reduce((a, r) => a + (r.score ?? 0), 0);
      const applicable = measured.length;
      const catPct = applicable ? (sum / (applicable * 3)) * 100 : 0;
      const w = renormWeights[cat] ?? 0;
      s += (catPct * w) / 100;
    }
    return s;
  })();
  // Preserve canonical score for footnote
  const canonicalScore = (() => {
    let s = 0;
    for (const [cat, rows] of byCat.entries()) {
      // Frozen denominator (3.1): unknowns stay in the denominator as disclosed
      // unscored (0 in the numerator); N/A + not_implemented stay excluded.
      const scored = rows.filter(r => !r.not_applicable && r.status !== 'not_implemented' && (r.status === 'measured' || r.status === 'estimated' || r.status === 'unknown'));
      const sum = scored.reduce((a, r) => a + (r.score ?? 0), 0);
      const applicable = scored.length;
      const catPct = applicable ? (sum / (applicable * 3)) * 100 : 0;
      s += (catPct * (BASE_WEIGHTS[cat] ?? 0)) / 100;
    }
    return s;
  })();
  const categories = [...byCat.entries()].map(([cat, rows]) => {
    const notApplicable = rows.filter(r => r.status === 'not_applicable').length;
    const notImplemented = rows.filter(r => r.status === 'not_implemented').length;
    const measured = rows.filter(r => r.status === 'measured');
    const estimated = rows.filter(r => r.status === 'estimated');
    const unknown = rows.filter(r => r.status === 'unknown').length;
    const sum = measured.reduce((a, r) => a + (r.score ?? 0), 0) + estimated.reduce((a, r) => a + (r.score ?? 0), 0);
    const applicable = measured.length + estimated.length;
    const legacy_category_score = applicable ? (sum / (applicable * 3)) * 100 : null;
    // Frozen denominator: unknowns disclosed as unscored (3.1)
    const frozenApplicable = applicable + unknown;
    const category_score = frozenApplicable ? (sum / (frozenApplicable * 3)) * 100 : null;
    const weight = renormWeights[cat] ?? 0;
    const canonicalWeight = BASE_WEIGHTS[cat] ?? 0;
    const weighted_contribution = category_score == null ? 0 : (category_score * canonicalWeight) / 100;
    const legacy_weighted = legacy_category_score == null ? 0 : (legacy_category_score * weight) / 100;
    return { id: cat, name: CATEGORY_LABELS[cat] ?? cat, weight: canonicalWeight, canonical_weight: canonicalWeight, applicable: frozenApplicable, scored_sum: sum, category_score, renormalized_category_score: legacy_category_score, weighted_contribution, legacy_weighted_contribution: legacy_weighted, status_counts: { measured: measured.length, estimated: estimated.length, unknown, not_applicable: notApplicable, not_implemented: notImplemented }, indicator_rows: rows };
  });
  // No phantom empty categories — empty categories are omitted (not evaluated) but keep for display as dimmed if entirely N/A / Not Implemented
  // Headline uses the frozen denominator (3.1); the renormalized value is reference-only.
  const score = categories.reduce((a,c) => a + c.weighted_contribution, 0);
  const renormalizedScore = categories.reduce((a,c) => a + (c.legacy_weighted_contribution ?? 0), 0);
  const measured = allRows.filter(r => r.status === 'measured').length;
  const estimated = allRows.filter(r => r.status === 'estimated').length;
  const not_applicable = allRows.filter(r => r.status === 'not_applicable').length;
  const not_implemented = allRows.filter(r => r.status === 'not_implemented').length;
  const unknown = allRows.filter(r => r.status === 'unknown').length;
  // coverage over applicable + unknown (not including not_applicable/not_implemented in denominator, but we expose them)
  const totalApplicable = measured + estimated + unknown;
  const coverage = { measured, estimated, unknown, not_applicable, not_implemented, measured_pct: `${Math.round(measured/(totalApplicable||1)*100)}%`, estimated_pct: `${Math.round(estimated/(totalApplicable||1)*100)}%`, unknown_pct: `${Math.round(unknown/(totalApplicable||1)*100)}%`, not_applicable_pct: `${Math.round(not_applicable/102*100)}%`, not_implemented_pct: `${Math.round(not_implemented/102*100)}%` };
  const status = (measured === ALL_MEASURED_IDS.length || measured === MVP_IDS.length) ? 'complete' as const : 'degraded' as const;
  // Coverage floor (3.2, D6): fewer than half of requested rows measured **or
  // estimated** → suppress the headline with an explicit insufficient-signal
  // verdict instead of a number. An `estimated` row counts toward the floor.
  // Requested ≈ rows the scan attempted (measured + estimated + unknown).
  const requested = measured + estimated + unknown;
  const suppressed = requested > 0 && measured + estimated < requested * COVERAGE_FLOOR;
  const verdict = suppressed ? ('insufficient-signal' as const) : undefined;
  const rawGates = evaluateGates(facts);
  // Gate corollary (D5/3.3): a gate with NO measured/estimated source row is
  // unevaluable — reported in the verdict line, never silently uncapped.
  const rowStatusById = new Map(allRows.map(r => [r.id, r.status]));
  const gates = rawGates.map(g => {
    const statuses = g.source_rows.map(id => rowStatusById.get(id) ?? 'not_implemented');
    if (statuses.some(s => s === 'measured' || s === 'estimated')) return g;
    let note: string;
    if (statuses.every(s => s === 'not_implemented')) note = 'detector not implemented in this slice — gate unevaluable';
    else if (statuses.every(s => s === 'not_applicable' || s === 'not_implemented')) note = 'not applicable for this archetype — gate unevaluable';
    else note = `${g.note} — unevaluable: source row(s) unknown`;
    return { ...g, status: 'unevaluable' as const, note };
  });
  return { categories, coverage, score, renormalized_score: renormalizedScore, canonical_score: canonicalScore, status, gates, rows: allRows, suppressed, verdict };
}
