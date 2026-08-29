## Context

See `proposal.md — Why`. Current state: every encyclopedia entry in `docs/rubric/01_...10_...` carries **Remediation playbook** + **Gold standard** + `Verify effort`, but `tooling/scripts/compile-rubric.ts` only extracts `id/name/tier/default_status/effort` into `packages/engine/rubric.json` and `apps/site/lib/generated/rubric.ts`. The scorer (`packages/engine/scorer/mvp.ts`, `phase1.ts`) builds `IndicatorRow.reason` from facts but sets `remediation` only when hand-authored in the sample fixture, so live reports show none. The UI already handles it (`apps/site/components/category-section.tsx:RowDetail`, `apps/site/components/blockers.tsx:TopBlockers`). The derived view (`00_EXECUTIVE_RUBRIC.md`, `rollup`'s `weight_pp`) is already weight-aware — the levers know their points.

Constraint: rubric is canonical per `AGENTS.md` — no number/text restated elsewhere; encyclopedia thresholds referenced by ID. We must not duplicate remediation as hardcoded scorer strings.

## Goals / Non-Goals

**Goals:**
- Make `IndicatorRow.remediation` present on every `measured`/`estimated` row where the encyclopedia has it (102 entries, ~84 applicable per repo), derived from the single rubric source.
- Make Top restore levers actionable: each of the 5 levers shows `+weight_pp`, `effort` pill, and a one-line `quick_win` excerpt linking to its row.
- Keep `unknown` rows on `unknown_measure_path` (no score); optionally append "when measured, remediation would be: <quick_win>" as a hint.
- Gate drift via `npm run check:rubric-consistency`.

**Non-Goals:**
- Score-tiered remediation variants (`0→1` vs `1→3` branches) — deferred; v1 is one canonical playbook per indicator.
- A new `/remedies` page or PDF export — levers + per-row expansion suffice for v1.
- Rewriting 84 encyclopedia files to explicit `quick_win / structural / gold_standard` fields — handled as a follow-up if the parser's fallback rate is >5%.

## Decisions

### D1 — Parse, don't re-author, the encyclopedia for remediation

**Choice:** Extend `compile-rubric.ts:parseIndicators()` to also capture `remediation` from the free-form bullet lines:
- `Remediation playbook:` → split on `Quick win:` / `Structural fix:` (case-insensitive, punctuation-tolerant). If both markers present, text before structural → `quick_win`, after → `structural`; else whole playbook → `quick_win` with `structural = ""` and a warning.
- `Gold standard / target state:` → `gold_standard` (strip leading dash/bold).
- `Verify effort:` → already parsed; reuse as `remediation.effort` fallback.

Payload becomes `indicators[]:{..., remediation:{quick_win, structural, gold_standard, effort}}`. Generated TS mirrors it.

**Alternatives considered:**
- (a) Add YAML frontmatter / explicit fields to 84 encyclopedia files — cleaner long-term but large churn and blocks v1 on editorial work.
- (b) Hardcode remediation in `scorer/mvp.ts` as 102 `reason`-like functions — violates canonical rule, creates drift, doubles maintenance.

**Why this:** Zero rubric churn, single source, parser warning makes future migration incremental.

### D2 — Scorer is a pass-through, not a second author

`mvp.ts`/`phase1.ts` look up `RUBRIC_REGISTRY[id].remediation` (from compiled `rubric.json`) and assign `row.remediation` verbatim for `status ∈ {measured, estimated}`. No score branching. `estimated` rows stay clamped 1–2; their remediation still applies (inference, not fact). `unknown` rows get no `remediation` (they have `unknown_measure_path`).

**Alternative:** scorer invents tiered variants — rejected for v1 because it would be non-canonical copy.

### D3 — Top levers enrichment is presentation-only

`TopBlockers` currently renders `{row, name, weight_pp, summary}`. v1 adds `{effort, remediation.quick_win}` looked up from the same registry (or from the row's own `remediation` when present). No change to `rollup.ts` sorting (still `weight_pp desc, points_lost desc`). Link each lever `<li>` to `#row-{ID}` anchor on `category-section` row.

No new computation of "cost per point" — out of scope.

### D4 — Sample + live derive, never hand-author

`apps/site/lib/sample.ts` and `apps/site/lib/provider.live.ts` import `INDICATOR_REGISTRY` / `rubric.json` for `remediation` the same way they already do for `name`/`effort`. Removes the 9 hand-typed `remediation` objects from the fixture; sample regenerates via `npm run compile:rubric`-adjacent script or a one-off regen.

## Risks / Trade-offs

- [Free-form prose is brittle] → Mitigation: tolerant regex (`/Quick\s*win\s*:\s*/i`, `/Structural\s*fix\s*:\s*/i`, `/Gold\s*standard/i`), normalized dash/emdash, length guard (>10 chars), fallback to whole-playbook-as-`quick_win` + `console.warn` + `check:rubric-consistency` warning count. Future lint can flag >5% fallback rate to trigger the explicit-field migration.
- [Remediation length varies (1–3 sentences) → lever card overflow] → Truncate `quick_win` to 110 chars + "…" with full text on row expand; no layout break.
- [Increasing `rubric.json` size (~84 × 3 strings)] → Negligible (<50 KB); gzipped trivial.
- [Estimated rows show remediation for inferred findings] → Accepted per proposal Q4; add `estimated` badge next to remediation header so user knows it's advice on a heuristic, not a fact.

## Migration Plan

1. Land parser + registry + scorer passthrough behind no flag — additive only; rows that had no `remediation` now gain it, old rows unchanged. No rollback risk (UI already handles absence).
2. Run `npm run compile:rubric` → commit `rubric.json` + `generated/rubric.ts` + regenerated `sample.json` in same change.
3. `npm run check:rubric-consistency` must pass (also checks new `remediation` presence warning threshold).
4. If parser fallback rate >5% on CI, file follow-up to add explicit fields to those encyclopedia entries.

## Open Questions

- None blocking. Deferred: tiered remediation fields and a dedicated `/remedies` printable view — both require rubric editorial decisions that don't affect this change's task breakdown.
