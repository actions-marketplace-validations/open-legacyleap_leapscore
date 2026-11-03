## ADDED Requirements

### Requirement: Target identity in the sealed report

The sealed report SHALL carry an optional target-identity block describing what the scanned code is, as defined by the `report-identity` capability. The block SHALL live inside `report`, SHALL NOT become a fifth envelope part, and SHALL be typed by the shared contract as an optional member so envelopes written before it existed remain valid.

The block SHALL be classified as derived-and-excluded, alongside the derived next-band path: it SHALL NOT contribute any hashed input to `score_fingerprint`, and it SHALL NOT alter `meta`, the headline, the coverage counts, the gates, or any sealed row.

#### Scenario: Identity rides inside the report

- **WHEN** an envelope carrying an identity block is inspected
- **THEN** the envelope still consists of `meta`, `report`, `trace`, and `score_fingerprint`, with identity reachable only under `report`

#### Scenario: Fingerprint is unaffected

- **WHEN** two envelopes describe identical content and the identical release, and one carries a measured line magnitude while the other carries an estimated one
- **THEN** both carry the same `score_fingerprint`

#### Scenario: Absent block degrades gracefully

- **WHEN** an envelope written before the identity block existed is read by any consumer
- **THEN** the consumer treats identity as absent and renders the report normally, without fabricating values and without failing

#### Scenario: The list view still needs only meta

- **WHEN** the run-history list renders a row for an envelope that carries an identity block
- **THEN** the row is still rendered from `meta` alone, and the list does not open the report body to obtain identity values

#### Scenario: Consumers do not synthesize identity

- **WHEN** a consumer renders an envelope whose identity block is absent
- **THEN** it does not re-walk the tree, re-sniff manifests, or re-derive archetype to reconstruct the block
