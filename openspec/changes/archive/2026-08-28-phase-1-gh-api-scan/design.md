## Context

Current engine is stubs (`packages/engine/orchestrator.ts:10`, `scorer/*:3`). The site renders fixture data (`apps/site/lib/sample.ts:1` django/django 58/100) behind `lib/provider.ts:ReportProvider`. `docs/plans/05` defines the 8-stage pipeline and `docs/plans/13:77` carves Phase 1 as GH-API-only (<10s, no clone, fail-open) covering VEL-06/09/08/10 + SEC-07 + TEST-08 plus repo metadata. This change builds only that slice, leaving `packages/engine/rubric.json` and heavy tools (`lizard`/`jscpd`/`trivy`/`gitleaks`) for Phase 2. Constraints: D5 no execution, `docs/specs/README.md:2.3` N/A admissibility, `05:4` budget controller pattern.

See `proposal.md` for why.

## Goals / Non-Goals

**Goals:**
- Real Phase 1 scan: URL ingest → rate-limited GH fetch → 6 detector facts → fact-store → partial scorer → report that the site can render as the hero dial + coverage strip + gate cockpit.
- Hard 10s budget with fail-open: any GH timeout/rate-limit maps to degraded fact, never a blocked report.
- Provider seam real: `ReportProvider` serves live Phase-1 facts locally, fixture remains as fallback; dedicated `/live` page owns the live surface, sample owns the fixture; “Score this repo” is the live entry point with streamed progress.

**Non-Goals:**
- Clone, heavy static analyzers, ECOS/ARCH facts, Phase-2 two-phase orchestration.
- Private-repo GitHub App flow (`docs/plans/08`), persistence/queue, batch org scoring.
- Dual-headline MVP renorm (30/25/20/15/10) and full 19-row report — Phase 2 concern.
- LLM/inference detectors, N/A for FE annex.

## Decisions

**Decision: GH client lives in `packages/engine/gh.ts` as `RateLimitedGhClient` (token bucket + Retry-After), injected as `ScanContext.gh`.**
- *Rationale:* `05:42` + specs `vel-09_pr-code-review-hygiene.md:16` declare `gh: RateLimitedGhClient` as the only network client detectors may use; isolates token handling from detectors.
- *Alternatives:* raw `fetch` per detector — rejected (violates `check:detector-isolation`, leaks secrets, no shared bucket). Octokit SDK — deferred (add as impl of the interface later, not a contract change).

**Decision: Phase-1 orchestrator is a dedicated `runPhase1Scan` path that reuses the pipeline stages 1-2 but skips `detect-ecosystem`/`clone` (05:79).**
- *Rationale:* Keeps `orchestrator.ts:2` policy ownership (budget, validation) while avoiding premature generic scheduler for 6 GH-only detectors. Phase 2 generalizes to scheduler + `budgetLease.sampleN`.
- *Alternatives:* Build the full `05:1.2` scheduler now — rejected (over-engineers for 6 `api-budgeted`/`fast` detectors, slows hero-dial delivery).

**Decision: Budget is a per-scan `AbortController` + 10s `setTimeout` + per-call 4s fetch timeout; on abort detectors return `error:{kind:"cap"}`.**
- *Rationale:* Matches `05:130` wall-clock cap and spec `§7` failure semantics (`vel-09:71` rate-limit → unknown, `vel-08:69` fast never blocks). Simple to test with fake timers.
- *Alternatives:* Worker-thread pool with `BUDGET_CONCURRENCY` — deferred to Phase 2 when `slow-dissolvable` detectors need `sampleN` sharding.

**Decision: Detectors for Phase 1 are thin GH adapters, not subprocess wrappers.**
- *Rationale:* No `ToolAdapter` needed — all facts come from REST JSON + base64-decoded `contents` YAML. Each detector validates against `packages/detectors/<id>/schema.json` and emits `RawFact` without score/status (`05:62` rule).
- *Alternatives:* Reuse detector contract `detector.ts:12` uniformly — adopted in shape but with `clonePath` unused and `budgetLease.sampleN` ignored in Phase 1.

**Decision: Scorer partial rollup imports `apps/site/lib/scoring.ts:122` math (BigInt lcm cents) but runs server-side over only measured rows; non-Phase-1 rows are `unknown` with `unknown_measure_path` from encyclopedia.**
- *Rationale:* Single source of truth for `Category%`/`System = sum(category%*weight)` per `11:50`; site already proves recomputation at 58.00. Keeps headline derivable.
- *Alternatives:* Duplicate scoring in engine — rejected (drift risk, violates `AGENTS.md` cardinal rule).

