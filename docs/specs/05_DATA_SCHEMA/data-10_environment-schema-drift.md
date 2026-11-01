# DATA-10 — Environment Schema Drift — Implementation Spec

> **Authority:** This file defines the DATA-10 implementation contract. The [DATA rubric category](../../rubric/05_DATA_SCHEMA.md) owns its definition, thresholds, and scoring criteria; [`docs/specs/README.md`](../README.md) defines the normative cross-cutting conventions.

## 0. Identity

| field | value |
|---|---|
| Tier / default status | C · **unknown** (encyc said A·measured — cross-env diff impossible from one repo) |
| v1 flag | NO |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into DATA category % |
| Verify effort | 🔶 human (env diff runs) |
| Thresholds & 0–3 criteria | see encyclopedia §DATA-10 |

## 1. Inputs

> **Archetype applicability (new):** `na_when` also fires on archetype+plane: DATA rows N/A if `!has_data && archetype in {library, docs, agent-skills, infra}`; PERF rows N/A if `!has_deploy`; API rows N/A if `!has_server`; irrelevant tiers (e.g. docs→API) fire without plane check. Required rows (SEC-01/02, ECOS-05/01) never N/A. Exhaustive plane inventory required.

- Cross-environment schema states (dev/staging/prod catalogs) — live plane. One repo cannot contain them.

## 2. Detection recipe (v2/M&A sketch)

1. Schema-diff tool (`liquibase diff`, `migra`, `pg-diff`) between env connections supplied by owner.
2. Compare against migration baseline head.
3. Fixture-strategy audit (migration-generated vs hand-maintained fixtures) is the one in-repo hint — emission context only.

**v1 behavior:** `unknown` + emission text.

## 3. Fact schema (v1)

```json
{"data10": {"status": "unknown",
             "reason": "requires schema diffs across live environments",
             "fixture_hint": {"hand_maintained_fixtures": true}}}
```

## 4. Statusing rules

```yaml
measured_when:  never from URL
estimated_when: never                            # fixture hints prove nothing about prod drift
unknown_when:   always in v1
clamp:          n/a
confidence:     n/a
```

## 5. Score mapping

None in v1.

## 6. Gate hooks

none.

## 7. Failure & budget semantics

n/a v1.

## 8. Evidence string

```
emission: "unknown — needs dev→staging→prod schema diffs against migration head (M&A access)"
```

## 9. Scope/overlaps echo

Cross-env drift; the migration chain that should prevent it is DATA-01.
