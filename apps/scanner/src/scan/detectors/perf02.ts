import type { ScanContext, RawFact } from '../detector';
import { ghErrorKind, makeProvenance, toolVersion } from './common';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

export async function detectPerf02(ctx: ScanContext, signal: AbortSignal): Promise<RawFact> {
  const start = Date.now();
  if (signal.aborted) return { detectorId: 'PERF-02', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: makeProvenance('deploy-inventory', start), truncated: true, error: { kind: 'cap', detail: 'aborted' } };
  try {
    const artifacts: Array<{kind:string; path:string; smell?:string}> = [];
    const checks: Array<[string,string]> = [['Dockerfile','dockerfile'],['docker-compose.yml','compose'],['docker-compose.yaml','compose'],['k8s/deployment.yaml','k8s'],['helm/Chart.yaml','helm'],['serverless.yml','serverless'],['vercel.json','serverless']];
    for (const [p,kind] of checks) { const buf = await ctx.readFile(p); if (buf) artifacts.push({ kind, path: p }); }
    // k8s scan
    try { const k8sFiles = (await readdir(join(ctx.clonePath,'k8s'))).sort(); if (k8sFiles.length) artifacts.push({ kind:'k8s', path:'k8s/' }); } catch {}
    // VM smells
    const vmCandidates = ['ops/deploy.sh','scripts/deploy.sh','deploy.sh','fabric.py','capfile'];
    for (const p of vmCandidates) {
      const buf = await ctx.readFile(p);
      if (buf) {
        const txt = buf.toString();
        if (/systemctl|service .*restart|capistrano|fabric/.test(txt)) artifacts.push({ kind:'vm-script', path: p, smell: 'systemctl restart' });
        else artifacts.push({ kind:'vm-script', path: p });
      }
    }
    let model = 'none-declared';
    const hasDocker = artifacts.some(a=>a.kind==='dockerfile');
    const hasK8s = artifacts.some(a=>a.kind==='k8s' || a.kind==='helm');
    const hasVm = artifacts.some(a=>a.kind==='vm-script');
    if (hasK8s) model = hasVm ? 'mixed-vm-container' : 'orchestrated';
    else if (hasDocker) model = hasVm ? 'mixed-vm-container' : 'containerized';
    else if (hasVm) model = 'vm-scripts';
    // ci_builds_images: check cache or probe workflows
    const facts = { perf02: { artifacts, model, ci_builds_images: false } };
    return { detectorId: 'PERF-02', schemaVersion: '1.0.0', facts: facts as unknown as Record<string, unknown>, evidencePointers: [{ detail: `model=${model}; ${artifacts.length} artifacts` }], provenance: { tool: 'deploy-inventory', version: toolVersion('deploy-inventory'), flags: ['deploy-inventory'], durationMs: Date.now() - start }, truncated: false };
  } catch (e) { return { detectorId: 'PERF-02', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: makeProvenance('deploy-inventory', start), truncated: true, error: ghErrorKind(e) }; }
}
