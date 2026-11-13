## Purpose

Keeps the public marketing surface aligned with the shipped scanner: every claim, sample, and coverage statement describes what the current release actually does, so a visitor can trust the number before running it.

## Requirements

### Requirement: Home page leads with the shipped local scan

The public home page SHALL present the local install command as the primary call to action, the sample report as the secondary proof, and the current coverage disclosure above the fold. It SHALL NOT present a waitlist, an unshipped engine, a "Deep Scan", "points gained per hour", "102 inputs", or a claim that all 102 indicators are scored. A public-repository live demo MAY appear only as a secondary path, clearly labelled as a public demo.

#### Scenario: Home page primary path

- **WHEN** the home page renders
- **THEN** the primary call to action is the local install command, the sample report link is present, and the coverage disclosure is visible before the first report teaser

#### Scenario: No pre-launch claims

- **WHEN** the home page renders
- **THEN** it contains no waitlist, "coming", "Deep Scan", "points gained per hour", "102 inputs", or "scores each one"

#### Scenario: Public demo is secondary

- **WHEN** a live public-repository demo link renders on the home page
- **THEN** it is labelled as a public demo and is not the primary call to action

### Requirement: Product and method pages describe shipped behavior

The product and method pages SHALL describe only behavior present in the current release. They SHALL NOT claim a waitlist, an unshipped "Deep Scan", remediation hours or score-points per hour, a peer benchmark, or evidence for every point on every surface. The method page SHALL state the frozen denominator: unknown rows remain in the denominator as disclosed-unscored, while not-applicable and not-implemented rows are excluded from both sides. It SHALL also state the coverage floor and suppression rule, and distinguish the JSON report's evidence pointers from the human-readable report's summaries.

#### Scenario: Product page has no pre-launch narrative

- **WHEN** the product page renders
- **THEN** it does not describe the engine as in development, offer a waitlist, promise a "Deep Scan", or order remediation by points per hour

#### Scenario: Method page states the frozen denominator

- **WHEN** the method page explains category scoring
- **THEN** it states that unknown rows stay in the denominator as disclosed-unscored and that not-applicable and not-implemented rows are excluded from both sides

#### Scenario: Method page distinguishes evidence surfaces

- **WHEN** the method page describes evidence
- **THEN** it says the JSON report carries evidence pointers while the HTML and Markdown reports carry summaries

#### Scenario: No benchmark or remediation-hour claim

- **WHEN** the product or method page renders
- **THEN** it contains no peer-benchmark claim and no score-points-per-hour claim

### Requirement: Sample report is labelled and coverage is truthful

Every surface that presents the sample report SHALL label it as illustrative before presenting a score, and SHALL disclose the sample's provenance and coverage. The sample's engine and rubric metadata SHALL be either the current release's real values or explicitly identified as authored. The sample's coverage SHALL NOT be presented as the product's current detector coverage.

#### Scenario: Sample label on every surface

- **WHEN** the sample report appears in the reports index, in its detail page title, or in the report body
- **THEN** each surface identifies it as an illustrative sample before presenting a score

#### Scenario: Sample metadata is real or labelled

- **WHEN** the sample report states its engine or rubric version
- **THEN** the value is either the current release's real value or explicitly labelled as authored sample metadata

#### Scenario: Coverage is not overstated

- **WHEN** the sample report shows coverage
- **THEN** it does not present the authored sample's row counts as the product's current detector coverage, and the page states the current local and remote detector counts

#### Scenario: Reports index does not imply hosted history

- **WHEN** the reports index renders
- **THEN** it describes itself as a site-owned sample, not as a store of the visitor's scans, and does not say that past scans appear after a visitor runs one

### Requirement: Public copy uses the approved coverage vocabulary

Public copy SHALL state coverage with a version, date, and denominator when it gives a number. It SHALL say "up to 31 indicators have a detector today (25 on a local scan)" rather than "scores 102 indicators". It SHALL NOT use "benchmark" or "peer comparison" until a peer dataset ships.

#### Scenario: Coverage number is qualified

- **WHEN** public copy states a detector or coverage number
- **THEN** the number is paired with the release version, date, and denominator

#### Scenario: No full-coverage claim

- **WHEN** public copy describes the rubric
- **THEN** it does not claim that all 102 indicators are scored or measured

#### Scenario: No benchmark language

- **WHEN** public copy describes the score
- **THEN** it does not use "benchmark" or "peer comparison"
