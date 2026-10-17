## Purpose

Provides canonical indicator display for every report surface so titles, categories, and placeholders are always derived from the rubric and never invented from IDs, restoring trust in the scorecard UI.

## Requirements

### Requirement: Canonical indicator names

The system SHALL render every `IndicatorRow.name` and `IndicatorRow.category_id` display from a single rubric-derived registry (sourced from `docs/rubric/01_...10_...` + `11_WEIGHTS_THRESHOLDS_CONFIG.md` via `tooling/scripts/compile-rubric.ts` → `packages/engine/rubric.json` `indicators[]`). The raw indicator ID (e.g. `ECOS-01`) SHALL never be used as a title fallback. Category headers (e.g. `ECOS` → `Dependency & Ecosystem Health`) SHALL also be derived from the same registry.

#### Scenario: Live placeholder row shows rubric title
- **WHEN** `/live` renders `ECOS-01` as an `unknown` placeholder before its detector completes
- **THEN** the row title reads `Runtime/Language EOL` (from registry) and the left mono column shows `ECOS-01`; the title never reads `ECOS-01`.

#### Scenario: MVP extra rows show rubric title
- **WHEN** `packages/engine/scorer/mvp.ts` creates rows for the 13 clone-based MVP indicators
- **THEN** each row's `name` is looked up from the registry (e.g. `ECOS-02` → `Major package drift`) and the UI at `apps/site/components/category-section.tsx:113` displays that name.

#### Scenario: Sample and live share one source
- **WHEN** `apps/site/lib/sample.ts` builds the sample report's `IndicatorRow`s and the scanner service builds a live report's rows
- **THEN** both import the same registry; a drift between them fails `npm run check:rubric-consistency`. The website SHALL NOT carry a separate live row-builder, because live rows now arrive already built over the scan API.

### Requirement: No ID-as-title fallback

The system SHALL treat a registry miss as an error condition, not a silent fallback. If an indicator ID has no registry entry, the row SHALL render `Unknown indicator (ID)` with a console warning and SHALL be flagged by `check:rubric-consistency`, rather than rendering the ID as the title.

#### Scenario: Unknown ID surfaces
- **WHEN** a detector emits `FOO-99` with no rubric entry and a report includes it
- **THEN** the row renders `Unknown indicator (FOO-99)` and the build-time consistency check fails, prompting a rubric or `compile:rubric` fix.

### Requirement: Full-table consolidation uses registry

The system SHALL build `full_table` (102 rows) and `deep_dive_scope` by iterating the registry's 102 IDs, marking requested-but-undone rows `unknown` with `unknown_measure_path` and FE rows `not_applicable` where the repo has no client. All placeholder rows SHALL carry the registry's `name` and `effort` (`⚡/🔶/🔷`). For `measured` and `estimated` rows where the encyclopedia defines a remediation playbook, the system SHALL also carry the registry's `remediation` (`quick_win`, `structural`, `gold_standard`, `effort`) on `IndicatorRow.remediation`; `unknown` and `not_applicable` rows SHALL NOT carry `remediation` (they carry `unknown_measure_path` instead). The registry source for `remediation` is `docs/rubric/01_...10_...` parsed by `tooling/scripts/compile-rubric.ts` into `packages/engine/rubric.json` and `apps/site/lib/generated/rubric.ts`; no detector or scorer SHALL hand-author remediation text.

Categories in the scorecard grid SHALL be derived only from indicator rows that were requested or have a measured/estimated/unknown status. A category with zero `indicator_rows` SHALL be omitted from `report.categories` and SHALL NOT contribute `category_score` or `weighted_contribution` to the headline; the headline is the sum over non-empty categories. This is the excluding-not-zero semantics for empty categories. `coverage` (`31/102`) is unchanged.

#### Scenario: Measured row carries rubric-derived remediation
- **WHEN** `provider.live.ts` or `sample.ts` builds a `measured` row for `ARCH-01` (Cognitive Complexity)
- **THEN** `row.remediation.quick_win` equals the encyclopedia `Remediation playbook: Quick win:` clause (e.g. contains `carve the top 5 offenders`), `row.remediation.structural` contains the `Structural fix:` clause, `row.remediation.gold_standard` contains the `Gold standard` clause, and `row.remediation.effort` equals the entry's `Verify effort` tag; `RowDetail` renders the three sections under a `Remediation` heading.

