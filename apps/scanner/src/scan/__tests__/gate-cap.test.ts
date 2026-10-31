/** Kill-switch gate cap (Gates G1–G8) — a proven gate caps the SEALED band, not
 *  just a display helper. Every claim below is a claim the report surfaces make:
 *  the band is lowered, the score is untouched, the cap is disclosed on the
 *  envelope, the next-band path points above the capped band, and the cap is
 *  visible in HTML/Markdown/stdout. */
import { describe, it, expect } from 'vitest';
import { gateCapForTier, gateCapStatement, GATE_CAPPED_TIER } from '@leapscore/contracts';
import { scoreMvp } from '../scoring/scorer/mvp';
import { deriveNextBandPath } from '../scoring/bandpath';
import { sealScan } from '../scoring/seal';
import { renderHtml, renderMarkdown } from '../render';
import { formatStdout } from '../scoring/seal';
import type { FactRecord } from '../facts';

function fake(id: string, facts: Record<string, unknown>, error?: FactRecord['error']): FactRecord {
  return {
    id,
    detectorId: id,
    schemaVersion: '1.0.0',
    facts,
    evidencePointers: [{ detail: `${id} detail` }],
    provenance: { tool: 'test', version: '1', flags: ['test'], durationMs: 1 },
    truncated: false,
    ...(error ? { error } : {}),
  } as unknown as FactRecord;
}

/** A clean, healthy repo whose one blemish is a verified-live credential: G1
 * proves, so the verdict must be capped no matter how good the average is.
 * Facts are shaped to satisfy each row's own scorer predicates, and every row the
 * build can grade is present so the coverage floor does not suppress the headline
 * (a suppressed headline has no verdict to cap). */
function healthyRepoWithLiveSecret(): FactRecord[] {
  const graded: Array<[string, Record<string, unknown>]> = [
    ['DOCS-01', { docs01: { adr_count: 8, adr_dir: 'docs/adr', newest_adr_days: 20 } }],
    ['DOCS-03', { docs03: { count: 6, runbook_dir: 'docs/runbooks', topics_covered: ['restore', 'rollback'], restore_doc_present: true, newest_days: 10 } }],
    ['DOCS-04', { docs04: { docs_present: ['CONTRIBUTING.md'], stages_covered: ['setup', 'run', 'test'], stages_missing: [], last_verified_days: 20 } }],
    ['DOCS-08', { docs08: { changelog_present: true, changelog_current: true, with_notes_pct: 0.9 } }],
    ['DOCS-09', { docs09: { doc_ci_steps: [{ kind: 'build', tool: 'mkdocs', blocking: true }], link_checker: true, api_gen_wired: true, staleness_gate: true } }],
    ['PERF-02', { perf02: { model: 'orchestrated' } }],
    ['PERF-06', { perf06: { iac_frameworks: ['terraform'], resource_classes_declared: ['compute', 'storage'], classes_implied_by_deploy: ['compute'], ci_plan_gate: { present: true }, undeclared_classes: [] } }],
    ['DATA-01', { data01: { migration_tool: 'alembic', migration_count: 40, graph_cycles: 0, chain_replayable: true, destructive_ops: [], raw_sql_share: 0 } }],
    ['ECOS-01', { ecos01: { runtimes: [{ product: 'node', version: '22', days_until_eol: 400, is_past_eol: false, pin_source: '.nvmrc' }], lookup_ok: true } }],
    ['ECOS-02', { ecos02: { pct_behind_1plus_major: 0, core_framework_gaps: [{ name: 'react', majors_behind: 0 }] } }],
    ['ECOS-03', { ecos03: { abandoned: [], bus_factor_1_count: 0 } }],
    ['ECOS-05', { ecos05: { copyleft_strong: [], license_unknown_count: 0, sbom_present_in_repo: true, closed_source_distribution_likely: false } }],
    ['ECOS-06', { ecos06: { duplicate_security_critical: false, transitive_total: 120, duplicates: [], pct_direct_unused: 2 } }],
    ['ECOS-07', { ecos07: { lockfiles: [{ stale: false }], manifests_total: 1, pin_ratio: 100, ci_immutable_install: { enforced: true } } }],
    ['ECOS-08', { ecos08: { frameworks: [{ name: 'react', version: '19', support_status: 'active' }], coupling_share: 0.1, facade_layer_detected: false } }],
    ['ARCH-05', { arch05: { hotspots: [], churn_top10_share: 0.05, commits_analyzed: 200 } }],
    ['SEC-01', { sec01: { findings: [] } }],
    ['SEC-09', { sec09: { parser_surface_detected: [], harnesses: [{ target: 'parser' }], sanitizers_in_build: true, continuous_fuzzing: { oss_fuzz: true } } }],
    ['SEC-10', { sec10: { security_jobs: [{ name: 'semgrep', class: 'sast', blocking: true }], classes_present: ['sast', 'deps', 'secret'], secret_scan_covers_history: true, image_scan_on_build: true } }],
    ['TEST-03', { test03: { unit: 400, integration: 120, e2e: 5, unclassified: 0, e2e_share_est: 0.03, classification_confidence: { high: 0.95, low: 0.05 } } }],
    ['TEST-05', { test05: { skip_ratio: 0.001, aged_skips: [] } }],
    // GH-lane rows: present so they are attempted, and graded so the coverage
    // floor is not dominated by rows this fixture cannot fetch.
    ['VEL-06', { vel06: { bus_factor: 9, top_author_share: 0.2 } }],
    ['VEL-08', { vel08: { manual_steps: 0, workflows: 4 } }],
    ['VEL-09', { vel09: { review_coverage_pct: 98, prs_sampled: 100 } }],
    ['VEL-10', { vel10: { branch_model: 'trunk', total: 3 } }],
    ['SEC-07', { sec07: { tool: 'renovate', config_present: true } }],
    ['TEST-08', { test08: { gates: { lint: { present: true }, sast: { present: true }, coverage_gate: { present: true } } } }],
  ];
  const rows = graded.map(([id, facts]) => fake(id, facts));
  // SEC-02 with a verified-live secret → G1 proven.
  rows.push(fake('SEC-02', { sec02: { verified_live: 1, tree_findings: [], history_only_findings: 0, history_scanned_full: true } }));
  return rows;
}

