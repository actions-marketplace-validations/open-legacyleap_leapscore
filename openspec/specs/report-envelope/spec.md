## Purpose

A single versioned definition of the report envelope and run identity, owned by the producing side, so the scanner, the CLI, the workflow, and the website agree on report shape without duplicating types or grammar.

## Requirements

### Requirement: Single envelope contract

The system SHALL define the report envelope and the sealed report shape exactly once, in a shared contract owned by the producing side, and every producer and consumer SHALL use that definition. The engine SHALL type its sealed output as the contract rather than an open record.

#### Scenario: Engine output is contract-typed

- **WHEN** the engine's terminal scoring produces a sealed report
- **THEN** its declared type is the shared contract, with no `Record<string, unknown>` or `unknown[]` standing in for the report's structure

#### Scenario: No second definition exists

- **WHEN** the repository is searched for a second declaration of the report envelope
- **THEN** none exists; the website, the CLI, and the workflow all import the shared contract

#### Scenario: Envelope fields are closed

- **WHEN** a consumer renders a report
- **THEN** every field it reads is declared on the contract, and no consumer reaches into an untyped bag for a report field

### Requirement: Envelope contents

The envelope SHALL consist of four parts: `meta` (the list-view header sufficient to render run history without opening the report body), `report` (the sealed report), `trace` (the ordered engine trace, possibly empty for envelopes written before trace existed), and `score_fingerprint` (the deterministic fingerprint defined by the `deterministic-scoring` capability, carried in `meta`). Fields SHALL be classified as scored (fingerprinted: sorted facts with timings normalized out, rubric/engine/detector/snapshot versions, semantic flags) or run-scoped (excluded: `runId`, `scanned_at`, `durationMs`, trace timings, machine identity). The headline SHALL use the frozen denominator with `unknown` rows disclosed as unscored; the renormalized computation SHALL be retained as a reference field alongside the defined `canonical_score`, which gains its first consumer in CI gating (see `workflow-scan`). When measured rows fall below the coverage floor (default: fewer than half of requested indicators measured), the headline SHALL be suppressed with an explicit `insufficient-signal` verdict instead of a number.

#### Scenario: Envelope round-trips

- **WHEN** a sealed scan is written by the scanner and read back
- **THEN** `meta`, `report`, `trace`, and `score_fingerprint` are all present and `report` is identical to what was streamed terminally

#### Scenario: Absent trace degrades gracefully

- **WHEN** an envelope written before trace existed is read
- **THEN** the reader treats `trace` as empty and renders the report normally rather than failing

#### Scenario: Meta is sufficient for the list view

- **WHEN** the run-history list renders a row
- **THEN** it reads only `meta` fields and never opens the report body

#### Scenario: Repeat runs share a fingerprint

- **WHEN** the same target is scanned twice with the same release and flags
- **THEN** both envelopes carry the same `score_fingerprint` while `runId` and `scanned_at` differ

#### Scenario: Thin signal suppresses the headline

- **WHEN** a scan measures fewer than half of requested indicators
- **THEN** the envelope carries an `insufficient-signal` verdict with no headline number, while the reference scores remain in JSON for diagnosis

### Requirement: runId grammar ownership
The `runId` grammar SHALL be defined once in the shared contract and imported by every producer and consumer. A `runId` SHALL be `<subjectSlug>__<engineSha7>__<ts>`, where `subjectSlug` is the normalized repository slug (`owner/repo` lowercased with `/` mapped to `__`) for remote subjects or the normalized local directory basename slug for `scan <path>` subjects, `engineSha7` is the released engine's version identity (build-stamped release version or explicit `--engine-ref` override, never `git rev-parse` in the caller's checkout) or the literal `unknown`, and `ts` is the run's start timestamp made file- and URL-safe. A `runId` SHALL validate as a single path segment containing no `/` and no `..`.

#### Scenario: Equivalent inputs produce one slug
- **WHEN** the inputs are `https://github.com/Vercel/next.js.git`, `github.com/vercel/next.js/tree/canary`, and `vercel/next.js`
- **THEN** all three derive the repository slug `vercel__next.js`