#### Scenario: Estimated row also carries remediation
- **WHEN** a row is `estimated` (score clamped 1–2, confidence low/medium) and its encyclopedia has a playbook
- **THEN** `row.remediation` is still present and rendered with an `estimated` badge indicating the underlying finding is heuristic, not a measured fact.

#### Scenario: Unknown row does not carry remediation
- **WHEN** a `full_table` placeholder is `unknown` (e.g. `PERF-03`)
- **THEN** the row has `unknown_measure_path` and no `remediation`; the deep-dive scope entry explains what it takes to make it measured.

#### Scenario: Live full-table placeholders carry correct metadata
- **WHEN** `provider.live.ts:buildFullTable()` constructs the 96 unknown placeholders for a 19-indicator scan
- **THEN** each placeholder has `name` and `effort` from the registry, and `unknown_measure_path` per the encyclopedia/delta spec, not hardcoded `⚡ ≤30 min`.

#### Scenario: API not in scorecard when no API rows requested
- **WHEN** scan requests only Tranche-A 31 ids (no `API-*`) and `full_table` still has 102 rows
- **THEN** `report.categories` contains 7-8 entries (no `API`), `API`'s 10% weight contributes `0` (not `0% *10%` tiered Critical), and `CoverageStrip` still shows `31/102`

### Requirement: Empty categories are not evaluated
The system SHALL NOT render a category as evaluated when it has no indicator rows. A `CategoryScore` where `applicable === 0` and `indicator_rows.length === 0` SHALL have `category_score: null` and SHALL NOT display a score or tier badge. The category card SHALL be hidden from the `Category scorecard` grid. `status_counts` SHALL be `0m/0e/0u` and SHALL NOT tier to `Critical`.

#### Scenario: API with 0 rows is hidden
- **WHEN** a 31-indicator scan has no API indicators (Tranche A) and `report.categories` would contain `API` with `indicator_rows: []`
- **THEN** the engine omits `API` from `categories[]` and `apps/site/app/report/sample/page.tsx` renders 7-9 cards, not 10, with no `0 | Critical` card and headline not dragged by an empty 10% weight

#### Scenario: Guard renders Not evaluated if empty slips through
- **WHEN** `CategorySection` receives a `category` with `category_score === null`
- **THEN** it renders `—` and badge `Not evaluated` instead of `0` and `Critical`

#### Scenario: Measured category still tiers
- **WHEN** `DOCS` has 5 measured rows and `category_score 66`
- **THEN** `CategorySection` renders `66` and `Moderate` as before

### Requirement: Top restore levers show remediation and effort

The system SHALL render the `Top restore-levers` panel (`apps/site/components/blockers.tsx:TopBlockers`) as the 5 `measured|estimated` rows with highest recoverable headline points, each lever showing the row ID and name, recoverable points `+weight_pp` (as today), the row's `effort` pill (`⚡/🔶/🔷`), and a one-line `remediation.quick_win` excerpt truncated to ≤110 characters. Each lever SHALL link to the corresponding row anchor in the category scorecard. The sort order remains `weight_pp` descending (then `points_lost`), computed as category weight × `(3 − score)/3`; no new ranking is introduced.

#### Scenario: Django sample levers are actionable
- **WHEN** the Django sample (score 58, Moderate) renders `Top restore-levers`
- **THEN** the 5 levers appear ordered `SEC-05 (2.22pp)`, `DATA-02 (1.33pp)`, `DATA-08 (1.33pp)`, `ECOS-08 (1.25pp)`, `TEST-08 (1.25pp)` and each lever shows its `effort` (e.g. `🔶 ~2–4 h` for `ARCH-01` if it were in the top 5) and the first 110 chars of its `quick_win` (e.g. `Carve the top 5 offenders by automated extract-method…`), with the lever row acting as an anchor link to `#row-SEC-05` etc.

#### Scenario: Levers degrade gracefully when remediation absent
- **WHEN** a top-blocker row has no encyclopedia playbook (defensive, should not happen for standard rows)
- **THEN** the lever renders `weight_pp` + `effort` and omits the `quick_win` line without crashing; `check:rubric-consistency` warns about the missing playbook.

