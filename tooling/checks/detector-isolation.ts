/** tooling/checks/detector-isolation.ts — ban raw fs/fetch in detectors (05 §5, Q8) */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname ?? '.', '../..');
const ALLOWED_FETCH_FILES = new Set([
  'packages/engine/gh.ts',
  'packages/engine/orchestrator.phase1.ts',
]);
const ALLOWED_FS_FILES = new Set([
  'packages/engine/clone.ts',
  'packages/engine/store.ts',
  'packages/engine/queue.ts',
  'packages/engine/runner.ts',
  'packages/engine/budget.ts',
  'packages/engine/facts.ts',
  'packages/engine/registry.ts',
  'packages/engine/scorer/rollup.ts',
  'packages/engine/seal.ts',
  'packages/engine/bin/scan.ts',
]);

function* walk(dir: string): Generator<string> {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === '.next' || e.name === '__tests__') continue;
      yield* walk(p);
    } else if (e.isFile() && (p.endsWith('.ts') || p.endsWith('.js'))) yield p;
  }
}

let violations: string[] = [];
for (const f of walk(join(ROOT, 'packages/engine'))) {
  const rel = f.replace(ROOT + '/', '');
  if (ALLOWED_FETCH_FILES.has(rel)) continue;
  if (rel.includes('__tests__')) continue;
  const text = readFileSync(f, 'utf-8');
  // Ban raw fetch(...) outside gh.ts, and direct fs imports in detectors
  if (/\bfetch\s*\(/.test(text) && !text.includes('fetchImpl')) {
    violations.push(`${rel}: raw fetch() found — use ctx.gh`);
  }
  if (/from\s+['"]node:fs['"]|require\(['"]fs['"]\)/.test(text) && !rel.endsWith('gh.ts') && !ALLOWED_FS_FILES.has(rel)) {
    violations.push(`${rel}: raw fs import — use ctx.readFile`);
  }
  if (/\bchild_process\b/.test(text) && !ALLOWED_FS_FILES.has(rel)) violations.push(`${rel}: child_process forbidden`);
}
for (const f of walk(join(ROOT, 'packages/detectors'))) {
  const rel = f.replace(ROOT + '/', '');
  if (rel.includes('__tests__')) continue;
  const text = readFileSync(f, 'utf-8');
  if (/\bfetch\s*\(/.test(text) && !text.includes('fetchImpl')) {
    violations.push(`${rel}: raw fetch() found — use ctx.gh`);
  }
  if (/from\s+['"]node:fs['"]|require\(['"]fs['"]\)/.test(text)) {
    violations.push(`${rel}: raw fs import — use ctx.readFile`);
  }
  if (/\bchild_process\b/.test(text)) violations.push(`${rel}: child_process forbidden`);
}

if (violations.length) {
  console.error('detector-isolation violations:\n' + violations.map((v) => `  - ${v}`).join('\n'));
  process.exit(1);
} else {
  console.log('detector-isolation: ok (no raw fetch/fs outside engine/gh.ts)');
}
