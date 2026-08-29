## Context

Current state (see proposal.md — Why):
- `packages/engine/scorer/mvp.ts:36` produces tranche-A rows as `score: 2` (hardcoded), `reason: "${id} measured via ${tool}"` (generic, ID-prefixed), `evidence.facts: f.facts` (nested `{docs08: {...}}`).
- `apps/site/components/category-section.tsx:52-58` renders `String(v)` on nested values → `[object Object]`, and repeats ID/tool attribution.
- Spec §8 evidence strings exist but are not used. Sample fixture (`sample.ts`) is hand-written and hides the live bug.

Constraints: `docs/specs/09_DOCS_KNOWLEDGE/*:§3` (fact schemas are nested at detector boundary), `§5` (score predicates), `§8` (evidence strings) are normative. Fix must respect them: nesting is correct at the `FactRecord` layer, but flattened at the `IndicatorRow.evidence` UI boundary. Must stay compatible with already-emitted 6-indicator Phase-1 rows.

## Goals / Non-Goals

**Goals:**
- Live rows show human `reason` that explicitly cites the encyclopedia flag rationale for the scored band (per your call: trust via rationale) + flat facts rendered as a key:value table (1–5 facts) / pills (>5) + correct score per predicate.
- All tranche-A + Phase-1 indicators fixed at once (no deferred stubs).
- Renderer never emits `[object Object]` even on legacy nested input.
- No duplicate ID/tool lines.

**Non-Goals:**
- Changing detector fact schemas (§3) — they stay nested; flattening is scorer/UI boundary only.
- Full redesign of evidence UI (tables, tooltips) — small polish only; pills → stringified values.
- Backfilling all 102 rubric predicates — scope is tranche-A + Phase-1 GH rows; remaining 83 stay `unknown` placeholders.

## Decisions

**D1: Flatten in scorer, defend in renderer (both).**
- Why: scorer is source of truth — fixes API, future surfaces; renderer defense handles in-flight/legacy reports without coordination. Alternative — renderer-only fix — leaves API and persisted reports broken and keeps `score: 2` bug. Scorer-only leaves `[object Object]` on cached reports until scorer redeploys.
- Trade: small duplication of flatten logic.

**D2: Per-indicator reason builders, not a generic template.**
- Why: each predicate's encyclopedia rationale differs (e.g. DOCS-03 Red flag = heroics, DOCS-08 Red flag = surprise tax). A single `"measured via"` template can't carry that. Options considered: shared Mustache template, or LLM-generated reason. Rejected: template would still need per-indicator copy; LLM would be non-deterministic and slow.
- Shape: `reasonForDocs03(score, facts)`, `reasonForDocs08(...)` etc. — pure functions, tested via scorer unit tests, mirroring `scorer/phase1.ts:76 reasonFor`. Shared helper `flattenDocFacts(facts)` unwraps `docs03/docs08/docs04` key.

**D3: Score from predicates, not hardcoded 2.**
- Why: current `score: 2` masks real health. Use each spec §5 thresholds. For tranche-A without a bespoke predicate yet (e.g. PERF-02), fall back to presence/quality heuristic already in detector facts, still mapped to 0-3, with `estimated` clamp where spec says `estimated_when` (e.g. DOCS-08 when API unavailable).
- Alternative — keep `2` and defer scoring — rejected: users see wrong tier.

**D4: Table for few facts, pills for many — in `category-section.tsx`.**
- Patch `RowDetail` facts loop: `formatFactValue(v)` — primitives → `String(v)`, objects/arrays → `JSON.stringify(v)` with special-case for `{total_breaking, documented}` → `"k/t documented"`. Filter empty/null. If `Object.keys(facts).length <=5`, render as a compact `key | value` table (two-column, mono values, follows existing `instrument-panel` style); if `>5`, render as compact pills (existing pill style, with `title` hover holding full value, truncated at 80 chars). Remove `reason` ID prefix; keep single `detected via`. Reason builder always appends the encyclopedia rationale clause (e.g. `— per DOCS-03 Red flag: ...`).
- Alternative — always-table / always-pills — rejected: per your call, table reads better for DOCS-style 3-5 facts, pills scale better for ECOS/SEC rows with many keys.

## Risks / Trade-offs

- [Shard drift] Flattening loses detector namespace if two detectors wrote colliding flat keys (unlikely — trench-A keys are disjoint; `docs03.count` vs `docs08.count` live in separate rows). → Mitigation: flatten per-row only, not global merge.
- [Cached reports] Old reports with nested facts still render via renderer defense but scores/reasons stay stale until re-scan. → Mitigation: renderer path is back-compat; no migration needed.
- [Predicate churn] Implementing 12 predicates touches rubric sync. → Mitigation: each builder cites spec § reference; tests assert example cases from spec scenarios.
- [Over-formatting] `JSON.stringify` on large facts could overflow pill. → Mitigation: truncate at 80 chars, full JSON in `title` hover.

## Migration Plan

1. Land scorer fix behind no flag (behavior-correcting, not breaking API shape — still `IndicatorRow`).
2. Land renderer defense in same PR.
3. `npm run compile:rubric` already done — no new indicators.
4. Verify via `apps/site/lib` sample vs live parity test + manual `/live?repo=leapscore` smoke.
5. Rollback: revert single commit; no data migration.

## Open Questions

- None blocking. Decisions locked per user input: rationale is inlined in `reason` (not tooltip), table vs pills threshold is `5`, scope is all indicators at once.
