## Purpose

Global site chrome — header navigation and interactive affordance that is consistent across all pages.

## Requirements

### Requirement: Header without engine pill

The header SHALL render brand mark + 5 nav links (Reports, Product, Method, Rubric, Sample report redirect handled separately) without an "engine: coming" pill.

#### Scenario: Header renders clean
- **WHEN** any page renders `SiteHeader`
- **THEN** the nav shows exactly the 5 links and no element containing "engine: coming" is in the DOM

### Requirement: Buttons show pointer cursor

Every `<button>` and `[role=button]` trigger SHALL show `cursor: pointer` on hover.

#### Scenario: Reveal and scan-log triggers show hand
- **WHEN** hovering the live "Reveal report" button or the "Scan log" collapsible trigger
- **THEN** computed style `cursor` is `pointer`

#### Scenario: History row actions show hand
- **WHEN** hovering View / JSON / Rerun controls on `/reports`
- **THEN** cursor is `pointer`
