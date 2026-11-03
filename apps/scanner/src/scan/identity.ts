/** apps/scanner/src/scan/identity.ts — target-identity pass (report-identity).
 *
 * Computed by the scan driver beside `classifyArchetype`, never as a detector:
 * identity must not consume a detector's byte partition, and its cap failures
 * must not look like detector cap failures. Every value here is derived from
 * `(canonical tree walk, sniffed manifests, already-computed archetype, legacy
 * census)` and nothing else — no detector's emitted facts, no history, no
 * external API. The block is presentation-only: nothing it states enters a row
 * score, the headline, a gate, the coverage counts, or the score fingerprint.
 *
 * Derived identity never fails a run: every failure path degrades a stage to
 * `unknown` with a reason.
 */
import type {
  IdentityItem,
  IdentityLanguage,
  IdentitySize,
  ReportIdentity,
} from '@leapscore/contracts';
import { twoSignificantFigures } from '@leapscore/contracts';
import type { SortedWalk } from './tree';
import type { StackCensus } from './stackcensus';

// ---------------------------------------------------------------------------
// The `source-v1` counting scope (design D4) — one exported rule, versioned so a
// later change to it is distinguishable from a change in the target. Inclusion
// list over exclusion list: an inclusion list is enumerable and testable, and
// its omissions are visible in the scope identifier.
// ---------------------------------------------------------------------------

/** Identifier recorded on the line-magnitude item. Bump when the rule changes. */
export const SOURCE_SCOPE_ID = 'source-v1';

/** Extensions counted as source. Seeded from `SOURCE_EXT` (sourcefiles.ts) and
 * the stack-census extension sets (stackcensus.ts); nothing is counted that the
 * scanner does not already recognize as code. */
export const SOURCE_SCOPE_EXTENSIONS: readonly string[] = [
  // SOURCE_EXT — JS/TS family and the languages the scanner parses
  '.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx', '.mts', '.cts',
  '.py', '.go', '.java', '.kt', '.scala', '.rb', '.php', '.rs', '.cs', '.vb',
  // stack census — VB6 / Delphi
  '.vbp', '.frm', '.bas', '.cls', '.ctl', '.dpr', '.pas', '.dfm', '.dproj', '.dof',
];

/** Directories whose contents are never counted: vendored or third-party code is
 * not the subject's own source. */
export const SOURCE_SCOPE_EXCLUDED_DIRS: readonly string[] = [
  'vendor',
  'third_party',
  'third-party',
  'bower_components',
  'Pods',
  'node_modules',
  'dist',
  'build',
];

const SOURCE_EXT_SET = new Set(SOURCE_SCOPE_EXTENSIONS.map((e) => e.toLowerCase()));

/** Generated / minified file markers: emitted code is not authored source. */
const GENERATED_FILE_PATTERNS: readonly RegExp[] = [
  /\.min\.[^./]+$/i,
  /\.bundle\.[^./]+$/i,
  /-min\.[^./]+$/i,
  /\.generated\.[^./]+$/i,
  /_generated\.[^./]+$/i,
  /\.pb\.go$/i,
  /\.designer\.cs$/i,
  /\.g\.dart$/i,
];

/** The one `source-v1` rule object. `includes` is the whole rule: extension in
 * the inclusion list, no vendored directory, no generated/minified marker.
 * Lockfiles (`*.lock`, `*.json`, `*.txt`) fall outside the extension list, so a
 * 20k-line lockfile cannot contribute. */
export const SOURCE_SCOPE_V1 = {
  id: SOURCE_SCOPE_ID,
  extensions: SOURCE_SCOPE_EXTENSIONS,
  excludedDirs: SOURCE_SCOPE_EXCLUDED_DIRS,
  includes(path: string): boolean {
    return isInSourceScope(path);
  },
} as const;

