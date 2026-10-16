/** tooling/checks/surface-boundary.ts — the issues:write app stays split from measurement (add-surface-app D4) */
//
// Three enforced graphs, three token scopes:
// - packages/engine (contents:read measurement) must not reach apps/surface.
// - apps/site (present side, no token) must not reach apps/surface or hold an
//   issues:write scope (SURFACE_TOKEN / issues:write strings outside workflow YAML).
// - apps/surface (issues:write writer) must not reach packages/engine
//   detectors/clone/budget — @leapscore/contracts is the only shared import.
//
// Text-grep precedent: tooling/checks/site-boundary.ts. Test files are exempt
// (they wire fakes across boundaries on purpose).
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname ?? '.', '../..');
const ENGINE = join(ROOT, 'packages/engine');
const SITE = join(ROOT, 'apps/site');
const SURFACE = join(ROOT, 'apps/surface');

const SITE_EXEMPT_DIRS = ['tooling/', 'apps/site/scripts/', 'apps/site/lib/generated/'];

function isTestFile(rel: string): boolean {
  return rel.endsWith('.test.ts') || rel.endsWith('.test.tsx');
}

/** True when the source actually imports the target (prose mentions don't count). */
function importsFrom(text: string, targets: RegExp): boolean {
  return (
    new RegExp(`from\\s+['"][^'"]*(${targets.source})`).test(text) ||
    new RegExp(`require\\(['"][^'"]*(${targets.source})`).test(text) ||
    new RegExp(`import\\(['"][^'"]*(${targets.source})`).test(text)
  );
}

const SURFACE_APP = /apps\/surface|@leapscore\/surface/;
const ENGINE_PKG = /packages\/engine|@leapscore\/engine/;

function isSiteExempt(rel: string): boolean {
  if (SITE_EXEMPT_DIRS.some((d) => rel.startsWith(d))) return true;
  if (isTestFile(rel)) return true;
  if (rel === 'apps/site/lib/reports.ts') return true; // read-only build-input reader
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

// 1. Engine must not reach the surface app.
for (const f of walk(ENGINE)) {
  const rel = f.replace(ROOT + '/', '');
  if (isTestFile(rel)) continue;
  const text = readFileSync(f, 'utf-8');
  if (importsFrom(text, SURFACE_APP)) {
    violations.push(`${rel}: engine reaches apps/surface — surfacing lives in the standalone app`);
  }
}

// 2. Site must not reach the surface app or an issues:write scope.
for (const f of walk(SITE)) {
  const rel = f.replace(ROOT + '/', '');
  if (isSiteExempt(rel)) continue;
  const text = readFileSync(f, 'utf-8');
  if (importsFrom(text, SURFACE_APP)) {
    violations.push(`${rel}: site reaches apps/surface — the present side never triggers surfacing`);
  }
  if (/SURFACE_TOKEN|issues:write/.test(text)) {
    violations.push(`${rel}: site holds an issues:write scope — only apps/surface may write issues`);
  }
}

// 3. Surface must not reach engine internals (only @leapscore/contracts is shared).
for (const f of walk(SURFACE)) {
  const rel = f.replace(ROOT + '/', '');
  if (isTestFile(rel)) continue;
  const text = readFileSync(f, 'utf-8');
  if (importsFrom(text, ENGINE_PKG)) {
    violations.push(`${rel}: surface reaches packages/engine — only @leapscore/contracts is shared`);
  }
}

if (violations.length) {
  console.error('surface-boundary violations:\n' + violations.map((v) => `  - ${v}`).join('\n'));
  process.exit(1);
} else {
  console.log('surface-boundary: ok (scanner/surface/site graphs stay split)');
}
