## MODIFIED Requirements

### Requirement: Canonical indicator catalog is complete and navigable

The repository SHALL carry exactly one canonical file per indicator under `docs/rubric/indicators/<NN-slug>/<ID>-<slug>.md`, each conforming to the ten-section skeleton (or the approved reduced form), and each category SHALL carry a charter at `docs/rubric/indicators/<NN-slug>/README.md` that links every indicator file in that category. The charter is the category index; there is no separate root-level index file.

Category order SHALL be carried by the `NN-` prefix on the category directory name and by no other artifact. Indicator identity SHALL be carried by the `<ID>-` prefix on the filename and by no other filename component. Lowercase kebab-case SHALL be used for every path segment after the numeric prefix; underscores SHALL NOT appear in indicator or category path segments.

#### Scenario: An indicator file is missing or duplicated

- **WHEN** the canonical count is not 102, or two files declare the same ID
- **THEN** `npm run check:documentation-structure` fails and names the discrepancy

#### Scenario: A category index omits an indicator

- **WHEN** a category charter does not link every canonical file of its category, or links an ID that no canonical file declares
- **THEN** the check fails and reports the expected and actual ID lists

#### Scenario: Category order is asserted outside the directory name

- **WHEN** a hand-maintained ordering table, manifest, or numeric filename prefix duplicates the category order already carried by the `NN-` directory prefix
- **THEN** the check fails and names the redundant ordering source

#### Scenario: An indicator or category path segment is not kebab-case

- **WHEN** a canonical path segment after the numeric prefix contains an underscore, an uppercase letter, or a space
- **THEN** the check fails and names the offending path

## ADDED Requirements

### Requirement: Rubric directory declares its layers

`docs/rubric/` SHALL organize its contents into role-named layers: `indicators/` for the measured set, `model/` for the rules that compose indicator grades into a score, and `sheets/` for the generated scoring instrument. Each layer SHALL be reachable from `docs/rubric/README.md`, which SHALL state what an indicator is, what the rubric is as a composition of indicators, and what the rubric is not.

No hand-edited scoring rule SHALL live outside `model/`. No per-indicator content SHALL live outside `indicators/`.

#### Scenario: A scoring rule is authored outside the model layer

- **WHEN** a weight, tier threshold, band boundary, or gate rule is restated in `indicators/`, `sheets/`, or the rubric README as a non-derived value
- **THEN** `npm run check:rubric-consistency` fails and names the file and the duplicated rule

#### Scenario: A layer is unreachable from the rubric entry point

- **WHEN** `docs/rubric/README.md` does not link `indicators/`, `model/`, or `sheets/`, or does not state the indicator/rubric distinction
- **THEN** `npm run check:documentation-structure` fails and names the missing link or statement

#### Scenario: The entry point describes the rubric as separate from the indicators

- **WHEN** the rubric README presents the rubric and the indicator catalog as unrelated documents rather than as a composition
- **THEN** the check fails, because the entry point must state that the rubric is built on the indicator set

### Requirement: Generated rubric artifacts are directory-scoped

Every generated rubric document SHALL live under `docs/rubric/sheets/`. Hand-edited documents SHALL NOT live under `docs/rubric/sheets/`, and generated documents SHALL NOT live anywhere else in the rubric tree. A generated document SHALL carry a header naming the writer and the regeneration command.

#### Scenario: A generated sheet lives outside the sheets directory

- **WHEN** a generated rubric document is committed at the rubric root or under `indicators/`
- **THEN** `npm run check:documentation-structure` fails and names the misplaced file

#### Scenario: A hand-edited document is placed in the sheets directory

- **WHEN** a file under `docs/rubric/sheets/` is not byte-identical to its fresh compile output
- **THEN** `npm run check:rubric-consistency` fails and reports it as hand-edited

#### Scenario: A generated document loses its provenance header

- **WHEN** a generated sheet does not name `tooling/scripts/compile-rubric.ts` and `npm run compile:rubric` in its header
- **THEN** the check fails and names the file

### Requirement: Each indicator file declares its two halves

A full-form indicator file SHALL state, before its first section, that §1–§4 carry rubric semantics and §5–§10 carry the detector contract. The file SHALL remain a single canonical document; the two halves SHALL NOT be split into separate files.

#### Scenario: An indicator file omits the half boundary

- **WHEN** a full-form indicator file does not declare which sections carry rubric semantics and which carry the detector contract
- **THEN** `npm run check:documentation-structure` fails and names the file

#### Scenario: Indicator halves are split into separate files

- **WHEN** an indicator's semantics and its detector contract are committed as two files
- **THEN** the check fails, because exactly one canonical file per ID is permitted
