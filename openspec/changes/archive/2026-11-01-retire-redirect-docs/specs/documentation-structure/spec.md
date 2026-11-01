## Purpose

Defines the contract for the repository's documentation tree: which paths are canonical sources, what may not exist beside them, how local links and cross-document citations stay resolvable, and where a superseded record goes when its path is removed.

## ADDED Requirements

### Requirement: Documentation tree holds no redirect-only paths

The documentation tree SHALL NOT contain a file whose only content is a pointer to another file. A path MAY be removed rather than retained as a redirect; compatibility with retired paths is not a documentation requirement.

#### Scenario: A redirect tree is proposed
- **WHEN** a change adds or retains a file that carries no content beyond an identifier, a target path, and a deprecation notice
- **THEN** `npm run check:documentation-structure` fails and names the file as redirect-only

#### Scenario: A retired path is still referenced by tooling
- **WHEN** a check or gate requires a retired path to exist
- **THEN** the gate is amended to require the current path instead, and the retired path is not restored to satisfy it

### Requirement: Superseded records are preserved outside the tree

When a removal would delete content that exists nowhere else, that content SHALL be preserved in the change archive that removed it, annotated with what was verified and what remains unresolved.

#### Scenario: A removed directory carries a unique record
- **WHEN** a documentation path is removed and its content includes material not derivable from a canonical source
- **THEN** the material is copied verbatim into the removing change's `design.md`, with a note identifying which parts were verified redundant and which parts carry an open decision

#### Scenario: A removed directory carries no unique record
- **WHEN** every file under a removed path is a redirect or a restatement of a canonical source
- **THEN** no archive copy is made and the change records that verification instead

### Requirement: Canonical indicator catalog is complete and navigable

The repository SHALL carry exactly one canonical file per indicator under `docs/rubric/indicators/<NN_CATEGORY>/`, each conforming to the ten-section skeleton (or the approved reduced form), and each category index SHALL link every file in its category.

#### Scenario: An indicator file is missing or duplicated
- **WHEN** the canonical count is not 102, or two files declare the same ID
- **THEN** `npm run check:documentation-structure` fails and names the discrepancy

#### Scenario: A category index omits an indicator
- **WHEN** a category index does not link every canonical file of its category, or links an ID that no canonical file declares
- **THEN** the check fails and reports the expected and actual ID lists

### Requirement: Local documentation links resolve

Every local Markdown link in the documentation tree, the root documentation set, and each workspace README SHALL resolve to an existing path. Links inside fenced code blocks are examples, not links.

#### Scenario: A link target is removed
- **WHEN** a file is deleted while another document still links to it
- **THEN** the check fails and names the linking file and the broken target

### Requirement: Current specifications cite existing paths

A code-span reference to a repository path inside `openspec/specs/**` SHALL resolve to an existing file. References inside `openspec/changes/archive/**` are historical and are exempt.

#### Scenario: A specification cites a removed path
- **WHEN** a current specification references a path that no longer exists, including a line-numbered citation into a file shorter than that line
- **THEN** the check fails and names the specification, the citation, and the missing path

#### Scenario: An archived change cites a removed path
- **WHEN** a specification under `openspec/changes/archive/` references a path removed by a later change
- **THEN** the check passes, because archived changes record the tree as it was when the decision was made
