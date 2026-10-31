/** action/src/main.ts — checkout-first thin wrapper around `scan <path>` (spec: workflow-scan) */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as core from '@actions/core';
import * as exec from '@actions/exec';

export const EXIT_OK = 0;
export const EXIT_CRASH = 1;
export const EXIT_USAGE = 2;
export const EXIT_THRESHOLD = 3;

export type ActionInputs = {
  path: string;
  failUnder?: string;
  /** Public band name (critical|high|moderate|low); mutex with failUnder. */
  failUnderBand?: string;
  strict: boolean;
  outDir: string;
  engineRef?: string;
  /** Path to a previously sealed report.json to compare against; unset = no delta. */
  baseline?: string;
  /** Ratchet gate request: 'true' (tolerance 0), a tolerance number, or unset/'false'. */
  ratchet?: string;
  /** Output path for the score badge SVG; unset = no badge written. */
  badge?: string;
};

export function readInputs(getInput: (name: string) => string = core.getInput): ActionInputs {
  return {
    path: getInput('path') || '.',
    failUnder: getInput('fail_under') || undefined,
    failUnderBand: getInput('fail_under_band') || undefined,
    strict: (getInput('strict') || 'false').toLowerCase() === 'true',
    outDir: getInput('out_dir') || 'leapscore-report',
    engineRef: getInput('engine_ref') || undefined,
    baseline: getInput('baseline') || undefined,
    ratchet: getInput('ratchet') || undefined,
    badge: getInput('badge') || undefined,
  };
}

/** Ratchet input → CLI flag text. '' and 'false' mean no gate; 'true' is a bare
 *  `--ratchet` (tolerance 0); a number is the `--ratchet=<n>` tolerance form. */
export function ratchetFlag(raw: string | undefined): string | undefined {
  if (raw == null) return undefined;
  const v = raw.trim();
  if (v === '' || v.toLowerCase() === 'false') return undefined;
  if (v.toLowerCase() === 'true') return '--ratchet';
  return `--ratchet=${v}`;
}

/** The requested ratchet tolerance in points; undefined when no gate is set. */
export function ratchetTolerance(raw: string | undefined): number | undefined {
  const flag = ratchetFlag(raw);
  if (flag == null) return undefined;
  return flag === '--ratchet' ? 0 : Number(flag.slice('--ratchet='.length));
}

/** Repo root relative to this file (action/ is a sibling of apps/). */
export function repoRootFor(filePath: string = fileURLToPath(import.meta.url)): string {
  // src/main.ts -> action/src -> action -> repo root
  return resolve(dirname(filePath), '..', '..');
}

/** Build the `scan <path>` argv. `--strict` + `--repo` can never occur: this wrapper never passes `--repo`. */
export function buildScanArgs(inputs: ActionInputs, scanBin: string): { cmd: string; args: string[] } {
  const args = [scanBin, 'scan', inputs.path, '--out', inputs.outDir];
  if (inputs.strict) args.push('--strict');
  if (inputs.failUnder) args.push('--fail-under', inputs.failUnder);
  if (inputs.failUnderBand) args.push('--fail-under-band', inputs.failUnderBand);
  if (inputs.engineRef) args.push('--engine-ref', inputs.engineRef);
  if (inputs.baseline) args.push('--baseline', inputs.baseline);
  const ratchet = ratchetFlag(inputs.ratchet);
  if (ratchet) args.push(ratchet);
  if (inputs.badge) args.push('--badge', inputs.badge);
  return { cmd: 'npx', args: ['-y', 'tsx@4', ...args] };
}

export function reportJsonPath(outDir: string): string {
  return join(outDir, 'report.json');
}

/** The derived comparison artifact, summarized for Action messaging. */
export type DeltaSummary = {
  status?: string;
  cause?: string;
  codeAttributable?: number;
  movement?: number;
};

export function readDelta(outDir: string): DeltaSummary | undefined {
  try {
    const p = join(outDir, 'report.delta.json');
    if (!existsSync(p)) return undefined;
    const doc = JSON.parse(readFileSync(p, 'utf8'));
    return {
      status: doc?.verdict?.status,
      cause: doc?.verdict?.cause,
      codeAttributable: doc?.headline?.code_attributable,
      movement: doc?.headline?.movement,
    };
  } catch {
    return undefined;
  }
}

export function readScore(outDir: string): { score?: number; tier?: string } {
  try {
    const p = reportJsonPath(outDir);
    if (!existsSync(p)) return {};
    const env = JSON.parse(readFileSync(p, 'utf8'));
    return { score: env?.meta?.score ?? env?.report?.headline?.score, tier: env?.meta?.tier ?? env?.report?.headline?.tier };
  } catch {
    return {};
  }
}

