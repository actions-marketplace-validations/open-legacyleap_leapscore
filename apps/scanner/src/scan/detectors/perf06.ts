import type { ScanContext, RawFact } from '../detector';
import { ghErrorKind, makeProvenance, toolVersion } from './common';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

export async function detectPerf06(ctx: ScanContext, signal: AbortSignal): Promise<RawFact> {
  const start = Date.now();
  if (signal.aborted) return { detectorId: 'PERF-06', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: makeProvenance('iac-inventory', start), truncated: true, error: { kind: 'cap', detail: 'aborted' } };
  try {
    const iacFrameworks: string[] = [];
    const iacFiles: string[] = [];
    const tfCheck = async (dir:string, name:string) => { try { const e = (await readdir(join(ctx.clonePath, dir))).sort(); if (e.some(f=>f.endsWith('.tf'))) { iacFrameworks.push(name); iacFiles.push(dir); } } catch {} };
    await tfCheck('terraform','terraform');
    await tfCheck('infra','terraform');
    try { const e = (await readdir(join(ctx.clonePath,'.pulumi'))).sort(); if (e.length) { iacFrameworks.push('pulumi'); iacFiles.push('.pulumi'); } } catch {}
    const cfn = await ctx.readFile('cloudformation.yaml') || await ctx.readFile('template.yaml');
    if (cfn) iacFrameworks.push('cloudformation');
    const hasTf = iacFrameworks.length>0;
    // implied classes from deploy artifacts (perf02 share)
    const facts = { perf06: { iac_frameworks: iacFrameworks, resource_classes_declared: hasTf? ['compute','db']: [], classes_implied_by_deploy: ['compute'], ci_plan_gate: { present: false }, undeclared_classes: hasTf? []: ['compute'] } };
    return { detectorId: 'PERF-06', schemaVersion: '1.0.0', facts: facts as unknown as Record<string, unknown>, evidencePointers: [{ detail: iacFrameworks.length? `IaC ${iacFrameworks.join(',')}`: 'no IaC' }], provenance: { tool: 'iac-inventory', version: toolVersion('iac-inventory'), flags: ['iac-inventory'], durationMs: Date.now() - start }, truncated: false };
  } catch (e) { return { detectorId: 'PERF-06', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: makeProvenance('iac-inventory', start), truncated: true, error: ghErrorKind(e) }; }
}
