## Why

LeapScore can only be triggered from the website today (`/live` → `/api/scan`). Teams that live in GitHub Actions have no way to run the same checks on demand against their own repo or a public target and keep the machine-readable result. This change adds that execution-only slice without touching in-repo surfacing (checks/projects/comments stay in `12_GITHUB_SURFACE_PLAN.md`).

## What Changes

- New thin CLI `packages/engine/bin/scan.ts`: `scan --repo <owner/repo> [--sha <sha>] --out leapscore-report.json`, reusing `runUnifiedScan` + terminal scoring exactly as `/api/scan` does.
- New `workflow_dispatch`-only workflow sketch in the runner repo (A): `setup-node` → `npx … scan` → `upload-artifact`; self-scan when `target_repo` is empty, target-scan otherwise; no `actions/checkout` of T.
- Sealed envelope artifact: `{ report, meta, trace }` file mirroring the website shape (`report_schema: "1"`, `meta.runId`, `snapshot.repoSha`, trace truncate >200); human one-liner on stdout, machine JSON in file.
- Honest exit-code map: sealed report (complete/degraded, any score/gates) → `exit 0`; no report → `exit 1` crash, `exit 2` refused/unsupported-input (including non-empty `--sha`, not-found, private-without-token, rate-limited).
- Auth passthrough: `GH_TOKEN`/`GITHUB_TOKEN` from the runner; public targets work with zero extra secrets, private targets fail loudly (`private_requires_app` path, no silent fallback).
- Non-goals (stay out): SHA pinning engine work, private-PAT clone auth, schedule/push triggers, `$GITHUB_STEP_SUMMARY` markdown, Docker/reusable-workflow packaging, check runs / issues / PR comments, website deep links, multi-target matrix.

## Capabilities

### New Capabilities

- `workflow-scan`: execution-only GitHub Actions scan — CLI contract, workflow inputs, auth passthrough, exit-code map, artifact envelope file, stdout grammar, and E2E acceptance (self + target public scans).

### Modified Capabilities

- `reports/persisted-runs`: envelope contract gains a second producer — the CLI writes a `{ meta, report, trace }` envelope to the runner working directory (not `apps/site/reports/`), with `engineSha7` resolution defined for the no-checkout runner context. File layout and fresh-vs-cached routing for the website are unchanged.

## Impact

- New: `packages/engine/bin/scan.ts` (+ bin entry / packaging decision), workflow YAML sketch (docs; repo workflow file at implementation), `leapscore-report.json` artifact convention.
- Shared: envelope composer logic currently local to `apps/site/app/api/scan/route.ts` + `apps/site/lib/reports.ts` — CLI must reuse, not fork (extraction decision lands in design).
- No changes to detectors, rubric, scoring weights, or `12` surfacing behavior. Engine `runUnifiedScan`/`ingest`/`gh`/`clone` untouched except any test-only seam needed for the CLI.
