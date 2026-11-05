# artifact-packaging Specification

## Purpose
Defines the release artifact contract: one built bundle per release is the invariant every distribution surface delivers, what a clean install of each surface must be able to run without network, the release-derived engine identity that feeds the score fingerprint, and the freshness gate that keeps a committed wrapper artifact honest with its sources.

## Requirements

### Requirement: One build artifact per release

The release SHALL build exactly one scanner artifact — a single self-contained JavaScript file with no runtime package dependencies — and every distribution surface (package `bin`, GitHub Action, container image, direct download) SHALL deliver that same file. No surface SHALL execute release sources through a just-in-time toolchain at the user's machine. The artifact SHALL declare the minimum runtime it requires, and SHALL run on a machine that has only that runtime, `git`, and the artifact file.

#### Scenario: Bundle runs on a bare runtime

- **WHEN** the built artifact is executed with `--help` on a machine that has a supported runtime and `git` but no project tree, no installed packages, and no network
- **THEN** it prints the CLI usage and exits `0`

#### Scenario: Sealed output is identical source vs artifact

- **WHEN** the same fixture is scanned once from source and once from the built artifact at the same engine identity
- **THEN** the sealed reports agree on score, band, and `score_fingerprint`

#### Scenario: Surfaces ship the same bytes

- **WHEN** the package, the Action, and the container are built from the same release
- **THEN** the scanner artifact each one executes is byte-identical to the release bundle

### Requirement: Clean install runs with zero network

A clean install of each supported topology — a workspace install, an install of the published package form, and a container pull — SHALL produce a command that runs to completion with no network access and no extra toolchain beyond the declared runtime and `git`. A first-run failure caused by a missing build step or an unresolvable interpreter dependency SHALL be treated as a packaging defect, not a usage error.

#### Scenario: Published-form install scans offline

- **WHEN** the packaged scanner is installed on a machine with the declared runtime and no network, and run against a local path with `--out`
- **THEN** the scan seals and writes the three report files

#### Scenario: Workspace shim executes

- **WHEN** a clean checkout runs a workspace install and invokes the documented scanner command with `--help`
- **THEN** the command runs the built artifact and prints the usage without an error

### Requirement: Engine identity is release-derived

The engine version recorded in a sealed report and hashed into the score fingerprint SHALL be the release version stamped into the artifact at build time, never a source-tree literal and never derived from the consumer's checkout. An explicit engine-ref override SHALL take precedence over the stamp. An artifact built without a version stamp SHALL identify itself as an unofficial build in the sealed identity rather than reusing a released version string.

#### Scenario: Different releases yield different fingerprints

- **WHEN** the same target is scanned by artifacts built from two different release versions with no override
- **THEN** the two fingerprints differ, because the engine version is a fingerprinted input

#### Scenario: Override wins over the stamp

- **WHEN** a scan runs with an explicit engine-ref override
- **THEN** the sealed identity records the override, not the build stamp

#### Scenario: Unstamped build is disclosed

- **WHEN** an artifact built without a release stamp seals a report
- **THEN** the sealed engine identity marks it as an unofficial build

### Requirement: Committed wrapper stays fresh with its sources

Where a distribution wrapper ships a committed built file (the Action's `dist`), the repository SHALL track that file, SHALL provide a non-interactive check that rebuilds the wrapper artifact from its current sources and fails when the committed file differs, and SHALL run that check on every change to the wrapper's sources or the scanner sources it embeds. A committed artifact that a fresh checkout cannot execute SHALL fail the same check.

#### Scenario: Stale committed dist fails the check

- **WHEN** a wrapper source or embedded scanner source changes and the committed wrapper artifact is not rebuilt
- **THEN** the freshness check exits non-zero and names the stale file

#### Scenario: Fresh checkout can run the wrapper

- **WHEN** a fresh checkout (no build step, no package install) executes the committed wrapper entry point
- **THEN** the wrapper runs the scanner and completes a scan of the checked-out tree without opening the network

### Requirement: CI integration without the platform wrapper

The release SHALL document a generic pipeline step that runs the scanner artifact in any CI system using the existing exit-code contract (pass / crash / usage-or-refused / gate trip) and the report directory, with the threshold and band gates available as flags. The documented step SHALL NOT require the platform-specific wrapper.

#### Scenario: Generic step gates a pipeline

- **WHEN** a non-GitHub pipeline runs the documented step with a score threshold on a repository scoring below it
- **THEN** the step exits with the gate-trip code and the pipeline fails on it

### Requirement: Container surface for locked-down hosts

The release SHALL provide a container image definition whose entry point is the scanner artifact, built from the same release inputs, so a host without the declared runtime can run the scan with `git` history available to the scanner. The image SHALL NOT introduce a second implementation path.

#### Scenario: Container scan matches the direct scan

- **WHEN** the same repository is scanned via the container and via the artifact directly
- **THEN** both seal the same score, band, and fingerprint at the same engine identity

### Requirement: Action wrapper runs the artifact without fetching a toolchain

The GitHub Action SHALL invoke the scanner artifact bundled with the committed wrapper, with no runtime package fetching or toolchain installation, and SHALL support an environment override pointing at an operator-supplied scanner artifact for air-gapped runners. An override that fails to execute SHALL fail the step with a usage-or-refused exit, never a silent fallback.

#### Scenario: Stock runner, no registry

- **WHEN** the Action runs on a runner image with a supported runtime but no access to a package registry
- **THEN** the scan completes from the committed wrapper artifact

#### Scenario: Operator override honored

- **WHEN** the operator sets the artifact override to a local scanner bundle
- **THEN** the Action executes that bundle and records its identity in the sealed report
