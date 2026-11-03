## MODIFIED Requirements

### Requirement: Next-band path block on report surfaces

Every report surface SHALL render the sealed next-band path as a single block: the destination band and `points_needed`, the steps grouped into cost classes in ascending verification effort with each class identified by its verify-effort tag, each class's cumulative recoverable points and arrival state, and the count of rows the path could not reach. The block SHALL render on the site report views, in CLI `report.html`, and in CLI `report.md`, positioned after the top risks and before the per-deduction detail. A terminal path SHALL render as a band-accomplished statement rather than an empty block, and a report with no path SHALL render no block at all.

#### Scenario: Block renders on every surface

- **WHEN** a sealed report carrying a path is viewed on the site, and its `report.html` and `report.md` are opened
- **THEN** all three render the same destination, `points_needed`, cost-classed steps, cumulative arrival, and unreached-row count

#### Scenario: Honest arrival is rendered, not smoothed

- **WHEN** the cheapest class alone does not reach the destination but the two cheapest classes together do
- **THEN** the block states both the shortfall and the crossing combination, rather than presenting the path as a single undifferentiated list

#### Scenario: Terminal band renders a statement

- **WHEN** the sealed report sits at the highest band
- **THEN** the block names that outcome and shows no destination or steps

#### Scenario: No path renders no block

- **WHEN** the sealed report has no path because the headline was suppressed
- **THEN** every surface omits the block and the existing coverage disclosure carries the explanation

#### Scenario: Path renders before detail

- **WHEN** `report.html` or `report.md` renders a report carrying a path
- **THEN** the path block follows the top risks and precedes the per-deduction detail section

#### Scenario: No class duration is published

- **WHEN** the block renders any cost class
- **THEN** it shows that class's recoverable points and cumulative points only, with no summed, ranged, or per-class duration

#### Scenario: A step's tag is not its fix duration

- **WHEN** a step's verify-effort tag is ⚡ ≤30 min and its remediation text describes multi-day work
- **THEN** the tag is presented as verification effort and is not joined to the remediation clause as though it were that work's duration

## ADDED Requirements

### Requirement: Verify-effort provenance wherever effort renders

Every surface that renders a row's `effort` value SHALL present it as verification effort — the time to establish the row's state — and SHALL NOT present it as, or unlabelled alongside, a claim about remediation cost or remediation duration. A row whose effort value is absent SHALL render as unknown cost and SHALL NOT default to the lowest effort bracket.

#### Scenario: Row-detail chip is verify-framed

- **WHEN** a reader expands a scored row on the site
- **THEN** the effort chip beside the remediation prose is labelled as verification effort and is not readable as the duration of the remediation that follows it

#### Scenario: Blockers chip carries the same framing

- **WHEN** the top-blockers list renders a row's effort chip
- **THEN** the chip uses the same verification-effort framing as the row detail and the path block, so one row cannot show two different cost meanings

#### Scenario: Absent tag renders unknown

- **WHEN** a row has no registry effort value
- **THEN** its effort renders as unknown rather than defaulting to the cheapest bracket

#### Scenario: A surface asserting fix duration fails

- **WHEN** any report surface renders a verify-effort tag as, or inside a label claiming, remediation cost or remediation duration
- **THEN** that surface violates this requirement and the verifying test fails
