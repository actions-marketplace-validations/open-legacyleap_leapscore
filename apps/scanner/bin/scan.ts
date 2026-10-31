#!/usr/bin/env tsx
/** apps/scanner/bin/scan.ts — thin workflow CLI over runUnifiedScan/runLocalScan + sealScan (spec: workflow-scan, scan-local) */
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { stat } from 'node:fs/promises';
import { resolve, basename } from 'node:path';
import { runUnifiedScan } from '../src/scan/orchestrator';
import { runLocalScan } from '../src/scan/local';
import { sealScan, CONTRACT_VERSION, localSlugFromPath, formatStdout } from '../src/scan/scoring/seal';
import { renderHtml, renderMarkdown } from '../src/scan/render';
import { computeDelta, formatDeltaLine, ratchetOutcome, type RatchetOutcome } from '../src/scan/diff';
import {
  assertContractVersion,
  BAND_FLOORS,
  bandThresholdFor,
  isDeltaDocument,
  type DeltaDocument,
  type NextBandPath,
  type ReportEnvelope,
} from '@leapscore/contracts';

export const USAGE = `leapscore-scan [scan] [<path> | --repo <owner/repo>] --out <dir> [--strict] [--fail-under <0-100> | --fail-under-band <critical|high|moderate|low>] [--baseline <report.json> [--ratchet[=<tolerance-pp>]]] [--sha <sha>] [--engine-ref <sha>] [--score-policy frozen|legacy]

  scan <path>             Local directory scan (default entry): no clone, no GH-API, 25 local detectors
  --repo <owner/repo>     Remote scan subject as owner/repo (no https:// prefix, no .git suffix)
  --sha <sha>             Reserved — any non-empty value is rejected (pinning not yet supported)
  --out <dir>             Report directory: writes report.json + report.html + report.md (all three, every sealed run)
  --strict                Zero-socket mode: any network attempt aborts (vendored snapshots only). Conflicts with --repo.
  --fail-under <0-100>    Exit 3 when the sealed score is below <n> (files are still written)
  --fail-under-band <b>   Band-native gate: exit 3 below the named band's floor (critical|high|moderate|low).
                          Mutually exclusive with --fail-under in one invocation.
  --baseline <report.json>
                          Compare against a previously sealed report: writes report.delta.json beside the sealed
                          trio and prints one delta summary line after the sealed-run line. The sealed files are
                          byte-identical to an unbaselined run.
  --ratchet[=<tolerance-pp>]
                          Gate on the code-attributable part of the delta (default tolerance 0pp): exit 3 when it
                          falls beyond tolerance, exit 2 when the comparison is incomparable — a gate that cannot
                          evaluate never passes. Requires --baseline.
  --engine-ref <sha>      Pinned engine ref for meta.engineSha7 identity (else LEAPSCORE_SHA/git/unknown)
  --score-policy <p>      Headline policy: frozen (default; unknowns disclosed as unscored) or legacy (renormalized reference as headline, one-release escape hatch)
  --help                  Print this usage

  Exits: 0 pass · 1 crash · 2 usage-or-refused · 3 threshold trip (--fail-under / --fail-under-band) or ratchet trip (--ratchet)
  Stdout: one line — score/band, gates, coverage, threshold state, compact next-band path clause when the
  sealed report carries a path, then the band-specific next step with the tracked assessment URL once (final token).
  With --baseline, one additional delta summary line follows the sealed-run line.

  Issue surfacing moved to the standalone app: use \`surface --from <dir>/report.json --repo <owner/repo>\`
  (apps/surface) instead of the removed --surface / --surface-from flags.`;

export const SURFACE_MOVED_HINT = `issue surfacing moved out of leapscore-scan: use \`surface --from <envelope.json> --repo <owner/repo>\` (apps/surface) instead of --surface / --surface-from`;

export const EXIT_OK = 0;
export const EXIT_CRASH = 1;
export const EXIT_USAGE = 2;
export const EXIT_THRESHOLD = 3;

export type ParsedArgs = {
  path?: string;
  repo?: string;
  sha?: string;
  out?: string;
  engineRef?: string;
  strict?: boolean;
  failUnder?: string;
  failUnderBand?: string;
  baseline?: string;
  /** `true` for a bare `--ratchet` (tolerance 0), or the raw tolerance text. */
  ratchet?: true | string;
  scorePolicy?: string;
  surface?: boolean;
  surfaceFrom?: string;
  repoA?: string;
  runUrl?: string;
  help?: boolean;
};

