import type { ScanContext, RawFact } from '../detector';
import { ghErrorKind, makeProvenance, toolVersion } from './common';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export async function detectEcos06(ctx: ScanContext, signal: AbortSignal): Promise<RawFact> {
  const start = Date.now();
  if (signal.aborted) return { detectorId: 'ECOS-06', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: makeProvenance('lockfile+rg', start), truncated: true, error: { kind: 'cap', detail: 'aborted' } };
  try {
    // Find lockfile via manifests sniffed, fallback to probing
    let lockfilePath: string | null = null;
    for (const m of ctx.manifests) if (m.lockfile) { lockfilePath = m.lockfile; break; }
    if (!lockfilePath) {
      for (const p of ['package-lock.json','pnpm-lock.yaml','yarn.lock','poetry.lock','uv.lock','go.mod']) {
        try { await readFile(join(ctx.clonePath, p)); lockfilePath = p; break; } catch {}
      }
    }
    if (!lockfilePath) {
      return { detectorId: 'ECOS-06', schemaVersion: '1.0.0', facts: { ecos06: { transitive_total: 0, direct_unused: [], pct_direct_unused: null, duplicates: [], duplicate_security_critical: false, no_lockfile: true } } as unknown as Record<string,unknown>, evidencePointers: [{ detail: 'no lockfile' }], provenance: { tool: 'lockfile+rg', version: toolVersion('lockfile+rg'), flags: ['lockfile+rg'], durationMs: Date.now() - start }, truncated: true, error: { kind: 'cap', detail: 'no lockfile — unknown' } };
    }
    let transitiveTotal = 0;
    const duplicates: Array<{name:string; versions:string[]}> = [];
    try {
      const buf = await ctx.readFile(lockfilePath);
      if (buf) {
        const txt = buf.toString();
        if (lockfilePath.endsWith('.json')) {
          const j = JSON.parse(txt);
          const pkgs = j.packages ?? j.dependencies ?? {};
          transitiveTotal = Object.keys(pkgs).length;
          // simple duplicate: look for same name with different versions in packages keys containing node_modules
          const verMap = new Map<string, Set<string>>();
          for (const [k,v] of Object.entries(pkgs as Record<string, {version?:string}>)) {
            const name = k.replace(/^.*node_modules\//,'');
            if (!name || name===k) continue;
            const ver = (v as {version?:string})?.version ?? 'unknown';
            if (!verMap.has(name)) verMap.set(name, new Set());
            verMap.get(name)!.add(ver);
          }
          for (const [name, vers] of verMap) if (vers.size>1) duplicates.push({ name, versions: [...vers] });
        } else {
          transitiveTotal = txt.split('\n').filter(l=> l.trim()).length;
        }
      }
    } catch {}
    const facts = { ecos06: { transitive_total: transitiveTotal, direct_unused: [], pct_direct_unused: null, duplicates, duplicate_security_critical: false } };
    return { detectorId: 'ECOS-06', schemaVersion: '1.0.0', facts: facts as unknown as Record<string,unknown>, evidencePointers: [{ detail: `${transitiveTotal} transitives; ${duplicates.length} duplicate versions`, file: lockfilePath }], provenance: { tool: 'lockfile+rg', version: toolVersion('lockfile+rg'), flags: ['lockfile+rg'], durationMs: Date.now() - start }, truncated: false };
  } catch (e) { return { detectorId: 'ECOS-06', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: makeProvenance('lockfile+rg', start), truncated: true, error: ghErrorKind(e) }; }
}
