## 1. Baseline and catalog contract

- [x] 1.1 Inventory all 102 rubric IDs, all 102 implementation-spec files, category indexes, shared configuration, plan consumers, and generated artifacts; verify the inventory has exactly one source pair per ID and records every non-canonical path that must remain compatible.
- [x] 1.2 Capture a normalized baseline of `apps/scanner/src/scan/scoring/rubric.json`, `apps/site/lib/generated/rubric.ts`, and the committed Action registry; verify the baseline records indicator order, names, tiers, statuses, effort, remediation, weights, applicability, bands, and gates before source migration.
- [x] 1.3 Define the merged Markdown skeleton and field-mapping checklist in `docs/rubric/README.md`; verify every rubric field and every `docs/specs/README.md` §0–§9 field has exactly one destination and the full/reduced tier rules remain explicit.
- [x] 1.4 Define the canonical path/index/alias map for `docs/rubric/indicators/`, `docs/specs/`, and `docs/plans/`; verify the map identifies the replacement for every existing path and does not introduce a second editable source.

## 2. Build the unified indicator catalog

- [x] 2.1 Merge ECOS-01 through ECOS-10 into `docs/rubric/indicators/01_DEPENDENCY_ECOSYSTEM/` and convert the ECOS category page into an index; verify all ten IDs retain their rubric semantics, implementation contract sections, and links.
- [x] 2.2 Merge ARCH-01 through ARCH-12 into `docs/rubric/indicators/02_ARCHITECTURE_CODE/` and convert the ARCH category page into an index; verify all twelve IDs retain criteria, facts, predicates, and scope boundaries.
- [x] 2.3 Merge TEST-01 through TEST-10 into `docs/rubric/indicators/03_TESTING_QUALITY/` and convert the TEST category page into an index; verify all ten IDs retain status, budget, evidence, and reduced-form semantics.
- [x] 2.4 Merge SEC-01 through SEC-10 into `docs/rubric/indicators/04_SECURITY_COMPLIANCE/` and convert the SEC category page into an index; verify all ten IDs retain gate hooks, security-specific caveats, and scoring criteria.
- [x] 2.5 Merge DATA-01 through DATA-10 into `docs/rubric/indicators/05_DATA_SCHEMA/` and convert the DATA category page into an index; verify all ten IDs retain applicability, data-plane, and failure semantics.
- [x] 2.6 Merge API-01 through API-10 into `docs/rubric/indicators/06_API_INTEGRATION/` and convert the API category page into an index; verify all ten IDs retain endpoint/tool inputs, evidence grammar, and implementation limitations.
- [x] 2.7 Merge VEL-01 through VEL-12 into `docs/rubric/indicators/07_VELOCITY_OPERATIONAL/` and convert the VEL category page into an index; verify all twelve IDs retain estimated/unknown rules, effort, and gate relationships.
- [x] 2.8 Merge PERF-01 through PERF-10 into `docs/rubric/indicators/08_PERFORMANCE_CLOUD/` and convert the PERF category page into an index; verify all ten IDs retain plane applicability, budget classes, and remediation content.
- [x] 2.9 Merge DOCS-01 through DOCS-10 into `docs/rubric/indicators/09_DOCS_KNOWLEDGE/` and convert the DOCS category page into an index; verify all ten IDs retain documentation-specific detection, evidence, and score mappings.
- [x] 2.10 Merge FE-01 through FE-08 into `docs/rubric/indicators/10_FRONTEND_CLIENT/` and convert the FE category page into an index; verify all eight IDs retain conditional applicability and deep-dive behavior.
- [x] 2.11 Update the catalog landing page, category indexes, executive/derived navigation, and shared configuration links; verify the indexes enumerate exactly 102 unique IDs and every link targets a canonical unified file or an explicitly derived view.

## 3. Move tooling to the unified source

- [x] 3.1 Update `tooling/scripts/compile-rubric.ts` to enumerate `docs/rubric/indicators/<NN_CATEGORY>/*.md` in deterministic category/numeric order and parse the merged metadata/remediation fields; verify `npm run compile:rubric` emits the existing JSON/TypeScript shape with 102 indicators.
- [x] 3.2 Extend `npm run check:rubric-consistency` to validate one-to-one IDs, category membership, unified metadata, shared configuration, and derived outputs; verify it reports a useful failure for a missing, duplicate, or malformed indicator.
- [x] 3.3 Update `tooling/checks/schemas.ts`, detector documentation, and any schema/path assertions to resolve the unified indicator files while accepting only compatibility aliases under `docs/specs/`; verify the schema check still matches every detector schema to its indicator fact schema.
- [x] 3.4 Add and wire a documentation-structure check for the merged skeleton, alias-only legacy files, retired-plan stubs, local targets, and 102-ID coverage; verify the check fails on contract content in an alias and on an indicator missing a required section.

## 4. Add compatibility aliases and retire plans

- [x] 4.1 Replace `docs/specs/README.md` with the unified-catalog compatibility guide and replace each legacy per-indicator spec body with an ID/canonical-target/deprecation alias; verify no legacy spec contains an independent rubric or implementation contract.
- [x] 4.2 Replace the authored `docs/plans/` files with a retirement notice and path-level stubs that link to current OpenSpec, rubric, or documentation replacements; preserve only the minimum command examples required by existing checks and verify no plan body remains a maintained source.
- [x] 4.3 Update direct consumers in `AGENTS.md`, `CONTRIBUTING.md`, package/app READMEs, workflow/check documentation, and detector guidance to name the unified catalog; verify a repository search finds no unqualified instruction to edit the retired split sources.
- [x] 4.4 Update the explicit command-invocation site map and any documentation path checks to use the canonical/current locations while retaining old aliases; verify `npm run check:bin-wiring` still recognizes `leapscore-scan` and `surface` invocations.

## 5. Preserve derived artifacts and validate the migration

- [x] 5.1 Run `npm run compile:rubric` and compare normalized generated JSON/TypeScript against the baseline; verify indicator metadata, order, weights, applicability, tiers, gates, and remediation are unchanged except for intentional source comments.
- [x] 5.2 Rebuild or leave the committed Action bundle according to the existing parity workflow; verify `npm run check:dist` passes and no runtime bundle diff exists unless it is solely the expected source-path metadata.
- [x] 5.3 Validate all Markdown links, canonical/alias targets, category coverage, required unified sections, and documented commands; verify there are no broken local links or references that point to removed authored plan/spec content.
- [x] 5.4 Run `npm run check:rubric-consistency`, the documentation/schema checks, `npm run check:bin-wiring`, `npm run lint`, and `npm test`; verify all pass or any pre-existing failure is recorded without expanding the migration scope.
- [x] 5.5 Review the final diff and rollback boundary; verify only documentation, documentation tooling/checks, compatibility aliases, and regenerated artifacts changed, with no scanner/site/API/report/scoring behavior change and no duplicate canonical indicator source remaining.
