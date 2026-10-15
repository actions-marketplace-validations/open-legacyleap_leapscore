## Context

See `proposal.md` — Why. The constraints that actually shape the approach:

- **Dependency direction is already clean.** `packages/engine` has zero imports from `apps/site`. The only reverse edges are `tooling/scripts/compile-rubric.ts` (which writes *both* `packages/engine/rubric.json` and `apps/site/lib/generated/rubric.ts`) and two dynamic relative-path imports from site library code into the engine. This is not a tangle to unpick; it is a boundary to declare.
- **The site is almost static already.** 12 of 15 routes are static-eligible. Only `/api/scan`, `/api/reports/[runId]`, and `/reports/[runId]` need a server process. The impure surface is ~400 LOC of 7142 (5.6%).
- **The designed seam is dead.** `getReportProvider()` is called only from `apps/site/app/page.tsx:10` with no arguments, so `liveFlag` is always false; `apps/site/lib/provider.live.ts` (182 LOC) is unreachable. The live path that *is* alive bypasses the seam entirely. That is what let the engine land in-process.
- **The producer cannot state its own output type.** `packages/engine/seal.ts` returns `Record<string, unknown> & { headline… }`; `packages/engine/scorer/index.ts:7` declares `coverage: unknown; categories: unknown[]; gates: unknown[]`; the authoritative 165-LOC `Report` lives in the *consumer* at `apps/site/lib/types.ts`.
- **The envelope is defined twice.** `packages/engine/seal.ts:41` duplicates 6 grammar functions and the `SealMeta`/`SealTraceEntry` types from `apps/site/lib/reports.ts`, with the comment "duplicated so CLI has no site dep".
- **Provenance is computed wrong.** `apps/site/lib/reports.ts:89` runs `execSync("git rev-parse --short HEAD")` (1500ms timeout) inside a request handler, recording the *website's* commit. `packages/engine/seal.ts:79` has a second, correct implementation accepting an explicit `--engine-ref`.
- **A third consumer already exists.** `.github/workflows/leapscore-scan.yml` drives the same engine headlessly by pinned git ref (`LEAPSCORE_ENGINE_REF`) and writes the report as a **file** (`--out leapscore-report.json` + `upload-artifact`). Reports-as-artifacts is the existing precedent, not a new idea.
- **Most of the service already exists as headers.** `packages/engine/{runner,store,scheduler,registry}.ts` are stubs whose docblocks describe this service (`runner.ts` names the network allow-list; `store.ts` names replay as `Facts[] + rubric.json@sha → scorer`). `queue.ts` is real and already used by `orchestrator.ts:220`.

## Goals / Non-Goals

**Goals:**

- Two independently deployable sides — `apps/site` (present) and `apps/scanner` (produce) — sharing nothing at runtime.
- The present side becomes statically deployable end to end: no engine import, no GH token, no filesystem access on request.
- The report envelope and run identity get a single producer-owned definition.
- The scan stream becomes a versioned, cross-origin protocol.
- Report provenance is computed once, correctly, from an explicit engine reference.

**Non-Goals:**

- Implementing `runner.ts` isolation (cgroups, worker threads, network allow-list enforcement). This change establishes the boundary that makes isolation possible; hardening it is its own change.
- Building the logged-in product surface (dashboards, portfolio view, drift alerts — `10_ROADMAP.md` line 55, `09_MONETIZATION_TIERS.md` line 24). The scanner is deliberately named so that surface can land as a third thing.
- Changing the rubric, the scoring math, the detector set, or any verdict semantics.
- Changing any public URL reachable by a user today.
- Choosing the scanner's canonical durable storage backend.

## Decisions

### D1 — Two sides named by role, not by "app"

`apps/site` is **present** (public, build-time, no secrets). `apps/scanner` is **produce** (runtime, untrusted input, tokens, store). The scanner is not called "app" because `09_MONETIZATION_TIERS.md` and `10_ROADMAP.md` already promise a logged-in product surface that is neither of these; naming the scanner "app" would re-create this same ambiguity one level up.

*Alternatives considered:* name it `apps/app` (rejected — collides with the planned product surface); three-way split now (rejected — the product surface does not exist yet, and inventing it would be speculation).

### D2 — One monorepo; `packages/contracts` is the boundary

`apps/site` + `apps/scanner` + `packages/contracts`, in the existing workspace. The split being purchased is a **runtime and deploy** split, not a repository split.

