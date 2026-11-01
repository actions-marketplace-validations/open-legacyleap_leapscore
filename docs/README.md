# LeapScore documentation

Use this page to find the right source. Documentation is split by authority: OpenSpec describes current product behavior, the rubric defines what is measured, implementation specs define how indicators are measured, and plans preserve decision history.

## Start here

| Need | Read | Authority |
|---|---|---|
| Product purpose and current capabilities | [Product overview](./PRODUCT.md) | Explanatory summary; verify behavior in OpenSpec and the implementation. |
| Current scan, report, CLI, site, and issue-surfacing behavior | [OpenSpec specifications](../openspec/specs/) | Current requirements for post-MVP behavior. |
| Indicator meanings, scoring criteria, weights, thresholds, and gates | [Rubric guide](./rubric/README.md) | The rubric encyclopedia and configuration are canonical for scoring semantics. |
| How an indicator is detected and represented | [Implementation-spec guide](./specs/README.md) | Per-indicator specs are canonical for implementation recipes and emitted facts. |
| Why earlier product and rubric decisions were made | [Decision index](./plans/00_MASTER_INDEX.md) | Historical rationale; it does not override current OpenSpec or rubric sources. |
| Example report | [Sample report guide](./sample-report/README.md) | Illustrative material, not a live scan or a promise of detector coverage. |
| Historical open-source release strategy | [Archived brief (2026-10-15)](./archive/2026-10-15-opensource-brief.md) | Dated history; superseded requirements are not current commitments. |

## Source ownership

| Subject | Canonical source | Related material |
|---|---|---|
| Current scan and report requirements | [`openspec/specs/`](../openspec/specs/) | `docs/plans/` records earlier rationale and proposals. |
| Indicator definitions and scoring semantics | [`rubric/01`–`10`](./rubric/) and [`11_WEIGHTS_THRESHOLDS_CONFIG.md`](./rubric/11_WEIGHTS_THRESHOLDS_CONFIG.md) | [`00_EXECUTIVE_RUBRIC.md`](./rubric/00_EXECUTIVE_RUBRIC.md) and score-sheet templates are derived views. |
| Detector inputs, recipes, facts, status and score predicates, gates, and failure/budget behavior | [`specs/README.md`](./specs/README.md) and its 102 indicator specs | Specs reference rubric thresholds; they do not redefine them. The documented drift protocol determines precedence until reconciliation is completed. |
| Product explanation | [`PRODUCT.md`](./PRODUCT.md) | Non-normative summary; current behavior claims must agree with OpenSpec and implementation. |
| Decision history | [`plans/`](./plans/) | Historical proposals and outcomes, not current behavior requirements. |
| Example assets | [`sample-report/`](./sample-report/) and [`sample-report.png`](./sample-report.png) | Illustrative only. |
| Release-strategy history | [`archive/2026-10-15-opensource-brief.md`](./archive/2026-10-15-opensource-brief.md) | Dated strategy; it does not define current product requirements. |

## Documentation areas

- [`rubric/`](./rubric/): canonical indicator meanings and scoring semantics, plus clearly derived presentation files.
- [`specs/`](./specs/): canonical implementation recipes for all 102 indicators and the normative spec conventions.
- [`plans/`](./plans/): product, rubric, and engine decision history; numbered plans retain their paths for known consumers.
- [`sample-report/`](./sample-report/): guide and scripts for illustrative report assets.
- [`archive/`](./archive/): dated source material retained for historical context.

Keep canonical paths stable: repository tooling consumes files under `rubric/` and `specs/`, and selected plan paths are checked by repository tooling. The executive rubric, score-sheet templates, and engineerability matrix are derived; do not change their values independently of their canonical sources. Root [`AGENTS.md`](../AGENTS.md) contains repository-wide editing constraints.
