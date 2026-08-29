## Context

See proposal.md — Why. Current engine splits into `orchestrator.phase1.ts` (GH-API 6 rows, 10s) and `orchestrator.ts` two-phase generator (`phase1-done → cloning → sniffing → scanning 13 → done`) streaming NDJSON via `apps/site/app/api/scan/route.ts` to `LiveReportClient.tsx`. Client holds `STEPS` with per-phase labels, renders `phase1` report as `6/102` dial within ~6s, then replaces with `19/102` final while `elapsed` via `setInterval(200ms)` keeps ticking after seal. Budget lives in `packages/engine/budget.ts` with generic `budgetForIndicators(ids)` but route/orchestrator hardcode `6→10s / 13→240s` special cases and two separate budgets. Specs `scan-phase-1` + `scan-phase-2` mandate the two-phase display and streaming contract.

Constraints: D5 no repo code execution, `docs/specs/README.md` strict N/A, `check:detector-isolation`, fail-open per-detector, GH rate-limit bucket shared.

## Goals / Non-Goals

**Goals:**
- Single top progress bar (pct + elapsed + remaining) driven by one indicator-count budget; report rendered exactly once at budget expiry or all-done, whichever first.
- Remove all "Phase 1 / Phase 2" strings from UI and API contract; phases become internal if retained, otherwise collapsed.
- Budget = `baseMs + Σ costClass` generic formula, no hardcoded length checks; bar reaches 100% at `budgetMs`.
- Timer freezes at seal; coverage reflects `measured/requestedCount` once.

**Non-Goals:**
- Adding an indicator picker UI (future); MVP default remains 19 rows, but budget must already scale if `indicatorIds` param is introduced.
- External queue / persistence (still in-process queue for MVP).
- Changing detector tool pins, schemas, or scoring formula — only orchestration/streaming/progress.

## Decisions

**Decision: Thin hide first, deep merge second (two-step internal).**
- *Choice:* Keep `runPhase1Scan` + clone path internally for this change but merge their budgets into one `AbortSignal` and coalesce NDJSON into unified `progress` frames. Route no longer sends `{type:"phase1", report}`; it sends `{type:"meta", budgetMs, indicatorCount}` header then `{type:"progress", elapsed, remaining, pct, completedCost, totalCost}` throttled (~200ms), then single `{type:"report"}`.
- *Rationale:* Minimal risk, preserves proven GH vs clone isolation while fixing UI split. Deep merge into `runScan(repoUrl, {indicatorIds})` can follow without changing the new contract.
- *Alternatives:* Full collapse to `runScan` now — cleaner but larger blast radius (touches `budget.ts:73-74` special cases, `orchestrator.ts` generator phases, `orchestrator.phase1.ts` reuse). Rejected for staged safety.

**Decision: Hybrid bar pct (`max(timePct, costPct)` weighted 60/40).**
- *Choice:* `timePct = elapsed / budgetMs`; `costPct = completedCost / totalCost` where `completedCost` sums `BUDGET_COST` of finished detectors. Reported `pct = 0.6*timePct + 0.4*costPct` clamped `[0,100]`, monotonic. Remaining = `budgetMs - elapsed` countdown.
- *Rationale:* Pure time bar feels honest for budget contract; pure indicator jumpy when `slow-dissolvable` dominate tail. Hybrid keeps bar moving even when `lizard/jscpd` stall and still hits 100% exactly at deadline.
- *Alternatives:* Time-only — simple but bar stalls if detectors finish early before timeout, users expect faster completion. Indicator-only — bursty. Chose hybrid with configurable weights.

**Decision: NDJSON contract v2 — header + progress + terminal report.**
- *Choice:* First frame: `{type:"meta", budgetMs, indicatorCount, budgetBreakdown}`. Mid frames: `{type:"progress", pct, elapsedMs, remainingMs, completedIds, completedCost}`. Terminal: `{type:"report", report}` or `{type:"refused", ...}`. Drop `{step, status}` and `{type:"phase1"}`. Client stops setting report on any mid frame.
- *Rationale:* Lets bar compute `remaining` without parsing steps; header enables bar max without waiting for detectors. Backwards compat not needed (internal API).
- *Alternatives:* Keep `step` frames and map them to pct — leaks phase labels again. Server-Sent Events — rejected, adds plumbing for same shape.

