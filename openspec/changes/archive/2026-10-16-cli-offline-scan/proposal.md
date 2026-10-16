## Why

The LeapScore open-source release brief (Oct 15) requires a one-command local assessment (`leapscore scan <path>`) that leads to the $0 Assessment. The scanner today only scans remote `owner/repo` via GH-API + internal clone, so regulated teams who will not upload code cannot use it.

## What Changes

- Add `leapscore scan <path>` as the default entry: scans a local directory with the 25 clone-local detectors, no clone step, `readFile` bound to the real path.
- Keep `scan --repo <owner/repo>` remote path unchanged: 6 GH detectors + shallow clone + same seal. No GH detectors are removed. Local mode never auto-runs GH detectors.
- Add `--strict` flag: zero-socket mode (vendored EOL/vuln snapshots only, any network attempt aborts). Without `--strict`, local scans may make allowlisted open-internet GETs (registries, EOL tables, vuln DB); code, paths, and repo names never leave the machine.
- `--strict` + `--repo` together is a usage error (exit 2).
- Change `--out` to a directory: writes `report.json` + `report.html` + `report.md` (all three, every run). Stdout prints one line: score/band + top risks + tracked assessment URL.
- Rename display tiers to Low / Moderate / High / Critical (was Healthy / Moderate / High Risk / Critical); JSON carries `tier_legacy` alias for one release. **BREAKING** for exact-tier string consumers.
- Add `--fail-under <0-100>` threshold gate with exit `3` on policy trip. Exit contract: `0` pass, `1` crash, `2` usage/refused, `3` threshold-tripped.
- Versioning stays `Date.now() + target commit`: `runId = slug(engineSha7, normalizeTs(scanned_at))`, `scanned_commit` from `git -C <path> rev-parse HEAD` or `unknown` for working trees.
- Rewire `action/` to checkout-then-scan-local (thin wrapper around `scan <path>` with `path`, `fail_under`, `strict`, `out_dir` inputs) instead of the internal-clone `npx tsx` flow.

## Capabilities

### New Capabilities

- `scan-local`: local-path scan entry, strict/offline contract, out-dir with three report files, exit-code + threshold contract.

### Modified Capabilities

- `workflow-scan`: thin CLI contract gains `<path>` positional, `--strict`, `--fail-under`, `--out <dir>` directory semantics, exit `3`.
- `scan-phase-2`: clone step skipped for local paths; `ScanContext.gh` becomes optional; detectors run sorted for determinism.
- `report-envelope`: envelope versioning via `Date.now + target commit` for local subjects; tier rename with legacy alias.
- `report-rendering`: HTML + Markdown emitters ship with the CLI (self-contained, no CDN), band-first layout with top-5 risks and band-specific assessment CTA.

## Impact

- `apps/scanner/bin/scan.ts`, `apps/scanner/src/scan/` (new local orchestrator path reusing phase-2 detectors + `sealScan`), `packages/contracts` (tier alias, exit contract docs).
- `action/dist`, `.github/workflows/*` (rewire to local binary, checkout-first).
- `apps/site` report views (tier label Low/High) and rubric consistency check (`compile-rubric --check`).
- No change to GH detectors, `scan-phase-1`, `scan-api` streaming protocol, or `surface` surfacing.
