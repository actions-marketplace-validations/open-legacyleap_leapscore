## Context

Phase 1 (`scan-phase-1`) is live: `runPhase1Scan` (<10s, GH-API, 6 rows) streams via `/api/scan` NDJSON to `/live` (`LiveReportClient`) with progress. The site renders `6/102` and `sample.ts` stays fixture. Constraints: `docs/plans/05:120` path-scoped manifest sniff, `05:4` budget with `budgetLease.sampleN` sharding, D5 no repo code execution, `docs/specs/README.md:2.3` N/A admissibility. `packages/engine` already has `gh.ts`, `budget.ts`, `facts.ts`, `orchestrator.phase1.ts`, and 6 detectors.

See `proposal.md` for why 19-row MVP (Phase 1 6 + Phase 2 13).

## Goals / Non-Goals

**Goals:**
- Worker/queue clone pipeline that takes any public repo URL, shallow clones, sniffs manifests, fans out per `{root, ecosystem}`, and runs 13 local tool adapters within 4-min budget, emitting `RawFact` with `truncated`/`error` for scorer.
- Two-phase UX: Phase 1 dial within 10s, Phase 2 streams `cloning → sniffing → scanning 13 → scoring` and replaces with final `19/102` without losing shareable URL.
- Reuse `check:detector-isolation` and `check:rubric-consistency`; keep Phase 1 6 rows unchanged.

**Non-Goals:**
- v1 59 rows, C/D `unknown` rows, private-repo App flow (`08`), `estimated` rows in MVP (still 0), external job queue service for MVP (in-process queue suffices, swappable later).

## Decisions

**Decision: In-process worker/queue (Promise queue + AbortController per scan) for MVP, interface swappable to BullMQ/SQS.**
- *Rationale:* Phase 2 MVP is 4-min, single-tenant, no persistence needed; in-process avoids infra. Interface `enqueue(repoUrl): {stream, abort}` lets Phase 3 swap to external queue without changing orchestrator or detectors.
- *Alternatives:* Direct `git clone` in request handler — rejected (blocks Next server, no budget control). Immediate BullMQ — rejected (requires Redis, over-engineers for 19-row MVP).

**Decision: Shallow `--filter=blob:none` + `readFile` proxy + path-scoped sniff, not full clone checkout.**
- *Rationale:* Fulfills `05:2` clone cap and `D5` no execution; `readFile` counts against `byteCap` and keeps detectors off raw `fs`. Path-scoped `{root, ecosystem}` naturally handles polyglot monorepos (`frontend` JS + `services/api` Py).
- *Alternatives:* Full clone — rejected (blows 4-min budget on gigantic histories). `actions/checkout` style — rejected (needs checkout, not lazy).

**Decision: Tool adapters as thin `ToolAdapter` subshells with pinned versions, not handwritten analyzers.**
- *Rationale:* `D7` orchestrate OSS tools. Each adapter captures JSON, normalizes to `facts`, records `provenance.version+flags`. `trivy`/`osv-scanner` over lockfiles, `gitleaks` with `--all` + rotation-age, `lizard`/`jscpd` over non-vendored source with dissolve via `sampleN`, `syft` dir-mode. Keeps `orchestrator` policy-owned and detectors testable via fixtures.
- *Alternatives:* Handwritten AST walks for complexity/duplication — rejected (duplicates `lizard`/`jscpd`, calibration risk per `11`).

**Decision: Indicator-count-driven budget + uniform file-tree shard → `budgetLease.sampleN`; detectors must honor `sampleN` + `abort` and return `truncated=true`.**
- *Rationale:* `budgetMs` is `cloneBase + Σ budgetClassCost[indicatorIds]` (`fast 5s`, `api-budgeted 10s`, `slow 40s`), so adding an indicator predictably adds budget and the same `sampleN` is deterministic across slow detectors. Keeps MVP 6→10s and 13→240s, scales to v1 59 without code change. Collapses the old fixed 10s/4-min into one formula, enforced by `orchestrator` and `budget.ts`.
- *Alternatives:* Per-detector timeout only — rejected (starves slow detectors, not uniform).

**Decision: `/api/scan` two-phase NDJSON (Phase 1 chunk immediate, Phase 2 chunks as clone progresses) → `LiveReportClient` merges into step list with elapsed timer.**
- *Rationale:* Reuses existing NDJSON contract (`/api/scan` already streams Phase 1). Phase 1 chunk seals hero dial; Phase 2 chunks update `cloning`/`sniffing`/`scanning` without polling. No scan-id store needed for MVP.
- *Alternatives:* Polling `GET /scans/:id` — rejected (needs store, overkill). RSC Suspense only — rejected (no per-detector progress).

**Decision: Scorer extension for 19 rows reuses `apps/site/lib/scoring.ts` BigInt lcm math, adding ECOS 5 + SEC +4 + ARCH 3 + TEST 2 to VEL 4 + SEC 1 + TEST 1.**
- *Rationale:* Single source of truth for `Category%`/`headline` per `AGENTS.md` cardinal rule. Deep-dive rows still excluded; 19-row coverage is honest-partial until v1.
- *Alternatives:* Duplicate scoring in engine — rejected (drift).

## Risks / Trade-offs

- **Gitleaks history scan cost (tree + `--all`) on large histories** → Mitigation: `--max-depth` per `clone budget` + `scope_limited` note, history truncated still yields tree result; `budgetLease.sampleN` not used for gitleaks (history budget separate).
- **`jscpd`/`lizard` token blowup on huge repos** → Mitigation: `byteCap` via `readFile` proxy, `sampleN` dissolve to largest-N files by LOC, output cap → `estimated+scope-limited`.
- **Syft SBOM on huge transitive graphs** → Mitigation: `slow-dissolvable` dissolve to lockfile direct-deps only + `confidence low` (per ECOS-05 spec).
- **Polyglot monorepo fan-out (per root × per detector)** → Mitigation: orchestrator fans out only matching `ecosystems`, caps at 4 roots; `FactRecord` keyed `(scanId, detectorId, root)`.
- **GH rate limit still hits Phase 1 portion of two-phase scan** → Mitigation: reuse `RateLimitedGhClient` bucket; Phase 2 tools are local, not GH; Phase 1 degrade already proven.

## Migration Plan

1. Land behind `PHASE2_ENABLED` flag (default off until tools pinned and `compile:rubric` passes).
2. Deploy `packages/engine` worker + 13 detectors + `app/api/scan` two-phase stream; `/live` shows Phase 1 dial 6/102 then streams Phase 2 to 19/102. `?live=1` fallback on sample still works.
3. Rollback: flip `PHASE2_ENABLED` off → `/live` reverts to Phase 1-only 6/102, no schema migration.
4. No DB migration for MVP; fact-store stays ephemeral (`05:87`); external queue swap is additive interface change.

## Open Questions

- **External queue trigger (OQ4 cost-per-scan):** at what QPS does in-process queue need BullMQ/SQS + Redis? Assumed <10 concurrent Phase 2 scans for MVP; revisit when freemium P95 queue depth >4.
- **Tool pin versions:** exact `trivy`/`syft`/`gitleaks`/`lizard`/`jscpd` pins to record in `toolVersions` and `provenance` — defer to lockfile in `packages/engine/package.json`.
