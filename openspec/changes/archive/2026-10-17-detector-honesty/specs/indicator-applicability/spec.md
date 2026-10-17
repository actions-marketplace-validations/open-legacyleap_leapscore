## MODIFIED Requirements

### Requirement: Indicator lifecycle — 5 states

The system SHALL model every indicator row in one of 5 mutually exclusive states:

1. **Not Implemented** — rubric lists the indicator but no detector is enqueued/implemented yet (stub Tier C/D, future slice). The row SHALL be `not_implemented`, excluded from numerator/denominator, and carry `unknown_measure_path` ("what it takes to measure") plus `reason: "detector not implemented in this slice"`.
2. **Implemented but not applicable** — detector exists but `na_when` fires for this repo (archetype+plane, exhaustive proof, or `irrelevant` tier). The row SHALL be `not_applicable`, excluded, with `reason`+`evidencePointers` proving plane absence or tier rule.
3. **Applicable but unknown** — detector exists and is applicable, but cannot be measured or estimated from the target tree, git history, and the vendored offline snapshots (it needs live env/org data, e.g., `SEC-03` DAST, `DATA-05` lock contention, or an analyzer the release does not ship). The row SHALL be `unknown` with `unknown_measure_path`.
4. **Estimated** — pattern/heuristic inference only, where the indicator's own spec defines a clamped heuristic (explicitly labeled, clamped).
5. **Measured** — fact-backed: the payload was produced by a named producer that ran over this target during this scan, and the row carries that producer as its evidence. Enumerating the target (existence, counts, paths) counts as measuring; a graded magnitude the detector did not derive from the target does not — such a row is `estimated` or `unknown`, never `measured`. Grading a row from a hardcoded magnitude SHALL NOT occur.

If multiple conditions apply, precedence is: `not_implemented` > `not_applicable` > `unknown` > `estimated` > `measured`. `not_implemented` and `not_applicable` SHALL never be `proven`; gates sourced solely from them SHALL be that same status.

#### Scenario: Not Implemented vs Applicable-but-unknown are distinct
- **WHEN** `SEC-03` (Missing web security controls, Tier C) is scanned in tranche A (31 implemented of 102)
- **THEN** the row is `not_implemented` with `reason: "detector not implemented in this slice"` and `unknown_measure_path: "Deploy or point at staging; run ZAP/DAST"`, not `unknown`

#### Scenario: Implemented but not applicable vs Applicable-but-unknown
- **WHEN** `DATA-01` on an `agent-skills` repo with `has_data=false` and `DATA-01` is implemented
- **THEN** the row is `not_applicable` with `reason: "no data plane"`; when the same `DATA-01` is applicable on a `service` but needs a live DB probe, the row is `unknown`

#### Scenario: Measured requires a producing tool
- **WHEN** an applicable row's fact payload is a constant, a bracketed placeholder, or names an evidence producer that did not run for this scan
- **THEN** the row is `unknown` with `unknown_measure_path` — or `estimated` only where the indicator's spec defines a heuristic clamp — and is never `measured`