/** Extension of a repo-relative path, lowercased, `''` when it has none. */
export function extensionOf(path: string): string {
  const base = path.slice(path.lastIndexOf('/') + 1);
  const dot = base.lastIndexOf('.');
  return dot <= 0 ? '' : base.slice(dot).toLowerCase();
}

function hasExcludedDir(path: string): boolean {
  const segments = path.split('/');
  // The last segment is the file itself; only directories are checked.
  for (let i = 0; i < segments.length - 1; i++) {
    if (SOURCE_SCOPE_EXCLUDED_DIRS.includes(segments[i])) return true;
  }
  return false;
}

/** True when a repo-relative file path is counted by the `source-v1` rule. */
export function isInSourceScope(path: string): boolean {
  if (!path || path.endsWith('/')) return false;
  if (!SOURCE_EXT_SET.has(extensionOf(path))) return false;
  if (hasExcludedDir(path)) return false;
  const base = path.slice(path.lastIndexOf('/') + 1);
  if (GENERATED_FILE_PATTERNS.some((rx) => rx.test(base))) return false;
  return true;
}

// ---------------------------------------------------------------------------
// Language + framework vocabulary. Presence-only: no versions, no support
// status — those are ECOS-01/ECOS-08's graded subject matter.
// ---------------------------------------------------------------------------

const LANGUAGE_BY_EXTENSION: Record<string, string> = {
  '.js': 'JavaScript',
  '.jsx': 'JavaScript',
  '.mjs': 'JavaScript',
  '.cjs': 'JavaScript',
  '.ts': 'TypeScript',
  '.tsx': 'TypeScript',
  '.mts': 'TypeScript',
  '.cts': 'TypeScript',
  '.py': 'Python',
  '.go': 'Go',
  '.java': 'Java',
  '.kt': 'Kotlin',
  '.scala': 'Scala',
  '.rb': 'Ruby',
  '.php': 'PHP',
  '.rs': 'Rust',
  '.cs': 'C#',
  '.vb': 'Visual Basic',
  '.vbp': 'Visual Basic 6',
  '.frm': 'Visual Basic 6',
  '.bas': 'Visual Basic 6',
  '.cls': 'Visual Basic 6',
  '.ctl': 'Visual Basic 6',
  '.dpr': 'Delphi',
  '.pas': 'Delphi',
  '.dfm': 'Delphi',
  '.dproj': 'Delphi',
  '.dof': 'Delphi',
};

/** Framework signatures: presence of any token in a manifest's text names the
 * framework. Names only — a version or a support judgement would import
 * ECOS-01/ECOS-08's graded subject into an unscored block. */
export const FRAMEWORK_SIGNATURES: ReadonlyArray<{ name: string; tokens: readonly string[] }> = [
  { name: 'React', tokens: ['react', 'react-dom'] },
  { name: 'Next.js', tokens: ['next'] },
  { name: 'Vue', tokens: ['vue', 'nuxt'] },
  { name: 'Svelte', tokens: ['svelte', 'sveltekit', '@sveltejs/kit'] },
  { name: 'Angular', tokens: ['@angular/core'] },
  { name: 'Express', tokens: ['express'] },
  { name: 'Fastify', tokens: ['fastify'] },
  { name: 'Koa', tokens: ['koa'] },
  { name: 'NestJS', tokens: ['@nestjs/core'] },
  { name: 'Django', tokens: ['django'] },
  { name: 'Flask', tokens: ['flask'] },
  { name: 'FastAPI', tokens: ['fastapi'] },
  { name: 'Spring', tokens: ['spring-boot', 'org.springframework'] },
  { name: 'Rails', tokens: ['rails'] },
  { name: 'Laravel', tokens: ['laravel/framework'] },
  { name: 'Gin', tokens: ['gin-gonic/gin'] },
  { name: 'Actix', tokens: ['actix-web'] },
  { name: 'Axum', tokens: ['axum'] },
  { name: 'ASP.NET', tokens: ['microsoft.net.sdk.web', 'microsoft.aspnetcore'] },
  { name: 'Entity Framework', tokens: ['microsoft.entityframeworkcore', 'entityframework'] },
  { name: 'Hibernate', tokens: ['hibernate'] },
];

