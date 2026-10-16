## 1. Scaffold apps/surface

- [x] 1.1 Create `apps/surface/package.json`, `tsconfig.json`, `README.md` (CLI usage, warn-only + exit-code contract) and verify `npm ls` resolves the workspace.
- [x] 1.2 Add `apps/surface/src/index.ts` barrel exporting `runSurface`, surface types, and `formatSummaryLine`, and verify `tsx --eval` import resolves.

## 2. Move surface modules

- [x] 2.1 Git-move the 11 `packages/engine/surface/*.ts` files to `apps/surface/src/` preserving history, and verify no file remains under `packages/engine/surface/`.
- [x] 2.2 Codemod internal imports to the new barrel and verify `tsc --noEmit` passes in `apps/surface`.
- [x] 2.3 Add `apps/surface/bin/surface.ts` (`--from <envelope.json> --repo <owner/repo> [--repo-a] [--run-url]`) reusing `runSurfacePhase` semantics, and verify dry-run on a fixture envelope prints the summary line and exits 0.

## 3. Rewire callers

- [x] 3.1 Deprecate `packages/engine/bin/scan.ts --surface/--surface-from` to forward to the new binary with a warning, and verify existing `--surface-from` fixture test still passes via the forwarder.
- [x] 3.2 Point `action/` at the `apps/surface` build output, rebuild `action/dist/`, and verify the workflow smoke test seals then surfaces with zero behavior diff.
- [x] 3.3 Delete the engine-side shim and forwarder, and verify `grep -r "engine/surface" packages action apps` returns nothing.

## 4. Boundary + verification

- [x] 4.1 Add `tooling/checks/surface-boundary.ts` (engine must not reach `apps/surface`; site must not reach `apps/surface`; surface must not reach engine detectors/clone/budget) plus `check:surface-boundary` script, and verify it fails on a deliberate violation fixture and passes clean.
- [x] 4.2 Run full gates (`tsc --noEmit`, `vitest run`, boundary checks) across engine/surface/site workspaces and verify all green.
