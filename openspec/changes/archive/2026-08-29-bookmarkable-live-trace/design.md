## Context

See proposal.md — Why. Current state: `GET /api/scan` (`apps/site/app/api/scan/route.ts:62-217`) streams NDJSON `meta`/`progress`/`report` and writes envelope `{meta,report,trace}` where `trace` today is a small milestone-level array built from orchestrator milestones plus `completedIds` deltas. `LiveReportClient.tsx:23-476` holds a `timeline: {ts,label}[]` appended from `progress.milestone` / `completedIds`, shows a sealed `Reveal report` CTA that reveals inline without navigation (URL stays `/live?repo=...` per `scan-phase-1` prior spec). `orchestrator.ts:66-217` yields one bulk `progress` after GH batch and after clone batch — no per-detector events. `/reports/[runId]` already renders persisted `trace` verbatim. Envelope type is `lib/reports.ts:135-139`.

## Goals / Non-Goals

**Goals:**
- Make every seam observable live without resampling, and make the sealed report bookmarkable via `/reports/<runId>`.
- Keep change additive and backward compatible (old envelopes, old clients).
- Preserve milestones-as-primary narrative while exposing exhaustive per-detector detail on demand.

**Non-Goals:**
- Storage durability migration (Vercel ephemeral FS vs R2/DB) — keep local `reports/` as is.
- Privacy redaction or trace filtering.
- Scoring or budget policy changes.
- Streaming partial scores — timeline stays narrative.

## Decisions

**NDJSON `trace` as separate frame**
- Add `type:"trace"` frames carrying `{ ts, elapsedMs, label, phase, detectorId?, durationMs?, status?, errorKind? }` alongside existing `progress`. Reuse current `TextEncoder` NDJSON pipeline in `route.ts:63-114`. Alternative: overload `progress.milestone` — rejected, that field is a single string and already drives the bar; per-detector fan-out needs structured data. Keeping `progress` for bar math and `trace` for log keeps both concerns clean. Old clients ignore unknown `type`.

**Orchestrator instrumentation — per-detector timing without changing concurrency**
- GH path: wrap each `detectVel06` etc. with start timestamp, `Promise.allSettled` still runs in parallel, but after settlement iterate detectors in completion order and `yield {type:"trace", phase:"detector", detectorId, durationMs, status}` for each. Yearned alternative `Promise.race` streaming was considered — deferred, settlement-order is enough for 6-way parallelism and avoids complicating budget signal handling.
- Clone path: similarly instrument `shallowClone` start/end (bytes + commit), `sniffEcosystems` (manifest count), then per clone detector. Clone detectors already run under queue concurrency 1 with inner `Promise.allSettled`; emit trace per detector there too.
- Ingest/budget/scoring/seal: emit trace at `ingestRepoUrl` success/refusal, at `getUnifiedBudget`/`createBudgetControllerForIndicators` (budgetMs + breakdown), and before `done` (scoring/gate, seal label). Reuse existing `elapsedMs = Date.now()-start`.

**Route as trace forwarder + collector**
- Route maintains same `trace: TraceEntry[]` array but now both appends milestone traces and forwards every orchestrator `trace` frame immediately via `send({type:"trace", ...})`. Final `send({type:"report", trace})` still carries the full array for clients that only read terminal frame. Persist `{meta, report, trace}` in same write as today (`route.ts:171-191`). Coalesced StrictMode follower stream replays `meta` then terminal `report` with full `trace`.

**Live client timeline — primary/secondary**
- Client maintains `traces: TraceEntry[]` (appended from `type:"trace"`). Derived `milestoneRows = traces.filter(t=>t.phase!=="detector")`, `detectorRows = traces.filter(t=>t.phase==="detector")`. Milestones render always; detector rows render inside `Collapsible` defaultClosed with trigger `Show detector trace (N)`. Keeps fallback: if server is pre-change (no `trace` frames), client still builds `timeline` from `progress.milestone`/`completedIds` as today.
- Reveal CTA: at seal, `report` + `meta.runId` are now both in hand. `onClick` does `router.push(`/reports/${encodeURIComponent(meta.runId)}`)` via `next/navigation` plus prefetch. Alternative `history.replaceState` on `/live` was considered — rejected per user's confirmed choice: live is interstitial, the shareable URL is `/reports/<runId>`. Keep `showReport` state for background-tab auto-reveal path? No — since reveal now navigates, the inline reveal + `showReport` boolean is removed; auto-reveal for `document.hidden` navigates after 2s instead of inline.

**Envelope `trace` ordering + bounds**
- Define `TraceEntry` extension in `lib/reports.ts:125-133` with new optional fields `phase`, `detectorId`, `durationMs`, `status`, `errorKind`. Order by `elapsedMs` ascending (stable). No cap initially per user; add guard at 200 entries: drop oldest non-seal entries and prepend sentinel `{label:"… N earlier entries truncated", phase:"budget"}`.

## Risks / Trade-offs

- **[Risk] Navigation loses scroll/transition context** → Mitigation: `/reports/[runId]` renders the same `ReportView` + scan log with same grouping, so user lands on familiar layout; add `prefetch` on Reveal button and preserve `repo` in breadcrumb.
- **[Risk] 31 detector rows spam timeline on fast GH path** → Mitigation: per-detector collapsed by default; progress bar still shows cost-weighted pct so fast detectors don't dominate visual time.
- **[Risk] Orchestrator per-detector emit adds latency to first trace** → Mitigation: GH batch emits traces immediately after `allSettled` (not per-race), so at most one batch delay (~GH latency) before any detector row appears; clone batch similar.
- **[Risk] Old envelope without `trace` on `/reports/[runId]`** → Mitigation: treat missing `trace` as `[]`, render empty scan log, no crash.
- **[Risk] `runId` not yet persisted when Reveal clicked quickly (race)** → Mitigation: `meta.runId` is derived deterministically from `ranAt` before write; navigation uses that value regardless of write success; write failure is already best-effort and logged. Detail page 404 with retry if file missing.

## Migration Plan

- Deploy order: orchestrator trace yield → route `trace` forwarding + envelope write → client timeline + Reveal navigation → detail page trace rendering. Each step is independently revertible.
- Rollback: revert `LiveReportClient` Reveal to inline and ignore `trace` frames; old envelopes remain readable.
- No data migration; existing `reports/*.json` unchanged.

## Open Questions

- Exact copy for `Show detector trace (N)` vs `Show scan log` collapsed label after seal — defer to implementation.
- Whether list page `/reports` should show per-run trace count badge — defer, no spec impact.
