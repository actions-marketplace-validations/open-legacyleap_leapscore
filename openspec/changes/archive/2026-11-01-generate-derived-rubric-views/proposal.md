## Why

The rubric's derived views are hand-maintained copies of canonical values, and only one of them is checked. `docs/rubric/00_EXECUTIVE_RUBRIC.md` Part 2 is a 102-row table restating every indicator's Yellow and Red flag; `compile-rubric.ts:338–343` verifies exactly one thing about that file — that the G1–G8 roster matches. Everything else in Part 2 can drift from the catalog indefinitely, and it already has: `ECOS-01`'s canonical Yellow flag is "Active version within 6 months of EOL, **or on EOL but with a funded, resourced upgrade path already started**", while the sheet says only "Active version within 6 mo of EOL". The second clause is gone, and no gate noticed.

The same duplication repeats for every number the catalog owns: the rollup formula appears in four files (`11`, `00`, both templates), the tier table in three (`11`, `00`, `SYSTEM_SCORE_SHEET`), the category weights in three (`11`, `00`, `SERVICE_SCORE_SHEET`). `11_WEIGHTS_THRESHOLDS_CONFIG.md` is declared canonical for all of them, and only the gate roster is actually verified against it.

The gate rules are worse than duplicated — they are circular. `11` opens by declaring that "every weight, tier threshold, and gate rule in the rubric is defined *here*", yet its §3 says "see `00_EXECUTIVE_RUBRIC.md` Part 0" for the gates, and `00` is labelled a derived view. The G1–G8 trigger text and source indicators exist only in the derived file, while the compiled `rubric.json` carries just the eight IDs (`compile-rubric.ts:206`).

The source data needed to generate these views is already uniform enough to be total: all 102 canonical files carry exactly one `- **Yellow flag (warning):**` and one `- **Red flag (critical):**` bullet, and there are zero reduced-form rows, so no file lacks §2. Each indicator's §1 `Gates fed` row already names the gates it feeds.

## What Changes

- **Gate rules move to their declared home** — the G1–G8 trigger table (gate, red-flag trigger, source indicator) moves from `00_EXECUTIVE_RUBRIC.md` Part 0 into `11_WEIGHTS_THRESHOLDS_CONFIG.md` §3, which already declares itself canonical for gate rules; `11` §3 stops pointing at the derived file, and `00` stops carrying the roster.
- **A generated score sheet** — new `docs/rubric/00_SCORE_SHEET.md` carries the three things that are currently hand-copied: the G1–G8 gate roster with source indicators, the 102-row Yellow/Red table grouped by category with base and FE-active weights, and the band/tier table. The compiler writes it; it is never edited by hand.
- **The criteria are echoed, not compressed** — the generator parses each canonical §2 Yellow and Red bullet, strips only the trailing `*(Rationale: …)*` aside, and emits the rest verbatim. No paraphrase, no truncation: wider cells are the correct outcome, because the current compression is what lost the clause.
- **Generated score-sheet templates** — `templates/SERVICE_SCORE_SHEET.md` and `templates/SYSTEM_SCORE_SHEET.md` keep their blank-cell structure but derive row lists, names, weights, deep-dive splits, and the gate checklist from the canonical sources.
- **The authored guide keeps only what is authored** — `00_EXECUTIVE_RUBRIC.md` retains Part 1 (the 0–3 scoring guide and core-path taxonomy), Part 3a–3c (rollup mechanics), and Part 4 (audit planning) — the material that exists nowhere else — and links the generated sheet and `11` for the roster, the flags, the weights, the formula, and the bands.
- **The gate becomes byte-equality** — `compile-rubric --check` (wired as `check:rubric-consistency`) compares all three generated documents against freshly generated output, the same way `rubric.ts` is already checked, and fails on a duplicated derived value left in the authored guide. **BREAKING** for anyone editing those documents by hand; the generator is the only writer.
- **The generated set is declared** — `docs/rubric/README.md`, `AGENTS.md`, and `CONTRIBUTING.md` list the generated artifacts alongside `rubric.json` and `rubric.ts`, so the "never hand-edit" rule names every file it applies to.

Non-goals:

- **No change to `rubric.json` or the shipped bundle** — the flags are parsed inside the compiler and written to documentation only. Adding 102 × 2 flag strings to the registry would grow the inlined bundle (`dist/leapscore-scan.mjs`, 510 KB) for data no runtime consumer reads.
- **No indicator semantics change** — the sheet echoes §2; it does not re-author it.
- **No scoring, weight, threshold, gate-identity, or band change**, and no `rubricVersion` bump. Gate *text* moves; the gates themselves do not.
- **No site change** — `apps/site/lib/generated/rubric.ts` keeps its current shape.
- **No reconciliation of the 54 historical rulings** — that is the follow-up change carried by `retire-redirect-docs`.

## Capabilities

### New Capabilities

- `derived-rubric-views`: the contract for rubric documents that restate canonical values — which documents are generated, what each must contain, that generated output is byte-identical to a fresh compile, that a hand edit fails the gate, that the authored guide carries no duplicated derived value, and that the canonical sources remain `indicators/**` plus `11_WEIGHTS_THRESHOLDS_CONFIG.md`.

### Modified Capabilities

None. `check:rubric-consistency` already exists as a gate; this change widens what it compares, which is conformance to the existing cardinal rule rather than a new requirement on scoring behaviour.

## Impact

- **Compiler**: `tooling/scripts/compile-rubric.ts` gains §2 flag extraction, the `11` §3 gate-table reader, three document emitters, and the `--check` comparisons; the existing `00` gate-roster check is replaced by the `11` table check.
- **Canonical configuration**: `docs/rubric/11_WEIGHTS_THRESHOLDS_CONFIG.md` §3 gains the G1–G8 trigger table and loses the pointer to `00`; its header claim becomes true.
- **Docs**: `docs/rubric/00_EXECUTIVE_RUBRIC.md` (trimmed to authored material), new `docs/rubric/00_SCORE_SHEET.md`, `docs/rubric/templates/*` (now generated), `docs/rubric/README.md`, `AGENTS.md`, `CONTRIBUTING.md`.
- **Not affected**: `rubric.json`, `rubric.ts`, the shipped bundle, the site, the scanner runtime, detector schemas, category indexes, and the 102 indicator files.
- **Coordination**: touches `docs/rubric/README.md`, which `retire-redirect-docs` also rewrites — apply after it, or rebase the one section.
