## MODIFIED Requirements

### Requirement: 10-second fail-open budget
The system SHALL bound every scan to a single wall-clock budget computed from its **requested indicator list** (`cloneBaseMs + Σ per-indicator cost` where `fast=5s`, `api-budgeted=10s`, `slow-dissolvable=40s`, clamped `[10s, 240s]` for MVP; `cloneBaseMs=30s` when any `slow-dissolvable` indicator is requested else `5s`). The generic formula replaces the prior hardcoded `6→10s / 13→240s` mapping. Any detector that exceeds its per-call timeout or the global budget SHALL return a degraded fact and the orchestrator SHALL still seal a single terminal report when the budget expires or all detectors complete, whichever comes first.

#### Scenario: One slow endpoint does not block hero dial
- **WHEN** `GET /repos/{o}/{r}/pulls?state=closed` takes 7s and the unified budget expires with VEL-10 still pending
- **THEN** scan seals once with VEL-09 measured, VEL-10 `unknown "budget-exceeded"`, and report status `degraded` rendered only once at seal (no intermediate hero dial)

#### Scenario: Total GH outage still returns metadata
- **WHEN** all GH calls fail (network/timeout) and unified budget is `~240s` for 19 requested indicators
- **THEN** report seals once at budget expiry as `degraded` with repo existence proven (status 200 on `/repos`) but failed indicator rows `unknown`, never an intermediate `6/102` dial

#### Scenario: Budget scales with selected indicators
- **WHEN** requested IDs are 3 fast-only indicators
- **THEN** budget is `~20s` (`5s base + 3*5s`) and bar reaches 100% at that deadline, not at 10s or 240s

### Requirement: Partial scorer and coverage
The system SHALL roll up the requested MVP facts into the canonical scoring math (`11_WEIGHTS_THRESHOLDS_CONFIG.md:50` — Category% and weighted headline) over the requested set (MVP 19 = VEL 4 + SEC 4 + ECOS 5 + ARCH 3 + TEST 3). All non-requested indicators SHALL be `unknown` with `unknown_measure_path`; the report's `coverage` SHALL show a single terminal value `measured:N, estimated:0, unknown:102-N` (MVP `19/83`) and `status` SHALL be `complete` or `degraded`. No intermediate coverage (e.g. `measured:6` dial) SHALL be rendered.

#### Scenario: Full Phase 1 success
- **WHEN** all 19 requested MVP facts are `measured` before budget expiry
- **THEN** `score = sum(category% * weight)` over 5 categories and `coverage.measured=19`, report status `complete`, rendered once as the single terminal report

#### Scenario: One rate-limited detector
- **WHEN** VEL-09 is `unknown "rate-limited"` at seal
- **THEN** coverage is `measured:18, unknown:84`, headline excludes that row from numerator/denominator, status `degraded`, single report

#### Scenario: Budget expiry with partial facts
- **WHEN** unified budget `~240s` expires with 15 of 19 detectors done
- **THEN** final report shows `measured:15, unknown:87` with timed-out rows `unknown "budget-exceeded"`, status `degraded`, and no prior partial report was shown

### Requirement: Dedicated live report page
The system SHALL expose a dedicated page for live reports at `/live` (alias `/report/live`) that renders a live scan for `?repo={owner}/{repo}` without requiring `?live=1`. `/report/sample` SHALL remain fixture-only. The live page SHALL show a single unified progress bar at the top (percent, elapsed, time remaining derived from `budgetMs`) while scanning, with no "Phase 1" / "Phase 2" labels, no per-phase step list, and no intermediate `6/102` or `19/102` dials. The report SHALL be rendered exactly once when the scan seals (all detectors complete or budget expiry), replacing the progress bar in place; the URL stays shareable `/live?repo=...`.

#### Scenario: Live page renders a real repo
- **WHEN** user visits `/live?repo=vercel/next.js` with `GH_TOKEN` present and 19 indicators requested (budget ~240s)
- **THEN** page shows a single bar `0% → 100%` with `elapsed / remaining` countdown while scanning, and after seal renders the full `19/102` report (hero dial + 5-category table from live facts, not `sample.ts`)