#### Scenario: Local path derives a stable slug
- **WHEN** the subject is `./claims-core` scanned twice in the same second with the same engine
- **THEN** both runs derive the same `subjectSlug` and differ only if the timestamp or engine identity differs

#### Scenario: Engine identity and timestamp complete the identity
- **WHEN** the same repository is scanned by two different engine references or at two different timestamps
- **THEN** the resulting `runId` values differ and the runs are distinct

#### Scenario: Invalid runId is rejected uniformly
- **WHEN** a `runId` contains `/`, `..`, or fails the grammar
- **THEN** every consumer that validates identity rejects it using the shared validator, before any store or route access

#### Scenario: Same release yields same engine identity
- **WHEN** two operators scan with the same released scanner version from different working trees
- **THEN** both envelopes carry the same `engineSha7` and can produce the same `score_fingerprint`

### Requirement: No duplicated grammar

The system SHALL NOT maintain a second copy of repository normalization, timestamp encoding, or `runId` construction. Any consumer previously carrying a private copy SHALL import the shared implementation.

#### Scenario: Consumer copies are removed

- **WHEN** the repository is searched for a second implementation of repository normalization or `runId` construction
- **THEN** none exists outside the shared contract

#### Scenario: One implementation serves all producers

- **WHEN** the scanner service and the workflow CLI each seal a report for the same target
- **THEN** both obtain the same `runId` for equivalent inputs because both call the shared implementation

### Requirement: Contract version

The envelope SHALL carry a contract version. A reader SHALL reject an envelope whose contract version it does not understand, and SHALL NOT attempt to render an unknown-version envelope as if it were current.

#### Scenario: Version is recorded

- **WHEN** an envelope is sealed
- **THEN** it records the contract version it was written with

#### Scenario: Unknown version is rejected explicitly

- **WHEN** a reader encounters an envelope whose contract version is newer than it understands
- **THEN** it fails with an explicit unsupported-version error rather than rendering a partial report

#### Scenario: Ingest skips and reports unknown versions

- **WHEN** the website's ingest step encounters an unknown-version envelope
- **THEN** it skips that envelope, records a warning naming the file, and completes the ingest of the remaining envelopes

### Requirement: Tier display names with legacy alias
The system SHALL render headline tiers as Low / Moderate / High / Critical with thresholds `>=80 / >=53 / >=27 / <27`, and SHALL carry `tier_legacy` (`Healthy` for Low, `High Risk` for High) in `report.json` meta and headline for one release.

#### Scenario: Low replaces Healthy in reports
- **WHEN** a scan seals at score 82
- **THEN** `headline.tier` is `Low`, `tier_legacy` is `Healthy`, and HTML, Markdown, and stdout all show `Low`

#### Scenario: High replaces High Risk in reports
- **WHEN** a scan seals at score 41
- **THEN** `headline.tier` is `High`, `tier_legacy` is `High Risk`, and the band-specific assessment CTA for High renders

### Requirement: Sealed-row provenance manifest

The envelope's `report.provenance.tool_manifest` SHALL list every producer that produced a fact in the sealed report, each with its version, and every row's evidence producer SHALL appear in that manifest. The manifest SHALL be non-empty whenever any row is `measured` or `estimated`, and SHALL be a truthful record of what ran — not a static or empty list.

#### Scenario: Manifest covers every cited producer

- **WHEN** a report is sealed
- **THEN** for every row carrying evidence, that row's evidence producer appears in `tool_manifest` with a version

#### Scenario: Manifest is non-empty for a measured scan

- **WHEN** at least one row is `measured` or `estimated`
- **THEN** `tool_manifest` is non-empty and names the producers that ran, so a reader can tell which tools produced the report

### Requirement: Report self-description marker

The envelope's `report.sample` marker SHALL be true only for authored demo data. A scan of a real target — remote or local path — SHALL NOT carry the marker as true. Consumers SHALL be able to rely on the marker to distinguish authored fixtures from real runs.

#### Scenario: Real run is not marked as sample

- **WHEN** any scan of a real target is sealed
- **THEN** `report.sample` is absent or false

#### Scenario: Authored fixture is marked

- **WHEN** the website's authored sample report is produced
- **THEN** `report.sample` is true
