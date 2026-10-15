## Purpose

A single versioned definition of the report envelope and run identity, owned by the producing side, so the scanner, the CLI, the workflow, and the website agree on report shape without duplicating types or grammar.

## ADDED Requirements

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

The envelope SHALL consist of three parts: `meta` (the list-view header sufficient to render run history without opening the report body), `report` (the sealed report), and `trace` (the ordered engine trace, possibly empty for envelopes written before trace existed).

#### Scenario: Envelope round-trips

- **WHEN** a sealed scan is written by the scanner and read back
- **THEN** `meta`, `report`, and `trace` are all present and `report` is identical to what was streamed terminally

#### Scenario: Absent trace degrades gracefully

- **WHEN** an envelope written before trace existed is read
- **THEN** the reader treats `trace` as empty and renders the report normally rather than failing

#### Scenario: Meta is sufficient for the list view

- **WHEN** the run-history list renders a row
- **THEN** it reads only `meta` fields and never opens the report body

### Requirement: runId grammar ownership

The `runId` grammar SHALL be defined once in the shared contract and imported by every producer and consumer. A `runId` SHALL be `<repoSlug>__<engineSha7>__<ts>`, where `repoSlug` is the normalized repository lowercased with `/` mapped to `__`, `engineSha7` is the producing engine's short commit reference or the literal `unknown`, and `ts` is the run's start timestamp made file- and URL-safe. A `runId` SHALL validate as a single path segment containing no `/` and no `..`.

#### Scenario: Equivalent inputs produce one slug

- **WHEN** the inputs are `https://github.com/Vercel/next.js.git`, `github.com/vercel/next.js/tree/canary`, and `vercel/next.js`
- **THEN** all three derive the repository slug `vercel__next.js`

#### Scenario: Engine identity and timestamp complete the identity

- **WHEN** the same repository is scanned by two different engine references or at two different timestamps
- **THEN** the resulting `runId` values differ and the runs are distinct

#### Scenario: Invalid runId is rejected uniformly

- **WHEN** a `runId` contains `/`, `..`, or fails the grammar
- **THEN** every consumer that validates identity rejects it using the shared validator, before any store or route access

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
