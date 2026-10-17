## MODIFIED Requirements

### Requirement: CLI HTML and Markdown emitters
The system SHALL ship HTML and Markdown report emitters with the CLI that render from the sealed envelope with no network dependencies: inline CSS only, no CDN fonts or scripts, no external images. Both SHALL open with score plus band, then the top five risks in plain language, then detail, and SHALL end with the methodology link, the band-specific assessment call to action, and the positioning line (single-sourced from `packages/contracts`) as the final content. The tracked assessment URL SHALL appear exactly once in each artifact.

#### Scenario: HTML renders offline
- **WHEN** `./out/report.html` is opened with no network access
- **THEN** it renders fully styled with score and band first, top five risks in plain language, and no failed external requests

#### Scenario: Markdown pastes into a ticket
- **WHEN** `./out/report.md` is pasted into a PR or ticket
- **THEN** it reads complete in two minutes: score and band, top five risks, band CTA, methodology link, positioning line

#### Scenario: Positioning line closes both artifacts
- **WHEN** a sealed run writes `report.html` and `report.md`
- **THEN** each document's final content block is the positioning line rendered from the shared constant, and the tracked assessment URL appears exactly once in the document

### Requirement: Band-specific next step
The system SHALL render a result-specific next step, never a generic banner: High or Critical directs to booking a $0 Assessment as significant modernisation risk; Moderate names the concentrated areas and what the assessment clarifies; Low advises keeping the scan in CI with the assessment link present but softer. The same sentence SHALL print once on CLI stdout, appended to the single stdout line after the status fields (score/band, gates, coverage, threshold state when `--fail-under` is set), with the tracked assessment URL as the line's final token and appearing exactly once in stdout. The assessment link SHALL carry a campaign parameter (`utm_campaign=cli-scan-v1` plus the sealed band) for click-through measurement; clicking is the only telemetry.

#### Scenario: Critical band CTA
- **WHEN** a report seals at score 20 (Critical)
- **THEN** HTML, Markdown, and stdout all carry the High/Critical booking line with the tracked assessment URL

#### Scenario: Low band CTA stays soft
- **WHEN** a report seals at score 85 (Low)
- **THEN** all three surfaces carry the keep-in-CI line with the assessment link present but de-emphasized

#### Scenario: Stdout sentence and URL land once
- **WHEN** any sealed run completes
- **THEN** stdout is a single line whose status fields keep their order, the band-specific sentence appears once after them, and the tracked URL is the final token appearing exactly once