/** Token-aware match: `gin` must not match inside `packaging`. */
function manifestHasToken(text: string, token: string): boolean {
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9_@.\\-/])${escaped}([^a-z0-9_@.\\-/]|$)`, 'i').test(text);
}

// ---------------------------------------------------------------------------
// Named constants. `k` and the per-file cap are tuning values with no spec-level
// consequence: changing them changes a value and its status, never the contract
// or the rules (design open question 1).
// ---------------------------------------------------------------------------

/** Fixed sample size of the remote ladder. Fixed — never a fraction of the
 * budget — so status cannot flip between two runs of identical content at
 * different indicator counts. */
export const IDENTITY_SAMPLE_K = 40;

/** Per-file read cap for the line count. A truncated source read is an
 * incomplete measurement, disclosed as `unknown`, never silently undercounted. */
export const IDENTITY_MAX_FILE_BYTES = 1024 * 1024;

/** Max manifest reads for the presence-only framework list. */
const IDENTITY_MAX_MANIFEST_READS = 12;
const IDENTITY_MAX_MANIFEST_BYTES = 256 * 1024;

// ---------------------------------------------------------------------------
// Tree shape
// ---------------------------------------------------------------------------

/** Per-extension histogram over repo-relative file paths (internal need of the
 * language shares and the extension-weighted extrapolation). */
export function extensionHistogram(paths: readonly string[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const path of paths) {
    const ext = extensionOf(path);
    if (!ext) continue;
    out.set(ext, (out.get(ext) ?? 0) + 1);
  }
  return out;
}

/** In-scope source files in canonical order. */
export function sourceFilesOf(paths: readonly string[]): string[] {
  return paths.filter((p) => !p.endsWith('/') && isInSourceScope(p));
}

/** Language shares over the in-scope source files, with a deterministic primary
 * language. Shares are fractions of the counted source files, not of all files:
 * a lockfile or an image cannot dilute a language's share. */
export function languageShares(sourcePaths: readonly string[]): {
  languages: IdentityLanguage[];
  primary?: string;
} {
  const counts = new Map<string, number>();
  for (const path of sourcePaths) {
    const name = LANGUAGE_BY_EXTENSION[extensionOf(path)] ?? 'Other';
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  const total = sourcePaths.length;
  if (total === 0) return { languages: [] };
  const languages = [...counts.entries()]
    .map(([name, files]) => ({ name, files, share: Math.round((files / total) * 10000) / 10000 }))
    .sort((a, b) => b.files - a.files || a.name.localeCompare(b.name));
  const max = languages[0]?.files ?? 0;
  const primary = languages
    .filter((l) => l.files === max)
    .map((l) => l.name)
    .sort((a, b) => a.localeCompare(b))[0];
  return { languages, primary };
}

/** Ecosystem names from the sniffed manifests — presence-only, sorted. */
export function ecosystemsOf(manifests: ReadonlyArray<{ ecosystem: string }>): string[] {
  return [...new Set(manifests.map((m) => String(m.ecosystem)))].sort((a, b) => a.localeCompare(b));
}

/** Framework presence from manifest content. Reads are bounded; an unreadable
 * manifest contributes nothing rather than a guess. */
export async function detectFrameworks(
  manifests: ReadonlyArray<{ root: string; manifest: string }>,
  readFile: (path: string) => Promise<Buffer | null>,
): Promise<string[]> {
  const found = new Set<string>();
  const unique = new Map<string, string>();
  for (const m of manifests) {
    const path = m.root === '.' ? m.manifest : `${m.root}/${m.manifest}`;
    unique.set(path, path);
  }
  const paths = [...unique.keys()].sort((a, b) => a.localeCompare(b)).slice(0, IDENTITY_MAX_MANIFEST_READS);
  for (const path of paths) {
    let text: string;
    try {
      const buf = await readFile(path);
      if (!buf) continue;
      text = buf.subarray(0, IDENTITY_MAX_MANIFEST_BYTES).toString('utf8');
    } catch {
      continue;
    }
    for (const sig of FRAMEWORK_SIGNATURES) {
      if (found.has(sig.name)) continue;
      if (sig.tokens.some((token) => manifestHasToken(text, token))) found.add(sig.name);
    }
  }
  return [...found].sort((a, b) => a.localeCompare(b));
}

/** Fixed-stride sample over the canonically ordered list: `k` evenly spaced
 * entries, so the sample cannot be the alphabetically-first directory. */
export function strideSample<T>(items: readonly T[], k: number): T[] {
  if (items.length <= k) return [...items];
  const out: T[] = [];
  for (let i = 0; i < k; i++) {
    out.push(items[Math.floor((i * items.length) / k)]);
  }
  return out;
}

function newlineCount(buf: Buffer): number {
  let count = 0;
  for (let i = 0; i < buf.length; i++) if (buf[i] === 0x0a) count++;
  return count;
}

// ---------------------------------------------------------------------------
// Line-magnitude ladder (design D5). Status follows coverage, not remaining
// budget: read everything → measured; read a bounded sample → estimated;
// neither → unknown with the reason.
// ---------------------------------------------------------------------------

export type LineLadderInput = {
  /** In-scope source files, canonically ordered. */
  sourcePaths: readonly string[];
  readFile: (path: string) => Promise<Buffer | null>;
  signal?: AbortSignal;
  /** Read every in-scope file (local lane): coverage is complete by
   *  construction, so the magnitude is `measured` at any size. */
  readAll?: boolean;
  /** Override the fixed sample size (tests only). */
  sampleSize?: number;
  /** Override the per-file read cap (tests only). */
  maxFileBytes?: number;
};

export async function deriveLineMagnitude(input: LineLadderInput): Promise<IdentityItem> {
  const scope = SOURCE_SCOPE_ID;
  const filesInScope = input.sourcePaths.length;
  const k = input.readAll ? filesInScope : Math.max(1, input.sampleSize ?? IDENTITY_SAMPLE_K);
  const maxFileBytes = input.maxFileBytes ?? IDENTITY_MAX_FILE_BYTES;

  if (filesInScope === 0) {
    // A docs-only or infrastructure-only target is not "zero lines": the scope
    // itself is empty, and that absence is stated rather than counted.
    return {
      status: 'unknown',
      reason: 'empty scope: no file matches the source-v1 inclusion rule',
      method: 'read-all',
      covered: { files_read: 0, files_in_scope: 0 },
      scope,
    };
  }

  const sampling = filesInScope > k;
  const method = sampling ? 'stride-sample' : 'read-all';
  const sample = strideSample(input.sourcePaths, k);
  const sampledByExt = new Map<string, { files: number; lines: number }>();
  let sampledLines = 0;
  let filesRead = 0;

  for (const path of sample) {
    if (input.signal?.aborted) {
      return {
        status: 'unknown',
        reason: 'scan aborted during the identity read',
        method,
        covered: { files_read: filesRead, files_in_scope: filesInScope },
        scope,
      };
    }
    let buf: Buffer | null;
    try {
      buf = await input.readFile(path);
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e);
      const cap = (e as { name?: string } | null)?.name === 'QuotaExceededError' || /bytecap|read budget/i.test(detail);
      return {
        status: 'unknown',
        reason: cap
          ? `identity read allocation exhausted before ${path}`
          : `read failed at ${path}: ${detail}`,
        method,
        covered: { files_read: filesRead, files_in_scope: filesInScope },
        scope,
      };
    }
    if (!buf) {
      return {
        status: 'unknown',
        reason: `unreadable source file: ${path}`,
        method,
        covered: { files_read: filesRead, files_in_scope: filesInScope },
        scope,
      };
    }
    if (buf.length > maxFileBytes) {
      return {
        status: 'unknown',
        reason: `read incomplete: ${path} exceeds the per-file read cap (${maxFileBytes} bytes)`,
        method,
        covered: { files_read: filesRead, files_in_scope: filesInScope },
        scope,
      };
    }
    const lines = newlineCount(buf);
    filesRead++;
    sampledLines += lines;
    const ext = extensionOf(path);
    const slot = sampledByExt.get(ext) ?? { files: 0, lines: 0 };
    slot.files += 1;
    slot.lines += lines;
    sampledByExt.set(ext, slot);
  }

  if (!sampling) {
    return {
      status: 'measured',
      value: sampledLines,
      method,
      covered: { files_read: filesRead, files_in_scope: filesInScope },
      scope,
    };
  }

  // Extrapolate by the whole tree's extension distribution: a language the
  // stride happened to skip still contributes at the global sample density.
  const treeByExt = extensionHistogram(input.sourcePaths);
  const globalMean = filesRead > 0 ? sampledLines / filesRead : 0;
  let extrapolated = 0;
  for (const [ext, count] of treeByExt) {
    const slot = sampledByExt.get(ext);
    const mean = slot && slot.files > 0 ? slot.lines / slot.files : globalMean;
    extrapolated += mean * count;
  }

  return {
    status: 'estimated',
    // Stored precision follows status (design D6): nobody quotes false precision
    // out of the JSON.
    value: twoSignificantFigures(extrapolated),
    method,
    covered: { files_read: filesRead, files_in_scope: filesInScope },
    scope,
  };
}

// ---------------------------------------------------------------------------
// Block assembly
// ---------------------------------------------------------------------------

export type PlaneInventoryLike = {
  has_server?: boolean;
  has_data?: boolean;
  has_deploy?: boolean;
  has_client?: boolean;
  has_test?: boolean;
  evidence?: Record<string, unknown>;
};

export type ArchetypeIdentityInput = {
  archetype: string;
  confidence?: string;
  planeInventory?: PlaneInventoryLike;
  perRoot?: ReadonlyArray<{
    root: string;
    archetype: string;
    confidence?: string;
    planeInventory?: PlaneInventoryLike;
  }>;
};

export type IdentitySubject = { repo: string; commit: string; scanned_at: string };

export type IdentityDerivationInput = {
  /** The one canonical walk this pass performed (design D9). */
  walk: SortedWalk;
  /** Manifest entries sniffed from the same target. */
  manifests: ReadonlyArray<{ root: string; ecosystem: string; manifest: string }>;
  /** Identity's own reader, bound to its reserved allocation. */
  readFile: (path: string) => Promise<Buffer | null>;
  /** Already-computed archetype — never re-classified here. */
  archetype?: ArchetypeIdentityInput | null;
  /** Already-computed legacy-stack census, when the scan produced one. */
  census?: StackCensus | null;
  subject: IdentitySubject;
  signal?: AbortSignal;
  /** Local lane: read every in-scope file instead of a fixed-stride sample. */
  readAll?: boolean;
  /** Test seams mirroring the named constants. */
  sampleSize?: number;
  maxFileBytes?: number;
};

function planesOf(inventory: PlaneInventoryLike | undefined): Record<string, boolean> | undefined {
  if (!inventory) return undefined;
  const out: Record<string, boolean> = {};
  for (const key of Object.keys(inventory)) {
    if (key === 'evidence') continue;
    const value = (inventory as Record<string, unknown>)[key];
    if (typeof value === 'boolean') out[key] = value;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function planeEvidenceOf(inventory: PlaneInventoryLike | undefined): Record<string, string[]> | undefined {
  const evidence = inventory?.evidence;
  if (!evidence || typeof evidence !== 'object') return undefined;
  const out: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(evidence)) {
    if (!Array.isArray(value)) continue;
    out[key] = value.map((v) => String(v));
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

/** An identity block whose stages did not run: every stage states why. */
export function degradedIdentity(subject: IdentitySubject, reason: string): ReportIdentity {
  return {
    subject,
    shape: { status: 'unknown', archetype: 'unknown', reason },
    size: { status: 'unknown', reason, lines: { status: 'unknown', reason, scope: SOURCE_SCOPE_ID } },
    stack: { status: 'unknown', languages: [], ecosystems: [], frameworks: [], reason },
  };
}

/**
 * Derive the identity block. Never throws: each stage that fails is published as
 * `unknown` with the reason that stopped it, so a scan always seals.
 */
export async function deriveIdentity(input: IdentityDerivationInput): Promise<ReportIdentity> {
  try {
    return await deriveIdentityInner(input);
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    return degradedIdentity(input.subject, `identity derivation failed: ${detail.slice(0, 200)}`);
  }
}

async function deriveIdentityInner(input: IdentityDerivationInput): Promise<ReportIdentity> {
  const allPaths = input.walk.paths;
  const filePaths = allPaths.filter((p) => !p.endsWith('/'));
  const directoryCount = allPaths.length - filePaths.length;
  const sourcePaths = sourceFilesOf(filePaths);
  const { languages, primary } = languageShares(sourcePaths);

  let frameworks: string[] = [];
  try {
    frameworks = await detectFrameworks(input.manifests, input.readFile);
  } catch {
    // Presence-only: an unreadable manifest contributes no claim at all.
    frameworks = [];
  }

  const lines = await deriveLineMagnitude({
    sourcePaths,
    readFile: input.readFile,
    signal: input.signal,
    readAll: input.readAll,
    sampleSize: input.sampleSize,
    maxFileBytes: input.maxFileBytes,
  });

  const size: IdentitySize = {
    status: 'measured',
    files: filePaths.length,
    directories: directoryCount,
    lines,
  };

  const archetype = input.archetype;
  const shape: ReportIdentity['shape'] = archetype
    ? {
        status: 'measured',
        archetype: String(archetype.archetype),
        ...(archetype.confidence ? { confidence: String(archetype.confidence) } : {}),
        ...(planesOf(archetype.planeInventory) ? { planes: planesOf(archetype.planeInventory) } : {}),
        ...(planeEvidenceOf(archetype.planeInventory)
          ? { plane_evidence: planeEvidenceOf(archetype.planeInventory) }
          : {}),
        ...(archetype.perRoot && archetype.perRoot.length > 0
          ? {
              per_root: archetype.perRoot.map((entry) => ({
                root: String(entry.root),
                archetype: String(entry.archetype),
                ...(entry.confidence ? { confidence: String(entry.confidence) } : {}),
                ...(planesOf(entry.planeInventory) ? { planes: planesOf(entry.planeInventory) } : {}),
              })),
            }
          : {}),
      }
    : {
        status: 'unknown',
        archetype: 'unknown',
        reason: 'archetype classification did not run for this scan',
      };

  const census = input.census;
  const legacyStacks = census
    ? [
        { id: census.vb6.id, detected: census.vb6.detected, files: census.vb6.file_count },
        { id: census.delphi.id, detected: census.delphi.detected, files: census.delphi.file_count },
      ]
    : undefined;

  return {
    subject: {
      repo: String(input.subject.repo),
      commit: String(input.subject.commit ?? 'unknown'),
      scanned_at: String(input.subject.scanned_at),
    },
    shape,
    size,
    stack: {
      status: 'measured',
      languages,
      ...(primary ? { primary_language: primary } : {}),
      ecosystems: ecosystemsOf(input.manifests),
      frameworks,
      ...(legacyStacks ? { legacy_stacks: legacyStacks } : {}),
    },
  };
}
