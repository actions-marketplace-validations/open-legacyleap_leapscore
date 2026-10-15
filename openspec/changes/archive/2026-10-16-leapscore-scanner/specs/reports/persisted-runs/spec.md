## ADDED Requirements

### Requirement: Envelope ingest as build input

The website SHALL consume report envelopes as **build inputs** supplied by an explicit sync step, not as request-time state. The sync step SHALL be the only mechanism that places envelopes into the website's build-input directory (`apps/site/reports/`), and it SHALL copy envelopes from the scanner's canonical store without modifying their contents. The website SHALL have no code path that creates, mutates, or deletes an envelope.

#### Scenario: Ingest copies without altering

- **WHEN** the sync step ingests a sealed envelope from the scanner's store
- **THEN** the envelope lands in the build-input directory byte-identical in its `meta`, `report`, and `trace` parts

#### Scenario: Ingest tolerates an unreadable envelope

- **WHEN** the sync step encounters an envelope that fails to parse or carries an unsupported contract version
- **THEN** it skips that envelope, reports a warning naming it, and completes the ingest of the remaining envelopes

#### Scenario: Ingest is idempotent

- **WHEN** the sync step runs twice over the same source set without any new scans
- **THEN** the build-input directory ends in the same state and no envelope is duplicated

#### Scenario: Website never writes

- **WHEN** the website's source is inspected for any code path that creates or mutates an envelope in the build-input directory
- **THEN** none exists

### Requirement: Detail route generated per ingested run

`/reports/[runId]` SHALL be generated at build time for exactly the `runId` values present in the ingested envelope set, and SHALL render the sealed report view (dial, tier, coverage, gates, category scorecard, full table, deep-dive scope) from that envelope's `report`, plus the persisted `trace` as the scan log. The route SHALL NOT be generated on demand for a `runId` that was not ingested, and SHALL NOT read the filesystem while serving a request.

#### Scenario: Every ingested run has a page

- **WHEN** the build runs with an ingest set containing three envelopes
- **THEN** exactly three detail routes are generated, one per `runId`

#### Scenario: Un-ingested runId is not a page

- **WHEN** `/reports/vercel__next.js__abc1234__2026-10-16T053000-123Z` is requested and that `runId` is not in the ingest set
- **THEN** the website returns 404 and never attempts to reach the scanner or the filesystem to materialize it

#### Scenario: Traversal is rejected

- **WHEN** the path contains `..`, `/`, or a segment not matching the `runId` grammar
- **THEN** the request is rejected with 400/404 before any route resolution

#### Scenario: Detail renders without the scanner

- **WHEN** an ingested detail page is served while the scanner service is down
- **THEN** it renders its frozen report and scan log normally

## MODIFIED Requirements

### Requirement: Envelope and file layout

The scanner SHALL persist every successfully completed scan as a single JSON envelope `{ meta, report, trace }` in its own canonical store, keyed by `runId`. `report` SHALL be the full contract-shaped report produced by terminal scoring; `meta` SHALL be a list-view header sufficient to render run history without opening the report body; `trace` SHALL be the exhaustive ordered trace array streamed during the scan (may be `[]` for pre-change envelopes, otherwise present). The website SHALL consume envelopes from a tracked build-input directory `apps/site/reports/` populated only by the sync step, where the filename stem is the `runId`. The committed sample envelope `django__django__<engineSha7>__<ts>.json` SHALL remain present in that directory so a fresh checkout lists a run without performing a scan.

#### Scenario: Sealed scan produces one file
- **WHEN** a scan reaches seal and scores a terminal report
- **THEN** the scanner writes exactly one envelope carrying `{ meta, report, trace }`, with `report` identical to the report it streamed terminally and `trace` identical to the streamed trace frames in emitted order

#### Scenario: Refused scan writes nothing
- **WHEN** the scan is refused (e.g. `not_found`, `rate-limited`, `crash`)
- **THEN** no envelope is created, in the scanner's store or in the website's build inputs, and no `runId` is issued

#### Scenario: Sample envelope is committed
- **WHEN** the repo is checked out fresh and `apps/site/reports/` is listed
- **THEN** the sample envelope exists, and the run-history page lists it without any prior live scan and without contacting the scanner

#### Scenario: Website store is a build input, not a runtime store
- **WHEN** the website is deployed
- **THEN** `apps/site/reports/` is part of the build artifact and no request-time write ever targets it

### Requirement: Fresh-run vs cached routing semantics

A fresh scan SHALL always be executed by the scanner service via the scan API and SHALL never be served from a previously written envelope. The website SHALL never execute a scan: no website route SHALL import the engine, and no website route SHALL accept a scan request. Re-visiting `/reports/[runId]` for an ingested `runId` SHALL render the frozen ingested envelope without invoking any scan.

#### Scenario: Revisiting without runId triggers fresh scan
- **WHEN** a user visits `/live?repo=vercel/next.js` twice in a row
- **THEN** each visit starts a new scan on the scanner service and produces a distinct `runId`, and the website performs no scan work itself

