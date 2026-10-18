## ADDED Requirements

### Requirement: Derived next-band path in the sealed report

The sealed report SHALL carry the path defined by the `band-path` capability as a declared field on the contract, so the derivation happens once at seal time and no consumer re-derives it from row scores. The field SHALL be absent when the headline is suppressed, and present but terminal for a report already at the highest band. The field SHALL be excluded from the score fingerprint, because it is derived from already-fingerprinted row scores and introduces no new target-derived fact.

#### Scenario: One derivation serves every surface

- **WHEN** the site report views, CLI `report.html`, CLI `report.md`, and stdout each render a next-band path for the same run
- **THEN** all four read the same sealed field rather than recomputing the path

#### Scenario: Absent for a suppressed headline

- **WHEN** a report seals with the `insufficient-signal` verdict
- **THEN** the envelope carries no next-band path and consumers render no path block

#### Scenario: Fingerprint excludes the derived field

- **WHEN** a sealed report's path field is recomputed from its own row scores
- **THEN** `score_fingerprint` is unchanged, because the field is derived rather than target-measured

#### Scenario: Older envelopes degrade gracefully

- **WHEN** an envelope sealed before this field existed is read
- **THEN** the reader renders the report without a path block rather than failing
