# DOCS-05 — Tribal Knowledge & Oral Tradition — Implementation Spec

> **Authority:** This file defines the DOCS-05 implementation contract. The [DOCS rubric category](../../rubric/09_DOCS_KNOWLEDGE.md) owns its definition, thresholds, and scoring criteria; [`docs/specs/README.md`](../README.md) defines the normative cross-cutting conventions.

## 0. Identity

| field | value |
|---|---|
| Tier / default status | D · **unknown** |
| v1 flag | NO |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into DOCS category % |
| Verify effort | 🔷 human (departure-drill interviews) |
| Thresholds & 0–3 criteria | see encyclopedia §DOCS-05 |

## 1. Inputs

- "If the expert left Friday" outcomes, doc-vs-people answer ratios — interview plane.

## 2. Detection recipe

None in v1. Proxies (bus factor VEL-06, ADR presence DOCS-01) live on their own rows; this row does not re-score them.

## 3. Fact schema (v1)

```json
{"docs05": {"status": "unknown", "reason": "requires the departure-drill interview protocol"}}
```

## 4. Statusing rules

```yaml
measured_when:  never
estimated_when: never
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
emission: "unknown — needs departure-drill interviews (see encyclopedia protocol); related facts: VEL-06 bus factor"
```

## 9. Scope/overlaps echo

Oral-tradition dependence; measurable proxies are VEL-06 (authorship) and DOCS-01 (decisions written down).
