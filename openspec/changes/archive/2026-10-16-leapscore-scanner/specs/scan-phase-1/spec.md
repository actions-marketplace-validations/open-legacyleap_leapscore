## MODIFIED Requirements

### Requirement: Dedicated live report page
The system SHALL expose a dedicated page for live reports at `/live` (alias `/report/live`) that renders a live scan for `?repo={owner}/{repo}` without requiring `?live=1`, consuming the scanner service's scan API rather than a same-origin route. `/report/sample` SHALL remain fixture-only. The live page SHALL show a single unified progress bar at the top (percent, elapsed, time remaining derived from `budgetMs`) while scanning, with no "Phase 1" / "Phase 2" labels, no per-phase step list, and no intermediate `6/102` or `19/102` dials. The report SHALL be rendered exactly once when the scan seals (all detectors complete or budget expiry). At seal the page SHALL render the sealed report **in place** from the terminal `report` frame — which carries the report body, envelope `meta`, and ordered `trace` — so no navigation is required and no page needs to exist for a `runId` that the website has not yet ingested. The page SHALL additionally expose the scanner's stable permalink for that `runId` as the shareable URL. The live interstitial URL SHALL remain `/live?repo=...` while generation is in progress. A `runId` becomes addressable on the website at `/reports/<runId>` only after it has been ingested into a build.

#### Scenario: Live page renders a real repo
- **WHEN** user visits `/live?repo=vercel/next.js` and the scanner service is reachable and configured with a GitHub token
- **THEN** page shows a single bar `0% → 100%` with `elapsed / remaining` countdown while scanning, and after seal renders the full report in place without navigating away

#### Scenario: Sample page stays illustrative
- **WHEN** user visits `/report/sample` (no `live` flag)
- **THEN** page renders the django/django fixture (58/100, 49/19/8) regardless of any token and shows no progress bar

#### Scenario: Invalid repo on live page
- **WHEN** `?repo=gitlab.com/foo/bar` or missing repo on `/live`
- **THEN** page shows the `refused` reason (`unsupported_host`/`not_found`) surfaced from the scan API without sealing a score and without a progress bar

#### Scenario: Seal renders without requiring an ingested page
- **WHEN** a scan seals with `meta.runId` `vercel__next.js__abc1234__2026-10-16T053000-123Z` and that `runId` has not been ingested into any build
- **THEN** the sealed report renders in place and the page offers the scanner's permalink for that `runId` as the shareable URL, with no 404 and no reliance on `/reports/<runId>` existing yet

#### Scenario: Reveal navigates to bookmarkable runId
- **WHEN** a scan seals and `meta.runId` is `vercel__next.js__abc1234__2026-08-29T053000-123Z`
- **THEN** the sealed report is revealed in place and the scanner's permalink for that `runId` is offered as the bookmarkable, shareable URL; reloading that permalink renders the same score/tier/coverage/trace without invoking a scan, whereas reloading `/live?repo=vercel/next.js` still starts a fresh scan

#### Scenario: Ingested run becomes addressable on the website
- **WHEN** an envelope for `vercel__next.js__abc1234__2026-10-16T053000-123Z` is ingested and the website is rebuilt
- **THEN** `/reports/vercel__next.js__abc1234__2026-10-16T053000-123Z` renders that frozen report without re-running the engine, and reloading it never starts a scan

### Requirement: Two-phase orchestration (worker/queue)

The system SHALL orchestrate a single unified scan covering all requested indicators under one indicator-driven budget (`cloneBaseMs + Σ per-indicator cost` as above). The scan SHALL be orchestrated inside the scanner service, not in the website process. GH-API and clone-based detectors SHALL share the same budget and abort signal; clone (`--filter=blob:none`) and manifest sniff SHALL run within the same budget when any clone-dependent indicator is requested, otherwise the scan skips clone. Progress SHALL stream via the scanner's scan API NDJSON as unified `progress` frames (pct/elapsed/remaining/completed cost) plus a single header frame with `budgetMs`/`indicatorCount`, without a separate Phase 1 / Phase 2 report. Phases SHALL NOT be surfaced in UI or API contract; they remain an internal build detail.

#### Scenario: Phase 1 seals before Phase 2
- **WHEN** user visits `/live?repo=vercel/next.js` with 19 requested indicators
- **THEN** the scanner computes one unified `budgetMs` (~240s), runs GH and clone detectors under that deadline, streams unified progress, and the website renders the single final report once (no intermediate Phase 1 seal)

#### Scenario: Phase 2 budget exceeded degrades
- **WHEN** unified budget expires with `ARCH-01` still running
- **THEN** final report is `degraded` with completed rows `measured` and timed-out rows `unknown "budget-exceeded"` (or `estimated+scope-limited` for dissolvable), and no intermediate report was shown

#### Scenario: Budget computed from requested list
- **WHEN** requested IDs are the 19 MVP indicators (mix of fast/api/slow with clone)
- **THEN** `budgetMs` ≈ 240s and the top progress bar advances via `elapsed/budgetMs` plus completed-cost weighting, reaching 100% only at seal

#### Scenario: Clone skipped when not needed
- **WHEN** requested IDs are GH-only (e.g. 6 indicators)
- **THEN** clone is omitted, budget uses base `5s` (not `30s`), and the header frame reports the smaller `budgetMs`

#### Scenario: Orchestration is not hosted by the website
- **WHEN** a unified scan is in flight
- **THEN** the website holds no scan state, opens no clone, and performs no GH-API call; aborting the browser stops only the presentation, and the scanner persists the run if it seals

### Requirement: Score-this-repo CTA → live scan with progress
The system SHALL make "Score this repo" take the URL in the box, normalize it, navigate to `/live?repo={owner}/{repo}`, start the unified budgeted scan immediately against the scanner's scan API, show a single top progress bar with percent + elapsed + remaining while detectors run, and at seal render the sealed report in place exactly once when complete (all done or budget expiry), offering the scanner's permalink for that run as the shareable URL. `snapshot_refused` (unsupported_host/not_found/private) and `rate-limited` SHALL surface as an actionable message, not a silent score. No Phase-specific step labels SHALL be shown.

#### Scenario: CTA redirects to live
- **WHEN** user enters `https://github.com/vercel/next.js` and clicks "Score this repo"
- **THEN** browser navigates to `/live?repo=vercel/next.js` (generation URL) and shows the unified bar

#### Scenario: Progress while scanning
- **WHEN** `/live?repo=vercel/next.js` is loading (GH calls + clone + detectors in flight, up to budgetMs)
- **THEN** page shows a single progress bar with percent and `elapsed / remaining` countdown, not a blank screen and not a per-phase step list

#### Scenario: Report replaces progress
- **WHEN** unified scan seals (status `complete` or `degraded`, either all detectors done or budgetMs reached)
- **THEN** the page renders hero dial + coverage + gate cockpit + 5-category table in place, the elapsed timer freezes at seal, and the shareable permalink for the run is offered without requiring a website page for that `runId` to exist

#### Scenario: Invalid/rate-limited shows refused with retry
- **WHEN** `?repo=gitlab.com/foo/bar` or the scan API refuses with a rate-limit reason
- **THEN** page shows the refused reason with a retry link, without a score and without a stale timer
