## Why

The scanner currently owns a permanent disk store (canonical envelopes + `GET /reports/:runId` permalinks + `sync-reports` copy into the site), while its scan/score implementation lives in a separate `packages/engine` library. This splits "scanner stuff" across two homes and makes the scanner stateful to deploy. Making the scanner stateless pure compute (no permanent disk; ephemeral memory only) with its implementation colocated under `apps/scanner` gives one self-contained deployable and leaves the site to visualise whatever the scanner returns.

## What Changes

- **BREAKING** Scanner drops all permanent-disk persistence: no envelope writes, no `SCANNER_STORE_DIR`, no `GET /reports/:runId` permalink. The terminal `report` NDJSON frame becomes the sole artefact.
- **BREAKING** Delete `tooling/scripts/sync-reports.ts` (+ `sync:reports` script) and the `apps/site/reports/` build-input directory flow; site history is re-decided as site-owned (ephemeral first, durable backend deferred as follow-up).
- Scanner keeps ephemeral memory only: per-client admission control and single-flight coalescing stay; disconnect-run-to-seal semantics are re-examined (no permalink payoff).
- Relocate engine scan/score implementation (`orchestrator`, `seal`, `detectors/`, `scorer/`, `gh`/`clone`/`ingest`/`budget`/`archetype` and siblings) from `packages/engine` into `apps/scanner/src/`; `packages/contracts` remains the only shared package.
- Re-point the workflow CLI (`packages/engine/bin/scan.ts`) to the relocated implementation (import from scanner or move under `apps/scanner/bin/` — decided in design).
- Rewrite `tooling/checks/site-boundary.ts` and `tooling/checks/surface-boundary.ts` to enforce the new graphs (`apps/scanner` instead of `packages/engine`).

## Capabilities

### New Capabilities
- None — this change removes and relocates; it introduces no new behavior namespace.

### Modified Capabilities
- `scanner-service`: drop "Report store ownership" requirement; scanner owns execution boundary + token only, no store, no permalink serving.
- `scan-api`: remove "Report permalink" requirement and store-round-trip/persist-on-disconnect requirements; terminal `report` frame is the sole artefact contract.
- `reports/persisted-runs`: remove scanner-canonical-store + website build-input sync flow; persistence (if any) becomes site-owned.
- `reports/run-history-ui`: re-scope list/detail views to site-owned history (or remove if no durable backend in this change — decided in design).

## Impact

- Affected code: `apps/scanner/src/store.ts` (delete), `apps/scanner/src/server.ts` (remove store + permalink paths), `packages/engine/**` (relocate into `apps/scanner`), `packages/engine/bin/scan.ts` (re-point), `apps/site/lib/reports.ts` + `/reports` pages (rewrite or remove), `tooling/scripts/sync-reports.ts` (delete), both boundary checks.
- Deployments: scanner becomes diskless (no volume needed); site no longer depends on scanner store or sync step.
- Consumers: live scan (`/live`) unchanged (already renders terminal frame); any consumer of scanner permalinks or `apps/site/reports/` files breaks.
