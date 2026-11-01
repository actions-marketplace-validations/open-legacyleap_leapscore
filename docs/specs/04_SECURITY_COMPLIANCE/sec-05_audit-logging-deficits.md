# SEC-05 — Audit Logging Deficits — Implementation Spec

> **Authority:** This file defines the SEC-05 implementation contract. The [SEC rubric category](../../rubric/04_SECURITY_COMPLIANCE.md) owns its definition, thresholds, and scoring criteria; [`docs/specs/README.md`](../README.md) defines the normative cross-cutting conventions.

## 0. Identity

| field | value |
|---|---|
| Tier / default status | C · **unknown** (encyc B·unknown, matrix C·unknown — content adequacy unjudgeable statically) |
| v1 flag | NO |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into SEC category % |
| Verify effort | 🔶 human |
| Thresholds & 0–3 criteria | see encyclopedia §SEC-05 |

## 1. Inputs

- Runtime log sinks/retention/content — org/runtime plane. Not derivable from URL.

## 2. Detection recipe (v2/deep-scan sketch)

1. Enumerate audit-event emission sites in auth/admin/PII modules.
2. Verify sink survives redeploy (external sink config) and retention settings.
3. Schema check: structured events with actor/action/target.

**v1 behavior:** `unknown` + emission text. Logging *library* presence is PERF-01's instrumentation fact — not duplicated here as a score.

## 3. Fact schema (v1)

```json
{"sec05": {"status": "unknown",
            "reason": "audit-trail content/retention needs runtime + sink audit"}}
```

## 4. Statusing rules

```yaml
measured_when:  never in v1
estimated_when: never                            # presence-of-logging-library proves nothing about audit coverage
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
emission: "unknown — requires auditing auth/admin/PII event emission against external sinks (deep scan)"
```

## 9. Scope/overlaps echo

Audit-trail deficits; observability instrumentation generally is PERF-01.
