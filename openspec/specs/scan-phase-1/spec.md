## Purpose

GH-API-only Phase 1 scan that scores any public GitHub repo in <10s without cloning, emitting 6 indicator facts and a partial report that proves the virality loop before the heavy clone phase exists.

## Requirements

### Requirement: GitHub URL ingestion and validation
The system SHALL accept a public GitHub URL (`https://github.com/{owner}/{repo}` with optional `.git` suffix, trailing slash, or `tree/{ref}` tail), normalize it to `{owner}/{repo}`, and reject non-GitHub, private, malformed, or non-existent repos with a typed error.

#### Scenario: Valid public URL normalizes
- **WHEN** user submits `https://github.com/vercel/next.js/tree/canary`
- **THEN** system normalizes to `vercel/next.js` and proceeds to fetch repo metadata

#### Scenario: Private or missing repo is refused at the door
- **WHEN** URL resolves to a 404 or 403 via `GET /repos/{owner}/{repo}`
- **THEN** system returns `snapshot_refused` with reason `not_found` or `private_requires_app` and emits no partial score

#### Scenario: Non-GitHub URL rejected
- **WHEN** URL is `https://gitlab.com/foo/bar`
- **THEN** system returns validation error `unsupported_host` without calling GitHub

### Requirement: Rate-limited GitHub client
The system SHALL route all GitHub REST calls through a shared rate-limited client that enforces a token bucket, retries `403 rate-limit` with `Retry-After`/exponential backoff, and surfaces `remaining`/`reset` in provenance.

#### Scenario: Burst of scans shares bucket
- **WHEN** two Phase 1 scans run concurrently against the shared low-rate token pool
- **THEN** the second scan's `GET /pulls` calls are throttled (not dropped) and complete without 429 bubbling to the caller

#### Scenario: Rate limit exhausted degrades detector
- **WHEN** `GET /pulls?state=closed` hits `403 rate_limit exceeded` and retries are exhausted
- **THEN** VEL-09 facts carry `error.kind=rate-limit` and the detector emits `unknown "rate-limited"` per detector's `api-budgeted` semantics

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
### Requirement: VEL-06 bus factor fact (GH-API proxy)
The system SHALL emit a VEL-06 fact derived without cloning: GH commits API sampled history (last 200 commits or 12mo window) plus `GET /repos/{o}/{r}/contributors` enrichment, computing bus-factor proxy and worst-module author share where file-level signals are unavailable.

#### Scenario: Healthy team emits bus factor
- **WHEN** GH commit authors across the sampled window show no single author >40% repo-wide
- **THEN** fact `vel06.bus_factor_repo >=3` and status maps to `measured` per `vel-06_bus-factor-knowledge-concentration.md:42`

### Requirement: VEL-09 PR hygiene fact
The system SHALL emit a VEL-09 fact from `GET /pulls?state=closed` (last 200, or 12mo), computing review coverage, median/p95 PR size, median time-to-first-approval, bypass rate, and direct-push count via `GET /repos/{o}/{r}/commits` vs PR merges.

#### Scenario: Reviewed repo produces measured fact
- **WHEN** sampled PRs have review coverage 86% and median 210 LOC
- **THEN** fact `vel09.review_coverage_pct=0.86` with `prs_sampled=200` and status `measured`

#### Scenario: Young repo with <10 PRs
- **WHEN** only 4 closed PRs exist
- **THEN** detector emits `unknown` with `unknown_measure_path` per VEL-09 spec (not `estimated` with tiny denominator)

### Requirement: VEL-08 manual release steps fact
The system SHALL emit a VEL-08 fact by fetching CI workflow YAML via `GET /repos/{o}/{r}/contents/.github/workflows` (and decoding `download_url`), detecting build→registry_push→deploy_job chain, release automation markers, and rollback target.

#### Scenario: CD chain detected
- **WHEN** `.github/workflows/ci.yml` contains `build` and `deploy` jobs with `environment:` and no rollback job
- **THEN** fact `vel08.cd_chain={build:true, registry_push:true, deploy_job:true}` and `rollback_target=false`

### Requirement: VEL-10 branching topology fact
The system SHALL emit a VEL-10 fact from `GET /repos/{o}/{r}/branches` plus `GET /git/refs/heads` age/divergence analysis, classifying model (trunk-based vs long-lived-release) and stale-branch counts.

#### Scenario: Stale release branches flagged
- **WHEN** `branches_total=143` with `stale_over_30d=61` and `max_divergence_commits=214`
- **THEN** fact records those values and status `measured`

### Requirement: SEC-07 patch cadence fact
The system SHALL emit a SEC-07 fact from Dependabot/Renovate config presence (`GET /contents/.github/dependabot.yml` or `renovate.json`) plus lockfile staleness hint via `GET /contents` mtimes and open bot PR ages from `GET /pulls?state=open` filtered to `dependabot[bot]`.