export function parseArgs(argv: string[]): ParsedArgs {
  const out: ParsedArgs = {};
  const positionals: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') out.help = true;
    else if (a === '--strict') out.strict = true;
    else if (a === '--surface') out.surface = true;
    else if (a === '--repo') out.repo = argv[++i];
    else if (a === '--sha') out.sha = argv[++i];
    else if (a === '--out') out.out = argv[++i];
    else if (a === '--engine-ref') out.engineRef = argv[++i];
    else if (a === '--fail-under') out.failUnder = argv[++i];
    else if (a === '--fail-under-band') out.failUnderBand = argv[++i];
    else if (a === '--baseline') out.baseline = argv[++i];
    // Bare `--ratchet` means tolerance 0; an adjacent numeric token (a tolerance
    // never starts with a path separator or a flag) is consumed as the value.
    else if (a === '--ratchet') {
      const next = argv[i + 1];
      if (next != null && /^\d+(\.\d+)?$/.test(next)) {
        out.ratchet = next;
        i++;
      } else {
        out.ratchet = true;
      }
    } else if (a.startsWith('--ratchet=')) out.ratchet = a.slice('--ratchet='.length);
    else if (a === '--score-policy') out.scorePolicy = argv[++i];
    else if (a === '--surface-from') out.surfaceFrom = argv[++i];
    else if (a === '--repo-a') out.repoA = argv[++i];
    else if (a === '--run-url') out.runUrl = argv[++i];
    else if (a.startsWith('--repo=')) out.repo = a.slice('--repo='.length);
    else if (a.startsWith('--sha=')) out.sha = a.slice('--sha='.length);
    else if (a.startsWith('--out=')) out.out = a.slice('--out='.length);
    else if (a.startsWith('--engine-ref=')) out.engineRef = a.slice('--engine-ref='.length);
    else if (a.startsWith('--fail-under=')) out.failUnder = a.slice('--fail-under='.length);
    else if (a.startsWith('--fail-under-band=')) out.failUnderBand = a.slice('--fail-under-band='.length);
    else if (a.startsWith('--baseline=')) out.baseline = a.slice('--baseline='.length);
    else if (a.startsWith('--score-policy=')) out.scorePolicy = a.slice('--score-policy='.length);
    else if (a.startsWith('--surface-from=')) out.surfaceFrom = a.slice('--surface-from='.length);
    else if (a.startsWith('--repo-a=')) out.repoA = a.slice('--repo-a='.length);
    else if (a.startsWith('--run-url=')) out.runUrl = a.slice('--run-url='.length);
    else if (a.startsWith('--strict=')) throw new Error(`unknown flag ${a}\n${USAGE}`);
    else if (a.startsWith('--')) throw new Error(`unknown flag ${a}\n${USAGE}`);
    else positionals.push(a);
  }
  // Optional `scan` verb + optional <path> positional.
  const rest = positionals[0] === 'scan' ? positionals.slice(1) : positionals;
  if (rest.length > 1) throw new Error(`unexpected argument ${JSON.stringify(rest[1])}\n${USAGE}`);
  if (rest.length === 1) out.path = rest[0];
  return out;
}

export function parseFailUnder(raw: string | undefined): number | undefined {
  if (raw == null) return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0 || n > 100) {
    throw new Error(`invalid --fail-under ${JSON.stringify(raw)}: expected a number 0-100\n${USAGE}`);
  }
  return n;
}

/** Band-native threshold: only the public band vocabulary is accepted, and the
 *  name resolves to its contract floor (band-path D4) — no second table. */
export function parseFailUnderBand(raw: string | undefined): string | undefined {
  if (raw == null || raw.trim() === '') return undefined;
  const name = raw.trim().toLowerCase();
  if (bandThresholdFor(name) === undefined) {
    throw new Error(`invalid --fail-under-band ${JSON.stringify(raw)}: expected critical|high|moderate|low\n${USAGE}`);
  }
  return name;
}

export type ScorePolicy = 'frozen' | 'legacy';

export function parseScorePolicy(raw: string | undefined): ScorePolicy {
  if (raw == null || raw === '') return 'frozen';
  if (raw === 'frozen' || raw === 'legacy') return raw;
  throw new Error(`invalid --score-policy ${JSON.stringify(raw)}: expected frozen|legacy\n${USAGE}`);
}

