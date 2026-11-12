## ADDED Requirements

### Requirement: Local identity subject is a name

For a local path scan, the identity block's subject SHALL be the scanned directory's basename, not an absolute path or a `file://` URL. The identity card and every report emitter SHALL render that name.

#### Scenario: Nested local directory

- **WHEN** a local scan targets a nested directory with the basename `claims-core`
- **THEN** the identity subject reads `claims-core` and no absolute path appears in the identity card, `report.html`, or `report.md`

#### Scenario: Remote identity is unchanged

- **WHEN** a remote scan targets `owner/repo`
- **THEN** the identity subject remains `owner/repo`

#### Scenario: Suppressed identity still renders

- **WHEN** a local scan is suppressed for insufficient signal
- **THEN** the identity subject still renders as the directory basename, and the identity card remains the anchor before the verdict
