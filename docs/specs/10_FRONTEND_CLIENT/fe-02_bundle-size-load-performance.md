# FE-02 — Bundle Size & Load Performance — Implementation Spec

## 0. Identity

| field | value |
|---|---|
| Tier / default status | C · **unknown** (encyc said A·measured — measurement requires building/rendering = executing repo scripts, forbidden) |
| v1 flag | NO |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into FE category % |
| Verify effort | 🔶 human (Lighthouse/RUM) |
| Thresholds & 0–3 criteria | see encyclopedia §FE-02 |

## 1. Inputs

- Bundle bytes, Lighthouse/CWV field data — build/render plane. Building the client executes repo-controlled scripts → forbidden by D5.

## 2. Detection recipe

None in v1. Static hints recorded as emission context only: performance-budget configs (`budgets.json`, `size-limit` dep), bundle-analyzer configs, lazy-loading markers (`React.lazy`/dynamic imports density).

## 3. Fact schema (v1)

```json
{"fe02": {"status": "unknown",
           "reason": "bundle/load truth needs a built, rendered client",
           "static_hints": {"size_limit_configured": true}}}
```

## 4. Statusing rules

```yaml
measured_when:  never in v1
estimated_when: never                            # budget-config presence proves intent, not bytes
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
emission: "unknown — needs Lighthouse/CWV on a built client (deep scan); budget config present={bool}"
```

## 9. Scope/overlaps echo

Load performance; framework currency is FE-01's row.