**Decision: Freeze elapsed at seal.**
- *Choice:* Start `performance.now()` at fetch, derive `elapsedMs` on each progress frame; on `report`/`refused` clear interval and lock display to `budgetMs` or actual seal time. Do not keep `setInterval(200)` after seal.
- *Rationale:* Current bug — timer keeps ticking after report. Fixed by tying timer lifecycle to stream terminal frame, not component mount.
- *Alternatives:* Local timer only — drifts from server budget; server-authoritative elapsed per frame is source of truth.

**Decision: Generic budget replaces special cases.**
- *Choice:* Remove `packages/engine/budget.ts:73-74` `if (ids.length===6) return 10_000 / if (ids.length===13) return 240_000`. Keep `budgetForIndicators` formula `base 5s|30s + Σ` + clamp `[10s,240s]` as sole path. MVP 19 still yields ~240s via formula (verify: 30 + 5*5 + 5*10 + 3*40 = 225s → clamped 240s stays true).
- *Rationale:* Required for "based on which indicators are selected" — hardcoded lengths defeat scaling.
- *Alternatives:* Keep special cases as overrides — rejected, hidden coupling.

**Decision: Score once at seal (no intermediate `scoreMvp`).**
- *Choice:* Route collects all facts (GH + clone) in orchestrator, calls `scoreMvp` / `scorePhase1` only at terminal seal. No `scoreMvp` on partial 6-row set.
- *Rationale:* Report "on what all has been figured out in one go" must include GH + clone rows together. Intermediate scoring would double-derive and could diverge from final.
- *Alternatives:* Score incrementally for optimistic UI — leaks phases again.

## Risks / Trade-offs

- **Loss of <10s early feedback → perceived slowness for 4-min budget** → Mitigation: continuous bar + countdown + `completedIds` hint ("8 of 19 indicators complete") keeps motion; consider skeleton table behind bar.
- **Budget expiry may cut slow detectors (`ARCH-01`/`ARCH-08`/`ECOS-05`) → more `unknown` than before** → Mitigation: same fail-open semantics; `sampleN` dissolve + `estimated` already covers it; surface "budget-exceeded" reason in final report.
- **Hybrid pct may mislead if many fast detectors finish early (bar jumps)** → Mitigation: weight 60/40 dampens jumps; smooth animation via CSS transition; remaining countdown is truthful.
- **Stream backpressure: single long-lived NDJSON for 240s may hit proxy timeouts** → Mitigation: send heartbeat `progress` every ~2s even when idle; keep `Content-Type: application/x-ndjson` with `cache-control: no-cache`.
- **Spec churn: two-phase requirements removed, clients that parsed `phase1` break** → Mitigation: breaking but internal; update `/live` client in same change, document in proposal Impact.
- **Clone failures mask GH facts if not isolated** → Mitigation: GH facts still sealed even if clone throws (orchestrator catches clone error, returns GH facts + clone rows as `unknown`).

## Migration Plan

1. Ship behind no flag — this is the new contract. Phase branch: merge `budget.ts` generic formula, `orchestrator` unified budget, `route.ts` header+progress contract, `LiveReportClient.tsx` bar + frozen timer.
2. Update specs `scan-phase-1` + `scan-phase-2` deltas in same change; validate `openspec validate --strict`.
3. Manual dogfood 5 repos (e.g. `vercel/next.js`, `django/django`) — verify bar 0→100% + countdown matches `budgetMs`, report appears once, degraded on timeout.
4. Rollback: revert to previous `route.ts` + client `STEPS` + `phase1` frame — no data migration (stateless).

## Open Questions

- Future indicator picker cardinality: will user select arbitrary subsets or preset profiles (MVP 19 vs full 102)? Determines whether `indicatorIds` becomes a URL param and whether budget header needs per-category breakdown.
- Desired bar granularity: pure percent+countdown or also `completedIds` ticker ("ECOS-01 done")? Decide in UI polish, does not affect budget/progress contract.
