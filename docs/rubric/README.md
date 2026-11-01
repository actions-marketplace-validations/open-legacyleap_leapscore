# Unified rubric catalog

The rubric is the reviewable contract for LeapScore's 102 maintainability indicators. Each indicator has one canonical Markdown file that combines its human-facing semantics with the implementation contract used by the scanner. The catalog is shared by people, the compiler, the scanner, and the site.

## Source ownership

| Material | Authority | Use |
|---|---|---|
| [`indicators/`](./indicators/) | **Canonical indicator catalog** | One editable file per ID: identity, definition, impact, scoring, remediation, applicability, detection, facts, status/predicates, gates, failure/budget behavior, evidence, and scope. |
| [`01`–`10` category indexes](./) | Canonical navigation | Category purpose, weights/applicability summary, and links to the unified indicator files. They contain no competing indicator bodies. |
| [`11_WEIGHTS_THRESHOLDS_CONFIG.md`](./11_WEIGHTS_THRESHOLDS_CONFIG.md) | Canonical shared configuration | Weights, formulas, thresholds, bands, applicability vocabulary, gates, and calibration record. |
| [`00_EXECUTIVE_RUBRIC.md`](./00_EXECUTIVE_RUBRIC.md) | Derived presentation | Compact view of catalog values; do not independently change indicator values. |
| [`templates/`](./templates/) | Derived score sheets | Printable views; keep values aligned with the canonical catalog/configuration. |
| [`docs/specs/`](../specs/) | Compatibility aliases | Established paths that redirect readers to `indicators/`; never edit an alias. |
| [`docs/plans/`](../plans/) | Retired path stubs | Historical paths retained only where links or checks require them; current behavior belongs to OpenSpec. |

Change indicator meaning, implementation, or remediation only in its unified file. Change shared scoring configuration only in `11_WEIGHTS_THRESHOLDS_CONFIG.md`. Regenerate derived artifacts with `npm run compile:rubric`; never hand-edit generated files.

## Browse by category

| Category | Index | IDs |
|---|---|---|
| Dependency & ecosystem health | [`01_DEPENDENCY_ECOSYSTEM.md`](./01_DEPENDENCY_ECOSYSTEM.md) | ECOS-01–10 |
| Architecture & code quality | [`02_ARCHITECTURE_CODE.md`](./02_ARCHITECTURE_CODE.md) | ARCH-01–12 |
| Testing & quality engineering | [`03_TESTING_QUALITY.md`](./03_TESTING_QUALITY.md) | TEST-01–10 |
| Security & compliance | [`04_SECURITY_COMPLIANCE.md`](./04_SECURITY_COMPLIANCE.md) | SEC-01–10 |
| Data & schema evolution | [`05_DATA_SCHEMA.md`](./05_DATA_SCHEMA.md) | DATA-01–10 |
| API & integration | [`06_API_INTEGRATION.md`](./06_API_INTEGRATION.md) | API-01–10 |
| Developer velocity & operations | [`07_VELOCITY_OPERATIONAL.md`](./07_VELOCITY_OPERATIONAL.md) | VEL-01–12 |
| Performance & cloud infrastructure | [`08_PERFORMANCE_CLOUD.md`](./08_PERFORMANCE_CLOUD.md) | PERF-01–10 |
| Documentation & knowledge continuity | [`09_DOCS_KNOWLEDGE.md`](./09_DOCS_KNOWLEDGE.md) | DOCS-01–10 |
| Frontend & client health | [`10_FRONTEND_CLIENT.md`](./10_FRONTEND_CLIENT.md) | FE-01–08; conditional applicability |

The catalog contains exactly 102 IDs. Standard and deep-dive rows use the same canonical files; a deep-dive row folds into its category when it runs.

## Unified indicator skeleton

Every canonical file uses the following ten sections, in this order. Headings and field ownership are checked by `npm run check:documentation-structure`.

1. **Identity** — ID, name, category, engine tier, default status, v1 flag, gates fed, standard/deep-dive rollup, verify effort, and the shared-threshold reference.
2. **Definition and impact** — definition, rationale, manifestations, objective metric, yellow/red flags with rationale, example symptom, and blast radius.
3. **Scoring semantics** — the explicit 0–3 criteria for the indicator; shared numeric thresholds remain in `11`.
4. **Remediation** — quick win, structural fix, gold standard, and the §1 effort tag reference.
5. **Applicability and inputs** — planes, tools/minimum versions, endpoints/rate cost, ecosystems, and `na_when` predicate.
6. **Detection recipe** — rubric detection intent plus ordered commands/API calls, preconditions, flags, and the no-target-code-execution rule.
7. **Fact schema** — indicator-namespaced JSON/YAML facts, units, provenance, and evidence pointers.
8. **Status and score mapping** — measured/estimated/unknown/N/A/not-implemented predicates, confidence/clamp behavior, and score predicates.
9. **Gate, failure, and budget behavior** — gate hooks and timeout/cap/crash/rate-limit degradation/dissolve semantics.
10. **Evidence and output** — evidence/basis template, report-facing emission behavior, and scope/overlap boundary.

