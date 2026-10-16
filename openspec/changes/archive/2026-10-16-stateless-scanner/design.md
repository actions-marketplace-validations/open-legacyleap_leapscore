## Context

See proposal.md for motivation. Current state: `apps/scanner/src/server.ts` imports `runUnifiedScan` / `sealScan` / `FactRecord` from `@leapscore/engine`, then persists via `src/store.ts` (`SCANNER_STORE_DIR`, atomic tmp+rename) and serves `GET /reports/:runId`. `tooling/scripts/sync-reports.ts` byte-copies the scanner store into `apps/site/reports/`; `apps/site/lib/reports.ts` reads that dir at build time for `/reports` + `/reports/[runId]`. The terminal `report` NDJSON frame is already self-sufficient and byte-identical to the stored envelope (server.ts comment), so the wire supports stateless operation today.

## Goals / Non-Goals

**Goals:**
- Scanner deploys with no volume: compute + token in, NDJSON terminal frame out.
- All scanner implementation lives under `apps/scanner`; `packages/contracts` stays the sole shared package.
- Boundary checks enforce the new graphs so the split cannot silently regress.

**Non-Goals:**
- Choosing the durable site-history backend (deferred follow-up; this change makes history site-owned with ephemeral/static behavior — see Decisions).
- Changing scan semantics (budget, detectors, scoring) — relocation only.

## Decisions

### 1. Memory stays, disk goes

Keep `AdmissionController` (per-IP rate/concurrency) and the single-flight `inflight` coalescing map as ephemeral per-replica memory. Delete `store.ts`, `getStoreDir`/`writeEnvelope`/`readEnvelope` call sites, `SCANNER_STORE_DIR` env, `GET /reports/:runId` + `validatePermalinkRunId` read path (keep the grammar in contracts for frame `meta` validation). Rationale: "stateless = no permanent disk" (user-confirmed); throttling without memory would expose GH quota to abuse. Alternative (fully ephemeral, no coalescing) rejected: loses burst protection for zero deployability gain.

### 2. Disconnect semantics simplify

Remove run-to-seal-on-disconnect (`req.on("close")` no-op + persist-after-seal). When the client goes away the scan's artefact is discarded; an in-flight engine run may be abandoned. Rationale: the only reason to finish a clientless scan was permalink retrievability, which no longer exists. Trade-off: wasted compute on abandons vs. wasted compute finishing scans nobody reads — latter is strictly worse.

### 3. Site history: ephemeral-first, sample becomes fixture

`apps/site/reports/` + `sync-reports` + `lib/reports.ts` dir-reader are deleted. `/reports` + `/reports/[runId]` render from site-owned history whose v1 source is deliberately thin: the committed sample becomes a static fixture (or the pages show empty-state until a durable backend lands — final call during implementation). Rationale: avoids smuggling a second store into this change; keeps the site building and serving with the scanner unreachable. The durable backend (KV/R2/DB) is a separate change with its own spec.

### 4. Engine relocation layout

Move (not copy) under `apps/scanner/src/`:

```
  apps/scanner/src/
    server.ts            (HTTP + NDJSON, minus store/permalink)
    protocol.ts          (unchanged)
    admission.ts         (unchanged)
    scan/orchestrator.ts (+ phase1, budget, queue, runner, scheduler, ingest, gh, clone, ecosystem, facts, registry, detector, archetype)
    scan/detectors/      (31 detectors + common)
    scan/scoring/        (seal, scorer/*, rubric.json)
```

`packages/engine` is deleted; `packages/contracts` is untouched. Rationale: scanner becomes the only importer of scan/score code, so the boundary is structural rather than grep-enforced. Alternative (leave engine as library, thin scanner wrapper) rejected: preserves the two-home split the user explicitly wants gone.

### 5. Workflow CLI moves with the engine

`packages/engine/bin/scan.ts` moves to `apps/scanner/bin/scan.ts` (same flags, same envelope file output) and imports the relocated implementation relatively. Root `bin.leapscore-scan` is re-pointed. No CLI behavior change — hence no `workflow-scan` spec delta. Rationale: the CLI is a second producer of the same computation; stranding it in a deleted package is incoherent.

### 6. Boundary checks re-pointed

`site-boundary.ts`: forbid reaching `apps/scanner` (replacing the `packages/engine` pattern); keep node-fs/child-process rules and existing exemptions. `surface-boundary.ts`: engine-side walk becomes an `apps/scanner` walk; the "surface must not reach engine" rule becomes "surface must not reach `apps/scanner`" with `@leapscore/contracts` still the only shared import. Rationale: the checks are the enforcement; they move with the code.

## Risks / Trade-offs

- [Risk] Anything referencing scanner permalinks or `apps/site/reports/` files breaks (share links, docs, tests) → Mitigation: grep-and-remove pass is part of implementation; spec REMOVED sections document migration.
- [Risk] `lib/reports.ts:buildMeta` is a second meta-constructor beside `sealScan` → Mitigation: deleted with the dir-reader; scanner `meta` becomes the only constructor.
- [Risk] Site `/reports` v1 is thin (fixture/empty) until durable backend lands → Mitigation: explicit non-goal with follow-up change; live scan (primary path) is unaffected.
- [Risk] Moving 40+ engine files in one change complicates review → Mitigation: pure move first (no logic edits), store/permalink deletion as separate commits; boundary checks gate each step.

## Migration Plan

1. Delete scanner store + permalink + sync step + site build-input flow (specs go red-then-green on boundary checks).
2. Relocate engine files under `apps/scanner/src/` with relative imports; move CLI bin; re-point root bin.
3. Rewrite both boundary checks; run `check:site-boundary`, `check:surface-boundary`, `check:rubric-consistency`, full test suites.
4. Rollback: revert the change commit(s); no data migration exists because no store exists anymore.

## Open Questions

- None that change specs, approach, or task breakdown. The durable site-history backend is a deferred follow-up, not an open question for this change.
