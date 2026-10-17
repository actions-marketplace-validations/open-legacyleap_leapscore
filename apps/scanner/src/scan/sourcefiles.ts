/** apps/scanner/src/scan/sourcefiles.ts — bounded source-import + workflow reads
 * (detector-honesty 2.3/2.4; specs SEC-01 reachability, ECOS-08 coupling, ECOS-07 CI).
 *
 * Everything here is a real read over the enumerated tree through `ctx.readFile`
 * (byte-capped, no execution, no network). A truncated read is surfaced so the
 * caller can label the derived fact `estimated`/`scope-limited` rather than
 * `measured` over a partial surface.
 */
import { walkSortedTree } from './tree';
import type { ScanContext } from './detector';

const SOURCE_EXT = /\.(m|c)?[jt]sx?$|\.py$|\.go$|\.java$|\.rb$|\.php$|\.rs$|\.kt$|\.scala$|\.cs$/;
const MAX_SOURCE_FILES = 400;
const MAX_BYTES_PER_FILE = 256 * 1024;

const FACADE_DIR = /(^|\/)(adapters?|ports?|facade|gateways?|clients?|infra|infrastructure)(\/|$)/i;

export type ImportScan = {
  /** Source files read (bounded). */
  filesScanned: number;
  /** Source files present in the tree. */
  sourceFiles: number;
  /** True when the read surface was bounded below the tree (sampleN/byte cap). */
  truncated: boolean;
  /** module token -> number of source files importing it */
  importCounts: Map<string, number>;
  /** module token -> bounded list of importing files */
  importingFiles: Map<string, string[]>;
  /** every distinct module token seen */
  tokens: Set<string>;
};

async function readText(ctx: ScanContext, path: string, max = MAX_BYTES_PER_FILE): Promise<string | null> {
  try {
    const buf = await ctx.readFile(path);
    if (!buf) return null;
    return buf.subarray(0, max).toString('utf8');
  } catch {
    return null;
  }
}

/** Extract imported module tokens from one source file (JS/TS, Py, Go, Java, Ruby, PHP, Rust). */
export function extractImports(text: string): string[] {
  const out: string[] = [];
  const push = (t: string | undefined) => {
    if (!t) return;
    const tok = t.trim();
    if (!tok || tok.startsWith('.') || tok.startsWith('/')) return; // relative/local
    out.push(tok);
  };
  // JS/TS: import ... from 'x'; import 'x'; require('x'); import('x')
  for (const m of text.matchAll(/\bfrom\s+['"]([^'"]+)['"]/g)) push(m[1]);
  for (const m of text.matchAll(/\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g)) push(m[1]);
  for (const m of text.matchAll(/\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g)) push(m[1]);
  for (const m of text.matchAll(/^\s*import\s+['"]([^'"]+)['"]/gm)) push(m[1]);
  // Python: import a.b; from a.b import x
  for (const m of text.matchAll(/^\s*import\s+([A-Za-z0-9_.]+)/gm)) push(m[1].split('.')[0]);
  for (const m of text.matchAll(/^\s*from\s+([A-Za-z0-9_.]+)\s+import\b/gm)) push(m[1].split('.')[0]);
  // Go: import ( "path" ) · import "path"
  for (const m of text.matchAll(/^\s*(?:[A-Za-z0-9_.]+\s+)?"([^"]+\/[^"]+)"/gm)) push(m[1]);
  // Java/Kotlin/Scala: import com.foo.Bar;
  for (const m of text.matchAll(/^\s*import\s+(?:static\s+)?([A-Za-z0-9_.]+);?/gm)) {
    const seg = m[1].split('.');
    push(seg.slice(0, Math.max(1, seg.length - 1)).join('.'));
  }
  // Ruby: require 'x'
  for (const m of text.matchAll(/^\s*require\s+['"]([^'"]+)['"]/gm)) push(m[1]);
  // PHP: use Foo\Bar;
  for (const m of text.matchAll(/^\s*use\s+([A-Za-z0-9_\\]+)/gm)) push(m[1].split('\\').slice(0, 2).join('/'));
  // Rust: use x::y;  extern crate x;
  for (const m of text.matchAll(/^\s*use\s+([A-Za-z0-9_]+)::/gm)) push(m[1]);
  return out;
}

/** Root token used for py-style reachability (`requests.sessions` → `requests`). */
function rootToken(token: string): string {
  return token.split(/[/@.]/)[0];
}

/** True when a dependency name (npm/py/go/maven style) is imported anywhere in the scanned source. */
export function matchesDependency(token: string, depName: string): boolean {
  if (!token || !depName) return false;
  const t = token.toLowerCase();
  const d = depName.toLowerCase();
  if (t === d) return true;
  if (t.startsWith(`${d}/`)) return true; // scoped/subpath
  if (rootToken(t) === d) return true;
  // maven `group:artifact` — match artifact
  if (d.includes(':') && t === d.split(':')[1]) return true;
  return false;
}

