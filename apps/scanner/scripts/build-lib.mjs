#!/usr/bin/env node
// Shared build primitive for every compiled artifact in this repo (release-packaging).
//
// The artifacts are committed and distributed as build output (the scanner bundle, the
// GitHub-Action wrapper), so two properties are contractual, not cosmetic:
//  1. Determinism — the same sources must produce the same bytes from any checkout path,
//     any cwd, and any destination filename. esbuild breaks this on its own: it renders
//     `// <path>` provenance comments relative to its module-load cwd and `__esm("<id>")`
//     keys relative to the outfile's directory, both of which leak the build environment.
//     Fix: build in a child process that chdirs to a FIXED anchor before loading esbuild,
//     always outfile into that anchor (keys are then anchor-relative), and canonicalize
//     any remaining environment-relative rendering against the repo root.
//  2. Node-compatibility lint — esbuild's default `node20` target rewrites modern syntax
//     (e.g. `catch {}` → `catch (_0) {}`) because the engine reports support by its own
//     version. A rewrite aimed at one Node can be illegal on another (`catch (_0)`
//     collides with esbuild's own helper on Node 20). Building at the floor target and
//     linting for the rewrites turns that into a build error instead of a runtime crash.
import { spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

function findUp(start, predicate) {
  let dir = resolve(start);
  for (;;) {
    if (predicate(dir)) return dir;
    const parent = dirname(dir);
    if (parent === dir) throw new Error(`findUp failed from ${start}`);
    dir = parent;
  }
}

// Located by marker, not by relative-path arithmetic: this file has moved and every
// hand-computed `..` chain broke silently. The repo root is the directory holding both
// packages/engine and apps/scanner; the scanner root is apps/scanner.
export const REPO_ROOT = findUp(dirname(fileURLToPath(import.meta.url)), (d) => {
  try {
    return /"name":\s*"leapscore"/.test(readFileSync(join(d, 'package.json'), 'utf8'));
  } catch {
    return false;
  }
});
export const SCANNER_ROOT = join(REPO_ROOT, 'apps', 'scanner');

function findEsbuild(from) {
  let dir = from;
  for (;;) {
    const p = join(dir, 'node_modules', 'esbuild', 'lib', 'main.js');
    try {
      if (readFileSync(p)) return p;
    } catch {
      /* walk up */
    }
    const parent = dirname(dir);
    if (parent === dir) throw new Error('esbuild not found walking up from ' + from);
    dir = parent;
  }
}

/** The single canonical anchor: esbuild's module-load cwd AND its outfile directory for
 *  every artifact in the repo. Being one fixed directory (not "the destination dir") is
 *  what makes the scanner bundle and the Action's copy of it byte-identical. */
export const ANCHOR_DIR = join(SCANNER_ROOT, 'dist', '.anchor');

/** Run esbuild.buildSync in a fresh child node process whose first action is
 *  `process.chdir(anchor)` before requiring esbuild — esbuild captures its comment
 *  anchor (`defaultWD`) at module load, so a fresh process is the only way to pin it. */
function anchoredBuildSync(options, anchor = ANCHOR_DIR) {
  mkdirSync(anchor, { recursive: true });
  const esbuildPath = findEsbuild(SCANNER_ROOT);
  // The child chdirs before esbuild loads, so every path it receives must be absolute.
  const abs = {
    ...options,
    entryPoints: (options.entryPoints ?? []).map((p) => resolve(p)), // absolute before the child chdirs
    outfile: resolve(options.outfile),
  };
  const script =
    `process.chdir(${JSON.stringify(anchor)});\n` +
    `const esbuild = require(${JSON.stringify(esbuildPath)});\n` +
    `esbuild.buildSync(${JSON.stringify(abs)});\n`;
  const res = spawnSync(process.execPath, ['-e', script], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  if (res.status !== 0) {
    const detail = (res.stderr || res.stdout || String(res.status)).trim();
    throw new Error(`esbuild failed (anchored build): ${detail.slice(0, 4000)}`);
  }
  if (res.stdout && res.stdout.trim()) process.stderr.write(res.stdout);
  return { outputFile: { path: abs.outfile, text: readFileSync(abs.outfile, 'utf8') } };
}

/** Rewrite both of esbuild's environment-relative path grammars to repo-root-relative
 *  form: `// <rel|abs>…/node_modules/…` provenance comments, and `__esm("<rel>",` keys. */
export function canonicalizeModulePathsText(text, repoRoot) {
  const root = repoRoot.endsWith(sep) ? repoRoot : repoRoot + sep;
  let out = text;
  // Provenance comments: any repo-internal path (absolute or environment-relative) → repo-relative.
  const commentRe = new RegExp(String.raw`^(// )(?:(?:\.\.[/\\])+[^\t]*|/[^\t]*)(?= \/\)$)`, 'gm');
  out = out.replace(commentRe, (_m, prefix, p) => {
    const abs = p.startsWith('/') ? p : resolve(root, p);
    if (!abs.startsWith(root)) return prefix + p;
    const rel = relative(root, abs).split(sep).join('/');
    return rel.startsWith('..') ? prefix + p : prefix + rel;
  });
  // __esm / __commonJS keys: any relative form rendered against an arbitrary base dir → repo-relative.
  const keyRe = new RegExp(String.raw`(__esm|__commonJS)\(\s*"(?:(?:\.\.)[/\\])+[^"]*"\s*,`, 'g');
  out = out.replace(keyRe, (m, kind) => {
    const start = m.indexOf('"');
    const end = m.indexOf('"', start + 1);
    const key = m.slice(start + 1, end);
    for (const base of [ANCHOR_DIR, SCANNER_ROOT, REPO_ROOT]) {
      const abs = resolve(base, key);
      if (!abs.startsWith(root)) continue;
      const rel = relative(root, abs).split(sep).join('/');
      if (rel.startsWith('..')) continue;
      return `${kind}("${rel}",`;
    }
    return m;
  });
  return out;
}

/** Full pipeline for one artifact: anchored build → canonicalize → verify Node floor.
 *  Builds into ANCHOR_DIR (fixed key base) and publishes the bytes to `options.outfile`.
 *  `shebang` is prepended post-build; `nodeFloor` (default 20) gates the syntax lint. */
export function buildArtifact(options) {
  const { shebang = '', nodeFloor = 20, ...esbuildOptions } = options;
  const anchorOutfile = join(ANCHOR_DIR, basename(options.outfile));
  const result = anchoredBuildSync({ ...esbuildOptions, outfile: anchorOutfile }, ANCHOR_DIR);
  const text = canonicalizeModulePathsText(result.outputFile.text, REPO_ROOT);
  const incompat = lintNodeFloor(text, nodeFloor);
  if (incompat.length) {
    throw new Error(
      `compiled output is not compatible with the Node ${nodeFloor} floor:\n  ` +
        incompat.join('\n  ') +
        '\nFix the source (or the target), not the bundle.',
    );
  }
  // bin/scan.ts carries the tsx dev shebang for source runs; esbuild copies source
  // comments into the artifact. Compiled output always starts with the requested
  // shebang (or none) — the dev shebang must never ride along.
  const stripped = text.replace(/^#![^\n]*\n/, '');
  const body = shebang ? shebang.replace(/\n+$/, '') + '\n' + stripped : stripped;
  const destination = resolve(options.outfile);
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, body);
  // A shebang'd artifact is an executable: the npm bin shim and `check:bin-wiring`
  // require the bit, and git records it for the committed Action copy.
  if (shebang) chmodSync(destination, 0o755);
  return { bytes: Buffer.byteLength(body) };
}

/** esbuild's target rewrites that are illegal (or wrong) on the declared floor. */
function lintNodeFloor(text, floor) {
  const problems = [];
  if (floor <= 20 && /catch \(_\d+\)/.test(text)) {
    problems.push(
      '`catch {}` was rewritten to `catch (_N)`, which collides with esbuild\'s own `__toESM` helper on Node <22.8 ' +
        'and makes the bundle throw at load. Keep an optional-catch in the source and build at the floor target.',
    );
  }
  return problems;
}
