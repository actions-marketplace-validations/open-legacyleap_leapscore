## Purpose

Defines what a public LeapScore release is: the version identity every surface shares, the gates that must pass before anything is published, how the package and Action reach their registries with provenance, how the moving major tag behaves, and how a bad release is withdrawn without rewriting history.

## ADDED Requirements

### Requirement: One tag is the release identity

A public release SHALL be identified by exactly one annotated semver tag `vX.Y.Z`. The npm package version, the engine version stamped into the bundle, and the ref consumers resolve through the Action SHALL all derive from that same tag in the same workflow run, and the tag SHALL be created only after every release gate has passed. A release SHALL NOT be published from an untagged branch, a dirty tree, or a locally built artifact.

#### Scenario: Tag drives every surface

- **WHEN** the release workflow runs for tag `v1.2.3`
- **THEN** the published package version is `1.2.3`, the bundle seals `engine_version` `1.2.3`, and the relayed `v1` tag points at the same commit

#### Scenario: Mismatched identity blocks the release

- **WHEN** the tag version and the package manifest version disagree
- **THEN** the workflow exits non-zero before publishing anything and names both values

#### Scenario: Untagged publish is refused

- **WHEN** the publish path is invoked on a commit with no release tag
- **THEN** no package or Action version is published

### Requirement: Publication is gated on the full check family

The release workflow SHALL run the repository's complete verification set against the tagged commit — documentation/rubric checks, detector isolation, site and surface boundaries, bin wiring, committed-dist freshness, bundle parity, and the workspace test suites — and SHALL refuse to publish when any of them fails. The build SHALL run once, from the tagged commit, and the artifact published to every surface SHALL be the output of that single build.

#### Scenario: Failing gate blocks publication

- **WHEN** any release gate fails on the tagged commit
- **THEN** no version is published to the registry and the failure names the gate

#### Scenario: Stale committed Action dist blocks publication

- **WHEN** the committed wrapper differs from a rebuild of the tagged sources
- **THEN** the release stops rather than publishing a wrapper that does not match the package

#### Scenario: One build feeds all surfaces

- **WHEN** a release publishes both the npm tarball and the Action
- **THEN** the scanner bundle inside the tarball and the bundle committed under the Action's distribution directory are byte-identical

### Requirement: Publishing uses short-lived credentials and provenance

The package SHALL be published through the registry's OIDC trusted-publishing flow with a provenance attestation, from a job restricted to a protected release environment. The repository SHALL NOT store a long-lived registry write token, and an actor without release authority SHALL NOT be able to publish. A package that does not yet exist MAY be established once with a maintainer-held credential outside CI, solely so a trusted publisher can be configured; that credential SHALL NOT be stored in the repository, and every subsequent publication SHALL use OIDC.

#### Scenario: Provenance is attached

- **WHEN** a release publishes a version
- **THEN** the registry record links the version to the tagged commit and the workflow that produced it

#### Scenario: No standing write token exists

- **WHEN** the repository's secrets and workflow files are inspected
- **THEN** no long-lived registry write credential is present, and publication authority comes from the release environment's OIDC identity

#### Scenario: Unauthorized publication is impossible

- **WHEN** a contributor without release-environment approval triggers the publish job
- **THEN** the job cannot obtain the credential and publishes nothing

#### Scenario: Name establishment is one-time and unrecorded

- **WHEN** a package is established before its first gated release
- **THEN** it happens once outside CI with a maintainer credential that is never stored, and the next publication is OIDC-backed

### Requirement: The Action is published with a moving major tag

Publishing SHALL create or preserve the immutable `vX.Y.Z` tag and move the major tag `v1` to the same commit. Consumers pinning `@v1` SHALL receive the newest compatible release without editing their workflow, while a release that breaks compatibility SHALL publish a new major tag and SHALL NOT move the previous major. The immutable tag SHALL NOT be re-pointed after publication.

#### Scenario: Minor release advances the major tag

- **WHEN** `v1.3.0` publishes
- **THEN** `v1` resolves to the `v1.3.0` commit and `v1.3.0` itself is unchanged

#### Scenario: Major release leaves the old major alone

- **WHEN** a breaking release publishes `v2.0.0`
- **THEN** `v2` is created at that commit and `v1` still resolves to the last `1.x` release

#### Scenario: Immutable tag is stable

- **WHEN** a later release publishes
- **THEN** previously published `vX.Y.Z` tags still resolve to their original commits

### Requirement: Published identity names the public home

The package name, the Action's `uses:` path, the Marketplace listing, and every install instruction SHALL name the public repository and registry identity (`open-legacyleap/leapscore`, package `leapscore-scan`). A rename or transfer of the public home SHALL be treated as a release-visible change: old install strings SHALL either keep resolving or be documented as migrated in the same release.

#### Scenario: Consumer strings match the public home

- **WHEN** a consumer copies the documented install command or `uses:` line
- **THEN** it resolves against the public repository and package without a maintainer edit

#### Scenario: A rename is disclosed

- **WHEN** the public repository or package name changes
- **THEN** the release notes state the new strings and the old ones' status

### Requirement: Post-publish verification proves the artifact installs

After publishing, the workflow SHALL install the released package from the registry in a clean directory with no repository checkout, run its `--help`, and run a fixture scan that seals the three report files offline. It SHALL verify that the installed command reports the released version and that the installed binary exits with the documented codes. A failed verification SHALL mark the release failed and be surfaced in the release output.

#### Scenario: Registry install scans offline

- **WHEN** the post-publish job installs the released version and scans a checked-in fixture with network denied
- **THEN** the command prints usage, seals `report.json`/`report.html`/`report.md`, and reports the released engine version

#### Scenario: Verification failure fails the release

- **WHEN** the installed artifact cannot run or seals the wrong version
- **THEN** the release is marked failed and the failure is reported rather than treated as a warning

### Requirement: Release assets mirror the registry for registry-less hosts

Each GitHub release SHALL attach the exact tarball that was published to the registry together with a checksum file, so a host without registry access can install the release offline. The attached tarball SHALL be byte-identical to the published one and the checksum SHALL verify against it.

#### Scenario: Offline host installs from the release asset

- **WHEN** a host with no registry access downloads the release tarball and installs it
- **THEN** the command prints usage and seals a scan using only the declared runtime and `git`

#### Scenario: Checksum matches the published tarball

- **WHEN** the release checksum file is verified against the attached tarball and the registry tarball
- **THEN** all three agree

### Requirement: A bad release is withdrawn without rewriting it

A release found defective SHALL be withdrawn by deprecating the published version with a message naming its replacement, and by moving the major tag back to the last good release. The published version SHALL NOT be republished, mutated in place, or silently overwritten; unpublishing SHALL be used only within the registry's permitted window and only when the package is not depended upon.

#### Scenario: Defective version is deprecated

- **WHEN** a published version is found defective
- **THEN** the registry marks it deprecated with a message naming the replacement version

#### Scenario: Major tag rolls back

- **WHEN** the defective version is the current major
- **THEN** the major tag is moved back to the last good release and the rollback is announced

#### Scenario: Same version is never republished

- **WHEN** a fix is prepared
- **THEN** it publishes a new patch version rather than reusing the withdrawn version number
