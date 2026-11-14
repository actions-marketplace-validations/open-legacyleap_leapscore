# rubric-browser Specification

## Purpose

Lets a reader browse the 102-indicator rubric as a navigable index — finding an indicator, reading its full contract, and moving between a graded report row and the definition behind it — without executing a scan or asking a server for anything.

## Requirements

### Requirement: The rubric index reaches every indicator in one step

`/rubric` SHALL present all ten categories with their base weight, indicator count, tier mix, and default-status mix, and SHALL expose a search over every indicator in the registry regardless of category. A reader SHALL reach any indicator document in at most two navigations from `/rubric`.

#### Scenario: Index lists the whole catalog

- **WHEN** `/rubric` renders
- **THEN** it names all ten categories with their weights and row counts, and the named counts sum to the number of indicators in the compiled registry

#### Scenario: Search crosses categories

- **WHEN** the reader types a term that matches an indicator ID or name in any category
- **THEN** the matching indicators are listed together with their category, and no match is hidden because its category is collapsed or unselected

#### Scenario: Empty search states itself

- **WHEN** the search term matches nothing
- **THEN** the surface states that nothing matched and offers the unfiltered catalog rather than rendering an empty region

### Requirement: The index filters by rubric metadata

The index SHALL filter the catalog by engine tier, default status, and gate participation, alone or in combination, and SHALL show how many indicators each filter leaves.

#### Scenario: Combined filters narrow the set

- **WHEN** the reader selects a tier and a default status
- **THEN** only indicators matching both remain, and the count reflects the intersection

#### Scenario: Filters clear

- **WHEN** the reader clears the filters
- **THEN** the full catalog returns with no indicator lost

### Requirement: A category page is scannable without interaction

A category page SHALL render every one of its indicators in the document at load, as a row carrying its ID, name, engine tier, default status, verify effort, gates fed, and rollup classification. A row SHALL link to that indicator's own document.

#### Scenario: Rows are present before interaction

- **WHEN** a category page is served without JavaScript running
- **THEN** every indicator in that category appears as a row with its ID, name, tier, status, effort, gates, and rollup

#### Scenario: Each row is a link

- **WHEN** the reader activates a row
- **THEN** the indicator's own document opens, and the row is reachable and activatable from the keyboard

### Requirement: Every indicator has a stable document

The site SHALL serve one document per indicator in the compiled registry at a stable path under `/rubric`, and SHALL generate those paths at build time. The document SHALL carry the identity metadata, the four-level 0–3 criteria, the yellow and red flag criteria with their rationale, the remediation quick win, structural fix, and gold standard, the statusing rules, the fact schema, and the scope/overlaps statement.

#### Scenario: One document per indicator

- **WHEN** the artifact is built
- **THEN** every ID in the compiled registry resolves to its own document, and the set of documents equals the set of registry IDs

#### Scenario: Criteria are legible as levels

- **WHEN** an indicator document renders its scoring criteria
- **THEN** the 0, 1, 2, and 3 levels are each identifiable as a distinct level, not collapsed into one paragraph

#### Scenario: Unknown indicator is not a blank page

- **WHEN** a reader requests an indicator path that is not in the artifact
- **THEN** the site's not-found document renders, and no empty rubric shell is served

#### Scenario: Neighbour navigation

- **WHEN** an indicator document renders
- **THEN** it links to the previous and next indicator in its category and to its category index

### Requirement: The rubric surface discloses coverage honestly

The rubric surface SHALL state, in the vocabulary the report uses, how many indicators are `measured`, `estimated`, `unknown`, and `not implemented`, and SHALL give the current detector count with its version and 102-row denominator. It SHALL NOT present an indicator as graded when the release has no detector for it.

#### Scenario: Coverage strip

- **WHEN** the rubric index or a category page renders
- **THEN** the four status groups are stated with counts, and the detector sentence carries a version, a date, and the denominator

#### Scenario: An indicator without a detector says so

- **WHEN** an indicator has no detector in the current release
- **THEN** its document and its row identify that state rather than showing a score, a verdict, or a measurement claim

### Requirement: Report rows and rubric entries link to each other

A graded row in a rendered report SHALL link to that indicator's rubric document. A rubric document SHALL link to a committed sample report row that exercised the indicator when the committed sample set contains one. Internal links SHALL resolve under the configured base path.

#### Scenario: Report row reaches its definition

- **WHEN** a sample report renders an indicator row
- **THEN** the row links to the rubric document for that exact indicator ID

#### Scenario: Rubric entry reaches evidence

- **WHEN** an indicator document renders and a committed sample row carries that indicator with a score or a disclosed status
- **THEN** the document links to that sample row's document and anchor

#### Scenario: No fabricated evidence link

- **WHEN** no committed sample row carries the indicator
- **THEN** the document omits the evidence link rather than linking to an unrelated sample

### Requirement: Rubric surfaces obey the site's color and interaction rules

Rubric surfaces SHALL use neutral chrome plus the band-tier palette only, and SHALL NOT introduce light-mode card colors. Interactive rows, filters, and toggles SHALL show a pointer cursor and a visible keyboard focus state.

#### Scenario: No non-tier color

- **WHEN** the rubric index, a category page, or an indicator document renders
- **THEN** no surface uses a color outside the neutral palette and the four band-tier tokens

#### Scenario: Interaction affordances are visible

- **WHEN** a reader hovers or tabs to a row, filter, or disclosure control
- **THEN** the pointer or focus affordance is visible, and the control is operable without a pointer
