## MODIFIED Requirements

### Requirement: Header without engine pill

The header SHALL render the brand mark plus exactly 3 nav links (`Samples`, `Method`, `Rubric`) without an "engine: coming" pill, and SHALL NOT link to a live-scan surface or a run-history surface.

#### Scenario: Header renders clean
- **WHEN** any page renders `SiteHeader`
- **THEN** the nav shows exactly the samples, method, and rubric links and no element containing "engine: coming" is in the DOM

#### Scenario: Header offers no live or history entry
- **WHEN** any page renders `SiteHeader`
- **THEN** no nav link resolves to a live-scan path or a run-history path

## REMOVED Requirements

### Requirement: Buttons show pointer cursor

**Reason**: Both scenarios are written against controls that this change deletes — the live page's "Reveal report" button and the run-history row's View / JSON / Rerun actions. The underlying rule (every interactive affordance reads as interactive) still applies to the controls that remain.

**Migration**: Replaced by "Interactive affordances show pointer cursor", which states the same rule without naming deleted controls.

## ADDED Requirements

### Requirement: Interactive affordances show pointer cursor

Every `<button>`, `[role=button]`, and interactive summary/accordion trigger SHALL show `cursor: pointer` on hover.

#### Scenario: Collapsible triggers show hand

- **WHEN** hovering an accordion or collapsible trigger on the rubric or sample surfaces
- **THEN** computed style `cursor` is `pointer`

#### Scenario: Sample gallery actions show hand

- **WHEN** hovering a control on a sample gallery row or a sample detail page
- **THEN** cursor is `pointer`