function snap() {
  return {
    repo: 'acme/ledger',
    scanned_at: '2026-10-31T00:00:00.000Z',
    engine_version: 'test-engine',
    rubric_version: 'docs/rubric@test',
    scanned_commit: 'abc1234567890',
    archetype: 'service',
    planeInventory: { has_server: true, has_data: true, has_deploy: true, has_client: true, has_test: true },
  };
}

describe('gate cap contract', () => {
  it('a proven gate caps any band above High to High', () => {
    for (const tier of ['Low', 'Moderate']) {
      const cap = gateCapForTier(tier, ['G1']);
      expect(cap.tier).toBe(GATE_CAPPED_TIER);
      expect(cap.capped).toBe(true);
      expect(cap.uncappedTier).toBe(tier);
      expect(cap.cappedByGates).toEqual(['G1']);
    }
  });
  it('Critical is a ceiling not a floor — a proven gate leaves it alone', () => {
    const cap = gateCapForTier('Critical', ['G1']);
    expect(cap.tier).toBe('Critical');
    expect(cap.capped).toBe(false);
    expect(cap.cappedByGates).toEqual(['G1']);
  });
  it('no proven gate changes nothing and discloses nothing', () => {
    const cap = gateCapForTier('Low', []);
    expect(cap).toEqual({ tier: 'Low', capped: false, cappedByGates: [] });
  });
  it('a verdict already at the cap is not reported as capped', () => {
    const cap = gateCapForTier('High', ['G2']);
    expect(cap.tier).toBe('High');
    expect(cap.capped).toBe(false);
  });
  it('the statement names the gates and the band the score earned', () => {
    const s = gateCapStatement(['G1', 'G3'], 'Low');
    expect(s).toContain('G1, G3');
    expect(s).toContain('Low');
    expect(s).toContain(GATE_CAPPED_TIER);
  });
});

