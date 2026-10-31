# run-diff Specification

## Purpose

Compares a sealed run against a baseline envelope and reports what actually moved — separating movement caused by the target's code from movement caused by coverage growth, applicability changes, or a changed measurement model, so a rising score is never read as improvement when the code did not improve.

## Requirements

### Requirement: Comparability verdict before any delta

The system SHALL compute a comparability verdict before emitting any delta, from the two runs' subject identity, fingerprint scheme era, rubric version, requested indicator set, and per-row producing-tool versions. The verdict SHALL be exactly one of `comparable`, `comparable-with-coverage-change`, `comparable-with-row-exclusions`, or `incomparable`. An `incomparable` verdict SHALL name its blocking cause — `subject-mismatch`, `fingerprint-era-mismatch`, `rubric-version-mismatch`, or `missing-comparability-inputs` — and SHALL suppress every score delta rather than emit a partial or hedged one.

Engine identity alone SHALL NOT make two runs incomparable, because a row's meaning is determined by the rubric that asked the question and the producer that answered it, not by the release that ran them.

#### Scenario: Comparable runs

- **WHEN** the same subject is scanned at two commits with an identical fingerprint era, rubric version, requested set, and producing-tool versions
- **THEN** the verdict is `comparable` and per-row score deltas are emitted

#### Scenario: Coverage grew between runs

- **WHEN** the second run requests and grades more indicators than the baseline while era, rubric, and producers match
- **THEN** the verdict is `comparable-with-coverage-change` and the rows graded in both runs are compared

#### Scenario: One producer changed

- **WHEN** a single detector's version differs between runs while the rest match
- **THEN** the verdict is `comparable-with-row-exclusions`, and only that producer's rows are withheld from code attribution

#### Scenario: Different subject is refused

- **WHEN** the baseline was sealed for a different repository or a different subject slug
- **THEN** the verdict is `incomparable` with cause `subject-mismatch`, and no score delta is emitted

#### Scenario: Fingerprint era changed is refused

- **WHEN** the two runs carry different fingerprint scheme versions
- **THEN** the verdict is `incomparable` with cause `fingerprint-era-mismatch`, and no score delta is emitted

#### Scenario: Rubric changed is refused

- **WHEN** the two runs carry different rubric versions
- **THEN** the verdict is `incomparable` with cause `rubric-version-mismatch`, and no score delta is emitted

#### Scenario: Pre-field envelope reconstructs or refuses

- **WHEN** a baseline envelope was written before the comparability inputs were recorded
- **THEN** the requested indicator set is reconstructed from the report's full-table statuses where possible, and the verdict is `incomparable` with cause `missing-comparability-inputs` when it cannot be

### Requirement: Row-wise comparison and transitions

The system SHALL compute per-row differences over the rows graded in both runs. A row graded in only one run SHALL be reported as a transition and SHALL NOT contribute a score delta. The transition vocabulary SHALL distinguish at least: became graded, became ungraded, became applicable, became not applicable, and became implemented.

#### Scenario: Row graded in both runs yields a delta

- **WHEN** `ARCH-01` scored 1 in the baseline and 2 in the current run
- **THEN** a scored delta for `ARCH-01` is emitted and no transition is reported for it

#### Scenario: Newly implemented row is a transition, not an improvement

- **WHEN** `DATA-05` was `not_implemented` in the baseline and is graded in the current run
- **THEN** an implementation transition is reported and no score delta is attributed to it

#### Scenario: Row that became ungraded is a transition

- **WHEN** a row was `measured` in the baseline and is `unknown` in the current run
- **THEN** a became-ungraded transition is reported, distinct from a score drop

#### Scenario: Applicability transition carries its reason

- **WHEN** a row was graded in the baseline and is `not_applicable` in the current run because the detected archetype changed
- **THEN** an applicability transition is reported carrying the row's recorded reason

### Requirement: Delta-kind taxonomy with attribution precedence

