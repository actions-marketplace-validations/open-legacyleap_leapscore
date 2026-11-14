## Why

The rubric is the product — "not a black box" is the site's whole positioning — but `/rubric` is the least-built surface on it. The lobby renders a sidebar and one sentence, the category pages render ten to twelve collapsed accordions, no indicator is linkable, the search component that was written for it never mounted, and the one page that could show what the scanner can and cannot grade shows a tier letter and a paragraph. A reader can leave a sample report with a graded row they cannot trace to a definition, and can read a definition with no path back to evidence.

## What Changes

- `/rubric` becomes a real index: one row per category with its weight, indicator count, tier mix, and default-status mix, plus client-side search across all 102 indicators and filters for engine tier, default status, and gate participation.
- `/rubric/[categoryId]` becomes a scannable table instead of a stack of closed accordions: every row shows ID, name, tier, default status, verify effort, gates, and rollup; each row links to its own page.
- New `/rubric/[categoryId]/[indicatorId]` deep-link page renders one indicator's full contract: the four 0–3 criteria as a ladder, the flag pair with rationale, the remediation trio (quick win / structural / gold standard), and the statusing, budget, and fact-schema sections. Stable, citable URLs.
- The rubric surface states coverage in the same vocabulary the report uses (`measured` / `estimated` / `unknown` / `not implemented`), including the versioned detector count, so the rubric page owns the coverage claim instead of `/method` alone.
- Report rows link to their rubric entry, and a rubric entry links to a committed sample row that exercised it, when one exists.
- The palette violation on the category page (`amber-50` / `red-50` cards on a dark instrument panel) is removed; color stays reserved for band tiers.
- The dead `rubric-browser.tsx` component (never imported, `console.log`, controlled prop on an uncontrolled accordion) is deleted rather than revived as-is.

Non-goals: no scan execution, no visitor-supplied repository, no new derived rubric documents of the sheet kind, no change to indicator semantics, weights, bands, or gates, and no arithmetic re-derived in a component.

## Capabilities

### New Capabilities

- `rubric-browser`: the `/rubric` index, the category table, the per-indicator route, search and filtering, the coverage disclosure on the rubric surface, and the two-way link contract between a report row and a rubric entry.

### Modified Capabilities

- `derived-rubric-views`: adds a requirement that the compiled site registry carries every field the browser renders — including rollup classification, gates fed, the 0–3 criteria, the flag rationale, and the remediation trio — so the served graph parses no markdown at build time and the compiler remains the only writer.

## Impact

- `apps/site/app/rubric/page.tsx`, `apps/site/app/rubric/[categoryId]/page.tsx`, new `apps/site/app/rubric/[categoryId]/[indicatorId]/page.tsx`.
- `apps/site/app/rubric/rubric-sidebar.tsx` (kept or replaced), `apps/site/app/rubric/rubric-browser.tsx` (deleted).
- `apps/site/lib/parse-rubric.ts` (retired or narrowed to charter prose), `apps/site/lib/generated/rubric.ts` (regenerated with the browser's fields — never hand-edited).
- `tooling/scripts/compile-rubric.ts` — emits the additional registry fields; `npm run check:rubric-consistency` remains the byte-equality gate.
- `apps/site/components/report-view.tsx` / `category-section.tsx` / `blockers.tsx` — row → rubric links.
- `tooling/checks/site-boundary.ts` — the `from "fs"` loophole is closed so a build-time read is declared, not accidental.
- Tests: rubric routes (static params, rendering, search/filter behavior, link parity both directions), plus the existing claim-honesty and score-consistency suites.
- No scanner, Action, contract, or scan-behavior change.
