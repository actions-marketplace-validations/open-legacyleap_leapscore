# deterministic-scoring Specification

## Purpose
Deterministic scoring guarantees that the same target content scanned with the same scanner release and flags produces the same score fingerprint on any machine, so the open score can be trusted, quoted, and gated in CI.

## Requirements

### Requirement: Score fingerprint

The system SHALL compute a `score_fingerprint` for every sealed scan: a stable hash over the sorted facts (with per-run timings normalized out), the rubric version, the engine version, per-detector tool versions, vendored snapshot versions, and the semantic flags (`--strict`, requested indicator set, archetype). The fingerprint SHALL exclude `runId`, `scanned_at`, durations, trace timings, and machine identity. The fingerprint scheme SHALL carry its own version (`fingerprint_version`) so verifiers can distinguish eras.

#### Scenario: Same fixture twice yields identical fingerprints

- **WHEN** the same fixture directory is scanned twice with the same scanner release and flags
- **THEN** both envelopes carry identical `score_fingerprint` values while their `runId`, `scanned_at`, and `durationMs` differ

#### Scenario: Flag change changes the fingerprint

- **WHEN** the same target is scanned once default and once with `--strict`
- **THEN** the two fingerprints differ, because the semantic flags are fingerprinted inputs

#### Scenario: Fingerprint scheme is versioned

- **WHEN** a reader encounters a fingerprint from an older `fingerprint_version`
- **THEN** it treats it as comparable only within its era and never equates fingerprints across scheme versions

### Requirement: Deterministic file-tree bounding

The system SHALL enumerate the target file tree once per scan in a canonical sorted order and hand the same ordered walk to every detector; slow detectors SHALL bound their work to the first `sampleN` paths of that walk (first-N, not stride), where `sampleN` derives deterministically from the file count. Detectors hitting the bound SHALL report `truncated: true` with deterministic `cap/sampled` detail, scored as `unknown` with "what it takes" — never as a silent estimate. Byte budgets SHALL be partitioned per detector, never drawn from one shared running counter whose exhaustion order depends on scheduling.

#### Scenario: Large repo shards identically on any machine

- **WHEN** a repo exceeding the shard threshold is scanned on a fast CI box and a slow laptop
- **THEN** both runs hand slow detectors the same first-N sorted paths and seal identical fingerprints

#### Scenario: Bound hit is explicit unknown

- **WHEN** a slow detector exceeds its deterministic bound
- **THEN** its row is `unknown` with a re-run/scope note, and the headline policy treats it per the frozen-denominator rule rather than renormalizing around it
