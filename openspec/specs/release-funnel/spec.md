# release-funnel Specification

## Purpose
Keeps the release funnel coherent end to end — the positioning line, the result-specific next step, the tracked link, and the public band vocabulary are single-sourced so CLI reports, CLI stdout, and the site's report surfaces cannot drift from each other or from the open-source release brief.

## Requirements

### Requirement: Positioning line single source

The positioning line SHALL be defined exactly once, as `POSITIONING_LINE` in `packages/contracts`, with the text: `LeapScore sees the structure. The assessment understands what the code does.` Every human-readable report surface SHALL render it verbatim as its final content: the CLI `report.html`, the CLI `report.md`, and every site report view (sample fixture, persisted run, revealed live report). No emitter or site component SHALL carry a second copy of the sentence. Machine output (`report.json`, NDJSON streams) is exempt.

#### Scenario: CLI reports close with the line

- **WHEN** a sealed run writes `report.html` and `report.md`
- **THEN** each document's final content block contains the exact sentence, after the methodology link

#### Scenario: Site reports close with the line

- **WHEN** the sample fixture, a persisted envelope, or a revealed live report renders
- **THEN** the report body ends with the positioning line

#### Scenario: No duplicated copy

- **WHEN** emitter and site source files are searched for the sentence text
- **THEN** only the contracts constant contains it

### Requirement: Site report next step

Every site report view (sample fixture, persisted run, revealed live report) SHALL end with a next-step band that renders, in order: the band-specific next-step sentence, the tracked assessment link, and the positioning line. The sentence and link SHALL come from the same contracts helpers the CLI uses, so the two surfaces cannot drift.

#### Scenario: Band renders on all report surfaces

- **WHEN** any site report view renders
- **THEN** it ends with the band containing the sentence for the sealed tier, the tracked assessment URL, and the positioning line

#### Scenario: Shared text, no per-surface copy

- **WHEN** a band sentence changes in contracts
- **THEN** the CLI reports and the site band change together, with no independent copy in site components

### Requirement: Tracked next-step link grammar

Every next-step link the system emits — CLI reports, CLI stdout, site next-step bands — SHALL be built by the shared helper and carry exactly `utm_campaign=cli-scan-v1` and `band=<tier>` with the public band lowercased. The tracked URL SHALL appear exactly once in each artifact (HTML report, Markdown report, stdout line, site band). The system SHALL NOT contact the assessment host during a scan; clicking is the only telemetry.

#### Scenario: One link per artifact

- **WHEN** a sealed run writes `report.html`, `report.md`, and stdout
- **THEN** each contains the tracked URL exactly once

#### Scenario: Grammar follows the sealed band

- **WHEN** the sealed band is Low, Moderate, High, or Critical
- **THEN** the `band` parameter reads `low`, `moderate`, `high`, or `critical` respectively

#### Scenario: No automatic contact

- **WHEN** a default scan completes
- **THEN** no request to the assessment host is made (the link exists only as text)

### Requirement: Public band vocabulary

Public band labels SHALL be `Low` (≥80), `Moderate` (53–79), `High` (27–52), and `Critical` (<27) on every surface and document that states bands: CLI stdout, JSON `headline.tier`, HTML/Markdown reports, site UI, and the canonical rubric band tables (`docs/rubric/11_WEIGHTS_THRESHOLDS_CONFIG.md` §3 and its generated restatements `docs/rubric/00_SCORE_SHEET.md` and the score-sheet templates). The legacy aliases (`Healthy`, `High Risk`) SHALL be carried only in the `tier_legacy` field for one release and SHALL NOT be displayed as primary labels. The 0–3 row scoring taxonomy labels (for example `3 — Healthy`) are row verdicts, not bands, and SHALL NOT be renamed. Threshold values and the compiled rubric artifacts SHALL NOT change.

#### Scenario: Site renders the public set

- **WHEN** any site surface renders a band
- **THEN** it reads Low/Moderate/High/Critical, and `Healthy`/`High Risk` appear only as legacy alias data

#### Scenario: Aliases stay machine-only

- **WHEN** a report seals Low or High
- **THEN** `headline.tier_legacy` still maps to `Healthy`/`High Risk`, and no rendered surface prints the alias

#### Scenario: Row taxonomy untouched

- **WHEN** an indicator row renders `3 — Healthy`
- **THEN** that row verdict text is unchanged; it is the 0–3 taxonomy, not a band

#### Scenario: Thresholds and compiled artifacts unchanged

- **WHEN** the canonical band tables are renamed
- **THEN** thresholds 80/53/27 are unchanged and `npm run check:rubric-consistency` passes

### Requirement: Methodology link resolves in-repo

The site SHALL serve the methodology path the CLI writes into reports (`/methodology`) by permanently redirecting it to the method page (`/method`), so the report link is a real route of the site rather than a dead path. The CLI `METHODOLOGY_URL` value SHALL remain unchanged. The method page SHALL tell the current state — local CLI scan and live scan available, sample surfaces illustrative.

#### Scenario: Redirect serves the report link

- **WHEN** a client requests `/methodology`
- **THEN** the site responds with a permanent redirect to `/method`

#### Scenario: Path stays in lockstep with the emitters

- **WHEN** the emitter writes the methodology URL
- **THEN** `/methodology` is a served route in-repo (a redirect or page), checked by test

#### Scenario: Method page tells the current state

- **WHEN** `/method` renders its "where we are now" section
- **THEN** it names the local CLI and live scan as available rather than in development

### Requirement: Funnel-landing chrome tells the current truth

Site chrome that funnel visitors land on SHALL NOT claim the engine is unshipped: the footer disclaimer SHALL reflect that sample reports are illustrative while local CLI and live scans are available, and rubric links in the homepage and footer SHALL target the site's `/rubric` route, not a repo-relative path. The homepage/product launch narrative (waitlist, "coming") is out of scope for this capability.

#### Scenario: Footer disclaimer accurate

- **WHEN** any page renders the footer
- **THEN** no sentence claims the live engine has not shipped

#### Scenario: Rubric links resolve

- **WHEN** the rubric link renders on the homepage or in the footer
- **THEN** its target is `/rubric`, and no `../rubric/README.md` relative link remains in the site