/** Ratchet tolerance in headline points: bare `--ratchet` is 0 (design D7 —
 *  the default is zero and is configurable), a supplied value must be a
 *  non-negative finite number. */
export function parseRatchetTolerance(raw: true | string | undefined): number | undefined {
  if (raw == null) return undefined;
  if (raw === true) return 0;
  const n = Number(raw);
  if (raw.trim() === '' || !Number.isFinite(n) || n < 0) {
    throw new Error(`invalid --ratchet ${JSON.stringify(raw)}: expected a non-negative tolerance in points, e.g. --ratchet or --ratchet=2.5\n${USAGE}`);
  }
  return n;
}

export type BaselineLoadResult =
  | { ok: true; envelope: ReportEnvelope }
  | { ok: false; detail: string };

/** A baseline is a previously sealed envelope on disk. A delta document is
 *  explicitly refused rather than half-read (design D9 / run-diff: the delta is
 *  never an envelope); a readable JSON that is neither is refused too. */
export function validateBaselineDocument(raw: unknown, label = 'baseline'): BaselineLoadResult {
  if (isDeltaDocument(raw)) {
    return { ok: false, detail: `${label} is a run-diff delta document, not a sealed report — pass the report.json envelope it was derived from` };
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, detail: `${label} is not a sealed report envelope (expected a JSON object)` };
  }
  const env = raw as Partial<ReportEnvelope>;
  if (!env.meta || typeof env.meta !== 'object' || !env.report || typeof env.report !== 'object') {
    return { ok: false, detail: `${label} is not a sealed report envelope (missing meta or report)` };
  }
  if (typeof env.meta.runId !== 'string' || !env.meta.runId) {
    return { ok: false, detail: `${label} is not a sealed report envelope (meta.runId missing)` };
  }
  try {
    assertContractVersion(env as ReportEnvelope);
  } catch (e) {
    return { ok: false, detail: `${label}: ${e instanceof Error ? e.message : String(e)}` };
  }
  return { ok: true, envelope: env as ReportEnvelope };
}

/** Read + validate the baseline before any scan work starts: an unreadable,
 *  missing, or non-envelope file is a usage-or-refused exit with no report
 *  written (scan-local: unreadable baseline is refused before work). */
export async function loadBaselineEnvelope(
  path: string,
  readFileImpl: (p: string, enc: 'utf8') => Promise<string> = readFile,
): Promise<BaselineLoadResult> {
  let text: string;
  try {
    text = await readFileImpl(path, 'utf8');
  } catch (e) {
    const detail = (e instanceof Error ? e.message : String(e)).slice(0, 200);
    return { ok: false, detail: `cannot read baseline ${path}: ${detail}` };
  }
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (e) {
    const detail = (e instanceof Error ? e.message : String(e)).slice(0, 200);
    return { ok: false, detail: `baseline ${path} is not valid JSON: ${detail}` };
  }
  return validateBaselineDocument(raw, `baseline ${path}`);
}

export function validateRepo(raw: string | undefined): string {
  if (!raw || !raw.trim()) throw new Error(`missing --repo (expected owner/repo, e.g. vercel/next.js)\n${USAGE}`);
  const v = raw.trim();
  if (/^https?:\/\//i.test(v) || /^github\.com\//i.test(v)) {
    throw new Error(`invalid --repo ${JSON.stringify(v)}: expected owner/repo without https:// prefix (e.g. vercel/next.js)`);
  }
  if (/\.git$/i.test(v)) {
    throw new Error(`invalid --repo ${JSON.stringify(v)}: expected owner/repo without .git suffix (e.g. vercel/next.js)`);
  }
  if (!/^[\w.-]+\/[\w.-]+$/.test(v)) {
    throw new Error(`invalid --repo ${JSON.stringify(v)}: expected owner/repo (e.g. vercel/next.js)`);
  }
  return v;
}

/** Post-seal threshold evaluation (scan-local): numeric or band floor, the
 * band name resolving through the contract vocabulary (band-path D4), and
 * either gate failing closed on a suppressed headline — no stated score never
 * passes. D6 makes the two gates mutually exclusive, so at most one is set. */
