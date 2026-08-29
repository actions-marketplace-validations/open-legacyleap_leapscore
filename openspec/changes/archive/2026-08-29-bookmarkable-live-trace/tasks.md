## 1. Envelope and types

- [x] 1.1 Extend `TraceEntry` in `apps/site/lib/reports.ts:125-133` with `phase`, `detectorId`, `durationMs`, `status`, `errorKind` and verify `writeReportEnvelope`/`readReportEnvelope` round-trip with extended entries
- [x] 1.2 Update `ReportEnvelope` persistence to treat missing `trace` as `[]` on read and verify pre-change envelope loads without error

## 2. Orchestrator exhaustive trace emission

- [x] 2.1 Instrument ingest/budget seam in `packages/engine/orchestrator.ts:66-94` to yield `trace` for normalize + `budgetMs/breakdown` + refusal path, and verify trace count includes ingest + budget entries in a GH-only scan
- [x] 2.2 Instrument GH detectors (`orchestrator.ts:97-123`) to yield per-detector `trace` (start/finish with durationMs/status) alongside existing bulk `progress`, and verify 6 detector traces appear for a GH-only requested set
- [x] 2.3 Instrument clone seam (`orchestrator.ts:138-207`) — shallow-clone start/end (bytes/commit), sniff manifest count, per clone-detector finish — and verify clone-dependent scan yields ≥25 detector traces plus clone/sniff entries
- [x] 2.4 Instrument scoring/seal/budget-abort (`orchestrator.ts:193-217`) and verify seal entry carries `measured/X measured` and seal is last entry

## 3. Scan route forwarding and persistence

- [x] 3.1 Update `apps/site/app/api/scan/route.ts:56-114` to forward `type:"trace"` frames immediately via NDJSON and collect them into the `trace` array, and verify live `curl --no-buffer /api/scan?repo=...` emits interleaved `trace` + `progress` frames
- [x] 3.2 Ensure persisted envelope writes `{meta,report,trace}` atomically in `route.ts:169-191` with ordering by `elapsedMs` and verify `GET /api/reports/<runId>` returns `trace` identical to streamed order
- [x] 3.3 Handle coalesced StrictMode follower stream to replay `trace` in terminal `report` and verify concurrent `GET /api/scan?repo=same` produces one file with correct trace

## 4. Live page timeline + bookmarkable Reveal

- [x] 4.1 Update `apps/site/app/live/LiveReportClient.tsx:23-50` to consume `type:"trace"` (append `traces[]`), derive milestones primary vs detector secondary, and verify timeline shows milestones by default with collapsed detector section expandable
- [x] 4.2 Change Reveal CTA from inline `showReport` to navigation `router.push('/reports/<runId>')` using `meta.runId` from terminal `report` frame, prefetch, and verify click navigates to `/reports/<runId>` and reload keeps same report
- [x] 4.3 Handle background-tab auto-reveal as navigation (not inline) and verify `document.hidden` at seal navigates after ≤2s

## 5. Detail page persisted trace rendering

- [x] 5.1 Update `apps/site/app/reports/[runId]/page.tsx:36-53` to render persisted `trace` with same primary/secondary grouping as live, and verify persisted detail matches live sealed output plus scan log
- [x] 5.2 Handle pre-change envelope missing `trace` as empty log and verify no 500 on old file

## 6. Verification

- [x] 6.1 Run `GET /live?repo=vercel/next.js` end-to-end: bar + live milestone + expandable detector trace → Reveal → `/reports/<runId>` with same score/trace, and verify bookmark reload without re-scan
- [x] 6.2 Run `npm run build` and `vitest` for site, verify no NDJSON or type regressions
