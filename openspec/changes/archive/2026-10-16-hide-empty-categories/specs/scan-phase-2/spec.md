## ADDED Requirements

### Requirement: Empty-category categories are excluded from roll-up
The system SHALL NOT emit a `CategoryScore` for a category that has zero indicator rows. `scoreMvp` SHALL group rows by `category_id` only from `allRows` and SHALL NOT inject phantom empty categories (`DATA/API/PERF/DOCS` fallback). When `applicable === 0` for a category (no `measured`/`estimated` rows), the category SHALL be omitted from `categories[]` and its weight SHALL NOT be applied as `0% * weight`; `weighted_contribution` is `0` and headline is sum over emitted categories.

#### Scenario: 31-indicator API empty is omitted
- **WHEN** `facts` contain 31 Tranche-A ids (no `API-*`) and `allRows` has no `API` rows
- **THEN** `scoreMvp` returns `categories` without `API` (length 7-8, not 9-10), `coverage {measured:31, unknown:71}`, and headline is not depressed by `API 0% *10%`

#### Scenario: All 10 categories present when tranche B adds API
- **WHEN** `facts` later include `API-01`/`API-02` and `allRows` has `API` rows
- **THEN** `scoreMvp` includes `API` with `applicable>0` and `category_score` computed normally

#### Scenario: Degraded status still based on measured count
- **WHEN** scan has `measured:31` vs `31` requested
- **THEN** `status` is `complete`; empty `API` does not cause `degraded`
