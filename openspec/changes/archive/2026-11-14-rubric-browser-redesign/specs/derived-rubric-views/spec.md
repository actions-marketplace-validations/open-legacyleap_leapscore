## ADDED Requirements

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
