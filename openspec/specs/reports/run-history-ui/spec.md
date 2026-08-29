## Purpose

Run-history UI surfaces persisted scan runs as a browsable list and a file-backed detail view that reuses the sealed report presentation so any past scan is revisitable and shareable without re-running the engine.

## Requirements

### Requirement: List page columns and affordances

`GET /reports` SHALL render a table where each row is a run's `meta` with columns for repo (`owner/repo`), score (numeric), tier (label with tier coloring), ranAt (relative time plus ISO on hover), duration (`durationMs` as seconds with `budgetMs` context), engineSha7 (short SHA chip), repoSha (short 7-char chip or `unknown`), status, and a primary link to `/reports/<runId>`. Each row SHALL also afford a secondary raw-JSON link and a rerun action that navigates to `/live?repo=<owner/repo>`.

#### Scenario: Row shows duration vs budget
- **WHEN** a run has `durationMs: 83200` and `budgetMs: 90000`
- **THEN** the duration cell reads like `83s / 90s` or `83s (budget 90s)` rather than raw milliseconds

#### Scenario: Rerun links to fresh scan
- **WHEN** a list row for `vercel/next.js` is displayed
- **THEN** its rerun action links to `/live?repo=vercel%2Fnext.js` (fresh scan), not to any `/reports/<runId>` cached path

### Requirement: Detail view reuses sealed report rendering

`GET /reports/[runId]` SHALL render the stored `report` with the same sealed report layout already used by the live page's post-reveal state and the sample page (dial gauge, tier, coverage strip, gates table, category scorecard, full 102-row table, deep-dive scope, provenance footer), driven entirely by the file's `report` fields. The page SHALL display provenance derived from `meta`/`report.snapshot` (repo, `engineSha7`/`engine_version`, `rubric_version`, `ranAt`, `durationMs`, `repoSha`, `budgetMs`) and SHALL not fetch or stream from the engine.

#### Scenario: Persisted detail matches live sealed output
- **WHEN** a scan produces a sealed `Report` that is then saved as `<runId>.json`
- **THEN** loading `/reports/<runId>` shows the identical dial score, category rows, gates, and full-table placeholders as the scan's sealed view did at write time

### Requirement: Empty and error states

An empty `reports/` directory SHALL render an empty-state message directing the user to scan a repo (e.g. via the home page UrlBox or `/live?repo=`). A detail navigation to a missing or grammatically invalid `runId` SHALL render a 404 with a link back to `/reports` and to `/live?repo=`.

#### Scenario: No runs yet
- **WHEN** `reports/` contains no `*.json` files
- **THEN** `/reports` shows "No scans yet — paste a repo on the home page" (or equivalent) rather than an empty table

#### Scenario: Missing run shows recovery path
- **WHEN** `/reports/does__not__exist` is requested
- **THEN** the page shows 404 with actions to return to `/reports` and to scan that repo fresh via `/live?repo=`
