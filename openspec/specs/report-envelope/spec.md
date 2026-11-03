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

### Requirement: Derived next-band path in the sealed report

The sealed report SHALL carry the path defined by the `band-path` capability as a declared field on the contract, so the derivation happens once at seal time and no consumer re-derives it from row scores. The field SHALL be absent when the headline is suppressed, and present but terminal for a report already at the highest band. The field SHALL be excluded from the score fingerprint, because it is derived from already-fingerprinted row scores and introduces no new target-derived fact.

#### Scenario: One derivation serves every surface

- **WHEN** the site report views, CLI `report.html`, CLI `report.md`, and stdout each render a next-band path for the same run
- **THEN** all four read the same sealed field rather than recomputing the path

#### Scenario: Absent for a suppressed headline

- **WHEN** a report seals with the `insufficient-signal` verdict
- **THEN** the envelope carries no next-band path and consumers render no path block

#### Scenario: Fingerprint excludes the derived field

- **WHEN** a sealed report's path field is recomputed from its own row scores
- **THEN** `score_fingerprint` is unchanged, because the field is derived rather than target-measured

#### Scenario: Older envelopes degrade gracefully

- **WHEN** an envelope sealed before this field existed is read
- **THEN** the reader renders the report without a path block rather than failing

### Requirement: Comparability inputs on the envelope

The envelope SHALL record, in `meta`, the inputs a differ needs to classify a comparison without recomputing target facts: the requested indicator set, the headline score policy, the fingerprint scheme version, and the rubric version. `meta` SHALL remain sufficient to render the run-history list without opening the report body. Recording these SHALL NOT change the score fingerprint, because they are an explicit view of inputs already fingerprinted rather than new fingerprinted inputs.

#### Scenario: Meta alone suffices for comparison

- **WHEN** a differ compares two envelopes
- **THEN** it resolves subject identity, era, rubric version, score policy, and requested set from `meta` without opening the report body

#### Scenario: Fingerprint is unchanged by the new fields

- **WHEN** the same target content is scanned twice with identical flags
- **THEN** both envelopes carry identical fingerprints, and adding these fields neither alters nor mixes into the fingerprint

#### Scenario: List view continues to read only meta

- **WHEN** the run-history list renders a row
- **THEN** it still reads only `meta` fields and never opens the report body

#### Scenario: Absent inputs are distinguishable from empty

- **WHEN** an envelope was written before these inputs were recorded
- **THEN** their absence is distinguishable from an empty requested set, so a differ can reconstruct or refuse rather than assume

### Requirement: Delta document shape

The contract SHALL define the delta document produced by the `run-diff` capability exactly once: the two run references, the comparability verdict with its blocking cause when incomparable, the headline decomposition, the per-row differences with their kinds, and the transition list. The delta document SHALL be derived and SHALL NOT be an envelope: it SHALL NOT carry a score fingerprint and SHALL NOT be readable as a sealed report by any consumer.

#### Scenario: One definition serves all consumers

- **WHEN** the repository is searched for a second declaration of the delta document
- **THEN** none exists, and the CLI and any later consumer import the shared contract

#### Scenario: Delta is not an envelope

- **WHEN** the site's ingest step encounters a delta document in a report directory
- **THEN** it skips it as a non-envelope with a recorded warning and creates no run row from it

#### Scenario: Both run references are present

- **WHEN** a delta document is written
- **THEN** each of its two run references names the run id, fingerprint, fingerprint scheme version, score, and tier of its run

### Requirement: Target identity in the sealed report

The sealed report SHALL carry an optional target-identity block describing what the scanned code is, as defined by the `report-identity` capability. The block SHALL live inside `report`, SHALL NOT become a fifth envelope part, and SHALL be typed by the shared contract as an optional member so envelopes written before it existed remain valid.

The block SHALL be classified as derived-and-excluded, alongside the derived next-band path: it SHALL NOT contribute any hashed input to `score_fingerprint`, and it SHALL NOT alter `meta`, the headline, the coverage counts, the gates, or any sealed row.

#### Scenario: Identity rides inside the report

- **WHEN** an envelope carrying an identity block is inspected
- **THEN** the envelope still consists of `meta`, `report`, `trace`, and `score_fingerprint`, with identity reachable only under `report`

#### Scenario: Fingerprint is unaffected

- **WHEN** two envelopes describe identical content and the identical release, and one carries a measured line magnitude while the other carries an estimated one
- **THEN** both carry the same `score_fingerprint`

#### Scenario: Absent block degrades gracefully

- **WHEN** an envelope written before the identity block existed is read by any consumer
- **THEN** the consumer treats identity as absent and renders the report normally, without fabricating values and without failing

#### Scenario: The list view still needs only meta

- **WHEN** the run-history list renders a row for an envelope that carries an identity block
- **THEN** the row is still rendered from `meta` alone, and the list does not open the report body to obtain identity values

#### Scenario: Consumers do not synthesize identity

- **WHEN** a consumer renders an envelope whose identity block is absent
- **THEN** it does not re-walk the tree, re-sniff manifests, or re-derive archetype to reconstruct the block
