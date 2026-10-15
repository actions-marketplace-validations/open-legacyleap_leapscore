## MODIFIED Requirements

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