export function gateOutcome(
  score: number,
  opts: { failUnder?: number; failUnderBand?: string; suppressed?: boolean },
): { tripped: boolean; thresholdState: string } {
  const numericTrip = opts.failUnder != null && (!!opts.suppressed || score < opts.failUnder);
  const bandFloor = opts.failUnderBand != null ? bandThresholdFor(opts.failUnderBand) : undefined;
  const bandTrip = opts.failUnderBand != null && (!!opts.suppressed || score < (bandFloor ?? Number.POSITIVE_INFINITY));
  const thresholdState = opts.failUnder != null
    ? ` threshold:${numericTrip ? 'trip' : 'pass'}(fail-under ${opts.failUnder})`
    : opts.failUnderBand != null
      ? ` threshold:${bandTrip ? 'trip' : 'pass'}(fail-under-band ${opts.failUnderBand})`
      : '';
  return { tripped: numericTrip || bandTrip, thresholdState };
}

/** Refused reasons that map to exit 2 (unsupported input / honest refusal). Everything else refused → crash (1). */
const EXIT2_REASONS = new Set([
  'not_found',
  'private_requires_app',
  'rate-limited',
  'unsupported_host',
  'invalid_url',
  'missing_repo',
  'bad_path',
  'strict_conflict',
]);

export function exitCodeForReason(reason: string): number {
  return EXIT2_REASONS.has(reason) ? 2 : 1;
}

export function refusalHint(reason: string): string {
  if (reason === 'private_requires_app') {
    return 'private repo — provide a PAT/App token with contents:read on the target (e.g. LEAPSCORE_TOKEN); GITHUB_TOKEN from another repo cannot read private repos';
  }
  if (reason === 'not_found') {
    return 'repo not found or invisible to the token (private repos need a PAT/App token with contents:read)';
  }
  if (reason === 'rate-limited') return 'GitHub rate limit exhausted — retry later or provide a token with more quota';
  if (reason === 'bad_path') return 'provide an existing local directory to scan';
  if (reason === 'strict_conflict') return '--strict scans a local path only; drop --repo or drop --strict';
  return '';
}

export type MainOpts = {
  env?: NodeJS.ProcessEnv;
  stdout?: (s: string) => void;
  stderr?: (s: string) => void;
};

