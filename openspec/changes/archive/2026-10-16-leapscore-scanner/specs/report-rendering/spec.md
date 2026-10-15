## MODIFIED Requirements

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
