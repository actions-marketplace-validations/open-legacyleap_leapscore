## 1. CLI contract

- [x] 1.1 Add `scan <path>` positional plus `--out <dir>`, `--strict`, `--fail-under <0-100>` parsing with `--strict` + `--repo` rejected before any work, verified by `workflow-scan-cli` unit tests covering help, bad path, flag conflict, and non-empty `--sha` exit 2
- [x] 1.2 Implement exit map 0 pass / 1 crash / 2 usage-or-refused / 3 threshold trip with `--fail-under` evaluated after seal, verified by CLI tests asserting exit 3 on low score with all three files still written
- [x] 1.3 Emit single stdout line (score/band, gates, coverage, threshold state) plus the band assessment URL exactly once, verified by capturing stdout in CLI tests and asserting one tracked link

## 2. Local scan path

- [x] 2.1 Build local orchestrator that binds `readFile`/`readdir` to `<path>` with existing traversal guard and byte cap, skips ingest and clone, and excludes the 6 GH detectors, verified by a local scan of a fixture dir sealing without any `gh.request` call
- [x] 2.2 Make `ScanContext.gh` optional and remove the dead GH branch in `docs08`, verified by `tsc --noEmit` plus detector contract tests passing with no GH client present
- [x] 2.3 Sort detector outputs by id before seal and resolve `scanned_commit` via `git -C <path> rev-parse HEAD` falling back to `unknown`, verified by running the same fixture twice and asserting identical scores with `runId`s differing only by timestamp
- [x] 2.4 Keep remote `--repo` path byte-for-byte on current behavior (GH detectors + shallow clone + seal), verified by existing orchestrator and `phase1` tests passing unchanged

## 3. Offline posture

- [x] 3.1 Implement `--strict` network guard (injected `fetchImpl` throws, GH client disabled, vendored snapshots only, abort on attempt) with `unknown` + re-run hint fallback, verified by a `--strict` fixture test asserting zero sockets via fetch spy
- [x] 3.2 Document allowlisted open-internet GET hosts and the never-send rule (no code, paths, or repo names) in README-adjacent docs, verified by review against the privacy section of the release brief
- [x] 3.3 Always write all three files (`report.json`, `report.html`, `report.md`) to `--out <dir>` with shared score and `runId`, verified by asserting all three exist and agree after a local seal

## 4. Scoring and identity

- [x] 4.1 Rename display tiers to Low/Moderate/High/Critical with `tier_legacy` alias (Healthy/High Risk) and thresholds 80/53/27, verified by seal tests asserting `tier` plus alias at boundary scores
- [x] 4.2 Extend shared `runId` contract to local path slugs (basename slug, engineSha7, safe timestamp) reusing existing validators, verified by contracts tests for local slug stability and rejection of `/` and `..`
- [x] 4.3 Preserve every-deduction trace (file/dep, rule, weight) through seal into JSON and summarized HTML/MD, verified by asserting a top-blocker entry names its evidence file, rule, and weight contribution

## 5. Report rendering

- [x] 5.1 Ship self-contained HTML emitter (inline CSS, no external assets) opening with score/band then top five risks then detail, verified by rendering the emitter output with network disabled and asserting no external requests
- [x] 5.2 Ship Markdown emitter readable in two minutes with methodology link and band-specific CTA, verified by snapshot review of Low/Moderate/High/Critical variants each carrying the correct CTA line
- [x] 5.3 Wire the tracked assessment URL with campaign and band parameters as the only telemetry (click-only), verified by asserting the identical link appears once in stdout, HTML, and Markdown

## 6. Action rewire

- [x] 6.1 Rewrite `action/` as a checkout-first thin wrapper around `scan <path>` with `path`, `fail_under`, `strict`, and `out_dir` inputs mapping to exit codes and `core.setFailed` messaging, verified by an Action unit test matrix over pass/trip/refused exits
- [x] 6.2 Dogfood one workflow on this repo using `./action` with checkout before marketplace publish, verified by a green workflow run uploading the three-file artifact with `if: always()`

## 7. Release verification

- [x] 7.1 Run `openspec validate cli-offline-scan`, `npm run check:rubric-consistency`, and `npm run check:detector-isolation` green, verified by pasting all three command outputs
- [x] 7.2 Run the scanner suite plus the new CLI/offline/determinism tests with no remote-only failures, verified by `vitest run` output in `apps/scanner`
