## Purpose

Run-history UI surfaces persisted scan runs as a browsable list and a file-backed detail view that reuses the sealed report presentation so any past scan is revisitable and shareable without re-running the engine.

## Requirements

### Requirement: List page columns and affordances

`GET /reports` SHALL render a table where each row is an ingested run's `meta` with columns for repo (`owner/repo`), score (numeric), tier (label with tier coloring), ranAt (relative time plus ISO on hover), duration (`durationMs` as seconds with `budgetMs` context), engineSha7 (short SHA chip), repoSha (short 7-char chip or `unknown`), status, and a primary link to `/reports/<runId>`. Each row SHALL also afford a secondary raw-JSON link and a rerun action that navigates to `/live?repo=<owner/repo>`. The page SHALL be generated at build time from the ingested envelopes and SHALL NOT read the filesystem while serving a request. The ingested sample run SHALL appear as a normal row in this table.

#### Scenario: Row shows duration vs budget
- **WHEN** a run has `durationMs: 83200` and `budgetMs: 90000`
- **THEN** the duration cell reads like `83s / 90s` or `83s (budget 90s)` rather than raw milliseconds

#### Scenario: Rerun links to fresh scan
- **WHEN** a list row for `vercel/next.js` is displayed
- **THEN** its rerun action links to `/live?repo=vercel%2Fnext.js` (fresh scan), not to any `/reports/<runId>` path

#### Scenario: Sample row is listed
- **WHEN** the ingest set contains only the sample envelope
- **THEN** `/reports` shows 1 row for `django/django` with its score/tier and links to `/reports/<sampleRunId>` and raw JSON

#### Scenario: List reflects the ingested build input
- **WHEN** the site is built from an ingest set containing three envelopes
- **THEN** `/reports` renders exactly those three rows, in `ranAt` descending order, with no filesystem read at request time

#### Scenario: List does not depend on the scanner being reachable
- **WHEN** `/reports` is served while the scanner service is down
- **THEN** the page renders its ingested rows normally

### Requirement: Detail view reuses sealed report rendering

`GET /reports/[runId]` SHALL render the stored `report` with the same sealed report layout already used by the live page's post-reveal state and the sample page (dial gauge, tier, coverage strip, gates table, category scorecard, full 102-row table, deep-dive scope, provenance footer), driven entirely by the file's `report` fields. The page SHALL display provenance derived from `meta`/`report.snapshot` (repo, `engineSha7`/`engine_version`, `rubric_version`, `ranAt`, `durationMs`, `repoSha`, `budgetMs`) and SHALL render the persisted `trace` as the scan log when `trace` is present (with the same primary-milestone + expandable per-detector grouping as live), without fetching or streaming from the engine. `GET /report/sample` SHALL 301 redirect to `/reports/<sampleRunId>` for the committed sample.

#### Scenario: Persisted detail matches live sealed output
- **WHEN** a scan produces a sealed `Report` that is then saved as `<runId>.json` with `trace` having 37 entries
- **THEN** loading `/reports/<runId>` shows the identical dial score, category rows, gates, and full-table placeholders as the scan's sealed view did at write time, plus a scan log with the 37 trace entries grouped as milestones primary and per-detector secondary, expandable

#### Scenario: Sample redirect
- **WHEN** navigating to `/report/sample`
- **THEN** response is 301 to `/reports/<sampleRunId>` and the sample report renders via the persisted detail path

#### Scenario: Pre-change envelope without trace
- **WHEN** navigating to a `/reports/<runId>` whose envelope was written before trace existed
- **THEN** the detail page renders the report normally and shows an empty scan log rather than failing

### Requirement: Empty and error states

An empty `reports/` directory SHALL render an empty-state message directing the user to scan a repo (e.g. via the home page UrlBox or `/live?repo=`). A detail navigation to a missing or grammatically invalid `runId` SHALL render a 404 with a link back to `/reports` and to `/live?repo=`.

#### Scenario: No runs yet
- **WHEN** `reports/` contains no `*.json` files
- **THEN** `/reports` shows "No scans yet — paste a repo on the home page" (or equivalent) rather than an empty table

#### Scenario: Missing run shows recovery path
- **WHEN** `/reports/does__not__exist` is requested
- **THEN** the page shows 404 with actions to return to `/reports` and to scan that repo fresh via `/live?repo=`
