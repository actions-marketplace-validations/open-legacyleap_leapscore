## ADDED Requirements

### Requirement: Empty categories are not evaluated
The system SHALL NOT render a category as evaluated when it has no indicator rows. A `CategoryScore` where `applicable === 0` and `indicator_rows.length === 0` SHALL have `category_score: null` and SHALL NOT display a score or tier badge. The category card SHALL be hidden from the `Category scorecard` grid. `status_counts` SHALL be `0m/0e/0u` and SHALL NOT tier to `Critical`.

#### Scenario: API with 0 rows is hidden
- **WHEN** a 31-indicator scan has no API indicators (Tranche A) and `report.categories` would contain `API` with `indicator_rows: []`
- **THEN** the engine omits `API` from `categories[]` and `apps/site/app/report/sample/page.tsx` renders 7-9 cards, not 10, with no `0 | Critical` card and headline not dragged by an empty 10% weight

#### Scenario: Guard renders Not evaluated if empty slips through
- **WHEN** `CategorySection` receives a `category` with `category_score === null`
- **THEN** it renders `—` and badge `Not evaluated` instead of `0` and `Critical`

#### Scenario: Measured category still tiers
- **WHEN** `DOCS` has 5 measured rows and `category_score 66`
- **THEN** `CategorySection` renders `66` and `Moderate` as before

## MODIFIED Requirements

### Requirement: Full-table consolidation uses registry
The system SHALL build `full_table` (102 rows) and `deep_dive_scope` by iterating the registry's 102 IDs, marking requested-but-undone rows `unknown` with `unknown_measure_path` and FE rows `not_applicable` where the repo has no client. All placeholder rows SHALL carry the registry's `name` and `effort` (`⚡/🔶/🔷`).

Categories in the scorecard grid SHALL be derived only from indicator rows that were requested or have a measured/estimated/unknown status. A category with zero `indicator_rows` SHALL be omitted from `report.categories` and SHALL NOT contribute `category_score` or `weighted_contribution` to the headline; the headline is the sum over non-empty categories. This is the excluding-not-zero semantics for empty categories. `coverage` (`31/102`) is unchanged.

#### Scenario: Live full-table placeholders carry correct metadata
- **WHEN** `provider.live.ts:buildFullTable()` constructs the 96 unknown placeholders for a 19-indicator scan
- **THEN** each placeholder has `name` and `effort` from the registry, and `unknown_measure_path` per the encyclopedia/delta spec, not hardcoded `⚡ ≤30 min`.

#### Scenario: API not in scorecard when no API rows requested
- **WHEN** scan requests only Tranche-A 31 ids (no `API-*`) and `full_table` still has 102 rows
- **THEN** `report.categories` contains 7-8 entries (no `API`), `API`'s 10% weight contributes `0` (not `0% *10%` tiered Critical), and `CoverageStrip` still shows `31/102`
