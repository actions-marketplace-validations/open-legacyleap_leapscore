# LeapScore documentation

Use this page to find the right source. Documentation is split by authority: OpenSpec describes current product behavior, and the unified rubric catalog defines what each indicator measures and how it is implemented. Legacy spec and plan paths are compatibility aliases/stubs only.

## Start here

| Need | Read | Authority |
|---|---|---|
| Product purpose and current capabilities | [Product overview](./PRODUCT.md) | Explanatory summary; verify behavior in OpenSpec and the implementation. |
| Current scan, report, CLI, site, and issue-surfacing behavior | [OpenSpec specifications](../openspec/specs/) | Current requirements for post-MVP behavior. |
| Indicator meanings, scoring criteria, weights, thresholds, gates, and implementation contracts | [Unified rubric catalog](./rubric/README.md) | One canonical file per indicator under [`indicators/`](./rubric/indicators/) plus shared configuration in [`11_WEIGHTS_THRESHOLDS_CONFIG.md`](./rubric/11_WEIGHTS_THRESHOLDS_CONFIG.md). |
| Legacy indicator-spec paths | [Compatibility guide](./specs/README.md) | Aliases only; they redirect to the canonical indicator files and hold no contract. |
| Historical product and rubric decisions | [Retired plan paths](./plans/README.md) | Retirement notice plus path stubs; git history is the historical record. |
| Example report | [Sample report guide](./sample-report/README.md) | Illustrative material, not a live scan or a promise of detector coverage. |
| Historical open-source release strategy | [Archived brief (2026-10-15)](./archive/2026-10-15-opensource-brief.md) | Dated history; superseded requirements are not current commitments. |

## Source ownership

| Subject | Canonical source | Related material |
|---|---|---|
| Current scan and report requirements | [`openspec/specs/`](../openspec/specs/) | [`docs/plans/`](./plans/) holds retired path stubs only. |
| Indicator definitions, scoring semantics, and implementation contracts | [`rubric/indicators/`](./rubric/indicators/) and [`11_WEIGHTS_THRESHOLDS_CONFIG.md`](./rubric/11_WEIGHTS_THRESHOLDS_CONFIG.md) | [`00_EXECUTIVE_RUBRIC.md`](./rubric/00_EXECUTIVE_RUBRIC.md) and score-sheet templates are derived views; category pages `01`–`10` are indexes. |
| Detector inputs, recipes, facts, status and score predicates, gates, and failure/budget behavior | The matching unified indicator file (§5–§9) | `packages/detectors/*/schema.json` carries the fact envelope; aliases under [`specs/`](./specs/) redirect only. |
| Product explanation | [`PRODUCT.md`](./PRODUCT.md) | Non-normative summary; current behavior claims must agree with OpenSpec and implementation. |
| Decision history | Git history and [`openspec/changes/archive/`](../openspec/changes/archive/) | [`plans/`](./plans/) stubs preserve paths, not prose. |
| Example assets | [`sample-report/`](./sample-report/) and [`sample-report.png`](./sample-report.png) | Illustrative only. |
| Release-strategy history | [`archive/2026-10-15-opensource-brief.md`](./archive/2026-10-15-opensource-brief.md) | Dated strategy; it does not define current product requirements. |

## Documentation areas

- [`rubric/`](./rubric/): canonical indicator catalog — unified semantics + implementation files under `indicators/`, category indexes, shared configuration, and clearly derived presentation files.
- [`specs/`](./specs/): compatibility aliases for the retired per-indicator implementation-spec paths; never edit them.
- [`plans/`](./plans/): retirement notice and path-level stubs for historical links; not a maintained source.
- [`sample-report/`](./sample-report/): guide and scripts for illustrative report assets.
- [`archive/`](./archive/): dated source material retained for historical context.

Keep canonical paths stable: repository tooling consumes `docs/rubric/indicators/`, and selected plan paths are checked by repository tooling. The executive rubric and score-sheet templates are derived; do not change their values independently of their canonical sources. Root [`AGENTS.md`](../AGENTS.md) contains repository-wide editing constraints.
