## Context

See `proposal.md` — Why. Constraints that shape the approach:

- The site is a static export; every rubric route must resolve to a document at build time (`static-hosting`).
- `openspec/specs/derived-rubric-views/spec.md` already owns the rule that derived rubric views are written only by `tooling/scripts/compile-rubric.ts` and are byte-checked by `npm run check:rubric-consistency`.
- `apps/site/lib/parse-rubric.ts` reads `docs/rubric/**` with `fs` at build time from a module in the served graph. The `from "fs"` form slips past `tooling/checks/site-boundary.ts`, which only matches `from "node:fs"` — an accidental pass, not a declared exemption.
- `apps/site/lib/generated/rubric.ts` already carries identity and the remediation trio; it does not carry rollup, gates fed, the criteria, the flag rationale, statusing, or the fact schema.
- `apps/site/app/rubric/rubric-browser.tsx` is imported by nothing, logs to the console, and passes a controlled prop to an uncontrolled `Accordion`.
- The report surfaces already render an anchor per row (`id="row-<INDICATOR>"`) and import `INDICATOR_REGISTRY`.
- Detectors are one file per indicator under `apps/scanner/src/scan/detectors/` (31 files); `local.ts` names the 25 that run without the GitHub API. The site boundary permits build tooling under `apps/site/scripts/` to read that tree; the served graph may not.
- Committed sample rows are the only evidence available to the site, and they are all illustrative.

## Goals / Non-Goals

**Goals:**
- One derivation path for every rubric string the site renders: compiler → generated registry → page. No build-time markdown parse in the served graph.
- Two navigation depths for any indicator, and a citable URL per indicator.
- Per-row truth about what the current release can and cannot grade, without conflating the rubric's declared measurement mode with shipped detector coverage.

**Non-Goals:**
- A gates page. The rubric shows which gates an indicator feeds and links `/method`'s existing gate roster; it does not restate a gate trigger.
- Search over report facts or sample evidence. Search is a registry index over ID, name, and category.
- Persisting filter state in the URL. Static hosting forbids request-time query handling outside the assessment page.
- Any scanner, contract, or scoring change.

## Decisions

**D1 — Route shape: `/rubric/[categoryId]/[indicatorId]`, uppercase ID.** Example: `/rubric/02/ARCH-02`.
Alternatives: a flat `/rubric/ARCH-02` collides with the existing `[categoryId]` segment at the same level (two different dynamic segment names at one level are a Next route conflict), and would force the category route to be renamed. A query parameter (`/rubric?indicator=…`) contradicts `static-hosting`'s browser-resolved-query rule beyond the assessment page. Uppercase keeps the path identical to the ID a report row prints, so a reader can cite either verbatim.

**D2 — The compiler emits everything the browser renders; `parse-rubric.ts` is retired.** The registry gains: identity (`v1`, `rollup`, `gates`), semantics (`definition`, `why`, `manifests`, `detection`, `yellow`, `red`, `yellow_rationale`, `red_rationale`, `criteria: {3,2,1,0}`, scope/overlaps), and contract detail (`applicability`, `statusing`, `score_mapping`, `fact_schema`, `budget_class`, `evidence`), plus `CATEGORY_CHARTERS` (`thesis`, `summary`) read from each category `README.md`.
Alternatives: keep the fs parse and declare an exemption (two parsers for one canonical tree, and the registry would still lack rollup/gates); extend `parse-rubric.ts` to read more sections (same two-parser problem, in the served graph). Rejected: one parser, and byte-equality already guards it.
The criteria string is uniform across all 102 files (`3 = …; 2 = …; 1 = …; 0 = …`, optionally prefixed by a deep-dive parenthetical). The compiler splits it on the level markers and **fails** naming the indicator if it does not find exactly four levels — it never emits a one-paragraph blob. The same fail-closed rule applies to the flag rationale, which is the trailing `*(Rationale: …)*` clause.

**D3 — The client receives an index, not the catalog.** The `/rubric` search and filter component takes a generated array of `{ id, name, category, tier, status, gates, effort }` (roughly 8 KB for 102 rows). Full prose stays in server components. No page imports the prose registry into a `"use client"` module.
Alternative rejected: making the whole browser a client component — it ships ~200 KB of prose and duplicates what the static pages already render.

