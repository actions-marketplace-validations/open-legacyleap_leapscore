# Rubric guide

The rubric defines the maintainability indicators and their scoring semantics. It is shared by the LeapScore engine and people reviewing a codebase. This directory is the source for rubric meanings and values; implementation recipes live in [`docs/specs/`](../specs/).

## Source ownership

| Material | Authority | Use |
|---|---|---|
| [`01`–`10` category encyclopedias](./) | Canonical indicator semantics | Definitions, detection intent, objective metrics, flags, scoring criteria, remediation, effort, and scope/overlap. |
| [`11_WEIGHTS_THRESHOLDS_CONFIG.md`](./11_WEIGHTS_THRESHOLDS_CONFIG.md) | Canonical scoring configuration | Weights, formulas, thresholds, gates, and calibration record. Make scoring-model changes here and update affected canonical entries as required by [`AGENTS.md`](../../AGENTS.md). |
| [`00_EXECUTIVE_RUBRIC.md`](./00_EXECUTIVE_RUBRIC.md) | Derived executive view | A compact presentation of canonical rubric values; do not independently change its values. |
| [`templates/`](./templates/) | Derived score sheets | Printable views; keep their values aligned with the canonical encyclopedia and configuration. |

The consistency check is `npm run check:rubric-consistency` from the repository root. Regenerate compiled rubric outputs with `npm run compile:rubric`; do not hand-edit generated files. See the root [`AGENTS.md`](../../AGENTS.md) for the canonical-edit and regeneration protocol.

## Browse by category

| Category | Canonical file | Indicator IDs |
|---|---|---|
| Dependency & ecosystem health | [`01_DEPENDENCY_ECOSYSTEM.md`](./01_DEPENDENCY_ECOSYSTEM.md) | ECOS |
| Architecture & code quality | [`02_ARCHITECTURE_CODE.md`](./02_ARCHITECTURE_CODE.md) | ARCH |
| Testing & quality engineering | [`03_TESTING_QUALITY.md`](./03_TESTING_QUALITY.md) | TEST |
| Security & compliance | [`04_SECURITY_COMPLIANCE.md`](./04_SECURITY_COMPLIANCE.md) | SEC |
| Data & schema evolution | [`05_DATA_SCHEMA.md`](./05_DATA_SCHEMA.md) | DATA |
| API & integration | [`06_API_INTEGRATION.md`](./06_API_INTEGRATION.md) | API |
| Developer velocity & operations | [`07_VELOCITY_OPERATIONAL.md`](./07_VELOCITY_OPERATIONAL.md) | VEL |
| Performance & cloud infrastructure | [`08_PERFORMANCE_CLOUD.md`](./08_PERFORMANCE_CLOUD.md) | PERF |
| Documentation & knowledge continuity | [`09_DOCS_KNOWLEDGE.md`](./09_DOCS_KNOWLEDGE.md) | DOCS |
| Frontend & client health | [`10_FRONTEND_CLIENT.md`](./10_FRONTEND_CLIENT.md) | FE; applicability is conditional |

The catalog contains 102 indicators across these 10 categories. The category files and configuration define the rubric; use the linked implementation specs to see which signals the current scanner can measure and how each row is emitted.