#### Scenario: Sample page stays illustrative
- **WHEN** user visits `/report/sample` (no `live` flag)
- **THEN** page renders the django/django fixture (58/100, 49/19/8) regardless of `GH_TOKEN` and shows no progress bar

#### Scenario: Invalid repo on live page
- **WHEN** `?repo=gitlab.com/foo/bar` or missing repo on `/live`
- **THEN** page shows `snapshot_refused` (`unsupported_host`/`not_found`) without sealing a score and without a progress bar

### Requirement: Score-this-repo CTA → live scan with progress
The system SHALL make "Score this repo" take the URL in the box, normalize it, navigate to `/live?repo={owner}/{repo}`, start the unified budgeted scan immediately, show a single top progress bar with percent + elapsed + remaining while detectors run, and replace the bar with the final report exactly once when complete (all done or budget expiry). `snapshot_refused` (unsupported_host/not_found/private) and `rate-limited` SHALL surface as an actionable message, not a silent score. No Phase-specific step labels SHALL be shown.

#### Scenario: CTA redirects to live
- **WHEN** user enters `https://github.com/vercel/next.js` and clicks "Score this repo"
- **THEN** browser navigates to `/live?repo=vercel/next.js` (shareable URL) and shows the unified bar

#### Scenario: Progress while scanning
- **WHEN** `/live?repo=vercel/next.js` is loading (GH calls + clone + detectors in flight, up to budgetMs)
- **THEN** page shows a single progress bar with percent and `elapsed / remaining` countdown, not a blank screen and not a per-phase step list

#### Scenario: Report replaces progress
- **WHEN** unified scan seals (status `complete` or `degraded`, either all detectors done or budgetMs reached)
- **THEN** progress bar is replaced by hero dial + coverage `19/102` + gate cockpit + 5-category table; URL stays `/live?repo=...` (shareable); elapsed timer freezes at seal

#### Scenario: Invalid/rate-limited shows refused with retry
- **WHEN** `?repo=gitlab.com/foo/bar` or GH rate-limit on `/live`
- **THEN** page shows `snapshot_refused` with reason (`unsupported_host`/`rate-limited — set GH_TOKEN`) and a retry link, without a score and without a stale timer

### Requirement: Two-phase orchestration (worker/queue)
The system SHALL orchestrate a single unified scan covering all requested indicators under one indicator-driven budget (`cloneBaseMs + Σ per-indicator cost` as above). GH-API and clone-based detectors SHALL share the same budget and abort signal; clone (`--filter=blob:none`) and manifest sniff SHALL run within the same budget when any clone-dependent indicator is requested, otherwise the scan skips clone. Progress SHALL stream via `/api/scan` NDJSON as unified `progress` frames (pct/elapsed/remaining/completed cost) plus a single header frame with `budgetMs`/`indicatorCount`, without a separate Phase 1 / Phase 2 report. Phases SHALL NOT be surfaced in UI or API contract; they remain an internal build detail.

#### Scenario: Phase 1 seals before Phase 2
- **WHEN** user visits `/live?repo=vercel/next.js` with 19 requested indicators
- **THEN** the scan computes one unified `budgetMs` (~240s), runs GH and clone detectors under that deadline, streams unified progress, and renders the single final report once (no intermediate Phase 1 seal)

#### Scenario: Phase 2 budget exceeded degrades
- **WHEN** unified budget expires with `ARCH-01` still running
- **THEN** final report is `degraded` with completed rows `measured` and timed-out rows `unknown "budget-exceeded"` (or `estimated+scope-limited` for dissolvable), and no intermediate report was shown

## REMOVED Requirements

### Requirement: Two-phase progress display with Phase 1 intermediate dial
**Reason**: Superseded by unified single-bar, single-report contract. Surfacing Phase 1 `6/102` dial and Phase 2 `19/102` replacement leaks implementation phases into the product.
**Migration**: Clients that consumed `{type:"phase1"}` NDJSON frames SHALL handle `{type:"progress"}` and a single terminal `{type:"report"}`. UI that showed `Ingesting URL → Fetching repo → Running 6 checks → Cloning → Sniffing → Scanning 13 → Scoring` SHALL show the unified bar instead.
