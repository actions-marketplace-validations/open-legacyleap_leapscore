## Context

See proposal.md (Why) and `specs/workflow-scan/spec.md` (behavior contract). Current state shaping this design:

- `packages/engine/orchestrator.ts` (`runUnifiedScan`) is the only scan entry; it yields `meta → progress → trace → done | refused` and already covers budget, ingest refusal, clone, archetype, and seal-as-unknown.
- The terminal composer (scoreMvp + top_blockers + deep_dive_scope + runId/meta + trace-truncate) lives only in `apps/site/app/api/scan/route.ts` (~130 lines) on top of `apps/site/lib/reports.ts` (runId grammar, `resolveEngineSha7`, envelope IO to `apps/site/reports/`).
- `packages/engine` has no `bin` entry, no CLI arg parser, and `shallowClone` takes a bare URL with no credential seam. `ingest` maps private/invisible repos to `private_requires_app` or `not_found` depending on GH response shape.
- Consumers: website (NDJSON stream + persisted file) and, after this change, the CLI (single file + exit code). Both must seal byte-compatible envelopes.

## Goals / Non-Goals

**Goals:**
- One shared seal path for route and CLI so envelopes cannot drift.
- A runnable `bin/scan.ts` with deterministic exit codes and a per-run artifact.
- A minimal runner workflow that needs no checkout and no secrets beyond the default token for public targets.

**Non-Goals:**
- No SHA-pinned scans, no private-target clone auth, no schedule/push triggers, no step-summary markdown, no Docker/reusable-workflow packaging, no surfacing (checks/issues/comments), no site ingest of artifacts. See proposal Non-goals; design adds no new scope.

## Decisions

### D1 — Extract a shared seal composer; route and CLI both call it
`route.ts` keeps streaming/single-flight/heartbeat; the pure part (facts + snapshot + budgetMs + timing → `{ report, meta, trace }` + stdout line) moves to one shared module importable from both `apps/site` and `packages/engine` (exact home chosen at implementation: engine-side module preferred so the CLI has no site dependency). It owns: `scoreMvp` call with archetype resolution, `repoSha` fallback (snapshot → fact → `"unknown"`), `top_blockers` (top 5 by lost pp), `deep_dive_scope` (complement of rubric, cap 18), `runId`/`meta` build, trace truncation (>200 keep seal last + sentinel first), and the one-line stdout grammar (`score/tier/gates/coverage`).
- Alternative (rejected): CLI reimplements the composer by copying route code — ships two seal paths; every scoring/envelope fix needs two edits.
- Alternative (rejected): CLI imports directly from `apps/site/lib` — drags site framework path (`@/lib`, `process.cwd()/reports`) into the engine package.

### D2 — CLI is a thin arg/IO shell over orchestrator + composer
`bin/scan.ts` does only: parse `--repo/--sha/--out`, validate `owner/repo` form (reject `https://` prefix / `.git` suffix with usage error, exit 2), reject non-empty `--sha` (exit 2, "pinning not yet supported"), build `https://github.com/<repo>`, read `GH_TOKEN ?? GITHUB_TOKEN`, drain `runUnifiedScan` to `done | refused`, call the shared composer, write `--out`, print the stdout line, exit per D4. No scoring, no envelope, no trace logic inline.
- Runtime/packaging: expose via `packages/engine` `bin` entry runnable through the pinned `npx -p github:legacyleap/leapscore#<sha>` line; pin `setup-node`/`upload-artifact` versions at implementation. If the git-fetched tree needs a build step (TS → JS), the workflow runs it explicitly rather than assuming `tsx` on the runner.

### D3 — Engine SHA resolution order for runner identity
`LEAPSCORE_SHA` → workflow's pinned engine-ref input (when the workflow passes it) → `git rev-parse --short HEAD` → `"unknown"`. Rationale: the runner has no checkout by design, so git probing is last, not first; the pinned ref is the only truthful identity in the `npx -p …#<sha>` model. `unknown` remains valid (file still seals).

### D4 — Exit-code map from orchestrator terminal events
- `done` (status `complete` or `degraded`) → `0`, regardless of score/tier/gates.
- `refused` → `2` for `not_found`, `private_requires_app`, `rate-limited`, `unsupported_host`, `invalid_url`, non-empty `--sha`; → `1` for `crash` (clone failure, API outage, unexpected throw, budget-plumbing failure). Refusal detail is truncated into stderr + stdout line; no envelope is written on refusal (partial envelopes, if any, are still uploaded via `if: always()`).
- Rationale: keeps the execution/surfacing split explicit — verdicts live in JSON, step conclusion only signals "did a report seal."

### D5 — Workflow shape: no checkout, minimal permissions, always-upload
`permissions: contents: read`; no `actions/checkout` (engine clones internally from the constructed URL); three steps (`setup-node` → scan with `GH_TOKEN: secrets.GITHUB_TOKEN` → `upload-artifact` with `if: always()`, per-run name, 30-day retention). `target_repo`/`sha` inputs carry the reserved descriptions from the spec so the rejected-`sha` cliff is visible before dispatch.

### D6 — No clone-credential seam in v1
Private targets fail at ingest/GH visibility with exit 2; no token-in-URL, `GIT_ASKPASS`, or `http.extraHeader` plumbing is added. The refusal message names the PAT/App-token requirement so the deferred work has a defined trigger.

## Risks / Trade-offs

- [Risk] Composer extraction touches the live scan route → Mitigation: extraction is behavior-preserving (byte-identical envelopes in E2E fixtures); route diff is call-site only, covered by existing scan tests plus one golden-envelope assertion.
- [Risk] `npx -p` from git SHA is slow/fragile (whole monorepo, build step) → Mitigation: v1 accepts this for pin-exactness; E2E measures wall time; Docker/published-package remains the documented follow-up.
- [Risk] `GITHUB_TOKEN` quota shared with repo's other API use; target scans counted against runner repo → Mitigation: doc notes the quota model; scan stays within the existing unified budget; no retry-storm changes in v1.
- [Risk] `not_found` vs `private_requires_app` ambiguity for token-invisible repos → Mitigation: both map to exit 2; message surfaces whichever reason ingest returned plus the private-token hint.
- [Risk] `engineSha7: unknown` weakens run identity for runner artifacts → Mitigation: accepted; per-run artifact name (`<slug>-<run_number>`) carries uniqueness; website routing untouched.

## Migration Plan

No migration: additive only (new bin, new workflow file/sketch, new shared module extracted from route internals). Rollback is deletion of the workflow + bin entry; website behavior unchanged if the composer extraction holds golden-envelope parity.

## Open Questions

- Exact home of the shared composer module (engine package vs new shared package) — answerable at implementation without changing specs.
- Pinned action/SHA versions for `setup-node`, `upload-artifact`, and the engine ref — pinned at implementation time per doc 14 §9.
