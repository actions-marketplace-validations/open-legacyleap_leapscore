## Purpose

Derives and carries the cost-weighted path from a sealed score to the next public band, so a report reader learns not only which deductions are largest but what each recovery costs and whether the recoverable points are enough to leave the current band.

## ADDED Requirements

### Requirement: Next-band destination and distance

The system SHALL derive a next-band destination for every sealed report whose score sits below the highest band threshold, carrying the destination band, its threshold, and `points_needed` = threshold − sealed score. For a report already at the highest band, the system SHALL mark the path terminal and SHALL NOT invent a destination. The destination and its threshold SHALL be resolved from the contract's band vocabulary, never from a second threshold table.

#### Scenario: Moderate is the destination from a High seal

- **WHEN** a report seals at 48 (High) and the band thresholds are 80/53/27
- **THEN** the path destination is Moderate with threshold 53, and `points_needed` is 5

#### Scenario: Terminal band reports no destination

- **WHEN** a report seals at 85 (Low)
- **THEN** the path is terminal with no destination band and no `points_needed`

#### Scenario: Suppressed headline produces no path

- **WHEN** a sealed report carries the `insufficient-signal` verdict with no headline number
- **THEN** no path exists, because there is no stated score to measure a distance from

### Requirement: Step candidacy from graded rows

The system SHALL build path steps only from rows graded in this scan — status `measured` or `estimated` — whose score is below the maximum (0, 1, or 2). Each step SHALL carry the row id, the row name, the recoverable weight in percentage points, the row's verify-effort tag, and the row's registry remediation quick win where one is defined. Rows with status `unknown`, `not_applicable`, or `not_implemented` SHALL contribute no step, and the path SHALL disclose how many rows it could not reach so ungraded debt is never presented as absent debt.

#### Scenario: Graded non-Green rows become steps

- **WHEN** a report has 4 applicable graded rows scoring 0–2 and 6 rows that are `unknown`
- **THEN** the path contains at most 4 steps and discloses the 6 unreached rows

#### Scenario: Step carries cost and payoff

- **WHEN** graded row `SEC-01` scores 1 with a verify-effort tag of ⚡ and a registry quick win
- **THEN** its step carries the recoverable weight in pp, the ⚡ tag, and the quick-win text

#### Scenario: Green rows are not steps

- **WHEN** a graded row scores 3
- **THEN** it contributes no step

#### Scenario: Not-applicable rows are not steps

- **WHEN** a row is `not_applicable` for this repo's archetype
- **THEN** it contributes no step and is not counted among unreached rows, because it is correctly excluded rather than unmeasured

### Requirement: Cost classification and cumulative arrival

The system SHALL classify every step into exactly one cost class from its verify-effort tag — sprint (⚡ ≤30 min), quarter (🔶 2–4 h), structural (🔷 1–2 days) — order steps by descending recoverable weight within a class, and present classes in the order sprint, quarter, structural. For each class the path SHALL report the cumulative recoverable points and which of three arrival states holds: reached by this class alone, reached only by this class combined with those before it, or not reached.

#### Scenario: Sprint class alone crosses

- **WHEN** `points_needed` is 4 and the sprint class totals 6.1 pp
- **THEN** the path states the sprint class alone reaches the destination

#### Scenario: Only cumulative arrival crosses

- **WHEN** `points_needed` is 5, the sprint class totals 4.2 pp, and the quarter class totals 2.6 pp
- **THEN** the path states sprint alone does not reach the destination, that sprint plus quarter does, and reports both cumulative figures

#### Scenario: Nothing reachable crosses

- **WHEN** total recoverable points across all classes fall below `points_needed`
- **THEN** the path states that no combination of graded deductions reaches the destination and names unreached-row count as the reason the remainder cannot be covered by graded work

### Requirement: Band-native threshold gate

The system SHALL accept a band-native threshold in place of a numeric one and evaluate it against the sealed score after seal, with the same report-writing and exit semantics as the numeric threshold: report files are written first, a score below the named band's threshold exits `3`, and a gate SHALL NOT be satisfied by a score the report declined to state. Band names SHALL be the public band vocabulary and each SHALL resolve to its contract threshold rather than a second table. A single invocation supplying both a numeric threshold and a band threshold SHALL be refused as a usage error before any work begins.

#### Scenario: Band gate trips below the named band

- **WHEN** the CLI runs with the band gate set to `moderate` and the run seals at 48
- **THEN** all report files are written and the process exits `3`

#### Scenario: Band gate passes at or above the named band

- **WHEN** the CLI runs with the band gate set to `moderate` and the run seals at 53
- **THEN** the report files are written and the process exits `0`

#### Scenario: Suppressed headline never satisfies a band gate

- **WHEN** a run seals with `insufficient-signal` and a band gate is set
- **THEN** the gate does not pass, matching the rule that a suppressed headline never satisfies a threshold

#### Scenario: Supplying both gates is refused

- **WHEN** the CLI runs with both a numeric threshold and a band threshold
- **THEN** it exits `2` stating the flags conflict and writes no report

### Requirement: Path is derived, never scored

The path SHALL be a derived view over an already-sealed report. It SHALL NOT alter the headline score, tier, category scores, gates, coverage counts, or any sealed row, and SHALL NOT change any threshold, weight, or rubric artifact.

#### Scenario: Sealed scoring is untouched

- **WHEN** the same target is scanned with and without the path field enabled
- **THEN** the sealed score, tier, gates, coverage, and `score_fingerprint` are identical

#### Scenario: Deduction ranking keeps its own ordering

- **WHEN** a report carries both the existing deduction ranking and the next-band path
- **THEN** the ranking still orders by recoverable points alone, and the two views are not required to agree on order
