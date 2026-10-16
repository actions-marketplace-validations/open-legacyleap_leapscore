## Purpose

Run-history UI surfaces persisted scan runs as a browsable list and a file-backed detail view that reuses the sealed report presentation so any past scan is revisitable and shareable without re-running the engine.

## Requirements

### Requirement: List page columns and affordances

`GET /reports` SHALL render a table from site-owned history where each row is a past run's `meta` with columns for repo (`owner/repo`), score (numeric), tier (label with tier coloring), ranAt (relative time plus ISO on hover), duration (`durationMs` as seconds with `budgetMs` context), engineSha7 (short SHA chip), repoSha (short 7-char chip or `unknown`), status, and a primary link to `/reports/<runId>`. Each row SHALL also afford a secondary raw-JSON link and a rerun action that navigates to `/live?repo=<owner/repo>`. The page SHALL NOT read the scanner store (none exists) and SHALL NOT trigger a scan to render.

#### Scenario: Row shows duration vs budget

- **WHEN** a run has `durationMs: 83200` and `budgetMs: 90000`
- **THEN** the duration cell reads like `83s / 90s` or `83s (budget 90s)` rather than raw milliseconds

#### Scenario: Rerun links to fresh scan

- **WHEN** a list row for `vercel/next.js` is displayed
- **THEN** its rerun action links to `/live?repo=vercel%2Fnext.js` (fresh scan), not to any `/reports/<runId>` path

#### Scenario: Sample row is listed

- **WHEN** the site-owned history contains only the sample fixture
- **THEN** `/reports` shows 1 row for `django/django` with its score/tier and links to `/reports/<sampleRunId>` and raw JSON

#### Scenario: List reflects the ingested build input

- **WHEN** the site-owned history contains three runs
- **THEN** `/reports` renders exactly those three rows, in `ranAt` descending order, with no scanner contact and no request-time scan

#### Scenario: List does not depend on the scanner being reachable

- **WHEN** `/reports` is served while the scanner service is down
- **THEN** the page renders its site-owned history rows normally

### Requirement: Detail view reuses sealed report rendering

`GET /reports/[runId]` SHALL render the stored `report` with the same sealed report layout already used by the live page's post-reveal state and the sample page (dial gauge, tier, coverage strip, gates table, category scorecard, full 102-row table, deep-dive scope, provenance footer), driven entirely by the entry's `report` fields. The page SHALL display provenance derived from `meta`/`report.snapshot` (repo, `engineSha7`/`engine_version`, `rubric_version`, `ranAt`, `durationMs`, `repoSha`, `budgetMs`) and SHALL render the stored `trace` as the scan log when `trace` is present (with the same primary-milestone + expandable per-detector grouping as live), without fetching or streaming from the scanner. The history source is site-owned; the scanner is never contacted to materialize a detail view.

#### Scenario: Persisted detail matches live sealed output

- **WHEN** a scan produces a sealed `Report` that the site retains with `trace` having 37 entries
- **THEN** loading `/reports/<runId>` shows the identical dial score, category rows, gates, and full-table placeholders as the scan's sealed view did at write time, plus a scan log with the 37 trace entries grouped as milestones primary and per-detector secondary, expandable

#### Scenario: Sample redirect

- **WHEN** navigating to `/report/sample`
- **THEN** response is 301 to `/reports/<sampleRunId>` and the sample report renders via the site-owned history path (fixture entry, not an ingested file)

#### Scenario: Pre-change envelope without trace

- **WHEN** navigating to a `/reports/<runId>` whose entry carries no trace
- **THEN** the detail page renders the report normally and shows an empty scan log rather than failing

### Requirement: Empty and error states

An empty site-owned history SHALL render an empty-state message directing the user to scan a repo (e.g. via the home page UrlBox or `/live?repo=`). A detail navigation to a missing or grammatically invalid `runId` SHALL render a 404 with a link back to `/reports` and to `/live?repo=`.

#### Scenario: No runs yet

- **WHEN** site history contains no runs
- **THEN** `/reports` shows "No scans yet — paste a repo on the home page" (or equivalent) rather than an empty table

#### Scenario: Missing run shows recovery path

- **WHEN** `/reports/does__not__exist` is requested
- **THEN** the page shows 404 with actions to return to `/reports` and to scan that repo fresh via `/live?repo=`
