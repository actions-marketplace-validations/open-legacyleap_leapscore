# LeapScore documentation

Use this page to find the right source. Documentation is split by authority: OpenSpec describes current product behavior, and the unified rubric catalog defines what each indicator measures and how it is implemented.

## Start here

| Need | Read | Authority |
|---|---|---|
| Product purpose and current capabilities | [Product overview](./PRODUCT.md) | Explanatory summary; verify behavior in OpenSpec and the implementation. |
| Current scan, report, CLI, site, and issue-surfacing behavior | [OpenSpec specifications](../openspec/specs/) | Current requirements for post-MVP behavior. |
| Indicator meanings, scoring criteria, weights, thresholds, gates, and implementation contracts | [The rubric](./rubric/README.md) | One canonical file per indicator under [`indicators/`](./rubric/indicators/), the composing rules in [`model/`](./rubric/model/), and the generated sheets in [`sheets/`](./rubric/sheets/). |
| Example report | [Sample report guide](./sample-report/README.md) | Illustrative material, not a live scan or a promise of detector coverage. |

## Source ownership

| Subject | Canonical source | Related material |
|---|---|---|
| Current scan and report requirements | [`openspec/specs/`](../openspec/specs/) | [`openspec/changes/archive/`](../openspec/changes/archive/) records how they got there. |
| Indicator definitions, scoring semantics, and implementation contracts | [`rubric/indicators/`](./rubric/indicators/) and [`rubric/model/config.md`](./rubric/model/config.md) | The sheets in [`rubric/sheets/`](./rubric/sheets/) are generated views; [`rubric/model/scale.md`](./rubric/model/scale.md) is the authored scale; each category charter (`indicators/<NN-slug>/README.md`) is its index. |
| Detector inputs, recipes, facts, status and score predicates, gates, and failure/budget behavior | The matching unified indicator file (§5–§9) | `packages/detectors/*/schema.json` carries the fact envelope. |
| Product explanation | [`PRODUCT.md`](./PRODUCT.md) | Non-normative summary; current behavior claims must agree with OpenSpec and implementation. |
| Decision history | Git history and [`openspec/changes/archive/`](../openspec/changes/archive/) | Superseded material is reachable through history, not retained as paths. |
| Example assets | [`sample-report/`](./sample-report/) and [`sample-report.png`](./sample-report.png) | Illustrative only. |

## Documentation areas

- [`rubric/`](./rubric/): the rubric in three layers — the measured set under `indicators/`, the composing rules under `model/`, and the generated instrument under `sheets/`.
- [`sample-report/`](./sample-report/): guide and scripts for illustrative report assets.
- [`diagrams/`](./diagrams/README.md): nine architecture diagrams as matched `.html`/`.json` pairs — illustrative only; revision-pinned snapshots, not a requirements source.
- [`roadmap/`](./roadmap/): planning material — status, baseline, and ordered backlog; not a requirements source.
  - [`structural-legacy-coverage.md`](./roadmap/structural-legacy-coverage.md): structural signal coverage across the legacy stacks.
  - [`distribution-packaging.md`](./roadmap/distribution-packaging.md): the packaging test (single artifact, container image, npm/`npx`) and its gap list.
- [`PRODUCT.md`](./PRODUCT.md): explanatory product overview; not a requirements source.

Repository tooling consumes `docs/rubric/indicators/` and `docs/rubric/model/config.md`. The `model/scale.md` guide is authored; the `sheets/` documents are generated and must not be edited by hand. Root [`AGENTS.md`](../AGENTS.md) contains repository-wide editing constraints.
