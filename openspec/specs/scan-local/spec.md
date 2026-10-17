# scan-local Specification

## Purpose
Local-path scanning lets regulated teams run LeapScore on code that never leaves their machine, with an explicit strict-offline gate and a directory of human and machine reports.

## Requirements

### Requirement: Local path scan entry
The system SHALL provide `leapscore scan <path>` that scans a local directory using the clone-local detector set with no clone step and no GH-API calls unless `--repo` is also given.

#### Scenario: Scan a local directory
- **WHEN** the CLI runs as `leapscore scan ./claims-core --out ./out`
- **THEN** it reads files directly from `./claims-core`, runs the 25 local detectors, and writes `./out/report.json`, `./out/report.html`, and `./out/report.md`

#### Scenario: Missing path is a usage error
- **WHEN** `<path>` does not exist or is not a directory
- **THEN** the CLI exits `2` with a message naming the bad path and writes no reports

### Requirement: Strict offline gate
The system SHALL support `--strict`, under which any network attempt (GH-API, registry, EOL table, vuln DB refresh) aborts the scan rather than degrading silently. Without `--strict`, allowlisted open-internet GETs are permitted but code, file paths, and repository names SHALL never be transmitted.

#### Scenario: Strict run stays silent on the wire
- **WHEN** the CLI runs as `leapscore scan ./app --strict --out ./out`
- **THEN** no socket is opened; detectors use vendored snapshots and emit `unknown` with a re-run hint where live data would be needed

#### Scenario: Strict plus remote is rejected
- **WHEN** the CLI runs with both `--strict` and `--repo owner/repo`
- **THEN** it exits `2` immediately stating the flags conflict, and writes no reports

### Requirement: Out directory with three reports
The system SHALL treat `--out <dir>` as a directory and write `report.json` (machine), `report.html` (self-contained, no external assets), and `report.md` (pasteable) on every sealed run, plus print one stdout line whose status fields read score, band, gates, and coverage (threshold state appended when `--fail-under` is set), followed by the band-specific next-step sentence and the tracked assessment URL as the line's final token, appearing exactly once.

#### Scenario: All three files land together
- **WHEN** a local scan seals with score 62 band Moderate
- **THEN** `./out/report.json`, `./out/report.html`, and `./out/report.md` all exist, share the same score and `runId`, and stdout is one line whose status fields contain `62/Moderate` plus the next-step sentence and the assessment link exactly once

### Requirement: Local commit identity for versioning
The system SHALL set `scanned_commit` for local scans from `git -C <path> rev-parse HEAD` when available and `unknown` otherwise, and build `runId` from the path slug, engine identity, and start timestamp per the shared contract.

#### Scenario: Git checkout pins the commit
- **WHEN** `<path>` is a git checkout at `abc1234...`
- **THEN** `meta.repoSha` equals the full SHA and the HTML/MD subtitle shows `commit abc1234`

#### Scenario: Working tree without git stays honest
- **WHEN** `<path>` has no `.git`
- **THEN** `meta.repoSha` is `unknown` and reports render `commit unknown` as plain text
