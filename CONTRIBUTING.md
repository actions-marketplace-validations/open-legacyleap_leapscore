# Contributing to LeapScore

Issues and pull requests are welcome for improving LeapScore's local-first structural risk scanner, its evidence, rubric, and documentation. For scan and report behavior, `openspec/specs/` is the current specification.

## Before opening an issue

Include the affected command or scan mode, expected and observed behavior, environment details (OS and Node.js version), and the smallest reproducible steps. For a scoring or detection issue, include a sanitized report excerpt or a synthetic/minimal fixture and the relevant indicator IDs. Do not attach customer source, private-repository contents, credentials, or unredacted paths.

## Pull requests

- Keep changes focused and explain the problem and intended result in the PR description.
- Add or update tests for changed scanner behavior; use synthetic fixtures where practical.
- Include the exact checks you ran and their results. Call out any relevant check you could not run.
- Do not include secrets, private source, or customer reports in commits, logs, or screenshots.
- Update the applicable OpenSpec requirements when changing specified scan or report behavior.

## Rubric and generated files

The rubric is single-sourced. Each indicator has one canonical file under `docs/rubric/indicators/<NN_CATEGORY>/` that combines its semantics (definition, impact, scoring criteria, remediation) with its implementation contract (applicability, detection, facts, status/score predicates, gates, budget, evidence). Edit that file; edit shared weights, formulas, bands, and the gate roster in `docs/rubric/11_WEIGHTS_THRESHOLDS_CONFIG.md`. `docs/rubric/00_EXECUTIVE_RUBRIC.md` is authored, but only for material that cannot be derived (the 0–3 scale, core-path taxonomy, rollup mechanics, audit planning).

Do not hand-edit generated artifacts: `docs/rubric/00_SCORE_SHEET.md`, `docs/rubric/templates/SERVICE_SCORE_SHEET.md`, `docs/rubric/templates/SYSTEM_SCORE_SHEET.md`, `apps/scanner/src/scan/scoring/rubric.json`, `apps/site/lib/generated/rubric.ts`. The category index tables (`01`–`10`) are hand-aligned derived views — match them to the catalog.

Regenerate rubric outputs with `npm run compile:rubric` and verify them with `npm run check:rubric-consistency`, which compares all five generated artifacts byte-for-byte with a fresh compile and fails if the authored guide restates a generated weight, band, gate, formula, or per-indicator row. The committed Action bundle is also generated: rebuild it through the documented build path and run `npm run check:dist`; do not patch `action/dist/` by hand.

## Checks

From the repository root, install dependencies with `npm install`. Run the checks relevant to your change:

| Change area | Checks |
|---|---|
| Scanner or report behavior | `npm test`, `npm run lint`, `npm run build` |
| Rubric semantics or generated rubric | `npm run compile:rubric`, `npm run check:rubric-consistency`, `npm run check:schemas`, `npm run check:documentation-structure`, `npm test` |
| Detector, site, or surface boundaries | `npm run check:detector-isolation`, `npm run check:site-boundary`, `npm run check:surface-boundary` |
| CLI wiring or shipped Action bundle | `npm run check:bin-wiring`, `npm run check:dist` |
| Documentation or package metadata | `npm run check:documentation-structure`, `npm run check:schemas`; validate commands affected by the change and run `npm test` |

## Product boundaries

LeapScore measures structural risk. The following are explicitly outside its scope and should not be added to the open-source tool; they belong in a separate assessment or product:

- MCM-backed cross-repository comprehension.
- Business-rule extraction.
- Functional analysis, including determining what code does or whether it behaves correctly.
- Modernization recommendations, modernization plans, or target architectures.
- Hosted SaaS scanning or report hosting.
- Uploading or storing customer code or scan reports on LeapScore infrastructure.
- Default-on telemetry. The assessment URL is user-clicked; scans do not automatically contact it.

These exclusions are scope boundaries, not a statement about whether a proposal is technically possible. No issue-response or review-time SLA is promised.
