## ADDED Requirements

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
