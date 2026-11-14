## REMOVED Requirements

### Requirement: Fresh-run routing semantics

**Reason**: The requirement's second half is written around a site-owned history entry and a `/live` revisit path, both removed by this change. Its first half — a fresh scan is executed by the scanner and never replayed from a sealed artefact, and the website never executes or brokers one — is unchanged and still load-bearing for the static boundary.

**Migration**: Replaced by "A fresh scan is executed, never replayed", which carries the same prohibition and adds the static-site consequence: the built artifact carries no scanner client at all.

## ADDED Requirements

### Requirement: A fresh scan is executed, never replayed

A fresh scan SHALL always be executed by the scanner service via its scan API and SHALL never be served from a previously sealed artefact. The website SHALL never execute a scan and SHALL never request one: no website route SHALL import scanner implementation code, no website route SHALL accept a scan request, and the built site SHALL contain no client that contacts a scanner. A sealed artefact SHALL be rendered only as itself — an immutable, labelled sample — and never as a fresh run.

#### Scenario: Repeat scan produces a distinct run

- **WHEN** the same repository is scanned twice
- **THEN** each scan executes and produces a distinct `runId`, and no previously sealed artefact is reused as the result

#### Scenario: Website exposes no scan endpoint

- **WHEN** the website's route list is inspected
- **THEN** no route accepts a scan request, and the boundary check from the `scanner-service` capability enforces this

#### Scenario: Built site carries no scanner client

- **WHEN** the built site artifact is inspected
- **THEN** it contains no scanner origin, no scan request builder, and no build input that would enable one

#### Scenario: Sealed artefact is never presented as fresh

- **WHEN** a sealed envelope is rendered on the site
- **THEN** it is labelled as a committed sample and its sealed values are displayed unchanged
