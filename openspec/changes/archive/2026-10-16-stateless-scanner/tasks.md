## 1. Scanner persistence removal

- [x] 1.1 Delete `apps/scanner/src/store.ts` and remove store + `GET /reports/:runId` paths from `apps/scanner/src/server.ts`, verified by `grep -rn "getStoreDir\|writeEnvelope\|readEnvelope\|SCANNER_STORE_DIR" apps/scanner/src returning no non-test matches
- [x] 1.2 Remove disconnect run-to-seal logic (`req.on("close")` no-op) so clientless scans discard, verified by scanner unit tests passing and a disconnect leaving no file on disk
- [x] 1.3 Delete `tooling/scripts/sync-reports.ts` and the `sync:reports` root script, verified by `grep -rn "sync-reports\|sync:reports" --include="*.ts" --include="*.json" apps tooling package.json` returning nothing

## 2. Engine relocation into scanner

- [x] 2.1 Move orchestrator, seal, detectors, scorer, and support modules from `packages/engine` to `apps/scanner/src/scan|detectors|scoring/` per design.md layout with relative imports, verified by `ls apps/scanner/src/scan apps/scanner/src/scan/detectors apps/scanner/src/scan/scoring` showing the moved files and `tsc --noEmit` passing in `apps/scanner`
- [x] 2.2 Delete the emptied `packages/engine` directory and its workspace references, verified by `ls packages/` no longer containing `engine` and root `npm run build --workspaces` succeeding
- [x] 2.3 Confirm `packages/contracts` is the only shared import for site and surface, verified by `grep -rn "@leapscore/engine\|packages/engine" --include="*.ts" apps packages tooling` returning no non-test matches outside the moved CLI

## 3. Workflow CLI move

- [x] 3.1 Move `packages/engine/bin/scan.ts` to `apps/scanner/bin/scan.ts` with identical flags and envelope file output, verified by `leapscore-scan --help` printing the unchanged usage text
- [x] 3.2 Re-point root `bin.leapscore-scan` to the new CLI path, verified by `node -e "console.log(require('./package.json').bin)"` showing the `apps/scanner` path and a `--repo <owner/repo> --out <path>` dry run sealing a valid envelope file

## 4. Boundary checks rewrite

- [x] 4.1 Rewrite `tooling/checks/site-boundary.ts` to forbid reaching `apps/scanner` instead of `packages/engine`, verified by `npm run check:site-boundary` passing on the relocated tree
- [x] 4.2 Rewrite `tooling/checks/surface-boundary.ts` so the engine-side walk becomes an `apps/scanner` walk and surface may only share `@leapscore/contracts`, verified by `npm run check:surface-boundary` passing

## 5. Site history re-scope

- [x] 5.1 Delete `apps/site/reports/` build-input flow and the `lib/reports.ts` directory reader (keeping contract re-exports only as needed), verified by site `tsc --noEmit` passing and no route importing the deleted reader
- [x] 5.2 Convert the committed sample envelope into a static fixture (or empty-state fallback) and re-point `/report/sample` + `/reports` to site-owned history, verified by `next build` succeeding with the scanner unreachable and `/reports` rendering without contacting it
- [x] 5.3 Remove `buildMeta` as a second meta-constructor so scanner `meta` is the only one, verified by `grep -rn "buildMeta" apps/site` returning test-only or no matches

## 6. End-to-end verification

- [x] 6.1 Run full gate suite (`check:rubric-consistency`, `check:detector-isolation`, `check:site-boundary`, `check:surface-boundary`, all workspace tests), verified by every command exiting 0
- [x] 6.2 Perform a live scan against the stateless scanner and confirm the terminal `report` frame renders the full report, a restart retrieves nothing, and refused targets emit only `refused`, verified by manual live-scan pass plus `GET /reports/:runId` returning 404 (route deleted)
