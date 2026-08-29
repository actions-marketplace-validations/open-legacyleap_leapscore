## Why

Live reports (`/live`) currently render `[object Object]` for DOCS-03/04/08 (and all tranche-A) evidence facts, repeat the indicator ID twice (`DOCS-08 measured via changelog-inventory` under a `DOCS-08` header + `detected via changelog-inventory`), and show a generic reason that carries no human-readable scoring rationale. The screenshot in the report is the direct symptom: `docs08: [object Object]`. This erodes trust in the scorecard — the scorer's §8 evidence strings and per-indicator §5 predicates are not surfaced.

## What Changes

- **BREAKING (contract fix):** `packages/engine/scorer/mvp.ts` (and `phase1.ts` for GH-API rows) stops emitting nested `facts: { docs08: {...} }` inside `evidence.facts` and generic `reason: "${id} measured via ${tool}"` with hardcoded `score: 2`. Instead emits flattened `evidence.facts` primitives and a per-indicator human sentence derived from facts + score predicate + encyclopedia rationale.
- Modify `apps/site/components/category-section.tsx:51-60` defensive rendering: handle both flat and (legacy) nested facts without ever calling `String(object)` — use `JSON.stringify` / structured rendering for object values and hide empty-object chips.
- Remove duplicate indicator-code prefix from `reason` and from the subtitle (`DOCS-08 measured via ...`); `reason` becomes ID-free narrative, header already carries the ID. Keep `detected via <tool>` as muted meta once.
- Apply evidence-string templates from `docs/specs/09_DOCS_KNOWLEDGE/docs-03:§8`, `docs-04:§8`, `docs-08:§8` (and sibling tranche-A specs) as the canonical shape for `evidence.facts` display.

## Capabilities

### New Capabilities

- none — this is a correctness fix to existing report rendering/scoring surfaces.

### Modified Capabilities

- `report-rendering`: Human-readable `reason` (ID-free), flattened `evidence.facts` rendering without `[object Object]`, de-duplicated header/evidence display. Adds REQUIREMENT: `evidence.facts` SHALL be flat primitives at the UI boundary and the renderer SHALL never stringify an object as `[object Object]`.
- `scan-phase-2`: Adds REQUIREMENT: tranche-A `factsToRows` / `mvp.ts` SHALL produce per-indicator scored reasons and flattened evidence (not generic `measured via` stubs), implementing each indicator's spec §5 predicate and §8 evidence string.

## Impact

- Affected code: `packages/engine/scorer/mvp.ts`, `packages/engine/scorer/phase1.ts`, `packages/engine/detectors/docs03.ts` / `docs04.ts` / `docs08.ts` (fact shape unchanged, scorer mapping changes), `apps/site/components/category-section.tsx`, `apps/site/lib/types.ts` (evidence comment), `apps/site/lib/provider.live.ts` passthrough.
- Affected specs: `openspec/specs/report-rendering/spec.md`, `openspec/specs/scan-phase-2/spec.md`.
- No new dependencies, no API route changes, no data-model migration beyond shape normalization (nested → flat is handled both ways in the renderer for backwards compatibility).
- Risk: screenshot regression if scorer still nests — mitigated by renderer defense.