Every reported difference SHALL carry exactly one kind: `scored-change`, `coverage-change`, `applicability-change`, `implementation-change`, or `model-change`. A row whose producing tool version differs between the two runs SHALL be classified `model-change` even when its score also moved, because that movement cannot be attributed to the target. `model-change` SHALL take precedence over `scored-change` for the same row.

#### Scenario: Score movement is a scored change

- **WHEN** a row's score moves from 0 to 1 with an unchanged producer and unchanged applicability
- **THEN** the difference is classified `scored-change`

#### Scenario: Detector bump masks as movement

- **WHEN** a row's producing tool version differs between runs and its score also moved
- **THEN** the difference is classified `model-change` and excluded from code attribution

#### Scenario: Applicability change is not a score change

- **WHEN** a row moves from graded to `not_applicable`
- **THEN** the difference is classified `applicability-change` and contributes no score movement

#### Scenario: Coverage change is not a code change

- **WHEN** a row moves from `unknown` to `measured` with the same producer version available in both runs
- **THEN** the difference is classified `coverage-change` and excluded from code attribution

### Requirement: Headline decomposition

The delta SHALL decompose the headline movement into code-attributable, coverage-attributable, model-attributable, and unattributable parts, partitioned by delta kind, such that the parts sum to the headline movement within rounding. Any residual SHALL be disclosed as unattributable rather than absorbed into a named part. When the code-attributable part is zero and the headline moved, the delta SHALL state that no code change was measured.

#### Scenario: Rise caused only by coverage

- **WHEN** the headline moves from 44 to 48 because four previously unknown rows became measured
- **THEN** the coverage-attributable part is the full movement, the code-attributable part is zero, and the summary states that no code change was measured

#### Scenario: Rise caused by code

- **WHEN** the headline moves because graded rows improved with unchanged coverage and producers
- **THEN** the movement is reported as code-attributable

#### Scenario: Mixed movement is split

- **WHEN** coverage grew and graded rows also improved
- **THEN** both parts are reported separately and their sum equals the headline movement

#### Scenario: Residual is disclosed

- **WHEN** per-row contributions do not sum exactly to the headline movement
- **THEN** the residual is reported as unattributable rather than folded into any named part

### Requirement: Delta is derived, never sealed

The delta SHALL be derived from two already-sealed envelopes. It SHALL NOT carry a score fingerprint, SHALL NOT be a valid envelope for ingest, SHALL NOT modify either input envelope, and SHALL NOT change the sealed reports a baselined run writes.

#### Scenario: Sealed artifacts are untouched

- **WHEN** a run is repeated once with and once without a baseline
- **THEN** the sealed report files are byte-identical in both runs and carry the same fingerprint

#### Scenario: Delta is not ingestable as an envelope

- **WHEN** the site's ingest step encounters a delta document
- **THEN** it is skipped as a non-envelope with a recorded warning, and no run row is created from it

#### Scenario: No fingerprint on the delta

- **WHEN** a delta document is written
- **THEN** it carries no `score_fingerprint` field

### Requirement: Ratchet gate semantics

When a ratchet gate is requested, the system SHALL trip it only on a code-attributable regression beyond the configured tolerance, SHALL refuse to evaluate when the verdict is `incomparable`, and SHALL NOT trip on coverage-, model-, or applicability-attributable movement. A refusal SHALL name the blocking cause. Report files SHALL be written in every outcome, and a refusal SHALL NOT be reported as a pass.

#### Scenario: Coverage-driven movement does not trip

- **WHEN** the headline falls because previously graded rows became unknown, with no row's code-attributable score decreasing
- **THEN** the ratchet does not trip

#### Scenario: Code regression trips

- **WHEN** a graded row's score drops with an unchanged producer and the code-attributable part falls beyond tolerance
- **THEN** the ratchet trips with the same threshold-trip exit semantics and the report files are present

#### Scenario: Within tolerance passes

- **WHEN** the code-attributable part falls by no more than the configured tolerance
- **THEN** the ratchet passes

#### Scenario: Incomparable refuses rather than passes

- **WHEN** the verdict is `incomparable` and a ratchet gate is requested
- **THEN** the run refuses with a usage-or-refused exit naming the cause, and does not report a pass
