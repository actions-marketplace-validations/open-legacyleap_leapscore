/** tooling/checks/site-boundary.ts — present side carries no scanner runtime (scanner-service spec) */
// Fails when the website's served source graph reaches the scanner implementation
// (apps/scanner) or Node filesystem/child-process builtins outside build tooling,
// naming the offending module. Build tooling (tooling/, apps/site/scripts/,
// apps/site/lib/generated/, *.test.ts) is exempt. apps/site/lib/reports.ts is
// the site-owned history reader over a static fixture (no filesystem reads at
// request time) and is exempt; apps/site/scripts/generate-sample.ts is the only
// writer and it is build tooling.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname ?? '.', '../..');
const SITE = join(ROOT, 'apps/site');

const EXEMPT_DIRS = ['tooling/', 'apps/site/scripts/', 'apps/site/lib/generated/'];

function isExempt(rel: string): boolean {
  if (EXEMPT_DIRS.some((d) => rel.startsWith(d))) return true;
  if (rel.endsWith('.test.ts') || rel.endsWith('.test.tsx')) return true;
  if (rel === 'apps/site/lib/reports.ts') return true; // site-owned fixture-backed history reader
  return false;
}

function* walk(dir: string): Generator<string> {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === '.next' || e.name === 'out') continue;
      yield* walk(p);
    } else if (e.isFile() && (p.endsWith('.ts') || p.endsWith('.tsx'))) yield p;
  }
}

const violations: string[] = [];
for (const f of walk(SITE)) {
  const rel = f.replace(ROOT + '/', '');
  if (isExempt(rel)) continue;
  const text = readFileSync(f, 'utf-8');
  if (/apps\/scanner|@leapscore\/scanner/.test(text)) {
    violations.push(`${rel}: reaches the scanner implementation — scans run in apps/scanner`);
  }
  if (/from\s+['"]node:fs/.test(text) || /from\s+['"]node:child_process/.test(text) || /require\(['"]node:(fs|child_process)/.test(text)) {
    violations.push(`${rel}: node filesystem/child-process builtin outside build tooling`);
  }
}

if (violations.length) {
  console.error('site-boundary violations:\n' + violations.map((v) => `  - ${v}`).join('\n'));
  process.exit(1);
} else {
  console.log('site-boundary: ok (present side carries no scanner runtime)');
}
