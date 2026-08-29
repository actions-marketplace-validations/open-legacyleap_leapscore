## MODIFIED Requirements

### Requirement: Envelope and file layout
The system SHALL persist every successfully completed scan as a single JSON file at `apps/site/reports/<runId>.json` where the file content is an envelope `{ meta, report, trace }`. `report` SHALL be the full `Report` contract produced by the scan route's terminal scoring; `meta` SHALL be a list-view header sufficient to render the run history without opening the full report; `trace` SHALL be the exhaustive ordered trace array streamed during the scan (may be `[]` for pre-change files, otherwise present). `apps/site/reports/` SHALL be gitignored except for a single committed sample envelope `django__django__<engineSha7>__<ts>.json` (where `engineSha7` is the current git short SHA at generation time) which SHALL be checked into git via an exception rule; missing directory SHALL be created on first write.

#### Scenario: Sealed scan produces one file
- **WHEN** `GET /api/scan?repo=vercel/next.js` reaches `done` and scores a terminal `Report`
- **THEN** the route writes exactly one file `apps/site/reports/<runId>.json` containing `{ meta, report, trace }` with `report` identical to the streamed terminal report, `trace` identical to the streamed trace frames in emitted order, and `meta` carrying the header fields below

#### Scenario: Refused scan writes nothing
- **WHEN** the scan yields `refused` (e.g. `not_found`, `rate-limited`, `crash`)
- **THEN** no file is created and no runId is issued

#### Scenario: Sample envelope is committed
- **WHEN** the repo is checked out fresh and `apps/site/reports/` is listed
- **THEN** exactly one `django__django__*.json` file exists in git (the sample), and `GET /reports` lists it without requiring a prior live scan
