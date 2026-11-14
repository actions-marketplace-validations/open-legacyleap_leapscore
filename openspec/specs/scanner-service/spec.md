## Purpose

Runs every scan as a standalone service that owns the untrusted-repo execution boundary, the GitHub token, and the report store — so the presentation site carries no scan runtime, no secrets, and no request-time filesystem state.

## Requirements

### Requirement: Standalone scanner process

The system SHALL perform all scan execution in a scanner service deployed independently of the website. The scanner SHALL own target ingestion, the unified scan, terminal scoring, and envelope sealing, with that implementation colocated under `apps/scanner`. No website route or page SHALL execute a scan, import scanner implementation code at runtime, or hold a request open on scan work.

#### Scenario: Fresh scan executes outside the website

- **WHEN** a user starts a scan for `vercel/next.js` from the local CLI or CI
- **THEN** the scan is executed by the scanner service, and no website process loads scanner code or performs clone or GH-API work

#### Scenario: Website serves with the scanner unreachable

- **WHEN** the scanner service is down and a user browses `/`, `/rubric`, or `/samples/<slug>`
- **THEN** every one of those pages renders normally without contacting the scanner

### Requirement: Present side carries no engine runtime dependency

The website application SHALL NOT import any module from the scanner implementation at runtime, SHALL NOT read a GitHub token, and SHALL NOT read or write the filesystem while serving a request. A build-time check SHALL fail when the website's source graph reaches the scanner implementation or the Node filesystem or child-process builtins outside of build tooling.

#### Scenario: Reaching the engine fails the check

- **WHEN** a website module imports any path under the scanner implementation
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
- **THEN** public scans still succeed because the token lives only in the scanner, and the site's sample surfaces behave identically

### Requirement: Provenance from explicit engine reference

The scanner SHALL record the engine identity that produced a report from an explicit reference supplied at invocation, falling back to the scanner checkout's commit and then the literal `unknown`. Provenance SHALL NOT be derived from any consumer's working directory.

#### Scenario: Explicit reference wins

- **WHEN** a scan runs with an explicit engine reference for commit `3886fde`
- **THEN** the envelope's engine identity is `3886fde` regardless of the scanner checkout state

#### Scenario: Reference unavailable falls back honestly

- **WHEN** no explicit reference is supplied and no commit can be resolved
- **THEN** the engine identity is the literal `unknown` and the terminal report frame is still emitted and valid

#### Scenario: No consumer working directory is consulted

- **WHEN** a scan is initiated by the CLI or CI and the website's checkout differs from the scanner's
- **THEN** the recorded engine identity reflects the scanner's engine, never the website's commit

### Requirement: Stateless scanner with no permanent disk

The scanner SHALL be stateless across requests: it SHALL write no envelope to permanent disk, SHALL serve no stored report, and SHALL require no volume. Ephemeral in-memory state (per-client admission control, single-flight coalescing) is permitted. The terminal `report` frame SHALL be the sole scan artefact.

#### Scenario: Sealed scan leaves no file

- **WHEN** a scan for `vercel/next.js` seals with status `complete` or `degraded`
- **THEN** the terminal `report` frame carries the full `{ report, meta, trace }` artefact and no file is written to any store

#### Scenario: Restart loses nothing addressable

- **WHEN** the scanner process restarts
- **THEN** no previously sealed run is retrievable from the scanner, because none was ever persisted there
