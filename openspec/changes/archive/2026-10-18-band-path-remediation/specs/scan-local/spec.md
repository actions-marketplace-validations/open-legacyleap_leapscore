## MODIFIED Requirements

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
