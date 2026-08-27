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
The system SHALL bound every Phase 1 scan to a wall-clock budget computed from its **requested indicator list** (`base 5s + Σ per-indicator cost` for the 6 GH-API IDs → `~10s`, clamped `[5s, 30s]`), encompassing all GH calls; any detector that exceeds its per-call timeout or the global budget SHALL return a degraded fact and the orchestrator SHALL still seal a report.

#### Scenario: One slow endpoint does not block hero dial
- **WHEN** `GET /repos/{o}/{r}/pulls?state=closed` takes 7s and the indicator-driven budget expires with VEL-10 still pending
- **THEN** scan seals with VEL-09 measured, VEL-10 `unknown "budget-exceeded"`, and report status `degraded`

#### Scenario: Total GH outage still returns metadata
- **WHEN** all GH calls fail (network/timeout)
- **THEN** report seals as `degraded` with repo existence proven (status 200 on `/repos`) but all 6 indicator rows `unknown`

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
The system SHALL roll up the 19 MVP facts into the canonical scoring math (`11_WEIGHTS_THRESHOLDS_CONFIG.md:50` — Category% and weighted headline) over the full MVP set: VEL 4 rows, SEC 4 rows, ECOS 5 rows, ARCH 3 rows, TEST 3 rows = 19 `measured`. All 83 non-MVP indicators SHALL be `unknown` with `unknown_measure_path`; the report's `coverage` SHALL show `measured:19, estimated:0, unknown:83` (and `measured:6` during Phase 1 intermediate) and `status` SHALL be `complete` or `degraded`.

#### Scenario: Full Phase 1 success
- **WHEN** all 19 MVP facts are `measured`
- **THEN** `score = sum(category% * weight)` over 5 categories and `coverage.measured=19`, report status `complete`

#### Scenario: One rate-limited detector
- **WHEN** VEL-09 is `unknown "rate-limited"`
- **THEN** coverage is `measured:18, unknown:84`, headline excludes that row from numerator/denominator, status `degraded`

### Requirement: Evidence and provenance per row
The system SHALL attach to every `measured` row an `evidence` pointer (GH endpoint + key fields) and to every `unknown` row an `unknown_measure_path`; every fact SHALL carry `provenance: {tool: "gh-api", version, endpoint, durationMs}` and `evidencePointers` per `docs/plans/05:54` envelope (no score/status/confidence inside the detector).

#### Scenario: PR hygiene evidence
- **WHEN** VEL-09 fact is `measured`
- **THEN** row evidence reads `gh-api: pr-mining n=200: review 86%; median 210 LOC ...` with pointers to sampled PR numbers

### Requirement: Fail-open per-detector semantics
The system SHALL never let a detector crash or timeout fail the scan; `timeout`/`rate-limit`/`cap` SHALL map to `truncated`/`error` in the fact and `estimated` or `unknown` downstream per each spec's §7, with budget class `api-budgeted` for VEL-09/SEC-07/ARCH-05 and `fast` for the rest.

#### Scenario: GH 500 on branch list
- **WHEN** `GET /branches` returns 500
- **THEN** VEL-10 fact carries `error:{kind:"cap", detail:"...500..."}` and row status resolves to `unknown`

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

### Requirement: Gate handling in Phase 1
The system SHALL surface gates G1/G2/G3/G8 as `needs-verification` unless Phase-1 evidence is sufficient for `proven`/`not-proven` (e.g., no `gitleaks` run means G1 cannot be `proven`); no Phase-1 gate SHALL cap the headline at High Risk per `docs/plans/13:72`.

#### Scenario: No secrets scan yet
- **WHEN** Phase 1 has no tree/history scan
- **THEN** G1 status is `needs-verification` with requirement `needs live secrets scan`

### Requirement: Two-phase orchestration (worker/queue)
The system SHALL orchestrate Phase 1 GH-API to seal the hero dial within its **indicator-driven budget** (`~10s` for the 6 Phase-1 IDs) and then enqueue Phase 2 clone scan via a worker/queue under its **indicator-driven budget** (`~240s` for the 13 Phase-2 IDs) via `cloneBaseMs (30s) + Σ per-indicator cost` (`fast 5s`, `api-budgeted 10s`, `slow 40s`). Phase 2 progress SHALL stream via `/api/scan` NDJSON (cloning → sniffing → scanning 13 → scoring) without blocking Phase 1 report.

#### Scenario: Phase 1 seals before Phase 2
- **WHEN** user visits `/live?repo=vercel/next.js`
- **THEN** page shows Phase 1 dial `6/102` within 10s, then streams Phase 2 steps and replaces with final `19/102` when clone seals, URL stays shareable

#### Scenario: Phase 2 budget exceeded degrades
- **WHEN** 4-min budget expires with `ARCH-01` still running
- **THEN** final report is `degraded` with Phase 1 6 rows `measured` and timed-out Phase 2 rows `unknown "budget-exceeded"`

