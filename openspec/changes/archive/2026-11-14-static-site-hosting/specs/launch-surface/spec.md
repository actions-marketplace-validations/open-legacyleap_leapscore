## REMOVED Requirements

### Requirement: Home page leads with the shipped local scan

**Reason**: The requirement's scenarios are written around a public-repository live demo as a permitted secondary path. This change removes the website's scan surface entirely, so the demo clause and its "Public demo is secondary" scenario no longer describe the product. The rest of the requirement — local install as primary, sample as secondary proof, coverage above the fold — still holds.

**Migration**: Replaced by "Home page leads with the local scan and the sample gallery", which keeps the primary/secondary ordering and adds an explicit prohibition on a website-initiated scan.

### Requirement: Product and method pages describe shipped behavior

**Reason**: The requirement is scoped to a product page and a method page as two rendered narratives. The product path is now a forwarding document with no narrative of its own, so half the requirement has no subject. The method-page clauses — frozen denominator, coverage floor, evidence surfaces, no benchmark or remediation-hour claim — are unchanged in substance.

**Migration**: Replaced by "The method page describes shipped behavior", carrying the same clauses and scenarios for the one page that still renders them.

## MODIFIED Requirements

### Requirement: Sample report is labelled and coverage is truthful

Every surface that presents a sample report SHALL label it as illustrative before presenting a score, and SHALL disclose the sample's provenance and coverage. The sample's engine and rubric metadata SHALL be either the current release's real values or explicitly identified as authored. The sample's coverage SHALL NOT be presented as the product's current detector coverage.

#### Scenario: Sample label on every surface

- **WHEN** the sample report appears in the sample gallery, in its detail page title, or in the report body
- **THEN** each surface identifies it as an illustrative sample before presenting a score

#### Scenario: Sample metadata is real or labelled

- **WHEN** the sample report states its engine or rubric version
- **THEN** the value is either the current release's real value or explicitly labelled as authored sample metadata

#### Scenario: Coverage is not overstated

- **WHEN** the sample report shows coverage
- **THEN** it does not present the authored sample's row counts as the product's current detector coverage, and the page states the current local and remote detector counts

#### Scenario: Reports index does not imply hosted history

- **WHEN** the sample gallery renders
- **THEN** it describes itself as a set of committed illustrative samples, not as a store of the visitor's scans, and does not say that past scans appear after a visitor runs one

## ADDED Requirements

### Requirement: Home page leads with the local scan and the sample gallery

The public home page SHALL present the local install command as the primary call to action, the sample gallery as the secondary proof, and the current coverage disclosure above the fold. It SHALL NOT present a waitlist, an unshipped engine, a "Deep Scan", "points gained per hour", "102 inputs", a claim that all 102 indicators are scored, or any affordance that starts a scan of a repository the visitor names.

#### Scenario: Home page primary path

- **WHEN** the home page renders
- **THEN** the primary call to action is the local install command, the sample gallery link is present, and the coverage disclosure is visible before the first report teaser

#### Scenario: No pre-launch claims

- **WHEN** the home page renders
- **THEN** it contains no waitlist, "coming", "Deep Scan", "points gained per hour", "102 inputs", or "scores each one"

#### Scenario: Sample gallery is secondary

- **WHEN** the sample gallery link renders on the home page
- **THEN** it is labelled illustrative and is not the primary call to action

#### Scenario: No website-initiated scan is offered

- **WHEN** the home page renders
- **THEN** it contains no repository input, no "score this repo" affordance, and no link to a scan surface

### Requirement: The method page describes shipped behavior

The method page SHALL describe only behavior present in the current release. It SHALL NOT claim a waitlist, an unshipped "Deep Scan", remediation hours or score-points per hour, a peer benchmark, evidence for every point on every surface, or a website-initiated scan. The method page SHALL state the frozen denominator: unknown rows remain in the denominator as disclosed-unscored, while not-applicable and not-implemented rows are excluded from both sides. It SHALL also state the coverage floor and suppression rule, and distinguish the JSON report's evidence pointers from the human-readable report's summaries.

#### Scenario: Product page has no pre-launch narrative

- **WHEN** the retired product path is requested
- **THEN** it forwards to the method page and publishes no pre-launch narrative

#### Scenario: Method page states the frozen denominator

- **WHEN** the method page explains category scoring
- **THEN** it states that unknown rows stay in the denominator as disclosed-unscored and that not-applicable and not-implemented rows are excluded from both sides

#### Scenario: Method page distinguishes evidence surfaces

- **WHEN** the method page describes evidence
- **THEN** it says the JSON report carries evidence pointers while the HTML and Markdown reports carry summaries

#### Scenario: No benchmark or remediation-hour claim

- **WHEN** the method page renders
- **THEN** it contains no peer-benchmark claim and no score-points-per-hour claim

#### Scenario: Method page names only shipped scan paths

- **WHEN** the method page describes how a scan is started
- **THEN** it names the local CLI and CI paths only, and does not describe or link a website scan
