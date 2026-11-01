## ADDED Requirements

### Requirement: Architecture diagrams are contributor-only, revision-pinned snapshots

The repository MAY carry architecture diagrams under `docs/diagrams/`, and SHALL carry them only there. Each diagram SHALL be a matched pair of two files with the same stem: `<type>-<slug>.html` (the compiled, self-contained viewer) and `<type>-<slug>.json` (the authored specification the viewer is rendered from). `<type>` SHALL be one of the archify diagram types (`architecture`, `class`, `dataflow`, `erd`, `lifecycle`, `sequence`, `tree`, `timeline`, `waterfall`, `workflow`); `<slug>` SHALL be lowercase kebab-case. No path segment under `docs/diagrams/` SHALL carry a generation timestamp or a non-kebab-case segment.

The directory SHALL carry an index at `docs/diagrams/README.md` that links every committed pair and states three things: that the diagrams are illustrative snapshots rather than a requirements source, the revision each diagram was rendered against, and the command that regenerates them.

A diagram's pinned revision SHALL be the `meta.repository.revision` value carried by its `.json` specification, SHALL be restated in the index, and SHALL agree with the source-evidence revision embedded in its `.html`. Moving a pin forward requires re-authoring the diagram's evidence at that revision; editing the field alone SHALL NOT be treated as a refresh.

Delivery receipts SHALL NOT be committed: no file under `docs/diagrams/` SHALL match the archify receipt names (`*.delivery.json`, `*.finalize.json`, `*.finalize-summary.json`, `*.browser-check.json`), because they carry machine-local absolute paths and timestamps and are bound to exact artifact bytes. The tool's working directory (`.archify/`) SHALL remain untracked.

The diagrams SHALL NOT be served by the site: no published asset path or route SHALL reference `docs/diagrams/`, and no public page SHALL link a diagram as if it were product documentation.

#### Scenario: A diagram pair is incomplete

- **WHEN** `docs/diagrams/` holds an `.html` file with no `.json` of the same stem, or a `.json` with no `.html`
- **THEN** `npm run check:diagrams` fails and names the unpaired file

#### Scenario: A diagram path carries a timestamp or a non-kebab segment

- **WHEN** a path under `docs/diagrams/` contains a generation timestamp (`-YYYYMMDD-HHMMSS`) or an uppercase letter, space, or underscore in its slug
- **THEN** the check fails and names the offending path

#### Scenario: The index omits a committed pair

- **WHEN** `docs/diagrams/README.md` does not link a committed `.html`/`.json` pair, or does not state the illustrative-not-requirements framing, the pinned revision, and the regeneration command
- **THEN** the check fails and names the missing link or statement

#### Scenario: The pinned revision disagrees across the pair and the index

- **WHEN** a diagram's `meta.repository.revision` differs from the revision the index states for it, or from the revision embedded in its `.html` source evidence
- **THEN** the check fails and reports both values

#### Scenario: A delivery receipt is committed beside the artifacts

- **WHEN** a file matching an archify receipt name exists under `docs/diagrams/`
- **THEN** the check fails, because receipt evidence is machine-local and byte-bound, not repository documentation

#### Scenario: The tool working directory becomes tracked

- **WHEN** `.archify/` is not excluded by the repository ignore rules, so a future tool run could commit its working files
- **THEN** the check fails and names the ignore rule that must be restored

#### Scenario: A diagram is served or cited as product documentation

- **WHEN** a site route or published asset path references `docs/diagrams/`, or a public page links a diagram as a requirements or product source
- **THEN** the check fails, because the diagrams are contributor material with no public-serving contract
