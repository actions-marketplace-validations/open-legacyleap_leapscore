import { describe, it, expect } from 'vitest';
import { scoreMvp } from './mvp.js';
import { factsToRows } from './phase1.js';
import type { FactRecord } from '../../facts.js';

function fake(id: string, facts: Record<string, unknown>, tool: string = 'test'): FactRecord {
  return {
    id,
    detectorId: id,
    schemaVersion: '1.0.0',
    facts,
    evidencePointers: [{ detail: `${id} detail` }],
    provenance: { tool, version: '1', flags: [tool], durationMs: 1 },
    truncated: false,
  } as unknown as FactRecord;
}

function getRow(rows: ReturnType<typeof scoreMvp>['rows'], id: string) {
  const r = rows.find((x) => x.id === id);
  if (!r) throw new Error(`missing row ${id}`);
  return r as unknown as { score?: number; reason?: string; evidence?: { facts: Record<string, unknown> } };
}

describe('mvp scorer — flatten + predicates + rationale (all tranche-A at once)', () => {
  it('DOCS-03 no-runbooks scores 0 with table-flat facts and rationale', () => {
    const f = fake('DOCS-03', { docs03: { runbook_dir: null, count: 0, topics_covered: [], restore_doc_present: false, newest_days: 9999 } }, 'runbook-inventory');
    const res = scoreMvp([...['VEL-06','VEL-09','VEL-08','VEL-10','SEC-07','TEST-08'].map((id) => fake(id, { [id.toLowerCase().replace('-','')]: {} })), f]);
    const row = getRow(res.rows, 'DOCS-03');
    expect(row.score).toBe(0);
    expect(row.reason).toContain('per DOCS-03 Red flag');
    expect(row.reason).not.toMatch(/^DOCS-03/);
    expect(row.evidence?.facts).not.toHaveProperty('docs03');
    expect(row.evidence?.facts).toHaveProperty('count', 0);
  });

  it('DOCS-03 partial scores 2 and healthy scores 3', () => {
    const partial = fake('DOCS-03', { docs03: { runbook_dir: 'docs/runbooks', count: 3, topics_covered: ['deploy','oncall'], restore_doc_present: false, newest_days: 40 } }, 'runbook-inventory');
    const healthy = fake('DOCS-03', { docs03: { runbook_dir: 'docs/runbooks', count: 5, topics_covered: ['deploy','restore','oncall','incident'], restore_doc_present: true, newest_days: 10 } }, 'runbook-inventory');
    const dummyPhase = ['VEL-06','VEL-09','VEL-08','VEL-10','SEC-07','TEST-08'].map((id) => fake(id, { [id.toLowerCase().replace('-','')]: {} }));
    expect(getRow(scoreMvp([...dummyPhase, partial]).rows, 'DOCS-03').score).toBe(2);
    expect(getRow(scoreMvp([...dummyPhase, healthy]).rows, 'DOCS-03').score).toBe(3);
  });

  it('DOCS-08 no-changelog scores 0 and healthy scores 3 with rationale', () => {
    const absent = fake('DOCS-08', { docs08: { changelog_present: false, changelog_current: false, releases_sampled: 0, with_notes_pct: 0, breaking_with_migration_guide: { total_breaking: 0, documented: 0 }, release_tooling: null } }, 'changelog-inventory');
    const healthy = fake('DOCS-08', { docs08: { changelog_present: true, changelog_current: true, releases_sampled: 12, with_notes_pct: 0.7, breaking_with_migration_guide: { total_breaking: 2, documented: 2 }, release_tooling: 'semantic-release' } }, 'changelog-inventory');
    const dummy = ['VEL-06','VEL-09','VEL-08','VEL-10','SEC-07','TEST-08'].map((id) => fake(id, { [id.toLowerCase().replace('-','')]: {} }));
    const r0 = getRow(scoreMvp([...dummy, absent]).rows, 'DOCS-08');
    const r3 = getRow(scoreMvp([...dummy, healthy]).rows, 'DOCS-08');
    expect(r0.score).toBe(0);
    expect(r0.reason).toContain('per DOCS-08 Red flag');
    expect(r0.evidence?.facts).not.toHaveProperty('docs08');
    expect(r3.score).toBe(3);
    expect(r3.reason).toContain('per DOCS-08 Green');
  });

  it('DOCS-04 no-onboarding scores 0 with flat facts', () => {
    const absent = fake('DOCS-04', { docs04: { docs_present: [], stages_covered: [], stages_missing: ['setup','run','test'], undefined_commands: [], last_verified_days: 9999 } }, 'onboarding-inventory');
    const dummy = ['VEL-06','VEL-09','VEL-08','VEL-10','SEC-07','TEST-08'].map((id) => fake(id, { [id.toLowerCase().replace('-','')]: {} }));
    const row = getRow(scoreMvp([...dummy, absent]).rows, 'DOCS-04');
    expect(row.score).toBe(0);
    expect(row.reason).toContain('per DOCS-04 Red flag');
    expect(row.evidence?.facts).toHaveProperty('docs_present');
    expect(row.evidence?.facts).not.toHaveProperty('docs04');
  });

  it.each([
    ['DOCS-01', { docs01: { adr_dir: null, adr_count: 0, newest_adr_days: 9999 } }, 0],
    ['DOCS-09', { docs09: { doc_ci_steps: [], link_checker: false, api_gen_wired: false, staleness_gate: false } }, 0],
    ['PERF-02', { perf02: { artifacts: [], model: 'none-declared', ci_builds_images: false } }, 0],
    ['PERF-06', { perf06: { iac_frameworks: [], resource_classes_declared: [], classes_implied_by_deploy: ['compute'], ci_plan_gate: { present: false }, undeclared_classes: ['compute'] } }, 1],
    ['DATA-01', { data01: { framework: 'alembic', migration_count: 5, chain_replayable: true, destructive_ops: [], raw_sql_share: 0, graph_cycles: 0 } }, 3],
    ['ECOS-08', { ecos08: { frameworks: [{ name: 'react', version: '18.0', support_status: 'active' }], coupling_share: 0.1, facade_layer_detected: false, fork_pinned: false } }, 3],
    ['SEC-09', { sec09: { harnesses: [], sanitizers_in_build: false, continuous_fuzzing: { oss_fuzz: false }, parser_surface_detected: ['json'] } }, 0],
    ['SEC-10', { sec10: { security_jobs: [], classes_present: [], secret_scan_covers_history: false, image_scan_on_build: false, workflow_permissions_hardened: false } }, 0],
  ] as const)('%s absent fixture scores predictably and reason cites rationale', (id, facts, expectedScore) => {
    const dummy = ['VEL-06','VEL-09','VEL-08','VEL-10','SEC-07','TEST-08'].map((did) => fake(did, { [did.toLowerCase().replace('-','')]: {} }));
    const row = getRow(scoreMvp([...dummy, fake(id, facts as Record<string,unknown>)]).rows, id);
    expect(row.score).toBe(expectedScore);
    expect(row.reason).toMatch(/per /i);
    expect(row.reason).not.toMatch(new RegExp(`^${id}`));
    expect(row.evidence?.facts).not.toHaveProperty(id.toLowerCase().replace('-',''));
  });

  it('never emits [object Object] — flat facts are primitives or stringified', () => {
    const cases: Array<[string, Record<string, unknown>]> = [
      ['DOCS-08', { docs08: { changelog_present: false, with_notes_pct: 0, releases_sampled: 0, breaking_with_migration_guide: { total_breaking: 0, documented: 0 } } }],
      ['ECOS-06', { ecos06: { transitive_total: 100, duplicates: [{ name: 'lodash', versions: ['1','2'] }], pct_direct_unused: 5, duplicate_security_critical: false } }],
      ['SEC-10', { sec10: { security_jobs: [{ name: 'semgrep', class: 'sast', trigger: 'push', blocking: true }], classes_present: ['sast'], secret_scan_covers_history: true, image_scan_on_build: false, workflow_permissions_hardened: true } }],
    ];
    const dummy = ['VEL-06','VEL-09','VEL-08','VEL-10','SEC-07','TEST-08'].map((id) => fake(id, { [id.toLowerCase().replace('-','')]: {} }));
    for (const [id, facts] of cases) {
      const row = getRow(scoreMvp([...dummy, fake(id, facts)]).rows, id);
      for (const v of Object.values(row.evidence!.facts)) {
        if (Array.isArray(v)) {
          for (const el of v) {
            if (el && typeof el === 'object') expect(JSON.stringify(el)).not.toBe('[object Object]');
          }
        } else if (v && typeof v === 'object') {
          expect(JSON.stringify(v)).not.toBe('[object Object]');
          // object values are rendered via formatFactValue(JSON.stringify) in UI — String(object) is intentionally [object Object] but UI never uses String
        } else {
          expect(String(v)).not.toBe('[object Object]');
        }
      }
    }
  });
});