**D4 — Two coverage facts, never merged.**
- *Rubric default status* (`measured` / `estimated` / `unknown`) is the indicator's declared measurement mode — a property of the rubric, and not evidence that a detector ships (`SEC-04` is default `unknown` *and* implemented).
- *Release coverage* is derived from the shipped detector tree (`31 of 102` today).
The rubric row shows the default status as a neutral chip; the page-level strip shows the release count; the indicator document shows an `implemented in this release` / `not implemented` marker from the generated manifest, and an unimplemented indicator never renders a score, a verdict, or a measurement claim.
Alternative rejected: deriving "implemented" from `default_status` — factually wrong for the unknown-by-contract rows.

**D5 — Coverage is asserted, not hand-typed.** A `prebuild` script (`apps/site/scripts/build-coverage-manifest.ts`) lists `apps/scanner/src/scan/detectors/*.ts`, maps `arch01` → `ARCH-01`, and writes `lib/generated/coverage.ts` with the indicator ID set and the engine version read from `apps/scanner/package.json`. It fails loudly when the directory is absent or yields zero rows. A single `coverageClaim()` helper composes the public sentence (`version`, `date`, `count/102`), and the build **fails when the hand-maintained claim version disagrees with the manifest's engine version** — so a release that forgets the copy is caught instead of drifting silently.
Alternatives: hand-maintained constant (this is how the same sentence already exists in two pages and can drift); promoting the count into `@leapscore/contracts` (producer-owned release metadata; deferred, not needed for this change).
The rubric page states the union count only; the local/remote split needs per-detector plane metadata that lives in `local.ts`, and the union is the honest claim for a browser that does not scan.

**D6 — Sample evidence comes from a generated row index.** `build-samples-manifest.ts` additionally emits `SAMPLE_ROW_INDEX: Record<indicatorId, Array<{ slug, anchor }>>` from the committed envelopes. The indicator document links the first entry; with none, it omits the link. No request-time read, no fs in the served graph.
Alternative rejected: scanning `lib/samples/*.json` from the page — fs in the served graph, and the committed sample set is already validated into a manifest.

**D7 — Category pages are server-rendered tables; only the index filters are client-side.** A category page is a real table (or a list of visually-tabular anchors) so every row exists in the no-JS document. The index page keeps a small client island for search/filter and renders the unfiltered category table in HTML as its initial state.
This removes the accordion from the reading path entirely: rows are links, not disclosure controls.

**D8 — One link helper owns rubric URLs.** `apps/site/lib/rubric-links.ts` exports `indicatorHref(id)` and `categoryHref(code)`, deriving the `NN` prefix from `CATEGORY_ORDER`. Report surfaces, rubric pages, and tests import it; no component types a `/rubric/...` path. Internal links use `next/link` so the base path applies.

**D9 — Color stays band-only.** The category page's `amber-50` / `red-50` cards are replaced with neutral panels and the hairline vocabulary; the yellow/red flag pair is distinguished typographically (label + weight), not by a hue that collides with the band palette. Criteria levels are neutral, numbered `3→0`.

## Risks / Trade-offs

- [Registry growth] The generated registry grows from identity + remediation to the full prose contract (a few hundred KB of source, ~15 KB per rendered document) → Mitigation: prose stays in server output; the client island receives the index only; a test asserts the search payload stays id/name/classification-sized.
- [Fragile extraction] Splitting the criteria and rationale with regex over 102 authored files → Mitigation: fail closed with the indicator ID and field named; a test asserts 4 levels for every registry entry and a non-empty rationale for every flag.
- [Site/scanner coupling] The coverage manifest reads the scanner tree → Mitigation: build tooling only, an explicit exemption in `site-boundary`, and a loud failure when the tree is missing (the monorepo build always has it).
- [Route case sensitivity] GitHub Pages serves paths case-sensitively; `/rubric/02/arch-02` 404s → Mitigation: every link goes through `indicatorHref`, uppercase IDs come from the registry, and the not-found document is the failure mode.
- [Build time and page count] 102 additional documents → Mitigation: they are static, content-only pages; the existing export assertions already reject an error document per route.
- [Two-source claim] The release sentence needs a human date → Mitigation: version is asserted against the manifest; the date is the one hand-maintained token, and the claim module is its only home.
- [Accordion removal regresses deep content] A very long indicator document is harder to skim as a flat page → Mitigation: anchored section headings plus a small in-page contents rail; no disclosure required to read.

## Migration Plan

Additive, in this order: compiler fields → regenerated registry → coverage and sample indices → new index, category, and indicator routes → report-row links → delete `rubric-browser.tsx` and `parse-rubric.ts` → close the `site-boundary` exemption gap. Nothing is persisted and no deployment input changes; rollback is reverting the commit and regenerating.

## Open Questions

None that change the specs, the approach, or the task breakdown. Gate display depth (column + link to `/method`) is settled as a non-goal above.