#### Scenario: Revisiting with runId loads from disk
- **WHEN** a user visits `/reports/vercel__next.js__abc1234__2026-10-16T053000-123Z` for an ingested run
- **THEN** the page renders that frozen envelope and shows the same score regardless of how many times the URL is opened, with no engine call and no scanner call

#### Scenario: Website exposes no scan endpoint
- **WHEN** the website's route list is inspected
- **THEN** no route accepts a scan request, and the boundary check from the `scanner-service` capability enforces this

#### Scenario: Ingest drives addressability, not the scan
- **WHEN** a scan seals but its envelope has not been ingested
- **THEN** the run is shareable via the scanner's permalink and is not yet addressable at `/reports/<runId>` on the website

### Requirement: Run-history list

`GET /reports` SHALL render, at build time, a table built from the `meta` of every envelope in the ingested build-input set, sorted by `ranAt` descending, with columns: repo (`owner/repo`), score, tier, ranAt (relative + ISO), duration (`durationMs` with `budgetMs` as context), `engineSha7`, `repoSha` (short), status, and a link to `/reports/<runId>`. An empty ingest set SHALL show an empty state with a call to action to scan a repo. An invalid or unsupported-version envelope SHALL be skipped (not crash the build) and the valid rows still rendered.

#### Scenario: List sorted by time descending
- **WHEN** three ingested envelopes have `ranAt` times `08-29T05:00Z`, `08-29T06:00Z`, `08-28T22:00Z`
- **THEN** the table order is `06:00`, `05:00`, `22:00` previous day

#### Scenario: List survives one bad file
- **WHEN** the ingest set contains two valid envelopes and one envelope with truncated JSON
- **THEN** the page renders the two valid rows and the build succeeds with a warning logged for the bad envelope

#### Scenario: List is stable after deploy
- **WHEN** the deployed site is served repeatedly with no rebuild
- **THEN** `/reports` shows the same rows every time, because the list is a build artifact rather than a request-time enumeration

### Requirement: Keep-everything retention and website directory tracking

The system SHALL never delete or overwrite envelopes in the scanner's canonical store on its own (no TTL, no eviction, no dedup); retention policy is the scanner's concern and users may delete entries manually. The website's build-input directory `apps/site/reports/` SHALL be **tracked in git** rather than gitignored, so the ingested set is reproducible and reviewable, and so a build does not depend on a request-time filesystem read.

#### Scenario: Consecutive fresh runs accumulate envelopes
- **WHEN** a repo is scanned three times in a row
- **THEN** the scanner's store contains three distinct `runId` envelopes, none removed

#### Scenario: Build inputs are tracked
- **WHEN** the sync step ingests a new envelope and the change is committed
- **THEN** the envelope is present in git and a fresh clone can build the site with that run listed, with no scanner access

#### Scenario: Ingest set is capped by policy, not by the website
- **WHEN** the scanner's retention policy prunes older envelopes
- **THEN** the website reflects whatever the sync step provides and applies no retention logic of its own

### Requirement: CLI envelope producer
The envelope contract `{ meta, report, trace }` SHALL have multiple producers on the producing side: the scanner service, and the workflow-scan CLI writing to its `--out` path in the runner working directory. The CLI envelope SHALL carry the same contract-shaped `report` and the same `meta` header fields as the scanner service's envelope; `meta.engineSha7` SHALL resolve from `LEAPSCORE_SHA`, then the workflow's pinned engine ref input when present, then `git rev-parse --short HEAD`, else the literal `unknown`. Neither producer writes into the website's build-input directory: the CLI file is a portable artifact and the scanner's store is canonical, and the website consumes both only through the sync step.

#### Scenario: CLI envelope matches website keys
- **WHEN** the same repo seals via the scanner service and via the CLI
- **THEN** both envelopes parse as `{ meta, report, trace }` with identical required `meta` keys and the same report contract version

#### Scenario: Runner without git still issues identity
- **WHEN** the CLI runs on a runner with no checkout and no SHA env set
- **THEN** `meta.engineSha7` is `"unknown"` and the file is still written and valid

#### Scenario: No producer writes website build inputs directly
- **WHEN** the scanner seals a run and the CLI writes an artifact
- **THEN** neither has written into `apps/site/reports/`, which the sync step alone populates

## REMOVED Requirements

### Requirement: Detail page loads single run from disk

**Reason**: The detail route performed a request-time filesystem read of `apps/site/reports/<runId>.json`, which is exactly the coupling this change removes. That read was also the source of the build defect where Next.js baked an empty `/reports` list and a fabricated `reports/placeholder__unknown__2026-01-01T000000-000Z.html` detail page for a `runId` that never existed, because the caching posture of a filesystem read was never explicitly decided.

**Migration**: The detail route is now generated at build time for each ingested `runId` (see the added requirement "Detail route generated per ingested run"). Validation of the `runId` grammar, rejection of traversal, and the "never call the engine" property are all preserved; only the source of the envelope and the time of resolution change. A `runId` that is not in the ingest set returns 404 without attempting any filesystem or network access.
