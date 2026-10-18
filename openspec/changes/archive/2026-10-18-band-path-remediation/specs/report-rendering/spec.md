## MODIFIED Requirements

### Requirement: Band-specific next step

The system SHALL render a result-specific next step, never a generic banner: High or Critical directs to booking a $0 Assessment as significant modernisation risk; Moderate names the concentrated areas and what the assessment clarifies; Low advises keeping the scan in CI with the assessment link present but softer. The same sentence SHALL print once on CLI stdout, appended to the single stdout line after the status fields (score/band, gates, coverage, threshold state when a numeric or band threshold is set) and after the compact next-band path clause when the sealed report carries a path, with the tracked assessment URL as the line's final token and appearing exactly once in stdout. The assessment link SHALL carry a campaign parameter (`utm_campaign=cli-scan-v1` plus the sealed band) for click-through measurement; clicking is the only telemetry.

#### Scenario: Critical band CTA

- **WHEN** a report seals at score 20 (Critical)
- **THEN** HTML, Markdown, and stdout all carry the High/Critical booking line with the tracked assessment URL

#### Scenario: Low band CTA stays soft

- **WHEN** a report seals at score 85 (Low)
- **THEN** all three surfaces carry the keep-in-CI line with the assessment link present but de-emphasized

#### Scenario: Stdout sentence and URL land once

- **WHEN** any sealed run completes
- **THEN** stdout is a single line whose status fields keep their order, the band-specific sentence appears once after them, and the tracked URL is the final token appearing exactly once

#### Scenario: Path clause precedes the next-step sentence

- **WHEN** a sealed run's report carries a next-band path
- **THEN** the stdout line reads status fields, then the compact path clause, then the band-specific sentence, then the tracked URL as the final token

## ADDED Requirements

### Requirement: Next-band path block on report surfaces

Every report surface SHALL render the sealed next-band path as a single block: the destination band and `points_needed`, the steps grouped by cost class in sprint, quarter, structural order, each class's cumulative recoverable points and arrival state, and the count of rows the path could not reach. The block SHALL render on the site report views, in CLI `report.html`, and in CLI `report.md`, positioned after the top risks and before the per-deduction detail. A terminal path SHALL render as a band-accomplished statement rather than an empty block, and a report with no path SHALL render no block at all.

#### Scenario: Block renders on every surface

- **WHEN** a sealed report carrying a path is viewed on the site, and its `report.html` and `report.md` are opened
- **THEN** all three render the same destination, `points_needed`, cost-classed steps, cumulative arrival, and unreached-row count

#### Scenario: Honest arrival is rendered, not smoothed

- **WHEN** the sprint class alone does not reach the destination but sprint plus quarter does
- **THEN** the block states both the shortfall and the crossing class, rather than presenting the path as a single undifferentiated list

#### Scenario: Terminal band renders a statement

- **WHEN** the sealed report sits at the highest band
- **THEN** the block names that outcome and shows no destination or steps

#### Scenario: No path renders no block

- **WHEN** the sealed report has no path because the headline was suppressed
- **THEN** every surface omits the block and the existing coverage disclosure carries the explanation

#### Scenario: Path renders before detail

- **WHEN** `report.html` or `report.md` renders a report carrying a path
- **THEN** the path block follows the top risks and precedes the per-deduction detail section
