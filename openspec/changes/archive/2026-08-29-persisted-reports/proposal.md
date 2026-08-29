## Why

Live scans are ephemeral: every `/live?repo=` visit re-runs the engine and leaves no trace. Users cannot share, revisit, or compare runs; developers cannot debug a past report without re-scanning and paying the GH/clone budget again. Persisting each run as a timestamped JSON file under `apps/site/reports/` gives durable, shareable history at near-zero infra cost and enables a run-list page for auditability.

## What Changes

- **Persist every completed scan** as a single JSON file under `apps/site/reports/` on the `done` path of `GET /api/scan`. Filename is the run identity; directory is gitignored. No DB, no pruning.
- **Run identity in filename and URL.** `runId = <repoSlug>__<engineSha7>__<ts>` where `repoSlug = owner__repo` (lowercased, dots preserved, double-underscore separator), `engineSha7` is the scanner's commit (7-char, `unknown` fallback), and `ts` is ms-precise file-safe ISO (`2026-08-29T053000-123Z`). Without a `runId` the scan is always fresh; with a `runId` the report is loaded from disk.
- **Single-file envelope** per run: `{ meta, report }` where `meta` is the list-view header (repo, ranAt, durationMs, budgetMs, repoSha, score, tier, status, engine/rubric versions) and `report` is the full `Report` contract already sent over the stream.
- **Two new read surfaces:** `GET /reports` lists runs from `readdir` + `meta` (sorted `ranAt` desc), and `GET /reports/[runId]` reads one file and renders the sealed report UI without invoking the engine. Invalid/missing `runId` 404s.
- **Capture `repoSha` in report snapshot** (the scanned repo's HEAD from `shallowClone`) and surface it in `meta`; capture `engineSha7` at scan time for the filename. GH-only scans keep `repoSha: "unknown"`.
- **No cache on `/live`.** `GET /api/scan?repo=` never short-circuits to a cached file; it always scans and writes a new `runId`. Reruns are explicit by visiting `/live` again.

## Capabilities

### New Capabilities
- `reports/persisted-runs`: Persisted scan runs as timestamped JSON files keyed by run identity, plus list and detail read surfaces; envelope schema, filename grammar, and fresh-vs-cached routing semantics.
- `reports/run-history-ui`: Run-history UI — list table (repo, score, tier, ranAt, duration/budget, engineSha, status, link) and persisted-detail view reusing the sealed report rendering.

### Modified Capabilities
- No existing spec path requires a delta. `scan-phase-1`, `scan-phase-2`, and `report-rendering` keep their contracts; this change extends the scan route with a write side-effect and adds a storage/UI layer beside them. If `report-rendering` needs a delta for the detail route's reuse of row rendering, it can be noted at spec stage.

## Impact

- `apps/site/app/api/scan/route.ts` — write-on-done side effect, capture `engineSha7`/`durationMs`/`repoSha` into `meta`.
- `apps/site/reports/` — new gitignored directory; each run ~150–300 KB JSON.
- `apps/site/app/reports/page.tsx` and `apps/site/app/reports/[runId]/page.tsx` — new routes (or `app/report/[runId]` depending on final routing); reuse `LiveReportClient` sealed branch / `CategorySection`/`GatesTable` for detail.
- `packages/engine/orchestrator.ts` snapshot gains `scanned_commit` (repo HEAD) so the site has a `repoSha` to persist.
- Env/build: `LEAPSCORE_SHA` / `VERCEL_GIT_COMMIT_SHA` or `git rev-parse --short HEAD` fallback for `engineSha7`.
- Local durability only: `reports/` on Vercel is ephemeral and wiped on redeploy/scale-to-zero. Follow-up storage swap (Blob/S3) can reuse the same `runId` grammar if hosted history becomes required.
