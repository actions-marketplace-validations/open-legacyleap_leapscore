## Purpose

Persisted scan runs as addressable JSON files keyed by a repo-derived run identity, with a manifest-style envelope and deterministic fresh-vs-cached routing so any past report can be revisited without re-running the engine.

## Requirements

### Requirement: Envelope and file layout

The system SHALL persist every successfully completed scan as a single JSON file at `apps/site/reports/<runId>.json` where the file content is an envelope `{ meta, report }`. `report` SHALL be the full `Report` contract produced by the scan route's terminal scoring; `meta` SHALL be a list-view header sufficient to render the run history without opening the full report. `apps/site/reports/` SHALL be gitignored; missing directory SHALL be created on first write.

#### Scenario: Sealed scan produces one file
- **WHEN** `GET /api/scan?repo=vercel/next.js` reaches `done` and scores a terminal `Report`
- **THEN** the route writes exactly one file `apps/site/reports/<runId>.json` containing `{ meta, report }` with `report` identical to the streamed terminal report and `meta` carrying the header fields below

#### Scenario: Refused scan writes nothing
- **WHEN** the scan yields `refused` (e.g. `not_found`, `rate-limited`, `crash`)
- **THEN** no file is created and no runId is issued

### Requirement: runId grammar and repoSlug derivation

`runId` SHALL be `<repoSlug>__<engineSha7>__<ts>` where `repoSlug` is the normalized repo `owner/repo` (via the existing ingestion normalizer) lowercased and mapped to `owner__repo` (dots and hyphens preserved, `__` is the sole separator), `engineSha7` is the scanner's commit short SHA (7 chars) or the literal `unknown` when unavailable, and `ts` is the run's `ranAt` ISO timestamp made file-safe by replacing `:` with empty and `.` with `-` (e.g. `2026-08-29T05:33:00.123Z` → `2026-08-29T053000-123Z`). The resulting `runId` SHALL be the filename stem and the URL path param for the detail view; it SHALL validate as a single path segment with no `/` or `..`.

#### Scenario: Repo URL maps to deterministic repoSlug
- **WHEN** inputs are `https://github.com/Vercel/next.js.git`, `github.com/vercel/next.js/tree/canary`, and `vercel/next.js`
- **THEN** all three derive the same `repoSlug` `vercel__next.js` and produce distinct `runId`s only via `engineSha7` and `ts`

#### Scenario: Engine SHA is part of identity
- **WHEN** two scans for the same repo run against engine commits `abc1234` and `def5678`
- **THEN** they produce distinct files `vercel__next.js__abc1234__<ts>.json` and `vercel__next.js__def5678__<ts>.json` and are listed as separate runs

#### Scenario: Timestamp distinguishes same-second reruns
- **WHEN** two fresh runs for the same repo and same engineSha start within the same second
- **THEN** their `ts` differ at ms granularity and produce two distinct files

### Requirement: Meta header fields