### Requirement: Human-readable row evidence and reasoning

The system SHALL render every `IndicatorRow` with a human-readable `reason` that is ID-free, score-aware, and explicitly includes the encyclopedia flag rationale for the scored band (e.g. Yellow/Red flag rationale from `docs/rubric/09_DOCS_KNOWLEDGE.md` and sibling category docs), so the user can trust why a score maps to that band. The detail SHALL show a single muted `detected via <tool>` meta line (no duplicate ID-subtitle), and `evidence.facts` rendered as a key:value table when `1–5` facts are present, falling back to compact pills when `>5` facts (overflow chips) — with either rendering never emitting `[object Object]`. When facts contain a nested detector-keyed object (legacy shape `{docs08: {...}}`), the renderer SHALL flatten or stringify without emitting `[object Object]`.

#### Scenario: DOCS-08 live row shows narrative with rationale and table
- **WHEN** a live scan measures `DOCS-08` as `score 0` with `changelog_present=false` and detector tool `changelog-inventory`
- **THEN** the Row header shows `DOCS-08` once (left mono column) and title `No Release Communication / Changelog`; the expanded detail shows `reason` as a human sentence that includes the encyclopedia Red-flag rationale (e.g. `No CHANGELOG.md found (checked 6 candidate paths); 0% of sampled releases carry notes — per DOCS-08 Red flag rationale: breaking changes ship unannounced, consumers learn from failures — score 0`) with no `DOCS-08` prefix, a single `detected via changelog-inventory` line, a `repo — no changelog` pointer, and a key:value table of flat facts (`changelog_present | false`, `with_notes_pct | 0`) — never `docs08: [object Object]` or a bare chip for a nested object.

#### Scenario: DOCS-03 live row shows runbook narrative with rationale
- **WHEN** `DOCS-03` is measured with `count=0` (no runbooks) via `runbook-inventory`
- **THEN** `reason` reads like `No runbooks found — searched docs/runbooks, runbooks, docs/operations etc.; per DOCS-03 Red-flag rationale: incidents recovered by heroics, every lesson repeated` and facts are shown as a key:value table (`count | 0`, `restore_doc_present | false`) — never `docs03: [object Object]`.

#### Scenario: DOCS-04 live row shows onboarding narrative
- **WHEN** `DOCS-04` is measured with `docs_present=[]` via `onboarding-inventory`
- **THEN** `reason` reads like `No onboarding guide — no CONTRIBUTING.md / GETTING_STARTED.md and README has no setup section; stages missing: setup, run, test` with flat chips.

#### Scenario: Renderer is defensive on object facts and uses table vs pills
- **WHEN** an `evidence.facts` value is an object (nested legacy, array, or `breaking_with_migration_guide: {total_breaking: 0, documented: 0}`)
- **THEN** the UI renders it as `breaking_with_migration_guide: 0/0 documented` or `JSON.stringify(value)` — never `String(value)` producing `[object Object]`. Empty objects produce no row. When the total primitive fact count for the row is `1–5`, the UI uses a key:value table; when `>5`, it uses compact pills (with `title` hover holding the full value and truncation at 80 chars).

#### Scenario: Reason always cites rubric rationale
- **WHEN** any measured row renders its `reason`
- **THEN** the sentence includes an explicit citation of the encyclopedia flag rationale that justifies the band (e.g. `per DOCS-08 Red flag: ...` or `per ARCH-01 Yellow flag: ...`), not just a fact dump — so the user can audit why this score maps to that rubric band.

#### Scenario: No duplicate indicator-code subtitle
- **WHEN** any measured row is rendered
- **THEN** the UI shows the indicator ID exactly once (left mono column) and never repeats it in `reason` or as a `DOCS-08 measured via ...` subtitle. The `detected via <tool>` line is the only tool attribution.

### Requirement: Evidence facts shape at UI boundary

The system SHALL ensure `evidence.facts` arriving at the UI is a flat record of primitive values (strings, numbers, booleans) suitable for `k: v` display. The engine scorer SHALL flatten detector-keyed nesting (`{docs08: {...}}` → `{changelog_present: ..., with_notes_pct: ...}`) before producing `IndicatorRow`; the UI SHALL also flatten defensively for any remaining nested shape.

