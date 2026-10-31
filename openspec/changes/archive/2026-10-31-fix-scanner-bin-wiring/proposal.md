## Why

The `leapscore-scan` command is dead in this repo. `node_modules/.bin/leapscore-scan` is a dangling symlink to `../@leapscore/engine/bin/scan.ts` — a package path that stopped existing when the engine was renamed to `@leapscore/scanner` (`apps/scanner`). `@leapscore/surface` declares `"bin": { "surface": "./bin/surface.ts" }` in its own `package.json` and its shim resolves correctly; `apps/scanner/package.json` declares no `bin` at all, so npm never rewrote the stale link.

Observed:

```
$ ./node_modules/.bin/leapscore-scan --help
zsh: no such file or directory: ./node_modules/.bin/leapscore-scan
$ readlink node_modules/.bin/leapscore-scan
../@leapscore/engine/bin/scan.ts     # target MISSING
$ ls -l node_modules/.bin/surface
node_modules/.bin/surface -> ../@leapscore/surface/bin/surface.ts   # resolves
```

The mapping exists only in the **root** `package.json` `bin` block. That block is not dead code — it is the only mechanism behind `npx -p "github:leapscore/leapscore#<sha>" surface`, which `.github/workflows/leapscore-scan.yml` runs today and `docs/plans/14_WORKFLOW_SCAN_V1.md` documents for `leapscore-scan`. What it cannot do is link a workspace's own `node_modules/.bin` shim. So the two topologies need two mappings, and only the workspace one is missing — which is why every ad-hoc invocation in this checkout has silently fallen back to `npx tsx apps/scanner/bin/scan.ts`.

Everything downstream of the command name inherits the breakage: `apps/scanner/README.md` opens with `leapscore-scan scan ./claims-core --out ./out`, the CLI's own `USAGE` string starts with `leapscore-scan`, `action/README.md` describes a `leapscore-scan scan <path>` wrapper, and the release-readiness notes cite the bin as living in the root `package.json` while naming `packages/engine/bin/scan.ts` as the live path.

## What Changes

- Declare the command where npm reads it for a workspace install: `"bin": { "leapscore-scan": "./bin/scan.ts" }` in `apps/scanner/package.json`, mirroring `apps/surface`. The root `package.json` `bin` block stays — it is the npx-from-git path — and both entries keep the same target.
- Refresh `package-lock.json` and the workspace link so `node_modules/.bin/leapscore-scan` resolves after a clean `npm install`, and confirm the shim's target is `apps/scanner/bin/scan.ts`.
- Add a repo check (`tooling/checks/bin-wiring.ts`, exposed as `npm run check:bin-wiring`) that fails when: a workspace-declared `bin` has no `node_modules/.bin` shim, a shim points at a missing or non-executable target, a root `bin` entry disagrees with the workspace entry of the same name, or a shim's name is claimed by two different targets.
- Correct the stale `packages/engine/bin/scan.ts` paths in `docs/plans/14_WORKFLOW_SCAN_V1.md`, `docs/plans/15_PROJECT_SURFACE_V1.md`, and `docs/notes/open-source-release-*.md` to the live `apps/scanner/bin/scan.ts`, and state the two-topology wiring rule in `apps/scanner/README.md` so the next rename does not re-break it.

Non-goals (explicitly out of scope):

- No `leapscore` alias or rename. The `leapscore scan <path>` phrasing in `openspec/specs/scan-local/spec.md` and `openspec/specs/workflow-scan/spec.md` stays as-is; that naming gap is tracked in `docs/notes/open-source-release-readiness.md` (item 6) and gets its own change.
- No change to CLI flags, exit codes, scan behavior, scoring, the scanner service, or the `npx -p github:` invocation form.

## Capabilities

### New Capabilities

- `cli-packaging`: how a LeapScore command becomes an executable entry point — which `package.json` owns the `bin` mapping in each install topology (workspace link vs `npx -p github:`), what a fresh install must produce, and the check that keeps both honest.

### Modified Capabilities

None. `workflow-scan` and `scan-local` describe the CLI's flags, exits, and artifacts; neither states where the `bin` mapping lives or how the command resolves, so no requirement in them changes.

## Impact

- `apps/scanner/package.json` — new `bin` block (the actual fix).
- `package-lock.json` — `apps/scanner` package entry gains `bin`; workspace links refresh.
- `tooling/checks/bin-wiring.ts` (new) + root `scripts` entry `check:bin-wiring`.
- Docs: `apps/scanner/README.md` (entry-point section), `docs/plans/14_WORKFLOW_SCAN_V1.md`, `docs/plans/15_PROJECT_SURFACE_V1.md`, `docs/notes/open-source-release-readiness.md`, `docs/notes/open-source-release-gap-analysis.md` — stale `packages/engine/bin/scan.ts` references.
- No runtime behavior, API, contract, scoring, or site change. The root `bin` block is preserved, so the live `npx -p "github:…#<sha>" surface` workflow step and the Action (`action/src/main.ts`, which shells out via `npx -y tsx@4`) keep working unchanged.
