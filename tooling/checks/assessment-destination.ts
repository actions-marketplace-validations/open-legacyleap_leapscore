/** tooling/checks/assessment-destination.ts — the report CTA's destination resolves (assessment-destination) */
// Every report next-step link points at the contract's single ASSESSMENT_BASE_URL.
// A dead destination kills the only commercial path, so this check fails the release
// when the contract constant is missing/duplicated or the site route it advertises
// does not exist.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname ?? '.', '../..');
const CONTRACTS = join(ROOT, 'packages/contracts/src/index.ts');
const SITE = join(ROOT, 'apps/site');

const violations: string[] = [];

const source = readFileSync(CONTRACTS, 'utf-8');
const match = source.match(/export const ASSESSMENT_BASE_URL\s*=\s*"([^"]+)"/);
if (!match) {
  violations.push('packages/contracts/src/index.ts: no ASSESSMENT_BASE_URL constant — every report CTA would have no destination');
}

let pathname = '/assessment';
if (match) {
  let url: URL | null = null;
  try {
    url = new URL(match[1]);
  } catch {
    violations.push(`ASSESSMENT_BASE_URL ${JSON.stringify(match[1])} is not a parseable URL`);
  }
  if (url) pathname = url.pathname.replace(/\/$/, '') || '/';
}

// The destination is defined once: a second definition is a second source of truth.
const DEFINITION = /export const ASSESSMENT_BASE_URL\s*=/;
const secondDefinitions: string[] = [];
for (const dir of [SITE, join(ROOT, 'apps/scanner/src'), join(ROOT, 'apps/scanner/bin')]) {
  if (!existsSync(dir)) continue;
  for (const entry of readdirSync(dir, { recursive: true })) {
    const path = join(dir, String(entry));
    if (!/\.(ts|tsx)$/.test(path) || path.includes('.test.')) continue;
    if (readFileSync(path, 'utf-8').match(DEFINITION)) secondDefinitions.push(path);
  }
}
for (const path of secondDefinitions) {
  violations.push(`${path.slice(ROOT.length + 1)}: second ASSESSMENT_BASE_URL definition — the contract owns the destination`);
}

// The site must serve the advertised path.
if (!pathname || pathname === '/') {
  violations.push(`ASSESSMENT_BASE_URL resolves to the site root (${pathname}) — it must name the assessment route`);
} else {
  const page = join(SITE, 'app', pathname.replace(/^\//, ''), 'page.tsx');
  if (!existsSync(page)) {
    violations.push(`missing assessment route: expected ${page.slice(ROOT.length + 1)} for ${pathname}`);
  } else {
    const text = readFileSync(page, 'utf-8');
    if (!/Book the \$0 Assessment/.test(text)) {
      violations.push(`${page.slice(ROOT.length + 1)}: the assessment page has no booking path`);
    }
    for (const statement of [/runs locally/i, /code upload/i, /separate consent/i]) {
      if (!statement.test(text)) {
        violations.push(`${page.slice(ROOT.length + 1)}: the assessment page is missing required copy (${statement})`);
      }
    }
  }
}

if (violations.length) {
  console.error('assessment-destination violations:\n' + violations.map((v) => `  - ${v}`).join('\n'));
  process.exit(1);
}
console.log(`assessment-destination: ok (${pathname} served; one contract base URL)`);
