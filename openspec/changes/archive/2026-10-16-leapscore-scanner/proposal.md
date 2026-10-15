## Why

The scanner runs inside the marketing website's Next.js server. `apps/site/app/api/scan/route.ts` dynamically imports `packages/engine/orchestrator`, keeps a module-level single-flight `Map`, holds a request open for up to 240s while it shallow-clones a repo and streams NDJSON, then writes report JSON to `apps/site/reports/` with `node:fs` — and resolves the engine's identity with `node:child_process.execSync("git rev-parse --short HEAD")` inside a request handler. Two halves that have nothing in common share one deploy artifact.

The collapse is already producing artifacts that make no sense. `apps/site/out/` is a real `next build` output from 30 Aug, and it contains:

- `reports.html` — the run-history index, statically baked with **no run rows**, while 13 report JSONs sat on disk at build time.
- `reports/placeholder__unknown__2026-01-01T000000-000Z.html` — a prerendered **report detail page for a runId that never existed**, with a fabricated timestamp and engine SHA `unknown`.

Why now: the boundary is already specified and simply was never provisioned. `docs/plans/08_SECURITY_ACCESS_MODEL.md` §2 requires the untrusted-repo scan to run isolated ("all scanning runs in LeapScore infrastructure"; temp clone under an anonymous mount; no egress from the sandbox), and `scan-phase-2` already describes an in-process queue "swappable to external queue". Meanwhile `packages/engine/runner.ts`, `store.ts`, `scheduler.ts`, and `registry.ts` are stubs whose file headers describe exactly this service — `runner.ts` even names the network allow-list. Three of the five service modules exist as headers and no implementations.

## What Changes

- Introduce **`leapscore-scanner`** as the standalone *produce* side: owns scan execution, the clone/sandbox path, the GH-token boundary, and the report store. Named `scanner`, not `app`, so the name stays true when the planned logged-in product surface (`10_ROADMAP.md` line 55, `09_MONETIZATION_TIERS.md` line 24) arrives as a third thing.
- The website becomes **present-only**: renders reports, never executes a scan, never holds a GH token, never touches the filesystem on request.
- Establish the **report envelope contract** as a versioned artifact owned by the *producer*. Today the producer does not know the shape of what it produces: `packages/engine/seal.ts` types its output `Record<string, unknown> & { headline… }`, `packages/engine/scorer/index.ts:7` declares a degraded `Report` with `unknown[]` fields, and the authoritative 165-LOC `Report` lives in the *consumer* (`apps/site/lib/types.ts`). `packages/engine/seal.ts:41` also copies 6 grammar functions and the `SealMeta`/`SealTraceEntry` types verbatim from `apps/site/lib/reports.ts`, with the comment "duplicated so CLI has no site dep".
- Establish the **scan API** as a versioned wire protocol: the existing NDJSON frames (`meta`, `progress`, `trace`, `report`, `refused`) with explicit versioning, cross-origin access, and abort semantics — because `/live` must stream 240s of progress from a different origin than it renders on.
- Delete `apps/site/lib/provider.live.ts` (182 LOC). It is unreachable today: `getReportProvider()` is called only from `apps/site/app/page.tsx:10` **with no arguments**, so `liveFlag` is always false and the live branch never runs. The designed seam (W4) is dead while the actual live path bypasses it entirely — which is how the engine ended up in-process.
- Stop stamping report identity from the wrong repository. The site's `resolveEngineSha7` shells out to `git rev-parse` and records the *website* commit; `packages/engine/seal.ts:79` has a second, correct implementation that takes an explicit `--engine-ref`. The scanner owns provenance in one place.
- **BREAKING** (internal, no public URL changes): the site no longer imports `packages/engine` at runtime; the report store no longer lives under `apps/site/reports/`; `GET /api/scan` and `GET /api/reports/[runId]` stop being same-origin website routes.

## Capabilities

### New Capabilities

- `scanner-service`: the scanner as a standalone produce-side service — scan execution, the trust/sandbox boundary for untrusted repos, GH-token custody, store ownership, and the check that the present side carries no engine runtime dependency.
- `scan-api`: the versioned scan wire protocol — the NDJSON frame stream over HTTP (`meta`/`progress`/`trace`/`report`/`refused`), cross-origin, abortable, and independently deployable from any consumer.
- `report-envelope`: the single versioned definition of the report/envelope contract and the `runId` grammar, owned by the producer and consumed by the site, the CLI, and the workflow.

### Modified Capabilities

- `scan-phase-2`: the clone/worker pipeline's "in-process queue for MVP, swappable to external queue" resolves to the scanner service rather than the website process.
- `reports/persisted-runs`: the envelope store no longer lives at `apps/site/reports/`; the present side stops writing envelopes entirely.
- `reports/run-history-ui`: run history and the detail view stop reading the local filesystem at request time.
- `scan-trace`: the persisted trace path and the transport carrying `trace` frames change with the boundary.
- `scan-phase-1`: the live report page consumes the scanner's scan API instead of a same-origin `/api/scan`.
- `report-rendering`: the scenarios that name `apps/site/lib/provider.live.ts` as a row builder no longer have that file to name.

## Impact

- **Code — moves:** `packages/engine/**` (orchestrator, seal, clone, gh, budget, archetype, ingest, detectors) plus the service stubs `queue.ts` / `store.ts` / `runner.ts` / `scheduler.ts` / `registry.ts`; `apps/site/app/api/scan/route.ts`; the write half of `apps/site/lib/reports.ts` (`getReportsDir`, `ensureReportsDir`, `writeReportEnvelope`, `listReportMetas`, `resolveEngineSha7`).
- **Code — deleted:** `apps/site/lib/provider.live.ts`; the site's `execSync`-based `resolveEngineSha7`.
- **Code — split:** `apps/site/lib/reports.ts` (244 LOC) separates pure `runId` grammar (shared) from the filesystem store (scanner); `apps/site/lib/types.ts` separates the wire contract (producer-owned) from render-only concerns like `verdict_text` and `remediation`.
- **Tooling:** `tooling/scripts/compile-rubric.ts` writes into **both** `packages/engine/rubric.json` and `apps/site/lib/generated/rubric.ts` (71KB) — the derived rubric acquires consumers on both sides of the boundary.
- **Workflow:** `.github/workflows/leapscore-scan.yml` pins `LEAPSCORE_ENGINE_REF` and consumes the engine by git ref — a third consumer of the produce side that already treats a report as a *file* (`--out leapscore-report.json` + `upload-artifact`), not as a database row.
- **Docs:** `docs/plans/11_WEBSITE_SPEC.md` contains **zero** deployment-topology statements (`grep -c "static|deploy|vercel|edge|runtime|host"` → 0). Decisions W4 (data seam) and W9 ("website lives in `apps/site/`") were agreed when the site was demo-only mock data; W14 ("engine stays future-gated") was overtaken by the live scan shipping before any counterpart decision said *where* the engine runs.
- **Deployment:** the present side becomes CDN/static-eligible — 12 of 15 routes already are; only `/api/scan`, `/api/reports/[runId]`, and `/reports/[runId]` are serverful. The scanner needs node, git, tokens, and durable storage.
- **Open decisions (recorded in `design.md`, not decided here):** (1) whether the report store relocates in this change or a follow-up; (2) one monorepo with two apps vs. two repositories. 14 of 32 commits touch both trees, so the answer to (2) determines whether that co-change stays a workspace edit or becomes cross-repo PR pairs.