export async function main(argv: string[], opts: MainOpts = {}): Promise<number> {
  const env = opts.env ?? process.env;
  const stdout = opts.stdout ?? ((s: string) => process.stdout.write(s + '\n'));
  const stderr = opts.stderr ?? ((s: string) => process.stderr.write(s + '\n'));

  let args: ParsedArgs;
  try {
    args = parseArgs(argv);
  } catch (e) {
    stderr(e instanceof Error ? e.message : String(e));
    return EXIT_USAGE;
  }
  if (args.help) {
    stdout(USAGE);
    return EXIT_OK;
  }
  // --surface / --surface-from were removed: surfacing lives in apps/surface now.
  if (args.surfaceFrom || args.surface) {
    stderr(SURFACE_MOVED_HINT);
    return EXIT_USAGE;
  }
  // --strict + --repo is a usage error rejected before any work.
  if (args.strict && args.repo != null) {
    stderr(`refused (strict_conflict): --strict cannot be combined with --repo — ${refusalHint('strict_conflict')}`);
    return EXIT_USAGE;
  }
  if (args.sha != null && args.sha !== '') {
    stderr(`--sha pinning not yet supported (got ${JSON.stringify(args.sha)}); re-run without --sha to scan default-branch HEAD`);
    return EXIT_USAGE;
  }
  let failUnder: number | undefined;
  try {
    failUnder = parseFailUnder(args.failUnder);
  } catch (e) {
    stderr(e instanceof Error ? e.message : String(e));
    return EXIT_USAGE;
  }
  let failUnderBand: string | undefined;
  try {
    failUnderBand = parseFailUnderBand(args.failUnderBand);
  } catch (e) {
    stderr(e instanceof Error ? e.message : String(e));
    return EXIT_USAGE;
  }
  // D6: the two gates are mutually exclusive in one invocation — refused as a
  // usage error before any work begins (no scan, no report files).
  if (failUnder != null && failUnderBand != null) {
    stderr(`--fail-under and --fail-under-band conflict: set one gate per invocation (the conjunction is just the stricter floor)\n${USAGE}`);
    return EXIT_USAGE;
  }
  let scorePolicy: ScorePolicy;
  try {
    scorePolicy = parseScorePolicy(args.scorePolicy);
  } catch (e) {
    stderr(e instanceof Error ? e.message : String(e));
    return EXIT_USAGE;
  }
  // The ratchet is a delta gate: without a baseline there is no comparison to
  // gate, so the combination is a usage error before any work.
  if (args.ratchet != null && args.baseline == null) {
    stderr(`--ratchet requires --baseline <report.json>: there is no delta to gate without a comparison\n${USAGE}`);
    return EXIT_USAGE;
  }
  let ratchet: number | undefined;
  try {
    ratchet = parseRatchetTolerance(args.ratchet);
  } catch (e) {
    stderr(e instanceof Error ? e.message : String(e));
    return EXIT_USAGE;
  }
  // Read + validate the baseline before any scan work: a missing, unreadable, or
  // non-envelope file refuses here and writes nothing (scan-local).
  let baseline: ReportEnvelope | undefined;
  if (args.baseline != null) {
    const loaded = await loadBaselineEnvelope(args.baseline);
    if (!loaded.ok) {
      stderr(`refused (baseline): ${loaded.detail}`);
      return EXIT_USAGE;
    }
    baseline = loaded.envelope;
  }
  if (!args.out) {
    stderr(`missing --out <dir>\n${USAGE}`);
    return EXIT_USAGE;
  }
  const outDir = args.out;

  const useLocal = args.path != null || args.repo == null;
  if (useLocal && !args.path) {
    stderr(`missing scan <path> or --repo <owner/repo>\n${USAGE}`);
    return EXIT_USAGE;
  }

  const startMs = Date.now();
  const trace: Array<{ ts: number; elapsedMs: number; label: string; type?: string }> = [];

  if (useLocal) {
    return await runLocalMain(args.path!, { env, stdout, stderr, outDir, startMs, trace, failUnder, failUnderBand, scorePolicy, strict: !!args.strict, engineRef: args.engineRef, baseline, ratchet });
  }
  const repo = validateRepoSafe(args.repo, stderr);
  if (!repo) return EXIT_USAGE;
  return await runRemoteMain(repo, { env, stdout, stderr, outDir, startMs, trace, failUnder, failUnderBand, scorePolicy, engineRef: args.engineRef, baseline, ratchet });
}

function validateRepoSafe(raw: string | undefined, stderr: (s: string) => void): string | null {
  try {
    return validateRepo(raw);
  } catch (e) {
    stderr(e instanceof Error ? e.message : String(e));
    return null;
  }
}

type RunOpts = {
  env: NodeJS.ProcessEnv;
  stdout: (s: string) => void;
  stderr: (s: string) => void;
  outDir: string;
  startMs: number;
  trace: Array<{ ts: number; elapsedMs: number; label: string; type?: string }>;
  failUnder: number | undefined;
  /** Public band name (critical|high|moderate|low); mutex with failUnder. */
  failUnderBand: string | undefined;
  scorePolicy: ScorePolicy;
  engineRef?: string;
  /** Parsed + validated baseline envelope; absent for an unbaselined run. */
  baseline?: ReportEnvelope;
  /** Ratchet tolerance in points; defined only when --baseline --ratchet was set. */
  ratchet?: number;
};

