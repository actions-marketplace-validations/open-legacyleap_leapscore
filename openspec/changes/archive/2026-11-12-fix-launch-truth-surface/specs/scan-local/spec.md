## ADDED Requirements

### Requirement: Local subject identity is portable

A sealed report for a local path scan SHALL identify the subject by the scanned directory's basename, not its absolute path. The sealed artifact SHALL NOT contain a `local_path` field. `meta.repo`, `meta.repoUrl`, and the identity subject SHALL be name-only: `meta.repoUrl` MAY be a `file://` URI built from the basename, but SHALL NOT contain an absolute path. The `runId` SHALL continue to use the basename slug, and the score fingerprint SHALL be unchanged. Remote scans SHALL continue to identify the subject as `owner/repo`.

#### Scenario: Local report JSON is path-free

- **WHEN** a local scan seals a report for a directory at an absolute path
- **THEN** `report.json` contains the directory basename in `meta.repo` and the identity subject, contains no `local_path` field, and contains no absolute path or `file://` URL with an absolute path

#### Scenario: Human-readable reports are path-free

- **WHEN** a local scan writes `report.html` and `report.md`
- **THEN** neither document contains the absolute scan path or a `file://` URL with an absolute path

#### Scenario: Run identity is unchanged

- **WHEN** the same local directory is scanned before and after the subject-name change
- **THEN** the `runId` and `score_fingerprint` are unchanged, because both already derive from the basename and scored facts

#### Scenario: Remote subjects are unchanged

- **WHEN** a remote scan of `owner/repo` seals
- **THEN** its subject remains `owner/repo` and no local-path rule applies
