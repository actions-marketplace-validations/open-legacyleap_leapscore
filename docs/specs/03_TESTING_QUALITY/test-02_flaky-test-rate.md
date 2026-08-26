# TEST-02 — Flaky Test Rate — Implementation Spec

## 0. Identity

| field | value |
|---|---|
| Tier / default status | B · **unknown** (encyc said measured — requires rerunning suites, forbidden) |
| v1 flag | NO — v2 deep scan |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into TEST category % |
| Verify effort | 🔶 human/v2 |
| Thresholds & 0–3 criteria | see encyclopedia §TEST-02 |

## 1. Inputs (v2 deep scan; v1 emits unknown)

- **Planes:** execution sandbox (v2 only)
- **Tools:** suite runner ×N with `--retry` disabled + randomized order (`pytest-randomly`, jest `--sequence.shuffle`)
- **Ecosystems:** all
- **Applicability:** n/a until v2.

## 2. Detection recipe (v2 sketch)

1. Execute test suite K times in fresh containers.
2. Flakes = tests with mixed pass/fail across identical SHAs.
3. Rate = flakes / tests.

**v1 behavior:** no detection runs. Row ships `unknown`.

## 3. Fact schema (v1)

```json
{"test02": {"status": "unknown", "reason": "requires test execution (v2 deep scan)"}}
```

## 4. Statusing rules

```yaml
measured_when:  never in v1
estimated_when: never                            # flake guesses are exactly what the taxonomy forbids
unknown_when:   always in v1                     # emission text: rerun protocol above
clamp:          n/a
confidence:     n/a
```

## 5. Score mapping

None in v1 (unscored row).

## 6. Gate hooks

none.

## 7. Failure & budget semantics

n/a in v1. Emission text drawn from encyclopedia *where it manifests* + *detection method* cells per `docs/plans/03` emission rule.

## 8. Evidence string

```
emission: "unknown — flakiness provable only by rerunning the suite; see 'what it takes' appendix"
```

## 9. Scope/overlaps echo

Flake rate of the suite; order-dependence causes land in TEST-07 when v2 executes both.
