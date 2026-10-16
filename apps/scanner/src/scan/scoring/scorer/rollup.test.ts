import { describe, it, expect } from 'vitest';
import { evaluateGates, cappedTier } from './rollup.js';
import type { FactRecord } from '../../facts.js';

function fake(id: string, facts: Record<string, unknown>, error?: FactRecord['error']): FactRecord {
  return {
    id,
    detectorId: id,
    schemaVersion: '1.0.0',
    facts,
    evidencePointers: [],
    provenance: { tool: 'test', version: '1', flags: [], durationMs: 1 },
    truncated: false,
    ...(error ? { error } : {}),
  } as unknown as FactRecord;
}

describe('gate predicates (MVP)', () => {
  it('G1 not-proven on clean tree+history', () => {
    const f = fake('SEC-02', { sec02: { tree_findings: [], history_only_findings: 0, verified_live: 0, history_scanned_full: true } });
    const g = evaluateGates([f]).find(x => x.id === 'G1')!;
    expect(g.status).toBe('not-proven');
  });
  it('G1 proven on verified-live', () => {
    const f = fake('SEC-02', { sec02: { tree_findings: [], verified_live: 1, history_scanned_full: true } });
    const g = evaluateGates([f]).find(x => x.id === 'G1')!;
    expect(g.status).toBe('proven');
  });
  it('G1 needs-verification when fact missing (GH-only)', () => {
    const g = evaluateGates([]).find(x => x.id === 'G1')!;
    expect(g.status).toBe('needs-verification');
  });
  it('G2 proven on critical reachable', () => {
    const f = fake('SEC-01', { sec01: { critical_open_over_14d: 1, findings: [{ id: 'CVE-2025-1234', pkg: 'urllib3', in_core_import_closure: true }] } });
    const g = evaluateGates([f]).find(x => x.id === 'G2')!;
    expect(g.status).toBe('proven');
  });
  it('G2 not-proven when zero criticals', () => {
    const f = fake('SEC-01', { sec01: { critical_open_over_14d: 0, findings: [] } });
    const g = evaluateGates([f]).find(x => x.id === 'G2')!;
    expect(g.status).toBe('not-proven');
  });
  it('G3 proven on past EOL', () => {
    const f = fake('ECOS-01', { ecos01: { runtimes: [{ product: 'python', version: '3.6', is_past_eol: true }], lookup_ok: true } });
    expect(evaluateGates([f]).find(x => x.id === 'G3')!.status).toBe('proven');
  });
  it('G3 not-proven on healthy', () => {
    const f = fake('ECOS-01', { ecos01: { runtimes: [{ product: 'python', version: '3.11', is_past_eol: false }], lookup_ok: true } });
    expect(evaluateGates([f]).find(x => x.id === 'G3')!.status).toBe('not-proven');
  });
  it('G8 proven on copyleft closed', () => {
    const f = fake('ECOS-05', { ecos05: { copyleft_strong: [{ name: 'foo' }], closed_source_distribution_likely: true } });
    expect(evaluateGates([f]).find(x => x.id === 'G8')!.status).toBe('proven');
  });
  it('G8 not-proven on clean', () => {
    const f = fake('ECOS-05', { ecos05: { copyleft_strong: [], closed_source_distribution_likely: false } });
    expect(evaluateGates([f]).find(x => x.id === 'G8')!.status).toBe('not-proven');
  });
  it('G6 partial stays needs-verification with split note', () => {
    const f = fake('VEL-08', { vel08: { manual_steps: 1 } });
    const g = evaluateGates([f]).find(x => x.id === 'G6')!;
    expect(g.status).toBe('needs-verification');
    expect(g.note).toContain('manual_steps=1');
    expect(g.note).toContain('CFR unknown');
  });
  it('G4/G5/G7 outside MVP stay needs-verification', () => {
    const gates = evaluateGates([]);
    expect(gates.find(x => x.id === 'G4')!.status).toBe('needs-verification');
    expect(gates.find(x => x.id === 'G5')!.status).toBe('needs-verification');
    expect(gates.find(x => x.id === 'G7')!.status).toBe('needs-verification');
  });
});

describe('gate capping', () => {
  it('78 + G1 proven caps to High Risk', () => {
    const f = fake('SEC-02', { sec02: { tree_findings: [{ rule: 'aws' }], verified_live: 1, history_scanned_full: true } });
    const gates = evaluateGates([f]);
    const capped = cappedTier(78, gates);
    expect(capped.tier).toBe('High Risk');
    expect(capped.capped).toBe(true);
  });
  it('20 + proven stays Critical (stricter wins)', () => {
    const f = fake('SEC-02', { sec02: { tree_findings: [{ rule: 'aws' }] } });
    const gates = evaluateGates([f]);
    const capped = cappedTier(20, gates);
    expect(capped.tier).toBe('Critical');
  });
  it('78 + no proven stays Moderate', () => {
    const gates = evaluateGates([]);
    // no proven -> tierForScore 78 is Moderate, not capped
    const capped = cappedTier(78, gates);
    expect(capped.tier).toBe('Moderate');
    expect(capped.capped).toBe(false);
  });
});
