## MODIFIED Requirements

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
