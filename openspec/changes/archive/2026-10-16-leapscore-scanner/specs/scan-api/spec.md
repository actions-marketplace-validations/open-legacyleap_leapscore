## Purpose

A versioned, cross-origin HTTP protocol that streams a scan's progress and terminal report to any client, so the website can present a live scan without hosting the scanner.

## ADDED Requirements

### Requirement: Scan stream endpoint

The scanner SHALL expose an HTTP endpoint that accepts a target repository as either `owner/repo` or a GitHub URL and streams newline-delimited JSON frames for the duration of the scan. The endpoint SHALL be reachable cross-origin with explicit CORS headers and SHALL require no credential for public targets.

#### Scenario: Browser on another origin starts a scan

- **WHEN** a page served from the website's origin requests a scan for `vercel/next.js` from the scanner's origin
- **THEN** the response is accepted by the browser and frames begin streaming without a credential

#### Scenario: Repository accepted in either form

- **WHEN** the same target is supplied as `vercel/next.js`, `https://github.com/vercel/next.js`, and `github.com/vercel/next.js/tree/canary`
- **THEN** all three resolve to the same target and produce the same `repoSlug`

#### Scenario: Unsupported host refused

- **WHEN** the target is `https://gitlab.com/foo/bar`
- **THEN** the stream emits a `refused` frame with reason `unsupported_host` and no `report` frame

### Requirement: Frame protocol and versioning

Every frame SHALL carry a protocol version. The frame vocabulary SHALL be `meta` (scan parameters and budget), `progress` (completion state), `trace` (engine seam events), `report` (terminal sealed report), and `refused` (terminal refusal). Frames SHALL be newline-delimited JSON, one object per line. A client SHALL ignore any frame type it does not recognize without failing the scan.

#### Scenario: Version present on every frame

- **WHEN** any frame is emitted during a scan
- **THEN** the frame object carries a protocol version field

#### Scenario: Unknown frame type is additive

- **WHEN** the scanner emits a frame type a client has never seen
- **THEN** the client skips it and still renders `progress` and the terminal `report` correctly

#### Scenario: Trace frames remain additive

- **WHEN** a client handles only `meta`, `progress`, and `report`
- **THEN** `trace` frames are skipped and the scan still seals with a correct report

### Requirement: Terminal frame exactly once

The scanner SHALL emit exactly one terminal frame per scan: `report` when the scan seals (status `complete` or `degraded`) and `refused` otherwise. No `report` frame SHALL precede seal, and no frame SHALL be emitted after the terminal frame.

#### Scenario: Sealed scan emits one report frame

- **WHEN** the unified scan completes with 24 of 31 indicators measured
- **THEN** exactly one `report` frame is emitted carrying the sealed report and its `meta`, and the stream ends

#### Scenario: Budget expiry still seals once

- **WHEN** the budget expires while a detector is still running
- **THEN** one `report` frame is emitted with status `degraded`, timed-out rows `unknown`, and no earlier `report` frame was emitted

#### Scenario: Refusal is terminal and exclusive

- **WHEN** the target is `not_found`
- **THEN** a `refused` frame is emitted, no `report` frame is ever emitted for that scan, and the stream ends

### Requirement: Terminal report frame is self-sufficient

The `report` frame SHALL carry everything a client needs to render the sealed report — the report body, the envelope `meta`, and the ordered `trace` — so a client that never contacts the store can render a complete report, including the scan log.

#### Scenario: Live client renders without a store round trip

- **WHEN** the live surface receives the terminal `report` frame
- **THEN** it renders the full report (headline, coverage, gates, categories, full table, trace log) from that frame alone

#### Scenario: Frame matches the persisted envelope

- **WHEN** the same run is later read from the scanner's store
- **THEN** the stored envelope's `report`, `meta`, and `trace` are identical to what the terminal frame carried

### Requirement: Report permalink

The scanner SHALL expose a stable, shareable permalink for each sealed `runId` that returns that run's envelope. The permalink SHALL remain valid independently of whether any website build has ingested the run.

#### Scenario: Fresh run is immediately shareable

- **WHEN** a scan for `vercel/next.js` seals with `runId` `vercel__next.js__abc1234__2026-10-16T053000-123Z`
- **THEN** requesting the scanner's permalink for that `runId` returns the sealed envelope without re-running the scan

#### Scenario: Unknown runId is not found

- **WHEN** the permalink is requested for a `runId` that was never sealed
- **THEN** the scanner returns a not-found response and does not start a scan

#### Scenario: Traversal is rejected

- **WHEN** the permalink path contains `..`, `/`, or a segment not matching the `runId` grammar
- **THEN** the request is rejected before any store access

### Requirement: Client disconnect semantics

A client disconnect SHALL NOT corrupt or partially write the store. A scan that reaches a sealable state SHALL be persisted whether or not a client is still connected.

#### Scenario: Disconnect mid-scan does not corrupt

- **WHEN** the browser aborts a scan that is 40 seconds into a 240-second budget
- **THEN** no partial envelope is written and the store contains no truncated file for that run

#### Scenario: Disconnect after seal still persists

- **WHEN** the scan seals and the client aborts before reading the terminal frame
- **THEN** the envelope is still persisted and is retrievable by its permalink

### Requirement: Scan admission control

The scanner SHALL limit scan admission per client so that a public, credential-free stream endpoint cannot be used to exhaust GitHub API quota or clone bandwidth. Admission refusal SHALL use the `refused` frame.

#### Scenario: Burst from one client is throttled

- **WHEN** one client opens many concurrent scans in a short window
- **THEN** scans beyond the admitted rate are refused with a `rate-limited` reason rather than all executing

#### Scenario: Throttling does not consume quota

- **WHEN** a scan is refused by admission control
- **THEN** no GitHub API call and no clone is performed for that request
