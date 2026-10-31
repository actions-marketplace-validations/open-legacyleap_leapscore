## ADDED Requirements

### Requirement: Comparability inputs on the envelope

The envelope SHALL record, in `meta`, the inputs a differ needs to classify a comparison without recomputing target facts: the requested indicator set, the headline score policy, the fingerprint scheme version, and the rubric version. `meta` SHALL remain sufficient to render the run-history list without opening the report body. Recording these SHALL NOT change the score fingerprint, because they are an explicit view of inputs already fingerprinted rather than new fingerprinted inputs.

#### Scenario: Meta alone suffices for comparison

- **WHEN** a differ compares two envelopes
- **THEN** it resolves subject identity, era, rubric version, score policy, and requested set from `meta` without opening the report body

#### Scenario: Fingerprint is unchanged by the new fields

- **WHEN** the same target content is scanned twice with identical flags
- **THEN** both envelopes carry identical fingerprints, and adding these fields neither alters nor mixes into the fingerprint

#### Scenario: List view continues to read only meta

- **WHEN** the run-history list renders a row
- **THEN** it still reads only `meta` fields and never opens the report body

#### Scenario: Absent inputs are distinguishable from empty

- **WHEN** an envelope was written before these inputs were recorded
- **THEN** their absence is distinguishable from an empty requested set, so a differ can reconstruct or refuse rather than assume

### Requirement: Delta document shape

The contract SHALL define the delta document produced by the `run-diff` capability exactly once: the two run references, the comparability verdict with its blocking cause when incomparable, the headline decomposition, the per-row differences with their kinds, and the transition list. The delta document SHALL be derived and SHALL NOT be an envelope: it SHALL NOT carry a score fingerprint and SHALL NOT be readable as a sealed report by any consumer.

#### Scenario: One definition serves all consumers

- **WHEN** the repository is searched for a second declaration of the delta document
- **THEN** none exists, and the CLI and any later consumer import the shared contract

#### Scenario: Delta is not an envelope

- **WHEN** the site's ingest step encounters a delta document in a report directory
- **THEN** it skips it as a non-envelope with a recorded warning and creates no run row from it

#### Scenario: Both run references are present

- **WHEN** a delta document is written
- **THEN** each of its two run references names the run id, fingerprint, fingerprint scheme version, score, and tier of its run
