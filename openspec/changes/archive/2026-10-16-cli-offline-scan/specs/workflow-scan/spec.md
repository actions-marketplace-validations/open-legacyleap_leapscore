## MODIFIED Requirements

### Requirement: Thin CLI contract
The system SHALL expose `scan <path> | --repo <owner/repo> [--sha <sha>] --out <dir> [--strict] [--fail-under <0-100>] [--format json,html,md]` which runs the scan and terminal scoring and writes a report directory. The CLI SHALL construct the scan URL as `https://github.com/<owner/repo>` for `--repo` mode and SHALL read the filesystem directly for `<path>` mode with no checkout or clone step.

#### Scenario: Minimal invocation seals a file
- **WHEN** the CLI runs with `--repo vercel/next.js --out ./out`
- **THEN** it writes `./out/report.json`, `./out/report.html`, and `./out/report.md` and prints a single human line with score, tier, gates, and coverage

#### Scenario: Minimal local invocation seals a directory
- **WHEN** the CLI runs as `leapscore scan ./app --out ./out`
- **THEN** it writes all three report files from local detectors only and prints the same single human line plus the tracked assessment URL

#### Scenario: Reserved sha fails loudly
- **WHEN** the CLI runs with any non-empty `--sha`
- **THEN** it exits `2` with a message stating sha pinning is not yet supported, and writes no report file

### Requirement: Exit-code map
A sealed report (`complete` or `degraded`, any score, gates fired or not) SHALL exit `0` unless `--fail-under <n>` trips, in which case it SHALL exit `3`. Gate and score verdicts live inside the envelope (`headline.tier`, `gates[]`), never in the step conclusion except for the threshold trip. Other exits: `1` for crash (clone failure, API outage, unexpected exception), `2` for refused/unsupported-input (not-found, private-without-token, rate-limited, non-empty `--sha`, `--strict` with `--repo`, bad `<path>`).

#### Scenario: Fired gate still exits zero
- **WHEN** a scan seals with a fired gate and tier `High`
- **THEN** the process exits `0` and the artifact contains the gate and tier

#### Scenario: Threshold trip exits three
- **WHEN** the CLI runs with `--fail-under 53` and seals at score 41
- **THEN** the process exits `3`, all three report files are still written, and stdout names the threshold

#### Scenario: Missing repo exits two
- **WHEN** the target does not exist
- **THEN** the process exits `2` with a `not-found` reason and no file is written

### Requirement: Artifact envelope file
The CLI SHALL write a report directory `--out <dir>` containing `report.json` as the envelope `{ report, meta, trace }` mirroring the website shape plus `report.html` and `report.md` sharing its score and `runId`: `report.report_schema` is `"1"`, `meta` carries `runId`/`repo`/`repoSha`/`score`/`tier`/`tier_legacy`/`status`/`budgetMs`/`durationMs`/`engineSha7`, `trace` is the ordered engine trace truncated with a sentinel when over 200 entries, and the artifact SHALL be uploaded with `if: always()` under a per-run name with 30-day retention. Stdout SHALL stay human (one line plus the assessment link printed once); the files SHALL stay machine and human respectively.

#### Scenario: Artifact round-trips the website shape
- **WHEN** a scan seals for `vercel/next.js`
- **THEN** `report.json` parses as `{ report, meta, trace }` with `report_snapshot.repo` normalized, `meta.repoSha` the clone HEAD or `"unknown"`, and `trace` ending in the seal entry

#### Scenario: Upload runs even on refusal
- **WHEN** the scan exits non-zero but a partial envelope was written
- **THEN** the workflow still uploads whatever file exists under the per-run artifact name

## ADDED Requirements

### Requirement: Strict flag conflict
The system SHALL reject `--strict` combined with `--repo` as a usage error before any scan work starts.

#### Scenario: Conflicting flags fail fast
- **WHEN** the CLI receives both `--strict` and `--repo owner/repo`
- **THEN** it exits `2` naming the conflict and performs no GH, clone, or filesystem scan work
