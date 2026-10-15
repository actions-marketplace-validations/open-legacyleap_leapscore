## 1. Gates cockpit — collapsed summary

- [x] 1.1 Refactor `apps/site/components/gates-table.tsx:22` to collapsed-by-default cockpit (summary strip with counts + dots + proven peek, `Collapsible` toggle to grouped detail) and verify at `xs`/`lg` the strip is one line and category scorecards sit above the fold when collapsed
- [x] 1.2 Wire grouping `Proven → Needs verification → Not proven` with `Proven` default-open when `n>0`, full row fields (`id`, `name`, `note`, `source_rows`, status dot+label), and verify `2 proven · 5 needs verification · 1 clear` derives from `Gate[]` and detail shows 2 rows under Proven
- [x] 1.3 Add keyboard/ARIA (`aria-expanded`, focus on toggle, Enter/Space, dot text alternative, `prefers-reduced-motion` + print expands) and verify tab → Enter toggles and axe has no violations
- [x] 1.4 Share same cockpit on `/report/sample` and `/live` after reveal and verify both surfaces collapse identically and no separate gates component is forked

## 2. Scan timeline — live narrative

- [x] 2.1 Replace static box at `apps/site/app/live/LiveReportClient.tsx:224-227` with append-only timeline state (`{t, label}[]`) fed by `progress` frames (`completedIds` delta + optional `milestone`) and verify milestones stream (ingest → GH fetch → clone → detectors → scoring) without re-rendering prior rows
- [x] 2.2 Emit optional `milestone` strings from `apps/site/app/api/scan/route.ts` / `packages/engine/orchestrator.ts:46-168` at ingest, after GH batch, at clone start/complete, before `done`, and verify `progress` frames carry `milestone` and old clients ignoring it still show correct pct/elapsed/remaining
- [x] 2.3 Verify timeline at minimum covers ingest/normalize, GH fetch, GH detectors batch, clone (when requested), clone detectors batch, scoring/gate evaluation, seal with `complete`/`degraded · 14/19 measured`; and that `sealed` terminal entry and CTA wording for `degraded` (`Reveal partial report — 14/19 measured`) are correct

## 3. Reveal transition — sealed → revealed

- [x] 3.1 Introduce `sealed` → `revealed` state (`showReport` boolean) in `LiveReportClient.tsx:118-152`; at seal freeze timeline, show `Report ready — Reveal report` CTA anchored below timeline, and verify no hard DOM swap occurs (timeline stays mounted)
- [x] 3.2 On click animate report in (fade + slide, `prefers-reduced-motion` fallback) and collapse timeline to `Show scan log (n steps)` link that re-expands via `Collapsible`; verify scroll position stable, sticky bar stays fixed, and report (dial + coverage + gates cockpit + category tables) is fully rendered after click
- [x] 3.3 Add background-tab auto-reveal fallback (if `document.hidden` at seal, auto-flip `showReport` after 2–3s) and verify returning to a sealed background tab shows the report without extra click while foreground tabs stay manual

## 4. Verification

- [x] 4.1 Verify `/live?repo=vercel/next.js` full flow: bar + timeline streaming → `Reveal report` → click → report with collapsed gates above fold → `Show scan log` re-expands timeline; `/report/sample` unchanged except gates cockpit
- [x] 4.2 Verify `snapshot_refused` / `rate-limited` still surface as actionable messages with no progress bar, timeline, or reveal button
- [x] 4.3 Run `npm run check:rubric-consistency` (if present) and no-op scorer check that gate predicates/weights unchanged, plus manual axe/hydration smoke
