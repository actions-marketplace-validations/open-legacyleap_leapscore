## MODIFIED Requirements

### Requirement: CLI HTML and Markdown emitters

The system SHALL ship HTML and Markdown report emitters with the CLI that render from the sealed envelope with no network dependencies: inline CSS only, no CDN fonts or scripts, no external images. Both SHALL open with score plus band, then the top five risks in plain language, then detail, and SHALL end with the methodology link, the verdict-specific assessment call to action, and the positioning line (single-sourced from `packages/contracts`) as the final content. When the headline is suppressed, both SHALL open with `insufficient signal` and no band, and the call to action SHALL be the `insufficient-signal` sentence. The tracked assessment URL SHALL appear exactly once in each artifact.

#### Scenario: HTML renders offline

- **WHEN** `./out/report.html` is opened with no network access
- **THEN** it renders fully styled with score and band first, top five risks in plain language, and no failed external requests

#### Scenario: Markdown pastes into a ticket

- **WHEN** `./out/report.md` is pasted into a PR or ticket
- **THEN** it reads complete in two minutes: score and band, top five risks, band CTA, methodology link, positioning line

#### Scenario: Suppressed emitters state the verdict

- **WHEN** a sealed run has the `insufficient-signal` verdict and writes `report.html` and `report.md`
- **THEN** each opens with `insufficient signal` and no band, and closes with the `insufficient-signal` sentence and a tracked URL without a `band` parameter

#### Scenario: Positioning line closes both artifacts

- **WHEN** a sealed run writes `report.html` and `report.md`
- **THEN** each document's final content block is the positioning line rendered from the shared constant, and the tracked assessment URL appears exactly once in the document

### Requirement: Band-specific next step

The system SHALL render a result-specific next step, never a generic banner. High or Critical SHALL direct to booking a $0 Assessment as significant modernisation risk. Moderate SHALL name the concentrated areas and what the assessment clarifies. Low SHALL advise keeping the scan in CI without claiming a peer benchmark. A suppressed headline SHALL state that the scan could not grade enough of the estate to publish a headline, that this is a coverage limit rather than a clean bill of health, and SHALL invite a conversation about what would make it measurable. The same sentence SHALL print once on CLI stdout, appended to the single stdout line after the status fields (score/band, gates, coverage, threshold state when a numeric or band threshold is set) and after the compact next-band path clause when the sealed report carries a path, with the tracked assessment URL as the line's final token and appearing exactly once in stdout. The assessment link SHALL use the grammar defined by `release-funnel`: a campaign parameter, a `band` parameter only for a scored report, and a `verdict` parameter with no `band` for a suppressed report.

#### Scenario: Critical band CTA

- **WHEN** a report seals at score 20 (Critical)
- **THEN** HTML, Markdown, and stdout all carry the High/Critical booking line with the tracked assessment URL

#### Scenario: Low band CTA stays soft

- **WHEN** a report seals at score 85 (Low)
- **THEN** all three surfaces carry the keep-in-CI line, do not claim a peer benchmark, and keep the assessment link present but de-emphasized

#### Scenario: Suppressed report gets its own next step

- **WHEN** a report seals with the `insufficient-signal` verdict
- **THEN** HTML, Markdown, and stdout carry the coverage-limit sentence, and the tracked URL carries `verdict=insufficient-signal` with no `band`

#### Scenario: Stdout sentence and URL land once

- **WHEN** any sealed run completes
- **THEN** stdout is a single line whose status fields keep their order, the verdict-specific sentence appears once after them, and the tracked URL is the final token appearing exactly once

#### Scenario: Path clause precedes the next-step sentence

- **WHEN** a sealed run's report carries a next-band path
- **THEN** the stdout line reads status fields, then the compact path clause, then the verdict-specific sentence, then the tracked URL as the final token
