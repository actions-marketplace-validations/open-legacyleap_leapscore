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

