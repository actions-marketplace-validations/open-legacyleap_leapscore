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
The system SHALL treat `--out <dir>` as a directory and write `report.json` (machine), `report.html` (self-contained, no external assets), and `report.md` (pasteable) on every sealed run, plus print one stdout line whose status fields read score, band, gates, and coverage (threshold state appended when a numeric or band threshold gate is set), followed by the compact next-band path clause when the sealed report carries a path, then the band-specific next-step sentence and the tracked assessment URL as the line's final token, appearing exactly once.

#### Scenario: All three files land together
- **WHEN** a local scan seals with score 62 band Moderate
- **THEN** `./out/report.json`, `./out/report.html`, and `./out/report.md` all exist, share the same score and `runId`, and stdout is one line whose status fields contain `62/Moderate` plus the next-step sentence and the assessment link exactly once

#### Scenario: Path clause appears on the local stdout line
- **WHEN** a local scan seals with a next-band path present
- **THEN** the stdout line carries the compact path clause between the status fields and the next-step sentence, and the tracked URL remains the final token appearing exactly once

#### Scenario: Band gate appends threshold state
- **WHEN** a local scan runs with a band threshold gate set
- **THEN** the stdout line's status fields append the band gate's pass-or-trip state alongside the existing gate fields, and the report files are written regardless of the outcome

### Requirement: Local commit identity for versioning
The system SHALL set `scanned_commit` for local scans from `git -C <path> rev-parse HEAD` when available and `unknown` otherwise, and build `runId` from the path slug, engine identity, and start timestamp per the shared contract.

#### Scenario: Git checkout pins the commit
- **WHEN** `<path>` is a git checkout at `abc1234...`
- **THEN** `meta.repoSha` equals the full SHA and the HTML/MD subtitle shows `commit abc1234`

#### Scenario: Working tree without git stays honest
- **WHEN** `<path>` has no `.git`
- **THEN** `meta.repoSha` is `unknown` and reports render `commit unknown` as plain text

### Requirement: Baseline comparison invocation

The CLI SHALL accept a baseline sealed report and, when one is supplied, SHALL derive and emit the delta defined by `run-diff` without changing the sealed artifacts it writes: the same three report files, with the same content as an unbaselined run, and the same sealed-run stdout line unchanged. The delta summary SHALL be emitted as an additional stdout line after the sealed-run line, and the delta document SHALL be written alongside the reports in the output directory.

#### Scenario: Baselined run adds a document and a summary line

- **WHEN** a local scan runs with a baseline supplied
- **THEN** the output directory contains the three sealed reports plus the delta document, and stdout carries the sealed-run line followed by one delta summary line

#### Scenario: Sealed artifacts are byte-identical

- **WHEN** the same target is scanned once with and once without a baseline
- **THEN** `report.json`, `report.html`, and `report.md` are identical in both runs and carry the same fingerprint

#### Scenario: Unreadable baseline is refused before work

- **WHEN** the supplied baseline path does not exist, is unreadable, or is not a sealed report
- **THEN** the CLI exits `2` naming the problem and writes no report file

#### Scenario: Incomparable baseline still writes artifacts

- **WHEN** the baseline is readable but the verdict is `incomparable`
- **THEN** the three sealed reports and the delta document are written, the delta records the blocking cause, and no score delta is present
