## ADDED Requirements

### Requirement: Two-phase orchestration (worker/queue)
The system SHALL orchestrate Phase 1 GH-API to seal the hero dial within its **indicator-driven budget** (`~10s` for the 6 Phase-1 IDs) and then enqueue Phase 2 clone scan via a worker/queue under its **indicator-driven budget** (`~240s` for the 13 Phase-2 IDs) via `cloneBaseMs (30s) + Σ per-indicator cost` (`fast 5s`, `api-budgeted 10s`, `slow 40s`). Phase 2 progress SHALL stream via `/api/scan` NDJSON (cloning → sniffing → scanning 13 → scoring) without blocking Phase 1 report.

#### Scenario: Phase 1 seals before Phase 2
- **WHEN** user visits `/live?repo=vercel/next.js`
- **THEN** page shows Phase 1 dial `6/102` within 10s, then streams Phase 2 steps and replaces with final `19/102` when clone seals, URL stays shareable

#### Scenario: Phase 2 budget exceeded degrades
- **WHEN** 4-min budget expires with `ARCH-01` still running
- **THEN** final report is `degraded` with Phase 1 6 rows `measured` and timed-out Phase 2 rows `unknown "budget-exceeded"`

## MODIFIED Requirements

### Requirement: 10-second fail-open budget
The system SHALL bound every Phase 1 scan to a wall-clock budget computed from its **requested indicator list** (`base 5s + Σ per-indicator cost` for the 6 GH-API IDs → `~10s`, clamped `[5s, 30s]`), encompassing all GH calls; any detector that exceeds its per-call timeout or the global budget SHALL return a degraded fact and the orchestrator SHALL still seal a report.

#### Scenario: One slow endpoint does not block hero dial
- **WHEN** `GET /repos/{o}/{r}/pulls?state=closed` takes 7s and the indicator-driven budget expires with VEL-10 still pending
- **THEN** scan seals with VEL-09 measured, VEL-10 `unknown "budget-exceeded"`, and report status `degraded`

#### Scenario: Total GH outage still returns metadata
- **WHEN** all GH calls fail (network/timeout)
- **THEN** report seals as `degraded` with repo existence proven (status 200 on `/repos`) but all 6 indicator rows `unknown`

### Requirement: Partial scorer and coverage
The system SHALL roll up the 19 MVP facts into the canonical scoring math (`11_WEIGHTS_THRESHOLDS_CONFIG.md:50` — Category% and weighted headline) over the full MVP set: VEL 4 rows, SEC 4 rows, ECOS 5 rows, ARCH 3 rows, TEST 3 rows = 19 `measured`. All 83 non-MVP indicators SHALL be `unknown` with `unknown_measure_path`; the report's `coverage` SHALL show `measured:19, estimated:0, unknown:83` (and `measured:6` during Phase 1 intermediate) and `status` SHALL be `complete` or `degraded`.

#### Scenario: Full Phase 1 success
- **WHEN** all 19 MVP facts are `measured`
- **THEN** `score = sum(category% * weight)` over 5 categories and `coverage.measured=19`, report status `complete`

#### Scenario: One rate-limited detector
- **WHEN** VEL-09 is `unknown "rate-limited"`
- **THEN** coverage is `measured:18, unknown:84`, headline excludes that row from numerator/denominator, status `degraded`

### Requirement: Dedicated live report page
The system SHALL expose a dedicated page for live reports at `/live` (alias `/report/live`) that renders a live scan for `?repo={owner}/{repo}` without requiring `?live=1`. `/report/sample` SHALL remain fixture-only. The live page SHALL stream two-phase progress: Phase 1 immediate `6/102` dial, then Phase 2 clone `19/102` final, keeping the same shareable URL.

#### Scenario: Live page renders a real repo
- **WHEN** user visits `/live?repo=vercel/next.js` with `GH_TOKEN` present
- **THEN** page first renders Phase 1 hero dial `6/102` within 10s, streams Phase 2 `cloning → sniffing → scanning 13 → scoring`, and finally shows `19/102` with 5-category table from live facts (not `sample.ts`)

#### Scenario: Sample page stays illustrative
- **WHEN** user visits `/report/sample` (no `live` flag)
- **THEN** page renders the django/django fixture (58/100, 49/19/8) regardless of `GH_TOKEN`

#### Scenario: Invalid repo on live page
- **WHEN** `?repo=gitlab.com/foo/bar` or missing repo on `/live`
- **THEN** page shows `snapshot_refused` (`unsupported_host`/`not_found`) without sealing a score

### Requirement: Score-this-repo CTA → live scan with progress
The system SHALL make “Score this repo” take the URL in the box, normalize it, navigate to `/live?repo={owner}/{repo}`, start `runPhase1Scan` immediately, show progress while detectors run (Phase 1 `Ingesting URL → Fetching repo → Running 6 checks → Scoring` then Phase 2 `Cloning → Sniffing → Scanning 13 → Scoring`), and replace progress with the final 19-row report when complete. `snapshot_refused` (unsupported_host/not_found/private) and `rate-limited` SHALL surface as an actionable message, not a silent score.

#### Scenario: CTA redirects to live
- **WHEN** user enters `https://github.com/vercel/next.js` and clicks “Score this repo”
- **THEN** browser navigates to `/live?repo=vercel/next.js` (shareable URL)

#### Scenario: Progress while scanning
- **WHEN** `/live?repo=vercel/next.js` is loading (GH calls + clone in flight, <4min)
- **THEN** page shows progress steps `Ingesting URL → Fetching repo → Running 6 checks → Cloning → Sniffing → Scanning 13 → Scoring` with elapsed time, not a blank screen

#### Scenario: Report replaces progress
- **WHEN** Phase 2 seals (status `complete` or `degraded`)
- **THEN** progress is replaced by hero dial + coverage `19/102` + gate cockpit + 5-category table; URL stays `/live?repo=...` (shareable)

#### Scenario: Invalid/rate-limited shows refused with retry
- **WHEN** `?repo=gitlab.com/foo/bar` or GH rate-limit on `/live`
- **THEN** page shows `snapshot_refused` with reason (`unsupported_host`/`rate-limited — set GH_TOKEN`) and a retry link, without a score
