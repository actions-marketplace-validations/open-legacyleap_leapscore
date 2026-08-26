# DOCS-10 — Knowledge Exit & Documentation Ownership — Implementation Spec *(deep-dive — folds into DOCS when run)*

## 0. Identity

| field | value |
|---|---|
| Tier / default status | D · **unknown** |
| v1 flag | NO |
| Gates fed | none |
| Rollup / deep-dive | deep-dive · `folds_into: DOCS` |
| Verify effort | 🔷 human (org process audit) |
| Thresholds & 0–3 criteria | see encyclopedia §DOCS-10 |

## 1. Inputs

- Offboarding checklists, doc ownership assignments, post-departure incident attribution — org plane.

## 2. Detection recipe

None in v1. In-repo hints (`CODEOWNERS` coverage of docs paths, ownership headers in docs) are emission context; ownership *concentration* facts live in VEL-06.

## 3. Fact schema (v1)

```json
{"docs10": {"status": "unknown", "reason": "requires offboarding-process and ownership audit"}}
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
emission: "unknown — needs ownership/offboarding process audit; related facts: VEL-06, CODEOWNERS coverage"
```

## 9. Scope/overlaps echo

Knowledge-exit process; measurable proxies are VEL-06 (concentration) and DOCS-01 (written decisions).
