## 1. Shared seal composer

- [x] 1.1 Extract terminal composer (scoreMvp + top_blockers + deep_dive_scope + runId/meta + trace-truncate + stdout line) into a shared module and verify website golden envelope is byte-identical before/after via existing scan test plus envelope fixture diff
- [x] 1.2 Rewire `/api/scan` route to call the shared composer and verify live scan still streams NDJSON and persists `{ meta, report, trace }` with trace-truncate sentinel intact

## 2. Thin CLI

- [x] 2.1 Add `packages/engine/bin/scan.ts` with `--repo/--sha/--out` parsing, `owner/repo` validation, and `https://github.com/<repo>` construction, and verify `--help` and bad-form inputs exit 2 with usage text
- [x] 2.2 Wire CLI to drain `runUnifiedScan` through shared composer to `--out` with `GH_TOKEN ?? GITHUB_TOKEN` passthrough, and verify a public fixture scan writes a valid envelope and prints the one-line `score/tier/gates/coverage` summary
- [x] 2.3 Implement exit-code map (sealed → 0; crash → 1; refused/bad-input/non-empty `--sha` → 2) and verify each path with not-found, invalid-url, and `--sha abc1234` cases asserting code plus no-file-when-refused
- [x] 2.4 Add `engineSha7` resolution order (`LEAPSCORE_SHA` → pinned-ref input → git → `unknown`) and verify `unknown` fallback still seals a valid file when no SHA sources exist

## 3. Runner workflow

- [x] 3.1 Add `workflow_dispatch` workflow (`target_repo`, reserved `sha`, `permissions: contents: read`, setup-node → scan → upload-artifact with `if: always()`, per-run name, 30-day retention) and verify YAML parses and dispatches manually on a test runner
- [x] 3.2 Pin `setup-node`/`upload-artifact` versions and the engine ref in the `npx` line and verify a dispatched self-scan resolves the pin and completes without checkout

## 4. E2E acceptance

- [x] 4.1 Run public self-scan (A scans A) from the runner and verify exit 0 plus artifact parses as `{ report, meta, trace }` with `report_schema "1"` and seal trace last
- [x] 4.2 Run public target-scan (A scans a known public T) and verify exit 0 plus envelope `snapshot.repo` normalized to the target and artifact name uses target slug plus run number
- [x] 4.3 Run refusal cases (missing repo; private target with default token) and verify exit 2, no report file, and error names the `owner/repo` form / private-token requirement

## 5. Docs log

- [x] 5.1 Log grill R1–R8 into `docs/plans/00_MASTER_INDEX.md` and register `14_WORKFLOW_SCAN_V1.md` in the documents table, and verify the index links resolve and the status line no longer reads planning-only for the engine seam
