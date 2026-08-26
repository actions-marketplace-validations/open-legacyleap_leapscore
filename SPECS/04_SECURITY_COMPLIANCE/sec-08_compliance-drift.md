# SEC-08 — Compliance Drift — Implementation Spec

## 0. Identity

| field | value |
|---|---|
| Tier / default status | D · **unknown** |
| v1 flag | NO |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into SEC category % |
| Verify effort | 🔷 human (control-mapping audit) |
| Thresholds & 0–3 criteria | see encyclopedia §SEC-08 |

## 1. Inputs

- Control-mapping, retention/encryption evidence, access reviews — org/process plane. No URL signal exists.

## 2. Detection recipe

None in v1. Static hints (SOC2 badge in README, `compliance/` dir) are explicitly **not** scored — presence marketing ≠ control evidence; recorded as emission-text context only.

## 3. Fact schema (v1)

```json
{"sec08": {"status": "unknown", "reason": "control mapping requires human audit against a framework scope"}}
```

## 4. Statusing rules

```yaml
measured_when:  never
estimated_when: never                            # compliance guesses are reputation-fatal
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
emission: "unknown — needs a scoped control-mapping audit (SOC2/GDPR/HIPAA); see deep-dive checklist"
```

## 9. Scope/overlaps echo

Control-framework drift; technical controls that feed it (backups, logging) live in DATA-06/SEC-05.