Evidence: 14 of 32 commits touch both `packages/engine` and `apps/site`, and every one of those is a *feature* co-change (a new fact shape forcing a renderer change), not an accident. Two repositories would convert all 14 into cross-repo PR pairs while buying nothing, because the contract is not yet versioned. Additionally `compile-rubric.ts` writes one canonical source into two derived outputs, one per side; that is a single-repo operation by nature.

*Alternatives considered:* two repositories with a published `@leapscore/contracts` (deferred, not rejected — D2 is deliberately structured so the extraction is a **move**, not a refactor: no deep relative imports across `apps/*`, no path-based coupling); monorepo with a single app (rejected — cannot deliver deploy isolation).

### D3 — The producer owns the report contract

`Report`, the `{meta, report, trace}` envelope, and the `runId` grammar move into `packages/contracts`. `packages/engine` depends on `packages/contracts` and types `sealScan`'s output as the contract. `apps/site` depends on it and deletes its own definitions.

Rationale: a network boundary requires the producer to state its output schema. In-process, `Record<string, unknown>` plus a cast is survivable; across a wire it is not. Today's arrangement (consumer owns the schema, producer types it loosely) only works because both halves share a process, which is precisely what this change removes.

Consequence to accept: `apps/site/lib/types.ts` contains render-only concerns (`verdict_text`, `remediation` display fields) alongside wire fields. Those stay on the present side; only the wire shape moves.

*Alternatives considered:* keep the contract consumer-owned and code-generate a client (rejected — the generator becomes a new build step and the consumer still defines what the producer must emit); duplicate the types with a consistency check (rejected — this is the status quo that already produced two divergent definitions).

### D4 — The scan API is a versioned, cross-origin NDJSON protocol

The scanner exposes the scan as an HTTP endpoint streaming the existing frame vocabulary (`meta`, `progress`, `trace`, `report`, `refused`), with a protocol version on every frame and explicit CORS. `/live` calls it directly from the browser; there is **no** same-origin proxy.

Rationale: a proxy would re-introduce exactly the serverful website route this change exists to delete, and would duplicate the stream. The frames are already a protocol in practice — `scan-trace` depends on their additivity and backward compatibility.

*Alternatives considered:* thin Next.js proxy route for rate limiting (rejected — keeps the site serverful; abuse control belongs to the scanner regardless, since the scanner is what spends GH quota and clone bandwidth); request/response JSON with polling (rejected — loses the live progress and trace timeline).

### D5 — Reports are build inputs, not request-time state

The scanner owns the canonical store. The website consumes a **build-input directory** (`apps/site/reports/`, retained as the path) that is populated by an explicit sync step and is tracked. `/reports` and `/reports/[runId]` are prerendered from it, with `dynamicParams = false`. The website never writes an envelope.

Rationale: this is the specific fix for the failure the proposal documents. Today the filesystem read is *accidentally* static — `next build` baked `reports.html` empty and fabricated `reports/placeholder__unknown__2026-01-01T000000-000Z.html` — because nobody decided the caching posture. Making the input explicit converts an accidental bake into a declared build input, and leaves the site CDN-deployable.

Consequence to accept (the real cost of this decision): **a freshly scanned run has no prerendered page** until the next sync + build. That is handled by D6.

*Alternatives considered:* read-through proxy to the scanner's report API (rejected — keeps a serverful route, contradicting the static goal); keep the filesystem store as-is (rejected — this is the known-broken status quo); object storage fetched at build (deferred — the sync step is the seam, so the backend can change without touching the website).

### D6 — Live reveal renders in place; the scanner owns the canonical permalink

`/live` renders the sealed report **in place** from the terminal `report` frame, which the client already receives (`LiveReportClient` holds the report in state today; it currently discards it in favour of `router.push('/reports/<runId>')`). The scanner serves a stable permalink per `runId` for sharing. The website's own `/reports/<runId>` page appears once the run is ingested.

Rationale: under D5 a fresh `runId` cannot have a static page, so navigating to `/reports/<freshRunId>` would 404 until the next deploy — a worse experience than either alternative. Rendering in place preserves the entire visible flow and removes the dependency on a page that may not exist yet.

*Alternatives considered:* navigate to `/reports/<runId>` (rejected — 404s for fresh runs); make a fresh run trigger an ingest + rebuild (rejected — minutes of latency inside a 240s scan UX).

### D7 — `provider.live.ts` is deleted; the sample seam stays

The dead live provider is removed. `SampleReportProvider` and the `ReportProvider` interface remain as the `/report/sample` seam, which is genuinely a *data* seam and still does its job.

