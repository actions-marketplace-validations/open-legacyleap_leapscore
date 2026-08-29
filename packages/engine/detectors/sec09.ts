import type { ScanContext, RawFact } from '../detector';
import { ghErrorKind, makeProvenance } from './common';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

export async function detectSec09(ctx: ScanContext, signal: AbortSignal): Promise<RawFact> {
  const start = Date.now();
  if (signal.aborted) return { detectorId: 'SEC-09', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: makeProvenance('fuzz-inventory', start), truncated: true, error: { kind: 'cap', detail: 'aborted' } };
  try {
    const harnesses: Array<{path:string; engine:string}> = [];
    const candidates = ['fuzz', 'fuzzing', 'tests/fuzz', 'src/fuzz'];
    for (const dir of candidates) {
      try {
        const entries = await readdir(join(ctx.clonePath, dir));
        for (const f of entries) if (f.includes('fuzz') || f.endsWith('.c') || f.endsWith('.cc')) harnesses.push({ path: `${dir}/${f}`, engine: f.includes('libFuzzer')?'libFuzzer':'unknown' });
      } catch {}
    }
    // also grep for config files
    for (const p of ['.clusterfuzzlite/Dockerfile','fuzz.sh','cargo-fuzz','oss-fuzz.yaml']) {
      const buf = await ctx.readFile(p);
      if (buf) harnesses.push({ path: p, engine: 'config' });
    }
    const bufPkg = await ctx.readFile('package.json');
    let hasParserSurface = false;
    if (bufPkg) { const txt = bufPkg.toString(); hasParserSurface = /yaml|json|http|xml/.test(txt); }
    const facts = { sec09: { harnesses, sanitizers_in_build: false, continuous_fuzzing: { oss_fuzz: false, scheduled_workflow: false }, parser_surface_detected: hasParserSurface?['json']:[] } };
    // na_when: no parsing surface -> still measured but score mapping handles it
    return { detectorId: 'SEC-09', schemaVersion: '1.0.0', facts: facts as unknown as Record<string,unknown>, evidencePointers: [{ detail: harnesses.length? `${harnesses.length} harness(es)`:'no fuzz harness' }], provenance: { tool: 'fuzz-inventory', version: '1', flags: ['fuzz-inventory'], durationMs: Date.now() - start }, truncated: false };
  } catch (e) { return { detectorId: 'SEC-09', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: makeProvenance('fuzz-inventory', start), truncated: true, error: ghErrorKind(e) }; }
}