describe('the sealed verdict honours the cap', () => {
  it('a proven G1 caps the sealed band while the score keeps its honest value', () => {
    const facts = healthyRepoWithLiveSecret();
    const mvp = scoreMvp(facts as never, {
      archetype: 'service',
      planeInventory: snap().planeInventory,
    });
    const score = Math.round(mvp.score * 100) / 100;
    // Precondition: the score alone would earn a band above High.
    const uncapped = score >= 80 ? 'Low' : score >= 53 ? 'Moderate' : score >= 27 ? 'High' : 'Critical';
    expect(uncapped === 'Low' || uncapped === 'Moderate').toBe(true);

    const sealed = sealScan({
      facts,
      snapshot: snap(),
      budgetMs: 60_000,
      startMs: Date.now(),
      trace: [],
      subjectSlug: 'ledger',
      engineRef: 'abc1234',
    });
    expect(sealed.report.headline.tier).toBe(GATE_CAPPED_TIER);
    expect(sealed.report.headline.gate_capped).toBe(true);
    expect(sealed.report.headline.uncapped_tier).toBe(uncapped);
    expect(sealed.report.headline.capped_by_gates).toContain('G1');
    // The score is untouched by the cap, and the meta band agrees with the report.
    expect(sealed.report.headline.score).toBe(score);
    expect(sealed.meta.tier).toBe(GATE_CAPPED_TIER);
    expect(sealed.meta.score).toBe(score);
  });

  it('a clean repo with no proven gate keeps the band its score earned', () => {
    // Same healthy repo, but the secret is gone: SEC-02 is clean, so G1 is
    // not-proven and nothing caps the verdict.
    const facts = healthyRepoWithLiveSecret().map((f) =>
      f.detectorId === 'SEC-02'
        ? fake('SEC-02', { sec02: { verified_live: 0, tree_findings: [], history_only_findings: 0, history_scanned_full: true } })
        : f,
    );
    const sealed = sealScan({
      facts,
      snapshot: snap(),
      budgetMs: 60_000,
      startMs: Date.now(),
      trace: [],
      subjectSlug: 'ledger',
      engineRef: 'abc1234',
    });
    expect(sealed.report.headline.suppressed).toBe(false);
    expect(sealed.report.headline.gate_capped).toBeUndefined();
    expect(sealed.report.headline.uncapped_tier).toBeUndefined();
    expect(sealed.report.headline.capped_by_gates).toBeUndefined();
  });

  it('the next-band path keeps its spec arithmetic under a cap', () => {
    const sealed = sealScan({
      facts: healthyRepoWithLiveSecret(),
      snapshot: snap(),
      budgetMs: 60_000,
      startMs: Date.now(),
      trace: [],
      subjectSlug: 'ledger',
      engineRef: 'abc1234',
    });
    const score = sealed.report.headline.score;
    const path = sealed.report.next_band_path!;
    expect(path).toBeDefined();
    expect(sealed.report.headline.tier).toBe(GATE_CAPPED_TIER);
    // The cap lowers the band; it does not move the score. So the path stays
    // `threshold − score` to the nearest band the score has not reached, and the
    // capped band itself is never offered back as the destination.
    expect(score).toBeGreaterThanOrEqual(53);
    expect(score).toBeLessThan(80);
    expect(path.destination).toBe('Low');
    expect(path.threshold).toBe(80);
    expect(path.points_needed).toBeCloseTo(80 - score, 2);
  });

  it('the sealed band is never offered back as its own destination', () => {
    const atSealedBand = deriveNextBandPath({ score: 30, tier: 'High', rows: [], categories: [], registry: {} });
    expect(atSealedBand?.destination).toBe('Moderate');
    // A score that numerically reaches the top band while capped to High has
    // nothing above it: the path is terminal and no destination is invented.
    const cappedTop = deriveNextBandPath({ score: 85, tier: 'High', rows: [], categories: [], registry: {} });
    expect(cappedTop?.terminal).toBe(true);
    expect(cappedTop?.destination).toBeNull();
    // Uncapped runs keep the spec's arithmetic exactly: threshold − score.
    const plain = deriveNextBandPath({ score: 48, tier: 'High', rows: [], categories: [], registry: {} });
    expect(plain?.destination).toBe('Moderate');
    expect(plain?.points_needed).toBe(5);
  });

  it('a suppressed headline keeps insufficient-signal precedence over the cap', () => {
    const sealed = sealScan({
      facts: [fake('SEC-02', { sec02: { verified_live: 1, tree_findings: [] } })],
      snapshot: snap(),
      budgetMs: 60_000,
      startMs: Date.now(),
      trace: [],
      subjectSlug: 'ledger',
      engineRef: 'abc1234',
    });
    expect(sealed.report.headline.suppressed).toBe(true);
    expect(sealed.report.headline.verdict).toBe('insufficient-signal');
    expect(sealed.report.headline.gate_capped).toBeUndefined();
  });
});

