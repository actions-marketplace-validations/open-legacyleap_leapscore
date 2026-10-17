## Purpose

Guarantees that every graded magnitude in a sealed report is backed by a real measurement from a named producer, and that anything unmeasurable is disclosed as unknown rather than guessed — the property the open score's credibility rests on.

## Requirements

### Requirement: Honest grading (measure-or-unknown)

A fact derived by enumerating, reading, or computing over the target — file existence, counts, paths, parsed manifest data, git-history aggregates — is a measurement and MAY be `measured`. A graded magnitude the detector did not derive from the target (a constant, a bracketed placeholder, or an estimate with no computation) SHALL NOT be presented as `measured`: the row SHALL be `estimated` only where the indicator's own spec defines a clamped heuristic, and `unknown` with `unknown_measure_path` ("what it takes to measure") otherwise. No row SHALL be graded from a hardcoded magnitude.

#### Scenario: Constant magnitude is never measured

- **WHEN** a detector returns a fixed numeric payload it did not derive from the target (for example churn counts with no history read, or complexity with no analyzer run)
- **THEN** the row is `unknown` with `unknown_measure_path`, or `estimated` only where the indicator's spec defines a heuristic clamp — never `measured`

#### Scenario: Presence enumeration stays measured

- **WHEN** a detector reads the target tree and reports existence, counts, or paths (for example an ADR directory containing N files, or a present `Dockerfile`)
- **THEN** the row stays `measured` and its score is unchanged by this capability

#### Scenario: Unmeasurable row discloses what it takes

- **WHEN** an applicable row cannot be measured from the target tree, git history, and the vendored offline snapshots
- **THEN** its `status` is `unknown` and `unknown_measure_path` names the analyzer or data it would take

### Requirement: Truthful provenance

Every sealed row's evidence producer SHALL name the tool that actually produced the fact, with its version from the single per-producer registry, and SHALL appear in the report's tool manifest. A row SHALL NOT cite a producer that did not run for that scan. A producer name SHALL NOT imply an external binary the release does not run. File-derived evidence pointers SHALL reference the enumerated target path; non-file evidence SHALL name its documented basis (for example, a git-history range).

#### Scenario: Offline scan cites no remote producer

- **WHEN** a local directory is scanned with no network access
- **THEN** no row's evidence producer is a remote-only producer such as `gh-api`, and every cited producer appears in the tool manifest

#### Scenario: Producer that did not run fails validation

- **WHEN** any sealed row cites a producer absent from the set of producers runnable in this build, or a producer name that implies an unrun external binary
- **THEN** the provenance test fails

#### Scenario: File facts point at files

- **WHEN** a row's fact derives from a file in the target
- **THEN** its evidence pointers include that file's enumerated path

### Requirement: Measurement-semantics fingerprint era

The fingerprint scheme version SHALL be bumped when measurement semantics or the provenance grammar change such that facts for identical target content and release differ without a change to the engine version, rubric version, or any detector's own version. Fingerprints from different eras SHALL NOT be treated as comparable.

#### Scenario: Reclassification bumps the era

- **WHEN** a row moves from a constant-graded `measured` to `unknown`, or a producer is renamed to the tool that actually ran
- **THEN** the fingerprint scheme version is bumped and pre-change fingerprints are not equated with post-change ones

#### Scenario: Unchanged semantics keep the era

- **WHEN** only a detector's internal implementation changes while its facts and evidence producers are unchanged
- **THEN** the fingerprint scheme version is not bumped

### Requirement: Unmeasured weight is disclosed

Rows that cannot be measured SHALL be counted as unscored and disclosed: coverage counts SHALL include them, the report SHALL list them with their "what it takes", and the headline SHALL NOT silently renormalize around them. Estimations that the indicator's own spec defines count toward coverage for the purpose of the coverage floor. When measured-plus-estimated coverage falls below the coverage floor, the headline SHALL be suppressed with the `insufficient-signal` verdict rather than printed over thin signal.

#### Scenario: Demoted rows are visible

- **WHEN** one or more rows demote to `unknown`
- **THEN** coverage counts them as unknown and the deep-dive scope lists them with their "what it takes"

#### Scenario: Thin signal suppresses the headline

- **WHEN** honest demotion leaves measured-plus-estimated coverage below the coverage floor
- **THEN** the headline is `insufficient-signal` with the reference scores retained in the report JSON
