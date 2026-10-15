## Context

See proposal.md — Why. Current state: `GatesTable` (`apps/site/components/gates-table.tsx:22`) always renders 8 rows in an `instrument-panel` table; `CategorySection` already collapses per indicator via `Accordion`. Live scan (`apps/site/app/live/LiveReportClient.tsx:195-229` scanning branch vs `234-292` report branch) holds progress in a sticky top bar (`pct`, `elapsedMs`, `remainingMs`, `completedIds` count) fed by `GET /api/scan` NDJSON (`app/api/scan/route.ts:24-86` — `meta` + heartbeat `progress` + terminal `report`). Orchestrator (`packages/engine/orchestrator.ts:46-168`) yields `meta` then one GH-batch `progress` then clone-detector batch then `done`; per-detector incremental progress is coarse today.

Reuse existing primitives: `Collapsible` / `Accordion` (`components/ui/collapsible.tsx`, `accordion.tsx`) already provide `aria-expanded`, animation, keyboard. No new deps, no scoring changes.

## Goals / Non-Goals

**Goals:**
- Move gates from dominant table to one-line summary by default, with `proven` still visible without interaction.
- Make the scan feel alive (append-only narrative) and eliminate the hard DOM swap at seal.
- Keep `/api/scan` additive (optional `milestone` field only) and report shape unchanged.

**Non-Goals:**
- Gate predicate or weight changes (rollup `packages/engine/scorer/rollup.ts:78` untouched).
- Streaming partial scores — timeline is narrative only; headline/categories render once at seal.
- New routing — `/live` and `/report/sample` stay as-is.

## Decisions

**Gates cockpit — summary strip + grouped detail**
- Summary: `X proven · Y needs verification · Z clear` pills with `STATUS` dot colors from `gates-table.tsx:3`, plus inline peek of each `proven` gate's `note` (one line, truncates). Counts derived from `gates: Gate[]` prop; no hard-coded 2/6 — label adapts to actual distribution.
- Detail: on `Expand`, render grouped table `Proven (n)` → `Needs verification (n)` → `Not proven (n)` using `Collapsible` (single toggle) or `Accordion` (per-group). `proven` group `defaultOpen=true` when `n>0`; others `defaultOpen=false`. Alternative considered: flat 8-row table behind same toggle — rejected, grouping makes the capping gates instantly identifiable without scanning all 8.
- Both surfaces (`LiveReportClient:269` and `report/sample/page.tsx:83`) import the same component — no fork.
- Print / `prefers-reduced-motion` expands table; collapsed state is presentation, not data loss.

**Scan timeline — milestone stream + completion deltas**
- Client maintains `timeline: {t, label}[]` appended from NDJSON. Source: existing `completedIds` delta plus new optional `milestone` string per frame (e.g. `Ingested django/django`, `GH detectors 6/6`, `Clone + sniff`, `Scoring`). If `milestone` absent, client derives labels from `completedIds` length changes and known phase boundaries (GH batch vs clone). This keeps route change minimal and backward-compatible — old clients ignore `milestone`.
- Orchestrator change kept small: yield an extra `progress` with `milestone` at ingest success, after GH batch (`orchestrator.ts:97`), at clone start/complete (`orchestrator.ts:114-158`), and before `done`. No per-detector fan-out yet; per-indicator deltas already give 6+13 rows of narrative if desired, but coarse milestones suffice for the first cut. Alternative considered: streaming per-detector `Promise.allSettled` races — deferred to follow-up to keep budget controller simple.
- Sticky bar unchanged (percent/elapsed/remaining + 200ms tick `LiveReportClient:48-60`). Timeline lives in the former static box `LiveReportClient:224-227`.

**Reveal transition — sealed → revealed**
- State machine: `scanning` → `sealed` (report received, `sealed=true` today at `LiveReportClient:118`) → `revealed` (new `showReport` boolean). At `sealed`, timeline freezes, CTA `Reveal report` (or `Reveal partial report — 14/19 measured` when `coverage.measured < indicatorCount`) anchors below timeline. On click, `showReport=true` and report section animates in (`opacity` + `translate-y`, respects `prefers-reduced-motion`). Timeline collapses to `Show scan log (n steps)` link that re-expands via same `Collapsible`. URL stays `/live?repo=...`.
- Background-tab auto-reveal: if `document.hidden` at seal, set a 2–3s timer that flips `showReport` automatically so returning users don't see a stale CTA. Alternative considered: auto-reveal always — rejected, the manual reveal preserves context and avoids the jarring swap the proposal calls out; timed fallback is the compromise.
- No intermediate report: `scoreMvp` still called once at `route.ts:66` before the terminal `report` frame; timeline never shows scores before seal.

## Risks / Trade-offs

- **[Risk] Proven gate hidden behind collapse** → Mitigation: summary peeks every `proven` note inline + `Proven` group default-open; spec makes this normative.
- **[Risk] Timeline noise if per-indicator** → Mitigation: start with milestone-level (5–7 rows) and only add per-indicator deltas if user testing shows the bar alone feels idle; timeline container capped with `max-h` + scroll.
- **[Risk] Layout shift on reveal** → Mitigation: report container reserves space with `min-h` and animates in; sticky bar stays fixed so scroll position doesn't jump.
- **[Risk] Auto-reveal vs manual tension** → Mitigation: manual by default, auto only when tab hidden; telemetry can tune the delay.
- **[Risk] NDJSON additive field ignored by old clients** → Mitigation: `milestone` optional, client falls back to derived labels; no breaking change to `meta`/`progress`/`report` union.

## Migration Plan

- Ship behind no flag — visual change only, no data migration.
- Deploy order: `GatesTable` collapsed change → timeline + reveal in `LiveReportClient` → optional `milestone` in `route.ts`/`orchestrator.ts`.
- Rollback: revert to previous `GatesTable` table and static scanning box; no schema to unwind.

## Open Questions

- Final wording for the summary strip: `clear` vs `not proven` vs `no flag` — defer to copy review, no spec impact beyond count semantics.
- Whether timeline should auto-collapse to the header's provenance line after reveal vs staying as a distinct section — defer to first usability pass.