Rationale: the provider interface was designed for swapping fixtures for live data in one process (W4). Once live data arrives over HTTP from another deployable, the interface is the wrong shape for that job — but it remains the right shape for its original one.

### D8 — Provenance is resolved once, by the scanner

Engine identity comes from an explicit invocation reference (`--engine-ref`, `LEAPSCORE_ENGINE_REF`), falling back to the scanner checkout's commit, then `unknown`. The website's `execSync` implementation is deleted.

Rationale: a consumer cannot know which engine produced a report by inspecting its own working directory. The site's copy was not merely redundant, it was wrong, and it is the direct cause of the `unknown` engine SHA in the baked placeholder page.

## Risks / Trade-offs

- **[Cross-origin scan API is publicly abusable — GH quota and clone bandwidth.]** → The scanner already spends quota through a bucketed GH client (`packages/engine/gh.ts` token bucket) and already clamps its budget to 240s (`budgetForIndicators`); add per-IP rate limiting at the scanner edge. Abuse control lives where the cost is incurred, which is also why D4 rejects a proxy.
- **[A fresh run is not linkable on the website until sync + build.]** → D6: the live page renders in place and the scanner serves the canonical permalink; the website page follows on the next ingest.
- **[Tracked envelopes grow the repository.]** → Retention is the scanner's policy and the site ingests whatever it is given; cap the ingest set and keep the committed sample. Moving the canonical store to object storage is a deferred change behind the same sync seam.
- **[`dynamicParams = false` changes 404 semantics.]** → A grammatically valid but un-ingested `runId` now 404s at the edge rather than reaching a filesystem. This is the intended behavior and is specified explicitly.
- **[Deleting the same-origin proxy exposes the scanner's error surface to browsers.]** → `refused` frames remain the typed contract for every failure mode (`unsupported_host`, `not_found`, `rate-limited`, `crash`); the website maps them to the existing user-facing messages.
- **[The boundary can silently erode again.]** → Add a build-time check (alongside the existing `check:detector-isolation`) that fails when the website's source graph reaches the engine package or Node filesystem/child-process builtins outside build tooling.

## Migration Plan

1. **Contract first.** Create `packages/contracts`; move the envelope types and `runId` grammar into it; have `packages/engine` import them and type `sealScan`'s output as the contract; delete the duplicates from `packages/engine/seal.ts:41` and `apps/site/lib/reports.ts`.
2. **Correct provenance.** Route all engine identity through the explicit-reference path; delete the website's `execSync` resolver.
3. **Stand up the scanner.** Create `apps/scanner`; move the scan-route logic into it as the scan API plus store; add protocol versioning, CORS, report permalinks, and edge rate limiting.
4. **Repoint the live surface.** Delete `apps/site/lib/provider.live.ts`; point `LiveReportClient` at the scanner's scan API and render the sealed report in place (D6).
5. **Convert the store to build inputs.** Flip `apps/site/reports/` from a gitignored runtime store to a tracked, synced build input; add the sync step; prerender `/reports` and `/reports/[runId]` with `dynamicParams = false`.
6. **Remove the old routes and enforce the boundary.** Delete `apps/site/app/api/scan/route.ts` and `apps/site/app/api/reports/[runId]/route.ts`; add the source-graph check to `tooling/checks/`.
7. **Record the decisions.** `docs/plans/11_WEBSITE_SPEC.md` §6 gains a deployment-topology row; append a decisions-log entry to `docs/plans/00_MASTER_INDEX.md` as the counterpart to W4 (data seam) and W9 (location).

Each step is independently landable and leaves the system working. Steps 1–2 are pure refactors (no behavior change). Step 3 adds a deployable without removing anything. Steps 4–6 are the cutover; step 4 must land before step 6 so the live surface never points at a deleted route.

**Rollback:** steps 1–2 and 7 are revertible individually. Step 3 is additive. The cutover (4–6) reverts as a unit; the old routes stay in git history and the scanner is additive, so reverting restores the pre-change topology without data loss — no envelopes are rewritten in place at any step.

## Open Questions

- The scanner's canonical durable storage backend (tracked git directory, object storage, or a database). Deferrable: D5's sync step is the seam, so this choice does not change the website's spec, the approach, or the task breakdown.
- Envelope retention and size cap for the ingested set. Deferrable: retention is the scanner's policy; the website ingests whatever the sync step provides.
- Whether the browser-facing scan API eventually needs a challenge (Turnstile or similar) beyond per-IP rate limiting. Deferrable: it changes no contract.
