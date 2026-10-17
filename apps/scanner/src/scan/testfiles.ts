/** apps/scanner/src/scan/testfiles.ts — test-file classifier + skip-marker grep
 * (detector-honesty 2.2; specs TEST-03, TEST-05).
 *
 * TEST-03 is heuristic by construction (per-file tier assignment) and is NEVER
 * `measured` — the caller emits `estimated` or `unknown`. TEST-05's markers are
 * facts read from the tree; ages come from git blame when history is available.
 */
import { walkSortedTree } from './tree';
import type { ScanContext } from './detector';

export type TestTier = 'unit' | 'integration' | 'e2e' | 'unclassified';

export type ClassifiedTestFile = {
  path: string;
  tier: TestTier;
  highConfidence: boolean;
  tests: number;
  /** 1-based line numbers of skip markers (bounded). */
  skips: number[];
};

export type TestScan = {
  files: ClassifiedTestFile[];
  total: number;
  unit: number;
  integration: number;
  e2e: number;
  unclassified: number;
  highRatio: number;
  testsTotal: number;
  skipTotal: number;
  truncated: boolean;
};

const TEST_PATH_PATTERNS: RegExp[] = [
  /(^|\/)tests?\//,
  /(^|\/)__tests__\//,
  /(^|\/)spec\//,
  /\.(test|spec)\.(m|c)?[jt]sx?$/,
  /(^|\/)test_.*\.py$/,
  /_test\.py$/,
  /_test\.go$/,
  /Test\.java$/,
  /Tests\.java$/,
  /_spec\.rb$/,
  /(^|\/)test\/.*\.rb$/,
];

const E2E_PATH = [/(^|\/)e2e\//, /(^|\/)cypress\//, /(^|\/)playwright\//, /\.e2e\./, /(^|\/)tests?\/e2e\//];
const INTEGRATION_PATH = [/(^|\/)integration\//, /\.integration\./, /(^|\/)tests?\/integration\//, /(^|\/)functional\//];
const UNIT_PATH = [/(^|\/)__tests__\//, /(^|\/)tests?\/unit\//, /(^|\/)spec\//];

const E2E_CONTENT = [/from\s+['"]@playwright\/test['"]/, /require\(['"]cypress['"]\)/, /from\s+['"]cypress['"]/, /selenium|webdriver/i];
const INTEGRATION_CONTENT = [/@SpringBootTest/, /LiveServerTestCase/, /\btestcontainers?\b/i, /TestRestTemplate/, /\bsupertest\b/, /@AutoConfigureMockMvc/];

const TEST_DEF = [/\b(?:it|test)\s*\(/g, /\b(?:it|test)\.(?:each|only|todo|concurrent|skip)\s*\(/g, /^\s*def test_\w+/gm, /@Test\b/g, /@ParameterizedTest\b/g, /\bfunc Test\w+/g, /^\s*(?:it|specify|example)\s+["']/gm];
const SKIP_MARKERS = [/\b(?:it|test|describe)\.skip\s*\(/g, /\bxit\s*\(/g, /\bxdescribe\s*\(/g, /@Ignore\b/g, /@Disabled\b/g, /pytest\.mark\.skip/g, /\bskipIf\b/g, /\bskipUnless\b/g, /\bt\.Skip\s*\(/g, /@unittest\.skip/g];

const MAX_TEST_FILES_READ = 80;
const MAX_BYTES_PER_FILE = 256 * 1024;

function isTestPath(p: string): boolean {
  return TEST_PATH_PATTERNS.some((r) => r.test(p));
}

function countMatches(text: string, patterns: RegExp[]): number {
  let n = 0;
  for (const re of patterns) { const m = text.match(re); if (m) n += m.length; }
  return n;
}

function skipLines(text: string): number[] {
  const lines: number[] = [];
  const raw = text.split('\n');
  for (let i = 0; i < raw.length; i++) {
    if (SKIP_MARKERS.some((r) => { r.lastIndex = 0; return r.test(raw[i]); })) lines.push(i + 1);
  }
  return lines;
}

function classifyByPath(path: string): { tier: TestTier; high: boolean } {
  if (E2E_PATH.some((r) => r.test(path))) return { tier: 'e2e', high: true };
  if (INTEGRATION_PATH.some((r) => r.test(path))) return { tier: 'integration', high: true };
  if (UNIT_PATH.some((r) => r.test(path))) return { tier: 'unit', high: true };
  return { tier: 'unclassified', high: false };
}

async function boundedText(ctx: ScanContext, path: string): Promise<string | null> {
  try {
    const buf = await ctx.readFile(path);
    if (!buf) return null;
    return buf.subarray(0, MAX_BYTES_PER_FILE).toString('utf8');
  } catch {
    return null;
  }
}

/** Enumerate + classify test files, count test definitions and skip markers. */
export async function scanTestFiles(ctx: ScanContext, signal?: AbortSignal): Promise<TestScan> {
  let paths: string[];
  try {
    const walk = await walkSortedTree(ctx.clonePath);
    paths = walk.paths.filter((p) => !p.endsWith('/'));
  } catch {
    paths = [];
  }
  const testPaths = paths.filter(isTestPath).sort();
  const files: ClassifiedTestFile[] = [];
  let truncated = false;
  for (const path of testPaths) {
    if (signal?.aborted) { truncated = true; break; }
    if (files.length >= MAX_TEST_FILES_READ) { truncated = true; break; }
    const fromPath = classifyByPath(path);
    const text = await boundedText(ctx, path);
    if (text == null) { files.push({ path, tier: fromPath.tier, highConfidence: fromPath.high, tests: 0, skips: [] }); continue; }
    let tier = fromPath.tier;
    let high = fromPath.high;
    if (tier === 'unclassified') {
      if (E2E_CONTENT.some((r) => r.test(text))) { tier = 'e2e'; high = true; }
      else if (INTEGRATION_CONTENT.some((r) => r.test(text))) { tier = 'integration'; high = true; }
      else { tier = 'unit'; high = false; }
    }
    files.push({ path, tier, highConfidence: high, tests: countMatches(text, TEST_DEF), skips: skipLines(text) });
  }
  const total = files.length;
  const unit = files.filter((f) => f.tier === 'unit').length;
  const integration = files.filter((f) => f.tier === 'integration').length;
  const e2e = files.filter((f) => f.tier === 'e2e').length;
  const unclassified = files.filter((f) => f.tier === 'unclassified').length;
  const highCount = files.filter((f) => f.highConfidence).length;
  return {
    files,
    total,
    unit,
    integration,
    e2e,
    unclassified,
    highRatio: total ? Math.round((highCount / total) * 1000) / 1000 : 0,
    testsTotal: files.reduce((a, f) => a + f.tests, 0),
    skipTotal: files.reduce((a, f) => a + f.skips.length, 0),
    truncated,
  };
}
