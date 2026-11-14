# derived-rubric-views Specification

## Purpose

Defines the contract for rubric documents that restate canonical values: which documents the compiler generates, what each must contain, how a hand edit is detected, and which files remain the only editable sources.

## Requirements

### Requirement: Derived rubric documents are generated, not authored

The compiler SHALL generate the score sheet, the service score sheet template, and the system score sheet template from the canonical catalog and shared configuration. These documents SHALL be written only by the generator, and their content SHALL be byte-identical to freshly generated output.

#### Scenario: A derived document is edited by hand
- **WHEN** a generated rubric document differs from what the compiler produces from the current canonical sources
- **THEN** `npm run check:rubric-consistency` fails and names the file and the first differing line

#### Scenario: A canonical value changes
- **WHEN** an indicator's §2 criteria, name, tier, effort, or category changes, or a weight, band, or gate changes in the shared configuration
- **THEN** regeneration updates every derived document that restates that value, with no hand edit required

### Requirement: The score sheet restates criteria without loss

The generated score sheet SHALL carry, for every indicator, the Yellow and Red flag criteria exactly as the canonical file states them, with only the parenthetical rationale removed. It SHALL NOT paraphrase, abbreviate, or drop a clause.

#### Scenario: A canonical flag carries two conditions
- **WHEN** an indicator's Yellow flag states a primary condition and an alternative condition
- **THEN** both conditions appear in the generated sheet row for that indicator

#### Scenario: An indicator has no §2 criteria
- **WHEN** a canonical file uses the reduced form and carries no scoring criteria
- **THEN** the sheet emits that indicator with an explicit unknown-only marker rather than an empty or invented cell

### Requirement: The score sheet covers every gate and band

The generated score sheet SHALL list all gates with their source indicators, all indicators grouped by category with their base and FE-active weights, and the band vocabulary with its thresholds.

#### Scenario: The gate roster and the configuration diverge
- **WHEN** a gate is added, removed, or renamed in the shared configuration
- **THEN** the generated roster reflects it and the check fails until the sheet is regenerated

#### Scenario: A category weight changes
- **WHEN** a category weight changes in either weight set
- **THEN** the generated category heading shows the new base and FE-active values

### Requirement: Score-sheet templates derive their row sets

The service and system score sheet templates SHALL derive their row lists, indicator names, category headings, weights, deep-dive splits, and gate checklist from the canonical registry, and SHALL retain their blank-cell structure for auditor input.

#### Scenario: An indicator moves between standard and deep-dive
- **WHEN** an indicator's rollup classification changes
- **THEN** the generated templates place it in the corresponding section without a hand edit

#### Scenario: An indicator is added to the catalog
- **WHEN** a new canonical indicator file is compiled
- **THEN** it appears in the generated templates and the generated score sheet, and the check fails until regeneration

### Requirement: Gate rules live in the shared configuration

The gate roster — each gate's red-flag trigger and source indicators — SHALL be defined in the shared configuration document, and a derived document SHALL NOT be its only home.

#### Scenario: A reader needs a gate's trigger
- **WHEN** a reader looks up what makes a gate fire, or which indicators feed it
- **THEN** the shared configuration states both, and derived documents link it instead of restating it

#### Scenario: A canonical document defers a rule to a derived one
- **WHEN** the shared configuration refers to a derived document for a gate rule, weight, threshold, or band
- **THEN** `npm run check:rubric-consistency` fails and names the circular reference

### Requirement: The authored guide carries only non-derivable material

A rubric document that is not generated SHALL contain only material that cannot be derived from the canonical sources — scoring-level meanings, rollup mechanics, and audit-planning guidance — and SHALL reference the canonical configuration and the generated sheet for every restated number, table, or roster.

#### Scenario: The authored guide repeats a derived value
- **WHEN** the authored guide contains a weight, threshold, band, formula, gate roster, or per-indicator criteria that also exists in a canonical source or a generated document
- **THEN** `npm run check:rubric-consistency` fails and identifies the duplicated value

#### Scenario: A reader needs the full criteria table
- **WHEN** a reader opens the authored guide looking for per-indicator criteria or the gate roster
- **THEN** the guide links the generated score sheet and the canonical catalog instead of reproducing them

### Requirement: The compiled site registry carries what the browser renders

The compiler SHALL emit, for every indicator, the fields the site's rubric browser renders: identity (ID, category, name, engine tier, default status, verify effort, v1 flag), classification (rollup, gates fed), rubric semantics (definition, obsolescence rationale, detection method, yellow and red flag criteria with rationale, the four-level 0–3 criteria, the remediation quick win, structural fix, and gold standard), and contract detail (statusing rules, score mapping, fact schema, budget class, and the scope/overlaps statement). The registry SHALL be written only by the compiler, and the site SHALL render rubric content from it without parsing rubric markdown in the served graph at build time.

#### Scenario: Registry matches a fresh compile
- **WHEN** the committed site registry differs from what the compiler produces from the current canonical sources
- **THEN** `npm run check:rubric-consistency` fails and names the file and the first differing line

#### Scenario: A canonical change propagates
- **WHEN** an indicator's criteria, flags, remediation, rollup, gates fed, or identity fields change
- **THEN** regeneration updates the site registry with no hand edit, and the browser reflects the change without a second source

#### Scenario: A required field is absent
- **WHEN** a canonical indicator file omits a field the browser requires
- **THEN** the compiler fails and names the indicator and field instead of emitting an empty value

#### Scenario: No markdown parse in the served graph
- **WHEN** the site is built and its served module graph is inspected
- **THEN** no module in that graph reads rubric markdown from the filesystem to render a rubric page

#### Scenario: The registry restates no number it does not own
- **WHEN** the registry carries a threshold-sensitive value
- **THEN** the value originates in the canonical file or the shared configuration, and the browser does not compute or restate a weight, band, or gate threshold of its own
