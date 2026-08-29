## Why

Live scans currently seal inline on `/live?repo=...` with no permalink — copying the URL re-runs the scan. Users also only see coarse milestones while the engine works, with no per-detector visibility until the sealed report appears, obscuring progress, budget, and failure attribution.

## What Changes

- **Bookmarkable permalink on Reveal:** After seal, the CTA navigates to the persisted report at `/reports/<runId>` (existing plural route) so the URL contains the run's `runId` and is shareable/bookmarkable. Copying that URL reloads the same frozen report without re-running. The interstitial `/live?repo=...` remains the generation surface; sharing shifts to `/reports/<runId>` only at Reveal.
- **Stream all trace live:** Instrument the unified orchestrator + scan route to emit an additive NDJSON `trace` event for every traceable seam (ingest/normalize, GH API calls, per-detector start/finish with duration + status, clone/shallow-clone bytes + commit, manifest sniff, scoring/gate evaluation, budget abort) and render it live on `/live` as an append-only timeline.
- **Milestones primary, per-detector expandable secondary:** Timeline shows milestones as default rows; per-detector completions collapse behind an expandable secondary section to keep noise low while retaining exhaustive visibility.
- **Persist exhaustive trace:** The envelope `{ meta, report, trace }` retains the full trace (no sampling). `trace` is kept verbatim across reloads. Privacy filtering deferred.
- **BREAKING (spec only):** Amends prior "URL stays `/live?repo=...`" promise — post-reveal URL becomes `/reports/<runId>`.

## Capabilities

### New Capabilities
- `scan-trace`: Exhaustive live scan tracing — per-seam trace events streamed via NDJSON, persisted in the envelope, and rendered as a live append-only timeline with expandable per-detector detail.

### Modified Capabilities
- `scan-phase-1`: Live report page reveal navigates to `/reports/<runId>` for a bookmarkable permalink; live page remains the generation surface.
- `reports/persisted-runs`: Envelope gains `trace` array; file identity and shareability via `runId` in URL.
- `reports/run-history-ui`: Detail view surfaces persisted trace alongside the sealed report.

## Impact

- **Code:** `packages/engine/orchestrator.ts` (per-detector instrumentation + trace events), `apps/site/app/api/scan/route.ts` (NDJSON `trace` forwarding + trace persistence), `apps/site/app/live/LiveReportClient.tsx` (timeline with primary/secondary + Reveal → `router.push /reports/<runId>`), `apps/site/lib/reports.ts` (envelope `trace` type), `apps/site/app/reports/[runId]/page.tsx` (render persisted trace).
- **APIs/Specs:** NDJSON adds optional `trace` frame (backward compatible); `runId` becomes the shareable identifier consumers should store.
- **Systems:** No storage migration; ephemeral `apps/site/reports/` persists as today. Privacy redaction explicitly out of scope.
