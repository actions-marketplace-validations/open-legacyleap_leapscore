## MODIFIED Requirements

### Requirement: Out directory with three reports
The system SHALL treat `--out <dir>` as a directory and write `report.json` (machine), `report.html` (self-contained, no external assets), and `report.md` (pasteable) on every sealed run, plus print one stdout line whose status fields read score, band, gates, and coverage (threshold state appended when `--fail-under` is set), followed by the band-specific next-step sentence and the tracked assessment URL as the line's final token, appearing exactly once.

#### Scenario: All three files land together
- **WHEN** a local scan seals with score 62 band Moderate
- **THEN** `./out/report.json`, `./out/report.html`, and `./out/report.md` all exist, share the same score and `runId`, and stdout is one line whose status fields contain `62/Moderate` plus the next-step sentence and the assessment link exactly once
