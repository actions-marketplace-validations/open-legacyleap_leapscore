## MODIFIED Requirements

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
