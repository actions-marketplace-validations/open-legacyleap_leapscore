## ADDED Requirements

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

When a listing is published under a new name, every release version published under the superseded name SHALL have its Marketplace flag removed, so at most one listing is discoverable and no Marketplace-visible version sits below the rename release. The superseded listing SHALL stay live until the replacement URL is confirmed to resolve, and the retirement SHALL be recorded alongside the new listing URL in the release evidence.

#### Scenario: Replacement confirmed before retirement

- **WHEN** the rename release's listing is being published
- **THEN** the superseded listing remains live until the new listing URL resolves

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
