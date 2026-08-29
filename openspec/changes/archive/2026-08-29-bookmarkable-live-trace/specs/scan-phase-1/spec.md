## MODIFIED Requirements

### Requirement: Dedicated live report page
The system SHALL expose a dedicated page for live reports at `/live` (alias `/report/live`) that renders a live scan for `?repo={owner}/{repo}` without requiring `?live=1`. `/report/sample` SHALL remain fixture-only. The live page SHALL show a single unified progress bar at the top (percent, elapsed, time remaining derived from `budgetMs`) while scanning, with no "Phase 1" / "Phase 2" labels, no per-phase step list, and no intermediate `6/102` or `19/102` dials. The report SHALL be rendered exactly once when the scan seals (all detectors complete or budget expiry). At seal the page SHALL show a `Reveal report` affordance; activating it SHALL navigate to the persisted report at `/reports/<runId>` (the `runId` carried in the terminal `report` frame's `meta`), whose URL is bookmarkable and shareable and reloads the same frozen report without re-running the engine. The live interstitial URL SHALL remain `/live?repo=...` only while generation is in progress; the canonical shareable URL is `/reports/<runId>`.

#### Scenario: Live page renders a real repo
- **WHEN** user visits `/live?repo=vercel/next.js` with `GH_TOKEN` present and 19 indicators requested (budget ~240s)
- **THEN** page shows a single bar `0% → 100%` with `elapsed / remaining` countdown while scanning, and after seal shows a `Reveal report` affordance that on click navigates to `/reports/<runId>` and renders the full `19/102` report there

#### Scenario: Sample page stays illustrative
- **WHEN** user visits `/report/sample` (no `live` flag)
- **THEN** page renders the django/django fixture (58/100, 49/19/8) regardless of `GH_TOKEN` and shows no progress bar

#### Scenario: Invalid repo on live page
- **WHEN** `?repo=gitlab.com/foo/bar` or missing repo on `/live`
- **THEN** page shows `snapshot_refused` (`unsupported_host`/`not_found`) without sealing a score and without a progress bar

#### Scenario: Reveal navigates to bookmarkable runId
- **WHEN** a scan seals and `meta.runId` is `vercel__next.js__abc1234__2026-08-29T053000-123Z`
- **THEN** the `Reveal report` button's action is navigation to `/reports/vercel__next.js__abc1234__2026-08-29T053000-123Z`; copying that URL and reloading renders the same score/tier/coverage/trace without invoking the engine, whereas reloading `/live?repo=vercel/next.js` still starts a fresh scan

### Requirement: Score-this-repo CTA → live scan with progress
The system SHALL make "Score this repo" take the URL in the box, normalize it, navigate to `/live?repo={owner}/{repo}`, start the unified budgeted scan immediately, show a single top progress bar with percent + elapsed + remaining while detectors run, and at seal show the `Reveal report` affordance that on click navigates to `/reports/<runId>` exactly once when complete (all done or budget expiry). `snapshot_refused` (unsupported_host/not_found/private) and `rate-limited` SHALL surface as an actionable message, not a silent score. No Phase-specific step labels SHALL be shown.

#### Scenario: CTA redirects to live
- **WHEN** user enters `https://github.com/vercel/next.js` and clicks "Score this repo"
- **THEN** browser navigates to `/live?repo=vercel/next.js` (generation URL) and shows the unified bar

#### Scenario: Progress while scanning
- **WHEN** `/live?repo=vercel/next.js` is loading (GH calls + clone + detectors in flight, up to budgetMs)
- **THEN** page shows a single progress bar with percent and `elapsed / remaining` countdown, not a blank screen and not a per-phase step list

#### Scenario: Report replaces progress
- **WHEN** unified scan seals (status `complete` or `degraded`, either all detectors done or budgetMs reached)
- **THEN** the page shows the `Reveal report` affordance; on click navigation to `/reports/<runId>` renders hero dial + coverage `19/102` + gate cockpit + 5-category table there; URL becomes `/reports/<runId>` (shareable); elapsed timer freezes at seal

#### Scenario: Invalid/rate-limited shows refused with retry
- **WHEN** `?repo=gitlab.com/foo/bar` or GH rate-limit on `/live`
- **THEN** page shows `snapshot_refused` with reason (`unsupported_host`/`rate-limited — set GH_TOKEN`) and a retry link, without a score and without a stale timer

