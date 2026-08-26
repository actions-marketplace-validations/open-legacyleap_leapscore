# TEST-09 — Mutation Testing Score — Implementation Spec

## 0. Identity

| field | value |
|---|---|
| Tier / default status | B · **unknown** (encyc said estimated — mutation runs execute repo code) |
| v1 flag | NO — v2 deep scan |
| Gates fed | none |
| Rollup / deep-dive | deep-dive · `folds_into: TEST` |
| Verify effort | 🔷 human/v2 |
| Thresholds & 0–3 criteria | see encyclopedia §TEST-09 |

## 1. Inputs (v2; v1 emits unknown)

- **Planes:** execution sandbox (v2)
- **Tools:** `stryker` (JS/TS), `PIT` (Java), `mutmut`/`MutPy` (Python), time-boxed to one core module
- **Ecosystems:** JS/TS · Java · Python

## 2. Detection recipe (v2 sketch)

1. Select representative core module.
2. Run mutator with default operators, time-boxed.
3. Score = killed / total mutants (watch equivalent-mutant noise per encyclopedia).

**v1 behavior:** `unknown`. Static hints (mutation config files present: `stryker.conf.json`, `pitest` pom entries — "configured but no evidence of runs") recorded as basis-free notes.

## 3. Fact schema (v1)

```json
{"test09": {"status": "unknown",
             "reason": "mutation testing executes the suite against mutants (v2)",
             "config_present": ["stryker.conf.json"]}}
```

## 4. Statusing rules

```yaml
measured_when:  never in v1
estimated_when: never                            # a configured-but-unrun score would be exactly a scored guess
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
emission: "unknown — needs a time-boxed mutation run on a core module (v2 deep scan)"
```

## 9. Scope/overlaps echo

Mutant kill strength; ordinary coverage is TEST-01's row.
