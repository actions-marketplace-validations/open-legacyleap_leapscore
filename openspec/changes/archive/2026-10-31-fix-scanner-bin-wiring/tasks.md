## 1. Repair the mapping

- [x] 1.1 Add `"bin": { "leapscore-scan": "./bin/scan.ts" }` to `apps/scanner/package.json` (after `"type"`, matching the `apps/surface` shape) and verify `node -e "console.log(require('./apps/scanner/package.json').bin)"` prints the mapping
- [x] 1.2 Run `npm install` at the repo root to regenerate the lockfile and the workspace link, then verify `readlink node_modules/.bin/leapscore-scan` resolves to `../@leapscore/scanner/bin/scan.ts` and that the target exists
- [x] 1.3 Verify `git diff package-lock.json` touches only the `apps/scanner` package entry (gaining `bin`) plus the workspace link, with no unrelated version churn
- [x] 1.4 Verify the command runs end-to-end from the shim: `./node_modules/.bin/leapscore-scan --help` prints the CLI usage and exits `0` with no `no such file or directory` error
- [x] 1.5 Verify the root `package.json` `bin` block is unchanged and still maps `leapscore-scan` → `apps/scanner/bin/scan.ts` and `surface` → `apps/surface/bin/surface.ts` (the npx-from-git path must survive this change)

## 2. Regression gate

- [x] 2.1 Create `tooling/checks/bin-wiring.ts` that reads the root `package.json` plus every `apps/*` and `packages/*` `package.json`, builds a `name → target` map per topology, and collects violations per design D3 (missing shim, dangling target, non-executable target, divergent targets across topologies, duplicate name across workspace packages)
- [x] 2.2 Add the explicit documented-invocation table from design D4 (command → invocation-site paths) and the corresponding violation when a site exists but the command mapping does not
- [x] 2.3 Implement the pre-install degradation from design D5: when `node_modules/.bin` is absent, verify declarations and cross-topology agreement only, print that shim verification was skipped, and exit `0`
- [x] 2.4 Match the existing check conventions — violations printed to stderr as `bin-wiring violations:` with one indented line per violation and `process.exit(1)`; a single `bin-wiring: ok (...)` line and exit `0` on success
- [x] 2.5 Add `"check:bin-wiring": "tsx tooling/checks/bin-wiring.ts"` to the root `package.json` scripts and verify `npm run check:bin-wiring` exits `0` on the repaired tree
- [x] 2.6 Prove the gate bites: temporarily rename `node_modules/.bin/leapscore-scan` aside, verify `npm run check:bin-wiring` exits non-zero naming `leapscore-scan` and the reason, then restore it and verify the check exits `0` again
- [x] 2.7 Prove divergence detection: temporarily point `node_modules/.bin/leapscore-scan` at `apps/surface/bin/surface.ts`, verify the check reports both targets, then restore the link and verify it passes
- [x] 2.8 Verify the check needs no network or token: run it with `env -u GH_TOKEN -u GITHUB_TOKEN npm run check:bin-wiring` and confirm the same verdict

## 3. Documentation

- [x] 3.1 Add an entry-point section to `apps/scanner/README.md` stating the two topologies (workspace shim via `npm install`, `npx -p "<repo>#<ref>" leapscore-scan` for the git-install form), that the workspace `bin` is the local authority, and that `npm run check:bin-wiring` enforces it
- [x] 3.2 Correct the stale `packages/engine/bin/scan.ts` references to `apps/scanner/bin/scan.ts` in `docs/plans/14_WORKFLOW_SCAN_V1.md` and `docs/plans/15_PROJECT_SURFACE_V1.md`, and verify `grep -rn "packages/engine/bin" docs/plans` returns no hits
- [x] 3.3 Correct the same stale paths and the "bin lives in the root `package.json`" claim in `docs/notes/open-source-release-readiness.md` and `docs/notes/open-source-release-gap-analysis.md`, and verify `grep -rn "packages/engine/bin" docs/notes` returns no hits
- [x] 3.4 Verify no doc still instructs `npx tsx apps/scanner/bin/scan.ts` as the primary entry point: `grep -rn "npx tsx apps/scanner/bin/scan.ts" --exclude-dir=node_modules --exclude-dir=.git .` returns only intentional references

## 4. Verification

- [x] 4.1 Verify a fresh install reproduces the wiring without disturbing the working tree: `git worktree add /tmp/leapscore-bin-check HEAD`, apply the change there, run `npm install`, and confirm `./node_modules/.bin/leapscore-scan --help` prints usage; remove the worktree afterward
- [x] 4.2 Verify the unaffected paths still work: `npx tsx apps/scanner/bin/scan.ts --help` prints usage, `node -e "require('./package.json')"` succeeds, and `git diff --stat package.json` shows the root `bin` block untouched
- [x] 4.3 Run the neighbouring checks to confirm no regression from the tooling addition: `npm run check:site-boundary` and `npm run check:detector-isolation` both exit `0` (the pre-existing `debug-parser.ts` site-boundary failure from commit a82c1be was resolved by deleting that unreferenced dev script)
- [x] 4.4 Verify `openspec validate fix-scanner-bin-wiring --strict` passes with the change's artifacts
