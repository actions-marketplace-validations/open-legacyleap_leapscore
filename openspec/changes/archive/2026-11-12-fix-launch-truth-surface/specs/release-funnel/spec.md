## MODIFIED Requirements

### Requirement: Site report next step

Every site report view (sample fixture, persisted run, revealed live report) SHALL end with a next-step band. For a scored report, the band SHALL render, in order: the band-specific next-step sentence, the tracked assessment link, and the positioning line. For a report whose headline is suppressed, the band SHALL render, in order: the `insufficient-signal` next-step sentence, a tracked assessment link that carries no band parameter, and the positioning line. The sentence and link SHALL come from the same contracts helpers the CLI uses, so the two surfaces cannot drift.

#### Scenario: Band renders on all report surfaces

- **WHEN** any site report view for a scored run renders
- **THEN** it ends with the band containing the sentence for the sealed tier, the tracked assessment URL, and the positioning line

#### Scenario: Suppressed report renders the verdict step

- **WHEN** any site report view for a suppressed run renders
- **THEN** it ends with the `insufficient-signal` sentence, a tracked assessment URL without a `band` parameter, and the positioning line

#### Scenario: Shared text, no per-surface copy

- **WHEN** a band or verdict sentence changes in contracts
- **THEN** the CLI reports and the site band change together, with no independent copy in site components

### Requirement: Tracked next-step link grammar

Every next-step link the system emits — CLI reports, CLI stdout, site next-step bands — SHALL be built by the shared helper. For a scored report the link SHALL carry exactly `utm_campaign=cli-scan-v1` and `band=<tier>` with the public band lowercased. For a suppressed report the link SHALL carry `utm_campaign=cli-scan-v1` and `verdict=insufficient-signal`, and SHALL NOT carry a `band` parameter. The tracked URL SHALL appear exactly once in each artifact (HTML report, Markdown report, stdout line, site band). The system SHALL NOT contact the assessment host during a scan; clicking is the only telemetry.

#### Scenario: One link per artifact

- **WHEN** a sealed run writes `report.html`, `report.md`, and stdout
- **THEN** each contains the tracked URL exactly once

#### Scenario: Grammar follows the sealed band

- **WHEN** the sealed band is Low, Moderate, High, or Critical
- **THEN** the `band` parameter reads `low`, `moderate`, `high`, or `critical` respectively

#### Scenario: Suppressed report carries no band

- **WHEN** the sealed report has the `insufficient-signal` verdict
- **THEN** its next-step link carries `verdict=insufficient-signal` and no `band` parameter

#### Scenario: No automatic contact

- **WHEN** a default scan completes
- **THEN** no request to the assessment host is made (the link exists only as text)