#### Scenario: Engine flattens DOCS facts before UI
- **WHEN** `docs08` detector emits `{docs08: {changelog_present: true, with_notes_pct: 0.42}}`
- **THEN** the resulting `IndicatorRow.evidence.facts` equals `{changelog_present: true, changelog_current: ..., releases_sampled: ..., with_notes_pct: 0.42, ...}` with no `docs08` key wrapping an object.

#### Scenario: Phase-1 rows also avoid nesting
- **WHEN** `VEL-09` or any Phase-1 indicator is measured via `gh-api`
- **THEN** its `evidence.facts` are also flat primitives (or JSON-stringified where the fact is inherently structured), never `{vel09: [object Object]}`.

#### Scenario: Flattening holds across the wire
- **WHEN** a live report's rows arrive at the website over the scan API rather than from an in-process call
- **THEN** `evidence.facts` are still flat primitives at the render boundary, and the UI's defensive flattening still covers any nested shape

### Requirement: Live report chrome is minimal and shows commit link

The live report page (`/live` and alias `/report/live`) SHALL render the sealed report without a `schema · rubric · share: /live?repo=...` subtitle and without `see method` or `view sample` header links. Instead, the revealed sealed state SHALL render the target repo commit SHA as a subtitle under the repo title (`django/django`) as `commit <short7>` linked to `https://github.com/{owner}/{repo}/commit/{fullSha}` when `report.snapshot.scanned_commit` is present and not `unknown`; when `unknown`, it SHALL render `commit unknown` as plain text. All live states (scanning, sealed-not-revealed, revealed, refused) SHALL omit the `schema · rubric · share` line.

#### Scenario: Revealed live shows commit link
- **WHEN** a live scan for `django/django` seals with `snapshot.scanned_commit = abc1234567890`
- **THEN** the header subtitle under the repo title shows `commit abc1234` as a link to `https://github.com/django/django/commit/abc1234567890` and no `schema` or `share: /live?repo=` text is present

#### Scenario: Unknown commit renders plain
- **WHEN** `snapshot.scanned_commit` is `unknown` or missing
- **THEN** the subtitle shows `commit unknown` with no link

#### Scenario: Header has no method/sample links
- **WHEN** any live state renders
- **THEN** the header right rail contains no links with text `see method` or `view sample`

#### Scenario: No schema/share line in any live state
- **WHEN** viewing scanning, sealed-not-revealed, revealed, or refused live states
- **THEN** no element contains the pattern `schema 1 ·` or `share: /live?repo=`

### Requirement: Collapsed kill-switch gates cockpit

The system SHALL render the kill-switch gates (G1–G8) as a collapsed cockpit by default: a single summary strip showing counts and status dots per gate status (`proven` / `needs-verification` / `not-proven`) plus a peek of any `proven` gate(s), with full 8-row detail expandable on user click. The summary SHALL be one line on desktop and wrap to two lines on narrow viewports. `proven` gates SHALL be visually prominent even when collapsed (red dot + gate id + short note inline). Expanding SHALL reveal the full table (id, name, note, source_rows, status) without navigating or re-fetching; collapsing SHALL return to the strip.

#### Scenario: Default collapsed with no proven gates
- **WHEN** a report has gates `0 proven · 5 needs-verification · 3 not-proven`
- **THEN** the cockpit renders as a single strip `0 proven · 5 needs verification · 3 clear` with colored dots (red / amber / dim) and a control labeled `Expand` (or `Show 8 gates`); the 8-row table is not in the layout and category scorecards are visible above the fold

#### Scenario: Proven gate is always surfaced
- **WHEN** a report has `1 proven` (e.g. G3 Runtime EOL) and 7 others
- **THEN** the collapsed strip still shows `1 proven · 4 needs verification · 3 clear` and additionally peeks `G3 Runtime EOL — past EOL: node@16` inline with a red dot; the detail table's `Proven` group is expanded by default when the user expands

#### Scenario: Expand and collapse
- **WHEN** user clicks `Expand` (or the summary strip) on a collapsed cockpit
- **THEN** the full gates table animates open, grouped by status (Proven → Needs verification → Not proven) or as a flat table, with each row showing `id`, `name`, `note`, `source_rows`, and status dot+label; clicking `Collapse` (or the strip again) returns to the summary strip and focus stays on the toggle

