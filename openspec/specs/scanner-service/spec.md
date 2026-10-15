## Purpose

Runs every scan as a standalone service that owns the untrusted-repo execution boundary, the GitHub token, and the report store — so the presentation site carries no scan runtime, no secrets, and no request-time filesystem state.

## Requirements

### Requirement: Standalone scanner process

The system SHALL perform all scan execution in a scanner service deployed independently of the website. The scanner SHALL own target ingestion, the unified scan, terminal scoring, and envelope sealing. No website route or page SHALL execute a scan, import the engine package at runtime, or hold a request open on scan work.

#### Scenario: Fresh scan executes outside the website

- **WHEN** a user starts a scan for `vercel/next.js` from the live surface
- **THEN** the scan is executed by the scanner service, and no website process loads the engine or performs clone or GH-API work

#### Scenario: Website serves with the scanner unreachable

- **WHEN** the scanner service is down and a user browses `/`, `/rubric`, `/report/sample`, or any ingested report under `/reports`
- **THEN** every one of those pages renders normally without contacting the scanner

### Requirement: Present side carries no engine runtime dependency

The website application SHALL NOT import any module from the engine package at runtime, SHALL NOT read a GitHub token, and SHALL NOT read or write the filesystem while serving a request. A build-time check SHALL fail when the website's source graph reaches the engine package or the Node filesystem or child-process builtins outside of build tooling.

#### Scenario: Reaching the engine fails the check

- **WHEN** a website module imports any path under the engine package
- **THEN** the boundary check fails the build and names the offending module

#### Scenario: Filesystem access in a route fails the check

- **WHEN** a website route handler imports a Node filesystem builtin
- **THEN** the boundary check fails the build and names the offending module

#### Scenario: Build tooling is exempt

- **WHEN** a build-time script under the website's tooling reads the source tree to generate derived content
- **THEN** the boundary check passes, because build tooling is not part of the served application graph

### Requirement: Token custody

The scanner SHALL be the only component that reads `GH_TOKEN` or `GITHUB_TOKEN`. Token material SHALL never appear in an envelope, a streamed frame, a rendered response, or a log line.

#### Scenario: Token absent from every output

- **WHEN** a scan seals with `GH_TOKEN` set in the scanner's environment
- **THEN** the token value appears in no streamed frame, no persisted envelope field, and no response body

#### Scenario: Website runs without any token configured

- **WHEN** the website is deployed with no GitHub token in its environment
- **THEN** public scans still succeed because the token lives only in the scanner, and the live surface behaves identically

### Requirement: Report store ownership

The scanner SHALL own the canonical report store and SHALL be the only writer of envelopes. The website SHALL treat envelopes as read-only inputs and SHALL have no code path that creates or mutates one.

#### Scenario: Scanner persists a sealed run

- **WHEN** a scan for `vercel/next.js` seals with status `complete` or `degraded`
- **THEN** the scanner writes exactly one envelope for that `runId` into its own store

#### Scenario: Refused scan persists nothing

- **WHEN** a scan is refused (`unsupported_host`, `not_found`, `private_requires_app`, `rate-limited`, or `crash`)
- **THEN** the scanner writes no envelope and issues no `runId`

#### Scenario: Website cannot write

- **WHEN** the website's source is inspected for envelope write paths
- **THEN** none exist, and the boundary check from the previous requirement enforces this

### Requirement: Provenance from explicit engine reference

The scanner SHALL record the engine identity that produced a report from an explicit reference supplied at invocation, falling back to the scanner checkout's commit and then the literal `unknown`. Provenance SHALL NOT be derived from any consumer's working directory.

#### Scenario: Explicit reference wins

- **WHEN** a scan runs with an explicit engine reference for commit `3886fde`
- **THEN** the envelope's engine identity is `3886fde` regardless of the scanner checkout state

#### Scenario: Reference unavailable falls back honestly

- **WHEN** no explicit reference is supplied and no commit can be resolved
- **THEN** the engine identity is the literal `unknown` and the envelope is still written and valid

#### Scenario: No consumer working directory is consulted

- **WHEN** a scan is initiated from the website and the website's checkout differs from the scanner's
- **THEN** the recorded engine identity reflects the scanner's engine, never the website's commit