**Decision: Dedicated `/live` route (alias `/report/live`) vs. `?live=1` flag on sample.**
- *Rationale:* sample is marketing-critical and must not flicker; live needs shareable URLs (`/live?repo=o/r`) that preview correctly and can evolve to `/r/[owner]/[repo]` without breaking `/report/sample`. Flag stays as internal fallback, but the product surface is the new page.
- *Alternatives:* keep flag-only — rejected (pollutes sample, unshareable, couples demo stability to GH availability).

**Decision: Score CTA → `router.push("/live?repo=o/r")` + server-streaming progress (RSC Suspense fallback or `/api/scan` NDJSON/SSE) that yields per-detector completion.**
- *Rationale:* 10s is too long for a blank page; streaming keeps the hero loop tight and shareable. Server streams the 6-detector fan-out (VEL-06/09/08/10, SEC-07, TEST-08) and the client renders a step list; final chunk is the report. No polling DB, no queue for Phase 1.
- *Alternatives:* full client fetch with `Promise.allSettled` polling `/api/scan/:id` — rejected (needs scan-id store for Phase 1, over-engineers). Blocking server component with no progress — rejected (blank 8s, user bails).

**Decision: Fail-open is exhaustive — every GH call is `try/catch` with typed `error.kind` (`timeout`/`cap`/`rate-limit`/`crash`).**
- *Rationale:* Spec §7 requires no silent blank; `02:34` demands `unknown` never hides, `estimated` never masquerades. `orchestrator` validates envelope per `05:74` and persists even on `truncated:true`.

## Risks / Trade-offs

- **GH rate limit on shared low-rate token pool (05:2)** → Mitigation: token bucket + backoff + per-detector `api-budgeted` degrade; Phase 1 still seals with `degraded` + `unknown "rate-limited"`; FREEMIUM quota communicated as 429 with `Retry-After`.
- **Score CTA burst (homepage → live) hitting anon 60/hr** → Mitigation: `UrlBox` validates/normalizes client-side before `router.push`; server reuses `RateLimitedGhClient` bucket; live page shows `rate-limited — set GH_TOKEN` refused with retry link instead of 500.
- **Commit-history proxy for VEL-06 is coarse (GH commits API last 200, no `shortlog -sne` file-level bus factor)** → Mitigation: document proxy limitation in evidence string + confidence `medium` only when PR enrichment succeeds; full `git log` mining returns in Phase 2 clone path.
- **CI YAML fetch via `contents` API is base64 + rate-costly per file** → Mitigation: fetch only `.github/workflows/*` list then targeted `contents` gets; cache decoded YAML per scan; malformed YAML → `estimated + scope-limited` per `test-08:69`.
- **Phase-1 headline overfits VEL (4/6 rows)** → Mitigation: coverage bar explicitly shows `6/102` and category table shows only VEL/SEC/TEST; do not renormalize MVP weights yet — that waits for Phase 2 dual headline (`13:48`).
- **Spec drift (65 arbitrations in `docs/specs/README.md:195`)** → Mitigation: this change honors spec-wins over encyclopedia (`F1`); note `TEST-03` excluded from Phase 1 precisely because it is `estimated` not `measured`.

## Migration Plan

1. Land behind feature flag `PHASE1_ENABLED` (default off in prod until GH token injected).
2. Deploy `packages/engine` + `packages/detectors/*` with `ReportProvider` toggle: `/live` (and alias `/report/live`) serves Phase-1 facts, `/report/sample` always serves `sample.ts`; `?live=1` on sample remains as fallback for dogfood.
3. Rollback: flip flag off — site reverts to fixture, no schema migration.
4. No DB migration; fact-store is ephemeral (replay from `Facts[]` per `05:87`).

## Open Questions

- **Token source for freemium (OQ4):** shared low-rate PAT vs per-request anonymous (60/h) vs App install? Assumed env `GH_TOKEN` pool for this change; quota tier (`09_MONETIZATION_TIERS.md`) decides later.
- **W-OPEN-1 waitlist mechanics:** Phase-1 `unknown` appendix currently renders as static `deep_dive_scope` list; email capture endpoint not in scope.
- **Branch topology for squash-merge repos:** lineage shape is less informative (`vel-10_branching...md:69`) — evidence notes distortion; no scorer adjustment in Phase 1.
