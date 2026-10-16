## MODIFIED Requirements

### Requirement: runId grammar ownership
The `runId` grammar SHALL be defined once in the shared contract and imported by every producer and consumer. A `runId` SHALL be `<subjectSlug>__<engineSha7>__<ts>`, where `subjectSlug` is the normalized repository slug (`owner/repo` lowercased with `/` mapped to `__`) for remote subjects or the normalized local directory basename slug for `scan <path>` subjects, `engineSha7` is the producing engine's short commit reference or the literal `unknown`, and `ts` is the run's start timestamp made file- and URL-safe. A `runId` SHALL validate as a single path segment containing no `/` and no `..`.

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

## ADDED Requirements

### Requirement: Tier display names with legacy alias
The system SHALL render headline tiers as Low / Moderate / High / Critical with thresholds `>=80 / >=53 / >=27 / <27`, and SHALL carry `tier_legacy` (`Healthy` for Low, `High Risk` for High) in `report.json` meta and headline for one release.

#### Scenario: Low replaces Healthy in reports
- **WHEN** a scan seals at score 82
- **THEN** `headline.tier` is `Low`, `tier_legacy` is `Healthy`, and HTML, Markdown, and stdout all show `Low`

#### Scenario: High replaces High Risk in reports
- **WHEN** a scan seals at score 41
- **THEN** `headline.tier` is `High`, `tier_legacy` is `High Risk`, and the band-specific assessment CTA for High renders