/** Map the scanner exit code to Action messaging. Threshold trips and refusals fail the step; crashes fail louder.
 *  With a ratchet gate set, exit 3 is read from the delta as a ratchet trip (or
 *  falls back to the threshold message) and exit 2 names the blocking cause so
 *  the job summary says why the comparison was refused. */
export function handleExitCode(
  code: number,
  inputs: ActionInputs,
  deps: {
    setFailed: (msg: string) => void;
    setOutput: (name: string, value: string) => void;
    stdoutLine?: string;
    summary?: (md: string) => void;
  } = { setFailed: core.setFailed, setOutput: core.setOutput },
): void {
  const { score, tier } = readScore(inputs.outDir);
  deps.setOutput('exit-code', String(code));
  if (score != null) deps.setOutput('score', String(score));
  if (tier != null) deps.setOutput('tier', String(tier));
  if (inputs.badge) deps.setOutput('badge-path', inputs.badge);
  if (code === EXIT_OK) return;
  const delta = inputs.baseline != null || inputs.ratchet != null ? readDelta(inputs.outDir) : undefined;
  if (code === EXIT_THRESHOLD) {
    const tolerance = ratchetTolerance(inputs.ratchet);
    if (
      tolerance != null &&
      delta != null &&
      delta.status !== 'incomparable' &&
      typeof delta.codeAttributable === 'number' &&
      delta.codeAttributable < -tolerance
    ) {
      deps.setFailed(`LeapScore ratchet trip: code-attributable movement ${delta.codeAttributable}pp is beyond the ${tolerance}pp tolerance${deps.stdoutLine ? ` — ${deps.stdoutLine}` : ''}`);
      deps.summary?.(`## LeapScore ratchet trip\nCode-attributable movement **${delta.codeAttributable}pp** is beyond the **${tolerance}pp** tolerance. The step fails; the report artifacts are kept.\n`);
      return;
    }
    const gate = inputs.failUnderBand != null ? `fail_under_band ${inputs.failUnderBand}` : `fail_under ${inputs.failUnder}`;
    deps.setFailed(`LeapScore threshold trip: score ${score ?? '?'} < ${gate} (tier ${tier ?? '?'})${deps.stdoutLine ? ` — ${deps.stdoutLine}` : ''}`);
    return;
  }
  if (code === EXIT_USAGE) {
    if (inputs.ratchet != null && delta?.cause) {
      deps.setFailed(`LeapScore ratchet refused (exit 2): the comparison is incomparable (${delta.cause}) — the gate cannot evaluate, so it refuses instead of reporting a result`);
      deps.summary?.(`## LeapScore delta refused\nComparison is incomparable: **${delta.cause}**. No result was evaluated; the report artifacts are kept.\n`);
      return;
    }
    deps.setFailed(`LeapScore refused/usage error (exit 2)${deps.stdoutLine ? ` — ${deps.stdoutLine}` : ''} — fix the workflow invocation (bad path, --strict conflict, or unsupported input)`);
    return;
  }
  deps.setFailed(`LeapScore crashed (exit ${code}) — retry or inspect scanner logs`);
}

export async function run(
  deps: {
    getInput?: (name: string) => string;
    setFailed?: (msg: string) => void;
    setOutput?: (name: string, value: string) => void;
    execImpl?: (cmd: string, args: string[]) => Promise<number>;
    summary?: (md: string) => void;
  } = {},
): Promise<void> {
  const inputs = readInputs(deps.getInput);
  const setFailed = deps.setFailed ?? core.setFailed;
  const setOutput = deps.setOutput ?? core.setOutput;
  const root = repoRootFor();
  const scanBin = join(root, 'apps', 'scanner', 'bin', 'scan.ts');
  const { cmd, args } = buildScanArgs(inputs, scanBin);
  core.info(`LeapScore: ${cmd} ${args.join(' ')}`);
  let code: number;
  try {
    code = deps.execImpl
      ? await deps.execImpl(cmd, args)
      : await exec.exec(cmd, args, { ignoreReturnCode: true });
  } catch (e) {
    setFailed(`LeapScore failed to launch scanner: ${e instanceof Error ? e.message : String(e)}`);
    return;
  }
  handleExitCode(code, inputs, {
    setFailed,
    setOutput,
    // Ratchet refusals and trips carry a job-summary explanation of why no pass
    // was reported (workflow-scan: incomparable refuses in the job summary).
    summary: deps.summary ?? ((md) => {
      void core.summary.addRaw(md).write();
    }),
  });
}

const invokedDirectly = (() => {
  try {
    const entry = process.argv[1] ?? '';
    return entry.endsWith('main.js') || entry.endsWith('main.ts') || entry.endsWith('index.js');
  } catch {
    return false;
  }
})();

if (invokedDirectly) {
  run().catch((e) => core.setFailed(`LeapScore action error: ${e instanceof Error ? e.message : String(e)}`));
}
