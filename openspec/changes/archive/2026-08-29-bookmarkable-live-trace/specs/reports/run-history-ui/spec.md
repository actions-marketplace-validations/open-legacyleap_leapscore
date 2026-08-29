## MODIFIED Requirements

### Requirement: Detail view reuses sealed report rendering
`GET /reports/[runId]` SHALL render the stored `report` with the same sealed report layout already used by the live page's post-reveal state and the sample page (dial gauge, tier, coverage strip, gates table, category scorecard, full 102-row table, deep-dive scope, provenance footer), driven entirely by the file's `report` fields. The page SHALL display provenance derived from `meta`/`report.snapshot` (repo, `engineSha7`/`engine_version`, `rubric_version`, `ranAt`, `durationMs`, `repoSha`, `budgetMs`) and SHALL render the persisted `trace` as the scan log when `trace` is present (with the same primary-milestone + expandable per-detector grouping as live), without fetching or streaming from the engine. `GET /report/sample` SHALL 301 redirect to `/reports/<sampleRunId>` for the committed sample.

#### Scenario: Persisted detail matches live sealed output
- **WHEN** a scan produces a sealed `Report` that is then saved as `<runId>.json` with `trace` having 37 entries
- **THEN** loading `/reports/<runId>` shows the identical dial score, category rows, gates, and full-table as the scan's sealed view did at write time, plus a scan log with the 37 trace entries grouped as milestones primary and per-detector secondary, expandable

#### Scenario: Sample redirect
- **WHEN** navigating to `/report/sample`
- **THEN** response is 301 to `/reports/<sampleRunId>` and the sample report renders via the persisted detail path

#### Scenario: Pre-change envelope without trace
- **WHEN** navigating to a `/reports/<runId>` whose envelope was written before trace existed
- **THEN** the detail page renders the report normally and shows an empty scan log rather than failing

