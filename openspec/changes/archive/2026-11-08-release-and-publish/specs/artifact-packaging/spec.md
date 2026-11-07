## ADDED Requirements

### Requirement: The Action is consumable at a repository ref

The repository root SHALL carry the Action metadata so a consumer can reference the Action as `uses: <owner>/<repo>@<ref>` with no subdirectory path, and that root metadata SHALL be the single copy of the Action's inputs, outputs, and runtime declaration. The metadata's entry point SHALL be the committed wrapper artifact, so a consumer's fresh checkout runs the Action with no build step, no package install, and no network fetch of a toolchain.

#### Scenario: Consumer references the repository directly

- **WHEN** a workflow declares `uses: open-legacyleap/leapscore@v1`
- **THEN** the runner resolves the Action from the repository root and executes the committed wrapper

#### Scenario: Fresh consumer checkout runs without a build

- **WHEN** a consumer repository runs the Action at a released ref
- **THEN** the scan starts without installing packages or building the scanner

#### Scenario: No second copy of the interface

- **WHEN** the repository is searched for Action metadata
- **THEN** exactly one metadata file declares the inputs, outputs, and runtime, and no subdirectory duplicate can drift from it

### Requirement: The published tarball is a complete release surface

The published package tarball SHALL contain the command launcher, the built scanner bundle, and the package README, and SHALL NOT contain scanner sources, other workspace packages, or build tooling. Installing that tarball on a machine with only the declared runtime SHALL produce a command that scans a local path offline and seals the three report files.

#### Scenario: Tarball contents are release-only

- **WHEN** the published tarball is inspected
- **THEN** it lists the launcher, the bundle, the manifest, and the README, with no `src/` tree and no sibling workspace packages

#### Scenario: Tarball install scans offline

- **WHEN** the tarball is installed in an empty directory with no network and its command runs against a local path
- **THEN** the scan seals `report.json`, `report.html`, and `report.md` using the declared runtime alone

#### Scenario: Tarball bundle matches the Action bundle

- **WHEN** the tarball and the committed Action distribution are compared for the same release
- **THEN** the scanner bundles are byte-identical
