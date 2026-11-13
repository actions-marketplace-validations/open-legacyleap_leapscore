## ADDED Requirements

### Requirement: README states coverage and non-benchmark status

The repository README SHALL state, on its first screen, that the rubric contains 102 indicators, that up to 31 have a detector today with 25 on a local scan, and that the rest are disclosed as not implemented. It SHALL state that the score is not a peer benchmark. The coverage statement SHALL pair any detector count with the release version and date.

#### Scenario: Coverage is above the fold

- **WHEN** a visitor reads the README from its start
- **THEN** the coverage statement appears before secondary reference material, alongside the privacy and primary-command sections

#### Scenario: No full-coverage claim

- **WHEN** the README describes the rubric
- **THEN** it does not claim that all 102 indicators are scored or measured

#### Scenario: Not a benchmark

- **WHEN** the README describes the score
- **THEN** it states that the score is not a peer benchmark

### Requirement: Security disclosure path is published

The repository SHALL publish a `SECURITY.md` that names supported versions, a private reporting channel, expected response handling, and the scope of the report. It SHALL NOT direct a reporter to open a public issue for a vulnerability.

#### Scenario: Security file exists

- **WHEN** a visitor looks for the security policy at the repository root
- **THEN** `SECURITY.md` exists and states the private reporting channel

#### Scenario: No public-issue request

- **WHEN** the security policy describes how to report a vulnerability
- **THEN** it does not ask the reporter to open a public issue

#### Scenario: Scope is stated

- **WHEN** the security policy describes what is in scope
- **THEN** it names the scanner, the GitHub Action, and the public site, and identifies third-party dependencies as out of scope