#### Scenario: Bot present but backlog growing
- **WHEN** `dependabot.yml` present, `lockfile_age_days=12`, open bot PRs `p95_age_days=61`
- **THEN** fact captures all three and maps to score 2 per SEC-07 predicate

#### Scenario: No manifest in tree
- **WHEN** no `package.json`/`pyproject.toml`/`go.mod`/etc. found via `GET /contents` enumeration
- **THEN** SEC-07 emits `na_when` (clause-b) or `unknown` with reason, never a score

### Requirement: TEST-08 quality gates in CI fact
The system SHALL emit a TEST-08 fact by parsing CI YAML fetched via contents API, inventorying gates (lint, SAST, typecheck, coverage threshold) and their blocking vs advisory semantics (`continue-on-error`).

#### Scenario: Lint-only CI
- **WHEN** `.github/workflows/ci.yml` has only a `lint` job and no coverage/SAST gates
- **THEN** fact `gates={lint:{present:true,blocking:true}, sast:{present:false}}` and scorer maps to measured score per TEST-08

### Requirement: Partial scorer and coverage
The system SHALL roll up the requested MVP facts into the canonical scoring math (`docs/rubric/model/config.md` §2 — Category% and weighted headline) over the requested set (MVP 19 = VEL 4 + SEC 4 + ECOS 5 + ARCH 3 + TEST 3). All non-requested indicators SHALL be `unknown` with `unknown_measure_path`; the report's `coverage` SHALL show a single terminal value `measured:N, estimated:0, unknown:102-N` (MVP `19/83`) and `status` SHALL be `complete` or `degraded`. No intermediate coverage (e.g. `measured:6` dial) SHALL be rendered.

#### Scenario: Full Phase 1 success
- **WHEN** all 19 requested MVP facts are `measured` before budget expiry
- **THEN** `score = sum(category% * weight)` over 5 categories and `coverage.measured=19`, report status `complete`, rendered once as the single terminal report

#### Scenario: One rate-limited detector
- **WHEN** VEL-09 is `unknown "rate-limited"` at seal
- **THEN** coverage is `measured:18, unknown:84`, headline excludes that row from numerator/denominator, status `degraded`, single report

#### Scenario: Budget expiry with partial facts
- **WHEN** unified budget `~240s` expires with 15 of 19 detectors done
- **THEN** final report shows `measured:15, unknown:87` with timed-out rows `unknown "budget-exceeded"`, status `degraded`, and no prior partial report was shown
### Requirement: Evidence and provenance per row
The system SHALL attach to every `measured` row an `evidence` pointer (GH endpoint + key fields) and to every `unknown` row an `unknown_measure_path`; every fact SHALL carry `provenance: {tool: "gh-api", version, endpoint, durationMs}` and `evidencePointers` per the `openspec/specs/report-envelope/spec.md:122` envelope (no score/status/confidence inside the detector).

#### Scenario: PR hygiene evidence
- **WHEN** VEL-09 fact is `measured`
- **THEN** row evidence reads `gh-api: pr-mining n=200: review 86%; median 210 LOC ...` with pointers to sampled PR numbers

### Requirement: Fail-open per-detector semantics
The system SHALL never let a detector crash or timeout fail the scan; `timeout`/`rate-limit`/`cap` SHALL map to `truncated`/`error` in the fact and `estimated` or `unknown` downstream per each spec's §7, with budget class `api-budgeted` for VEL-09/SEC-07/ARCH-05 and `fast` for the rest.

#### Scenario: GH 500 on branch list
- **WHEN** `GET /branches` returns 500
- **THEN** VEL-10 fact carries `error:{kind:"cap", detail:"...500..."}` and row status resolves to `unknown`

### Requirement: Dedicated live report page
The system SHALL expose a dedicated page for live reports at `/live` (alias `/report/live`) that renders a live scan for `?repo={owner}/{repo}` without requiring `?live=1`, consuming the scanner service's scan API rather than a same-origin route. `/report/sample` SHALL remain fixture-only. The live page SHALL show a single unified progress bar at the top (percent, elapsed, time remaining derived from `budgetMs`) while scanning, plus an append-only scan timeline below it that streams milestones and per-indicator completions as `progress` frames arrive, with no "Phase 1" / "Phase 2" labels, no per-phase step list, and no intermediate `6/102` or `19/102` dials. The report SHALL be rendered exactly once when the scan seals (all detectors complete or budget expiry) and SHALL be revealed via an explicit "Reveal report" affordance rather than an automatic hard swap; the timeline SHALL remain accessible (collapsible) after reveal. At seal the page SHALL render the sealed report **in place** from the terminal `report` frame — which carries the report body, envelope `meta`, and ordered `trace` — so no navigation is required and no page needs to exist for a `runId` that the website has not yet ingested. The page SHALL additionally expose the scanner's stable permalink for that `runId` as the shareable URL. The live interstitial URL SHALL remain `/live?repo=...` while generation is in progress. A `runId` becomes addressable on the website at `/reports/<runId>` only after it has been ingested into a build.

