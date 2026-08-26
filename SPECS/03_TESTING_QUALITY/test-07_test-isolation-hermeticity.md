# TEST-07 — Test Isolation & Hermeticity — Implementation Spec

## 0. Identity

| field | value |
|---|---|
| Tier / default status | B · **unknown** (encyc said estimated — provable only by executing the suite) |
| v1 flag | NO — v2 deep scan |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into TEST category % |
| Verify effort | 🔶 human/v2 |
| Thresholds & 0–3 criteria | see encyclopedia §TEST-07 |

## 1. Inputs (v2; v1 emits unknown)

- **Planes:** execution sandbox (v2)
- **Tools:** randomized-order + parallel runs, fresh containers per run
- **Ecosystems:** all

## 2. Detection recipe (v2 sketch)

1. Run suite shuffled ×K; count new failures vs baseline order.
2. Run parallel with worker scaling; count interference failures.
3. Static greps (`sleep(`, shared connection strings, `beforeAll` mutation) are recorded as *hints* in emission text only — never scored.

**v1 behavior:** row ships `unknown`; hints appended to the "what it takes" appendix.

## 3. Fact schema (v1)

```json
{"test07": {"status": "unknown", "reason": "isolation provable only by executing suite",
             "static_hints": {"sleep_calls_in_tests": 14, "shared_db_url_in_tests": true}}}
```

## 4. Statusing rules

```yaml
measured_when:  never in v1
estimated_when: never                            # grep hits cannot establish hermeticity either way
unknown_when:   always in v1
clamp:          n/a
confidence:     n/a
```

## 5. Score mapping

None in v1.

## 6. Gate hooks

none.

## 7. Failure & budget semantics

n/a v1. `static_hints` survive fact-store for v2 diffing but do not affect status/score.

## 8. Evidence string

```
emission: "unknown — requires randomized/parallel suite execution (v2); static hints: {hint_summary}"
```

## 9. Scope/overlaps echo

Suite reaction to shared state; the state itself is ARCH-07's row.
