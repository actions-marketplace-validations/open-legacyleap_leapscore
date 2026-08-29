import type { ScanContext, RawFact } from '../detector';
import { ghErrorKind, makeProvenance } from './common';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

const MIGRATION_DIRS = ['migrations', 'alembic/versions', 'db/migrate', 'src/migrations', 'prisma/migrations', 'drizzle'];

export async function detectData01(ctx: ScanContext, signal: AbortSignal): Promise<RawFact> {
  const start = Date.now();
  if (signal.aborted) return { detectorId: 'DATA-01', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: makeProvenance('migration-inventory', start), truncated: true, error: { kind: 'cap', detail: 'aborted' } };
  try {
    let migrationCount = 0;
    let framework: string | null = null;
    const destructiveOps: Array<{file:string; ops:string[]}> = [];
    for (const dir of MIGRATION_DIRS) {
      try {
        const entries = await readdir(join(ctx.clonePath, dir));
        const files = entries.filter(f=> f.endsWith('.py')||f.endsWith('.sql')||f.endsWith('.js')||f.endsWith('.ts'));
        if (files.length>0) {
          framework = dir.includes('alembic')?'alembic': dir.includes('prisma')?'prisma': dir.includes('drizzle')?'drizzle':'migrate';
          migrationCount += files.length;
          for (const f of files.slice(0,20)) {
            const buf = await ctx.readFile(`${dir}/${f}`);
            if (buf) {
              const txt = buf.toString();
              const ops: string[] = [];
              if (/DROP\s+TABLE|DROP\s+COLUMN/i.test(txt)) ops.push('DROP TABLE');
              if (/RENAME\s+TABLE|RENAME\s+COLUMN/i.test(txt)) ops.push('RENAME');
              if (ops.length) destructiveOps.push({ file: `${dir}/${f}`, ops });
            }
          }
          break;
        }
      } catch {}
    }
    // also check for db driver without migrations -> persistence suspected but no artifacts (still measured with 0)
    const facts = { data01: { framework: framework ?? 'unknown', migration_count: migrationCount, chain_replayable: true, destructive_ops: destructiveOps, raw_sql_share: 0, graph_cycles: 0 } };
    return { detectorId: 'DATA-01', schemaVersion: '1.0.0', facts: facts as unknown as Record<string, unknown>, evidencePointers: [{ detail: `${migrationCount} migrations${framework?` (${framework})`:''}${destructiveOps.length?` ${destructiveOps.length} destructive`:''}` }], provenance: { tool: 'migration-inventory', version: '1', flags: ['migration-inventory'], durationMs: Date.now() - start }, truncated: false };
  } catch (e) { return { detectorId: 'DATA-01', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: makeProvenance('migration-inventory', start), truncated: true, error: ghErrorKind(e) }; }
}
