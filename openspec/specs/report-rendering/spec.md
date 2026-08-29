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
- **WHEN** `apps/site/lib/sample.ts` and `apps/site/lib/provider.live.ts` build `IndicatorRow`s
- **THEN** both import the same registry; a drift between them fails `npm run check:rubric-consistency`.

### Requirement: No ID-as-title fallback

The system SHALL treat a registry miss as an error condition, not a silent fallback. If an indicator ID has no registry entry, the row SHALL render `Unknown indicator (ID)` with a console warning and SHALL be flagged by `check:rubric-consistency`, rather than rendering the ID as the title.

#### Scenario: Unknown ID surfaces
- **WHEN** a detector emits `FOO-99` with no rubric entry and a report includes it
- **THEN** the row renders `Unknown indicator (FOO-99)` and the build-time consistency check fails, prompting a rubric or `compile:rubric` fix.

### Requirement: Full-table consolidation uses registry

The system SHALL build `full_table` (102 rows) and `deep_dive_scope` by iterating the registry's 102 IDs, marking requested-but-undone rows `unknown` with `unknown_measure_path` and FE rows `not_applicable` where the repo has no client. All placeholder rows SHALL carry the registry's `name` and `effort` (`⚡/🔶/🔷`).

#### Scenario: Live full-table placeholders carry correct metadata
- **WHEN** `provider.live.ts:buildFullTable()` constructs the 96 unknown placeholders for a 19-indicator scan
- **THEN** each placeholder has `name` and `effort` from the registry, and `unknown_measure_path` per the encyclopedia/delta spec, not hardcoded `⚡ ≤30 min`.

### Requirement: Human-readable row evidence and reasoning

The system SHALL render every `IndicatorRow` with a human-readable `reason` that is ID-free, score-aware, and explicitly includes the encyclopedia flag rationale for the scored band (e.g. Yellow/Red flag rationale from `docs/rubric/09_DOCS_KNOWLEDGE.md` and sibling category docs), so the user can trust why a score maps to that band. The detail SHALL show a single muted `detected via <tool>` meta line (no duplicate ID-subtitle), and `evidence.facts` rendered as a key:value table when `1–5` facts are present, falling back to compact pills when `>5` facts (overflow chips) — with either rendering never emitting `[object Object]`. When facts contain a nested detector-keyed object (legacy shape `{docs08: {...}}`), the renderer SHALL flatten or stringify without emitting `[object Object]`.

#### Scenario: DOCS-08 live row shows narrative with rationale and table
- **WHEN** a live scan measures `DOCS-08` as `score 0` with `changelog_present=false` and detector tool `changelog-inventory`
- **THEN** the Row header shows `DOCS-08` once (left mono column) and title `No Release Communication / Changelog`; the expanded detail shows `reason` as a human sentence that includes the encyclopedia Red-flag rationale (e.g. `No CHANGELOG.md found (checked 6 candidate paths); 0% of sampled releases carry notes — per DOCS-08 Red flag rationale: breaking changes ship unannounced, consumers learn from failures — score 0`) with no `DOCS-08` prefix, a single `detected via changelog-inventory` line, a `repo — no changelog` pointer, and a key:value table of flat facts (`changelog_present | false`, `with_notes_pct | 0`) — never `docs08: [object Object]` or a bare chip for a nested object.

#### Scenario: DOCS-03 live row shows runbook narrative with rationale
- **WHEN** `DOCS-03` is measured with `count=0` (no runbooks) via `runbook-inventory`
- **THEN** `reason` reads like `No runbooks found — searched docs/runbooks, runbooks, docs/ops etc.; per DOCS-03 Red-flag rationale: incidents recovered by heroics, every lesson repeated` and facts are shown as a key:value table (`count | 0`, `restore_doc_present | false`) — never `docs03: [object Object]`.

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

