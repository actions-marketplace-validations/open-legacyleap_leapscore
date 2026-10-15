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

