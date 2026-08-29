# Spec delta — scan-phase-1

## MODIFIED Requirements

### Requirement: Dedicated live report page
The system SHALL expose a dedicated page for live reports at `/live` (alias `/report/live`) that renders a live scan for `?repo={owner}/{repo}` without requiring `?live=1`. `/report/sample` SHALL remain fixture-only. The live page SHALL show a single unified progress bar at the top (percent, elapsed, time remaining derived from `budgetMs`) while scanning, plus an append-only scan timeline below it that streams milestones and per-indicator completions as `progress` frames arrive. No "Phase 1" / "Phase 2" labels and no intermediate `6/102` or `19/102` dials SHALL be shown while scanning. The report SHALL be rendered once when the scan seals (all detectors complete or budget expiry) and SHALL be revealed via an explicit "Reveal report" affordance rather than an automatic hard swap; the timeline SHALL remain accessible after reveal.

#### Scenario: Live page renders a real repo
- **WHEN** user visits `/live?repo=vercel/next.js` with `GH_TOKEN` present and 19 indicators requested (budget ~240s)
- **THEN** page shows a single bar `0% → 100%` with `elapsed / remaining` countdown plus a timeline that appends entries (e.g. `Ingested vercel/next.js`, `GH detectors 6/6`, `Clone + sniff`, `ECOS-01 measured`, … `Scoring — 19 measured, gates evaluated`) as progress frames arrive; after seal the page shows `Report ready — Reveal report` and on click smoothly reveals the full `19/102` report (hero dial + coverage + gate cockpit + category tables) while keeping the timeline collapsible under the header; URL stays `/live?repo=...`

#### Scenario: Sample page stays illustrative
- **WHEN** user visits `/report/sample` (no `live` flag)
- **THEN** page renders the django/django fixture (58/100, 49/19/8) regardless of `GH_TOKEN` and shows no progress bar or timeline

#### Scenario: Invalid repo on live page
- **WHEN** `?repo=gitlab.com/foo/bar` or missing repo on `/live`
- **THEN** page shows `snapshot_refused` (`unsupported_host`/`not_found`) without sealing a score and without a progress bar or timeline

### Requirement: Score-this-repo CTA → live scan with progress
The system SHALL make "Score this repo" take the URL in the box, normalize it, navigate to `/live?repo={owner}/{repo}`, start the unified budgeted scan immediately, show a single top progress bar with percent + elapsed + remaining plus a live timeline while detectors run, and at seal show a "Reveal report" affordance that on click replaces the scanning state with the final report exactly once (all done or budget expiry) with a fade/slide transition. `snapshot_refused` (unsupported_host/not_found/private) and `rate-limited` SHALL surface as an actionable message, not a silent score. No Phase-specific step labels SHALL be shown in the bar; the timeline carries the narrative.

#### Scenario: CTA redirects to live
- **WHEN** user enters `https://github.com/vercel/next.js` and clicks "Score this repo"
- **THEN** browser navigates to `/live?repo=vercel/next.js` (shareable URL) and shows the unified bar + empty timeline that begins appending

#### Scenario: Progress while scanning
- **WHEN** `/live?repo=vercel/next.js` is loading (GH calls + clone + detectors in flight, up to budgetMs)
- **THEN** page shows a single progress bar with percent and `elapsed / remaining` countdown plus a timeline that appends a new row per milestone/completed detector (not a blank screen and not a per-phase step list); the 200ms local tick keeps elapsed/remaining smooth between NDJSON frames

#### Scenario: Report replaces progress
- **WHEN** unified scan seals (status `complete` or `degraded`, either all detectors done or budgetMs reached)
- **THEN** a `Report ready — Reveal report` affordance appears; on click the hero dial + coverage `19/102` + gate cockpit + category tables animate in below the sticky bar (replacing the scanning state in place); URL stays `/live?repo=...` (shareable); elapsed timer freezes at seal

#### Scenario: Report reveals on user action
- **WHEN** unified scan seals (status `complete` or `degraded`, either all detectors done or budgetMs reached)
- **THEN** the timeline freezes, a `Report ready — Reveal report` button appears anchored below the timeline, and on click the hero dial + coverage `19/102` + gate cockpit + category tables animate in below the sticky bar; the timeline collapses to a compact `Show scan log (n steps)` link that re-expands on click; URL stays `/live?repo=...` (shareable); elapsed timer freezes at seal; background tabs auto-reveal after a short delay (≤3s) so returning users see the report without an extra click

#### Scenario: Invalid/rate-limited shows refused with retry
- **WHEN** `?repo=gitlab.com/foo/bar` or GH rate-limit on `/live`
- **THEN** page shows `snapshot_refused` with reason (`unsupported_host`/`rate-limited — set GH_TOKEN`) and a retry link, without a score, without a stale timer, and without a reveal button

## ADDED Requirements

### Requirement: Scan timeline events

The system SHALL stream scan narrative as timeline events derived from `GET /api/scan` NDJSON frames. Each `progress` frame MAY carry an optional `milestone` string and/or `completedIds` delta; the client SHALL append a timeline row for each new milestone or newly completed indicator without re-rendering prior rows. The `/api/scan` contract remains additive: existing `meta` (`budgetMs`, `indicatorCount`, `breakdown`) and `progress` (`pct`, `elapsedMs`, `remainingMs`, `completedIds`, `completedCost`, `totalCost`) fields are unchanged; `milestone` is optional. At minimum the timeline SHALL cover: ingest/normalize, GH fetch, GH detectors batch, clone (when requested), clone detectors batch, scoring/gate evaluation, seal (complete/degraded with measured count).

#### Scenario: Milestone frames build the timeline
- **WHEN** the orchestrator yields `meta` then `progress` with `completedIds: ["VEL-06","VEL-09"]` and `milestone: "GH detectors 2/6"`
- **THEN** the client appends `GH detectors 2/6 — VEL-06, VEL-09` to the timeline; a subsequent frame with `completedIds: ["VEL-06","VEL-09","VEL-08"]` appends only the delta `VEL-08`

#### Scenario: Sealed timeline shows status
- **WHEN** scan seals with `degraded` and `measured:14`
- **THEN** the terminal timeline entry reads `Sealed — degraded · 14/19 measured · 5 unknown (budget/degraded)` and the reveal button reads `Reveal partial report — 14/19 measured` rather than `Reveal report`