async function runLocalMain(
  targetPath: string,
  o: RunOpts & { strict: boolean },
): Promise<number> {
  const absPath = resolve(targetPath);
  try {
    const st = await stat(absPath);
    if (!st.isDirectory()) {
      o.stderr(`refused (bad_path): not a directory: ${targetPath} — ${refusalHint('bad_path')}`);
      return EXIT_USAGE;
    }
  } catch {
    o.stderr(`refused (bad_path): path does not exist: ${targetPath} — ${refusalHint('bad_path')}`);
    return EXIT_USAGE;
  }

  o.trace.push({ ts: 0, elapsedMs: 0, label: `Starting local scan — ${absPath}`, type: 'start' });
  let budgetMs = 0;
  let facts: unknown[] = [];
  let snapshot: Record<string, unknown> | null = null;
  let scanId: string | undefined;
  try {
    const killerEnv = (o.env.LEAPSCORE_KILLER_MS ?? '') as string;
    const killerMs = killerEnv !== '' && Number.isFinite(Number(killerEnv)) ? Number(killerEnv) : undefined;
    const gen = runLocalScan(absPath, { strict: o.strict, killerMs });
    for await (const evt of gen) {
      if (evt.type === 'meta') {
        budgetMs = (evt.budgetMs as number) ?? 0;
        o.trace.push({ ts: Date.now() - o.startMs, elapsedMs: Date.now() - o.startMs, label: (evt.milestone as string) ?? `Budget ${Math.ceil(budgetMs / 1000)}s`, type: 'meta' });
      } else if (evt.type === 'progress') {
        const m = evt.milestone as string | undefined;
        if (m) o.trace.push({ ts: Date.now() - o.startMs, elapsedMs: Date.now() - o.startMs, label: m, type: 'progress' });
      } else if (evt.type === 'trace') {
        o.trace.push({
          ts: (evt.elapsedMs as number) ?? Date.now() - o.startMs,
          elapsedMs: (evt.elapsedMs as number) ?? Date.now() - o.startMs,
          label: (evt.label as string) ?? '',
          type: 'trace',
        });
      } else if (evt.type === 'run-failure') {
        // Killer timeout (4.1): run failure — no headline, no report files, exit 1.
        const reason = String((evt.reason as string) ?? 'budget-exceeded');
        const detail = String((evt.detail as string) ?? '').slice(0, 300);
        o.stderr(`crash (${reason}): ${detail}`);
        return EXIT_CRASH;
      } else if (evt.type === 'refused') {
        const reason = String((evt.reason as string) ?? 'crash');
        const detail = String((evt.detail as string) ?? '').slice(0, 500);
        const hint = refusalHint(reason);
        o.stderr(`refused (${reason}): ${detail}${hint ? ` — ${hint}` : ''}`);
        return exitCodeForReason(reason);
      } else if (evt.type === 'done') {
        facts = (evt.facts as unknown[]) ?? [];
        snapshot = evt.snapshot as Record<string, unknown>;
        scanId = evt.id as string | undefined;
        break;
      }
    }
  } catch (e) {
    o.stderr(`crash: ${(e instanceof Error ? e.message : String(e)).slice(0, 500)}`);
    return EXIT_CRASH;
  }

  if (!snapshot) {
    o.stderr('crash: scan ended without facts');
    return EXIT_CRASH;
  }

  const sorted = [...facts].sort((a, b) => String((a as { detectorId?: string }).detectorId ?? '').localeCompare(String((b as { detectorId?: string }).detectorId ?? '')));
  const sealed = sealScan({
    facts: sorted as never,
    snapshot: snapshot as Record<string, unknown>,
    budgetMs,
    startMs: o.startMs,
    trace: o.trace as never,
    engineRef: o.engineRef,
    env: o.env as NodeJS.ProcessEnv,
    // 2.3: engine identity from release metadata (--engine-ref / LEAPSCORE_SHA),
    // never `git rev-parse` in the caller's working tree.
    execImpl: () => { throw new Error('no consumer-tree git'); },
    scanId,
    repo: absPath,
    subjectSlug: localSlugFromPath(basename(absPath)),
    repoUrl: `file://${absPath}`,
    strict: o.strict,
    scorePolicy: o.scorePolicy,
  });

  return await writeReportsAndExit(sealed, o);
}

