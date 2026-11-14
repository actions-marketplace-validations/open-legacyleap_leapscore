## Purpose

A build-time gallery of committed sealed sample envelopes that demonstrates the report surface without a scanner, a report store, or any request-time read.

## Requirements

### Requirement: Samples are committed build inputs

Every sample report SHALL be a sealed envelope committed to the repository. The site SHALL NOT produce, fetch, or generate a sample at build or request time, and SHALL NOT present a visitor's own scan as a sample.

#### Scenario: Sample set is the committed set

- **WHEN** the site builds
- **THEN** the samples it serves are exactly the sealed envelopes committed in the repository, with no additional envelope produced during the build

#### Scenario: No visitor run appears as a sample

- **WHEN** no sample envelope is committed
- **THEN** the gallery renders an empty state and no report page is produced

### Requirement: The gallery lists what ships

The sample gallery SHALL list every committed sample with its repository, score or suppressed verdict, tier, coverage, and the illustrative label. The order SHALL be deterministic so that rebuilding unchanged inputs produces an unchanged gallery.

#### Scenario: Gallery row is complete

- **WHEN** a committed sample is listed
- **THEN** its row shows the repository, the score or the suppressed verdict, the tier, the coverage counts, and the illustrative label

#### Scenario: Order is stable across builds

- **WHEN** the site is rebuilt with unchanged samples
- **THEN** the gallery order is identical

### Requirement: A sample is addressable at a stable static path

Each sample SHALL be served at its own pre-rendered path derived from the sample's stable identity, not from a scan timestamp or a machine-local value. Rebuilding SHALL NOT change a sample's path. A path that does not name a committed sample SHALL render the not-found document.

#### Scenario: Sample detail is pre-rendered

- **WHEN** the site builds with a committed sample
- **THEN** that sample's path already exists in the artifact and needs no server to resolve

#### Scenario: Unknown sample is not found

- **WHEN** a visitor requests a sample path that no committed envelope names
- **THEN** the not-found document renders

#### Scenario: Path survives a rebuild

- **WHEN** the same sample is rebuilt
- **THEN** its path is unchanged

### Requirement: Samples are labelled illustrative wherever they render

A sample SHALL be labelled illustrative on the gallery row, in the page title, and in the report body, and the label SHALL precede the first score on each surface. Provenance SHALL name the engine and rubric versions that produced the envelope.

#### Scenario: Label precedes the score

- **WHEN** a sample report page renders
- **THEN** the illustrative label appears before any score, tier, or coverage figure

#### Scenario: Provenance is real

- **WHEN** a sample report renders its provenance
- **THEN** the engine and rubric versions shown are the ones sealed in the committed envelope

### Requirement: Adding a sample needs no route change

Adding a committed envelope to the sample set SHALL make it listed and addressable after a rebuild, with no route, component, or navigation change.

#### Scenario: Second sample appears

- **WHEN** a second sealed envelope is added to the committed sample set and the site is rebuilt
- **THEN** the gallery lists both samples and each has its own pre-rendered detail path

### Requirement: Sample detail reuses the sealed report presentation

A sample detail page SHALL render the sealed envelope with the same presentation the report surface uses elsewhere: identity, verdict, coverage, gates, category scorecard, full-table scope, and provenance, driven entirely by the envelope. The stored trace SHALL render as the scan log when present, and an absent trace SHALL render an empty scan log rather than an error.

#### Scenario: Sealed score is displayed, not recomputed

- **WHEN** a sample detail page renders
- **THEN** the score, tier, and coverage shown are the sealed values and are not re-derived

#### Scenario: Missing trace degrades

- **WHEN** a sample envelope carries no trace
- **THEN** the page renders the report normally with an empty scan log
