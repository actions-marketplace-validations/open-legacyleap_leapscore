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

### Requirement: Marketplace identity follows release identity

The root Action metadata's `name` SHALL be the product's scan identity, and its slugified form SHALL equal the published package and command name (`leapscore-scan`), so the Marketplace URL, the package, and the CLI all name the same thing. The published listing URL SHALL be recorded in the release evidence. Because GitHub reads the metadata frozen at a release tag, a rename SHALL ship as a new release that re-stamps the rebuilt bundles; the previously released tag SHALL NOT be re-pointed. A release that changes only Marketplace metadata SHALL state in its notes that no behavior changed and that the engine-stamp change moves every `score_fingerprint`.

#### Scenario: Slug matches the command identity

- **WHEN** the root metadata's `name` is slugified the way GitHub slugifies it
- **THEN** the result equals the published package and command name, and the listing URL is derivable from it without a second naming decision

#### Scenario: A rename ships on a new tag

- **WHEN** the Action's `name` changes
- **THEN** the change reaches Marketplace only through a new release tag whose bundles are rebuilt and re-stamped, and the earlier tag keeps its original metadata

#### Scenario: Metadata-only release is disclosed

- **WHEN** a release changes only Marketplace metadata
- **THEN** its notes state that scanner, scoring, rubric, report-envelope, CLI, and Action behavior are unchanged, and that every `score_fingerprint` moves with the engine stamp

#### Scenario: Scope stays in the description

- **WHEN** the Action's `name` does not state the scan lane it supports
- **THEN** the `description` states that scope, so the listing does not claim a capability the Action lacks

### Requirement: A superseded listing is retired, never duplicated

A repository has exactly one Marketplace listing — its root `action.yml`; subfolder actions are not listable — and a listing's identity (slug, name, and description) is fixed when the listing is created, not when a version is added. Flagging the rename release therefore attaches it to the existing listing without changing that identity. A rename SHALL be executed as a release-and-relist: the rename release SHALL be published and installable through its tag before the superseded listing is retired; the Marketplace flag SHALL then be removed from every version published under the superseded name; the superseded slug SHALL be confirmed to no longer resolve; and the flag SHALL be set on the rename release alone, which recreates the listing from that release's metadata. At most one listing is discoverable and no Marketplace-visible version sits below the rename release, and the zero-listing window this sequence requires SHALL be recorded — with the retired slug, the new listing URL, and the visible-version floor — in the release evidence.

#### Scenario: Rename release published before retirement

- **WHEN** the rename release's listing is being published
- **THEN** the rename release exists and its tag resolves before any superseded Marketplace flag is cleared

#### Scenario: In-place rename releases the old identifier first

- **WHEN** the platform refuses a second listing for the repository, as it does for any repository that already has one
- **THEN** the superseded flags are cleared before the rename release's flag is set, and the release evidence records that ordering and the zero-listing window it opened

#### Scenario: Exactly one listing remains

- **WHEN** the rename is complete
- **THEN** only the new slug resolves, and no release version still carries the Marketplace flag under the superseded name

#### Scenario: No visible version below the rename

- **WHEN** the surviving listing's version list is inspected
- **THEN** its oldest visible version is the rename release

### Requirement: Listing publication is evidenced, not automated

The release pipeline SHALL NOT be relied on to publish or retire a Marketplace listing: publishing is an operator step in the release UI, taken under release authority. The release evidence SHALL record the listing URL, the slug, and any retirement, and a released version SHALL remain installable through its tag whether or not it carries a Marketplace flag.

#### Scenario: Workflow-created release is unlisted

- **WHEN** the release workflow creates the release for a tag
- **THEN** the release carries no Marketplace flag until an operator sets it, and the release is otherwise complete and consumable

#### Scenario: Tag install survives listing retirement

- **WHEN** a version's Marketplace flag is removed
- **THEN** `uses: <owner>/<repo>@<that version>` and the moving major tag still resolve for consumers

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