/** Enumerate + read bounded source imports across the tree. */
export async function scanSourceImports(ctx: ScanContext, signal?: AbortSignal): Promise<ImportScan> {
  let paths: string[] = [];
  try {
    const walk = await walkSortedTree(ctx.clonePath);
    paths = walk.paths.filter((p) => !p.endsWith('/'));
  } catch {
    paths = [];
  }
  const sourcePaths = paths.filter((p) => SOURCE_EXT.test(p)).sort();
  const importCounts = new Map<string, number>();
  const importingFiles = new Map<string, string[]>();
  const tokens = new Set<string>();
  let filesScanned = 0;
  let truncated = false;
  for (const path of sourcePaths) {
    if (signal?.aborted) { truncated = true; break; }
    if (filesScanned >= MAX_SOURCE_FILES) { truncated = true; break; }
    const text = await readText(ctx, path);
    if (text == null) continue;
    filesScanned++;
    const seen = new Set<string>();
    for (const tok of extractImports(text)) {
      tokens.add(tok);
      if (seen.has(tok)) continue;
      seen.add(tok);
      importCounts.set(tok, (importCounts.get(tok) ?? 0) + 1);
      const list = importingFiles.get(tok) ?? [];
      if (list.length < 200) list.push(path);
      importingFiles.set(tok, list);
    }
  }
  return { filesScanned, sourceFiles: sourcePaths.length, truncated, importCounts, importingFiles, tokens };
}

/** True when `depName` is imported by any scanned source file. */
export function isDependencyImported(scan: ImportScan, depName: string): boolean {
  for (const tok of scan.tokens) if (matchesDependency(tok, depName)) return true;
  return false;
}

/** Coupling share for a package: fraction of scanned source files importing it, plus facade detection. */
export function couplingFor(scan: ImportScan, names: string[]): { share: number; facade: boolean } {
  if (!scan.filesScanned) return { share: 0, facade: false };
  const files = new Set<string>();
  for (const [tok, list] of scan.importingFiles) {
    if (names.some((n) => matchesDependency(tok, n))) for (const f of list) files.add(f);
  }
  const share = files.size / scan.filesScanned;
  if (files.size === 0) return { share, facade: false };
  let facaded = 0;
  for (const f of files) if (FACADE_DIR.test(f)) facaded++;
  return { share: Math.round(share * 1000) / 1000, facade: facaded / files.size >= 0.8 };
}

const IMPORT_SCAN_CACHE_KEY = 'sourcefiles:import-scan';
const WORKFLOW_CACHE_KEY = 'sourcefiles:workflows';

/** Memoized import scan (detector-honesty 2.3/2.4): ECOS-03/08 and SEC-01 share
 * one bounded source read via the scan cache instead of re-reading the tree. */
export async function cachedSourceImports(ctx: ScanContext, signal?: AbortSignal): Promise<ImportScan> {
  const cached = ctx.cache.get(IMPORT_SCAN_CACHE_KEY);
  if (cached) return cached as ImportScan;
  const scan = await scanSourceImports(ctx, signal);
  ctx.cache.set(IMPORT_SCAN_CACHE_KEY, scan);
  return scan;
}

/** Concatenated `.github/workflows/*.yml|yaml` text (bounded). */
export async function readWorkflows(ctx: ScanContext, signal?: AbortSignal): Promise<{ text: string; files: string[] }> {
  let paths: string[] = [];
  try {
    const walk = await walkSortedTree(ctx.clonePath);
    paths = walk.paths.filter((p) => !p.endsWith('/'));
  } catch {
    paths = [];
  }
  const wf = paths.filter((p) => /^\.github\/workflows\/.+\.ya?ml$/.test(p)).sort();
  const chunks: string[] = [];
  const files: string[] = [];
  for (const p of wf.slice(0, 40)) {
    if (signal?.aborted) break;
    const text = await readText(ctx, p);
    if (text == null) continue;
    files.push(p);
    chunks.push(text);
  }
  return { text: chunks.join('\n'), files };
}

/** Memoized workflow read shared by ECOS-05/07, TEST-05 and SEC-02/10. */
export async function cachedWorkflows(ctx: ScanContext, signal?: AbortSignal): Promise<{ text: string; files: string[] }> {
  const cached = ctx.cache.get(WORKFLOW_CACHE_KEY);
  if (cached) return cached as { text: string; files: string[] };
  const wf = await readWorkflows(ctx, signal);
  ctx.cache.set(WORKFLOW_CACHE_KEY, wf);
  return wf;
}
