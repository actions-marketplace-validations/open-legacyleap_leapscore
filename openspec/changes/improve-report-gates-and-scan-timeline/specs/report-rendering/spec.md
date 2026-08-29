# Spec delta — report-rendering

## ADDED Requirements

### Requirement: Collapsed kill-switch gates cockpit

The system SHALL render the kill-switch gates (G1–G8) as a collapsed cockpit by default: a single summary strip showing counts and status dots per gate status (`proven` / `needs-verification` / `not-proven`) plus a peek of any `proven` gate(s), with full 8-row detail expandable on user click. The summary SHALL be one line on desktop and wrap to two lines on narrow viewports. `proven` gates SHALL be visually prominent even when collapsed (red dot + gate id + short note inline). Expanding SHALL reveal the full table (id, name, note, source_rows, status) without navigating or re-fetching; collapsing SHALL return to the strip.

#### Scenario: Default collapsed with no proven gates
- **WHEN** a report has gates `0 proven · 5 needs-verification · 3 not-proven`
- **THEN** the cockpit renders as a single strip `0 proven · 5 needs verification · 3 clear` with colored dots (red / amber / dim) and a control labeled `Expand` (or `Show 8 gates`); the 8-row table is not in the layout and category scorecards are visible above the fold

#### Scenario: Proven gate is always surfaced
- **WHEN** a report has `1 proven` (e.g. G3 Runtime EOL) and 7 others
- **THEN** the collapsed strip still shows `1 proven · 4 needs verification · 3 clear` and additionally peeks `G3 Runtime EOL — past EOL: node@16` inline with a red dot; the detail table's `Proven` group is expanded by default when the user expands

#### Scenario: Expand and collapse
- **WHEN** user clicks `Expand` (or the summary strip) on a collapsed cockpit
- **THEN** the full gates table animates open, grouped by status (Proven → Needs verification → Not proven) or as a flat table, with each row showing `id`, `name`, `note`, `source_rows`, and status dot+label; clicking `Collapse` (or the strip again) returns to the summary strip and focus stays on the toggle

#### Scenario: Keyboard and screen-reader accessible
- **WHEN** user tabs to the cockpit toggle and presses Enter/Space
- **THEN** the table expands/collapses, `aria-expanded` toggles, and the toggle has an accessible name `Show kill-switch gates (8)` / `Hide kill-switch gates`; status dots have text alternatives (not color-only)

#### Scenario: Both report surfaces share the behavior
- **WHEN** report is rendered on `/report/sample` or on live `/live` after reveal
- **THEN** both use the same collapsed-by-default cockpit component; deep-linking or printing expands the table for print media

### Requirement: Gates summary counts are derived from report gates

The system SHALL derive the collapsed strip counts directly from `Report.gates[].status` (no hard-coded numbers); counts SHALL sum to 8 and SHALL update if gate predicates change. The short peek note for a `proven` gate SHALL be the gate's `note` field truncated to one line.

#### Scenario: Counts match gates array
- **WHEN** `evaluateGates()` returns `[proven, proven, not-proven, needs-verification×5]`
- **THEN** the strip shows `2 proven · 5 needs verification · 1 clear` (or equivalent wording) and expanding shows 2 rows under Proven