async function runRemoteMain(repo: string, o: RunOpts): Promise<number> {
  const token = o.env.GH_TOKEN ?? o.env.GITHUB_TOKEN;
  const repoUrl = `https://github.com/${repo}`;
  o.trace.push({ ts: 0, elapsedMs: 0, label: `Starting scan — ${repo}`, type: 'start' });

  let budgetMs = 0;
  let facts: never[] | unknown[] = [];
  let snapshot: unknown = null;
  let scanId: string | undefined;
  try {
    const killerEnv = (o.env.LEAPSCORE_KILLER_MS ?? '') as string;
    const killerMs = killerEnv !== '' && Number.isFinite(Number(killerEnv)) ? Number(killerEnv) : undefined;
    const gen = runUnifiedScan(repoUrl, { ...(token ? { token } : {}), ...(killerMs != null ? { killerMs } : {}) });
    for await (const evt of gen) {
      if (evt.type === 'meta') {
        budgetMs = evt.budgetMs ?? 0;
        o.trace.push({ ts: Date.now() - o.startMs, elapsedMs: Date.now() - o.startMs, label: (evt as { milestone?: string }).milestone ?? `Budget ${Math.ceil(budgetMs / 1000)}s`, type: 'meta' });
      } else if (evt.type === 'progress') {
        const m = (evt as { milestone?: string }).milestone;
        if (m) o.trace.push({ ts: Date.now() - o.startMs, elapsedMs: Date.now() - o.startMs, label: m, type: 'progress' });
      } else if (evt.type === 'trace') {
        o.trace.push({
          ts: (evt.elapsedMs as number) ?? Date.now() - o.startMs,
          elapsedMs: (evt.elapsedMs as number) ?? Date.now() - o.startMs,
          label: (evt.label as string) ?? '',
          type: 'trace',
        });
      } else if (evt.type === 'run-failure') {
        // Killer timeout (4.1): run failure — no headline, no report files, exit 1.
        const reason = String((evt as { reason?: string }).reason ?? 'budget-exceeded');
        const detail = String((evt as { detail?: string }).detail ?? '').slice(0, 300);
        o.stderr(`crash (${reason}): ${detail}`);
        return EXIT_CRASH;
      } else if (evt.type === 'refused') {
        const reason = String((evt as { reason?: string }).reason ?? 'crash');
        const detail = String((evt as { detail?: string }).detail ?? '').slice(0, 500);
        const hint = refusalHint(reason);
        o.stderr(`refused (${reason}): ${detail}${hint ? ` — ${hint}` : ''}`);
        return exitCodeForReason(reason);
      } else if (evt.type === 'done') {
        facts = (evt.facts as unknown[]) ?? [];
        snapshot = evt.snapshot ?? null;
        scanId = evt.id as string | undefined;
        break;
      }
    }
  } catch (e) {
    o.stderr(`crash: ${(e instanceof Error ? e.message : String(e)).slice(0, 500)}`);
    return EXIT_CRASH;
  }

  if (!snapshot) {
    o.stderr('crash: scan ended without facts');
    return EXIT_CRASH;
  }

  const sorted = [...facts].sort((a, b) => String((a as { detectorId?: string }).detectorId ?? '').localeCompare(String((b as { detectorId?: string }).detectorId ?? '')));
  const sealed = sealScan({
    facts: sorted as never,
    snapshot: snapshot as Record<string, unknown>,
    budgetMs,
    startMs: o.startMs,
    trace: o.trace as never,
    engineRef: o.engineRef,
    env: o.env as NodeJS.ProcessEnv,
    // 2.3: engine identity from release metadata (--engine-ref / LEAPSCORE_SHA),
    // never `git rev-parse` in the caller's working tree.
    execImpl: () => { throw new Error('no consumer-tree git'); },
    scanId,
    repo,
    strict: false,
    scorePolicy: o.scorePolicy,
  });

  return await writeReportsAndExit(sealed, o);
}

