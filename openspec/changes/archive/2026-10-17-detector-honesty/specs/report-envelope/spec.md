## ADDED Requirements

### Requirement: Sealed-row provenance manifest

The envelope's `report.provenance.tool_manifest` SHALL list every producer that produced a fact in the sealed report, each with its version, and every row's evidence producer SHALL appear in that manifest. The manifest SHALL be non-empty whenever any row is `measured` or `estimated`, and SHALL be a truthful record of what ran — not a static or empty list.

#### Scenario: Manifest covers every cited producer

- **WHEN** a report is sealed
- **THEN** for every row carrying evidence, that row's evidence producer appears in `tool_manifest` with a version

#### Scenario: Manifest is non-empty for a measured scan

- **WHEN** at least one row is `measured` or `estimated`
- **THEN** `tool_manifest` is non-empty and names the producers that ran, so a reader can tell which tools produced the report

### Requirement: Report self-description marker

The envelope's `report.sample` marker SHALL be true only for authored demo data. A scan of a real target — remote or local path — SHALL NOT carry the marker as true. Consumers SHALL be able to rely on the marker to distinguish authored fixtures from real runs.

#### Scenario: Real run is not marked as sample

- **WHEN** any scan of a real target is sealed
- **THEN** `report.sample` is absent or false

#### Scenario: Authored fixture is marked

- **WHEN** the website's authored sample report is produced
- **THEN** `report.sample` is true
