/** apps/scanner/src/scan/testfiles.ts — test-file classifier + skip-marker grep
 * (detector-honesty 2.2; specs TEST-03, TEST-05).
 *
 * TEST-03 is heuristic by construction (per-file tier assignment) and is NEVER
 * `measured` — the caller emits `estimated` or `unknown`. TEST-05's markers are
 * facts read from the tree; ages come from git blame when history is available.
 *
 * legacy-stacks 5.2 adds the .NET conventions: case-tolerant `Tests?/` dirs,
 * `*Tests?.cs|vb` file names, MSTest/NUnit/xUnit method attributes (C# `[…]`
 * and VB `<…>` forms) and their skip forms, plus `truncated` when either read
 * bound (file count, per-file bytes) drops part of the surface.
 */
import { walkSortedTree } from './tree';
import { isReadBudgetError } from './budget';
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
  /** Files enumerated but not read because the per-detector read budget ended.
   * A harder bound than `truncated`'s designed read caps: counts/markers over the
   * surface are absent, not sampled — consumers must emit `unknown` with a
   * read-budget disclosure (legacy-stacks 8.1). */
  unreadByBudget: number;
};

const TEST_PATH_PATTERNS: RegExp[] = [
  /(^|\/)tests?\//i,
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
  // legacy-stacks 5.2: .NET file conventions — `OrderTests.cs` / `OrderTest.vb`
  // (capital T so `Latest.cs` never matches)
  /Tests?\.(cs|vb)$/,
];

const E2E_PATH = [/(^|\/)e2e\//, /(^|\/)cypress\//, /(^|\/)playwright\//, /\.e2e\./, /(^|\/)tests?\/e2e\//i];
const INTEGRATION_PATH = [/(^|\/)integration\//, /\.integration\./, /(^|\/)tests?\/integration\//i, /(^|\/)functional\//];
const UNIT_PATH = [/(^|\/)__tests__\//, /(^|\/)tests?\/unit\//i, /(^|\/)spec\//];

const E2E_CONTENT = [/from\s+['"]@playwright\/test['"]/, /require\(['"]cypress['"]\)/, /from\s+['"]cypress['"]/, /selenium|webdriver/i];
const INTEGRATION_CONTENT = [/@SpringBootTest/, /LiveServerTestCase/, /\btestcontainers?\b/i, /TestRestTemplate/, /\bsupertest\b/, /@AutoConfigureMockMvc/, /\bWebApplicationFactory\b/];

// legacy-stacks 8.3: .NET convention paths that classify `unit` at high
// confidence when no tier marker says otherwise — a dotted `.Tests/` project
// directory (`src/Orchard.Tests/**`) or a `*Test.cs|vb` / `*Tests.cs|vb` file
// name. Stronger structural dirs (e2e/, integration/, tests/unit/, __tests__/)
// and content markers still take precedence.
const DOTNET_TEST_FILE = /Tests?\.(cs|vb)$/;
const DOTTED_TEST_PROJECT_DIR = /(^|\/)[^/]*\.tests?\//i;

const TEST_DEF = [
  /\b(?:it|test)\s*\(/g,
  /\b(?:it|test)\.(?:each|only|todo|concurrent|skip)\s*\(/g,
  /^\s*def test_\w+/gm,
  /@Test\b/g,
  /@ParameterizedTest\b/g,
  /\bfunc Test\w+/g,
  /^\s*(?:it|specify|example)\s+["']/gm,
  // legacy-stacks 5.2: .NET test methods — MSTest/NUnit/xUnit attributes,
  // C# `[TestMethod]`/`[Test]`/`[Fact]`/`[Theory]`/`[TestCase]` and VB `<TestMethod>`
  /[[<]\s*(?:TestMethod|TestCase|Test|Fact|Theory)\b/g,
];
const SKIP_MARKERS = [
  /\b(?:it|test|describe)\.skip\s*\(/g,
  /\bxit\s*\(/g,
  /\bxdescribe\s*\(/g,
  /@Ignore\b/g,
  /@Disabled\b/g,
  /pytest\.mark\.skip/g,
  /\bskipIf\b/g,
  /\bskipUnless\b/g,
  /\bt\.Skip\s*\(/g,
  /@unittest\.skip/g,
  // legacy-stacks 5.2: .NET skip/disable forms — [Ignore]/<Ignore>,
  // `[TestMethod, Ignore]`, Assert.Ignore(, Assert.Inconclusive(, and the
  // xUnit/NUnit attribute form `Skip = "reason"` / VB `Skip:="reason"`
  /\bIgnore\b\s*[(),\]>]/g,
  /\bSkip\s*:?\s*=\s*["']/g,
  /\bAssert\.Ignore\s*\(/g,
  /\bAssert\.Inconclusive\s*\(/g,
];

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

async function boundedText(ctx: ScanContext, path: string): Promise<{ text: string; capped: boolean; budgetBlocked?: boolean } | null> {
  try {
    const buf = await ctx.readFile(path);
    if (!buf) return null;
    const capped = buf.length > MAX_BYTES_PER_FILE;
    return { text: buf.subarray(0, MAX_BYTES_PER_FILE).toString('utf8'), capped };
  } catch (e) {
    // A budget error is not a missing file: the read surface is starved, not
    // empty — the caller discloses it rather than counting the file as read.
    if (isReadBudgetError(e)) return { text: '', capped: false, budgetBlocked: true };
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
  let unreadByBudget = 0;
  for (const path of testPaths) {
    if (signal?.aborted) { truncated = true; break; }
    if (files.length >= MAX_TEST_FILES_READ) { truncated = true; break; }
    const fromPath = classifyByPath(path);
    const read = await boundedText(ctx, path);
    if (read?.budgetBlocked) {
      // Starved, not unclassified: keep the conservative count (0 tests) and
      // disclose the read budget to the consumer (legacy-stacks 8.1).
      truncated = true;
      unreadByBudget++;
      files.push({ path, tier: fromPath.tier, highConfidence: fromPath.high, tests: 0, skips: [] });
      continue;
    }
    if (read == null) { files.push({ path, tier: fromPath.tier, highConfidence: fromPath.high, tests: 0, skips: [] }); continue; }
    if (read.capped) truncated = true; // read bound hit: counts are scope-limited
    const { text } = read;
    let tier = fromPath.tier;
    let high = fromPath.high;
    if (tier === 'unclassified') {
      if (E2E_CONTENT.some((r) => r.test(text))) { tier = 'e2e'; high = true; }
      else if (INTEGRATION_CONTENT.some((r) => r.test(text))) { tier = 'integration'; high = true; }
      else {
        tier = 'unit';
        // .NET conventions classify at high confidence; a bare `Tests/` hint
        // alone stays low (a heuristic hint, not a classification — 5.2).
        high = DOTNET_TEST_FILE.test(path) || DOTTED_TEST_PROJECT_DIR.test(path);
      }
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
    unreadByBudget,
  };
}