### Field mapping

The migration has one destination for every field from the former sources:

| Former source field | Unified destination |
|---|---|
| Rubric heading, engine tier, default status, v1 flag, gates, rollup, verify effort | §1 Identity |
| Rubric definition, why/impact, where, objective metric, flags/rationales, symptom, blast radius | §2 Definition and impact |
| Rubric 0–3 scoring criteria | §3 Scoring semantics |
| Rubric remediation playbook and gold standard | §4 Remediation |
| Spec §0 Identity | §1 Identity |
| Spec §1 Inputs and applicability | §5 Applicability and inputs |
| Rubric detection method and Spec §2 Detection recipe | §6 Detection recipe |
| Spec §3 Fact schema | §7 Fact schema |
| Spec §4 Statusing rules and §5 Score mapping | §8 Status and score mapping |
| Spec §6 Gate hooks and §7 Failure & budget semantics | §9 Gate, failure, and budget behavior |
| Spec §8 Evidence string and §9 Scope/overlaps echo | §10 Evidence and output |

### Full and reduced forms

Tier A/B indicators use the complete ten-section skeleton. Tier C/D indicators may use the approved reduced form when the repository cannot support a richer contract: Identity, report-facing emission text, and Scope/overlaps. A reduced row emits `unknown` plus an honest “what it takes to measure” path; it must not invent a score or a fact schema. Existing full contracts remain full during this migration so no current detection or evidence semantics are lost.

## Normative cross-indicator conventions

These rules apply to every unified file and replace the former split-spec preamble:

1. **Statuses:** `measured`, `estimated`, `unknown`; plus `not_applicable` and `not_implemented` where the current report contract permits them. `estimated` clamps to `[1,2]` and carries `confidence: low|medium`.
2. **Confidence:** `medium` requires at least two independent surfaces or exhaustive-by-construction coverage; otherwise `low`; never above `medium`.
3. **N/A:** `na_when` requires a structural category/archetype+plane gate or exhaustive-surface proof. Non-exhaustive absence is `unknown`, never N/A. Zero files are score-0 when the plane exists and `not_applicable` when the plane is absent.
4. **Budget classes:** `fast`, `slow-dissolvable` (sampling may become estimated + `scope-limited`), and `api-budgeted` (rate-limit exhaustion becomes `unknown` with a rate-limit path).
5. **Tool pinning:** Pin the tool and minimum major; record the exact executed version and flags in each fact record.
6. **Fact naming:** Facts are indicator-namespaced, snake_case, and include units in field names where applicable. Predicates use only that indicator's facts.
7. **Evidence grammar:** `evidence: <tool>: <key-fact> (<path-or-endpoint>)`; estimated rows use `basis:`. Exactly one is emitted per row.
8. **No execution:** Detectors do not run target-repository code. Execution-shaped recipes degrade to a static proxy or `unknown`.
9. **v1 flags:** Tier A is `YES`; B with an approved static proxy is `PART`; otherwise `NO`, subject to the indicator's identity contract.

## Canonical path, index, and alias map

| Existing or current path | Role after migration | Replacement/target |
|---|---|---|
| `docs/rubric/indicators/<NN_CATEGORY>/<ID>_<slug>.md` | Canonical editable indicator | The unified ten-section contract |
| `docs/rubric/<NN_CATEGORY>.md` | Canonical category index | Links to every unified file in that category |
| `docs/rubric/11_WEIGHTS_THRESHOLDS_CONFIG.md` | Canonical shared configuration | Weights, thresholds, bands, gates, applicability |
| `docs/rubric/00_EXECUTIVE_RUBRIC.md`, `templates/` | Derived views | Regenerate/align from canonical sources |
| `docs/specs/<NN_CATEGORY>/<id>_<slug>.md` | Compatibility alias | Links to the matching unified file; no contract content |
| `docs/specs/README.md` | Compatibility guide | Explains the alias policy and links here |
| `docs/plans/<file>.md` | Retired path stub | Links to OpenSpec, this catalog, or the relevant current README |
| `openspec/specs/` | Current product behavior | Unchanged; authoritative for scan/report behavior |

The only editable indicator source is `docs/rubric/indicators/`. A category index, alias, plan stub, generated registry, or OpenSpec reference must not become a second source.

## Validation

Run the source and structure gates from the repository root:

```bash
npm run compile:rubric
npm run check:rubric-consistency
npm run check:documentation-structure
npm run check:schemas
```

The compiler enumerates canonical files in category/numeric order and keeps the existing generated JSON/TypeScript shape. The structure check proves 102 unique IDs, index coverage, required sections, alias-only legacy specs, retired plan stubs, and local targets.
