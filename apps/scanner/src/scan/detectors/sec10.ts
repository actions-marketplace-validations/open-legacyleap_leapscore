import type { ScanContext, RawFact } from '../detector';
import { ghErrorKind, makeProvenance } from './common';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

export async function detectSec10(ctx: ScanContext, signal: AbortSignal): Promise<RawFact> {
  const start = Date.now();
  if (signal.aborted) return { detectorId: 'SEC-10', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: makeProvenance('sec-ci-inventory', start), truncated: true, error: { kind: 'cap', detail: 'aborted' } };
  try {
    const cacheKey = 'sec10:workflows';
    let contents: string[] = ctx.cache.get(cacheKey) as string[] | undefined ?? [];
    if (contents.length===0) {
      try {
        const files = await readdir(join(ctx.clonePath, '.github/workflows'));
        for (const f of files.filter(x=> x.endsWith('.yml')||x.endsWith('.yaml'))) {
          const buf = await ctx.readFile(`.github/workflows/${f}`);
          if (buf) contents.push(buf.toString());
        }
        ctx.cache.set(cacheKey, contents);
      } catch {}
    }
    const hay = contents.join('\n').toLowerCase();
    const jobs: Array<{name:string; class:string; trigger:string; blocking:boolean}> = [];
    if (/semgrep|sast|codeql/.test(hay)) jobs.push({ name:'semgrep', class:'sast', trigger:'push', blocking: !/continue-on-error:\s*true/.test(hay) });
    if (/trivy|grype|snyk/.test(hay)) jobs.push({ name:'trivy', class:'deps', trigger:'push', blocking: true });
    if (/gitleaks|trufflehog|secret.*scan/.test(hay)) jobs.push({ name:'gitleaks', class:'secret', trigger:'push', blocking: true });
    const classes = [...new Set(jobs.map(j=>j.class))];
    const facts = { sec10: { security_jobs: jobs, classes_present: classes, secret_scan_covers_history: /history/.test(hay), image_scan_on_build: /image.*scan|scan.*image/.test(hay), workflow_permissions_hardened: /permissions:\s*contents:\s*read/.test(hay) } };
    return { detectorId: 'SEC-10', schemaVersion: '1.0.0', facts: facts as unknown as Record<string,unknown>, evidencePointers: [{ detail: jobs.length? `${jobs.length} security jobs (${classes.join(',')})`:'no security CI', file: '.github/workflows' }], provenance: { tool: 'sec-ci-inventory', version: '1', flags: ['sec-ci-inventory'], durationMs: Date.now() - start }, truncated: false };
  } catch (e) { return { detectorId: 'SEC-10', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: makeProvenance('sec-ci-inventory', start), truncated: true, error: ghErrorKind(e) }; }
}
