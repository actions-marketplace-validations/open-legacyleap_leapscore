/** tooling/checks/bin-wiring.ts — every declared command resolves in both topologies (cli-packaging spec) */
// A command name is declared in two topologies: the root package.json `bin` (the
// `npx -p "<repo>#<ref>" <command>` git-install form the release workflow uses) and the
// workspace package's own `bin` (what `npm install` links into node_modules/.bin). This
// check builds a name → target map per topology from the package.json files, verifies each
// workspace-declared command has a node_modules/.bin shim that realpath-resolves to the
// declared target and is executable, fails on cross-topology divergence, on two workspace
// packages claiming one name with different targets, and on a documented invocation site
// whose command mapping was dropped (design D4's explicit table — not a repo-wide grep).
// Degrades to declaration-only when node_modules/.bin is absent (design D5).
import { accessSync, constants, existsSync, lstatSync, readdirSync, readFileSync, readlinkSync, realpathSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = join(import.meta.dirname ?? '.', '../..');

type Topology = { name: string; file: string; dir: string; bin: Record<string, string> };

function readPkg(rel: string): Topology | null {
  const file = join(ROOT, rel, 'package.json');
  if (!existsSync(file)) return null;
  const pkg = JSON.parse(readFileSync(file, 'utf-8'));
  let bin: Record<string, string> = {};
  if (typeof pkg.bin === 'string') bin = { [pkg.name]: pkg.bin };
  else if (pkg.bin && typeof pkg.bin === 'object') bin = pkg.bin;
  return { name: pkg.name ?? rel, file: join(rel, 'package.json'), dir: rel, bin };
}

// Topology 1: the repo package itself (git-install form). Topology 2: workspace packages.
const rootPkg = readPkg('.')!;
const workspaces: Topology[] = [];
for (const group of ['apps', 'packages']) {
  const groupDir = join(ROOT, group);
  if (!existsSync(groupDir)) continue;
  for (const entry of readdirSync(groupDir, { withFileTypes: true })) {
    if (!entry.isDirectory() && !entry.isSymbolicLink()) continue;
    const ws = readPkg(join(group, entry.name));
    if (ws && Object.keys(ws.bin).length) workspaces.push(ws);
  }
}

const violations: string[] = [];
const rootTargets = new Map<string, { target: string; file: string }>();
for (const [name, target] of Object.entries(rootPkg.bin)) {
  rootTargets.set(name, { target: resolve(ROOT, target), file: rootPkg.file });
}

// Workspace map + duplicate-name detection across workspace packages.
const wsTargets = new Map<string, { target: string; pkg: string }>();
for (const ws of workspaces) {
  for (const [name, target] of Object.entries(ws.bin)) {
    const abs = resolve(ROOT, ws.dir, target);
    const seen = wsTargets.get(name);
    if (seen && seen.pkg !== ws.file && !samePath(seen.target, abs)) {
      violations.push(`${name}: claimed by two workspace packages with different targets — ${seen.pkg} → ${seen.target} vs ${ws.file} → ${abs}`);
    }
    wsTargets.set(name, { target: abs, pkg: ws.file });
  }
}

// Cross-topology agreement: a name declared in both must resolve to the same file.
for (const [name, ws] of wsTargets) {
  const root = rootTargets.get(name);
  if (root && !samePath(root.target, ws.target)) {
    violations.push(`${name}: targets diverge across topologies — ${root.file} → ${root.target} vs ${ws.pkg} → ${ws.target}`);
  }
}
// A root-only command cannot produce a workspace shim; npm install must link every
// documented command, so every command must be declared by a workspace package too.
for (const [name, root] of rootTargets) {
  if (!wsTargets.has(name)) {
    violations.push(`${name}: declared in ${root.file} but no workspace package declares it — npm install cannot produce node_modules/.bin/${name}`);
  }
}

// D4 — documented invocation sites: file exists and shows the command as an invocation →
// a mapping must exist. The table is deliberately explicit (not a repo-wide grep): a
// dropped mapping must fail exactly where docs/Actions/workflows still invoke the command.
// Canonical/current sites come first; retained `docs/plans/` paths are compatibility stubs
// (see docs/plans/README.md) kept because established links and checks still resolve them.
const INVOCATION_SITES: Record<string, string[]> = {
  'leapscore-scan': ['apps/scanner/README.md', 'action/README.md', 'docs/plans/14_WORKFLOW_SCAN_V1.md'],
  surface: ['apps/surface/README.md', '.github/workflows/leapscore-scan.yml', 'docs/plans/15_PROJECT_SURFACE_V1.md'],
};
// Every mapped command must also appear as an invocation at one of its listed sites —
// otherwise the dropped-mapping check below guards nothing.
for (const [command, sites] of Object.entries(INVOCATION_SITES)) {
  if (!rootTargets.has(command) && !wsTargets.has(command)) continue;
  if (!sites.some((site) => {
    const file = join(ROOT, site);
    return existsSync(file) && invocationMatches(command, site, readFileSync(file, 'utf-8'));
  })) {
    violations.push(`${command}: mapped but no listed invocation site (${sites.join(', ')}) shows it as a command — the D4 table is stale`);
  }
}
// A site "invokes" a command when it shows it as a command line: a line that runs the
// command (`^\s*command\b`) or an `npx … <command>` form (the git-install form carries
// `<repo>#<sha>` on the same line, so the pattern must not stop at `#`). In Markdown a
// command line must sit inside a fenced code block; prose that merely names the command
// does not count.
function invocationMatches(command: string, file: string, text: string): boolean {
  const escaped = command.replace(/-/g, '\\-');
  const patterns = [
    new RegExp('^\\s*' + escaped + '\\b', 'm'),
    new RegExp('npx\\b[^\\n]*\\b' + escaped + '\\b'),
  ];
  const regions = file.endsWith('.md')
    ? text.split(/```[^\n]*\n/).filter((_, i) => i % 2 === 1) // fenced blocks only
    : [text];
  return regions.some((region) => patterns.some((re) => re.test(region)));
}
for (const [command, sites] of Object.entries(INVOCATION_SITES)) {
  if (rootTargets.has(command) || wsTargets.has(command)) continue;
  for (const site of sites) {
    const file = join(ROOT, site);
    if (existsSync(file) && invocationMatches(command, site, readFileSync(file, 'utf-8'))) {
      violations.push(`${command}: mapping dropped but ${site} still invokes it`);
      break;
    }
  }
}

// Shim targets are workspace-relative links (../@leapscore/<pkg>/…), so realpath lands
// under node_modules/@leapscore/<pkg>. Compare canonical paths, normalizing macOS /var
// and Windows 8.3 spellings out of the picture.
function samePath(a: string, b: string): boolean {
  const normalize = (p: string) => {
    try {
      p = realpathSync.native(p);
    } catch {
      /* keep as-is */
    }
    p = resolve(p);
    return process.platform === 'win32' ? p.toLowerCase() : p;
  };
  return normalize(a) === normalize(b);
}

// Shebang rule: a target whose shebang names a just-in-time interpreter extension (tsx,
// ts-node, …) cannot run on a machine with only the declared runtime — "a target that
// cannot run is reported" (cli-packaging). The check is deliberately scoped to compiled
// commands: a package that declares `engines` (the compiled-command convention — the
// scanner package is the one that ships the built artifact). JIT-form commands that the
// workspace install runs via its own tsx devDependency (surface) are outside this rule.
const JIT_INTERP = /(^|\/)(tsx|ts-node|ts-node-esm|swc-node|babel-node)$/;
function shebangInterpreter(file: string): string | null {
  try {
    const first = readFileSync(file, 'utf-8').split('\n', 1)[0] ?? '';
    const shebang = /^#!(.*)$/.exec(first)?.[1];
    if (shebang == null) return null;
    return shebang.trim().split(/\s+/).pop() ?? '';
  } catch {
    return null;
  }
}
const compiledCommands = new Set<string>();
for (const ws of workspaces) {
  try {
    const pkg = JSON.parse(readFileSync(join(ROOT, ws.dir, 'package.json'), 'utf-8'));
    if (pkg.engines) for (const name of Object.keys(ws.bin)) compiledCommands.add(name);
  } catch {
    /* unreadable package.json: other rules report it */
  }
}

// Compiled-target agreement (cli-packaging MODIFIED, release-packaging D6): both
// topologies of a compiled command must map to the same built artifact — never a source
// file that depends on a just-in-time toolchain.
for (const [name, t] of wsTargets) {
  if (compiledCommands.has(name)) {
    const interp = shebangInterpreter(t.target);
    if (interp != null && JIT_INTERP.test(interp)) {
      violations.push(`${name}: ${t.pkg} maps a compiled command to a JIT-toolchain source ${relativeToRoot(t.target)} — the mapping must point at the built artifact (npm run build:cli)`);
    }
  }
}
for (const [name, t] of rootTargets) {
  if (compiledCommands.has(name)) {
    const interp = shebangInterpreter(t.target);
    if (interp != null && JIT_INTERP.test(interp)) {
      violations.push(`${name}: ${t.file} maps a compiled command to a JIT-toolchain source ${relativeToRoot(t.target)} — both topologies must map to the built artifact`);
    }
  }
}
function relativeToRoot(abs: string): string {
  const rel = abs.slice(ROOT.length + 1);
  return rel && !rel.startsWith('..') ? rel : abs;
}

// A symlink under .bin is a declaration even when its target is dead: existsSync follows
// links and reports false for a dangling one, so check the link itself first.
function shimExists(shim: string): boolean {
  try {
    lstatSync(shim);
    return true;
  } catch {
    return false;
  }
}

// Shims: node_modules/.bin must carry a resolving, executable link per declared command.
const BIN_DIR = join(ROOT, 'node_modules', '.bin');
let shimsChecked = 0;
const declared = new Map([...rootTargets].map(([n, v]) => [n, v.target] as const));
for (const [n, v] of wsTargets) declared.set(n, v.target);

if (existsSync(BIN_DIR)) {
  for (const [name, target] of declared) {
    const shim = join(BIN_DIR, name);
    if (!shimExists(shim)) {
      violations.push(`${name}: no shim in node_modules/.bin — declared target ${target} is not reachable as a command (run npm install)`);
      continue;
    }
    let real: string;
    try {
      real = realpathSync(shim);
    } catch {
      violations.push(`${name}: shim node_modules/.bin/${name} is dangling — dead target ${readlinkDangling(shim)}`);
      continue;
    }
    if (!samePath(real, target)) {
      violations.push(`${name}: shim resolves to ${relativeToRoot(real)}, not the declared target ${relativeToRoot(target)}`);
    }
    try {
      accessSync(real, constants.X_OK);
    } catch {
      violations.push(`${name}: target ${real} lacks the executable bit`);
    }
    // "A target that cannot run is reported": a compiled command's shim target must run
    // on a machine with only the declared runtime — a shebang naming a just-in-time
    // interpreter extension is a broken target. (JIT-form commands outside the compiled
    // convention run through the workspace's own devDependency and are exempt.)
    if (compiledCommands.has(name)) {
      const interp = shebangInterpreter(real);
      if (interp != null && JIT_INTERP.test(interp)) {
        violations.push(`${name}: target ${relativeToRoot(real)} cannot run on the declared runtime alone — its shebang requires ${interp} (a just-in-time toolchain); report the command, do not fall back`);
      }
    }
    shimsChecked++;
  }
}

function readlinkDangling(shim: string): string {
  try {
    return readlinkSync(shim);
  } catch {
    return '(unreadable)';
  }
}

if (violations.length) {
  console.error('bin-wiring violations:\n' + violations.map((v) => `  - ${v}`).join('\n'));
  process.exit(1);
}
const skipped = existsSync(BIN_DIR) ? '' : ' (node_modules/.bin absent: shim verification skipped, declarations only)';
console.log(`bin-wiring: ok (${declared.size} command${declared.size === 1 ? '' : 's'} declared${shimsChecked ? `, ${shimsChecked} shims verified` : ''})${skipped}`);
