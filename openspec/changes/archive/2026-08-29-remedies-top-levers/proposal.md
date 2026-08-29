## Why

The LeapScore report scores 102 indicators but only 9 rows in the hand-authored sample carry actionable remediation — `quick_win / structural / gold_standard`. Every encyclopedia entry already has canonical **Remediation playbook** + **Gold standard** text, and the UI (`category-section.tsx:RowDetail`) already renders `IndicatorRow.remediation`, yet the pipeline (`compile-rubric -> rubric.json -> scorer -> Report`) drops it. Users see *what is wrong* and *how many points it costs* (Top restore levers) but not *what to do next* on 93 rows. Making remediation complete on all measured/estimated rows turns the scorecard from a diagnostic into a prioritized modernization backlog.

## What Changes

- **Harvest encyclopedia remediation into the compiled registry.** `tooling/scripts/compile-rubric.ts` parses `**Remediation playbook:**` (splitting `Quick win:` / `Structural fix:`) and `**Gold standard / target state:**` from each `docs/rubric/0*.md` entry, adding `remediation:{quick_win, structural, gold_standard}` + `effort` to `packages/engine/rubric.json` and `apps/site/lib/generated/rubric.ts`. On ambiguous/missing markers it falls back to putting the whole playbook in `quick_win` and emits a `check:rubric-consistency` warning — no 84-file rubric rewrite required for v1.
- **Attach remediation to every measured/estimated row.** `packages/engine/scorer/mvp.ts` (tranche + MVP) and `phase1.ts` look up the registry entry for each scored row and set `IndicatorRow.remediation` verbatim. `estimated` rows (clamped 1-2, low/medium confidence) also carry it; `unknown` rows keep `unknown_measure_path` and optionally surface "would-be" remediation as a hint.
- **Enrich Top restore levers.** `apps/site/components/blockers.tsx:TopBlockers` renders each lever with `+weight_pp` + `effort` pill + one-line `quick_win` excerpt, linking to the full row anchor. Sorting stays by recoverable headline points (category weight × points lost). A filter `⚡ quick wins only` is optional if trivial.
- **Regenerate sample + live path.** `apps/site/lib/sample.ts` and `apps/site/lib/provider.live.ts` stop hand-authoring remediation; they derive it from the registry like `name`/`effort` already do. `npm run compile:rubric && npm run check:rubric-consistency` gates drift.
- **No score-tiered variants in v1.** One canonical playbook per indicator; scorer does not invent `0→1` vs `1→3` branches. A later change can expand the encyclopedia to explicit tiered fields if needed.

## Capabilities

### New Capabilities
- *(none)*

### Modified Capabilities
- `report-rendering`: row display now requires rubric-derived remediation on every measured/estimated indicator and lever cards that surface remediation + effort + recoverable points.

## Impact

- **Code:** `tooling/scripts/compile-rubric.ts`, `packages/engine/rubric.json`, `apps/site/lib/generated/rubric.ts`, `packages/engine/scorer/{mvp.ts,phase1.ts,rollup.ts}`, `apps/site/lib/{sample.ts,provider.live.ts}`, `apps/site/components/{category-section.tsx,blockers.tsx}`, `apps/site/lib/types.ts` (no type change, but now populated).
- **Data contract:** `IndicatorRow.remediation` becomes expected on `measured|estimated` rows (was optional/rare); `rubric.json` gains `indicators[].remediation` object. No breaking API — UI already handles absence.
- **Dependencies:** none new. Consistency check widens to cover remediation drift.
- **Risk:** Parser must handle the free-form playbook prose robustly; mitigated by fallback + warning rather than hard failure.