#### Scenario: Live page renders a real repo
- **WHEN** user visits `/live?repo=vercel/next.js` with the scanner service reachable and configured with a GitHub token and 19 indicators requested (budget ~240s)
- **THEN** page shows a single bar `0% → 100%` with `elapsed / remaining` countdown plus a timeline that appends entries (e.g. `Ingested vercel/next.js`, `GH detectors 6/6`, `Clone + sniff`, `ECOS-01 measured`, … `Scoring — 19 measured, gates evaluated`) as progress frames arrive; after seal the page shows `Report ready — Reveal report` and on click renders the full report in place (hero dial + coverage + gate cockpit + category tables) while keeping the timeline collapsible under the header, without navigating away

#### Scenario: Sample page stays illustrative
- **WHEN** user visits `/report/sample` (no `live` flag)
- **THEN** page renders the django/django fixture (58/100, 49/19/8) regardless of any token and shows no progress bar or timeline

#### Scenario: Invalid repo on live page
- **WHEN** `?repo=gitlab.com/foo/bar` or missing repo on `/live`
- **THEN** page shows the `refused` reason (`unsupported_host`/`not_found`, i.e. `snapshot_refused`) surfaced from the scan API without sealing a score and without a progress bar or timeline

#### Scenario: Seal renders without requiring an ingested page
- **WHEN** a scan seals with `meta.runId` `vercel__next.js__abc1234__2026-10-16T053000-123Z` and that `runId` has not been ingested into any build
- **THEN** the sealed report renders in place and the page offers the scanner's permalink for that `runId` as the shareable URL, with no 404 and no reliance on `/reports/<runId>` existing yet

#### Scenario: Reveal navigates to bookmarkable runId
- **WHEN** a scan seals and `meta.runId` is `vercel__next.js__abc1234__2026-08-29T053000-123Z`
- **THEN** the sealed report is revealed in place and the scanner's permalink for that `runId` is offered as the bookmarkable, shareable URL; reloading that permalink renders the same score/tier/coverage/trace without invoking a scan, whereas reloading `/live?repo=vercel/next.js` still starts a fresh scan

#### Scenario: Ingested run becomes addressable on the website
- **WHEN** an envelope for `vercel__next.js__abc1234__2026-10-16T053000-123Z` is ingested and the website is rebuilt
- **THEN** `/reports/vercel__next.js__abc1234__2026-10-16T053000-123Z` renders that frozen report without re-running the engine, and reloading it never starts a scan

### Requirement: Score-this-repo CTA → live scan with progress
The system SHALL make "Score this repo" take the URL in the box, normalize it, navigate to `/live?repo={owner}/{repo}`, start the unified budgeted scan immediately against the scanner's scan API, show a single top progress bar with percent + elapsed + remaining plus a live timeline while detectors run, and at seal show a "Reveal report" affordance that on click renders the sealed report in place exactly once when complete (all done or budget expiry) with a fade/slide transition, offering the scanner's permalink for that run as the shareable URL. `snapshot_refused` (unsupported_host/not_found/private) and `rate-limited` SHALL surface as an actionable message, not a silent score. No Phase-specific step labels SHALL be shown in the bar; the timeline carries the narrative.

#### Scenario: CTA redirects to live
- **WHEN** user enters `https://github.com/vercel/next.js` and clicks "Score this repo"
- **THEN** browser navigates to `/live?repo=vercel/next.js` (generation URL, shareable) and shows the unified bar + empty timeline that begins appending

#### Scenario: Progress while scanning
- **WHEN** `/live?repo=vercel/next.js` is loading (GH calls + clone + detectors in flight, up to budgetMs)
- **THEN** page shows a single progress bar with percent and `elapsed / remaining` countdown plus a timeline that appends a new row per milestone/completed detector (not a blank screen and not a per-phase step list); the 200ms local tick keeps elapsed/remaining smooth between NDJSON frames

#### Scenario: Report replaces progress
- **WHEN** unified scan seals (status `complete` or `degraded`, either all detectors done or budgetMs reached)
- **THEN** a `Report ready — Reveal report` affordance appears; on click the page renders hero dial + coverage + gate cockpit + 5-category table in place with a fade/slide transition (replacing the scanning state), the elapsed timer freezes at seal, the shareable permalink for the run is offered without requiring a website page for that `runId` to exist, and URL stays `/live?repo=...` (shareable)