#### Scenario: Keyboard and screen-reader accessible
- **WHEN** user tabs to the cockpit toggle and presses Enter/Space
- **THEN** the table expands/collapses, `aria-expanded` toggles, and the toggle has an accessible name `Show kill-switch gates (8)` / `Hide kill-switch gates`; status dots have text alternatives (not color-only)

#### Scenario: Both report surfaces share the behavior
- **WHEN** report is rendered on `/report/sample` or on live `/live` after reveal
- **THEN** both use the same collapsed-by-default cockpit component; deep-linking or printing expands the table for print media

### Requirement: Gates summary counts are derived from report gates

The system SHALL derive the collapsed strip counts directly from `Report.gates[].status` (no hard-coded numbers); counts SHALL sum to 8 and SHALL update if gate predicates change. The short peek note for a `proven` gate SHALL be the gate's `note` field truncated to one line.

#### Scenario: Counts match gates array
- **WHEN** `evaluateGates()` returns `[proven, proven, not-proven, needs-verification×5]`
- **THEN** the strip shows `2 proven · 5 needs verification · 1 clear` (or equivalent wording) and expanding shows 2 rows under Proven

### Requirement: CLI HTML and Markdown emitters
The system SHALL ship HTML and Markdown report emitters with the CLI that render from the sealed envelope with no network dependencies: inline CSS only, no CDN fonts or scripts, no external images. Both SHALL open with score plus band, then the top five risks in plain language, then detail, and SHALL end with the methodology link, the band-specific assessment call to action, and the positioning line (single-sourced from `packages/contracts`) as the final content. The tracked assessment URL SHALL appear exactly once in each artifact.

#### Scenario: HTML renders offline
- **WHEN** `./out/report.html` is opened with no network access
- **THEN** it renders fully styled with score and band first, top five risks in plain language, and no failed external requests

#### Scenario: Markdown pastes into a ticket
- **WHEN** `./out/report.md` is pasted into a PR or ticket
- **THEN** it reads complete in two minutes: score and band, top five risks, band CTA, methodology link, positioning line

#### Scenario: Positioning line closes both artifacts
- **WHEN** a sealed run writes `report.html` and `report.md`
- **THEN** each document's final content block is the positioning line rendered from the shared constant, and the tracked assessment URL appears exactly once in the document

### Requirement: Band-specific next step
The system SHALL render a result-specific next step, never a generic banner: High or Critical directs to booking a $0 Assessment as significant modernisation risk; Moderate names the concentrated areas and what the assessment clarifies; Low advises keeping the scan in CI with the assessment link present but softer. The same sentence SHALL print once on CLI stdout, appended to the single stdout line after the status fields (score/band, gates, coverage, threshold state when `--fail-under` is set), with the tracked assessment URL as the line's final token and appearing exactly once in stdout. The assessment link SHALL carry a campaign parameter (`utm_campaign=cli-scan-v1` plus the sealed band) for click-through measurement; clicking is the only telemetry.

#### Scenario: Critical band CTA
- **WHEN** a report seals at score 20 (Critical)
- **THEN** HTML, Markdown, and stdout all carry the High/Critical booking line with the tracked assessment URL

#### Scenario: Low band CTA stays soft
- **WHEN** a report seals at score 85 (Low)
- **THEN** all three surfaces carry the keep-in-CI line with the assessment link present but de-emphasized

#### Scenario: Stdout sentence and URL land once
- **WHEN** any sealed run completes
- **THEN** stdout is a single line whose status fields keep their order, the band-specific sentence appears once after them, and the tracked URL is the final token appearing exactly once

### Requirement: Every deduction traces in all formats
The system SHALL surface per-deduction trace (file or dependency, rule, weight contribution) in JSON and in summarized form in HTML and Markdown, so no score appears without an auditable finding behind it.

#### Scenario: Top risk links to evidence
- **WHEN** the top risk is EOL Java 8 in three files
- **THEN** JSON holds the full `evidencePointers` and `provenance`, and HTML/Markdown name the files, the rule, and the weight contribution for that deduction
