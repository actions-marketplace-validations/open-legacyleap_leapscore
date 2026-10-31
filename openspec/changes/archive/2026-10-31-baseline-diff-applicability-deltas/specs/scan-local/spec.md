## ADDED Requirements

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
