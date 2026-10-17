## Purpose

Ships the reference data an offline scan needs — runtime/framework end-of-life and known-vulnerable versions — as versioned vendored snapshots, so detectors can be accurate with no network access and a data refresh is a deliberate, visible score input.

## ADDED Requirements

### Requirement: Vendored reference data

The release SHALL ship reference datasets covering (a) runtime/framework end-of-life and (b) known vulnerabilities for the ecosystems whose dependency manifests it parses. Each dataset SHALL carry a version identifier and SHALL be rebuildable by a documented, reproducible procedure. Datasets SHALL be usable with no network access.

#### Scenario: End-of-life resolved offline

- **WHEN** a target declares a runtime version past its support window and the snapshot contains that runtime
- **THEN** the row is measured from the snapshot with no socket opened

#### Scenario: Advisory resolved offline

- **WHEN** a target's locked dependency version is affected by an advisory present in the snapshot
- **THEN** the vulnerability row is measured and names the advisory identifier

#### Scenario: Refresh is documented and reproducible

- **WHEN** an operator follows the documented refresh procedure
- **THEN** the datasets are rebuilt with a new version identifier and no manual editing of dataset files

### Requirement: Snapshots participate in the score

Snapshot version identifiers (or the datasets' content hash) SHALL be inputs to the score fingerprint, so identical target content with the same release and the same datasets yields the same score, and a dataset change is reflected as a deliberate change to a fingerprinted input.

#### Scenario: Same data, same score

- **WHEN** the same target is scanned twice with the same release and the same datasets
- **THEN** the fingerprints match

#### Scenario: Refreshed data changes the fingerprint

- **WHEN** only the datasets change between two scans of the same target and release
- **THEN** the fingerprint differs and the snapshot version is recorded in the report provenance

### Requirement: Absent data is never guessed

When a detector's required datum is absent from the snapshot — an unknown runtime, an unlisted package, or an ecosystem without advisory coverage — the row SHALL be `unknown` with "what it takes" and a refresh/re-run hint. A detector SHALL NOT substitute a permissive or optimistic default.

#### Scenario: Unknown runtime is unknown, not in-support

- **WHEN** a declared runtime has no entry in the end-of-life snapshot
- **THEN** the runtime end-of-life row is `unknown` with a what-it-takes note, never scored as in-support

#### Scenario: Uncovered ecosystem is disclosed

- **WHEN** a manifest's ecosystem has no advisory coverage in the snapshot
- **THEN** the vulnerability row is `unknown` and the report states which ecosystems were covered and which were not