Each file's `meta` SHALL contain at minimum: `repo` (`owner/repo`), `repoUrl` (`https://github.com/owner/repo`), `repoSlug`, `engineSha7`, `runId`, `ranAt` (ISO-8601), `durationMs` (wall-clock ms from scan start to `done`), `budgetMs` (from the scan's budget), `repoSha` (the scanned repo's HEAD commit, or `"unknown"` for GH-only scans), `score`, `tier`, `status` (`complete`), `engine_version`, `rubric_version`, and `filename`. The list page SHALL render solely from `meta` without opening `report`.

#### Scenario: GH-only scan records unknown repoSha
- **WHEN** a scan completes without cloning (all requested indicators were GH-API)
- **THEN** `meta.repoSha` is `"unknown"` and the list row shows `unknown` for the repo commit while still displaying score and tier

#### Scenario: Meta mirrors report headline
- **WHEN** `report.headline.score` is 62.4 with tier `Moderate`
- **THEN** `meta.score` is 62.4 and `meta.tier` is `Moderate`, consistent with the envelope's `report`

### Requirement: Fresh-run vs cached routing semantics

`GET /api/scan?repo=owner/repo` SHALL always execute a fresh scan and write a new file; it SHALL never serve a previously written file as a cache hit. `GET /reports/[runId]` (and any re-visit of the same `/reports/[runId]` URL) SHALL load the file from disk and SHALL never invoke the engine.

#### Scenario: Revisiting without runId triggers fresh scan
- **WHEN** a user visits `/live?repo=vercel/next.js` twice in a row without a `runId` in the URL
- **THEN** each visit streams a new scan via the engine and writes a second file with a distinct `ts`

#### Scenario: Revisiting with runId loads from disk
- **WHEN** a user visits `/reports/vercel__next.js__abc1234__2026-08-29T053000-123Z`
- **THEN** the page reads `apps/site/reports/vercel__next.js__abc1234__2026-08-29T053000-123Z.json` from disk, renders it without any engine call, and shows the same score regardless of how many times the URL is opened

### Requirement: Run-history list

`GET /reports` SHALL enumerate `apps/site/reports/*.json`, parse each file's `meta`, and render a table sorted by `ranAt` descending with columns: repo (`owner/repo`), score, tier, ranAt (relative + ISO), duration (`durationMs` with `budgetMs` as context), `engineSha7`, `repoSha` (short), status, and a link to `/reports/<runId>`. An empty `reports/` directory SHALL show an empty state with a call to action to scan a repo. Invalid JSON files SHALL be skipped (not crash the page) and the valid rows still rendered.

#### Scenario: List sorted by time descending
- **WHEN** three files exist with `ranAt` times `08-29T05:00Z`, `08-29T06:00Z`, `08-28T22:00Z`
- **THEN** the table order is `06:00`, `05:00`, `22:00` previous day

#### Scenario: List survives one bad file
- **WHEN** `reports/` contains two valid envelopes and one file with truncated JSON
- **THEN** the page renders the two valid rows and ignores the bad file (with a server-side warning logged)

### Requirement: Detail page loads single run from disk

`GET /reports/[runId]` SHALL validate `runId` against the grammar (single segment, no `/` or `..`), join only under `apps/site/reports/`, and on success render the sealed report view (dial, tier, coverage, gates, category scorecard, full table, deep-dive scope) from the file's `report`. A missing file or a `runId` failing validation SHALL return 404. The detail page SHALL not call the scan engine.

#### Scenario: Valid runId renders sealed report
- **WHEN** `reports/vercel__next.js__abc1234__2026-08-29T053000-123Z.json` exists
- **THEN** navigation to `/reports/vercel__next.js__abc1234__2026-08-29T053000-123Z` shows the same headline, categories, and gates as the streamed report that produced that file

#### Scenario: Unknown runId is 404
- **WHEN** the path is `/reports/vercel__next.js__abc1234__1999-01-01T000000-000Z`
- **THEN** the server returns 404 and does not invoke a scan

#### Scenario: Path traversal is rejected
- **WHEN** the path contains `..`, `/`, or a segment not matching the `runId` grammar (e.g. `../../etc/passwd`)
- **THEN** the request is rejected with 400/404 before any filesystem access outside `reports/`

### Requirement: Engine snapshot carries repoSha

The unified scan's terminal snapshot (yielded on `done`) SHALL include the scanned repo's HEAD commit as `scanned_commit` (full SHA from `shallowClone` when cloning, otherwise `"unknown"`). The scan route SHALL propagate this into both `meta.repoSha` and `report.snapshot.scanned_commit` so the file identity and history display are decoupled from the repo's mutable HEAD.

#### Scenario: Clone-backed scan records repoSha
- **WHEN** the unified scan clones `vercel/next.js` at commit `1a2b3c4d...`
- **THEN** the terminal snapshot carries `scanned_commit: "1a2b3c4d..."`, and the resulting file's `meta.repoSha` equals that SHA

### Requirement: Keep-everything retention and gitignore

The system SHALL never delete or overwrite files in `apps/site/reports/` on its own (no TTL, no eviction, no dedup). Users may delete files manually. `apps/site/reports/` SHALL be listed in `apps/site/.gitignore`.

#### Scenario: Consecutive fresh runs accumulate files
- **WHEN** a repo is scanned three times in a row
- **THEN** `reports/` contains three distinct `runId` files, all shown on `/reports`, with no file removed