#### Scenario: Report reveals on user action
- **WHEN** unified scan seals (status `complete` or `degraded`, either all detectors done or budgetMs reached)
- **THEN** the timeline freezes, a `Report ready — Reveal report` button appears anchored below the timeline, and on click the hero dial + coverage `19/102` + gate cockpit + category tables animate in below the sticky bar; the timeline collapses to a compact `Show scan log (n steps)` link that re-expands on click; URL stays `/live?repo=...` (shareable); elapsed timer freezes at seal; background tabs auto-reveal after a short delay (≤3s) so returning users see the report without an extra click

#### Scenario: Invalid/rate-limited shows refused with retry
- **WHEN** `?repo=gitlab.com/foo/bar` or the scan API refuses with a rate-limit reason
- **THEN** page shows the refused reason (`snapshot_refused` with reason `unsupported_host`/`rate-limited — set GH_TOKEN`) with a retry link, without a score, without a stale timer, and without a reveal button

### Requirement: Scan timeline events

The system SHALL stream scan narrative as timeline events derived from `GET /api/scan` NDJSON frames. Each `progress` frame MAY carry an optional `milestone` string and/or `completedIds` delta; the client SHALL append a timeline row for each new milestone or newly completed indicator without re-rendering prior rows. The `/api/scan` contract remains additive: existing `meta` (`budgetMs`, `indicatorCount`, `breakdown`) and `progress` (`pct`, `elapsedMs`, `remainingMs`, `completedIds`, `completedCost`, `totalCost`) fields are unchanged; `milestone` is optional. At minimum the timeline SHALL cover: ingest/normalize, GH fetch, GH detectors batch, clone (when requested), clone detectors batch, scoring/gate evaluation, seal (complete/degraded with measured count).

#### Scenario: Milestone frames build the timeline
- **WHEN** the orchestrator yields `meta` then `progress` with `completedIds: ["VEL-06","VEL-09"]` and `milestone: "GH detectors 2/6"`
- **THEN** the client appends `GH detectors 2/6 — VEL-06, VEL-09` to the timeline; a subsequent frame with `completedIds: ["VEL-06","VEL-09","VEL-08"]` appends only the delta `VEL-08`

#### Scenario: Sealed timeline shows status
- **WHEN** scan seals with `degraded` and `measured:14`
- **THEN** the terminal timeline entry reads `Sealed — degraded · 14/19 measured · 5 unknown (budget/degraded)` and the reveal button reads `Reveal partial report — 14/19 measured` rather than `Reveal report`

### Requirement: Gate handling in Phase 1

The system SHALL surface gates G1/G2/G3/G8 as `needs-verification` when a scan has only GH-API facts (no clone-based detector evidence), unless clone facts for the requested MVP set are present in the same unified scan — in which case the gates SHALL be evaluated via the Phase-2 predicates within that scan. No gate SHALL cap the headline at High Risk until it is `proven`; `needs-verification` is informational only. In the unified scan model (see Two-phase orchestration), there is no separate Phase-1 seal: a single terminal report is rendered once at `budgetMs` expiry or all-detectors-complete.

#### Scenario: No secrets scan yet
- **WHEN** Phase 1 has no tree/history scan
- **THEN** G1 status is `needs-verification` with requirement `needs live secrets scan`

#### Scenario: GH-only scan keeps needs-verification
- **WHEN** a scan requests only GH-API indicators (e.g. VEL-06/09/08/10, SEC-07, TEST-08) and completes without cloning
- **THEN** gates G1 (SEC-02), G2 (SEC-01), G3 (ECOS-01), G8 (ECOS-05) each report `needs-verification` with notes `needs live secrets scan` / `needs SCA+reachability` / `needs endoflife lookup` / `needs SBOM` respectively, and headline is not capped

#### Scenario: Unified scan promotes gates when clone facts present
- **WHEN** a unified scan requests the 19 MVP indicators and clone detectors emit SEC-02/ECOS-01/ECOS-05/SEC-01 facts before `budgetMs` expiry
- **THEN** G1/G3/G8/G2 are evaluated via their Phase-2 predicates in that same scan (see `scan-phase-2` gate predicates) and may become `proven` or `not-proven`, and a `proven` gate caps the verdict per `docs/rubric/model/config.md` §3

#### Scenario: No intermediate Phase-1 seal in unified scan
- **WHEN** GH-API detectors finish early in a 19-indicator unified scan
- **THEN** the system does not render a `6/102` intermediate dial or a separate Phase-1 report; progress continues on the single unified bar until the single terminal report replaces it

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