async function writeReportsAndExit(
  sealed: {
    report: unknown;
    meta: { runId: string; score: number; tier: string };
    traceToPersist: unknown;
    stdoutLine: string;
  },
  o: RunOpts,
): Promise<number> {
  const report = sealed.report as {
    headline: { score: number; tier: string; suppressed?: boolean; verdict?: string };
    gates: unknown[];
    coverage: { measured: number; estimated: number; unknown: number };
    top_blockers: Array<{ row: string; name: string; points_lost: number; weight_pp: string; summary: string; evidence_file?: string; rule?: string }>;
    next_band_path?: NextBandPath;
    categories: Array<{ id: string; name: string; category_score: number | null; weight: number; applicable: number }>;
    snapshot: { repo?: string; scanned_commit?: string; scanned_at?: string };
    status: string;
  };
  const suppressed = report.headline.suppressed === true;
  const meta = sealed.meta as { repo: string; repoSha: string; runId: string; score: number; tier: string; tier_legacy?: string; status: string };
  const renderInput = {
    score: report.headline.score,
    suppressed,
    fingerprint: (sealed.meta as { score_fingerprint?: string }).score_fingerprint,
    tier: report.headline.tier,
    tierLegacy: meta.tier_legacy,
    repo: meta.repo,
    repoSha: meta.repoSha,
    runId: meta.runId,
    scannedAt: String(report.snapshot?.scanned_at ?? ''),
    status: String(report.status ?? ''),
    coverage: report.coverage,
    gates: (report.gates ?? []) as RenderInput['gates'],
    topBlockers: (report.top_blockers ?? []) as RenderInput['topBlockers'],
    nextBandPath: report.next_band_path,
    categories: (report.categories ?? []) as RenderInput['categories'],
  };
  await mkdir(o.outDir, { recursive: true });
  const envelope = { report: sealed.report, meta: sealed.meta, trace: sealed.traceToPersist, contractVersion: CONTRACT_VERSION };
  await writeFile(`${o.outDir}/report.json`, JSON.stringify(envelope, null, 2), 'utf8');
  await writeFile(`${o.outDir}/report.html`, renderHtml(renderInput), 'utf8');
  await writeFile(`${o.outDir}/report.md`, renderMarkdown(renderInput), 'utf8');

  // Baseline comparison (scan-local: baselined run adds a document and a summary
  // line). The delta is derived from the sealed envelope and never alters the
  // three sealed files above; design D5 writes it beside them as report.delta.json.
  let delta: DeltaDocument | undefined;
  let ratchet: RatchetOutcome | undefined;
  if (o.baseline) {
    delta = computeDelta(o.baseline, envelope as ReportEnvelope);
    if (o.ratchet != null) ratchet = ratchetOutcome(delta, o.ratchet);
    await writeFile(`${o.outDir}/report.delta.json`, JSON.stringify(delta, null, 2), 'utf8');
  }

  const threshold = o.failUnder;
  const bandName = o.failUnderBand;
  // Post-seal gate evaluation (band-path D4/D6): the band floor resolves through
  // the contract vocabulary and either gate fails closed on a suppressed
  // headline. The two gates are mutually exclusive, so at most one is set here.
  const { tripped, thresholdState } = gateOutcome(report.headline.score, {
    failUnder: threshold,
    failUnderBand: bandName,
    suppressed,
  });
  // Single stdout line, composed by the one composer: status fields (score/band,
  // gates, coverage, threshold state), the compact next-band path clause when
  // the sealed report carries one, then the band next-step sentence with the
  // tracked assessment URL as the final token, appearing exactly once. A delta
  // summary line follows it without touching that line's composition.
  o.stdout(formatStdout(report, { thresholdState }));
  if (delta) o.stdout(formatDeltaLine(delta, ratchet ? { ratchetState: ratchet.state } : {}));
  if (tripped) {
    if (bandName != null) {
      const bandFloor = bandThresholdFor(bandName);
      o.stderr(suppressed
        ? `threshold trip: headline suppressed (insufficient signal) < --fail-under-band ${bandName} (floor ${bandFloor})`
        : `threshold trip: score ${report.headline.score} < --fail-under-band ${bandName} (floor ${bandFloor})`);
    } else {
      o.stderr(suppressed ? `threshold trip: headline suppressed (insufficient signal) < --fail-under ${threshold}` : `threshold trip: score ${report.headline.score} < --fail-under ${threshold}`);
    }
    return EXIT_THRESHOLD;
  }
  // Ratchet gate semantics (run-diff): trip only on a code-attributable
  // regression beyond tolerance; an incomparable comparison refuses with a
  // usage-or-refused exit naming the cause rather than passing. The threshold
  // gate above keeps an unbaselined-parity exit when it already tripped.
  if (ratchet) {
    if (ratchet.refused) {
      o.stderr(ratchet.message);
      return EXIT_USAGE;
    }
    if (ratchet.tripped) {
      o.stderr(ratchet.message);
      return EXIT_THRESHOLD;
    }
  }
  return EXIT_OK;
}

type RenderInput = {
  gates: Array<{ id: string; name: string; status: string; note: string }>;
  topBlockers: Array<{ row: string; name: string; points_lost: number; weight_pp: string; summary: string; evidence_file?: string; rule?: string }>;
  categories: Array<{ id: string; name: string; category_score: number | null; weight: number; applicable: number }>;
};

const invokedDirectly = (() => {
  try {
    const entry = process.argv[1] ?? '';
    return entry.endsWith('/bin/scan.ts') || entry.endsWith('\\bin\\scan.ts') || entry.endsWith('/bin/scan.js') || entry.endsWith('leapscore-scan');
  } catch {
    return false;
  }
})();

if (invokedDirectly) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (e) => {
      process.stderr.write(`crash: ${(e instanceof Error ? e.message : String(e)).slice(0, 500)}\n`);
      process.exit(1);
    },
  );
}