describe('every surface discloses the cap', () => {
  const cappedFacts = healthyRepoWithLiveSecret();
  const cappedSealed = sealScan({
    facts: cappedFacts,
    snapshot: snap(),
    budgetMs: 60_000,
    startMs: Date.now(),
    trace: [],
    subjectSlug: 'ledger',
    engineRef: 'abc1234',
  });
  const renderInput = {
    score: cappedSealed.report.headline.score,
    tier: cappedSealed.report.headline.tier,
    repo: 'acme/ledger',
    repoSha: 'abc1234567890',
    runId: cappedSealed.runId,
    scannedAt: '2026-10-31T00:00:00.000Z',
    status: cappedSealed.report.status,
    coverage: cappedSealed.report.coverage,
    gates: cappedSealed.report.gates,
    topBlockers: cappedSealed.report.top_blockers,
    nextBandPath: cappedSealed.report.next_band_path,
    categories: cappedSealed.report.categories,
    gateCapped: cappedSealed.report.headline.gate_capped === true,
    uncappedTier: cappedSealed.report.headline.uncapped_tier,
    cappedByGates: cappedSealed.report.headline.capped_by_gates,
  };

  it('the fixture really is capped (guards against a vacuous green)', () => {
    expect(cappedSealed.report.headline.gate_capped).toBe(true);
    expect(cappedSealed.report.headline.tier).toBe(GATE_CAPPED_TIER);
  });

  it('HTML states the cap next to the headline', () => {
    const html = renderHtml(renderInput);
    expect(html).toMatch(/Verdict capped at High/);
    expect(html).toMatch(/G1/);
  });
  it('Markdown states the cap next to the headline', () => {
    const md = renderMarkdown(renderInput);
    expect(md).toMatch(/\*\*Verdict capped at High\.\*\*/);
    expect(md).toMatch(/G1/);
  });
  it('stdout names the cap right after the band', () => {
    const line = formatStdout(cappedSealed.report as never);
    expect(line).toContain('/High gate-capped from');
    expect(line).toContain('G1');
  });
  it('an uncapped run states no cap anywhere', () => {
    const clean = sealScan({
      facts: cappedFacts.map((f) =>
        f.detectorId === 'SEC-02'
          ? fake('SEC-02', { sec02: { verified_live: 0, tree_findings: [], history_only_findings: 0, history_scanned_full: true } })
          : f,
      ),
      snapshot: snap(),
      budgetMs: 60_000,
      startMs: Date.now(),
      trace: [],
      subjectSlug: 'ledger',
      engineRef: 'abc1234',
    });
    expect(clean.report.headline.gate_capped).toBeUndefined();
    expect(formatStdout(clean.report as never)).not.toContain('gate-capped');
    expect(renderMarkdown({ ...renderInput, gateCapped: false, uncappedTier: undefined, cappedByGates: undefined })).not.toMatch(/Verdict capped/);
    expect(renderHtml({ ...renderInput, gateCapped: false, uncappedTier: undefined, cappedByGates: undefined })).not.toMatch(/Verdict capped/);
  });
});
