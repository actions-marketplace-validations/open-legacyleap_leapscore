## Context

See `proposal.md` for why. Current state: `packages/engine/surface/` (11 files, `sync.ts:60` entry `runSurface`) runs inside the scanner process via `packages/engine/bin/scan.ts` (`--surface`, `--surface-from`). Contract with the scanner is already narrow: `{full_table, gates}` + `{repoSha, engineSha7}` (see `surface/sync.ts` types `SurfaceEnvelope`/`SurfaceMeta`). Site never triggers surfacing; `action/dist/` is the only non-CLI caller. Workspaces already include `apps/*`.

## Goals / Non-Goals

**Goals:**
- New `apps/surface/` workspace app owning all `issues:write` code and its own token.
- Engine returns to read-only-after-seal; no behavior change to lifecycle/discovery/labels.
- `action/` calls the new app; `bin/scan --surface` becomes a thin forwarder or is removed.

**Non-Goals:**
- No change to `issue-surfacing` lifecycle semantics, label taxonomy, or throttling.
- No HTTP service in this change (seam designed, not built); no queue/cron; site does not gain a surface trigger.

## Decisions

### D1: CLI-first app, HTTP seam reserved
- Choice: `apps/surface/bin/surface.ts` — `surface --from <envelope.json> --repo <owner/repo> [--repo-a <owner/repo>] [--run-url <url>]`, exit 0 always on sealed input (warn-only shortfalls), exit 2 on invalid envelope.
- Alternative (b) `POST /surface` service now — rejected: no queue/auth story yet, and `action/` only needs a file-in path. The `runSurface` signature already fits a future handler: `POST {envelope, runner, target}` → `{summaryLine, stepSummary, counts}`.
- Rationale: smallest move that achieves the secrets split; keeps `action/dist/` rebuild trivial.

### D2: Move, don't fork, the 11 surface modules
- Choice: git-move `packages/engine/surface/*.ts` → `apps/surface/src/*` preserving module boundaries (`sync`, `guardrail`, `discover`, `lifecycle`, `rest`, `rows`, `body`, `labels`, `identity`, `slug`, `summary`). Engine re-exports nothing; `bin/scan --surface` shells to or imports the built app during migration, then the import is deleted.
- Alternative: leave files and add a wrapper — rejected, defeats the token/process split.
- Identity/token grammar (`identity.ts`, `slug.ts`) moves with the app; `@leapscore/contracts` stays the only shared import (runId, envelope types).

### D3: Token split at the process boundary
- Choice: scanner process reads `GH_TOKEN`/`GITHUB_TOKEN` for `contents:read` only; surface process reads `SURFACE_TOKEN` (fallback `GH_TOKEN`/`GITHUB_TOKEN` in workflow where the default token already has `issues:write`) and never sees scan internals.
- Workflow declares `contents:read` for scan job + `issues:write` only on the surface step. Token material never enters the envelope (already true per `scanner-service` spec).

### D4: Boundary checks both directions
- Choice: extend `tooling/checks/` with `check:surface-boundary` (precedent `site-boundary.ts`): engine graph must not reach `apps/surface`; site graph must not reach `apps/surface` or `issues:write` scopes; surface graph must not reach `packages/engine` detectors/clone/budget (only `@leapscore/contracts`).
- Rationale: the split rots without a CI gate; three apps with three token scopes need three enforced graphs.

### D5: `action/` + root bin wiring
- Choice: `action/` invokes `apps/surface` build output; root `package.json` needs no workspace change (`apps/*` already covered) but gains `check:surface-boundary` script. `leapscore-scan --surface` prints a deprecation pointer to the new binary for one release, then is removed.
- Rollback: keep `packages/engine/surface/` as a re-export shim for one commit; delete after `action/dist/` rebuilds green.

## Risks / Trade-offs

- [Import churn] Moving 11 files breaks deep imports (`@/surface/...`) → Mitigation: single barrel `apps/surface/src/index.ts` exporting `runSurface`, types, `formatSummaryLine`; codemod internal imports in the same change.
- [Action rebuild skew] `action/dist/` is compiled; stale dist calls deleted engine path → Mitigation: rebuild dist in the same change, verify with a dry-run `--surface-from` on a fixture envelope.
- [Token confusion in local dev] Two tokens vs one → Mitigation: surface accepts single-token fallback locally, requires split only in CI; document in app README.
- [Scope creep to service] Temptation to add HTTP now → Mitigation: non-goal above; only the request/response shape is documented here.

## Migration Plan

1. Scaffold `apps/surface/` (package.json, tsconfig, bin, src moved, README noting warn-only + exit codes).
2. Add `check:surface-boundary` + wire into CI alongside `check:site-boundary`.
3. Rewire `action/` to new binary; rebuild `dist/`; deprecate `bin/scan --surface`.
4. Delete engine shim; engine lint (`tsc --noEmit`) + surface tests + boundary checks green.

## Open Questions

- None blocking. Deferrable: HTTP `POST /surface` auth shape (GH App vs PAT) — does not change the file-in CLI or task breakdown.
