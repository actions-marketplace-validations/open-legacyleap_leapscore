## Purpose

Ships the reference data an offline scan needs — runtime/framework end-of-life and known-vulnerable versions — as versioned vendored snapshots, so detectors can be accurate with no network access and a data refresh is a deliberate, visible score input.

## Requirements

### Requirement: Vendored reference data

The release SHALL ship reference datasets covering (a) runtime and framework end-of-life, (b) known vulnerabilities, and (c) package metadata (latest major, last release, license) for every ecosystem whose dependency manifests it parses — including NuGet (.NET/VB.NET) and Maven (legacy Java) — and SHALL cover the toolchain lifecycle of census-only legacy stacks (VB6, Delphi) that have no package manager. Datasets SHALL be sourced from upstream lifecycle records where available and from curated vendor lifecycle records otherwise, with the selection rule documented in each dataset's source field. Each dataset SHALL carry a version identifier and SHALL be rebuildable by a documented, reproducible procedure. Datasets SHALL be usable with no network access.

#### Scenario: End-of-life resolved offline

- **WHEN** a target declares a runtime version past its support window and the snapshot contains that runtime
- **THEN** the row is measured from the snapshot with no socket opened

#### Scenario: Advisory resolved offline

- **WHEN** a target's locked dependency version is affected by an advisory present in the snapshot
- **THEN** the vulnerability row is measured and names the advisory identifier

#### Scenario: Refresh is documented and reproducible

- **WHEN** an operator follows the documented refresh procedure
- **THEN** the datasets are rebuilt with a new version identifier and no manual editing of dataset files

#### Scenario: Vendor-recorded lifecycle resolves offline

- **WHEN** a VB6 or Delphi project is scanned and the vendored dataset carries that toolchain's lifecycle record
- **THEN** the runtime fact is measured from the vendored record with no socket, and the record's curated source is reflected in the dataset source note

#### Scenario: NuGet and Maven dependencies resolve offline

- **WHEN** a .NET or legacy Java project's package resolves against the vendored package-metadata and advisory tables
- **THEN** drift/abandonment/license/vulnerability facts are measured with no socket, and a package absent from the tables is disclosed as unscanned

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
