## MODIFIED Requirements

### Requirement: Terminal report frame is self-sufficient

The `report` frame SHALL carry everything a client needs to render the sealed report — the report body, the envelope `meta`, and the ordered `trace` — and it SHALL be the sole artefact of a scan. There SHALL be no store round trip: no persisted envelope exists to compare against.

#### Scenario: Live client renders without a store round trip

- **WHEN** the live surface receives the terminal `report` frame
- **THEN** it renders the full report (headline, coverage, gates, categories, full table, trace log) from that frame alone

#### Scenario: Frame matches the persisted envelope

- **WHEN** a scan seals under stateless operation
- **THEN** no persisted envelope exists to compare against: the terminal frame's `report`, `meta`, and `trace` are the canonical artefact, and there is no store copy by construction

#### Scenario: No post-scan retrieval exists

- **WHEN** a client discards the terminal `report` frame
- **THEN** the sealed report is unrecoverable from the scanner and the scan must be re-run to see it again

### Requirement: Client disconnect semantics

A client disconnect SHALL NOT leave partial permanent state, because the scanner writes none. A scan that reaches a sealable state emits its terminal `report` frame on the open stream; when no client is still connected the sealed artefact is discarded.

#### Scenario: Disconnect mid-scan does not corrupt

- **WHEN** the browser aborts a scan that is 40 seconds into a 240-second budget
- **THEN** no partial envelope exists anywhere and no truncated file is left behind, because the scanner writes no permanent state at any point

#### Scenario: Disconnect after seal still persists

- **WHEN** the scan seals and the client aborts before reading the terminal frame
- **THEN** the sealed report is discarded with the closed stream (no persistence, no permalink); a fresh scan is required to obtain it

## REMOVED Requirements

### Requirement: Report permalink

**Reason**: Permalinks required a permanent scanner store, which stateless operation removes. Shareability moves to site-owned history if the site chooses to keep it.
**Migration**: `GET /reports/:runId` on the scanner is deleted. Clients use the terminal `report` frame. Any future shareable link is a site concern under `reports/run-history-ui`, not a scanner endpoint.
