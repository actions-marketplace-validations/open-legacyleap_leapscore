## ADDED Requirements

### Requirement: CLI HTML and Markdown emitters
The system SHALL ship HTML and Markdown report emitters with the CLI that render from the sealed envelope with no network dependencies: inline CSS only, no CDN fonts or scripts, no external images. Both SHALL open with score plus band, then the top five risks in plain language, then detail, and SHALL end with the methodology link and the band-specific assessment call to action.

#### Scenario: HTML renders offline
- **WHEN** `./out/report.html` is opened with no network access
- **THEN** it renders fully styled with score and band first, top five risks in plain language, and no failed external requests

#### Scenario: Markdown pastes into a ticket
- **WHEN** `./out/report.md` is pasted into a PR or ticket
- **THEN** it reads complete in two minutes: score and band, top five risks, band CTA, methodology link

### Requirement: Band-specific next step
The system SHALL render a result-specific next step, never a generic banner: High or Critical directs to booking a $0 Assessment as significant modernisation risk; Moderate names the concentrated areas and what the assessment clarifies; Low advises keeping the scan in CI with the assessment link present but softer. The same line SHALL print once on CLI stdout. The assessment link SHALL carry a campaign parameter for click-through measurement; clicking is the only telemetry.

#### Scenario: Critical band CTA
- **WHEN** a report seals at score 20 (Critical)
- **THEN** HTML, Markdown, and stdout all carry the High/Critical booking line with the tracked assessment URL

#### Scenario: Low band CTA stays soft
- **WHEN** a report seals at score 85 (Low)
- **THEN** all three surfaces carry the keep-in-CI line with the assessment link present but de-emphasized

### Requirement: Every deduction traces in all formats
The system SHALL surface per-deduction trace (file or dependency, rule, weight contribution) in JSON and in summarized form in HTML and Markdown, so no score appears without an auditable finding behind it.

#### Scenario: Top risk links to evidence
- **WHEN** the top risk is EOL Java 8 in three files
- **THEN** JSON holds the full `evidencePointers` and `provenance`, and HTML/Markdown name the files, the rule, and the weight contribution for that deduction
