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
  strict: boolean;
  outDir: string;
  engineRef?: string;
};

export function readInputs(getInput: (name: string) => string = core.getInput): ActionInputs {
  return {
    path: getInput('path') || '.',
    failUnder: getInput('fail_under') || undefined,
    strict: (getInput('strict') || 'false').toLowerCase() === 'true',
    outDir: getInput('out_dir') || 'leapscore-report',
    engineRef: getInput('engine_ref') || undefined,
  };
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
  if (inputs.engineRef) args.push('--engine-ref', inputs.engineRef);
  return { cmd: 'npx', args: ['-y', 'tsx@4', ...args] };
}

export function reportJsonPath(outDir: string): string {
  return join(outDir, 'report.json');
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

/** Map the scanner exit code to Action messaging. Threshold trips and refusals fail the step; crashes fail louder. */
export function handleExitCode(
  code: number,
  inputs: ActionInputs,
  deps: {
    setFailed: (msg: string) => void;
    setOutput: (name: string, value: string) => void;
    stdoutLine?: string;
  } = { setFailed: core.setFailed, setOutput: core.setOutput },
): void {
  const { score, tier } = readScore(inputs.outDir);
  deps.setOutput('exit-code', String(code));
  if (score != null) deps.setOutput('score', String(score));
  if (tier != null) deps.setOutput('tier', String(tier));
  if (code === EXIT_OK) return;
  if (code === EXIT_THRESHOLD) {
    deps.setFailed(`LeapScore threshold trip: score ${score ?? '?'} < fail_under ${inputs.failUnder} (tier ${tier ?? '?'})${deps.stdoutLine ? ` — ${deps.stdoutLine}` : ''}`);
    return;
  }
  if (code === EXIT_USAGE) {
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
  handleExitCode(code, inputs, { setFailed, setOutput });
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
