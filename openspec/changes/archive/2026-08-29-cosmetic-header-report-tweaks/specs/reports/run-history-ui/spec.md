## MODIFIED Requirements

### Requirement: List page columns and affordances

`GET /reports` SHALL render a table where each row is a run's `meta` with columns for repo (`owner/repo`), score (numeric), tier (label with tier coloring), ranAt (relative time plus ISO on hover), duration (`durationMs` as seconds with `budgetMs` context), engineSha7 (short SHA chip), repoSha (short 7-char chip or `unknown`), status, and a primary link to `/reports/<runId>`. Each row SHALL also afford a secondary raw-JSON link and a rerun action that navigates to `/live?repo=<owner/repo>`. The committed sample run SHALL appear as a normal row in this table.

#### Scenario: Row shows duration vs budget
- **WHEN** a run has `durationMs: 83200` and `budgetMs: 90000`
- **THEN** the duration cell reads like `83s / 90s` or `83s (budget 90s)` rather than raw milliseconds

#### Scenario: Rerun links to fresh scan
- **WHEN** a list row for `vercel/next.js` is displayed
- **THEN** its rerun action links to `/live?repo=vercel%2Fnext.js` (fresh scan), not to any `/reports/<runId>` cached path

#### Scenario: Sample row is listed
- **WHEN** only the committed sample file exists in `reports/`
- **THEN** `/reports` shows 1 row for `django/django` with its score/tier and links to `/reports/<sampleRunId>` and raw JSON

### Requirement: Detail view reuses sealed report rendering

`GET /reports/[runId]` SHALL render the stored `report` with the same sealed report layout already used by the live page's post-reveal state and the sample page (dial gauge, tier, coverage strip, gates table, category scorecard, full 102-row table, deep-dive scope, provenance footer), driven entirely by the file's `report` fields. The page SHALL display provenance derived from `meta`/`report.snapshot` (repo, `engineSha7`/`engine_version`, `rubric_version`, `ranAt`, `durationMs`, `repoSha`, `budgetMs`) and SHALL not fetch or stream from the engine. `GET /report/sample` SHALL 301 redirect to `/reports/<sampleRunId>` for the committed sample.

#### Scenario: Persisted detail matches live sealed output
- **WHEN** a scan produces a sealed `Report` that is then saved as `<runId>.json`
- **THEN** loading `/reports/<runId>` shows the identical dial score, category rows, gates, and full-table placeholders as the scan's sealed view did at write time

#### Scenario: Sample redirect
- **WHEN** navigating to `/report/sample`
- **THEN** response is 301 to `/reports/<sampleRunId>` and the sample report renders via the persisted detail path
