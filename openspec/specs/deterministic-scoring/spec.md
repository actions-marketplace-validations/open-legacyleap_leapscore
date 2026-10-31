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

### Requirement: Row-wise comparability within a fingerprint era

The system SHALL treat the score fingerprint as a report-level comparability signal and NOT as the only comparability signal. Two sealed runs in the same fingerprint era SHALL be comparable per row for every row graded in both, independently of whether their fingerprints match. A report-level comparison SHALL additionally require identical fingerprints; where fingerprints differ, the system SHALL identify which fingerprinted input differs and classify the difference rather than silently comparing or silently refusing.

The requested indicator set SHALL be a classified difference rather than a blocker: coverage growth SHALL be reported as such and SHALL NOT invalidate the comparison of rows graded in both runs. A fingerprint scheme version difference SHALL continue to make the runs non-comparable in full, per the existing era rule.

#### Scenario: Coverage growth does not block row comparison

- **WHEN** two runs share a fingerprint era and rubric version but request different indicator sets
- **THEN** rows graded in both are compared, and the requested-set difference is classified as a coverage difference rather than reported as incomparable

#### Scenario: Identical fingerprints compare in full

- **WHEN** two runs of the same target content and flags carry identical fingerprints
- **THEN** the runs are comparable at report level and per row

#### Scenario: Era mismatch still blocks in full

- **WHEN** two runs carry different fingerprint scheme versions
- **THEN** they are not comparable in full, and this requirement does not relax that rule

#### Scenario: Differing input is named

- **WHEN** two runs in the same era carry different fingerprints with an identical requested indicator set
- **THEN** the fingerprinted input responsible is named rather than left to the reader to infer

### Requirement: Classification over silent comparison

The system SHALL NOT compare two runs silently where a fingerprinted input differs. Any comparison SHALL carry an explicit verdict identifying the compared basis, so a reader can tell what was held constant and what was not.

#### Scenario: Comparison always states its basis

- **WHEN** any two runs are compared
- **THEN** the result names which inputs matched and which differed, instead of presenting a bare delta

#### Scenario: A non-comparable pair yields no numbers

- **WHEN** the compared basis does not permit comparison
- **THEN** no score delta is produced for that pair