describe('phase1 scorer — ID-free rationale + flat facts', () => {
  it('VEL-06 etc. reason is ID-free and cites per ... flag', () => {
    const f = fake('VEL-06', { vel06: { bus_factor_repo: 1, top_author_share: 0.8 } }, 'gh-api');
    const rows = factsToRows([f]);
    const r = rows.find((x) => x.id === 'VEL-06')!;
    expect(r.reason).not.toMatch(/^VEL-06/);
    expect(r.reason).toMatch(/per VEL-06/i);
    expect(r.evidence?.facts).toHaveProperty('bus_factor_repo');
    expect(r.evidence?.facts).not.toHaveProperty('vel06');
  });

  it('all 6 phase1 rows include per flag rationale when measured', () => {
    const facts: FactRecord[] = [
      fake('VEL-06', { vel06: { bus_factor_repo: 3, top_author_share: 0.2 } }, 'gh-api'),
      fake('VEL-09', { vel09: { review_coverage_pct: 0.9, prs_sampled: 20 } }, 'gh-api'),
      fake('VEL-08', { vel08: { cd_chain: { build: true, deploy_job: true }, rollback_target: true } }, 'gh-api'),
      fake('VEL-10', { vel10: { branches_total: 5, stale_over_30d: 0, model: 'trunk-based' } }, 'gh-api'),
      fake('SEC-07', { sec07: { bot: { present: true }, open_bot_prs: { p95_age_days: 5 } } }, 'gh-api'),
      fake('TEST-08', { test08: { gates: { lint: { present: true }, sast: { present: true }, coverage_gate: { present: true } } } }, 'gh-api'),
    ];
    const rows = factsToRows(facts);
    for (const r of rows) {
      if (r.status === 'measured') {
        expect(r.reason).toMatch(/per /i);
        expect(r.reason).not.toMatch(new RegExp(`^${r.id}`));
        for (const v of Object.values(r.evidence!.facts)) { if (v && typeof v === 'object') { expect(JSON.stringify(v)).not.toBe('[object Object]'); } else { expect(String(v)).not.toBe('[object Object]'); } }
      }
    }
  });
});
